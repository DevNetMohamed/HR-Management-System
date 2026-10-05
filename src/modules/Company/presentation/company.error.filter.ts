import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import {
  ApplicationError,
  ConflictError,
  NotFoundError,
} from '../application/errors';
import { DomainError } from '../domain/errors/company.errors';

@Catch(DomainError, ApplicationError)
export class CompanyErrorFilter implements ExceptionFilter {
  catch(err: DomainError | ApplicationError, host: ArgumentsHost) {
    const status =
      err instanceof NotFoundError ? 404 : err instanceof ConflictError ? 409 : 422;

    host
      .switchToHttp()
      .getResponse()
      .status(status)
      .json({ statusCode: status, code: err.code, message: err.message });
  }
}