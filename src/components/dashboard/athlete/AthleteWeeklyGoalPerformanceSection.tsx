"use client";

import { ATHLETE_DASHBOARD_CARD_TITLE_CLASS } from "@/components/dashboard/athlete/athleteDashboardTypography";
import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  fetchSportMetricsGolfWeeklySummary,
  type SportMetricGoalEvidenceGroup,
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

function formatValueWithUnit(
  value: number | string | null,
  unit: string | null,
): string {
  if (value === null) return "";
  const unitLabel = unit?.trim() ?? "";
  return unitLabel === "" ? String(value) : `${value} ${unitLabel}`;
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
    <Card
      title="Weekly Goal Performance"
      subtitle={weekLabel ?? undefined}
      accent={false}
      padding="compact"
      className={cn("shadow-[0_10px_30px_rgba(15,23,42,0.05)]", DASHBOARD_MAJOR_OUTER_CARD_CLASS)}
      titleClassName={ATHLETE_DASHBOARD_CARD_TITLE_CLASS}
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
              </article>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function AthleteWeeklyGoalPerformanceSection({
  entityId,
  athleteId,
  trainingPlanVersionId,
}: {
  entityId: string;
  athleteId: string;
  trainingPlanVersionId?: string | null;
}) {
  const [summary, setSummary] = useState<SportMetricsGolfWeeklySummary | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [resolvedFetchKey, setResolvedFetchKey] = useState("");
  const [reloadKey, setReloadKey] = useState(1);

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

  const reload = () => setReloadKey((current) => current + 1);

  if (!hasIdentifiers) {
    return (
      <Card
        title="Weekly Goal Performance"
        accent={false}
        padding="compact"
        className={cn("shadow-[0_10px_30px_rgba(15,23,42,0.05)]", DASHBOARD_MAJOR_OUTER_CARD_CLASS)}
        titleClassName={ATHLETE_DASHBOARD_CARD_TITLE_CLASS}
      >
        <p className="text-sm text-textSecondary">
          Preparing weekly Goal performance…
        </p>
      </Card>
    );
  }

  if (versionId === "") {
    return (
      <Card
        title="Weekly Goal Performance"
        accent={false}
        padding="compact"
        className={cn("shadow-[0_10px_30px_rgba(15,23,42,0.05)]", DASHBOARD_MAJOR_OUTER_CARD_CLASS)}
        titleClassName={ATHLETE_DASHBOARD_CARD_TITLE_CLASS}
      >
        <p className="text-sm text-textSecondary">
          No Skills plan week available for weekly Goal performance yet.
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card
        title="Weekly Goal Performance"
        accent={false}
        padding="compact"
        className={cn("shadow-[0_10px_30px_rgba(15,23,42,0.05)]", DASHBOARD_MAJOR_OUTER_CARD_CLASS)}
        titleClassName={ATHLETE_DASHBOARD_CARD_TITLE_CLASS}
      >
        <p className="text-sm text-textSecondary">Loading…</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        title="Weekly Goal Performance"
        accent={false}
        padding="compact"
        className={cn("shadow-[0_10px_30px_rgba(15,23,42,0.05)]", DASHBOARD_MAJOR_OUTER_CARD_CLASS)}
        titleClassName={ATHLETE_DASHBOARD_CARD_TITLE_CLASS}
      >
        <div className="space-y-3">
          <Alert variant="danger">{error}</Alert>
          <Button type="button" variant="secondary" onClick={reload}>
            Try again
          </Button>
        </div>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card
        title="Weekly Goal Performance"
        accent={false}
        padding="compact"
        className={cn("shadow-[0_10px_30px_rgba(15,23,42,0.05)]", DASHBOARD_MAJOR_OUTER_CARD_CLASS)}
        titleClassName={ATHLETE_DASHBOARD_CARD_TITLE_CLASS}
      >
        <p className="text-sm text-textSecondary">
          No weekly Goal performance returned for this plan week.
        </p>
      </Card>
    );
  }

  return (
    <AthleteWeeklyGoalPerformanceContent
      weekStartDate={summary.weekStartDate}
      weekEndDate={summary.weekEndDate}
      goalEvidence={summary.goalEvidence}
    />
  );
}
