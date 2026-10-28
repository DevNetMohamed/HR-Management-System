import { EmployeeDocument } from '../entities/employee-document.class';
import { EmployeeDocumentType } from '../enums/employee-document.enums';

export interface EmployeeDocumentRepository {
  findById(companyId: string, id: string): Promise<EmployeeDocument | null>;
  save(document: EmployeeDocument): Promise<void>;
  remove(companyId: string, id: string): Promise<void>;
  countByEmployee(companyId: string, employeeId: string): Promise<number>;
  existsOfType(
    companyId: string,
    employeeId: string,
    type: EmployeeDocumentType,
    excludeId?: string,
  ): Promise<boolean>;
}
export const EMPLOYEE_DOCUMENT_REPOSITORY = Symbol(
  'EMPLOYEE_DOCUMENT_REPOSITORY',
);
