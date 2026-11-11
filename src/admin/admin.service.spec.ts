import { ConflictException, NotFoundException } from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';
import type { Company } from '../companies/entities/company.entity.js';
import type { InvoiceRecord } from '../invoices/entities/invoice-record.entity.js';
import type { InvoiceFormsService } from '../invoice-forms/invoice-forms.service.js';
import type { Organization } from '../organizations/entities/organization.entity.js';
import { AdminService } from './admin.service.js';

function countQuery(rows: { organizationId: string; count: string }[]) {
  const query = {
    select: vi.fn(() => query),
    addSelect: vi.fn(() => query),
    groupBy: vi.fn(() => query),
    getRawMany: vi.fn().mockResolvedValue(rows),
  };
  return query;
}

describe('AdminService', () => {
  const org = {
    id: 'org-1',
    identificationCode: '123456789',
    email: 'a@b.ge',
    createdAt: new Date(),
  };
  let organizations: Record<string, ReturnType<typeof vi.fn>>;
  let companies: Record<string, ReturnType<typeof vi.fn>>;
  let forms: { countByOrganization: ReturnType<typeof vi.fn>; countAll: ReturnType<typeof vi.fn> };
  let invoices: { count: ReturnType<typeof vi.fn> };
  let dataSource: { query: ReturnType<typeof vi.fn> };
  let service: AdminService;

  beforeEach(() => {
    organizations = {
      find: vi.fn().mockResolvedValue([org]),
      findOneBy: vi.fn().mockResolvedValue(org),
      exists: vi.fn().mockResolvedValue(false),
      create: vi.fn((value: unknown) => value),
      save: vi.fn().mockResolvedValue(org),
    };
    companies = {
      find: vi.fn().mockResolvedValue([]),
      createQueryBuilder: vi.fn(() =>
        countQuery([{ organizationId: 'org-1', count: '3' }]),
      ),
    };
    forms = { countByOrganization: vi.fn().mockResolvedValue([]), countAll: vi.fn().mockResolvedValue(4) };
    invoices = { count: vi.fn().mockResolvedValue(9) };
    dataSource = { query: vi.fn().mockResolvedValue([{ '?column?': 1 }]) };
    service = new AdminService(
      organizations as unknown as Repository<Organization>,
      companies as unknown as Repository<Company>,
      invoices as unknown as Repository<InvoiceRecord>,
      forms as unknown as InvoiceFormsService,
      dataSource as unknown as DataSource,
    );
  });

  it('lists organizations with company and form counts, without admins', async () => {
    const list = await service.listOrganizations();
    expect(organizations.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: 'organization' } }),
    );
    expect(list).toEqual([
      expect.objectContaining({ id: 'org-1', companyCount: 3, formCount: 0 }),
    ]);
  });

  it('creates an organization with a hashed password', async () => {
    await service.createOrganization({
      identificationCode: '123456789',
      email: 'a@b.ge',
      password: 'secret123',
    });
    const created = organizations.create.mock.calls[0][0] as {
      passwordHash: string;
    };
    expect(created.passwordHash).toMatch(/^scrypt\$/);
    expect(created.passwordHash).not.toContain('secret123');
  });

  it('refuses a duplicate code or email', async () => {
    organizations.exists.mockResolvedValue(true);
    await expect(
      service.createOrganization({
        identificationCode: '123456789',
        email: 'a@b.ge',
        password: 'secret123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('does not open an admin account as an organization', async () => {
    organizations.findOneBy.mockResolvedValue(null);
    await expect(service.listCompanies('admin-id')).rejects.toThrow(
      NotFoundException,
    );
    expect(organizations.findOneBy).toHaveBeenCalledWith({
      id: 'admin-id',
      role: 'organization',
    });
  });

  it('counts organizations, companies, invoices and forms', async () => {
    organizations.count = vi.fn().mockResolvedValue(2);
    companies.count = vi.fn().mockResolvedValue(16);
    const stats = await service.getStats();
    expect(stats).toMatchObject({ organizations: 2, companies: 16, invoices: 9, forms: 4 });
    expect(organizations.count).toHaveBeenCalledWith({ where: { role: 'organization' } });
    expect(stats.recentOrganizations[0]).not.toHaveProperty('passwordHash');
  });

  it('reports the database as down when the ping fails', async () => {
    dataSource.query.mockRejectedValue(new Error('offline'));
    const status = await service.getSystemStatus();
    expect(status.api).toBe('ok');
    expect(status.database).toEqual({ status: 'down', latencyMs: null });
  });

  it('reports the database as ok with a latency', async () => {
    const status = await service.getSystemStatus();
    expect(status.database.status).toBe('ok');
    expect(status.database.latencyMs).toEqual(expect.any(Number));
  });
});
