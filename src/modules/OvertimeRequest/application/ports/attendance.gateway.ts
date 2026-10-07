export interface OvertimeAttendanceSource {
  id: string;
  employeeId: string;
  overtimeMinutes: number;
  checkOut: Date | null;
  workDate: string;
}

export interface AttendanceGateway {
  getOvertimeSource(
    companyId: string,
    attendanceId: string,
  ): Promise<OvertimeAttendanceSource | null>;
}

export const ATTENDANCE_GATEWAY = Symbol('ATTENDANCE_GATEWAY');
