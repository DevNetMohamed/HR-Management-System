export type ExpiryStatus = 'no_expiry' | 'valid' | 'expiring' | 'expired';

export interface EmployeeDocumentItem {
  id: string;
  documentType: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  issueDate: string | null;
  expiryDate: string | null;
  daysLeft: number | null;
  expiryStatus: ExpiryStatus;
  isVerified: boolean;
  verifiedAt: string | null;
}
export interface ExpiringDocumentItem {
  documentId: string;
  employeeId: string;
  employeeNumber: string;
  documentType: string;
  expiryDate: string;
  daysLeft: number;
  expiryStatus: ExpiryStatus;
}
export interface EmployeeDocumentQueries {
  listByEmployee(
    companyId: string,
    employeeId: string,
    today: string,
  ): Promise<EmployeeDocumentItem[]>;
  expiringWithin(
    companyId: string,
    days: number,
    today: string,
  ): Promise<ExpiringDocumentItem[]>;
}
export const EMPLOYEE_DOCUMENT_QUERIES = Symbol('EMPLOYEE_DOCUMENT_QUERIES');
