export interface EmployeeDependentItem {
  id: string;
  name: string;
  relationship: string;
  dateOfBirth: string | null;
  age: number | null;
  coveredByInsurance: boolean;
}
export interface EmployeeDependentQueries {
  listByEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<EmployeeDependentItem[]>;
}
export const EMPLOYEE_DEPENDENT_QUERIES = Symbol('EMPLOYEE_DEPENDENT_QUERIES');
