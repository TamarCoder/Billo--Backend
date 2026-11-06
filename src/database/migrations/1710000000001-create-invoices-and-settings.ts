import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvoicesAndSettings1710000000001 implements MigrationInterface {
  name = 'CreateInvoicesAndSettings1710000000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "invoice_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "status" character varying(16) NOT NULL DEFAULT 'draft',
        "invoice" jsonb NOT NULL,
        CONSTRAINT "PK_invoice_records_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_invoice_records_status"
          CHECK ("status" IN ('none', 'draft', 'sent', 'printed'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_records_created_at"
      ON "invoice_records" ("created_at" DESC)
    `);
    await queryRunner.query(`
      CREATE TABLE "organization_settings" (
        "id" smallint NOT NULL DEFAULT 1,
        "title" character varying(300) NOT NULL,
        "issuerAddress" character varying(500) NOT NULL,
        "issuerIdentificationNumber" character varying(100) NOT NULL,
        "bankName" character varying(200) NOT NULL,
        "bankCode" character varying(100) NOT NULL,
        "bankAccount" character varying(100) NOT NULL,
        CONSTRAINT "PK_organization_settings_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_organization_settings_singleton" CHECK ("id" = 1)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "legacy_data_imports" (
        "source" character varying(512) NOT NULL,
        "imported_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_legacy_data_imports_source" PRIMARY KEY ("source")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "legacy_data_imports"');
    await queryRunner.query('DROP TABLE "organization_settings"');
    await queryRunner.query('DROP INDEX "IDX_invoice_records_created_at"');
    await queryRunner.query('DROP TABLE "invoice_records"');
  }
}
