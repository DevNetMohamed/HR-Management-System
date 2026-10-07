import { Inject, Injectable } from '@nestjs/common';
import {
  EMPLOYEE_REPOSITORY,
  type EmployeeRepository,
} from '../../domain/Employees/repositories/employee.repository';
import { NotFoundError, ValidationError } from '../errors';
import { EmployeeStatus } from '../../domain/Employees/Enums/Employee-enums';

@Injectable()
export class EmployeeGuard {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY) private readonly employees: EmployeeRepository,
  ) {}

    private async load(companyId: string, employeeId: string) {
    const employee = await this.employees.findById(companyId, employeeId);
    if (!employee) throw new NotFoundError('Employee not found');
    return employee;
  }

  async assertExists(companyId: string, employeeId: string): Promise<void> {
    await this.load(companyId, employeeId);
  }


  async assertEditable(companyId: string, employeeId: string): Promise<void> {
    const e = await this.load(companyId, employeeId);
    if (e.status === EmployeeStatus.TERMINATED) throw new ValidationError('Employee is terminated');
  }

  async assertCanHaveContract(
    companyId: string,
    employeeId: string,
  ): Promise<{ hireDate: string }> {
    const employee = await this.load(companyId, employeeId);
    if (!employee) throw new NotFoundError('Employee not found');
    if (employee.status === EmployeeStatus.TERMINATED) {
      throw new ValidationError('Employee is terminated');
    }
    return { hireDate: employee.toSnapshot().hireDate };
  }
}
