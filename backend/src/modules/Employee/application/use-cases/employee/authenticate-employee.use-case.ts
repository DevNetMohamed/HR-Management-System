import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeAccountOrmEntity } from '../../../../User/infrastructure/persistence/user-account.orm-entity';
import { PasswordHasher } from '../../services/password-hasher';
import { SessionTokenService } from '../../services/session-token.service';
import { AccessControlService } from '../../../../AccessControl/application/access-control.service';
import { EmployeeMfaService } from '../../services/employee-mfa.service';
import { randomUUID } from 'crypto';
import { EmployeeOrmEntity } from '../../../infrastructure/persistence/employee/employee.orm-entity';
import { EmployeeStatus } from '../../../domain/Employees/enums/Employee-enums';

@Injectable()
export class AuthenticateEmployeeUseCase {
  constructor(@InjectRepository(EmployeeAccountOrmEntity) private readonly accounts: Repository<EmployeeAccountOrmEntity>, @InjectRepository(EmployeeOrmEntity) private readonly employees: Repository<EmployeeOrmEntity>, private readonly passwords: PasswordHasher, private readonly tokens: SessionTokenService, private readonly access: AccessControlService, private readonly mfa: EmployeeMfaService) {}
  async execute(companyId: string, email: string, password: string, ip: string, mfaCode?: string) {
    const policy: any = await this.access.getPolicy(companyId);
    if (!this.access.isIpAllowed(policy.allowedNetworks, ip)) {
      await this.access.recordAuthenticationDecision(companyId, null, false, 'NETWORK_DENIED', ip, email);
      throw new UnauthorizedException('Invalid email or password');
    }
    const account = await this.accounts.findOne({ where: { companyId, email: email.trim().toLowerCase() } });
    if (!account) {
      await this.access.recordAuthenticationDecision(companyId, null, false, 'INVALID_CREDENTIALS', ip, email);
      throw new UnauthorizedException('Invalid email or password');
    }
    if (account.accountStatus !== 'ACTIVE' || !account.activatedAt) {
      await this.access.recordAuthenticationDecision(companyId, account.employeeId, false, 'ACCOUNT_NOT_ACTIVE', ip, email);
      throw new UnauthorizedException('Invalid email or password');
    }
    const employee = await this.employees.findOne({ where: { companyId, id: account.employeeId } });
    if (!employee || (employee.status === EmployeeStatus.TERMINATED &&
      (policy.terminationRevocation !== 'scheduled' ||
        new Date(`${employee.terminationDate ?? '1970-01-01'}T23:59:59.999Z`) <= new Date()))) {
      await this.access.recordAuthenticationDecision(companyId, account.employeeId, false, 'EMPLOYEE_INELIGIBLE', ip, email);
      throw new UnauthorizedException('Invalid email or password');
    }
    if (account.lockedUntil && account.lockedUntil > new Date()) {
      await this.access.recordAuthenticationDecision(companyId, account.employeeId, false, 'ACCOUNT_LOCKED', ip, email);
      throw new UnauthorizedException('Invalid email or password');
    }
    const validPassword = !!account.passwordHash && await this.passwords.verify(password, account.passwordHash);
    const mfaRequired = await this.access.requiresMfa(companyId, account.employeeId);
    const validMfa = !account.mfaEnabled || this.mfa.verify(account.mfaSecret, mfaCode);
    if (!validPassword || (account.mfaEnabled && !validMfa)) {
      account.failedLoginAttempts += 1;
      if (account.failedLoginAttempts >= policy.maxFailedAttempts) {
        account.lockedUntil = new Date(Date.now() + policy.lockoutMinutes * 60000);
        account.failedLoginAttempts = 0;
      }
      await this.accounts.save(account);
      await this.access.recordAuthenticationDecision(companyId, account.employeeId, false, validPassword ? 'INVALID_MFA' : 'INVALID_CREDENTIALS', ip, email);
      throw new UnauthorizedException('Invalid email or password');
    }
    if (mfaRequired && !account.mfaEnabled) {
      await this.access.recordAuthenticationDecision(companyId, account.employeeId, true, 'MFA_SETUP_REQUIRED', ip, email);
      const token = this.tokens.issue({ sub: account.employeeId, companyId, employeeId: account.employeeId, mfaSetupRequired: true }, 300);
      return { accessToken: token, tokenType: 'Bearer', expiresIn: 300, mfaSetupRequired: true };
    }
    account.failedLoginAttempts = 0; account.lockedUntil = null;
    await this.accounts.save(account);
    await this.access.recordAuthenticationDecision(companyId, account.employeeId, true, 'AUTHENTICATED', ip, email);
    const expiresIn = policy.sessionMinutes * 60;
    const sessionId = randomUUID();
    await this.access.createSession(companyId, account.employeeId, sessionId, new Date(Date.now() + expiresIn * 1000), policy.policyVersion, ip);
    return { accessToken: this.tokens.issue({ sub: account.employeeId, companyId, employeeId: account.employeeId }, expiresIn, sessionId), tokenType: 'Bearer', expiresIn };
  }
}
