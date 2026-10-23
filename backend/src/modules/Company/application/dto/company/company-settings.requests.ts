import { ArrayNotEmpty, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min, MinLength, Matches } from 'class-validator';

const CHANNELS = ['in_app', 'email', 'sms', 'push'];
const PRIORITIES = ['urgent', 'high', 'normal'];
const LANGUAGES = ['bilingual', 'en', 'ar'];

export class QuietHoursRequest {
  @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) start: string;
  @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) end: string;
}

export class NotificationRuleRequest {
  @IsString() @MinLength(2) @MaxLength(160) name: string;
  @IsString() @MinLength(2) @MaxLength(100) eventKey: string;
  @IsArray() @ArrayNotEmpty() @IsString({ each: true }) recipients: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) recipientRoles?: string[];
  @IsArray() @ArrayNotEmpty() @IsIn(CHANNELS, { each: true }) channels: string[];
  @IsOptional() @IsIn(PRIORITIES) priority?: string;
  @IsOptional() @IsIn(LANGUAGES) language?: string;
  @IsOptional() @IsInt() @Min(0) @Max(10080) deliveryDelayMinutes?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10080) reminderIntervalMinutes?: number;
  @IsOptional() @IsInt() @Min(0) @Max(20) maxReminders?: number;
  @IsOptional() @IsObject() quietHours?: QuietHoursRequest | null;
  @IsOptional() @IsIn(['none', 'daily']) digestOption?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) escalationPath?: string[];
  @IsOptional() @IsInt() @Min(1) @Max(10) retryAttempts?: number;
  @IsOptional() @IsInt() @Min(1) @Max(1440) retryIntervalMinutes?: number;
  @IsOptional() @IsIn(CHANNELS) fallbackChannel?: string | null;
  @IsOptional() @IsString() @MaxLength(200) templateSubject?: string | null;
  @IsOptional() @IsString() @MaxLength(10000) templateBody?: string | null;
  @IsOptional() @IsIn(['active', 'draft']) status?: 'active' | 'draft';
}

export class UpdateNotificationRuleRequest {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) eventKey?: string;
  @IsOptional() @IsArray() @ArrayNotEmpty() @IsString({ each: true }) recipients?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) recipientRoles?: string[];
  @IsOptional() @IsArray() @ArrayNotEmpty() @IsIn(CHANNELS, { each: true }) channels?: string[];
  @IsOptional() @IsIn(PRIORITIES) priority?: string;
  @IsOptional() @IsIn(LANGUAGES) language?: string;
  @IsOptional() @IsInt() @Min(0) @Max(10080) deliveryDelayMinutes?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10080) reminderIntervalMinutes?: number;
  @IsOptional() @IsInt() @Min(0) @Max(20) maxReminders?: number;
  @IsOptional() @IsObject() quietHours?: QuietHoursRequest | null;
  @IsOptional() @IsIn(['none', 'daily']) digestOption?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) escalationPath?: string[];
  @IsOptional() @IsInt() @Min(1) @Max(10) retryAttempts?: number;
  @IsOptional() @IsInt() @Min(1) @Max(1440) retryIntervalMinutes?: number;
  @IsOptional() @IsIn(CHANNELS) fallbackChannel?: string | null;
  @IsOptional() @IsString() @MaxLength(200) templateSubject?: string | null;
  @IsOptional() @IsString() @MaxLength(10000) templateBody?: string | null;
  @IsOptional() @IsIn(['active', 'draft']) status?: 'active' | 'draft';
}

export class SaveCompanySetupDraftRequest {
  @IsObject() configuration: Record<string, unknown>;
}

export class PublishCompanyConfigurationRequest {
  @IsDateString() effectiveDate: string;
  @IsString() @MinLength(5) @MaxLength(500) changeSummary: string;
  @IsBoolean() acknowledgeWarnings: boolean;
}
