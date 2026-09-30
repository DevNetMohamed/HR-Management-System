export interface ListEmployeesFilter {
  companyId: string;
  status?: string;
  departmentId?: string;
  search?: string;
  page: number;
  limit: number;
}
export interface EmployeeListItem {
  id: string;
  employeeNumber: string;
  fullName: string;
  email: string;
  status: string;
  employmentType: string;
  hireDate: string;
  department: string | null;
  position: string | null;
}

export interface EmployeeQueries {
  list(
    f: ListEmployeesFilter,
  ): Promise<{ items: EmployeeListItem[]; total: number }>;
  getDetails(
    companyId: string,
    id: string,
  ): Promise<Record<string, unknown> | null>;
}
export const EMPLOYEE_QUERIES = Symbol('EMPLOYEE_QUERIES');
