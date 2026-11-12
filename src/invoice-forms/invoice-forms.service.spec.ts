import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { InvoiceForm } from './entities/invoice-form.entity.js';
import {
  InvoiceFormsService,
  type UploadedForm,
} from './invoice-forms.service.js';

type Status = InvoiceForm['status'];

// A tiny in-memory table: update() only applies when id, organizationId and status match.
function makeManager(rows: Partial<InvoiceForm>[]) {
  const orgUpdate = {
    update: vi.fn(() => orgUpdate),
    set: vi.fn(() => orgUpdate),
    where: vi.fn(() => orgUpdate),
    andWhere: vi.fn(() => orgUpdate),
    setParameter: vi.fn(() => orgUpdate),
    execute: vi.fn().mockResolvedValue({ affected: 1 }),
  };
  const manager = {
    orgUpdate,
    update: vi.fn(
      (
        _entity: unknown,
        where: { id: string; organizationId: string; status: { value: Status[] } },
        changes: Partial<InvoiceForm>,
      ) => {
        const row = rows.find(
          (r) =>
            r.id === where.id &&
            r.organizationId === where.organizationId &&
            where.status.value.includes(r.status as Status),
        );
        if (row) Object.assign(row, changes);
        return Promise.resolve({ affected: row ? 1 : 0 });
      },
    ),
    findOne: vi.fn(
      (_entity: unknown, opts: { where: { id: string; organizationId: string } }) =>
        Promise.resolve(
          rows.find(
            (r) =>
              r.id === opts.where.id &&
              r.organizationId === opts.where.organizationId,
          ) ?? null,
        ),
    ),
    createQueryBuilder: vi.fn(() => orgUpdate),
    transaction: vi.fn((work: (m: unknown) => unknown) => work(manager)),
  };
  return manager;
}

function makeRepo(rows: Partial<InvoiceForm>[] = []) {
  return {
    manager: makeManager(rows),
    find: vi.fn().mockResolvedValue([]),
    findOne: vi.fn(),
    create: vi.fn((value: Partial<InvoiceForm>) => value),
    save: vi.fn((value: Partial<InvoiceForm>) =>
      Promise.resolve({ ...value, id: 'form-1', createdAt: new Date() }),
    ),
    delete: vi.fn(),
  };
}

const pdf = (name = 'form.pdf'): UploadedForm => ({
  originalname: name,
  mimetype: 'application/pdf',
  size: 3,
  buffer: Buffer.from('pdf'),
});

