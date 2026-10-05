import { Inject, Injectable } from '@nestjs/common';
import {
  COMPANY_REPOSITORY,
  type CompanyRepository,
} from '../../domain/repositories/company.repository';
import { NotFoundError } from '../errors';

@Injectable()
export class ActivateCompanyUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY) private readonly companies: CompanyRepository,
  ) {}

  async execute(cmd: { companyId: string }): Promise<void> {
    const company = await this.companies.findById(cmd.companyId);
    if (!company) throw new NotFoundError('Company not found');

    company.activate();

    await this.companies.save(company);
  }
}