
import { EmployeeDependent } from '../entities/employee-dependents.entity';

export interface EmployeeDependentRepository {
  findById(companyId: string, id: string): Promise<EmployeeDependent | null>;
  save(dependent: EmployeeDependent): Promise<void>;
  remove(companyId: string, id: string): Promise<void>; 
  countByEmployee(companyId: string, employeeId: string): Promise<number>;
  hasSpouse(
    companyId: string,
    employeeId: string,
    excludeId?: string,
  ): Promise<boolean>;
  existsDuplicate(
    companyId: string,
    employeeId: string,
    name: string,
    dateOfBirth: string | null,
    excludeId?: string,
  ): Promise<boolean>;
}
export const EMPLOYEE_DEPENDENT_REPOSITORY = Symbol(
  'EMPLOYEE_DEPENDENT_REPOSITORY',
);
