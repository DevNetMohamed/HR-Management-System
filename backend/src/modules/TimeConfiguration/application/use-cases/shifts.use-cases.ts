import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../../OvertimeRequest/application/ports/authorization.gateway';
import {
  BranchShiftDto,
  EmployeeShiftDto,
  ShiftDto,
} from '../dto/time.requests';
import {
  SHIFTS_REPOSITORY,
  type ShiftsRepository,
} from '../ports/shifts.repository';
import { calculateShiftTiming } from '../../domain/shifts/shift-schedule';
import { validDate } from '../../domain/value-objects/calendar-date';

@Injectable()
export class ShiftsUseCases {
  constructor(
    @Inject(SHIFTS_REPOSITORY) private readonly repository: ShiftsRepository,
  ) {}

  private assertManage(p: AuthenticatedPrincipal): void {
    if (!p.permissions.includes('time_configuration.manage')) {
      throw new ForbiddenException('Time configuration permission required');
    }
  }

  private validate(dto: ShiftDto): number {
    if (!validDate(dto.effectiveFrom)) {
      throw new BadRequestException('Invalid calendar date');
    }
    if (
      dto.workingDays &&
      new Set(dto.workingDays).size !== dto.workingDays.length
    ) {
      throw new BadRequestException('Working days must be unique');
    }
    const timing = calculateShiftTiming(
      dto.startTime,
      dto.endTime,
      dto.breakMinutes,
    );
    if (!timing) {
      throw new BadRequestException(
        'Shift times and break duration are invalid',
      );
    }
    return timing.endDayOffset;
  }

  create(p: AuthenticatedPrincipal, dto: ShiftDto) {
    this.assertManage(p);
    return this.repository.create(p, dto, this.validate(dto));
  }

  addVersion(p: AuthenticatedPrincipal, shiftId: string, dto: ShiftDto) {
    this.assertManage(p);
    return this.repository.addVersion(p, shiftId, dto, this.validate(dto));
  }

  list(companyId: string, onDate?: string) {
    return this.repository.list(companyId, onDate);
  }

  assignBranch(
    p: AuthenticatedPrincipal,
    shiftId: string,
    dto: BranchShiftDto,
  ) {
    this.assertManage(p);
    return this.repository.assignBranch(p, shiftId, dto);
  }

  assignEmployee(p: AuthenticatedPrincipal, dto: EmployeeShiftDto) {
    this.assertManage(p);
    return this.repository.assignEmployee(p, dto);
  }

  resolveEmployeeShift(companyId: string, employeeId: string, date: string) {
    return this.repository.resolveEmployeeShift(companyId, employeeId, date);
  }

  endBranchAssignment(p: AuthenticatedPrincipal, id: string, endDate: string) {
    this.assertManage(p);
    return this.repository.endBranchAssignment(p, id, endDate);
  }

  endEmployeeAssignment(
    p: AuthenticatedPrincipal,
    id: string,
    endDate: string,
  ) {
    this.assertManage(p);
    return this.repository.endEmployeeAssignment(p, id, endDate);
  }

  retire(p: AuthenticatedPrincipal, shiftId: string) {
    this.assertManage(p);
    return this.repository.retire(p, shiftId);
  }
}
