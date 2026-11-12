import type { MigrationInterface, QueryRunner } from 'typeorm';

// Assign the 'tatishvili' invoice template to organization 405310612.
export class AssignTatishviliTemplate1738000000001 implements MigrationInterface {
  name = 'AssignTatishviliTemplate1738000000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "organizations"
      SET "invoice_templates" = array_append("invoice_templates", 'tatishvili')
      WHERE "identification_code" = '405310612'
        AND NOT ('tatishvili' = ANY("invoice_templates"))
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "organizations"
      SET "invoice_templates" = array_remove("invoice_templates", 'tatishvili')
      WHERE "identification_code" = '405310612'
    `);
  }
}
