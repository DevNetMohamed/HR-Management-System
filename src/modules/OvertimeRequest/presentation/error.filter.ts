import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { DomainError } from '../domain/errors/domain.errors';
import { ApplicationError } from '../application/errors';

const STATUS_BY_CODE: Record<string, number> = {
  INVALID_OVERTIME_MINUTES: HttpStatus.BAD_REQUEST,
  INVALID_OVERTIME_REASON: HttpStatus.BAD_REQUEST,
  OVERTIME_FORBIDDEN: HttpStatus.FORBIDDEN,
  OVERTIME_REQUEST_NOT_FOUND: HttpStatus.NOT_FOUND,
  ATTENDANCE_NOT_FOUND: HttpStatus.NOT_FOUND,
  OVERTIME_REQUEST_ALREADY_EXISTS: HttpStatus.CONFLICT,
  OVERTIME_INVALID_TRANSITION: HttpStatus.CONFLICT,
  OVERTIME_EXCEEDS_CALCULATED: HttpStatus.CONFLICT,
  OVERTIME_ALREADY_REVIEWED: HttpStatus.CONFLICT,
  OVERTIME_VERSION_CONFLICT: HttpStatus.CONFLICT,
  ATTENDANCE_NOT_CLOSED: HttpStatus.UNPROCESSABLE_ENTITY,
  EMPLOYEE_NOT_ACTIVE: HttpStatus.UNPROCESSABLE_ENTITY,
  NO_OVERTIME_AVAILABLE: HttpStatus.UNPROCESSABLE_ENTITY,
  OVERTIME_POLICY_VIOLATION: HttpStatus.UNPROCESSABLE_ENTITY,
};

@Catch(DomainError, ApplicationError)
export class OvertimeRequestErrorFilter implements ExceptionFilter {
  catch(error: DomainError | ApplicationError, host: ArgumentsHost) {
    const status =
      STATUS_BY_CODE[error.code] ?? HttpStatus.UNPROCESSABLE_ENTITY;

    host.switchToHttp().getResponse().status(status).json({
      statusCode: status,
      code: error.code,
      message: error.message,
    });
  }
}
