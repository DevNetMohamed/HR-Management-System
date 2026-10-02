import { randomUUID } from 'crypto';
import {
  DomainError,
  InvalidStatusTransitionError,
} from '../../errors/domain.errors';
import { Email } from '../../value-objects/email.vo';
import { EmployeeStatus as S, EmploymentType, JobChangeType } from '../enums/Employee-enums';
import { JobHistoryEntry } from '../../job-history/job-history-entry';
import { DomainEvent, EmployeeTerminated } from '../events/employee-terminated.events';
import { EmployeeHired } from '../events/employee-hired.event';
import { EmployeeAssignmentChanged } from '../events/employee-assignment-changed.event';

export type IsoDate = string; // 'YYYY-MM-DD'
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const assertDate = (v: string, field: string) => {
  if (!ISO_DATE.test(v))
    throw new DomainError(`${field} must be YYYY-MM-DD`, 'INVALID_DATE');
};

export interface EmployeeProps {
  id: string;
  companyId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: IsoDate | null;
  gender: string | null;
  nationality: string | null;
  nationalId: string | null;
  maritalStatus: string | null;
  departmentId: string | null;
  positionId: string | null;
  branchId: string | null;
  managerId: string | null;
  hireDate: IsoDate;
  terminationDate: IsoDate | null;
  employmentType: EmploymentType;
  status: S;
  profilePhotoUrl: string | null;
}

export type HireInput = Pick<
  EmployeeProps,
  | 'companyId'
  | 'employeeNumber'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'hireDate'
> &
  Partial<Omit<EmployeeProps, 'id' | 'status' | 'terminationDate'>>;

export interface AssignmentChange {
  changeType:
    JobChangeType.PROMOTION | JobChangeType.TRANSFER | JobChangeType.DEMOTION;
  departmentId?: string | null;
  positionId?: string | null;
  branchId?: string | null;
  managerId?: string | null;
  effectiveDate: IsoDate;
  reason?: string;
}

const TRANSITIONS: Record<S, S[]> = {
  [S.ONBOARDING]: [S.ACTIVE, S.TERMINATED],
  [S.ACTIVE]: [S.ON_LEAVE, S.OFFBOARDING],
  [S.ON_LEAVE]: [S.ACTIVE, S.OFFBOARDING],
  [S.OFFBOARDING]: [S.TERMINATED, S.ACTIVE],
  [S.TERMINATED]: [],
};

export class Employee {
  private events: DomainEvent[] = [];
  private newHistory: JobHistoryEntry[] = [];

  private constructor(private props: EmployeeProps) {}

  // ---------- Factories ----------
  static hire(i: HireInput): Employee {
    if (!i.firstName?.trim() || !i.lastName?.trim()) {
      throw new DomainError(
        'First and last name are required',
        'EMPLOYEE_NAME_REQUIRED',
      );
    }
    assertDate(i.hireDate, 'hireDate');

    const emp = new Employee({
      id: randomUUID(),
      companyId: i.companyId,
      employeeNumber: i.employeeNumber,
      firstName: i.firstName.trim(),
      lastName: i.lastName.trim(),
      email: Email.create(i.email).value,
      phone: i.phone ?? null,
      dateOfBirth: i.dateOfBirth ?? null,
      gender: i.gender ?? null,
      nationality: i.nationality ?? null,
      nationalId: i.nationalId ?? null,
      maritalStatus: i.maritalStatus ?? null,
      departmentId: i.departmentId ?? null,
      positionId: i.positionId ?? null,
      branchId: i.branchId ?? null,
      managerId: i.managerId ?? null,
      hireDate: i.hireDate,
      terminationDate: null,
      employmentType: i.employmentType ?? EmploymentType.FULLTIME,
      status: S.ONBOARDING,
      profilePhotoUrl: i.profilePhotoUrl ?? null,
    });

    emp.record(JobChangeType.HIRE, i.hireDate, 'Hired');
    emp.events.push(
      new EmployeeHired(
        emp.companyId,
        emp.id,
        i.hireDate,
        emp.props.departmentId,
        emp.props.positionId,
      ),
    );
    return emp;
  }

  static restore(props: EmployeeProps): Employee {
    return new Employee(props);
  }

  // ---------- Status lifecycle ----------
  activate() {
    this.moveTo(S.ACTIVE);
  }
  startLeave() {
    this.moveTo(S.ON_LEAVE);
  }
  endLeave() {
    this.moveTo(S.ACTIVE);
  }
  startOffboarding() {
    this.moveTo(S.OFFBOARDING);
  }
  cancelOffboarding() {
    this.moveTo(S.ACTIVE);
  }

