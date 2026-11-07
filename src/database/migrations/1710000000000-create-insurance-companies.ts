import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInsuranceCompanies1710000000000
  implements MigrationInterface
{
  name = 'CreateInsuranceCompanies1710000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      CREATE TABLE "insurance_companies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(200) NOT NULL,
        CONSTRAINT "PK_insurance_companies_id" PRIMARY KEY ("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "insurance_companies"');
  }
}