import { Injectable } from "@nestjs/common";
import { EmployeeQueries, ListEmployeesFilter } from "../../../application/queries/employee.queries";
import { DataSource } from "typeorm";

@Injectable()
export class TypeOrmEmployeeQueries implements EmployeeQueries {
  constructor(private readonly ds: DataSource) {}

  async list(f: ListEmployeesFilter) {
    const where = ['e.company_id = $1', 'e.deleted_at IS NULL'];
    const params: unknown[] = [f.companyId];
    const add = (sql: string, v: unknown) => {
      params.push(v);
      where.push(sql.replaceAll('?', `$${params.length}`));
    };
    if (f.status) add('e.status = ?', f.status);
    if (f.departmentId) add('e.department_id = ?', f.departmentId);
    if (f.search) add(`((e.first_name || ' ' || e.last_name) ILIKE ? OR e.email ILIKE ? OR e.employee_number ILIKE ?)`, `%${f.search}%`);
    const whereSql = where.join(' AND ');

    const [{ count }] = await this.ds.query(`SELECT COUNT(*)::int AS count FROM employees e WHERE ${whereSql}`, params);
    const items = await this.ds.query(
      `SELECT e.id, e.employee_number AS "employeeNumber",
              e.first_name || ' ' || e.last_name AS "fullName", e.email, e.status,
              e.employment_type AS "employmentType", e.hire_date::text AS "hireDate",
              d.name AS department, p.title AS position
         FROM employees e
         LEFT JOIN departments d ON d.id = e.department_id
         LEFT JOIN positions p ON p.id = e.position_id
        WHERE ${whereSql}
        ORDER BY e.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, f.limit, (f.page - 1) * f.limit],
    );
    return { items, total: count };
  }

  async getDetails(companyId: string, id: string) {
    const [row] = await this.ds.query(
      `SELECT e.id, e.employee_number AS "employeeNumber", e.first_name AS "firstName", e.last_name AS "lastName",
              e.email, e.phone, e.date_of_birth::text AS "dateOfBirth", e.gender, e.nationality,
              e.marital_status AS "maritalStatus", e.status, e.employment_type AS "employmentType",
              e.hire_date::text AS "hireDate", e.termination_date::text AS "terminationDate",
              e.profile_photo_url AS "profilePhotoUrl",
              e.department_id AS "departmentId", d.name AS "departmentName",
              e.position_id AS "positionId", p.title AS "positionTitle",
              e.branch_id AS "branchId", e.manager_id AS "managerId",
              m.first_name || ' ' || m.last_name AS "managerName"
         FROM employees e
         LEFT JOIN departments d ON d.id = e.department_id
         LEFT JOIN positions p ON p.id = e.position_id
         LEFT JOIN employees m ON m.id = e.manager_id
        WHERE e.company_id = $1 AND e.id = $2 AND e.deleted_at IS NULL`,
      [companyId, id],
    );
    if (!row) return null;   

    const jobHistory = await this.ds.query(
      `SELECT change_type AS "changeType", effective_date::text AS "effectiveDate",
              department_id AS "departmentId", position_id AS "positionId",
              manager_id AS "managerId", reason
         FROM job_history
        WHERE company_id = $1 AND employee_id = $2 AND deleted_at IS NULL
        ORDER BY effective_date DESC, created_at DESC`,
      [companyId, id],
    );
    return { ...row, jobHistory };
  }
}