  terminate(lastWorkingDay: IsoDate) {
    assertDate(lastWorkingDay, 'lastWorkingDay');
    if (lastWorkingDay < this.props.hireDate) {
      throw new DomainError(
        'Termination date cannot be before hire date',
        'EMPLOYEE_TERMINATION_BEFORE_HIRE',
      );
    }
    this.moveTo(S.TERMINATED);
    this.props.terminationDate = lastWorkingDay;
    this.events.push(
      new EmployeeTerminated(this.companyId, this.id, lastWorkingDay),
    );
  }

  // ---------- Assignment (promotion / transfer / demotion) ----------
  changeAssignment(c: AssignmentChange) {
    if (![S.ACTIVE, S.ON_LEAVE].includes(this.props.status)) {
      throw new DomainError(
        'Only active employees can be reassigned',
        'EMPLOYEE_NOT_ASSIGNABLE',
      );
    }
    assertDate(c.effectiveDate, 'effectiveDate');
    if (c.effectiveDate < this.props.hireDate) {
      throw new DomainError(
        'Effective date cannot be before hire date',
        'EMPLOYEE_EFFECTIVE_BEFORE_HIRE',
      );
    }
    if (c.managerId === this.props.id) {
      throw new DomainError(
        'Employee cannot be their own manager',
        'EMPLOYEE_SELF_MANAGER',
      );
    }

    const fields = [
      'departmentId',
      'positionId',
      'branchId',
      'managerId',
    ] as const;
    const changed = fields.filter(
      (f) => c[f] !== undefined && c[f] !== this.props[f],
    );
    if (!changed.length)
      throw new DomainError('No changes detected', 'EMPLOYEE_NO_CHANGES');

    changed.forEach((f) => {
      this.props[f] = c[f] as string | null;
    });

    this.record(c.changeType, c.effectiveDate, c.reason);
    this.events.push(
      new EmployeeAssignmentChanged(
        this.companyId,
        this.id,
        c.changeType,
        c.effectiveDate,
      ),
    );
  }

  // ---------- Profile ----------
  updateProfile(
    p: Partial<
      Pick<
        EmployeeProps,
        | 'firstName'
        | 'lastName'
        | 'phone'
        | 'dateOfBirth'
        | 'gender'
        | 'nationality'
        | 'nationalId'
        | 'maritalStatus'
        | 'profilePhotoUrl'
      >
    >,
  ) {
    if (this.props.status === S.TERMINATED) {
      throw new DomainError(
        'Terminated employee cannot be edited',
        'EMPLOYEE_TERMINATED',
      );
    }
    if (p.firstName !== undefined && !p.firstName.trim())
      throw new DomainError('First name is required', 'EMPLOYEE_NAME_REQUIRED');
    if (p.lastName !== undefined && !p.lastName.trim())
      throw new DomainError('Last name is required', 'EMPLOYEE_NAME_REQUIRED');
    if (p.dateOfBirth) assertDate(p.dateOfBirth, 'dateOfBirth');
    Object.entries(p).forEach(([k, v]) => {
      if (v !== undefined) (this.props as any)[k] = v;
    });
  }

  // ---------- Read access ----------
  get id() {
    return this.props.id;
  }
  get companyId() {
    return this.props.companyId;
  }
  get status() {
    return this.props.status;
  }
  toSnapshot(): EmployeeProps {
    return { ...this.props };
  }

  // ---------- Infrastructure hooks ----------
  get pendingJobHistory(): readonly JobHistoryEntry[] {
    return this.newHistory;
  }
  markPersisted() {
    this.newHistory = [];
  }
  pullEvents(): DomainEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  // ---------- Internals ----------
  private moveTo(next: S) {
    if (!TRANSITIONS[this.props.status].includes(next)) {
      throw new InvalidStatusTransitionError(this.props.status, next);
    }
    this.props.status = next;
  }

  private record(
    changeType: JobChangeType,
    effectiveDate: IsoDate,
    reason?: string,
  ) {
    this.newHistory.push({
      id: randomUUID(),
      companyId: this.props.companyId,
      employeeId: this.props.id,
      departmentId: this.props.departmentId,
      positionId: this.props.positionId,
      managerId: this.props.managerId,
      changeType,
      effectiveDate,
      reason: reason ?? null,
    });
  }
}
