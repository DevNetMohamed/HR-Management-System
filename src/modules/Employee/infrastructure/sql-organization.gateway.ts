import { Injectable } from '@nestjs/common';
import { OrganizationGateway } from '../application/ports/organization.gateway';
import { DataSource } from 'typeorm';


@Injectable()
export class SqlOrganizationGateway implements OrganizationGateway {
  constructor(private readonly ds: DataSource) {}

  private async exists(
    table: 'departments' | 'positions' | 'branches',
    companyId: string,
    id: string,
  ) {
    const rows = await this.ds.query(
      `SELECT 1 FROM ${table} WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [id, companyId],
    );
    return rows.length > 0;
  }
  departmentExists(c: string, id: string) {
    return this.exists('departments', c, id);
  }
  positionExists(c: string, id: string) {
    return this.exists('positions', c, id);
  }
  branchExists(c: string, id: string) {
    return this.exists('branches', c, id);
  }
}
