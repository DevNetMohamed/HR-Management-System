import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EmployeeOrmEntity } from "./employee.orm-entity";
import { EmployeeRepository } from "../../domain/employee.repository";
import { EmployeeMapper } from "./employee.mapper";
import { Employee } from "../../domain/employee.entity";
import { JobHistoryOrmEntity } from "./job-history.orm-entity";
import { Repository } from "typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class TypeOrmEmployeeRepository implements EmployeeRepository {
  constructor(
    @InjectRepository(EmployeeOrmEntity) private readonly orm: Repository<EmployeeOrmEntity>,
    private readonly ds: DataSource,
  ) {}

  async findById(companyId: string, id: string) {
    const row = await this.orm.findOne({ where: { companyId, id } });
    return row ? EmployeeMapper.toDomain(row) : null;
  }

  async save(e: Employee) {
    await this.ds.transaction(async (m) => {
      await m.getRepository(EmployeeOrmEntity).save(EmployeeMapper.toOrm(e.toSnapshot()));
      if (e.pendingJobHistory.length) {
        await m.getRepository(JobHistoryOrmEntity).insert(e.pendingJobHistory.map((h) => ({ ...h })));
      }
    });
    e.markPersisted();
  }

  async emailExists(companyId: string, email: string) {
    return this.orm.exists({ where: { companyId, email: email.trim().toLowerCase() } });
  }

  async nextEmployeeNumber(companyId: string) {
    const [{ n }] = await this.ds.query(
      `SELECT COALESCE(MAX(NULLIF(regexp_replace(employee_number, '\\D', '', 'g'), '')::int), 0) + 1 AS n
         FROM employees WHERE company_id = $1`,
      [companyId],
    );
    return `EMP-${String(n).padStart(5, '0')}`;
  }
}