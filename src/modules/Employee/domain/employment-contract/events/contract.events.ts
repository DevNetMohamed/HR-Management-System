import { DomainEvent } from '../../Employees/events/employee-terminated.events';

export class ContractActivated extends DomainEvent
{
  readonly name = 'contract.activated';
  constructor(
    readonly companyId: string,
    readonly employeeId: string,
    readonly contractId: string,
    readonly startDate: string,
    readonly endDate: string | null,
  ) {
    super();
  }
}
export class ContractTerminated extends DomainEvent 
{
  readonly name = 'contract.terminated';
  constructor(
    readonly companyId: string,
    readonly employeeId: string,
    readonly contractId: string,
    readonly terminationDate: string,
  ) {
    super();
  }
}
export class ContractExpired extends DomainEvent
{
  readonly name = 'contract.expired';
  constructor(
    readonly companyId: string,
    readonly employeeId: string,
    readonly contractId: string,
    readonly endDate: string,
  ) {
    super();
  }
}
