import {
    Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  EMPLOYEE_BANK_ACCOUNT_QUERIES,
  type EmployeeBankAccountQueries,
} from 'src/modules/Employee/application/queries/employee-bank-account.queries';
import { EmployeeBankAccountUseCases } from 'src/modules/Employee/application/use-cases/employee-bank-account/employee-bank-account.use-cases';
import { CurrentCompany } from '../../decorators/current-company.decorator';
import {
  AddBankAccountRequest,
  UpdateBankAccountRequest,
} from 'src/modules/Employee/application/dto/employee-bank-account/employee-bank-account.requests';

@Controller('employees/:employeeId/bank-accounts')
export class EmployeeBankAccountController {
  constructor(
    private readonly useCases: EmployeeBankAccountUseCases,
    @Inject(EMPLOYEE_BANK_ACCOUNT_QUERIES)
    private readonly queries: EmployeeBankAccountQueries,
  ) {}

  @Post()
  add(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: AddBankAccountRequest,
  ) {
    return this.useCases.add({ companyId, employeeId, ...dto });
  }

  @Get()
  list(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.queries.listByEmployee(companyId, employeeId);
  }

  @Get(':id/reveal')
  @Header('Cache-Control', 'no-store')
  reveal(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.useCases.reveal({ companyId, employeeId, id });
  }

  @Patch(':id')
  @HttpCode(204)
  update(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBankAccountRequest,
  ) {
    return this.useCases.update({companyId, employeeId,id, ...dto});
  }

  @Put(':id/primary')
  @HttpCode(204)
  setPrimary(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.useCases.setPrimary({ companyId, employeeId, id });
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.useCases.remove({ companyId, employeeId, id });
  }
}
