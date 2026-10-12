import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmployeeDocumentRepository } from 'src/modules/Employee/domain/employee-document/repositories/employee-document.repository';
import { EmployeeDocumentOrmEntity } from './employee-document.orm-entity';
import { Not, QueryFailedError, Repository } from 'typeorm';
import { ConflictError } from 'src/modules/Employee/application/errors';
import { EmployeeDocumentMapper } from './employee-document.mapper';
import { EmployeeDocument } from 'src/modules/Employee/domain/employee-document/entities/employee-document.class';
import { EmployeeDocumentType } from 'src/modules/Employee/domain/employee-document/enums/employee-document.enums';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class TypeOrmEmployeeDocumentRepository implements EmployeeDocumentRepository {
  constructor(
    @InjectRepository(EmployeeDocumentOrmEntity)
    private readonly orm: Repository<EmployeeDocumentOrmEntity>,
  ) {}

  private translate(e: unknown): unknown {
    if (
      e instanceof QueryFailedError &&
      (e as any).driverError?.code === UNIQUE_VIOLATION
    ) {
      const constraint = (e as any).driverError?.constraint;
      if (constraint === 'employee_documents_one_per_type_uq') {
        return new ConflictError(
          'Employee already has a document of this type. Replace its file instead',
        );
      }
      if (constraint === 'employee_documents_file_key_uq') {
        return new ConflictError('This file is already attached to a document');
      }
    }
    return e;
  }

  async findById(companyId: string, id: string) {
    const row = await this.orm.findOne({ where: { companyId, id } });
    return row ? EmployeeDocumentMapper.toDomain(row) : null;
  }

  async save(d: EmployeeDocument) {
    try {
      await this.orm.save(EmployeeDocumentMapper.toOrm(d.snapshot));
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

  existsOfType(
    companyId: string,
    employeeId: string,
    type: EmployeeDocumentType,
    excludeId?: string,
  ) {
    return this.orm.exists({
      where: {
        companyId,
        employeeId,
        documentType: type,
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
    });
  }
}
