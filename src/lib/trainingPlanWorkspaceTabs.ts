import type { GenerationDomain } from "@/lib/coachAuthority";
import type { TrainingPlanWorkspace } from "@/types/trainingPlanWorkspace";

const GENERATION_DOMAINS: GenerationDomain[] = ["SKILLS", "NUTRITION", "S_AND_C"];

export type TrainingPlanWorkspaceTabId =
  | "APP_READINESS"
  | "GOALS"
  | "PLANNING_CONTEXT"
  | "GENERATE_PLAN"
  | "REVIEW_REVISE"
  | "RELEASE";

export type TrainingPlanWorkspaceTabPrimaryAction =
  | "REVIEW_APP_READINESS"
  | "MANAGE_GOALS"
  | "VIEW_GOALS"
  | "CREATE_PLANNING_CONTEXT"
  | "LOCK_PLANNING_CONTEXT"
  | "MANAGE_PLANNING_CONTEXT"
  | "VIEW_PLANNING_CONTEXT"
  | "GENERATE_OWN_DOMAIN_PLAN"
  | "VIEW_GENERATION_STATUS"
  | "REVIEW_DOMAIN_PLANS"
  | "REVISE_OR_SUBMIT_OWN_DOMAIN_PLAN"
  | "VIEW_REVIEW_STATUS"
  | "RELEASE_TO_ATHLETE"
  | "VIEW_RELEASE_STATUS"
  | "LEGACY_FALLBACK_UNAVAILABLE";

export type TrainingPlanWorkspaceTabEmptyState =
  | "NONE"
  | "ASSIGNMENT_CONTEXT_MISSING"
  | "READINESS_NOT_COMPLETE"
  | "NO_GOALS_SELECTED"
  | "PLANNING_CONTEXT_NOT_CREATED"
  | "PLANNING_CONTEXT_NOT_LOCKED"
  | "NO_OWNED_GENERATION_DOMAIN"
  | "NO_OWNED_DOMAIN_PLAN"
  | "NO_REVIEW_OR_REVISE_DOMAIN"
  | "NO_REVIEW_DOMAIN_PLAN"
  | "NO_RELEASABLE_DOMAIN"
  | "NO_RELEASE_PLAN";

export type TrainingPlanWorkspaceTabSource =
  | "WORKSPACE_READINESS"
  | "ASSIGNMENT_CONTEXT_MISSING"
  | "ASSIGNMENT_PLANNING_CONTEXT"
  | "ASSIGNMENT_DOMAIN_GENERATE"
  | "ASSIGNMENT_DOMAIN_REVIEW_REVISE"
  | "ASSIGNMENT_DOMAIN_RELEASE";

export type TrainingPlanWorkspaceTabState = {
  visible: boolean;
  enabled: boolean;
  readOnly: boolean;
  primaryAction: TrainingPlanWorkspaceTabPrimaryAction;
  emptyState: TrainingPlanWorkspaceTabEmptyState;
  source: TrainingPlanWorkspaceTabSource;
};

export type TrainingPlanWorkspaceTabStates = Record<
  TrainingPlanWorkspaceTabId,
  TrainingPlanWorkspaceTabState
>;

export type TrainingPlanWorkspaceTabDomainMetadata = {
  generateDomains: GenerationDomain[];
  reviewDomains: GenerationDomain[];
  reviseDomains: GenerationDomain[];
  releaseReadyDomains: GenerationDomain[];
  ownedDomains: GenerationDomain[];
};

export type TrainingPlanWorkspaceTabModel = {
  tabs: TrainingPlanWorkspaceTabStates;
  domains: TrainingPlanWorkspaceTabDomainMetadata;
};

function hasPlanSummary(workspace: TrainingPlanWorkspace, domain: GenerationDomain): boolean {
  const summary = workspace.domains[domain].summary;
  return (
    (summary.trainingPlanId?.trim() ?? "") !== "" &&
    (summary.versionId?.trim() ?? "") !== ""
  );
}

function allReadOnlyFallback(): TrainingPlanWorkspaceTabStates {
  const fallback = (
    primaryAction: TrainingPlanWorkspaceTabPrimaryAction,
  ): TrainingPlanWorkspaceTabState => ({
    visible: true,
    enabled: false,
    readOnly: true,
    primaryAction,
    emptyState: "ASSIGNMENT_CONTEXT_MISSING",
    source: "ASSIGNMENT_CONTEXT_MISSING",
  });

  return {
    APP_READINESS: fallback("REVIEW_APP_READINESS"),
    GOALS: fallback("VIEW_GOALS"),
    PLANNING_CONTEXT: fallback("VIEW_PLANNING_CONTEXT"),
    GENERATE_PLAN: fallback("VIEW_GENERATION_STATUS"),
    REVIEW_REVISE: fallback("VIEW_REVIEW_STATUS"),
    RELEASE: fallback("VIEW_RELEASE_STATUS"),
  };
}

function emptyDomainMetadata(): TrainingPlanWorkspaceTabDomainMetadata {
  return {
    generateDomains: [],
    reviewDomains: [],
    reviseDomains: [],
    releaseReadyDomains: [],
    ownedDomains: [],
  };
}

