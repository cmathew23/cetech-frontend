"use client";

import { WeeklyAdherenceCards } from "@/components/dashboard/WeeklyAdherenceCards";
import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { useAthleteInvitationGate } from "@/components/dashboard/athlete/useAthleteInvitationGate";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useAthletePlanningIdentifiers } from "@/hooks/useAthletePlanningIdentifiers";
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

export function AthleteWeeklyAdherenceOverview() {
  const { hasActiveAcademyMembership, isGateReady } = useAthleteInvitationGate();
  const planningIds = useAthletePlanningIdentifiers();
  const weekRange = useMemo(() => getCurrentWeekDateRange(), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<WeeklyAdherenceSummary | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const entityId = planningIds.ids?.entityId ?? "";
  const athleteId = planningIds.ids?.athleteId ?? "";

  useEffect(() => {
    if (!isGateReady || !hasActiveAcademyMembership) return;
    if (planningIds.phase !== "ready" || entityId === "" || athleteId === "") {
      setSummary(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const data = await fetchWeeklyAdherenceSummary({
          entityId,
          athleteId,
          weekStart: weekRange.weekStart,
          weekEnd: weekRange.weekEnd,
        });
        if (!cancelled) {
          setSummary(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setSummary(null);
          setError(formatLoadError(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    athleteId,
    entityId,
    hasActiveAcademyMembership,
    isGateReady,
    planningIds.phase,
    reloadKey,
    weekRange.weekEnd,
    weekRange.weekStart,
  ]);

  if (!isGateReady) return null;
  if (!hasActiveAcademyMembership) return null;

  if (planningIds.phase === "loading") {
    return (
      <DashboardCardShell title="Weekly adherence" className="min-h-[120px]">
        <p className="text-sm text-textSecondary">Loading overview…</p>
      </DashboardCardShell>
    );
  }

  if (planningIds.phase === "not_ready" || entityId === "" || athleteId === "") {
    return (
      <Alert variant="warning">
        Weekly adherence is unavailable: athlete profile context is not ready
        (entity or athlete profile id missing). Complete onboarding and ensure
        GET /athletes/me exposes athleteProfileId.
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
          Weekly adherence for your current plan week.
        </p>
      </div>
      <DashboardCardShell title="Weekly adherence" className="space-y-3">
        {loading ? (
          <p className="text-sm text-textSecondary">Loading adherence…</p>
        ) : null}
        {error ? (
          <div className="space-y-3">
            <Alert variant="danger">{error}</Alert>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              Try again
            </Button>
          </div>
        ) : null}
        {!loading && !error && summary ? (
          <WeeklyAdherenceCards summary={summary} />
        ) : null}
      </DashboardCardShell>
    </section>
  );
}
