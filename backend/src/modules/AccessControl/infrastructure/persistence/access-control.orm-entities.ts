import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('access_roles')
@Unique('access_roles_company_id_id_uq', ['companyId', 'id'])
@Index('access_roles_active_name_uq', ['companyId', 'name'], { unique: true, where: '"status" = \'active\'' })
export class AccessRoleOrmEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column({ length: 100 }) name: string;
  @Column({ type: 'varchar', length: 500 }) purpose: string;
  @Column({ type: 'jsonb', default: () => "'[]'" }) permissionKeys: string[];
  @Column({ default: false }) defaultForNewHires: boolean;
  @Column({ type: 'varchar', length: 20, default: 'self' }) defaultScopeType: string;
  @Column({ default: false }) highRisk: boolean;
  @Column({ default: false }) isCore: boolean;
  @Column({ type: 'varchar', default: 'active' }) status: 'active' | 'retired';
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}

@Entity('access_permissions')
export class AccessPermissionOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 120 }) permissionKey: string;
  @Column({ type: 'varchar', length: 300 }) description: string;
  @Column({ default: false }) isProtected: boolean;
}

@Entity('access_role_permissions')
@Unique('access_role_permissions_grant_uq', ['companyId', 'roleId', 'permissionKey'])
export class AccessRolePermissionOrmEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column('uuid') roleId: string;
  @Column({ length: 120 }) permissionKey: string;
  @Column({ type: 'uuid', nullable: true }) grantedBy: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

@Entity('access_assignments')
@Unique('access_assignments_company_id_id_uq', ['companyId', 'id'])
@Index('access_assignments_employee_idx', ['companyId', 'employeeId', 'status'])
export class AccessAssignmentOrmEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column('uuid') employeeId: string;
  @Column('uuid') roleId: string;
  @Column({ type: 'varchar', length: 20 }) scopeType: string;
  @Column({ type: 'uuid', nullable: true }) scopeId: string | null;
  @Column({ type: 'timestamptz' }) effectiveFrom: Date;
  @Column({ type: 'timestamptz', nullable: true }) effectiveUntil: Date | null;
  @Column({ type: 'varchar', length: 20, default: 'active' }) status: string;
  @Column({ type: 'varchar', length: 500, nullable: true }) reason: string | null;
  @Column({ type: 'uuid', nullable: true }) approvedBy: string | null;
  @Column({ type: 'timestamptz', nullable: true }) exceptionExpiresAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

@Entity('access_security_policies')
export class AccessSecurityPolicyOrmEntity {
  @PrimaryColumn('uuid') companyId: string;
  @Column({ type: 'int', default: 12 }) minPasswordLength: number;
  @Column({ default: false }) mfaRequired: boolean;
  @Column({ default: true }) mfaForHighRisk: boolean;
  @Column({ type: 'int', default: 60 }) sessionMinutes: number;
  @Column({ type: 'jsonb', default: () => "'[]'" }) allowedNetworks: string[];
  @Column({ type: 'int', default: 5 }) maxFailedAttempts: number;
  @Column({ type: 'int', default: 15 }) lockoutMinutes: number;
  @Column({ type: 'varchar', length: 20, default: 'immediate' }) terminationRevocation: string;
  @Column({ type: 'int', default: 1 }) policyVersion: number;
  @Column({ type: 'uuid', nullable: true }) updatedBy: string | null;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}

@Entity('access_sod_rules')
@Unique('access_sod_rules_pair_uq', ['companyId', 'permissionA', 'permissionB'])
export class AccessSodRuleOrmEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column({ length: 120 }) permissionA: string;
  @Column({ length: 120 }) permissionB: string;
  @Column({ default: true }) critical: boolean;
}

@Entity('access_sod_exceptions')
@Index('access_sod_exceptions_active_idx', ['companyId', 'employeeId', 'expiresAt'])
export class AccessSodExceptionOrmEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column('uuid') employeeId: string;
  @Column({ length: 120 }) permissionA: string;
  @Column({ length: 120 }) permissionB: string;
  @Column({ type: 'varchar', length: 500 }) reason: string;
  @Column('uuid') approvedBy: string;
  @Column({ type: 'timestamptz' }) expiresAt: Date;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

