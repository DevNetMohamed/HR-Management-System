import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1791987220199 implements MigrationInterface {
    name = 'InitialSchema1791987220199'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."company_status" AS ENUM('trial', 'active', 'suspended')`);
        await queryRunner.query(`CREATE TABLE "companies" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "id" uuid NOT NULL, "name" character varying NOT NULL, "legal_name" character varying, "subdomain" character varying NOT NULL, "tax_number" character varying, "commercial_register_number" character varying, "industry" character varying, "work_email" character varying, "phone" character varying, "website" character varying, "country" character varying, "currency" character varying, "timezone" character varying, "locale" character varying, "logo_url" character varying, "status" "public"."company_status" NOT NULL DEFAULT 'trial', "plan" character varying, CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "companies_subdomain_uq" ON "companies"  ("subdomain") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."companies_subdomain_uq"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP TYPE "public"."company_status"`);
    }

}
