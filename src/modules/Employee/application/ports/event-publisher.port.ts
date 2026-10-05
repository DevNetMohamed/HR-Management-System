import { DomainEvent } from "src/common/domain-event/DomainEvent.base";

export interface DomainEventPublisher {
  publish(events: DomainEvent[]): Promise<void>;
}
export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');
