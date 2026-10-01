import { DomainError } from '../../errors/domain.errors';
import { EmploymentContract } from '../Entity/EmploymentContract';
import { Period } from '../interfaces/employee-contract-interface';

export function periodsOverlap(a: Period, b: Period): boolean {
  const aEndsBeforeB = a.end !== null && a.end < b.start;
  const bEndsBeforeA = b.end !== null && b.end < a.start;
  return !aEndsBeforeB && !bEndsBeforeA;
}

export class ContractPolicy {
  static assertCanActivate(
    candidate: EmploymentContract,
    activeContracts: readonly EmploymentContract[],
  ) {
    const clash = activeContracts.find(
      (c) =>
        c.id !== candidate.id && periodsOverlap(candidate.period, c.period),
    );
    if (clash) {
      throw new DomainError(
        `Contract period overlaps with active contract ${clash.id}`,
        'CONTRACT_OVERLAP',
      );
    }
  }
}
