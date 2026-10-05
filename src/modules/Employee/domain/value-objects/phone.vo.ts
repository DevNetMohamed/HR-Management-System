import { DomainError } from "src/common/domain-error/DomainError.base";

export class Phone {
  private constructor(readonly value: string) {}
  static create(raw: string): Phone {
    const v = (raw ?? '').replace(/[\s\-()]/g, '');
    if (!/^\+?\d{7,15}$/.test(v)) throw new DomainError('Invalid phone number', 'INVALID_PHONE');
    return new Phone(v);
  }
}