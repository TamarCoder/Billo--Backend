import type { MigrationInterface, QueryRunner } from 'typeorm';

// Coded invoice templates assigned to an organization. Empty = standard template.
export class AddInvoiceTemplates1738000000000 implements MigrationInterface {
  name = 'AddInvoiceTemplates1738000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD COLUMN "invoice_templates" text[] NOT NULL DEFAULT '{}'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "invoice_templates"`);
  }
}
