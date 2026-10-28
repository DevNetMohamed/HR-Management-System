import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../../OvertimeRequest/application/ports/authorization.gateway';
import {
  AttendancePolicyDto,
  CalendarDto,
  DateRangeQuery,
  HolidayDto,
  HolidayOverrideDto,
  ResolveDayQuery,
  WorkweekDto,
} from '../dto/time.requests';
import {
  TIME_CONFIGURATION_REPOSITORY,
  type TimeConfigurationRepository,
} from '../ports/time-configuration.repository';
import { ShiftsUseCases } from './shifts.use-cases';
import { validateHolidayInput } from '../../domain/holidays/holiday-rules';
import { validDate } from '../../domain/value-objects/calendar-date';

@Injectable()
export class TimeConfigurationUseCases {
  constructor(
    @Inject(TIME_CONFIGURATION_REPOSITORY)
    private readonly repository: TimeConfigurationRepository,
    private readonly shifts: ShiftsUseCases,
  ) {}

  private assertManage(p: AuthenticatedPrincipal): void {
    if (!p.permissions.includes('time_configuration.manage')) {
      throw new ForbiddenException('Time configuration permission required');
    }
  }

  branchExists(companyId: string, branchId: string) {
    return this.repository.branchExists(companyId, branchId);
  }

  employeeBranch(companyId: string, employeeId: string) {
    return this.repository.employeeBranch(companyId, employeeId);
  }

  createCalendar(p: AuthenticatedPrincipal, dto: CalendarDto) {
    this.assertManage(p);
    return this.repository.createCalendar(p, dto);
  }

  getCalendar(companyId: string) {
    return this.repository.getCalendar(companyId);
  }

  createHoliday(p: AuthenticatedPrincipal, dto: HolidayDto) {
    this.assertManage(p);
    const error = validateHolidayInput(dto);
    if (error) throw new BadRequestException(error);
    return this.repository.createHoliday(p, dto);
  }

  updateHoliday(p: AuthenticatedPrincipal, id: string, dto: HolidayDto) {
    this.assertManage(p);
    const error = validateHolidayInput(dto);
    if (error) throw new BadRequestException(error);
    return this.repository.updateHoliday(p, id, dto);
  }

  cancelHoliday(p: AuthenticatedPrincipal, id: string, reason: string) {
    this.assertManage(p);
    return this.repository.cancelHoliday(p, id, reason);
  }

  overrideHoliday(
    p: AuthenticatedPrincipal,
    id: string,
    dto: HolidayOverrideDto,
  ) {
    this.assertManage(p);
    return this.repository.overrideHoliday(p, id, dto);
  }

  listHolidays(companyId: string, query: DateRangeQuery) {
    return this.repository.listHolidays(companyId, query);
  }

  setWorkweek(p: AuthenticatedPrincipal, dto: WorkweekDto) {
    this.assertManage(p);
    if (!validDate(dto.effectiveFrom))
      throw new BadRequestException('Invalid calendar date');
    if (new Set(dto.workingDays).size !== dto.workingDays.length) {
      throw new BadRequestException('Working days must be unique');
    }
    return this.repository.setWorkweek(p, dto);
  }

  setAttendancePolicy(p: AuthenticatedPrincipal, dto: AttendancePolicyDto) {
    this.assertManage(p);
    if (!validDate(dto.effectiveFrom))
      throw new BadRequestException('Invalid calendar date');
    if (
      dto.absentAfterMin !== undefined &&
      dto.halfDayAfterMin !== undefined &&
      dto.absentAfterMin < dto.halfDayAfterMin
    ) {
      throw new BadRequestException(
        'Absent threshold must be after half-day threshold',
      );
    }
    if (
      dto.overtimeMaxMinutes !== undefined &&
      dto.overtimeMaxMinutes < dto.overtimeMinMinutes
    ) {
      throw new BadRequestException('Overtime maximum is below minimum');
    }
    return this.repository.setAttendancePolicy(p, dto);
  }

  effectiveConfig(companyId: string, date: string, branchId?: string) {
    return this.repository.effectiveConfig(companyId, date, branchId);
  }

  resolveDay(companyId: string, date: string, branchId?: string) {
    return this.repository.resolveDay(companyId, date, branchId);
  }

  async resolveDayForEmployee(companyId: string, query: ResolveDayQuery) {
    const shift = query.employeeId
      ? await this.shifts.resolveEmployeeShift(
          companyId,
          query.employeeId,
          query.date,
        )
      : null;
    const employeeBranch = query.employeeId
      ? (shift?.branchId ??
        (await this.repository.employeeBranch(companyId, query.employeeId)))
      : null;
    if (query.branchId && employeeBranch && query.branchId !== employeeBranch) {
      throw new BadRequestException(
        'Branch does not match employee assignment',
      );
    }
    const branchId = query.branchId ?? employeeBranch ?? undefined;
    const day = await this.repository.resolveDay(
      companyId,
      query.date,
      branchId,
    );
    const isScheduledDay = shift?.workingDays
      ? shift.workingDays.includes(day.weekday)
      : !day.isWeekend;
    return {
      ...day,
      shift,
      isScheduledDay,
      isWorkingDay: isScheduledDay && day.holidays.length === 0,
    };
  }
}
