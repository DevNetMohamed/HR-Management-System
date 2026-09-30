import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1790797762321 implements MigrationInterface {
    name = 'InitialSchema1790797762321'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "employees" ("id" uuid NOT NULL, "company_id" uuid NOT NULL, "employee_number" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying, "date_of_birth" date, "gender" character varying, "nationality" character varying, "national_id" character varying, "marital_status" character varying, "department_id" uuid, "position_id" uuid, "branch_id" uuid, "manager_id" uuid, "hire_date" date NOT NULL, "termination_date" date, "employment_type" "public"."employment_type" NOT NULL, "status" "public"."employee_status" NOT NULL, "profile_photo_url" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "job_history" ("id" uuid NOT NULL, "company_id" uuid NOT NULL, "employee_id" uuid NOT NULL, "department_id" uuid, "position_id" uuid, "manager_id" uuid, "change_type" character varying NOT NULL, "effective_date" date NOT NULL, "reason" text, CONSTRAINT "PK_688f25ad49557eed88dbaaf5a96" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "job_history"`);
        await queryRunner.query(`DROP TABLE "employees"`);
    }

}
