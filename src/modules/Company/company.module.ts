import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { COMPANY_REPOSITORY } from './domain/repositories/company.repository';
import { CompanyOrmEntity } from './infrastructure/persistence/company.orm-entity';
import { TypeOrmCompanyRepository } from './infrastructure/persistence/typeorm-company.repository';
import { CreateCompanyUseCase } from './application/use-cases/create-company.use-case';
import { ActivateCompanyUseCase } from './application/use-cases/activate-company.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyOrmEntity])],
  providers: [
    { provide: COMPANY_REPOSITORY, useClass: TypeOrmCompanyRepository },
    CreateCompanyUseCase,
    ActivateCompanyUseCase,
  ],
  exports: [CreateCompanyUseCase, ActivateCompanyUseCase],
})
export class CompanyModule {}