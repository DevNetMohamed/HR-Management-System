export interface DocumentStoragePort {
  createUploadTarget(i: {
    key: string;
    mimeType: string;
    expiresInSec: number;
  }): Promise<{ uploadUrl: string; headers: Record<string, string> }>;
  head(
    key: string,
  ): Promise<{ sizeBytes: number; contentType: string | null } | null>;
  createDownloadUrl(i: {
    key: string;
    fileName: string;
    expiresInSec: number;
  }): Promise<string>;
  delete(key: string): Promise<void>;
}
export const DOCUMENT_STORAGE = Symbol('DOCUMENT_STORAGE');
