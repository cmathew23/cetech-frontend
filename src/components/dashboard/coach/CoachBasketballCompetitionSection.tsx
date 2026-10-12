"use client";

import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import {
  DASHBOARD_CARD_TITLE_CLASS,
  DASHBOARD_METRIC_STATUS_CLASS,
  DASHBOARD_METRIC_SUPPORTING_CLASS,
  DASHBOARD_METRIC_TILE_CLASS,
  DASHBOARD_METRIC_TITLE_CLASS,
  dashboardMetricGridClass,
} from "@/components/dashboard/shared/dashboardTypography";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  createBasketballCompetitionAssessment,
  fetchBasketballCompetitionAssessments,
  fetchSportMetricsBasketballWeeklySummary,
  submitBasketballCompetitionAssessment,
  type BasketballCompetitionAssessment,
} from "@/lib/api/sportMetricsBasketball";
import { isNormalizedApiError } from "@/lib/apiClient";
import { formatDateOnly } from "@/lib/dateTime";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const RATING_VALUES = [1, 2, 3, 4, 5] as const;

function formatError(error: unknown): string {
  if (isNormalizedApiError(error)) return error.message;
  if (error instanceof Error && error.message.trim() !== "") return error.message;
  return "Unable to save Competition.";
}

function taxonomyKeysFromSummary(
  scores: Array<{ taxonomyAreaKey: string | null }>,
): string[] {
  const keys: string[] = [];
  for (const score of scores) {
    const key = score.taxonomyAreaKey?.trim() ?? "";
    if (key !== "" && !keys.includes(key)) keys.push(key);
  }
  return keys;
}

function integerRating(value: string): number | null {
  if (!/^[1-5]$/.test(value)) return null;
  return Number(value);
}

export function CoachBasketballCompetitionForm({
  taxonomyKeys,
  creating,
  onCreate,
}: {
  taxonomyKeys: string[];
  creating: boolean;
  onCreate: (input: {
    competitionName: string;
    competitionDate: string;
    taxonomyRatings: Record<string, number>;
  }) => void;
}) {
  const [competitionName, setCompetitionName] = useState("");
  const [competitionDate, setCompetitionDate] = useState("");
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const taxonomyRatings = Object.fromEntries(
    taxonomyKeys.flatMap((key) => {
      const rating = integerRating(ratings[key] ?? "");
      return rating === null ? [] : [[key, rating]];
    }),
  );
  const complete =
    taxonomyKeys.length > 0 &&
    competitionName.trim() !== "" &&
    competitionDate.trim() !== "" &&
    taxonomyKeys.every((key) => taxonomyRatings[key] !== undefined);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!complete || creating) return;
        onCreate({
          competitionName: competitionName.trim(),
          competitionDate,
          taxonomyRatings,
        });
      }}
    >
      <FormField id="competition-name" label="Competition Name" required>
        <Input
          id="competition-name"
          value={competitionName}
          disabled={creating}
          onChange={(event: { target: { value: string } }) =>
            setCompetitionName(event.target.value)
          }
          required
        />
      </FormField>
      <FormField id="competition-date" label="Competition Date" required>
        <Input
          id="competition-date"
          type="date"
          value={competitionDate}
          disabled={creating}
          onChange={(event: { target: { value: string } }) =>
            setCompetitionDate(event.target.value)
          }
          required
        />
      </FormField>
      {taxonomyKeys.map((key) => (
        <FormField key={key} id={`basketball-taxonomy-${key}`} label={`${key} rating`} required>
          <Select
            id={`basketball-taxonomy-${key}`}
            value={ratings[key] ?? ""}
            disabled={creating}
            onChange={(event: { target: { value: string } }) =>
              setRatings((current) => ({ ...current, [key]: event.target.value }))
            }
          >
            <option value="">Select</option>
            {RATING_VALUES.map((rating) => (
              <option key={rating} value={String(rating)}>
                {rating}
              </option>
            ))}
          </Select>
        </FormField>
      ))}
      <Button type="submit" loading={creating} disabled={creating || !complete}>
        Create draft
      </Button>
    </form>
  );
}

