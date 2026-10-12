import { Injectable } from '@nestjs/common';
import {
  EmployeeDocumentQueries,
  ExpiryStatus,
} from 'src/modules/Employee/application/queries/employee-document.queries';
import { DataSource } from 'typeorm';

const EXPIRING_SOON_DAYS = 30;
const statusOf = (daysLeft: number | null): ExpiryStatus =>
  daysLeft === null
    ? 'no_expiry'
    : daysLeft < 0
      ? 'expired'
      : daysLeft <= EXPIRING_SOON_DAYS
        ? 'expiring'
        : 'valid';

@Injectable()
export class TypeOrmEmployeeDocumentQueries implements EmployeeDocumentQueries {
  constructor(private readonly ds: DataSource) {}

  async listByEmployee(companyId: string, employeeId: string, today: string) {
    const rows = await this.ds.query(
      `SELECT id, document_type AS "documentType", file_name AS "fileName", mime_type AS "mimeType",
              size_bytes AS "sizeBytes", issue_date::text AS "issueDate", expiry_date::text AS "expiryDate",
              (expiry_date - $3::date) AS "daysLeft",
              is_verified AS "isVerified", verified_at AS "verifiedAt"
         FROM employee_documents
        WHERE company_id = $1 AND employee_id = $2 AND deleted_at IS NULL
        ORDER BY document_type, created_at DESC`,
      [companyId, employeeId, today],
    );
    return rows.map((r: any) => ({ ...r, expiryStatus: statusOf(r.daysLeft) }));
  }

  async expiringWithin(companyId: string, days: number, today: string) {
    const rows = await this.ds.query(
      `SELECT d.id AS "documentId", d.employee_id AS "employeeId", e.employee_number AS "employeeNumber",
              d.document_type AS "documentType", d.expiry_date::text AS "expiryDate",
              (d.expiry_date - $2::date) AS "daysLeft"
         FROM employee_documents d
         JOIN employees e ON e.id = d.employee_id AND e.company_id = d.company_id
        WHERE d.company_id = $1 AND d.deleted_at IS NULL AND e.deleted_at IS NULL
          AND e.status <> 'terminated'
          AND d.expiry_date IS NOT NULL AND d.expiry_date <= ($2::date + $3::int)
        ORDER BY d.expiry_date`,
      [companyId, today, days],
    );
    return rows.map((r: any) => ({ ...r, expiryStatus: statusOf(r.daysLeft) }));
  }
}
