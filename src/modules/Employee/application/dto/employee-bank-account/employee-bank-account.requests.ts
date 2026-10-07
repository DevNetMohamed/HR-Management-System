import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class AddBankAccountRequest {
  @IsString() @IsNotEmpty() @MaxLength(150) bankName: string;
  @IsString() @IsNotEmpty() @MaxLength(50) iban: string;
  @IsOptional() @IsString() @MaxLength(40) accountNumber?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

export class UpdateBankAccountRequest {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(150) bankName?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(50) iban?: string;
  @IsOptional() @IsString() @MaxLength(40) accountNumber?: string | null;
}
