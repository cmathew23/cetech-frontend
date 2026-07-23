"use client";

import {
  buildWeeklyAdherenceMetricTiles,
  WeeklyAdherenceCards,
} from "@/components/dashboard/WeeklyAdherenceCards";
import { ATHLETE_DASHBOARD_CARD_TITLE_CLASS } from "@/components/dashboard/athlete/athleteDashboardTypography";
import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import { Card } from "@/components/ui/Card";
import { useAthleteWeeklyAdherence } from "@/components/dashboard/athlete/AthleteWeeklyAdherenceContext";
import { formatDateOnly } from "@/lib/dateTime";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import type { ChangeEvent } from "react";

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
      className={DASHBOARD_MAJOR_OUTER_CARD_CLASS}
      titleClassName={ATHLETE_DASHBOARD_CARD_TITLE_CLASS}
    >
      {children}
    </Card>
  );
}

export function AthleteWeeklyAdherenceSection() {
  const {
    phase,
    summary,
    error,
    reload,
    weekStart,
    weekEnd,
    availableSnapshots,
    snapshotsLoading,
    snapshotsError,
    selectedSnapshotAId,
    selectedSnapshotBId,
    setSelectedSnapshotAId,
    setSelectedSnapshotBId,
  } = useAthleteWeeklyAdherence();

  const weekLabel =
    weekStart !== "" && weekEnd !== ""
      ? `${formatDateOnly(weekStart, weekStart)} – ${formatDateOnly(weekEnd, weekEnd)}`
      : "Loading plan week...";

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

  const sameSnapshot =
    selectedSnapshotAId !== "" &&
    selectedSnapshotAId === selectedSnapshotBId;
  const snapshotSelectors = (
    <div className="space-y-3">
      {snapshotsError ? <Alert variant="danger">{snapshotsError}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="weekly-adherence-snapshot-a" label="Snapshot A">
          <Select
            id="weekly-adherence-snapshot-a"
            value={selectedSnapshotAId}
            disabled={snapshotsLoading || availableSnapshots.length === 0}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setSelectedSnapshotAId(event.target.value)
            }
          >
            <option value="">
              {snapshotsLoading ? "Loading snapshots…" : "Select a snapshot"}
            </option>
            {availableSnapshots.map((snapshot) => (
              <option
                key={snapshot.id}
                value={snapshot.id}
                disabled={snapshot.id === selectedSnapshotBId}
              >
                {snapshot.weekStart && snapshot.weekEnd
                  ? `${formatDateOnly(snapshot.weekStart, snapshot.weekStart)} – ${formatDateOnly(snapshot.weekEnd, snapshot.weekEnd)}`
                  : snapshot.id}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          id="weekly-adherence-snapshot-b"
          label="Snapshot B"
          error={
            sameSnapshot ? "Snapshot B must be different from Snapshot A." : undefined
          }
        >
          <Select
            id="weekly-adherence-snapshot-b"
            value={selectedSnapshotBId}
            disabled={snapshotsLoading || availableSnapshots.length === 0}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setSelectedSnapshotBId(event.target.value)
            }
          >
            <option value="">
              {snapshotsLoading ? "Loading snapshots…" : "Select a snapshot"}
            </option>
            {availableSnapshots.map((snapshot) => (
              <option
                key={snapshot.id}
                value={snapshot.id}
                disabled={snapshot.id === selectedSnapshotAId}
              >
                {snapshot.weekStart && snapshot.weekEnd
                  ? `${formatDateOnly(snapshot.weekStart, snapshot.weekStart)} – ${formatDateOnly(snapshot.weekEnd, snapshot.weekEnd)}`
                  : snapshot.id}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
    </div>
  );

  if (phase === "loading") {
    return (
      <WeeklyAdherenceSectionCard weekLabel={weekLabel}>
        <p className="text-sm text-textSecondary">Loading…</p>
      </WeeklyAdherenceSectionCard>
    );
  }

  if (phase === "error") {
    return (
      <>
        {snapshotSelectors}
        <WeeklyAdherenceSectionCard weekLabel={weekLabel}>
          <div className="space-y-3">
            <Alert variant="danger">{error ?? "Unable to load"}</Alert>
            <Button type="button" variant="secondary" onClick={reload}>
              Try again
            </Button>
          </div>
        </WeeklyAdherenceSectionCard>
      </>
    );
  }

  if (phase === "loaded" && summary) {
    const tiles = buildWeeklyAdherenceMetricTiles(summary);
    if (tiles.length > 0) {
      return (
        <>
          {snapshotSelectors}
          <WeeklyAdherenceCards
            summary={summary}
            cardTitleClassName={ATHLETE_DASHBOARD_CARD_TITLE_CLASS}
            cardClassName={DASHBOARD_MAJOR_OUTER_CARD_CLASS}
            softTileTypography
          />
        </>
      );
    }
    return (
      <>
        {snapshotSelectors}
        <WeeklyAdherenceSectionCard weekLabel={weekLabel}>
          <p className="text-sm text-textSecondary">
            No adherence metrics returned for this week.
          </p>
        </WeeklyAdherenceSectionCard>
      </>
    );
  }

  return (
    <>
      {snapshotSelectors}
      <WeeklyAdherenceSectionCard weekLabel={weekLabel}>
        <p className="text-sm text-textSecondary">Loading…</p>
      </WeeklyAdherenceSectionCard>
    </>
  );
}
