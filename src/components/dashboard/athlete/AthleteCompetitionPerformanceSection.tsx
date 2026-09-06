"use client";

import { AthleteCompetitionDaySelector } from "@/components/dashboard/athlete/AthleteCompetitionEntrySection";
import { ATHLETE_DASHBOARD_CARD_TITLE_CLASS } from "@/components/dashboard/athlete/athleteDashboardTypography";
import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
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
import { fetchSportMetricsGolfWeeklySummary } from "@/lib/api/sportMetricsGolf";
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

export function displayBackendNumber(value: number | null): string {
  if (value === null) return UNAVAILABLE;
  return String(value);
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

export function AthleteCompetitionHoleSummaryFields({
  summary,
}: {
  summary: GolfCompetitionHoleSummary;
}) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Score to Par">
        <span className="text-lg font-medium">
          {displayBackendNumber(summary.scoreToPar)}
        </span>
      </Field>
      <Field label="Fairways Hit %">
        {displayBackendNumber(summary.fairwaysHitPercent)}
      </Field>
      <Field label="GIR %">{displayBackendNumber(summary.girPercent)}</Field>
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
}: {
  athleteCompetitionScore: number | null;
  coachCompetitionScore: number | null;
  competitionPerformance: number | null;
}) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Athlete Competition Score">
        {displayBackendNumber(athleteCompetitionScore)}
      </Field>
      <Field label="Coach Competition Score">
        {displayBackendNumber(coachCompetitionScore)}
      </Field>
      <Field label="Competition Performance">
        {displayBackendNumber(competitionPerformance)}
      </Field>
    </dl>
  );
}

export function AthleteCompetitionOgpCheckpoint({
  checkpoint,
}: {
  checkpoint: GolfOverallGolferPerformanceCheckpoint | null;
}) {
  if (!checkpoint) {
    return (
      <p className="text-sm text-textSecondary">
        Competition performance required
      </p>
    );
  }

  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Practice Performance">
        {displayBackendNumber(checkpoint.practicePerformance)}
      </Field>
      <Field label="Competition Performance">
        {displayBackendNumber(checkpoint.competitionPerformance)}
      </Field>
      <Field label="Overall Golfer Performance">
        {displayBackendNumber(checkpoint.overallGolferPerformance)}
      </Field>
      <Field label="Checkpoint">
        {formatDateTime(checkpoint.checkpointAt)}
      </Field>
    </dl>
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
          </summary>
          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Par">{String(hole.par)}</Field>
            <Field label="Strokes">{String(hole.strokes)}</Field>
            <Field label="Score to Par">
              {displayBackendNumber(hole.scoreToPar)}
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
}: {
  items: GolfCompetitionHistoryPoint[];
  selectedId: string | null;
  onSelect: (competitionId: string) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-textSecondary">
        No submitted competitions for this season.
      </p>
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
            <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Field label="Type">{item.type}</Field>
              <Field label="Venue">{item.venue}</Field>
              <Field label="Start date">{formatDateOnly(item.startDate)}</Field>
              <Field label="Season">{String(item.seasonYear)}</Field>
              <Field label="Score to Par">
                {displayBackendNumber(item.competitionSummary.scoreToPar)}
              </Field>
              <Field label="Athlete Competition Score">
                {displayBackendNumber(item.athleteCompetitionScore)}
              </Field>
              <Field label="Coach Competition Score">
                {displayBackendNumber(item.coachCompetitionScore)}
              </Field>
              <Field label="Competition Performance">
                {displayBackendNumber(item.competitionPerformance)}
              </Field>
              <Field label="Overall Golfer Performance">
                {item.overallGolferPerformanceCheckpoint
                  ? displayBackendNumber(
                      item.overallGolferPerformanceCheckpoint
                        .overallGolferPerformance,
                    )
                  : UNAVAILABLE}
              </Field>
            </dl>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function AthleteCompetitionSubmittedDetail({
  competition,
}: {
  competition: GolfCompetitionDetail;
}) {
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const selectedDay =
    competition.days.find((day) => day.dayNumber === selectedDayNumber) ??
    competition.days[0] ??
    null;

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Competition">{competition.name}</Field>
        <Field label="Type">{competition.type}</Field>
        <Field label="Venue">{competition.venue}</Field>
        <Field label="Start date">
          {formatDateOnly(competition.startDate)}
        </Field>
        <Field label="Format">{String(competition.format)} holes</Field>
        <Field label="Number of days">{String(competition.numberOfDays)}</Field>
        <Field label="Season phase">{competition.seasonPhase}</Field>
      </dl>

      <AthleteCompetitionHoleSummaryFields
        summary={competition.competitionSummary}
      />
      <AthleteCompetitionPerformanceScores
        athleteCompetitionScore={competition.athleteCompetitionScore}
        coachCompetitionScore={competition.coachCompetitionScore}
        competitionPerformance={competition.competitionPerformance}
      />

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

      <div className="space-y-2">
        <p className="text-sm font-medium text-textPrimary">
          Overall Golfer Performance
        </p>
        <AthleteCompetitionOgpCheckpoint
          checkpoint={competition.overallGolferPerformanceCheckpoint}
        />
      </div>

      {competition.days.length > 0 ? (
        <div className="space-y-3">
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
  const [history, setHistory] = useState<GolfCompetitionHistoryData | null>(
    null,
  );
  const [detail, setDetail] = useState<GolfCompetitionDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          />
        ) : null}
        {detail ? (
          <AthleteCompetitionSubmittedDetail competition={detail} />
        ) : null}
      </div>
    </Card>
  );
}
