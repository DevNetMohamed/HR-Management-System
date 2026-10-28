import { Inject, Injectable } from '@nestjs/common';
import {
  EMPLOYEE_DOCUMENT_REPOSITORY,
  type EmployeeDocumentRepository,
} from 'src/modules/Employee/domain/employee-document/repositories/employee-document.repository';
import {
  IsoDate,
  todayIn,
} from 'src/modules/Employee/domain/value-objects/iso-date';
import {
  DOCUMENT_STORAGE,
  type DocumentStoragePort,
} from '../../ports/document-storage.port';
import { EmployeeGuard } from '../../services/employee-guard';
import {
  assertFileAllowed,
  assertKeyInScope,
  buildDocumentKey,
} from 'src/modules/Employee/domain/employee-document/document-file/document-file';
import { randomUUID } from 'crypto';
import {
  DOCUMENT_TYPE_RULES,
  EmployeeDocumentType,
} from 'src/modules/Employee/domain/employee-document/enums/employee-document.enums';
import { ConflictError, NotFoundError, ValidationError } from '../../errors';
import { EmployeeDocument } from 'src/modules/Employee/domain/employee-document/entities/employee-document.class';

const MAX_DOCUMENTS = 50;
const UPLOAD_URL_TTL_SEC = 300;
const DOWNLOAD_URL_TTL_SEC = 60;
type Scope = { companyId: string; employeeId: string; id: string };
type DatesPatch = { issueDate?: IsoDate | null; expiryDate?: IsoDate | null };

@Injectable()
export class EmployeeDocumentUseCases {
  constructor(
    @Inject(EMPLOYEE_DOCUMENT_REPOSITORY)
    private readonly documents: EmployeeDocumentRepository,
    @Inject(DOCUMENT_STORAGE) private readonly storage: DocumentStoragePort,
    private readonly employees: EmployeeGuard,
  ) {}

  private async load({ companyId, employeeId, id }: Scope) {
    const document = await this.documents.findById(companyId, id);
    if (!document || document.employeeId !== employeeId)
      throw new NotFoundError('Document not found');
    return document;
  }

  private async inspectUploadedFile(
    companyId: string,
    employeeId: string,
    fileKey: string,
    fileName: string,
  ) {
    assertKeyInScope(fileKey, companyId, employeeId);

    const head = await this.storage.head(fileKey);
    if (!head)
      throw new ValidationError(
        'The file was not uploaded or the upload link expired',
      );

    const mimeType = head.contentType ?? '';
    try {
      assertFileAllowed(mimeType, head.sizeBytes);
    } catch (e) {
      await this.storage.delete(fileKey).catch(() => undefined);
      throw e;
    }
    return { fileKey, fileName, mimeType, sizeBytes: head.sizeBytes };
  }

  private async assertTypeFree(d: EmployeeDocument) {
    const { companyId, employeeId, documentType } = d.snapshot;
    if (
      DOCUMENT_TYPE_RULES[documentType].onePerEmployee &&
      (await this.documents.existsOfType(
        companyId,
        employeeId,
        documentType,
        d.id,
      ))
    ) {
      throw new ConflictError(
        `Employee already has a ${documentType} document. Replace its file instead`,
      );
    }
  }

  // TODO: توقيت الشركة (companies.timezone) لما الـ Organization module يتبني
  private today(): IsoDate {
    return todayIn('Africa/Cairo');
  }

  async requestUpload(cmd: {
    companyId: string;
    employeeId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }) {
    await this.employees.assertEditable(cmd.companyId, cmd.employeeId);
    assertFileAllowed(cmd.mimeType, cmd.sizeBytes);

    const fileKey = buildDocumentKey(
      cmd.companyId,
      cmd.employeeId,
      randomUUID(),
      cmd.fileName,
    );
    const target = await this.storage.createUploadTarget({
      key: fileKey,
      mimeType: cmd.mimeType,
      expiresInSec: UPLOAD_URL_TTL_SEC,
    });
    return {
      fileKey,
      uploadUrl: target.uploadUrl,
      headers: target.headers,
      expiresInSec: UPLOAD_URL_TTL_SEC,
    };
  }

  async add(cmd: {
    companyId: string;
    employeeId: string;
    documentType: EmployeeDocumentType;
    fileKey: string;
    fileName: string;
    issueDate?: IsoDate | null;
    expiryDate?: IsoDate | null;
  }) {
    await this.employees.assertEditable(cmd.companyId, cmd.employeeId);
    if (
      (await this.documents.countByEmployee(cmd.companyId, cmd.employeeId)) >=
      MAX_DOCUMENTS
    ) {
      throw new ValidationError(
        `An employee can have at most ${MAX_DOCUMENTS} documents`,
      );
    }

    const file = await this.inspectUploadedFile(
      cmd.companyId,
      cmd.employeeId,
      cmd.fileKey,
      cmd.fileName,
    );
    const document = EmployeeDocument.create({ ...cmd, file }, this.today());
    await this.assertTypeFree(document);

    await this.documents.save(document);
    return { id: document.id };
  }

  async updateDates(cmd: Scope & DatesPatch) {
    const { companyId, employeeId, id, ...patch } = cmd;
    await this.employees.assertEditable(companyId, employeeId);
    const document = await this.load({ companyId, employeeId, id });
    document.updateDates(patch, this.today());
    await this.documents.save(document);
  }

  async replaceFile(
    cmd: Scope & DatesPatch & { fileKey: string; fileName: string },
  ) {
    const { companyId, employeeId, id, fileKey, fileName, ...patch } = cmd;
    await this.employees.assertEditable(companyId, employeeId);
    const document = await this.load({ companyId, employeeId, id });

    const file = await this.inspectUploadedFile(
      companyId,
      employeeId,
      fileKey,
      fileName,
    );
    document.replaceFile(file, patch, this.today());
    await this.documents.save(document);
  }

  async verify(cmd: Scope & { actorUserId: string }) {
    await this.employees.assertExists(cmd.companyId, cmd.employeeId);
    const document = await this.load(cmd);
    document.verify(cmd.actorUserId, this.today(), new Date());
    await this.documents.save(document);
    // TODO(identity): (محتاج ربط user ← employee)
  }

  async revokeVerification(cmd: Scope) {
    await this.employees.assertExists(cmd.companyId, cmd.employeeId);
    const document = await this.load(cmd);
    document.revokeVerification();
    await this.documents.save(document);
  }

  async remove(cmd: Scope) {
    await this.employees.assertEditable(cmd.companyId, cmd.employeeId);
    await this.load(cmd);
    await this.documents.remove(cmd.companyId, cmd.id);
  }

  async downloadUrl(cmd: Scope) {
    await this.employees.assertExists(cmd.companyId, cmd.employeeId);
    const { fileKey, fileName } = (await this.load(cmd)).snapshot;
    // TODO(audit): سجّل كل تحميل في audit_logs لما الـ Audit module يتبني
    const url = await this.storage.createDownloadUrl({
      key: fileKey,
      fileName,
      expiresInSec: DOWNLOAD_URL_TTL_SEC,
    });
    return { url, expiresInSec: DOWNLOAD_URL_TTL_SEC };
  }
}
