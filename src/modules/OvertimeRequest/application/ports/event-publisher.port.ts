import { DomainEvent } from '../../domain/events/overtime-request.events';

export interface DomainEventPublisher {
  publish(events: readonly DomainEvent[]): Promise<void>;
}

export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');
