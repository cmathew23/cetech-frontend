import {
  coachPlanCreationButtonLabel,
  derivePrimaryCoachPlanDomain,
  type CoachPlanCreationDomain,
} from "@/lib/coachAuthority";

export const WAITING_FOR_HEAD_COACH_PLANNING_CONTEXT_MESSAGE =
  "Waiting for locked planning context.";

export const PLANNING_CONTEXT_REQUIRED_BUTTON_LABEL = "Planning Context Required";

/** Nutrition and S&C generation require athlete-specific locked planning context. */
export function downstreamDomainRequiresLockedPlanningContext(
  domain: CoachPlanCreationDomain | null,
): boolean {
  return domain === "NUTRITION" || domain === "S_AND_C";
}

/** Assistant/domain coaches: lock gating before create (Skills included when Head Coach is configured). */
export function assistantCreateRequiresLockedPlanningContext(
  domain: CoachPlanCreationDomain | null,
  hasHeadCoachConfigured: boolean,
): boolean {
  if (domain === null) return false;
  if (hasHeadCoachConfigured) {
    return domain === "SKILLS" || domain === "NUTRITION" || domain === "S_AND_C";
  }
  return downstreamDomainRequiresLockedPlanningContext(domain);
}

/** Shown when backend marks this coach as not the designated generator for this athlete/domain. */
export const PLAN_GENERATION_NOT_ASSIGNED_MESSAGE =
  "Plan generation isn't assigned to you for this athlete in this domain.";

export type PlanGenerationOwnershipFlags = {
  canGeneratePlan: boolean | null;
  canGenerateCurrentDomainPlan: boolean | null;
};

/**
 * When API omits both fields (null), do not add a frontend ownership gate.
 * When canGenerateCurrentDomainPlan is explicitly false, block create.
 * When only canGeneratePlan is explicitly false and domain-level flag is unset, block create for a resolved domain.
 */
export function isPlanGenerationBlockedByOwnership(
  flags: PlanGenerationOwnershipFlags,
): boolean {
  if (flags.canGenerateCurrentDomainPlan === false) return true;
  if (
    flags.canGenerateCurrentDomainPlan === null &&
    flags.canGeneratePlan === false
  ) {
    return true;
  }
  return false;
}

export type AssignedAthletePlanOwnershipRow = {
  currentGenerationDomain: CoachPlanCreationDomain | null;
  canGeneratePlan: boolean | null;
  canGenerateCurrentDomainPlan: boolean | null;
};

/** Merge per-domain readiness with assigned-athletes row flags (assignment table). */
export function mergePlanGenerationOwnershipForDomain(
  domain: CoachPlanCreationDomain,
  readiness: PlanGenerationOwnershipFlags | undefined,
  assignedRow: AssignedAthletePlanOwnershipRow | null,
): PlanGenerationOwnershipFlags {
  let canGeneratePlan = readiness?.canGeneratePlan ?? null;
  let canGenerateCurrentDomainPlan = readiness?.canGenerateCurrentDomainPlan ?? null;
  if (assignedRow) {
    const rowDomain = assignedRow.currentGenerationDomain;
    if (rowDomain === null || rowDomain === domain) {
      if (canGeneratePlan === null) {
        canGeneratePlan = assignedRow.canGeneratePlan;
      }
      if (canGenerateCurrentDomainPlan === null) {
        canGenerateCurrentDomainPlan = assignedRow.canGenerateCurrentDomainPlan;
      }
    }
  }
  return { canGeneratePlan, canGenerateCurrentDomainPlan };
}

/** Assistant create is blocked until Head Coach / upstream planning context is locked. */
export function isCreatePlanBlockedByPlanningContextLock(input: {
  domain: CoachPlanCreationDomain | null;
  hasHeadCoachConfigured: boolean;
  isHeadCoachPlanningContextOwner: boolean;
  planningContextLocked: boolean;
  upstreamContextLockedForDownstream: boolean;
}): boolean {
  if (input.domain === null) return false;
  if (input.isHeadCoachPlanningContextOwner === true) return false;
  if (
    !assistantCreateRequiresLockedPlanningContext(
      input.domain,
      input.hasHeadCoachConfigured === true,
    )
  ) {
    return false;
  }
  if (input.hasHeadCoachConfigured) {
    const contextLocked =
      input.planningContextLocked === true ||
      input.upstreamContextLockedForDownstream === true;
    return !contextLocked;
  }
  return (
    input.upstreamContextLockedForDownstream !== true &&
    input.planningContextLocked !== true
  );
}

