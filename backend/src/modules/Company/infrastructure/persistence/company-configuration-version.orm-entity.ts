import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('company_configuration_versions')
@Index('company_configuration_versions_company_version_uq', ['companyId', 'versionNumber'], { unique: true })
export class CompanyConfigurationVersionOrmEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column({ type: 'integer' }) versionNumber: number;
  @Column({ type: 'date' }) effectiveDate: string;
  @Column({ type: 'varchar', length: 500 }) changeSummary: string;
  @Column({ type: 'jsonb' }) snapshot: Record<string, unknown>;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) acknowledgedWarnings: string[];
  @Column({ type: 'uuid' }) publishedBy: string;
  @CreateDateColumn({ type: 'timestamptz' }) publishedAt: Date;
}
