import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTimeConfiguration1791600000000 implements MigrationInterface {
  name = 'CreateTimeConfiguration1791600000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE company_workweeks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
        branch_id uuid,
        working_days integer[] NOT NULL, first_day_of_week integer NOT NULL,
        standard_daily_minutes integer NOT NULL, effective_from date NOT NULL,
        effective_to date, created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        CONSTRAINT workweek_branch_fk FOREIGN KEY(company_id,branch_id) REFERENCES branches(company_id,id),
        CONSTRAINT workweek_days_chk CHECK (cardinality(working_days) BETWEEN 1 AND 7 AND working_days <@ ARRAY[1,2,3,4,5,6,7] AND array_position(working_days,NULL) IS NULL),
        CONSTRAINT workweek_first_day_chk CHECK (first_day_of_week BETWEEN 1 AND 7),
        CONSTRAINT workweek_minutes_chk CHECK (standard_daily_minutes BETWEEN 1 AND 1440),
        CONSTRAINT workweek_range_chk CHECK (effective_to IS NULL OR effective_to > effective_from)
      )
    `);
    await q.query(
      `CREATE INDEX workweek_company_dates_idx ON company_workweeks(company_id,branch_id,effective_from,effective_to)`,
    );

    await q.query(`
      CREATE TABLE attendance_policies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
        branch_id uuid,
        name varchar(200) NOT NULL, version integer NOT NULL,
        grace_minutes_late integer NOT NULL DEFAULT 0,
        early_leave_grace_min integer NOT NULL DEFAULT 0,
        half_day_after_min integer, absent_after_min integer,
        overtime_enabled boolean NOT NULL DEFAULT false,
        overtime_min_minutes integer NOT NULL DEFAULT 0,
        overtime_max_minutes integer,
        overtime_multiplier numeric(8,3) NOT NULL DEFAULT 1.5,
        overtime_requires_approval boolean NOT NULL DEFAULT true,
        require_geofence boolean NOT NULL DEFAULT false,
        allow_remote boolean NOT NULL DEFAULT false,
        absence_rule varchar(30) NOT NULL DEFAULT 'manual_review',
        effective_from date NOT NULL, effective_to date,
        created_at timestamptz NOT NULL DEFAULT now(), created_by uuid NOT NULL,
        CONSTRAINT attendance_policy_branch_fk FOREIGN KEY(company_id,branch_id) REFERENCES branches(company_id,id),
        CONSTRAINT attendance_policy_version_chk CHECK (version > 0),
        CONSTRAINT attendance_policy_minutes_chk CHECK (grace_minutes_late >= 0 AND early_leave_grace_min >= 0 AND overtime_min_minutes >= 0 AND (overtime_max_minutes IS NULL OR overtime_max_minutes >= overtime_min_minutes)),
        CONSTRAINT attendance_policy_thresholds_chk CHECK ((half_day_after_min IS NULL OR half_day_after_min > 0) AND (absent_after_min IS NULL OR absent_after_min > 0) AND (half_day_after_min IS NULL OR absent_after_min IS NULL OR absent_after_min >= half_day_after_min)),
        CONSTRAINT attendance_policy_multiplier_chk CHECK (overtime_multiplier > 0),
        CONSTRAINT attendance_policy_absence_chk CHECK (absence_rule IN ('manual_review','no_show_absent')),
        CONSTRAINT attendance_policy_range_chk CHECK (effective_to IS NULL OR effective_to > effective_from),
        CONSTRAINT attendance_policy_version_uq UNIQUE(company_id,version)
      )
    `);
    await q.query(
      `CREATE INDEX attendance_policy_company_dates_idx ON attendance_policies(company_id,branch_id,effective_from,effective_to)`,
    );

    await q.query(`
      CREATE TABLE holiday_calendars (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
        name varchar(200) NOT NULL, timezone varchar(80) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(), created_by uuid NOT NULL,
        CONSTRAINT holiday_calendar_company_id_uq UNIQUE(company_id,id),
        CONSTRAINT holiday_calendar_one_per_company_uq UNIQUE(company_id)
      )
    `);
    await q.query(`
      CREATE TABLE holidays (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
        calendar_id uuid NOT NULL, branch_id uuid,
        name varchar(200) NOT NULL, recurrence varchar(10) NOT NULL,
        start_date date, end_date date,
        start_month integer, start_day integer, duration_days integer,
        first_year integer, last_year integer,
        status varchar(12) NOT NULL DEFAULT 'active',
        cancellation_reason text, cancelled_at timestamptz, cancelled_by uuid,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL, updated_by uuid,
        CONSTRAINT holidays_company_id_uq UNIQUE(company_id,id),
        CONSTRAINT holidays_calendar_fk FOREIGN KEY(company_id,calendar_id) REFERENCES holiday_calendars(company_id,id),
        CONSTRAINT holidays_branch_fk FOREIGN KEY(company_id,branch_id) REFERENCES branches(company_id,id),
        CONSTRAINT holidays_mode_chk CHECK (
          (recurrence = 'once' AND start_date IS NOT NULL AND end_date IS NOT NULL AND end_date >= start_date AND start_month IS NULL AND start_day IS NULL AND duration_days IS NULL AND first_year IS NULL AND last_year IS NULL)
          OR (recurrence = 'yearly' AND start_date IS NULL AND end_date IS NULL AND start_month BETWEEN 1 AND 12 AND start_day BETWEEN 1 AND 31 AND duration_days BETWEEN 1 AND 366 AND first_year BETWEEN 1 AND 9999 AND (last_year IS NULL OR last_year >= first_year))
        ),
        CONSTRAINT holidays_status_chk CHECK (status IN ('active','ended','cancelled')),
        CONSTRAINT holidays_cancel_chk CHECK (status <> 'cancelled' OR (cancelled_at IS NOT NULL AND nullif(trim(cancellation_reason),'') IS NOT NULL))
      )
    `);
    await q.query(
      `CREATE INDEX holidays_company_scope_idx ON holidays(company_id,branch_id,status)`,
    );
    await q.query(
      `CREATE INDEX holidays_calendar_idx ON holidays(company_id,calendar_id)`,
    );
    await q.query(`
      CREATE TABLE holiday_occurrence_overrides (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
        holiday_id uuid NOT NULL, occurrence_year integer NOT NULL,
        status varchar(12) NOT NULL, start_date date, end_date date,
        reason text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), created_by uuid NOT NULL,
        CONSTRAINT holiday_override_uq UNIQUE(holiday_id,occurrence_year),
        CONSTRAINT holiday_override_holiday_fk FOREIGN KEY(company_id,holiday_id) REFERENCES holidays(company_id,id),
        CONSTRAINT holiday_override_status_chk CHECK (status IN ('modified','cancelled')),
        CONSTRAINT holiday_override_dates_chk CHECK ((status='cancelled' AND start_date IS NULL AND end_date IS NULL) OR (status='modified' AND start_date IS NOT NULL AND end_date >= start_date))
      )
    `);

    await q.query(`
      CREATE TABLE shifts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
        code varchar(50) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), created_by uuid NOT NULL,
        retired_at timestamptz, retired_by uuid,
        CONSTRAINT shifts_company_id_uq UNIQUE(company_id,id),
        CONSTRAINT shifts_company_code_uq UNIQUE(company_id,code)
      )
    `);
    await q.query(`
      CREATE TABLE shift_versions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
        shift_id uuid NOT NULL, version integer NOT NULL,
        name varchar(200) NOT NULL, start_time time NOT NULL, end_time time NOT NULL,
        end_day_offset integer NOT NULL, break_minutes integer NOT NULL DEFAULT 0,
        working_days integer[], effective_from date NOT NULL, effective_to date,
        created_at timestamptz NOT NULL DEFAULT now(), created_by uuid NOT NULL,
        CONSTRAINT shift_versions_shift_fk FOREIGN KEY(company_id,shift_id) REFERENCES shifts(company_id,id),
        CONSTRAINT shift_versions_unique UNIQUE(company_id,shift_id,version),
        CONSTRAINT shift_versions_identity_uq UNIQUE(company_id,shift_id,id),
        CONSTRAINT shift_versions_time_chk CHECK (start_time <> end_time AND end_day_offset = CASE WHEN end_time < start_time THEN 1 ELSE 0 END),
        CONSTRAINT shift_versions_break_chk CHECK (break_minutes >= 0 AND break_minutes < (EXTRACT(EPOCH FROM (end_time-start_time))/60 + end_day_offset*1440)),
        CONSTRAINT shift_versions_days_chk CHECK (working_days IS NULL OR (cardinality(working_days) BETWEEN 1 AND 7 AND working_days <@ ARRAY[1,2,3,4,5,6,7] AND array_position(working_days,NULL) IS NULL)),
        CONSTRAINT shift_versions_range_chk CHECK (effective_to IS NULL OR effective_to > effective_from)
      )
    `);
    await q.query(`
      CREATE TABLE branch_shift_assignments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
        branch_id uuid NOT NULL, shift_id uuid NOT NULL, shift_version_id uuid NOT NULL,
        effective_from date NOT NULL, effective_to date,
        created_at timestamptz NOT NULL DEFAULT now(), created_by uuid NOT NULL,
        CONSTRAINT branch_shift_version_fk FOREIGN KEY(company_id,shift_id,shift_version_id) REFERENCES shift_versions(company_id,shift_id,id),
        CONSTRAINT branch_shift_branch_fk FOREIGN KEY(company_id,branch_id) REFERENCES branches(company_id,id),
        CONSTRAINT branch_shift_range_chk CHECK (effective_to IS NULL OR effective_to > effective_from),
        CONSTRAINT branch_shift_start_uq UNIQUE(company_id,branch_id,shift_id,effective_from)
      )
    `);
    await q.query(`
      CREATE TABLE shift_assignments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
        employee_id uuid NOT NULL, branch_id uuid NOT NULL,
        shift_id uuid NOT NULL, shift_version_id uuid NOT NULL,
        start_date date NOT NULL, end_date date,
        created_at timestamptz NOT NULL DEFAULT now(), created_by uuid NOT NULL,
        CONSTRAINT employee_shift_version_fk FOREIGN KEY(company_id,shift_id,shift_version_id) REFERENCES shift_versions(company_id,shift_id,id),
        CONSTRAINT employee_shift_employee_fk FOREIGN KEY(employee_id,company_id) REFERENCES employees(id,company_id),
        CONSTRAINT employee_shift_branch_fk FOREIGN KEY(company_id,branch_id) REFERENCES branches(company_id,id),
        CONSTRAINT employee_shift_range_chk CHECK (end_date IS NULL OR end_date > start_date)
      )
    `);
    await q.query(
      `CREATE INDEX shift_assignment_lookup_idx ON shift_assignments(company_id,employee_id,start_date,end_date)`,
    );
  }

  async down(q: QueryRunner): Promise<void> {
    for (const name of [
      'shift_assignments',
      'branch_shift_assignments',
      'shift_versions',
      'shifts',
      'holiday_occurrence_overrides',
      'holidays',
      'holiday_calendars',
      'attendance_policies',
      'company_workweeks',
    ]) {
      await q.query(`DROP TABLE ${name}`);
    }
  }
}
