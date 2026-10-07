import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import {
  EmployeeStatus,
  EmploymentType,
} from '../../../domain/Employees/Enums/Employee-enums';
import { AuditedOrmEntity } from '../../audited.orm-entity';

@Entity('employees')
@Unique('employees_company_id_id_uq', ['companyId', 'id'])
@Index('employees_company_number_uq', ['companyId', 'employeeNumber'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Check(
  'employees_dates_chk',
  '"termination_date" IS NULL OR "termination_date" >= "hire_date"',
)
@Check(
  'employees_not_self_manager_chk',
  '"manager_id" IS NULL OR "manager_id" <> "id"',
)
export class EmployeeOrmEntity extends AuditedOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column() employeeNumber: string;
  @Column() firstName: string;
  @Column() lastName: string;
  @Column() email: string;
  @Column({ type: 'varchar', nullable: true }) phone: string | null;
  @Column({ type: 'date', nullable: true }) dateOfBirth: string | null;
  @Column({ type: 'varchar', nullable: true }) gender: string | null;
  @Column({ type: 'varchar', nullable: true }) nationality: string | null;
  @Column({ type: 'varchar', nullable: true }) nationalId: string | null;
  @Column({ type: 'varchar', nullable: true }) maritalStatus: string | null;
  @Column({ type: 'uuid', nullable: true }) departmentId: string | null;
  @Column({ type: 'uuid', nullable: true }) positionId: string | null;
  @Column({ type: 'uuid', nullable: true }) branchId: string | null;
  @Column({ type: 'uuid', nullable: true }) managerId: string | null;
  @Column({ type: 'date' }) hireDate: string;
  @Column({ type: 'date', nullable: true }) terminationDate!: string | null;
  @Column({ type: 'enum', enum: EmploymentType, enumName: 'employment_type' })
  employmentType: EmploymentType;
  @Column({ type: 'enum', enum: EmployeeStatus, enumName: 'employee_status' })
  status: EmployeeStatus;
  @Column({ type: 'varchar', nullable: true }) profilePhotoUrl: string | null;

  @ManyToOne(() => EmployeeOrmEntity, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'company_id', referencedColumnName: 'companyId' },
    { name: 'manager_id', referencedColumnName: 'id' },
  ])
  manager?: EmployeeOrmEntity | null;
}
