"use client";

import { WeeklyAdherenceCards } from "@/components/dashboard/WeeklyAdherenceCards";
import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchCoachAssignedAthletes,
  type CoachAssignedAthleteRow,
} from "@/lib/api/coachMe";
import {
  fetchWeeklyAdherenceSummary,
  type WeeklyAdherenceSummary,
} from "@/lib/api/weeklyAdherence";
import { isNormalizedApiError } from "@/lib/apiClient";
import { getCurrentWeekDateRange } from "@/lib/weeklyAdherenceWeek";
import { useEffect, useMemo, useState } from "react";

function formatLoadError(e: unknown): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return "Could not load weekly adherence.";
}

type AthleteAdherenceState = {
  athlete: CoachAssignedAthleteRow;
  summary: WeeklyAdherenceSummary | null;
  error: string | null;
};

export function CoachWeeklyAdherenceOverview() {
  const { accessContext, accessGateReady } = useAuth();
  const entityId = accessContext?.academy.trainingEntityId?.trim() ?? "";
  const weekRange = useMemo(() => getCurrentWeekDateRange(), []);

  const [rosterLoading, setRosterLoading] = useState(true);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<CoachAssignedAthleteRow[]>([]);
  const [adherenceByAthlete, setAdherenceByAthlete] = useState<
    AthleteAdherenceState[]
  >([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!accessGateReady) return;

    let cancelled = false;
    setRosterLoading(true);
    setRosterError(null);

    void (async () => {
      try {
        const rows = await fetchCoachAssignedAthletes();
        if (!cancelled) {
          setAthletes(
            rows.filter((row) => row.athleteId.trim() !== ""),
          );
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
  }, [accessGateReady, reloadKey]);

  useEffect(() => {
    if (!accessGateReady || entityId === "") return;
    if (rosterLoading || rosterError) return;
    if (athletes.length === 0) {
      setAdherenceByAthlete([]);
      return;
    }

    let cancelled = false;
    setSummaryLoading(true);

    void (async () => {
      const results = await Promise.all(
        athletes.map(async (athlete) => {
          try {
            const summary = await fetchWeeklyAdherenceSummary({
              entityId,
              athleteId: athlete.athleteId,
              weekStart: weekRange.weekStart,
              weekEnd: weekRange.weekEnd,
            });
            return {
              athlete,
              summary,
              error: null,
            } satisfies AthleteAdherenceState;
          } catch (e) {
            return {
              athlete,
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
    accessGateReady,
    athletes,
    entityId,
    rosterError,
    rosterLoading,
    weekRange.weekEnd,
    weekRange.weekStart,
  ]);

  if (!accessGateReady) return null;

  if (entityId === "") {
    return (
      <Alert variant="warning">
        Weekly adherence is unavailable: academy training entity id is missing
        from app context.
      </Alert>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-textSecondary">
          Overview
        </h2>
        <p className="mt-1 text-xs text-textMuted">
          Weekly adherence for assigned athletes (domains returned by backend).
        </p>
      </div>
      <DashboardCardShell title="Weekly adherence" className="space-y-4">
        {rosterLoading || summaryLoading ? (
          <p className="text-sm text-textSecondary">Loading adherence…</p>
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
        {!rosterLoading && !rosterError && athletes.length === 0 ? (
          <p className="text-sm text-textSecondary">
            No assigned athletes with an athlete id.
          </p>
        ) : null}
        {!rosterLoading && !rosterError
          ? adherenceByAthlete.map((entry) => (
              <div
                key={entry.athlete.athleteId}
                className="space-y-3 border-t border-border pt-4 first:border-t-0 first:pt-0"
              >
                {entry.error ? (
                  <Alert variant="danger">{entry.error}</Alert>
                ) : null}
                {entry.summary ? (
                  <WeeklyAdherenceCards
                    summary={entry.summary}
                    heading={
                      entry.athlete.displayName.trim() !== "" &&
                      entry.athlete.displayName !== "—"
                        ? entry.athlete.displayName
                        : entry.athlete.email
                    }
                  />
                ) : null}
              </div>
            ))
          : null}
      </DashboardCardShell>
    </section>
  );
}
