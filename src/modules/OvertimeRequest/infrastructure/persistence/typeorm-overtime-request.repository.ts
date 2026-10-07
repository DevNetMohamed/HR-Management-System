import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { OvertimeRequest } from '../../domain/overtime-request.entity';
import { type OvertimeRequestRepository } from '../../domain/overtime-request.repository';
import { DomainError } from '../../domain/errors/domain.errors';
import { OvertimeRequestAlreadyExistsError } from '../../application/errors';
import { OvertimeRequestOrmEntity } from './overtime-request.orm-entity';
import { OvertimeRequestMapper } from './overtime-request.mapper';

@Injectable()
export class TypeOrmOvertimeRequestRepository implements OvertimeRequestRepository {
  constructor(
    @InjectRepository(OvertimeRequestOrmEntity)
    private readonly orm: Repository<OvertimeRequestOrmEntity>,
  ) {}

  async findById(
    companyId: string,
    requestId: string,
  ): Promise<OvertimeRequest | null> {
    const row = await this.orm.findOne({
      where: {
        id: requestId,
        companyId,
      },
    });

    return row ? OvertimeRequestMapper.toDomain(row) : null;
  }

  async existsByAttendance(
    companyId: string,
    attendanceId: string,
  ): Promise<boolean> {
    return this.orm.exists({
      where: {
        companyId,
        attendanceId,
      },
    });
  }

  async insert(request: OvertimeRequest): Promise<void> {
    const snapshot = request.toSnapshot();

    try {
      await this.orm
        .createQueryBuilder()
        .insert()
        .into(OvertimeRequestOrmEntity)
        .values({
          id: snapshot.id,
          companyId: snapshot.companyId,
          employeeId: snapshot.employeeId,
          attendanceId: snapshot.attendanceId,
          minutes: snapshot.minutes,
          reason: snapshot.reason,
          status: snapshot.status,
          managerReviewRequired: snapshot.managerReviewRequired,
          managerReviewedBy: snapshot.managerReviewedBy,
          managerReviewedAt: snapshot.managerReviewedAt,
          hrReviewedBy: snapshot.hrReviewedBy,
          hrReviewedAt: snapshot.hrReviewedAt,
          version: snapshot.version,
          createdBy: snapshot.createdBy,
          createdAt: snapshot.createdAt,
          updatedBy: snapshot.updatedBy,
          updatedAt: snapshot.updatedAt,
        })
        .execute();
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new OvertimeRequestAlreadyExistsError();
      }

      throw error;
    }
  }

  async update(
    request: OvertimeRequest,
    expectedVersion: number,
  ): Promise<void> {
    const snapshot = request.toSnapshot();

    const result = await this.orm
      .createQueryBuilder()
      .update(OvertimeRequestOrmEntity)
      .set({
        minutes: snapshot.minutes,
        reason: snapshot.reason,
        status: snapshot.status,

        managerReviewRequired: snapshot.managerReviewRequired,
        managerReviewedBy: snapshot.managerReviewedBy,
        managerReviewedAt: snapshot.managerReviewedAt,

        hrReviewedBy: snapshot.hrReviewedBy,
        hrReviewedAt: snapshot.hrReviewedAt,

        version: snapshot.version,
        updatedBy: snapshot.updatedBy,
        updatedAt: snapshot.updatedAt,
      })
      .where('"id" = :requestId', {
        requestId: snapshot.id,
      })
      .andWhere('"company_id" = :companyId', {
        companyId: snapshot.companyId,
      })
      .andWhere('"version" = :expectedVersion', {
        expectedVersion,
      })
      .andWhere('"deleted_at" IS NULL')
      .execute();

    if (result.affected !== 1) {
      throw new DomainError(
        'The overtime request has been changed by another operation',
        'OVERTIME_VERSION_CONFLICT',
      );
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as {
      code?: string;
    };

    return driverError.code === '23505';
  }
}