/**
 * Skip list-page readiness.canGenerate for assistant Create when HC defers readiness calls,
 * or when a no-HC downstream coach already has locked upstream context (assignment is source of truth).
 */
export function shouldSkipAssistantDomainReadinessGate(input: {
  hasHeadCoachConfigured: boolean;
  isHeadCoachPlanningContextOwner: boolean;
  currentDomain: CoachPlanCreationDomain | null;
  isDownstreamDomainCoach: boolean;
  planningContextLocked: boolean;
  upstreamContextLockedForDownstream: boolean;
}): boolean {
  if (
    input.hasHeadCoachConfigured &&
    !input.isHeadCoachPlanningContextOwner &&
    input.currentDomain !== null
  ) {
    return true;
  }
  if (
    !input.hasHeadCoachConfigured &&
    input.isDownstreamDomainCoach &&
    input.currentDomain !== null &&
    (input.planningContextLocked || input.upstreamContextLockedForDownstream)
  ) {
    return true;
  }
  return false;
}

/** Assistant/domain workspace Create Plan gate (skips main readiness when HC academy defers it). */
export function isAssistantDomainGeneratePlanDisabled(input: {
  domain: CoachPlanCreationDomain | null;
  baseBusy: boolean;
  skipMainReadinessForGenerationGate: boolean;
  generationReadinessFromApis: boolean;
  ownershipFlags: PlanGenerationOwnershipFlags;
  hasHeadCoachConfigured: boolean;
  isHeadCoachPlanningContextOwner: boolean;
  planningContextLocked: boolean;
  upstreamContextLockedForDownstream: boolean;
}): boolean {
  if (input.domain === null) {
    return input.skipMainReadinessForGenerationGate
      ? input.baseBusy
      : input.baseBusy || !input.generationReadinessFromApis;
  }
  if (isPlanGenerationBlockedByOwnership(input.ownershipFlags)) return true;
  if (
    isCreatePlanBlockedByPlanningContextLock({
      domain: input.domain,
      hasHeadCoachConfigured: input.hasHeadCoachConfigured,
      isHeadCoachPlanningContextOwner: input.isHeadCoachPlanningContextOwner,
      planningContextLocked: input.planningContextLocked,
      upstreamContextLockedForDownstream: input.upstreamContextLockedForDownstream,
    })
  ) {
    return true;
  }
  if (input.skipMainReadinessForGenerationGate) {
    return input.baseBusy;
  }
  return input.baseBusy || !input.generationReadinessFromApis;
}

export type AssistantGovernedPlanContext = {
  planId: string;
  versionId: string;
  generationDomain: CoachPlanCreationDomain;
};

export type AssistantVisibleDomainDraftIds = {
  trainingPlanId: string | null | undefined;
  trainingPlanVersionId: string | null | undefined;
} | null;

/** Visible latest-domain-draft ids must match active/detail ids used for governed submit. */
export function isAssistantGovernedDetailAlignedWithVisibleDraft(input: {
  governedContext: AssistantGovernedPlanContext | null;
  latestDraft: AssistantVisibleDomainDraftIds;
  currentDomain: CoachPlanCreationDomain | null;
}): boolean {
  const context = input.governedContext;
  if (context === null || input.currentDomain === null) {
    return false;
  }
  if (context.generationDomain !== input.currentDomain) {
    return false;
  }
  if (input.latestDraft === null) {
    return true;
  }
  const draftPlanId = input.latestDraft.trainingPlanId?.trim() ?? "";
  const draftVersionId = input.latestDraft.trainingPlanVersionId?.trim() ?? "";
  if (draftPlanId === "" || draftVersionId === "") {
    return true;
  }
  return context.planId === draftPlanId && context.versionId === draftVersionId;
}

export function canShowAssistantDomainSubmitReview(input: {
  discoveryLoading: boolean;
  governedDetailRefreshing: boolean;
  hasHeadCoachConfigured: boolean;
  allowedActionsHasSubmitReview: boolean;
  governedContext: AssistantGovernedPlanContext | null;
  latestDraft: AssistantVisibleDomainDraftIds;
  currentDomain: CoachPlanCreationDomain | null;
}): boolean {
  if (input.discoveryLoading || input.governedDetailRefreshing) {
    return false;
  }
  if (!input.hasHeadCoachConfigured) {
    return false;
  }
  if (!input.allowedActionsHasSubmitReview) {
    return false;
  }
  if (input.governedContext === null) {
    return false;
  }
  return isAssistantGovernedDetailAlignedWithVisibleDraft({
    governedContext: input.governedContext,
    latestDraft: input.latestDraft,
    currentDomain: input.currentDomain,
  });
}

