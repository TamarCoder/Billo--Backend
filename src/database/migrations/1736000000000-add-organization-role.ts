import type { MigrationInterface, QueryRunner } from 'typeorm';

// Accounts with role 'admin' can use the admin panel; everyone else stays 'organization'.
export class AddOrganizationRole1736000000000 implements MigrationInterface {
  name = 'AddOrganizationRole1736000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD COLUMN "role" character varying(16) NOT NULL DEFAULT 'organization',
      ADD CONSTRAINT "CHK_organizations_role" CHECK ("role" IN ('organization', 'admin'))
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "role"`);
  }
}
