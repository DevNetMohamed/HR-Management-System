import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompanies1791209000000 implements MigrationInterface {
    name = 'AddCompanies1791209000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."company_status" AS ENUM('trial', 'active', 'suspended')`);
        await queryRunner.query(`CREATE TABLE "companies" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "id" uuid NOT NULL, "name" character varying NOT NULL, "legal_name" character varying, "subdomain" character varying NOT NULL, "tax_number" character varying, "country" character varying, "currency" character varying, "timezone" character varying, "locale" character varying, "logo_url" character varying, "status" "public"."company_status" NOT NULL, "plan" character varying, CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_companies_subdomain" ON "companies"  ("subdomain") `);
        await queryRunner.query(`CREATE TABLE "company_settings" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "id" uuid NOT NULL, "company_id" uuid NOT NULL, "module" character varying NOT NULL, "key" character varying NOT NULL, "value" jsonb, CONSTRAINT "PK_036b4634217db79c17305442dbe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_company_settings_module_key" ON "company_settings"  ("company_id", "module", "key") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."uq_company_settings_module_key"`);
        await queryRunner.query(`DROP TABLE "company_settings"`);
        await queryRunner.query(`DROP INDEX "public"."uq_companies_subdomain"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP TYPE "public"."company_status"`);
    }

}