"use client";

import { AthleteWeeklyAdherenceSection } from "@/components/dashboard/athlete/AthleteWeeklyAdherenceSection";

/**
 * @deprecated Use AthleteWeeklyAdherenceSection on the athlete dashboard.
 * Kept as a thin alias so older imports still resolve to the shared provider flow.
 */
export function AthleteWeeklyAdherenceOverview() {
  return <AthleteWeeklyAdherenceSection />;
}
