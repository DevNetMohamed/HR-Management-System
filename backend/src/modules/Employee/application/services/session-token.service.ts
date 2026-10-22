import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { randomUUID } from 'crypto';

export interface SessionClaims { sub: string; companyId: string; employeeId: string; jti: string; iat: number; exp: number; mfaSetupRequired?: boolean }

@Injectable()
export class SessionTokenService {
  issue(claims: Omit<SessionClaims, 'iat' | 'exp' | 'jti'>, lifetimeSeconds = 3600, sessionId = randomUUID()) {
    const now = Math.floor(Date.now() / 1000);
    const header = this.encode({ alg: 'HS256', typ: 'JWT' });
    const payload = this.encode({ ...claims, jti: sessionId, iat: now, exp: now + lifetimeSeconds });
    const content = `${header}.${payload}`;
    return `${content}.${this.sign(content)}`;
  }
  verify(token: string): SessionClaims {
    const parts = token.split('.');
    if (parts.length !== 3) throw new UnauthorizedException('Invalid or expired access token');
    const [header, payload, signature] = parts;
    const expected = Buffer.from(this.sign(`${header}.${payload}`));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new UnauthorizedException('Invalid or expired access token');
    try {
      const head = JSON.parse(Buffer.from(header, 'base64url').toString());
      const claims = JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionClaims;
      if (head.alg !== 'HS256' || !claims.sub || !claims.companyId || !claims.employeeId || !claims.jti || claims.exp <= Date.now() / 1000) throw new Error();
      return claims;
    } catch { throw new UnauthorizedException('Invalid or expired access token'); }
  }
  private encode(value: object) { return Buffer.from(JSON.stringify(value)).toString('base64url'); }
  private sign(value: string) {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
    return createHmac('sha256', secret).update(value).digest('base64url');
  }
}
