import { DomainEvent } from "src/common/domain-event/DomainEvent.base";

export class EmployeeHired extends DomainEvent {
  readonly name = 'employee.hired';
  constructor(
    readonly companyId: string,
    readonly employeeId: string, 
    readonly hireDate: string,
    readonly departmentId: string | null, 
    readonly positionId: string | null,
  ) { super(); }
}