import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('company_notification_rules')
@Index('company_notification_rules_company_key_uq', ['companyId', 'ruleKey'], { unique: true })
@Index('company_notification_rules_company_status_idx', ['companyId', 'status'])
export class CompanyNotificationRuleOrmEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column({ type: 'varchar', length: 100 }) ruleKey: string;
  @Column({ type: 'varchar', length: 160 }) name: string;
  @Column({ type: 'varchar', length: 100 }) eventKey: string;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) recipients: string[];
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) recipientRoles: string[];
  @Column({ type: 'jsonb' }) channels: string[];
  @Column({ type: 'varchar', length: 20, default: 'normal' }) priority: string;
  @Column({ type: 'varchar', length: 20, default: 'bilingual' }) language: string;
  @Column({ type: 'integer', default: 0 }) deliveryDelayMinutes: number;
  @Column({ type: 'integer', default: 0 }) reminderIntervalMinutes: number;
  @Column({ type: 'integer', default: 0 }) maxReminders: number;
  @Column({ type: 'jsonb', nullable: true }) quietHours: { start: string; end: string } | null;
  @Column({ type: 'varchar', length: 20, default: 'none' }) digestOption: string;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) escalationPath: string[];
  @Column({ type: 'integer', default: 3 }) retryAttempts: number;
  @Column({ type: 'integer', default: 15 }) retryIntervalMinutes: number;
  @Column({ type: 'varchar', length: 20, nullable: true }) fallbackChannel: string | null;
  @Column({ type: 'varchar', length: 200, nullable: true }) templateSubject: string | null;
  @Column({ type: 'text', nullable: true }) templateBody: string | null;
  @Column({ type: 'varchar', length: 20, default: 'active' }) status: 'active' | 'draft' | 'disabled';
  @Column({ type: 'boolean', default: false }) isMandatory: boolean;
  @Column({ type: 'uuid', nullable: true }) createdBy: string | null;
  @Column({ type: 'uuid', nullable: true }) updatedBy: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
