import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EmployeeStatus, EmploymentType } from '../../domain/enums';

@Entity('employees')
export class EmployeeOrmEntity {
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

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
  @Column({ type: 'uuid', nullable: true }) createdBy: string | null;
  @Column({ type: 'uuid', nullable: true }) updatedBy: string | null;
  @DeleteDateColumn({ type: 'timestamptz' }) deletedAt: Date | null;
  @Column({ type: 'jsonb', nullable: true }) metadata: Record<
    string,
    unknown
  > | null;
}
