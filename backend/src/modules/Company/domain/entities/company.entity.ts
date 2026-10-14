import { DomainError } from '../../../../common/domain-error/DomainError.base';
import { randomUUID } from 'crypto';

export type CompanyStatus = 'trial' | 'active' | 'suspended';

export interface CompanyProps {
  id: string;
  name: string;
  legalName: string | null;
  subdomain: string;
  taxNumber: string | null;
  commercialRegisterNumber: string | null;
  industry: string | null;
  workEmail: string | null;
  phone: string | null;
  website: string | null;
  country: string | null;
  currency: string | null;
  timezone: string | null;
  locale: string | null;
  logoUrl: string | null;
  status: CompanyStatus;
  plan: string | null;
}

export type CreateCompanyInput = Pick<CompanyProps, 'name' | 'subdomain'> &
  Partial<Omit<CompanyProps, 'id' | 'name' | 'subdomain' | 'status'>>;

export class Company {
  private constructor(private props: CompanyProps) {}
  static create(input: CreateCompanyInput): Company {
    if (!input.name?.trim()) {
      throw new DomainError(
        'Company name is required',
        'COMPANY_NAME_REQUIRED',
      );
    }

    if (!input.subdomain || !/^[a-z0-9-]+$/.test(input.subdomain)) {
      throw new DomainError(
        'Subdomain must contain lowercase letters, numbers, or dashes',
        'COMPANY_INVALID_SUBDOMAIN',
      );
    }
    return new Company({
      id: randomUUID(),
      name: input.name.trim(),
      legalName: input.legalName ?? null,
      subdomain: input.subdomain,
      taxNumber: input.taxNumber ?? null,
      commercialRegisterNumber: input.commercialRegisterNumber ?? null,
      industry: input.industry ?? null,
      workEmail: input.workEmail ?? null,
      phone: input.phone ?? null,
      website: input.website ?? null,
      country: input.country ?? null,
      currency: input.currency ?? null,
      timezone: input.timezone ?? null,
      locale: input.locale ?? null,
      logoUrl: input.logoUrl ?? null,
      status: 'trial',
      plan: input.plan ?? null,
    });
  }
  toSnapshot(): CompanyProps {
    return { ...this.props };
  }
}
