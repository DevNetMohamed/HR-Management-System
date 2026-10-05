import { DomainEvent } from "src/common/domain-event/DomainEvent.base";


export class EmployeeTerminated extends DomainEvent {
  readonly name = 'employee.terminated';
  constructor(
        readonly companyId: string, 
        readonly employeeId: string, 
        readonly lastWorkingDay: string
    ) { super(); }
}