describe('InvoiceFormsService', () => {
  let repo: ReturnType<typeof makeRepo>;
  let service: InvoiceFormsService;

  beforeEach(() => {
    repo = makeRepo();
    service = new InvoiceFormsService(
      repo as unknown as Repository<InvoiceForm>,
    );
  });

  it('lists only the given organization, newest first', async () => {
    await service.findAll('org-1');
    expect(repo.find).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
      order: { createdAt: 'DESC' },
    });
  });

  it('saves an upload and never returns the file bytes', async () => {
    const saved = await service.create('org-1', pdf());
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        fileName: 'form.pdf',
        size: 3,
      }),
    );
    expect(saved).not.toHaveProperty('data');
    expect(saved.id).toBe('form-1');
  });

  it('keeps a Georgian file name readable', async () => {
    const latin1 = Buffer.from('ფორმა.pdf', 'utf8').toString('latin1');
    const saved = await service.create('org-1', pdf(latin1));
    expect(saved.fileName).toBe('ფორმა.pdf');
  });

  it('rejects a missing file', async () => {
    await expect(service.create('org-1', undefined)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects a file type that is not allowed', async () => {
    const exe = { ...pdf('x.exe'), mimetype: 'application/x-msdownload' };
    await expect(service.create('org-1', exe)).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("does not serve another organization's file", async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findFile('org-2', 'form-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(repo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'form-1', organizationId: 'org-2' },
      }),
    );
  });

  it('reports a missing form on delete', async () => {
    repo.delete.mockResolvedValue({ affected: 0 });
    await expect(service.remove('nope')).rejects.toThrow(NotFoundException);
  });

  describe('review workflow', () => {
    const ALL: Status[] = [
      'submitted',
      'in_progress',
      'review',
      'approved',
      'changes_requested',
      'live',
    ];
    let row: Partial<InvoiceForm>;

    const setup = (status: Status) => {
      row = {
        id: 'form-1',
        organizationId: 'org-1',
        status,
        templateKey: status === 'approved' ? 'tatishvili' : null,
        reviewComment: 'old',
        reviewedAt: null,
        publishedAt: null,
      };
      repo = makeRepo([row]);
      service = new InvoiceFormsService(
        repo as unknown as Repository<InvoiceForm>,
      );
    };

    const actions: {
      name: string;
      from: Status[];
      to: Status;
      run: (s: InvoiceFormsService, org?: string) => Promise<InvoiceForm>;
    }[] = [
      { name: 'approve', from: ['review'], to: 'approved', run: (s, o = 'org-1') => s.approve(o, 'form-1') },
      {
        name: 'requestChanges',
        from: ['review'],
        to: 'changes_requested',
        run: (s, o = 'org-1') => s.requestChanges(o, 'form-1', 'fix the logo'),
      },
      { name: 'start', from: ['submitted', 'changes_requested'], to: 'in_progress', run: (s, o = 'org-1') => s.start(o, 'form-1') },
      {
        name: 'sendForReview',
        from: ['in_progress'],
        to: 'review',
        run: (s, o = 'org-1') => s.sendForReview(o, 'form-1', 'tatishvili'),
      },
      { name: 'publish', from: ['approved'], to: 'live', run: (s, o = 'org-1') => s.publish(o, 'form-1') },
    ];

    for (const action of actions) {
      for (const status of ALL) {
        const allowed = action.from.includes(status);
        it(`${action.name}: ${status} -> ${allowed ? action.to : '409'}`, async () => {
          setup(status);
          if (allowed) {
            const form = await action.run(service);
            expect(form.status).toBe(action.to);
          } else {
            await expect(action.run(service)).rejects.toThrow(ConflictException);
            expect(row.status).toBe(status);
          }
        });
      }

      it(`${action.name}: another organization gets 404 and nothing changes`, async () => {
        const status = action.from[0];
        setup(status);
        await expect(action.run(service, 'org-2')).rejects.toThrow(NotFoundException);
        expect(row.status).toBe(status);
        expect(repo.manager.orgUpdate.execute).not.toHaveBeenCalled();
      });
    }

    it('approve sets reviewedAt and clears the comment', async () => {
      setup('review');
      const form = await service.approve('org-1', 'form-1');
      expect(form.reviewedAt).toBeInstanceOf(Date);
      expect(form.reviewComment).toBeNull();
    });

    it('requestChanges stores the comment and reviewedAt', async () => {
      setup('review');
      const form = await service.requestChanges('org-1', 'form-1', 'fix the logo');
      expect(form.reviewComment).toBe('fix the logo');
      expect(form.reviewedAt).toBeInstanceOf(Date);
    });

    it('sendForReview stores the template key', async () => {
      setup('in_progress');
      const form = await service.sendForReview('org-1', 'form-1', 'tatishvili');
      expect(form.templateKey).toBe('tatishvili');
    });

    it('publish sets publishedAt and adds the key to the organization once', async () => {
      setup('approved');
      const form = await service.publish('org-1', 'form-1');
      expect(form.publishedAt).toBeInstanceOf(Date);
      const q = repo.manager.orgUpdate;
      expect(repo.manager.transaction).toHaveBeenCalled();
      expect(q.where).toHaveBeenCalledWith('id = :organizationId', { organizationId: 'org-1' });
      expect(q.andWhere).toHaveBeenCalledWith('NOT (:templateKey = ANY("invoice_templates"))');
      expect(q.setParameter).toHaveBeenCalledWith('templateKey', 'tatishvili');
      expect(q.execute).toHaveBeenCalledTimes(1);
    });

    it('publish does not touch the organization when the status is wrong', async () => {
      setup('review');
      await expect(service.publish('org-1', 'form-1')).rejects.toThrow(ConflictException);
      expect(repo.manager.orgUpdate.execute).not.toHaveBeenCalled();
    });
  });
});
