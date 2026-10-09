import type { AthleteWeeklyPlanJournal } from "@/lib/api/coachAthletePlanningReadiness";
import { getLocalDateKey, normalizeDateOnlyKey } from "@/lib/dateTime";

export function releasedSkillsTrainingPlanVersionId(
  journal: Pick<AthleteWeeklyPlanJournal, "domains">,
): string {
  const skills = journal.domains.SKILLS;
  if (skills.status !== "RELEASED") return "";
  return skills.versionId?.trim() ?? "";
}

export type WeeklyAdherencePlanRange = {
  weekStart: string;
  weekEnd: string;
};

export type WeeklyAdherenceSummaryQuery = {
  entityId: string;
  athleteId: string;
  weekStart: string;
  weekEnd: string;
};

export function weeklyAdherenceSummaryQueryKey(
  query: WeeklyAdherenceSummaryQuery,
): string {
  return `${query.entityId}|${query.athleteId}|${query.weekStart}|${query.weekEnd}`;
}

/**
 * Same GET params the dashboard uses after plan release:
 * journal entity/athlete when present, else caller identifiers, plus plan week.
 */
export function resolveWeeklyAdherenceSummaryQueryFromJournal(
  journal: AthleteWeeklyPlanJournal,
  fallback: { entityId: string; athleteId: string },
): WeeklyAdherenceSummaryQuery | null {
  const weekRange = resolveWeeklyAdherencePlanRangeFromJournal(journal);
  if (weekRange === null) return null;
  const entityId = journal.entityId.trim() || fallback.entityId.trim();
  const athleteId = journal.athleteId.trim() || fallback.athleteId.trim();
  if (entityId === "" || athleteId === "") return null;
  return {
    entityId,
    athleteId,
    weekStart: weekRange.weekStart,
    weekEnd: weekRange.weekEnd,
  };
}

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
