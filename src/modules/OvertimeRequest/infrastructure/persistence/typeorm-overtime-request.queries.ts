import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OvertimeRequestStatus } from '../../domain/enums';
import type {
  HrOvertimeQueueQuery,
  ManagerOvertimeQueueQuery,
  MyOvertimeRequestsQuery,
  OvertimeRequestDetails,
  OvertimeRequestFilters,
  OvertimeRequestListItem,
  OvertimeRequestQueries,
  PaginatedResult,
} from '../../application/queries/overtime-request.queries';

interface CountRow {
  count: number;
}

@Injectable()
export class TypeOrmOvertimeRequestQueries implements OvertimeRequestQueries {
  constructor(private readonly dataSource: DataSource) {}

  async getDetails(
    companyId: string,
    requestId: string,
  ): Promise<OvertimeRequestDetails | null> {
    const rows = await this.dataSource.query<OvertimeRequestDetails[]>(
      `
        SELECT
          o.id,
          o.company_id AS "companyId",
          o.employee_id AS "employeeId",
          o.attendance_id AS "attendanceId",
          o.minutes,
          o.reason,
          o.status,
          o.manager_review_required AS "managerReviewRequired",
          o.manager_reviewed_by AS "managerReviewedBy",
          o.manager_reviewed_at AS "managerReviewedAt",
          o.hr_reviewed_by AS "hrReviewedBy",
          o.hr_reviewed_at AS "hrReviewedAt",
          o.version,
          o.created_at AS "createdAt",
          o.updated_at AS "updatedAt"
        FROM overtime_requests o
        WHERE o.company_id = $1
          AND o.id = $2
          AND o.deleted_at IS NULL
        LIMIT 1
      `,
      [companyId, requestId],
    );

    return rows[0] ?? null;
  }

  async listForEmployee(
    query: MyOvertimeRequestsQuery,
  ): Promise<PaginatedResult<OvertimeRequestListItem>> {
    const where = [
      'o.company_id = $1',
      'o.employee_id = $2',
      'o.deleted_at IS NULL',
    ];
    const params: unknown[] = [query.companyId, query.employeeId];

    this.addCommonFilters(where, params, query);

    return this.runPaged(where, params, query.page, query.limit);
  }

  async listManagerQueue(
    query: ManagerOvertimeQueueQuery,
  ): Promise<PaginatedResult<OvertimeRequestListItem>> {
    const where = [
      'o.company_id = $1',
      'e.manager_id = $2',
      'e.company_id = $1',
      'o.status = $3',
      'o.deleted_at IS NULL',
      'e.deleted_at IS NULL',
    ];
    const params: unknown[] = [
      query.companyId,
      query.managerEmployeeId,
      OvertimeRequestStatus.PENDING_MANAGER,
    ];

    this.addReviewFilters(where, params, query);

    return this.runPaged(
      where,
      params,
      query.page,
      query.limit,
      'JOIN employees e ON e.id = o.employee_id',
    );
  }

  async listHrQueue(
    query: HrOvertimeQueueQuery,
  ): Promise<PaginatedResult<OvertimeRequestListItem>> {
    const where = [
      'o.company_id = $1',
      'e.company_id = $1',
      'o.status = $2',
      'o.deleted_at IS NULL',
      'e.deleted_at IS NULL',
    ];
    const params: unknown[] = [
      query.companyId,
      OvertimeRequestStatus.PENDING_HR,
    ];

    this.addReviewFilters(where, params, query);

    return this.runPaged(
      where,
      params,
      query.page,
      query.limit,
      'JOIN employees e ON e.id = o.employee_id',
    );
  }

  private addCommonFilters(
    where: string[],
    params: unknown[],
    query: Pick<OvertimeRequestFilters, 'status' | 'from' | 'to'>,
  ): void {
    if (query.status) {
      this.addCondition(where, params, 'o.status = ?', query.status);
    }

    if (query.from) {
      this.addCondition(where, params, 'o.created_at >= ?::date', query.from);
    }

    if (query.to) {
      this.addCondition(
        where,
        params,
        "o.created_at < (?::date + INTERVAL '1 day')",
        query.to,
      );
    }
  }

  private addReviewFilters(
    where: string[],
    params: unknown[],
    query: OvertimeRequestFilters,
  ): void {
    if (query.employeeId) {
      this.addCondition(where, params, 'o.employee_id = ?', query.employeeId);
    }

    if (query.departmentId) {
      this.addCondition(
        where,
        params,
        'e.department_id = ?',
        query.departmentId,
      );
    }

    this.addCommonFilters(where, params, {
      from: query.from,
      to: query.to,
    });
  }

  private addCondition(
    where: string[],
    params: unknown[],
    sql: string,
    value: unknown,
  ): void {
    params.push(value);
    where.push(sql.replace('?', `$${params.length}`));
  }

  private async runPaged(
    where: string[],
    params: unknown[],
    page: number,
    limit: number,
    join = '',
  ): Promise<PaginatedResult<OvertimeRequestListItem>> {
    const whereSql = where.join(' AND ');

    const countRows = await this.dataSource.query<CountRow[]>(
      `
        SELECT COUNT(*)::int AS count
        FROM overtime_requests o
        ${join}
        WHERE ${whereSql}
      `,
      params,
    );

    const items = await this.dataSource.query<OvertimeRequestListItem[]>(
      `
        SELECT
          o.id,
          o.employee_id AS "employeeId",
          o.attendance_id AS "attendanceId",
          o.minutes,
          o.reason,
          o.status,
          o.version,
          o.created_at AS "createdAt",
          o.updated_at AS "updatedAt"
        FROM overtime_requests o
        ${join}
        WHERE ${whereSql}
        ORDER BY o.created_at DESC, o.id DESC
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
      `,
      [...params, limit, (page - 1) * limit],
    );

    return {
      items,
      page,
      limit,
      total: countRows[0]?.count ?? 0,
    };
  }
}
