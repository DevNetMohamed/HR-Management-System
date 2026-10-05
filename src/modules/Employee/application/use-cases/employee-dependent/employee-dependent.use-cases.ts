import { Inject, Injectable } from '@nestjs/common';
import {
  EMPLOYEE_DEPENDENT_REPOSITORY,
  type EmployeeDependentRepository,
} from 'src/modules/Employee/domain/employee-dependents/repositories/employee-dependent.repository';
import { EmployeeGuard } from '../../services/employee-guard';
import { ConflictError, NotFoundError, ValidationError } from '../../errors';
import {
  CreateDependentInput,
  EmployeeDependent,
  EmployeeDependentProps,
} from 'src/modules/Employee/domain/employee-dependents/entities/employee-dependents.entity';
import { DependentRelationship } from 'src/modules/Employee/domain/employee-dependents/enums/employee-dependent.enums';
import {
  IsoDate,
  todayIn,
} from 'src/modules/Employee/domain/value-objects/iso-date';

const MAX_DEPENDENTS = 10;
type Scope = { companyId: string; employeeId: string; id: string };

@Injectable()
export class EmployeeDependentUseCases {
  constructor(
    @Inject(EMPLOYEE_DEPENDENT_REPOSITORY)
    private readonly dependents: EmployeeDependentRepository,
    private readonly employees: EmployeeGuard,
  ) {}

  private async load({ companyId, employeeId, id }: Scope) {
    const dependent = await this.dependents.findById(companyId, id);
    if (!dependent || dependent.employeeId !== employeeId)
      throw new NotFoundError('Dependent not found');
    return dependent;
  }

  private async assertRules(depend: EmployeeDependent) {
    const { company_id, employee_id, relationship, name, dateOfBirth } =
      depend.snapshot;

    if (
      relationship === DependentRelationship.SPOUSE &&
      (await this.dependents.hasSpouse(company_id, employee_id, depend.id))
    ) {
      throw new ConflictError('Employee already has a spouse registered');
    }
    if (
      await this.dependents.existsDuplicate(
        company_id,
        employee_id,
        name,
        dateOfBirth,
        depend.id,
      )
    ) {
      throw new ConflictError(
        'This dependent is already registered for the employee',
      );
    }
  }

  // TODO: company Time
  private today(): IsoDate {
    return todayIn('Africa/Cairo');
  }

  async add(cmd: CreateDependentInput) {
    await this.employees.assertEditable(cmd.company_id, cmd.employee_id);

    if (
      (await this.dependents.countByEmployee(
        cmd.company_id,
        cmd.employee_id,
      )) >= MAX_DEPENDENTS
    ) {
      throw new ValidationError(
        `An employee can have at most ${MAX_DEPENDENTS} dependents`,
      );
    }
    const dependent = EmployeeDependent.create(cmd, this.today());
    await this.assertRules(dependent);

    await this.dependents.save(dependent);
    return { id: dependent.id };
  }

  async update(
    cmd: Scope &
      Partial<
        Pick<EmployeeDependentProps, 'name' | 'relationship' | 'dateOfBirth'>
      >,
  ) {
    const { companyId, employeeId, id, ...patch } = cmd;
    await this.employees.assertEditable(companyId, employeeId);

    const dependent = await this.load({ companyId, employeeId, id });
    dependent.update(patch, this.today());
    await this.assertRules(dependent);

    await this.dependents.save(dependent);
  }

  async setInsurance(cmd: Scope & { covered: boolean }) {
    await this.employees.assertEditable(cmd.companyId, cmd.employeeId);
    const dependent = await this.load(cmd);
    dependent.setInsuranceCoverage(cmd.covered);
    await this.dependents.save(dependent);
  }

  async remove(cmd: Scope) {
    await this.load(cmd);
    await this.dependents.remove(cmd.companyId, cmd.id);
  }
}
