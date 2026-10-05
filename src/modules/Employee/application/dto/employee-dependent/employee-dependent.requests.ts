import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { DependentRelationship } from 'src/modules/Employee/domain/employee-dependents/enums/employee-dependent.enums';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class AddDependentRequest {
  @IsString() @IsNotEmpty() @MaxLength(150) name: string;
  @IsEnum(DependentRelationship) relationship: DependentRelationship;
  @IsOptional() @Matches(DATE) dateOfBirth?: string;
  @IsOptional() @IsBoolean() coveredByInsurance?: boolean;
}

export class UpdateDependentRequest {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(150) name?: string;
  @IsOptional()
  @IsEnum(DependentRelationship)
  relationship?: DependentRelationship;
  @IsOptional() @Matches(DATE) dateOfBirth?: string | null;
}

export class SetInsuranceRequest {
  @IsBoolean() covered: boolean;
}
