import { addDays, validDate } from '../value-objects/calendar-date';
import type { HolidayOccurrence } from '../time-configuration.models';

export type HolidayDefinition = {
  id: string;
  name: string;
  branchId: string | null;
  recurrence: 'once' | 'yearly';
  startDate: string | null;
  endDate: string | null;
  startMonth: number | null;
  startDay: number | null;
  durationDays: number | null;
  firstYear: number | null;
  lastYear: number | null;
};

export type HolidayOverride = {
  holidayId: string;
  year: number;
  status: 'modified' | 'cancelled';
  startDate: string | null;
  endDate: string | null;
};

export function resolveHolidayOccurrences(
  holidays: HolidayDefinition[],
  overrides: HolidayOverride[],
  from: string,
  to: string,
): HolidayOccurrence[] {
  const byYear = new Map(
    overrides.map((override) => [
      `${override.holidayId}:${override.year}`,
      override,
    ]),
  );
  const result: HolidayOccurrence[] = [];
  for (const holiday of holidays) {
    if (holiday.recurrence === 'once') {
      if (
        holiday.startDate &&
        holiday.endDate &&
        holiday.startDate <= to &&
        holiday.endDate >= from
      ) {
        result.push({
          holidayId: holiday.id,
          name: holiday.name,
          branchId: holiday.branchId,
          occurrenceYear: Number(holiday.startDate.slice(0, 4)),
          startDate: holiday.startDate,
          endDate: holiday.endDate,
        });
      }
      continue;
    }
    for (
      let year = Number(from.slice(0, 4)) - 1;
      year <= Number(to.slice(0, 4));
      year++
    ) {
      if (
        holiday.firstYear === null ||
        year < holiday.firstYear ||
        (holiday.lastYear !== null && year > holiday.lastYear)
      )
        continue;

      const start = `${year}-${String(holiday.startMonth).padStart(2, '0')}-${String(holiday.startDay).padStart(2, '0')}`;
      const override = byYear.get(`${holiday.id}:${year}`);
      if (override?.status === 'cancelled') continue;
      if (!validDate(start) && override?.status !== 'modified') continue;
      const startDate = override?.startDate ?? start;
      const endDate =
        override?.endDate ?? addDays(start, holiday.durationDays! - 1);
      if (startDate <= to && endDate >= from) {
        result.push({
          holidayId: holiday.id,
          name: holiday.name,
          branchId: holiday.branchId,
          occurrenceYear: year,
          startDate,
          endDate,
        });
      }
    }
  }
  return result.sort(
    (a, b) =>
      a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name),
  );
}
