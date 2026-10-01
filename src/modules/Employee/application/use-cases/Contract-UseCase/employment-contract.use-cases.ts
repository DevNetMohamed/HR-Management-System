import { Inject, Injectable } from '@nestjs/common';
import { CreateContractInput } from 'src/modules/Employee/domain/employmee_contract/Entity/employment-contract.entity';
import {
  CONTRACT_REPOSITORY,
  type EmploymentContractRepository,
} from 'src/modules/Employee/domain/employmee_contract/interfaces/employment-contract.repository';
import {
  EVENT_PUBLISHER,
  type DomainEventPublisher,
} from '../../ports/event-publisher.port';
import { EmployeeGuard } from '../../services/employee-guard';
import { NotFoundError, ValidationError } from '../../errors';
import { EmploymentContract } from 'src/modules/Employee/domain/employmee_contract/Entity/EmploymentContract';
import { ContractTerms } from 'src/modules/Employee/domain/employmee_contract/interfaces/employee-contract-interface';
import { ContractPolicy } from 'src/modules/Employee/domain/employmee_contract/contract-policy/contract.policy';

export type CreateContractCommand = {
  companyId: string;
  employeeId: string;
} & CreateContractInputBody;
type CreateContractInputBody = Omit<
  CreateContractInput,
  'companyId' | 'employeeId'
>;
type Scope = { companyId: string; employeeId: string; id: string };

@Injectable()
export class EmploymentContractUseCases {
  constructor(
    @Inject(CONTRACT_REPOSITORY)
    private readonly contracts: EmploymentContractRepository,
    @Inject(EVENT_PUBLISHER) private readonly publisher: DomainEventPublisher,
    private readonly employees: EmployeeGuard,
  ) {}

  private async load({ companyId, employeeId, id }: Scope) {
    const contract = await this.contracts.findById(companyId, id);
    if (!contract || contract.employeeId !== employeeId)
      throw new NotFoundError('Contract not found');
    return contract;
  }
  private assertNotBeforeHire(contract: EmploymentContract, hireDate: string) {
    if (contract.snapshot.startDate < hireDate) {
      throw new ValidationError(
        'Contract cannot start before the employee hire date',
      );
    }
  }

  async create(cmd: CreateContractCommand) {
    const { hireDate } = await this.employees.assertCanHaveContract(
      cmd.companyId,
      cmd.employeeId,
    );
    const contract = EmploymentContract.create(cmd);
    this.assertNotBeforeHire(contract, hireDate);
    await this.contracts.save(contract);
    return { id: contract.id };
  }

  async updateTerms(cmd: Scope & Partial<ContractTerms>) {
    const { companyId, employeeId, id, ...patch } = cmd;
    const contract = await this.load({ companyId, employeeId, id });
    contract.updateTerms(patch);
    const { hireDate } = await this.employees.assertCanHaveContract(
      companyId,
      employeeId,
    );
    this.assertNotBeforeHire(contract, hireDate);
    await this.contracts.save(contract);
  }

  async attachDocument(cmd: Scope & { documentUrl: string | null }) {
    const contract = await this.load(cmd);
    contract.attachDocument(cmd.documentUrl);
    await this.contracts.save(contract);
  }

  async activate(cmd: Scope) {
    const contract = await this.load(cmd);
    await this.employees.assertCanHaveContract(cmd.companyId, cmd.employeeId);

    const active = await this.contracts.findActiveByEmployee(
      cmd.companyId,
      cmd.employeeId,
    );
    ContractPolicy.assertCanActivate(contract, active);
    contract.activate();

    await this.contracts.save(contract);
    await this.publisher.publish(contract.pullEvents());
  }

  async terminate(cmd: Scope & { terminationDate: string; reason?: string }) {
    const contract = await this.load(cmd);
    contract.terminate(cmd.terminationDate, cmd.reason);
    await this.contracts.save(contract);
    await this.publisher.publish(contract.pullEvents());
  }

  async remove(cmd: Scope) {
    const contract = await this.load(cmd);
    contract.assertRemovable();
    await this.contracts.remove(cmd.companyId, cmd.id);
  }
}
