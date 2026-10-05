import {
  EmployeeDependent,
  EmployeeDependentProps,
} from 'src/modules/Employee/domain/employee-dependents/entities/employee-dependents.entity';
import { EmployeeDependentOrmEntity } from './employee-dependent.orm-entity';
import { DependentRelationship } from 'src/modules/Employee/domain/employee-dependents/enums/employee-dependent.enums';

export class EmployeeDependentMapper {
  static toDomain(orm: EmployeeDependentOrmEntity): EmployeeDependent {
    return EmployeeDependent.restore({
      id: orm.id,
      company_id: orm.companyId,
      employee_id: orm.employeeId,
      name: orm.name,
      relationship: orm.relationship as DependentRelationship,
      dateOfBirth: orm.dateOfBirth,
      coveredByInsurance: orm.coveredByInsurance,
    });
  }
  static toOrm(
    p: Readonly<EmployeeDependentProps>,
  ): EmployeeDependentOrmEntity {
    return Object.assign(new EmployeeDependentOrmEntity(), p);
  }
}
