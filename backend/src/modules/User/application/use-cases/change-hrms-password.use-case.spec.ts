jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => undefined }));
jest.mock('../../../AccessControl/application/access-control.service', () => ({ AccessControlService: class {} }));

import { UnauthorizedException } from '@nestjs/common';
import { PasswordHasher } from '../../../Employee/application/services/password-hasher';
import { EmployeeAccountOrmEntity } from '../../infrastructure/persistence/user-account.orm-entity';
import { UserEmailService } from '../services/user-email.service';
import { AccessSessionOrmEntity } from '../../../AccessControl/infrastructure/persistence/access-control.orm-entities';
import { ChangeHrmsPasswordUseCase } from './change-hrms-password.use-case';

describe('ChangeHrmsPasswordUseCase', () => {
  const companyId = 'company-1';
  const employeeId = 'employee-1';
  let hasher: PasswordHasher;
  let account: EmployeeAccountOrmEntity;
  let accounts: { findOne: jest.Mock };
  let access: { getPolicy: jest.Mock; revokeEmployeeSessions: jest.Mock };
  let email: { sendPasswordChanged: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let updateBuilder: { update: jest.Mock; set: jest.Mock; where: jest.Mock; execute: jest.Mock };
  let useCase: ChangeHrmsPasswordUseCase;

  beforeEach(async () => {
    hasher = new PasswordHasher();
    account = {
      companyId, employeeId, accountStatus: 'ACTIVE', passwordHash: await hasher.hash('current-HRMS-password'),
      personalEmail: 'person@example.com', email: 'person@company.example', failedLoginAttempts: 4,
      lockedUntil: new Date(),
    } as EmployeeAccountOrmEntity;
    accounts = { findOne: jest.fn().mockResolvedValue(account) };
    access = {
      getPolicy: jest.fn().mockResolvedValue({ minPasswordLength: 12 }),
      revokeEmployeeSessions: jest.fn().mockResolvedValue(undefined),
    };
    email = { sendPasswordChanged: jest.fn().mockResolvedValue(undefined) };
    updateBuilder = {
      update: jest.fn().mockReturnThis(), set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    dataSource = { transaction: jest.fn(async (work) => work({
      getRepository: (entity) => ({ createQueryBuilder: () => updateBuilder }),
    })) };
    useCase = new ChangeHrmsPasswordUseCase(accounts as any, dataSource as any, hasher, access as any, email as any);
  });

  it('rejects an incorrect current password without changing the account', async () => {
    await expect(useCase.execute(companyId, employeeId, 'wrong-password', 'new-HRMS-password'))
      .rejects.toBeInstanceOf(UnauthorizedException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(access.revokeEmployeeSessions).not.toHaveBeenCalled();
  });

  it('changes the HRMS password, clears lockout and revokes sessions', async () => {
    const result = await useCase.execute(companyId, employeeId, 'current-HRMS-password', 'new-HRMS-password');
    expect(result).toEqual({ message: 'Password changed. Please sign in again.' });
    const changedValues = updateBuilder.set.mock.calls[0][0];
    expect(await hasher.verify('new-HRMS-password', changedValues.passwordHash)).toBe(true);
    expect(changedValues.failedLoginAttempts).toBe(0);
    expect(changedValues.lockedUntil).toBeNull();
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(email.sendPasswordChanged).toHaveBeenCalledWith('person@example.com');
  });
});
