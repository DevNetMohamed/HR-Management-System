import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  type AttendanceGateway,
  type OvertimeAttendanceSource,
} from '../application/ports/attendance.gateway';

interface AttendanceRow {
  id: string;
  employee_id: string;
  overtime_minutes: number;
  check_out: Date | null;
  work_date: string;
}

@Injectable()
export class SqlAttendanceGateway implements AttendanceGateway {
  constructor(private readonly dataSource: DataSource) {}

  async getOvertimeSource(
    companyId: string,
    attendanceId: string,
  ): Promise<OvertimeAttendanceSource | null> {
    const rows = await this.dataSource.query<AttendanceRow[]>(
      `
        SELECT
          id,
          employee_id,
          overtime_minutes,
          check_out,
          work_date::text AS work_date
        FROM attendance_records
        WHERE company_id = $1
          AND id = $2
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [companyId, attendanceId],
    );

    const row = rows[0];

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      employeeId: row.employee_id,
      overtimeMinutes: row.overtime_minutes,
      checkOut: row.check_out,
      workDate: row.work_date,
    };
  }
}
