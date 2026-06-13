"use client";

import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import {
  formatAdherencePercent,
  useAthleteWeeklyAdherence,
} from "@/components/dashboard/athlete/AthleteWeeklyAdherenceContext";
import type { WeeklyAdherenceDomainKey } from "@/lib/api/weeklyAdherence";

const KPI_TILES: {
  key: "overall" | WeeklyAdherenceDomainKey;
  title: string;
}[] = [
  { key: "overall", title: "Overall" },
  { key: "SKILL", title: "Skills" },
  { key: "NUTRITION", title: "Nutrition" },
  { key: "STRENGTH_CONDITIONING", title: "S&C" },
];

function resolveKpiValue(
  phase: ReturnType<typeof useAthleteWeeklyAdherence>["phase"],
  percent: number | null | undefined,
): string {
  switch (phase) {
    case "hidden":
      return "—";
    case "loading":
      return "Loading…";
    case "awaiting_identifiers":
      return "Preparing…";
    case "error":
      return "Unable to load";
    case "loaded":
      if (percent === null || percent === undefined) {
        return "No data yet";
      }
      return formatAdherencePercent(percent);
    default:
      return "Loading…";
  }
}

export function AthleteKpiRow() {
  const { phase, summary } = useAthleteWeeklyAdherence();

  if (phase === "hidden") {
    return null;
  }

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {KPI_TILES.map((tile) => {
        const percent =
          tile.key === "overall"
            ? summary?.overall?.adherencePercent
            : summary?.domains[tile.key]?.adherencePercent;

        return (
          <DashboardCardShell key={tile.key} title={tile.title} className="space-y-2">
            <p className="text-lg font-semibold text-textPrimary">
              {resolveKpiValue(phase, percent)}
            </p>
          </DashboardCardShell>
        );
      })}
    </section>
  );
}
