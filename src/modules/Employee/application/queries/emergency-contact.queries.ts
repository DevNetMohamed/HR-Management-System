export interface EmergencyContactItem {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}
export interface EmergencyContactQueries {
  listByEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<EmergencyContactItem[]>;
}
export const EMERGENCY_CONTACT_QUERIES = Symbol('EMERGENCY_CONTACT_QUERIES');
