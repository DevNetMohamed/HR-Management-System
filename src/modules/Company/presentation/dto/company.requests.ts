import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

const SUBDOMAIN = /^[a-z0-9-]+$/;

export class CreateCompanyRequest {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @Matches(SUBDOMAIN) subdomain: string;
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() taxNumber?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() locale?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() plan?: string;
}
