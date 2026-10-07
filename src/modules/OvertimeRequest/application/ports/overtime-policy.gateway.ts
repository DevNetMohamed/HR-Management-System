export type OvertimePolicyValidationResult =
  | {
      valid: true;
    }
  | {
      valid: false;
      code: string;
    };

export interface ValidateRequestedMinutesInput {
  companyId: string;
  employeeId: string;
  attendanceId: string;
  requestedMinutes: number;
  calculatedMinutes: number;
  workDate: string;
}

export interface OvertimePolicyGateway {
  validateRequestedMinutes(
    input: ValidateRequestedMinutesInput,
  ): Promise<OvertimePolicyValidationResult>;
}

export const OVERTIME_POLICY_GATEWAY = Symbol('OVERTIME_POLICY_GATEWAY');
