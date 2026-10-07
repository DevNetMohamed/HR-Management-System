import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { DomainEventPublisher } from '../application/ports/event-publisher.port';
import type { DomainEvent } from '../domain/events/overtime-request.events';

@Injectable()
export class NestOvertimeEventPublisher implements DomainEventPublisher {
  constructor(private readonly emitter: EventEmitter2) {}

  async publish(events: readonly DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.emitter.emitAsync(event.name, event);
    }
  }
}
