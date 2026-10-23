import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { CompanyOrmEntity } from '../infrastructure/persistence/company/company.orm-entity';
import { CompanyNotificationRuleOrmEntity } from '../infrastructure/persistence/company-notification-rule.orm-entity';
import { CompanySetupDraftOrmEntity } from '../infrastructure/persistence/company-setup-draft.orm-entity';
import { CompanyConfigurationVersionOrmEntity } from '../infrastructure/persistence/company-configuration-version.orm-entity';
import { NotificationRuleRequest, PublishCompanyConfigurationRequest, SaveCompanySetupDraftRequest, UpdateNotificationRuleRequest } from './dto/company/company-settings.requests';
import { UserEmailService } from '../../User/application/services/user-email.service';
import { EmployeeAccountOrmEntity } from '../../User/infrastructure/persistence/user-account.orm-entity';

const defaults = [
  { ruleKey: 'leave-requested', name: 'Leave Requested', eventKey: 'leave.requested', recipients: ['manager'], recipientRoles: ['Manager'], channels: ['in_app', 'email'], isMandatory: true },
  { ruleKey: 'leave-approved', name: 'Leave Approved', eventKey: 'leave.approved', recipients: ['employee'], recipientRoles: ['Employee'], channels: ['in_app', 'email'], isMandatory: true },
  { ruleKey: 'payroll-published', name: 'Payroll Published', eventKey: 'payroll.published', recipients: ['employee'], recipientRoles: ['Employee'], channels: ['in_app', 'email'], isMandatory: false },
  { ruleKey: 'approval-overdue', name: 'Approval Overdue', eventKey: 'approval.overdue', recipients: ['manager'], recipientRoles: ['Manager'], channels: ['in_app', 'email'], isMandatory: false, status: 'draft' as const },
];

@Injectable()
export class CompanySettingsService {
  constructor(
    @InjectRepository(CompanyOrmEntity) private readonly companies: Repository<CompanyOrmEntity>,
    @InjectRepository(CompanyNotificationRuleOrmEntity) private readonly rules: Repository<CompanyNotificationRuleOrmEntity>,
    @InjectRepository(CompanySetupDraftOrmEntity) private readonly drafts: Repository<CompanySetupDraftOrmEntity>,
    @InjectRepository(CompanyConfigurationVersionOrmEntity) private readonly versions: Repository<CompanyConfigurationVersionOrmEntity>,
    @InjectRepository(EmployeeAccountOrmEntity) private readonly accounts: Repository<EmployeeAccountOrmEntity>,
    private readonly dataSource: DataSource,
    private readonly email: UserEmailService,
  ) {}

  async listRules(companyId: string) {
    for (const rule of defaults) await this.rules.createQueryBuilder().insert().values({ companyId, ...rule }).orIgnore().execute();
    return this.rules.find({ where: { companyId }, order: { createdAt: 'ASC' } });
  }

  async createRule(companyId: string, actorId: string, input: NotificationRuleRequest) {
    const rule = this.rules.create({ companyId, ...input, ruleKey: `custom-${randomUUID()}`, isMandatory: false, createdBy: actorId, updatedBy: actorId });
    return this.rules.save(rule);
  }

  async updateRule(companyId: string, actorId: string, id: string, input: UpdateNotificationRuleRequest) {
    const rule = await this.findRule(companyId, id);
    if (rule.isMandatory && input.status === 'draft') throw new BadRequestException('Mandatory notification rules cannot be disabled or moved to draft');
    Object.assign(rule, input, { updatedBy: actorId });
    return this.rules.save(rule);
  }

  async duplicateRule(companyId: string, actorId: string, id: string) {
    const original = await this.findRule(companyId, id);
    const { id: _id, createdAt: _created, updatedAt: _updated, ...copy } = original;
    return this.rules.save(this.rules.create({ ...copy, ruleKey: `custom-${randomUUID()}`, name: `${original.name} (Copy)`, status: 'draft', isMandatory: false, createdBy: actorId, updatedBy: actorId }));
  }

  async disableRule(companyId: string, id: string) {
    const rule = await this.findRule(companyId, id);
    if (rule.isMandatory) throw new BadRequestException('Mandatory notification rules cannot be disabled');
    rule.status = 'disabled';
    return this.rules.save(rule);
  }

  async testRule(companyId: string, actorId: string, id: string) {
    const rule = await this.findRule(companyId, id);
    const account = await this.accounts.findOne({ where: { companyId, employeeId: actorId } });
    if (!account?.email) throw new NotFoundException('Your account does not have a test email address');
    await this.email.sendNotificationTest(account.email, `[TEST] ${rule.templateSubject ?? rule.name}`, rule.templateBody ?? `This is a test notification for “${rule.name}”.`);
    return { sent: true, recipient: account.email };
  }

