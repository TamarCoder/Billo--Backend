import { DataSource } from 'typeorm';
import { CreateInsuranceCompanies1710000000000 } from './migrations/1710000000000-create-insurance-companies.js';
import { InsuranceCompany } from '../companies/entities/insurance-company.entity.js';
import { InvoiceRecord } from '../invoices/entities/invoice-record.entity.js';
import { OrganizationSettings } from '../settings/entities/organization-settings.entity.js';
import { CreateInvoicesAndSettings1710000000001 } from './migrations/1710000000001-create-invoices-and-settings.js';
import { AddNumberToInsuranceCompanies1730990000000 } from './migrations/1730990000000-add-number-to-insurance-companies.js';

export const databaseDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true',
  entities: [InsuranceCompany, InvoiceRecord, OrganizationSettings],
  migrations: [
    CreateInsuranceCompanies1710000000000,
    CreateInvoicesAndSettings1710000000001,
    AddNumberToInsuranceCompanies1730990000000,
  ],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
});