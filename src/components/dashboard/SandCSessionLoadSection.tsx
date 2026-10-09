"use client";

import { SandCSessionLoadCard } from "@/components/dashboard/SandCSessionLoadCard";
import { Card } from "@/components/ui/Card";
import {
  fetchSandCSessionLoadHistory,
  type SandCSessionLoadWeek,
} from "@/lib/api/sessionLoadHistory";
import {
  readStrengthConditioningAverageSessionDurationMinutes,
  readStrengthConditioningAverageSessionLoad,
  readStrengthConditioningAverageSessionRpe,
  type WeeklyAdherenceSummary,
} from "@/lib/api/weeklyAdherence";
import { isNormalizedApiError } from "@/lib/apiClient";
import { currentCoachIsHeadCoach, normalizeCoachFunctionValue } from "@/lib/coachAuthority";
import { cn } from "@/lib/utils";
import { useEffect, useState, type ReactNode } from "react";

function formatLoadError(e: unknown): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return "Unable to load session load history.";
}

export function coachCanViewSandCSessionLoad(input: {
  academyCoachRole?: string | null;
  functions?: string[] | null;
}): boolean {
  if (currentCoachIsHeadCoach(input.academyCoachRole)) return true;
  return (input.functions ?? []).some((value) => {
    const normalized = normalizeCoachFunctionValue(value);
    return (
      normalized === "S_AND_C" ||
      normalized === "STRENGTH_AND_CONDITIONING" ||
      normalized === "S_AND_C_COACH" ||
      normalized === "STRENGTH_AND_CONDITIONING_COACH"
    );
  });
}

function SessionLoadShell({
  titleClassName,
  cardClassName,
  children,
}: {
  titleClassName?: string;
  cardClassName?: string;
  children: ReactNode;
}) {
  return (
    <Card
      title="Average Weekly Session Load"
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

export function SandCSessionLoadSection({
  entityId,
  athleteId,
  summary,
  weekStart,
  weekEnd,
  weekRangePending = false,
  titleClassName,
  cardClassName,
}: {
  entityId: string;
  athleteId: string;
  summary: WeeklyAdherenceSummary | null;
  weekStart?: string;
  weekEnd?: string;
  weekRangePending?: boolean;
  titleClassName?: string;
  cardClassName?: string;
}) {
  const [historyWeeks, setHistoryWeeks] = useState<SandCSessionLoadWeek[]>(
    [],
  );
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const trimmedEntityId = entityId.trim();
  const trimmedAthleteId = athleteId.trim();
  const hasIdentifiers =
    trimmedEntityId !== "" && trimmedAthleteId !== "";
  const historyFetchKey = hasIdentifiers
    ? `${trimmedEntityId}|${trimmedAthleteId}`
    : "";
  const averageSessionLoad =
    readStrengthConditioningAverageSessionLoad(summary);
  const averageSessionDurationMinutes =
    readStrengthConditioningAverageSessionDurationMinutes(summary);
  const averageSessionRpe = readStrengthConditioningAverageSessionRpe(summary);

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
        const weeks = await fetchSandCSessionLoadHistory({
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

  if (!hasIdentifiers || weekRangePending) {
    return (
      <SessionLoadShell
        titleClassName={titleClassName}
        cardClassName={cardClassName}
      >
        <p className="text-sm text-textSecondary">
          {weekRangePending
            ? "Preparing plan week…"
            : "No session load for this week."}
        </p>
      </SessionLoadShell>
    );
  }

  return (
    <SandCSessionLoadCard
      averageSessionLoad={averageSessionLoad}
      averageSessionDurationMinutes={averageSessionDurationMinutes}
      averageSessionRpe={averageSessionRpe}
      weekStart={weekStart}
      weekEnd={weekEnd}
      historyWeeks={historyWeeks}
      historyLoading={historyLoading}
      historyError={historyError}
      titleClassName={titleClassName}
      cardClassName={cardClassName}
    />
  );
}