  async saveDraft(companyId: string, actorId: string, input: SaveCompanySetupDraftRequest) {
    let draft = await this.drafts.findOne({ where: { companyId } });
    if (!draft) draft = this.drafts.create({ companyId, configuration: input.configuration, updatedBy: actorId });
    else Object.assign(draft, { configuration: input.configuration, updatedBy: actorId });
    return this.drafts.save(draft);
  }

  async getDraft(companyId: string) {
    return (await this.drafts.findOne({ where: { companyId } })) ?? { companyId, configuration: {}, updatedAt: null };
  }

  async review(companyId: string) {
    for (const rule of defaults) await this.rules.createQueryBuilder().insert().values({ companyId, ...rule }).orIgnore().execute();
    const [company, draft, rules] = await Promise.all([
      this.companies.findOne({ where: { id: companyId } }), this.getDraft(companyId), this.rules.find({ where: { companyId } }),
    ]);
    if (!company) throw new NotFoundException('Company not found');
    const config: Record<string, any> = draft.configuration ?? {};
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!company.name?.trim() || !company.subdomain?.trim()) errors.push('Company name and subdomain are required');
    const branches = Array.isArray(config.branches) ? config.branches as any[] : [];
    const policies = Array.isArray(config.calendarPolicies) ? config.calendarPolicies as any[] : [];
    const shifts = Array.isArray(config.shifts) ? config.shifts as any[] : [];
    if (branches.some((b) => !b.policyId && !b.effectivePolicyId) && branches.length) errors.push('Every branch must have an effective calendar policy');
    if (shifts.some((s) => s.status === 'active' && !(s.branchIds?.length)) && shifts.length) errors.push('Every active shift must be assigned to at least one branch');
    if (JSON.stringify(config).toLowerCase().includes('self-approve')) warnings.push('Review approval roles for possible manager self-approval');
    if (policies.length === 0) warnings.push('No calendar policies were provided in the saved setup draft');
    for (const mandatory of defaults.filter((r) => r.isMandatory)) {
      if (!rules.some((r) => r.ruleKey === mandatory.ruleKey && r.status === 'active')) errors.push(`Mandatory notification rule is missing or inactive: ${mandatory.name}`);
    }
    return { valid: errors.length === 0, errors, warnings, sections: { profile: company, branches, calendarPolicies: policies, shifts, departments: config.departments ?? [], roles: config.roles ?? [], notifications: rules } };
  }

  async publish(companyId: string, actorId: string, input: PublishCompanyConfigurationRequest) {
    const effectiveDate = new Date(`${input.effectiveDate}T00:00:00.000Z`);
    if (Number.isNaN(effectiveDate.getTime())) throw new BadRequestException('Invalid effective date');
    if (effectiveDate < new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z')) throw new BadRequestException('Effective date cannot be in the past');
    return this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT id FROM companies WHERE id = $1 FOR UPDATE', [companyId]);
      const review = await this.review(companyId);
      if (!review.valid) throw new ConflictException({ message: 'Company setup has blocking errors', errors: review.errors });
      if (review.warnings.length && !input.acknowledgeWarnings) throw new ConflictException({ message: 'Warnings must be acknowledged before publishing', warnings: review.warnings });
      const repo = manager.getRepository(CompanyConfigurationVersionOrmEntity);
      const latest = await repo.createQueryBuilder('version').where('version.companyId = :companyId', { companyId }).orderBy('version.versionNumber', 'DESC').getOne();
      const snapshot = { review: review.sections, warnings: review.warnings, configuration: (await this.getDraft(companyId)).configuration };
      const version = repo.create({ companyId, versionNumber: (latest?.versionNumber ?? 0) + 1, effectiveDate: input.effectiveDate, changeSummary: input.changeSummary, snapshot, acknowledgedWarnings: input.acknowledgeWarnings ? review.warnings : [], publishedBy: actorId });
      return repo.save(version);
    });
  }

  async listVersions(companyId: string) { return this.versions.find({ where: { companyId }, order: { versionNumber: 'DESC' } }); }
  async getVersion(companyId: string, version: number) {
    const found = await this.versions.findOne({ where: { companyId, versionNumber: version } });
    if (!found) throw new NotFoundException('Configuration version not found');
    return found;
  }

  private async findRule(companyId: string, id: string) {
    const rule = await this.rules.findOne({ where: { companyId, id } });
    if (!rule) throw new NotFoundException('Notification rule not found');
    return rule;
  }
}
