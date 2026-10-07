import { Inject, Injectable } from '@nestjs/common';
import {
  OVERTIME_REQUEST_REPOSITORY,
  type OvertimeRequestRepository,
} from '../../domain/overtime-request.repository';
import {
  AUTHORIZATION_GATEWAY,
  type AuthorizationGateway,
  type AuthenticatedPrincipal,
} from '../ports/authorization.gateway';
import {
  EVENT_PUBLISHER,
  type DomainEventPublisher,
} from '../ports/event-publisher.port';
import {
  NOTIFICATION_PORT,
  OvertimeNotificationType,
  type NotificationPort,
} from '../ports/notification.port';
import {
  OvertimeForbiddenError,
  OvertimeRequestNotFoundError,
} from '../errors';

export type ManagerDecision = 'APPROVE' | 'REJECT';

export interface ReviewOvertimeByManagerCommand {
  principal: AuthenticatedPrincipal;
  requestId: string;
  decision: ManagerDecision;
}

@Injectable()
export class ReviewOvertimeByManagerUseCase {
  constructor(
    @Inject(OVERTIME_REQUEST_REPOSITORY)
    private readonly requests: OvertimeRequestRepository,

    @Inject(AUTHORIZATION_GATEWAY)
    private readonly authorization: AuthorizationGateway,

    @Inject(EVENT_PUBLISHER)
    private readonly publisher: DomainEventPublisher,

    @Inject(NOTIFICATION_PORT)
    private readonly notifications: NotificationPort,
  ) {}

  async execute(command: ReviewOvertimeByManagerCommand): Promise<void> {
    const request = await this.requests.findById(
      command.principal.companyId,
      command.requestId,
    );

    if (!request) {
      throw new OvertimeRequestNotFoundError();
    }

    const allowed = await this.authorization.canReviewAsManager({
      principal: command.principal,
      targetEmployeeId: request.employeeId,
    });

    if (!allowed) {
      throw new OvertimeForbiddenError();
    }

    const storedVersion = request.version;
    const reviewedAt = new Date();

    if (command.decision === 'APPROVE') {
      request.managerApprove({
        managerUserId: command.principal.userId,
        reviewedAt,
      });
    } else {
      request.managerReject({
        managerUserId: command.principal.userId,
        reviewedAt,
      });
    }

    const events = request.pullEvents();

    if (events.length === 0) {
      return;
    }

    await this.requests.update(request, storedVersion);
    await this.publisher.publish(events);

    if (command.decision === 'REJECT') {
      await this.notifications.send({
        companyId: request.companyId,
        employeeId: request.employeeId,
        requestId: request.id,
        type: OvertimeNotificationType.MANAGER_REJECTED,
      });
    }
  }
}
