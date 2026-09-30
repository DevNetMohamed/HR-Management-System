import { DomainEvent } from '../../domain/events/employee.events';
export interface DomainEventPublisher {
  publish(events: DomainEvent[]): Promise<void>;
}
export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');
