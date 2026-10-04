export class DomainError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidCompanyStatusTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(
      `Cannot change company status from ${from} to ${to}`,
      'COMPANY_INVALID_TRANSITION',
    );
  }
}