export function deriveTrainingPlanWorkspaceTabStates(
  workspace: TrainingPlanWorkspace,
): TrainingPlanWorkspaceTabModel {
  const assignmentContext = workspace.assignmentContext;
  if (assignmentContext === undefined) {
    return {
      tabs: allReadOnlyFallback(),
      domains: emptyDomainMetadata(),
    };
  }

  const planningContext = assignmentContext.planningContext;
  const planningContextCanEdit =
    planningContext.canCreate || planningContext.canLock || planningContext.canManage;
  const generateDomains = GENERATION_DOMAINS.filter((domain) => {
    const domainContext = assignmentContext.domains[domain];
    return domainContext.ownedByCurrentUser && domainContext.canGenerate;
  });
  const reviseDomains = GENERATION_DOMAINS.filter((domain) => {
    const domainContext = assignmentContext.domains[domain];
    return (
      domainContext.ownedByCurrentUser &&
      (domainContext.canRevise || domainContext.canSubmitForReview)
    );
  });
  const headCoachOwnsSkills =
    assignmentContext.domains.SKILLS.ownerType === "HEAD_COACH_SELF" &&
    assignmentContext.domains.SKILLS.ownedByCurrentUser;
  const reviewDomains = GENERATION_DOMAINS.filter((domain) => {
    if (domain === "SKILLS" && headCoachOwnsSkills) return false;
    return assignmentContext.domains[domain].canApprove;
  });
  const releaseReadyDomains = GENERATION_DOMAINS.filter((domain) => {
    const domainContext = assignmentContext.domains[domain];
    return (
      domainContext.canRelease &&
      assignmentContext.releaseMode === domainContext.releaseMode &&
      hasPlanSummary(workspace, domain)
    );
  });
  const ownedDomains = GENERATION_DOMAINS.filter((domain) => {
    const domainContext = assignmentContext.domains[domain];
    return domainContext.ownedByCurrentUser && domainContext.ownerType !== "NONE";
  });
  const ownedGeneratePlanExists = generateDomains.some((domain) =>
    hasPlanSummary(workspace, domain),
  );
  const reviewPlanExists = [...reviewDomains, ...reviseDomains].some(
    (domain) => hasPlanSummary(workspace, domain),
  );

  return {
    tabs: {
    APP_READINESS: {
      visible: true,
      enabled: false,
      readOnly: true,
      primaryAction: "REVIEW_APP_READINESS",
      emptyState: "READINESS_NOT_COMPLETE",
      source: "WORKSPACE_READINESS",
    },
    GOALS: {
      visible: true,
      enabled: planningContext.canManage,
      readOnly: !planningContext.canManage,
      primaryAction: planningContext.canManage ? "MANAGE_GOALS" : "VIEW_GOALS",
      emptyState:
        (workspace.planningContext.goalIds?.length ?? 0) > 0 ||
        (workspace.planningContext.lockedGoalIds?.length ?? 0) > 0
          ? "NONE"
          : "NO_GOALS_SELECTED",
      source: "ASSIGNMENT_PLANNING_CONTEXT",
    },
    PLANNING_CONTEXT: {
      visible: true,
      enabled: planningContextCanEdit,
      readOnly: !planningContextCanEdit,
      primaryAction: planningContext.canManage
        ? "MANAGE_PLANNING_CONTEXT"
        : planningContext.canLock && !workspace.planningContext.locked
          ? "LOCK_PLANNING_CONTEXT"
          : planningContext.canCreate && !workspace.planningContext.resolved
            ? "CREATE_PLANNING_CONTEXT"
            : "VIEW_PLANNING_CONTEXT",
      emptyState: !workspace.planningContext.resolved
        ? "PLANNING_CONTEXT_NOT_CREATED"
        : !workspace.planningContext.locked
          ? "PLANNING_CONTEXT_NOT_LOCKED"
          : "NONE",
      source: "ASSIGNMENT_PLANNING_CONTEXT",
    },
    GENERATE_PLAN: {
      visible: true,
      enabled: generateDomains.length > 0,
      readOnly: generateDomains.length === 0,
      primaryAction:
        generateDomains.length > 0
          ? "GENERATE_OWN_DOMAIN_PLAN"
          : "VIEW_GENERATION_STATUS",
      emptyState:
        generateDomains.length === 0
          ? "NO_OWNED_GENERATION_DOMAIN"
          : ownedGeneratePlanExists
            ? "NONE"
            : "NO_OWNED_DOMAIN_PLAN",
      source: "ASSIGNMENT_DOMAIN_GENERATE",
    },
    REVIEW_REVISE: {
      visible: true,
      enabled: reviewDomains.length > 0 || reviseDomains.length > 0,
      readOnly: reviewDomains.length === 0 && reviseDomains.length === 0,
      primaryAction:
        reviewDomains.length > 0
          ? "REVIEW_DOMAIN_PLANS"
          : reviseDomains.length > 0
            ? "REVISE_OR_SUBMIT_OWN_DOMAIN_PLAN"
            : "VIEW_REVIEW_STATUS",
      emptyState:
        reviewDomains.length === 0 && reviseDomains.length === 0
          ? "NO_REVIEW_OR_REVISE_DOMAIN"
          : reviewPlanExists
            ? "NONE"
            : "NO_REVIEW_DOMAIN_PLAN",
      source: "ASSIGNMENT_DOMAIN_REVIEW_REVISE",
    },
    RELEASE: {
      visible: true,
      enabled: releaseReadyDomains.length > 0,
      readOnly: releaseReadyDomains.length === 0,
      primaryAction:
        releaseReadyDomains.length > 0 ? "RELEASE_TO_ATHLETE" : "VIEW_RELEASE_STATUS",
      emptyState:
        releaseReadyDomains.length > 0
          ? "NONE"
          : GENERATION_DOMAINS.some((domain) => assignmentContext.domains[domain].canRelease)
          ? "NO_RELEASE_PLAN"
          : "NO_RELEASABLE_DOMAIN",
      source: "ASSIGNMENT_DOMAIN_RELEASE",
    },
    },
    domains: {
      generateDomains,
      reviewDomains,
      reviseDomains,
      releaseReadyDomains,
      ownedDomains,
    },
  };
}
