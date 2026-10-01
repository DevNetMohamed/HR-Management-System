import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ContractType } from 'src/modules/Employee/domain/employmee_contract/Enums/Employee-Contract-enums';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateContractRequest {
  @IsEnum(ContractType) contractType: ContractType;
  @Matches(DATE) startDate: string;
  @IsOptional() @Matches(DATE) endDate?: string;
  @IsOptional() @IsInt() @Min(0) @Max(12) probationMonths?: number;
  @IsOptional() @IsInt() @Min(0) @Max(180) noticePeriodDays?: number;
  @IsOptional() @IsString() @MaxLength(500) documentUrl?: string;
}

export class UpdateContractRequest {
  @IsOptional() @IsEnum(ContractType) contractType?: ContractType;
  @IsOptional() @Matches(DATE) startDate?: string;
  @IsOptional() @Matches(DATE) endDate?: string | null;
  @IsOptional() @IsInt() @Min(0) @Max(12) probationMonths?: number | null;
  @IsOptional() @IsInt() @Min(0) @Max(180) noticePeriodDays?: number | null;
}

export class AttachDocumentRequest {
  @IsOptional() @IsString() @MaxLength(500) documentUrl: string | null;
}

export class TerminateContractRequest {
  @Matches(DATE) terminationDate: string;
  @IsOptional() @IsString() @MaxLength(1000) reason?: string;
}

export class ExpiringContractsQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(365) days = 30;
}
