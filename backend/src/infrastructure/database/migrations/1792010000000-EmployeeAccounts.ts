import { MigrationInterface, QueryRunner } from 'typeorm';

export class EmployeeAccounts1792010000000 implements MigrationInterface {
  name = 'EmployeeAccounts1792010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "employee_accounts" (
      "id" uuid NOT NULL,
      "company_id" uuid NOT NULL,
      "employee_id" uuid NOT NULL,
      "email" character varying NOT NULL,
      "password_hash" character varying,
      "invitation_token_hash" character varying,
      "invitation_expires_at" TIMESTAMP WITH TIME ZONE,
      "activated_at" TIMESTAMP WITH TIME ZONE,
      "mfa_secret" character varying,
      "mfa_enabled" boolean NOT NULL DEFAULT false,
      "failed_login_attempts" integer NOT NULL DEFAULT 0,
      "locked_until" TIMESTAMP WITH TIME ZONE,
      CONSTRAINT "PK_employee_accounts" PRIMARY KEY ("id"),
      CONSTRAINT "employee_accounts_company_employee_uq" UNIQUE ("company_id", "employee_id"),
      CONSTRAINT "FK_employee_accounts_employee" FOREIGN KEY ("employee_id", "company_id")
        REFERENCES "employees"("id", "company_id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX "employee_accounts_company_email_uq" ON "employee_accounts" ("company_id", "email")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."employee_accounts_company_email_uq"`);
    await queryRunner.query(`DROP TABLE "employee_accounts"`);
  }
}