export function CoachBasketballCompetitionResult({
  assessment,
}: {
  assessment: BasketballCompetitionAssessment;
}) {
  return (
    <>
      {assessment.competitionPerformance !== null ? (
        <p>Competition Performance: {String(assessment.competitionPerformance)}</p>
      ) : null}
      {assessment.normalizedTaxonomyScores
        ? Object.entries(assessment.normalizedTaxonomyScores).map(([key, score]) => (
            <p key={key}>
              {key}: {String(score)}
            </p>
          ))
        : null}
    </>
  );
}

function keepBackendResult(
  incoming: BasketballCompetitionAssessment,
  previous?: BasketballCompetitionAssessment,
): BasketballCompetitionAssessment {
  if (!previous) return incoming;
  const competitionPerformance =
    incoming.competitionPerformance ?? previous.competitionPerformance;
  const normalizedTaxonomyScores =
    incoming.normalizedTaxonomyScores ?? previous.normalizedTaxonomyScores;
  return {
    ...incoming,
    status: incoming.status ?? previous.status,
    competitionPerformance,
    normalizedTaxonomyScores,
  };
}

export function CoachBasketballCompetitionCards({
  assessments,
  onSelect,
}: {
  assessments: BasketballCompetitionAssessment[];
  onSelect: (assessmentId: string) => void;
}) {
  return (
    <div className={dashboardMetricGridClass(assessments.length)}>
      {assessments.map((assessment) => (
        <button
          key={assessment.id}
          type="button"
          className={cn(DASHBOARD_METRIC_TILE_CLASS, "text-left")}
          onClick={() => onSelect(assessment.id)}
        >
          <h4 className={DASHBOARD_METRIC_TITLE_CLASS}>
            {assessment.competitionName || "Competition"}
          </h4>
          {assessment.status ? (
            <p className={DASHBOARD_METRIC_STATUS_CLASS}>{assessment.status}</p>
          ) : null}
          <div className={DASHBOARD_METRIC_SUPPORTING_CLASS}>
            <p>{formatDateOnly(assessment.competitionDate)}</p>
            {Object.entries(assessment.taxonomyRatings).map(([key, rating]) => (
              <p key={key}>
                {key} rating: {String(rating)}
              </p>
            ))}
            <CoachBasketballCompetitionResult assessment={assessment} />
          </div>
        </button>
      ))}
    </div>
  );
}

