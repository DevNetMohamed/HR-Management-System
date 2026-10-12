// import { Injectable } from '@nestjs/common';
// import { DataSource } from 'typeorm';
// import { OrganizationGateway } from '../../application/ports/organization.gateway';


// @Injectable()
// export class SqlOrganizationGateway implements OrganizationGateway {
//   constructor(private readonly ds: DataSource) {}

//   private async exists(
//     table: 'departments' | 'positions' | 'branches',
//     companyId: string,
//     id: string,
//   ) {
//     const rows = await this.ds.query(
//       `SELECT 1 FROM ${table} WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL`,
//       [id, companyId],
//     );
//     return rows.length > 0;
//   }
//   departmentExists(c: string, id: string) {
//     return this.exists('departments', c, id);
//   }
//   positionExists(c: string, id: string) {
//     return this.exists('positions', c, id);
//   }
//   branchExists(c: string, id: string) {
//     return this.exists('branches', c, id);
//   }
// }



import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrganizationGateway } from '../../application/ports/organization.gateway';

@Injectable()
export class SqlOrganizationGateway implements OrganizationGateway {
  constructor(private readonly ds: DataSource) {}

  private async exists(
    table: 'departments' | 'positions' | 'branches',
    companyId: string,
    id: string,
  ): Promise<boolean> {
    // Temporary: check whether the table exists.
    const tableExists = await this.ds.query(
      `SELECT to_regclass($1) AS table_name`,
      [`public.${table}`],
    );

    if (!tableExists[0]?.table_name) {
      return false;
    }

    const rows = await this.ds.query(
      `SELECT 1
       FROM public.${table}
       WHERE id = $1
         AND company_id = $2
         AND deleted_at IS NULL
       LIMIT 1`,
      [id, companyId],
    );

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