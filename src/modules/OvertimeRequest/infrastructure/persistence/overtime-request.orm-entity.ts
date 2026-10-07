import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OvertimeRequestStatus } from '../../domain/enums';

@Entity('overtime_requests')
export class OvertimeRequestOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  companyId: string;

  @Column('uuid')
  employeeId: string;

  @Column('uuid')
  attendanceId: string;

  @Column('integer')
  minutes: number;

  @Column('text')
  reason: string;

  @Column({
    type: 'enum',
    enum: OvertimeRequestStatus,
    enumName: 'overtime_request_status',
  })
  status: OvertimeRequestStatus;

  @Column('boolean')
  managerReviewRequired: boolean;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  managerReviewedBy: string | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  managerReviewedAt: Date | null;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  hrReviewedBy: string | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  hrReviewedAt: Date | null;

  @Column({
    type: 'integer',
    default: 1,
  })
  version: number;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updatedAt: Date;

  @Column('uuid')
  createdBy: string;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  updatedBy: string | null;

  @DeleteDateColumn({
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt: Date | null;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata: Record<string, unknown> | null;
}
