export class DomainError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = new.target.name;
  }
}
export class InvalidStatusTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`Cannot change employee status from ${from} to ${to}`, 'EMPLOYEE_INVALID_TRANSITION');
  }
}