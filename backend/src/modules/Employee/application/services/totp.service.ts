import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

@Injectable()
export class TotpService {
  newSecret() { return this.base32Encode(randomBytes(20)); }
  provisioningUri(secret: string, email: string) {
    return `otpauth://totp/HRMS:${encodeURIComponent(email)}?secret=${secret}&issuer=HRMS&algorithm=SHA1&digits=6&period=30`;
  }
  verify(secret: string, code: string, now = Date.now()) {
    if (!/^\d{6}$/.test(code)) return false;
    const provided = Buffer.from(code);
    for (const offset of [-1, 0, 1]) {
      const expected = Buffer.from(this.code(secret, Math.floor(now / 30000) + offset));
      if (timingSafeEqual(expected, provided)) return true;
    }
    return false;
  }
  private code(secret: string, counter: number) {
    const data = Buffer.alloc(8);
    data.writeBigUInt64BE(BigInt(counter));
    const digest = createHmac('sha1', this.base32Decode(secret)).update(data).digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const binary = ((digest[offset] & 0x7f) << 24) | ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) | (digest[offset + 3] & 0xff);
    return String(binary % 1000000).padStart(6, '0');
  }
  private base32Encode(bytes: Buffer) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0; let value = 0; let result = '';
    for (const byte of bytes) {
      value = (value << 8) | byte; bits += 8;
      while (bits >= 5) { result += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; }
    }
    if (bits) result += alphabet[(value << (5 - bits)) & 31];
    return result;
  }
  private base32Decode(value: string) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0; let buffer = 0; const result: number[] = [];
    for (const char of value.replace(/=+$/, '').toUpperCase()) {
      const digit = alphabet.indexOf(char);
      if (digit < 0) throw new Error('Invalid MFA secret');
      buffer = (buffer << 5) | digit; bits += 5;
      if (bits >= 8) { result.push((buffer >>> (bits - 8)) & 255); bits -= 8; }
    }
    return Buffer.from(result);
  }
}
