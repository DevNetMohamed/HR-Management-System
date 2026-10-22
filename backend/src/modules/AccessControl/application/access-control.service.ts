import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID, timingSafeEqual } from 'crypto';
import { IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from 'eventemitter2';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmployeeOrmEntity } from '../../Employee/infrastructure/persistence/employee/employee.orm-entity';
import {
  AccessAssignmentOrmEntity, AccessDecisionEvidenceOrmEntity, AccessDelegationOrmEntity,
  AccessElevationOrmEntity, AccessReviewOrmEntity, AccessRoleOrmEntity,
  AccessSecurityPolicyOrmEntity, AccessSodRuleOrmEntity,
  AccessFieldRuleOrmEntity,
  AccessLoginAttemptOrmEntity, AccessPermissionOrmEntity, AccessRolePermissionOrmEntity, AccessSodExceptionOrmEntity,
  AccessSessionOrmEntity,
} from '../infrastructure/persistence/access-control.orm-entities';
import { EmployeeHired } from '../../Employee/domain/Employees/events/employee-hired.event';
import { EmployeeTerminated } from '../../Employee/domain/Employees/events/employee-terminated.events';
import { EmployeeAssignmentChanged } from '../../Employee/domain/Employees/events/employee-assignment-changed.event';
import { EmployeeAccountOrmEntity } from '../../User/infrastructure/persistence/user-account.orm-entity';
import { EmployeeStatus } from '../../Employee/domain/Employees/enums/Employee-enums';

export const ACCESS_PERMISSIONS = [
  'access.roles.manage', 'access.assignments.manage', 'access.policies.manage',
  'access.delegations.manage', 'access.sod.manage', 'access.sod.override',
  'access.elevations.request', 'access.elevations.approve', 'access.reviews.manage',
  'employee.read', 'employee.create', 'employee.update', 'employee.terminate',
  'contract.manage', 'dependent.manage', 'emergency-contact.manage',
];
export const ACCESS_SCOPES = ['self', 'direct_reports', 'department', 'branch', 'company'] as const;
const PROTECTED_PERMISSIONS = new Set(['access.roles.manage', 'access.assignments.manage', 'access.policies.manage', 'access.delegations.manage', 'access.sod.manage', 'access.sod.override', 'access.elevations.approve', 'access.reviews.manage']);

@Injectable()
export class AccessControlService implements OnModuleInit {
  constructor(
    @InjectRepository(AccessRoleOrmEntity) private readonly roles: Repository<AccessRoleOrmEntity>,
    @InjectRepository(AccessAssignmentOrmEntity) private readonly assignments: Repository<AccessAssignmentOrmEntity>,
    @InjectRepository(AccessSecurityPolicyOrmEntity) private readonly policies: Repository<AccessSecurityPolicyOrmEntity>,
    @InjectRepository(AccessSodRuleOrmEntity) private readonly sodRules: Repository<AccessSodRuleOrmEntity>,
    @InjectRepository(AccessDelegationOrmEntity) private readonly delegations: Repository<AccessDelegationOrmEntity>,
    @InjectRepository(AccessElevationOrmEntity) private readonly elevations: Repository<AccessElevationOrmEntity>,
    @InjectRepository(AccessReviewOrmEntity) private readonly reviews: Repository<AccessReviewOrmEntity>,
    @InjectRepository(AccessDecisionEvidenceOrmEntity) private readonly evidence: Repository<AccessDecisionEvidenceOrmEntity>,
    @InjectRepository(AccessFieldRuleOrmEntity) private readonly fieldRules: Repository<AccessFieldRuleOrmEntity>,
    @InjectRepository(AccessPermissionOrmEntity) private readonly permissions: Repository<AccessPermissionOrmEntity>,
    @InjectRepository(AccessRolePermissionOrmEntity) private readonly rolePermissions: Repository<AccessRolePermissionOrmEntity>,
    @InjectRepository(AccessSodExceptionOrmEntity) private readonly sodExceptions: Repository<AccessSodExceptionOrmEntity>,
    @InjectRepository(AccessLoginAttemptOrmEntity) private readonly loginAttempts: Repository<AccessLoginAttemptOrmEntity>,
    @InjectRepository(AccessSessionOrmEntity) private readonly sessions: Repository<AccessSessionOrmEntity>,
    @InjectRepository(EmployeeOrmEntity) private readonly employees: Repository<EmployeeOrmEntity>,
    @InjectRepository(EmployeeAccountOrmEntity) private readonly userAccounts: Repository<EmployeeAccountOrmEntity>,
    private readonly emitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    await this.permissions.createQueryBuilder()
      .insert()
      .values(ACCESS_PERMISSIONS.map((permissionKey) => ({
        permissionKey,
        description: permissionKey.replaceAll('.', ' '),
        isProtected: permissionKey.startsWith('access.'),
      })))
      .orIgnore()
      .execute();
  }

