"use client";

import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchAthleteWeeklyPlanJournal,
  type AthleteWeeklyPlanJournal,
} from "@/lib/api/coachAthletePlanningReadiness";
import { formatDateWithWeekday, parseToLocalDate } from "@/lib/dateTime";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type ViewState =
  | { phase: "loading" }
  | { phase: "ready"; journal: AthleteWeeklyPlanJournal }
  | { phase: "error"; message: string };

const DOMAIN_SUMMARY = [
  {
    key: "SKILLS",
    label: "Skills",
    emptyMessage: "No skills session today.",
  },
  {
    key: "NUTRITION",
    label: "Nutrition",
    emptyMessage: "No nutrition plan today.",
  },
  {
    key: "S_AND_C",
    label: "Strength & Conditioning",
    emptyMessage: "No S&C session today.",
  },
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function summarizeTodayItem(item: unknown): string | null {
  if (typeof item === "string") {
    const trimmed = item.trim();
    return trimmed === "" ? null : trimmed;
  }
  if (typeof item === "number" && Number.isFinite(item)) return String(item);
  if (typeof item === "boolean") return item ? "Yes" : "No";
  if (!isRecord(item)) return null;

  const keys = [
    "title",
    "name",
    "label",
    "summary",
    "description",
    "objective",
    "mealType",
    "sessionType",
    "itemType",
    "notes",
  ];
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return null;
}

function isSameLocalCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function AthleteTodayPlanCard() {
  const { accessGateReady, accessContext, user } = useAuth();
  const entityId = useMemo(
    () => accessContext?.academy.trainingEntityId?.trim() ?? "",
    [accessContext?.academy.trainingEntityId],
  );
  const athleteId = useMemo(
    () => accessContext?.user.userId?.trim() ?? user?.id?.trim() ?? "",
    [accessContext?.user.userId, user?.id],
  );
  const [state, setState] = useState<ViewState>({ phase: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  const retryLoad = useCallback(() => {
    setState({ phase: "loading" });
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!accessGateReady || entityId === "" || athleteId === "") return;
    let cancelled = false;
    void (async () => {
      try {
        const journal = await fetchAthleteWeeklyPlanJournal(entityId, athleteId);
        if (!cancelled) {
          setState({ phase: "ready", journal });
        }
      } catch (e) {
        if (cancelled) return;
        const message =
          e instanceof Error
            ? e.message
            : "Could not load today’s plan. Please try again.";
        setState({ phase: "error", message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessGateReady, athleteId, entityId, reloadKey]);

  const isLoading = !accessGateReady || state.phase === "loading";
  const journal = state.phase === "ready" ? state.journal : null;
  const allDomainsNotReleased = journal
    ? DOMAIN_SUMMARY.every((domain) => journal.domains[domain.key].status === "NOT_RELEASED")
    : false;
  const todayDay = useMemo(() => {
    if (!journal) return null;
    const today = new Date();
    return (
      journal.days.find((day) => {
        const parsed = parseToLocalDate(day.date);
        return parsed ? isSameLocalCalendarDay(parsed, today) : false;
      }) ?? null
    );
  }, [journal]);

  return (
    <DashboardCardShell
      title="Today’s Plan"
      subtitle={todayDay ? formatDateWithWeekday(todayDay.date) : undefined}
      className="min-h-[280px]"
    >
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex min-h-[160px] items-center justify-center text-sm text-textSecondary">
            Loading today’s plan…
          </div>
        ) : entityId === "" || athleteId === "" ? (
          <Alert variant="warning">
            Your athlete context is not available yet. Please try again shortly.
          </Alert>
        ) : state.phase === "error" ? (
          <div className="space-y-3">
            <Alert variant="danger">{state.message}</Alert>
            <div>
              <Button type="button" variant="secondary" onClick={retryLoad}>
                Retry
              </Button>
            </div>
          </div>
        ) : allDomainsNotReleased ? (
          <p className="text-sm text-textSecondary">
            Your weekly plan has not been released yet.
          </p>
        ) : todayDay === null ? (
          <p className="text-sm text-textSecondary">No plan released for today.</p>
        ) : (
          <div className="space-y-3">
            {DOMAIN_SUMMARY.map((domain) => {
              const items =
                domain.key === "SKILLS"
                  ? todayDay.skills
                  : domain.key === "NUTRITION"
                    ? todayDay.nutrition
                    : todayDay.sandc;
              const preview = items
                .map((item) => summarizeTodayItem(item))
                .filter((value): value is string => typeof value === "string" && value !== "")
                .slice(0, 2);

              return (
                <Card key={domain.key} padding="compact" accent={false} className="bg-bg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-textPrimary">{domain.label}</p>
                    {items.length === 0 ? (
                      <p className="text-sm text-textSecondary">{domain.emptyMessage}</p>
                    ) : (
                      <>
                        <p className="text-sm text-textSecondary">
                          {items.length} released item{items.length === 1 ? "" : "s"} today.
                        </p>
                        {preview.length > 0 ? (
                          <ul className="space-y-1 text-sm text-textPrimary">
                            {preview.map((line) => (
                              <li key={`${domain.key}-${line}`} className="truncate">
                                {line}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <div className="pt-1">
          <Link href="/athlete/weekly-plan">
            <Button type="button" variant="secondary">
              View full plan
            </Button>
          </Link>
        </div>
      </div>
    </DashboardCardShell>
  );
}

