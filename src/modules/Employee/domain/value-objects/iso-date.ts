import { DomainError } from "src/common/domain-error/DomainError.base";

export type IsoDate = string;
export function assertIsoDate(value: string, field: string): void{
    const month = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
    let ok = false;

    if (month) {
    const [y, mo, d] = [+month[1], +month[2], +month[3]];
    const dt = new Date(Date.UTC(y, mo - 1, d));
    ok = dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
  }
  if(!ok) throw new DomainError(`${field} must be a valid YYYY-MM-DD date`, 'INVALID_DATE')
}


export const todayIn = (timeZone:string): IsoDate => 
    new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());