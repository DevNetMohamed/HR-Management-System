import { Module } from '@nestjs/common';
import { DatabaseModule } from './infrastructure/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { EmployeeModule } from './modules/Employee/employee.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { SecurityModule } from './infrastructure/security/security.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
     ConfigModule.forRoot({
      isGlobal: true,
    }),

    DatabaseModule,
    EmployeeModule,
    SecurityModule
  ],
})
export class AppModule {}