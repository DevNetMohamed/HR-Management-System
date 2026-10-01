import { DomainEvent } from '../../domain/Employees/Events/employee.events';
export interface DomainEventPublisher {
  publish(events: DomainEvent[]): Promise<void>;
}
export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');
