import { Injectable } from '@nestjs/common';
import { EmployeeDependentQueries } from 'src/modules/Employee/application/queries/employee-dependent.queries';
import { DataSource } from 'typeorm';

@Injectable()
export class TypeOrmEmployeeDependentQueries implements EmployeeDependentQueries {
  constructor(private readonly ds: DataSource) {}

  listByEmployee(companyId: string, employeeId: string) {
    return this.ds.query(
      `SELECT id, name, relationship,
              date_of_birth::text AS "dateOfBirth",
              CASE WHEN date_of_birth IS NULL THEN NULL
                   ELSE date_part('year', age(CURRENT_DATE, date_of_birth))::int END AS age,
              covered_by_insurance AS "coveredByInsurance"
         FROM employee_dependents
        WHERE company_id = $1 AND employee_id = $2 AND deleted_at IS NULL
        ORDER BY created_at`,
      [companyId, employeeId],
    );
  }
}
