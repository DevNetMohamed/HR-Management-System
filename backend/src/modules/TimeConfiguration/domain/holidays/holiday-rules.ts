import { validDate } from '../value-objects/calendar-date';

export type HolidayInput = {
  recurrence: 'once' | 'yearly';
  startDate?: string;
  endDate?: string;
  startMonth?: number;
  startDay?: number;
  durationDays?: number;
  firstYear?: number;
  lastYear?: number;
};

export function validateHolidayInput(input: HolidayInput): string | null {
  if (input.recurrence === 'once') {
    if (
      !input.startDate ||
      !input.endDate ||
      !validDate(input.startDate) ||
      !validDate(input.endDate)
    ) {
      return 'Invalid calendar date';
    }
    if (input.endDate < input.startDate) return 'End date precedes start date';
    if (
      [
        input.startMonth,
        input.startDay,
        input.durationDays,
        input.firstYear,
        input.lastYear,
      ].some((value) => value !== undefined)
    ) {
      return 'Yearly fields are not allowed for a one-time holiday';
    }
    return null;
  }
  if (input.startDate !== undefined || input.endDate !== undefined) {
    return 'Dates are not allowed for a yearly holiday';
  }
  if (
    input.startMonth === undefined ||
    input.startDay === undefined ||
    input.durationDays === undefined ||
    input.firstYear === undefined ||
    !validDate(
      `2000-${String(input.startMonth).padStart(2, '0')}-${String(input.startDay).padStart(2, '0')}`,
    )
  )
    return 'Invalid month and day';
  if (input.lastYear !== undefined && input.lastYear < input.firstYear) {
    return 'Last year precedes first year';
  }
  return null;
}
