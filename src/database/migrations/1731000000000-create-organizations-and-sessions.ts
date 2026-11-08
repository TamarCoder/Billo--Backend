import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizationsAndSessions1731000000000
  implements MigrationInterface
{
  name = 'CreateOrganizationsAndSessions1731000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "identification_code" character varying(11) NOT NULL,
        "email" character varying(254) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_organizations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_organizations_identification_code" UNIQUE ("identification_code"),
        CONSTRAINT "UQ_organizations_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "token_hash" character(64) NOT NULL,
        "organization_id" uuid NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sessions_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_sessions_organization" FOREIGN KEY ("organization_id")
          REFERENCES "organizations" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_organization_id" ON "sessions" ("organization_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
  }
}
