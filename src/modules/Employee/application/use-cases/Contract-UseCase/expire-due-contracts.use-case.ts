import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CONTRACT_REPOSITORY,
  type EmploymentContractRepository,
} from 'src/modules/Employee/domain/employmee_contract/interfaces/employment-contract.repository';
import {
  EVENT_PUBLISHER,
  type DomainEventPublisher,
} from '../../ports/event-publisher.port';
import { IsoDate } from 'src/modules/Employee/domain/value-objects/iso-date';

@Injectable()
export class ExpireDueContractsUseCase {
  private readonly log = new Logger(ExpireDueContractsUseCase.name);
  constructor(
    @Inject(CONTRACT_REPOSITORY)
    private readonly contracts: EmploymentContractRepository,
    @Inject(EVENT_PUBLISHER) private readonly publisher: DomainEventPublisher,
  ) {}

  async execute(today: IsoDate, batchSize = 500): Promise<number> {
    const due = await this.contracts.findActiveEndedBefore(today, batchSize);
    let done = 0;
    for (const contract of due) {
      try {
        contract.expire(today);
        await this.contracts.save(contract);
        await this.publisher.publish(contract.pullEvents());
        done++;
      } catch (e) {
        this.log.error(`Failed to expire contract ${contract.id}`, e as Error);
      }
    }
    return done;
  }
}
