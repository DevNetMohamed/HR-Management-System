export abstract class DomainEvent{
    readonly occurredAt = new Date();
    abstract readonly name: string;
}

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

export class EmployeeAssignmentChanged extends DomainEvent{
    readonly name =  'employee.assignment_changed';
    constructor(
        readonly companyId: string,
        readonly employeeId: string,
        readonly changeType: string, 
        readonly effectiveDate: string,
    ) { super(); }
}



export class EmployeeTerminated extends DomainEvent {
  readonly name = 'employee.terminated';
  constructor(
        readonly companyId: string, 
        readonly employeeId: string, 
        readonly lastWorkingDay: string
    ) { super(); }
}
