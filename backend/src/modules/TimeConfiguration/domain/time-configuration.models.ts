export type HolidayOccurrence = {
  holidayId: string;
  name: string;
  branchId: string | null;
  occurrenceYear: number;
  startDate: string;
  endDate: string;
};

export type Calendar = {
  id: string;
  name: string;
  timezone: string;
  createdAt: Date;
};

export type Workweek = { id: string; working_days: number[] };

export type AttendancePolicy = {
  id: string;
  overtime_enabled: boolean;
  overtime_min_minutes: number;
  overtime_max_minutes: number | null;
};

export type ResolvedDay = {
  date: string;
  branchId: string | null;
  weekday: number;
  isWeekend: boolean;
  holidays: HolidayOccurrence[];
  isWorkingDay: boolean;
  workweekId: string;
  attendancePolicyId: string | null;
};

export type ResolvedShift = {
  assignmentId: string;
  branchId: string;
  shiftId: string;
  code: string;
  versionId: string;
  version: number;
  name: string;
  startTime: string;
  endTime: string;
  endDayOffset: number;
  breakMinutes: number;
  workingDays: number[] | null;
  grossMinutes: number;
  netMinutes: number;
  isNightShift: boolean;
};
