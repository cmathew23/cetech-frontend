import type { GovernedTrainingPlanWorkflowAction } from "@/lib/api/coachAthletePlanningReadiness";
import type { GenerationDomain } from "@/lib/coachAuthority";
import type {
  TrainingPlanWorkspace,
  TrainingPlanWorkspaceDomain,
} from "@/types/trainingPlanWorkspace";

export type TrainingPlanWorkflowMode =
  | "loading"
  | "head_coach_planning"
  | "head_coach_review"
  | "head_coach_function_aware"
  | "skills_coach_planning"
  | "specialist_domain";

export type TrainingPlanResolvedReleaseMode =
  | "head_coach_review"
  | "direct_release";

export type GuidedWorkflowStepKey =
  | "context-app"
  | "level-validation"
  | "workload"
  | "season-goals"
  | "plan-dates"
  | "generate";

const GENERATION_DOMAINS: GenerationDomain[] = [
  "SKILLS",
  "NUTRITION",
  "S_AND_C",
];

function normalizeWorkspaceToken(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/&/g, "AND")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function parseWorkspaceWorkflowMode(
  value: string | null | undefined,
): TrainingPlanWorkflowMode | null {
  if (!value || value.trim() === "") return null;
  const lower = value.trim().toLowerCase();
  if (
    lower === "head_coach_planning" ||
    lower === "head_coach_review" ||
    lower === "head_coach_function_aware" ||
    lower === "skills_coach_planning" ||
    lower === "specialist_domain" ||
    lower === "loading"
  ) {
    return lower as TrainingPlanWorkflowMode;
  }
  const normalized = normalizeWorkspaceToken(value);
  const map: Record<string, TrainingPlanWorkflowMode> = {
    HEAD_COACH_PLANNING: "head_coach_planning",
    HEAD_COACH_REVIEW: "head_coach_review",
    REVIEW_REQUIRED: "head_coach_review",
    HEAD_COACH_REVIEW_REQUIRED: "head_coach_review",
    RELEASE_READY: "head_coach_review",
    READY_FOR_RELEASE: "head_coach_review",
    RELEASED: "head_coach_review",
    HEAD_COACH_FUNCTION_AWARE: "head_coach_function_aware",
    SKILLS_COACH_PLANNING: "skills_coach_planning",
    SPECIALIST_DOMAIN: "specialist_domain",
    LOADING: "loading",
  };
  return map[normalized] ?? null;
}

export function resolveWorkflowModeFromWorkspace(
  workspace: TrainingPlanWorkspace,
): TrainingPlanWorkflowMode | null {
  return (
    parseWorkspaceWorkflowMode(workspace.shell) ??
    parseWorkspaceWorkflowMode(workspace.workflowMode)
  );
}

export function parseWorkspaceCurrentDomain(
  value: string | null | undefined,
): GenerationDomain | null {
  const normalized = normalizeWorkspaceToken(value ?? "");
  if (
    normalized === "SKILLS" ||
    normalized === "NUTRITION" ||
    normalized === "S_AND_C"
  ) {
    return normalized;
  }
  return null;
}

export function parseWorkspaceInitialTab(
  value: string | null | undefined,
): GuidedWorkflowStepKey | null {
  if (!value || value.trim() === "") return null;
  const lower = value.trim().toLowerCase();
  const lowerMap: Record<string, GuidedWorkflowStepKey> = {
    "context-app": "context-app",
    "level-validation": "level-validation",
    workload: "workload",
    "season-goals": "season-goals",
    "plan-dates": "plan-dates",
    domain: "generate",
    generate: "generate",
    "generate-plan": "generate",
  };
  if (lower in lowerMap) return lowerMap[lower];
  const normalized = normalizeWorkspaceToken(value);
  const map: Record<string, GuidedWorkflowStepKey> = {
    CONTEXT_APP: "context-app",
    LEVEL_VALIDATION: "level-validation",
    WORKLOAD: "workload",
    WORKLOAD_ASSESSMENT: "workload",
    SEASON_GOALS: "season-goals",
    PLAN_DATES: "plan-dates",
    DOMAIN: "generate",
    DOMAIN_PLAN: "generate",
    DOMAIN_WORKSPACE: "generate",
    GENERATE: "generate",
    GENERATE_PLAN: "generate",
  };
  return map[normalized] ?? null;
}

