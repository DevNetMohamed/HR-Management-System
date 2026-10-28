import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './infrastructure/database/database.module';
import { EmployeeModule } from './modules/Employee/employee.module';
import { OvertimeRequestModule } from './modules/OvertimeRequest/overtime-request.module';
import { TimeConfigurationModule } from './modules/TimeConfiguration/time-configuration.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    EmployeeModule,
    TimeConfigurationModule,
    OvertimeRequestModule,
  ],
})
export class AppModule {}
