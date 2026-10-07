import {
  OvertimeRequest,
  type OvertimeRequestProps,
} from '../../domain/overtime-request.entity';
import { OvertimeRequestOrmEntity } from './overtime-request.orm-entity';

export class OvertimeRequestMapper {
  static toDomain(row: OvertimeRequestOrmEntity): OvertimeRequest {
    return OvertimeRequest.restore({
      id: row.id,
      companyId: row.companyId,
      employeeId: row.employeeId,
      attendanceId: row.attendanceId,
      minutes: row.minutes,
      reason: row.reason,
      status: row.status,

      managerReviewRequired: row.managerReviewRequired,
      managerReviewedBy: row.managerReviewedBy,
      managerReviewedAt: row.managerReviewedAt,

      hrReviewedBy: row.hrReviewedBy,
      hrReviewedAt: row.hrReviewedAt,

      version: row.version,

      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedBy: row.updatedBy,
      updatedAt: row.updatedAt,
    });
  }

  static toOrm(props: OvertimeRequestProps): OvertimeRequestOrmEntity {
    const row = new OvertimeRequestOrmEntity();

    row.id = props.id;
    row.companyId = props.companyId;
    row.employeeId = props.employeeId;
    row.attendanceId = props.attendanceId;
    row.minutes = props.minutes;
    row.reason = props.reason;
    row.status = props.status;

    row.managerReviewRequired = props.managerReviewRequired;
    row.managerReviewedBy = props.managerReviewedBy;
    row.managerReviewedAt = props.managerReviewedAt;

    row.hrReviewedBy = props.hrReviewedBy;
    row.hrReviewedAt = props.hrReviewedAt;

    row.version = props.version;

    row.createdBy = props.createdBy;
    row.createdAt = props.createdAt;
    row.updatedBy = props.updatedBy;
    row.updatedAt = props.updatedAt;

    row.deletedAt = null;
    row.metadata = null;

    return row;
  }
}
