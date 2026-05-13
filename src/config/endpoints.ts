/**
 * Canonical API origin and path segments for the CETECH backend.
 * Override with NEXT_PUBLIC_API_BASE_URL (no trailing slash).
 */

function readApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw.trim().replace(/\/+$/, "");
  }
  return "http://localhost:3000";
}

/** Resolved backend base URL (same for server and client bundles where env is inlined). */
export const API_BASE = readApiBaseUrl();

/** Join base + path (path must start with `/`). */
export function apiUrl(path: string): string {
  if (!path.startsWith("/")) {
    return `${API_BASE}/${path}`;
  }
  return `${API_BASE}${path}`;
}

/** Path constants - use with apiRequest first argument. */
export const paths = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    register: "/auth/register",
    me: "/auth/me",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },
  profile: {
    me: "/profile/me",
  },
  onboarding: {
    status: "/onboarding/status",
    role: "/onboarding/role",
    athleteProfile: "/onboarding/athlete-profile",
    coachProfile: "/onboarding/coach-profile",
    academySetup: "/onboarding/academy-setup",
  },
  entities: {
    root: "/entities",
    invite: (entityId: string) =>
      `/entities/${encodeURIComponent(entityId)}/invite`,
    myInvitations: "/entities/invitations/me",
    acceptInvitation: (invitationId: string) =>
      `/entities/invitations/${encodeURIComponent(invitationId)}/accept`,
    declineInvitation: (invitationId: string) =>
      `/entities/invitations/${encodeURIComponent(invitationId)}/decline`,
    revokeInvitation: (invitationId: string) =>
      `/entities/invitations/${encodeURIComponent(invitationId)}/revoke`,
    invitations: (entityId: string) =>
      `/entities/${encodeURIComponent(entityId)}/invitations`,
    members: (entityId: string) =>
      `/entities/${encodeURIComponent(entityId)}/members`,
    assignmentCandidates: (entityId: string) =>
      `/entities/${encodeURIComponent(entityId)}/assignment-candidates`,
    /** POST — deactivate membership in entity (does not delete the user account). */
    deactivateMember: (entityId: string, targetUserId: string) =>
      `/entities/${encodeURIComponent(entityId)}/members/${encodeURIComponent(targetUserId)}/deactivate`,
    assignments: (entityId: string) =>
      `/entities/${encodeURIComponent(entityId)}/assignments`,
    assignmentsAthleteCoach: (entityId: string) =>
      `/entities/${encodeURIComponent(entityId)}/assignments/athlete-coach`,
    unassignAthleteCoach: (
      entityId: string,
      athleteId: string,
      coachId: string,
    ) =>
      `/entities/${encodeURIComponent(entityId)}/assignments/athlete-coach/${encodeURIComponent(athleteId)}/${encodeURIComponent(coachId)}`,
    athletePlanningProfileMe: (entityId: string) =>
      `/entities/${encodeURIComponent(entityId)}/athlete-planning-profile/me`,
    athletePlanningProfileReadiness: (entityId: string) =>
      `/entities/${encodeURIComponent(entityId)}/athlete-planning-profile/me/readiness`,
    athletePlanningProfileConfirm: (entityId: string) =>
      `/entities/${encodeURIComponent(entityId)}/athlete-planning-profile/me/confirm`,
    athletePlanningProfileByAthlete: (entityId: string, athleteId: string) =>
      `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/planning-profile`,
    /** GET/POST — training plan level validation (coach review). */
    athleteTrainingPlanLevelValidation: (entityId: string, athleteId: string) =>
      `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/training-plan-generation/level-validation`,
    athleteTrainingPlanReadiness: (
      entityId: string,
      athleteId: string,
      query?: {
        generationDomain?: string;
        seasonCycleId?: string | null;
        sportCode?: string | null;
      },
    ) => {
      const base =
        `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/training-plan-generation/readiness`;
      const params = new URLSearchParams();
      if (query?.generationDomain) {
        params.set("generationDomain", query.generationDomain);
      }
      if (query?.seasonCycleId) {
        params.set("seasonCycleId", query.seasonCycleId);
      }
      const sportCode = query?.sportCode?.trim() ?? "";
      if (sportCode !== "") {
        params.set("sportCode", sportCode);
      }
      const text = params.toString();
      return text ? `${base}?${text}` : base;
    },
    athleteTrainingPlanWorkloadAssessment: (entityId: string, athleteId: string) =>
      `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/training-plan-generation/workload-assessment`,
    athleteTrainingPlanWorkloadAssessmentLatest: (
      entityId: string,
      athleteId: string,
    ) =>
      `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/training-plan-generation/workload-assessment/latest`,
    athleteTrainingPlanUpstreamPlanningContext: (
      entityId: string,
      athleteId: string,
    ) =>
      `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/training-plan-generation/upstream-planning-context`,
    athleteTrainingPlanPlanningContextLock: (
      entityId: string,
      athleteId: string,
    ) =>
      `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/training-plan-generation/planning-context/lock`,
    athleteTrainingPlanCompleteness: (
      entityId: string,
      athleteId: string,
      query?: { sportCode?: string | null },
    ) => {
      const base =
        `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/training-plan-generation/completeness`;
      const sportCode = query?.sportCode?.trim() ?? "";
      if (sportCode === "") return base;
      const params = new URLSearchParams();
      params.set("sportCode", sportCode);
      return `${base}?${params.toString()}`;
    },
    athleteTrainingPlanExecute: (entityId: string, athleteId: string) =>
      `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/training-plan-generation/execute`,
    athleteTrainingPlanPersistDraft: (entityId: string, athleteId: string) =>
      `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/training-plan-generation/persist-draft`,
    athleteTrainingPlanLatestDomainDraft: (
      entityId: string,
      athleteId: string,
      generationDomain: string,
    ) =>
      `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/training-plan-generation/domain-drafts/latest?generationDomain=${encodeURIComponent(generationDomain)}`,
    athleteTrainingPlanSubmitReview: (
      entityId: string,
      athleteId: string,
      planId: string,
      versionId: string,
    ) =>
      `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/training-plans/${encodeURIComponent(planId)}/versions/${encodeURIComponent(versionId)}/submit-review`,
    athleteTrainingPlanHeadApprove: (
      entityId: string,
      athleteId: string,
      planId: string,
      versionId: string,
    ) =>
      `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/training-plans/${encodeURIComponent(planId)}/versions/${encodeURIComponent(versionId)}/head-approve`,
    athleteTrainingPlanRequestRevision: (
      entityId: string,
      athleteId: string,
      planId: string,
      versionId: string,
    ) =>
      `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/training-plans/${encodeURIComponent(planId)}/versions/${encodeURIComponent(versionId)}/request-revision`,
    athleteTrainingPlanRelease: (
      entityId: string,
      athleteId: string,
      planId: string,
      versionId: string,
    ) =>
      `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/training-plans/${encodeURIComponent(planId)}/versions/${encodeURIComponent(versionId)}/release`,
    athleteTrainingPlanSkillsRevise: (entityId: string, athleteId: string) =>
      `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/training-plan-generation/skills/revise`,
    athleteTrainingPlanNutritionRevise: (entityId: string, athleteId: string) =>
      `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/training-plan-generation/nutrition/revise`,
    athleteTrainingPlanSandcRevise: (entityId: string, athleteId: string) =>
      `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/training-plan-generation/sandc/revise`,
    athleteWeeklyPlanJournal: (entityId: string, athleteId: string) =>
      `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/weekly-plan-journal`,
    athleteTodayPlan: (entityId: string, athleteId: string) =>
      `/entities/${encodeURIComponent(entityId)}/athletes/${encodeURIComponent(athleteId)}/today-plan`,
  },
  academies: {
    root: "/academies",
    me: "/academies/me",
    meCoaches: "/academies/me/coaches",
    meCoachFunctions: "/academies/me/coach-functions",
    meAthletes: "/academies/me/athletes",
    meCoach: (coachUserId: string) =>
      `/academies/me/coaches/${encodeURIComponent(coachUserId)}`,
    athletes: (academyId: string) =>
      `/academies/${encodeURIComponent(academyId)}/athletes`,
    coaches: (academyId: string) =>
      `/academies/${encodeURIComponent(academyId)}/coaches`,
  },
  nutrition: {
    usdaSearch: (q: string) =>
      `/nutrition/usda/search?q=${encodeURIComponent(q.trim())}`,
  },
  nutritionCatalog: {
    root: "/nutrition-catalog",
    byId: (id: string) => `/nutrition-catalog/${encodeURIComponent(id)}`,
    bySource: (sourceSystem: string, sourceFoodCode: string) =>
      `/nutrition-catalog/source/${encodeURIComponent(sourceSystem)}/${encodeURIComponent(sourceFoodCode)}`,
  },
  exerciseCatalog: {
    root: "/exercise-catalog",
    byId: (id: string) => `/exercise-catalog/${encodeURIComponent(id)}`,
    bySource: (sourceSystem: string, sourceExternalId: string) =>
      `/exercise-catalog/source/${encodeURIComponent(sourceSystem)}/${encodeURIComponent(sourceExternalId)}`,
  },
  rag: {
    appAnswer: "/rag/app/answer",
  },
  me: {
    /** GET — bootstrap app context (`user`, `academy`, `access`, …). Replaces legacy `/app/access-context`. */
    appContext: "/me/app-context",
  },
  /** Coach module — Slice 1 dashboard APIs. */
  coach: {
    meDashboard: "/coach/me/dashboard",
    assignedAthletes: "/coach/me/assigned-athletes",
  },
  trainingPlans: {
    byId: (planId: string) => `/training-plans/${encodeURIComponent(planId)}`,
  },
  trainingPlanManagement: {
    versions: (planId: string) =>
      `/training-plan-management/${encodeURIComponent(planId)}/versions`,
    activeDetail: (planId: string, generationDomain?: string) => {
      const base = `/training-plan-management/${encodeURIComponent(planId)}/active/detail`;
      const domain = generationDomain?.trim() ?? "";
      if (domain === "") return base;
      return `${base}?generationDomain=${encodeURIComponent(domain)}`;
    },
  },
  athletes: {
    me: "/athletes/me",
  },
  seasonCycles: {
    root: "/season-cycles",
    byEntity: (entityId: string) =>
      `/season-cycles/entity/${encodeURIComponent(entityId)}`,
    byId: (seasonCycleId: string) =>
      `/season-cycles/${encodeURIComponent(seasonCycleId)}`,
    phase: "/season-cycles/phase",
    phaseById: (phaseId: string) =>
      `/season-cycles/phases/${encodeURIComponent(phaseId)}`,
    phases: (seasonCycleId: string) =>
      `/season-cycles/${encodeURIComponent(seasonCycleId)}/phases`,
  },
  goals: {
    root: "/goals",
    byAthlete: (athleteId: string) =>
      `/goals/athlete/${encodeURIComponent(athleteId)}`,
    byId: (goalId: string) => `/goals/${encodeURIComponent(goalId)}`,
    patchStatus: (goalId: string) =>
      `/goals/${encodeURIComponent(goalId)}/status`,
  },
} as const;
