import { IsEmail, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Max, Min } from "class-validator";
import { EmployeeStatus, EmploymentType, JobChangeType } from "../../domain/enums";
import { Type } from 'class-transformer';
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class HireEmployeeRequest {
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
  @Matches(DATE) hireDate: string;
  @IsOptional() @IsEnum(EmploymentType) employmentType?: EmploymentType;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsUUID() positionId?: string;
  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @IsUUID() managerId?: string;
}

export class ChangeAssignmentRequest {
  @IsIn([JobChangeType.PROMOTION, JobChangeType.TRANSFER, JobChangeType.DEMOTION])
  changeType!: JobChangeType.PROMOTION | JobChangeType.TRANSFER | JobChangeType.DEMOTION;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsUUID() positionId?: string;
  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @IsUUID() managerId?: string;
  @Matches(DATE) effectiveDate!: string;
  @IsOptional() @IsString() reason?: string;
}

export class TerminateEmployeeRequest { @Matches(DATE) lastWorkingDay!: string; }

export class ListEmployeesQuery {
  @IsOptional() @IsEnum(EmployeeStatus) status?: EmployeeStatus;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}