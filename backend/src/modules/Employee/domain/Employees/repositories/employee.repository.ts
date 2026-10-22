import { Employee } from '../entities/employee.entity';

export const EMPLOYEE_REPOSITORY = Symbol('EMPLOYEE_REPOSITORY');

export interface EmployeeAccountProvisioningRecord {
  id: string;
  companyId: string;
  employeeId: string;
  email: string;
  personalEmail: string | null;
  companyEmail: string | null;
  accountStatus: string;
  companyEmailStatus: string;
  passwordHash: string | null;
  invitationTokenHash: string | null;
  invitationExpiresAt: Date | null;
  activatedAt: Date | null;
  mfaSecret: string | null;
  mfaEnabled: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}

export interface EmployeeRepository {
  findById(companyId: string, id: string): Promise<Employee | null>;
  save(employee: Employee): Promise<void>;
  saveWithAccount(employee: Employee, account: EmployeeAccountProvisioningRecord): Promise<void>;
  emailExists(companyId: string, email: string): Promise<boolean>;
  nextEmployeeNumber(companyId: string): Promise<string>;
}
