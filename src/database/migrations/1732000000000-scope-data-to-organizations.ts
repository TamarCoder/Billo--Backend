import type { MigrationInterface, QueryRunner } from 'typeorm';

// Existing rows belonged to the only organization that used Billo before login
// existed. If that organization is not in the database yet, it is created with
// an unusable password; `npm run seed:organization` sets the real one.
const OWNER_CODE = '405310612';
const OWNER_EMAIL = 'info@dthc.ge';
const LOCKED_PASSWORD = '!';

const DATA_TABLES = ['insurance_companies', 'invoice_records', 'organization_settings'];

export class ScopeDataToOrganizations1732000000000 implements MigrationInterface {
  name = 'ScopeDataToOrganizations1732000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of DATA_TABLES) {
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN "organization_id" uuid`);
    }

    const counts: { total: string }[] = await queryRunner.query(`
      SELECT (SELECT count(*) FROM "insurance_companies")
           + (SELECT count(*) FROM "invoice_records")
           + (SELECT count(*) FROM "organization_settings") AS total
    `);
    if (Number(counts[0]?.total ?? 0) > 0) {
      await queryRunner.query(
        // If the email already belongs to another code, use a placeholder instead of failing.
        `INSERT INTO "organizations" ("identification_code", "email", "password_hash")
         VALUES (
           $1,
           CASE WHEN EXISTS (SELECT 1 FROM "organizations" WHERE "email" = $2)
                THEN $1 || '@billo.invalid' ELSE $2 END,
           $3
         )
         ON CONFLICT DO NOTHING`,
        [OWNER_CODE, OWNER_EMAIL, LOCKED_PASSWORD],
      );
      for (const table of DATA_TABLES) {
        await queryRunner.query(
          `UPDATE "${table}" SET "organization_id" =
             (SELECT "id" FROM "organizations" WHERE "identification_code" = $1)
           WHERE "organization_id" IS NULL`,
          [OWNER_CODE],
        );
      }
    }

    for (const table of DATA_TABLES) {
      await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "organization_id" SET NOT NULL`);
      await queryRunner.query(`
        ALTER TABLE "${table}" ADD CONSTRAINT "FK_${table}_organization"
        FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE
      `);
    }

    // Company numbers are unique per organization, not globally.
    await queryRunner.query(
      `ALTER TABLE "insurance_companies" DROP CONSTRAINT IF EXISTS "UQ_insurance_companies_number"`,
    );
    await queryRunner.query(`
      ALTER TABLE "insurance_companies" ADD CONSTRAINT "UQ_insurance_companies_org_number"
      UNIQUE ("organization_id", "number")
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_invoice_records_organization_id" ON "invoice_records" ("organization_id")`,
    );

    // Settings: one row per organization instead of a single global row.
    await queryRunner.query(
      `ALTER TABLE "organization_settings" DROP CONSTRAINT "CHK_organization_settings_singleton"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_settings" DROP CONSTRAINT "PK_organization_settings_id"`,
    );
    await queryRunner.query(`ALTER TABLE "organization_settings" DROP COLUMN "id"`);
    await queryRunner.query(`
      ALTER TABLE "organization_settings" ADD CONSTRAINT "PK_organization_settings_organization_id"
      PRIMARY KEY ("organization_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Rows of every organization except one are kept but lose their owner; settings keep one row.
    await queryRunner.query(`
      DELETE FROM "organization_settings" WHERE "organization_id" <> (
        SELECT "organization_id" FROM "organization_settings" ORDER BY "organization_id" LIMIT 1)
    `);
    await queryRunner.query(
      `ALTER TABLE "organization_settings" DROP CONSTRAINT "PK_organization_settings_organization_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_settings" ADD COLUMN "id" smallint NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_settings" ADD CONSTRAINT "PK_organization_settings_id" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_settings" ADD CONSTRAINT "CHK_organization_settings_singleton" CHECK ("id" = 1)`,
    );
    await queryRunner.query(`DROP INDEX "IDX_invoice_records_organization_id"`);
    await queryRunner.query(
      `ALTER TABLE "insurance_companies" DROP CONSTRAINT "UQ_insurance_companies_org_number"`,
    );
    for (const table of DATA_TABLES) {
      await queryRunner.query(`ALTER TABLE "${table}" DROP CONSTRAINT "FK_${table}_organization"`);
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "organization_id"`);
    }
    await queryRunner.query(
      `ALTER TABLE "insurance_companies" ADD CONSTRAINT "UQ_insurance_companies_number" UNIQUE ("number")`,
    );
  }
}
