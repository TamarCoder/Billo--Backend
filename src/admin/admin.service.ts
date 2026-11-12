import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { hashPassword } from '../auth/password.js';
import type { RegisterDto } from '../auth/dto/register.dto.js';
import { Company } from '../companies/entities/company.entity.js';
import { InvoiceRecord } from '../invoices/entities/invoice-record.entity.js';
import { InvoiceFormsService } from '../invoice-forms/invoice-forms.service.js';
import { Organization } from '../organizations/entities/organization.entity.js';

export interface AdminStats {
  organizations: number;
  companies: number;
  invoices: number;
  forms: number;
  recentOrganizations: { id: string; identificationCode: string; email: string; createdAt: Date }[];
}

export interface AdminSystemStatus {
  api: 'ok';
  database: { status: 'ok' | 'down'; latencyMs: number | null };
  uptimeSeconds: number;
  memoryMb: { rss: number; heapUsed: number };
  node: string;
  commit: string | null;
  checkedAt: string;
}

export interface AdminOrganizationView {
  id: string;
  identificationCode: string;
  email: string;
  createdAt: Date;
  companyCount: number;
  formCount: number;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizations: Repository<Organization>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    @InjectRepository(InvoiceRecord) private readonly invoices: Repository<InvoiceRecord>,
    private readonly forms: InvoiceFormsService,
    private readonly dataSource: DataSource,
  ) {}

  async getStats(): Promise<AdminStats> {
    const [organizations, companies, invoices, forms, recent] = await Promise.all([
      this.organizations.count({ where: { role: 'organization' } }),
      this.companies.count(),
      this.invoices.count(),
      this.forms.countAll(),
      this.organizations.find({
        where: { role: 'organization' },
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);
    return {
      organizations,
      companies,
      invoices,
      forms,
      recentOrganizations: recent.map(({ id, identificationCode, email, createdAt }) => ({
        id,
        identificationCode,
        email,
        createdAt,
      })),
    };
  }

  async getSystemStatus(): Promise<AdminSystemStatus> {
    const started = performance.now();
    let database: AdminSystemStatus['database'];
    try {
      await this.dataSource.query('SELECT 1');
      database = { status: 'ok', latencyMs: Math.round(performance.now() - started) };
    } catch {
      database = { status: 'down', latencyMs: null };
    }
    const memory = process.memoryUsage();
    const toMb = (bytes: number) => Math.round(bytes / 1024 / 1024);
    return {
      api: 'ok',
      database,
      uptimeSeconds: Math.round(process.uptime()),
      memoryMb: { rss: toMb(memory.rss), heapUsed: toMb(memory.heapUsed) },
      node: process.version,
      // Render sets this on every deploy; elsewhere it is absent.
      commit: process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? null,
      checkedAt: new Date().toISOString(),
    };
  }

  async listOrganizations(): Promise<AdminOrganizationView[]> {
    const [orgs, companyCounts, formCounts] = await Promise.all([
      this.organizations.find({
        where: { role: 'organization' },
        order: { createdAt: 'DESC' },
      }),
      this.companies
        .createQueryBuilder('company')
        .select('company.organization_id', 'organizationId')
        .addSelect('COUNT(*)', 'count')
        .groupBy('company.organization_id')
        .getRawMany<{ organizationId: string; count: string }>(),
      this.forms.countByOrganization(),
    ]);
    const toMap = (rows: { organizationId: string; count: string }[]) =>
      new Map(rows.map((row) => [row.organizationId, Number(row.count)]));
    const companiesBy = toMap(companyCounts);
    const formsBy = toMap(formCounts);
    return orgs.map((org) => ({
      id: org.id,
      identificationCode: org.identificationCode,
      email: org.email,
      createdAt: org.createdAt,
      companyCount: companiesBy.get(org.id) ?? 0,
      formCount: formsBy.get(org.id) ?? 0,
    }));
  }

  async getOrganization(id: string): Promise<Organization> {
    const org = await this.organizations.findOneBy({
      id,
      role: 'organization',
    });
    if (!org) throw new NotFoundException('ორგანიზაცია ვერ მოიძებნა.');
    return org;
  }

  async createOrganization(dto: RegisterDto): Promise<Organization> {
    const exists = await this.organizations.exists({
      where: [
        { identificationCode: dto.identificationCode },
        { email: dto.email },
      ],
    });
    if (exists)
      throw new ConflictException(
        'ამ კოდით ან ელფოსტით ორგანიზაცია უკვე არსებობს.',
      );
    const org = await this.organizations.save(
      this.organizations.create({
        identificationCode: dto.identificationCode,
        email: dto.email,
        passwordHash: await hashPassword(dto.password),
      }),
    );
    return this.getOrganization(org.id);
  }

  async setInvoiceTemplates(id: string, templates: string[]): Promise<Organization> {
    const org = await this.getOrganization(id);
    org.invoiceTemplates = [...new Set(templates)];
    await this.organizations.save(org);
    return org;
  }

  async listCompanies(organizationId: string): Promise<Company[]> {
    await this.getOrganization(organizationId);
    return this.companies.find({
      where: { organizationId },
      order: { number: 'ASC' },
    });
  }
}
