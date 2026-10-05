import { Check, Column, Entity, Exclusion, Index, JoinColumn, ManyToMany, PrimaryColumn } from 'typeorm';
import { AuditedOrmEntity } from '../../audited.orm-entity';
import {
  ContractStatus,
  ContractType,
} from '../../../domain/employment-contract/enums/employment-contract.enums';
import { EmployeeOrmEntity } from '../employee/employee.orm-entity';


@Entity('employment_contracts')
@Index('employment_contracts_employee_idx', ['employeeId'])
@Index('employment_contracts_company_status_idx', ['companyId', 'status'])
@Check('contracts_probation_chk', '"probation_months" IS NULL OR "probation_months" BETWEEN 0 AND 12')
@Check('contracts_notice_chk', '"notice_period_days" IS NULL OR "notice_period_days" BETWEEN 0 AND 180')
@Check('contracts_permanent_end_chk',
      `"contract_type" <> 'permanent' OR "end_date" IS NULL OR "status" = 'terminated'`)
@Check('contracts_fixed_end_chk',
      `"contract_type" = 'permanent' OR "end_date" IS NOT NULL`)
@Check('contracts_dates_chk', '"end_date" IS NULL OR "end_date" >= "start_date"')
@Exclusion(
  'contracts_no_overlap',
  `USING gist ("employee_id" WITH =, daterange("start_date", "end_date", '[]') WITH &&)
   WHERE ("status" = 'active' AND "deleted_at" IS NULL)`,
)
export class EmploymentContractOrmEntity extends AuditedOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column('uuid') employeeId: string;
  @Column({ type: 'enum', enum: ContractType, enumName: 'contract_kind' })
  contractType: ContractType;
  @Column({ type: 'date' }) startDate: string;
  @Column({ type: 'date', nullable: true }) endDate: string | null;
  @Column({ type: 'smallint', nullable: true }) probationMonths: number | null;
  @Column({ type: 'smallint', nullable: true }) noticePeriodDays: number | null;
  @Column({ type: 'enum', enum: ContractStatus, enumName: 'contract_status' })
  status: ContractStatus;
  @Column({ type: 'varchar', length: 500, nullable: true }) documentUrl:
    string | null;
  @Column({ type: 'text', nullable: true }) terminationReason: string | null;

  @ManyToMany(()=> EmployeeOrmEntity, {nullable: false, onDelete: 'RESTRICT'})
  @JoinColumn([
    {name: 'company_id', referencedColumnName: 'companyId'},
    {name: 'employee_id', referencedColumnName: 'id'}
  ])
  employee?: EmployeeOrmEntity

}
