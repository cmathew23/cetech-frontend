"use client";

import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import { cn } from "@/lib/utils";

import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  currentCoachIsHeadCoach,
  derivePrimaryCoachPlanDomain,
  type CoachPlanCreationDomain,
} from "@/lib/coachAuthority";
import { resolveTrainingPlanAction } from "@/lib/coachTrainingPlanActions";
import {
  fetchCoachAssignedAthletes,
  fetchCoachMeDashboard,
  type CoachAssignedAthleteRow,
} from "@/lib/api/coachMe";
import {
  fetchCoachAthleteUpstreamPlanningContext,
  isUpstreamPlanningContextLocked,
} from "@/lib/api/coachAthletePlanningReadiness";
import { isNormalizedApiError } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import {
  deriveTrainingPlanReadiness,
  type TrainingPlanReadiness,
} from "@/lib/trainingPlanReadiness";
import { formatPersonNameForDisplay } from "@/lib/textFormat";
import { useEffect, useState } from "react";
import Link from "next/link";

import type { StatusBadgeVariant } from "@/components/ui/StatusBadge";

/** Disabled plan actions: not primary orange — clearly inert (Training Plan page only). */
const TRAINING_PLAN_DISABLED_BUTTON_CLASS =
  "cursor-not-allowed !border-slate-200 !bg-slate-200 !text-slate-600 !opacity-100 shadow-none !pointer-events-none hover:!translate-y-0 hover:!border-slate-200 hover:!bg-slate-200 hover:!text-slate-600 active:!translate-y-0";

