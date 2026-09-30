import { Inject, Injectable } from "@nestjs/common";
import { EMPLOYEE_REPOSITORY, type EmployeeRepository } from "../../domain/employee.repository";
import { EVENT_PUBLISHER, type DomainEventPublisher } from "../ports/event-publisher.port";
import { NotFoundError } from "../errors";

@Injectable()
export class TerminateEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY) private readonly employees: EmployeeRepository,
    @Inject(EVENT_PUBLISHER) private readonly publisher: DomainEventPublisher,
  ) {}

  async execute(cmd: { companyId: string; employeeId: string; lastWorkingDay: string }) {
    const employee = await this.employees.findById(cmd.companyId, cmd.employeeId);
    if (!employee) throw new NotFoundError('Employee not found');

    employee.terminate(cmd.lastWorkingDay);   // لازم يكون OFFBOARDING أو ONBOARDING

    await this.employees.save(employee);
    await this.publisher.publish(employee.pullEvents());
  }
}