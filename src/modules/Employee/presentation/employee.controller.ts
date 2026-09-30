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
import { CurrentCompany } from './current-company.decorator';
import {
  ChangeAssignmentRequest,
  HireEmployeeRequest,
  ListEmployeesQuery,
  TerminateEmployeeRequest,
} from './dto/employee.requests';
import { NotFoundError } from '../application/errors';
import {
  EMPLOYEE_QUERIES,
  type EmployeeQueries,
} from '../application/queries/employee.queries';
import { TerminateEmployeeUseCase } from '../application/use-cases/terminate-employee.use-case';
import { ChangeAssignmentUseCase } from '../application/use-cases/change-assignment.use-case';
import { HireEmployeeUseCase } from '../application/use-cases/hire-employee.use-case';

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
