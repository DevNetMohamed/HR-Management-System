import { Company } from '../../../domain/entities/company.entity';
import { CompanyOrmEntity } from './company.orm-entity';

export class CompanyMapper {
  static toOrm(company: Company): CompanyOrmEntity {
    const companyData = company.toSnapshot();

    return Object.assign(new CompanyOrmEntity(), companyData);
  }
}