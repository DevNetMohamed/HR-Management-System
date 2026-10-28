import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../../OvertimeRequest/application/ports/authorization.gateway';
import type { TimeConfigurationRepository } from '../ports/time-configuration.repository';
import type { ShiftsRepository } from '../ports/shifts.repository';
import { TimeConfigurationUseCases } from './time-configuration.use-cases';
import { ShiftsUseCases } from './shifts.use-cases';

const principal: AuthenticatedPrincipal = {
  userId: 'user',
  employeeId: null,
  companyId: 'company',
  permissions: ['time_configuration.manage'],
};

describe('time configuration use cases', () => {
  it('checks permission before a holiday reaches persistence', () => {
    const createHoliday = jest.fn();
    const shifts = new ShiftsUseCases({} as ShiftsRepository);
    const useCases = new TimeConfigurationUseCases(
      { createHoliday } as unknown as TimeConfigurationRepository,
      shifts,
    );
    expect(() =>
      useCases.createHoliday(
        { ...principal, permissions: [] },
        {
          name: 'Labour Day',
          recurrence: 'yearly',
          startMonth: 5,
          startDay: 1,
          durationDays: 1,
          firstYear: 2026,
        },
      ),
    ).toThrow(ForbiddenException);
    expect(createHoliday).not.toHaveBeenCalled();
  });

  it('rejects impossible holiday dates before persistence', () => {
    const createHoliday = jest.fn();
    const shifts = new ShiftsUseCases({} as ShiftsRepository);
    const useCases = new TimeConfigurationUseCases(
      { createHoliday } as unknown as TimeConfigurationRepository,
      shifts,
    );
    expect(() =>
      useCases.createHoliday(principal, {
        name: 'Invalid holiday',
        recurrence: 'once',
        startDate: '2027-02-29',
        endDate: '2027-02-29',
      }),
    ).toThrow(BadRequestException);
    expect(createHoliday).not.toHaveBeenCalled();
  });

  it('passes the overnight offset to the shift repository', async () => {
    const create = jest
      .fn()
      .mockResolvedValue({ id: 'shift', versionId: 'version', version: 1 });
    const shifts = new ShiftsUseCases({
      create,
    } as unknown as ShiftsRepository);
    const input = {
      code: 'NIGHT',
      name: 'Night',
      startTime: '22:00',
      endTime: '06:00',
      breakMinutes: 30,
      effectiveFrom: '2026-11-01',
    };
    await shifts.create(principal, input);
    expect(create).toHaveBeenCalledWith(principal, input, 1);
  });
});
