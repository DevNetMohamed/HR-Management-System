import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { validDate } from '../../domain/value-objects/calendar-date';
import { resolveHolidayOccurrences } from '../../domain/holidays/holiday-occurrences';
import type { HolidayOccurrence } from '../../domain/time-configuration.models';
import type { TimeConfigurationRepository } from '../../application/ports/time-configuration.repository';
import type { AuthenticatedPrincipal } from '../../../OvertimeRequest/application/ports/authorization.gateway';
import {
  AttendancePolicyDto,
  CalendarDto,
  DateRangeQuery,
  HolidayDto,
  HolidayOverrideDto,
  WorkweekDto,
} from '../../application/dto/time.requests';

export function requireDate(value: string): void {
  if (!validDate(value)) throw new BadRequestException('Invalid calendar date');
}

type HolidayRow = {
  id: string;
  name: string;
  branch_id: string | null;
  recurrence: 'once' | 'yearly';
  start_date: string | null;
  end_date: string | null;
  start_month: number | null;
  start_day: number | null;
  duration_days: number | null;
  first_year: number | null;
  last_year: number | null;
};

type OverrideRow = {
  holiday_id: string;
  occurrence_year: number;
  status: 'modified' | 'cancelled';
  start_date: string | null;
  end_date: string | null;
};

type CalendarRow = {
  id: string;
  name: string;
  timezone: string;
  createdAt: Date;
};
type WorkweekRow = { id: string; working_days: number[] };
export type AttendancePolicyRow = {
  id: string;
  overtime_enabled: boolean;
  overtime_min_minutes: number;
  overtime_max_minutes: number | null;
};

@Injectable()
export class SqlTimeConfigurationRepository implements TimeConfigurationRepository {
  constructor(private readonly ds: DataSource) {}

  async branchExists(companyId: string, branchId: string): Promise<boolean> {
    const rows = await this.ds.query<{ ok: boolean }[]>(
      `SELECT EXISTS(SELECT 1 FROM branches WHERE company_id=$1 AND id=$2 AND deleted_at IS NULL) AS ok`,
      [companyId, branchId],
    );
    return rows[0]?.ok === true;
  }

  async employeeBranch(
    companyId: string,
    employeeId: string,
  ): Promise<string | null> {
    const rows = await this.ds.query<{ branch_id: string | null }[]>(
      `SELECT branch_id FROM employees WHERE company_id=$1 AND id=$2 AND deleted_at IS NULL`,
      [companyId, employeeId],
    );
    if (!rows.length)
      throw new NotFoundException('Employee not found in this company');
    return rows[0].branch_id;
  }

  async createCalendar(p: AuthenticatedPrincipal, dto: CalendarDto) {
    try {
      new Intl.DateTimeFormat('en', { timeZone: dto.timezone });
    } catch {
      throw new BadRequestException('Invalid IANA timezone');
    }
    try {
      const rows = await this.ds.query<{ id: string }[]>(
        `INSERT INTO holiday_calendars(company_id,name,timezone,created_by)
         VALUES($1,$2,$3,$4) RETURNING id`,
        [p.companyId, dto.name.trim(), dto.timezone, p.userId],
      );
      return { id: rows[0].id };
    } catch (e) {
      if ((e as { code?: string }).code === '23505')
        throw new ConflictException('Company calendar already exists');
      throw e;
    }
  }

  async getCalendar(companyId: string): Promise<CalendarRow | null> {
    const rows = await this.ds.query<CalendarRow[]>(
      `SELECT id,name,timezone,created_at AS "createdAt" FROM holiday_calendars WHERE company_id=$1`,
      [companyId],
    );
    return rows[0] ?? null;
  }

  private async calendarId(companyId: string): Promise<string> {
    const calendar = await this.getCalendar(companyId);
    if (!calendar)
      throw new ConflictException('Company holiday calendar is not configured');
    return calendar.id;
  }

