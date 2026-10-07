import { Inject, Injectable } from '@nestjs/common';
import {
  OVERTIME_REQUEST_REPOSITORY,
  type OvertimeRequestRepository,
} from '../../domain/overtime-request.repository';
import {
  ATTENDANCE_GATEWAY,
  type AttendanceGateway,
} from '../ports/attendance.gateway';
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
  NoOvertimeAvailableError,
  OvertimeExceedsCalculatedError,
  OvertimeForbiddenError,
  OvertimePolicyViolationError,
  OvertimeRequestNotFoundError,
} from '../errors';

export interface EditOvertimeRequestCommand {
  principal: AuthenticatedPrincipal;
  requestId: string;
  minutes: number;
  reason: string;
  expectedVersion: number;
}

export interface EditOvertimeRequestResult {
  id: string;
  version: number;
}

@Injectable()
export class EditOvertimeRequestUseCase {
  constructor(
    @Inject(OVERTIME_REQUEST_REPOSITORY)
    private readonly requests: OvertimeRequestRepository,

    @Inject(ATTENDANCE_GATEWAY)
    private readonly attendance: AttendanceGateway,

    @Inject(OVERTIME_POLICY_GATEWAY)
    private readonly policy: OvertimePolicyGateway,

    @Inject(EVENT_PUBLISHER)
    private readonly publisher: DomainEventPublisher,
  ) {}

  async execute(
    command: EditOvertimeRequestCommand,
  ): Promise<EditOvertimeRequestResult> {
    const { principal } = command;

    if (!principal.employeeId) {
      throw new OvertimeForbiddenError();
    }

    const request = await this.requests.findById(
      principal.companyId,
      command.requestId,
    );

    if (!request) {
      throw new OvertimeRequestNotFoundError();
    }

    const snapshot = request.toSnapshot();

    const attendanceSource = await this.attendance.getOvertimeSource(
      principal.companyId,
      snapshot.attendanceId,
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

    const storedVersion = request.version;

    request.editBeforeFirstDecision({
      actorEmployeeId: principal.employeeId,
      actorUserId: principal.userId,
      minutes: command.minutes,
      reason: command.reason,
      expectedVersion: command.expectedVersion,
      editedAt: new Date(),
    });

    await this.requests.update(request, storedVersion);
    await this.publisher.publish(request.pullEvents());

    return {
      id: request.id,
      version: request.version,
    };
  }
}
