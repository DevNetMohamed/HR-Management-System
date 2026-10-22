import { createHash, createPublicKey, createVerify, randomBytes, randomUUID } from 'crypto';
import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsNull } from 'typeorm';
import { EmployeeAccountOrmEntity } from '../../infrastructure/persistence/user-account.orm-entity';
import { GoogleLoginChallengeOrmEntity } from '../../infrastructure/persistence/google-login-challenge.orm-entity';
import { AccessControlService } from '../../../AccessControl/application/access-control.service';
import { SessionTokenService } from '../../../Employee/application/services/session-token.service';
import { EmployeeMfaService } from '../../../Employee/application/services/employee-mfa.service';
import { EmployeeOrmEntity } from '../../../Employee/infrastructure/persistence/employee/employee.orm-entity';
import { EmployeeStatus } from '../../../Employee/domain/Employees/enums/Employee-enums';

type GoogleClaims = { iss: string; aud: string | string[]; azp?: string; sub: string; email: string; email_verified: boolean; exp: number; iat: number; nbf?: number; nonce: string };

@Injectable()
export class GoogleLoginUseCase {
  private keys: { expiresAt: number; values: Map<string, JsonWebKey> } | null = null;

  constructor(
    @InjectRepository(EmployeeAccountOrmEntity) private readonly accounts: Repository<EmployeeAccountOrmEntity>,
    @InjectRepository(GoogleLoginChallengeOrmEntity) private readonly challenges: Repository<GoogleLoginChallengeOrmEntity>,
    @InjectRepository(EmployeeOrmEntity) private readonly employees: Repository<EmployeeOrmEntity>,
    private readonly access: AccessControlService,
    private readonly tokens: SessionTokenService,
    private readonly mfa: EmployeeMfaService,
  ) {}

  async createChallenge(companyId: string) {
    if (!process.env.GOOGLE_CLIENT_ID) throw new ServiceUnavailableException('Google OIDC is not configured');
    await this.challenges.createQueryBuilder().delete().where('expires_at <= NOW()').execute();
    const nonce = randomBytes(32).toString('base64url');
    await this.challenges.save(this.challenges.create({
      companyId,
      nonceHash: this.hash(nonce),
      expiresAt: new Date(Date.now() + 5 * 60_000),
      consumedAt: null,
    }));
    return { nonce, expiresIn: 300 };
  }

