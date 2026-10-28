import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../../OvertimeRequest/application/ports/authorization.gateway';
import { TemporaryPrincipal } from '../../../OvertimeRequest/presentation/temporary-principal.decorator';
import {
  AttendancePolicyDto,
  CalendarDto,
  CancelDto,
  DateRangeQuery,
  EffectiveQuery,
  HolidayDto,
  HolidayOverrideDto,
  ResolveDayQuery,
  WorkweekDto,
} from '../../application/dto/time.requests';
import { TimeConfigurationUseCases } from '../../application/use-cases/time-configuration.use-cases';

@Controller('time-configuration')
export class TimeConfigurationController {
  constructor(private readonly time: TimeConfigurationUseCases) {}

  @Post('calendar')
  createCalendar(
    @TemporaryPrincipal() p: AuthenticatedPrincipal,
    @Body() dto: CalendarDto,
  ) {
    return this.time.createCalendar(p, dto);
  }

  @Get('calendar')
  getCalendar(@TemporaryPrincipal() p: AuthenticatedPrincipal) {
    return this.time.getCalendar(p.companyId);
  }

  @Post('holidays')
  createHoliday(
    @TemporaryPrincipal() p: AuthenticatedPrincipal,
    @Body() dto: HolidayDto,
  ) {
    return this.time.createHoliday(p, dto);
  }

  @Get('holidays')
  listHolidays(
    @TemporaryPrincipal() p: AuthenticatedPrincipal,
    @Query() q: DateRangeQuery,
  ) {
    return this.time.listHolidays(p.companyId, q);
  }

  @Put('holidays/:id')
  updateHoliday(
    @TemporaryPrincipal() p: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HolidayDto,
  ) {
    return this.time.updateHoliday(p, id, dto);
  }

  @Post('holidays/:id/cancel')
  @HttpCode(204)
  cancelHoliday(
    @TemporaryPrincipal() p: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelDto,
  ) {
    return this.time.cancelHoliday(p, id, dto.reason);
  }

  @Put('holidays/:id/occurrence')
  overrideHoliday(
    @TemporaryPrincipal() p: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HolidayOverrideDto,
  ) {
    return this.time.overrideHoliday(p, id, dto);
  }

  @Post('workweeks')
  setWorkweek(
    @TemporaryPrincipal() p: AuthenticatedPrincipal,
    @Body() dto: WorkweekDto,
  ) {
    return this.time.setWorkweek(p, dto);
  }

  @Post('attendance-policies')
  setPolicy(
    @TemporaryPrincipal() p: AuthenticatedPrincipal,
    @Body() dto: AttendancePolicyDto,
  ) {
    return this.time.setAttendancePolicy(p, dto);
  }

  @Get('effective')
  effective(
    @TemporaryPrincipal() p: AuthenticatedPrincipal,
    @Query() q: EffectiveQuery,
  ) {
    return this.time.effectiveConfig(p.companyId, q.date, q.branchId);
  }

  @Get('day')
  async day(
    @TemporaryPrincipal() p: AuthenticatedPrincipal,
    @Query() q: ResolveDayQuery,
  ) {
    return this.time.resolveDayForEmployee(p.companyId, q);
  }
}
