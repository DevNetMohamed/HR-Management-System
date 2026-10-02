import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmploymentContractRepository } from 'src/modules/Employee/domain/employment-contract/repositories/employment-contract.repository';
import { EmploymentContractOrmEntity } from './employment-contract.orm-entity';
import { LessThan, QueryFailedError, Repository } from 'typeorm';
import { EmploymentContractMapper } from './employment-contract.mapper';
import { ContractStatus } from 'src/modules/Employee/domain/employment-contract/enums/employment-contract.enums';
import { EmploymentContract } from 'src/modules/Employee/domain/employment-contract/entities/EmploymentContract';
import { ConflictError } from 'src/modules/Employee/application/errors';
import { IsoDate } from 'src/modules/Employee/domain/value-objects/iso-date';

const EXCLUSION_VIOLATION = '23P01';

@Injectable()
export class TypeOrmEmploymentContractRepository implements EmploymentContractRepository {
  constructor(
    @InjectRepository(EmploymentContractOrmEntity)
    private readonly orm: Repository<EmploymentContractOrmEntity>,
  ) {}

  async findById(companyId: string, id: string) {
    const row = await this.orm.findOne({ where: { companyId, id } });
    return row ? EmploymentContractMapper.toDomain(row) : null;
  }

  async findActiveByEmployee(companyId: string, employeeId: string) {
    const rows = await this.orm.find({
      where: { companyId, employeeId, status: ContractStatus.ACTIVE },
    });
    return rows.map(EmploymentContractMapper.toDomain);
  }

  async save(c: EmploymentContract) {
    try {
      await this.orm.save(EmploymentContractMapper.toOrm(c.snapshot));
    } catch (e) {
      if (
        e instanceof QueryFailedError &&
        (e as any).driverError?.code === EXCLUSION_VIOLATION
      ) {
        throw new ConflictError(
          'Contract period overlaps with another active contract',
        );
      }
      throw e;
    }
  }

  async remove(companyId: string, id: string) {
    await this.orm.softDelete({ companyId, id });
  }

  async findActiveEndedBefore(date: IsoDate, limit: number) {
    const rows = await this.orm.find({
      where: { status: ContractStatus.ACTIVE, endDate: LessThan(date) },
      order: { endDate: 'ASC' },
      take: limit,
    });
    return rows.map(EmploymentContractMapper.toDomain);
  }
}
