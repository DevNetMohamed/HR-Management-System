import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserGoogleAndDelivery1792040000000 implements MigrationInterface {
  name = 'UserGoogleAndDelivery1792040000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "employee_accounts" ADD COLUMN "google_subject" character varying`);
    await queryRunner.query(`ALTER TABLE "employee_accounts" ADD COLUMN "activation_sent_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`CREATE UNIQUE INDEX "employee_accounts_company_google_subject_uq" ON "employee_accounts" ("company_id", "google_subject") WHERE "google_subject" IS NOT NULL`);
    await queryRunner.query(`CREATE TABLE "user_google_login_challenges" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "company_id" uuid NOT NULL, "nonce_hash" character varying(64) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "consumed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_user_google_login_challenges" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "user_google_login_challenges_hash_uq" ON "user_google_login_challenges" ("nonce_hash")`);
    await queryRunner.query(`CREATE INDEX "user_google_login_challenges_expiry_idx" ON "user_google_login_challenges" ("expires_at")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_google_login_challenges"`);
    await queryRunner.query(`DROP INDEX "employee_accounts_company_google_subject_uq"`);
    await queryRunner.query(`ALTER TABLE "employee_accounts" DROP COLUMN "activation_sent_at", DROP COLUMN "google_subject"`);
  }
}
