"use client";

import { ATHLETE_DASHBOARD_CARD_TITLE_CLASS } from "@/components/dashboard/athlete/athleteDashboardTypography";
import {
  AthletePerformanceStat,
  athletePerformanceGridClass,
} from "@/components/dashboard/athlete/athleteSportsMetricsPresentation";
import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import {
  SkillsGolfScalarHistoryComparison,
  useSkillsGolfHistoryComparison,
} from "@/components/dashboard/shared/SkillsGolfHistoryComparison";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import {
  fetchBasketballCompetitionAssessment,
  fetchBasketballCompetitionAssessments,
  fetchSportMetricsBasketballWeeklySummary,
  type BasketballCompetitionAssessment,
} from "@/lib/api/sportMetricsBasketball";
import {
  fetchFootballCompetitionAssessment,
  fetchFootballCompetitionAssessments,
  fetchSportMetricsFootballWeeklySummary,
} from "@/lib/api/sportMetricsFootball";
import { isNormalizedApiError } from "@/lib/apiClient";
import { formatDateOnly } from "@/lib/dateTime";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

function formatError(error: unknown): string {
  if (isNormalizedApiError(error)) return error.message;
  if (error instanceof Error && error.message.trim() !== "") return error.message;
  return "Unable to load Competition Performance.";
}