function formatCoachApiError(e: unknown, fallback: string): string {
  if (isNormalizedApiError(e)) {
    if (e.status === 403) {
      const server = e.message.trim();
      if (server !== "") return `Access denied. ${server}`;
      return "Access denied. You don't have permission to perform this action.";
    }
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

function badgeVariantForReadiness(
  readiness: TrainingPlanReadiness,
): StatusBadgeVariant {
  switch (readiness.kind) {
    case "app_incomplete":
      return "neutral";
    case "app_complete_no_plan":
    case "plan_generated":
      return "success";
  }
}

function TrainingPlanAthleteRow({
  row,
  domain,
  readiness,
  hasHeadCoachConfigured,
  isHeadCoachPlanningContextOwner,
  planningContextLocked,
}: {
  row: CoachAssignedAthleteRow;
  domain: CoachPlanCreationDomain | null;
  readiness: TrainingPlanReadiness;
  hasHeadCoachConfigured: boolean;
  isHeadCoachPlanningContextOwner: boolean;
  planningContextLocked: boolean | null;
}) {
  const displayName =
    row.displayName.trim() !== ""
      ? formatPersonNameForDisplay(row.displayName)
      : "—";
  const action = resolveTrainingPlanAction({
    athleteId: row.athleteId,
    assignedFunctions: row.assignedFunctions,
    athletePlanGenerationDomain: row.currentGenerationDomain,
    currentPlanId: row.currentPlanId,
    currentPlanStatus: row.currentPlanStatus,
    fallbackDomain: domain,
    hasPlanningProfile: row.hasPlanningProfile,
    hasHeadCoachConfigured,
    isHeadCoachPlanningContextOwner,
    planningContextLocked,
    canGeneratePlan: row.canGeneratePlan,
    canGenerateCurrentDomainPlan: row.canGenerateCurrentDomainPlan,
  });

  return (
    <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-normal text-slate-900">{displayName}</span>
          <StatusBadge
            variant={badgeVariantForReadiness(readiness)}
            className="rounded-md px-2.5 py-1 text-xs font-medium"
          >
            {readiness.badgeLabel}
          </StatusBadge>
        </div>
        <span
          className="block max-w-xl truncate text-xs text-slate-500"
          title={row.email}
        >
          {row.email}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-0 sm:items-end">
        {action.href && !action.disabled ? (
          <Link href={action.href}>
            <Button
              type="button"
              variant={action.disabled ? "neutral" : "primary"}
              className={cn(
                "whitespace-nowrap px-4 py-2 text-xs sm:text-sm",
                action.disabled && TRAINING_PLAN_DISABLED_BUTTON_CLASS,
              )}
              disabled={action.disabled}
            >
              {action.buttonLabel}
            </Button>
          </Link>
        ) : (
          <Button
          type="button"
          variant={action.disabled ? "neutral" : "primary"}
          className={cn(
            "whitespace-nowrap px-4 py-2 text-xs sm:text-sm",
            action.disabled && TRAINING_PLAN_DISABLED_BUTTON_CLASS,
          )}
          disabled={action.disabled}
        >
          {action.buttonLabel}
        </Button>
        )}
        {action.planStatusLabel ? (
          <p className="mt-0.5 max-w-[16rem] text-right text-[11px] leading-snug text-slate-400">
            {action.planStatusLabel}
          </p>
        ) : null}
        {action.helperBelowButton ? (
          <p className="mt-0.5 max-w-[16rem] text-right text-[11px] leading-snug text-slate-500">
            {action.helperBelowButton}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function CoachTrainingPlansPageContent() {
  const { accessContext, accessGateReady } = useAuth();
  const entityId = accessContext?.academy.trainingEntityId?.trim() ?? "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<CoachAssignedAthleteRow[]>([]);
  const [planDomain, setPlanDomain] = useState<CoachPlanCreationDomain | null>(
    null,
  );
  const [hasHeadCoachConfigured, setHasHeadCoachConfigured] = useState(false);
  const [isHeadCoachPlanningContextOwner, setIsHeadCoachPlanningContextOwner] =
    useState(false);
  const [planningContextLockedByAthleteId, setPlanningContextLockedByAthleteId] =
    useState<Record<string, boolean | null>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!accessGateReady) {
        setLoading(true);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [dashResult, rowsResult] = await Promise.allSettled([
          fetchCoachMeDashboard(),
          fetchCoachAssignedAthletes(),
        ]);
        if (rowsResult.status !== "fulfilled") {
          throw rowsResult.reason;
        }
        if (cancelled) return;
        const rows = rowsResult.value;
        const dash = dashResult.status === "fulfilled" ? dashResult.value : null;
        const headCoachConfigured = dash?.hasHeadCoachConfigured === true;
        const headCoachUser =
          dash !== null &&
          headCoachConfigured &&
          currentCoachIsHeadCoach(dash.academyCoachRole);
        const lockMap: Record<string, boolean | null> = {};
        if (!headCoachUser && entityId !== "") {
          const contextResults = await Promise.allSettled(
            rows.map(async (row) => {
              const context = await fetchCoachAthleteUpstreamPlanningContext(
                entityId,
                row.athleteId,
              );
              return [row.athleteId, isUpstreamPlanningContextLocked(context)] as const;
            }),
          );
          for (const result of contextResults) {
            if (result.status === "fulfilled") {
              lockMap[result.value[0]] = result.value[1];
            }
          }
        }
        if (cancelled) return;
        setAthletes(rows);
        setPlanDomain(
          dash ? derivePrimaryCoachPlanDomain(dash.functions ?? []) : null,
        );
        setHasHeadCoachConfigured(headCoachConfigured);
        setIsHeadCoachPlanningContextOwner(headCoachUser);
        setPlanningContextLockedByAthleteId(lockMap);
      } catch (e) {
        if (cancelled) return;
        setAthletes([]);
        setPlanDomain(null);
        setHasHeadCoachConfigured(false);
        setIsHeadCoachPlanningContextOwner(false);
        setPlanningContextLockedByAthleteId({});
        setError(
          formatCoachApiError(
            e,
            "Could not load training plan athletes. Try again shortly.",
          ),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessGateReady, entityId]);

  return (
    <div className="w-full max-w-5xl space-y-6">
      <PageHeader
        title="Training Plan"
        subtitle="Create and manage athlete training plans."
      />

      {error ? <Alert variant="danger">{error}</Alert> : null}

      {error ? null : (
        <div
          className={cn(
            "overflow-hidden rounded-2xl border bg-white",
            DASHBOARD_MAJOR_OUTER_CARD_CLASS,
          )}
        >
          {loading ? (
            <p className="px-6 py-6 text-sm text-slate-500">
              Loading athletes…
            </p>
          ) : athletes.length === 0 ? (
            <p className="px-6 py-6 text-sm text-slate-500">
              No athletes available for training plan creation.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {athletes.map((row, index) => (
                <div
                  key={`${row.athleteId}-${row.email}-${index}`}
                  className="group hover:bg-slate-50/70"
                >
                  <TrainingPlanAthleteRow
                    row={row}
                    domain={planDomain}
                    readiness={deriveTrainingPlanReadiness(row, {
                      fallbackCoachPlanDomain: planDomain,
                      isHeadCoachPlanningContextOwner,
                    })}
                    hasHeadCoachConfigured={hasHeadCoachConfigured}
                    isHeadCoachPlanningContextOwner={isHeadCoachPlanningContextOwner}
                    planningContextLocked={
                      planningContextLockedByAthleteId[row.athleteId] ?? null
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
