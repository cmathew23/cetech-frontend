import { DashboardMetricTile } from "@/components/dashboard/shared/DashboardMetricTile";
import { dashboardMetricGridClass } from "@/components/dashboard/shared/dashboardTypography";
import type { ReactNode } from "react";

export type SportsMetricsPresentation = "dashboard" | "detail";

/** Backend Exercise Performance / sports-metrics unit enums and already-friendly labels. */
const UNIT_DISPLAY_LABELS: Record<string, string> = {
  PERCENTAGE: "%",
  PERCENT: "%",
  PCT: "%",
  "%": "%",
  FEET: "ft",
  FT: "ft",
  INCHES: "in",
  IN: "in",
  YARDS: "yd",
  YD: "yd",
  MILES_PER_HOUR: "mph",
  MPH: "mph",
};

export function formatDisplayUnit(unit: string | null): string {
  const raw = unit?.trim() ?? "";
  if (raw === "") return "";
  return UNIT_DISPLAY_LABELS[raw.toUpperCase()] ?? raw;
}

function formatAthleteMetricNumber(value: number | string): string {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  const rounded = Number(numeric.toFixed(1));
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatAthleteMetricValue(
  value: number | string | null,
  unit: string | null,
): string {
  if (value === null) return "";
  const formattedValue = formatAthleteMetricNumber(value);
  const unitLabel = formatDisplayUnit(unit);
  if (unitLabel === "") return formattedValue;
  if (unitLabel === "%") return `${formattedValue}%`;
  return `${formattedValue} ${unitLabel}`;
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
