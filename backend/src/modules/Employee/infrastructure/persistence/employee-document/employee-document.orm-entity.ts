import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import {
  DOCUMENT_TYPE_RULES,
  EmployeeDocumentType,
} from '../../../domain/employee-document/enums/employee-document.enums';
import { EmployeeOrmEntity } from '../employee/employee.orm-entity';
import { MAX_FILE_BYTES } from '../../../domain/employee-document/document-file/document-file';
import { AuditedOrmEntity } from '../../audited.orm-entity';

const typesWhere = (
  pick: (r: { requiresExpiry: boolean; onePerEmployee: boolean }) => boolean,
) =>
  (
    Object.entries(DOCUMENT_TYPE_RULES) as [
      EmployeeDocumentType,
      (typeof DOCUMENT_TYPE_RULES)[EmployeeDocumentType],
    ][]
  )
    .filter(([, r]) => pick(r))
    .map(([t]) => `'${t}'`)
    .join(', ');

const ALL_TYPES = Object.values(EmployeeDocumentType)
  .map((t) => `'${t}'`)
  .join(', ');
const REQUIRE_EXPIRY = typesWhere((r) => r.requiresExpiry);
const ONE_PER_EMPLOYEE = typesWhere((r) => r.onePerEmployee);

@Entity('employee_documents')
@Index('employee_documents_employee_idx', ['employeeId'])
@Index('employee_documents_file_key_uq', ['fileKey'], { unique: true })
@Index('employee_documents_one_per_type_uq', ['employeeId', 'documentType'], {
  unique: true,
  where: `"document_type" IN (${ONE_PER_EMPLOYEE}) AND "deleted_at" IS NULL`,
})
@Index('employee_documents_expiry_idx', ['companyId', 'expiryDate'], {
  where: '"expiry_date" IS NOT NULL AND "deleted_at" IS NULL',
})
@Check('employee_documents_type_chk', `"document_type" IN (${ALL_TYPES})`)
@Check(
  'employee_documents_dates_chk',
  '"issue_date" IS NULL OR "expiry_date" IS NULL OR "expiry_date" >= "issue_date"',
)
@Check(
  'employee_documents_expiry_required_chk',
  `"document_type" NOT IN (${REQUIRE_EXPIRY}) OR "expiry_date" IS NOT NULL`,
)
@Check(
  'employee_documents_size_chk',
  `"size_bytes" > 0 AND "size_bytes" <= ${MAX_FILE_BYTES}`,
)
@Check(
  'employee_documents_verified_chk',
  `("is_verified" = false AND "verified_by" IS NULL AND "verified_at" IS NULL)
        OR ("is_verified" = true AND "verified_by" IS NOT NULL AND "verified_at" IS NOT NULL)`,
)
export class EmployeeDocumentOrmEntity extends AuditedOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column('uuid') employeeId: string;

  @Column({ type: 'varchar', length: 30 }) documentType: string;
  @Column({ type: 'varchar', length: 500 }) fileKey: string;
  @Column({ type: 'varchar', length: 255 }) fileName: string;
  @Column({ type: 'varchar', length: 100 }) mimeType: string;
  @Column({ type: 'integer' }) sizeBytes: number;
  @Column({ type: 'date', nullable: true }) issueDate: string | null;
  @Column({ type: 'date', nullable: true }) expiryDate: string | null;
  @Column({ type: 'boolean', default: false }) isVerified: boolean;
  @Column({ type: 'uuid', nullable: true }) verifiedBy: string | null;
  @Column({ type: 'timestamptz', nullable: true }) verifiedAt: Date | null;

  @ManyToOne(() => EmployeeOrmEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'company_id', referencedColumnName: 'companyId' },
    { name: 'employee_id', referencedColumnName: 'id' },
  ])
  employee?: EmployeeOrmEntity;
}
