import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { OrganizationView } from '../auth/auth.service.js';
import { OrganizationSettings } from './entities/organization-settings.entity.js';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto.js';

type SettingsView = Omit<OrganizationSettings, 'id' | 'organizationId' | 'isPrimary'>;

// Shown until the organization saves its own settings; only the code is known.
function emptySettings(org: OrganizationView): SettingsView {
  return {
    title: '',
    issuerAddress: '',
    issuerIdentificationNumber: `ს/კ ${org.identificationCode}`,
    bankName: '',
    bankCode: '',
    bankAccount: '',
  };
}

export function toSettingsView({
  id: _id,
  organizationId: _org,
  isPrimary: _primary,
  ...view
}: OrganizationSettings): SettingsView {
  return view;
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(OrganizationSettings)
    private readonly settingsRepository: Repository<OrganizationSettings>,
  ) {}

  async get(org: OrganizationView): Promise<SettingsView> {
    const settings = await this.settingsRepository.findOneBy({
      organizationId: org.id,
      isPrimary: true,
    });
    return settings ? toSettingsView(settings) : emptySettings(org);
  }

  async update(
    organizationId: string,
    values: UpdateOrganizationSettingsDto,
  ): Promise<SettingsView> {
    const primary = await this.settingsRepository.findOneBy({ organizationId, isPrimary: true });
    const saved = await this.settingsRepository.save(
      this.settingsRepository.create({
        id: primary?.id,
        organizationId,
        isPrimary: true,
        title: values.title,
        issuerAddress: values.issuerAddress,
        issuerIdentificationNumber: values.issuerIdentificationNumber,
        bankName: values.bankName,
        bankCode: values.bankCode,
        bankAccount: values.bankAccount,
      }),
    );
    return toSettingsView(saved);
  }
}
