import { EmploymentContract } from 'src/modules/Employee/domain/employment-contract/entities/EmploymentContract';
import { EmploymentContractOrmEntity } from './employment-contract.orm-entity';
import { EmploymentContractProps } from 'src/modules/Employee/domain/employment-contract/interfaces/employee-contract-interface';

export class EmploymentContractMapper {
  static toDomain(o: EmploymentContractOrmEntity): EmploymentContract {
    const {
      createdAt,
      updatedAt,
      createdBy,
      updatedBy,
      deletedAt,
      metadata,
      ...props
    } = o;
    return EmploymentContract.restore(props);
  }
  static toOrm(
    p: Readonly<EmploymentContractProps>,
  ): EmploymentContractOrmEntity {
    return Object.assign(new EmploymentContractOrmEntity(), p);
  }
}
