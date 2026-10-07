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

export type HrDecision = 'APPROVE' | 'REJECT';

export interface ReviewOvertimeByHrCommand {
  principal: AuthenticatedPrincipal;
  requestId: string;
  decision: HrDecision;
}

@Injectable()
export class ReviewOvertimeByHrUseCase {
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

  async execute(command: ReviewOvertimeByHrCommand): Promise<void> {
    const request = await this.requests.findById(
      command.principal.companyId,
      command.requestId,
    );

    if (!request) {
      throw new OvertimeRequestNotFoundError();
    }

    const allowed = await this.authorization.canReviewAsHr({
      principal: command.principal,
    });

    if (!allowed) {
      throw new OvertimeForbiddenError();
    }

    const storedVersion = request.version;
    const reviewedAt = new Date();

    if (command.decision === 'APPROVE') {
      request.hrApprove({
        hrUserId: command.principal.userId,
        reviewedAt,
      });
    } else {
      request.hrReject({
        hrUserId: command.principal.userId,
        reviewedAt,
      });
    }

    const events = request.pullEvents();

    if (events.length === 0) {
      return;
    }

    await this.requests.update(request, storedVersion);
    await this.publisher.publish(events);

    await this.notifications.send({
      companyId: request.companyId,
      employeeId: request.employeeId,
      requestId: request.id,
      type:
        command.decision === 'APPROVE'
          ? OvertimeNotificationType.HR_APPROVED
          : OvertimeNotificationType.HR_REJECTED,
    });
  }
}
