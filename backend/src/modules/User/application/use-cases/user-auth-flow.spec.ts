jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => undefined }));
jest.mock('../../../AccessControl/application/access-control.service', () => ({ AccessControlService: class {} }));

import { BadRequestException } from '@nestjs/common';
import { EmployeeStatus } from '../../../Employee/domain/Employees/enums/Employee-enums';
import { EmployeeInvitationService } from '../../../Employee/application/services/employee-invitation.service';
import { AcceptEmployeeInvitationUseCase } from '../../../Employee/application/use-cases/employee/accept-employee-invitation.use-case';
import { AuthenticateEmployeeUseCase } from '../../../Employee/application/use-cases/employee/authenticate-employee.use-case';
import { EmployeePasswordRecoveryService } from '../../../Employee/application/services/employee-password-recovery.service';
import { EmployeePasswordRecoveryOrmEntity } from '../../infrastructure/persistence/user-password-recovery.orm-entity';
import { EmployeeAccountOrmEntity } from '../../infrastructure/persistence/user-account.orm-entity';
import { AccessSessionOrmEntity } from '../../../AccessControl/infrastructure/persistence/access-control.orm-entities';
import { GoogleLoginUseCase } from './google-login.use-case';

describe('User account lifecycle', () => {
  it('prepares one pending account using normalized personal and company emails', () => {
    const accounts = { create: jest.fn((value) => value) };
    const service = new EmployeeInvitationService(accounts as any, {} as any);

    const account = service.prepare('company-id', 'employee-id', ' Person@Example.com ', ' User@Company.Example ');

    expect(accounts.create).toHaveBeenCalledWith(expect.objectContaining({
      companyId: 'company-id', employeeId: 'employee-id',
      email: 'user@company.example', personalEmail: 'person@example.com',
      companyEmail: 'user@company.example', accountStatus: 'PENDING_ACTIVATION',
      companyEmailStatus: 'PENDING', passwordHash: null,
    }));
    expect(account.id).toEqual(expect.any(String));
  });

  it('sends a distinct HRMS password-setup link after company email confirmation', async () => {
    const update = { update: jest.fn().mockReturnThis(), set: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ affected: 1 }) };
    const accounts = { createQueryBuilder: jest.fn(() => update) };
    const email = { sendHrmsActivation: jest.fn().mockResolvedValue(undefined) };
    const service = new EmployeeInvitationService(accounts as any, email as any);
    const priorUrl = process.env.APP_URL;
    process.env.APP_URL = 'https://hrms.example.com';

    try {
      await service.issueHrmsActivation({
        id: 'account-id', personalEmail: 'person@example.com', companyEmail: 'person@company.example',
        accountStatus: 'PENDING_ACTIVATION', companyEmailStatus: 'ACTIVE',
      } as any);
    } finally {
      if (priorUrl === undefined) delete process.env.APP_URL;
      else process.env.APP_URL = priorUrl;
    }

    const [, url] = email.sendHrmsActivation.mock.calls[0];
    expect(url).toMatch(/^https:\/\/hrms\.example\.com\/auth\/accept-invitation#token=[a-f0-9]{64}$/);
    const token = new URL(url).hash.slice('#token='.length);
    expect(update.set).toHaveBeenCalledWith(expect.objectContaining({
      invitationTokenHash: service.hashToken(token),
      invitationExpiresAt: expect.any(Date), activationSentAt: expect.any(Date),
    }));
  });

  it('clears a newly-issued activation token if email delivery fails so retry can proceed', async () => {
    const update = { update: jest.fn().mockReturnThis(), set: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ affected: 1 }) };
    const service = new EmployeeInvitationService({ createQueryBuilder: () => update } as any, { sendHrmsActivation: jest.fn().mockRejectedValue(new Error('delivery failed')) } as any);

    await expect(service.issueHrmsActivation({
      id: 'account-id', personalEmail: 'person@example.com', companyEmail: 'person@company.example',
      accountStatus: 'PENDING_ACTIVATION', companyEmailStatus: 'ACTIVE',
    } as any)).rejects.toThrow('delivery failed');
    expect(update.set).toHaveBeenNthCalledWith(2, { invitationTokenHash: null, invitationExpiresAt: null, activationSentAt: null });
  });

  it('accepts a valid first-activation token, sets the password and activates the account', async () => {
    const account = {
      id: 'account-id', companyId: 'company-id', employeeId: 'employee-id',
      invitationTokenHash: 'token-hash', invitationExpiresAt: new Date(Date.now() + 60_000),
      passwordHash: null, companyEmailStatus: 'ACTIVE', personalEmail: 'person@example.com',
      companyEmail: 'person@company.example', accountStatus: 'PENDING_ACTIVATION',
    };
    const update = { update: jest.fn().mockReturnThis(), set: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ affected: 1 }) };
    const accounts = { findOne: jest.fn().mockResolvedValue(account), createQueryBuilder: jest.fn(() => update) };
    const invitations = { hashToken: jest.fn(() => 'token-hash') };
    const passwords = { hash: jest.fn().mockResolvedValue('secure-hash') };
    const access = { getPolicy: jest.fn().mockResolvedValue({ minPasswordLength: 12 }) };
    const email = { sendHrmsActivated: jest.fn().mockResolvedValue(undefined) };
    const useCase = new AcceptEmployeeInvitationUseCase(accounts as any, invitations as any, passwords as any, access as any, email as any);

    await expect(useCase.execute('activation-token', 'a-long-hrms-password')).resolves.toEqual({ message: 'Password set successfully. You can now sign in.' });
    expect(update.set).toHaveBeenCalledWith(expect.objectContaining({ passwordHash: 'secure-hash', accountStatus: 'ACTIVE', activatedAt: expect.any(Date) }));
    expect(email.sendHrmsActivated).toHaveBeenCalledWith('person@example.com', 'person@company.example');
  });

  it('rejects an expired or previously consumed activation token', async () => {
    const accounts = { findOne: jest.fn().mockResolvedValue({ invitationExpiresAt: new Date(Date.now() - 1), passwordHash: null, companyEmailStatus: 'ACTIVE' }) };
    const useCase = new AcceptEmployeeInvitationUseCase(accounts as any, { hashToken: () => 'token-hash' } as any, {} as any, {} as any, {} as any);

    await expect(useCase.execute('activation-token', 'a-long-hrms-password')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('logs in an active employee and creates a revocable session', async () => {
    const account = {
      companyId: 'company-id', employeeId: 'employee-id', email: 'person@company.example',
      accountStatus: 'ACTIVE', activatedAt: new Date(), passwordHash: 'hash',
      failedLoginAttempts: 2, lockedUntil: null, mfaEnabled: false,
    };
    const accounts = { findOne: jest.fn().mockResolvedValue(account), save: jest.fn().mockResolvedValue(account) };
    const employees = { findOne: jest.fn().mockResolvedValue({ status: EmployeeStatus.ACTIVE, terminationDate: null }) };
    const passwords = { verify: jest.fn().mockResolvedValue(true) };
    const tokens = { issue: jest.fn().mockReturnValue('signed-session-token') };
    const access = {
      getPolicy: jest.fn().mockResolvedValue({ allowedNetworks: [], sessionMinutes: 60, policyVersion: 1, maxFailedAttempts: 5 }),
      isIpAllowed: jest.fn().mockReturnValue(true), requiresMfa: jest.fn().mockResolvedValue(false),
      recordAuthenticationDecision: jest.fn().mockResolvedValue(undefined),
      createSession: jest.fn().mockResolvedValue(undefined),
    };
    const mfa = { verify: jest.fn() };
    const useCase = new AuthenticateEmployeeUseCase(accounts as any, employees as any, passwords as any, tokens as any, access as any, mfa as any);

    await expect(useCase.execute('company-id', ' PERSON@COMPANY.EXAMPLE ', 'valid-password', '127.0.0.1')).resolves.toEqual({
      accessToken: 'signed-session-token', tokenType: 'Bearer', expiresIn: 3600,
    });
    expect(accounts.findOne).toHaveBeenCalledWith({ where: { companyId: 'company-id', email: 'person@company.example' } });
    expect(access.createSession).toHaveBeenCalledWith('company-id', 'employee-id', expect.any(String), expect.any(Date), 1, '127.0.0.1');
    expect(access.recordAuthenticationDecision).toHaveBeenCalledWith('company-id', 'employee-id', true, 'AUTHENTICATED', '127.0.0.1', ' PERSON@COMPANY.EXAMPLE ');
  });

  it('rejects login for accounts that have not completed HRMS activation', async () => {
    const account = { email: 'pending@example.com', employeeId: 'employee-id', accountStatus: 'PENDING_ACTIVATION', activatedAt: null };
    const access = {
      getPolicy: jest.fn().mockResolvedValue({ allowedNetworks: [] }),
      isIpAllowed: jest.fn().mockReturnValue(true), recordAuthenticationDecision: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new AuthenticateEmployeeUseCase(
      { findOne: jest.fn().mockResolvedValue(account) } as any,
      {} as any, {} as any, {} as any, access as any, {} as any,
    );

    await expect(useCase.execute('company-id', account.email, 'password', '127.0.0.1')).rejects.toMatchObject({ status: 401 });
    expect(access.recordAuthenticationDecision).toHaveBeenCalledWith('company-id', 'employee-id', false, 'ACCOUNT_NOT_ACTIVE', '127.0.0.1', account.email);
  });

  it('consumes a recovery token, changes the password and revokes existing sessions atomically', async () => {
    const recovery = { id: 'recovery-id', companyId: 'company-id', employeeId: 'employee-id', expiresAt: new Date(Date.now() + 60_000) };
    const account = { accountStatus: 'ACTIVE', personalEmail: 'person@example.com', email: 'person@company.example' };
    const recoveryUpdate = { update: jest.fn().mockReturnThis(), set: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ affected: 1 }) };
    const accountUpdate = { update: jest.fn().mockReturnThis(), set: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ affected: 1 }) };
    const sessionUpdate = { update: jest.fn().mockReturnThis(), set: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ affected: 2 }) };
    const builders = new Map([[EmployeePasswordRecoveryOrmEntity, recoveryUpdate], [EmployeeAccountOrmEntity, accountUpdate], [AccessSessionOrmEntity, sessionUpdate]]);
    const recoveries = {
      findOne: jest.fn().mockResolvedValue(recovery),
      manager: { transaction: jest.fn(async (work) => work({ getRepository: (entity) => ({ createQueryBuilder: () => builders.get(entity) }) })) },
    };
    const accounts = { findOne: jest.fn().mockResolvedValue(account) };
    const passwords = { hash: jest.fn().mockResolvedValue('new-password-hash') };
    const access = { getPolicy: jest.fn().mockResolvedValue({ minPasswordLength: 12 }) };
    const email = { sendPasswordChanged: jest.fn().mockResolvedValue(undefined) };
    const service = new EmployeePasswordRecoveryService(accounts as any, recoveries as any, passwords as any, access as any, email as any);

    await expect(service.complete('one-time-recovery-token', 'a-long-new-password')).resolves.toEqual({ message: 'Password changed. Please sign in again.' });
    expect(recoveries.manager.transaction).toHaveBeenCalledTimes(1);
    expect(recoveryUpdate.where).toHaveBeenCalledWith(expect.stringContaining('used_at IS NULL'), expect.objectContaining({ id: 'recovery-id' }));
    expect(accountUpdate.set).toHaveBeenCalledWith(expect.objectContaining({ passwordHash: 'new-password-hash', failedLoginAttempts: 0, lockedUntil: null }));
    expect(sessionUpdate.set).toHaveBeenCalledWith(expect.objectContaining({ revokedAt: expect.any(Date) }));
    expect(email.sendPasswordChanged).toHaveBeenCalledWith('person@example.com');
  });

  it('links a verified Google identity and creates a session for an active account', async () => {
    const challenge = { id: 'challenge-id', expiresAt: new Date(Date.now() + 60_000) };
    const challengeUpdate = { update: jest.fn().mockReturnThis(), set: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ affected: 1 }) };
    const challenges = { findOne: jest.fn().mockResolvedValue(challenge), createQueryBuilder: jest.fn(() => challengeUpdate) };
    const account = {
      id: 'account-id', companyId: 'company-id', employeeId: 'employee-id', companyEmail: 'person@company.example',
      email: 'person@company.example', accountStatus: 'ACTIVE', companyEmailStatus: 'ACTIVE', googleSubject: null,
      failedLoginAttempts: 2, lockedUntil: null, mfaEnabled: false,
    };
    const accounts = { findOne: jest.fn().mockResolvedValueOnce(account).mockResolvedValueOnce(null), save: jest.fn().mockResolvedValue(account) };
    const employees = { findOne: jest.fn().mockResolvedValue({ status: EmployeeStatus.ACTIVE, terminationDate: null }) };
    const access = {
      getPolicy: jest.fn().mockResolvedValue({ allowedNetworks: [], sessionMinutes: 30, policyVersion: 3 }),
      isIpAllowed: jest.fn().mockReturnValue(true), requiresMfa: jest.fn().mockResolvedValue(false),
      recordAuthenticationDecision: jest.fn().mockResolvedValue(undefined), createSession: jest.fn().mockResolvedValue(undefined),
    };
    const tokens = { issue: jest.fn().mockReturnValue('google-session-token') };
    const useCase = new GoogleLoginUseCase(accounts as any, challenges as any, employees as any, access as any, tokens as any, {} as any);
    jest.spyOn(useCase as any, 'verifyIdToken').mockResolvedValue({ sub: 'google-subject', email: account.companyEmail });

    await expect(useCase.execute('company-id', 'signed-google-id-token', 'challenge-nonce', '127.0.0.1')).resolves.toEqual({
      accessToken: 'google-session-token', tokenType: 'Bearer', expiresIn: 1800,
    });
    expect(challengeUpdate.set).toHaveBeenCalledWith({ consumedAt: expect.any(Date) });
    expect(account.googleSubject).toBe('google-subject');
    expect(access.createSession).toHaveBeenCalledWith('company-id', 'employee-id', expect.any(String), expect.any(Date), 3, '127.0.0.1');
  });
});
