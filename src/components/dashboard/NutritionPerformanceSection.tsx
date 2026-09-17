"use client";

import { NutritionPerformanceCard } from "@/components/dashboard/NutritionPerformanceCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  fetchNutritionPerformance,
  fetchNutritionPerformanceHistory,
  hasNutritionPerformanceData,
  type NutritionPerformanceData,
  type NutritionWeeklySummary,
} from "@/lib/api/nutritionPerformance";
import { isNormalizedApiError } from "@/lib/apiClient";
import { currentCoachIsHeadCoach, normalizeCoachFunctionValue } from "@/lib/coachAuthority";
import { cn } from "@/lib/utils";
import { useEffect, useState, type ReactNode } from "react";

function formatLoadError(e: unknown): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return "Unable to load nutrition performance.";
}

export function coachCanViewNutritionPerformance(input: {
  academyCoachRole?: string | null;
  functions?: string[] | null;
}): boolean {
  if (currentCoachIsHeadCoach(input.academyCoachRole)) return true;
  return (input.functions ?? []).some((value) => {
    const normalized = normalizeCoachFunctionValue(value);
    return normalized === "NUTRITION" || normalized === "NUTRITION_COACH";
  });
}

function NutritionPerformanceShell({
  titleClassName,
  cardClassName,
  subtitle,
  children,
}: {
  titleClassName?: string;
  cardClassName?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Card
      title="Nutrition Performance"
      subtitle={subtitle}
      accent={false}
      padding="compact"
      className={cn(
        "shadow-[0_10px_30px_rgba(15,23,42,0.05)]",
        cardClassName,
      )}
      titleClassName={titleClassName}
    >
      {children}
    </Card>
  );
}

export function NutritionPerformanceSection({
  entityId,
  athleteId,
  weekStart,
  weekEnd,
  weekRangePending = false,
  titleClassName,
  cardClassName,
}: {
  entityId: string;
  athleteId: string;
  weekStart?: string;
  weekEnd?: string;
  weekRangePending?: boolean;
  titleClassName?: string;
  cardClassName?: string;
}) {
  const [data, setData] = useState<NutritionPerformanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolvedFetchKey, setResolvedFetchKey] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [historyWeeks, setHistoryWeeks] = useState<NutritionWeeklySummary[]>(
    [],
  );
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const trimmedEntityId = entityId.trim();
  const trimmedAthleteId = athleteId.trim();
  const trimmedWeekStart = weekStart?.trim() ?? "";
  const trimmedWeekEnd = weekEnd?.trim() ?? "";
  const hasIdentifiers =
    trimmedEntityId !== "" && trimmedAthleteId !== "";
  const hasWeekRange = trimmedWeekStart !== "" && trimmedWeekEnd !== "";

  const fetchKey =
    hasIdentifiers && hasWeekRange && !weekRangePending
      ? `${trimmedEntityId}|${trimmedAthleteId}|${trimmedWeekStart}|${trimmedWeekEnd}|${reloadKey}`
      : "";

  const isLoading = fetchKey !== "" && fetchKey !== resolvedFetchKey;

  useEffect(() => {
    if (fetchKey === "") return;

    let cancelled = false;

    void (async () => {
      try {
        const next = await fetchNutritionPerformance({
          entityId: trimmedEntityId,
          athleteId: trimmedAthleteId,
          weekStart: trimmedWeekStart,
          weekEnd: trimmedWeekEnd,
        });
        if (cancelled) return;
        setData(next);
        setError(null);
        setResolvedFetchKey(fetchKey);
      } catch (e) {
        if (cancelled) return;
        setData(null);
        setError(formatLoadError(e));
        setResolvedFetchKey(fetchKey);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    fetchKey,
    trimmedAthleteId,
    trimmedEntityId,
    trimmedWeekEnd,
    trimmedWeekStart,
  ]);

  const historyFetchKey = hasIdentifiers
    ? `${trimmedEntityId}|${trimmedAthleteId}`
    : "";

  useEffect(() => {
    if (historyFetchKey === "") {
      setHistoryWeeks([]);
      setHistoryError(null);
      setHistoryLoading(false);
      return;
    }

    let cancelled = false;
    setHistoryLoading(true);

    void (async () => {
      try {
        const weeks = await fetchNutritionPerformanceHistory({
          entityId: trimmedEntityId,
          athleteId: trimmedAthleteId,
        });
        if (cancelled) return;
        setHistoryWeeks(weeks);
        setHistoryError(null);
      } catch (e) {
        if (cancelled) return;
        setHistoryWeeks([]);
        setHistoryError(formatLoadError(e));
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [historyFetchKey, trimmedAthleteId, trimmedEntityId]);

  if (!hasIdentifiers || weekRangePending || !hasWeekRange) {
    return (
      <NutritionPerformanceShell
        titleClassName={titleClassName}
        cardClassName={cardClassName}
      >
        <p className="text-sm text-textSecondary">
          {weekRangePending
            ? "Preparing plan week…"
            : "No nutrition performance for this week."}
        </p>
      </NutritionPerformanceShell>
    );
  }

  if (isLoading) {
    return (
      <NutritionPerformanceShell
        titleClassName={titleClassName}
        cardClassName={cardClassName}
      >
        <p className="text-sm text-textSecondary">Loading…</p>
      </NutritionPerformanceShell>
    );
  }

  if (error) {
    return (
      <NutritionPerformanceShell
        titleClassName={titleClassName}
        cardClassName={cardClassName}
      >
        <div className="space-y-3">
          <Alert variant="danger">{error}</Alert>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setReloadKey((current) => current + 1)}
          >
            Try again
          </Button>
        </div>
      </NutritionPerformanceShell>
    );
  }

  if (!data || !hasNutritionPerformanceData(data)) {
    return (
      <NutritionPerformanceShell
        titleClassName={titleClassName}
        cardClassName={cardClassName}
      >
        <p className="text-sm text-textSecondary">
          No nutrition performance returned for this week.
        </p>
      </NutritionPerformanceShell>
    );
  }

  return (
    <NutritionPerformanceCard
      data={data}
      historyWeeks={historyWeeks}
      historyLoading={historyLoading}
      historyError={historyError}
      titleClassName={titleClassName}
      cardClassName={cardClassName}
    />
  );
}
