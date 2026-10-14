import type { Company } from '../entities/company.entity';

export const COMPANY_REPOSITORY = Symbol('COMPANY_REPOSITORY');

export interface CompanyRepository {
  subdomainExists(subdomain: string): Promise<boolean>;
  save(company: Company): Promise<void>;
}
