import { DashboardMetricTile } from "@/components/dashboard/shared/DashboardMetricTile";
import { dashboardMetricGridClass } from "@/components/dashboard/shared/dashboardTypography";
import type { ReactNode } from "react";

export type SportsMetricsPresentation = "dashboard" | "detail";

export function formatDisplayUnit(unit: string | null): string {
  const raw = unit?.trim() ?? "";
  if (raw === "") return "";
  const upper = raw.toUpperCase();
  if (upper === "PERCENT" || upper === "PCT" || raw === "%") return "%";
  if (upper === "FEET" || upper === "FT" || raw === "ft") return "ft";
  return raw;
}

export function formatAthleteMetricValue(
  value: number | string | null,
  unit: string | null,
): string {
  if (value === null) return "";
  const unitLabel = formatDisplayUnit(unit);
  if (unitLabel === "") return String(value);
  if (unitLabel === "%") return `${value}%`;
  return `${value} ${unitLabel}`;
}

export function formatScoreOutOf100(value: number): string {
  return `${value} / 100`;
}

export function formatTaxonomyAreaLabel(value: string | null): string {
  const key = value?.trim() ?? "";
  if (key === "") return "";
  return key
    .split("_")
    .map((part) =>
      part === "" ? part : `${part.charAt(0).toUpperCase()}${part.slice(1)}`,
    )
    .join(" ");
}

export function formatTargetHint(
  targetValue: number | null,
  unit: string | null,
  direction: string | null,
): string | null {
  if (targetValue === null) return null;
  const formatted = formatAthleteMetricValue(targetValue, unit);
  if (direction === "HIGHER_IS_BETTER") return `Target ≥ ${formatted}`;
  if (direction === "LOWER_IS_BETTER") return `Target ≤ ${formatted}`;
  return `Target: ${formatted}`;
}

export function formatAthleteTrendLabel(direction: string | null): string {
  if (direction === "UP") return "Improving ↑";
  if (direction === "DOWN") return "Declining ↓";
  if (direction === "NEUTRAL") return "Stable";
  return direction?.trim() ?? "";
}

export function formatTargetMetCaption(targetMet: boolean): string {
  return targetMet ? "TARGET MET" : "TARGET NOT MET";
}

export function AthletePerformanceStat({
  title,
  value,
  caption,
  supporting,
  className,
}: {
  title: string;
  value: string;
  caption?: string;
  supporting?: ReactNode;
  className?: string;
}) {
  return (
    <DashboardMetricTile
      title={title}
      value={value}
      caption={caption}
      supporting={supporting}
      className={className}
    />
  );
}

export function athletePerformanceGridClass(count: number): string {
  return dashboardMetricGridClass(count);
}
