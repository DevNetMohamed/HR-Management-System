import { Inject, Injectable } from '@nestjs/common';
import { OvertimeRequest } from '../../domain/overtime-request.entity';
import {
  OVERTIME_REQUEST_REPOSITORY,
  type OvertimeRequestRepository,
} from '../../domain/overtime-request.repository';
import {
  ATTENDANCE_GATEWAY,
  type AttendanceGateway,
} from '../ports/attendance.gateway';
import {
  EMPLOYEE_GATEWAY,
  type EmployeeGateway,
} from '../ports/employee.gateway';
import {
  OVERTIME_POLICY_GATEWAY,
  type OvertimePolicyGateway,
} from '../ports/overtime-policy.gateway';
import {
  EVENT_PUBLISHER,
  type DomainEventPublisher,
} from '../ports/event-publisher.port';
import type { AuthenticatedPrincipal } from '../ports/authorization.gateway';
import {
  AttendanceNotClosedError,
  AttendanceNotFoundError,
  EmployeeNotActiveError,
  NoOvertimeAvailableError,
  OvertimeExceedsCalculatedError,
  OvertimeForbiddenError,
  OvertimePolicyViolationError,
  OvertimeRequestAlreadyExistsError,
} from '../errors';

export interface SubmitOvertimeRequestCommand {
  principal: AuthenticatedPrincipal;
  attendanceId: string;
  minutes: number;
  reason: string;
}

export interface SubmitOvertimeRequestResult {
  id: string;
  status: string;
  version: number;
}

@Injectable()
export class SubmitOvertimeRequestUseCase {
  constructor(
    @Inject(OVERTIME_REQUEST_REPOSITORY)
    private readonly requests: OvertimeRequestRepository,

    @Inject(ATTENDANCE_GATEWAY)
    private readonly attendance: AttendanceGateway,

    @Inject(EMPLOYEE_GATEWAY)
    private readonly employees: EmployeeGateway,

    @Inject(OVERTIME_POLICY_GATEWAY)
    private readonly policy: OvertimePolicyGateway,

    @Inject(EVENT_PUBLISHER)
    private readonly publisher: DomainEventPublisher,
  ) {}

  async execute(
    command: SubmitOvertimeRequestCommand,
  ): Promise<SubmitOvertimeRequestResult> {
    const { principal } = command;

    if (!principal.employeeId) {
      throw new OvertimeForbiddenError();
    }

    const employee = await this.employees.getById(
      principal.companyId,
      principal.employeeId,
    );

    if (!employee || employee.status !== 'active') {
      throw new EmployeeNotActiveError();
    }

    const attendanceSource = await this.attendance.getOvertimeSource(
      principal.companyId,
      command.attendanceId,
    );

    if (
      !attendanceSource ||
      attendanceSource.employeeId !== principal.employeeId
    ) {
      throw new AttendanceNotFoundError();
    }

    if (!attendanceSource.checkOut) {
      throw new AttendanceNotClosedError();
    }

    if (attendanceSource.overtimeMinutes <= 0) {
      throw new NoOvertimeAvailableError();
    }

    if (command.minutes > attendanceSource.overtimeMinutes) {
      throw new OvertimeExceedsCalculatedError();
    }

    const policyResult = await this.policy.validateRequestedMinutes({
      companyId: principal.companyId,
      employeeId: principal.employeeId,
      attendanceId: attendanceSource.id,
      requestedMinutes: command.minutes,
      calculatedMinutes: attendanceSource.overtimeMinutes,
      workDate: attendanceSource.workDate,
    });

    if (!policyResult.valid) {
      throw new OvertimePolicyViolationError(policyResult.code);
    }

    const alreadyExists = await this.requests.existsByAttendance(
      principal.companyId,
      attendanceSource.id,
    );

    if (alreadyExists) {
      throw new OvertimeRequestAlreadyExistsError();
    }

    const request = OvertimeRequest.submit({
      companyId: principal.companyId,
      employeeId: principal.employeeId,
      attendanceId: attendanceSource.id,
      minutes: command.minutes,
      reason: command.reason,
      managerReviewRequired: employee.managerId !== null,
      createdBy: principal.userId,
      submittedAt: new Date(),
    });

    await this.requests.insert(request);
    await this.publisher.publish(request.pullEvents());

    return {
      id: request.id,
      status: request.status,
      version: request.version,
    };
  }
}
