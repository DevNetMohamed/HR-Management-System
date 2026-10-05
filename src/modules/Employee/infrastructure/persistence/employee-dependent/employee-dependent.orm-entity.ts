import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { EmployeeOrmEntity } from '../employee/employee.orm-entity';
import { DependentRelationship } from '../../../domain/employee-dependents/enums/employee-dependent.enums';
import { AuditedOrmEntity } from '../../audited.orm-entity';

const RELATIONSHIPS = Object.values(DependentRelationship)
  .map((v) => `'${v}'`)
  .join(', ');

@Entity('employee_dependents')
@Index('employee_dependents_employee_idx', ['employeeId'])
@Index('employee_dependents_one_spouse_uq', ['employeeId'], {
  unique: true,
  where: `"relationship" = 'spouse' AND "deleted_at" IS NULL`,
})
@Check(
  'employee_dependents_relationship_chk',
  `"relationship" IN (${RELATIONSHIPS})`,
)
@Check(
  'employee_dependents_child_dob_chk',
  `"relationship" <> 'child' OR "date_of_birth" IS NOT NULL`,
)
export class EmployeeDependentOrmEntity extends AuditedOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column('uuid') employeeId: string;

  @Column({ type: 'varchar', length: 150 }) name: string;
  @Column({ type: 'varchar', length: 20 }) relationship: string;
  @Column({ type: 'date', nullable: true }) dateOfBirth: string | null;
  @Column({ type: 'boolean', default: false }) coveredByInsurance: boolean;

  @ManyToOne(() => EmployeeOrmEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'company_id', referencedColumnName: 'companyId' },
    { name: 'employee_id', referencedColumnName: 'id' },
  ])
  employee?: EmployeeOrmEntity;
}
