import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserActivationFlow1792030000000 implements MigrationInterface {
  name = 'UserActivationFlow1792030000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "employee_accounts" ADD COLUMN "personal_email" character varying`);
    await queryRunner.query(`ALTER TABLE "employee_accounts" ADD COLUMN "company_email" character varying`);
    await queryRunner.query(`ALTER TABLE "employee_accounts" ADD COLUMN "account_status" character varying NOT NULL DEFAULT 'PENDING_ACTIVATION'`);
    await queryRunner.query(`ALTER TABLE "employee_accounts" ADD COLUMN "company_email_status" character varying NOT NULL DEFAULT 'PENDING'`);
    await queryRunner.query(`UPDATE "employee_accounts" SET "personal_email" = "email", "account_status" = CASE WHEN "activated_at" IS NULL THEN 'PENDING_ACTIVATION' ELSE 'ACTIVE' END, "company_email_status" = CASE WHEN "activated_at" IS NULL THEN 'PENDING' ELSE 'ACTIVE' END`);
    await queryRunner.query(`CREATE UNIQUE INDEX "employee_accounts_company_company_email_uq" ON "employee_accounts" ("company_id", "company_email") WHERE "company_email" IS NOT NULL`);
    await queryRunner.query(`CREATE TABLE "employee_password_recoveries" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "company_id" uuid NOT NULL, "employee_id" uuid NOT NULL, "token_hash" character varying(64) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "used_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_employee_password_recoveries" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "employee_password_recoveries_token_uq" ON "employee_password_recoveries" ("token_hash")`);
    await queryRunner.query(`CREATE INDEX "employee_password_recoveries_account_idx" ON "employee_password_recoveries" ("company_id", "employee_id", "expires_at")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "employee_password_recoveries"`);
    await queryRunner.query(`DROP INDEX "employee_accounts_company_company_email_uq"`);
    await queryRunner.query(`ALTER TABLE "employee_accounts" DROP COLUMN "company_email_status", DROP COLUMN "account_status", DROP COLUMN "company_email", DROP COLUMN "personal_email"`);
  }
}
