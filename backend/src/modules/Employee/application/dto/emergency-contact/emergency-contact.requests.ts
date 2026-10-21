import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Relationship } from 'src/modules/Employee/domain/emergency-contact/enums/emergency-contact.enums';

const PHONE = /^\+?[\d\s\-()]{7,25}$/;

export class AddEmergencyContactRequest {
  @IsString() @IsNotEmpty() @MaxLength(150) name: string;
  @IsEnum(Relationship) relationship: Relationship;
  @IsString() @Matches(PHONE) phone: string;
}

export class UpdateEmergencyContactRequest {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(150) name?: string;
  @IsOptional() @IsEnum(Relationship) relationship?: Relationship;
  @IsOptional() @IsString() @Matches(PHONE) phone?: string;
}
