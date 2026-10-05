export class ApplicationError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message, 'NOT_FOUND');
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string) {
    super(message, 'CONFLICT');
  }
}