import { Employee } from '../entities/employee.entity';


export const EMPLOYEE_REPOSITORY = Symbol('EMPLOYEE_REPOSITORY');

export interface EmployeeRepository {
  findById(companyId: string, id: string): Promise<Employee | null>;
  save(employee: Employee): Promise<void>;
  emailExists(companyId: string, email: string): Promise<boolean>;
  nextEmployeeNumber(companyId: string): Promise<string>;
}

