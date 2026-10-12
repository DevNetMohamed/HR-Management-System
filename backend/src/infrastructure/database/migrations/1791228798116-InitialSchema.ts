import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1791228798116 implements MigrationInterface {
    name = 'InitialSchema1791228798116'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."employment_type" AS ENUM('full', 'part', 'contract', 'intern')`);
        await queryRunner.query(`CREATE TYPE "public"."employee_status" AS ENUM('onboarding', 'active', 'on_leave', 'offboarding', 'terminated')`);
        await queryRunner.query(`CREATE TABLE "employees" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "id" uuid NOT NULL, "company_id" uuid NOT NULL, "employee_number" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying, "date_of_birth" date, "gender" character varying, "nationality" character varying, "national_id" character varying, "marital_status" character varying, "department_id" uuid, "position_id" uuid, "branch_id" uuid, "manager_id" uuid, "hire_date" date NOT NULL, "termination_date" date, "employment_type" "public"."employment_type" NOT NULL, "status" "public"."employee_status" NOT NULL, "profile_photo_url" character varying, CONSTRAINT "employees_company_id_id_uq" UNIQUE ("company_id", "id"), CONSTRAINT "employees_not_self_manager_chk" CHECK ("manager_id" IS NULL OR "manager_id" <> "id"), CONSTRAINT "employees_dates_chk" CHECK ("termination_date" IS NULL OR "termination_date" >= "hire_date"), CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "employees_company_number_uq" ON "employees"  ("company_id", "employee_number") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE TABLE "emergency_contacts" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "id" uuid NOT NULL, "company_id" uuid NOT NULL, "employee_id" uuid NOT NULL, "name" character varying, "relationship" character varying, "phone" character varying, CONSTRAINT "emergency_contacts_relationship_chk" CHECK ("relationship" IN ('spouse', 'parent', 'child', 'sibling', 'relative', 'friend', 'other')), CONSTRAINT "PK_8be191845b6fca1c4e5ba5bd7d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "emergency_contacts_employee_phone_uq" ON "emergency_contacts"  ("employee_id", "phone") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "emergency_contacts_employee_idx" ON "emergency_contacts"  ("employee_id") `);
        await queryRunner.query(`CREATE TABLE "employee_dependents" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "id" uuid NOT NULL, "company_id" uuid NOT NULL, "employee_id" uuid NOT NULL, "name" character varying(150) NOT NULL, "relationship" character varying(20) NOT NULL, "date_of_birth" date, "covered_by_insurance" boolean NOT NULL DEFAULT false, CONSTRAINT "employee_dependents_child_dob_chk" CHECK ("relationship" <> 'child' OR "date_of_birth" IS NOT NULL), CONSTRAINT "employee_dependents_relationship_chk" CHECK ("relationship" IN ('spouse', 'child', 'parent')), CONSTRAINT "PK_0a3ad586f70d1170cec26f3b2cc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "employee_dependents_one_spouse_uq" ON "employee_dependents"  ("employee_id") WHERE "relationship" = 'spouse' AND "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "employee_dependents_employee_idx" ON "employee_dependents"  ("employee_id") `);
        await queryRunner.query(`CREATE TYPE "public"."contract_kind" AS ENUM('permanent', 'fixed_term', 'probation', 'internship')`);
        await queryRunner.query(`CREATE TYPE "public"."contract_status" AS ENUM('draft', 'active', 'expired', 'terminated')`);
        await queryRunner.query(`CREATE TABLE "employment_contracts" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "id" uuid NOT NULL, "company_id" uuid NOT NULL, "employee_id" uuid NOT NULL, "contract_type" "public"."contract_kind" NOT NULL, "start_date" date NOT NULL, "end_date" date, "probation_months" smallint, "notice_period_days" smallint, "status" "public"."contract_status" NOT NULL, "document_url" character varying(500), "termination_reason" text, CONSTRAINT "contracts_dates_chk" CHECK ("end_date" IS NULL OR "end_date" >= "start_date"), CONSTRAINT "contracts_fixed_end_chk" CHECK ("contract_type" = 'permanent' OR "end_date" IS NOT NULL), CONSTRAINT "contracts_permanent_end_chk" CHECK ("contract_type" <> 'permanent' OR "end_date" IS NULL OR "status" = 'terminated'), CONSTRAINT "contracts_notice_chk" CHECK ("notice_period_days" IS NULL OR "notice_period_days" BETWEEN 0 AND 180), CONSTRAINT "contracts_probation_chk" CHECK ("probation_months" IS NULL OR "probation_months" BETWEEN 0 AND 12), CONSTRAINT "contracts_no_overlap" EXCLUDE USING gist ("employee_id" WITH =, daterange("start_date", "end_date", '[]') WITH &&)
   WHERE ("status" = 'active' AND "deleted_at" IS NULL), CONSTRAINT "PK_15928b5ec88cc7e0b2a6a2ff513" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "employment_contracts_company_status_idx" ON "employment_contracts"  ("company_id", "status") `);
        await queryRunner.query(`CREATE INDEX "employment_contracts_employee_idx" ON "employment_contracts"  ("employee_id") `);
        await queryRunner.query(`CREATE TABLE "job_history" ("id" uuid NOT NULL, "company_id" uuid NOT NULL, "employee_id" uuid NOT NULL, "department_id" uuid, "position_id" uuid, "manager_id" uuid, "change_type" character varying NOT NULL, "effective_date" date NOT NULL, "reason" text, CONSTRAINT "job_history_change_type_chk" CHECK ("change_type" IN ('hire', 'promotion', 'transfer', 'demotion')), CONSTRAINT "PK_688f25ad49557eed88dbaaf5a96" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "job_history_employee_idx" ON "job_history"  ("employee_id", "effective_date") `);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_6f289caf3e35ce069094d338c35" FOREIGN KEY ("manager_id", "company_id") REFERENCES "employees"("id","company_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "emergency_contacts" ADD CONSTRAINT "FK_799a386755253a0ca7c904aa993" FOREIGN KEY ("employee_id", "company_id") REFERENCES "employees"("id","company_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employee_dependents" ADD CONSTRAINT "FK_ae662733e6cae92bab9feb4d419" FOREIGN KEY ("employee_id", "company_id") REFERENCES "employees"("id","company_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_history" ADD CONSTRAINT "FK_7a548569d93a32df16b4c590129" FOREIGN KEY ("employee_id", "company_id") REFERENCES "employees"("id","company_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_history" ADD CONSTRAINT "FK_fea6e85bd5bb6fa12eb7b70a78f" FOREIGN KEY ("manager_id", "company_id") REFERENCES "employees"("id","company_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_history" DROP CONSTRAINT "FK_fea6e85bd5bb6fa12eb7b70a78f"`);
        await queryRunner.query(`ALTER TABLE "job_history" DROP CONSTRAINT "FK_7a548569d93a32df16b4c590129"`);
        await queryRunner.query(`ALTER TABLE "employee_dependents" DROP CONSTRAINT "FK_ae662733e6cae92bab9feb4d419"`);
        await queryRunner.query(`ALTER TABLE "emergency_contacts" DROP CONSTRAINT "FK_799a386755253a0ca7c904aa993"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_6f289caf3e35ce069094d338c35"`);
        await queryRunner.query(`DROP INDEX "public"."job_history_employee_idx"`);
        await queryRunner.query(`DROP TABLE "job_history"`);
        await queryRunner.query(`DROP INDEX "public"."employment_contracts_employee_idx"`);
        await queryRunner.query(`DROP INDEX "public"."employment_contracts_company_status_idx"`);
        await queryRunner.query(`DROP TABLE "employment_contracts"`);
        await queryRunner.query(`DROP TYPE "public"."contract_status"`);
        await queryRunner.query(`DROP TYPE "public"."contract_kind"`);
        await queryRunner.query(`DROP INDEX "public"."employee_dependents_employee_idx"`);
        await queryRunner.query(`DROP INDEX "public"."employee_dependents_one_spouse_uq"`);
        await queryRunner.query(`DROP TABLE "employee_dependents"`);
        await queryRunner.query(`DROP INDEX "public"."emergency_contacts_employee_idx"`);
        await queryRunner.query(`DROP INDEX "public"."emergency_contacts_employee_phone_uq"`);
        await queryRunner.query(`DROP TABLE "emergency_contacts"`);
        await queryRunner.query(`DROP INDEX "public"."employees_company_number_uq"`);
        await queryRunner.query(`DROP TABLE "employees"`);
        await queryRunner.query(`DROP TYPE "public"."employee_status"`);
        await queryRunner.query(`DROP TYPE "public"."employment_type"`);
    }

}
