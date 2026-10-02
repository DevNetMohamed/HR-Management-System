import { ContractType } from "../enums/employment-contract.enums";
import { IsoDate } from "../../value-objects/iso-date";

export interface ContractTerms {
  contractType: ContractType;
  startDate: IsoDate;
  endDate: IsoDate | null;
  probationMonths: number | null;
  noticePeriodDays: number | null;
}

export interface EmploymentContractProps extends ContractTerms {
  id: string;
  companyId: string;
  employeeId: string;
  status: string;
  documentUrl: string | null;
  terminationReason: string | null;
}

export interface Period { start: IsoDate; end: IsoDate | null };
