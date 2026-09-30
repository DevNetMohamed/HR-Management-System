import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { DomainError } from "../domain/errors/domain.errors";
import { ApplicationError, ConflictError } from "../application/errors";
import { NotFoundError } from "rxjs";

@Catch(DomainError, ApplicationError)
export class ErrorFilter implements ExceptionFilter {
  catch(err: DomainError | ApplicationError, host: ArgumentsHost) {
    const status = err instanceof NotFoundError ? 404 : err instanceof ConflictError ? 409 : 422;
    host.switchToHttp().getResponse().status(status)
      .json({ statusCode: status, code: err.code, message: err.message });
  }
}