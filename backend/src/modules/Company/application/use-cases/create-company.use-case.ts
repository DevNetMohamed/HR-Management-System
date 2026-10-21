import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../common/domain-error/DomainError.base';
import {
  Company,
  type CreateCompanyInput,
} from '../../domain/entities/company.entity';
import {
  COMPANY_REPOSITORY,
  type CompanyRepository,
} from '../../domain/repositories/company.repository';

@Injectable()
export class CreateCompanyUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companies: CompanyRepository,
  ) {}

  async execute(input: CreateCompanyInput): Promise<{ id: string }> {
    const company = Company.create(input);
    const companyData = company.toSnapshot();

    const taken = await this.companies.subdomainExists(companyData.subdomain);

    if (taken) {
      throw new DomainError(
        'Subdomain is already taken',
        'COMPANY_SUBDOMAIN_ALREADY_EXISTS',
      );
    }

    await this.companies.save(company);

    return { id: companyData.id };
  }
}
