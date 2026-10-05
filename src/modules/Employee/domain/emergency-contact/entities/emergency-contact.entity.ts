import { DomainError } from 'src/common/domain-error/DomainError.base';
import { isRelationship, Relationship } from '../enums/emergency-contact.enums';
import { Phone } from '../../value-objects/phone.vo';
import { randomUUID } from 'crypto';

export interface EmergencycontactProps {
  id: string;
  companyId: string;
  employeeId: string;
  name: string;
  relationship: string;
  phone: string;
}

type Editable = Pick<EmergencycontactProps, 'name' | 'relationship' | 'phone'>;

function normalize(i: Editable): Editable {
  const name = i.name?.trim();
  if (!name) throw new DomainError('Name is required', 'CONTACT_NAME_REQUIRED');
  if (name.length > 150)
    throw new DomainError('Name is too long', 'CONTACT_NAME_TOO_LONG');
  if (!isRelationship(i.relationship)) {
    throw new DomainError(
      'Invalid relationship',
      'CONTACT_INVALID_RELATIONSHIP',
    );
  }
  return {
    name,
    relationship: i.relationship,
    phone: Phone.create(i.phone).value,
  };
}

export class EmergencyContact {
  private constructor(private props: EmergencycontactProps) {}

  static create(props: Omit<EmergencycontactProps, 'id'>): EmergencyContact {
    if (!props.name?.trim())
      throw new DomainError(
        'Emergency Contact name is Required',
        'EMPLOYEE_NAME_REQUIRED',
      );
    if (!props.employeeId)
      throw new DomainError('Employee ID is Required', 'EMPLOYEE_ID_REQUIRED');
    if (!props.phone?.trim())
      throw new DomainError(
        'Employee Contact phone is Required',
        'EMPLOYEE_PHONE_REQUIRED',
      );

    return new EmergencyContact({
      id: randomUUID(),
      companyId: props.companyId,
      employeeId: props.employeeId,
      ...normalize(props),
    });
  }

  static restore(props: EmergencycontactProps): EmergencyContact {
    return new EmergencyContact(props);
  }

  update(patch: Partial<Editable>) {
    const defined = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined),
    );
    const next = normalize({ ...this.props, ...defined });
    Object.assign(this.props, next);
  }

  static rehydrate(porps: EmergencycontactProps): EmergencyContact {
    return new EmergencyContact({ ...porps });
  }

  get id(): string {
    return this.props.id;
  }

  get companyId(): string {
    return this.props.companyId;
  }

  get employeeId(): string {
    return this.props.employeeId;
  }

  get name(): string {
    return this.props.name;
  }

  get phone(): string {
    return this.props.phone;
  }

  get relationship(): string {
    return this.props.relationship;
  }

  get snapshot(): Readonly<EmergencycontactProps> {
    return { ...this.props };
  }
}
