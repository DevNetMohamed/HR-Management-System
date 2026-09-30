import { Employee, EmployeeProps } from "../../domain/employee.entity";
import { EmployeeOrmEntity } from "./employee.orm-entity";

export class EmployeeMapper {
  static toDomain(o: EmployeeOrmEntity): Employee {
    const { createdAt, updatedAt, createdBy, updatedBy, deletedAt, metadata, ...props } = o;
    return Employee.restore(props);
  }
  static toOrm(p: EmployeeProps): EmployeeOrmEntity {
    return Object.assign(new EmployeeOrmEntity(), p);  
  }
}