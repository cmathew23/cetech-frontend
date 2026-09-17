"use client";

import { AthleteCompetitionDaySelector } from "@/components/dashboard/athlete/AthleteCompetitionEntrySection";
import { ATHLETE_DASHBOARD_CARD_TITLE_CLASS } from "@/components/dashboard/athlete/athleteDashboardTypography";
import {
  AthletePerformanceStat,
  athletePerformanceGridClass,
  type SportsMetricsPresentation,
} from "@/components/dashboard/athlete/athleteSportsMetricsPresentation";
import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import { DashboardMetricTile } from "@/components/dashboard/shared/DashboardMetricTile";
import {
  SkillsGolfScalarHistoryComparison,
  useSkillsGolfHistoryComparison,
} from "@/components/dashboard/shared/SkillsGolfHistoryComparison";
import { DASHBOARD_SECTION_HEADING_CLASS } from "@/components/dashboard/shared/dashboardTypography";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import {
  fetchGolfCompetition,
  fetchGolfCompetitionHistory,
  type GolfCompetitionDetail,
  type GolfCompetitionHistoryData,
  type GolfCompetitionHistoryPoint,
  type GolfCompetitionHoleRead,
  type GolfCompetitionHoleSummary,
  type GolfOverallGolferPerformanceCheckpoint,
} from "@/lib/api/sportMetricsGolfCompetitions";
import { fetchSportMetricsGolfWeeklySummary, type SportMetricsGolfWeeklySummary } from "@/lib/api/sportMetricsGolf";
import { isNormalizedApiError } from "@/lib/apiClient";
import { formatDateOnly, formatDateTime } from "@/lib/dateTime";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const UNAVAILABLE = "Unavailable";

function formatError(e: unknown): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return "Unable to load Competition Performance.";
}

/** Display-only; PeakFlow 1-decimal convention from weekly adherence / Sports Metrics. */
export function displayBackendNumber(value: number | null): string {
  if (value === null) return UNAVAILABLE;
  const rounded = Math.round(value * 10) / 10;
  return rounded % 1 === 0 ? String(Math.round(rounded)) : rounded.toFixed(1);
}

export function displayBackendPercent(value: number | null): string {
  if (value === null) return UNAVAILABLE;
  return `${displayBackendNumber(value)}%`;
}

export function displayScoreToPar(value: number | null): string {
  if (value === null) return UNAVAILABLE;
  if (value === 0) return "E";
  const formatted = displayBackendNumber(value);
  return value > 0 ? `+${formatted}` : formatted;
}

export function displayAthleteScoreOutOf100(value: number | null): string {
  if (value === null) return UNAVAILABLE;
  return `${displayBackendNumber(value)} / 100`;
}

function hasAthleteCompetitionResult(input: {
  scoreToPar?: number | null;
  athleteCompetitionScore: number | null;
}): boolean {
  return input.scoreToPar != null || input.athleteCompetitionScore !== null;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-textSecondary">{label}</dt>
      <dd className="text-sm text-textPrimary">{children}</dd>
    </div>
  );
}

function HighlightMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return <DashboardMetricTile title={label} value={value} />;
}

export function AthleteCompetitionHoleSummaryFields({
  summary,
  includeScoreToPar = true,
}: {
  summary: GolfCompetitionHoleSummary;
  includeScoreToPar?: boolean;
}) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {includeScoreToPar ? (
        <Field label="Score to Par">
          {displayScoreToPar(summary.scoreToPar)}
        </Field>
      ) : null}
      <Field label="Fairways Hit %">
        {displayBackendPercent(summary.fairwaysHitPercent)}
      </Field>
      <Field label="GIR %">{displayBackendPercent(summary.girPercent)}</Field>
      <Field label="Total Putts">
        {displayBackendNumber(summary.totalPutts)}
      </Field>
      <Field label="Putts / Hole">
        {displayBackendNumber(summary.puttsPerHole)}
      </Field>
      <Field label="Penalty Strokes">
        {displayBackendNumber(summary.totalPenaltyStrokes)}
      </Field>
    </dl>
  );
}

