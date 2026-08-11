import {
  fetchCoachAthleteUpstreamPlanningContext,
  isUpstreamPlanningContextLocked,
  type CoachAthleteUpstreamPlanningContext,
} from "@/lib/api/coachAthletePlanningReadiness";
import type { CoachAssignedAthleteRow } from "@/lib/api/coachMe";
import type { CoachPlanCreationDomain } from "@/lib/coachAuthority";
import { resolveTrainingPlanAction } from "@/lib/coachTrainingPlanActions";

export type TrainingPlanListActionContext = {
  domain: CoachPlanCreationDomain | null;
  hasHeadCoachConfigured: boolean;
  isHeadCoachPlanningContextOwner: boolean;
};

export function resolveAssignedAthleteTrainingPlanAction(
  row: CoachAssignedAthleteRow,
  context: TrainingPlanListActionContext,
  planningContextLocked: boolean | null,
) {
  return resolveTrainingPlanAction({
    athleteId: row.athleteId,
    assignedFunctions: row.assignedFunctions,
    athletePlanGenerationDomain: row.currentGenerationDomain,
    currentPlanId: row.currentPlanId,
    currentPlanStatus: row.currentPlanStatus,
    displayPlanStatus: row.displayPlanStatus,
    planStatus: row.planStatus,
    fallbackDomain: context.domain,
    hasPlanningProfile: row.hasPlanningProfile,
    hasHeadCoachConfigured: context.hasHeadCoachConfigured,
    isHeadCoachPlanningContextOwner: context.isHeadCoachPlanningContextOwner,
    planningContextLocked,
    canGeneratePlan: row.canGeneratePlan,
    canGenerateCurrentDomainPlan: row.canGenerateCurrentDomainPlan,
  });
}

function renderedActionsAreEqual(
  left: ReturnType<typeof resolveTrainingPlanAction>,
  right: ReturnType<typeof resolveTrainingPlanAction>,
): boolean {
  return (
    left.buttonLabel === right.buttonLabel &&
    left.disabled === right.disabled &&
    left.helperBelowButton === right.helperBelowButton &&
    left.href === right.href &&
    left.planStatusLabel === right.planStatusLabel
  );
}

export function assignedAthleteActionDependsOnPlanningContextLock(
  row: CoachAssignedAthleteRow,
  context: TrainingPlanListActionContext,
): boolean {
  const unlockedAction = resolveAssignedAthleteTrainingPlanAction(
    row,
    context,
    false,
  );
  const lockedAction = resolveAssignedAthleteTrainingPlanAction(
    row,
    context,
    true,
  );
  return !renderedActionsAreEqual(unlockedAction, lockedAction);
}

type FetchUpstreamPlanningContext = (
  entityId: string,
  athleteId: string,
) => Promise<CoachAthleteUpstreamPlanningContext>;

export async function fetchRequiredPlanningContextLocks(
  entityId: string,
  rows: CoachAssignedAthleteRow[],
  context: TrainingPlanListActionContext,
  fetchUpstreamPlanningContext: FetchUpstreamPlanningContext =
    fetchCoachAthleteUpstreamPlanningContext,
): Promise<Record<string, boolean | null>> {
  const rowsRequiringContext = rows.filter((row) =>
    assignedAthleteActionDependsOnPlanningContextLock(row, context),
  );
  const results = await Promise.allSettled(
    rowsRequiringContext.map(async (row) => {
      const upstreamContext = await fetchUpstreamPlanningContext(
        entityId,
        row.athleteId,
      );
      return [
        row.athleteId,
        isUpstreamPlanningContextLocked(upstreamContext),
      ] as const;
    }),
  );
  const lockMap: Record<string, boolean | null> = {};
  for (const result of results) {
    if (result.status === "fulfilled") {
      lockMap[result.value[0]] = result.value[1];
    }
  }
  return lockMap;
}
