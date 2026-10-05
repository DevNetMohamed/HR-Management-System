import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1791208439942 implements MigrationInterface {
    name = 'InitialSchema1791208439942'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "employee_dependents" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "id" uuid NOT NULL, "company_id" uuid NOT NULL, "employee_id" uuid NOT NULL, "name" character varying(150) NOT NULL, "relationship" character varying(20) NOT NULL, "date_of_birth" date, "covered_by_insurance" boolean NOT NULL DEFAULT false, CONSTRAINT "employee_dependents_child_dob_chk" CHECK ("relationship" <> 'child' OR "date_of_birth" IS NOT NULL), CONSTRAINT "employee_dependents_relationship_chk" CHECK ("relationship" IN ('spouse', 'child', 'parent')), CONSTRAINT "PK_0a3ad586f70d1170cec26f3b2cc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "employee_dependents_one_spouse_uq" ON "employee_dependents"  ("employee_id") WHERE "relationship" = 'spouse' AND "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "employee_dependents_employee_idx" ON "employee_dependents"  ("employee_id") `);
        await queryRunner.query(`ALTER TABLE "employee_dependents" ADD CONSTRAINT "FK_ae662733e6cae92bab9feb4d419" FOREIGN KEY ("employee_id", "company_id") REFERENCES "employees"("id","company_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employee_dependents" DROP CONSTRAINT "FK_ae662733e6cae92bab9feb4d419"`);
        await queryRunner.query(`DROP INDEX "public"."employee_dependents_employee_idx"`);
        await queryRunner.query(`DROP INDEX "public"."employee_dependents_one_spouse_uq"`);
        await queryRunner.query(`DROP TABLE "employee_dependents"`);
    }

}
