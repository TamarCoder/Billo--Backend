import type { MigrationInterface, QueryRunner } from 'typeorm';

// The one-time import of browser-stored data was removed; its bookkeeping table goes with it.
export class DropLegacyDataImports1735000000000 implements MigrationInterface {
  name = 'DropLegacyDataImports1735000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "legacy_data_imports"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "legacy_data_imports" (
        "source" character varying(512) NOT NULL,
        "imported_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_legacy_data_imports_source" PRIMARY KEY ("source")
      )
    `);
  }
}
