"use client";

import { WearableSummaryCards } from "@/components/dashboard/WearableSummaryCards";
import { WearablePeriodSelector } from "@/components/dashboard/shared/WearablePeriodSelector";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  fetchWearableSummary,
  hasWearableSummaryData,
  type WearableSummary,
} from "@/lib/api/wearableSummary";
import { isNormalizedApiError } from "@/lib/apiClient";
import { formatDateOnly } from "@/lib/dateTime";
import {
  resolveWearableQueryRange,
  type ResolvedWearableQueryRange,
  type WearablePeriodDays,
} from "@/lib/wearablePeriod";
import type { WearableViewerContext } from "@/components/dashboard/WearableSummaryCards";
import { useEffect, useMemo, useState } from "react";

function formatLoadError(e: unknown): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return "Unable to load wearable summary.";
}

function formatRangeLabel(range: ResolvedWearableQueryRange): string {
  const dates = `${formatDateOnly(range.startDate, range.startDate)} – ${formatDateOnly(
    range.endDate,
    range.endDate,
  )}`;
  return range.mode === "plan" ? `Plan window: ${dates}` : `Rolling window: ${dates}`;
}

function WearableSectionCard({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card
      title={title}
      subtitle={subtitle}
      actions={actions}
      accent={false}
      padding="compact"
      className="shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
    >
      {children}
    </Card>
  );
}

export function WearableSummarySection({
  entityId,
  athleteId,
  planStartDate,
  planEndDate,
  planWindowPending = false,
  title = "Wearable Summary",
  subtitle,
  windowLabel,
  viewerContext = "DEFAULT",
}: {
  entityId: string;
  athleteId: string;
  planStartDate?: string;
  planEndDate?: string;
  /** True while the shared plan window is still resolving (e.g. adherence journal load). */
  planWindowPending?: boolean;
  title?: string;
  subtitle?: string;
  windowLabel?: string;
  viewerContext?: WearableViewerContext;
}) {
  const [rollingDays, setRollingDays] = useState<WearablePeriodDays>(7);
  const [summary, setSummary] = useState<WearableSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolvedFetchKey, setResolvedFetchKey] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const hasIdentifiers = entityId.trim() !== "" && athleteId.trim() !== "";

  const queryRange = useMemo(() => {
    if (planWindowPending) return null;
    return resolveWearableQueryRange({
      planStartDate,
      planEndDate,
      rollingDays,
    });
  }, [planEndDate, planStartDate, planWindowPending, rollingDays]);

  const usesPlanWindow = queryRange?.mode === "plan";
  const showPeriodSelector = hasIdentifiers && queryRange !== null && !usesPlanWindow;

  const fetchKey =
    hasIdentifiers && queryRange
      ? `${entityId.trim()}|${athleteId.trim()}|${queryRange.startDate}|${queryRange.endDate}|${reloadKey}`
      : "";

  const isLoading = fetchKey !== "" && fetchKey !== resolvedFetchKey;
  const resolvedSubtitle =
    subtitle ?? windowLabel ?? (queryRange ? formatRangeLabel(queryRange) : undefined);

  useEffect(() => {
    if (!hasIdentifiers || queryRange === null || fetchKey === "") return;

    let cancelled = false;

    void (async () => {
      try {
        const nextSummary = await fetchWearableSummary({
          entityId: entityId.trim(),
          athleteId: athleteId.trim(),
          startDate: queryRange.startDate,
          endDate: queryRange.endDate,
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
  }, [athleteId, entityId, fetchKey, hasIdentifiers, queryRange]);

  const reload = () => setReloadKey((current) => current + 1);
  const periodSelector = showPeriodSelector ? (
    <WearablePeriodSelector
      value={rollingDays}
      onChange={setRollingDays}
      disabled={isLoading}
    />
  ) : null;

  if (!hasIdentifiers || planWindowPending) {
    return (
      <WearableSectionCard
        title={title}
        subtitle={resolvedSubtitle}
        actions={periodSelector}
      >
        <p className="text-sm text-textSecondary">
          {planWindowPending
            ? "Preparing plan window…"
            : "Preparing wearable summary…"}
        </p>
      </WearableSectionCard>
    );
  }

  if (isLoading) {
    return (
      <WearableSectionCard
        title={title}
        subtitle={resolvedSubtitle}
        actions={periodSelector}
      >
        <p className="text-sm text-textSecondary">Loading…</p>
      </WearableSectionCard>
    );
  }

  if (error) {
    return (
      <WearableSectionCard
        title={title}
        subtitle={resolvedSubtitle}
        actions={periodSelector}
      >
        <div className="space-y-3">
          <Alert variant="danger">{error ?? "Unable to load wearable summary."}</Alert>
          <Button type="button" variant="secondary" onClick={reload}>
            Try again
          </Button>
        </div>
      </WearableSectionCard>
    );
  }

  if (!summary || !hasWearableSummaryData(summary)) {
    return (
      <WearableSectionCard
        title={title}
        subtitle={resolvedSubtitle}
        actions={periodSelector}
      >
        <p className="text-sm text-textSecondary">
          No wearable summary data returned for this period.
        </p>
      </WearableSectionCard>
    );
  }

  return (
    <div className="space-y-3">
      {showPeriodSelector ? (
        <div className="flex justify-end">{periodSelector}</div>
      ) : null}
      <WearableSummaryCards
        summary={summary}
        title={title}
        subtitle={resolvedSubtitle}
        viewerContext={viewerContext}
      />
    </div>
  );
}
