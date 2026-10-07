import { Injectable } from '@nestjs/common';
import type {
  OvertimePolicyGateway,
  OvertimePolicyValidationResult,
  ValidateRequestedMinutesInput,
} from '../application/ports/overtime-policy.gateway';

/**
 * Safe temporary adapter while the Attendance Policy module is absent.
 * It deliberately fails closed instead of silently approving unvalidated time.
 */
@Injectable()
export class UnavailableOvertimePolicyGateway implements OvertimePolicyGateway {
  async validateRequestedMinutes(
    _input: ValidateRequestedMinutesInput,
  ): Promise<OvertimePolicyValidationResult> {
    return {
      valid: false,
      code: 'OVERTIME_POLICY_NOT_CONFIGURED',
    };
  }
}
