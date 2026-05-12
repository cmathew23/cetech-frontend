"use client";

import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAthletePlanningIdentifiers } from "@/hooks/useAthletePlanningIdentifiers";
import {
  fetchAthleteTodayPlan,
  type AthleteTodayPlan,
} from "@/lib/api/coachAthletePlanningReadiness";
import { formatDateWithWeekday } from "@/lib/dateTime";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ViewState =
  | { phase: "loading" }
  | { phase: "ready"; todayPlan: AthleteTodayPlan }
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

export function AthleteTodayPlanCard() {
  const planningIds = useAthletePlanningIdentifiers();
  const entityId = planningIds.ids?.entityId ?? "";
  const athleteId = planningIds.ids?.athleteId ?? "";
  const [state, setState] = useState<ViewState>({ phase: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  const retryLoad = useCallback(() => {
    setState({ phase: "loading" });
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (planningIds.phase === "loading") return;
    if (planningIds.phase === "not_ready") return;
    let cancelled = false;
    void (async () => {
      try {
        const todayPlan = await fetchAthleteTodayPlan(entityId, athleteId);
        if (!cancelled) {
          setState({ phase: "ready", todayPlan });
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
  }, [athleteId, entityId, planningIds.phase, reloadKey]);

  const isLoading = planningIds.phase === "loading" ||
    (planningIds.phase === "ready" && state.phase === "loading");
  const todayPlan = state.phase === "ready" ? state.todayPlan : null;
  const allDomainsNotReleased = todayPlan
    ? DOMAIN_SUMMARY.every((domain) => todayPlan.domains[domain.key].status === "NOT_RELEASED")
    : false;
  const hasAnyTodayItems = todayPlan
    ? todayPlan.skills.length > 0 ||
      todayPlan.nutrition.length > 0 ||
      todayPlan.sandc.length > 0
    : false;

  return (
    <DashboardCardShell
      title="Today’s Plan"
      subtitle={todayPlan?.date ? formatDateWithWeekday(todayPlan.date) : undefined}
      className="min-h-[280px]"
    >
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex min-h-[160px] items-center justify-center text-sm text-textSecondary">
            Loading today’s plan…
          </div>
        ) : planningIds.phase === "not_ready" ? (
          <Alert variant="warning">
            Athlete profile not ready
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
        ) : todayPlan === null || !hasAnyTodayItems ? (
          <p className="text-sm text-textSecondary">No plan released for today.</p>
        ) : (
          <div className="space-y-3">
            {DOMAIN_SUMMARY.map((domain) => {
              const items =
                domain.key === "SKILLS"
                  ? todayPlan.skills
                  : domain.key === "NUTRITION"
                    ? todayPlan.nutrition
                    : todayPlan.sandc;
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

