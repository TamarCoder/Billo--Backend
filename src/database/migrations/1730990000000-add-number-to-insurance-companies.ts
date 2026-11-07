import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNumberToInsuranceCompanies1730990000000
  implements MigrationInterface
{
  name = 'AddNumberToInsuranceCompanies1730990000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. ჯერ სვეტი დროებით NULL-ით, რომ ძველი ჩანაწერები არ ჩავარდეს
    await queryRunner.query(`
      ALTER TABLE "insurance_companies"
      ADD COLUMN "number" character varying(50)
    `);

    // 2. ძველ ჩანაწერებს დროებითი ნომრები მივანიჭოთ (1, 2, 3...)
    await queryRunner.query(`
      UPDATE "insurance_companies" AS c
      SET "number" = numbered.rn::text
      FROM (
        SELECT "id", ROW_NUMBER() OVER (ORDER BY "name") AS rn
        FROM "insurance_companies"
      ) AS numbered
      WHERE c."id" = numbered."id"
    `);

    // 3. ახლა სავალდებულო და უნიკალური გავხადოთ
    await queryRunner.query(`
      ALTER TABLE "insurance_companies"
      ALTER COLUMN "number" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "insurance_companies"
      ADD CONSTRAINT "UQ_insurance_companies_number" UNIQUE ("number")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "insurance_companies"
      DROP CONSTRAINT "UQ_insurance_companies_number"
    `);
    await queryRunner.query(`
      ALTER TABLE "insurance_companies"
      DROP COLUMN "number"
    `);
  }
}