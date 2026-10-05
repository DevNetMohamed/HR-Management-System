import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  EMPLOYEE_DEPENDENT_QUERIES,
  type EmployeeDependentQueries,
} from 'src/modules/Employee/application/queries/employee-dependent.queries';
import { EmployeeDependentUseCases } from 'src/modules/Employee/application/use-cases/employee-dependent/employee-dependent.use-cases';
import { CurrentCompany } from '../../decorators/current-company.decorator';
import {
  AddDependentRequest,
  SetInsuranceRequest,
  UpdateDependentRequest,
} from 'src/modules/Employee/application/dto/employee-dependent/employee-dependent.requests';

@Controller('employees/:employeeId/dependents')
export class EmployeeDependentController {
  constructor(
    private readonly useCases: EmployeeDependentUseCases,
    @Inject(EMPLOYEE_DEPENDENT_QUERIES)
    private readonly queries: EmployeeDependentQueries,
  ) {}

  @Post()
  add(
    @CurrentCompany() company_id: string,
    @Param('employeeId', ParseUUIDPipe) employee_id: string,
    @Body() dto: AddDependentRequest,
  ) {
    return this.useCases.add({ company_id, employee_id, ...dto });
  }

  @Get()
  list(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.queries.listByEmployee(companyId, employeeId);
  }

  @Patch(':id')
  @HttpCode(204)
  update(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDependentRequest,
  ) {
    return this.useCases.update({ companyId, employeeId, id, ...dto });
  }

  @Put(':id/insurance')
  @HttpCode(204)
  setInsurance(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetInsuranceRequest,
  ) {
    return this.useCases.setInsurance({
      companyId,
      employeeId,
      id,
      covered: dto.covered,
    });
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
