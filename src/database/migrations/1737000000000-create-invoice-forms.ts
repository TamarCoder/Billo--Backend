import type { MigrationInterface, QueryRunner } from 'typeorm';

// Invoice form files an admin uploads for one organization.
export class CreateInvoiceForms1737000000000 implements MigrationInterface {
  name = 'CreateInvoiceForms1737000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "invoice_forms" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" uuid NOT NULL,
        "file_name" character varying(255) NOT NULL,
        "mime_type" character varying(100) NOT NULL,
        "size" integer NOT NULL,
        "data" bytea NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invoice_forms_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_invoice_forms_organization" FOREIGN KEY ("organization_id")
          REFERENCES "organizations" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_invoice_forms_organization_id" ON "invoice_forms" ("organization_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "invoice_forms"`);
  }
}
