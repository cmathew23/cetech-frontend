import type { CoachAssignedAthleteRow } from "@/lib/api/coachMe";
import type { CoachPlanCreationDomain } from "@/lib/coachAuthority";
import { resolveCoachPlanDomain } from "@/lib/coachTrainingPlanActions";

/**
 * Training Plan athlete list badge states (coach Training Plan page only).
 * Uses hasPlanningProfile and currentPlanId from assigned-athletes rows only.
 */
export type TrainingPlanReadinessKind =
  | "app_incomplete"
  | "app_complete_no_plan"
  | "plan_generated";

export type TrainingPlanReadiness = {
  kind: TrainingPlanReadinessKind;
  badgeLabel: string;
};

export type DeriveTrainingPlanReadinessOpts = {
  /** Viewer coach primary plan domain (`derivePrimaryCoachPlanDomain` from dashboard). */
  fallbackCoachPlanDomain?: CoachPlanCreationDomain | null;
  isHeadCoachPlanningContextOwner?: boolean;
};

/**
 * Badge label for Training Plan athlete list (`CoachTrainingPlansPageContent`).
 * Uses only assigned-athletes row fields; no inferred validation from other endpoints.
 *
 * Order (must not change):
 * 1. Row `currentPlanId` truthy **and** domain-aligned for this viewer → Plan Generated
 * 2. `hasPlanningProfile === false` → APP Incomplete
 * 3. else (`hasPlanningProfile` with no aligned plan) → APP Complete
 */
export function deriveTrainingPlanReadiness(
  row: CoachAssignedAthleteRow,
  opts?: DeriveTrainingPlanReadinessOpts,
): TrainingPlanReadiness {
  const resolvedDomain = resolveCoachPlanDomain({
    assignedFunctions: row.assignedFunctions,
    athletePlanGenerationDomain: row.currentGenerationDomain,
    fallbackDomain: opts?.fallbackCoachPlanDomain ?? null,
    isHeadCoachPlanningContextOwner: opts?.isHeadCoachPlanningContextOwner === true,
  });
  const normalizedPlanId = row.currentPlanId?.trim() ?? "";
  const planAlignedForCoachWorkspace =
    opts?.isHeadCoachPlanningContextOwner === true ||
    resolvedDomain === null ||
    row.currentGenerationDomain === null ||
    row.currentGenerationDomain === resolvedDomain;
  const alignedPlanPresent =
    normalizedPlanId !== "" && planAlignedForCoachWorkspace;

  if (alignedPlanPresent) {
    return { kind: "plan_generated", badgeLabel: "Plan Generated" };
  }
  if (!row.hasPlanningProfile) {
    return { kind: "app_incomplete", badgeLabel: "APP Incomplete" };
  }
  return { kind: "app_complete_no_plan", badgeLabel: "APP Complete" };
}
