import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_BYTES,
} from 'src/modules/Employee/domain/employee-document/document-file/document-file';
import { EmployeeDocumentType } from 'src/modules/Employee/domain/employee-document/enums/employee-document.enums';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class RequestUploadRequest {
  @IsString() @IsNotEmpty() @MaxLength(255) fileName: string;
  @IsIn([...ALLOWED_MIME_TYPES]) mimeType: string;
  @IsInt() @Min(1) @Max(MAX_FILE_BYTES) sizeBytes: number;
}

export class AddDocumentRequest {
  @IsEnum(EmployeeDocumentType) documentType: EmployeeDocumentType;
  @IsString() @MaxLength(500) fileKey: string;
  @IsString() @IsNotEmpty() @MaxLength(255) fileName: string;
  @IsOptional() @Matches(DATE) issueDate?: string;
  @IsOptional() @Matches(DATE) expiryDate?: string;
}

export class UpdateDocumentDatesRequest {
  @IsOptional() @Matches(DATE) issueDate?: string | null;
  @IsOptional() @Matches(DATE) expiryDate?: string | null;
}

export class ReplaceDocumentFileRequest extends UpdateDocumentDatesRequest {
  @IsString() @MaxLength(500) fileKey: string;
  @IsString() @IsNotEmpty() @MaxLength(255) fileName: string;
}

export class ExpiringDocumentsQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(365) days = 30;
}