export function workspaceHasSubmittedDomainPlans(
  workspace: TrainingPlanWorkspace,
): boolean {
  return GENERATION_DOMAINS.some(
    (domain) => workspace.domains[domain].submittedForReview,
  );
}

export function workspacePlanningContextLocked(
  workspace: TrainingPlanWorkspace,
): boolean {
  return workspace.planningContext.locked;
}

export function workspaceHeadCoachOwnsPlanningContext(
  workspace: TrainingPlanWorkspace,
): boolean {
  if (workspace.assignmentContext !== undefined) {
    return workspace.assignmentContext.planningContext.ownerType === "HEAD_COACH";
  }
  return workspace.ownershipFlags.headCoachOwnsPlanningContext;
}

export function workspaceDirectReleaseAllowed(
  workspace: TrainingPlanWorkspace,
): boolean {
  if (workspace.assignmentContext !== undefined) {
    return workspace.assignmentContext.releaseMode === "DIRECT_DOMAIN_RELEASE";
  }
  return workspace.ownershipFlags.directReleaseAllowed;
}

/**
 * Workflow 2: Skills owner generation only when backend confirms athlete assignment.
 * Never infer from requesterHasSkillsFunction alone.
 */
export function workspaceHeadCoachOwnsSkillsForAthlete(
  workspace: TrainingPlanWorkspace,
): boolean {
  const assignmentSkillsContext = workspace.assignmentContext?.domains.SKILLS;
  if (assignmentSkillsContext !== undefined) {
    return (
      assignmentSkillsContext.ownerType === "HEAD_COACH_SELF" &&
      assignmentSkillsContext.ownedByCurrentUser
    );
  }

  const flags = workspace.ownershipFlags;
  if (flags.requesterOwnsSkillsForThisAthlete !== undefined) {
    return flags.requesterOwnsSkillsForThisAthlete;
  }
  if (
    flags.requesterOwnsCurrentDomain &&
    parseWorkspaceCurrentDomain(workspace.currentDomain) === "SKILLS"
  ) {
    return true;
  }
  const skillsActions = parseWorkspaceAllowedActions(workspace.domains.SKILLS);
  return skillsActions.some(
    (action) =>
      action === "SUBMIT_REVIEW" ||
      action === "REQUEST_REVISION" ||
      action === "RELEASE",
  );
}

export function parseWorkspaceAllowedActions(
  domain: TrainingPlanWorkspaceDomain,
): GovernedTrainingPlanWorkflowAction[] {
  const out = new Set<GovernedTrainingPlanWorkflowAction>();
  for (const item of domain.allowedActions) {
    const normalized = normalizeWorkspaceToken(item);
    if (normalized === "SUBMIT_REVIEW" || normalized === "SUBMIT_FOR_REVIEW") {
      out.add("SUBMIT_REVIEW");
    } else if (normalized === "HEAD_APPROVE") {
      out.add("HEAD_APPROVE");
    } else if (
      normalized === "REQUEST_REVISION" ||
      normalized === "REQUEST_REVIEW_REVISION"
    ) {
      out.add("REQUEST_REVISION");
    } else if (normalized === "RELEASE" || normalized === "RELEASE_TO_ATHLETE") {
      out.add("RELEASE");
    }
  }
  return Array.from(out);
}

export function workspaceAllowedActionsSet(
  workspace: TrainingPlanWorkspace,
  domain: GenerationDomain,
): Set<GovernedTrainingPlanWorkflowAction> {
  return new Set(parseWorkspaceAllowedActions(workspace.domains[domain]));
}

export type TrainingPlanTab6Authority = {
  canManagePlanningContext: boolean;
  canGenerateSkills: boolean;
  canGenerateNutrition: boolean;
  canGenerateSC: boolean;
  canSubmitSkillsForReview: boolean;
  canSubmitNutritionForReview: boolean;
  canSubmitSCForReview: boolean;
  canApproveDomains: boolean;
  canReleaseToAthlete: boolean;
  isAssignedSkillsOwner: boolean;
  isAssignedNutritionOwner: boolean;
  isAssignedSCOwner: boolean;
  isGovernanceCoach: boolean;
  isDirectReleaseDomainCoach: boolean;
};

