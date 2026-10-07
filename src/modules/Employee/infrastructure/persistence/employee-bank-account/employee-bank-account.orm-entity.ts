import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { AuditedOrmEntity } from '../../audited.orm-entity';
import { EmployeeOrmEntity } from '../employee/employee.orm-entity';

@Entity('employee_bank_accounts')
@Index('employee_bank_accounts_employee_iban_uq', ['employeeId', 'ibanHash'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Index('employee_bank_accounts_one_primary_uq', ['employeeId'], {
  unique: true,
  where: '"is_primary" = true AND "deleted_at" IS NULL',
})
export class EmployeeBankAccountOrmEntity extends AuditedOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column('uuid') employeeId: string;

  @Column({ type: 'varchar', length: 150 }) bankName: string;
  @Column({ type: 'text' }) ibanEncrypted: string;
  @Column({ type: 'char', length: 64 }) ibanHash: string;
  @Column({ type: 'varchar', length: 40 }) ibanMasked: string;
  @Column({ type: 'text', nullable: true }) accountNumberEncrypted:
    string | null;
  @Column({ type: 'boolean', default: false }) isPrimary: boolean;

  @ManyToOne(() => EmployeeOrmEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'company_id', referencedColumnName: 'companyId' },
    { name: 'employee_id', referencedColumnName: 'id' },
  ])
  employee?: EmployeeOrmEntity;
}
