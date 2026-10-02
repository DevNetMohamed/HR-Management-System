import { DomainEvent } from "./employee-terminated.events";

export class EmployeeAssignmentChanged extends DomainEvent{
    readonly name =  'employee.assignment_changed';
    constructor(
        readonly companyId: string,
        readonly employeeId: string,
        readonly changeType: string, 
        readonly effectiveDate: string,
    ) { super(); }
}