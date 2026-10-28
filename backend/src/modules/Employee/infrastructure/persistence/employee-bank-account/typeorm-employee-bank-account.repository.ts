import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmployeeBankAccountRepository } from 'src/modules/Employee/domain/employee-bank-accounts/repositories/employee-bank-account.repository';
import { EmployeeBankAccountOrmEntity } from './employee-bank-account.orm-entity';
import { Not, QueryFailedError, Repository } from 'typeorm';
import { EmployeeBankAccountMapper } from './employee-bank-account.mapper';
import { FieldCipher } from 'src/infrastructure/security/field-cipher';
import { EmployeeBankAccount } from 'src/modules/Employee/domain/employee-bank-accounts/entities/employee-bank-account.class';
import { ConflictError } from 'src/modules/Employee/application/errors';

const UNIQUE_VIOLATION = '23505';

function getDriverError(
  error: unknown,
): { code?: unknown; constraint?: unknown } | undefined {
  if (!(error instanceof QueryFailedError)) {
    return undefined;
  }

  const driverError: unknown = error.driverError;

  if (typeof driverError !== 'object' || driverError === null) {
    return undefined;
  }

  return driverError;
}

@Injectable()
export class TypeOrmEmployeeBankAccountRepository implements EmployeeBankAccountRepository {
  constructor(
    @InjectRepository(EmployeeBankAccountOrmEntity)
    private readonly orm: Repository<EmployeeBankAccountOrmEntity>,
    private readonly mapper: EmployeeBankAccountMapper,
    private readonly cipher: FieldCipher,
  ) {}

  private translate(e: unknown): unknown {
    const driverError = getDriverError(e);

    if (driverError?.code === UNIQUE_VIOLATION) {
      if (
        driverError.constraint === 'employee_bank_accounts_employee_iban_uq'
      ) {
        return new ConflictError(
          'This IBAN is already registered for the employee',
        );
      }

      if (driverError.constraint === 'employee_bank_accounts_one_primary_uq') {
        return new ConflictError(
          'The primary account was changed concurrently, please retry',
        );
      }
    }

    return e;
  }

  async findById(companyId: string, id: string) {
    const row = await this.orm.findOne({ where: { companyId, id } });
    return row ? this.mapper.toDomain(row) : null;
  }

  async save(account: EmployeeBankAccount) {
    const s = account.snapshot;
    try {
      await this.orm.manager.transaction(async (m) => {
        const repo = m.getRepository(EmployeeBankAccountOrmEntity);
        if (s.isPrimary) {
          await repo.update(
            {
              companyId: s.companyId,
              employeeId: s.employeeId,
              isPrimary: true,
              id: Not(s.id),
            },
            { isPrimary: false },
          );
        }
        await repo.save(this.mapper.toOrm(s));
      });
    } catch (e) {
      throw this.translate(e);
    }
  }

  async remove(companyId: string, id: string) {
    await this.orm.softDelete({ companyId, id });
  }

  countByEmployee(companyId: string, employeeId: string) {
    return this.orm.count({ where: { companyId, employeeId } });
  }

  existsIban(
    companyId: string,
    employeeId: string,
    iban: string,
    excludeId?: string,
  ) {
    return this.orm.exists({
      where: {
        companyId,
        employeeId,
        ibanHash: this.cipher.hash(iban),
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
    });
  }
}
