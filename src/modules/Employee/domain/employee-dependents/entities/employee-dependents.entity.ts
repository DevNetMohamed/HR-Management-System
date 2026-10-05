import { DomainError } from 'src/common/domain-error/DomainError.base';
import { assertIsoDate, IsoDate } from '../../value-objects/iso-date';
import {
  DependentRelationship,
  isDependentRelationship,
} from '../enums/employee-dependent.enums';
import { randomUUID } from 'crypto';

export interface EmployeeDependentProps {
  id: string;
  company_id: string;
  employee_id: string;
  name: string;
  relationship: string;
  dateOfBirth: IsoDate | null;
  coveredByInsurance: boolean;
}

type Editable = Pick<
  EmployeeDependentProps,
  'name' | 'relationship' | 'dateOfBirth'
>;

const MIN_BIRTH_DATE = '2000-01-01';
const fail = (message: string, code: string) => new DomainError(message, code);

function normalize(input: Editable, today: IsoDate): Editable {
  const name = input.name?.trim();
  if (!name) throw fail('Name is required', 'DEPENDENT_NAME_REQUIRED');
  if (name.length > 150)
    throw fail('Name is too long', 'DEPENDENT_NAME_TOO_LONG');

  if (!isDependentRelationship(input.relationship)) {
    throw fail('Invalid relationship', 'DEPENDENT_INVALID_RELATIONSHIP');
  }

  const dateOfBirth = input.dateOfBirth ?? null;
  if (dateOfBirth !== null) {
    assertIsoDate(dateOfBirth, 'dateOfBirth');
    if (dateOfBirth > today)
      throw fail(
        'Date of birth cannot be in the future',
        'DEPENDENT_DOB_FUTURE',
      );
    if (dateOfBirth < MIN_BIRTH_DATE)
      throw fail('Date of birth is not valid', 'DEPENDENT_DOB_TOO_OLD');
  }
  if (
    input.relationship === DependentRelationship.CHILD &&
    dateOfBirth === null
  ) {
    throw fail(
      'Date of birth is required for a child',
      'DEPENDENT_CHILD_DOB_REQUIRED',
    );
  }
  return { name, relationship: input.relationship, dateOfBirth };
}

export type CreateDependentInput = Pick<
  EmployeeDependentProps,
  'company_id' | 'employee_id' | 'name' | 'relationship'
> & { dateOfBirth?: IsoDate | null; coveredByInsurance?: boolean };

export class EmployeeDependent {
  private constructor(private props: EmployeeDependentProps) {}

  static create(
    input: CreateDependentInput,
    today: IsoDate,
  ): EmployeeDependent {
    return new EmployeeDependent({
      id: randomUUID(),
      company_id: input.company_id,
      employee_id: input.employee_id,
      ...normalize(
        {
          name: input.name,
          relationship: input.relationship,
          dateOfBirth: input.dateOfBirth ?? null,
        },
        today,
      ),
      coveredByInsurance: input.coveredByInsurance ?? false,
    });
  }

  static restore(props: EmployeeDependentProps): EmployeeDependent {
    return new EmployeeDependent(props);
  }

  update(patch: Partial<Editable>, today: IsoDate) {
    const defiend = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    );
    const next = normalize({ ...this.props, ...defiend } as Editable, today);
    Object.assign(this.props, next);
  }

  setInsuranceCoverage(covered: boolean) {
    this.props.coveredByInsurance = covered;
  }

  // getter

  get id() {
    return this.props.id;
  }
  get companyId() {
    return this.props.company_id;
  }

  get employeeId() {
    return this.props.employee_id;
  }
  get snapshot(): Readonly<EmployeeDependentProps> {
    return { ...this.props };
  }
}
