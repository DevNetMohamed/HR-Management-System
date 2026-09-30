import { Inject, Injectable } from "@nestjs/common";
import {  EMPLOYEE_REPOSITORY, type EmployeeRepository } from "../../domain/employee.repository";
import { EVENT_PUBLISHER, type DomainEventPublisher } from "../ports/event-publisher.port";
import { ReferenceValidator } from "../services/reference-validator";
import { AssignmentChange } from "../../domain/employee.entity";
import { NotFoundError } from "../errors";

@Injectable()
export class ChangeAssignmentUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY) private readonly employees: EmployeeRepository,
    @Inject(EVENT_PUBLISHER) private readonly publisher: DomainEventPublisher,
    private readonly refs: ReferenceValidator,
  ) {}

  async execute(cmd: { companyId: string; employeeId: string } & AssignmentChange) {
    const employee = await this.employees.findById(cmd.companyId, cmd.employeeId);
    if (!employee) throw new NotFoundError('Employee not found');

    await this.refs.validate(cmd.companyId, cmd);
    employee.changeAssignment(cmd);

    await this.employees.save(employee);
    await this.publisher.publish(employee.pullEvents());
  }
}
