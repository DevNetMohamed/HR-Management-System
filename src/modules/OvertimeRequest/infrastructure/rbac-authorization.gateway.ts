import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  type AuthorizationGateway,
  type HrReviewAuthorizationInput,
  type ManagerReviewAuthorizationInput,
} from '../application/ports/authorization.gateway';

interface AuthorizationRow {
  allowed: boolean;
}

@Injectable()
export class RbacAuthorizationGateway implements AuthorizationGateway {
  constructor(private readonly dataSource: DataSource) {}

  async canReviewAsManager(
    input: ManagerReviewAuthorizationInput,
  ): Promise<boolean> {
    const { principal, targetEmployeeId } = input;

    if (!principal.permissions.includes('overtime_requests.manager_review')) {
      return false;
    }

    if (!principal.employeeId) {
      return false;
    }

    const rows = await this.dataSource.query<AuthorizationRow[]>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM employees
          WHERE company_id = $1
            AND id = $2
            AND manager_id = $3
            AND deleted_at IS NULL
        ) AS allowed
      `,
      [principal.companyId, targetEmployeeId, principal.employeeId],
    );

    return rows[0]?.allowed === true;
  }

  async canReviewAsHr(input: HrReviewAuthorizationInput): Promise<boolean> {
    return input.principal.permissions.includes('overtime_requests.hr_review');
  }
}
