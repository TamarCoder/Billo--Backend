import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hashPassword } from '../auth/password.js';
import type { RegisterDto } from '../auth/dto/register.dto.js';
import { Company } from '../companies/entities/company.entity.js';
import { InvoiceFormsService } from '../invoice-forms/invoice-forms.service.js';
import { Organization } from '../organizations/entities/organization.entity.js';

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
    private readonly forms: InvoiceFormsService,
  ) {}

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

  async listCompanies(organizationId: string): Promise<Company[]> {
    await this.getOrganization(organizationId);
    return this.companies.find({
      where: { organizationId },
      order: { number: 'ASC' },
    });
  }
}
