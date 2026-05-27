import type { AthleteWeeklyPlanJournal } from "@/lib/api/coachAthletePlanningReadiness";
import { getLocalDateKey, normalizeDateOnlyKey } from "@/lib/dateTime";

export type WeeklyAdherencePlanRange = {
  weekStart: string;
  weekEnd: string;
};

export function resolveWeeklyAdherencePlanRangeFromJournal(
  journal: AthleteWeeklyPlanJournal,
): WeeklyAdherencePlanRange | null {
  const dayDates = journal.days
    .map((day) => normalizeDateOnlyKey(day.date))
    .filter((date): date is string => date !== null)
    .sort();
  const todayKey = getLocalDateKey();

  if (dayDates.includes(todayKey)) {
    return {
      weekStart: dayDates[0],
      weekEnd: dayDates[dayDates.length - 1],
    };
  }

  const weekStart = normalizeDateOnlyKey(journal.weekStartDate);
  const weekEnd = normalizeDateOnlyKey(journal.weekEndDate);
  if (weekStart !== null && weekEnd !== null) {
    return { weekStart, weekEnd };
  }

  if (dayDates.length > 0) {
    return {
      weekStart: dayDates[0],
      weekEnd: dayDates[dayDates.length - 1],
    };
  }

  return null;
}
