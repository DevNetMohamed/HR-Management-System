import { Injectable } from '@nestjs/common';
import { ContractQueries } from 'src/modules/Employee/application/queries/contract.queries';
import { DataSource } from 'typeorm';

@Injectable()
export class TypeOrmContractQueries implements ContractQueries {
  constructor(private readonly ds: DataSource) {}

  listByEmployee(companyId: string, employeeId: string) {
    return this.ds.query(
      `SELECT id, contract_type AS "contractType", status,
              start_date::text AS "startDate", end_date::text AS "endDate",
              probation_months AS "probationMonths", notice_period_days AS "noticePeriodDays",
              document_url AS "documentUrl", termination_reason AS "terminationReason"
         FROM employment_contracts
        WHERE company_id = $1 AND employee_id = $2 AND deleted_at IS NULL
        ORDER BY start_date DESC, created_at DESC`,
      [companyId, employeeId],
    );
  }

  expiringWithin(companyId: string, days: number, today: string) {
    return this.ds.query(
      `SELECT c.id AS "contractId", c.employee_id AS "employeeId", e.employee_number AS "employeeNumber",
              c.contract_type AS "contractType", c.end_date::text AS "endDate",
              (c.end_date - $2::date) AS "daysLeft"
         FROM employment_contracts c
         JOIN employees e ON e.id = c.employee_id AND e.company_id = c.company_id
        WHERE c.company_id = $1 AND c.status = 'active' AND c.deleted_at IS NULL
          AND c.end_date BETWEEN $2::date AND ($2::date + $3::int)
        ORDER BY c.end_date`,
      [companyId, today, days],
    );
  }
}
