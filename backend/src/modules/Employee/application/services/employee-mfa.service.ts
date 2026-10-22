import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { EmployeeAccountOrmEntity } from '../../../User/infrastructure/persistence/user-account.orm-entity';
import { TotpService } from './totp.service';
import { AccessControlService } from '../../../AccessControl/application/access-control.service';

@Injectable()
export class EmployeeMfaService {
  constructor(@InjectRepository(EmployeeAccountOrmEntity) private readonly accounts: Repository<EmployeeAccountOrmEntity>, private readonly totp: TotpService, private readonly access: AccessControlService) {}
  async begin(companyId: string, employeeId: string) {
    const account = await this.accounts.findOne({ where: { companyId, employeeId } });
    if (!account?.activatedAt) throw new NotFoundException('Employee account not found');
    const secret = this.totp.newSecret();
    account.mfaSecret = this.encrypt(secret); account.mfaEnabled = false;
    await this.accounts.save(account);
    return { secret, provisioningUri: this.totp.provisioningUri(secret, account.companyEmail ?? account.email) };
  }
  async confirm(companyId: string, employeeId: string, code: string, ip = '') {
    const account = await this.accounts.findOne({ where: { companyId, employeeId } });
    if (!account?.mfaSecret || account.accountStatus !== 'ACTIVE' || (account.lockedUntil && account.lockedUntil > new Date())) throw new UnauthorizedException('Invalid MFA code');
    if (!this.totp.verify(this.decrypt(account.mfaSecret), code)) {
      const policy: any = await this.access.getPolicy(companyId);
      account.failedLoginAttempts += 1;
      if (account.failedLoginAttempts >= policy.maxFailedAttempts) {
        account.lockedUntil = new Date(Date.now() + policy.lockoutMinutes * 60_000);
        account.failedLoginAttempts = 0;
        await this.access.revokeEmployeeSessions(companyId, employeeId);
      }
      await this.accounts.save(account);
      await this.access.recordAuthenticationDecision(companyId, employeeId, false, 'INVALID_MFA_ENROLLMENT', ip, account.companyEmail ?? account.email);
      throw new UnauthorizedException('Invalid MFA code');
    }
    account.mfaEnabled = true; await this.accounts.save(account);
    await this.access.recordAuthenticationDecision(companyId, employeeId, true, 'MFA_ENROLLED', ip, account.companyEmail ?? account.email);
    return { mfaEnabled: true };
  }
  verify(secret: string | null, code?: string) {
    try { return !!secret && !!code && this.totp.verify(this.decrypt(secret), code); }
    catch { return false; }
  }
  private key() {
    const source = process.env.MFA_ENCRYPTION_KEY;
    if (!source || source.length < 32) throw new Error('MFA_ENCRYPTION_KEY must contain at least 32 characters');
    return createHash('sha256').update(source).digest();
  }
  private encrypt(value: string) {
    const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const body = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${body.toString('base64url')}`;
  }
  private decrypt(value: string) {
    const [iv, tag, body] = value.split('.');
    const decipher = createDecipheriv('aes-256-gcm', this.key(), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(body, 'base64url')), decipher.final()]).toString('utf8');
  }
}
