import { Company, CompanyProps } from '../../domain/entities/company.entity';
import { CompanyOrmEntity } from './company.orm-entity';

export class CompanyMapper {
  static toDomain(o: CompanyOrmEntity): Company {
    const {
      createdAt,
      updatedAt,
      createdBy,
      updatedBy,
      deletedAt,
      metadata,
      ...props
    } = o;
    return Company.restore(props);
  }

  static toOrm(p: CompanyProps): CompanyOrmEntity {
    return Object.assign(new CompanyOrmEntity(), p);
  }
}