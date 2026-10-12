import { DomainError } from '../../../../../common/domain-error/DomainError.base';

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const fail = (message: string, code: string) => new DomainError(message, code);

export function sanitizeFileName(raw: string): string {
  const base = (raw ?? '')
    .split(/[\\/]/)
    .pop()!
    .replace(/[^\p{L}\p{N}._\- ]+/gu, '_')
    .trim();
  if (!base || base === '.' || base === '..')
    throw fail('Invalid file name', 'DOCUMENT_INVALID_FILE_NAME');
  return base.slice(-255);
}

export const documentKeyPrefix = (companyId: string, employeeId: string) =>
  `companies/${companyId}/employees/${employeeId}/documents/`;

export function buildDocumentKey(
  companyId: string,
  employeeId: string,
  uploadId: string,
  fileName: string,
): string {
  const safe = sanitizeFileName(fileName)
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .slice(-100);
  return `${documentKeyPrefix(companyId, employeeId)}${uploadId}/${safe}`;
}

export function assertKeyInScope(
  key: string,
  companyId: string,
  employeeId: string,
): void {
  const prefix = documentKeyPrefix(companyId, employeeId);
  const valid =
    typeof key === 'string' &&
    key.length <= 500 &&
    key.startsWith(prefix) &&
    /^[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,100}$/.test(key.slice(prefix.length));
  if (!valid) throw fail('Invalid file reference', 'DOCUMENT_INVALID_FILE_KEY');
}

export function assertFileAllowed(mimeType: string, sizeBytes: number): void {
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw fail(
      'Only PDF, JPEG and PNG files are allowed',
      'DOCUMENT_UNSUPPORTED_TYPE',
    );
  }
  if (
    !Number.isInteger(sizeBytes) ||
    sizeBytes < 1 ||
    sizeBytes > MAX_FILE_BYTES
  ) {
    throw fail(
      `File size must be between 1 byte and ${MAX_FILE_BYTES / (1024 * 1024)}MB`,
      'DOCUMENT_INVALID_SIZE',
    );
  }
}
