import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  NotificationPort,
  SendOvertimeNotificationInput,
} from '../application/ports/notification.port';

export const OVERTIME_IN_APP_NOTIFICATION_REQUESTED =
  'overtime.notification.in_app.requested';

@Injectable()
export class NestInAppNotificationAdapter implements NotificationPort {
  constructor(private readonly emitter: EventEmitter2) {}

  async send(input: SendOvertimeNotificationInput): Promise<void> {
    await this.emitter.emitAsync(OVERTIME_IN_APP_NOTIFICATION_REQUESTED, input);
  }
}
