import { Inject, Injectable } from '@nestjs/common';
import { Relationship } from 'src/modules/Employee/domain/emergency-contact/enums/emergency-contact.enums';
import {
  EMERGENCY_CONTACT_REPOSITORY,
  type EmergencyContactRepository,
} from 'src/modules/Employee/domain/emergency-contact/repositories/emergency-contact.repository';
import { ConflictError, NotFoundError, ValidationError } from '../../errors';
import {
  EmergencyContact,
  EmergencycontactProps,
} from 'src/modules/Employee/domain/emergency-contact/entities/emergency-contact.entity';
import { EmployeeGuard } from '../../services/employee-guard';

const MAX_CONTACTS = 5;
type Scope = { companyId: string; employeeId: string; id: string };

@Injectable()
export class EmergencyContactUseCases {
  constructor(
    @Inject(EMERGENCY_CONTACT_REPOSITORY)
    private readonly contacts: EmergencyContactRepository,
    private readonly employees: EmployeeGuard,
  ) {}

  private async load({ companyId, employeeId, id }: Scope) {
    const contact = await this.contacts.findById(companyId, id);
    if (!contact || contact.employeeId !== employeeId)
      throw new NotFoundError('Emergency contact not found');
    return contact;
  }

  private async assertPhoneFree(c: EmergencyContact) {
    const { companyId, employeeId, phone } = c.snapshot;
    if (await this.contacts.existsPhone(companyId, employeeId, phone, c.id)) {
      throw new ConflictError(
        'This phone number is already registered for the employee',
      );
    }
  }

  async add(cmd: {
    companyId: string;
    employeeId: string;
    name: string;
    relationship: Relationship;
    phone: string;
  }) {
    await this.employees.assertEditable(cmd.companyId, cmd.employeeId);

    if (
      (await this.contacts.countByEmployee(cmd.companyId, cmd.employeeId)) >=
      MAX_CONTACTS
    ) {
      throw new ValidationError(
        `An employee can have at most ${MAX_CONTACTS} emergency contacts`,
      );
    }
    const contact = EmergencyContact.create(cmd);
    await this.assertPhoneFree(contact);

    await this.contacts.save(contact);
    return { id: contact.id };
  }

  async update(
    cmd: Scope &
      Partial<Pick<EmergencycontactProps, 'name' | 'relationship' | 'phone'>>,
  ) {
    const { companyId, employeeId, id, ...patch } = cmd;
    await this.employees.assertEditable(companyId, employeeId);

    const contact = await this.load({ companyId, employeeId, id });
    contact.update(patch);
    await this.assertPhoneFree(contact);

    await this.contacts.save(contact);
  }

  async remove(cmd: Scope) {
    await this.load(cmd);
    await this.contacts.remove(cmd.companyId, cmd.id);
  }
}
