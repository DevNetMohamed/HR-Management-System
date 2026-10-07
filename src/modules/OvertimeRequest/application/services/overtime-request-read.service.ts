import { Inject, Injectable } from '@nestjs/common';
import {
  OVERTIME_REQUEST_QUERIES,
  type HrOvertimeQueueQuery,
  type ManagerOvertimeQueueQuery,
  type MyOvertimeRequestsQuery,
  type OvertimeRequestFilters,
  type OvertimeRequestQueries,
} from '../queries/overtime-request.queries';
import {
  AUTHORIZATION_GATEWAY,
  type AuthenticatedPrincipal,
  type AuthorizationGateway,
} from '../ports/authorization.gateway';
import {
  OvertimeForbiddenError,
  OvertimeRequestNotFoundError,
} from '../errors';

@Injectable()
export class OvertimeRequestReadService {
  constructor(
    @Inject(OVERTIME_REQUEST_QUERIES)
    private readonly queries: OvertimeRequestQueries,
    @Inject(AUTHORIZATION_GATEWAY)
    private readonly authorization: AuthorizationGateway,
  ) {}

  async getDetails(principal: AuthenticatedPrincipal, requestId: string) {
    const details = await this.queries.getDetails(
      principal.companyId,
      requestId,
    );

    if (!details) {
      throw new OvertimeRequestNotFoundError();
    }

    if (principal.employeeId === details.employeeId) {
      return details;
    }

    if (await this.authorization.canReviewAsHr({ principal })) {
      return details;
    }

    const managerAllowed = await this.authorization.canReviewAsManager({
      principal,
      targetEmployeeId: details.employeeId,
    });

    if (!managerAllowed) {
      throw new OvertimeRequestNotFoundError();
    }

    return details;
  }

  listMine(
    principal: AuthenticatedPrincipal,
    filters: Omit<MyOvertimeRequestsQuery, 'companyId' | 'employeeId'>,
  ) {
    if (!principal.employeeId) {
      throw new OvertimeForbiddenError();
    }

    return this.queries.listForEmployee({
      ...filters,
      companyId: principal.companyId,
      employeeId: principal.employeeId,
    });
  }

  async listManagerQueue(
    principal: AuthenticatedPrincipal,
    filters: OvertimeRequestFilters,
  ) {
    if (
      !principal.employeeId ||
      !principal.permissions.includes('overtime_requests.manager_review')
    ) {
      throw new OvertimeForbiddenError();
    }

    const query: ManagerOvertimeQueueQuery = {
      ...filters,
      companyId: principal.companyId,
      managerEmployeeId: principal.employeeId,
    };

    return this.queries.listManagerQueue(query);
  }

  async listHrQueue(
    principal: AuthenticatedPrincipal,
    filters: OvertimeRequestFilters,
  ) {
    if (!(await this.authorization.canReviewAsHr({ principal }))) {
      throw new OvertimeForbiddenError();
    }

    const query: HrOvertimeQueueQuery = {
      ...filters,
      companyId: principal.companyId,
    };

    return this.queries.listHrQueue(query);
  }
}
