import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { COMPANY_REPOSITORY } from './domain/repositories/company.repository';
import { CompanyOrmEntity } from './infrastructure/persistence/company.orm-entity';
import { TypeOrmCompanyRepository } from './infrastructure/persistence/typeorm-company.repository';
import { CreateCompanyUseCase } from './application/use-cases/create-company.use-case';
import { ActivateCompanyUseCase } from './application/use-cases/activate-company.use-case';
import { SuspendCompanyUseCase } from './application/use-cases/suspend-company.use-case';
import { CompanyController } from './presentation/company.controller';
import { CompanyErrorFilter } from './presentation/company.error.filter';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyOrmEntity])],
  controllers: [CompanyController],
  providers: [
    { provide: APP_FILTER, useClass: CompanyErrorFilter },
    { provide: COMPANY_REPOSITORY, useClass: TypeOrmCompanyRepository },
    CreateCompanyUseCase,
    ActivateCompanyUseCase,
    SuspendCompanyUseCase,
  ],
  exports: [CreateCompanyUseCase, ActivateCompanyUseCase, SuspendCompanyUseCase],
})
export class CompanyModule {}