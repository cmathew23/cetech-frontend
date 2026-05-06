import type { CoachAssignedAthleteRow } from "@/lib/api/coachMe";

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

/**
 * Badge label for Training Plan athlete list (`CoachTrainingPlansPageContent`).
 * Uses only assigned-athletes row fields; no inferred validation from other endpoints.
 *
 * Order (must not change):
 * 1. `currentPlanId` truthy → Plan Generated
 * 2. `hasPlanningProfile === false` → APP Incomplete
 * 3. else (`hasPlanningProfile` with no plan) → APP Complete
 */
export function deriveTrainingPlanReadiness(
  row: CoachAssignedAthleteRow,
): TrainingPlanReadiness {
  const planId = row.currentPlanId?.trim() ?? "";
  if (planId !== "") {
    return { kind: "plan_generated", badgeLabel: "Plan Generated" };
  }
  if (!row.hasPlanningProfile) {
    return { kind: "app_incomplete", badgeLabel: "APP Incomplete" };
  }
  return { kind: "app_complete_no_plan", badgeLabel: "APP Complete" };
}
