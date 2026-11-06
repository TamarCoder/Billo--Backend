import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationSettings } from './entities/organization-settings.entity.js';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto.js';

const DEFAULT_SETTINGS: Omit<OrganizationSettings, 'id'> = {
  title: 'დავით ტატიშვილის ჯანმრთელობის ცენტრი',
  issuerAddress: 'თბილისი, პეკინის 28',
  issuerIdentificationNumber: 'ს/კ 405310612',
  bankName: 'საქართველოს ბანკი',
  bankCode: 'BAGAGE22',
  bankAccount: 'ა/ნ GE76BG0000000160872875GEL',
};

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(OrganizationSettings)
    private readonly settingsRepository: Repository<OrganizationSettings>,
  ) {}

  async get(): Promise<Omit<OrganizationSettings, 'id'>> {
    const settings = await this.settingsRepository.findOneBy({ id: 1 });
    if (!settings) return DEFAULT_SETTINGS;
    const { id: _id, ...result } = settings;
    return result;
  }

  async update(
    values: UpdateOrganizationSettingsDto,
  ): Promise<Omit<OrganizationSettings, 'id'>> {
    const settings = this.settingsRepository.create({
      id: 1,
      title: values.title,
      issuerAddress: values.issuerAddress,
      issuerIdentificationNumber: values.issuerIdentificationNumber,
      bankName: values.bankName,
      bankCode: values.bankCode,
      bankAccount: values.bankAccount,
    });
    const saved = await this.settingsRepository.save(settings);
    const { id: _id, ...result } = saved;
    return result;
  }
}
