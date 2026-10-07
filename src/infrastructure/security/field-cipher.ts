import dotenv from 'dotenv'
import { Injectable } from "@nestjs/common";
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "crypto";



@Injectable()
export class FieldCipher {
    private readonly encKey: Buffer;
    private readonly hashkey: Buffer;
    

    constructor() {
    const hex = process.env.FIELD_ENCRYPTION_KEY ?? '';
    if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
      throw new Error('FIELD_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }
    const master = Buffer.from(hex, 'hex');
    this.encKey = Buffer.from(hkdfSync('sha256', master, Buffer.alloc(0), 'field-encryption', 32));
    this.hashkey = Buffer.from(hkdfSync('sha256', master, Buffer.alloc(0), 'field-hash', 32));
  }

    encrypt(plain: string):string{
        const iv = randomBytes(12);
        const cipher = createCipheriv('aes-256-gcm', this.encKey, iv);
        const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    
        return [
            'v1', iv.toString('base64'),
            cipher.getAuthTag().toString('base64'),
            data.toString('base64')
        ].join(':');
    }


    decrypt(token: string): string {
        const [version, iv, tag, data] = token.split(':');
        if (version !== 'v1' || !iv || !tag || !data) 
        {
            throw new Error('Unsupported ciphertext format');
        }
        const decipher = createDecipheriv('aes-256-gcm', this.encKey, Buffer.from(iv, 'base64'));
        decipher.setAuthTag(Buffer.from(tag, 'base64'));
        return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
    }

    hash(plain: string): string
    {
        return createHmac('sha256', this.hashkey).update(plain).digest('hex')
    }
}