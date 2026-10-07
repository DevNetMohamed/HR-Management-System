import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { OvertimeRequestStatus } from '../../domain/enums';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class SubmitOvertimeRequestDto {
  @IsUUID()
  attendanceId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  minutes: number;

  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason: string;
}

export class EditOvertimeRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minutes: number;

  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason: string;
}

export class ReviewOvertimeRequestDto {
  @IsIn(['APPROVE', 'REJECT'])
  decision: 'APPROVE' | 'REJECT';
}

export class MyOvertimeRequestsQueryDto {
  @IsOptional()
  @IsEnum(OvertimeRequestStatus)
  status?: OvertimeRequestStatus;

  @IsOptional()
  @Matches(DATE)
  from?: string;

  @IsOptional()
  @Matches(DATE)
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class ReviewQueueQueryDto extends MyOvertimeRequestsQueryDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
