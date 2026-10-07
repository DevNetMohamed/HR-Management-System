export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidStatusTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(
      `Cannot change overtime request status from ${from} to ${to}`,
      'OVERTIME_INVALID_TRANSITION',
    );
  }
}
