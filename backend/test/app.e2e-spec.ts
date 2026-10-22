import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createHmac, randomUUID } from 'crypto';
import { AppModule } from './../src/app.module';
import { Employee } from '../src/modules/Employee/domain/Employees/entities/employee.entity';
import { EMPLOYEE_REPOSITORY, EmployeeRepository } from '../src/modules/Employee/domain/Employees/repositories/employee.repository';
import { EmployeeInvitationService } from '../src/modules/Employee/application/services/employee-invitation.service';
import { UserEmailService } from '../src/modules/User/application/services/user-email.service';
import { DOCUMENT_STORAGE } from '../src/modules/Employee/application/ports/document-storage.port';

jest.setTimeout(90_000);

function totp(secret: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  const decoded: number[] = [];
  for (const character of secret) {
    value = (value << 5) | alphabet.indexOf(character);
    bits += 5;
    if (bits >= 8) { decoded.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const digest = createHmac('sha1', Buffer.from(decoded)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24) | ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) | (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, '0');
}

describe('User authentication (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let employees: EmployeeRepository;
  let invitations: EmployeeInvitationService;
  let employeeId: string | undefined;
  let companyId: string;
  let companyEmail: string;
  let personalEmail: string;
  const mail = {
    sendCompanyMailboxActivation: jest.fn().mockResolvedValue(undefined),
    sendHrmsActivation: jest.fn().mockResolvedValue(undefined),
    sendHrmsActivated: jest.fn().mockResolvedValue(undefined),
    sendPasswordRecovery: jest.fn().mockResolvedValue(undefined),
    sendPasswordChanged: jest.fn().mockResolvedValue(undefined),
  };
  const testEnv = ['JWT_SECRET', 'MFA_ENCRYPTION_KEY', 'FIELD_ENCRYPTION_KEY', 'MAIL_PROVIDER_CALLBACK_SECRET', 'MAIL_PROVIDER_ACTIVATION_HOSTS', 'APP_URL', 'DB_LOGGING'] as const;
  const previousEnv = Object.fromEntries(testEnv.map((key) => [key, process.env[key]]));

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-test-secret-at-least-thirty-two-characters';
    process.env.MFA_ENCRYPTION_KEY = 'e2e-mfa-encryption-secret-at-least-thirty-two-characters';
    process.env.FIELD_ENCRYPTION_KEY = 'a'.repeat(64);
    process.env.MAIL_PROVIDER_CALLBACK_SECRET = 'e2e-mail-provider-secret-at-least-32-characters';
    process.env.MAIL_PROVIDER_ACTIVATION_HOSTS = 'mail.example.test';
    process.env.APP_URL = 'https://hrms.example.test';
    process.env.DB_LOGGING = 'false';
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(UserEmailService).useValue(mail)
      .overrideProvider(DOCUMENT_STORAGE).useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    dataSource = moduleFixture.get(DataSource);
    employees = moduleFixture.get(EMPLOYEE_REPOSITORY);
    invitations = moduleFixture.get(EmployeeInvitationService);
  });

  it('rejects access to the current-user endpoint without a bearer token', () => {
    return request(app.getHttpServer())
      .get('/auth/me')
      .expect(401);
  });

  it.each([
    ['POST', '/auth/mfa/enrollment', undefined],
    ['POST', '/auth/mfa/confirm', { code: '123456' }],
    ['POST', '/auth/logout', undefined],
    ['POST', '/auth/password/change', { currentPassword: 'current-password', newPassword: 'a-long-test-password' }],
  ])('requires a session for %s %s', async (method, path, body) => {
    const call = request(app.getHttpServer())[method.toLowerCase()](path);
    if (body) call.send(body);
    await call.expect(401);
  });

  it('rejects malformed login requests', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ companyId: 'invalid', email: 'not-an-email', password: 'short' })
      .expect(400);
  });

  it('rejects requests to issue provider activation without the provider secret', () => {
    return request(app.getHttpServer())
      .post('/auth/company-email/send-provider-activation')
      .send({ companyId: '14c86ad0-810e-49c3-8f15-7999895536d8', employeeId: '14c86ad0-810e-49c3-8f15-7999895536d8', providerActivationUrl: 'https://mail.example.com/activate' })
      .expect(401);
  });

  it('rejects provider confirmation without the provider secret', () => {
    return request(app.getHttpServer())
      .post('/auth/company-email/provider-confirmation')
      .send({ companyId: '14c86ad0-810e-49c3-8f15-7999895536d8', employeeId: '14c86ad0-810e-49c3-8f15-7999895536d8', companyEmail: 'person@company.example' })
      .expect(401);
  });

  it('does not reveal whether a password-recovery email belongs to an account', () => {
    return request(app.getHttpServer())
      .post('/auth/password-recovery')
      .send({ companyId: '14c86ad0-810e-49c3-8f15-7999895536d8', email: 'missing@example.invalid' })
      .expect(201)
      .expect(({ body }) => expect(body.message).toMatch(/If an active account matches/));
  });

  it('rejects malformed recovery completion tokens', () => {
    return request(app.getHttpServer())
      .post('/auth/password-recovery/complete')
      .send({ token: 'invalid', password: 'a-long-test-password' })
      .expect(400);
  });

  it('rejects malformed Google login requests', () => {
    return request(app.getHttpServer())
      .post('/auth/google')
      .send({ companyId: 'invalid', idToken: '', nonce: 'short' })
      .expect(400);
  });

  it('completes employee provisioning, both activations, login, password change, recovery and logout over HTTP', async () => {
    const companies = await dataSource.query('SELECT id FROM companies ORDER BY created_at LIMIT 1');
    expect(companies.length).toBeGreaterThan(0);
    companyId = companies[0].id;
    const suffix = randomUUID();
    personalEmail = `hrms-e2e-${suffix}@example.test`;
    companyEmail = `hrms-e2e-${suffix}@company.example`;
    const employee = Employee.hire({
      companyId,
      employeeNumber: `E2E-${suffix}`,
      firstName: 'E2E', lastName: 'Employee', email: personalEmail,
      companyEmail, hireDate: new Date().toISOString().slice(0, 10),
    });
    employeeId = employee.id;
    const account = invitations.prepare(companyId, employee.id, personalEmail, companyEmail);
    await employees.saveWithAccount(employee, account);

    const providerSecret = process.env.MAIL_PROVIDER_CALLBACK_SECRET!;
    await request(app.getHttpServer()).post('/auth/company-email/send-provider-activation')
      .set('x-mail-provider-secret', providerSecret)
      .send({ companyId, employeeId, providerActivationUrl: 'https://mail.example.test/activate?token=provider-token' })
      .expect(201);
    expect(mail.sendCompanyMailboxActivation).toHaveBeenCalledWith(personalEmail, expect.stringContaining('mail.example.test'));

    await request(app.getHttpServer()).post('/auth/company-email/provider-confirmation')
      .set('x-mail-provider-secret', providerSecret)
      .send({ companyId, employeeId, companyEmail })
      .expect(201)
      .expect(({ body }) => expect(body.companyEmailStatus).toBe('ACTIVE'));
    expect(mail.sendHrmsActivation).toHaveBeenCalled();
    const activationUrl = mail.sendHrmsActivation.mock.calls.at(-1)![1] as string;
    const activationToken = new URL(activationUrl).hash.slice('#token='.length);

    const firstPassword = 'initial-HRMS-password';
    await request(app.getHttpServer()).post('/auth/accept-invitation')
      .send({ token: activationToken, password: firstPassword }).expect(201);
    const firstLogin = await request(app.getHttpServer()).post('/auth/login')
      .send({ companyId, email: companyEmail, password: firstPassword }).expect(201);
    const firstToken = firstLogin.body.accessToken as string;
    await request(app.getHttpServer()).get('/auth/me').set('Authorization', `Bearer ${firstToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.employeeId).toBe(employeeId);
        expect(body.companyEmail).toBe(companyEmail);
        expect(body.accountStatus).toBe('ACTIVE');
      });

    const enrollment = await request(app.getHttpServer()).post('/auth/mfa/enrollment')
      .set('Authorization', `Bearer ${firstToken}`).expect(201);
    expect(enrollment.body.provisioningUri).toContain('otpauth://totp/HRMS:');
    const mfaCode = totp(enrollment.body.secret as string);
    await request(app.getHttpServer()).post('/auth/mfa/confirm')
      .set('Authorization', `Bearer ${firstToken}`).send({ code: mfaCode })
      .expect(201).expect(({ body }) => expect(body.mfaEnabled).toBe(true));

    const secondPassword = 'changed-HRMS-password';
    await request(app.getHttpServer()).post('/auth/password/change')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({ currentPassword: firstPassword, newPassword: secondPassword }).expect(201);
    await request(app.getHttpServer()).get('/auth/me').set('Authorization', `Bearer ${firstToken}`).expect(401);
    await request(app.getHttpServer()).post('/auth/login')
      .send({ companyId, email: companyEmail, password: secondPassword }).expect(401);
    await request(app.getHttpServer()).post('/auth/login')
      .send({ companyId, email: companyEmail, password: secondPassword, mfaCode: totp(enrollment.body.secret as string) }).expect(201);

    await request(app.getHttpServer()).post('/auth/password-recovery')
      .send({ companyId, email: companyEmail }).expect(201);
    expect(mail.sendPasswordRecovery).toHaveBeenCalled();
    const recoveryUrl = mail.sendPasswordRecovery.mock.calls.at(-1)![1] as string;
    const recoveryToken = new URL(recoveryUrl).hash.slice('#token='.length);
    const finalPassword = 'recovered-HRMS-password';
    await request(app.getHttpServer()).post('/auth/password-recovery/complete')
      .send({ token: recoveryToken, password: finalPassword }).expect(201);
    const finalLogin = await request(app.getHttpServer()).post('/auth/login')
      .send({ companyId, email: companyEmail, password: finalPassword, mfaCode: totp(enrollment.body.secret as string) }).expect(201);
    const finalToken = finalLogin.body.accessToken as string;
    await request(app.getHttpServer()).post('/auth/logout')
      .set('Authorization', `Bearer ${finalToken}`).expect(201);
    await request(app.getHttpServer()).get('/auth/me').set('Authorization', `Bearer ${finalToken}`).expect(401);
  });

  afterAll(async () => {
    try {
      if (employeeId && dataSource?.isInitialized) {
        await dataSource.query('DELETE FROM access_sessions WHERE company_id = $1 AND employee_id = $2', [companyId, employeeId]);
        await dataSource.query('DELETE FROM access_login_attempts WHERE company_id = $1 AND employee_id = $2', [companyId, employeeId]);
        await dataSource.query('DELETE FROM access_decision_evidence WHERE company_id = $1 AND actor_id = $2', [companyId, employeeId]);
        await dataSource.query('DELETE FROM employee_password_recoveries WHERE company_id = $1 AND employee_id = $2', [companyId, employeeId]);
        await dataSource.query('DELETE FROM employee_accounts WHERE company_id = $1 AND employee_id = $2', [companyId, employeeId]);
        await dataSource.query('DELETE FROM job_history WHERE company_id = $1 AND employee_id = $2', [companyId, employeeId]);
        await dataSource.query('DELETE FROM employees WHERE company_id = $1 AND id = $2', [companyId, employeeId]);
      }
    } finally {
      await app?.close();
      for (const key of testEnv) {
        if (previousEnv[key] === undefined) delete process.env[key];
        else process.env[key] = previousEnv[key];
      }
    }
  });
});
