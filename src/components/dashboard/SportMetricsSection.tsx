"use client";

import { SportMetricsEvidenceCards } from "@/components/dashboard/SportMetricsEvidenceCards";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  fetchSportMetricsGolfWeeklySummary,
  formatSportMetricsStatusLabel,
  hasSportMetricsGolfEvidence,
  sportMetricsStatusVariant,
  type SportMetricsGolfWeeklySummary,
} from "@/lib/api/sportMetricsGolf";
import { isNormalizedApiError } from "@/lib/apiClient";
import { formatDateOnly } from "@/lib/dateTime";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

function formatLoadError(e: unknown): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return "Unable to load SPORT Metrics.";
}

function SportMetricsCardFrame({
  subtitle,
  children,
  titleClassName,
  cardClassName,
}: {
  subtitle?: string;
  children: React.ReactNode;
  titleClassName?: string;
  cardClassName?: string;
}) {
  return (
    <Card
      title="SPORT Metrics"
      subtitle={subtitle ?? "Sport: Golf"}
      accent={false}
      padding="compact"
      className={cn("shadow-[0_10px_30px_rgba(15,23,42,0.05)]", cardClassName)}
      titleClassName={titleClassName}
    >
      {children}
    </Card>
  );
}

export function SportMetricsSection({
  entityId,
  athleteId,
  trainingPlanVersionId,
  titleClassName,
  cardClassName,
}: {
  entityId: string;
  athleteId: string;
  trainingPlanVersionId?: string | null;
  titleClassName?: string;
  cardClassName?: string;
}) {
  const [summary, setSummary] = useState<SportMetricsGolfWeeklySummary | null>(null);
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
  const subtitle =
    summary && summary.weekStartDate && summary.weekEndDate
      ? `Sport: Golf · ${formatDateOnly(summary.weekStartDate, summary.weekStartDate)} – ${formatDateOnly(summary.weekEndDate, summary.weekEndDate)}`
      : "Sport: Golf";

  if (!hasIdentifiers) {
    return (
      <SportMetricsCardFrame subtitle={subtitle} titleClassName={titleClassName} cardClassName={cardClassName}>
        <p className="text-sm text-textSecondary">Preparing SPORT Metrics…</p>
      </SportMetricsCardFrame>
    );
  }

  if (versionId === "") {
    return (
      <SportMetricsCardFrame subtitle={subtitle} titleClassName={titleClassName} cardClassName={cardClassName}>
        <p className="text-sm text-textSecondary">
          No Skills plan week available for SPORT Metrics yet.
        </p>
      </SportMetricsCardFrame>
    );
  }

  if (isLoading) {
    return (
      <SportMetricsCardFrame subtitle={subtitle} titleClassName={titleClassName} cardClassName={cardClassName}>
        <p className="text-sm text-textSecondary">Loading…</p>
      </SportMetricsCardFrame>
    );
  }

  if (error) {
    return (
      <SportMetricsCardFrame subtitle={subtitle} titleClassName={titleClassName} cardClassName={cardClassName}>
        <div className="space-y-3">
          <Alert variant="danger">{error}</Alert>
          <Button type="button" variant="secondary" onClick={reload}>
            Try again
          </Button>
        </div>
      </SportMetricsCardFrame>
    );
  }

  if (!summary) {
    return (
      <SportMetricsCardFrame subtitle={subtitle} titleClassName={titleClassName} cardClassName={cardClassName}>
        <p className="text-sm text-textSecondary">
          No SPORT Metrics results returned for this plan week.
        </p>
      </SportMetricsCardFrame>
    );
  }

  if (!hasSportMetricsGolfEvidence(summary)) {
    return (
      <SportMetricsCardFrame subtitle={subtitle} titleClassName={titleClassName} cardClassName={cardClassName}>
        <div className="space-y-3">
          <StatusBadge variant={sportMetricsStatusVariant(summary.status)}>
            {formatSportMetricsStatusLabel(summary.status)}
          </StatusBadge>
          <p className="text-sm text-textSecondary">
            No SPORT Metrics results returned for this plan week.
          </p>
        </div>
      </SportMetricsCardFrame>
    );
  }

  return (
    <SportMetricsEvidenceCards
      summary={summary}
      titleClassName={titleClassName}
      cardClassName={cardClassName}
    />
  );
}
