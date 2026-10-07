import { randomUUID } from 'crypto';
import { OvertimeRequestStatus } from './enums';
import {
  DomainError,
  InvalidStatusTransitionError,
} from './errors/domain.errors';
import {
  DomainEvent,
  OvertimeRequestApproved,
  OvertimeRequestCancelled,
  OvertimeRequestEdited,
  OvertimeRequestManagerApproved,
  OvertimeRequestRejected,
  OvertimeRequestSubmitted,
} from './events/overtime-request.events';

export interface OvertimeRequestProps {
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

  createdBy: string;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date;
}

export interface SubmitOvertimeRequestInput {
  companyId: string;
  employeeId: string;
  attendanceId: string;
  minutes: number;
  reason: string;
  managerReviewRequired: boolean;
  createdBy: string;
  submittedAt: Date;
}

export interface ManagerReviewInput {
  managerUserId: string;
  reviewedAt: Date;
}

export interface HrReviewInput {
  hrUserId: string;
  reviewedAt: Date;
}

export interface EditOvertimeRequestInput {
  actorEmployeeId: string;
  actorUserId: string;
  minutes: number;
  reason: string;
  expectedVersion: number;
  editedAt: Date;
}

export interface CancelOvertimeRequestInput {
  actorEmployeeId: string;
  actorUserId: string;
  expectedVersion: number;
  cancelledAt: Date;
}

export class OvertimeRequest {
  private events: DomainEvent[] = [];

  private constructor(private props: OvertimeRequestProps) {}

  static submit(input: SubmitOvertimeRequestInput): OvertimeRequest {
    OvertimeRequest.assertMinutes(input.minutes);
    const reason = OvertimeRequest.normalizeReason(input.reason);

    const initialStatus = input.managerReviewRequired
      ? OvertimeRequestStatus.PENDING_MANAGER
      : OvertimeRequestStatus.PENDING_HR;

    const request = new OvertimeRequest({
      id: randomUUID(),
      companyId: input.companyId,
      employeeId: input.employeeId,
      attendanceId: input.attendanceId,
      minutes: input.minutes,
      reason,
      status: initialStatus,

      managerReviewRequired: input.managerReviewRequired,
      managerReviewedBy: null,
      managerReviewedAt: null,

      hrReviewedBy: null,
      hrReviewedAt: null,

      version: 1,

      createdBy: input.createdBy,
      createdAt: input.submittedAt,
      updatedBy: null,
      updatedAt: input.submittedAt,
    });

    request.events.push(
      new OvertimeRequestSubmitted(
        request.props.companyId,
        request.props.id,
        request.props.employeeId,
        request.props.attendanceId,
        request.props.status,
        input.submittedAt,
      ),
    );

    return request;
  }

