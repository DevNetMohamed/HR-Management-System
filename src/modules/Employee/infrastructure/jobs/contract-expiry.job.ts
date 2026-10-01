import { Injectable } from "@nestjs/common";
import { ExpireDueContractsUseCase } from "../../application/use-cases/Contract-UseCase/expire-due-contracts.use-case";
import { todayIn } from "../../domain/value-objects/iso-date";
import { Cron } from "@nestjs/schedule";

// infrastructure/jobs/contract-expiry.job.ts   (npm i @nestjs/schedule + ScheduleModule.forRoot() في AppModule)
@Injectable()
export class ContractExpiryJob {
  constructor(private readonly expire: ExpireDueContractsUseCase) {}

  @Cron('0 1 * * *', { timeZone: 'Africa/Cairo' })
  run() {
    return this.expire.execute(todayIn('Africa/Cairo'));
  }
}