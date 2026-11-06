import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InsuranceCompany } from '../companies/entities/insurance-company.entity.js';
import { InvoiceRecord } from '../invoices/entities/invoice-record.entity.js';
import { OrganizationSettings } from '../settings/entities/organization-settings.entity.js';
import { ImportLocalDataDto } from './dto/import-local-data.dto.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

@Injectable()
export class LegacyImportService {
  constructor(private readonly dataSource: DataSource) {}

  async importLocalData(data: ImportLocalDataDto) {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    try {
      const inserted = await runner.query(
        `INSERT INTO "legacy_data_imports" ("source")
         VALUES ($1) ON CONFLICT ("source") DO NOTHING RETURNING "source"`,
        [data.source],
      );
      if (inserted.length === 0) {
        await runner.rollbackTransaction();
        return { imported: false, companies: 0, invoices: 0, settings: false };
      }

      const companyRepository = runner.manager.getRepository(InsuranceCompany);
      const existingCompanies = await companyRepository.find();
      const companyNames = new Set(
        existingCompanies.map((company) => company.name.toLocaleLowerCase()),
      );
      let companyCount = 0;
      for (const { name } of data.companies ?? []) {
        const normalizedName = name.trim().toLocaleLowerCase();
        if (!normalizedName || companyNames.has(normalizedName)) continue;
        await companyRepository.save(
          companyRepository.create({ name: name.trim() }),
        );
        companyNames.add(normalizedName);
        companyCount += 1;
      }

      const invoiceRepository = runner.manager.getRepository(InvoiceRecord);
      let invoiceCount = 0;
      for (const legacyInvoice of data.invoices ?? []) {
        const id =
          legacyInvoice.id && UUID_PATTERN.test(legacyInvoice.id)
            ? legacyInvoice.id
            : randomUUID();
        const existingInvoice = await invoiceRepository.findOneBy({ id });
        if (existingInvoice) continue;

        await invoiceRepository.save(
          invoiceRepository.create({
            id,
            createdAt: legacyInvoice.createdAt
              ? new Date(legacyInvoice.createdAt)
              : new Date(),
            status: legacyInvoice.status,
            invoice: legacyInvoice.invoice,
          }),
        );
        invoiceCount += 1;
      }

      let settingsImported = false;
      if (data.settings) {
        const settingsRepository =
          runner.manager.getRepository(OrganizationSettings);
        const existingSettings = await settingsRepository.findOneBy({ id: 1 });
        if (!existingSettings) {
          await settingsRepository.save(
            settingsRepository.create({
              id: 1,
              title: data.settings.title,
              issuerAddress: data.settings.issuerAddress,
              issuerIdentificationNumber:
                data.settings.issuerIdentificationNumber,
              bankName: data.settings.bankName,
              bankCode: data.settings.bankCode,
              bankAccount: data.settings.bankAccount,
            }),
          );
          settingsImported = true;
        }
      }

      await runner.commitTransaction();
      return {
        imported: true,
        companies: companyCount,
        invoices: invoiceCount,
        settings: settingsImported,
      };
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }
}
