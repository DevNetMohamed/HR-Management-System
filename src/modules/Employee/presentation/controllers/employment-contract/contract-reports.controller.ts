import { Controller, Get, Inject, Query } from '@nestjs/common';
import { CONTRACT_QUERIES, type ContractQueries } from 'src/modules/Employee/application/queries/contract.queries';
import { CurrentCompany } from '../../decorators/current-company.decorator';
import { ExpiringContractsQuery } from '../../../application/dto/employment-contract/contract.requests';
import { todayIn } from 'src/modules/Employee/domain/value-objects/iso-date';


@Controller('contracts')
export class ContractReportsController {
  constructor(@Inject(CONTRACT_QUERIES) private readonly queries: ContractQueries) {}

  // GET /contracts/expiring?days=30
  @Get('expiring')
  expiring(@CurrentCompany() companyId: string, @Query() q: ExpiringContractsQuery) {
    return this.queries.expiringWithin(companyId, q.days, todayIn('Africa/Cairo'));
  }
}