import { Injectable } from '@nestjs/common';
import { EmployeeBankAccountQueries } from 'src/modules/Employee/application/queries/employee-bank-account.queries';
import { DataSource } from 'typeorm';

@Injectable()
export class TypeOrmEmployeeBankAccountQueries implements EmployeeBankAccountQueries {
  constructor(private readonly ds: DataSource) {}

  listByEmployee(companyId: string, employeeId: string) {
    return this.ds.query(
      `SELECT id, bank_name AS "bankName", iban_masked AS "ibanMasked",
              (account_number_encrypted IS NOT NULL) AS "hasAccountNumber",
              is_primary AS "isPrimary"
         FROM employee_bank_accounts
        WHERE company_id = $1 AND employee_id = $2 AND deleted_at IS NULL
        ORDER BY is_primary DESC, created_at`,
      [companyId, employeeId],
    );
  }
}