  async bootstrap(companyId: string, employeeId: string, key: string) {
    const configured = process.env.ACCESS_CONTROL_BOOTSTRAP_KEY;
    if (!configured || configured.length < 32 || key.length !== configured.length ||
      !timingSafeEqual(Buffer.from(key), Buffer.from(configured))) throw new UnauthorizedException('Invalid bootstrap key');
    if (await this.roles.count({ where: { companyId } })) throw new ConflictException('Access control is already initialized for this company');
    const role = await this.roles.save(this.roles.create({
      companyId, name: 'Security Administrator', purpose: 'Initial security administration role',
      permissionKeys: ['*'], isCore: true, status: 'active',
    }));
    await this.rolePermissions.save(ACCESS_PERMISSIONS.map((permissionKey) => this.rolePermissions.create({ companyId, roleId: role.id, permissionKey, grantedBy: employeeId })));
    await this.assignments.save(this.assignments.create({
      companyId, employeeId, roleId: role.id, scopeType: 'company', scopeId: null,
      effectiveFrom: new Date(), effectiveUntil: null, status: 'active', reason: 'Initial company bootstrap',
      approvedBy: employeeId,
    }));
    await this.policies.save(this.policies.create({ companyId, minPasswordLength: 12, mfaRequired: false,
      mfaForHighRisk: true, sessionMinutes: 60, allowedNetworks: [], maxFailedAttempts: 5,
      lockoutMinutes: 15, policyVersion: 1, updatedBy: employeeId }));
    return { roleId: role.id, initialized: true };
  }

