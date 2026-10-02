import { Column, Entity, PrimaryColumn } from 'typeorm';
import { AuditedOrmEntity } from '../../audited.orm-entity';
// import { ContractStatus, ContractType } from "src/modules/Employee/domain/employmee_contract/Enums/Employee-Contract-enums";

import {
  ContractStatus,
  ContractType,
} from '../../../domain/employment-contract/enums/employment-contract.enums';

@Entity('employment_contracts')
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
}
