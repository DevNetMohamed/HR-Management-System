import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { CompanyStatus } from '../../domain/enums/company-enums';
import { AuditedOrmEntity } from '../audited.orm-entity';

@Entity('companies')
@Index('uq_companies_subdomain', ['subdomain'], { unique: true })
export class CompanyOrmEntity extends AuditedOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column() name: string;
  @Column({ type: 'varchar', nullable: true }) legalName: string | null;
  @Column() subdomain: string;
  @Column({ type: 'varchar', nullable: true }) taxNumber: string | null;
  @Column({ type: 'varchar', nullable: true }) country: string | null;
  @Column({ type: 'varchar', nullable: true }) currency: string | null;
  @Column({ type: 'varchar', nullable: true }) timezone: string | null;
  @Column({ type: 'varchar', nullable: true }) locale: string | null;
  @Column({ type: 'varchar', nullable: true }) logoUrl: string | null;
  @Column({ type: 'enum', enum: CompanyStatus, enumName: 'company_status' })
  status: CompanyStatus;
  @Column({ type: 'varchar', nullable: true }) plan: string | null;
}