export function CoachBasketballCompetitionSection({
  entityId,
  athleteId,
  trainingPlanVersionId,
  onSubmitted,
}: {
  entityId: string;
  athleteId: string;
  trainingPlanVersionId?: string | null;
  onSubmitted?: () => void;
}) {
  const resolvedEntityId = entityId.trim();
  const resolvedAthleteId = athleteId.trim();
  const versionId = trainingPlanVersionId?.trim() ?? "";
  const applicable =
    resolvedEntityId !== "" && resolvedAthleteId !== "" && versionId !== "";

  const [seasonCycleId, setSeasonCycleId] = useState<string | null>(null);
  const [seasonYear, setSeasonYear] = useState<number | null>(null);
  const [taxonomyKeys, setTaxonomyKeys] = useState<string[]>([]);
  const [assessments, setAssessments] = useState<BasketballCompetitionAssessment[]>([]);
  const [openAssessmentId, setOpenAssessmentId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!applicable) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const summary = await fetchSportMetricsBasketballWeeklySummary({
          entityId: resolvedEntityId,
          athleteId: resolvedAthleteId,
          trainingPlanVersionId: versionId,
        });
        if (cancelled) return;
        const nextSeasonCycleId = summary.seasonCycleId?.trim() || null;
        setSeasonCycleId(nextSeasonCycleId);
        setSeasonYear(summary.seasonYear);
        setTaxonomyKeys(taxonomyKeysFromSummary(summary.competitionTaxonomyScores));
        if (!nextSeasonCycleId) {
          setAssessments([]);
          return;
        }
        const nextAssessments = await fetchBasketballCompetitionAssessments({
          entityId: resolvedEntityId,
          athleteId: resolvedAthleteId,
          seasonCycleId: nextSeasonCycleId,
        });
        if (cancelled) return;
        setAssessments((current) => {
          const retained = current.filter(
            (assessment) =>
              !nextAssessments.some((item) => item.id === assessment.id),
          );
          const refreshed = nextAssessments.map((assessment) =>
            keepBackendResult(
              assessment,
              current.find((item) => item.id === assessment.id),
            ),
          );
          return [...retained, ...refreshed];
        });
      } catch (loadError) {
        if (cancelled) return;
        setError(formatError(loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicable, resolvedAthleteId, resolvedEntityId, reloadKey, versionId]);

  if (!applicable) return null;

  const openAssessment =
    assessments.find((assessment) => assessment.id === openAssessmentId) ?? null;

  function replaceAssessment(next: BasketballCompetitionAssessment) {
    setAssessments((current) => {
      const exists = current.some((assessment) => assessment.id === next.id);
      if (!exists) return [next, ...current];
      return current.map((assessment) => (assessment.id === next.id ? next : assessment));
    });
    setOpenAssessmentId(next.id);
  }

  async function onCreate(input: {
    competitionName: string;
    competitionDate: string;
    taxonomyRatings: Record<string, number>;
  }) {
    if (!seasonCycleId || creating) return;
    setCreating(true);
    setError(null);
    try {
      const created = await createBasketballCompetitionAssessment(
        resolvedEntityId,
        resolvedAthleteId,
        {
          seasonCycleId,
          competitionName: input.competitionName,
          competitionDate: input.competitionDate,
          taxonomyRatings: input.taxonomyRatings,
        },
      );
      replaceAssessment(created);
      setShowCreate(false);
      setReloadKey((current) => current + 1);
    } catch (createError) {
      setError(formatError(createError));
    } finally {
      setCreating(false);
    }
  }

  async function onSubmit(assessmentId: string) {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const submitted = await submitBasketballCompetitionAssessment({
        entityId: resolvedEntityId,
        athleteId: resolvedAthleteId,
        assessmentId,
      });
      replaceAssessment(submitted);
      setReloadKey((current) => current + 1);
      onSubmitted?.();
    } catch (submitError) {
      setError(formatError(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card
      title="Competitions"
      subtitle={seasonYear !== null ? `Season ${String(seasonYear)}` : undefined}
      accent={false}
      padding="compact"
      className={cn(
        "shadow-[0_10px_30px_rgba(15,23,42,0.05)]",
        DASHBOARD_MAJOR_OUTER_CARD_CLASS,
      )}
      titleClassName={DASHBOARD_CARD_TITLE_CLASS}
      actions={
        <Button
          type="button"
          onClick={() => {
            setOpenAssessmentId(null);
            setShowCreate(true);
          }}
        >
          + Add Competition
        </Button>
      }
    >
      <div className="space-y-4">
        {error ? <Alert variant="danger">{error}</Alert> : null}
        {loading ? (
          <p className="text-sm text-textSecondary">Loading competitions…</p>
        ) : null}
        {!loading && !seasonCycleId ? (
          <p className="text-sm text-textSecondary">Season cycle unavailable</p>
        ) : null}
        {showCreate && seasonCycleId ? (
          <CoachBasketballCompetitionForm
            taxonomyKeys={taxonomyKeys}
            creating={creating}
            onCreate={(input) => {
              void onCreate(input);
            }}
          />
        ) : null}
        {!loading && seasonCycleId && assessments.length === 0 ? (
          <p className="text-sm text-textSecondary">
            No competitions recorded for this season.
          </p>
        ) : null}
        {assessments.length > 0 ? (
          <CoachBasketballCompetitionCards
            assessments={assessments}
            onSelect={(assessmentId) => {
              setShowCreate(false);
              setOpenAssessmentId(assessmentId);
            }}
          />
        ) : null}
        {openAssessment ? (
          <div className="space-y-3 rounded-md border border-primary/80 bg-card p-4">
            {openAssessment.status ? (
              <p className={DASHBOARD_METRIC_STATUS_CLASS}>{openAssessment.status}</p>
            ) : null}
            <CoachBasketballCompetitionResult assessment={openAssessment} />
            {openAssessment.status === "SUBMITTED" ? (
              <Alert variant="success" role="status">
                Competition submitted. This entry is read-only.
              </Alert>
            ) : (
              <Button
                type="button"
                loading={submitting}
                disabled={submitting}
                onClick={() => {
                  void onSubmit(openAssessment.id);
                }}
              >
                Submit competition
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
