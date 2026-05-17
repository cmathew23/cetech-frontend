import {
  coachPlanCreationButtonLabel,
  derivePrimaryCoachPlanDomain,
  type CoachPlanCreationDomain,
} from "@/lib/coachAuthority";

export const WAITING_FOR_HEAD_COACH_PLANNING_CONTEXT_MESSAGE =
  "Waiting for Head Coach to lock planning context.";

type ResolvedButtonState =
  | "route_unavailable"
  | "plan_creation_unavailable"
  | "edit_plan"
  | "create_plan"
  | "app_required";

function domainLabel(domain: CoachPlanCreationDomain): string {
  if (domain === "SKILLS") return "Skills";
  if (domain === "NUTRITION") return "Nutrition";
  return "S&C";
}

function editPlanButtonLabel(domain: CoachPlanCreationDomain | null): string {
  if (domain === null) return "Edit Plan";
  return `Edit ${domainLabel(domain)} Plan`;
}

function planStatusLabel(status: string | null): string | null {
  const normalizedStatus = status?.trim() ?? "";
  return normalizedStatus !== "" ? `Plan: ${normalizedStatus}` : null;
}

export function planningProfileHrefForAthlete(
  athleteId: string,
  planId?: string | null,
): string {
  const baseHref = `/coach/training-plans/${encodeURIComponent(athleteId)}/workflow`;
  const normalizedPlanId = planId?.trim() ?? "";
  if (normalizedPlanId === "") return baseHref;

  const params = new URLSearchParams();
  params.set("planId", normalizedPlanId);
  params.set("skillsPlanId", normalizedPlanId);
  return `${baseHref}?${params.toString()}`;
}

export function resolveCoachPlanDomain(input: {
  assignedFunctions: string[];
  /**
   * Domain of the athlete row's aggregated `currentPlanId`/`currentPlanStatus` (from assigned-athletes),
   * not necessarily the viewer's coaching domain — do **not** use this as the viewer's coach domain unless
   * no authority-derived domain exists.
   */
  athletePlanGenerationDomain: CoachPlanCreationDomain | null;
  fallbackDomain: CoachPlanCreationDomain | null;
  /** When true, retains broad plan-row hints (review workflow). Domain assistants omit athlete plan domain bleed. */
  isHeadCoachPlanningContextOwner?: boolean;
}): CoachPlanCreationDomain | null {
  const authorityDomain =
    input.fallbackDomain ?? derivePrimaryCoachPlanDomain(input.assignedFunctions);

  if (input.isHeadCoachPlanningContextOwner === true) {
    return authorityDomain ?? input.athletePlanGenerationDomain;
  }

  if (authorityDomain !== null) {
    return authorityDomain;
  }

  return input.athletePlanGenerationDomain;
}

export function resolveTrainingPlanAction(input: {
  athleteId: string;
  assignedFunctions: string[];
  /** Domain tying `currentPlanId` / `currentPlanStatus` on this athlete row — from assigned-athletes only. */
  athletePlanGenerationDomain: CoachPlanCreationDomain | null;
  currentPlanId: string | null;
  currentPlanStatus: string | null;
  fallbackDomain: CoachPlanCreationDomain | null;
  hasPlanningProfile: boolean;
  hasHeadCoachConfigured?: boolean;
  isHeadCoachPlanningContextOwner?: boolean;
  planningContextLocked?: boolean | null;
}): {
  buttonLabel: string;
  disabled: boolean;
  helperBelowButton: string | null;
  href: string | null;
  planStatusLabel: string | null;
  resolvedButtonState: ResolvedButtonState;
  resolvedDomain: CoachPlanCreationDomain | null;
} {
  const athleteIdTrimmed = input.athleteId.trim();
  const resolvedDomain = resolveCoachPlanDomain({
    assignedFunctions: input.assignedFunctions,
    athletePlanGenerationDomain: input.athletePlanGenerationDomain,
    fallbackDomain: input.fallbackDomain,
    isHeadCoachPlanningContextOwner: input.isHeadCoachPlanningContextOwner === true,
  });
  const normalizedPlanId = input.currentPlanId?.trim() ?? "";
  const planAlignedForCoachWorkspace =
    input.isHeadCoachPlanningContextOwner === true ||
    resolvedDomain === null ||
    input.athletePlanGenerationDomain === null ||
    input.athletePlanGenerationDomain === resolvedDomain;
  const effectivePlanId =
    normalizedPlanId !== "" && planAlignedForCoachWorkspace ? normalizedPlanId : "";

  if (athleteIdTrimmed === "") {
    return {
      buttonLabel:
        resolvedDomain !== null
          ? coachPlanCreationButtonLabel(resolvedDomain)
          : "Plan creation unavailable",
      disabled: true,
      helperBelowButton: "Athlete route not available.",
      href: null,
      planStatusLabel: null,
      resolvedButtonState: "route_unavailable",
      resolvedDomain,
    };
  }

  if (!input.hasPlanningProfile) {
    return {
      buttonLabel: "APP Required",
      disabled: true,
      helperBelowButton: null,
      href: null,
      planStatusLabel: null,
      resolvedButtonState: "app_required",
      resolvedDomain,
    };
  }

  if (
    effectivePlanId === "" &&
    input.hasHeadCoachConfigured === true &&
    input.isHeadCoachPlanningContextOwner !== true &&
    input.planningContextLocked !== true &&
    resolvedDomain !== null
  ) {
    return {
      buttonLabel: coachPlanCreationButtonLabel(resolvedDomain),
      disabled: true,
      helperBelowButton: WAITING_FOR_HEAD_COACH_PLANNING_CONTEXT_MESSAGE,
      href: null,
      planStatusLabel: null,
      resolvedButtonState: "plan_creation_unavailable",
      resolvedDomain,
    };
  }

  if (effectivePlanId !== "") {
    return {
      buttonLabel: editPlanButtonLabel(resolvedDomain),
      disabled: false,
      helperBelowButton: null,
      href: planningProfileHrefForAthlete(athleteIdTrimmed, effectivePlanId),
      planStatusLabel: planStatusLabel(input.currentPlanStatus),
      resolvedButtonState: "edit_plan",
      resolvedDomain,
    };
  }

  if (resolvedDomain === null) {
    if (input.isHeadCoachPlanningContextOwner === true) {
      return {
        buttonLabel: "Open Planning Workflow",
        disabled: false,
        helperBelowButton: null,
        href: planningProfileHrefForAthlete(athleteIdTrimmed),
        planStatusLabel: null,
        resolvedButtonState: "create_plan",
        resolvedDomain,
      };
    }
    return {
      buttonLabel: "Plan creation unavailable",
      disabled: true,
      helperBelowButton: "Coach function not assigned.",
      href: null,
      planStatusLabel: null,
      resolvedButtonState: "plan_creation_unavailable",
      resolvedDomain,
    };
  }

  return {
    buttonLabel: coachPlanCreationButtonLabel(resolvedDomain),
    disabled: false,
    helperBelowButton: null,
    href: planningProfileHrefForAthlete(athleteIdTrimmed),
    planStatusLabel: null,
    resolvedButtonState: "create_plan",
    resolvedDomain,
  };
}
