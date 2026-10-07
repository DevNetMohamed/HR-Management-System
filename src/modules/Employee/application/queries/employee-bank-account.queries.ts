export interface EmployeeBankAccountItem {
  id: string;
  bankName: string;
  ibanMasked: string;
  hasAccountNumber: boolean;
  isPrimary: boolean;
}
export interface EmployeeBankAccountQueries {
  listByEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<EmployeeBankAccountItem[]>;
}
export const EMPLOYEE_BANK_ACCOUNT_QUERIES = Symbol(
  'EMPLOYEE_BANK_ACCOUNT_QUERIES',
);
