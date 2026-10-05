import { EmergencyContact } from '../entities/emergency-contact.entity';

export interface EmergencyContactRepository {
  findById(companyId: string, id: string): Promise<EmergencyContact | null>;
  save(contact: EmergencyContact): Promise<void>;
  remove(companyId: string, id: string): Promise<void>; 
  countByEmployee(companyId: string, employeeId: string): Promise<number>;
  existsPhone(
    companyId: string,
    employeeId: string,
    phone: string,
    excludeId?: string,
  ): Promise<boolean>;
}
export const EMERGENCY_CONTACT_REPOSITORY = Symbol(
  'EMERGENCY_CONTACT_REPOSITORY',
);
