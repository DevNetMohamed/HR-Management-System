import { ContractType } from '../Enums/Employee-Contract-enums';
import { DomainError } from '../../errors/domain.errors';
import { assertIsoDate } from '../../value-objects/iso-date';
import { ContractTerms } from '../interfaces/employee-contract-interface';

export const fail = (message: string, code: string) => new DomainError(message, code);
export const inRange = (v: number, min: number, max: number) =>
  Number.isInteger(v) && v >= min && v <= max;

export function validateTerms(t: ContractTerms) {
  assertIsoDate(t.startDate, 'startDate');
  if (t.endDate !== null) {
    assertIsoDate(t.endDate, 'endDate');
    if (t.endDate < t.startDate) {
      throw fail(
        'End date cannot be before start date',
        'CONTRACT_END_BEFORE_START',
      );
    }

    if (t.contractType === ContractType.PERMANENT && t.endDate != null) {
      throw fail(
        'A permanent contract cannot have an end date',
        'CONTRACT_PERMANENT_HAS_END',
      );
    }

    if (t.contractType !== ContractType.PERMANENT && t.endDate === null) {
      throw fail(
        'End date is required for this contract type',
        'CONTRACT_END_REQUIRED',
      );
    }
    if (t.probationMonths !== null && !inRange(t.probationMonths, 0, 12)) {
      throw fail(
        'Probation must be between 0 and 12 months',
        'CONTRACT_INVALID_PROBATION',
      );
    }
    if (t.noticePeriodDays !== null && !inRange(t.noticePeriodDays, 0, 180)) {
      throw fail(
        'Notice period must be between 0 and 180 days',
        'CONTRACT_INVALID_NOTICE',
      );
    }
  }
}

export function normalizeUrl(url?: string | null): string | null {
  const value = url?.trim();
  if (!value) return null;
  if (value.length > 500)
    throw fail('Document URL is too long', 'CONTRACT_INVALID_DOCUMENT');
  return value;
}

export type CreateContractInput = Pick<
  ContractTerms,
  'contractType' | 'startDate'
> &
  Partial<
    Pick<ContractTerms, 'endDate' | 'probationMonths' | 'noticePeriodDays'>
  > & {
    companyId: string;
    employeeId: string;
    documentUrl?: string | null;
  };

