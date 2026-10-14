import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CreateCompanyUseCase } from './application/use-cases/create-company.use-case';
import { COMPANY_REPOSITORY } from './domain/repositories/company.repository';
import { CompanyController } from './presentation/controllers/company/company.controller';
import { TypeOrmCompanyRepository } from './infrastructure/persistence/company/typeorm-company.repository';
import { CompanyOrmEntity } from './infrastructure/persistence/company/company.orm-entity';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([CompanyOrmEntity]),
  ],
  controllers: [CompanyController],
  providers: [
    CreateCompanyUseCase,
    {
      provide: COMPANY_REPOSITORY,
      useClass: TypeOrmCompanyRepository,
    },
  ],
})
export class CompanyModule {}