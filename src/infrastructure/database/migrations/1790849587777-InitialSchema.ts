import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1790849587777 implements MigrationInterface {
  name = 'InitialSchema1790849587777';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."contract_kind" AS ENUM('permanent', 'fixed_term', 'probation', 'internship')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."contract_status" AS ENUM('draft', 'active', 'expired', 'terminated')`,
    );
    await queryRunner.query(
      `CREATE TABLE "employment_contracts" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "id" uuid NOT NULL, "company_id" uuid NOT NULL, "employee_id" uuid NOT NULL, "contract_type" "public"."contract_kind" NOT NULL, "start_date" date NOT NULL, "end_date" date, "probation_months" smallint, "notice_period_days" smallint, "status" "public"."contract_status" NOT NULL, "document_url" character varying(500), "termination_reason" text, CONSTRAINT "PK_15928b5ec88cc7e0b2a6a2ff513" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."employment_type" RENAME TO "employment_type_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employment_type" AS ENUM('fullTime', 'partTime', 'contract', 'intern')`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ALTER COLUMN "employment_type" TYPE "public"."employment_type" USING "employment_type"::"text"::"public"."employment_type"`,
    );
    await queryRunner.query(`DROP TYPE "public"."employment_type_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."employment_type_old" AS ENUM('full', 'part', 'contract', 'intern')`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ALTER COLUMN "employment_type" TYPE "public"."employment_type_old" USING "employment_type"::"text"::"public"."employment_type_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."employment_type"`);
    await queryRunner.query(
      `ALTER TYPE "public"."employment_type_old" RENAME TO "employment_type"`,
    );
    await queryRunner.query(`DROP TABLE "employment_contracts"`);
    await queryRunner.query(`DROP TYPE "public"."contract_status"`);
    await queryRunner.query(`DROP TYPE "public"."contract_kind"`);
  }
}
