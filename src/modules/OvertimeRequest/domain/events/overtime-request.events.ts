import { OvertimeRequestStatus } from '../enums';

export abstract class DomainEvent {
  abstract readonly name: string;

  constructor(readonly occurredAt: Date) {}
}

export class OvertimeRequestSubmitted extends DomainEvent {
  readonly name = 'overtime_request.submitted';

  constructor(
    readonly companyId: string,
    readonly requestId: string,
    readonly employeeId: string,
    readonly attendanceId: string,
    readonly status: OvertimeRequestStatus,
    occurredAt: Date,
  ) {
    super(occurredAt);
  }
}

export class OvertimeRequestManagerApproved extends DomainEvent {
  readonly name = 'overtime_request.manager_approved';

  constructor(
    readonly companyId: string,
    readonly requestId: string,
    readonly employeeId: string,
    readonly managerUserId: string,
    occurredAt: Date,
  ) {
    super(occurredAt);
  }
}

export class OvertimeRequestRejected extends DomainEvent {
  readonly name = 'overtime_request.rejected';

  constructor(
    readonly companyId: string,
    readonly requestId: string,
    readonly employeeId: string,
    readonly reviewerUserId: string,
    readonly reviewStage: 'MANAGER' | 'HR',
    occurredAt: Date,
  ) {
    super(occurredAt);
  }
}

export class OvertimeRequestApproved extends DomainEvent {
  readonly name = 'overtime_request.approved';

  constructor(
    readonly companyId: string,
    readonly requestId: string,
    readonly employeeId: string,
    readonly hrUserId: string,
    occurredAt: Date,
  ) {
    super(occurredAt);
  }
}

export class OvertimeRequestEdited extends DomainEvent {
  readonly name = 'overtime_request.edited';

  constructor(
    readonly companyId: string,
    readonly requestId: string,
    readonly employeeId: string,
    occurredAt: Date,
  ) {
    super(occurredAt);
  }
}

export class OvertimeRequestCancelled extends DomainEvent {
  readonly name = 'overtime_request.cancelled';

  constructor(
    readonly companyId: string,
    readonly requestId: string,
    readonly employeeId: string,
    occurredAt: Date,
  ) {
    super(occurredAt);
  }
}
