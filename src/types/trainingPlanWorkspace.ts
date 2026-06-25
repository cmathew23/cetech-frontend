import type { GenerationDomain } from "@/lib/coachAuthority";

export type TrainingPlanWorkspaceSummary = {
  trainingPlanId: string | null;
  versionId: string | null;
  generationDomain: GenerationDomain;
  status: string | null;
  versionNumber: number | null;
  selectedVersionId?: string | null;
  latestVersionId?: string | null;
  approvedVersionId?: string | null;
  activeVersionId?: string | null;
};

export type TrainingPlanWorkspacePlanningContext = {
  locked: boolean;
  resolved: boolean;
  lockId: string | null;
  snapshotId: string | null;
  seasonCycleId?: string | null;
  selectedSeasonCycleId?: string | null;
  seasonId?: string | null;
  selectedSeasonId?: string | null;
  phase?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  planStartDate?: string | null;
  planEndDate?: string | null;
  durationDays?: number | null;
  goalIds?: string[];
  lockedGoalIds?: string[];
  selectedGoalsSnapshot?: unknown;
  athletePlanningContextSnapshot?: unknown;
};

export type TrainingPlanWorkspaceOwnershipFlags = {
  hasHeadCoach: boolean;
  requesterIsHeadCoach: boolean;
  requesterHasSkillsFunction: boolean;
  requesterOwnsCurrentDomain: boolean;
  requesterOwnsSkillsForThisAthlete?: boolean;
  requesterOwnsNutritionForThisAthlete?: boolean;
  requesterOwnsStrengthForThisAthlete?: boolean;
  headCoachOwnsPlanningContext: boolean;
  directReleaseAllowed: boolean;
};

export type TrainingPlanWorkspaceDomain = {
  summary: TrainingPlanWorkspaceSummary;
  reviewAccess: string | null;
  releaseMode: string | null;
  submittedForReview: boolean;
  canOpen: boolean;
  allowedActions: string[];
};

export type TrainingPlanWorkspaceAssignmentReleaseMode =
  | "HEAD_COACH_APPROVAL"
  | "DIRECT_DOMAIN_RELEASE";

export type TrainingPlanWorkspacePlanningContextOwnerType =
  | "HEAD_COACH"
  | "SKILLS_FALLBACK"
  | "NONE";

export type TrainingPlanWorkspaceAssignmentDomainOwnerType =
  | "ASSIGNED_DOMAIN_COACH"
  | "HEAD_COACH_SELF"
  | "NONE";

export type TrainingPlanWorkspaceAssignmentPlanningContext = {
  ownerType: TrainingPlanWorkspacePlanningContextOwnerType;
  ownerUserId?: string | null;
  ownerCoachProfileId?: string | null;
  canRead: boolean;
  canCreate: boolean;
  canLock: boolean;
  canManage: boolean;
  blockers?: string[];
};

export type TrainingPlanWorkspaceAssignmentDomainContext = {
  ownerType: TrainingPlanWorkspaceAssignmentDomainOwnerType;
  ownerUserId?: string | null;
  ownerCoachProfileId?: string | null;
  ownedByCurrentUser: boolean;
  canOpen: boolean;
  canGenerate: boolean;
  canRevise: boolean;
  canSubmitForReview: boolean;
  canApprove: boolean;
  canRequestRevision?: boolean;
  canRelease: boolean;
  releaseMode: TrainingPlanWorkspaceAssignmentReleaseMode;
  blockers?: string[];
};

export type TrainingPlanWorkspaceAssignmentContext = {
  hasHeadCoach: boolean;
  releaseMode: TrainingPlanWorkspaceAssignmentReleaseMode;
  planningContext: TrainingPlanWorkspaceAssignmentPlanningContext;
  domains: {
    SKILLS: TrainingPlanWorkspaceAssignmentDomainContext;
    NUTRITION: TrainingPlanWorkspaceAssignmentDomainContext;
    S_AND_C: TrainingPlanWorkspaceAssignmentDomainContext;
  };
};

export type TrainingPlanWorkspace = {
  entityId: string;
  athleteId: string;
  workflowShape: string;
  shell: string;
  workflowMode: string;
  currentDomain: string | null;
  initialTab: string | null;
  planningContext: TrainingPlanWorkspacePlanningContext;
  ownershipFlags: TrainingPlanWorkspaceOwnershipFlags;
  blockers: string[];
  domains: {
    SKILLS: TrainingPlanWorkspaceDomain;
    NUTRITION: TrainingPlanWorkspaceDomain;
    S_AND_C: TrainingPlanWorkspaceDomain;
  };
  assignmentContext?: TrainingPlanWorkspaceAssignmentContext;
};
