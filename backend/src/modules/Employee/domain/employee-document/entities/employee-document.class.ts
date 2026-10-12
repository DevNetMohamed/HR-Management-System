import { randomUUID } from "crypto";
import { IsoDate } from "../../value-objects/iso-date";
import { isEmployeeDocumentType } from "../enums/employee-document.enums";
import { CreateDocumentInput, Dates, DocumentFile, EmployeeDocumentProps, fail, normalizeFile, validateDates } from "./employee-document.entity";

export class EmployeeDocument {
  private constructor(private props: EmployeeDocumentProps) {}

  static create(i: CreateDocumentInput, today: IsoDate): EmployeeDocument {
    if (!isEmployeeDocumentType(i.documentType))
      throw fail('Invalid document type', 'DOCUMENT_INVALID_TYPE');
    const dates: Dates = {
      issueDate: i.issueDate ?? null,
      expiryDate: i.expiryDate ?? null,
    };
    validateDates(i.documentType, dates, today, true);

    return new EmployeeDocument({
      id: randomUUID(),
      companyId: i.companyId,
      employeeId: i.employeeId,
      documentType: i.documentType,
      ...normalizeFile(i.file, i.companyId, i.employeeId),
      ...dates,
      isVerified: false,
      verifiedBy: null,
      verifiedAt: null,
    });
  }

  static restore(props: EmployeeDocumentProps): EmployeeDocument {
    return new EmployeeDocument(props);
  }

  updateDates(patch: Partial<Dates>, today: IsoDate) {
    const next = this.mergeDates(patch);
    if (
      next.issueDate === this.props.issueDate &&
      next.expiryDate === this.props.expiryDate
    )
      return;

    validateDates(
      this.props.documentType,
      next,
      today,
      next.expiryDate !== this.props.expiryDate,
    );
    Object.assign(this.props, next);
    this.resetVerification();
  }

  replaceFile(file: DocumentFile, patch: Partial<Dates>, today: IsoDate) {
    const normalized = normalizeFile(
      file,
      this.props.companyId,
      this.props.employeeId,
    );
    if (normalized.fileKey === this.props.fileKey)
      throw fail('This is already the current file', 'DOCUMENT_SAME_FILE');

    const next = this.mergeDates(patch);
    validateDates(this.props.documentType, next, today, true);
    Object.assign(this.props, normalized, next);
    this.resetVerification();
  }

  verify(actorUserId: string, today: IsoDate, now: Date) {
    if (this.props.isVerified)
      throw fail('Document is already verified', 'DOCUMENT_ALREADY_VERIFIED');
    if (this.isExpired(today))
      throw fail('An expired document cannot be verified', 'DOCUMENT_EXPIRED');
    this.props.isVerified = true;
    this.props.verifiedBy = actorUserId;
    this.props.verifiedAt = now;
  }

  revokeVerification() {
    if (!this.props.isVerified)
      throw fail('Document is not verified', 'DOCUMENT_NOT_VERIFIED');
    this.resetVerification();
  }

  isExpired(today: IsoDate): boolean {
    return this.props.expiryDate !== null && this.props.expiryDate < today;
  }

  get id() {
    return this.props.id;
  }
  get companyId() {
    return this.props.companyId;
  }
  get employeeId() {
    return this.props.employeeId;
  }
  get snapshot(): Readonly<EmployeeDocumentProps> {
    return { ...this.props };
  }

  private mergeDates(patch: Partial<Dates>): Dates {
    return {
      issueDate:
        patch.issueDate !== undefined ? patch.issueDate : this.props.issueDate,
      expiryDate:
        patch.expiryDate !== undefined
          ? patch.expiryDate
          : this.props.expiryDate,
    };
  }
  private resetVerification() {
    this.props.isVerified = false;
    this.props.verifiedBy = null;
    this.props.verifiedAt = null;
  }
}
