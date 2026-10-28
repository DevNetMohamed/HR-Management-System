import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { CompanyStatus } from '../../../domain/entities/company.entity';
import { AuditedOrmEntity } from '../../../../../infrastructure/database/audited.orm-entity';

@Entity('companies')
@Index('companies_subdomain_uq', ['subdomain'], { unique: true })
export class CompanyOrmEntity extends AuditedOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  legalName: string | null;

  @Column({ type: 'varchar' })
  subdomain: string;

  @Column({ type: 'varchar', nullable: true })
  taxNumber: string | null;

  @Column({ type: 'varchar', nullable: true })
  commercialRegisterNumber: string | null;

  @Column({ type: 'varchar', nullable: true })
  industry: string | null;

  @Column({ type: 'varchar', nullable: true })
  workEmail: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  website: string | null;

  @Column({ type: 'varchar', nullable: true })
  country: string | null;

  @Column({ type: 'varchar', nullable: true })
  currency: string | null;

  @Column({ type: 'varchar', nullable: true })
  timezone: string | null;

  @Column({ type: 'varchar', nullable: true })
  locale: string | null;

  @Column({ type: 'varchar', nullable: true })
  logoUrl: string | null;

  @Column({
    type: 'enum',
    enum: ['trial', 'active', 'suspended'],
    enumName: 'company_status',
    default: 'trial',
  })
  status: CompanyStatus;

  @Column({ type: 'varchar', nullable: true })
  plan: string | null;
}
