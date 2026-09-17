"use client";

import {
  AthleteCompetitionHistoryList,
  AthleteCompetitionSubmittedDetail,
} from "@/components/dashboard/athlete/AthleteCompetitionPerformanceSection";
import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import {
  SkillsGolfScalarHistoryComparison,
  useSkillsGolfHistoryComparison,
} from "@/components/dashboard/shared/SkillsGolfHistoryComparison";
import { DASHBOARD_CARD_TITLE_CLASS } from "@/components/dashboard/shared/dashboardTypography";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import {
  fetchGolfCompetition,
  fetchGolfCompetitionHistory,
  postGolfCoachCompetitionAssessment,
  type GolfCompetitionDetail,
  type GolfCompetitionHistoryData,
  type GolfCompetitionSatisfactionRating,
  type PostGolfCoachCompetitionAssessmentPayload,
} from "@/lib/api/sportMetricsGolfCompetitions";
import { fetchSportMetricsGolfWeeklySummary, type SportMetricsGolfWeeklySummary } from "@/lib/api/sportMetricsGolf";
import { isNormalizedApiError } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const COACH_COMPETITION_RATING_OPTIONS: Array<{
  value: GolfCompetitionSatisfactionRating;
  label: string;
}> = [
  { value: 1, label: "1 — Very Poor" },
  { value: 2, label: "2 — Poor" },
  { value: 3, label: "3 — Average / Stable" },
  { value: 4, label: "4 — Good" },
  { value: 5, label: "5 — Very Good" },
];

function formatError(e: unknown): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return "Unable to load Competition Performance.";
}

export function canShowCoachCompetitionAssessmentForm(
  detail: GolfCompetitionDetail | null,
): boolean {
  return (
    detail?.status === "SUBMITTED" &&
    detail.coachCompetitionAssessment === null
  );
}

export async function submitCoachCompetitionAssessmentThenRefetch(params: {
  entityId: string;
  athleteId: string;
  competitionId: string;
  payload: PostGolfCoachCompetitionAssessmentPayload;
}): Promise<GolfCompetitionDetail> {
  await postGolfCoachCompetitionAssessment(
    params.entityId,
    params.athleteId,
    params.competitionId,
    params.payload,
  );
  const result = await fetchGolfCompetition({
    entityId: params.entityId,
    athleteId: params.athleteId,
    competitionId: params.competitionId,
  });
  return result.competition;
}

export function CoachCompetitionAssessmentForm({
  disabled,
  submitting,
  onSubmit,
}: {
  disabled?: boolean;
  submitting?: boolean;
  onSubmit: (payload: PostGolfCoachCompetitionAssessmentPayload) => void;
}) {
  const [rating, setRating] = useState<"" | GolfCompetitionSatisfactionRating>(
    "",
  );
  const [notes, setNotes] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (rating === "" || disabled || submitting) return;
        const payload: PostGolfCoachCompetitionAssessmentPayload = { rating };
        if (notes.trim() !== "") payload.notes = notes.trim();
        onSubmit(payload);
      }}
    >
      <FormField
        id="coach-competition-rating"
        label="Coach Competition Rating"
        required
      >
        <Select
          id="coach-competition-rating"
          value={rating === "" ? "" : String(rating)}
          disabled={disabled || submitting}
          onChange={(event: { target: { value: string } }) =>
            setRating(
              event.target.value === ""
                ? ""
                : (Number(event.target.value) as GolfCompetitionSatisfactionRating),
            )
          }
        >
          <option value="">Select</option>
          {COACH_COMPETITION_RATING_OPTIONS.map((option) => (
            <option key={option.value} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField id="coach-competition-notes" label="Notes">
        <textarea
          id="coach-competition-notes"
          rows={3}
          value={notes}
          disabled={disabled || submitting}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          onChange={(event) => setNotes(event.target.value)}
        />
      </FormField>
      <Button type="submit" loading={submitting} disabled={disabled || submitting || rating === ""}>
        Save assessment
      </Button>
    </form>
  );
}

export function CoachCompetitionPerformanceSection({
  entityId,
  athleteId,
  trainingPlanVersionId,
}: {
  entityId: string;
  athleteId: string;
  trainingPlanVersionId?: string | null;
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
  const [submitting, setSubmitting] = useState(false);
  const historicalCompetition =
    useSkillsGolfHistoryComparison()?.selectedWeek?.competitionPerformance ??
    null;

  useEffect(() => {
    if (!applicable) return;
    let cancelled = false;
    setLoading(true);
    setSelectedId(null);
    setDetail(null);
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
  }, [applicable, resolvedAthleteId, resolvedEntityId, versionId]);

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

  const canAssess = canShowCoachCompetitionAssessmentForm(detail);

  async function onAssess(payload: PostGolfCoachCompetitionAssessmentPayload) {
    if (!detail || submitting || !canAssess) return;
    setSubmitting(true);
    setError(null);
    try {
      const nextDetail = await submitCoachCompetitionAssessmentThenRefetch({
        entityId: resolvedEntityId,
        athleteId: resolvedAthleteId,
        competitionId: detail.id,
        payload,
      });
      setDetail(nextDetail);
    } catch (e) {
      setError(formatError(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card
      title="Competition Performance"
      subtitle={
        seasonYear !== null
          ? `Season ${String(seasonYear)}`
          : "Submitted competitions for the athlete Skills season"
      }
      accent={false}
      padding="compact"
      className={cn(
        "shadow-[0_10px_30px_rgba(15,23,42,0.05)]",
        DASHBOARD_MAJOR_OUTER_CARD_CLASS,
      )}
      titleClassName={DASHBOARD_CARD_TITLE_CLASS}
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
            showRateCompetitionAction
          />
        ) : null}
        {detail ? (
          <div className="space-y-4 rounded-md border border-primary/80 bg-card p-4">
            <AthleteCompetitionSubmittedDetail
              competition={detail}
              presentation="dashboard"
            />
            {canAssess ? (
              <div className="space-y-3 rounded-md border border-border p-4">
                <p className="text-sm font-medium text-textPrimary">
                  Coach assessment
                </p>
                <CoachCompetitionAssessmentForm
                  submitting={submitting}
                  onSubmit={(payload) => {
                    void onAssess(payload);
                  }}
                />
              </div>
            ) : null}
          </div>
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
