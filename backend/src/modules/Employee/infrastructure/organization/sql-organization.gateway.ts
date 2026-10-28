import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrganizationGateway } from '../../application/ports/organization.gateway';

interface TableExistsRow {
  table_name: string | null;
}

interface ExistsRow {
  '?column?': number;
}

@Injectable()
export class SqlOrganizationGateway implements OrganizationGateway {
  constructor(private readonly ds: DataSource) {}

  private async exists(
    table: 'departments' | 'positions' | 'branches',
    companyId: string,
    id: string,
  ): Promise<boolean> {
    const tableExists = (await this.ds.query(
      'SELECT to_regclass($1) AS table_name',
      [`public.${table}`],
    )) as unknown as TableExistsRow[];

    if (!tableExists[0]?.table_name) {
      return false;
    }

    const rows = (await this.ds.query(
      `SELECT 1
       FROM public.${table}
       WHERE id = $1
         AND company_id = $2
         AND deleted_at IS NULL
       LIMIT 1`,
      [id, companyId],
    )) as unknown as ExistsRow[];

    return rows.length > 0;
  }

  departmentExists(companyId: string, id: string) {
    return this.exists('departments', companyId, id);
  }

  positionExists(companyId: string, id: string) {
    return this.exists('positions', companyId, id);
  }

  branchExists(companyId: string, id: string) {
    return this.exists('branches', companyId, id);
  }
}
