import { TimeConfigurationService } from '../../TimeConfiguration/time-configuration.service';
import { ShiftsService } from '../../TimeConfiguration/shifts.service';
import { SqlOvertimePolicyGateway } from './sql-overtime-policy.gateway';

describe('overtime policy gateway', () => {
  const input = {
    companyId: 'company',
    employeeId: 'employee',
    attendanceId: 'attendance',
    requestedMinutes: 90,
    calculatedMinutes: 100,
    workDate: '2027-05-01',
  };
  it('honors policy limits on the work date', async () => {
    const effectiveConfig = jest.fn().mockResolvedValue({
      attendancePolicy: {
        overtime_enabled: true,
        overtime_min_minutes: 30,
        overtime_max_minutes: 60,
      },
    });
    const time = {
      effectiveConfig,
      employeeBranch: jest.fn().mockResolvedValue(null),
    } as unknown as TimeConfigurationService;
    const shifts = {
      resolveEmployeeShift: jest.fn().mockResolvedValue(null),
    } as unknown as ShiftsService;
    const gateway = new SqlOvertimePolicyGateway(time, shifts);
    expect(await gateway.validateRequestedMinutes(input)).toEqual({
      valid: false,
      code: 'OVERTIME_ABOVE_MAXIMUM',
    });
    expect(effectiveConfig).toHaveBeenCalledWith(
      'company',
      '2027-05-01',
      undefined,
    );
  });
});
