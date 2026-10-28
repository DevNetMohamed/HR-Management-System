export type ShiftTiming = {
  endDayOffset: number;
  grossMinutes: number;
};

export function calculateShiftTiming(
  startTime: string,
  endTime: string,
  breakMinutes: number,
): ShiftTiming | null {
  const start = Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3));
  const end = Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(3));
  if (start === end) return null;
  const endDayOffset = end < start ? 1 : 0;
  const grossMinutes = end - start + endDayOffset * 1440;
  if (breakMinutes >= grossMinutes) return null;
  return { endDayOffset, grossMinutes };
}
