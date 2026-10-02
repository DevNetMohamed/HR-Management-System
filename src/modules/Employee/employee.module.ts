import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeOrmEntity } from './infrastructure/persistence/employee/employee.orm-entity';
import { JobHistoryOrmEntity } from './infrastructure/persistence/job-history/job-history.orm-entity';
import { EmployeeController } from './presentation/controllers/employee/employee.controller';
import { HireEmployeeUseCase } from './application/use-cases/employee/hire-employee.use-case';
import { TerminateEmployeeUseCase } from './application/use-cases/employee/terminate-employee.use-case';
import { ReferenceValidator } from './application/services/reference-validator';
import { EMPLOYEE_REPOSITORY } from './domain/Employees/repositories/employee.repository';
import { TypeOrmEmployeeRepository } from './infrastructure/persistence/employee/typeorm-employee.repository';
import { TypeOrmEmployeeQueries } from './infrastructure/persistence/employee/typeorm-employee.queries';
import { EMPLOYEE_QUERIES } from './application/queries/employee.queries';
import { ORGANIZATION_GATEWAY } from './application/ports/organization.gateway';
import { EVENT_PUBLISHER } from './application/ports/event-publisher.port';
import { APP_FILTER } from '@nestjs/core';
import { ErrorFilter } from './presentation/filters/error.filter';
import { NestEventPublisher } from './infrastructure/event-publisher/nest-event.publisher';
import { SqlOrganizationGateway } from './infrastructure/organization/sql-organization.gateway';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { EmploymentContractOrmEntity } from './infrastructure/persistence/employment-contract/employment-contract.orm-entity';
import { EmploymentContractUseCases } from './application/use-cases/employment-contract/employment-contract.use-case';
import { ExpireDueContractsUseCase } from './application/use-cases/employment-contract/expire-due-contracts.use-case';
import { EmployeeGuard } from './application/services/employee-guard';
import { ContractExpiryJob } from './infrastructure/jobs/contract-expiry.job';
import { TypeOrmEmploymentContractRepository } from './infrastructure/persistence/employment-contract/typeorm-employment-contract.repository';
import { TypeOrmContractQueries } from './infrastructure/persistence/employment-contract/typeorm-contract.queries';
import { CONTRACT_REPOSITORY } from './domain/employment-contract/repositories/employment-contract.repository';
import { CONTRACT_QUERIES } from './application/queries/contract.queries';
import { EmploymentContractController } from './presentation/controllers/employment-contract/employment-contract.controller';
import { ContractReportsController } from './presentation/controllers/employment-contract/contract-reports.controller';
import { ChangeAssignmentUseCase } from './application/use-cases/employee/change-assignment.use-case';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([
      EmployeeOrmEntity,
      JobHistoryOrmEntity,
      EmploymentContractOrmEntity,
    ]),
  ],
  controllers: [
    EmployeeController,
    EmploymentContractController,
    ContractReportsController,
  ],
  providers: [
    HireEmployeeUseCase,
    ChangeAssignmentUseCase,
    TerminateEmployeeUseCase,
    ReferenceValidator,
    EmploymentContractUseCases,
    ExpireDueContractsUseCase,
    EmployeeGuard,
    ContractExpiryJob,
    { provide: EMPLOYEE_REPOSITORY, useClass: TypeOrmEmployeeRepository },
    { provide: EMPLOYEE_QUERIES, useClass: TypeOrmEmployeeQueries },
    { provide: ORGANIZATION_GATEWAY, useClass: SqlOrganizationGateway },
    { provide: EVENT_PUBLISHER, useClass: NestEventPublisher },
    { provide: APP_FILTER, useClass: ErrorFilter },
    {
      provide: CONTRACT_REPOSITORY,
      useClass: TypeOrmEmploymentContractRepository,
    },
    { provide: CONTRACT_QUERIES, useClass: TypeOrmContractQueries },
  ],
})
export class EmployeeModule {}