  static restore(props: OvertimeRequestProps): OvertimeRequest {
    return new OvertimeRequest({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get companyId(): string {
    return this.props.companyId;
  }

  get employeeId(): string {
    return this.props.employeeId;
  }

  get status(): OvertimeRequestStatus {
    return this.props.status;
  }

  get version(): number {
    return this.props.version;
  }

  toSnapshot(): OvertimeRequestProps {
    return { ...this.props };
  }

  pullEvents(): DomainEvent[] {
    const pendingEvents = this.events;
    this.events = [];
    return pendingEvents;
  }

  managerApprove(input: ManagerReviewInput): void {
    if (
      this.props.managerReviewedBy === input.managerUserId &&
      this.props.managerReviewedAt !== null &&
      (this.props.status === OvertimeRequestStatus.PENDING_HR ||
        this.props.hrReviewedAt !== null)
    ) {
      return;
    }

    if (this.props.status !== OvertimeRequestStatus.PENDING_MANAGER) {
      throw new InvalidStatusTransitionError(
        this.props.status,
        OvertimeRequestStatus.PENDING_HR,
      );
    }

    this.assertReviewerIsNotCreator(input.managerUserId);

    this.props.status = OvertimeRequestStatus.PENDING_HR;
    this.props.managerReviewedBy = input.managerUserId;
    this.props.managerReviewedAt = input.reviewedAt;
    this.touch(input.managerUserId, input.reviewedAt);

    this.events.push(
      new OvertimeRequestManagerApproved(
        this.props.companyId,
        this.props.id,
        this.props.employeeId,
        input.managerUserId,
        input.reviewedAt,
      ),
    );
  }

  managerReject(input: ManagerReviewInput): void {
    if (
      this.props.status === OvertimeRequestStatus.REJECTED &&
      this.props.managerReviewedBy === input.managerUserId &&
      this.props.managerReviewedAt !== null &&
      this.props.hrReviewedAt === null
    ) {
      return;
    }

    if (this.props.status !== OvertimeRequestStatus.PENDING_MANAGER) {
      throw new InvalidStatusTransitionError(
        this.props.status,
        OvertimeRequestStatus.REJECTED,
      );
    }

    this.assertReviewerIsNotCreator(input.managerUserId);

    this.props.status = OvertimeRequestStatus.REJECTED;
    this.props.managerReviewedBy = input.managerUserId;
    this.props.managerReviewedAt = input.reviewedAt;
    this.touch(input.managerUserId, input.reviewedAt);

    this.events.push(
      new OvertimeRequestRejected(
        this.props.companyId,
        this.props.id,
        this.props.employeeId,
        input.managerUserId,
        'MANAGER',
        input.reviewedAt,
      ),
    );
  }

  hrApprove(input: HrReviewInput): void {
    if (
      this.props.status === OvertimeRequestStatus.APPROVED &&
      this.props.hrReviewedBy === input.hrUserId
    ) {
      return;
    }

    if (this.props.status !== OvertimeRequestStatus.PENDING_HR) {
      throw new InvalidStatusTransitionError(
        this.props.status,
        OvertimeRequestStatus.APPROVED,
      );
    }

    this.assertReviewerIsNotCreator(input.hrUserId);

    this.props.status = OvertimeRequestStatus.APPROVED;
    this.props.hrReviewedBy = input.hrUserId;
    this.props.hrReviewedAt = input.reviewedAt;
    this.touch(input.hrUserId, input.reviewedAt);

    this.events.push(
      new OvertimeRequestApproved(
        this.props.companyId,
        this.props.id,
        this.props.employeeId,
        input.hrUserId,
        input.reviewedAt,
      ),
    );
  }

  hrReject(input: HrReviewInput): void {
    if (
      this.props.status === OvertimeRequestStatus.REJECTED &&
      this.props.hrReviewedBy === input.hrUserId
    ) {
      return;
    }

    if (this.props.status !== OvertimeRequestStatus.PENDING_HR) {
      throw new InvalidStatusTransitionError(
        this.props.status,
        OvertimeRequestStatus.REJECTED,
      );
    }

    this.assertReviewerIsNotCreator(input.hrUserId);

    this.props.status = OvertimeRequestStatus.REJECTED;
    this.props.hrReviewedBy = input.hrUserId;
    this.props.hrReviewedAt = input.reviewedAt;
    this.touch(input.hrUserId, input.reviewedAt);

    this.events.push(
      new OvertimeRequestRejected(
        this.props.companyId,
        this.props.id,
        this.props.employeeId,
        input.hrUserId,
        'HR',
        input.reviewedAt,
      ),
    );
  }

  editBeforeFirstDecision(input: EditOvertimeRequestInput): void {
    this.assertOwner(input.actorEmployeeId);
    this.assertExpectedVersion(input.expectedVersion);
    this.assertEmployeeCanModify('edited');

    OvertimeRequest.assertMinutes(input.minutes);
    const reason = OvertimeRequest.normalizeReason(input.reason);

    this.props.minutes = input.minutes;
    this.props.reason = reason;
    this.touch(input.actorUserId, input.editedAt);

    this.events.push(
      new OvertimeRequestEdited(
        this.props.companyId,
        this.props.id,
        this.props.employeeId,
        input.editedAt,
      ),
    );
  }

  cancel(input: CancelOvertimeRequestInput): void {
    this.assertOwner(input.actorEmployeeId);
    this.assertExpectedVersion(input.expectedVersion);
    this.assertEmployeeCanModify('cancelled');

    this.props.status = OvertimeRequestStatus.CANCELLED;
    this.touch(input.actorUserId, input.cancelledAt);

    this.events.push(
      new OvertimeRequestCancelled(
        this.props.companyId,
        this.props.id,
        this.props.employeeId,
        input.cancelledAt,
      ),
    );
  }

  private static assertMinutes(minutes: number): void {
    if (!Number.isInteger(minutes) || minutes <= 0) {
      throw new DomainError(
        'Overtime minutes must be a positive integer',
        'INVALID_OVERTIME_MINUTES',
      );
    }
  }

  private static normalizeReason(reason: string): string {
    const normalizedReason = reason.trim();

    if (normalizedReason.length < 3 || normalizedReason.length > 1000) {
      throw new DomainError(
        'Overtime reason must be between 3 and 1000 characters',
        'INVALID_OVERTIME_REASON',
      );
    }

    return normalizedReason;
  }

  private assertOwner(actorEmployeeId: string): void {
    if (actorEmployeeId !== this.props.employeeId) {
      throw new DomainError(
        'Only the request owner can change this request',
        'OVERTIME_FORBIDDEN',
      );
    }
  }

  private assertExpectedVersion(expectedVersion: number): void {
    if (expectedVersion !== this.props.version) {
      throw new DomainError(
        'The overtime request has been changed by another operation',
        'OVERTIME_VERSION_CONFLICT',
      );
    }
  }

  private assertEmployeeCanModify(action: 'edited' | 'cancelled'): void {
    const canModify =
      this.props.status === OvertimeRequestStatus.PENDING_MANAGER ||
      (this.props.status === OvertimeRequestStatus.PENDING_HR &&
        !this.props.managerReviewRequired);

    if (!canModify) {
      throw new DomainError(
        `The overtime request cannot be ${action} after the first decision`,
        'OVERTIME_ALREADY_REVIEWED',
      );
    }
  }

  private assertReviewerIsNotCreator(reviewerUserId: string): void {
    if (reviewerUserId === this.props.createdBy) {
      throw new DomainError(
        'Request creator cannot review their own request',
        'OVERTIME_FORBIDDEN',
      );
    }
  }

  private touch(updatedBy: string, updatedAt: Date): void {
    this.props.updatedBy = updatedBy;
    this.props.updatedAt = updatedAt;
    this.props.version += 1;
  }
}
