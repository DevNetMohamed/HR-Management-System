import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { OVERTIME_REQUEST_REPOSITORY } from './domain/overtime-request.repository';
import { OVERTIME_REQUEST_QUERIES } from './application/queries/overtime-request.queries';
import { ATTENDANCE_GATEWAY } from './application/ports/attendance.gateway';
import { EMPLOYEE_GATEWAY } from './application/ports/employee.gateway';
import { OVERTIME_POLICY_GATEWAY } from './application/ports/overtime-policy.gateway';
import { AUTHORIZATION_GATEWAY } from './application/ports/authorization.gateway';
import { EVENT_PUBLISHER } from './application/ports/event-publisher.port';
import { NOTIFICATION_PORT } from './application/ports/notification.port';
import { SubmitOvertimeRequestUseCase } from './application/use-cases/submit-overtime-request.use-case';
import { EditOvertimeRequestUseCase } from './application/use-cases/edit-overtime-request.use-case';
import { CancelOvertimeRequestUseCase } from './application/use-cases/cancel-overtime-request.use-case';
import { ReviewOvertimeByManagerUseCase } from './application/use-cases/review-overtime-by-manager.use-case';
import { ReviewOvertimeByHrUseCase } from './application/use-cases/review-overtime-by-hr.use-case';
import { OvertimeRequestReadService } from './application/services/overtime-request-read.service';
import { OvertimeRequestOrmEntity } from './infrastructure/persistence/overtime-request.orm-entity';
import { TypeOrmOvertimeRequestRepository } from './infrastructure/persistence/typeorm-overtime-request.repository';
import { TypeOrmOvertimeRequestQueries } from './infrastructure/persistence/typeorm-overtime-request.queries';
import { SqlAttendanceGateway } from './infrastructure/sql-attendance.gateway';
import { SqlEmployeeGateway } from './infrastructure/sql-employee.gateway';
import { RbacAuthorizationGateway } from './infrastructure/rbac-authorization.gateway';
import { UnavailableOvertimePolicyGateway } from './infrastructure/unavailable-overtime-policy.gateway';
import { NestOvertimeEventPublisher } from './infrastructure/nest-event.publisher';
import { NestInAppNotificationAdapter } from './infrastructure/nest-in-app-notification.adapter';
import { OvertimeRequestController } from './presentation/overtime-request.controller';
import { OvertimeRequestErrorFilter } from './presentation/error.filter';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([OvertimeRequestOrmEntity]),
  ],
  controllers: [OvertimeRequestController],
  providers: [
    SubmitOvertimeRequestUseCase,
    EditOvertimeRequestUseCase,
    CancelOvertimeRequestUseCase,
    ReviewOvertimeByManagerUseCase,
    ReviewOvertimeByHrUseCase,
    OvertimeRequestReadService,
    {
      provide: OVERTIME_REQUEST_REPOSITORY,
      useClass: TypeOrmOvertimeRequestRepository,
    },
    {
      provide: OVERTIME_REQUEST_QUERIES,
      useClass: TypeOrmOvertimeRequestQueries,
    },
    {
      provide: ATTENDANCE_GATEWAY,
      useClass: SqlAttendanceGateway,
    },
    {
      provide: EMPLOYEE_GATEWAY,
      useClass: SqlEmployeeGateway,
    },
    {
      provide: OVERTIME_POLICY_GATEWAY,
      useClass: UnavailableOvertimePolicyGateway,
    },
    {
      provide: AUTHORIZATION_GATEWAY,
      useClass: RbacAuthorizationGateway,
    },
    {
      provide: EVENT_PUBLISHER,
      useClass: NestOvertimeEventPublisher,
    },
    {
      provide: NOTIFICATION_PORT,
      useClass: NestInAppNotificationAdapter,
    },
    {
      provide: APP_FILTER,
      useClass: OvertimeRequestErrorFilter,
    },
  ],
})
export class OvertimeRequestModule {}
