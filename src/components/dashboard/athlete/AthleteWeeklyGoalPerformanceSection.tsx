"use client";

import { ATHLETE_DASHBOARD_CARD_TITLE_CLASS } from "@/components/dashboard/athlete/athleteDashboardTypography";
import { displayedPracticePerformanceScore } from "@/components/dashboard/athlete/OverallGolfPerformanceCard";
import {
  AthletePerformanceStat,
  athletePerformanceGridClass,
  formatAthleteMetricValue,
  formatAthleteTrendLabel,
  formatScoreOutOf100,
  formatTargetHint,
  formatTargetMetCaption,
  formatTaxonomyAreaLabel,
} from "@/components/dashboard/athlete/athleteSportsMetricsPresentation";
import {
  SkillsGolfItemHistoryComparison,
  SkillsGolfScalarHistoryComparison,
  useSkillsGolfHistoryComparison,
} from "@/components/dashboard/shared/SkillsGolfHistoryComparison";
import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import {
  fetchSportMetricsGolfWeeklySummary,
  findMatchingHistoricalExercise,
  findMatchingHistoricalGoal,
  findMatchingHistoricalTaxonomy,
  golfHistoryUnitsCompatible,
  hasSportMetricsGolfEvidence,
  isGolfCalibrationMeasurement,
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

function goalItemKey(group: SportMetricGoalEvidenceGroup, index: number): string {
  return group.goalId?.trim() || `goal-${index}`;
}

function WeeklyGoalHistoryComparison({
  goalEvidence,
}: {
  goalEvidence: SportMetricGoalEvidenceGroup[];
}) {
  const comparison = useSkillsGolfHistoryComparison();
  const [selectedKey, setSelectedKey] = useState("");
  const items = goalEvidence.map((group, index) => ({
    key: goalItemKey(group, index),
    label: group.goal.goalName?.trim() || group.goalTitle.trim() || "Weekly Goal",
  }));
  const effectiveKey = items.some((item) => item.key === selectedKey)
    ? selectedKey
    : (items[0]?.key ?? "");
  const current =
    goalEvidence.find(
      (group, index) => goalItemKey(group, index) === effectiveKey,
    ) ?? null;
  const historical = current
    ? findMatchingHistoricalGoal(
        current,
        comparison?.selectedWeek?.goalEvidence ?? [],
      )
    : null;
  const currentValue = current?.weeklyActual?.value ?? null;
  const currentUnit = current?.weeklyActual?.unit ?? current?.goal.primaryMetric?.unit ?? null;
  const historicalUnit =
    historical?.weeklyActual?.unit ?? historical?.goal.primaryMetric?.unit ?? null;
  const compatible =
    currentValue !== null &&
    historical?.weeklyActual != null &&
    golfHistoryUnitsCompatible(currentUnit, historicalUnit);
  const historicalValue = compatible ? historical.weeklyActual!.value : null;

  return (
    <SkillsGolfItemHistoryComparison
      selectId="skills-golf-history-goal"
      selectLabel="Goal"
      items={items}
      selectedKey={effectiveKey}
      onSelectedKeyChange={setSelectedKey}
      currentValue={currentValue}
      historicalValue={historicalValue}
      unit={currentUnit}
    />
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
        <div className={athletePerformanceGridClass(goalEvidence.length)}>
          {goalEvidence.map((group, index) => {
            const metric = group.goal.primaryMetric;
            const weeklyActual = group.weeklyActual;
            const targetUnit = weeklyActual?.unit ?? metric?.unit ?? null;
            const comparison = group.targetComparison;
            const targetHint = formatTargetHint(
              group.goal.targetValue,
              targetUnit,
              metric?.direction ?? weeklyActual?.direction ?? null,
            );
            const value = weeklyActual
              ? formatAthleteMetricValue(weeklyActual.value, weeklyActual.unit)
              : "NO RESULT YET";

            return (
              <AthletePerformanceStat
                key={`${group.goalId ?? "goal"}-${index}`}
                title={group.goal.goalName?.trim() || "Weekly Goal"}
                value={value}
                caption={
                  comparison
                    ? formatTargetMetCaption(comparison.targetMet)
                    : weeklyActual
                      ? "This week"
                      : undefined
                }
                supporting={
                  <>
                    {targetHint ? <p>{targetHint}</p> : null}
                    {weeklyActual && comparison ? <p>This week</p> : null}
                  </>
                }
              />
            );
          })}
        </div>
      )}
      <WeeklyGoalHistoryComparison goalEvidence={goalEvidence} />
    </MetricsSectionCard>
  );
}

