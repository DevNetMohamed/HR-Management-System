import { randomUUID } from 'crypto';
import { CompanyStatus } from '../enums/company-enums';
import {
  DomainError,
  InvalidCompanyStatusTransitionError,
} from '../errors/company.errors';

export interface CompanyProps {
  id: string;
  name: string;
  legalName: string | null;
  subdomain: string;
  taxNumber: string | null;
  country: string | null;
  currency: string | null;
  timezone: string | null;
  locale: string | null;
  logoUrl: string | null;
  status: CompanyStatus;
  plan: string | null;
}

export type CreateCompanyInput = Pick<CompanyProps, 'name' | 'subdomain'> &
  Partial<Omit<CompanyProps, 'id' | 'status'>>;

const TRANSITIONS: Record<CompanyStatus, CompanyStatus[]> = {
  [CompanyStatus.TRIAL]: [CompanyStatus.ACTIVE, CompanyStatus.SUSPENDED],
  [CompanyStatus.ACTIVE]: [CompanyStatus.SUSPENDED],
  [CompanyStatus.SUSPENDED]: [CompanyStatus.ACTIVE],
};

export class Company {
  private constructor(private props: CompanyProps) {}

  static create(i: CreateCompanyInput): Company {
    if (!i.name?.trim()) {
      throw new DomainError('Company name is required', 'COMPANY_NAME_REQUIRED');
    }
    if (!/^[a-z0-9-]+$/.test(i.subdomain)) {
      throw new DomainError(
        'Subdomain must be lowercase letters, numbers, or dashes',
        'COMPANY_INVALID_SUBDOMAIN',
      );
    }

    return new Company({
      id: randomUUID(),
      name: i.name.trim(),
      legalName: i.legalName ?? null,
      subdomain: i.subdomain,
      taxNumber: i.taxNumber ?? null,
      country: i.country ?? null,
      currency: i.currency ?? null,
      timezone: i.timezone ?? null,
      locale: i.locale ?? null,
      logoUrl: i.logoUrl ?? null,
      status: CompanyStatus.TRIAL,
      plan: i.plan ?? null,
    });
  }

  static restore(props: CompanyProps): Company {
    return new Company(props);
  }

  activate() {
    this.moveTo(CompanyStatus.ACTIVE);
  }

  suspend() {
    this.moveTo(CompanyStatus.SUSPENDED);
  }

  get id() {
    return this.props.id;
  }
  get status() {
    return this.props.status;
  }
  toSnapshot(): CompanyProps {
    return { ...this.props };
  }

  private moveTo(next: CompanyStatus) {
    if (!TRANSITIONS[this.props.status].includes(next)) {
      throw new InvalidCompanyStatusTransitionError(this.props.status, next);
    }
    this.props.status = next;
  }
}