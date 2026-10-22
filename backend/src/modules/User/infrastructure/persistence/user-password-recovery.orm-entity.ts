import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('employee_password_recoveries')
@Index('employee_password_recoveries_token_uq', ['tokenHash'], { unique: true })
@Index('employee_password_recoveries_account_idx', ['companyId', 'employeeId', 'expiresAt'])
export class EmployeePasswordRecoveryOrmEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column('uuid') employeeId: string;
  @Column({ type: 'varchar', length: 64 }) tokenHash: string;
  @Column({ type: 'timestamptz' }) expiresAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) usedAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
