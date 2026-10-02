import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('job_history')
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
}