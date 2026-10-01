import { Injectable } from "@nestjs/common";
import { DomainEventPublisher } from "../application/ports/event-publisher.port";
import { DomainEvent } from "../domain/Employees/Events/employee.events";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class NestEventPublisher implements DomainEventPublisher {
  constructor(private readonly emitter: EventEmitter2) {}
  async publish(events: DomainEvent[]) {
    for (const e of events) await this.emitter.emitAsync(e.name, e);
  }
}