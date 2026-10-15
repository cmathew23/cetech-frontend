"use client";

import { ATHLETE_DASHBOARD_CARD_TITLE_CLASS } from "@/components/dashboard/athlete/athleteDashboardTypography";
import {
  AthletePerformanceStat,
  athletePerformanceGridClass,
} from "@/components/dashboard/athlete/athleteSportsMetricsPresentation";
import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import { DashboardMetricTile } from "@/components/dashboard/shared/DashboardMetricTile";
import { dashboardMetricGridClass } from "@/components/dashboard/shared/dashboardTypography";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import {
  fetchSportMetricsBasketballWeeklySummary,
  type BasketballExercisePerformance,
  type BasketballGoalEvidence,
  type BasketballTargetComparison,
  type BasketballTaxonomyScore,
  type BasketballWeeklySummary,
} from "@/lib/api/sportMetricsBasketball";
import { fetchSportMetricsFootballWeeklySummary } from "@/lib/api/sportMetricsFootball";
import { isNormalizedApiError } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { useEffect, useState, type ReactNode } from "react";

const NO_RESULT_YET = "NO RESULT YET";

function displayBasketballScore(value: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return NO_RESULT_YET;
  return String(value);
}

function formatLoadError(error: unknown): string {
  if (isNormalizedApiError(error)) return error.message;
  if (error instanceof Error && error.message.trim() !== "") return error.message;
  return "Could not load basketball performance.";
}

function PerformanceCard({
  title,
  titleClassName,
  children,
}: {
  title: string;
  titleClassName: string;
  children: ReactNode;
}) {
  return (
    <Card
      title={title}
      accent={false}
      padding="compact"
      className={cn(
        "shadow-[0_10px_30px_rgba(15,23,42,0.05)]",
        DASHBOARD_MAJOR_OUTER_CARD_CLASS,
      )}
      titleClassName={titleClassName}
    >
      {children}
    </Card>
  );
}

function ExercisePerformanceCard({
  exercises,
  titleClassName,
}: {
  exercises: BasketballExercisePerformance[];
  titleClassName: string;
}) {
  return (
    <PerformanceCard title="Exercise Performance" titleClassName={titleClassName}>
      {exercises.length === 0 ? (
        <p className="text-sm text-textSecondary">
          No exercise performance returned for this plan week.
        </p>
      ) : (
        <div className={dashboardMetricGridClass(exercises.length)}>
          {exercises.map((item, index) => {
            const metric = item.metricName ?? item.metricKey;
            return (
              <DashboardMetricTile
                key={`${item.exerciseId ?? item.skillCode ?? "exercise"}-${index}`}
                title={item.exerciseName ?? item.skillCode ?? "Exercise"}
                value={displayBasketballScore(item.currentActual)}
                supporting={
                  <>
                    {metric !== null ? <p>Metric: {metric}</p> : null}
                    {item.unit !== null ? <p>Unit: {item.unit}</p> : null}
                    <p>
                      {item.previousActual === null
                        ? "First recorded result"
                        : `Previous: ${String(item.previousActual)}`}
                    </p>
                    {item.trendDirection !== null ? (
                      <p>Trend: {item.trendDirection}</p>
                    ) : null}
                  </>
                }
              />
            );
          })}
        </div>
      )}
    </PerformanceCard>
  );
}

function TargetLines({
  targetValue,
  comparison,
}: {
  targetValue: number | null;
  comparison: BasketballTargetComparison | null;
}) {
  const targetMet =
    comparison?.targetMet === true
      ? "Target met"
      : comparison?.targetMet === false
        ? "Target not met"
        : null;

  return (
    <>
      {targetValue !== null ? <p>Target: {String(targetValue)}</p> : null}
      {comparison ? (
        <>
          {comparison.targetValue !== null ? (
            <p>Comparison target: {String(comparison.targetValue)}</p>
          ) : null}
          {comparison.actualValue !== null ? (
            <p>Comparison actual: {String(comparison.actualValue)}</p>
          ) : null}
          {comparison.direction !== null ? <p>Direction: {comparison.direction}</p> : null}
          {targetMet ? <p>{targetMet}</p> : null}
        </>
      ) : null}
    </>
  );
}

function GoalPerformanceCard({
  goals,
  titleClassName,
}: {
  goals: BasketballGoalEvidence[];
  titleClassName: string;
}) {
  return (
    <PerformanceCard title="Goal Performance" titleClassName={titleClassName}>
      {goals.length === 0 ? (
        <p className="text-sm text-textSecondary">
          No weekly Goal performance returned for this plan week.
        </p>
      ) : (
        <div className={athletePerformanceGridClass(goals.length)}>
          {goals.map((group, index) => {
            const metric = group.goal.primaryMetric;
            const weeklyActual = group.weeklyActual;
            const metricKey = weeklyActual?.metricKey ?? metric?.key ?? null;
            const unit = weeklyActual?.unit ?? metric?.unit ?? null;
            const value = weeklyActual && weeklyActual.value !== null
              ? String(weeklyActual.value)
              : NO_RESULT_YET;

            return (
              <AthletePerformanceStat
                key={`${group.goalId ?? "goal"}-${index}`}
                title={group.goal.goalName?.trim() || "Goal"}
                value={value}
                supporting={
                  <>
                    {metricKey !== null ? <p>Metric: {metricKey}</p> : null}
                    {unit !== null ? <p>Unit: {unit}</p> : null}
                    <TargetLines
                      targetValue={group.goal.targetValue}
                      comparison={group.targetComparison}
                    />
                  </>
                }
              />
            );
          })}
        </div>
      )}
    </PerformanceCard>
  );
}

