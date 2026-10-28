import { Module } from '@nestjs/common';
import { TimeConfigurationController } from './presentation/controllers/time-configuration.controller';
import { ShiftsController } from './presentation/controllers/shifts.controller';
import { TimeConfigurationUseCases } from './application/use-cases/time-configuration.use-cases';
import { ShiftsUseCases } from './application/use-cases/shifts.use-cases';
import { TIME_CONFIGURATION_REPOSITORY } from './application/ports/time-configuration.repository';
import { SHIFTS_REPOSITORY } from './application/ports/shifts.repository';
import { SqlTimeConfigurationRepository } from './infrastructure/persistence/sql-time-configuration.repository';
import { SqlShiftsRepository } from './infrastructure/persistence/sql-shifts.repository';

@Module({
  controllers: [TimeConfigurationController, ShiftsController],
  providers: [
    TimeConfigurationUseCases,
    ShiftsUseCases,
    SqlTimeConfigurationRepository,
    {
      provide: TIME_CONFIGURATION_REPOSITORY,
      useExisting: SqlTimeConfigurationRepository,
    },
    { provide: SHIFTS_REPOSITORY, useClass: SqlShiftsRepository },
  ],
  exports: [TimeConfigurationUseCases, ShiftsUseCases],
})
export class TimeConfigurationModule {}
