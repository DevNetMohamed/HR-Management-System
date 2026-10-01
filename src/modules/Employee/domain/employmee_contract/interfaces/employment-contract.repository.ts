import { IsoDate } from "../../value-objects/iso-date";
import { EmploymentContract } from "../Entity/EmploymentContract";


export interface EmploymentContractRepository {
  findById(companyId: string, id: string): Promise<EmploymentContract | null>;
  findActiveByEmployee(companyId: string, employeeId: string): Promise<EmploymentContract[]>;
  save(contract: EmploymentContract): Promise<void>;
  remove(companyId: string, id: string): Promise<void>;                 
  findActiveEndedBefore(date: IsoDate, limit: number): Promise<EmploymentContract[]>;
}
export const CONTRACT_REPOSITORY = Symbol('CONTRACT_REPOSITORY');