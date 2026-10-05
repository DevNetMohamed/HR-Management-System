import { Injectable } from "@nestjs/common";
import { EmergencyContactQueries } from "src/modules/Employee/application/queries/emergency-contact.queries";
import { DataSource } from "typeorm";

@Injectable()
export class TypeOrmEmergencyContactQueries implements EmergencyContactQueries {
  constructor(private readonly ds: DataSource) {}

  listByEmployee(companyId: string, employeeId: string) {
    return this.ds.query(
      `SELECT id, name, relationship, phone
         FROM emergency_contacts
        WHERE company_id = $1 AND employee_id = $2 AND deleted_at IS NULL
        ORDER BY created_at`,
      [companyId, employeeId],
    );
  }
}