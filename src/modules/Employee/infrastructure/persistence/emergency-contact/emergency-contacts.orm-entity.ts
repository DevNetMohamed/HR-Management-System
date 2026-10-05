import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { AuditedOrmEntity } from '../../audited.orm-entity';
import { Relationship } from '../../../domain/emergency-contact/enums/emergency-contact.enums';
import { EmployeeOrmEntity } from '../employee/employee.orm-entity';

const RELATIONSHIPS = Object.values(Relationship)
  .map((v) => `'${v}'`)
  .join(', ');

@Entity('emergency_contacts')
@Index('emergency_contacts_employee_idx', ['employeeId'])
@Index('emergency_contacts_employee_phone_uq', ['employeeId', 'phone'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Check(
  'emergency_contacts_relationship_chk',
  `"relationship" IN (${RELATIONSHIPS})`,
)
export class EmergencyContactOrmEntity  extends AuditedOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column('uuid') employeeId: string;
  @Column({ type: 'varchar', nullable: true }) name: string;
  @Column({ type: 'varchar', nullable: true }) relationship: string;
  @Column({ type: 'varchar', nullable: true }) phone: string;
  @ManyToOne(() => EmployeeOrmEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'company_id', referencedColumnName: 'companyId' },
    { name: 'employee_id', referencedColumnName: 'id' },
  ])
  employee?: EmployeeOrmEntity;
}