  async createRole(companyId: string, input: { name: string; purpose: string; permissionKeys: string[]; defaultForNewHires?: boolean; defaultScopeType?: string; highRisk?: boolean }) {
    const name = input.name.trim();
    if (!name || !input.purpose.trim() || !input.permissionKeys.length) throw new ConflictException('Role name, purpose and permissions are required');
    if (input.permissionKeys.includes('*') || input.permissionKeys.some((p) => !ACCESS_PERMISSIONS.includes(p) || PROTECTED_PERMISSIONS.has(p))) throw new ForbiddenException('Role contains an unknown or protected permission');
    if ((await this.roles.find({ where: { companyId, status: 'active' } })).some((role) => role.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw new ConflictException('An active role with this name already exists');
    if (input.defaultForNewHires && !['self', 'department', 'branch'].includes(input.defaultScopeType ?? 'self')) throw new ConflictException('Default hire access must use self, department or branch scope');
    const role = await this.roles.save(this.roles.create({ ...input, companyId, name, permissionKeys: [...new Set(input.permissionKeys)], status: 'active', isCore: false }));
    await this.rolePermissions.save(role.permissionKeys.map((permissionKey) => this.rolePermissions.create({ companyId, roleId: role.id, permissionKey, grantedBy: null })));
    return role;
  }

  listRoles(companyId: string) { return this.roles.find({ where: { companyId }, order: { name: 'ASC' } }); }
  listAssignments(companyId: string, employeeId?: string) {
    return this.assignments.find({ where: employeeId ? { companyId, employeeId } : { companyId }, order: { createdAt: 'DESC' } });
  }
  listSodRules(companyId: string) { return this.sodRules.find({ where: { companyId } }); }
  listDelegations(companyId: string) { return this.delegations.find({ where: { companyId }, order: { createdAt: 'DESC' } }); }
  listElevations(companyId: string) { return this.elevations.find({ where: { companyId }, order: { createdAt: 'DESC' } }); }
  async retireRole(companyId: string, id: string) {
    const role = await this.roles.findOne({ where: { companyId, id } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isCore) throw new ForbiddenException('Core security roles cannot be retired');
    role.status = 'retired';
    await this.roles.save(role);
    return { retired: true };
  }

  async assignRole(companyId: string, actorId: string, input: any) {
    const [role, employee] = await Promise.all([
      this.roles.findOne({ where: { companyId, id: input.roleId, status: 'active' } }),
      this.employees.findOne({ where: { companyId, id: input.employeeId } }),
    ]);
    if (!role || !employee) throw new NotFoundException('Role or employee not found in this company');
    if (role.isCore) throw new ForbiddenException('Core security administrator role is managed only by the bootstrap process');
    if (!ACCESS_SCOPES.includes(input.scopeType)) throw new ConflictException('Invalid access scope');
    if (input.scopeType === 'self' && input.scopeId) throw new ConflictException('Self scope cannot include a scope id');
    if (['department', 'branch'].includes(input.scopeType) && !input.scopeId) throw new ConflictException('Department and branch scopes require a scope id');
    const startsAt = input.effectiveFrom ? new Date(input.effectiveFrom) : new Date();
    const endsAt = input.effectiveUntil ? new Date(input.effectiveUntil) : null;
    if (endsAt && endsAt <= startsAt) throw new ConflictException('Access end must be after its start');
    if (input.scopeType === 'department' && employee.departmentId !== input.scopeId) throw new ForbiddenException('Department scope does not match employee placement');
    if (input.scopeType === 'branch' && employee.branchId !== input.scopeId) throw new ForbiddenException('Branch scope does not match employee placement');

    const existing = await this.assignments.find({ where: { companyId, employeeId: employee.id, status: 'active' } });
    const activeRoles = await this.roles.find({ where: existing.map((a) => ({ id: a.roleId, companyId, status: 'active' as const })) });
    const held = new Set(activeRoles.flatMap((r) => r.permissionKeys));
    const conflicts = (await this.sodRules.find({ where: { companyId } })).filter((r) =>
      (role.permissionKeys.includes(r.permissionA) && held.has(r.permissionB)) ||
      (role.permissionKeys.includes(r.permissionB) && held.has(r.permissionA)));
    const critical = conflicts.some((r) => r.critical);
    if (critical) throw new ForbiddenException('Critical segregation-of-duties conflict prevents this assignment');
    let approvedBy: string | null = null;
    let exceptionExpiresAt: Date | null = null;
    if (conflicts.length) {
      try { await this.authorize(companyId, actorId, 'access.sod.override'); }
      catch { throw new ForbiddenException('A non-critical conflict requires an authorized independent approver'); }
      exceptionExpiresAt = input.exceptionExpiresAt ? new Date(input.exceptionExpiresAt) : null;
      if (!input.reason?.trim() || actorId === employee.id || !exceptionExpiresAt || exceptionExpiresAt <= new Date() ||
        exceptionExpiresAt.getTime() > Date.now() + 90 * 86400000) throw new ForbiddenException('A non-critical conflict requires a different approver, reason and exception expiry within 90 days');
      approvedBy = actorId;
      for (const conflict of conflicts) {
        await this.sodExceptions.save(this.sodExceptions.create({ companyId, employeeId: employee.id,
          permissionA: conflict.permissionA, permissionB: conflict.permissionB,
          reason: input.reason.trim(), approvedBy: actorId, expiresAt: exceptionExpiresAt }));
      }
    }

    return this.assignments.save(this.assignments.create({ companyId, employeeId: employee.id, roleId: role.id,
      scopeType: input.scopeType, scopeId: input.scopeId ?? null, effectiveFrom: startsAt, effectiveUntil: endsAt,
      status: 'active', reason: input.reason ?? null, approvedBy, exceptionExpiresAt }));
  }

  async endAssignment(companyId: string, id: string, effectiveAt: string) {
    const row = await this.assignments.findOne({ where: { companyId, id, status: 'active' } });
    if (!row) throw new NotFoundException('Active access assignment not found');
    row.effectiveUntil = new Date(effectiveAt);
    if (row.effectiveUntil <= row.effectiveFrom) throw new ConflictException('End date must be after assignment start');
    row.status = row.effectiveUntil <= new Date() ? 'revoked' : 'active';
    await this.assignments.save(row);
    return { revoked: true, effectiveAt: row.effectiveUntil };
  }

  async savePolicy(companyId: string, actorId: string, input: any) {
    const current = await this.policies.findOne({ where: { companyId } });
    const next = { ...current, ...input };
    if (next.minPasswordLength < 12 || next.sessionMinutes < 5 || next.sessionMinutes > 480 ||
      next.maxFailedAttempts < 3 || next.maxFailedAttempts > 10 || next.lockoutMinutes < 5 || next.lockoutMinutes > 1440) {
      throw new ConflictException('Policy is below mandatory platform security limits');
    }
    if (!['immediate', 'scheduled'].includes(next.terminationRevocation ?? 'immediate')) throw new ConflictException('Termination revocation must be immediate or scheduled');
    next.companyId = companyId;
    next.updatedBy = actorId;
    next.policyVersion = (current?.policyVersion ?? 0) + 1;
    return this.policies.save(this.policies.create(next));
  }
  async getPolicy(companyId: string) {
    return (await this.policies.findOne({ where: { companyId } })) ?? {
      companyId, minPasswordLength: 12, mfaRequired: false, mfaForHighRisk: true,
      sessionMinutes: 60, allowedNetworks: [], maxFailedAttempts: 5, lockoutMinutes: 15, terminationRevocation: 'immediate', policyVersion: 1,
    };
  }

  isIpAllowed(allowedNetworks: string[], ip: string) {
    if (!allowedNetworks?.length) return true;
    const client = ip?.replace(/^::ffff:/, '');
    return allowedNetworks.some((network) => {
      const [base, prefixText] = network.split('/');
      if (!prefixText) return client === base;
      const a = client.split('.').map(Number); const b = base.split('.').map(Number);
      if (a.length !== 4 || b.length !== 4) return client === base && prefixText === '128';
      const prefix = Number(prefixText); if (prefix < 0 || prefix > 32) return false;
      const toInt = (parts: number[]) => parts.reduce((n, part) => (n << 8) | part, 0) >>> 0;
      const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
      return (toInt(a) & mask) === (toInt(b) & mask);
    });
  }

  async recordAuthenticationDecision(companyId: string, actorId: string | null, allowed: boolean, reasonCode: string, ip: string, email = '') {
    await this.loginAttempts.save(this.loginAttempts.create({ companyId, employeeId: actorId,
      email: email.slice(0, 254), sourceIp: ip.slice(0, 64), succeeded: allowed, reasonCode }));
    await this.evidence.save(this.evidence.create({ companyId, actorId, roleId: null, action: 'auth.login', targetId: null,
      allowed, reasonCode, policyContext: { sourceIp: ip } }));
    if (!allowed && actorId) {
      const recent = await this.evidence.count({ where: { companyId, actorId, action: 'auth.login', allowed: false,
        createdAt: MoreThan(new Date(Date.now() - 15 * 60000)) } });
      if (recent >= 5 && recent % 5 === 0) {
        await this.evidence.save(this.evidence.create({ companyId, actorId, roleId: null,
        action: 'auth.suspicious_attempts', targetId: null, allowed: false, reasonCode: 'REPEATED_LOGIN_FAILURES',
        policyContext: { attempts: recent } }));
        await this.emitter.emitAsync('access.suspicious_attempts', { companyId, actorId, attempts: recent });
      }
    }
  }

  async createSession(companyId: string, employeeId: string, id: string, expiresAt: Date, policyVersion: number, sourceIp: string) {
    await this.sessions.save(this.sessions.create({ id, companyId, employeeId, expiresAt, policyVersion, sourceIp: sourceIp.slice(0, 64), revokedAt: null }));
  }

  async isSessionActive(companyId: string, employeeId: string, id: string) {
    const [session, policy] = await Promise.all([
      this.sessions.findOne({ where: { id, companyId, employeeId } }),
      this.getPolicy(companyId),
    ]);
    return !!session && !session.revokedAt && session.expiresAt > new Date() && session.policyVersion === policy.policyVersion;
  }

  async revokeSession(companyId: string, employeeId: string, id: string) {
    const session = await this.sessions.findOne({ where: { id, companyId, employeeId, revokedAt: IsNull() } });
    if (session) { session.revokedAt = new Date(); await this.sessions.save(session); }
    return { loggedOut: true };
  }

  async revokeEmployeeSessions(companyId: string, employeeId: string) {
    await this.sessions.createQueryBuilder().update().set({ revokedAt: new Date() })
      .where('company_id = :companyId AND employee_id = :employeeId AND revoked_at IS NULL', { companyId, employeeId }).execute();
  }

  async addSodRule(companyId: string, permissionA: string, permissionB: string, critical: boolean) {
    if (permissionA === permissionB || !ACCESS_PERMISSIONS.includes(permissionA) || !ACCESS_PERMISSIONS.includes(permissionB)) throw new ConflictException('SOD rule must contain two distinct known permissions');
    const [a, b] = [permissionA, permissionB].sort();
    if (await this.sodRules.findOne({ where: { companyId, permissionA: a, permissionB: b } })) throw new ConflictException('SOD rule already exists');
    return this.sodRules.save(this.sodRules.create({ companyId, permissionA: a, permissionB: b, critical }));
  }

  async saveFieldRule(companyId: string, roleId: string, fieldKey: string, behavior: any, purpose: string) {
    if (!['hidden', 'masked', 'readonly', 'editable'].includes(behavior)) throw new ConflictException('Invalid field access behavior');
    const role = await this.roles.findOne({ where: { companyId, id: roleId, status: 'active' } });
    if (!role) throw new NotFoundException('Active role not found');
    if (role.isCore && behavior === 'editable' && ['salary', 'bankAccount', 'nationalId', 'taxId'].includes(fieldKey)) throw new ForbiddenException('Core protected fields cannot be made editable');
    const existing = await this.fieldRules.findOne({ where: { companyId, roleId, fieldKey } });
    return this.fieldRules.save(this.fieldRules.create({ ...existing, companyId, roleId, fieldKey, behavior, purpose: purpose.trim() }));
  }

  async sanitizeEmployee(companyId: string, actorId: string, employee: any) {
    if (!employee) return employee;
    const assignments = await this.assignments.find({ where: { companyId, employeeId: actorId, status: 'active' } });
    const roles = await this.roles.find({ where: assignments.map((a) => ({ companyId, id: a.roleId, status: 'active' as const })) });
    const rules = roles.length ? await this.fieldRules.find({ where: roles.map((r) => ({ companyId, roleId: r.id })) }) : [];
    const fields = new Set([...Object.keys(employee), 'nationalId', 'salary', 'bankAccount', 'taxId']);
    for (const field of fields) {
      const fieldRules = rules.filter((r) => r.fieldKey === field);
      let behavior = fieldRules.some((r) => r.behavior === 'hidden') ? 'hidden' :
        fieldRules.some((r) => r.behavior === 'masked') ? 'masked' :
        fieldRules.some((r) => r.behavior === 'readonly') ? 'readonly' :
        fieldRules.some((r) => r.behavior === 'editable') ? 'editable' :
        ['nationalId', 'salary', 'bankAccount', 'taxId'].includes(field) ? 'hidden' : 'editable';
      if (behavior === 'hidden') delete employee[field];
      if (behavior === 'masked' && typeof employee[field] === 'string') employee[field] = employee[field].length < 4 ? '****' : `${'*'.repeat(employee[field].length - 4)}${employee[field].slice(-4)}`;
    }
    await this.evidence.save(this.evidence.create({ companyId, actorId, roleId: roles[0]?.id ?? null,
      action: 'employee.profile.read', targetId: employee.id ?? null, allowed: true,
      reasonCode: 'FIELD_RULES_APPLIED', policyContext: { fieldRulesApplied: rules.map((r) => r.fieldKey) } }));
    return employee;
  }

  async requiresMfa(companyId: string, employeeId: string) {
    const policy = await this.getPolicy(companyId);
    if (policy.mfaRequired) return true;
    const active = await this.assignments.find({ where: { companyId, employeeId, status: 'active' } });
    const roles = active.length ? await this.roles.find({ where: active.map((a) => ({ companyId, id: a.roleId, status: 'active' as const })) }) : [];
    return policy.mfaForHighRisk && roles.some((r) => r.highRisk);
  }

  @OnEvent('employee.hired')
  async onEmployeeHired(event: EmployeeHired) {
    const employee = await this.employees.findOne({ where: { companyId: event.companyId, id: event.employeeId } });
    if (!employee) return;
    const defaults = await this.roles.find({ where: { companyId: event.companyId, status: 'active', defaultForNewHires: true } });
    for (const role of defaults) {
      const type = role.defaultScopeType;
      const scopeId = type === 'department' ? employee.departmentId : type === 'branch' ? employee.branchId : null;
      if (['department', 'branch'].includes(type) && !scopeId) continue;
      await this.assignments.save(this.assignments.create({ companyId: event.companyId, employeeId: employee.id,
        roleId: role.id, scopeType: type, scopeId, effectiveFrom: new Date(event.hireDate),
        effectiveUntil: null, status: 'active', reason: 'Approved default joiner role', approvedBy: null }));
    }
  }

  @OnEvent('employee.assignment_changed')
  async onEmployeeAssignmentChanged(event: EmployeeAssignmentChanged) {
    const employee = await this.employees.findOne({ where: { companyId: event.companyId, id: event.employeeId } });
    if (!employee) return;
    const now = new Date(event.effectiveDate);
    const currentAssignments = await this.assignments.find({ where: { companyId: event.companyId, employeeId: event.employeeId, status: 'active' } });
    for (const assignment of currentAssignments) {
      const movedOut = (assignment.scopeType === 'department' && assignment.scopeId !== employee.departmentId) ||
        (assignment.scopeType === 'branch' && assignment.scopeId !== employee.branchId);
      if (!movedOut) continue;
      assignment.effectiveUntil = now;
      assignment.status = now <= new Date() ? 'revoked' : 'active';
      await this.assignments.save(assignment);
    }
    const defaults = await this.roles.find({ where: { companyId: event.companyId, status: 'active', defaultForNewHires: true } });
    for (const role of defaults) {
      const type = role.defaultScopeType;
      const scopeId = type === 'department' ? employee.departmentId : type === 'branch' ? employee.branchId : null;
      if (['department', 'branch'].includes(type) && !scopeId) continue;
      await this.assignments.save(this.assignments.create({ companyId: event.companyId, employeeId: employee.id,
        roleId: role.id, scopeType: type, scopeId, effectiveFrom: now, effectiveUntil: null,
        status: 'active', reason: `Approved ${event.changeType} access recalculation`, approvedBy: null }));
    }
  }

  @OnEvent('employee.terminated')
  async onEmployeeTerminated(event: EmployeeTerminated) {
    const policy = await this.getPolicy(event.companyId);
    const effectiveAt = policy.terminationRevocation === 'scheduled' ? new Date(`${event.lastWorkingDay}T23:59:59.999Z`) : new Date();
    await this.assignments.createQueryBuilder().update().set({ status: effectiveAt <= new Date() ? 'revoked' : 'active', effectiveUntil: effectiveAt })
      .where('company_id = :companyId AND employee_id = :employeeId AND status = :status', { companyId: event.companyId, employeeId: event.employeeId, status: 'active' }).execute();
    if (effectiveAt <= new Date()) {
      await this.userAccounts.update({ companyId: event.companyId, employeeId: event.employeeId, accountStatus: 'ACTIVE' }, { accountStatus: 'DISABLED' });
      await this.revokeEmployeeSessions(event.companyId, event.employeeId);
    }
  }

  async requestDelegation(companyId: string, actorId: string, input: any) {
    if (input.delegateId === actorId) throw new ForbiddenException('Self-delegation is prohibited');
    const startsAt = new Date(input.startsAt); const endsAt = new Date(input.endsAt);
    if (endsAt <= startsAt || endsAt.getTime() - startsAt.getTime() > 90 * 86400000) throw new ConflictException('Delegation must have a valid period of at most 90 days');
    if (!input.reason?.trim() || !input.permissionKeys?.length) throw new ConflictException('Delegation requires permissions and a reason');
    for (const permission of input.permissionKeys) {
      if (!(await this.hasPermissionAtScope(companyId, actorId, permission, input.scope))) throw new ForbiddenException('Delegation exceeds the delegator authority');
    }
    return this.delegations.save(this.delegations.create({ companyId, delegatorId: actorId,
      delegateId: input.delegateId, permissionKeys: [...new Set<string>(input.permissionKeys)], scope: input.scope,
      startsAt, endsAt, reason: input.reason.trim(), status: 'pending', approvedBy: null }));
  }

  async approveDelegation(companyId: string, actorId: string, id: string) {
    const row = await this.delegations.findOne({ where: { companyId, id, status: 'pending' } });
    if (!row) throw new NotFoundException('Pending delegation not found');
    if (actorId === row.delegatorId || actorId === row.delegateId) throw new ForbiddenException('A party to the delegation cannot approve it');
    row.status = 'approved'; row.approvedBy = actorId;
    return this.delegations.save(row);
  }

  async requestElevation(companyId: string, actorId: string, input: any) {
    const expiresAt = new Date(input.expiresAt);
    if (expiresAt <= new Date() || expiresAt.getTime() > Date.now() + 24 * 3600000) throw new ConflictException('Elevated access must expire within 24 hours');
    if (!input.purpose?.trim() || !input.permissionKeys?.length) throw new ConflictException('Purpose and permissions are required');
    return this.elevations.save(this.elevations.create({ companyId, employeeId: actorId,
      permissionKeys: [...new Set<string>(input.permissionKeys)], scope: input.scope, purpose: input.purpose.trim(),
      expiresAt, status: 'pending', approvedBy: null, approvedAt: null }));
  }

  async approveElevation(companyId: string, actorId: string, id: string) {
    const row = await this.elevations.findOne({ where: { companyId, id, status: 'pending' } });
    if (!row) throw new NotFoundException('Pending elevated access request not found');
    if (actorId === row.employeeId) throw new ForbiddenException('Self-approval is prohibited');
    row.status = 'approved'; row.approvedBy = actorId; row.approvedAt = new Date();
    return this.elevations.save(row);
  }

  async createReview(companyId: string, reviewerId: string, employeeId: string, dueAt: string) {
    if (reviewerId === employeeId) throw new ForbiddenException('Users cannot review their own access');
    const due = new Date(dueAt);
    if (due <= new Date()) throw new ConflictException('Review due date must be in the future');
    const rows = await this.assignments.find({ where: { companyId, employeeId, status: 'active' } });
    if (!rows.length) throw new NotFoundException('No active access assignments to review');
    return this.reviews.save(rows.map((a) => this.reviews.create({ companyId, reviewerId, employeeId,
      assignmentId: a.id, dueAt: due, status: 'pending', decision: null, decisionReason: null,
      decidedBy: null, decidedAt: null, escalated: false })));
  }

  async decideReview(companyId: string, actorId: string, id: string, decision: string, reason?: string) {
    const row = await this.reviews.findOne({ where: { companyId, id, status: 'pending' } });
    if (!row) throw new NotFoundException('Pending review item not found');
    if (row.reviewerId !== actorId) throw new ForbiddenException('Only the assigned reviewer can decide this review');
    if (row.employeeId === actorId) throw new ForbiddenException('Users cannot certify their own access');
    if (!['keep', 'remove', 'investigate'].includes(decision)) throw new ConflictException('Invalid review decision');
    if (!reason?.trim()) throw new ConflictException('Review decision requires a reason');
    row.status = 'completed'; row.decision = decision; row.decisionReason = reason.trim();
    row.decidedBy = actorId; row.decidedAt = new Date();
    await this.reviews.save(row);
    if (decision === 'remove' && row.assignmentId) await this.endAssignment(companyId, row.assignmentId, new Date().toISOString());
    return row;
  }

  async markOverdueReviews(companyId: string) {
    await this.reviews.createQueryBuilder().update().set({ escalated: true })
      .where('company_id = :companyId AND status = :status AND due_at < now()', { companyId, status: 'pending' }).execute();
    return this.reviews.find({ where: { companyId, status: 'pending', escalated: true } });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async maintainAccessLifecycle() {
    const now = new Date();
    await this.assignments.createQueryBuilder().update().set({ status: 'revoked' })
      .where('status = :status AND effective_until IS NOT NULL AND effective_until <= :now', { status: 'active', now }).execute();
    await this.delegations.createQueryBuilder().update().set({ status: 'expired' })
      .where('status = :status AND ends_at <= :now', { status: 'approved', now }).execute();
    await this.elevations.createQueryBuilder().update().set({ status: 'expired' })
      .where('status = :status AND expires_at <= :now', { status: 'approved', now }).execute();
    const due = await this.reviews.find({ where: { status: 'pending', escalated: false, dueAt: LessThan(now) } });
    for (const review of due) {
      review.escalated = true;
      await this.reviews.save(review);
      await this.emitter.emitAsync('access.review.escalated', { companyId: review.companyId, reviewerId: review.reviewerId, reviewId: review.id });
    }
    const terminated = await this.employees.find({ where: { status: EmployeeStatus.TERMINATED } });
    for (const employee of terminated) {
      const policy: any = await this.getPolicy(employee.companyId);
      const endOfLastDay = employee.terminationDate ? new Date(`${employee.terminationDate}T23:59:59.999Z`) : new Date(0);
      if (policy.terminationRevocation === 'scheduled' && endOfLastDay > now) continue;
      await this.userAccounts.update({ companyId: employee.companyId, employeeId: employee.id, accountStatus: 'ACTIVE' }, { accountStatus: 'DISABLED' });
      await this.revokeEmployeeSessions(employee.companyId, employee.id);
    }
  }

  async listDecisions(companyId: string, limit = 100) {
    return this.evidence.find({ where: { companyId }, order: { createdAt: 'DESC' }, take: Math.min(limit, 500) });
  }

  async authorize(companyId: string, actorId: string, permission: string, targetId?: string) {
    const roles = await this.roles.find({ where: { companyId, status: 'active' } });
    const roleMap = new Map(roles.map((r) => [r.id, r]));
    const now = new Date();
    const assignments = await this.assignments.find({ where: { companyId, employeeId: actorId, status: 'active' } });
    const activeRolesForEmployee = assignments.length ? await this.roles.find({ where: assignments.map((a) => ({ companyId, id: a.roleId, status: 'active' as const })) }) : [];
    const sodRules = await this.sodRules.find({ where: { companyId } });
    let matchedRoleId: string | null = null;
    let allowed = false;
    for (const assignment of assignments) {
      const role = roleMap.get(assignment.roleId);
      if (!role || (role.permissionKeys.includes(permission) === false && !role.permissionKeys.includes('*')) ||
        assignment.effectiveFrom > now || (assignment.effectiveUntil && assignment.effectiveUntil <= now)) continue;
      const otherPermissions = new Set(activeRolesForEmployee.filter((r) => r.id !== assignment.roleId).flatMap((r) => r.permissionKeys));
      const conflicts = sodRules.filter((r) =>
        (role.permissionKeys.includes(r.permissionA) && otherPermissions.has(r.permissionB)) ||
        (role.permissionKeys.includes(r.permissionB) && otherPermissions.has(r.permissionA)));
      if (conflicts.length) {
        const exceptions = await this.sodExceptions.find({ where: conflicts.flatMap((r) => [
          { companyId, employeeId: actorId, permissionA: r.permissionA, permissionB: r.permissionB, expiresAt: MoreThan(now) },
          { companyId, employeeId: actorId, permissionA: r.permissionB, permissionB: r.permissionA, expiresAt: MoreThan(now) },
        ]) });
        if (exceptions.length < conflicts.length) continue;
      }
      if ((!targetId && permission === 'employee.read') || await this.inScope(companyId, actorId, assignment.scopeType, assignment.scopeId, targetId)) {
        matchedRoleId = role.id; allowed = true; break;
      }
    }
    if (!allowed) {
      const grants = [
        ...(await this.delegations.find({ where: { companyId, delegateId: actorId, status: 'approved' } })).filter((x) => x.startsAt <= now && x.endsAt > now && x.permissionKeys.includes(permission)),
        ...(await this.elevations.find({ where: { companyId, employeeId: actorId, status: 'approved' } })).filter((x) => !!x.approvedAt && x.expiresAt > now && x.permissionKeys.includes(permission)),
      ];
      for (const grant of grants) if (await this.inScope(companyId, actorId, grant.scope.type, grant.scope.id ?? null, targetId)) { allowed = true; break; }
    }
    await this.evidence.save(this.evidence.create({ companyId, actorId, roleId: matchedRoleId,
      action: permission, targetId: targetId ?? null, allowed,
      reasonCode: allowed ? 'POLICY_ALLOW' : 'NO_ACTIVE_GRANT', policyContext: { targetId: targetId ?? null } }));
    if (!allowed) throw new ForbiddenException('Access denied');
    return true;
  }

  private async hasPermissionAtScope(companyId: string, actorId: string, permission: string, scope: any) {
    const active = await this.assignments.find({ where: { companyId, employeeId: actorId, status: 'active' } });
    const now = new Date();
    const roles = active.length ? await this.roles.find({ where: active.map((a) => ({ companyId, id: a.roleId, status: 'active' as const })) }) : [];
    return active.some((a) => {
      const role = roles.find((r) => r.id === a.roleId);
      if (!role || ( !role.permissionKeys.includes(permission) && !role.permissionKeys.includes('*')) || a.effectiveFrom > now || (a.effectiveUntil && a.effectiveUntil <= now)) return false;
      if (a.scopeType === 'company') return true;
      return a.scopeType === scope.type && (a.scopeId ?? null) === (scope.id ?? null);
    });
  }

  private async inScope(companyId: string, actorId: string, type: string, scopeId: string | null, targetId?: string) {
    if (!targetId) return type === 'company';
    if (type === 'company') return true;
    if (type === 'self') return targetId === actorId;
    const target = await this.employees.findOne({ where: { companyId, id: targetId } });
    if (!target) return false;
    if (type === 'direct_reports') return target.managerId === actorId;
    if (type === 'department') return !!scopeId && target.departmentId === scopeId;
    if (type === 'branch') return !!scopeId && target.branchId === scopeId;
    return false;
  }

  async visibleEmployeeIds(companyId: string, actorId: string): Promise<string[] | null> {
    const active = await this.assignments.find({ where: { companyId, employeeId: actorId, status: 'active' } });
    const now = new Date();
    const current = active.filter((a) => a.effectiveFrom <= now && (!a.effectiveUntil || a.effectiveUntil > now));
    const roles = current.length ? await this.roles.find({ where: current.map((a) => ({ companyId, id: a.roleId, status: 'active' as const })) }) : [];
    const permissionRoles = new Set(roles.filter((r) => r.permissionKeys.includes('*') || r.permissionKeys.includes('employee.read')).map((r) => r.id));
    const scopes = current.filter((a) => permissionRoles.has(a.roleId));
    if (scopes.some((a) => a.scopeType === 'company')) return null;
    const rows = await this.employees.find({ where: { companyId } });
    return rows.filter((employee) => scopes.some((a) =>
      (a.scopeType === 'self' && employee.id === actorId) ||
      (a.scopeType === 'direct_reports' && employee.managerId === actorId) ||
      (a.scopeType === 'department' && employee.departmentId === a.scopeId) ||
      (a.scopeType === 'branch' && employee.branchId === a.scopeId),
    )).map((e) => e.id);
  }
}