const EMPTY_TAB6_AUTHORITY: TrainingPlanTab6Authority = {
  canManagePlanningContext: false,
  canGenerateSkills: false,
  canGenerateNutrition: false,
  canGenerateSC: false,
  canSubmitSkillsForReview: false,
  canSubmitNutritionForReview: false,
  canSubmitSCForReview: false,
  canApproveDomains: false,
  canReleaseToAthlete: false,
  isAssignedSkillsOwner: false,
  isAssignedNutritionOwner: false,
  isAssignedSCOwner: false,
  isGovernanceCoach: false,
  isDirectReleaseDomainCoach: false,
};

function legacyRequesterOwnsDomain(
  workspace: TrainingPlanWorkspace,
  domain: GenerationDomain,
): boolean {
  const flags = workspace.ownershipFlags;
  if (domain === "SKILLS" && flags.requesterOwnsSkillsForThisAthlete !== undefined) {
    return flags.requesterOwnsSkillsForThisAthlete;
  }
  if (domain === "NUTRITION" && flags.requesterOwnsNutritionForThisAthlete !== undefined) {
    return flags.requesterOwnsNutritionForThisAthlete;
  }
  if (domain === "S_AND_C" && flags.requesterOwnsStrengthForThisAthlete !== undefined) {
    return flags.requesterOwnsStrengthForThisAthlete;
  }
  return (
    flags.requesterOwnsCurrentDomain &&
    parseWorkspaceCurrentDomain(workspace.currentDomain) === domain
  );
}

export function resolveTrainingPlanTab6Authority(
  workspace: TrainingPlanWorkspace | null | undefined,
): TrainingPlanTab6Authority {
  if (workspace === null || workspace === undefined) return EMPTY_TAB6_AUTHORITY;

  const assignment = workspace.assignmentContext;
  if (assignment !== undefined) {
    const skills = assignment.domains.SKILLS;
    const nutrition = assignment.domains.NUTRITION;
    const sandC = assignment.domains.S_AND_C;
    const domainContexts = [skills, nutrition, sandC];
    const ownsSkills = skills.ownerType !== "NONE" && skills.ownedByCurrentUser;
    const ownsNutrition = nutrition.ownerType !== "NONE" && nutrition.ownedByCurrentUser;
    const ownsSC = sandC.ownerType !== "NONE" && sandC.ownedByCurrentUser;
    const canApproveDomains = domainContexts.some(
      (domain) => domain.canApprove || domain.canRequestRevision === true,
    );
    const canReleaseToAthlete = domainContexts.some((domain) => domain.canRelease);
    const isGovernanceCoach =
      canApproveDomains ||
      domainContexts.some(
        (domain) =>
          domain.releaseMode === "HEAD_COACH_APPROVAL" && domain.canRelease,
      );
    const isDirectReleaseDomainCoach =
      assignment.releaseMode === "DIRECT_DOMAIN_RELEASE" &&
      domainContexts.some(
        (domain) =>
          domain.ownerType !== "NONE" &&
          domain.ownedByCurrentUser &&
          (domain.canGenerate || domain.canSubmitForReview || domain.canRelease),
      );

    return {
      canManagePlanningContext:
        assignment.planningContext.ownerType !== "NONE" &&
        (assignment.planningContext.canCreate ||
          assignment.planningContext.canLock ||
          assignment.planningContext.canManage),
      canGenerateSkills: ownsSkills && skills.canGenerate,
      canGenerateNutrition: ownsNutrition && nutrition.canGenerate,
      canGenerateSC: ownsSC && sandC.canGenerate,
      canSubmitSkillsForReview: ownsSkills && skills.canSubmitForReview,
      canSubmitNutritionForReview: ownsNutrition && nutrition.canSubmitForReview,
      canSubmitSCForReview: ownsSC && sandC.canSubmitForReview,
      canApproveDomains,
      canReleaseToAthlete,
      isAssignedSkillsOwner: ownsSkills,
      isAssignedNutritionOwner: ownsNutrition,
      isAssignedSCOwner: ownsSC,
      isGovernanceCoach,
      isDirectReleaseDomainCoach,
    };
  }

  const ownsSkills = legacyRequesterOwnsDomain(workspace, "SKILLS");
  const ownsNutrition = legacyRequesterOwnsDomain(workspace, "NUTRITION");
  const ownsSC = legacyRequesterOwnsDomain(workspace, "S_AND_C");
  const skillsActions = workspaceAllowedActionsSet(workspace, "SKILLS");
  const nutritionActions = workspaceAllowedActionsSet(workspace, "NUTRITION");
  const sandCActions = workspaceAllowedActionsSet(workspace, "S_AND_C");
  const domainActionSets = [skillsActions, nutritionActions, sandCActions];
  const canApproveDomains = domainActionSets.some(
    (actions) => actions.has("HEAD_APPROVE") || actions.has("REQUEST_REVISION"),
  );
  const canReleaseToAthlete = domainActionSets.some((actions) => actions.has("RELEASE"));

  return {
    canManagePlanningContext: workspace.ownershipFlags.headCoachOwnsPlanningContext,
    canGenerateSkills: ownsSkills,
    canGenerateNutrition: ownsNutrition,
    canGenerateSC: ownsSC,
    canSubmitSkillsForReview: ownsSkills && skillsActions.has("SUBMIT_REVIEW"),
    canSubmitNutritionForReview: ownsNutrition && nutritionActions.has("SUBMIT_REVIEW"),
    canSubmitSCForReview: ownsSC && sandCActions.has("SUBMIT_REVIEW"),
    canApproveDomains,
    canReleaseToAthlete,
    isAssignedSkillsOwner: ownsSkills,
    isAssignedNutritionOwner: ownsNutrition,
    isAssignedSCOwner: ownsSC,
    isGovernanceCoach:
      workspace.ownershipFlags.requesterIsHeadCoach &&
      (canApproveDomains || canReleaseToAthlete),
    isDirectReleaseDomainCoach:
      workspace.ownershipFlags.directReleaseAllowed &&
      (ownsSkills || ownsNutrition || ownsSC),
  };
}

