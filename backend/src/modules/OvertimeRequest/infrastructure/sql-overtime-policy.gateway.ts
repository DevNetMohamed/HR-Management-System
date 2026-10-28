import { Injectable } from '@nestjs/common';
import { TimeConfigurationUseCases } from '../../TimeConfiguration/application/use-cases/time-configuration.use-cases';
import { ShiftsUseCases } from '../../TimeConfiguration/application/use-cases/shifts.use-cases';
import type {
  OvertimePolicyGateway,
  OvertimePolicyValidationResult,
  ValidateRequestedMinutesInput,
} from '../application/ports/overtime-policy.gateway';

@Injectable()
export class SqlOvertimePolicyGateway implements OvertimePolicyGateway {
  constructor(
    private readonly time: TimeConfigurationUseCases,
    private readonly shifts: ShiftsUseCases,
  ) {}

  async validateRequestedMinutes(
    input: ValidateRequestedMinutesInput,
  ): Promise<OvertimePolicyValidationResult> {
    const shift = await this.shifts.resolveEmployeeShift(
      input.companyId,
      input.employeeId,
      input.workDate,
    );
    const branchId =
      shift?.branchId ??
      (await this.time.employeeBranch(input.companyId, input.employeeId)) ??
      undefined;
    const { attendancePolicy: policy } = await this.time.effectiveConfig(
      input.companyId,
      input.workDate,
      branchId,
    );
    if (!policy)
      return { valid: false, code: 'OVERTIME_POLICY_NOT_CONFIGURED' };
    if (!policy.overtime_enabled)
      return { valid: false, code: 'OVERTIME_DISABLED' };
    if (input.requestedMinutes < policy.overtime_min_minutes)
      return { valid: false, code: 'OVERTIME_BELOW_MINIMUM' };
    if (
      policy.overtime_max_minutes !== null &&
      input.requestedMinutes > policy.overtime_max_minutes
    ) {
      return { valid: false, code: 'OVERTIME_ABOVE_MAXIMUM' };
    }
    if (input.requestedMinutes > input.calculatedMinutes)
      return { valid: false, code: 'OVERTIME_EXCEEDS_CALCULATED' };
    return { valid: true };
  }
}
