import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { AccessControlService } from '../../../AccessControl/application/access-control.service';
import { EmployeeAccountOrmEntity } from '../../../User/infrastructure/persistence/user-account.orm-entity';
import { EmployeePasswordRecoveryOrmEntity } from '../../../User/infrastructure/persistence/user-password-recovery.orm-entity';
import { PasswordHasher } from './password-hasher';
import { UserEmailService } from '../../../User/application/services/user-email.service';
import { AccessSessionOrmEntity } from '../../../AccessControl/infrastructure/persistence/access-control.orm-entities';
import { hrmsActionUrl } from '../../../User/application/services/hrms-url';

@Injectable()
export class EmployeePasswordRecoveryService {
  private readonly logger = new Logger(EmployeePasswordRecoveryService.name);
  constructor(
    @InjectRepository(EmployeeAccountOrmEntity) private readonly accounts: Repository<EmployeeAccountOrmEntity>,
    @InjectRepository(EmployeePasswordRecoveryOrmEntity) private readonly recoveries: Repository<EmployeePasswordRecoveryOrmEntity>,
    private readonly passwords: PasswordHasher,
    private readonly access: AccessControlService,
    private readonly email: UserEmailService,
  ) {}

  async request(companyId: string, email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const issued = await this.accounts.manager.transaction(async (manager) => {
      const accounts = manager.getRepository(EmployeeAccountOrmEntity);
      const account = await accounts.findOne({
        where: [{ companyId, email: normalizedEmail }, { companyId, companyEmail: normalizedEmail }],
        lock: { mode: 'pessimistic_write' },
      });
      if (!account?.passwordHash || account.accountStatus !== 'ACTIVE') return null;
      const recoveries = manager.getRepository(EmployeePasswordRecoveryOrmEntity);
      const latest = await recoveries.findOne({ where: { companyId, employeeId: account.employeeId, usedAt: IsNull() }, order: { createdAt: 'DESC' } });
      if (latest && Date.now() - latest.createdAt.getTime() < 60_000) return null;
      const token = randomBytes(32).toString('hex');
      await recoveries.update({ companyId, employeeId: account.employeeId, usedAt: IsNull() }, { usedAt: new Date() });
      await recoveries.save(recoveries.create({ companyId, employeeId: account.employeeId,
        tokenHash: this.hash(token), expiresAt: new Date(Date.now() + 30 * 60000), usedAt: null }));
      return { account, token };
    });
    if (issued) {
      try {
        await this.email.sendPasswordRecovery(issued.account.personalEmail ?? issued.account.email, hrmsActionUrl('/auth/password-recovery', issued.token));
      } catch {
        await this.recoveries.update({ tokenHash: this.hash(issued.token), usedAt: IsNull() }, { usedAt: new Date() });
        this.logger.error('Password recovery email delivery failed');
      }
    }
    return { message: 'If an active account matches that email, password recovery instructions will be sent.' };
  }

  async complete(token: string, password: string) {
    const row = await this.recoveries.findOne({ where: { tokenHash: this.hash(token), usedAt: IsNull() } });
    if (!row || row.expiresAt <= new Date()) throw new BadRequestException('Recovery token is invalid or expired');
    const policy: any = await this.access.getPolicy(row.companyId);
    if (password.length < policy.minPasswordLength) throw new BadRequestException(`Password must be at least ${policy.minPasswordLength} characters`);
    const account = await this.accounts.findOne({ where: { companyId: row.companyId, employeeId: row.employeeId } });
    if (!account || account.accountStatus !== 'ACTIVE') throw new BadRequestException('Recovery token is invalid or expired');
    const passwordHash = await this.passwords.hash(password);
    const changed = await this.recoveries.manager.transaction(async (manager) => {
      const consumed = await manager.getRepository(EmployeePasswordRecoveryOrmEntity).createQueryBuilder()
        .update().set({ usedAt: new Date() })
        .where('id = :id AND used_at IS NULL AND expires_at > NOW()', { id: row.id }).execute();
      if (!consumed.affected) return false;
      const updated = await manager.getRepository(EmployeeAccountOrmEntity).createQueryBuilder()
        .update().set({ passwordHash, failedLoginAttempts: 0, lockedUntil: null })
        .where('company_id = :companyId AND employee_id = :employeeId AND account_status = :status', {
          companyId: row.companyId, employeeId: row.employeeId, status: 'ACTIVE',
        }).execute();
      if (!updated.affected) throw new BadRequestException('Recovery token is invalid or expired');
      await manager.getRepository(AccessSessionOrmEntity).createQueryBuilder().update().set({ revokedAt: new Date() })
        .where('company_id = :companyId AND employee_id = :employeeId AND revoked_at IS NULL', {
          companyId: row.companyId, employeeId: row.employeeId,
        }).execute();
      return true;
    });
    if (!changed) throw new BadRequestException('Recovery token is invalid or expired');
    try { await this.email.sendPasswordChanged(account.personalEmail ?? account.email); }
    catch { this.logger.error('Password change confirmation email delivery failed'); }
    return { message: 'Password changed. Please sign in again.' };
  }

  private hash(token: string) { return createHash('sha256').update(token).digest('hex'); }
}
