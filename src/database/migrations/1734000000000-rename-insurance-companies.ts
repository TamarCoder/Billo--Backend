import type { MigrationInterface, QueryRunner } from 'typeorm';

// A company can be of any kind (insurance, construction, ...), so the table is just "companies".
export class RenameInsuranceCompanies1734000000000 implements MigrationInterface {
  name = 'RenameInsuranceCompanies1734000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "insurance_companies" RENAME TO "companies"`);
    await queryRunner.query(
      `ALTER TABLE "companies" RENAME CONSTRAINT "PK_insurance_companies_id" TO "PK_companies_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" RENAME CONSTRAINT "UQ_insurance_companies_org_number" TO "UQ_companies_org_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" RENAME CONSTRAINT "FK_insurance_companies_organization" TO "FK_companies_organization"`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies" RENAME CONSTRAINT "FK_companies_organization" TO "FK_insurance_companies_organization"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" RENAME CONSTRAINT "UQ_companies_org_number" TO "UQ_insurance_companies_org_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" RENAME CONSTRAINT "PK_companies_id" TO "PK_insurance_companies_id"`,
    );
    await queryRunner.query(`ALTER TABLE "companies" RENAME TO "insurance_companies"`);
  }
}
