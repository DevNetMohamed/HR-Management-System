import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { UserEmailService } from '../../../User/application/services/user-email.service';
import { EmployeeAccountOrmEntity } from '../../../User/infrastructure/persistence/user-account.orm-entity';
import { hrmsActionUrl } from '../../../User/application/services/hrms-url';

@Injectable()
export class EmployeeInvitationService {
  private readonly logger = new Logger(EmployeeInvitationService.name);
  constructor(
    @InjectRepository(EmployeeAccountOrmEntity)
    private readonly accounts: Repository<EmployeeAccountOrmEntity>,
    private readonly email: UserEmailService,
  ) {}

  prepare(companyId: string, employeeId: string, personalEmail: string, companyEmail?: string) {
    return this.accounts.create({
      id: randomUUID(),
      companyId,
      employeeId,
      email: (companyEmail ?? personalEmail).trim().toLowerCase(),
      personalEmail: personalEmail.trim().toLowerCase(),
      companyEmail: companyEmail?.trim().toLowerCase() ?? null,
      accountStatus: 'PENDING_ACTIVATION',
      companyEmailStatus: 'PENDING',
      passwordHash: null,
      invitationTokenHash: null,
      invitationExpiresAt: null,
      activatedAt: null,
      mfaSecret: null,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  }

  async issueHrmsActivation(account: EmployeeAccountOrmEntity) {
    if (!account.personalEmail || account.companyEmailStatus !== 'ACTIVE' || account.accountStatus !== 'PENDING_ACTIVATION') return;
    const token = randomBytes(32).toString('hex');
    const result = await this.accounts.createQueryBuilder()
      .update()
      .set({
        invitationTokenHash: this.hashToken(token),
        invitationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        activationSentAt: new Date(),
      })
      .where('id = :id AND account_status = :accountStatus AND company_email_status = :emailStatus', {
        id: account.id,
        accountStatus: 'PENDING_ACTIVATION',
        emailStatus: 'ACTIVE',
      })
      .andWhere('(activation_sent_at IS NULL OR activation_sent_at <= NOW() - INTERVAL \'60 seconds\')')
      .execute();
    if (!result.affected) return;
    try {
      await this.email.sendHrmsActivation(account.personalEmail, hrmsActionUrl('/auth/accept-invitation', token));
    } catch (error) {
      await this.accounts.createQueryBuilder().update().set({
        invitationTokenHash: null, invitationExpiresAt: null, activationSentAt: null,
      }).where('id = :id AND invitation_token_hash = :tokenHash', { id: account.id, tokenHash: this.hashToken(token) }).execute();
      throw error;
    }
  }

  async resendHrmsActivation(companyId: string, email: string) {
    const account = await this.accounts.findOne({ where: { companyId, personalEmail: email.trim().toLowerCase() } });
    if (account) {
      try { await this.issueHrmsActivation(account); }
      catch { this.logger.error('Activation email delivery failed'); }
    }
    return { message: 'If the account is eligible, an activation email will be sent.' };
  }

  hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