function TaxonomyPerformanceCard({
  scores,
  titleClassName,
}: {
  scores: BasketballTaxonomyScore[];
  titleClassName: string;
}) {
  return (
    <PerformanceCard title="Taxonomy Performance" titleClassName={titleClassName}>
      {scores.length === 0 ? (
        <p className="text-sm text-textSecondary">{NO_RESULT_YET}</p>
      ) : (
        <div className={dashboardMetricGridClass(scores.length)}>
          {scores.map((score, index) => (
            <DashboardMetricTile
              key={`${score.taxonomyAreaKey ?? "taxonomy"}-${index}`}
              title={score.taxonomyAreaKey ?? "Taxonomy"}
              value={displayBasketballScore(score.scoreOutOf100)}
              supporting={
                <>
                  {score.normalizedScore !== null ? (
                    <p>Normalized: {String(score.normalizedScore)}</p>
                  ) : null}
                  {score.direction !== null ? <p>Direction: {score.direction}</p> : null}
                </>
              }
            />
          ))}
        </div>
      )}
    </PerformanceCard>
  );
}

function BasketballOverallPerformanceCard({
  summary,
  titleClassName,
  sportCode = "BASKETBALL",
}: {
  summary: BasketballWeeklySummary;
  titleClassName: string;
  sportCode?: "BASKETBALL" | "FOOTBALL";
}) {
  const practicePerformance =
    sportCode === "FOOTBALL"
      ? summary.coachPracticeScoreOutOf100
      : summary.practiceScoreOutOf100;
  return (
    <PerformanceCard title="Overall Performance" titleClassName={titleClassName}>
      <div className={athletePerformanceGridClass(3)}>
        <AthletePerformanceStat
          title="Practice Performance"
          value={displayBasketballScore(practicePerformance)}
        />
        <AthletePerformanceStat
          title="Competition Performance"
          value={displayBasketballScore(summary.competitionPerformance)}
          supporting={
            summary.competitionTaxonomyScores.length > 0 ? (
              <>
                {summary.competitionTaxonomyScores.map((score, index) => (
                  <p key={`${score.taxonomyAreaKey ?? "taxonomy"}-${index}`}>
                    {score.taxonomyAreaKey ?? "Taxonomy"}:{" "}
                    {displayBasketballScore(score.taxonomyCompetitionScore)}
                  </p>
                ))}
              </>
            ) : undefined
          }
        />
        <AthletePerformanceStat
          title="Overall Performance"
          value={displayBasketballScore(summary.overallPerformance)}
        />
      </div>
    </PerformanceCard>
  );
}

export function BasketballWeeklyPerformanceContent({
  summary,
  titleClassName = ATHLETE_DASHBOARD_CARD_TITLE_CLASS,
  sportCode = "BASKETBALL",
}: {
  summary: BasketballWeeklySummary;
  titleClassName?: string;
  sportCode?: "BASKETBALL" | "FOOTBALL";
}) {
  return (
    <div className="space-y-4">
      <ExercisePerformanceCard
        exercises={summary.exerciseTrends}
        titleClassName={titleClassName}
      />
      <GoalPerformanceCard goals={summary.goalEvidence} titleClassName={titleClassName} />
      <TaxonomyPerformanceCard
        scores={summary.taxonomyScores}
        titleClassName={titleClassName}
      />
      <BasketballOverallPerformanceCard
        summary={summary}
        titleClassName={titleClassName}
        sportCode={sportCode}
      />
    </div>
  );
}

export function BasketballWeeklyPerformanceSection({
  entityId,
  athleteId,
  trainingPlanVersionId,
  refreshKey = 0,
  titleClassName = ATHLETE_DASHBOARD_CARD_TITLE_CLASS,
  sections = "all",
  sportCode = "BASKETBALL",
}: {
  entityId: string;
  athleteId: string;
  trainingPlanVersionId?: string | null;
  refreshKey?: number;
  titleClassName?: string;
  sections?: "all" | "overall";
  sportCode?: "BASKETBALL" | "FOOTBALL";
}) {
  const versionId = trainingPlanVersionId?.trim() ?? "";
  const applicable =
    entityId.trim() !== "" && athleteId.trim() !== "" && versionId !== "";
  const isFootball = sportCode === "FOOTBALL";
  const [summary, setSummary] = useState<BasketballWeeklySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!applicable) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSummary(null);
    void (async () => {
      try {
        const next = isFootball
          ? await fetchSportMetricsFootballWeeklySummary({
              entityId: entityId.trim(),
              athleteId: athleteId.trim(),
              trainingPlanVersionId: versionId,
            })
          : await fetchSportMetricsBasketballWeeklySummary({
              entityId: entityId.trim(),
              athleteId: athleteId.trim(),
              trainingPlanVersionId: versionId,
            });
        if (cancelled) return;
        setSummary(next);
      } catch (loadError) {
        if (cancelled) return;
        setSummary(null);
        setError(formatLoadError(loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicable, athleteId, entityId, refreshKey, versionId]);

  if (!applicable) return null;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (loading || summary === null) {
    return (
      <p className="text-sm text-textSecondary">
        {isFootball ? "Loading performance…" : "Loading basketball performance…"}
      </p>
    );
  }

  if (sections === "overall") {
    return (
      <BasketballOverallPerformanceCard
        summary={summary}
        titleClassName={titleClassName}
        sportCode={sportCode}
      />
    );
  }

  return (
    <BasketballWeeklyPerformanceContent
      summary={summary}
      titleClassName={titleClassName}
      sportCode={sportCode}
    />
  );
}
