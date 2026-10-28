import { EmployeeDocument } from 'src/modules/Employee/domain/employee-document/entities/employee-document.class';
import { EmployeeDocumentOrmEntity } from './employee-document.orm-entity';
import { EmployeeDocumentType } from 'src/modules/Employee/domain/employee-document/enums/employee-document.enums';
import { EmployeeDocumentProps } from 'src/modules/Employee/domain/employee-document/entities/employee-document.entity';

export class EmployeeDocumentMapper {
  static toDomain(orm: EmployeeDocumentOrmEntity): EmployeeDocument {
    return EmployeeDocument.restore({
      id: orm.id,
      companyId: orm.companyId,
      employeeId: orm.employeeId,
      documentType: orm.documentType as EmployeeDocumentType,
      fileKey: orm.fileKey,
      fileName: orm.fileName,
      mimeType: orm.mimeType,
      sizeBytes: orm.sizeBytes,
      issueDate: orm.issueDate,
      expiryDate: orm.expiryDate,
      isVerified: orm.isVerified,
      verifiedBy: orm.verifiedBy,
      verifiedAt: orm.verifiedAt,
    });
  }
  static toOrm(p: Readonly<EmployeeDocumentProps>): EmployeeDocumentOrmEntity {
    return Object.assign(new EmployeeDocumentOrmEntity(), p);
  }
}
