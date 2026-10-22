import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccessControl1792020000000 implements MigrationInterface {
  name = 'AccessControl1792020000000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE access_roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
      name varchar(100) NOT NULL, purpose varchar(500) NOT NULL, permission_keys jsonb NOT NULL DEFAULT '[]',
      default_for_new_hires boolean NOT NULL DEFAULT false, default_scope_type varchar(20) NOT NULL DEFAULT 'self',
      high_risk boolean NOT NULL DEFAULT false, is_core boolean NOT NULL DEFAULT false,
      status varchar(20) NOT NULL DEFAULT 'active', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT access_roles_company_id_id_uq UNIQUE(company_id, id)
    )`);
    await q.query(`CREATE UNIQUE INDEX access_roles_active_name_uq ON access_roles(company_id, lower(name)) WHERE status = 'active'`);
    await q.query(`CREATE TABLE access_permissions (
      permission_key varchar(120) PRIMARY KEY, description varchar(300) NOT NULL, is_protected boolean NOT NULL DEFAULT false
    )`);
    await q.query(`CREATE TABLE access_role_permissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL, role_id uuid NOT NULL,
      permission_key varchar(120) NOT NULL REFERENCES access_permissions(permission_key), granted_by uuid,
      CONSTRAINT access_role_permissions_role_tenant_fk FOREIGN KEY(company_id, role_id) REFERENCES access_roles(company_id, id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT access_role_permissions_grant_uq UNIQUE(company_id, role_id, permission_key)
    )`);
    await q.query(`CREATE TABLE access_assignments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL, employee_id uuid NOT NULL, role_id uuid NOT NULL,
      scope_type varchar(20) NOT NULL, scope_id uuid, effective_from timestamptz NOT NULL, effective_until timestamptz,
      status varchar(20) NOT NULL DEFAULT 'active', reason varchar(500), approved_by uuid, exception_expires_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT access_assignments_company_id_id_uq UNIQUE(company_id, id),
      CONSTRAINT access_assignments_employee_tenant_fk FOREIGN KEY(company_id, employee_id) REFERENCES employees(company_id, id) ON DELETE RESTRICT,
      CONSTRAINT access_assignments_role_tenant_fk FOREIGN KEY(company_id, role_id) REFERENCES access_roles(company_id, id) ON DELETE RESTRICT
    )`);
    await q.query(`CREATE INDEX access_assignments_employee_idx ON access_assignments(company_id, employee_id, status)`);
    await q.query(`CREATE TABLE access_security_policies (
      company_id uuid PRIMARY KEY, min_password_length integer NOT NULL DEFAULT 12, mfa_required boolean NOT NULL DEFAULT false,
      mfa_for_high_risk boolean NOT NULL DEFAULT true, session_minutes integer NOT NULL DEFAULT 60, allowed_networks jsonb NOT NULL DEFAULT '[]',
      max_failed_attempts integer NOT NULL DEFAULT 5, lockout_minutes integer NOT NULL DEFAULT 15,
      termination_revocation varchar(20) NOT NULL DEFAULT 'immediate', policy_version integer NOT NULL DEFAULT 1,
      updated_by uuid, updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await q.query(`CREATE TABLE access_sod_rules (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL, permission_a varchar(120) NOT NULL,
      permission_b varchar(120) NOT NULL, critical boolean NOT NULL DEFAULT true,
      CONSTRAINT access_sod_rules_pair_uq UNIQUE(company_id, permission_a, permission_b)
    )`);
    await q.query(`CREATE TABLE access_sod_exceptions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL, employee_id uuid NOT NULL,
      permission_a varchar(120) NOT NULL, permission_b varchar(120) NOT NULL, reason varchar(500) NOT NULL,
      approved_by uuid NOT NULL, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT access_sod_exceptions_employee_tenant_fk FOREIGN KEY(company_id, employee_id) REFERENCES employees(company_id, id) ON DELETE RESTRICT
    )`);
    await q.query(`CREATE INDEX access_sod_exceptions_active_idx ON access_sod_exceptions(company_id, employee_id, expires_at)`);
    await q.query(`CREATE TABLE access_delegations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL, delegator_id uuid NOT NULL, delegate_id uuid NOT NULL,
      permission_keys jsonb NOT NULL, scope jsonb NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
      reason varchar(500) NOT NULL, status varchar(20) NOT NULL DEFAULT 'pending', approved_by uuid,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT access_delegations_delegator_tenant_fk FOREIGN KEY(company_id, delegator_id) REFERENCES employees(company_id, id) ON DELETE RESTRICT,
      CONSTRAINT access_delegations_delegate_tenant_fk FOREIGN KEY(company_id, delegate_id) REFERENCES employees(company_id, id) ON DELETE RESTRICT
    )`);
    await q.query(`CREATE INDEX access_delegations_active_idx ON access_delegations(company_id, delegate_id, status)`);
    await q.query(`CREATE TABLE access_elevations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL, employee_id uuid NOT NULL,
      permission_keys jsonb NOT NULL, scope jsonb NOT NULL, purpose varchar(500) NOT NULL, expires_at timestamptz NOT NULL,
      status varchar(20) NOT NULL DEFAULT 'pending', approved_by uuid, approved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT access_elevations_employee_tenant_fk FOREIGN KEY(company_id, employee_id) REFERENCES employees(company_id, id) ON DELETE RESTRICT
    )`);
    await q.query(`CREATE INDEX access_elevations_active_idx ON access_elevations(company_id, employee_id, status)`);
    await q.query(`CREATE TABLE access_reviews (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL, reviewer_id uuid NOT NULL, employee_id uuid NOT NULL,
      assignment_id uuid, due_at timestamptz NOT NULL, status varchar(20) NOT NULL DEFAULT 'pending', decision varchar(20),
      decision_reason varchar(500), decided_by uuid, decided_at timestamptz, escalated boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT access_reviews_reviewer_tenant_fk FOREIGN KEY(company_id, reviewer_id) REFERENCES employees(company_id, id) ON DELETE RESTRICT,
      CONSTRAINT access_reviews_employee_tenant_fk FOREIGN KEY(company_id, employee_id) REFERENCES employees(company_id, id) ON DELETE RESTRICT,
      CONSTRAINT access_reviews_assignment_tenant_fk FOREIGN KEY(company_id, assignment_id) REFERENCES access_assignments(company_id, id) ON DELETE RESTRICT
    )`);
    await q.query(`CREATE INDEX access_reviews_open_idx ON access_reviews(company_id, reviewer_id, status)`);
    await q.query(`CREATE TABLE access_decision_evidence (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL, actor_id uuid, role_id uuid,
      action varchar(120) NOT NULL, target_id uuid, allowed boolean NOT NULL, reason_code varchar(120) NOT NULL,
      policy_context jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await q.query(`CREATE INDEX access_decision_evidence_company_time_idx ON access_decision_evidence(company_id, created_at)`);
    await q.query(`CREATE TABLE access_login_attempts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL, employee_id uuid,
      email varchar(254) NOT NULL, source_ip varchar(64) NOT NULL, succeeded boolean NOT NULL DEFAULT false,
      reason_code varchar(80) NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await q.query(`CREATE INDEX access_login_attempts_company_time_idx ON access_login_attempts(company_id, created_at)`);
    await q.query(`CREATE TABLE access_sessions (
      id uuid PRIMARY KEY, company_id uuid NOT NULL, employee_id uuid NOT NULL, expires_at timestamptz NOT NULL,
      revoked_at timestamptz, policy_version integer NOT NULL, source_ip varchar(64) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT access_sessions_employee_tenant_fk FOREIGN KEY(company_id, employee_id) REFERENCES employees(company_id, id) ON DELETE RESTRICT
    )`);
    await q.query(`CREATE INDEX access_sessions_employee_expiry_idx ON access_sessions(company_id, employee_id, expires_at)`);
    await q.query(`CREATE TABLE access_field_rules (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL, role_id uuid NOT NULL,
      field_key varchar(120) NOT NULL, behavior varchar(20) NOT NULL, purpose varchar(300) NOT NULL,
      CONSTRAINT access_field_rules_role_field_uq UNIQUE(company_id, role_id, field_key),
      CONSTRAINT access_field_rules_role_tenant_fk FOREIGN KEY(company_id, role_id) REFERENCES access_roles(company_id, id) ON DELETE CASCADE
    )`);
  }
  async down(q: QueryRunner): Promise<void> {
    for (const table of ['access_field_rules','access_sessions','access_login_attempts','access_decision_evidence','access_reviews','access_elevations','access_delegations','access_sod_exceptions','access_sod_rules','access_security_policies','access_assignments','access_role_permissions','access_permissions','access_roles']) await q.query(`DROP TABLE ${table}`);
  }
}
