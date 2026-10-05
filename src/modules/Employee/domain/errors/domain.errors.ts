import { DomainError } from "src/common/domain-error/DomainError.base";

export class InvalidStatusTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`Cannot change employee status from ${from} to ${to}`, 'EMPLOYEE_INVALID_TRANSITION');
  }
}