export function workspaceAssignedGenerationDomains(
  workspace: TrainingPlanWorkspace,
): GenerationDomain[] {
  const assignment = workspace.assignmentContext;
  if (assignment === undefined) return [];
  return GENERATION_DOMAINS.filter((domain) => {
    const context = assignment.domains[domain];
    return context.ownerType !== "NONE" && context.ownedByCurrentUser;
  });
}

export function workspaceResolvableGenerationDomains(
  workspace: TrainingPlanWorkspace,
): GenerationDomain[] {
  return GENERATION_DOMAINS.filter((domain) => {
    const entry = workspace.domains[domain];
    return (
      entry.canOpen ||
      entry.allowedActions.length > 0 ||
      (entry.summary.trainingPlanId?.trim() ?? "") !== "" ||
      entry.submittedForReview
    );
  });
}

export function workspaceHeadCoachCanCreateSkillsPlan(
  workspace: TrainingPlanWorkspace,
  skillsPlanExists: boolean,
): boolean {
  if (!workspaceHeadCoachOwnsSkillsForAthlete(workspace)) return false;
  if (!workspace.planningContext.locked) return false;
  if (skillsPlanExists) return false;
  const skills = workspace.domains.SKILLS;
  if (!skills.canOpen) return false;
  const actions = parseWorkspaceAllowedActions(skills);
  if (actions.includes("SUBMIT_REVIEW") || actions.includes("RELEASE")) {
    return true;
  }
  if (skills.allowedActions.length === 0) {
    return true;
  }
  const normalized = skills.allowedActions.map(normalizeWorkspaceToken);
  return normalized.some(
    (action) => action.includes("GENERATE") || action.includes("CREATE"),
  );
}

export function workspaceDomainHasPersistedPlanIds(
  domain: TrainingPlanWorkspaceDomain,
): boolean {
  return (
    (domain.summary.trainingPlanId?.trim() ?? "") !== "" &&
    (domain.summary.versionId?.trim() ?? "") !== ""
  );
}

