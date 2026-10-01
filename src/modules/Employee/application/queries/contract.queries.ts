export interface ContractListItem {
  id: string;
  contractType: string;
  status: string;
  startDate: string;
  endDate: string | null;
  probationMonths: number | null;
  noticePeriodDays: number | null;
  documentUrl: string | null;
  terminationReason: string | null;
}
export interface ExpiringContractItem {
  contractId: string;
  employeeId: string;
  employeeNumber: string;
  contractType: string;
  endDate: string;
  daysLeft: number;
}
export interface ContractQueries {
  listByEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<ContractListItem[]>;
  expiringWithin(
    companyId: string,
    days: number,
    today: string,
  ): Promise<ExpiringContractItem[]>;
}
export const CONTRACT_QUERIES = Symbol('CONTRACT_QUERIES');
