import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { EmployeeOrmEntity } from "../employee/employee.orm-entity";

@Entity('job_history')
@Index('job_history_employee_idx', ['employeeId', 'effectiveDate'])
@Check('job_history_change_type_chk',
       `"change_type" IN ('hire', 'promotion', 'transfer', 'demotion')`)
export class JobHistoryOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column('uuid') employeeId: string;
  @Column({ type: 'uuid', nullable: true }) departmentId: string | null;
  @Column({ type: 'uuid', nullable: true }) positionId: string | null;
  @Column({ type: 'uuid', nullable: true }) managerId: string | null;
  @Column() changeType: string;
  @Column({ type: 'date' }) effectiveDate: string;
  @Column({ type: 'text', nullable: true }) reason: string | null;
  @ManyToOne(() => EmployeeOrmEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'company_id', referencedColumnName: 'companyId' },
    { name: 'employee_id', referencedColumnName: 'id' },
  ])
  employee?: EmployeeOrmEntity;

  @ManyToOne(() => EmployeeOrmEntity, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'company_id', referencedColumnName: 'companyId' },
    { name: 'manager_id', referencedColumnName: 'id' },
  ])
  manager?: EmployeeOrmEntity | null;
}