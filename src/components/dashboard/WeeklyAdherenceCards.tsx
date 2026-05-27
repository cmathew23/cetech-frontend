"use client";

import { Card } from "@/components/ui/Card";
import { formatDateOnly } from "@/lib/dateTime";
import { cn } from "@/lib/utils";
import type {
  WeeklyAdherenceDomainKey,
  WeeklyAdherenceDomainSummary,
  WeeklyAdherenceOverallSummary,
  WeeklyAdherenceSummary,
} from "@/lib/api/weeklyAdherence";

const DOMAIN_LABELS: Record<WeeklyAdherenceDomainKey, string> = {
  SKILL: "Skills",
  NUTRITION: "Nutrition",
  STRENGTH_CONDITIONING: "S&C",
};

const DOMAIN_ORDER: WeeklyAdherenceDomainKey[] = [
  "SKILL",
  "NUTRITION",
  "STRENGTH_CONDITIONING",
];

export type WeeklyAdherenceMetricTile = {
  key: string;
  label: string;
  adherencePercent: number;
  loggedSessions: number;
  plannedSessions: number;
};

export function buildWeeklyAdherenceMetricTiles(
  summary: WeeklyAdherenceSummary,
): WeeklyAdherenceMetricTile[] {
  const tiles: WeeklyAdherenceMetricTile[] = [];

  if (summary.overall != null) {
    tiles.push(metricTileFromSummary("overall", "Overall", summary.overall));
  }

  for (const domainKey of DOMAIN_ORDER) {
    const domain = summary.domains[domainKey];
    if (domain) {
      tiles.push(
        metricTileFromSummary(domainKey, DOMAIN_LABELS[domainKey], domain),
      );
    }
  }

  return tiles;
}

function metricTileFromSummary(
  key: string,
  label: string,
  data: WeeklyAdherenceDomainSummary | WeeklyAdherenceOverallSummary,
): WeeklyAdherenceMetricTile {
  return {
    key,
    label,
    adherencePercent: data.adherencePercent,
    loggedSessions: data.loggedSessions,
    plannedSessions: data.plannedSessions,
  };
}

export function formatAdherencePercentDisplay(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded % 1 === 0 ? Math.round(rounded) : rounded.toFixed(1)}%`;
}

function percentToneClass(percent: number): string {
  if (percent >= 80) return "text-emerald-700";
  if (percent >= 50) return "text-amber-700";
  return "text-slate-600";
}

function AdherenceMetricTile({ tile }: { tile: WeeklyAdherenceMetricTile }) {
  return (
    <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 px-3 py-2.5 shadow-sm">
      <p className="text-xs font-medium tracking-wide text-textMuted">
        {tile.label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold leading-none tabular-nums",
          percentToneClass(tile.adherencePercent),
        )}
      >
        {formatAdherencePercentDisplay(tile.adherencePercent)}
      </p>
    </div>
  );
}

export type WeeklyAdherenceCardsProps = {
  summary: WeeklyAdherenceSummary;
  athleteHeading?: string;
  showSectionHeader?: boolean;
};

export function WeeklyAdherenceCards({
  summary,
  athleteHeading,
  showSectionHeader = true,
}: WeeklyAdherenceCardsProps) {
  const tiles = buildWeeklyAdherenceMetricTiles(summary);
  const weekLabel = `${formatDateOnly(summary.weekStart, summary.weekStart)} – ${formatDateOnly(summary.weekEnd, summary.weekEnd)}`;

  const grid = (
    <div
      className={cn(
        "grid gap-3",
        tiles.length >= 4
          ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
          : tiles.length === 3
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : tiles.length === 2
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1",
      )}
    >
      {tiles.map((tile) => (
        <AdherenceMetricTile key={tile.key} tile={tile} />
      ))}
    </div>
  );

  if (tiles.length === 0) {
    return (
      <p className="text-sm text-textSecondary">
        No adherence metrics returned for this week.
      </p>
    );
  }

  if (!showSectionHeader) {
    return (
      <div className="space-y-2">
        {athleteHeading ? (
          <p className="text-sm font-semibold text-textPrimary">{athleteHeading}</p>
        ) : null}
        {grid}
      </div>
    );
  }

  return (
    <Card
      title="Weekly Adherence"
      subtitle={`Current plan week: ${weekLabel}`}
      accent={false}
      padding="compact"
      className="shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
    >
      {athleteHeading ? (
        <p className="mb-3 text-sm font-semibold text-textPrimary">{athleteHeading}</p>
      ) : null}
      {grid}
    </Card>
  );
}
