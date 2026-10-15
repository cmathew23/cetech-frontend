"use client";

import { BasketballWeeklyPerformanceSection } from "@/components/dashboard/athlete/BasketballWeeklyPerformanceSection";
import {
  AthleteWeeklyGoalPerformanceSection,
  loadBasketballPracticeHistoryWeeks,
  loadFootballPracticeHistoryWeeks,
} from "@/components/dashboard/athlete/AthleteWeeklyGoalPerformanceSection";
import { OverallGolfPerformanceSection } from "@/components/dashboard/athlete/OverallGolfPerformanceCard";
import { SportMetricsSection } from "@/components/dashboard/SportMetricsSection";
import { WearableSummarySection } from "@/components/dashboard/WearableSummarySection";
import { WeeklyAdherenceCards } from "@/components/dashboard/WeeklyAdherenceCards";
import { WeeklyTrainingLoadCard } from "@/components/dashboard/WeeklyTrainingLoadCard";
import {
  NutritionPerformanceSection,
  coachCanViewNutritionPerformance,
} from "@/components/dashboard/NutritionPerformanceSection";
import {
  SandCSessionLoadSection,
  coachCanViewSandCSessionLoad,
} from "@/components/dashboard/SandCSessionLoadSection";
import { CoachBasketballCompetitionSection } from "@/components/dashboard/coach/CoachBasketballCompetitionSection";
import { CoachCompetitionPerformanceSection } from "@/components/dashboard/coach/CoachCompetitionPerformanceSection";
import { CoachWeeklyAdherenceComparison } from "@/components/dashboard/coach/CoachWeeklyAdherenceComparison";
import { resolveCoachWearableViewerContext } from "@/components/dashboard/coach/CoachWeeklyAdherenceOverview";
import { LogSportResultModal } from "@/components/dashboard/athlete/LogSportResultModal";
import type { SportMetricsDrillLogContext } from "@/components/dashboard/athlete/LogSportResultModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchCoachAssignedAthletes,
  fetchCoachMeDashboard,
  type CoachAssignedAthleteRow,
  type CoachMeDashboardData,
} from "@/lib/api/coachMe";
import {
  fetchAthleteWeeklyPlanJournal,
  type AthleteWeeklyPlanJournal,
} from "@/lib/api/coachAthletePlanningReadiness";
import { fetchCoachAthletePlanningProfile } from "@/lib/api/coachAthletePlanningProfile";
import {
  parseBasketballCoachEntrySearchParams,
  resolveBasketballCoachEntryExercise,
} from "@/lib/basketball/coachEntryRequest";
import {
  fetchWeeklyAdherenceSummary,
  type WeeklyAdherenceSummary,
} from "@/lib/api/weeklyAdherence";
import { isNormalizedApiError } from "@/lib/apiClient";
import { coachHasSkillsPlanGenerationAuthority } from "@/lib/coachTrainingPlanActions";
import { formatDateOnly } from "@/lib/dateTime";
import {
  releasedSkillsTrainingPlanVersionId,
  resolveWeeklyAdherencePlanRangeFromJournal,
  type WeeklyAdherencePlanRange,
} from "@/lib/weeklyAdherenceWeek";
import {
  DASHBOARD_MAJOR_OUTER_CARD_CLASS,
  DASHBOARD_PAGE_CONTENT_CLASS,
} from "@/components/dashboard/shared/dashboardOuterCardStyles";
import {
  SkillsGolfHistoryComparisonProvider,
  SkillsGolfHistoryWeekSelector,
} from "@/components/dashboard/shared/SkillsGolfHistoryComparison";
import { DASHBOARD_CARD_TITLE_CLASS } from "@/components/dashboard/shared/dashboardTypography";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";

function formatLoadError(e: unknown, fallback: string): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return fallback;
}