/** Display-only. Caps a backend number at two decimal places. */
export function formatMaxTwoDecimals(value: number): string {
  return value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

export function submittedBasketballAssessments(
  assessments: BasketballCompetitionAssessment[],
): BasketballCompetitionAssessment[] {
  return assessments.filter((assessment) => assessment.status === "SUBMITTED");
}

function ScoreLines({
  assessment,
}: {
  assessment: BasketballCompetitionAssessment;
}) {
  return (
    <>
      {assessment.status ? <p>Status: {assessment.status}</p> : null}
      {Object.entries(assessment.taxonomyRatings).map(([key, rating]) => (
        <p key={`${key}-rating`}>
          {key} rating: {String(rating)}
        </p>
      ))}
      {assessment.normalizedTaxonomyScores
        ? Object.entries(assessment.normalizedTaxonomyScores).map(([key, score]) => (
            <p key={`${key}-score`}>
              {key}: {formatMaxTwoDecimals(score)}
            </p>
          ))
        : null}
    </>
  );
}

export function AthleteBasketballCompetitionPerformanceContent({
  assessments,
  detail,
  selectedId,
  onSelect,
  currentCompetitionPerformance,
  error,
  loading,
  seasonCycleId,
}: {
  assessments: BasketballCompetitionAssessment[];
  detail: BasketballCompetitionAssessment | null;
  selectedId: string | null;
  onSelect: (assessmentId: string) => void;
  currentCompetitionPerformance: number | null;
  error: string | null;
  loading: boolean;
  seasonCycleId: string | null;
}) {
  const historicalCompetition =
    useSkillsGolfHistoryComparison()?.selectedWeek?.competitionPerformance ?? null;

  return (
    <Card
      title="Competition Performance"
      subtitle="Submitted competitions for the current Skills season"
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
          <p className="text-sm text-textSecondary">Loading competition performance…</p>
        ) : null}
        {!loading && !seasonCycleId ? (
          <p className="text-sm text-textSecondary">Season cycle unavailable</p>
        ) : null}
        {!loading && seasonCycleId && assessments.length === 0 ? (
          <p className="text-sm text-textSecondary">No competition result yet</p>
        ) : null}
        {assessments.length > 0 ? (
          <ul className={athletePerformanceGridClass(assessments.length)}>
            {assessments.map((assessment) => (
              <li key={assessment.id}>
                <div
                  className={
                    selectedId === assessment.id ? "rounded-md ring-2 ring-primary/70" : ""
                  }
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => onSelect(assessment.id)}
                  >
                    <AthletePerformanceStat
                      title={assessment.competitionName}
                      value={
                        assessment.competitionPerformance !== null
                          ? formatMaxTwoDecimals(assessment.competitionPerformance)
                          : "NO RESULT YET"
                      }
                      caption={
                        assessment.competitionDate
                          ? formatDateOnly(assessment.competitionDate)
                          : undefined
                      }
                      supporting={<ScoreLines assessment={assessment} />}
                    />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {detail && detail.status === "SUBMITTED" ? (
          <div className="space-y-1 text-sm text-textSecondary">
            <p className="font-medium text-textPrimary">{detail.competitionName}</p>
            {detail.competitionDate ? <p>{formatDateOnly(detail.competitionDate)}</p> : null}
            {detail.competitionPerformance !== null ? (
              <p>
                Competition Performance: {formatMaxTwoDecimals(detail.competitionPerformance)}
              </p>
            ) : null}
            <ScoreLines assessment={detail} />
          </div>
        ) : null}
        <SkillsGolfScalarHistoryComparison
          currentValue={currentCompetitionPerformance}
          historicalValue={historicalCompetition}
          unit="points"
        />
      </div>
    </Card>
  );
}

export function AthleteBasketballCompetitionPerformanceSection({
  entityId,
  athleteId,
  trainingPlanVersionId,
  sportCode = "BASKETBALL",
}: {
  entityId: string;
  athleteId: string;
  trainingPlanVersionId?: string | null;
  sportCode?: "BASKETBALL" | "FOOTBALL";
}) {
  const resolvedEntityId = entityId.trim();
  const resolvedAthleteId = athleteId.trim();
  const versionId = trainingPlanVersionId?.trim() ?? "";
  const applicable =
    resolvedEntityId !== "" && resolvedAthleteId !== "" && versionId !== "";
  const isFootball = sportCode === "FOOTBALL";
  const [seasonCycleId, setSeasonCycleId] = useState<string | null>(null);
  const [currentCompetitionPerformance, setCurrentCompetitionPerformance] =
    useState<number | null>(null);
  const [assessments, setAssessments] = useState<BasketballCompetitionAssessment[]>([]);
  const [detail, setDetail] = useState<BasketballCompetitionAssessment | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!applicable) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const summary = isFootball
          ? await fetchSportMetricsFootballWeeklySummary({
              entityId: resolvedEntityId,
              athleteId: resolvedAthleteId,
              trainingPlanVersionId: versionId,
            })
          : await fetchSportMetricsBasketballWeeklySummary({
              entityId: resolvedEntityId,
              athleteId: resolvedAthleteId,
              trainingPlanVersionId: versionId,
            });
        if (cancelled) return;
        const nextSeasonCycleId = summary.seasonCycleId?.trim() || null;
        setSeasonCycleId(nextSeasonCycleId);
        setCurrentCompetitionPerformance(summary.competitionPerformance);
        setError(null);
        if (!nextSeasonCycleId) {
          setAssessments([]);
          return;
        }
        const listed = isFootball
          ? await fetchFootballCompetitionAssessments({
              entityId: resolvedEntityId,
              athleteId: resolvedAthleteId,
              seasonCycleId: nextSeasonCycleId,
            })
          : await fetchBasketballCompetitionAssessments({
              entityId: resolvedEntityId,
              athleteId: resolvedAthleteId,
              seasonCycleId: nextSeasonCycleId,
            });
        if (cancelled) return;
        setAssessments(submittedBasketballAssessments(listed));
      } catch (loadError) {
        if (cancelled) return;
        setError(formatError(loadError));
        setAssessments([]);
        setSeasonCycleId(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicable, isFootball, resolvedAthleteId, resolvedEntityId, versionId]);

  useEffect(() => {
    if (!applicable || !selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const next = isFootball
          ? await fetchFootballCompetitionAssessment({
              entityId: resolvedEntityId,
              athleteId: resolvedAthleteId,
              assessmentId: selectedId,
            })
          : await fetchBasketballCompetitionAssessment({
              entityId: resolvedEntityId,
              athleteId: resolvedAthleteId,
              assessmentId: selectedId,
            });
        if (cancelled) return;
        setDetail(next.status === "SUBMITTED" ? next : null);
        setError(null);
      } catch (loadError) {
        if (cancelled) return;
        setError(formatError(loadError));
        setDetail(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicable, isFootball, resolvedAthleteId, resolvedEntityId, selectedId]);

  if (!applicable) return null;

  return (
    <AthleteBasketballCompetitionPerformanceContent
      assessments={assessments}
      detail={detail}
      selectedId={selectedId}
      onSelect={setSelectedId}
      currentCompetitionPerformance={currentCompetitionPerformance}
      error={error}
      loading={loading}
      seasonCycleId={seasonCycleId}
    />
  );
}
