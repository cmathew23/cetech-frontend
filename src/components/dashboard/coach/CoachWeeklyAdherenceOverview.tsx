"use client";

import { WeeklyAdherenceCards } from "@/components/dashboard/WeeklyAdherenceCards";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchCoachAssignedAthletes,
  type CoachAssignedAthleteRow,
} from "@/lib/api/coachMe";
import { fetchAthleteWeeklyPlanJournal } from "@/lib/api/coachAthletePlanningReadiness";
import {
  fetchWeeklyAdherenceSummary,
  type WeeklyAdherenceSummary,
} from "@/lib/api/weeklyAdherence";
import { isNormalizedApiError } from "@/lib/apiClient";
import { formatDateOnly } from "@/lib/dateTime";
import {
  resolveWeeklyAdherencePlanRangeFromJournal,
  type WeeklyAdherencePlanRange,
} from "@/lib/weeklyAdherenceWeek";
import { useEffect, useState } from "react";

function formatLoadError(e: unknown): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return "Could not load weekly adherence.";
}

type AthleteAdherenceState = {
  athlete: CoachAssignedAthleteRow;
  weekRange: WeeklyAdherencePlanRange | null;
  summary: WeeklyAdherenceSummary | null;
  error: string | null;
};

function CoachWeeklyAdherenceCard({
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

export function CoachWeeklyAdherenceOverview() {
  const { accessContext, accessGateReady } = useAuth();
  const entityId = accessContext?.academy.trainingEntityId?.trim() ?? "";

  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<CoachAssignedAthleteRow[]>([]);
  const [adherenceByAthlete, setAdherenceByAthlete] = useState<
    AthleteAdherenceState[]
  >([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const canLoadRoster = accessGateReady && entityId !== "";

  useEffect(() => {
    if (!canLoadRoster) {
      setRosterLoading(false);
      setAthletes([]);
      setAdherenceByAthlete([]);
      return;
    }

    let cancelled = false;
    setRosterLoading(true);
    setRosterError(null);
    setAdherenceByAthlete([]);

    void (async () => {
      try {
        const rows = await fetchCoachAssignedAthletes();
        if (!cancelled) {
          setAthletes(rows.filter((row) => row.athleteId.trim() !== ""));
        }
      } catch (e) {
        if (!cancelled) {
          setAthletes([]);
          setRosterError(formatLoadError(e));
        }
      } finally {
        if (!cancelled) setRosterLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canLoadRoster, reloadKey]);

  useEffect(() => {
    if (!canLoadRoster || rosterLoading || rosterError) {
      setSummaryLoading(false);
      return;
    }

    if (athletes.length === 0) {
      setAdherenceByAthlete([]);
      setSummaryLoading(false);
      return;
    }

    let cancelled = false;
    setSummaryLoading(true);

    void (async () => {
      const results = await Promise.all(
        athletes.map(async (athlete) => {
          try {
            const journal = await fetchAthleteWeeklyPlanJournal(
              entityId,
              athlete.athleteId,
            );
            const weekRange = resolveWeeklyAdherencePlanRangeFromJournal(journal);
            if (weekRange === null) {
              throw new Error("Could not resolve released plan week.");
            }
            const summary = await fetchWeeklyAdherenceSummary({
              entityId,
              athleteId: athlete.athleteId,
              weekStart: weekRange.weekStart,
              weekEnd: weekRange.weekEnd,
            });
            return {
              athlete,
              weekRange,
              summary,
              error: null,
            } satisfies AthleteAdherenceState;
          } catch (e) {
            return {
              athlete,
              weekRange: null,
              summary: null,
              error: formatLoadError(e),
            } satisfies AthleteAdherenceState;
          }
        }),
      );
      if (!cancelled) {
        setAdherenceByAthlete(results);
        setSummaryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    athletes,
    canLoadRoster,
    entityId,
    rosterError,
    rosterLoading,
  ]);

  const loadedWeekLabels = adherenceByAthlete
    .map((entry) =>
      entry.weekRange
        ? `${formatDateOnly(entry.weekRange.weekStart, entry.weekRange.weekStart)} – ${formatDateOnly(entry.weekRange.weekEnd, entry.weekRange.weekEnd)}`
        : "",
    )
    .filter((label) => label !== "");
  const uniqueWeekLabels = Array.from(new Set(loadedWeekLabels));
  const weekLabel =
    uniqueWeekLabels.length === 1
      ? uniqueWeekLabels[0]
      : uniqueWeekLabels.length > 1
        ? "Released plan weeks"
        : "Loading plan week...";

  if (!accessGateReady) {
    return (
      <CoachWeeklyAdherenceCard weekLabel={weekLabel}>
        <p className="text-sm text-textSecondary">Loading…</p>
      </CoachWeeklyAdherenceCard>
    );
  }

  if (entityId === "") {
    return (
      <CoachWeeklyAdherenceCard weekLabel={weekLabel}>
        <Alert variant="warning">
          Weekly adherence is unavailable until academy training entity id is
          available in app context.
        </Alert>
      </CoachWeeklyAdherenceCard>
    );
  }

  const loading = rosterLoading || summaryLoading;

  return (
    <CoachWeeklyAdherenceCard weekLabel={weekLabel}>
      {loading ? (
        <p className="text-sm text-textSecondary">Loading…</p>
      ) : null}
      {rosterError ? (
        <div className="space-y-3">
          <Alert variant="danger">{rosterError}</Alert>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            Try again
          </Button>
        </div>
      ) : null}
      {!loading && !rosterError && athletes.length === 0 ? (
        <p className="text-sm text-textSecondary">
          No assigned athletes with an athlete id.
        </p>
      ) : null}
      {!loading && !rosterError && adherenceByAthlete.length > 0 ? (
        <div className="space-y-4">
          {adherenceByAthlete.map((entry, index) => {
            const heading =
              entry.athlete.displayName.trim() !== "" &&
              entry.athlete.displayName !== "—"
                ? entry.athlete.displayName
                : entry.athlete.email;

            return (
              <div
                key={entry.athlete.athleteId}
                className={index > 0 ? "border-t border-border pt-4" : undefined}
              >
                {entry.error ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-textPrimary">
                      {heading}
                    </p>
                    <Alert variant="danger">{entry.error}</Alert>
                  </div>
                ) : null}
                {entry.summary ? (
                  <WeeklyAdherenceCards
                    summary={entry.summary}
                    athleteHeading={heading}
                    showSectionHeader={false}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </CoachWeeklyAdherenceCard>
  );
}
