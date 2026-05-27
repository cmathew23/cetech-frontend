import { getLocalDateKey } from "@/lib/dateTime";

/** Monday–Sunday calendar week in local timezone, as `YYYY-MM-DD`. */
export function getCurrentWeekDateRange(date: Date = new Date()): {
  weekStart: string;
  weekEnd: string;
} {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = local.getDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  const monday = new Date(local);
  monday.setDate(local.getDate() - daysFromMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: getLocalDateKey(monday),
    weekEnd: getLocalDateKey(sunday),
  };
}