function exerciseItemKey(
  item: SportMetricExerciseTrend,
  index: number,
): string {
  return item.exerciseId?.trim() || `exercise-${index}`;
}

function ExerciseHistoryComparison({
  exerciseTrends,
}: {
  exerciseTrends: SportMetricExerciseTrend[];
}) {
  const comparison = useSkillsGolfHistoryComparison();
  const [selectedKey, setSelectedKey] = useState("");
  const items = exerciseTrends.map((item, index) => ({
    key: exerciseItemKey(item, index),
    label: item.exerciseName?.trim() || "Exercise",
  }));
  const effectiveKey = items.some((item) => item.key === selectedKey)
    ? selectedKey
    : (items[0]?.key ?? "");
  const current =
    exerciseTrends.find(
      (item, index) => exerciseItemKey(item, index) === effectiveKey,
    ) ?? null;
  const historical = current
    ? findMatchingHistoricalExercise(
        current,
        comparison?.selectedWeek?.exerciseTrends ?? [],
      )
    : null;
  const currentValue = current?.currentActual ?? null;
  const compatible =
    currentValue !== null &&
    historical !== null &&
    historical.currentActual !== null &&
    golfHistoryUnitsCompatible(current?.unit, historical.unit);
  const historicalValue = compatible ? historical.currentActual : null;

  return (
    <SkillsGolfItemHistoryComparison
      selectId="skills-golf-history-exercise"
      selectLabel="Exercise"
      items={items}
      selectedKey={effectiveKey}
      onSelectedKeyChange={setSelectedKey}
      currentValue={currentValue}
      historicalValue={historicalValue}
      unit={current?.unit ?? null}
      directionalDifference={
        current ? !isGolfCalibrationMeasurement(current) : true
      }
    />
  );
}

export function AthleteExercisePerformanceContent({
  exerciseTrends,
  audience = "athlete",
}: {
  exerciseTrends: SportMetricExerciseTrend[];
  audience?: "athlete" | "coach";
}) {
  return (
    <MetricsSectionCard title="Exercise Performance">
      {exerciseTrends.length === 0 ? (
        <p className="text-sm text-textSecondary">
          No exercise performance returned for this plan week.
        </p>
      ) : (
        <div className={athletePerformanceGridClass(exerciseTrends.length)}>
          {exerciseTrends.map((item, index) => {
            const calibration = isGolfCalibrationMeasurement(item);
            const trendLabel = calibration
              ? ""
              : formatAthleteTrendLabel(item.trendDirection);
            const taxonomyLabel = formatTaxonomyAreaLabel(item.taxonomyAreaKey);
            const directionLabel = calibration
              ? "Calibration value"
              : formatGoalMetricDirection(item.direction);
            const current =
              item.currentActual === null
                ? "NO RESULT YET"
                : formatAthleteMetricValue(item.currentActual, item.unit);
            const previous =
              item.previousActual === null
                ? "First recorded result"
                : `Previous: ${formatAthleteMetricValue(item.previousActual, item.unit)}`;

            return (
              <AthletePerformanceStat
                key={`${item.exerciseId ?? "exercise"}-${index}`}
                title={item.exerciseName?.trim() || "Exercise"}
                value={current}
                caption={
                  item.currentActual === null
                    ? undefined
                    : calibration
                      ? "Current measurement"
                      : "Current performance"
                }
                supporting={
                  <>
                    {directionLabel ? <p>{directionLabel}</p> : null}
                    <p>{previous}</p>
                    {taxonomyLabel ? <p>{taxonomyLabel}</p> : null}
                    {audience === "coach" && item.linkedGoal?.goalName ? (
                      <p>{item.linkedGoal.goalName}</p>
                    ) : null}
                    {trendLabel !== "" ? <p>{trendLabel}</p> : null}
                  </>
                }
              />
            );
          })}
        </div>
      )}
      <ExerciseHistoryComparison exerciseTrends={exerciseTrends} />
    </MetricsSectionCard>
  );
}

function taxonomyItemKey(
  score: SportMetricTaxonomyScore,
  index: number,
): string {
  return score.taxonomyAreaKey?.trim() || `taxonomy-${index}`;
}

