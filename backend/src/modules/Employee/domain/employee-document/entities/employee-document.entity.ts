import {
  assertFileAllowed,
  assertKeyInScope,
  sanitizeFileName,
} from '../document-file/document-file';
import {
  DOCUMENT_TYPE_RULES,
  EmployeeDocumentType,
} from '../enums/employee-document.enums';
import { assertIsoDate, IsoDate } from '../../value-objects/iso-date';
import { DomainError } from 'src/common/domain-error/DomainError.base';

export interface DocumentFile {
  fileKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface EmployeeDocumentProps extends DocumentFile {
  id: string;
  companyId: string;
  employeeId: string;
  documentType: EmployeeDocumentType;
  issueDate: IsoDate | null;
  expiryDate: IsoDate | null;
  isVerified: boolean;
  verifiedBy: string | null;
  verifiedAt: Date | null;
}

export type Dates = { issueDate: IsoDate | null; expiryDate: IsoDate | null };
export const fail = (message: string, code: string) =>
  new DomainError(message, code);

export function validateDates(
  type: EmployeeDocumentType,
  d: Dates,
  today: IsoDate,
  rejectExpired: boolean,
) {
  if (d.issueDate !== null) {
    assertIsoDate(d.issueDate, 'issueDate');
    if (d.issueDate > today)
      throw fail(
        'Issue date cannot be in the future',
        'DOCUMENT_ISSUE_IN_FUTURE',
      );
  }
  if (d.expiryDate !== null) {
    assertIsoDate(d.expiryDate, 'expiryDate');
    if (d.issueDate !== null && d.expiryDate < d.issueDate) {
      throw fail(
        'Expiry date cannot be before issue date',
        'DOCUMENT_EXPIRY_BEFORE_ISSUE',
      );
    }
    if (rejectExpired && d.expiryDate < today)
      throw fail('Document is already expired', 'DOCUMENT_EXPIRED');
  }
  if (DOCUMENT_TYPE_RULES[type].requiresExpiry && d.expiryDate === null) {
    throw fail(
      'Expiry date is required for this document type',
      'DOCUMENT_EXPIRY_REQUIRED',
    );
  }
}

export function normalizeFile(
  f: DocumentFile,
  companyId: string,
  employeeId: string,
): DocumentFile {
  assertKeyInScope(f.fileKey, companyId, employeeId);
  assertFileAllowed(f.mimeType, f.sizeBytes);
  return {
    fileKey: f.fileKey,
    fileName: sanitizeFileName(f.fileName),
    mimeType: f.mimeType,
    sizeBytes: f.sizeBytes,
  };
}

export interface CreateDocumentInput {
  companyId: string;
  employeeId: string;
  documentType: EmployeeDocumentType;
  file: DocumentFile;
  issueDate?: IsoDate | null;
  expiryDate?: IsoDate | null;
}
