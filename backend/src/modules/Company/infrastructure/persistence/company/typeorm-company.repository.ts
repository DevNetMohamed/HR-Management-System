import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Company } from '../../../domain/entities/company.entity';
import type { CompanyRepository } from '../../../domain/repositories/company.repository';
import { CompanyMapper } from './company.mapper';
import { CompanyOrmEntity } from './company.orm-entity';

@Injectable()
export class TypeOrmCompanyRepository implements CompanyRepository {
  constructor(
    @InjectRepository(CompanyOrmEntity)
    private readonly repository: Repository<CompanyOrmEntity>,  
  ) {}

  async subdomainExists(subdomain: string): Promise<boolean> {
    const company = await this.repository.findOne({
      where: { subdomain },
      withDeleted: true,
    });

    return company !== null;
  }

  async save(company: Company): Promise<void> {
    const companyOrmEntity = CompanyMapper.toOrm(company);
    await this.repository.save(companyOrmEntity);
  }
}
