import { getLocalDateKey, parseToLocalDate } from "@/lib/dateTime";

export type WearablePeriodDays = 7 | 15 | 30;

function shiftDateOnly(dateKey: string, daysDelta: number): string {
  const parsed = parseToLocalDate(dateKey);
  if (!parsed) return dateKey;
  const shifted = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  shifted.setDate(shifted.getDate() + daysDelta);
  return getLocalDateKey(shifted);
}

export function resolveWearableDateRange(
  days: WearablePeriodDays,
  anchorEndDate?: string,
): { startDate: string; endDate: string } {
  const normalizedDays = days === 15 || days === 30 ? days : 7;
  const endDate = anchorEndDate?.trim() ? anchorEndDate.trim() : getLocalDateKey();
  const startDate = shiftDateOnly(endDate, -(normalizedDays - 1));
  return { startDate, endDate };
}
