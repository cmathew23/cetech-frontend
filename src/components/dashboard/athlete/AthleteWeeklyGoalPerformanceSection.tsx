"use client";

import { ATHLETE_DASHBOARD_CARD_TITLE_CLASS } from "@/components/dashboard/athlete/athleteDashboardTypography";
import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import {
  fetchSportMetricsGolfWeeklySummary,
  postGolfCoachPracticeRating,
  releasedPlanTaxonomyAreaKeys,
  submitGolfCoachPracticeRatingThenRefetch,
  type SportMetricExerciseTrend,
  type SportMetricGoalEvidenceGroup,
  type SportMetricTaxonomyScore,
  type SportMetricsGolfWeeklySummary,
} from "@/lib/api/sportMetricsGolf";
import { isNormalizedApiError } from "@/lib/apiClient";
import { formatDateOnly } from "@/lib/dateTime";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

function formatLoadError(e: unknown): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return "Unable to load weekly Goal performance.";
}

export function formatGoalMetricDirection(direction: string | null): string {
  if (direction === "HIGHER_IS_BETTER") return "Higher is better";
  if (direction === "LOWER_IS_BETTER") return "Lower is better";
  return direction?.trim() ?? "";
}

export function formatTrendDirectionLabel(direction: string | null): string {
  if (direction === "UP") return "Up";
  if (direction === "DOWN") return "Down";
  if (direction === "NEUTRAL") return "Neutral";
  return direction?.trim() ?? "";
}

function formatValueWithUnit(
  value: number | string | null,
  unit: string | null,
): string {
  if (value === null) return "";
  const unitLabel = unit?.trim() ?? "";
  return unitLabel === "" ? String(value) : `${value} ${unitLabel}`;
}

function formatCopiedNumber(value: number | null, missingLabel: string): string {
  if (value === null) return missingLabel;
  return String(value);
}

function formatWeekRange(
  startDate: string | null,
  endDate: string | null,
): string {
  const start = startDate?.trim() ?? "";
  const end = endDate?.trim() ?? "";
  if (start === "" || end === "") return "—";
  return `${formatDateOnly(start, start)} – ${formatDateOnly(end, end)}`;
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

function MetricsSectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      title={title}
      subtitle={subtitle}
      accent={false}
      padding="compact"
      className={cn(
        "shadow-[0_10px_30px_rgba(15,23,42,0.05)]",
        DASHBOARD_MAJOR_OUTER_CARD_CLASS,
      )}
      titleClassName={ATHLETE_DASHBOARD_CARD_TITLE_CLASS}
    >
      {children}
    </Card>
  );
}

