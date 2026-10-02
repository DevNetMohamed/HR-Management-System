import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { NotFoundError } from 'rxjs';
import { ApplicationError, ConflictError } from '../../application/errors';
import { DomainError } from '../../domain/errors/domain.errors';

@Catch(DomainError, ApplicationError)
export class ErrorFilter implements ExceptionFilter {
  catch(err: DomainError | ApplicationError, host: ArgumentsHost) {
    const status =
      err instanceof NotFoundError
        ? 404
        : err instanceof ConflictError
          ? 409
          : 422;
    host
      .switchToHttp()
      .getResponse()
      .status(status)
      .json({ statusCode: status, code: err.code, message: err.message });
  }
}
