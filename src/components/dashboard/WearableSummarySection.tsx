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
  resolveWearableDateRange,
  type WearablePeriodDays,
} from "@/lib/wearablePeriod";
import { useEffect, useMemo, useState } from "react";

function formatLoadError(e: unknown): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return "Unable to load wearable summary.";
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
  title = "Wearable Summary",
  subtitle,
}: {
  entityId: string;
  athleteId: string;
  title?: string;
  subtitle?: string;
}) {
  const [periodDays, setPeriodDays] = useState<WearablePeriodDays>(7);
  const [summary, setSummary] = useState<WearableSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolvedRequestKey, setResolvedRequestKey] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const hasIdentifiers = entityId.trim() !== "" && athleteId.trim() !== "";
  const range = useMemo(() => resolveWearableDateRange(periodDays), [periodDays]);
  const requestKey = hasIdentifiers
    ? `${entityId.trim()}|${athleteId.trim()}|${range.startDate}|${range.endDate}|${reloadKey}`
    : "";
  const isLoading = hasIdentifiers && requestKey !== resolvedRequestKey;
  const rangeLabel = `${formatDateOnly(range.startDate, range.startDate)} – ${formatDateOnly(
    range.endDate,
    range.endDate,
  )}`;

  useEffect(() => {
    if (!hasIdentifiers) return;

    let cancelled = false;

    void (async () => {
      try {
        const nextSummary = await fetchWearableSummary({
          entityId: entityId.trim(),
          athleteId: athleteId.trim(),
          startDate: range.startDate,
          endDate: range.endDate,
        });
        if (cancelled) return;
        setSummary(nextSummary);
        setError(null);
        setResolvedRequestKey(requestKey);
      } catch (e) {
        if (cancelled) return;
        setSummary(null);
        setError(formatLoadError(e));
        setResolvedRequestKey(requestKey);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [athleteId, entityId, hasIdentifiers, range.endDate, range.startDate, reloadKey, requestKey]);

  const reload = () => setReloadKey((current) => current + 1);
  const actions = (
    <WearablePeriodSelector
      value={periodDays}
      onChange={setPeriodDays}
      disabled={isLoading}
    />
  );
  const resolvedSubtitle = subtitle ?? `Rolling window: ${rangeLabel}`;

  if (!hasIdentifiers) {
    return (
      <WearableSectionCard title={title} subtitle={resolvedSubtitle} actions={actions}>
        <p className="text-sm text-textSecondary">Preparing wearable summary…</p>
      </WearableSectionCard>
    );
  }

  if (isLoading) {
    return (
      <WearableSectionCard title={title} subtitle={resolvedSubtitle} actions={actions}>
        <p className="text-sm text-textSecondary">Loading…</p>
      </WearableSectionCard>
    );
  }

  if (error) {
    return (
      <WearableSectionCard title={title} subtitle={resolvedSubtitle} actions={actions}>
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
      <WearableSectionCard title={title} subtitle={resolvedSubtitle} actions={actions}>
        <p className="text-sm text-textSecondary">
          No wearable summary data returned for this period.
        </p>
      </WearableSectionCard>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <WearablePeriodSelector
          value={periodDays}
          onChange={setPeriodDays}
          disabled={false}
        />
      </div>
      <WearableSummaryCards summary={summary} title={title} subtitle={resolvedSubtitle} />
    </div>
  );
}