export function CoachAthletePerformancePageContent({
  basketballCoachEntrySearch = "",
}: {
  basketballCoachEntrySearch?: string;
} = {}) {
  const { accessContext, accessGateReady } = useAuth();
  const entityId = accessContext?.academy.trainingEntityId?.trim() ?? "";
  const coachEntryQuery = useMemo(
    () => parseBasketballCoachEntrySearchParams(new URLSearchParams(basketballCoachEntrySearch)),
    [basketballCoachEntrySearch],
  );

  const [dashboard, setDashboard] = useState<CoachMeDashboardData | null>(null);
  const [athletes, setAthletes] = useState<CoachAssignedAthleteRow[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [selectedAthleteSport, setSelectedAthleteSport] = useState<string | null>(null);
  const [coachEntryNotice, setCoachEntryNotice] = useState<string | null>(null);
  const [weeklyJournal, setWeeklyJournal] = useState<AthleteWeeklyPlanJournal | null>(null);
  const [coachMeasurementOpen, setCoachMeasurementOpen] = useState(false);

  const [adherenceLoading, setAdherenceLoading] = useState(false);
  const [adherenceError, setAdherenceError] = useState<string | null>(null);
  const [summary, setSummary] = useState<WeeklyAdherenceSummary | null>(null);
  const [adherenceReloadKey, setAdherenceReloadKey] = useState(0);
  const [weekRange, setWeekRange] = useState<WeeklyAdherencePlanRange | null>(null);
  const [trainingPlanVersionId, setTrainingPlanVersionId] = useState<string | null>(null);
  const [golfWeeklySummaryRefreshKey, setGolfWeeklySummaryRefreshKey] = useState(0);
  const [basketballWeeklySummaryRefreshKey, setBasketballWeeklySummaryRefreshKey] =
    useState(0);
  const [footballWeeklySummaryRefreshKey, setFootballWeeklySummaryRefreshKey] =
    useState(0);

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
        if (coachEntryQuery) {
          const requestedAthleteId = coachEntryQuery.athleteId;
          const assigned = valid.some((row) => row.athleteId === requestedAthleteId);
          const entityMismatch =
            coachEntryQuery.entityId !== "" &&
            entityId !== "" &&
            coachEntryQuery.entityId !== entityId;
          if (!assigned) {
            setSelectedAthleteId("");
            setCoachEntryNotice("This athlete is not in your assigned roster.");
          } else if (entityMismatch) {
            setSelectedAthleteId("");
            setCoachEntryNotice("This exercise belongs to a different academy.");
          } else {
            setSelectedAthleteId(requestedAthleteId);
            setCoachEntryNotice(null);
          }
        } else if (valid.length > 0) {
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
  }, [accessGateReady, coachEntryQuery, entityId]);

  useEffect(() => {
    setSummary(null);
    setWeekRange(null);
    setTrainingPlanVersionId(null);
    setWeeklyJournal(null);
    setAdherenceError(null);

    if (entityId === "" || selectedAthleteId.trim() === "") return;

    let cancelled = false;
    setAdherenceLoading(true);

    void (async () => {
      try {
        const journal = await fetchAthleteWeeklyPlanJournal(entityId, selectedAthleteId);
        if (cancelled) return;
        setWeeklyJournal(journal);

        const range = resolveWeeklyAdherencePlanRangeFromJournal(journal);
        if (range === null) throw new Error("Could not resolve released plan week.");

        setWeekRange(range);
        setTrainingPlanVersionId(releasedSkillsTrainingPlanVersionId(journal));

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
  }, [adherenceReloadKey, entityId, selectedAthleteId]);

  useEffect(() => {
    const athleteId = selectedAthleteId.trim();
    if (entityId === "" || athleteId === "") {
      setSelectedAthleteSport(null);
      return;
    }

    let cancelled = false;
    setSelectedAthleteSport(null);

    void (async () => {
      try {
        const profile = await fetchCoachAthletePlanningProfile(entityId, athleteId);
        if (cancelled) return;
        setSelectedAthleteSport(profile.sportCode?.trim().toUpperCase() ?? "");
      } catch {
        if (!cancelled) setSelectedAthleteSport("");
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
  const showNutritionPerformance = coachCanViewNutritionPerformance({
    academyCoachRole: dashboard?.academyCoachRole ?? null,
    functions: dashboard?.functions ?? null,
  });
  const showSandCSessionLoad = coachCanViewSandCSessionLoad({
    academyCoachRole: dashboard?.academyCoachRole ?? null,
    functions: dashboard?.functions ?? null,
  });

  const resolvedCoachEntry = useMemo(() => {
    if (!coachEntryQuery || !weeklyJournal || coachEntryNotice) return null;
    if (selectedAthleteId !== coachEntryQuery.athleteId) return null;
    return resolveBasketballCoachEntryExercise(weeklyJournal, coachEntryQuery);
  }, [coachEntryNotice, coachEntryQuery, selectedAthleteId, weeklyJournal]);

  const coachEntryMeasurementSport =
    selectedAthleteSport === null
      ? null
      : selectedAthleteSport === "FOOTBALL"
        ? "FOOTBALL"
        : "BASKETBALL";
  const coachEntryContext: SportMetricsDrillLogContext | null =
    coachEntryQuery && resolvedCoachEntry?.ok && coachEntryMeasurementSport
      ? {
          entityId,
          athleteId: coachEntryQuery.athleteId,
          trainingPlanVersionId: coachEntryQuery.trainingPlanVersionId,
          plannedSessionId: resolvedCoachEntry.exercise.plannedSessionId,
          dayDate: resolvedCoachEntry.exercise.dayDate || coachEntryQuery.date || "",
          sessionTitle: resolvedCoachEntry.exercise.sessionTitle,
          sectionKey: "skill",
          sport: coachEntryMeasurementSport,
          drill: resolvedCoachEntry.exercise.drill,
          itemIndex: resolvedCoachEntry.exercise.itemIndex,
        }
      : null;

  const coachEntryOpenKey = coachEntryContext
    ? [
        coachEntryContext.athleteId,
        coachEntryContext.trainingPlanVersionId,
        coachEntryContext.plannedSessionId,
        coachEntryContext.itemIndex,
      ].join(":")
    : "";

  useEffect(() => {
    if (coachEntryOpenKey !== "") setCoachMeasurementOpen(true);
  }, [coachEntryOpenKey]);

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
        <div className="min-w-0 max-w-full space-y-2">
          <label
            htmlFor="athlete-performance-select"
            className="text-sm font-medium text-textPrimary"
          >
            Athlete
          </label>
          <Select
            id="athlete-performance-select"
            className="min-w-0 max-w-full"
            value={selectedAthleteId}
            disabled={loadingRoster || athletes.length === 0}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setSelectedAthleteId(event.target.value)
            }
          >
            {athletes.length === 0 ? (
              <option value="">No athletes available</option>
            ) : null}
            {selectedAthleteId === "" && athletes.length > 0 ? (
              <option value="">Select an athlete</option>
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

      {coachEntryQuery ? (
        <Card
          accent={false}
          padding="compact"
          className={cn("space-y-3", DASHBOARD_MAJOR_OUTER_CARD_CLASS)}
        >
          <p className="text-sm font-medium text-textPrimary">
            {selectedAthleteSport === "FOOTBALL"
              ? "Football measurement"
              : selectedAthleteSport === null
                ? "Measurement"
                : "Basketball measurement"}
          </p>
          <p className="text-sm text-textSecondary">
            {coachEntryQuery.label || coachEntryQuery.skillCode}
          </p>
          {coachEntryNotice ? <Alert variant="danger">{coachEntryNotice}</Alert> : null}
          {resolvedCoachEntry && !resolvedCoachEntry.ok ? (
            <Alert variant="danger">{resolvedCoachEntry.error}</Alert>
          ) : null}
          {!coachEntryNotice && !resolvedCoachEntry && (loadingRoster || adherenceLoading) ? (
            <p className="text-sm text-textSecondary">Loading the released exercise…</p>
          ) : null}
          {coachEntryContext ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCoachMeasurementOpen(true)}
            >
              Enter measurement
            </Button>
          ) : null}
        </Card>
      ) : null}

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

          <CoachWeeklyAdherenceComparison
            entityId={entityId}
            athleteId={selectedAthleteId}
          />

          {summary ? (
            <WeeklyAdherenceCards
              summary={summary}
              athleteHeading={athleteHeading ?? undefined}
              showSectionHeader={true}
              cardClassName={DASHBOARD_MAJOR_OUTER_CARD_CLASS}
              cardTitleClassName={DASHBOARD_CARD_TITLE_CLASS}
            />
          ) : null}

          {summary ? (
            <WeeklyTrainingLoadCard
              comparison={summary.trainingLoadComparison}
              visibleDomains={summary.visibleDomains}
              viewerContext={wearableViewerContext}
              weekStart={summary.weekStart}
              weekEnd={summary.weekEnd}
              cardClassName={DASHBOARD_MAJOR_OUTER_CARD_CLASS}
              titleClassName={DASHBOARD_CARD_TITLE_CLASS}
            />
          ) : null}

          {showSandCSessionLoad && selectedAthleteId !== "" ? (
            <SandCSessionLoadSection
              entityId={entityId}
              athleteId={selectedAthleteId}
              summary={summary}
              weekStart={weekRange?.weekStart}
              weekEnd={weekRange?.weekEnd}
              weekRangePending={adherenceLoading}
              titleClassName={DASHBOARD_CARD_TITLE_CLASS}
              cardClassName={DASHBOARD_MAJOR_OUTER_CARD_CLASS}
            />
          ) : null}

          {!adherenceLoading &&
          showSportMetrics &&
          selectedAthleteId !== "" &&
          selectedAthleteSport === "GOLF" ? (
            <SkillsGolfHistoryComparisonProvider
              entityId={entityId}
              athleteId={selectedAthleteId}
            >
              <SkillsGolfHistoryWeekSelector />
              <AthleteWeeklyGoalPerformanceSection
                entityId={entityId}
                athleteId={selectedAthleteId}
                trainingPlanVersionId={trainingPlanVersionId}
                audience="coach"
                allowCoachPracticeRating={coachHasSkillsPlanGenerationAuthority(
                  selectedAthlete,
                )}
              />
              <SportMetricsSection
                entityId={entityId}
                athleteId={selectedAthleteId}
                trainingPlanVersionId={trainingPlanVersionId}
                cardClassName={DASHBOARD_MAJOR_OUTER_CARD_CLASS}
                titleClassName={DASHBOARD_CARD_TITLE_CLASS}
                hideWeeklyEvidenceCard
              />
              <CoachCompetitionPerformanceSection
                entityId={entityId}
                athleteId={selectedAthleteId}
                trainingPlanVersionId={trainingPlanVersionId}
                onAssessmentSaved={() => {
                  setGolfWeeklySummaryRefreshKey((current) => current + 1);
                }}
              />
              <OverallGolfPerformanceSection
                entityId={entityId}
                athleteId={selectedAthleteId}
                trainingPlanVersionId={trainingPlanVersionId}
                titleClassName={DASHBOARD_CARD_TITLE_CLASS}
                audience="coach"
                refreshKey={golfWeeklySummaryRefreshKey}
              />
            </SkillsGolfHistoryComparisonProvider>
          ) : null}

          {!adherenceLoading &&
          showSportMetrics &&
          selectedAthleteId !== "" &&
          selectedAthleteSport === "BASKETBALL" ? (
            <SkillsGolfHistoryComparisonProvider
              entityId={entityId}
              athleteId={selectedAthleteId}
              loadHistory={loadBasketballPracticeHistoryWeeks}
            >
              <SkillsGolfHistoryWeekSelector />
              <AthleteWeeklyGoalPerformanceSection
                entityId={entityId}
                athleteId={selectedAthleteId}
                trainingPlanVersionId={trainingPlanVersionId}
                audience="coach"
                sportCode="BASKETBALL"
                refreshKey={basketballWeeklySummaryRefreshKey}
                allowCoachPracticeRating={coachHasSkillsPlanGenerationAuthority(
                  selectedAthlete,
                )}
              />
              <BasketballWeeklyPerformanceSection
                entityId={entityId}
                athleteId={selectedAthleteId}
                trainingPlanVersionId={trainingPlanVersionId}
                refreshKey={basketballWeeklySummaryRefreshKey}
                titleClassName={DASHBOARD_CARD_TITLE_CLASS}
                sections="overall"
              />
              <CoachBasketballCompetitionSection
                entityId={entityId}
                athleteId={selectedAthleteId}
                trainingPlanVersionId={trainingPlanVersionId}
                onSubmitted={() => {
                  setBasketballWeeklySummaryRefreshKey((current) => current + 1);
                }}
              />
            </SkillsGolfHistoryComparisonProvider>
          ) : null}

          {!adherenceLoading &&
          showSportMetrics &&
          selectedAthleteId !== "" &&
          selectedAthleteSport === "FOOTBALL" ? (
            <SkillsGolfHistoryComparisonProvider
              entityId={entityId}
              athleteId={selectedAthleteId}
              loadHistory={loadFootballPracticeHistoryWeeks}
            >
              <SkillsGolfHistoryWeekSelector />
              <AthleteWeeklyGoalPerformanceSection
                entityId={entityId}
                athleteId={selectedAthleteId}
                trainingPlanVersionId={trainingPlanVersionId}
                audience="coach"
                sportCode="FOOTBALL"
                refreshKey={footballWeeklySummaryRefreshKey}
                allowCoachPracticeRating={coachHasSkillsPlanGenerationAuthority(
                  selectedAthlete,
                )}
                onFootballCoachRatingSubmitted={() => {
                  setFootballWeeklySummaryRefreshKey((current) => current + 1);
                }}
              />
              <CoachBasketballCompetitionSection
                entityId={entityId}
                athleteId={selectedAthleteId}
                trainingPlanVersionId={trainingPlanVersionId}
                sportCode="FOOTBALL"
                allowEntry={coachHasSkillsPlanGenerationAuthority(selectedAthlete)}
                onSubmitted={() => {
                  setFootballWeeklySummaryRefreshKey((current) => current + 1);
                }}
              />
              <BasketballWeeklyPerformanceSection
                entityId={entityId}
                athleteId={selectedAthleteId}
                trainingPlanVersionId={trainingPlanVersionId}
                refreshKey={footballWeeklySummaryRefreshKey}
                titleClassName={DASHBOARD_CARD_TITLE_CLASS}
                sections="overall"
                sportCode="FOOTBALL"
              />
            </SkillsGolfHistoryComparisonProvider>
          ) : null}

          {showNutritionPerformance && weekRange ? (
            <NutritionPerformanceSection
              entityId={entityId}
              athleteId={selectedAthleteId}
              weekStart={weekRange.weekStart}
              weekEnd={weekRange.weekEnd}
              titleClassName={DASHBOARD_CARD_TITLE_CLASS}
              cardClassName={DASHBOARD_MAJOR_OUTER_CARD_CLASS}
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

      {!loadingRoster && !rosterError && athletes.length === 0 && !coachEntryQuery ? (
        <p className="text-sm text-textSecondary">
          No assigned athletes. Athletes will appear here once assigned to you.
        </p>
      ) : null}

      {coachEntryContext && weeklyJournal ? (
        <LogSportResultModal
          open={coachMeasurementOpen}
          context={coachEntryContext}
          weekStartDate={weeklyJournal.weekStartDate}
          weekEndDate={weeklyJournal.weekEndDate}
          onClose={() => setCoachMeasurementOpen(false)}
          onSuccess={() => {
            setCoachMeasurementOpen(false);
            setBasketballWeeklySummaryRefreshKey((current) => current + 1);
            setFootballWeeklySummaryRefreshKey((current) => current + 1);
            if (selectedAthleteSport === "FOOTBALL") {
              setAdherenceReloadKey((current) => current + 1);
            }
          }}
        />
      ) : null}
    </div>
  );
}
