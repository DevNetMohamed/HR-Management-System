import type { AuthenticatedPrincipal } from '../../../OvertimeRequest/application/ports/authorization.gateway';
import type {
  BranchShiftDto,
  EmployeeShiftDto,
  ShiftDto,
} from '../dto/time.requests';
import type { ResolvedShift } from '../../domain/time-configuration.models';

export const SHIFTS_REPOSITORY = Symbol('SHIFTS_REPOSITORY');

export interface ShiftsRepository {
  create(
    p: AuthenticatedPrincipal,
    dto: ShiftDto,
    endDayOffset: number,
  ): Promise<{ id: string; versionId: string; version: number }>;
  addVersion(
    p: AuthenticatedPrincipal,
    shiftId: string,
    dto: ShiftDto,
    endDayOffset: number,
  ): Promise<{ id: string; versionId: string; version: number }>;
  list(companyId: string, onDate?: string): Promise<Record<string, unknown>[]>;
  assignBranch(
    p: AuthenticatedPrincipal,
    shiftId: string,
    dto: BranchShiftDto,
  ): Promise<{ id: string }>;
  assignEmployee(
    p: AuthenticatedPrincipal,
    dto: EmployeeShiftDto,
  ): Promise<{ id: string }>;
  resolveEmployeeShift(
    companyId: string,
    employeeId: string,
    date: string,
  ): Promise<ResolvedShift | null>;
  endBranchAssignment(
    p: AuthenticatedPrincipal,
    id: string,
    endDate: string,
  ): Promise<{ id: string; endDate: string }>;
  endEmployeeAssignment(
    p: AuthenticatedPrincipal,
    id: string,
    endDate: string,
  ): Promise<{ id: string; endDate: string }>;
  retire(p: AuthenticatedPrincipal, shiftId: string): Promise<void>;
}
