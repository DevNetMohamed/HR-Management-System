export abstract class DomainEvent{
    readonly occurredAt = new Date();
    abstract readonly name: string;
}


export class EmployeeTerminated extends DomainEvent {
  readonly name = 'employee.terminated';
  constructor(
        readonly companyId: string, 
        readonly employeeId: string, 
        readonly lastWorkingDay: string
    ) { super(); }
}
