import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../../OvertimeRequest/application/ports/authorization.gateway';
import { TemporaryPrincipal } from '../../../OvertimeRequest/presentation/temporary-principal.decorator';
import {
  BranchShiftDto,
  EmployeeShiftDto,
  EndAssignmentDto,
  ShiftDto,
} from '../../application/dto/time.requests';
import { ShiftsUseCases } from '../../application/use-cases/shifts.use-cases';

@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shifts: ShiftsUseCases) {}

  @Post()
  create(
    @TemporaryPrincipal() p: AuthenticatedPrincipal,
    @Body() dto: ShiftDto,
  ) {
    return this.shifts.create(p, dto);
  }

  @Get()
  list(
    @TemporaryPrincipal() p: AuthenticatedPrincipal,
    @Query('date') date?: string,
  ) {
    return this.shifts.list(p.companyId, date);
  }

  @Post(':id/versions')
  version(
    @TemporaryPrincipal() p: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ShiftDto,
  ) {
    return this.shifts.addVersion(p, id, dto);
  }

  @Post(':id/branches')
  assignBranch(
    @TemporaryPrincipal() p: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BranchShiftDto,
  ) {
    return this.shifts.assignBranch(p, id, dto);
  }

  @Post('employee-assignments')
  assignEmployee(
    @TemporaryPrincipal() p: AuthenticatedPrincipal,
    @Body() dto: EmployeeShiftDto,
  ) {
    return this.shifts.assignEmployee(p, dto);
  }

  @Patch('branch-assignments/:id/end')
  endBranch(
    @TemporaryPrincipal() p: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EndAssignmentDto,
  ) {
    return this.shifts.endBranchAssignment(p, id, dto.endDate);
  }

  @Patch('employee-assignments/:id/end')
  endEmployee(
    @TemporaryPrincipal() p: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EndAssignmentDto,
  ) {
    return this.shifts.endEmployeeAssignment(p, id, dto.endDate);
  }

  @Get('employees/:employeeId')
  employeeShift(
    @TemporaryPrincipal() p: AuthenticatedPrincipal,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('date') date: string,
  ) {
    return this.shifts.resolveEmployeeShift(p.companyId, employeeId, date);
  }

  @Post(':id/retire')
  @HttpCode(204)
  retire(
    @TemporaryPrincipal() p: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.shifts.retire(p, id);
  }
}
