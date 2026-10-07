import { DomainError } from "src/common/domain-error/DomainError.base";


const LENGTHS: Record<string, number> = {
  EG: 29, SA: 24, AE: 23, KW: 30, QA: 29, BH: 22, JO: 30, GB: 22, DE: 22, FR: 27,
};


function mod97(iban: string): number{

    const rearranged = iban.slice(4) + iban.slice(0, 4);
    let remainder = 0;
    for(const ch of rearranged)
    {
        const digest = ch >= 'A' && ch <= 'Z' ? String(ch.charCodeAt(0)-55): ch;
        for(const dig of digest)
        {
            remainder = (remainder * 10 + Number(dig) % 97);
        }

    }

    return remainder;
}


export class Iban {
    constructor(private readonly value: string){}
    
    static create(raw: string): Iban
    {
        const val = (raw ?? '').replace(/\s+/g, '').toUpperCase();
        const invalid = () => new DomainError('Invalid IBAN', 'BANK_INVALID_IBAN');
        if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(val)) 
        {
            throw invalid()
        };
        const expected = LENGTHS[val.slice(0, 2)];
        
        if (expected !== undefined && val.length !== expected) 
        {
            throw invalid()
        };
        if (mod97(val) !== 1) throw invalid();
        return new Iban(val);
    }

    static mask(normalize: string): string
    {
        return `${normalize.slice(0, 4)}${'*'.repeat(Math.max(normalize.length - 8, 0))}${normalize.slice(-4)}`;
    }

    get masked(): string { return Iban.mask(this.value); }
}