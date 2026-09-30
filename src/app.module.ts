import { Module } from '@nestjs/common';
import { DatabaseModule } from './infrastructure/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { EmployeeModule } from './modules/Employee/employee.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
     ConfigModule.forRoot({
      isGlobal: true,
    }),

    DatabaseModule,
    EmployeeModule
  ],
})
export class AppModule {}