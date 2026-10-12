import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DocumentStoragePort } from '../../modules/Employee/application/ports/document-storage.port';

@Injectable()
export class S3DocumentStorage implements DocumentStoragePort {
  private readonly s3 = new S3Client({ region: process.env.AWS_REGION });
  private readonly bucket: string;

  constructor() {
    if (!process.env.DOCUMENTS_BUCKET)
      throw new Error('DOCUMENTS_BUCKET is not set');
    this.bucket = process.env.DOCUMENTS_BUCKET;
  }

  async createUploadTarget({
    key,
    mimeType,
    expiresInSec,
  }: {
    key: string;
    mimeType: string;
    expiresInSec: number;
  }) {
    const uploadUrl = await getSignedUrl(
      this.s3,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType,
      }),
      { expiresIn: expiresInSec },
    );
    return { uploadUrl, headers: { 'Content-Type': mimeType } };
  }

  async head(key: string) {
    try {
      const r = await this.s3.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return {
        sizeBytes: r.ContentLength ?? 0,
        contentType: r.ContentType ?? null,
      };
    } catch (e: any) {
      if (e?.name === 'NotFound' || e?.$metadata?.httpStatusCode === 404)
        return null;
      throw e;
    }
  }

  createDownloadUrl({
    key,
    fileName,
    expiresInSec,
  }: {
    key: string;
    fileName: string;
    expiresInSec: number;
  }) {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      }),
      { expiresIn: expiresInSec },
    );
  }

  async delete(key: string) {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
