import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, Unique } from 'typeorm';
import { EmployeeOrmEntity } from '../../../Employee/infrastructure/persistence/employee/employee.orm-entity';

@Entity('employee_accounts')
@Unique('employee_accounts_company_employee_uq', ['companyId', 'employeeId'])
@Index('employee_accounts_company_email_uq', ['companyId', 'email'], { unique: true })
@Index('employee_accounts_company_google_subject_uq', ['companyId', 'googleSubject'], { unique: true, where: '"google_subject" IS NOT NULL' })
export class EmployeeAccountOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column('uuid') employeeId: string;
  @Column() email: string;
  @Column({ type: 'varchar', nullable: true }) personalEmail: string | null;
  @Column({ type: 'varchar', nullable: true }) companyEmail: string | null;
  @Column({ type: 'varchar', default: 'PENDING_ACTIVATION' }) accountStatus: string;
  @Column({ type: 'varchar', default: 'PENDING' }) companyEmailStatus: string;
  @Column({ type: 'varchar', nullable: true }) googleSubject: string | null;
  @Column({ type: 'timestamptz', nullable: true }) activationSentAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) providerActivationSentAt: Date | null;
  @Column({ type: 'varchar', nullable: true }) passwordHash: string | null;
  @Column({ type: 'varchar', nullable: true }) invitationTokenHash: string | null;
  @Column({ type: 'timestamptz', nullable: true }) invitationExpiresAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) activatedAt: Date | null;
  @Column({ type: 'varchar', nullable: true }) mfaSecret: string | null;
  @Column({ default: false }) mfaEnabled: boolean;
  @Column({ type: 'int', default: 0 }) failedLoginAttempts: number;
  @Column({ type: 'timestamptz', nullable: true }) lockedUntil: Date | null;

  @ManyToOne(() => EmployeeOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'employee_id', referencedColumnName: 'id' },
    { name: 'company_id', referencedColumnName: 'companyId' },
  ])
  employee?: EmployeeOrmEntity;
}
