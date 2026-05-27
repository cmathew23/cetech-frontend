"use client";

import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import {
  formatAdherencePercent,
  useAthleteWeeklyAdherence,
} from "@/components/dashboard/athlete/AthleteWeeklyAdherenceContext";

const PLACEHOLDER_KPI = [
  { title: "Training Load", value: "Placeholder", meta: "Status" },
  { title: "Recovery Score", value: "Placeholder", meta: "Status" },
] as const;

function nutritionKpiDisplay(
  nutritionKpi: ReturnType<typeof useAthleteWeeklyAdherence>["nutritionKpi"],
): string {
  switch (nutritionKpi.status) {
    case "loading":
      return "Loading…";
    case "awaiting_identifiers":
      return "Preparing…";
    case "error":
      return "Unable to load";
    case "ready":
      return nutritionKpi.percentLabel;
    case "empty":
      return "No nutrition adherence yet";
    default:
      return "Loading…";
  }
}

export function AthleteKpiRow() {
  const { nutritionKpi, summary } = useAthleteWeeklyAdherence();
  const overall = summary?.overall ?? null;

  const nutritionValue = nutritionKpiDisplay(nutritionKpi);

  let overallValue = "Placeholder";
  if (overall) {
    overallValue = formatAdherencePercent(overall.adherencePercent);
  } else if (nutritionKpi.status === "loading") {
    overallValue = "Loading…";
  } else if (nutritionKpi.status === "awaiting_identifiers") {
    overallValue = "Preparing…";
  } else if (nutritionKpi.status === "error") {
    overallValue = "Unable to load";
  }

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {PLACEHOLDER_KPI.map((item) => (
        <DashboardCardShell key={item.title} title={item.title} className="space-y-2">
          <p className="text-lg font-semibold text-textPrimary">{item.value}</p>
          <p className="text-xs text-textSecondary">{item.meta}</p>
        </DashboardCardShell>
      ))}
      <DashboardCardShell title="Nutrition Adherence" className="space-y-2">
        <p className="text-lg font-semibold text-textPrimary">{nutritionValue}</p>
      </DashboardCardShell>
      <DashboardCardShell title="Overall Adherence" className="space-y-2">
        <p className="text-lg font-semibold text-textPrimary">{overallValue}</p>
      </DashboardCardShell>
    </section>
  );
}
