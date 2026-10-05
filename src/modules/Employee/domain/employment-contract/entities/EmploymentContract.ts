import { DomainEvent } from 'src/common/domain-event/DomainEvent.base';
import { assertIsoDate, IsoDate } from '../../value-objects/iso-date';
import { ContractStatus } from '../enums/employment-contract.enums';
import {
  ContractActivated,
  ContractExpired,
  ContractTerminated,
} from '../events/contract.events';
import {
  ContractTerms,
  EmploymentContractProps,
  Period,
} from '../interfaces/employee-contract-interface';
import {
  CreateContractInput,
  fail,
  normalizeUrl,
  validateTerms,
} from './employment-contract.entity';
import { randomUUID } from 'crypto';

export class EmploymentContract {
  private events: DomainEvent[] = [];
  private constructor(private props: EmploymentContractProps) {}

  private get terms(): ContractTerms {
    const {
      contractType,
      startDate,
      endDate,
      probationMonths,
      noticePeriodDays,
    } = this.props;
    return {
      contractType,
      startDate,
      endDate,
      probationMonths,
      noticePeriodDays,
    };
  }
  private assertStatus(expected: string, message: string, code: string) {
    if (this.props.status !== expected) throw fail(message, code);
  }

  static create(input: CreateContractInput): EmploymentContract {
    const terms: ContractTerms = {
      contractType: input.contractType,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      probationMonths: input.probationMonths ?? null,
      noticePeriodDays: input.noticePeriodDays ?? null,
    };

    validateTerms(terms);
    return new EmploymentContract({
      id: randomUUID(),
      companyId: input.companyId,
      employeeId: input.employeeId,
      ...terms,
      status: ContractStatus.DRAFT,
      documentUrl: normalizeUrl(input.documentUrl),
      terminationReason: null,
    });
  }

  static restore(props: EmploymentContractProps): EmploymentContract {
    return new EmploymentContract(props);
  }

  updateTerms(patch: Partial<ContractTerms>) {
    this.assertStatus(
      ContractStatus.DRAFT,
      'Only draft contracts can be edited',
      'CONTRACT_NOT_EDITABLE',
    );
    const defined = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined),
    );
    const next = { ...this.terms, ...defined } as ContractTerms;
    validateTerms(next);
    Object.assign(this.props, next);
  }

  attachDocument(url: string | null) {
    this.props.documentUrl = normalizeUrl(url);
  }

  activate() {
    this.assertStatus(
      ContractStatus.DRAFT,
      'Only draft contracts can be activated',
      'CONTRACT_NOT_DRAFT',
    );
    this.props.status = ContractStatus.ACTIVE;
    this.events.push(
      new ContractActivated(
        this.props.id,
        this.props.companyId,
        this.props.employeeId,
        this.props.startDate,
        this.props.endDate,
      ),
    );
  }

  terminate(on: IsoDate, reason?: string) {
    this.assertStatus(
      ContractStatus.ACTIVE,
      'Only active contracts can be terminated',
      'CONTRACT_NOT_ACTIVE',
    );
    assertIsoDate(on, 'terminationDate');
    if (
      on < this.props.startDate ||
      (this.props.endDate !== null && on > this.props.endDate)
    ) {
      throw fail(
        'Termination date must fall within the contract period',
        'CONTRACT_TERMINATION_OUT_OF_RANGE',
      );
    }
    this.props.status = ContractStatus.TERMINATED;
    this.props.endDate = on;
    this.props.terminationReason = reason?.trim() || null;
    this.events.push(
      new ContractTerminated(
        this.props.companyId,
        this.props.employeeId,
        this.props.id,
        on,
      ),
    );
  }

  expire(today: IsoDate) {
    this.assertStatus(
      ContractStatus.ACTIVE,
      'Only active contracts can expire',
      'CONTRACT_NOT_ACTIVE',
    );
    assertIsoDate(today, 'today');
    if (this.props.endDate === null || this.props.endDate >= today) {
      throw fail('Contract has not reached its end date', 'CONTRACT_NOT_DUE');
    }
    this.props.status = ContractStatus.EXPIRED;
    this.events.push(
      new ContractExpired(
        this.props.companyId,
        this.props.employeeId,
        this.props.id,
        this.props.endDate,
      ),
    );
  }

  assertRemovable() {
    this.assertStatus(
      ContractStatus.DRAFT,
      'Only draft contracts can be deleted',
      'CONTRACT_NOT_REMOVABLE',
    );
  }

  get id() {
    return this.props.id;
  }
  get companyId() {
    return this.props.companyId;
  }
  get employeeId() {
    return this.props.employeeId;
  }
  get status() {
    return this.props.status;
  }
  get period(): Period {
    return { start: this.props.startDate, end: this.props.endDate };
  }
  get snapshot(): Readonly<EmploymentContractProps> {
    return { ...this.props };
  }
  pullEvents(): DomainEvent[] {
    const event = this.events;
    this.events = [];
    return event;
  }
}