export function AthleteWeeklyGoalPerformanceContent({
  weekStartDate,
  weekEndDate,
  goalEvidence,
}: {
  weekStartDate: string;
  weekEndDate: string;
  goalEvidence: SportMetricGoalEvidenceGroup[];
}) {
  const weekLabel =
    weekStartDate.trim() !== "" && weekEndDate.trim() !== ""
      ? `${formatDateOnly(weekStartDate, weekStartDate)} – ${formatDateOnly(weekEndDate, weekEndDate)}`
      : null;

  return (
    <MetricsSectionCard
      title="Weekly Goal Performance"
      subtitle={weekLabel ?? undefined}
    >
      {goalEvidence.length === 0 ? (
        <p className="text-sm text-textSecondary">
          No weekly Goal performance returned for this plan week.
        </p>
      ) : (
        <div className="space-y-4">
          {goalEvidence.map((group, index) => {
            const metric = group.goal.primaryMetric;
            const weeklyActual = group.weeklyActual;
            const targetValue = group.goal.targetValue;
            const targetUnit = metric?.unit ?? null;
            const comparison = group.targetComparison;

            return (
              <article
                key={`${group.goalId ?? "goal"}-${index}`}
                className="space-y-3 rounded-md border border-border bg-card p-4"
              >
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Goal">
                    {group.goal.goalName?.trim() || "—"}
                  </Field>
                  <Field label="Success Criterion">
                    {group.goal.successCriteria?.trim() || "—"}
                  </Field>
                  <Field label="Metric">{metric?.key?.trim() || "—"}</Field>
                  <Field label="Unit">{metric?.unit?.trim() || "—"}</Field>
                  <Field label="Direction">
                    {formatGoalMetricDirection(metric?.direction ?? null) || "—"}
                  </Field>
                  <Field label="Weekly Actual">
                    {weeklyActual
                      ? formatValueWithUnit(weeklyActual.value, weeklyActual.unit)
                      : "No result recorded"}
                  </Field>
                  <Field label="Target">
                    {targetValue === null
                      ? "Not set"
                      : formatValueWithUnit(targetValue, targetUnit)}
                  </Field>
                  {comparison ? (
                    <Field label="Target Result">
                      {comparison.targetMet ? "Target met" : "Target not met"}
                    </Field>
                  ) : null}
                </dl>
                <div>
                  <p className="mb-2 text-xs text-textSecondary">Goal history</p>
                  {group.history.length === 0 ? (
                    <p className="text-sm text-textSecondary">No Goal history</p>
                  ) : (
                    <ul className="space-y-2">
                      {group.history.map((observation, historyIndex) => (
                        <li
                          key={`${observation.planStartDate ?? "history"}-${historyIndex}`}
                          className="text-sm text-textPrimary"
                        >
                          <p>
                            {formatWeekRange(
                              observation.planStartDate,
                              observation.planEndDate,
                            )}
                          </p>
                          <p>
                            Actual:{" "}
                            {observation.actual === null
                              ? "Not enough data"
                              : formatValueWithUnit(observation.actual, targetUnit)}
                          </p>
                          {observation.targetValue !== null ? (
                            <p>
                              Target:{" "}
                              {formatValueWithUnit(
                                observation.targetValue,
                                targetUnit,
                              )}
                            </p>
                          ) : null}
                          {observation.targetComparison ? (
                            <p>
                              {observation.targetComparison.targetMet
                                ? "Target met"
                                : "Target not met"}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </MetricsSectionCard>
  );
}

export function AthleteExercisePerformanceContent({
  exerciseTrends,
}: {
  exerciseTrends: SportMetricExerciseTrend[];
}) {
  return (
    <MetricsSectionCard title="Exercise Performance">
      {exerciseTrends.length === 0 ? (
        <p className="text-sm text-textSecondary">
          No exercise performance returned for this plan week.
        </p>
      ) : (
        <div className="space-y-4">
          {exerciseTrends.map((item, index) => {
            const trendLabel = formatTrendDirectionLabel(item.trendDirection);
            return (
              <article
                key={`${item.exerciseId ?? "exercise"}-${index}`}
                className="space-y-3 rounded-md border border-border bg-card p-4"
              >
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Exercise Name">
                    {item.exerciseName?.trim() || "—"}
                  </Field>
                  {item.linkedGoal?.goalName ? (
                    <Field label="Goal">{item.linkedGoal.goalName}</Field>
                  ) : null}
                  <Field label="Taxonomy">
                    {item.taxonomyAreaKey?.trim() || "—"}
                  </Field>
                  <Field label="Metric">{item.metricName?.trim() || "—"}</Field>
                  <Field label="Unit">{item.unit?.trim() || "—"}</Field>
                  <Field label="Direction">
                    {formatGoalMetricDirection(item.direction) || "—"}
                  </Field>
                  <Field label="Exercise Type">
                    {item.exerciseType?.trim() || "—"}
                  </Field>
                  <Field label="Current Actual">
                    {item.currentActual === null
                      ? "Not enough data"
                      : formatValueWithUnit(item.currentActual, item.unit)}
                  </Field>
                  <Field label="Previous Actual">
                    {item.previousActual === null
                      ? "No previous result"
                      : formatValueWithUnit(item.previousActual, item.unit)}
                  </Field>
                  {trendLabel !== "" ? (
                    <Field label="Trend Direction">{trendLabel}</Field>
                  ) : null}
                </dl>
                <div>
                  <p className="mb-2 text-xs text-textSecondary">
                    Exercise history
                  </p>
                  {item.history.length === 0 ? (
                    <p className="text-sm text-textSecondary">
                      No exercise history
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {item.history.map((observation, historyIndex) => (
                        <li
                          key={`${observation.planStartDate ?? "history"}-${historyIndex}`}
                          className="text-sm text-textPrimary"
                        >
                          {formatWeekRange(
                            observation.planStartDate,
                            observation.planEndDate,
                          )}
                          {": "}
                          {observation.actual === null
                            ? "Not enough data"
                            : formatValueWithUnit(observation.actual, item.unit)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </MetricsSectionCard>
  );
}

function TaxonomyScoreFields({
  score,
}: {
  score: SportMetricTaxonomyScore;
}) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Taxonomy">
        {score.taxonomyAreaKey?.trim() || "—"}
      </Field>
      <Field label="Current Week score">
        {formatCopiedNumber(score.scoreOutOf100, "Not enough data")}
      </Field>
      <Field label="Direction">
        {formatGoalMetricDirection(score.direction) || "Not enough data"}
      </Field>
      <Field label="YTrend">
        {formatCopiedNumber(score.YTrend, "Not enough data")}
      </Field>
      <Field label="ZTrend">
        {formatCopiedNumber(score.ZTrend, "Not enough data")}
      </Field>
      <Field label="Multi-week score">
        {formatCopiedNumber(score.multiWeekScoreOutOf100, "Not enough data")}
      </Field>
      <Field label="Multi-week direction">
        {formatGoalMetricDirection(score.multiWeekDirection) || "Not enough data"}
      </Field>
      {score.rank !== null ? <Field label="Rank">{String(score.rank)}</Field> : null}
    </dl>
  );
}

export function AthleteTaxonomyPerformanceContent({
  taxonomyScores,
  strongestTaxonomy,
  weakestTaxonomy,
}: {
  taxonomyScores: SportMetricTaxonomyScore[];
  strongestTaxonomy: SportMetricTaxonomyScore | null;
  weakestTaxonomy: SportMetricTaxonomyScore | null;
}) {
  return (
    <MetricsSectionCard title="Taxonomy Performance">
      <div className="space-y-4">
        {taxonomyScores.length === 0 ? (
          <p className="text-sm text-textSecondary">
            No taxonomy performance returned for this plan week.
          </p>
        ) : (
          taxonomyScores.map((score, index) => (
            <article
              key={`${score.taxonomyAreaKey ?? "taxonomy"}-${index}`}
              className="space-y-3 rounded-md border border-border bg-card p-4"
            >
              <TaxonomyScoreFields score={score} />
              <div>
                <p className="mb-2 text-xs text-textSecondary">
                  Taxonomy history
                </p>
                {score.history.length === 0 ? (
                  <p className="text-sm text-textSecondary">
                    No taxonomy history
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {score.history.map((observation, historyIndex) => (
                      <li
                        key={`${observation.planStartDate ?? "history"}-${historyIndex}`}
                        className="text-sm text-textPrimary"
                      >
                        {formatWeekRange(
                          observation.planStartDate,
                          observation.planEndDate,
                        )}
                        {": "}
                        {formatCopiedNumber(
                          observation.scoreOutOf100,
                          "Not enough data",
                        )}
                        {observation.direction
                          ? ` · ${formatGoalMetricDirection(observation.direction)}`
                          : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))
        )}

        <article className="space-y-3 rounded-md border border-border bg-card p-4">
          <p className="text-sm font-medium text-textPrimary">Strongest taxonomy</p>
          {strongestTaxonomy ? (
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Taxonomy">
                {strongestTaxonomy.taxonomyAreaKey?.trim() || "—"}
              </Field>
              <Field label="Multi-week score">
                {formatCopiedNumber(
                  strongestTaxonomy.multiWeekScoreOutOf100,
                  "Not enough data",
                )}
              </Field>
              <Field label="Multi-week direction">
                {formatGoalMetricDirection(strongestTaxonomy.multiWeekDirection) ||
                  "Not enough data"}
              </Field>
              {strongestTaxonomy.rank !== null ? (
                <Field label="Rank">{String(strongestTaxonomy.rank)}</Field>
              ) : null}
            </dl>
          ) : (
            <p className="text-sm text-textSecondary">
              No strongest taxonomy available
            </p>
          )}
        </article>

        <article className="space-y-3 rounded-md border border-border bg-card p-4">
          <p className="text-sm font-medium text-textPrimary">Weakest taxonomy</p>
          {weakestTaxonomy ? (
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Taxonomy">
                {weakestTaxonomy.taxonomyAreaKey?.trim() || "—"}
              </Field>
              <Field label="Multi-week score">
                {formatCopiedNumber(
                  weakestTaxonomy.multiWeekScoreOutOf100,
                  "Not enough data",
                )}
              </Field>
              <Field label="Multi-week direction">
                {formatGoalMetricDirection(weakestTaxonomy.multiWeekDirection) ||
                  "Not enough data"}
              </Field>
              {weakestTaxonomy.rank !== null ? (
                <Field label="Rank">{String(weakestTaxonomy.rank)}</Field>
              ) : null}
            </dl>
          ) : (
            <p className="text-sm text-textSecondary">
              No weakest taxonomy available
            </p>
          )}
        </article>
      </div>
    </MetricsSectionCard>
  );
}

export const COACH_PRACTICE_RATING_OPTIONS = [
  { rating: 1, label: "1 — Very Poor" },
  { rating: 2, label: "2 — Poor" },
  { rating: 3, label: "3 — Average / Stable" },
  { rating: 4, label: "4 — Good" },
  { rating: 5, label: "5 — Very Good" },
] as const;

export function AthletePracticePerformanceContent({
  summary,
}: {
  summary: SportMetricsGolfWeeklySummary;
}) {
  const ratedKeys = new Set(
    summary.coachPracticeRatings
      .map((row) => row.taxonomyAreaKey?.trim() ?? "")
      .filter((key) => key !== ""),
  );
  const unratedKeys = releasedPlanTaxonomyAreaKeys(summary).filter(
    (key) => !ratedKeys.has(key),
  );

  return (
    <MetricsSectionCard title="Practice Performance">
      <div className="space-y-4">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Practice Performance">
            {formatCopiedNumber(summary.practiceScoreOutOf100, "Not enough data")}
          </Field>
          {summary.practiceNormalizedScore !== null ? (
            <Field label="Practice normalized">
              {String(summary.practiceNormalizedScore)}
            </Field>
          ) : null}
          <Field label="Coach Practice Performance">
            {formatCopiedNumber(
              summary.coachPracticeScoreOutOf100,
              "Not rated",
            )}
          </Field>
          {summary.coachPracticeNormalized !== null ? (
            <Field label="Coach Practice normalized">
              {String(summary.coachPracticeNormalized)}
            </Field>
          ) : null}
          <Field label="Practice-side Performance">
            {formatCopiedNumber(
              summary.practiceSideScoreOutOf100,
              "Unavailable",
            )}
          </Field>
          {summary.practiceSideNormalized !== null ? (
            <Field label="Practice-side normalized">
              {String(summary.practiceSideNormalized)}
            </Field>
          ) : null}
        </dl>

        <div>
          <p className="mb-2 text-xs text-textSecondary">Coach Practice Ratings</p>
          {summary.coachPracticeRatings.length === 0 && unratedKeys.length === 0 ? (
            <p className="text-sm text-textSecondary">No Coach Practice Ratings</p>
          ) : (
            <ul className="space-y-2">
              {summary.coachPracticeRatings.map((row, index) => (
                <li
                  key={`${row.taxonomyAreaKey ?? "rating"}-${index}`}
                  className="text-sm text-textPrimary"
                >
                  {(row.taxonomyAreaKey?.trim() || "—") +
                    ": " +
                    (row.rating === null ? "Unrated" : String(row.rating)) +
                    (row.coachRatingScoreOutOf100 === null
                      ? ""
                      : ` · ${row.coachRatingScoreOutOf100}`)}
                </li>
              ))}
              {unratedKeys.map((key) => (
                <li key={`unrated-${key}`} className="text-sm text-textSecondary">
                  {key}: Unrated
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </MetricsSectionCard>
  );
}

export function CoachPracticeRatingForm({
  summary,
  taxonomyAreaKey,
  rating,
  error,
  submitting,
  onTaxonomyAreaKeyChange,
  onRatingChange,
  onSubmit,
}: {
  summary: SportMetricsGolfWeeklySummary;
  taxonomyAreaKey: string;
  rating: number | "";
  error: string | null;
  submitting: boolean;
  onTaxonomyAreaKeyChange: (value: string) => void;
  onRatingChange: (value: number | "") => void;
  onSubmit: () => void;
}) {
  const taxonomies = releasedPlanTaxonomyAreaKeys(summary);
  if (taxonomies.length === 0) {
    return (
      <MetricsSectionCard title="Coach Practice Rating">
        <p className="text-sm text-textSecondary">
          No released-plan taxonomies available to rate.
        </p>
      </MetricsSectionCard>
    );
  }

  return (
    <MetricsSectionCard title="Coach Practice Rating">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label className="block space-y-1">
          <span className="text-xs text-textSecondary">Taxonomy</span>
          <Select
            value={taxonomyAreaKey}
            onChange={(event: { target: { value: string } }) =>
              onTaxonomyAreaKeyChange(event.target.value)
            }
          >
            {taxonomies.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-textSecondary">Rating</span>
          <Select
            value={rating === "" ? "" : String(rating)}
            onChange={(event: { target: { value: string } }) => {
              const next = Number(event.target.value);
              onRatingChange(Number.isInteger(next) ? next : "");
            }}
          >
            <option value="">Select rating</option>
            {COACH_PRACTICE_RATING_OPTIONS.map((option) => (
              <option key={option.rating} value={option.rating}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
        {error ? <Alert variant="danger">{error}</Alert> : null}
        <Button type="submit" disabled={submitting || rating === ""}>
          Submit rating
        </Button>
      </form>
    </MetricsSectionCard>
  );
}

export function AthleteSportsMetricsStep4aContent({
  summary,
  allowCoachPracticeRating = false,
  coachRatingForm,
}: {
  summary: SportMetricsGolfWeeklySummary;
  allowCoachPracticeRating?: boolean;
  coachRatingForm?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-4">
      <AthleteWeeklyGoalPerformanceContent
        weekStartDate={summary.weekStartDate}
        weekEndDate={summary.weekEndDate}
        goalEvidence={summary.goalEvidence}
      />
      <AthleteExercisePerformanceContent
        exerciseTrends={summary.exerciseTrends}
      />
      <AthleteTaxonomyPerformanceContent
        taxonomyScores={summary.taxonomyScores}
        strongestTaxonomy={summary.strongestTaxonomy}
        weakestTaxonomy={summary.weakestTaxonomy}
      />
      <AthletePracticePerformanceContent summary={summary} />
      {allowCoachPracticeRating ? coachRatingForm : null}
    </div>
  );
}

export function AthleteWeeklyGoalPerformanceSection({
  entityId,
  athleteId,
  trainingPlanVersionId,
  allowCoachPracticeRating = false,
}: {
  entityId: string;
  athleteId: string;
  trainingPlanVersionId?: string | null;
  allowCoachPracticeRating?: boolean;
}) {
  const [summary, setSummary] = useState<SportMetricsGolfWeeklySummary | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [resolvedFetchKey, setResolvedFetchKey] = useState("");
  const [reloadKey, setReloadKey] = useState(1);
  const [taxonomyAreaKey, setTaxonomyAreaKey] = useState("");
  const [rating, setRating] = useState<number | "">("");
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);

  const versionId = trainingPlanVersionId?.trim() ?? "";
  const hasIdentifiers = entityId.trim() !== "" && athleteId.trim() !== "";
  const fetchKey =
    hasIdentifiers && versionId !== ""
      ? `${entityId.trim()}|${athleteId.trim()}|${versionId}|${reloadKey}`
      : "";
  const isLoading = fetchKey !== "" && fetchKey !== resolvedFetchKey;

  useEffect(() => {
    if (!hasIdentifiers || versionId === "" || fetchKey === "") return;

    let cancelled = false;
    void (async () => {
      try {
        const nextSummary = await fetchSportMetricsGolfWeeklySummary({
          entityId: entityId.trim(),
          athleteId: athleteId.trim(),
          trainingPlanVersionId: versionId,
        });
        if (cancelled) return;
        setSummary(nextSummary);
        setError(null);
        setResolvedFetchKey(fetchKey);
      } catch (e) {
        if (cancelled) return;
        setSummary(null);
        setError(formatLoadError(e));
        setResolvedFetchKey(fetchKey);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [athleteId, entityId, fetchKey, hasIdentifiers, versionId]);

  useEffect(() => {
    if (!summary) return;
    const keys = releasedPlanTaxonomyAreaKeys(summary);
    setTaxonomyAreaKey((current) =>
      current !== "" && keys.includes(current) ? current : (keys[0] ?? ""),
    );
  }, [summary]);

  const reload = () => setReloadKey((current) => current + 1);

  const submitCoachRating = () => {
    if (typeof rating !== "number") return;
    setSubmittingRating(true);
    setRatingError(null);
    void (async () => {
      try {
        const nextSummary = await submitGolfCoachPracticeRatingThenRefetch({
          postRating: () =>
            postGolfCoachPracticeRating(entityId.trim(), athleteId.trim(), {
              trainingPlanVersionId: versionId,
              taxonomyAreaKey,
              rating,
            }),
          refetchWeeklySummary: () =>
            fetchSportMetricsGolfWeeklySummary({
              entityId: entityId.trim(),
              athleteId: athleteId.trim(),
              trainingPlanVersionId: versionId,
            }),
        });
        setSummary(nextSummary);
      } catch (e) {
        setRatingError(formatLoadError(e));
      } finally {
        setSubmittingRating(false);
      }
    })();
  };

  if (!hasIdentifiers) {
    return (
      <MetricsSectionCard title="Weekly Goal Performance">
        <p className="text-sm text-textSecondary">
          Preparing weekly Goal performance…
        </p>
      </MetricsSectionCard>
    );
  }

  if (versionId === "") {
    return (
      <MetricsSectionCard title="Weekly Goal Performance">
        <p className="text-sm text-textSecondary">
          No Skills plan week available for weekly Goal performance yet.
        </p>
      </MetricsSectionCard>
    );
  }

  if (isLoading) {
    return (
      <MetricsSectionCard title="Weekly Goal Performance">
        <p className="text-sm text-textSecondary">Loading…</p>
      </MetricsSectionCard>
    );
  }

  if (error) {
    return (
      <MetricsSectionCard title="Weekly Goal Performance">
        <div className="space-y-3">
          <Alert variant="danger">{error}</Alert>
          <Button type="button" variant="secondary" onClick={reload}>
            Try again
          </Button>
        </div>
      </MetricsSectionCard>
    );
  }

  if (!summary) {
    return (
      <MetricsSectionCard title="Weekly Goal Performance">
        <p className="text-sm text-textSecondary">
          No weekly Goal performance returned for this plan week.
        </p>
      </MetricsSectionCard>
    );
  }

  return (
    <AthleteSportsMetricsStep4aContent
      summary={summary}
      allowCoachPracticeRating={allowCoachPracticeRating}
      coachRatingForm={
        <CoachPracticeRatingForm
          summary={summary}
          taxonomyAreaKey={taxonomyAreaKey}
          rating={rating}
          error={ratingError}
          submitting={submittingRating}
          onTaxonomyAreaKeyChange={setTaxonomyAreaKey}
          onRatingChange={setRating}
          onSubmit={submitCoachRating}
        />
      }
    />
  );
}
