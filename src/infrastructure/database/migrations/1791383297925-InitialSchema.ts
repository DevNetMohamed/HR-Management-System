import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1791383297925 implements MigrationInterface {
  name = 'InitialSchema1791383297925';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "employee_bank_accounts" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "id" uuid NOT NULL, "company_id" uuid NOT NULL, "employee_id" uuid NOT NULL, "bank_name" character varying(150) NOT NULL, "iban_encrypted" text NOT NULL, "iban_hash" character(64) NOT NULL, "iban_masked" character varying(40) NOT NULL, "account_number_encrypted" text, "is_primary" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_38b97d021c18e694c5b2c43bd92" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "employee_bank_accounts_one_primary_uq" ON "employee_bank_accounts"  ("employee_id") WHERE "is_primary" = true AND "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "employee_bank_accounts_employee_iban_uq" ON "employee_bank_accounts"  ("employee_id", "iban_hash") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_bank_accounts" ADD CONSTRAINT "FK_05d3a1babd742a25cf3b48846a0" FOREIGN KEY ("employee_id", "company_id") REFERENCES "employees"("id","company_id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_bank_accounts" DROP CONSTRAINT "FK_05d3a1babd742a25cf3b48846a0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."employee_bank_accounts_employee_iban_uq"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."employee_bank_accounts_one_primary_uq"`,
    );
    await queryRunner.query(`DROP TABLE "employee_bank_accounts"`);
  }
}
