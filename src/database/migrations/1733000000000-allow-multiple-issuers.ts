import type { MigrationInterface, QueryRunner } from 'typeorm';

// An account can keep several issuing organizations; the existing row becomes the primary one.
export class AllowMultipleIssuers1733000000000 implements MigrationInterface {
  name = 'AllowMultipleIssuers1733000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organization_settings"
      ADD COLUMN "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      ADD COLUMN "is_primary" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`UPDATE "organization_settings" SET "is_primary" = true`);
    await queryRunner.query(
      `ALTER TABLE "organization_settings" DROP CONSTRAINT "PK_organization_settings_organization_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_settings" ADD CONSTRAINT "PK_organization_settings_id" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_organization_settings_primary"
      ON "organization_settings" ("organization_id") WHERE "is_primary"
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_organization_settings_organization_id" ON "organization_settings" ("organization_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "organization_settings" WHERE NOT "is_primary"`);
    await queryRunner.query(`DROP INDEX "IDX_organization_settings_organization_id"`);
    await queryRunner.query(`DROP INDEX "UQ_organization_settings_primary"`);
    await queryRunner.query(
      `ALTER TABLE "organization_settings" DROP CONSTRAINT "PK_organization_settings_id"`,
    );
    await queryRunner.query(`
      ALTER TABLE "organization_settings"
      ADD CONSTRAINT "PK_organization_settings_organization_id" PRIMARY KEY ("organization_id")
    `);
    await queryRunner.query(
      `ALTER TABLE "organization_settings" DROP COLUMN "is_primary", DROP COLUMN "id"`,
    );
  }
}
