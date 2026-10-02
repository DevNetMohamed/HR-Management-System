import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentCompany } from '../../decorators/current-company.decorator';

import { NotFoundError } from '../../../application/errors';
import {
  EMPLOYEE_QUERIES,
  type EmployeeQueries,
} from '../../../application/queries/employee.queries';
import { TerminateEmployeeUseCase } from '../../../application/use-cases/employee/terminate-employee.use-case';
import { HireEmployeeUseCase } from '../../../application/use-cases/employee/hire-employee.use-case';
import { ChangeAssignmentUseCase } from 'src/modules/Employee/application/use-cases/employee/change-assignment.use-case';
import {
  ChangeAssignmentRequest,
  HireEmployeeRequest,
  ListEmployeesQuery,
  TerminateEmployeeRequest,
} from '../../../application/dto/employee/employee.requests';

@Controller('employees')
export class EmployeeController {
  constructor(
    private readonly hire: HireEmployeeUseCase,
    private readonly changeAssignment: ChangeAssignmentUseCase,
    private readonly terminate: TerminateEmployeeUseCase,
    @Inject(EMPLOYEE_QUERIES) private readonly queries: EmployeeQueries,
  ) {}

  @Post()
  create(
    @CurrentCompany() companyId: string,
    @Body() dto: HireEmployeeRequest,
  ) {
    return this.hire.execute({ companyId, ...dto });
  }

  @Get()
  list(@CurrentCompany() companyId: string, @Query() q: ListEmployeesQuery) {
    return this.queries.list({ companyId, ...q });
  }

  @Get(':id')
  async get(
    @CurrentCompany() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const employee = await this.queries.getDetails(companyId, id);
    if (!employee) throw new NotFoundError('Employee not found');
    return employee;
  }

  @Post(':id/assignment-changes')
  @HttpCode(204)
  async change(
    @CurrentCompany() companyId: string,
    @Param('id', ParseUUIDPipe) employeeId: string,
    @Body() dto: ChangeAssignmentRequest,
  ) {
    await this.changeAssignment.execute({ companyId, employeeId, ...dto });
  }

  @Post(':id/terminate')
  @HttpCode(204)
  async end(
    @CurrentCompany() companyId: string,
    @Param('id', ParseUUIDPipe) employeeId: string,
    @Body() dto: TerminateEmployeeRequest,
  ) {
    await this.terminate.execute({
      companyId,
      employeeId,
      lastWorkingDay: dto.lastWorkingDay,
    });
  }
}
