import type { MigrationInterface, QueryRunner } from 'typeorm';

// Review workflow for invoice forms: submitted -> in_progress -> review -> approved -> live.
export class InvoiceFormReview1739000000000 implements MigrationInterface {
  name = 'InvoiceFormReview1739000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "invoice_forms"
      ADD COLUMN "status" character varying(20) NOT NULL DEFAULT 'submitted',
      ADD COLUMN "review_comment" text NULL,
      ADD COLUMN "template_key" character varying(50) NULL,
      ADD COLUMN "reviewed_at" TIMESTAMPTZ NULL,
      ADD COLUMN "published_at" TIMESTAMPTZ NULL,
      ADD CONSTRAINT "CHK_invoice_forms_status" CHECK ("status" IN
        ('submitted', 'in_progress', 'review', 'approved', 'changes_requested', 'live'))
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "invoice_forms"
      DROP CONSTRAINT "CHK_invoice_forms_status",
      DROP COLUMN "published_at",
      DROP COLUMN "reviewed_at",
      DROP COLUMN "template_key",
      DROP COLUMN "review_comment",
      DROP COLUMN "status"
    `);
  }
}
