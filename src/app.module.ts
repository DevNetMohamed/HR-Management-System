import { Module } from '@nestjs/common';
import { DatabaseModule } from './infrastructure/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { EmployeeModule } from './modules/Employee/employee.module';
import { CompanyModule } from './modules/Company/company.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    DatabaseModule,
    EmployeeModule,
    CompanyModule,
  ],
})
export class AppModule {}