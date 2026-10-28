import type { AuthenticatedPrincipal } from '../../../OvertimeRequest/application/ports/authorization.gateway';
import type {
  AttendancePolicyDto,
  CalendarDto,
  DateRangeQuery,
  HolidayDto,
  HolidayOverrideDto,
  WorkweekDto,
} from '../dto/time.requests';
import type {
  AttendancePolicy,
  Calendar,
  HolidayOccurrence,
  ResolvedDay,
  Workweek,
} from '../../domain/time-configuration.models';

export const TIME_CONFIGURATION_REPOSITORY = Symbol(
  'TIME_CONFIGURATION_REPOSITORY',
);

export interface TimeConfigurationRepository {
  branchExists(companyId: string, branchId: string): Promise<boolean>;
  employeeBranch(companyId: string, employeeId: string): Promise<string | null>;
  createCalendar(
    p: AuthenticatedPrincipal,
    dto: CalendarDto,
  ): Promise<{ id: string }>;
  getCalendar(companyId: string): Promise<Calendar | null>;
  createHoliday(
    p: AuthenticatedPrincipal,
    dto: HolidayDto,
  ): Promise<{ id: string }>;
  updateHoliday(
    p: AuthenticatedPrincipal,
    id: string,
    dto: HolidayDto,
  ): Promise<{ id: string; replaces?: string }>;
  cancelHoliday(
    p: AuthenticatedPrincipal,
    id: string,
    reason: string,
  ): Promise<void>;
  overrideHoliday(
    p: AuthenticatedPrincipal,
    id: string,
    dto: HolidayOverrideDto,
  ): Promise<{ holidayId: string; year: number }>;
  listHolidays(
    companyId: string,
    query: DateRangeQuery,
  ): Promise<HolidayOccurrence[]>;
  setWorkweek(
    p: AuthenticatedPrincipal,
    dto: WorkweekDto,
  ): Promise<{ id: string }>;
  setAttendancePolicy(
    p: AuthenticatedPrincipal,
    dto: AttendancePolicyDto,
  ): Promise<{ id: string; version: number }>;
  effectiveConfig(
    companyId: string,
    date: string,
    branchId?: string,
  ): Promise<{
    workweek: Workweek | null;
    attendancePolicy: AttendancePolicy | null;
  }>;
  resolveDay(
    companyId: string,
    date: string,
    branchId?: string,
  ): Promise<ResolvedDay>;
}
