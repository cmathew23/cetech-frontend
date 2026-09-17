"use client";

import { ATHLETE_DASHBOARD_CARD_TITLE_CLASS } from "@/components/dashboard/athlete/athleteDashboardTypography";
import {
  AthletePerformanceStat,
  athletePerformanceGridClass,
  formatAthleteMetricValue,
} from "@/components/dashboard/athlete/athleteSportsMetricsPresentation";
import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import { DASHBOARD_METRIC_SUPPORTING_CLASS } from "@/components/dashboard/shared/dashboardTypography";
import { SkillsGolfScalarHistoryComparison, useSkillsGolfHistoryComparison } from "@/components/dashboard/shared/SkillsGolfHistoryComparison";
import { Card } from "@/components/ui/Card";
import {
  fetchSportMetricsGolfWeeklySummary,
  type SportMetricOverallGolferPerformanceHistoryPoint,
  type SportMetricsGolfWeeklySummary,
} from "@/lib/api/sportMetricsGolf";
import { formatDateOnly } from "@/lib/dateTime";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const NOT_AVAILABLE_YET = "Not available yet";
const TREND_AFTER_COMPARABLE =
  "Your trend will appear after another comparable week.";

export function displayedPracticePerformanceScore(
  summary: SportMetricsGolfWeeklySummary | null,
): number | null {
  if (!summary) return null;
  return summary.practiceScoreOutOf100 ?? summary.coachPracticeScoreOutOf100;
}

function formatMetricOrUnavailable(value: number | null): string {
  return value !== null
    ? formatAthleteMetricValue(value, null)
    : NOT_AVAILABLE_YET;
}

function formatHistoryWeekLabel(
  point: SportMetricOverallGolferPerformanceHistoryPoint,
): string {
  const start = formatDateOnly(point.weekStartDate, "");
  const end = formatDateOnly(point.weekEndDate, "");
  if (start !== "" && end !== "") return `${start} – ${end}`;
  if (start !== "") return start;
  if (end !== "") return end;
  return "Week";
}

export function resolveOverallGolfPerformanceDisplay(
  summary: SportMetricsGolfWeeklySummary | null,
): {
  practiceValue: string;
  competitionValue: string;
  overallValue: string;
  overallCaption?: string;
  trendPoints: Array<{ label: string; value: string }>;
  trendMessage: string | null;
} {
  const history = summary?.overallGolferPerformanceHistory ?? [];
  const overallHistory = history.filter(
    (point) => point.overallGolferPerformance !== null,
  );
  const trendPoints = overallHistory.map((point) => ({
    label: formatHistoryWeekLabel(point),
    value: formatAthleteMetricValue(point.overallGolferPerformance, null),
  }));

  return {
    practiceValue: formatMetricOrUnavailable(
      displayedPracticePerformanceScore(summary),
    ),
    competitionValue: formatMetricOrUnavailable(
      summary?.competitionPerformance ?? null,
    ),
    overallValue: formatMetricOrUnavailable(
      summary?.overallGolferPerformance ?? null,
    ),
    overallCaption:
      overallHistory.length === 1 ? "BASELINE WEEK" : undefined,
    trendPoints,
    trendMessage:
      overallHistory.length >= 2 ? null : TREND_AFTER_COMPARABLE,
  };
}

export function OverallGolfPerformanceCard({
  summary,
  titleClassName,
  className,
}: {
  summary: SportMetricsGolfWeeklySummary | null;
  titleClassName?: string;
  className?: string;
}) {
  const values = resolveOverallGolfPerformanceDisplay(summary);
  const historicalOverall =
    useSkillsGolfHistoryComparison()?.selectedWeek?.overallGolferPerformance ??
    null;

  return (
    <Card
      title="Overall Golf Performance"
      accent={false}
      padding="compact"
      className={cn(
        "shadow-[0_10px_30px_rgba(15,23,42,0.05)]",
        DASHBOARD_MAJOR_OUTER_CARD_CLASS,
        className,
      )}
      titleClassName={titleClassName}
    >
      <div className={athletePerformanceGridClass(3)}>
        <AthletePerformanceStat
          title="Practice Performance"
          value={values.practiceValue}
        />
        <AthletePerformanceStat
          title="Competition Performance"
          value={values.competitionValue}
        />
        <AthletePerformanceStat
          title="Overall Golfer Performance"
          value={values.overallValue}
          caption={values.overallCaption}
        />
      </div>
      {values.trendPoints.length > 0 || values.trendMessage ? (
        <div className={cn(DASHBOARD_METRIC_SUPPORTING_CLASS, "mt-4 space-y-1")}>
          {values.trendPoints.map((point, index) => (
            <p key={`${point.label}-${index}`}>
              {point.label}: {point.value}
            </p>
          ))}
          {values.trendMessage ? <p>{values.trendMessage}</p> : null}
        </div>
      ) : null}
      <SkillsGolfScalarHistoryComparison
        currentValue={summary?.overallGolferPerformance ?? null}
        historicalValue={historicalOverall}
        unit="points"
      />
    </Card>
  );
}

export function OverallGolfPerformanceSection({
  entityId,
  athleteId,
  trainingPlanVersionId,
  titleClassName = ATHLETE_DASHBOARD_CARD_TITLE_CLASS,
}: {
  entityId: string;
  athleteId: string;
  trainingPlanVersionId?: string | null;
  titleClassName?: string;
}) {
  const [summary, setSummary] = useState<SportMetricsGolfWeeklySummary | null>(
    null,
  );
  const versionId = trainingPlanVersionId?.trim() ?? "";
  const applicable =
    entityId.trim() !== "" && athleteId.trim() !== "" && versionId !== "";

  useEffect(() => {
    if (!applicable) return;
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
      } catch {
        if (cancelled) return;
        setSummary(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicable, athleteId, entityId, versionId]);

  if (!applicable) return null;

  return (
    <OverallGolfPerformanceCard
      summary={summary}
      titleClassName={titleClassName}
    />
  );
}
