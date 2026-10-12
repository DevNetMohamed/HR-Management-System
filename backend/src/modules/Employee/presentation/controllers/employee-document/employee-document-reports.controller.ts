import { Controller, Get, Inject, Query } from '@nestjs/common';
import {
  EMPLOYEE_DOCUMENT_QUERIES,
  type EmployeeDocumentQueries,
} from 'src/modules/Employee/application/queries/employee-document.queries';
import { CurrentCompany } from '../../decorators/current-company.decorator';
import { todayIn } from 'src/modules/Employee/domain/value-objects/iso-date';
import { ExpiringDocumentsQuery } from 'src/modules/Employee/application/dto/employee-document/employee-document.requests';

@Controller('documents')
export class EmployeeDocumentReportsController {
  constructor(
    @Inject(EMPLOYEE_DOCUMENT_QUERIES)
    private readonly queries: EmployeeDocumentQueries,
  ) {}

  @Get('expiring')
  expiring(
    @CurrentCompany() companyId: string,
    @Query() q: ExpiringDocumentsQuery,
  ) {
    return this.queries.expiringWithin(
      companyId,
      q.days,
      todayIn('Africa/Cairo'),
    );
  }
}
