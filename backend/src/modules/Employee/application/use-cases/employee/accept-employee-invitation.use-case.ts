import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeAccountOrmEntity } from '../../../../User/infrastructure/persistence/user-account.orm-entity';
import { EmployeeInvitationService } from '../../services/employee-invitation.service';
import { PasswordHasher } from '../../services/password-hasher';
import { AccessControlService } from '../../../../AccessControl/application/access-control.service';
import { UserEmailService } from '../../../../User/application/services/user-email.service';

@Injectable()
export class AcceptEmployeeInvitationUseCase {
  constructor(@InjectRepository(EmployeeAccountOrmEntity) private readonly accounts: Repository<EmployeeAccountOrmEntity>, private readonly invitations: EmployeeInvitationService, private readonly passwords: PasswordHasher, private readonly access: AccessControlService, private readonly email: UserEmailService) {}
  async execute(token: string, password: string) {
    const account = await this.accounts.findOne({ where: { invitationTokenHash: this.invitations.hashToken(token) } });
    if (!account || !account.invitationExpiresAt || account.invitationExpiresAt.getTime() <= Date.now() || account.passwordHash || account.companyEmailStatus !== 'ACTIVE') throw new BadRequestException('Invitation is invalid, expired, or company email is not active');
    const policy: any = await this.access.getPolicy(account.companyId);
    if (password.length < policy.minPasswordLength) throw new BadRequestException(`Password must be at least ${policy.minPasswordLength} characters`);
    const passwordHash = await this.passwords.hash(password);
    const result = await this.accounts.createQueryBuilder()
      .update()
      .set({ passwordHash, invitationTokenHash: null, invitationExpiresAt: null, activatedAt: new Date(), accountStatus: 'ACTIVE' })
      .where('id = :id AND invitation_token_hash = :tokenHash AND password_hash IS NULL AND account_status = :status AND company_email_status = :emailStatus AND invitation_expires_at > NOW()', {
        id: account.id,
        tokenHash: this.invitations.hashToken(token),
        status: 'PENDING_ACTIVATION',
        emailStatus: 'ACTIVE',
      })
      .execute();
    if (!result.affected) throw new BadRequestException('Invitation is invalid or expired');
    if (account.personalEmail && account.companyEmail) {
      try { await this.email.sendHrmsActivated(account.personalEmail, account.companyEmail); }
      catch { /* Activation is complete; notification can be retried operationally. */ }
    }
    return { message: 'Password set successfully. You can now sign in.' };
  }
}
