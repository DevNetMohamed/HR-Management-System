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
import { EmergencyContactOrmEntity } from './infrastructure/persistence/emergency-contact/emergency-contacts.orm-entity';
import { EmergencyContactController } from './presentation/controllers/emergency-contact/emergency-contact.controller';
import { EmergencyContactUseCases } from './application/use-cases/emergency-contact/emergency-contact.use-cases';
import { EMERGENCY_CONTACT_REPOSITORY } from './domain/emergency-contact/repositories/emergency-contact.repository';
import { TypeOrmEmergencyContactRepository } from './infrastructure/persistence/emergency-contact/typeorm-emergency-contact.repository';
import { TypeOrmEmergencyContactQueries } from './infrastructure/persistence/emergency-contact/typeorm-emergency-contact.queries';
import { EMERGENCY_CONTACT_QUERIES } from './application/queries/emergency-contact.queries';
import { EmployeeDependentOrmEntity } from './infrastructure/persistence/employee-dependent/employee-dependent.orm-entity';
import { EmployeeDependentController } from './presentation/controllers/employee-dependent/employee-dependent.controller';
import { EmployeeDependentUseCases } from './application/use-cases/employee-dependent/employee-dependent.use-cases';
import { EMPLOYEE_DEPENDENT_REPOSITORY } from './domain/employee-dependents/repositories/employee-dependent.repository';
import { EMPLOYEE_DEPENDENT_QUERIES } from './application/queries/employee-dependent.queries';
import { TypeOrmEmployeeDependentRepository } from './infrastructure/persistence/employee-dependent/typeorm-employee-dependent.repository';
import { TypeOrmEmployeeDependentQueries } from './infrastructure/persistence/employee-dependent/typeorm-employee-dependent.queries';
import { EmployeeBankAccountOrmEntity } from './infrastructure/persistence/employee-bank-account/employee-bank-account.orm-entity';
import { EmployeeBankAccountController } from './presentation/controllers/employee-bank-account/employee-bank-account.controller';
import { EmployeeBankAccountUseCases } from './application/use-cases/employee-bank-account/employee-bank-account.use-cases';
import { EmployeeBankAccountMapper } from './infrastructure/persistence/employee-bank-account/employee-bank-account.mapper';
import { EMPLOYEE_BANK_ACCOUNT_REPOSITORY } from './domain/employee-bank-accounts/repositories/employee-bank-account.repository';
import { EMPLOYEE_BANK_ACCOUNT_QUERIES } from './application/queries/employee-bank-account.queries';
import { TypeOrmEmployeeBankAccountRepository } from './infrastructure/persistence/employee-bank-account/typeorm-employee-bank-account.repository';
import { TypeOrmEmployeeBankAccountQueries } from './infrastructure/persistence/employee-bank-account/typeorm-employee-bank-account.queries';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([
      EmployeeOrmEntity,
      JobHistoryOrmEntity,
      EmploymentContractOrmEntity,
      EmergencyContactOrmEntity,
      EmployeeDependentOrmEntity,
      EmployeeBankAccountOrmEntity,
    ]),
  ],
  controllers: [
    EmployeeController,
    EmploymentContractController,
    ContractReportsController,
    EmergencyContactController,
    EmployeeDependentController,
    EmployeeBankAccountController,
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
    EmergencyContactUseCases,
    EmployeeDependentUseCases,
    EmployeeBankAccountUseCases,
    EmployeeBankAccountMapper,
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
    {
      provide: EMERGENCY_CONTACT_REPOSITORY,
      useClass: TypeOrmEmergencyContactRepository,
    },
    {
      provide: EMERGENCY_CONTACT_QUERIES,
      useClass: TypeOrmEmergencyContactQueries,
    },
    {
      provide: EMPLOYEE_DEPENDENT_REPOSITORY,
      useClass: TypeOrmEmployeeDependentRepository,
    },
    {
      provide: EMPLOYEE_DEPENDENT_QUERIES,
      useClass: TypeOrmEmployeeDependentQueries,
    },
    {
      provide: EMPLOYEE_BANK_ACCOUNT_REPOSITORY,
      useClass: TypeOrmEmployeeBankAccountRepository,
    },
    {
      provide: EMPLOYEE_BANK_ACCOUNT_QUERIES,
      useClass: TypeOrmEmployeeBankAccountQueries,
    },
  ],
})
export class EmployeeModule {}
