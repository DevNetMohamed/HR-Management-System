import { Inject, Injectable } from '@nestjs/common';
import { Employee, HireInput } from '../../../domain/Employees/entities/employee.entity';
import { EMPLOYEE_REPOSITORY, type EmployeeRepository } from '../../../domain/Employees/repositories/employee.repository';
import { EVENT_PUBLISHER, type DomainEventPublisher } from '../../ports/event-publisher.port';
import { ReferenceValidator } from '../../services/reference-validator';
import { ConflictError } from '../../errors';

export type HireEmployeeCommand = Omit<HireInput, 'employeeNumber'>;

@Injectable()
export class HireEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY) private readonly employees: EmployeeRepository,
    @Inject(EVENT_PUBLISHER) private readonly publisher: DomainEventPublisher,
    private readonly refs: ReferenceValidator,
  ) {}

  async execute(cmd: HireEmployeeCommand) {
    if (await this.employees.emailExists(cmd.companyId, cmd.email)) {
      throw new ConflictError('An employee with this email already exists');
    }
    await this.refs.validate(cmd.companyId, cmd);

    const employee = Employee.hire({
      ...cmd,
      employeeNumber: await this.employees.nextEmployeeNumber(cmd.companyId),
    });

    await this.employees.save(employee);
    await this.publisher.publish(employee.pullEvents());

    return { id: employee.id, employeeNumber: employee.toSnapshot().employeeNumber };
  }
}