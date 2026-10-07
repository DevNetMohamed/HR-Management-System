import { OvertimeRequestStatus } from '../../domain/enums';

export interface OvertimeRequestDetails {
  id: string;
  companyId: string;
  employeeId: string;
  attendanceId: string;
  minutes: number;
  reason: string;
  status: OvertimeRequestStatus;

  managerReviewRequired: boolean;
  managerReviewedBy: string | null;
  managerReviewedAt: Date | null;

  hrReviewedBy: string | null;
  hrReviewedAt: Date | null;

  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OvertimeRequestListItem {
  id: string;
  employeeId: string;
  attendanceId: string;
  minutes: number;
  reason: string;
  status: OvertimeRequestStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface OvertimeRequestFilters {
  status?: OvertimeRequestStatus;
  employeeId?: string;
  departmentId?: string;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}

export interface MyOvertimeRequestsQuery {
  companyId: string;
  employeeId: string;
  status?: OvertimeRequestStatus;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}

export interface ManagerOvertimeQueueQuery extends OvertimeRequestFilters {
  companyId: string;
  managerEmployeeId: string;
}

export interface HrOvertimeQueueQuery extends OvertimeRequestFilters {
  companyId: string;
}

export interface OvertimeRequestQueries {
  getDetails(
    companyId: string,
    requestId: string,
  ): Promise<OvertimeRequestDetails | null>;

  listForEmployee(
    query: MyOvertimeRequestsQuery,
  ): Promise<PaginatedResult<OvertimeRequestListItem>>;

  listManagerQueue(
    query: ManagerOvertimeQueueQuery,
  ): Promise<PaginatedResult<OvertimeRequestListItem>>;

  listHrQueue(
    query: HrOvertimeQueueQuery,
  ): Promise<PaginatedResult<OvertimeRequestListItem>>;
}

export const OVERTIME_REQUEST_QUERIES = Symbol('OVERTIME_REQUEST_QUERIES');
