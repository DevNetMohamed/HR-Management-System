import {
  Employee,
  EmployeeProps,
} from '../../../domain/Employees/entities/employee.entity';
import { EmployeeOrmEntity } from './employee.orm-entity';

export class EmployeeMapper {
  static toDomain(o: EmployeeOrmEntity): Employee {
    return Employee.restore({ ...o, companyEmail: null });
  }
  static toOrm(p: EmployeeProps): EmployeeOrmEntity {
    return Object.assign(new EmployeeOrmEntity(), p);
  }
}
