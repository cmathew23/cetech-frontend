"use client";

import { SportMetricsSection } from "@/components/dashboard/SportMetricsSection";
import { WearableSummarySection } from "@/components/dashboard/WearableSummarySection";
import { WeeklyAdherenceCards } from "@/components/dashboard/WeeklyAdherenceCards";
import { resolveCoachWearableViewerContext } from "@/components/dashboard/coach/CoachWeeklyAdherenceOverview";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchCoachAssignedAthletes,
  fetchCoachMeDashboard,
  type CoachAssignedAthleteRow,
  type CoachMeDashboardData,
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
import {
  DASHBOARD_MAJOR_OUTER_CARD_CLASS,
  DASHBOARD_PAGE_CONTENT_CLASS,
} from "@/components/dashboard/shared/dashboardOuterCardStyles";
import { DASHBOARD_CARD_TITLE_CLASS } from "@/components/dashboard/shared/dashboardTypography";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";

function formatLoadError(e: unknown, fallback: string): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return fallback;
}

export function CoachAthletePerformancePageContent() {
  const { accessContext, accessGateReady } = useAuth();
  const entityId = accessContext?.academy.trainingEntityId?.trim() ?? "";

  const [dashboard, setDashboard] = useState<CoachMeDashboardData | null>(null);
  const [athletes, setAthletes] = useState<CoachAssignedAthleteRow[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState("");

  const [adherenceLoading, setAdherenceLoading] = useState(false);
  const [adherenceError, setAdherenceError] = useState<string | null>(null);
  const [summary, setSummary] = useState<WeeklyAdherenceSummary | null>(null);
  const [weekRange, setWeekRange] = useState<WeeklyAdherencePlanRange | null>(null);
  const [trainingPlanVersionId, setTrainingPlanVersionId] = useState<string | null>(null);

  const wearableViewerContext = resolveCoachWearableViewerContext({
    academyCoachRole: dashboard?.academyCoachRole ?? null,
    functions: dashboard?.functions ?? null,
  });

  useEffect(() => {
    if (!accessGateReady) return;
    let cancelled = false;

    void (async () => {
      setLoadingRoster(true);
      setRosterError(null);
      try {
        const [dash, rows] = await Promise.all([
          fetchCoachMeDashboard(),
          fetchCoachAssignedAthletes(),
        ]);
        if (cancelled) return;
        setDashboard(dash);
        const valid = rows.filter((r) => r.athleteId.trim() !== "");
        setAthletes(valid);
        if (valid.length > 0) {
          setSelectedAthleteId((current) => current || valid[0]!.athleteId);
        }
      } catch (e) {
        if (cancelled) return;
        setAthletes([]);
        setRosterError(formatLoadError(e, "Could not load assigned athletes."));
      } finally {
        if (!cancelled) setLoadingRoster(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessGateReady]);

  useEffect(() => {
    setSummary(null);
    setWeekRange(null);
    setTrainingPlanVersionId(null);
    setAdherenceError(null);

    if (entityId === "" || selectedAthleteId.trim() === "") return;

    let cancelled = false;
    setAdherenceLoading(true);

    void (async () => {
      try {
        const journal = await fetchAthleteWeeklyPlanJournal(entityId, selectedAthleteId);
        if (cancelled) return;

        const range = resolveWeeklyAdherencePlanRangeFromJournal(journal);
        if (range === null) throw new Error("Could not resolve released plan week.");

        setWeekRange(range);
        setTrainingPlanVersionId(
          journal.domains.SKILLS?.versionId?.trim() ?? null,
        );

        const result = await fetchWeeklyAdherenceSummary({
          entityId,
          athleteId: selectedAthleteId,
          weekStart: range.weekStart,
          weekEnd: range.weekEnd,
        });
        if (!cancelled) setSummary(result);
      } catch (e) {
        if (!cancelled) {
          setAdherenceError(
            formatLoadError(e, "Could not load weekly performance."),
          );
        }
      } finally {
        if (!cancelled) setAdherenceLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entityId, selectedAthleteId]);

  const selectedAthlete = useMemo(
    () => athletes.find((a) => a.athleteId === selectedAthleteId) ?? null,
    [athletes, selectedAthleteId],
  );

  const athleteHeading =
    selectedAthlete
      ? selectedAthlete.displayName !== "—"
        ? selectedAthlete.displayName
        : selectedAthlete.email
      : null;

  const weekLabel = weekRange
    ? `${formatDateOnly(weekRange.weekStart, weekRange.weekStart)} – ${formatDateOnly(weekRange.weekEnd, weekRange.weekEnd)}`
    : null;

  const showSportMetrics =
    wearableViewerContext !== "NUTRITION" && wearableViewerContext !== "S_AND_C";

  return (
    <div className={cn(DASHBOARD_PAGE_CONTENT_CLASS, "space-y-6")}>
      <PageHeader
        title="Athlete Performance"
        subtitle="Select an assigned athlete to view their current weekly performance summary."
      />

      <Card
        accent={false}
        padding="compact"
        className={cn("space-y-4", DASHBOARD_MAJOR_OUTER_CARD_CLASS)}
      >
        <div className="space-y-2">
          <label
            htmlFor="athlete-performance-select"
            className="text-sm font-medium text-textPrimary"
          >
            Athlete
          </label>
          <Select
            id="athlete-performance-select"
            value={selectedAthleteId}
            disabled={loadingRoster || athletes.length === 0}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setSelectedAthleteId(event.target.value)
            }
          >
            {athletes.length === 0 ? (
              <option value="">No athletes available</option>
            ) : null}
            {athletes.map((athlete) => (
              <option key={athlete.athleteId} value={athlete.athleteId}>
                {athlete.displayName}
              </option>
            ))}
          </Select>
        </div>

        {loadingRoster ? (
          <p className="text-sm text-textSecondary">Loading assigned athletes…</p>
        ) : null}
        {rosterError ? <Alert variant="danger">{rosterError}</Alert> : null}
      </Card>

      {selectedAthleteId !== "" && !loadingRoster ? (
        <div className="space-y-4">
          {adherenceLoading ? (
            <p className="text-sm text-textSecondary">
              Loading weekly performance…
            </p>
          ) : null}
          {adherenceError ? (
            <Alert variant="danger">{adherenceError}</Alert>
          ) : null}

          {summary ? (
            <WeeklyAdherenceCards
              summary={summary}
              athleteHeading={athleteHeading ?? undefined}
              showSectionHeader={true}
              cardClassName={DASHBOARD_MAJOR_OUTER_CARD_CLASS}
              cardTitleClassName={DASHBOARD_CARD_TITLE_CLASS}
            />
          ) : null}

          {!adherenceLoading && showSportMetrics && selectedAthleteId !== "" ? (
            <SportMetricsSection
              entityId={entityId}
              athleteId={selectedAthleteId}
              trainingPlanVersionId={trainingPlanVersionId}
              cardClassName={DASHBOARD_MAJOR_OUTER_CARD_CLASS}
              titleClassName={DASHBOARD_CARD_TITLE_CLASS}
            />
          ) : null}

          {!adherenceLoading && weekRange ? (
            <WearableSummarySection
              entityId={entityId}
              athleteId={selectedAthleteId}
              planStartDate={weekRange.weekStart}
              planEndDate={weekRange.weekEnd}
              windowLabel={weekLabel ? `Plan window: ${weekLabel}` : undefined}
              viewerContext={wearableViewerContext}
              cardClassName={DASHBOARD_MAJOR_OUTER_CARD_CLASS}
              titleClassName={DASHBOARD_CARD_TITLE_CLASS}
            />
          ) : null}
        </div>
      ) : null}

      {!loadingRoster && !rosterError && athletes.length === 0 ? (
        <p className="text-sm text-textSecondary">
          No assigned athletes. Athletes will appear here once assigned to you.
        </p>
      ) : null}
    </div>
  );
}
