import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { AccessControlService } from '../../../AccessControl/application/access-control.service';
import { PasswordHasher } from '../../../Employee/application/services/password-hasher';
import { EmployeeAccountOrmEntity } from '../../infrastructure/persistence/user-account.orm-entity';
import { UserEmailService } from '../services/user-email.service';
import { AccessSessionOrmEntity } from '../../../AccessControl/infrastructure/persistence/access-control.orm-entities';

@Injectable()
export class ChangeHrmsPasswordUseCase {
  constructor(
    @InjectRepository(EmployeeAccountOrmEntity) private readonly accounts: Repository<EmployeeAccountOrmEntity>,
    private readonly dataSource: DataSource,
    private readonly passwords: PasswordHasher,
    private readonly access: AccessControlService,
    private readonly email: UserEmailService,
  ) {}

  async execute(companyId: string, employeeId: string, currentPassword: string, newPassword: string) {
    const account = await this.accounts.findOne({ where: { companyId, employeeId } });
    if (!account || account.accountStatus !== 'ACTIVE' || !account.passwordHash ||
      !(await this.passwords.verify(currentPassword, account.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const policy: any = await this.access.getPolicy(companyId);
    if (newPassword.length < policy.minPasswordLength) {
      throw new BadRequestException(`Password must be at least ${policy.minPasswordLength} characters`);
    }
    if (await this.passwords.verify(newPassword, account.passwordHash)) {
      throw new BadRequestException('New password must be different from the current password');
    }

    const newPasswordHash = await this.passwords.hash(newPassword);
    await this.dataSource.transaction(async (manager) => {
      const changed = await manager.getRepository(EmployeeAccountOrmEntity).createQueryBuilder().update()
        .set({ passwordHash: newPasswordHash, failedLoginAttempts: 0, lockedUntil: null })
        .where('company_id = :companyId AND employee_id = :employeeId AND account_status = :status AND password_hash = :oldHash', {
          companyId, employeeId, status: 'ACTIVE', oldHash: account.passwordHash,
        }).execute();
      if (!changed.affected) throw new UnauthorizedException('Current password is incorrect');
      await manager.getRepository(AccessSessionOrmEntity).createQueryBuilder().update().set({ revokedAt: new Date() })
        .where('company_id = :companyId AND employee_id = :employeeId AND revoked_at IS NULL', { companyId, employeeId }).execute();
    });
    try { await this.email.sendPasswordChanged(account.personalEmail ?? account.email); }
    catch { /* Password update is complete; notification failures are retryable operationally. */ }
    return { message: 'Password changed. Please sign in again.' };
  }
}
