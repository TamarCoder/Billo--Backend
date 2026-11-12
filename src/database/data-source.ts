import { DropLegacyDataImports1735000000000 } from './migrations/1735000000000-drop-legacy-data-imports.js';
import { RenameInsuranceCompanies1734000000000 } from './migrations/1734000000000-rename-insurance-companies.js';
import { AllowMultipleIssuers1733000000000 } from './migrations/1733000000000-allow-multiple-issuers.js';
import { DataSource } from 'typeorm';
import { AddOrganizationRole1736000000000 } from './migrations/1736000000000-add-organization-role.js';
import { AddInvoiceTemplates1738000000000 } from './migrations/1738000000000-add-invoice-templates.js';
import { AssignTatishviliTemplate1738000000001 } from './migrations/1738000000001-assign-tatishvili-template.js';
import { CreateInvoiceForms1737000000000 } from './migrations/1737000000000-create-invoice-forms.js';
import { InvoiceForm } from '../invoice-forms/entities/invoice-form.entity.js';
import { CreateInsuranceCompanies1710000000000 } from './migrations/1710000000000-create-insurance-companies.js';
import { Company } from '../companies/entities/company.entity.js';
import { InvoiceRecord } from '../invoices/entities/invoice-record.entity.js';
import { OrganizationSettings } from '../settings/entities/organization-settings.entity.js';
import { CreateInvoicesAndSettings1710000000001 } from './migrations/1710000000001-create-invoices-and-settings.js';
import { ScopeDataToOrganizations1732000000000 } from './migrations/1732000000000-scope-data-to-organizations.js';
import { CreateOrganizationsAndSessions1731000000000 } from './migrations/1731000000000-create-organizations-and-sessions.js';
import { Organization } from '../organizations/entities/organization.entity.js';
import { Session } from '../auth/entities/session.entity.js';
import { AddNumberToInsuranceCompanies1730990000000 } from './migrations/1730990000000-add-number-to-insurance-companies.js';

export const databaseDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true',
  entities: [Company, InvoiceRecord, OrganizationSettings, Organization, Session, InvoiceForm],
  migrations: [
    CreateInsuranceCompanies1710000000000,
    CreateInvoicesAndSettings1710000000001,
    AddNumberToInsuranceCompanies1730990000000,
    CreateOrganizationsAndSessions1731000000000,
    ScopeDataToOrganizations1732000000000,
    AllowMultipleIssuers1733000000000,
    RenameInsuranceCompanies1734000000000,
    DropLegacyDataImports1735000000000,
    AddOrganizationRole1736000000000,
    CreateInvoiceForms1737000000000,
    AddInvoiceTemplates1738000000000,
    AssignTatishviliTemplate1738000000001,
  ],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
});