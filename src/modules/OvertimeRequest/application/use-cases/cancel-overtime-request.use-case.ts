import { Inject, Injectable } from '@nestjs/common';
import {
  OVERTIME_REQUEST_REPOSITORY,
  type OvertimeRequestRepository,
} from '../../domain/overtime-request.repository';
import {
  EVENT_PUBLISHER,
  type DomainEventPublisher,
} from '../ports/event-publisher.port';
import type { AuthenticatedPrincipal } from '../ports/authorization.gateway';
import {
  OvertimeForbiddenError,
  OvertimeRequestNotFoundError,
} from '../errors';

export interface CancelOvertimeRequestCommand {
  principal: AuthenticatedPrincipal;
  requestId: string;
  expectedVersion: number;
}

@Injectable()
export class CancelOvertimeRequestUseCase {
  constructor(
    @Inject(OVERTIME_REQUEST_REPOSITORY)
    private readonly requests: OvertimeRequestRepository,

    @Inject(EVENT_PUBLISHER)
    private readonly publisher: DomainEventPublisher,
  ) {}

  async execute(command: CancelOvertimeRequestCommand): Promise<void> {
    const { principal } = command;

    if (!principal.employeeId) {
      throw new OvertimeForbiddenError();
    }

    const request = await this.requests.findById(
      principal.companyId,
      command.requestId,
    );

    if (!request) {
      throw new OvertimeRequestNotFoundError();
    }

    const storedVersion = request.version;

    request.cancel({
      actorEmployeeId: principal.employeeId,
      actorUserId: principal.userId,
      expectedVersion: command.expectedVersion,
      cancelledAt: new Date(),
    });

    await this.requests.update(request, storedVersion);
    await this.publisher.publish(request.pullEvents());
  }
}