function TaxonomyHistoryComparison({
  taxonomyScores,
}: {
  taxonomyScores: SportMetricTaxonomyScore[];
}) {
  const comparison = useSkillsGolfHistoryComparison();
  const [selectedKey, setSelectedKey] = useState("");
  const items = taxonomyScores.map((score, index) => ({
    key: taxonomyItemKey(score, index),
    label:
      formatTaxonomyAreaLabel(score.taxonomyAreaKey) ||
      score.taxonomyAreaKey?.trim() ||
      "Taxonomy",
  }));
  const effectiveKey = items.some((item) => item.key === selectedKey)
    ? selectedKey
    : (items[0]?.key ?? "");
  const current =
    taxonomyScores.find(
      (score, index) => taxonomyItemKey(score, index) === effectiveKey,
    ) ?? null;
  const historical = current
    ? findMatchingHistoricalTaxonomy(
        current,
        comparison?.selectedWeek?.taxonomyScores ?? [],
      )
    : null;

  return (
    <SkillsGolfItemHistoryComparison
      selectId="skills-golf-history-taxonomy"
      selectLabel="Taxonomy"
      items={items}
      selectedKey={effectiveKey}
      onSelectedKeyChange={setSelectedKey}
      currentValue={current?.scoreOutOf100 ?? null}
      historicalValue={historical?.scoreOutOf100 ?? null}
      unit="points"
    />
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
  const strongestLabel = strongestTaxonomy
    ? formatTaxonomyAreaLabel(strongestTaxonomy.taxonomyAreaKey) ||
      strongestTaxonomy.taxonomyAreaKey
    : null;
  const weakestLabel = weakestTaxonomy
    ? formatTaxonomyAreaLabel(weakestTaxonomy.taxonomyAreaKey) ||
      weakestTaxonomy.taxonomyAreaKey
    : null;

  return (
    <MetricsSectionCard title="Taxonomy Performance">
      {taxonomyScores.length === 0 ? (
        <p className="text-sm text-textSecondary">
          No taxonomy performance returned for this plan week.
        </p>
      ) : (
        <div className={athletePerformanceGridClass(taxonomyScores.length)}>
          {taxonomyScores.map((score, index) => {
            const title =
              formatTaxonomyAreaLabel(score.taxonomyAreaKey) ||
              score.taxonomyAreaKey?.trim() ||
              "Taxonomy";
            const hasScore = score.scoreOutOf100 !== null;
            return (
              <AthletePerformanceStat
                key={`${score.taxonomyAreaKey ?? "taxonomy"}-${index}`}
                title={title}
                value={
                  hasScore
                    ? formatScoreOutOf100(score.scoreOutOf100 as number)
                    : "BASELINE"
                }
                caption={hasScore ? "Current week" : undefined}
                supporting={
                  hasScore ? (
                    score.multiWeekScoreOutOf100 !== null ? (
                      <p>
                        Multi-week {formatScoreOutOf100(score.multiWeekScoreOutOf100)}
                      </p>
                    ) : (
                      <p>Current week</p>
                    )
                  ) : (
                    <p>Trend available after comparable results</p>
                  )
                }
              />
            );
          })}
        </div>
      )}
      {strongestLabel || weakestLabel ? (
        <p className="mt-3 text-xs text-textSecondary">
          {strongestLabel ? `Strongest: ${strongestLabel}` : null}
          {strongestLabel && weakestLabel ? " · " : null}
          {weakestLabel ? `Weakest: ${weakestLabel}` : null}
        </p>
      ) : null}
      <TaxonomyHistoryComparison taxonomyScores={taxonomyScores} />
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

function coachPracticeRatingMeaning(rating: number): string | null {
  const option = COACH_PRACTICE_RATING_OPTIONS.find((item) => item.rating === rating);
  if (!option) return null;
  const separator = " — ";
  const index = option.label.indexOf(separator);
  if (index === -1) return null;
  return option.label.slice(index + separator.length);
}

export function AthletePracticePerformanceContent({
  summary,
  audience = "athlete",
}: {
  summary: SportMetricsGolfWeeklySummary;
  audience?: "athlete" | "coach";
}) {
  const historyComparison = useSkillsGolfHistoryComparison();
  const hasScore = summary.practiceScoreOutOf100 !== null;
  const hasExerciseEvidence =
    summary.exerciseTrends.some((item) => item.currentActual !== null) ||
    hasSportMetricsGolfEvidence(summary);
  const isAthlete = audience === "athlete";
  const displayedScore = displayedPracticePerformanceScore(summary);
  const historicalScore = displayedPracticePerformanceScore(
    historyComparison?.selectedWeek ?? null,
  );
  const athleteRatingRows = summary.coachPracticeRatings.filter(
    (row) => row.rating !== null && (row.taxonomyAreaKey?.trim() ?? "") !== "",
  );

  return (
    <MetricsSectionCard title="Practice Performance">
      <AthletePerformanceStat
        title="Practice Performance"
        value={
          displayedScore !== null
            ? formatAthleteMetricValue(displayedScore, null)
            : isAthlete
              ? "NO RESULT YET"
              : "BASELINE WEEK"
        }
        caption={
          !hasScore && (isAthlete || displayedScore !== null)
            ? "BASELINE WEEK"
            : undefined
        }
        supporting={
          <>
            {isAthlete
              ? athleteRatingRows.map((row, index) => {
                  const meaning = coachPracticeRatingMeaning(row.rating as number);
                  const taxonomyLabel = formatTaxonomyAreaLabel(row.taxonomyAreaKey);
                  return (
                    <div key={`${row.taxonomyAreaKey}-${index}`}>
                      {meaning ? (
                        <p>
                          {taxonomyLabel}: {meaning}
                        </p>
                      ) : null}
                      <p>Coach rating: {String(row.rating)} / 5</p>
                    </div>
                  );
                })
              : null}
            {!hasScore && hasExerciseEvidence ? (
              <p>
                {isAthlete
                  ? "Exercise results recorded"
                  : "Exercise evidence recorded"}
              </p>
            ) : null}
            {summary.practiceSideScoreOutOf100 !== null ? (
              <p>
                Practice-side Performance{" "}
                {formatScoreOutOf100(summary.practiceSideScoreOutOf100)}
              </p>
            ) : null}
            {!isAthlete || athleteRatingRows.length === 0 ? (
              <p>
                {summary.coachPracticeScoreOutOf100 === null
                  ? "Coach rating: Pending"
                  : `Coach Practice Performance ${formatScoreOutOf100(summary.coachPracticeScoreOutOf100)}`}
              </p>
            ) : null}
            {!hasScore ? (
              <p>
                {isAthlete
                  ? "Your trend will appear after another comparable week."
                  : "Trend available after comparable results"}
              </p>
            ) : null}
            {audience === "coach"
              ? summary.coachPracticeRatings
                  .filter((row) => row.rating !== null)
                  .map((row, index) => (
                    <p key={`${row.taxonomyAreaKey ?? "rating"}-${index}`}>
                      {(formatTaxonomyAreaLabel(row.taxonomyAreaKey) ||
                        row.taxonomyAreaKey ||
                        "Taxonomy") +
                        ": " +
                        String(row.rating)}
                    </p>
                  ))
              : null}
          </>
        }
      />
      <SkillsGolfScalarHistoryComparison
        currentValue={displayedScore}
        historicalValue={historicalScore}
        unit="points"
      />
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
                {formatTaxonomyAreaLabel(key) || key}
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
  audience,
  coachRatingForm,
}: {
  summary: SportMetricsGolfWeeklySummary;
  allowCoachPracticeRating?: boolean;
  audience?: "athlete" | "coach";
  coachRatingForm?: React.ReactNode;
}) {
  const resolvedAudience =
    audience ?? (allowCoachPracticeRating ? "coach" : "athlete");

  return (
    <div className="min-w-0 space-y-4">
      <AthleteWeeklyGoalPerformanceContent
        weekStartDate={summary.weekStartDate}
        weekEndDate={summary.weekEndDate}
        goalEvidence={summary.goalEvidence}
      />
      <AthleteExercisePerformanceContent
        exerciseTrends={summary.exerciseTrends}
        audience={resolvedAudience}
      />
      <AthleteTaxonomyPerformanceContent
        taxonomyScores={summary.taxonomyScores}
        strongestTaxonomy={summary.strongestTaxonomy}
        weakestTaxonomy={summary.weakestTaxonomy}
      />
      <AthletePracticePerformanceContent
        summary={summary}
        audience={resolvedAudience}
      />
      {allowCoachPracticeRating ? coachRatingForm : null}
    </div>
  );
}

export function AthleteWeeklyGoalPerformanceSection({
  entityId,
  athleteId,
  trainingPlanVersionId,
  allowCoachPracticeRating = false,
  audience,
}: {
  entityId: string;
  athleteId: string;
  trainingPlanVersionId?: string | null;
  allowCoachPracticeRating?: boolean;
  audience?: "athlete" | "coach";
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
      audience={audience}
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