export function AthleteCompetitionPerformanceScores({
  athleteCompetitionScore,
  coachCompetitionScore,
  competitionPerformance,
  scoreToPar,
  presentation = "detail",
}: {
  athleteCompetitionScore: number | null;
  coachCompetitionScore: number | null;
  competitionPerformance: number | null;
  scoreToPar?: number | null;
  presentation?: SportsMetricsPresentation;
}) {
  if (presentation === "dashboard") {
    const pendingFinalPerformance = competitionPerformance === null;
    const athleteResultPresent = hasAthleteCompetitionResult({
      scoreToPar,
      athleteCompetitionScore,
    });
    const dominantValue =
      competitionPerformance !== null
        ? displayBackendNumber(competitionPerformance)
        : athleteResultPresent && scoreToPar != null
          ? displayScoreToPar(scoreToPar)
          : athleteResultPresent && athleteCompetitionScore !== null
            ? displayAthleteScoreOutOf100(athleteCompetitionScore)
            : "NO RESULT YET";
    const caption =
      competitionPerformance !== null
        ? undefined
        : athleteResultPresent && scoreToPar != null
          ? "SCORE TO PAR"
          : undefined;

    return (
      <div className={athletePerformanceGridClass(1)}>
        <AthletePerformanceStat
          title={
            competitionPerformance !== null
              ? "Competition Performance"
              : "\u00a0"
          }
          value={dominantValue}
          caption={caption}
          supporting={
            <>
              {athleteCompetitionScore !== null &&
              !(
                pendingFinalPerformance &&
                athleteResultPresent &&
                scoreToPar == null
              ) ? (
                <p>
                  Athlete score:{" "}
                  {displayAthleteScoreOutOf100(athleteCompetitionScore)}
                </p>
              ) : null}
              {coachCompetitionScore !== null ? (
                <p>
                  Coach score: {displayBackendNumber(coachCompetitionScore)}
                </p>
              ) : pendingFinalPerformance ? (
                <p>Coach assessment: Pending</p>
              ) : null}
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {scoreToPar !== undefined ? (
        <HighlightMetric
          label="Score to Par"
          value={displayScoreToPar(scoreToPar)}
        />
      ) : null}
      <HighlightMetric
        label="Athlete Competition Score"
        value={displayAthleteScoreOutOf100(athleteCompetitionScore)}
      />
      <HighlightMetric
        label="Coach Competition Score"
        value={displayBackendNumber(coachCompetitionScore)}
      />
      <HighlightMetric
        label="Competition Performance"
        value={displayBackendNumber(competitionPerformance)}
      />
    </div>
  );
}

export function AthleteCompetitionOgpCheckpoint({
  checkpoint,
  presentation = "detail",
}: {
  checkpoint: GolfOverallGolferPerformanceCheckpoint | null;
  presentation?: SportsMetricsPresentation;
}) {
  if (!checkpoint) {
    return (
      <p className="text-sm text-textSecondary">
        {presentation === "dashboard"
          ? "Overall performance available after a competition result."
          : "Competition performance required"}
      </p>
    );
  }

  if (presentation === "dashboard") {
    return (
      <AthletePerformanceStat
        title="Overall Golfer Performance"
        value={
          checkpoint.overallGolferPerformance === null
            ? "NO RESULT YET"
            : displayBackendNumber(checkpoint.overallGolferPerformance)
        }
        supporting={
          <>
            {checkpoint.practicePerformance !== null ? (
              <p>Practice {displayBackendNumber(checkpoint.practicePerformance)}</p>
            ) : null}
            {checkpoint.competitionPerformance !== null ? (
              <p>
                Competition{" "}
                {displayBackendNumber(checkpoint.competitionPerformance)}
              </p>
            ) : null}
            <p>{formatDateTime(checkpoint.checkpointAt)}</p>
          </>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <HighlightMetric
          label="Practice Performance"
          value={displayBackendNumber(checkpoint.practicePerformance)}
        />
        <HighlightMetric
          label="Competition Performance"
          value={displayBackendNumber(checkpoint.competitionPerformance)}
        />
        <HighlightMetric
          label="Overall Golfer Performance"
          value={displayBackendNumber(checkpoint.overallGolferPerformance)}
        />
      </div>
      <dl>
        <Field label="Checkpoint">
          {formatDateTime(checkpoint.checkpointAt)}
        </Field>
      </dl>
    </div>
  );
}

export function AthleteCompetitionReadOnlyHoles({
  holes,
}: {
  holes: GolfCompetitionHoleRead[];
}) {
  if (holes.length === 0) {
    return <p className="text-sm text-textSecondary">No hole results.</p>;
  }

  return (
    <div className="space-y-2">
      {holes.map((hole) => (
        <details
          key={hole.id}
          className="rounded-md border border-slate-200 p-3"
        >
          <summary className="cursor-pointer text-sm font-medium text-textPrimary">
            Hole {hole.holeNumber}
            {hole.outcome ? ` · ${hole.outcome}` : ""}
            {" · Score to Par "}
            {displayScoreToPar(hole.scoreToPar)}
          </summary>
          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Par">{String(hole.par)}</Field>
            <Field label="Strokes">{String(hole.strokes)}</Field>
            <Field label="Score to Par">
              {displayScoreToPar(hole.scoreToPar)}
            </Field>
            <Field label="Outcome">{hole.outcome ?? UNAVAILABLE}</Field>
            <Field label="Fairway Hit">{hole.fairwayHit}</Field>
            <Field label="Green in Regulation">
              {hole.greenInRegulation ? "Yes" : "No"}
            </Field>
            <Field label="Putts">{String(hole.putts)}</Field>
            <Field label="Penalty Strokes">
              {String(hole.penaltyStrokes)}
            </Field>
            <Field label="Satisfaction">
              {String(hole.satisfactionRating)}
            </Field>
            <Field label="Notes">{hole.notes?.trim() ? hole.notes : "—"}</Field>
          </dl>
        </details>
      ))}
    </div>
  );
}

export function AthleteCompetitionHistoryList({
  items,
  selectedId,
  onSelect,
  presentation = "detail",
  showRateCompetitionAction = false,
}: {
  items: GolfCompetitionHistoryPoint[];
  selectedId: string | null;
  onSelect: (competitionId: string) => void;
  presentation?: SportsMetricsPresentation;
  showRateCompetitionAction?: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-textSecondary">
        {presentation === "dashboard"
          ? "No competition result yet"
          : "No submitted competitions for this season."}
      </p>
    );
  }

  if (presentation === "dashboard") {
    return (
      <ul className={athletePerformanceGridClass(items.length)}>
        {items.map((item) => {
          const assessmentPending = item.coachCompetitionAssessment === null;
          const athleteResultPresent = hasAthleteCompetitionResult({
            scoreToPar: item.competitionSummary.scoreToPar,
            athleteCompetitionScore: item.athleteCompetitionScore,
          });
          const showRateAction =
            showRateCompetitionAction &&
            item.status === "SUBMITTED" &&
            assessmentPending;
          const dominantValue =
            item.competitionPerformance !== null
              ? displayBackendNumber(item.competitionPerformance)
              : athleteResultPresent && item.competitionSummary.scoreToPar != null
                ? displayScoreToPar(item.competitionSummary.scoreToPar)
                : athleteResultPresent && item.athleteCompetitionScore !== null
                  ? displayAthleteScoreOutOf100(item.athleteCompetitionScore)
                  : "NO RESULT YET";
          const caption =
            item.competitionPerformance !== null
              ? formatDateOnly(item.startDate)
              : athleteResultPresent && item.competitionSummary.scoreToPar != null
                ? "SCORE TO PAR"
                : formatDateOnly(item.startDate);

          return (
          <li key={item.id}>
            <button
              type="button"
              className={cn(
                "w-full text-left",
                selectedId === item.id
                  ? "rounded-md ring-2 ring-primary/70"
                  : "",
              )}
              onClick={() => onSelect(item.id)}
            >
              <AthletePerformanceStat
                title={item.name}
                value={dominantValue}
                caption={caption}
                supporting={
                  <>
                    {item.athleteCompetitionScore !== null &&
                    !(
                      item.competitionPerformance === null &&
                      item.competitionSummary.scoreToPar == null
                    ) ? (
                      <p>
                        Athlete score:{" "}
                        {displayAthleteScoreOutOf100(item.athleteCompetitionScore)}
                      </p>
                    ) : null}
                    {assessmentPending ? (
                      <p>COACH ASSESSMENT PENDING</p>
                    ) : item.overallGolferPerformanceCheckpoint
                        ?.overallGolferPerformance != null ? (
                      <p>
                        Overall{" "}
                        {displayBackendNumber(
                          item.overallGolferPerformanceCheckpoint
                            .overallGolferPerformance,
                        )}
                      </p>
                    ) : null}
                    {showRateAction ? <p>Rate Competition →</p> : null}
                  </>
                }
              />
            </button>
          </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            className={cn(
              "w-full rounded-md border p-3 text-left",
              selectedId === item.id
                ? "border-primary bg-primary/5"
                : "border-slate-200",
            )}
            onClick={() => onSelect(item.id)}
          >
            <p className="text-sm font-medium text-textPrimary">{item.name}</p>
            <p className="mt-1 text-xs text-textSecondary">
              {item.type} · {item.venue} · {formatDateOnly(item.startDate)} ·
              Season {String(item.seasonYear)}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <HighlightMetric
                label="Score to Par"
                value={displayScoreToPar(item.competitionSummary.scoreToPar)}
              />
              <HighlightMetric
                label="Competition Performance"
                value={displayBackendNumber(item.competitionPerformance)}
              />
              {item.overallGolferPerformanceCheckpoint ? (
                <HighlightMetric
                  label="Overall Golfer Performance"
                  value={displayBackendNumber(
                    item.overallGolferPerformanceCheckpoint
                      .overallGolferPerformance,
                  )}
                />
              ) : null}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function AthleteCompetitionSubmittedDetail({
  competition,
  presentation = "detail",
}: {
  competition: GolfCompetitionDetail;
  presentation?: SportsMetricsPresentation;
}) {
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const selectedDay =
    competition.days.find((day) => day.dayNumber === selectedDayNumber) ??
    competition.days[0] ??
    null;

  return (
    <div className="space-y-5">
      {presentation === "dashboard" ? (
        <div className="space-y-1">
          <h3 className="text-base font-medium text-textPrimary">
            {competition.name} — Competition Detail
          </h3>
          <p className="text-xs text-textSecondary">
            {competition.venue} · {formatDateOnly(competition.startDate)}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-base font-medium text-textPrimary">
            {competition.name}
          </h3>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Type">{competition.type}</Field>
            <Field label="Venue">{competition.venue}</Field>
            <Field label="Start date">
              {formatDateOnly(competition.startDate)}
            </Field>
            <Field label="Format">{String(competition.format)} holes</Field>
            <Field label="Number of days">{String(competition.numberOfDays)}</Field>
            <Field label="Season phase">{competition.seasonPhase}</Field>
          </dl>
        </div>
      )}

      <div className="space-y-2">
        {presentation === "detail" ? (
          <p className={DASHBOARD_SECTION_HEADING_CLASS}>Results</p>
        ) : null}
        <AthleteCompetitionPerformanceScores
          scoreToPar={competition.competitionSummary.scoreToPar}
          athleteCompetitionScore={competition.athleteCompetitionScore}
          coachCompetitionScore={competition.coachCompetitionScore}
          competitionPerformance={competition.competitionPerformance}
          presentation={presentation}
        />
      </div>

      {presentation === "dashboard" ? (
        <details className="rounded-md border border-border p-3">
          <summary className="cursor-pointer text-xs font-medium text-textSecondary">
            Supporting stats
          </summary>
          <div className="mt-3 space-y-3">
            <AthleteCompetitionHoleSummaryFields
              summary={competition.competitionSummary}
              includeScoreToPar={false}
            />
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Athlete Average Satisfaction">
                {displayBackendNumber(competition.athleteAverageSatisfaction)}
              </Field>
            </dl>
            {competition.coachCompetitionAssessment ? (
              <p className="text-xs text-textSecondary">
                Coach rating {String(competition.coachCompetitionAssessment.rating)}
              </p>
            ) : (
              <p className="text-xs text-textSecondary">Coach assessment pending</p>
            )}
          </div>
        </details>
      ) : (
        <>
      <div className="space-y-2">
        <p className={DASHBOARD_SECTION_HEADING_CLASS}>Supporting stats</p>
        <AthleteCompetitionHoleSummaryFields
          summary={competition.competitionSummary}
          includeScoreToPar={false}
        />
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Athlete Average Satisfaction">
            {displayBackendNumber(competition.athleteAverageSatisfaction)}
          </Field>
        </dl>
      </div>

      <div className="space-y-2 rounded-md border border-border p-4">
        <p className={DASHBOARD_SECTION_HEADING_CLASS}>Coach assessment</p>
        {competition.coachCompetitionAssessment ? (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Coach rating">
              {String(competition.coachCompetitionAssessment.rating)}
            </Field>
            <Field label="Coach notes">
              {competition.coachCompetitionAssessment.notes?.trim()
                ? competition.coachCompetitionAssessment.notes
                : "—"}
            </Field>
          </dl>
        ) : (
          <p className="text-sm text-textSecondary">Coach assessment pending</p>
        )}
      </div>
        </>
      )}

      {presentation === "dashboard" ? (
        <AthleteCompetitionOgpCheckpoint
          checkpoint={competition.overallGolferPerformanceCheckpoint}
          presentation={presentation}
        />
      ) : (
        <div className="space-y-2">
          <p className={DASHBOARD_SECTION_HEADING_CLASS}>
            Overall Golfer Performance
          </p>
          <AthleteCompetitionOgpCheckpoint
            checkpoint={competition.overallGolferPerformanceCheckpoint}
            presentation={presentation}
          />
        </div>
      )}

      {competition.days.length > 0 ? (
        presentation === "dashboard" ? (
          <details className="rounded-md border border-border p-3">
            <summary className="cursor-pointer text-xs font-medium text-textSecondary">
              Day evidence
            </summary>
            <div className="mt-3 space-y-3">
              <AthleteCompetitionDaySelector
                numberOfDays={competition.numberOfDays}
                selectedDayNumber={selectedDay?.dayNumber ?? 1}
                onSelect={setSelectedDayNumber}
              />
              {selectedDay ? (
                <div className="space-y-3">
                  <AthleteCompetitionHoleSummaryFields
                    summary={selectedDay.daySummary}
                  />
                  <AthleteCompetitionReadOnlyHoles
                    holes={selectedDay.holeResults}
                  />
                </div>
              ) : null}
            </div>
          </details>
        ) : (
          <div className="space-y-3">
            <p className={DASHBOARD_SECTION_HEADING_CLASS}>Day evidence</p>
            <AthleteCompetitionDaySelector
              numberOfDays={competition.numberOfDays}
              selectedDayNumber={selectedDay?.dayNumber ?? 1}
              onSelect={setSelectedDayNumber}
            />
            {selectedDay ? (
              <div className="space-y-3">
                <AthleteCompetitionHoleSummaryFields
                  summary={selectedDay.daySummary}
                />
                <AthleteCompetitionReadOnlyHoles
                  holes={selectedDay.holeResults}
                />
              </div>
            ) : null}
          </div>
        )
      ) : null}
    </div>
  );
}

export function AthleteCompetitionPerformanceSection({
  entityId,
  athleteId,
  trainingPlanVersionId,
  focusCompetitionId,
}: {
  entityId: string;
  athleteId: string;
  trainingPlanVersionId?: string | null;
  focusCompetitionId?: string | null;
}) {
  const resolvedEntityId = entityId.trim();
  const resolvedAthleteId = athleteId.trim();
  const versionId = trainingPlanVersionId?.trim() ?? "";
  const applicable =
    resolvedEntityId !== "" && resolvedAthleteId !== "" && versionId !== "";

  const [seasonCycleId, setSeasonCycleId] = useState<string | null>(null);
  const [seasonYear, setSeasonYear] = useState<number | null>(null);
  const [weeklySummary, setWeeklySummary] =
    useState<SportMetricsGolfWeeklySummary | null>(null);
  const [history, setHistory] = useState<GolfCompetitionHistoryData | null>(
    null,
  );
  const [detail, setDetail] = useState<GolfCompetitionDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const historicalCompetition =
    useSkillsGolfHistoryComparison()?.selectedWeek?.competitionPerformance ??
    null;

  useEffect(() => {
    if (!applicable) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const summary = await fetchSportMetricsGolfWeeklySummary({
          entityId: resolvedEntityId,
          athleteId: resolvedAthleteId,
          trainingPlanVersionId: versionId,
        });
        if (cancelled) return;
        const nextSeasonCycleId = summary.seasonCycleId?.trim() || null;
        setWeeklySummary(summary);
        setSeasonCycleId(nextSeasonCycleId);
        setSeasonYear(summary.seasonYear);
        setError(null);
        if (!nextSeasonCycleId) {
          setHistory(null);
          return;
        }
        const nextHistory = await fetchGolfCompetitionHistory({
          entityId: resolvedEntityId,
          athleteId: resolvedAthleteId,
          seasonCycleId: nextSeasonCycleId,
        });
        if (cancelled) return;
        setHistory(nextHistory);
      } catch (e) {
        if (cancelled) return;
        setError(formatError(e));
        setHistory(null);
        setWeeklySummary(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    applicable,
    focusCompetitionId,
    resolvedAthleteId,
    resolvedEntityId,
    versionId,
  ]);

  useEffect(() => {
    const focused = focusCompetitionId?.trim();
    if (focused) setSelectedId(focused);
  }, [focusCompetitionId]);

  useEffect(() => {
    if (!applicable || !selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const result = await fetchGolfCompetition({
          entityId: resolvedEntityId,
          athleteId: resolvedAthleteId,
          competitionId: selectedId,
        });
        if (cancelled) return;
        if (result.competition.status !== "SUBMITTED") {
          setDetail(null);
          return;
        }
        setDetail(result.competition);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(formatError(e));
        setDetail(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicable, resolvedAthleteId, resolvedEntityId, selectedId]);

  if (!applicable) return null;

  return (
    <Card
      title="Competition Performance"
      subtitle={
        seasonYear !== null
          ? `Season ${String(seasonYear)}`
          : "Submitted competitions for the current Skills season"
      }
      accent={false}
      padding="compact"
      className={cn(
        "shadow-[0_10px_30px_rgba(15,23,42,0.05)]",
        DASHBOARD_MAJOR_OUTER_CARD_CLASS,
      )}
      titleClassName={ATHLETE_DASHBOARD_CARD_TITLE_CLASS}
    >
      <div className="space-y-4">
        {error ? <Alert variant="danger">{error}</Alert> : null}
        {loading ? (
          <p className="text-sm text-textSecondary">
            Loading competition performance…
          </p>
        ) : null}
        {!loading && !seasonCycleId ? (
          <p className="text-sm text-textSecondary">
            Season cycle unavailable
          </p>
        ) : null}
        {history ? (
          <AthleteCompetitionHistoryList
            items={history.competitions}
            selectedId={selectedId}
            onSelect={setSelectedId}
            presentation="dashboard"
          />
        ) : null}
        {detail ? (
          <AthleteCompetitionSubmittedDetail
            competition={detail}
            presentation="dashboard"
          />
        ) : null}
        <SkillsGolfScalarHistoryComparison
          currentValue={weeklySummary?.competitionPerformance ?? null}
          historicalValue={historicalCompetition}
          unit="points"
        />
      </div>
    </Card>
  );
}
