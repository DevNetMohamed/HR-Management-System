import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DomainEventPublisher } from "../../application/ports/event-publisher.port";
import { DomainEvent } from "../../domain/Employees/events/employee-terminated.events";

@Injectable()
export class NestEventPublisher implements DomainEventPublisher {
  constructor(private readonly emitter: EventEmitter2) {}
  async publish(events: DomainEvent[]) {
    for (const e of events) await this.emitter.emitAsync(e.name, e);
  }
}