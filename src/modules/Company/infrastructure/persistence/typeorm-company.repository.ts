import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../domain/entities/company.entity';
import { CompanyRepository } from '../../domain/repositories/company.repository';
import { CompanyMapper } from './company.mapper';
import { CompanyOrmEntity } from './company.orm-entity';

@Injectable()
export class TypeOrmCompanyRepository implements CompanyRepository {
  constructor(
    @InjectRepository(CompanyOrmEntity)
    private readonly repo: Repository<CompanyOrmEntity>,
  ) {}

  async findById(id: string): Promise<Company | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? CompanyMapper.toDomain(row) : null;
  }

  async save(company: Company): Promise<void> {
    await this.repo.save(CompanyMapper.toOrm(company.toSnapshot()));
  }

  async subdomainExists(subdomain: string): Promise<boolean> {
    return this.repo.exists({ where: { subdomain } });
  }
}