import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1791575983136 implements MigrationInterface {
  name = 'InitialSchema1791575983136';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "overtime_requests" DROP CONSTRAINT "FK_overtime_requests_employee"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_overtime_request_attendance"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IX_overtime_review_queue"`);
    await queryRunner.query(
      `DROP INDEX "public"."IX_overtime_employee_history"`,
    );
    await queryRunner.query(
      `ALTER TABLE "overtime_requests" DROP CONSTRAINT "CHK_overtime_hr_review_pair"`,
    );
    await queryRunner.query(
      `ALTER TABLE "overtime_requests" DROP CONSTRAINT "CHK_overtime_manager_review_pair"`,
    );
    await queryRunner.query(
      `ALTER TABLE "overtime_requests" DROP CONSTRAINT "CHK_overtime_minutes_positive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "overtime_requests" DROP CONSTRAINT "CHK_overtime_reason_length"`,
    );
    await queryRunner.query(
      `ALTER TABLE "overtime_requests" DROP CONSTRAINT "CHK_overtime_version_positive"`,
    );
    await queryRunner.query(`CREATE TABLE "employee_documents" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "id" uuid NOT NULL, "company_id" uuid NOT NULL, "employee_id" uuid NOT NULL, "document_type" character varying(30) NOT NULL, "file_key" character varying(500) NOT NULL, "file_name" character varying(255) NOT NULL, "mime_type" character varying(100) NOT NULL, "size_bytes" integer NOT NULL, "issue_date" date, "expiry_date" date, "is_verified" boolean NOT NULL DEFAULT false, "verified_by" uuid, "verified_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "employee_documents_verified_chk" CHECK (("is_verified" = false AND "verified_by" IS NULL AND "verified_at" IS NULL)
        OR ("is_verified" = true AND "verified_by" IS NOT NULL AND "verified_at" IS NOT NULL)), CONSTRAINT "employee_documents_size_chk" CHECK ("size_bytes" > 0 AND "size_bytes" <= 10485760), CONSTRAINT "employee_documents_expiry_required_chk" CHECK ("document_type" NOT IN ('national_id', 'passport', 'driving_license') OR "expiry_date" IS NOT NULL), CONSTRAINT "employee_documents_dates_chk" CHECK ("issue_date" IS NULL OR "expiry_date" IS NULL OR "expiry_date" >= "issue_date"), CONSTRAINT "employee_documents_type_chk" CHECK ("document_type" IN ('national_id', 'passport', 'driving_license', 'certificate', 'contract', 'other')), CONSTRAINT "PK_c19b36f5e604e261fb430293b68" PRIMARY KEY ("id"))`);
    await queryRunner.query(
      `CREATE INDEX "employee_documents_expiry_idx" ON "employee_documents"  ("company_id", "expiry_date") WHERE "expiry_date" IS NOT NULL AND "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "employee_documents_one_per_type_uq" ON "employee_documents"  ("employee_id", "document_type") WHERE "document_type" IN ('national_id', 'passport', 'driving_license') AND "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "employee_documents_file_key_uq" ON "employee_documents"  ("file_key") `,
    );
    await queryRunner.query(
      `CREATE INDEX "employee_documents_employee_idx" ON "employee_documents"  ("employee_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "overtime_requests" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_documents" ADD CONSTRAINT "FK_47dfc6d8b27dea65cffc201a788" FOREIGN KEY ("employee_id", "company_id") REFERENCES "employees"("id","company_id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_documents" DROP CONSTRAINT "FK_47dfc6d8b27dea65cffc201a788"`,
    );
    await queryRunner.query(
      `ALTER TABLE "overtime_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING_MANAGER'`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."employee_documents_employee_idx"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."employee_documents_file_key_uq"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."employee_documents_one_per_type_uq"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."employee_documents_expiry_idx"`,
    );
    await queryRunner.query(`DROP TABLE "employee_documents"`);
    await queryRunner.query(
      `ALTER TABLE "overtime_requests" ADD CONSTRAINT "CHK_overtime_version_positive" CHECK ((version > 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "overtime_requests" ADD CONSTRAINT "CHK_overtime_reason_length" CHECK (((char_length(TRIM(BOTH FROM reason)) >= 3) AND (char_length(TRIM(BOTH FROM reason)) <= 1000)))`,
    );
    await queryRunner.query(
      `ALTER TABLE "overtime_requests" ADD CONSTRAINT "CHK_overtime_minutes_positive" CHECK ((minutes > 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "overtime_requests" ADD CONSTRAINT "CHK_overtime_manager_review_pair" CHECK ((((manager_reviewed_by IS NULL) AND (manager_reviewed_at IS NULL)) OR ((manager_reviewed_by IS NOT NULL) AND (manager_reviewed_at IS NOT NULL))))`,
    );
    await queryRunner.query(
      `ALTER TABLE "overtime_requests" ADD CONSTRAINT "CHK_overtime_hr_review_pair" CHECK ((((hr_reviewed_by IS NULL) AND (hr_reviewed_at IS NULL)) OR ((hr_reviewed_by IS NOT NULL) AND (hr_reviewed_at IS NOT NULL))))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IX_overtime_employee_history" ON "overtime_requests" USING btree ("company_id", "created_at", "employee_id") WHERE (deleted_at IS NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IX_overtime_review_queue" ON "overtime_requests" USING btree ("company_id", "created_at", "status") WHERE (deleted_at IS NULL)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_overtime_request_attendance" ON "overtime_requests" USING btree ("attendance_id", "company_id") WHERE (deleted_at IS NULL)`,
    );
    await queryRunner.query(
      `ALTER TABLE "overtime_requests" ADD CONSTRAINT "FK_overtime_requests_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
