export class ApplicationError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class OvertimeForbiddenError extends ApplicationError {
  constructor() {
    super(
      'The current user is not allowed to perform this operation',
      'OVERTIME_FORBIDDEN',
    );
  }
}

export class OvertimeRequestNotFoundError extends ApplicationError {
  constructor() {
    super('Overtime request was not found', 'OVERTIME_REQUEST_NOT_FOUND');
  }
}

export class AttendanceNotFoundError extends ApplicationError {
  constructor() {
    super('Attendance record was not found', 'ATTENDANCE_NOT_FOUND');
  }
}

export class OvertimeRequestAlreadyExistsError extends ApplicationError {
  constructor() {
    super(
      'An overtime request already exists for this attendance record',
      'OVERTIME_REQUEST_ALREADY_EXISTS',
    );
  }
}

export class OvertimeExceedsCalculatedError extends ApplicationError {
  constructor() {
    super(
      'Requested overtime exceeds calculated overtime',
      'OVERTIME_EXCEEDS_CALCULATED',
    );
  }
}

export class AttendanceNotClosedError extends ApplicationError {
  constructor() {
    super(
      'Attendance record must have a check-out time',
      'ATTENDANCE_NOT_CLOSED',
    );
  }
}

export class EmployeeNotActiveError extends ApplicationError {
  constructor() {
    super(
      'Employee must be active to submit an overtime request',
      'EMPLOYEE_NOT_ACTIVE',
    );
  }
}

export class NoOvertimeAvailableError extends ApplicationError {
  constructor() {
    super(
      'Attendance record has no overtime available',
      'NO_OVERTIME_AVAILABLE',
    );
  }
}

export class OvertimePolicyViolationError extends ApplicationError {
  constructor(readonly policyCode: string) {
    super(
      `Requested overtime violates company policy: ${policyCode}`,
      'OVERTIME_POLICY_VIOLATION',
    );
  }
}
