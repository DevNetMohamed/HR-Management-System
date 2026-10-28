import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CalendarDto {
  @IsString() @IsNotEmpty() @MaxLength(200) name!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) timezone!: string;
}

export class HolidayDto {
  @IsString() @IsNotEmpty() @MaxLength(200) name!: string;
  @IsOptional() @IsUUID() branchId?: string;
  @IsIn(['once', 'yearly']) recurrence!: 'once' | 'yearly';
  @ValidateIf((o: HolidayDto) => o.recurrence === 'once')
  @Matches(DATE)
  startDate?: string;
  @ValidateIf((o: HolidayDto) => o.recurrence === 'once')
  @Matches(DATE)
  endDate?: string;
  @ValidateIf((o: HolidayDto) => o.recurrence === 'yearly')
  @IsInt()
  @Min(1)
  @Max(12)
  startMonth?: number;
  @ValidateIf((o: HolidayDto) => o.recurrence === 'yearly')
  @IsInt()
  @Min(1)
  @Max(31)
  startDay?: number;
  @ValidateIf((o: HolidayDto) => o.recurrence === 'yearly')
  @IsInt()
  @Min(1)
  @Max(366)
  durationDays?: number;
  @ValidateIf((o: HolidayDto) => o.recurrence === 'yearly')
  @IsInt()
  @Min(1)
  @Max(9999)
  firstYear?: number;
  @IsOptional() @IsInt() @Min(1) @Max(9999) lastYear?: number;
}

export class HolidayOverrideDto {
  @IsInt() @Min(1) @Max(9999) year!: number;
  @IsIn(['modified', 'cancelled']) status!: 'modified' | 'cancelled';
  @ValidateIf((o: HolidayOverrideDto) => o.status === 'modified')
  @Matches(DATE)
  startDate?: string;
  @ValidateIf((o: HolidayOverrideDto) => o.status === 'modified')
  @Matches(DATE)
  endDate?: string;
  @IsString() @IsNotEmpty() reason!: string;
}

export class CancelDto {
  @IsString() @IsNotEmpty() reason!: string;
}

export class DateRangeQuery {
  @Matches(DATE) from!: string;
  @Matches(DATE) to!: string;
  @IsOptional() @IsUUID() branchId?: string;
}

export class WorkweekDto {
  @IsOptional() @IsUUID() branchId?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  workingDays!: number[];
  @IsInt() @Min(1) @Max(7) firstDayOfWeek!: number;
  @IsInt() @Min(1) @Max(1440) standardDailyMinutes!: number;
  @Matches(DATE) effectiveFrom!: string;
}

export class AttendancePolicyDto {
  @IsOptional() @IsUUID() branchId?: string;
  @IsString() @IsNotEmpty() @MaxLength(200) name!: string;
  @IsInt() @Min(0) graceMinutesLate!: number;
  @IsInt() @Min(0) earlyLeaveGraceMin!: number;
  @IsOptional() @IsInt() @Min(1) halfDayAfterMin?: number;
  @IsOptional() @IsInt() @Min(1) absentAfterMin?: number;
  @IsBoolean() overtimeEnabled!: boolean;
  @IsInt() @Min(0) overtimeMinMinutes!: number;
  @IsOptional() @IsInt() @Min(0) overtimeMaxMinutes?: number;
  @Type(() => Number) @Min(0.001) overtimeMultiplier!: number;
  @IsBoolean() overtimeRequiresApproval!: boolean;
  @IsBoolean() requireGeofence!: boolean;
  @IsBoolean() allowRemote!: boolean;
  @IsIn(['manual_review', 'no_show_absent']) absenceRule!:
    'manual_review' | 'no_show_absent';
  @Matches(DATE) effectiveFrom!: string;
}

export class ShiftDto {
  @IsString() @IsNotEmpty() @MaxLength(50) code!: string;
  @IsString() @IsNotEmpty() @MaxLength(200) name!: string;
  @Matches(CLOCK) startTime!: string;
  @Matches(CLOCK) endTime!: string;
  @IsInt() @Min(0) breakMinutes!: number;
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  workingDays?: number[];
  @Matches(DATE) effectiveFrom!: string;
}

export class ShiftVersionDto extends ShiftDto {}

export class BranchShiftDto {
  @IsUUID() branchId!: string;
  @IsUUID() shiftVersionId!: string;
  @Matches(DATE) effectiveFrom!: string;
  @IsOptional() @Matches(DATE) effectiveTo?: string;
}

export class EmployeeShiftDto {
  @IsUUID() employeeId!: string;
  @IsUUID() branchId!: string;
  @IsUUID() shiftVersionId!: string;
  @Matches(DATE) startDate!: string;
  @IsOptional() @Matches(DATE) endDate?: string;
}

export class EndAssignmentDto {
  @Matches(DATE) endDate!: string;
}

export class ResolveDayQuery {
  @Matches(DATE) date!: string;
  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @IsUUID() employeeId?: string;
}

export class EffectiveQuery {
  @Matches(DATE) date!: string;
  @IsOptional() @IsUUID() branchId?: string;
}