export function resolveLegacyPlanningContextLocked(input: {
  hasHeadCoachConfigured: boolean;
  upstreamPlanningContextLocked: boolean;
  upstreamPlanningContextUpstreamLocked: boolean;
  clientHasSubmittedDomainPlans: boolean;
}): boolean {
  return input.hasHeadCoachConfigured
    ? input.upstreamPlanningContextLocked || input.clientHasSubmittedDomainPlans
    : input.upstreamPlanningContextLocked || input.upstreamPlanningContextUpstreamLocked;
}

/** Legacy lock state is primary; workspace lock is additive only. */
export function resolvePlanningContextLocked(input: {
  legacyLocked: boolean;
  workspace: TrainingPlanWorkspace | null;
}): boolean {
  return (
    input.legacyLocked ||
    (input.workspace !== null && workspacePlanningContextLocked(input.workspace))
  );
}

export function resolveEffectiveDownstreamPlanningContextLocked(input: {
  workspace: TrainingPlanWorkspace | null;
  noHeadCoachDirectReleaseLocked: boolean;
  upstreamContextLockedForDownstream: boolean;
}): boolean {
  if (input.workspace !== null && workspacePlanningContextLocked(input.workspace)) {
    return true;
  }
  return input.noHeadCoachDirectReleaseLocked || input.upstreamContextLockedForDownstream;
}

export function resolveLegacyAssistantCreateButtonDisabled(input: {
  generatePlanActionDisabled: boolean;
  localError: string | null;
}): boolean {
  return input.generatePlanActionDisabled || input.localError !== null;
}

export function workspaceShowsDomainSubmitReview(
  workspace: TrainingPlanWorkspace,
  domain: GenerationDomain | null,
): boolean {
  if (domain === null) return false;
  const entry = workspace.domains[domain];
  if (!entry.canOpen) return false;
  if (!workspaceDomainHasPersistedPlanIds(entry)) return false;
  if (!parseWorkspaceAllowedActions(entry).includes("SUBMIT_REVIEW")) {
    return false;
  }
  const workflowStatus = deriveWorkflowStatusFromWorkspaceDomain(entry);
  return (
    workflowStatus === "draft_generated" ||
    workflowStatus === "revision_requested"
  );
}

export function workspaceResolveReleaseMode(
  workspace: TrainingPlanWorkspace,
): TrainingPlanResolvedReleaseMode {
  if (workspace.assignmentContext !== undefined) {
    return workspace.assignmentContext.releaseMode === "DIRECT_DOMAIN_RELEASE"
      ? "direct_release"
      : "head_coach_review";
  }
  if (workspaceDirectReleaseAllowed(workspace)) {
    return "direct_release";
  }
  const domainModes = GENERATION_DOMAINS.map(
    (domain) => workspace.domains[domain].releaseMode,
  )
    .filter((mode): mode is string => typeof mode === "string" && mode.trim() !== "")
    .map(normalizeWorkspaceToken);
  if (domainModes.some((mode) => mode.includes("DIRECT"))) {
    return "direct_release";
  }
  return "head_coach_review";
}

export type WorkspaceDomainWorkflowStatus =
  | "not_created"
  | "draft_generated"
  | "submitted_for_review"
  | "revision_requested"
  | "approved"
  | "released";

export function deriveWorkflowStatusFromWorkspaceDomain(
  domain: TrainingPlanWorkspaceDomain,
): WorkspaceDomainWorkflowStatus {
  if (domain.submittedForReview) {
    return "submitted_for_review";
  }
  const actions = parseWorkspaceAllowedActions(domain);
  const normalizedStatus = domain.summary.status?.trim().toUpperCase() ?? "";
  if (normalizedStatus === "ACTIVE") return "released";
  if (normalizedStatus === "HEAD_COACH_APPROVED") return "approved";
  if (normalizedStatus === "REVISION_REQUESTED") return "revision_requested";
  if (
    normalizedStatus === "ASSISTANT_COACH_APPROVED" ||
    actions.includes("HEAD_APPROVE") ||
    actions.includes("REQUEST_REVISION")
  ) {
    return "submitted_for_review";
  }
  if (
    normalizedStatus === "AI_GENERATED" ||
    normalizedStatus === "DRAFT" ||
    (domain.summary.trainingPlanId?.trim() ?? "") !== ""
  ) {
    return "draft_generated";
  }
  return "not_created";
}
