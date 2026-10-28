import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import type { AuthenticatedPrincipal } from '../../../OvertimeRequest/application/ports/authorization.gateway';
import {
  BranchShiftDto,
  EmployeeShiftDto,
  ShiftDto,
} from '../../application/dto/time.requests';
import type { ShiftsRepository } from '../../application/ports/shifts.repository';
import {
  requireDate,
  SqlTimeConfigurationRepository,
} from './sql-time-configuration.repository';

export type ResolvedShift = {
  assignmentId: string;
  branchId: string;
  shiftId: string;
  code: string;
  versionId: string;
  version: number;
  name: string;
  startTime: string;
  endTime: string;
  endDayOffset: number;
  breakMinutes: number;
  workingDays: number[] | null;
  grossMinutes: number;
  netMinutes: number;
  isNightShift: boolean;
};

@Injectable()
export class SqlShiftsRepository implements ShiftsRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly time: SqlTimeConfigurationRepository,
  ) {}

  private async insertVersion(
    q: QueryRunner,
    p: AuthenticatedPrincipal,
    shiftId: string,
    dto: ShiftDto,
    version: number,
    offset: number,
  ) {
    const rows = await q.manager.query<{ id: string }[]>(
      `INSERT INTO shift_versions(company_id,shift_id,version,name,start_time,end_time,end_day_offset,
       break_minutes,working_days,effective_from,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [
        p.companyId,
        shiftId,
        version,
        dto.name.trim(),
        dto.startTime,
        dto.endTime,
        offset,
        dto.breakMinutes,
        dto.workingDays ?? null,
        dto.effectiveFrom,
        p.userId,
      ],
    );
    return rows[0].id;
  }

  async create(p: AuthenticatedPrincipal, dto: ShiftDto, offset: number) {
    const q = this.ds.createQueryRunner();
    await q.connect();
    await q.startTransaction();
    try {
      const rows = await q.manager.query<{ id: string }[]>(
        `INSERT INTO shifts(company_id,code,created_by) VALUES($1,$2,$3) RETURNING id`,
        [p.companyId, dto.code.trim(), p.userId],
      );
      const versionId = await this.insertVersion(
        q,
        p,
        rows[0].id,
        dto,
        1,
        offset,
      );
      await q.commitTransaction();
      return { id: rows[0].id, versionId, version: 1 };
    } catch (e) {
      await q.rollbackTransaction();
      if ((e as { code?: string }).code === '23505')
        throw new ConflictException('Shift code already exists');
      throw e;
    } finally {
      await q.release();
    }
  }

  async addVersion(
    p: AuthenticatedPrincipal,
    shiftId: string,
    dto: ShiftDto,
    offset: number,
  ) {
    const q = this.ds.createQueryRunner();
    await q.connect();
    await q.startTransaction();
    try {
      await q.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [
        `shift:${p.companyId}:${shiftId}`,
      ]);
      const shifts = await q.manager.query<{ code: string }[]>(
        `SELECT code FROM shifts WHERE company_id=$1 AND id=$2 AND retired_at IS NULL`,
        [p.companyId, shiftId],
      );
      if (!shifts.length) throw new NotFoundException('Shift not found');
      if (shifts[0].code !== dto.code.trim())
        throw new BadRequestException('Shift code cannot change');
      const previous = await q.manager.query<
        { id: string; version: number; effective_from: string }[]
      >(
        `SELECT id,version,effective_from FROM shift_versions WHERE company_id=$1 AND shift_id=$2
         ORDER BY version DESC LIMIT 1 FOR UPDATE`,
        [p.companyId, shiftId],
      );
      if (previous[0].effective_from >= dto.effectiveFrom)
        throw new ConflictException(
          'Effective date must follow latest version',
        );
      await q.query(`UPDATE shift_versions SET effective_to=$2 WHERE id=$1`, [
        previous[0].id,
        dto.effectiveFrom,
      ]);
      const version = previous[0].version + 1;
      const versionId = await this.insertVersion(
        q,
        p,
        shiftId,
        dto,
        version,
        offset,
      );
      await q.commitTransaction();
      return { id: shiftId, versionId, version };
    } catch (e) {
      await q.rollbackTransaction();
      throw e;
    } finally {
      await q.release();
    }
  }

  async list(companyId: string, onDate?: string) {
    if (onDate) requireDate(onDate);
    return this.ds.query<Record<string, unknown>[]>(
      `SELECT s.id,s.code,s.retired_at AS "retiredAt",v.id AS "versionId",v.version,v.name,v.start_time AS "startTime",
       v.end_time AS "endTime",v.end_day_offset AS "endDayOffset",v.break_minutes AS "breakMinutes",
       v.working_days AS "workingDays",v.effective_from AS "effectiveFrom",v.effective_to AS "effectiveTo",
       (EXTRACT(EPOCH FROM (v.end_time-v.start_time))/60+v.end_day_offset*1440)::integer AS "grossMinutes",
       (EXTRACT(EPOCH FROM (v.end_time-v.start_time))/60+v.end_day_offset*1440-v.break_minutes)::integer AS "netMinutes",
       (v.end_day_offset=1) AS "isNightShift",
       ARRAY(SELECT DISTINCT b.branch_id FROM branch_shift_assignments b WHERE b.company_id=s.company_id
         AND b.shift_id=s.id AND b.shift_version_id=v.id
         AND ($2::date IS NULL OR (b.effective_from <= $2 AND (b.effective_to IS NULL OR b.effective_to > $2)))) AS "branchIds"
       FROM shifts s JOIN shift_versions v ON v.shift_id=s.id AND v.company_id=s.company_id
       WHERE s.company_id=$1 AND ($2::date IS NULL OR (v.effective_from <= $2 AND (v.effective_to IS NULL OR v.effective_to > $2)))
       ORDER BY s.code,v.version`,
      [companyId, onDate ?? null],
    );
  }

  private async version(companyId: string, versionId: string) {
    const rows = await this.ds.query<
      {
        shift_id: string;
        effective_from: string;
        effective_to: string | null;
      }[]
    >(
      `SELECT v.shift_id,v.effective_from,v.effective_to FROM shift_versions v
       JOIN shifts s ON s.id=v.shift_id AND s.company_id=v.company_id
       WHERE v.company_id=$1 AND v.id=$2 AND s.retired_at IS NULL`,
      [companyId, versionId],
    );
    if (!rows.length) throw new NotFoundException('Shift version not found');
    return rows[0];
  }

  async assignBranch(
    p: AuthenticatedPrincipal,
    shiftId: string,
    dto: BranchShiftDto,
  ) {
    requireDate(dto.effectiveFrom);
    if (dto.effectiveTo) requireDate(dto.effectiveTo);
    if (dto.effectiveTo && dto.effectiveTo <= dto.effectiveFrom)
      throw new BadRequestException('Invalid effective range');
    if (!(await this.time.branchExists(p.companyId, dto.branchId)))
      throw new NotFoundException('Branch not found');
    const v = await this.version(p.companyId, dto.shiftVersionId);
    if (
      v.shift_id !== shiftId ||
      dto.effectiveFrom < v.effective_from ||
      (v.effective_to && (!dto.effectiveTo || dto.effectiveTo > v.effective_to))
    ) {
      throw new BadRequestException(
        'Assignment must fit shift version effective range',
      );
    }
    const q = this.ds.createQueryRunner();
    await q.connect();
    await q.startTransaction();
    try {
      await q.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [
        `branch-shift:${p.companyId}:${dto.branchId}:${shiftId}`,
      ]);
      const overlap = await q.manager.query<{ id: string }[]>(
        `SELECT id FROM branch_shift_assignments WHERE company_id=$1 AND branch_id=$2 AND shift_id=$3
         AND effective_from < COALESCE($5::date,'infinity'::date)
         AND COALESCE(effective_to,'infinity'::date) > $4::date LIMIT 1`,
        [
          p.companyId,
          dto.branchId,
          shiftId,
          dto.effectiveFrom,
          dto.effectiveTo ?? null,
        ],
      );
      if (overlap.length)
        throw new ConflictException('Overlapping branch shift assignment');
      const rows = await q.manager.query<{ id: string }[]>(
        `INSERT INTO branch_shift_assignments(company_id,branch_id,shift_id,shift_version_id,effective_from,effective_to,created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [
          p.companyId,
          dto.branchId,
          shiftId,
          dto.shiftVersionId,
          dto.effectiveFrom,
          dto.effectiveTo ?? null,
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

  async assignEmployee(p: AuthenticatedPrincipal, dto: EmployeeShiftDto) {
    requireDate(dto.startDate);
    if (dto.endDate) requireDate(dto.endDate);
    if (dto.endDate && dto.endDate <= dto.startDate)
      throw new BadRequestException('Invalid assignment range');
    const v = await this.version(p.companyId, dto.shiftVersionId);
    if (
      dto.startDate < v.effective_from ||
      (v.effective_to && (!dto.endDate || dto.endDate > v.effective_to))
    ) {
      throw new BadRequestException(
        'Assignment must fit shift version effective range',
      );
    }
    const employees = await this.ds.query<{ branch_id: string | null }[]>(
      `SELECT branch_id FROM employees WHERE company_id=$1 AND id=$2 AND deleted_at IS NULL AND status='active'`,
      [p.companyId, dto.employeeId],
    );
    if (!employees.length || employees[0].branch_id !== dto.branchId)
      throw new NotFoundException('Active employee in branch not found');
    const branches = await this.ds.query<{ id: string }[]>(
      `SELECT id FROM branch_shift_assignments WHERE company_id=$1 AND branch_id=$2 AND shift_id=$3 AND shift_version_id=$4
       AND effective_from <= $5 AND (effective_to IS NULL OR effective_to >= COALESCE($6::date,'infinity'::date)) LIMIT 1`,
      [
        p.companyId,
        dto.branchId,
        v.shift_id,
        dto.shiftVersionId,
        dto.startDate,
        dto.endDate ?? null,
      ],
    );
    if (!branches.length)
      throw new BadRequestException(
        'Shift version is not assigned to this branch for the full period',
      );
    const q = this.ds.createQueryRunner();
    await q.connect();
    await q.startTransaction();
    try {
      await q.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [
        `employee-shift:${p.companyId}:${dto.employeeId}`,
      ]);
      const overlap = await q.manager.query<{ id: string }[]>(
        `SELECT id FROM shift_assignments WHERE company_id=$1 AND employee_id=$2
         AND start_date < COALESCE($4::date,'infinity'::date)
         AND COALESCE(end_date,'infinity'::date) > $3::date LIMIT 1`,
        [p.companyId, dto.employeeId, dto.startDate, dto.endDate ?? null],
      );
      if (overlap.length)
        throw new ConflictException(
          'Employee already has a shift in this period',
        );
      const rows = await q.manager.query<{ id: string }[]>(
        `INSERT INTO shift_assignments(company_id,employee_id,branch_id,shift_id,shift_version_id,start_date,end_date,created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [
          p.companyId,
          dto.employeeId,
          dto.branchId,
          v.shift_id,
          dto.shiftVersionId,
          dto.startDate,
          dto.endDate ?? null,
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

  async resolveEmployeeShift(
    companyId: string,
    employeeId: string,
    date: string,
  ): Promise<ResolvedShift | null> {
    requireDate(date);
    const rows = await this.ds.query<ResolvedShift[]>(
      `SELECT a.id AS "assignmentId",a.branch_id AS "branchId",s.id AS "shiftId",s.code,
       v.id AS "versionId",v.version,v.name,v.start_time AS "startTime",v.end_time AS "endTime",
       v.end_day_offset AS "endDayOffset",v.break_minutes AS "breakMinutes",v.working_days AS "workingDays",
       (EXTRACT(EPOCH FROM (v.end_time-v.start_time))/60+v.end_day_offset*1440)::integer AS "grossMinutes",
       (EXTRACT(EPOCH FROM (v.end_time-v.start_time))/60+v.end_day_offset*1440-v.break_minutes)::integer AS "netMinutes",
       (v.end_day_offset=1) AS "isNightShift"
       FROM shift_assignments a JOIN shifts s ON s.id=a.shift_id AND s.company_id=a.company_id
       JOIN shift_versions v ON v.id=a.shift_version_id AND v.company_id=a.company_id
       WHERE a.company_id=$1 AND a.employee_id=$2 AND a.start_date <= $3
       AND (a.end_date IS NULL OR a.end_date > $3) LIMIT 1`,
      [companyId, employeeId, date],
    );
    return rows[0] ?? null;
  }

  async endBranchAssignment(
    p: AuthenticatedPrincipal,
    id: string,
    endDate: string,
  ) {
    requireDate(endDate);
    const q = this.ds.createQueryRunner();
    await q.connect();
    await q.startTransaction();
    try {
      const rows = await q.manager.query<
        { branch_id: string; shift_id: string; shift_version_id: string }[]
      >(
        `SELECT branch_id,shift_id,shift_version_id FROM branch_shift_assignments WHERE company_id=$1 AND id=$2
         AND effective_from < $3 AND (effective_to IS NULL OR effective_to > $3) FOR UPDATE`,
        [p.companyId, id, endDate],
      );
      if (!rows.length)
        throw new NotFoundException(
          'Active branch assignment not found or invalid end date',
        );
      const a = rows[0];
      const dependent = await q.manager.query<{ id: string }[]>(
        `SELECT id FROM shift_assignments WHERE company_id=$1 AND branch_id=$2 AND shift_id=$3
         AND shift_version_id=$4 AND (end_date IS NULL OR end_date > $5) LIMIT 1`,
        [p.companyId, a.branch_id, a.shift_id, a.shift_version_id, endDate],
      );
      if (dependent.length)
        throw new ConflictException('End employee shift assignments first');
      await q.query(
        `UPDATE branch_shift_assignments SET effective_to=$2 WHERE id=$1`,
        [id, endDate],
      );
      await q.commitTransaction();
      return { id, endDate };
    } catch (e) {
      await q.rollbackTransaction();
      throw e;
    } finally {
      await q.release();
    }
  }

  async endEmployeeAssignment(
    p: AuthenticatedPrincipal,
    id: string,
    endDate: string,
  ) {
    requireDate(endDate);
    const rows = await this.ds.query<{ id: string }[]>(
      `UPDATE shift_assignments SET end_date=$3 WHERE company_id=$1 AND id=$2
       AND start_date < $3 AND (end_date IS NULL OR end_date > $3) RETURNING id`,
      [p.companyId, id, endDate],
    );
    if (!rows.length)
      throw new NotFoundException(
        'Active employee assignment not found or invalid end date',
      );
    return { id, endDate };
  }

  async retire(p: AuthenticatedPrincipal, shiftId: string): Promise<void> {
    const q = this.ds.createQueryRunner();
    await q.connect();
    await q.startTransaction();
    try {
      const shifts = await q.manager.query<{ id: string }[]>(
        `SELECT id FROM shifts WHERE company_id=$1 AND id=$2 AND retired_at IS NULL FOR UPDATE`,
        [p.companyId, shiftId],
      );
      if (!shifts.length) throw new NotFoundException('Active shift not found');
      const active = await q.manager.query<{ id: string }[]>(
        `SELECT id FROM branch_shift_assignments WHERE company_id=$1 AND shift_id=$2
         AND (effective_to IS NULL OR effective_to > CURRENT_DATE)
         UNION ALL
         SELECT id FROM shift_assignments WHERE company_id=$1 AND shift_id=$2
         AND (end_date IS NULL OR end_date > CURRENT_DATE) LIMIT 1`,
        [p.companyId, shiftId],
      );
      if (active.length)
        throw new ConflictException(
          'End active branch and employee assignments first',
        );
      await q.query(
        `UPDATE shifts SET retired_at=now(),retired_by=$3 WHERE company_id=$1 AND id=$2`,
        [p.companyId, shiftId, p.userId],
      );
      await q.commitTransaction();
    } catch (e) {
      await q.rollbackTransaction();
      throw e;
    } finally {
      await q.release();
    }
  }
}
