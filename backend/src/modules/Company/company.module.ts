import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CreateCompanyUseCase } from './application/use-cases/create-company.use-case';
import { COMPANY_REPOSITORY } from './domain/repositories/company.repository';
import { CompanyController } from './presentation/controllers/company/company.controller';
import { TypeOrmCompanyRepository } from './infrastructure/persistence/company/typeorm-company.repository';
import { CompanyOrmEntity } from './infrastructure/persistence/company/company.orm-entity';
import { CompanyNotificationRuleOrmEntity } from './infrastructure/persistence/company-notification-rule.orm-entity';
import { CompanySetupDraftOrmEntity } from './infrastructure/persistence/company-setup-draft.orm-entity';
import { CompanyConfigurationVersionOrmEntity } from './infrastructure/persistence/company-configuration-version.orm-entity';
import { CompanySettingsService } from './application/company-settings.service';
import { CompanySettingsController } from './presentation/controllers/company/company-settings.controller';
import { AccessControlModule } from '../AccessControl/access-control.module';
import { UserModule } from '../User/user.module';

@Module({
  imports: [
    DatabaseModule,
    AccessControlModule,
    UserModule,
    TypeOrmModule.forFeature([CompanyOrmEntity, CompanyNotificationRuleOrmEntity, CompanySetupDraftOrmEntity, CompanyConfigurationVersionOrmEntity]),
  ],
  controllers: [CompanyController, CompanySettingsController],
  providers: [
    CreateCompanyUseCase,
    CompanySettingsService,
    {
      provide: COMPANY_REPOSITORY,
      useClass: TypeOrmCompanyRepository,
    },
  ],
})
export class CompanyModule {}
