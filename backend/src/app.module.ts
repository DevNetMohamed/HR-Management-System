import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { SecurityModule } from './infrastructure/security/security.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { EmployeeModule } from './modules/Employee/employee.module';
import { OvertimeRequestModule } from './modules/OvertimeRequest/overtime-request.module';
import { CompanyModule } from './modules/Company/company.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    EmployeeModule,
    SecurityModule,
    OvertimeRequestModule,
    CompanyModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
