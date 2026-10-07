import { OvertimeRequest } from './overtime-request.entity';

export interface OvertimeRequestRepository {
  findById(
    companyId: string,
    requestId: string,
  ): Promise<OvertimeRequest | null>;

  existsByAttendance(companyId: string, attendanceId: string): Promise<boolean>;

  insert(request: OvertimeRequest): Promise<void>;

  update(request: OvertimeRequest, expectedVersion: number): Promise<void>;
}

export const OVERTIME_REQUEST_REPOSITORY = Symbol(
  'OVERTIME_REQUEST_REPOSITORY',
);