export function hasAssistantGovernedDetailVersionMismatch(input: {
  allowedActionsHasSubmitReview: boolean;
  governedContext: AssistantGovernedPlanContext | null;
  latestDraft: AssistantVisibleDomainDraftIds;
  currentDomain: CoachPlanCreationDomain | null;
}): boolean {
  if (!input.allowedActionsHasSubmitReview) {
    return false;
  }
  return !isAssistantGovernedDetailAlignedWithVisibleDraft({
    governedContext: input.governedContext,
    latestDraft: input.latestDraft,
    currentDomain: input.currentDomain,
  });
}

/** Head Coach Step 6: show Skills create when assignment/readiness allows generation. */
export function canHeadCoachCreateSkillsPlan(input: {
  isHeadCoachPlanningContextOwner: boolean;
  planningContextLocked: boolean;
  allowedGenerationDomains: ReadonlyArray<CoachPlanCreationDomain>;
  skillsOwnershipFlags: PlanGenerationOwnershipFlags;
  /** When a Skills draft/version already exists for this athlete. */
  skillsPlanExists?: boolean;
}): boolean {
  if (!input.isHeadCoachPlanningContextOwner) return false;
  if (!input.planningContextLocked) return false;
  if (!input.allowedGenerationDomains.includes("SKILLS")) return false;
  if (input.skillsPlanExists === true) return false;
  return !isPlanGenerationBlockedByOwnership(input.skillsOwnershipFlags);
}

export function isGeneratePlanDisabledForDomain(input: {
  domain: CoachPlanCreationDomain;
  baseBusy: boolean;
  generationReadinessFromApis: boolean;
  ownershipFlags: PlanGenerationOwnershipFlags;
  hasHeadCoachConfigured: boolean;
  isHeadCoachPlanningContextOwner: boolean;
  planningContextLocked: boolean;
  upstreamContextLockedForDownstream: boolean;
}): boolean {
  if (isPlanGenerationBlockedByOwnership(input.ownershipFlags)) return true;
  if (
    isCreatePlanBlockedByPlanningContextLock({
      domain: input.domain,
      hasHeadCoachConfigured: input.hasHeadCoachConfigured,
      isHeadCoachPlanningContextOwner: input.isHeadCoachPlanningContextOwner,
      planningContextLocked: input.planningContextLocked,
      upstreamContextLockedForDownstream: input.upstreamContextLockedForDownstream,
    })
  ) {
    return true;
  }
  return input.baseBusy || !input.generationReadinessFromApis;
}

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
  /** Backend ownership; null/absent means no ownership-based UI gate. */
  canGeneratePlan?: boolean | null;
  canGenerateCurrentDomainPlan?: boolean | null;
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

  const ownershipFlags: PlanGenerationOwnershipFlags = {
    canGeneratePlan: input.canGeneratePlan ?? null,
    canGenerateCurrentDomainPlan: input.canGenerateCurrentDomainPlan ?? null,
  };
  if (
    effectivePlanId === "" &&
    resolvedDomain !== null &&
    input.isHeadCoachPlanningContextOwner !== true &&
    isPlanGenerationBlockedByOwnership(ownershipFlags)
  ) {
    return {
      buttonLabel: coachPlanCreationButtonLabel(resolvedDomain),
      disabled: true,
      helperBelowButton: PLAN_GENERATION_NOT_ASSIGNED_MESSAGE,
      href: null,
      planStatusLabel: null,
      resolvedButtonState: "plan_creation_unavailable",
      resolvedDomain,
    };
  }

  if (
    effectivePlanId === "" &&
    isCreatePlanBlockedByPlanningContextLock({
      domain: resolvedDomain,
      hasHeadCoachConfigured: input.hasHeadCoachConfigured === true,
      isHeadCoachPlanningContextOwner: input.isHeadCoachPlanningContextOwner === true,
      planningContextLocked: input.planningContextLocked === true,
      upstreamContextLockedForDownstream: input.planningContextLocked === true,
    })
  ) {
    return {
      buttonLabel: PLANNING_CONTEXT_REQUIRED_BUTTON_LABEL,
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

  if (input.isHeadCoachPlanningContextOwner === true) {
    const headCoachWorkflowLabel =
      input.planningContextLocked === true
        ? "Open Planning Workflow"
        : "Set Planning Context";
    return {
      buttonLabel: headCoachWorkflowLabel,
      disabled: false,
      helperBelowButton: null,
      href: planningProfileHrefForAthlete(athleteIdTrimmed),
      planStatusLabel: null,
      resolvedButtonState: "create_plan",
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
