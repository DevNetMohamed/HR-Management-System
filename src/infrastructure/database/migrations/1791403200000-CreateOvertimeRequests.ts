import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOvertimeRequests1791403200000 implements MigrationInterface {
  name = 'CreateOvertimeRequests1791403200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."overtime_request_status" AS ENUM (
        'PENDING_MANAGER',
        'PENDING_HR',
        'APPROVED',
        'REJECTED',
        'CANCELLED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "overtime_requests" (
        "id" uuid NOT NULL,
        "company_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "attendance_id" uuid NOT NULL,

        "minutes" integer NOT NULL,
        "reason" text NOT NULL,
        "status" "public"."overtime_request_status"
          NOT NULL
          DEFAULT 'PENDING_MANAGER',

        "manager_review_required" boolean NOT NULL,
        "manager_reviewed_by" uuid,
        "manager_reviewed_at" TIMESTAMP WITH TIME ZONE,

        "hr_reviewed_by" uuid,
        "hr_reviewed_at" TIMESTAMP WITH TIME ZONE,

        "version" integer NOT NULL DEFAULT 1,

        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" uuid NOT NULL,
        "updated_by" uuid,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "metadata" jsonb,

        CONSTRAINT "PK_overtime_requests"
          PRIMARY KEY ("id"),

        CONSTRAINT "FK_overtime_requests_employee"
          FOREIGN KEY ("employee_id")
          REFERENCES "employees"("id")
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,

        CONSTRAINT "CHK_overtime_minutes_positive"
          CHECK ("minutes" > 0),

        CONSTRAINT "CHK_overtime_reason_length"
          CHECK (
            char_length(trim("reason")) BETWEEN 3 AND 1000
          ),

        CONSTRAINT "CHK_overtime_version_positive"
          CHECK ("version" > 0),

        CONSTRAINT "CHK_overtime_manager_review_pair"
          CHECK (
            (
              "manager_reviewed_by" IS NULL
              AND "manager_reviewed_at" IS NULL
            )
            OR
            (
              "manager_reviewed_by" IS NOT NULL
              AND "manager_reviewed_at" IS NOT NULL
            )
          ),

        CONSTRAINT "CHK_overtime_hr_review_pair"
          CHECK (
            (
              "hr_reviewed_by" IS NULL
              AND "hr_reviewed_at" IS NULL
            )
            OR
            (
              "hr_reviewed_by" IS NOT NULL
              AND "hr_reviewed_at" IS NOT NULL
            )
          )
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_overtime_request_attendance"
      ON "overtime_requests" ("company_id", "attendance_id")
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IX_overtime_review_queue"
      ON "overtime_requests" (
        "company_id",
        "status",
        "created_at"
      )
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IX_overtime_employee_history"
      ON "overtime_requests" (
        "company_id",
        "employee_id",
        "created_at" DESC
      )
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IX_overtime_employee_history"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IX_overtime_review_queue"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."UQ_overtime_request_attendance"
    `);

    await queryRunner.query(`
      DROP TABLE "overtime_requests"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."overtime_request_status"
    `);
  }
}
