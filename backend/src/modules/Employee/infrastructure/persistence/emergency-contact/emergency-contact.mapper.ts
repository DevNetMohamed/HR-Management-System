import {
  EmergencyContact,
  EmergencycontactProps,
} from 'src/modules/Employee/domain/emergency-contact/entities/emergency-contact.entity';
import { EmergencyContactOrmEntity } from './emergency-contacts.orm-entity';

export class EmergencyContactMapper {
  static toDomain(orm: EmergencyContactOrmEntity): EmergencyContact {
    return EmergencyContact.restore({
      id: orm.id,
      companyId: orm.companyId,
      employeeId: orm.employeeId,
      name: orm.name,
      relationship: orm.relationship,
      phone: orm.phone,
    });
  }
  static toOrm(p: Readonly<EmergencycontactProps>): EmergencyContactOrmEntity {
    return Object.assign(new EmergencyContactOrmEntity(), p);
  }
}
