import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeOrmEntity } from './infrastructure/persistence/employee.orm-entity';
import { JobHistoryOrmEntity } from './infrastructure/persistence/job-history.orm-entity';
import { EmployeeController } from './presentation/employee.controller';
import { HireEmployeeUseCase } from './application/use-cases/hire-employee.use-case';
import { ChangeAssignmentUseCase } from './application/use-cases/change-assignment.use-case';
import { TerminateEmployeeUseCase } from './application/use-cases/terminate-employee.use-case';
import { ReferenceValidator } from './application/services/reference-validator';
import { EMPLOYEE_REPOSITORY } from './domain/employee.repository';
import { TypeOrmEmployeeRepository } from './infrastructure/persistence/typeorm-employee.repository';
import { TypeOrmEmployeeQueries } from './infrastructure/persistence/typeorm-employee.queries';
import { EMPLOYEE_QUERIES } from './application/queries/employee.queries';
import { ORGANIZATION_GATEWAY } from './application/ports/organization.gateway';
import { EVENT_PUBLISHER } from './application/ports/event-publisher.port';
import { APP_FILTER } from '@nestjs/core';
import { ErrorFilter } from './presentation/error.filter';
import { NestEventPublisher } from './infrastructure/nest-event.publisher';
import { SqlOrganizationGateway } from './infrastructure/sql-organization.gateway';
import { DatabaseModule } from 'src/infrastructure/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([EmployeeOrmEntity, JobHistoryOrmEntity]),
  ],
  controllers: [EmployeeController],
  providers: [
    HireEmployeeUseCase,
    ChangeAssignmentUseCase,
    TerminateEmployeeUseCase,
    ReferenceValidator,
    { provide: EMPLOYEE_REPOSITORY, useClass: TypeOrmEmployeeRepository },
    { provide: EMPLOYEE_QUERIES, useClass: TypeOrmEmployeeQueries },
    { provide: ORGANIZATION_GATEWAY, useClass: SqlOrganizationGateway },
    { provide: EVENT_PUBLISHER, useClass: NestEventPublisher },
    { provide: APP_FILTER, useClass: ErrorFilter },
  ],
})
export class EmployeeModule {}
