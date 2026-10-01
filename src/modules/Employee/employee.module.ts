import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeOrmEntity } from './infrastructure/persistence/Employee-orm-entity/employee.orm-entity';
import { JobHistoryOrmEntity } from './infrastructure/persistence/job-history.orm-entity/job-history.orm-entity';
import { EmployeeController } from './presentation/Controller/Employee-Controller/employee.controller';
import { HireEmployeeUseCase } from './application/use-cases/Employee-UseCase/hire-employee.use-case';
import { TerminateEmployeeUseCase } from './application/use-cases/Employee-UseCase/terminate-employee.use-case';
import { ReferenceValidator } from './application/services/reference-validator';
import { EMPLOYEE_REPOSITORY } from './domain/Employees/interfaces/employee.repository';
import { TypeOrmEmployeeRepository } from './infrastructure/persistence/Employee-orm-entity/typeorm-employee.repository';
import { TypeOrmEmployeeQueries } from './infrastructure/persistence/Employee-orm-entity/typeorm-employee.queries';
import { EMPLOYEE_QUERIES } from './application/queries/employee.queries';
import { ORGANIZATION_GATEWAY } from './application/ports/organization.gateway';
import { EVENT_PUBLISHER } from './application/ports/event-publisher.port';
import { APP_FILTER } from '@nestjs/core';
import { ErrorFilter } from './presentation/error.filter';
import { NestEventPublisher } from './infrastructure/nest-event.publisher';
import { SqlOrganizationGateway } from './infrastructure/sql-organization.gateway';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { EmploymentContractOrmEntity } from './infrastructure/persistence/employment-contract.orm-entity/employment-contract.orm-entity';
import { EmploymentContractUseCases } from './application/use-cases/Contract-UseCase/employment-contract.use-cases';
import { ExpireDueContractsUseCase } from './application/use-cases/Contract-UseCase/expire-due-contracts.use-case';
import { EmployeeGuard } from './application/services/employee-guard';
import { ContractExpiryJob } from './infrastructure/jobs/contract-expiry.job';
import { TypeOrmEmploymentContractRepository } from './infrastructure/persistence/employment-contract.orm-entity/typeorm-employment-contract.repository';
import { TypeOrmContractQueries } from './infrastructure/persistence/employment-contract.orm-entity/typeorm-contract.queries';
import { CONTRACT_REPOSITORY } from './domain/employmee_contract/interfaces/employment-contract.repository';
import { CONTRACT_QUERIES } from './application/queries/contract.queries';
import { EmploymentContractController } from './presentation/Controller/Employment-Contract/employment-contract.controller';
import { ContractReportsController } from './presentation/Controller/Employment-Contract/contract-reports.controller';
import { ChangeAssignmentUseCase } from './application/use-cases/Employee-UseCase/change-assignment.use-case';

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
