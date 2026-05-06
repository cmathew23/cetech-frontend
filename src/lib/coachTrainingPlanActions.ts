import {
  coachPlanCreationButtonLabel,
  derivePrimaryCoachPlanDomain,
  type CoachPlanCreationDomain,
} from "@/lib/coachAuthority";

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
  currentGenerationDomain: CoachPlanCreationDomain | null;
  fallbackDomain: CoachPlanCreationDomain | null;
}): CoachPlanCreationDomain | null {
  return (
    input.currentGenerationDomain ??
    derivePrimaryCoachPlanDomain(input.assignedFunctions) ??
    input.fallbackDomain
  );
}

export function resolveTrainingPlanAction(input: {
  athleteId: string;
  assignedFunctions: string[];
  currentGenerationDomain: CoachPlanCreationDomain | null;
  currentPlanId: string | null;
  currentPlanStatus: string | null;
  fallbackDomain: CoachPlanCreationDomain | null;
  hasPlanningProfile: boolean;
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
    currentGenerationDomain: input.currentGenerationDomain,
    fallbackDomain: input.fallbackDomain,
  });
  const normalizedPlanId = input.currentPlanId?.trim() ?? "";

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

  if (normalizedPlanId !== "") {
    return {
      buttonLabel: editPlanButtonLabel(resolvedDomain),
      disabled: false,
      helperBelowButton: null,
      href: planningProfileHrefForAthlete(athleteIdTrimmed, normalizedPlanId),
      planStatusLabel: planStatusLabel(input.currentPlanStatus),
      resolvedButtonState: "edit_plan",
      resolvedDomain,
    };
  }

  if (resolvedDomain === null) {
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