  async createHoliday(p: AuthenticatedPrincipal, dto: HolidayDto) {
    if (dto.branchId && !(await this.branchExists(p.companyId, dto.branchId))) {
      throw new NotFoundException('Branch not found in this company');
    }
    const calendarId = await this.calendarId(p.companyId);
    const rows = await this.ds.query<{ id: string }[]>(
      `INSERT INTO holidays(company_id,calendar_id,branch_id,name,recurrence,start_date,end_date,
       start_month,start_day,duration_days,first_year,last_year,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [
        p.companyId,
        calendarId,
        dto.branchId ?? null,
        dto.name.trim(),
        dto.recurrence,
        dto.startDate ?? null,
        dto.endDate ?? null,
        dto.startMonth ?? null,
        dto.startDay ?? null,
        dto.durationDays ?? null,
        dto.firstYear ?? null,
        dto.lastYear ?? null,
        p.userId,
      ],
    );
    return { id: rows[0].id };
  }

  async updateHoliday(p: AuthenticatedPrincipal, id: string, dto: HolidayDto) {
    if (dto.branchId && !(await this.branchExists(p.companyId, dto.branchId))) {
      throw new NotFoundException('Branch not found in this company');
    }
    const existing = await this.ds.query<HolidayRow[]>(
      `SELECT * FROM holidays WHERE company_id=$1 AND id=$2 AND status='active'`,
      [p.companyId, id],
    );
    if (!existing.length)
      throw new NotFoundException('Active holiday not found');
    const old = existing[0];
    const today = new Date().toISOString().slice(0, 10);
    if (dto.recurrence === 'once' && dto.startDate! < today) {
      throw new ConflictException('Cannot move a holiday into the past');
    }
    if (
      old.recurrence === 'yearly' &&
      dto.recurrence === 'yearly' &&
      dto.firstYear! < old.first_year!
    ) {
      throw new ConflictException(
        'New recurrence cannot start before the original',
      );
    }
    if (
      old.recurrence === 'yearly' &&
      dto.recurrence === 'yearly' &&
      dto.firstYear! > old.first_year!
    ) {
      const oldOccurrence = `${dto.firstYear}-${String(old.start_month).padStart(2, '0')}-${String(old.start_day).padStart(2, '0')}`;
      if (validDate(oldOccurrence) && oldOccurrence < today) {
        throw new ConflictException(
          'New version cannot rewrite an occurred year',
        );
      }
      if (old.last_year && dto.firstYear! > old.last_year + 1) {
        throw new BadRequestException(
          'New version must start within the existing recurrence',
        );
      }
      const q = this.ds.createQueryRunner();
      await q.connect();
      await q.startTransaction();
      try {
        await q.query(
          `UPDATE holidays SET last_year=$3,status='ended',updated_at=now(),updated_by=$4
          WHERE company_id=$1 AND id=$2 AND status='active'`,
          [p.companyId, id, dto.firstYear! - 1, p.userId],
        );
        const rows = await q.manager.query<{ id: string }[]>(
          `INSERT INTO holidays(company_id,calendar_id,branch_id,name,recurrence,start_month,start_day,
           duration_days,first_year,last_year,created_by)
           VALUES($1,$2,$3,$4,'yearly',$5,$6,$7,$8,$9,$10) RETURNING id`,
          [
            p.companyId,
            await this.calendarId(p.companyId),
            dto.branchId ?? null,
            dto.name.trim(),
            dto.startMonth,
            dto.startDay,
            dto.durationDays,
            dto.firstYear,
            dto.lastYear ?? null,
            p.userId,
          ],
        );
        await q.query(
          `UPDATE holiday_occurrence_overrides SET holiday_id=$3
           WHERE company_id=$1 AND holiday_id=$2 AND occurrence_year >= $4`,
          [p.companyId, id, rows[0].id, dto.firstYear],
        );
        await q.commitTransaction();
        return { id: rows[0].id, replaces: id };
      } catch (e) {
        await q.rollbackTransaction();
        throw e;
      } finally {
        await q.release();
      }
    }
    const currentOccurrence =
      old.recurrence === 'yearly'
        ? `${today.slice(0, 4)}-${String(old.start_month).padStart(2, '0')}-${String(old.start_day).padStart(2, '0')}`
        : null;
    if (
      (old.recurrence === 'once' && old.start_date! < today) ||
      (old.recurrence === 'yearly' &&
        (old.first_year! < Number(today.slice(0, 4)) ||
          (old.first_year! === Number(today.slice(0, 4)) &&
            validDate(currentOccurrence!) &&
            currentOccurrence! < today)))
    ) {
      throw new ConflictException(
        'Past holiday occurrences cannot be rewritten; create a future yearly version',
      );
    }
    const rows = await this.ds.query<{ id: string }[]>(
      `UPDATE holidays SET name=$3,branch_id=$4,recurrence=$5,start_date=$6,end_date=$7,
       start_month=$8,start_day=$9,duration_days=$10,first_year=$11,last_year=$12,
       updated_at=now(),updated_by=$13 WHERE company_id=$1 AND id=$2 AND status='active' RETURNING id`,
      [
        p.companyId,
        id,
        dto.name.trim(),
        dto.branchId ?? null,
        dto.recurrence,
        dto.startDate ?? null,
        dto.endDate ?? null,
        dto.startMonth ?? null,
        dto.startDay ?? null,
        dto.durationDays ?? null,
        dto.firstYear ?? null,
        dto.lastYear ?? null,
        p.userId,
      ],
    );
    if (!rows.length) throw new NotFoundException('Active holiday not found');
    return { id };
  }

  async cancelHoliday(
    p: AuthenticatedPrincipal,
    id: string,
    reason: string,
  ): Promise<void> {
    const existing = await this.ds.query<HolidayRow[]>(
      `SELECT * FROM holidays WHERE company_id=$1 AND id=$2 AND status='active'`,
      [p.companyId, id],
    );
    if (!existing.length)
      throw new NotFoundException('Active holiday not found');
    const old = existing[0];
    const today = new Date().toISOString().slice(0, 10);
    if (old.recurrence === 'once' && old.start_date! < today) {
      throw new ConflictException('Past holiday cannot be cancelled');
    }
    let lastYear: number | null = null;
    let status = 'cancelled';
    if (old.recurrence === 'yearly') {
      const year = Number(today.slice(0, 4));
      const start = `${year}-${String(old.start_month).padStart(2, '0')}-${String(old.start_day).padStart(2, '0')}`;
      lastYear = validDate(start) && start < today ? year : year - 1;
      if (old.last_year && lastYear > old.last_year) lastYear = old.last_year;
      if (lastYear >= old.first_year!) status = 'ended';
      else lastYear = null;
    }
    const rows = await this.ds.query<{ id: string }[]>(
      `UPDATE holidays SET status=$3,last_year=CASE WHEN recurrence='yearly' THEN $4 ELSE last_year END,
       cancellation_reason=$5,cancelled_at=now(),cancelled_by=$6,updated_at=now(),updated_by=$6
       WHERE company_id=$1 AND id=$2 AND status='active' RETURNING id`,
      [p.companyId, id, status, lastYear, reason.trim(), p.userId],
    );
    if (!rows.length) throw new NotFoundException('Active holiday not found');
  }

  async overrideHoliday(
    p: AuthenticatedPrincipal,
    id: string,
    dto: HolidayOverrideDto,
  ) {
    const rows = await this.ds.query<HolidayRow[]>(
      `SELECT * FROM holidays WHERE company_id=$1 AND id=$2 AND status='active'`,
      [p.companyId, id],
    );
    const holiday = rows[0];
    if (!holiday || holiday.recurrence !== 'yearly')
      throw new NotFoundException('Active yearly holiday not found');
    if (
      dto.year < holiday.first_year! ||
      (holiday.last_year && dto.year > holiday.last_year)
    ) {
      throw new BadRequestException('Year outside holiday recurrence');
    }
    if (dto.year < Number(new Date().toISOString().slice(0, 4))) {
      throw new ConflictException('Past holiday occurrences cannot be changed');
    }
    const today = new Date().toISOString().slice(0, 10);
    const occurrenceStart = `${dto.year}-${String(holiday.start_month).padStart(2, '0')}-${String(holiday.start_day).padStart(2, '0')}`;
    if (validDate(occurrenceStart) && occurrenceStart < today) {
      throw new ConflictException('Occurred holiday cannot be changed');
    }
    if (dto.status === 'modified') {
      requireDate(dto.startDate!);
      requireDate(dto.endDate!);
      if (dto.endDate! < dto.startDate!)
        throw new BadRequestException('End date precedes start date');
      if (dto.startDate! < today)
        throw new ConflictException('Cannot move a holiday into the past');
      if (Number(dto.startDate!.slice(0, 4)) !== dto.year)
        throw new BadRequestException(
          'Modified occurrence must start in its recurrence year',
        );
    } else if (dto.startDate !== undefined || dto.endDate !== undefined) {
      throw new BadRequestException('Cancelled occurrence cannot have dates');
    }
    await this.ds.query(
      `INSERT INTO holiday_occurrence_overrides(company_id,holiday_id,occurrence_year,status,start_date,end_date,reason,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT(holiday_id,occurrence_year) DO UPDATE SET status=EXCLUDED.status,
       start_date=EXCLUDED.start_date,end_date=EXCLUDED.end_date,reason=EXCLUDED.reason,
       created_at=now(),created_by=EXCLUDED.created_by`,
      [
        p.companyId,
        id,
        dto.year,
        dto.status,
        dto.startDate ?? null,
        dto.endDate ?? null,
        dto.reason.trim(),
        p.userId,
      ],
    );
    return { holidayId: id, year: dto.year };
  }

  async listHolidays(
    companyId: string,
    query: DateRangeQuery,
  ): Promise<HolidayOccurrence[]> {
    requireDate(query.from);
    requireDate(query.to);
    if (query.to < query.from)
      throw new BadRequestException('End date precedes start date');
    if (Number(query.to.slice(0, 4)) - Number(query.from.slice(0, 4)) > 5) {
      throw new BadRequestException('Range cannot exceed six calendar years');
    }
    const holidays = await this.ds.query<HolidayRow[]>(
      `SELECT * FROM holidays WHERE company_id=$1 AND status IN ('active','ended') AND (branch_id IS NULL OR branch_id=$2)`,
      [companyId, query.branchId ?? null],
    );
    const overrides = await this.ds.query<OverrideRow[]>(
      `SELECT o.* FROM holiday_occurrence_overrides o JOIN holidays h ON h.id=o.holiday_id
       WHERE h.company_id=$1 AND h.status IN ('active','ended')`,
      [companyId],
    );
    return resolveHolidayOccurrences(
      holidays.map((holiday) => ({
        id: holiday.id,
        name: holiday.name,
        branchId: holiday.branch_id,
        recurrence: holiday.recurrence,
        startDate: holiday.start_date,
        endDate: holiday.end_date,
        startMonth: holiday.start_month,
        startDay: holiday.start_day,
        durationDays: holiday.duration_days,
        firstYear: holiday.first_year,
        lastYear: holiday.last_year,
      })),
      overrides.map((override) => ({
        holidayId: override.holiday_id,
        year: override.occurrence_year,
        status: override.status,
        startDate: override.start_date,
        endDate: override.end_date,
      })),
      query.from,
      query.to,
    );
  }

  private async appendEffective(
    q: QueryRunner,
    table: 'company_workweeks' | 'attendance_policies',
    companyId: string,
    date: string,
    branchId?: string,
  ): Promise<number> {
    await q.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [
      `${table}:${companyId}`,
    ]);
    const previous = await q.manager.query<
      { id: string; effective_from: string; version?: number }[]
    >(
      `SELECT id,effective_from FROM ${table}
       WHERE company_id=$1 AND branch_id IS NOT DISTINCT FROM $2::uuid
       ORDER BY effective_from DESC LIMIT 1 FOR UPDATE`,
      [companyId, branchId ?? null],
    );
    if (previous[0] && previous[0].effective_from >= date) {
      throw new ConflictException(
        'Effective date must follow the latest configuration',
      );
    }
    if (previous[0])
      await q.query(`UPDATE ${table} SET effective_to=$2 WHERE id=$1`, [
        previous[0].id,
        date,
      ]);
    if (table === 'attendance_policies') {
      const max = await q.manager.query<{ version: number }[]>(
        `SELECT COALESCE(MAX(version),0)+1 AS version FROM attendance_policies WHERE company_id=$1`,
        [companyId],
      );
      return max[0].version;
    }
    return 1;
  }

  async setWorkweek(p: AuthenticatedPrincipal, dto: WorkweekDto) {
    if (dto.branchId && !(await this.branchExists(p.companyId, dto.branchId)))
      throw new NotFoundException('Branch not found in this company');
    const q = this.ds.createQueryRunner();
    await q.connect();
    await q.startTransaction();
    try {
      await this.appendEffective(
        q,
        'company_workweeks',
        p.companyId,
        dto.effectiveFrom,
        dto.branchId,
      );
      const rows = await q.manager.query<{ id: string }[]>(
        `INSERT INTO company_workweeks(company_id,branch_id,working_days,first_day_of_week,standard_daily_minutes,effective_from,created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [
          p.companyId,
          dto.branchId ?? null,
          dto.workingDays,
          dto.firstDayOfWeek,
          dto.standardDailyMinutes,
          dto.effectiveFrom,
          p.userId,
        ],
      );
      await q.commitTransaction();
      return { id: rows[0].id };
    } catch (e) {
      await q.rollbackTransaction();
      throw e;
    } finally {
      await q.release();
    }
  }

  async setAttendancePolicy(
    p: AuthenticatedPrincipal,
    dto: AttendancePolicyDto,
  ) {
    if (dto.branchId && !(await this.branchExists(p.companyId, dto.branchId)))
      throw new NotFoundException('Branch not found in this company');
    const q = this.ds.createQueryRunner();
    await q.connect();
    await q.startTransaction();
    try {
      const version = await this.appendEffective(
        q,
        'attendance_policies',
        p.companyId,
        dto.effectiveFrom,
        dto.branchId,
      );
      const rows = await q.manager.query<{ id: string }[]>(
        `INSERT INTO attendance_policies(company_id,branch_id,name,version,grace_minutes_late,early_leave_grace_min,
         half_day_after_min,absent_after_min,overtime_enabled,overtime_min_minutes,overtime_max_minutes,
         overtime_multiplier,overtime_requires_approval,require_geofence,allow_remote,absence_rule,effective_from,created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id`,
        [
          p.companyId,
          dto.branchId ?? null,
          dto.name.trim(),
          version,
          dto.graceMinutesLate,
          dto.earlyLeaveGraceMin,
          dto.halfDayAfterMin ?? null,
          dto.absentAfterMin ?? null,
          dto.overtimeEnabled,
          dto.overtimeMinMinutes,
          dto.overtimeMaxMinutes ?? null,
          dto.overtimeMultiplier,
          dto.overtimeRequiresApproval,
          dto.requireGeofence,
          dto.allowRemote,
          dto.absenceRule,
          dto.effectiveFrom,
          p.userId,
        ],
      );
      await q.commitTransaction();
      return { id: rows[0].id, version };
    } catch (e) {
      await q.rollbackTransaction();
      throw e;
    } finally {
      await q.release();
    }
  }

  async effectiveConfig(companyId: string, date: string, branchId?: string) {
    requireDate(date);
    const [workweeks, policies] = await Promise.all([
      this.ds.query<WorkweekRow[]>(
        `SELECT * FROM company_workweeks WHERE company_id=$1 AND (branch_id=$3 OR branch_id IS NULL)
         AND effective_from <= $2 AND (effective_to IS NULL OR effective_to > $2)
         ORDER BY CASE WHEN branch_id=$3 THEN 0 ELSE 1 END,effective_from DESC LIMIT 1`,
        [companyId, date, branchId ?? null],
      ),
      this.ds.query<AttendancePolicyRow[]>(
        `SELECT * FROM attendance_policies WHERE company_id=$1 AND (branch_id=$3 OR branch_id IS NULL)
         AND effective_from <= $2 AND (effective_to IS NULL OR effective_to > $2)
         ORDER BY CASE WHEN branch_id=$3 THEN 0 ELSE 1 END,effective_from DESC LIMIT 1`,
        [companyId, date, branchId ?? null],
      ),
    ]);
    return {
      workweek: workweeks[0] ?? null,
      attendancePolicy: policies[0] ?? null,
    };
  }

  async resolveDay(companyId: string, date: string, branchId?: string) {
    requireDate(date);
    if (branchId && !(await this.branchExists(companyId, branchId)))
      throw new NotFoundException('Branch not found in this company');
    const [config, holidays, calendar] = await Promise.all([
      this.effectiveConfig(companyId, date, branchId),
      this.listHolidays(companyId, { from: date, to: date, branchId }),
      this.getCalendar(companyId),
    ]);
    if (!calendar)
      throw new ConflictException('Company holiday calendar is not configured');
    if (!config.workweek)
      throw new ConflictException(
        'Company workweek is not configured for this date',
      );
    const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay() || 7;
    const isWeekend = !config.workweek.working_days.includes(weekday);
    return {
      date,
      branchId: branchId ?? null,
      weekday,
      isWeekend,
      holidays,
      isWorkingDay: !isWeekend && holidays.length === 0,
      workweekId: config.workweek.id,
      attendancePolicyId: config.attendancePolicy?.id ?? null,
    };
  }
}
