import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmployeeDependentRepository } from 'src/modules/Employee/domain/employee-dependents/repositories/employee-dependent.repository';
import { EmployeeDependentOrmEntity } from './employee-dependent.orm-entity';
import { Not, QueryFailedError, Repository } from 'typeorm';
import { EmployeeDependentMapper } from './employee-dependent.mapper';
import { EmployeeDependent } from 'src/modules/Employee/domain/employee-dependents/entities/employee-dependents.entity';
import { ConflictError } from 'src/modules/Employee/application/errors';
import { DependentRelationship } from 'src/modules/Employee/domain/employee-dependents/enums/employee-dependent.enums';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class TypeOrmEmployeeDependentRepository implements EmployeeDependentRepository {
  constructor(
    @InjectRepository(EmployeeDependentOrmEntity)
    private readonly orm: Repository<EmployeeDependentOrmEntity>,
  ) {}

  async findById(companyId: string, id: string) {
    const row = await this.orm.findOne({ where: { companyId, id } });
    return row ? EmployeeDependentMapper.toDomain(row) : null;
  }

  async save(d: EmployeeDependent) {
    try {
      await this.orm.save(EmployeeDependentMapper.toOrm(d.snapshot));
    } catch (e) {
      if (
        e instanceof QueryFailedError &&
        (e as any).driverError?.code === UNIQUE_VIOLATION
      ) {
        throw new ConflictError('Employee already has a spouse registered');
      }
      throw e;
    }
  }

  async remove(companyId: string, id: string) {
    await this.orm.softDelete({ companyId, id });
  }

  countByEmployee(companyId: string, employeeId: string) {
    return this.orm.count({ where: { companyId, employeeId } });
  }

  hasSpouse(companyId: string, employeeId: string, excludeId?: string) {
    return this.orm.exists({
      where: {
        companyId,
        employeeId,
        relationship: DependentRelationship.SPOUSE,
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
    });
  }

  async existsDuplicate(
    companyId: string,
    employeeId: string,
    name: string,
    dateOfBirth: string | null,
    excludeId?: string,
  ) {
    const qb = this.orm
      .createQueryBuilder('d')
      .where('d.companyId = :companyId AND d.employeeId = :employeeId', {
        companyId,
        employeeId,
      })
      .andWhere('LOWER(d.name) = LOWER(:name)', { name })
      .andWhere(
        dateOfBirth === null
          ? 'd.dateOfBirth IS NULL'
          : 'd.dateOfBirth = :dateOfBirth',
        { dateOfBirth },
      );
    if (excludeId) qb.andWhere('d.id <> :excludeId', { excludeId });
    return (await qb.getCount()) > 0;
  }
}
