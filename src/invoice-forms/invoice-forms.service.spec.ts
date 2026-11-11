import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { InvoiceForm } from './entities/invoice-form.entity.js';
import {
  InvoiceFormsService,
  type UploadedForm,
} from './invoice-forms.service.js';

function makeRepo() {
  return {
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
});
