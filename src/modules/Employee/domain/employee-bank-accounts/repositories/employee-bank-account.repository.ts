import { EmployeeBankAccount } from "../entities/employee-bank-account.class";

export interface EmployeeBankAccountRepository {
    findById(companyId: string, id: string):Promise<EmployeeBankAccount | null>;
    save(account: EmployeeBankAccount): Promise<void>;
    remove(companyId: string, id: string): Promise<void>;
    countByEmployee(companyId: string, employeeId: string): Promise<number>;
    existsIban(companyId: string, employeeId: string, iban: string, excludeId?: string): Promise<boolean>;
}

export const EMPLOYEE_BANK_ACCOUNT_REPOSITORY = Symbol('EMPLOYEE_BANK_ACCOUNT_REPOSITORY');