  async execute(companyId: string, idToken: string, nonce: string, ip: string, mfaCode?: string) {
    const challenge = await this.challenges.findOne({ where: { companyId, nonceHash: this.hash(nonce), consumedAt: IsNull() } });
    if (!challenge || challenge.expiresAt <= new Date()) throw new UnauthorizedException('Google sign-in challenge is invalid or expired');
    const claims = await this.verifyIdToken(idToken, nonce);
    const consumed = await this.challenges.createQueryBuilder().update().set({ consumedAt: new Date() })
      .where('id = :id AND consumed_at IS NULL', { id: challenge.id }).execute();
    if (!consumed.affected) throw new UnauthorizedException('Google sign-in challenge has already been used');
    const email = claims.email.trim().toLowerCase();
    const account = await this.accounts.findOne({ where: { companyId, companyEmail: email } });
    if (!account || account.accountStatus !== 'ACTIVE' || account.companyEmailStatus !== 'ACTIVE' || account.email !== email) {
      await this.access.recordAuthenticationDecision(companyId, account?.employeeId ?? null, false, 'GOOGLE_ACCOUNT_NOT_LINKED', ip, email);
      throw new UnauthorizedException('Google identity is not linked to an active HRMS account');
    }
    const employee = await this.employees.findOne({ where: { companyId, id: account.employeeId } });
    const policy: any = await this.access.getPolicy(companyId);
    if (!employee || (employee.status === EmployeeStatus.TERMINATED &&
      (policy.terminationRevocation !== 'scheduled' ||
        new Date(`${employee.terminationDate ?? '1970-01-01'}T23:59:59.999Z`) <= new Date()))) {
      await this.access.recordAuthenticationDecision(companyId, account.employeeId, false, 'EMPLOYEE_INELIGIBLE', ip, email);
      throw new UnauthorizedException('Google identity is not eligible for HRMS access');
    }
    if (account.lockedUntil && account.lockedUntil > new Date()) throw new UnauthorizedException('Google sign-in is temporarily unavailable');
    if (account.googleSubject && account.googleSubject !== claims.sub) throw new UnauthorizedException('A different Google identity is already linked');
    const linkedAccount = await this.accounts.findOne({ where: { companyId, googleSubject: claims.sub } });
    if (linkedAccount && linkedAccount.employeeId !== account.employeeId) throw new UnauthorizedException('Google identity is already linked to another HRMS account');

    if (!this.access.isIpAllowed(policy.allowedNetworks, ip)) {
      await this.access.recordAuthenticationDecision(companyId, account.employeeId, false, 'NETWORK_DENIED', ip, email);
      throw new UnauthorizedException('Google sign-in is not allowed from this network');
    }
    if (account.mfaEnabled && !this.mfa.verify(account.mfaSecret, mfaCode)) {
      account.failedLoginAttempts += 1;
      if (account.failedLoginAttempts >= policy.maxFailedAttempts) {
        account.lockedUntil = new Date(Date.now() + policy.lockoutMinutes * 60_000);
        account.failedLoginAttempts = 0;
      }
      await this.accounts.save(account);
      await this.access.recordAuthenticationDecision(companyId, account.employeeId, false, 'INVALID_MFA', ip, email);
      throw new UnauthorizedException('MFA verification is required');
    }
    if (await this.access.requiresMfa(companyId, account.employeeId) && !account.mfaEnabled) {
      throw new UnauthorizedException('Complete HRMS MFA enrollment before using Google sign-in');
    }

    if (!account.googleSubject) {
      account.googleSubject = claims.sub;
    }
    account.failedLoginAttempts = 0;
    account.lockedUntil = null;
    await this.accounts.save(account);
    const expiresIn = policy.sessionMinutes * 60;
    const sessionId = randomUUID();
    await this.access.createSession(companyId, account.employeeId, sessionId, new Date(Date.now() + expiresIn * 1000), policy.policyVersion, ip);
    await this.access.recordAuthenticationDecision(companyId, account.employeeId, true, 'GOOGLE_AUTHENTICATED', ip, email);
    return { accessToken: this.tokens.issue({ sub: account.employeeId, companyId, employeeId: account.employeeId }, expiresIn, sessionId), tokenType: 'Bearer', expiresIn };
  }

  private async verifyIdToken(token: string, nonce: string): Promise<GoogleClaims> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new ServiceUnavailableException('Google OIDC is not configured');
    const parts = token.split('.');
    if (parts.length !== 3) throw new UnauthorizedException('Invalid Google ID token');
    try {
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString()) as { alg: string; kid: string };
      const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as GoogleClaims;
      if (header.alg !== 'RS256' || !header.kid) throw new Error('Unsupported signing key');
      const jwk = await this.getKey(header.kid);
      if (jwk.kty !== 'RSA') throw new Error('Unsupported signing key type');
      const verifier = createVerify('RSA-SHA256');
      verifier.update(`${parts[0]}.${parts[1]}`);
      verifier.end();
      if (!verifier.verify(createPublicKey({ key: jwk as any, format: 'jwk' }), Buffer.from(parts[2], 'base64url'))) throw new Error('Bad signature');
      const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
      const now = Date.now() / 1000;
      if (!['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss) || !audiences.includes(clientId) || (audiences.length > 1 && claims.azp !== clientId) || !Number.isFinite(claims.exp) || !Number.isFinite(claims.iat) || claims.exp <= now || claims.iat > now + 60 || (claims.nbf !== undefined && claims.nbf > now) || !claims.sub || claims.nonce !== nonce || claims.email_verified !== true || !claims.email) throw new Error('Invalid claims');
      return claims;
    } catch {
      throw new UnauthorizedException('Google ID token is invalid or expired');
    }
  }

  private async getKey(kid: string): Promise<JsonWebKey> {
    if (!this.keys || this.keys.expiresAt <= Date.now()) {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/certs', { signal: AbortSignal.timeout(5_000) });
      if (!response.ok) throw new ServiceUnavailableException('Google signing keys are unavailable');
      const body = await response.json() as { keys: Array<JsonWebKey & { kid: string }> };
      const cache = response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1];
      this.keys = { values: new Map(body.keys.map((key) => [key.kid, key])), expiresAt: Date.now() + Math.min(Number(cache ?? 3600), 3600) * 1000 };
    }
    const key = this.keys.values.get(kid);
    if (!key) { this.keys = null; throw new UnauthorizedException('Google signing key is unknown'); }
    return key;
  }

  private hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
}
