import { randomUUID } from 'crypto';
import { CompanyStatus } from '../enums/company-enums';

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

export class Company {
  private constructor(private props: CompanyProps) {}

  static create(i: CreateCompanyInput): Company {
    if (!i.name?.trim()) {
      throw new Error('Company name is required');
    }
    if (!/^[a-z0-9-]+$/.test(i.subdomain)) {
      throw new Error('Subdomain must be lowercase letters, numbers, or dashes');
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

  get id() {
    return this.props.id;
  }
  get status() {
    return this.props.status;
  }
  toSnapshot(): CompanyProps {
    return { ...this.props };
  }
}