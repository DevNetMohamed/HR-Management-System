import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('company_setup_drafts')
export class CompanySetupDraftOrmEntity {
  @PrimaryColumn('uuid') companyId: string;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) configuration: Record<string, unknown>;
  @Column({ type: 'uuid', nullable: true }) updatedBy: string | null;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
