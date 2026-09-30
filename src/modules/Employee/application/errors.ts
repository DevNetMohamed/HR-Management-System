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
  constructor(masseage: string) {
    super(masseage, 'NOT_FOUND');
  }
}
export class ConflictError extends ApplicationError {
  constructor(masseage: string) {
    super(masseage, 'CONFLICT');
  }
}
export class ValidationError extends ApplicationError {
  constructor(message: string) {
    super(message, 'VALIDATION_FAILED');
  }
}
