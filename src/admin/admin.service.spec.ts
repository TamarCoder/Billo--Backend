import { ConflictException, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { Company } from '../companies/entities/company.entity.js';
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
  let forms: { countByOrganization: ReturnType<typeof vi.fn> };
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
    forms = { countByOrganization: vi.fn().mockResolvedValue([]) };
    service = new AdminService(
      organizations as unknown as Repository<Organization>,
      companies as unknown as Repository<Company>,
      forms as unknown as InvoiceFormsService,
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
});
