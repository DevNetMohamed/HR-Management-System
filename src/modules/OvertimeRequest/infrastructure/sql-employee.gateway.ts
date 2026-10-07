import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  type EmployeeGateway,
  type OvertimeEmployeeProfile,
} from '../application/ports/employee.gateway';

interface EmployeeRow {
  id: string;
  status: string;
  manager_id: string | null;
}

@Injectable()
export class SqlEmployeeGateway implements EmployeeGateway {
  constructor(private readonly dataSource: DataSource) {}

  async getById(
    companyId: string,
    employeeId: string,
  ): Promise<OvertimeEmployeeProfile | null> {
    const rows = await this.dataSource.query<EmployeeRow[]>(
      `
        SELECT
          id,
          status,
          manager_id
        FROM employees
        WHERE company_id = $1
          AND id = $2
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [companyId, employeeId],
    );

    const row = rows[0];

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      status: row.status,
      managerId: row.manager_id,
    };
  }
}
