import { Company } from '../entities/company.entity';

export const COMPANY_REPOSITORY = Symbol('COMPANY_REPOSITORY');

export interface CompanyRepository {
  findById(id: string): Promise<Company | null>;
  save(company: Company): Promise<void>;
  subdomainExists(subdomain: string): Promise<boolean>;
}