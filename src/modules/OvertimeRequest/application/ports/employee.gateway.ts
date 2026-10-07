export interface OvertimeEmployeeProfile {
  id: string;
  status: string;
  managerId: string | null;
}

export interface EmployeeGateway {
  getById(
    companyId: string,
    employeeId: string,
  ): Promise<OvertimeEmployeeProfile | null>;
}

export const EMPLOYEE_GATEWAY = Symbol('EMPLOYEE_GATEWAY');
