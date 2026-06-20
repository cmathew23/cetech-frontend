import type { GenerationDomain } from "@/lib/coachAuthority";

export type TrainingPlanWorkspaceSummary = {
  trainingPlanId: string | null;
  versionId: string | null;
  generationDomain: GenerationDomain;
  status: string | null;
  versionNumber: number | null;
  latestVersionId?: string | null;
  approvedVersionId?: string | null;
  activeVersionId?: string | null;
};

export type TrainingPlanWorkspacePlanningContext = {
  locked: boolean;
  resolved: boolean;
  lockId: string | null;
  snapshotId: string | null;
};

export type TrainingPlanWorkspaceOwnershipFlags = {
  hasHeadCoach: boolean;
  requesterIsHeadCoach: boolean;
  requesterHasSkillsFunction: boolean;
  requesterOwnsCurrentDomain: boolean;
  requesterOwnsSkillsForThisAthlete?: boolean;
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
};
