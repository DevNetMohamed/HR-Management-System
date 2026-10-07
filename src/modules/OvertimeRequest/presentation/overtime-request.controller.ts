import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../application/ports/authorization.gateway';
import { SubmitOvertimeRequestUseCase } from '../application/use-cases/submit-overtime-request.use-case';
import { EditOvertimeRequestUseCase } from '../application/use-cases/edit-overtime-request.use-case';
import { CancelOvertimeRequestUseCase } from '../application/use-cases/cancel-overtime-request.use-case';
import { ReviewOvertimeByManagerUseCase } from '../application/use-cases/review-overtime-by-manager.use-case';
import { ReviewOvertimeByHrUseCase } from '../application/use-cases/review-overtime-by-hr.use-case';
import { OvertimeRequestReadService } from '../application/services/overtime-request-read.service';
import { TemporaryPrincipal } from './temporary-principal.decorator';
import {
  EditOvertimeRequestDto,
  MyOvertimeRequestsQueryDto,
  ReviewOvertimeRequestDto,
  ReviewQueueQueryDto,
  SubmitOvertimeRequestDto,
} from './dto/overtime-request.requests';

@Controller()
export class OvertimeRequestController {
  constructor(
    private readonly submit: SubmitOvertimeRequestUseCase,
    private readonly edit: EditOvertimeRequestUseCase,
    private readonly cancelRequest: CancelOvertimeRequestUseCase,
    private readonly managerReview: ReviewOvertimeByManagerUseCase,
    private readonly hrReview: ReviewOvertimeByHrUseCase,
    private readonly reads: OvertimeRequestReadService,
  ) {}

  @Post('overtime-requests')
  @HttpCode(HttpStatus.CREATED)
  submitRequest(
    @TemporaryPrincipal() principal: AuthenticatedPrincipal,
    @Body() dto: SubmitOvertimeRequestDto,
  ) {
    return this.submit.execute({
      principal,
      attendanceId: dto.attendanceId,
      minutes: dto.minutes,
      reason: dto.reason,
    });
  }

  @Patch('overtime-requests/:id')
  editRequest(
    @TemporaryPrincipal() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) requestId: string,
    @Headers('if-match') ifMatch: string | undefined,
    @Body() dto: EditOvertimeRequestDto,
  ) {
    return this.edit.execute({
      principal,
      requestId,
      minutes: dto.minutes,
      reason: dto.reason,
      expectedVersion: this.parseExpectedVersion(ifMatch),
    });
  }

  @Post('overtime-requests/:id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(
    @TemporaryPrincipal() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) requestId: string,
    @Headers('if-match') ifMatch: string | undefined,
  ): Promise<void> {
    await this.cancelRequest.execute({
      principal,
      requestId,
      expectedVersion: this.parseExpectedVersion(ifMatch),
    });
  }

  @Post('overtime-requests/:id/manager-decision')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reviewByManager(
    @TemporaryPrincipal() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) requestId: string,
    @Body() dto: ReviewOvertimeRequestDto,
  ): Promise<void> {
    await this.managerReview.execute({
      principal,
      requestId,
      decision: dto.decision,
    });
  }

  @Post('overtime-requests/:id/hr-decision')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reviewByHr(
    @TemporaryPrincipal() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) requestId: string,
    @Body() dto: ReviewOvertimeRequestDto,
  ): Promise<void> {
    await this.hrReview.execute({
      principal,
      requestId,
      decision: dto.decision,
    });
  }

  @Get('me/overtime-requests')
  listMine(
    @TemporaryPrincipal() principal: AuthenticatedPrincipal,
    @Query() query: MyOvertimeRequestsQueryDto,
  ) {
    return this.reads.listMine(principal, query);
  }

  @Get('overtime-requests/manager-queue')
  listManagerQueue(
    @TemporaryPrincipal() principal: AuthenticatedPrincipal,
    @Query() query: ReviewQueueQueryDto,
  ) {
    return this.reads.listManagerQueue(principal, query);
  }

  @Get('overtime-requests/hr-queue')
  listHrQueue(
    @TemporaryPrincipal() principal: AuthenticatedPrincipal,
    @Query() query: ReviewQueueQueryDto,
  ) {
    return this.reads.listHrQueue(principal, query);
  }

  @Get('overtime-requests/:id')
  getDetails(
    @TemporaryPrincipal() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) requestId: string,
  ) {
    return this.reads.getDetails(principal, requestId);
  }

  private parseExpectedVersion(value: string | undefined): number {
    const normalized = value?.trim().replace(/^W\//, '').replace(/^"|"$/g, '');
    const version = Number(normalized);

    if (!Number.isInteger(version) || version < 1) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'INVALID_VERSION_HEADER',
        message: 'If-Match must contain a positive integer version',
      });
    }

    return version;
  }
}
