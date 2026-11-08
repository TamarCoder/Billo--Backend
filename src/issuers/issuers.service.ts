import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationSettings } from '../settings/entities/organization-settings.entity.js';
import { toSettingsView } from '../settings/settings.service.js';
import type { UpdateOrganizationSettingsDto } from '../settings/dto/update-organization-settings.dto.js';

function toIssuerView(row: OrganizationSettings) {
  return { id: row.id, isPrimary: row.isPrimary, ...toSettingsView(row) };
}

export type IssuerView = ReturnType<typeof toIssuerView>;

// Organizations an account issues invoices as; the primary one is the account itself.
@Injectable()
export class IssuersService {
  constructor(
    @InjectRepository(OrganizationSettings)
    private readonly issuers: Repository<OrganizationSettings>,
  ) {}

  async findAll(organizationId: string): Promise<IssuerView[]> {
    const rows = await this.issuers.find({
      where: { organizationId },
      order: { isPrimary: 'DESC', title: 'ASC' },
    });
    return rows.map(toIssuerView);
  }

  async create(organizationId: string, values: UpdateOrganizationSettingsDto): Promise<IssuerView> {
    // The account's first organization is the account itself (primary).
    const hasPrimary = await this.issuers.exists({ where: { organizationId, isPrimary: true } });
    const saved = await this.issuers.save(
      this.issuers.create({
        organizationId,
        isPrimary: !hasPrimary,
        title: values.title,
        issuerAddress: values.issuerAddress,
        issuerIdentificationNumber: values.issuerIdentificationNumber,
        bankName: values.bankName,
        bankCode: values.bankCode,
        bankAccount: values.bankAccount,
      }),
    );
    return toIssuerView(saved);
  }

  async update(
    organizationId: string,
    id: string,
    values: UpdateOrganizationSettingsDto,
  ): Promise<IssuerView> {
    const issuer = await this.findOwn(organizationId, id);
    issuer.title = values.title;
    issuer.issuerAddress = values.issuerAddress;
    issuer.issuerIdentificationNumber = values.issuerIdentificationNumber;
    issuer.bankName = values.bankName;
    issuer.bankCode = values.bankCode;
    issuer.bankAccount = values.bankAccount;
    return toIssuerView(await this.issuers.save(issuer));
  }

  // The primary organization is the account itself and cannot be deleted.
  async remove(organizationId: string, id: string): Promise<void> {
    const issuer = await this.findOwn(organizationId, id);
    if (issuer.isPrimary) {
      throw new BadRequestException('მთავარი ორგანიზაციის წაშლა შეუძლებელია.');
    }
    await this.issuers.remove(issuer);
  }

  private async findOwn(organizationId: string, id: string): Promise<OrganizationSettings> {
    const issuer = await this.issuers.findOneBy({ id, organizationId });
    if (!issuer) throw new NotFoundException('ორგანიზაცია ვერ მოიძებნა.');
    return issuer;
  }
}
