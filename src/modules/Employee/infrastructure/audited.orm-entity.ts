import { Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from "typeorm";

export abstract class AuditedOrmEntity {
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
  @Column({ type: 'uuid', nullable: true }) createdBy: string | null;
  @Column({ type: 'uuid', nullable: true }) updatedBy: string | null;
  @DeleteDateColumn({ type: 'timestamptz' }) deletedAt: Date | null;
  @Column({ type: 'jsonb', nullable: true }) metadata: Record<string, unknown> | null;
}