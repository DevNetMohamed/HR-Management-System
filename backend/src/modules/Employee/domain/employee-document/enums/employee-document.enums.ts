export enum EmployeeDocumentType {
  NATIONAL_ID = 'national_id',
  PASSPORT = 'passport',
  DRIVING_LICENSE = 'driving_license',
  CERTIFICATE = 'certificate',
  CONTRACT = 'contract',
  OTHER = 'other',
}

export const isEmployeeDocumentType = (v: unknown): v is EmployeeDocumentType =>
  typeof v === 'string' &&
  (Object.values(EmployeeDocumentType) as string[]).includes(v);

export const DOCUMENT_TYPE_RULES: Record<
  EmployeeDocumentType,
  { requiresExpiry: boolean; onePerEmployee: boolean }
> = {
  [EmployeeDocumentType.NATIONAL_ID]: {
    requiresExpiry: true,
    onePerEmployee: true,
  },
  [EmployeeDocumentType.PASSPORT]: {
    requiresExpiry: true,
    onePerEmployee: true,
  },
  [EmployeeDocumentType.DRIVING_LICENSE]: {
    requiresExpiry: true,
    onePerEmployee: true,
  },
  [EmployeeDocumentType.CERTIFICATE]: {
    requiresExpiry: false,
    onePerEmployee: false,
  },
  [EmployeeDocumentType.CONTRACT]: {
    requiresExpiry: false,
    onePerEmployee: false,
  },
  [EmployeeDocumentType.OTHER]: {
    requiresExpiry: false,
    onePerEmployee: false,
  },
};
