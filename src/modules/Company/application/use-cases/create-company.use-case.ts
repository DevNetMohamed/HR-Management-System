import { Inject, Injectable } from '@nestjs/common';
import {
  COMPANY_REPOSITORY,
  type CompanyRepository,
} from '../../domain/repositories/company.repository';
import { Company, type CreateCompanyInput } from '../../domain/entities/company.entity';
import { ConflictError } from '../errors';

@Injectable()
export class CreateCompanyUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY) private readonly companies: CompanyRepository,
  ) {}

  async execute(cmd: CreateCompanyInput): Promise<{ id: string }> {
    if (await this.companies.subdomainExists(cmd.subdomain)) {
      throw new ConflictError('Subdomain is already taken');
    }

    const company = Company.create(cmd);
    await this.companies.save(company);

    return { id: company.id };
  }
}