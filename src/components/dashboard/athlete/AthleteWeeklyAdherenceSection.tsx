"use client";

import {
  buildWeeklyAdherenceMetricTiles,
  WeeklyAdherenceCards,
} from "@/components/dashboard/WeeklyAdherenceCards";
import { Card } from "@/components/ui/Card";
import { useAthleteWeeklyAdherence } from "@/components/dashboard/athlete/AthleteWeeklyAdherenceContext";
import { formatDateOnly } from "@/lib/dateTime";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

function WeeklyAdherenceSectionCard({
  weekLabel,
  children,
}: {
  weekLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      title="Weekly Adherence"
      subtitle={`Current plan week: ${weekLabel}`}
      accent={false}
      padding="compact"
      className="shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
    >
      {children}
    </Card>
  );
}

export function AthleteWeeklyAdherenceSection() {
  const { phase, summary, error, reload, weekStart, weekEnd } =
    useAthleteWeeklyAdherence();

  const weekLabel = `${formatDateOnly(weekStart, weekStart)} – ${formatDateOnly(weekEnd, weekEnd)}`;

  if (phase === "hidden") {
    return null;
  }

  if (phase === "awaiting_identifiers") {
    return (
      <WeeklyAdherenceSectionCard weekLabel={weekLabel}>
        <p className="text-sm text-textSecondary">
          Preparing adherence summary…
        </p>
      </WeeklyAdherenceSectionCard>
    );
  }

  if (phase === "loading") {
    return (
      <WeeklyAdherenceSectionCard weekLabel={weekLabel}>
        <p className="text-sm text-textSecondary">Loading…</p>
      </WeeklyAdherenceSectionCard>
    );
  }

  if (phase === "error") {
    return (
      <WeeklyAdherenceSectionCard weekLabel={weekLabel}>
        <div className="space-y-3">
          <Alert variant="danger">{error ?? "Unable to load"}</Alert>
          <Button type="button" variant="secondary" onClick={reload}>
            Try again
          </Button>
        </div>
      </WeeklyAdherenceSectionCard>
    );
  }

  if (phase === "loaded" && summary) {
    const tiles = buildWeeklyAdherenceMetricTiles(summary);
    if (tiles.length > 0) {
      return <WeeklyAdherenceCards summary={summary} />;
    }
    return (
      <WeeklyAdherenceSectionCard weekLabel={weekLabel}>
        <p className="text-sm text-textSecondary">
          No adherence metrics returned for this week.
        </p>
      </WeeklyAdherenceSectionCard>
    );
  }

  return (
    <WeeklyAdherenceSectionCard weekLabel={weekLabel}>
      <p className="text-sm text-textSecondary">Loading…</p>
    </WeeklyAdherenceSectionCard>
  );
}