@Entity('access_delegations')
@Index('access_delegations_active_idx', ['companyId', 'delegateId', 'status'])
export class AccessDelegationOrmEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column('uuid') delegatorId: string;
  @Column('uuid') delegateId: string;
  @Column({ type: 'jsonb' }) permissionKeys: string[];
  @Column({ type: 'jsonb' }) scope: { type: string; id?: string };
  @Column({ type: 'timestamptz' }) startsAt: Date;
  @Column({ type: 'timestamptz' }) endsAt: Date;
  @Column({ type: 'varchar', length: 500 }) reason: string;
  @Column({ type: 'varchar', length: 20, default: 'pending' }) status: string;
  @Column({ type: 'uuid', nullable: true }) approvedBy: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

@Entity('access_elevations')
@Index('access_elevations_active_idx', ['companyId', 'employeeId', 'status'])
export class AccessElevationOrmEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column('uuid') employeeId: string;
  @Column({ type: 'jsonb' }) permissionKeys: string[];
  @Column({ type: 'jsonb' }) scope: { type: string; id?: string };
  @Column({ type: 'varchar', length: 500 }) purpose: string;
  @Column({ type: 'timestamptz' }) expiresAt: Date;
  @Column({ type: 'varchar', length: 20, default: 'pending' }) status: string;
  @Column({ type: 'uuid', nullable: true }) approvedBy: string | null;
  @Column({ type: 'timestamptz', nullable: true }) approvedAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

@Entity('access_reviews')
@Index('access_reviews_open_idx', ['companyId', 'reviewerId', 'status'])
export class AccessReviewOrmEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column('uuid') reviewerId: string;
  @Column('uuid') employeeId: string;
  @Column({ type: 'uuid', nullable: true }) assignmentId: string | null;
  @Column({ type: 'timestamptz' }) dueAt: Date;
  @Column({ type: 'varchar', length: 20, default: 'pending' }) status: string;
  @Column({ type: 'varchar', length: 20, nullable: true }) decision: string | null;
  @Column({ type: 'varchar', length: 500, nullable: true }) decisionReason: string | null;
  @Column({ type: 'uuid', nullable: true }) decidedBy: string | null;
  @Column({ type: 'timestamptz', nullable: true }) decidedAt: Date | null;
  @Column({ default: false }) escalated: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

@Entity('access_decision_evidence')
@Index('access_decision_evidence_company_time_idx', ['companyId', 'createdAt'])
export class AccessDecisionEvidenceOrmEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column({ type: 'uuid', nullable: true }) actorId: string | null;
  @Column({ type: 'uuid', nullable: true }) roleId: string | null;
  @Column({ length: 120 }) action: string;
  @Column({ type: 'uuid', nullable: true }) targetId: string | null;
  @Column({ default: false }) allowed: boolean;
  @Column({ type: 'varchar', length: 120 }) reasonCode: string;
  @Column({ type: 'jsonb', default: () => "'{}'" }) policyContext: Record<string, unknown>;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

@Entity('access_login_attempts')
@Index('access_login_attempts_company_time_idx', ['companyId', 'createdAt'])
export class AccessLoginAttemptOrmEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column({ type: 'uuid', nullable: true }) employeeId: string | null;
  @Column({ type: 'varchar', length: 254 }) email: string;
  @Column({ type: 'varchar', length: 64 }) sourceIp: string;
  @Column({ default: false }) succeeded: boolean;
  @Column({ length: 80 }) reasonCode: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

@Entity('access_sessions')
@Index('access_sessions_employee_expiry_idx', ['companyId', 'employeeId', 'expiresAt'])
export class AccessSessionOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column('uuid') employeeId: string;
  @Column({ type: 'timestamptz' }) expiresAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) revokedAt: Date | null;
  @Column({ type: 'int' }) policyVersion: number;
  @Column({ type: 'varchar', length: 64 }) sourceIp: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

@Entity('access_field_rules')
@Unique('access_field_rules_role_field_uq', ['companyId', 'roleId', 'fieldKey'])
export class AccessFieldRuleOrmEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column('uuid') roleId: string;
  @Column({ length: 120 }) fieldKey: string;
  @Column({ type: 'varchar', length: 20 }) behavior: 'hidden' | 'masked' | 'readonly' | 'editable';
  @Column({ type: 'varchar', length: 300 }) purpose: string;
}
