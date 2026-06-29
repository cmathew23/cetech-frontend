import { describe, expect, it } from "vitest";

import {
  buildCoachWorkflowResetScopeKey,
  deriveHeadCoachDomainWorkflowStatus,
  deriveAssistantDomainWorkflowStatus,
  resolveNoHeadCoachDirectReleaseLockedPlanningContext,
  resolveInitialTrainingPlanWorkflowTab,
  resolveSkillsOwnedDirectReleaseCurrentStep,
  renderGenerationJobButtonLabel,
  resolveStep6GenerationLifecyclePhase,
  resolveTrainingPlanShellOwnership,
  resolveTrainingPlanPageBootstrapModel,
  resolveTrainingPlanWorkflowMode,
  resolveWorkspaceDomainViewPlanContext,
  shouldRenderPersistedDetailForDomain,
  shouldRenderWorkspaceDomainPlanContent,
  shouldShowGeneratedPlanSyncingNotice,
  workflow2AHeadCoachStep6Intro,
  resolveAssistantDomainSubmitActionVisible,
  resolveSubmitReviewPlanVersionIds,
  resolveHeadCoachReviewSummarySource,
  shouldShowHeadCoachReviewEmptyState,
  canShowHeadCoachReviewReleaseAction,
  readLockedWorkspaceGoalIds,
  readWorkspaceSnapshotGoalCount,
  domainDraftLoadErrorMessage,
  errorForRenderedDomain,
  canShowDomainReviseAction,
  resolveDomainRevisePlanIds,
  resolveWorkflowResetScopeMode,
  headCoachSubmittedReviewDomains,
  shouldBlockWorkflowRenderForWorkspace,
  canGenerateFromLockedPlanningContextForDomain,
  isGenerationJobInProgress,
  resolveGeneratePlanLocalError,
  resolveWorkflow2SubmittedDomainSkillsSlotProjection,
  shouldClearWorkflow2SkillsSubmitSlotError,
  shouldShowDomainButtonProgress,
  shouldShowGeneratedDraftEmptyState,
  shouldSkipPersistedVersionsFetchWhenSummaryStatusPresent,
  shouldShowStep6PreGenerationReadiness,
  shouldUseSpecialistTrainingPlanWorkspace,
  resolveWorkspaceTrainingPlanShellOwnership,
  resolveHeadCoachOwnedSkillsGrouping,
  resolveHeadCoachSubmittedReviewCardDomains,
  resolveReviewReviseStepLabelFromWorkspace,
  workflow2SkillsSubmitReviewReconciled,
  resolvePlanningContextAuthority,
  resolveDomainGeneratePermission,
  resolveDomainViewPlanVisible,
  resolveDomainRevisePlanVisible,
  resolveDomainSubmitForReviewVisible,
  resolveDomainHeadCoachReviewActionVisible,
  resolveDirectReleaseSkillsOwnerApproveVisible,
  resolveDomainReleaseVisible,
  assistantWorkflowStatusLabelForKind,
  domainIntegrationAvailableActionLabels,
  domainIntegrationNextActionLabel,
  resolveDomainReviseAvailability,
  resolveTrainingPlanWorkspaceDomainIntegrationComplete,
  resolveTrainingPlanWorkspaceLifecycleSteps,
  resolveContextAppStepCompleteForNavigation,
  resolveSetupStateAfterSeasonCreate,
  formatSeasonOptionLabel,
  resolveCompetitionSeasonPhaseForDate,
  resolveWorkflowReviewResetScopeDomain,
  resolveHeadCoachReviewActiveDetailAfterRefresh,
  resolveHeadCoachReviewActionContext,
  shouldShowSubmittedPlanLoading,
  shouldUseWorkflow1HeadCoachReviewActionPanel,
  isHeadCoachSkillsOwnerWorkflow,
  resolveWorkflowActionContext,
} from "@/components/dashboard/coach/CoachAthletePlanningProfileView";
import {
  resolveLegacyAssistantCreateButtonDisabled,
  resolveLegacyPlanningContextLocked,
  resolvePlanningContextLocked,
  parseWorkspaceInitialTab,
  resolveWorkflowModeFromWorkspace,
  deriveWorkflowStatusFromWorkspaceDomain,
  workspaceHeadCoachCanCreateSkillsPlan,
  workspaceHeadCoachOwnsSkillsForAthlete,
  workspaceShowsDomainSubmitReview,
} from "@/lib/trainingPlanWorkspaceView";
import {
  LOCKED_CONTEXT_MISSING_GENERATION_DETAILS_MESSAGE,
  resolveWorkflow1SpecialistCreateDisabled,
  shouldUseLockedDownstreamGenerationContext,
  shouldUseWorkflow1SpecialistCreateGate,
} from "@/lib/coachTrainingPlanActions";
import type { TrainingPlanWorkspace } from "@/types/trainingPlanWorkspace";

describe("buildCoachWorkflowResetScopeKey", () => {
  it("changes when the authenticated coach user changes", () => {
    const first = buildCoachWorkflowResetScopeKey({
      athleteId: "athlete-1",
      entityId: "entity-1",
      coachUserId: "coach-a",
      activeRole: "HEAD_COACH",
      domain: "SKILLS",
      workflowMode: "head_coach_review",
    });
    const second = buildCoachWorkflowResetScopeKey({
      athleteId: "athlete-1",
      entityId: "entity-1",
      coachUserId: "coach-b",
      activeRole: "HEAD_COACH",
      domain: "SKILLS",
      workflowMode: "head_coach_review",
    });

    expect(first).not.toBe(second);
  });

  it("changes when the active coach role changes", () => {
    const headCoach = buildCoachWorkflowResetScopeKey({
      athleteId: "athlete-1",
      entityId: "entity-1",
      coachUserId: "coach-1",
      activeRole: "HEAD_COACH",
      domain: "SKILLS",
      workflowMode: "head_coach_function_aware",
    });
    const sandcCoach = buildCoachWorkflowResetScopeKey({
      athleteId: "athlete-1",
      entityId: "entity-1",
      coachUserId: "coach-1",
      activeRole: "COACH",
      domain: "S_AND_C",
      workflowMode: "specialist_domain",
    });

    expect(headCoach).not.toBe(sandcCoach);
  });

  it("changes when the resolved training plan domain changes", () => {
    const skills = buildCoachWorkflowResetScopeKey({
      athleteId: "athlete-1",
      entityId: "entity-1",
      coachUserId: "coach-1",
      activeRole: "COACH",
      domain: "SKILLS",
      workflowMode: "specialist_domain",
    });
    const nutrition = buildCoachWorkflowResetScopeKey({
      athleteId: "athlete-1",
      entityId: "entity-1",
      coachUserId: "coach-1",
      activeRole: "COACH",
      domain: "NUTRITION",
      workflowMode: "specialist_domain",
    });

    expect(skills).not.toBe(nutrition);
  });

  it("changes when assignment-derived workflow mode changes", () => {
    const generation = buildCoachWorkflowResetScopeKey({
      athleteId: "athlete-1",
      entityId: "entity-1",
      coachUserId: "coach-1",
      activeRole: "HEAD_COACH",
      domain: null,
      workflowMode: "head_coach_planning",
    });
    const review = buildCoachWorkflowResetScopeKey({
      athleteId: "athlete-1",
      entityId: "entity-1",
      coachUserId: "coach-1",
      activeRole: "HEAD_COACH",
      domain: "SKILLS",
      workflowMode: "head_coach_review",
    });

    expect(generation).not.toBe(review);
  });
});

describe("Workflow 1 Head Coach review state", () => {
  it("uses a separate Workflow 1 Head Coach review action panel", () => {
    expect(
      shouldUseWorkflow1HeadCoachReviewActionPanel({
        shell: "head_coach_review",
        workflowShape: "HEAD_COACH_REVIEWER",
      }),
    ).toBe(true);
  });

  it("does not apply the Workflow 1 action panel to function-aware Head Coach or direct-release shells", () => {
    expect(
      shouldUseWorkflow1HeadCoachReviewActionPanel({
        shell: "head_coach_function_aware",
        workflowShape: "HEAD_COACH_REVIEWER",
      }),
    ).toBe(false);
    expect(
      shouldUseWorkflow1HeadCoachReviewActionPanel({
        shell: "skills_coach_planning",
        workflowShape: "DIRECT_DOMAIN_RELEASE",
      }),
    ).toBe(false);
  });

  it("keeps Workflow 1 Head Coach review reset scope independent of currentDomain churn", () => {
    for (const domain of ["SKILLS", "NUTRITION", "S_AND_C"] as const) {
      expect(
        resolveWorkflowReviewResetScopeDomain({
          shell: "head_coach_review",
          workflowShape: "HEAD_COACH_REVIEWER",
          currentCoachGenerationDomain: domain,
        }),
      ).toBeNull();
    }
  });

  it("preserves domain-scoped reset behavior for non-Workflow 1 shells", () => {
    expect(
      resolveWorkflowReviewResetScopeDomain({
        shell: "head_coach_function_aware",
        workflowShape: "HEAD_COACH_REVIEWER",
        currentCoachGenerationDomain: "SKILLS",
      }),
    ).toBe("SKILLS");
    expect(
      resolveWorkflowReviewResetScopeDomain({
        shell: "specialist_domain",
        workflowShape: "DOMAIN_OWNER",
        currentCoachGenerationDomain: "NUTRITION",
      }),
    ).toBe("NUTRITION");
  });

  it("keeps previously loaded review plan content visible during Workflow 1 approve/release refetch", () => {
    for (const domain of ["SKILLS", "NUTRITION", "S_AND_C"] as const) {
      const previousDetail = {
        plan: { id: `plan-${domain}` },
        version: { id: `version-${domain}` },
        days: [{ sessions: [{ id: `session-${domain}` }] }],
        allowedActions: ["HEAD_APPROVE"],
      } as never;

      expect(
        resolveHeadCoachReviewActiveDetailAfterRefresh({
          refreshedActiveDetail: null,
          previousActiveDetail: previousDetail,
          summaryPlanId: null,
          preservePreviousDetail: true,
        }),
      ).toBe(previousDetail);
    }
  });

  it("does not keep stale review detail outside the Workflow 1 preserve path unless plan ids match", () => {
    const previousDetail = {
      plan: { id: "plan-skills" },
      version: { id: "version-skills" },
      days: [],
      allowedActions: ["HEAD_APPROVE"],
    } as never;

    expect(
      resolveHeadCoachReviewActiveDetailAfterRefresh({
        refreshedActiveDetail: null,
        previousActiveDetail: previousDetail,
        summaryPlanId: "different-plan",
        preservePreviousDetail: false,
      }),
    ).toBeNull();
    expect(
      resolveHeadCoachReviewActiveDetailAfterRefresh({
        refreshedActiveDetail: null,
        previousActiveDetail: previousDetail,
        summaryPlanId: "plan-skills",
        preservePreviousDetail: false,
      }),
    ).toBe(previousDetail);
  });

  it("does not replace already loaded Workflow 1 review content with Loading submitted plan during refetch", () => {
    expect(
      shouldShowSubmittedPlanLoading({
        loading: true,
        hasActiveDetail: true,
        workflow1HeadCoachReviewActionPanelMode: true,
      }),
    ).toBe(false);
    expect(
      shouldShowSubmittedPlanLoading({
        loading: true,
        hasActiveDetail: false,
        workflow1HeadCoachReviewActionPanelMode: true,
      }),
    ).toBe(true);
    expect(
      shouldShowSubmittedPlanLoading({
        loading: true,
        hasActiveDetail: true,
        workflow1HeadCoachReviewActionPanelMode: false,
      }),
    ).toBe(true);
  });
});

describe("shouldUseSpecialistTrainingPlanWorkspace", () => {
  it("keeps Head Coach on the generic workflow shell", () => {
    expect(
      shouldUseSpecialistTrainingPlanWorkspace({
        isHeadCoachPlanningContextOwner: true,
        currentCoachGenerationDomain: "SKILLS",
      }),
    ).toBe(false);
  });

  it("routes Skills, Nutrition, and S&C coaches to specialist workspace", () => {
    for (const domain of ["SKILLS", "NUTRITION", "S_AND_C"] as const) {
      expect(
        shouldUseSpecialistTrainingPlanWorkspace({
          isHeadCoachPlanningContextOwner: false,
          currentCoachGenerationDomain: domain,
          isCoachSetupLoaded: true,
        }),
      ).toBe(true);
    }
  });

  it("keeps the generic shell blocked for non-Head-Coach setup while domain resolves", () => {
    expect(
      shouldUseSpecialistTrainingPlanWorkspace({
        isHeadCoachPlanningContextOwner: false,
        currentCoachGenerationDomain: null,
        isCoachSetupLoaded: true,
      }),
    ).toBe(true);
  });

  it("waits during setup instead of deciding before coach role is loaded", () => {
    expect(
      shouldUseSpecialistTrainingPlanWorkspace({
        isHeadCoachPlanningContextOwner: false,
        currentCoachGenerationDomain: null,
        isCoachSetupLoaded: false,
      }),
    ).toBe(false);
  });
});

describe("resolveWorkspaceTrainingPlanShellOwnership", () => {
  it("uses assignmentContext HEAD_COACH planning owner instead of legacy planning flags", () => {
    expect(
      resolveWorkspaceTrainingPlanShellOwnership(
        workflow1OwnedSkillsWorkspace({
          ownershipFlags: {
            hasHeadCoach: true,
            requesterIsHeadCoach: true,
            requesterHasSkillsFunction: false,
            requesterOwnsCurrentDomain: false,
            headCoachOwnsPlanningContext: false,
            directReleaseAllowed: false,
          },
          assignmentContext: shellAssignmentContext({
            hasHeadCoach: true,
            releaseMode: "HEAD_COACH_APPROVAL",
            planningContext: {
              ownerType: "HEAD_COACH",
              ownerUserId: "head-coach",
              ownerCoachProfileId: "head-coach-profile",
              canRead: true,
              canCreate: true,
              canLock: true,
              canManage: true,
            },
          }),
        }),
      ),
    ).toEqual({
      planningContextShellOwner: "head_coach",
      releaseMode: "head_coach_review",
    });
  });

  it("uses assignmentContext SKILLS_FALLBACK for Workflow 3 Skills planning shell", () => {
    expect(
      resolveWorkspaceTrainingPlanShellOwnership(
        workflow1OwnedSkillsWorkspace({
          currentDomain: "NUTRITION",
          ownershipFlags: {
            hasHeadCoach: true,
            requesterIsHeadCoach: false,
            requesterHasSkillsFunction: false,
            requesterOwnsCurrentDomain: false,
            headCoachOwnsPlanningContext: true,
            directReleaseAllowed: false,
          },
          assignmentContext: shellAssignmentContext({
            hasHeadCoach: false,
            releaseMode: "DIRECT_DOMAIN_RELEASE",
            planningContext: {
              ownerType: "SKILLS_FALLBACK",
              ownerUserId: "skills-coach",
              ownerCoachProfileId: "skills-profile",
              canRead: true,
              canCreate: true,
              canLock: true,
              canManage: true,
            },
            domains: {
              SKILLS: shellAssignmentDomain({
                ownerType: "ASSIGNED_DOMAIN_COACH",
                ownedByCurrentUser: true,
                releaseMode: "DIRECT_DOMAIN_RELEASE",
              }),
              NUTRITION: shellAssignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
              S_AND_C: shellAssignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
            },
          }),
        }),
      ),
    ).toEqual({
      planningContextShellOwner: "skills_coach",
      releaseMode: "direct_release",
    });
  });

  it("does not infer Workflow 3 Skills fallback from currentDomain when assignmentContext exists", () => {
    expect(
      resolveWorkspaceTrainingPlanShellOwnership(
        workflow1OwnedSkillsWorkspace({
          currentDomain: "SKILLS",
          ownershipFlags: {
            hasHeadCoach: false,
            requesterIsHeadCoach: false,
            requesterHasSkillsFunction: true,
            requesterOwnsCurrentDomain: true,
            headCoachOwnsPlanningContext: false,
            directReleaseAllowed: true,
          },
          assignmentContext: shellAssignmentContext({
            hasHeadCoach: false,
            releaseMode: "DIRECT_DOMAIN_RELEASE",
            planningContext: {
              ownerType: "NONE",
              ownerUserId: null,
              ownerCoachProfileId: null,
              canRead: true,
              canCreate: false,
              canLock: false,
              canManage: false,
            },
            domains: {
              SKILLS: shellAssignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
              NUTRITION: shellAssignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
              S_AND_C: shellAssignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
            },
          }),
        }),
      ),
    ).toEqual({
      planningContextShellOwner: "waiting_role",
      releaseMode: "direct_release",
    });
  });

  it("keeps legacy workspace shell ownership fallback when assignmentContext is missing", () => {
    expect(
      resolveWorkspaceTrainingPlanShellOwnership(
        workflow1OwnedSkillsWorkspace({
          currentDomain: "SKILLS",
          ownershipFlags: {
            hasHeadCoach: false,
            requesterIsHeadCoach: false,
            requesterHasSkillsFunction: true,
            requesterOwnsCurrentDomain: true,
            headCoachOwnsPlanningContext: false,
            directReleaseAllowed: true,
          },
        }),
      ),
    ).toEqual({
      planningContextShellOwner: "skills_coach",
      releaseMode: "direct_release",
    });
  });
});

describe("resolveHeadCoachOwnedSkillsGrouping", () => {
  it("treats Workflow 2A Skills as Head Coach-owned only for HEAD_COACH_SELF ownership", () => {
    expect(
      resolveHeadCoachOwnedSkillsGrouping({
        workspace: workflow2AHeadCoachOwnedSkillsWorkspace({
          assignmentContext: shellAssignmentContext({
            hasHeadCoach: true,
            releaseMode: "HEAD_COACH_APPROVAL",
            domains: {
              SKILLS: shellAssignmentDomain({
                ownerType: "HEAD_COACH_SELF",
                ownedByCurrentUser: true,
                canGenerate: true,
              }),
              NUTRITION: shellAssignmentDomain({
                ownerType: "ASSIGNED_DOMAIN_COACH",
              }),
              S_AND_C: shellAssignmentDomain({
                ownerType: "ASSIGNED_DOMAIN_COACH",
              }),
            },
          }),
        }),
        legacyHeadCoachOwnsSkills: false,
      }),
    ).toBe(true);
  });

  it("does not treat Workflow 2B assigned Skills coach ownership as Head Coach-owned", () => {
    expect(
      resolveHeadCoachOwnedSkillsGrouping({
        workspace: workflow2AHeadCoachOwnedSkillsWorkspace({
          assignmentContext: shellAssignmentContext({
            hasHeadCoach: true,
            releaseMode: "HEAD_COACH_APPROVAL",
            domains: {
              SKILLS: shellAssignmentDomain({
                ownerType: "ASSIGNED_DOMAIN_COACH",
                ownedByCurrentUser: false,
                canGenerate: false,
              }),
              NUTRITION: shellAssignmentDomain({
                ownerType: "ASSIGNED_DOMAIN_COACH",
              }),
              S_AND_C: shellAssignmentDomain({
                ownerType: "ASSIGNED_DOMAIN_COACH",
              }),
            },
          }),
        }),
        legacyHeadCoachOwnsSkills: true,
      }),
    ).toBe(false);
  });

  it("does not treat Workflow 1 assigned domain coach Skills as Head Coach-owned", () => {
    expect(
      resolveHeadCoachOwnedSkillsGrouping({
        workspace: workflow1OwnedSkillsWorkspace({
          assignmentContext: shellAssignmentContext({
            hasHeadCoach: true,
            releaseMode: "HEAD_COACH_APPROVAL",
            domains: {
              SKILLS: shellAssignmentDomain({
                ownerType: "ASSIGNED_DOMAIN_COACH",
                ownedByCurrentUser: false,
              }),
              NUTRITION: shellAssignmentDomain({
                ownerType: "ASSIGNED_DOMAIN_COACH",
              }),
              S_AND_C: shellAssignmentDomain({
                ownerType: "ASSIGNED_DOMAIN_COACH",
              }),
            },
          }),
        }),
        legacyHeadCoachOwnsSkills: true,
      }),
    ).toBe(false);
  });

  it("does not treat Workflow 3 direct-release Skills as Head Coach-owned", () => {
    expect(
      resolveHeadCoachOwnedSkillsGrouping({
        workspace: workflow1OwnedSkillsWorkspace({
          assignmentContext: shellAssignmentContext({
            hasHeadCoach: false,
            releaseMode: "DIRECT_DOMAIN_RELEASE",
            planningContext: {
              ownerType: "SKILLS_FALLBACK",
              ownerUserId: "skills-coach",
              ownerCoachProfileId: "skills-profile",
              canRead: true,
              canCreate: true,
              canLock: true,
              canManage: true,
            },
            domains: {
              SKILLS: shellAssignmentDomain({
                ownerType: "ASSIGNED_DOMAIN_COACH",
                ownedByCurrentUser: true,
                canGenerate: true,
                releaseMode: "DIRECT_DOMAIN_RELEASE",
              }),
              NUTRITION: shellAssignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
              S_AND_C: shellAssignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
            },
          }),
        }),
        legacyHeadCoachOwnsSkills: true,
      }),
    ).toBe(false);
  });

  it("preserves legacy fallback when assignmentContext is missing", () => {
    expect(
      resolveHeadCoachOwnedSkillsGrouping({
        workspace: workflow2AHeadCoachOwnedSkillsWorkspace(),
        legacyHeadCoachOwnsSkills: true,
      }),
    ).toBe(true);

    expect(
      resolveHeadCoachOwnedSkillsGrouping({
        workspace: workflow2AHeadCoachOwnedSkillsWorkspace(),
        legacyHeadCoachOwnsSkills: false,
      }),
    ).toBe(false);
  });
});

describe("headCoachSubmittedReviewDomains", () => {
  it("includes all Workflow 1 review domains when assignment allows Head Coach approval", () => {
    expect(
      headCoachSubmittedReviewDomains({
        shell: "head_coach_review",
        headCoachOwnsSkills: false,
        workspace: workflow1OwnedSkillsWorkspace({
          assignmentContext: shellAssignmentContext({
            hasHeadCoach: true,
            releaseMode: "HEAD_COACH_APPROVAL",
            domains: {
              SKILLS: shellAssignmentDomain({ canApprove: true }),
              NUTRITION: shellAssignmentDomain({ canApprove: true }),
              S_AND_C: shellAssignmentDomain({ canApprove: true }),
            },
          }),
        }),
      }),
    ).toEqual(["SKILLS", "NUTRITION", "S_AND_C"]);
  });

  it("excludes Workflow 2A Head Coach-owned Skills while keeping approvable Nutrition and S&C", () => {
    expect(
      headCoachSubmittedReviewDomains({
        shell: "head_coach_function_aware",
        headCoachOwnsSkills: true,
        workspace: workflow2AHeadCoachOwnedSkillsWorkspace({
          assignmentContext: shellAssignmentContext({
            hasHeadCoach: true,
            releaseMode: "HEAD_COACH_APPROVAL",
            domains: {
              SKILLS: shellAssignmentDomain({
                ownerType: "HEAD_COACH_SELF",
                ownedByCurrentUser: true,
                canApprove: false,
              }),
              NUTRITION: shellAssignmentDomain({ canApprove: true }),
              S_AND_C: shellAssignmentDomain({ canApprove: true }),
            },
          }),
        }),
      }),
    ).toEqual(["NUTRITION", "S_AND_C"]);
  });

  it("includes all Workflow 2B review domains when Skills is separately assigned and approvable", () => {
    expect(
      headCoachSubmittedReviewDomains({
        shell: "head_coach_review",
        headCoachOwnsSkills: false,
        workspace: workflow2AHeadCoachOwnedSkillsWorkspace({
          assignmentContext: shellAssignmentContext({
            hasHeadCoach: true,
            releaseMode: "HEAD_COACH_APPROVAL",
            domains: {
              SKILLS: shellAssignmentDomain({
                ownerType: "ASSIGNED_DOMAIN_COACH",
                ownedByCurrentUser: false,
                canApprove: true,
              }),
              NUTRITION: shellAssignmentDomain({ canApprove: true }),
              S_AND_C: shellAssignmentDomain({ canApprove: true }),
            },
          }),
        }),
      }),
    ).toEqual(["SKILLS", "NUTRITION", "S_AND_C"]);
  });

  it("does not infer Workflow 3 direct-release domains as Head Coach review domains", () => {
    expect(
      headCoachSubmittedReviewDomains({
        shell: "head_coach_review",
        headCoachOwnsSkills: false,
        workspace: workflow1OwnedSkillsWorkspace({
          assignmentContext: shellAssignmentContext({
            hasHeadCoach: false,
            releaseMode: "DIRECT_DOMAIN_RELEASE",
            planningContext: {
              ownerType: "SKILLS_FALLBACK",
              ownerUserId: "skills-coach",
              ownerCoachProfileId: "skills-profile",
              canRead: true,
              canCreate: true,
              canLock: true,
              canManage: true,
            },
            domains: {
              SKILLS: shellAssignmentDomain({
                ownerType: "ASSIGNED_DOMAIN_COACH",
                ownedByCurrentUser: true,
                canApprove: false,
                releaseMode: "DIRECT_DOMAIN_RELEASE",
              }),
              NUTRITION: shellAssignmentDomain({
                canApprove: false,
                releaseMode: "DIRECT_DOMAIN_RELEASE",
              }),
              S_AND_C: shellAssignmentDomain({
                canApprove: false,
                releaseMode: "DIRECT_DOMAIN_RELEASE",
              }),
            },
          }),
        }),
      }),
    ).toEqual([]);
  });

  it("excludes individual domains when assignment denies canApprove", () => {
    expect(
      headCoachSubmittedReviewDomains({
        shell: "head_coach_review",
        headCoachOwnsSkills: false,
        workspace: workflow1OwnedSkillsWorkspace({
          assignmentContext: shellAssignmentContext({
            hasHeadCoach: true,
            releaseMode: "HEAD_COACH_APPROVAL",
            domains: {
              SKILLS: shellAssignmentDomain({ canApprove: true }),
              NUTRITION: shellAssignmentDomain({ canApprove: false }),
              S_AND_C: shellAssignmentDomain({ canApprove: true }),
            },
          }),
        }),
      }),
    ).toEqual(["SKILLS", "S_AND_C"]);
  });

  it("preserves legacy fallback when assignmentContext is missing", () => {
    expect(
      headCoachSubmittedReviewDomains({
        shell: "head_coach_function_aware",
        headCoachOwnsSkills: true,
        workspace: workflow2AHeadCoachOwnedSkillsWorkspace(),
      }),
    ).toEqual(["NUTRITION", "S_AND_C"]);

    expect(
      headCoachSubmittedReviewDomains({
        shell: "head_coach_review",
        headCoachOwnsSkills: false,
        workspace: workflow1OwnedSkillsWorkspace(),
      }),
    ).toEqual(["SKILLS", "NUTRITION", "S_AND_C"]);
  });
});

describe("resolveHeadCoachSubmittedReviewCardDomains", () => {
  it("uses tab model reviewDomains for assignment-backed Workflow 1 Head Coach cards", () => {
    expect(
      resolveHeadCoachSubmittedReviewCardDomains({
        shell: "head_coach_review",
        headCoachOwnsSkills: false,
        workspace: workflow1OwnedSkillsWorkspace({
          assignmentContext: shellAssignmentContext({
            hasHeadCoach: true,
            releaseMode: "HEAD_COACH_APPROVAL",
            domains: {
              SKILLS: shellAssignmentDomain({ canApprove: true }),
              NUTRITION: shellAssignmentDomain({ canApprove: true }),
              S_AND_C: shellAssignmentDomain({ canApprove: true }),
            },
          }),
        }),
      }),
    ).toEqual(["SKILLS", "NUTRITION", "S_AND_C"]);
  });

  it("does not include domains from canOpen or workspace summary alone", () => {
    const base = workflow1OwnedSkillsWorkspace();
    expect(
      resolveHeadCoachSubmittedReviewCardDomains({
        shell: "head_coach_review",
        headCoachOwnsSkills: false,
        workspace: workflow1OwnedSkillsWorkspace({
          domains: {
            SKILLS: {
              ...base.domains.SKILLS,
              summary: {
                trainingPlanId: "skills-plan",
                versionId: "skills-version",
                generationDomain: "SKILLS",
                status: "ACTIVE",
                versionNumber: 1,
              },
              canOpen: true,
            },
            NUTRITION: {
              ...base.domains.NUTRITION,
              summary: {
                trainingPlanId: "nutrition-plan",
                versionId: "nutrition-version",
                generationDomain: "NUTRITION",
                status: "ACTIVE",
                versionNumber: 1,
              },
              canOpen: true,
            },
            S_AND_C: {
              ...base.domains.S_AND_C,
              summary: {
                trainingPlanId: "sandc-plan",
                versionId: "sandc-version",
                generationDomain: "S_AND_C",
                status: "ACTIVE",
                versionNumber: 1,
              },
              canOpen: true,
            },
          },
          assignmentContext: shellAssignmentContext({
            hasHeadCoach: true,
            releaseMode: "HEAD_COACH_APPROVAL",
            domains: {
              SKILLS: shellAssignmentDomain({ canOpen: true }),
              NUTRITION: shellAssignmentDomain({ canOpen: true }),
              S_AND_C: shellAssignmentDomain({ canOpen: true }),
            },
          }),
        }),
      }),
    ).toEqual([]);
  });

  it("keeps Workflow 2A approved Nutrition and submitted S&C cards visible from domain summaries", () => {
    const base = workflow2AHeadCoachOwnedSkillsWorkspace();
    expect(
      resolveHeadCoachSubmittedReviewCardDomains({
        shell: "head_coach_function_aware",
        headCoachOwnsSkills: true,
        workspace: workflow2AHeadCoachOwnedSkillsWorkspace({
          domains: {
            SKILLS: {
              ...base.domains.SKILLS,
              summary: {
                trainingPlanId: "skills-plan",
                versionId: "skills-version",
                generationDomain: "SKILLS",
                status: "ACTIVE",
                versionNumber: 1,
              },
            },
            NUTRITION: {
              ...base.domains.NUTRITION,
              summary: {
                trainingPlanId: "nutrition-plan",
                versionId: null,
                selectedVersionId: "nutrition-selected-version",
                generationDomain: "NUTRITION",
                status: "HEAD_COACH_APPROVED",
                versionNumber: 1,
              },
              allowedActions: [],
            },
            S_AND_C: {
              ...base.domains.S_AND_C,
              summary: {
                trainingPlanId: "sandc-plan",
                versionId: null,
                selectedVersionId: "sandc-selected-version",
                generationDomain: "S_AND_C",
                status: "ASSISTANT_COACH_APPROVED",
                versionNumber: 1,
              },
              allowedActions: ["HEAD_APPROVE", "REQUEST_REVISION"],
            },
          },
          assignmentContext: shellAssignmentContext({
            hasHeadCoach: true,
            releaseMode: "HEAD_COACH_APPROVAL",
            domains: {
              SKILLS: shellAssignmentDomain({
                ownerType: "HEAD_COACH_SELF",
                ownedByCurrentUser: true,
                canApprove: false,
              }),
              NUTRITION: shellAssignmentDomain({
                canApprove: false,
                canRequestRevision: false,
                canRelease: false,
              }),
              S_AND_C: shellAssignmentDomain({
                canApprove: true,
                canRequestRevision: true,
                canRelease: false,
              }),
            },
          }),
        }),
      }),
    ).toEqual(["NUTRITION", "S_AND_C"]);
  });

  it("does not show Head Coach review card domains for Workflow 3 direct release", () => {
    expect(
      resolveHeadCoachSubmittedReviewCardDomains({
        shell: "head_coach_review",
        headCoachOwnsSkills: false,
        workspace: workflow1OwnedSkillsWorkspace({
          assignmentContext: shellAssignmentContext({
            hasHeadCoach: false,
            releaseMode: "DIRECT_DOMAIN_RELEASE",
            planningContext: {
              ownerType: "SKILLS_FALLBACK",
              ownerUserId: "skills-coach",
              ownerCoachProfileId: "skills-profile",
              canRead: true,
              canCreate: true,
              canLock: true,
              canManage: true,
            },
            domains: {
              SKILLS: shellAssignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
              NUTRITION: shellAssignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
              S_AND_C: shellAssignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
            },
          }),
        }),
      }),
    ).toEqual([]);
  });

  it("keeps Workflow 2B Skills as review-only when assignment canApprove allows it", () => {
    const workspace = workflow2AHeadCoachOwnedSkillsWorkspace({
      assignmentContext: shellAssignmentContext({
        hasHeadCoach: true,
        releaseMode: "HEAD_COACH_APPROVAL",
        domains: {
          SKILLS: shellAssignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: true,
          }),
          NUTRITION: shellAssignmentDomain({ canApprove: true }),
          S_AND_C: shellAssignmentDomain({ canApprove: true }),
        },
      }),
    });

    expect(
      resolveHeadCoachOwnedSkillsGrouping({
        workspace,
        legacyHeadCoachOwnsSkills: true,
      }),
    ).toBe(false);
    expect(
      resolveHeadCoachSubmittedReviewCardDomains({
        shell: "head_coach_review",
        headCoachOwnsSkills: false,
        workspace,
      }),
    ).toEqual(["SKILLS", "NUTRITION", "S_AND_C"]);
  });

  it("uses assignment ownership for Workflow 2B even when Head Coach has Skills-function metadata", () => {
    const workspace = workflow2AHeadCoachOwnedSkillsWorkspace({
      shell: "HEAD_COACH_FUNCTION_AWARE",
      workflowShape: "HEAD_COACH_SKILLS_OWNER",
      ownershipFlags: {
        ...workflow2AHeadCoachOwnedSkillsWorkspace().ownershipFlags,
        requesterHasSkillsFunction: true,
        requesterOwnsCurrentDomain: true,
        requesterOwnsSkillsForThisAthlete: true,
      },
      assignmentContext: shellAssignmentContext({
        hasHeadCoach: true,
        releaseMode: "HEAD_COACH_APPROVAL",
        domains: {
          SKILLS: shellAssignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: false,
            canRequestRevision: false,
          }),
          NUTRITION: shellAssignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: false,
            canRequestRevision: false,
          }),
          S_AND_C: shellAssignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: false,
            canRequestRevision: false,
          }),
        },
      }),
    });

    expect(
      resolveHeadCoachOwnedSkillsGrouping({
        workspace,
        legacyHeadCoachOwnsSkills: true,
      }),
    ).toBe(false);
    expect(isHeadCoachSkillsOwnerWorkflow(workspace)).toBe(false);
    expect(
      resolveHeadCoachSubmittedReviewCardDomains({
        shell: "head_coach_function_aware",
        headCoachOwnsSkills: true,
        workspace,
      }),
    ).toEqual(["SKILLS", "NUTRITION", "S_AND_C"]);
    expect(deriveWorkflowStatusFromWorkspaceDomain(workspace.domains.SKILLS)).toBe("not_created");
    expect(deriveWorkflowStatusFromWorkspaceDomain(workspace.domains.NUTRITION)).toBe(
      "not_created",
    );
    expect(deriveWorkflowStatusFromWorkspaceDomain(workspace.domains.S_AND_C)).toBe("not_created");
  });

  it("renders all Workflow 2B assigned review cards even when no plans are submitted", () => {
    const workspace = workflow2AHeadCoachOwnedSkillsWorkspace({
      assignmentContext: shellAssignmentContext({
        hasHeadCoach: true,
        releaseMode: "HEAD_COACH_APPROVAL",
        domains: {
          SKILLS: shellAssignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: false,
          }),
          NUTRITION: shellAssignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: false,
          }),
          S_AND_C: shellAssignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: false,
          }),
        },
      }),
    });

    expect(
      resolveHeadCoachSubmittedReviewCardDomains({
        shell: "head_coach_review",
        headCoachOwnsSkills: false,
        workspace,
      }),
    ).toEqual(["SKILLS", "NUTRITION", "S_AND_C"]);
    expect(deriveWorkflowStatusFromWorkspaceDomain(workspace.domains.SKILLS)).toBe("not_created");
    expect(deriveWorkflowStatusFromWorkspaceDomain(workspace.domains.NUTRITION)).toBe(
      "not_created",
    );
    expect(deriveWorkflowStatusFromWorkspaceDomain(workspace.domains.S_AND_C)).toBe("not_created");
  });

  it("keeps all Workflow 2B cards visible across submitted, approved, and released statuses", () => {
    const base = workflow2AHeadCoachOwnedSkillsWorkspace();
    const workspace = workflow2AHeadCoachOwnedSkillsWorkspace({
      domains: {
        SKILLS: {
          ...base.domains.SKILLS,
          summary: {
            trainingPlanId: "skills-plan",
            versionId: null,
            selectedVersionId: "skills-version",
            generationDomain: "SKILLS",
            status: "ASSISTANT_COACH_APPROVED",
            versionNumber: 1,
          },
          allowedActions: ["HEAD_APPROVE", "REQUEST_REVISION"],
        },
        NUTRITION: {
          ...base.domains.NUTRITION,
          summary: {
            trainingPlanId: "nutrition-plan",
            versionId: null,
            selectedVersionId: "nutrition-version",
            generationDomain: "NUTRITION",
            status: "HEAD_COACH_APPROVED",
            versionNumber: 1,
          },
          allowedActions: [],
        },
        S_AND_C: {
          ...base.domains.S_AND_C,
          summary: {
            trainingPlanId: "sandc-plan",
            versionId: null,
            selectedVersionId: "sandc-version",
            generationDomain: "S_AND_C",
            status: "ACTIVE",
            versionNumber: 1,
          },
          allowedActions: [],
        },
      },
      assignmentContext: shellAssignmentContext({
        hasHeadCoach: true,
        releaseMode: "HEAD_COACH_APPROVAL",
        domains: {
          SKILLS: shellAssignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: true,
          }),
          NUTRITION: shellAssignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: false,
          }),
          S_AND_C: shellAssignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: false,
          }),
        },
      }),
    });

    expect(
      resolveHeadCoachSubmittedReviewCardDomains({
        shell: "head_coach_review",
        headCoachOwnsSkills: false,
        workspace,
      }),
    ).toEqual(["SKILLS", "NUTRITION", "S_AND_C"]);
    expect(deriveWorkflowStatusFromWorkspaceDomain(workspace.domains.SKILLS)).toBe(
      "submitted_for_review",
    );
    expect(deriveWorkflowStatusFromWorkspaceDomain(workspace.domains.NUTRITION)).toBe("approved");
    expect(deriveWorkflowStatusFromWorkspaceDomain(workspace.domains.S_AND_C)).toBe("released");
  });

  it("preserves legacy fallback for missing assignmentContext", () => {
    expect(
      resolveHeadCoachSubmittedReviewCardDomains({
        shell: "head_coach_function_aware",
        headCoachOwnsSkills: true,
        workspace: workflow2AHeadCoachOwnedSkillsWorkspace(),
      }),
    ).toEqual(["NUTRITION", "S_AND_C"]);
  });
});

describe("resolveReviewReviseStepLabelFromWorkspace", () => {
  it("uses Head Coach review wording for Workflow 1 Head Coach", () => {
    expect(
      resolveReviewReviseStepLabelFromWorkspace({
        workspace: workflow1OwnedSkillsWorkspace({
          assignmentContext: shellAssignmentContext({
            hasHeadCoach: true,
            releaseMode: "HEAD_COACH_APPROVAL",
            domains: {
              SKILLS: shellAssignmentDomain({ canApprove: true }),
              NUTRITION: shellAssignmentDomain({ canApprove: true }),
              S_AND_C: shellAssignmentDomain({ canApprove: true }),
            },
          }),
        }),
        fallbackLabel: "Generate",
      }),
    ).toBe("Review Plans");
  });

  it("uses Head Coach review wording for Workflow 2B Head Coach", () => {
    expect(
      resolveReviewReviseStepLabelFromWorkspace({
        workspace: workflow2AHeadCoachOwnedSkillsWorkspace({
          assignmentContext: shellAssignmentContext({
            hasHeadCoach: true,
            releaseMode: "HEAD_COACH_APPROVAL",
            domains: {
              SKILLS: shellAssignmentDomain({
                ownerType: "ASSIGNED_DOMAIN_COACH",
                ownedByCurrentUser: false,
                canApprove: true,
              }),
              NUTRITION: shellAssignmentDomain({ canApprove: true }),
              S_AND_C: shellAssignmentDomain({ canApprove: true }),
            },
          }),
        }),
        fallbackLabel: "Generate",
      }),
    ).toBe("Review Plans");
  });

  it("uses Head Coach review wording for Workflow 2A Head Coach-owned Skills", () => {
    const label = resolveReviewReviseStepLabelFromWorkspace({
      workspace: workflow2AHeadCoachOwnedSkillsWorkspace({
        assignmentContext: shellAssignmentContext({
          hasHeadCoach: true,
          releaseMode: "HEAD_COACH_APPROVAL",
          domains: {
            SKILLS: shellAssignmentDomain({
              ownerType: "HEAD_COACH_SELF",
              ownedByCurrentUser: true,
              canGenerate: true,
              canRevise: true,
              canSubmitForReview: true,
            }),
            NUTRITION: shellAssignmentDomain({ canApprove: true }),
            S_AND_C: shellAssignmentDomain({ canApprove: true }),
          },
        }),
      }),
      fallbackLabel: "Generate",
    });

    expect(label).toBe("Review Plans");
    expect(label).not.toBe("Revise / Submit Plan");
  });

  it("uses domain-owner wording for Workflow 3 instead of Head Coach review language", () => {
    const label = resolveReviewReviseStepLabelFromWorkspace({
      workspace: workflow1OwnedSkillsWorkspace({
        assignmentContext: shellAssignmentContext({
          hasHeadCoach: false,
          releaseMode: "DIRECT_DOMAIN_RELEASE",
          planningContext: {
            ownerType: "SKILLS_FALLBACK",
            ownerUserId: "skills-coach",
            ownerCoachProfileId: "skills-profile",
            canRead: true,
            canCreate: true,
            canLock: true,
            canManage: true,
          },
          domains: {
            SKILLS: shellAssignmentDomain({
              ownerType: "ASSIGNED_DOMAIN_COACH",
              ownedByCurrentUser: true,
              canRevise: true,
              canSubmitForReview: true,
              releaseMode: "DIRECT_DOMAIN_RELEASE",
            }),
            NUTRITION: shellAssignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
            S_AND_C: shellAssignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
          },
        }),
      }),
      fallbackLabel: "Review Plans",
    });

    expect(label).toBe("Revise / Submit Plan");
    expect(label).not.toBe("Review Plans");
  });

  it("preserves fallback copy when assignmentContext is missing", () => {
    expect(
      resolveReviewReviseStepLabelFromWorkspace({
        workspace: workflow1OwnedSkillsWorkspace(),
        fallbackLabel: "Review Plans",
      }),
    ).toBe("Review Plans");
  });
});

describe("resolvePlanningContextAuthority", () => {
  it("uses legacy authority only when assignment planning context is missing", () => {
    expect(
      resolvePlanningContextAuthority({
        assignmentPlanningContext: undefined,
        legacyAuthority: true,
      }),
    ).toEqual({
      canShowPlanningContextControls: true,
      canLockPlanningContext: true,
    });
  });

  it("does not infer authority from legacy flags when assignment planning context exists", () => {
    expect(
      resolvePlanningContextAuthority({
        assignmentPlanningContext: {
          ownerType: "HEAD_COACH",
          ownerUserId: "coach-1",
          ownerCoachProfileId: "profile-1",
          canRead: true,
          canCreate: false,
          canLock: false,
          canManage: false,
        },
        legacyAuthority: true,
      }),
    ).toEqual({
      canShowPlanningContextControls: false,
      canLockPlanningContext: false,
    });
  });

  it("shows planning controls for assignment create/manage permission but locks only with canLock", () => {
    expect(
      resolvePlanningContextAuthority({
        assignmentPlanningContext: {
          ownerType: "SKILLS_FALLBACK",
          ownerUserId: "coach-1",
          ownerCoachProfileId: "profile-1",
          canRead: true,
          canCreate: true,
          canLock: false,
          canManage: true,
        },
        legacyAuthority: false,
      }),
    ).toEqual({
      canShowPlanningContextControls: true,
      canLockPlanningContext: false,
    });
  });

  it("requires a non-NONE assignment owner type for planning authority", () => {
    expect(
      resolvePlanningContextAuthority({
        assignmentPlanningContext: {
          ownerType: "NONE",
          ownerUserId: null,
          ownerCoachProfileId: null,
          canRead: true,
          canCreate: true,
          canLock: true,
          canManage: true,
        },
        legacyAuthority: true,
      }),
    ).toEqual({
      canShowPlanningContextControls: false,
      canLockPlanningContext: false,
    });
  });
});

describe("resolveDomainGeneratePermission", () => {
  it("uses legacy ownership flags only when assignment domain context is missing", () => {
    expect(
      resolveDomainGeneratePermission({
        assignmentDomainContext: undefined,
        legacyOwnershipFlags: {
          canGeneratePlan: true,
          canGenerateCurrentDomainPlan: true,
        },
      }),
    ).toEqual({
      canShowGenerate: true,
      ownershipFlags: {
        canGeneratePlan: true,
        canGenerateCurrentDomainPlan: true,
      },
    });

    expect(
      resolveDomainGeneratePermission({
        assignmentDomainContext: undefined,
        legacyOwnershipFlags: {
          canGeneratePlan: false,
          canGenerateCurrentDomainPlan: null,
        },
      }).canShowGenerate,
    ).toBe(false);
  });

  it("uses assignment canGenerate as source of truth when assignment domain context exists", () => {
    expect(
      resolveDomainGeneratePermission({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "coach-1",
          ownerCoachProfileId: "profile-1",
          ownedByCurrentUser: true,
          canOpen: false,
          canGenerate: true,
          canRevise: false,
          canSubmitForReview: false,
          canApprove: false,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyOwnershipFlags: {
          canGeneratePlan: false,
          canGenerateCurrentDomainPlan: false,
        },
      }),
    ).toEqual({
      canShowGenerate: true,
      ownershipFlags: {
        canGeneratePlan: true,
        canGenerateCurrentDomainPlan: true,
      },
    });
  });

  it("protects Workflow 2B by hiding Skills Generate when assignment denies ownership", () => {
    expect(
      resolveDomainGeneratePermission({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "separate-skills-coach",
          ownerCoachProfileId: "skills-profile",
          ownedByCurrentUser: false,
          canOpen: true,
          canGenerate: false,
          canRevise: false,
          canSubmitForReview: false,
          canApprove: false,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyOwnershipFlags: {
          canGeneratePlan: true,
          canGenerateCurrentDomainPlan: true,
        },
      }),
    ).toEqual({
      canShowGenerate: false,
      ownershipFlags: {
        canGeneratePlan: false,
        canGenerateCurrentDomainPlan: false,
      },
    });
  });

  it("requires a non-NONE owner type for assignment-backed generation", () => {
    expect(
      resolveDomainGeneratePermission({
        assignmentDomainContext: {
          ownerType: "NONE",
          ownerUserId: null,
          ownerCoachProfileId: null,
          ownedByCurrentUser: true,
          canOpen: true,
          canGenerate: true,
          canRevise: false,
          canSubmitForReview: false,
          canApprove: false,
          canRelease: false,
          releaseMode: "DIRECT_DOMAIN_RELEASE",
        },
        legacyOwnershipFlags: {
          canGeneratePlan: true,
          canGenerateCurrentDomainPlan: true,
        },
      }).canShowGenerate,
    ).toBe(false);
  });
});

describe("resolveDomainViewPlanVisible", () => {
  it("uses legacy open visibility only when assignment domain context is missing", () => {
    expect(
      resolveDomainViewPlanVisible({
        assignmentDomainContext: undefined,
        legacyCanOpen: true,
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(true);

    expect(
      resolveDomainViewPlanVisible({
        assignmentDomainContext: undefined,
        legacyCanOpen: false,
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(false);
  });

  it("uses assignment canOpen as source of truth when assignment domain context exists", () => {
    expect(
      resolveDomainViewPlanVisible({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "coach-1",
          ownerCoachProfileId: "profile-1",
          ownedByCurrentUser: false,
          canOpen: true,
          canGenerate: false,
          canRevise: false,
          canSubmitForReview: false,
          canApprove: false,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyCanOpen: false,
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(true);

    expect(
      resolveDomainViewPlanVisible({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "other-coach",
          ownerCoachProfileId: "profile-2",
          ownedByCurrentUser: false,
          canOpen: false,
          canGenerate: false,
          canRevise: false,
          canSubmitForReview: false,
          canApprove: false,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyCanOpen: true,
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(false);
  });

  it("requires both plan and version ids before showing View Plan", () => {
    expect(
      resolveDomainViewPlanVisible({
        assignmentDomainContext: {
          ownerType: "HEAD_COACH_SELF",
          ownerUserId: "coach-1",
          ownerCoachProfileId: "profile-1",
          ownedByCurrentUser: true,
          canOpen: true,
          canGenerate: true,
          canRevise: true,
          canSubmitForReview: true,
          canApprove: true,
          canRelease: true,
          releaseMode: "DIRECT_DOMAIN_RELEASE",
        },
        legacyCanOpen: true,
        planId: "plan-1",
        versionId: null,
      }),
    ).toBe(false);
  });
});

describe("resolveDomainRevisePlanVisible", () => {
  const reviseIds = { trainingPlanId: "plan-1", versionId: "version-1" };

  it("uses legacy ownership only when assignment domain context is missing", () => {
    expect(
      resolveDomainRevisePlanVisible({
        assignmentDomainContext: undefined,
        legacyRequesterOwnsDomain: true,
        workflowStatus: "draft_generated",
        reviseIds,
      }),
    ).toBe(true);

    expect(
      resolveDomainRevisePlanVisible({
        assignmentDomainContext: undefined,
        legacyRequesterOwnsDomain: false,
        workflowStatus: "draft_generated",
        reviseIds,
      }),
    ).toBe(false);
  });

  it("uses assignment canRevise and ownedByCurrentUser as source of truth when assignment domain context exists", () => {
    expect(
      resolveDomainRevisePlanVisible({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "coach-1",
          ownerCoachProfileId: "profile-1",
          ownedByCurrentUser: true,
          canOpen: false,
          canGenerate: false,
          canRevise: true,
          canSubmitForReview: false,
          canApprove: false,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyRequesterOwnsDomain: false,
        workflowStatus: "draft_generated",
        reviseIds,
      }),
    ).toBe(true);

    expect(
      resolveDomainRevisePlanVisible({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "other-coach",
          ownerCoachProfileId: "profile-2",
          ownedByCurrentUser: false,
          canOpen: true,
          canGenerate: true,
          canRevise: true,
          canSubmitForReview: true,
          canApprove: false,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyRequesterOwnsDomain: true,
        workflowStatus: "draft_generated",
        reviseIds,
      }),
    ).toBe(false);

    expect(
      resolveDomainRevisePlanVisible({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "coach-1",
          ownerCoachProfileId: "profile-1",
          ownedByCurrentUser: true,
          canOpen: true,
          canGenerate: true,
          canRevise: false,
          canSubmitForReview: true,
          canApprove: false,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyRequesterOwnsDomain: true,
        workflowStatus: "draft_generated",
        reviseIds,
      }),
    ).toBe(false);
  });

  it("preserves revised editable drafts as revisable when assignment allows it", () => {
    for (const versionId of ["version-v2", "version-v3"]) {
      expect(
        resolveDomainRevisePlanVisible({
          assignmentDomainContext: {
            ownerType: "HEAD_COACH_SELF",
            ownerUserId: "coach-1",
            ownerCoachProfileId: "profile-1",
            ownedByCurrentUser: true,
            canOpen: true,
            canGenerate: true,
            canRevise: true,
            canSubmitForReview: true,
            canApprove: false,
            canRelease: false,
            releaseMode: "HEAD_COACH_APPROVAL",
          },
          legacyRequesterOwnsDomain: false,
          workflowStatus: "draft_generated",
          reviseIds: { trainingPlanId: "plan-1", versionId },
        }),
      ).toBe(true);
    }
  });

  it("still requires existing plan state and revise ids after assignment permission passes", () => {
    expect(
      resolveDomainRevisePlanVisible({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "coach-1",
          ownerCoachProfileId: "profile-1",
          ownedByCurrentUser: true,
          canOpen: true,
          canGenerate: true,
          canRevise: true,
          canSubmitForReview: true,
          canApprove: false,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyRequesterOwnsDomain: true,
        workflowStatus: "submitted_for_review",
        reviseIds,
      }),
    ).toBe(false);

    expect(
      resolveDomainRevisePlanVisible({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "coach-1",
          ownerCoachProfileId: "profile-1",
          ownedByCurrentUser: true,
          canOpen: true,
          canGenerate: true,
          canRevise: true,
          canSubmitForReview: true,
          canApprove: false,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyRequesterOwnsDomain: true,
        workflowStatus: "draft_generated",
        reviseIds: null,
      }),
    ).toBe(false);
  });
});

describe("Step 3D domain workflow contract", () => {
  it("uses domain-level release wording instead of whole-plan completion wording", () => {
    expect(assistantWorkflowStatusLabelForKind("released")).toBe(
      "Domain Released to Athlete",
    );
    expect(
      domainIntegrationNextActionLabel({
        workflowStatus: "released",
        assignmentDomainContext: shellAssignmentDomain({
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownedByCurrentUser: false,
        }),
        planningContextLocked: true,
        loading: false,
        hasError: false,
        canGenerate: false,
        canSubmitForReview: false,
        canViewPlan: true,
        canReview: false,
        canRelease: false,
        isCurrentReviewPlan: false,
      }),
    ).toBe("This domain is released to the athlete.");
    expect(
      domainIntegrationAvailableActionLabels({
        canGenerate: false,
        canViewPlan: true,
        canSubmitForReview: false,
        canReview: false,
        canRelease: false,
        canRevise: false,
      }),
    ).toEqual(["View / review domain plan"]);
    expect(
      domainIntegrationAvailableActionLabels({
        canGenerate: false,
        canViewPlan: true,
        canSubmitForReview: false,
        canReview: false,
        canRelease: true,
        canRevise: false,
      }),
    ).toEqual(["View / review domain plan", "Release this domain"]);
  });

  it("locks future revise availability to owned domains with an approved or released base version", () => {
    const released = resolveDomainReviseAvailability({
      domain: "SKILLS",
      workflowStatus: "released",
      planId: "skills-plan",
      versionId: "skills-active-version",
      baseVersionId: "skills-active-version",
      assignmentDomainContext: shellAssignmentDomain({
        ownerType: "ASSIGNED_DOMAIN_COACH",
        ownedByCurrentUser: true,
        canRevise: true,
        canSubmitForReview: true,
      }),
      legacyRequesterOwnsDomain: false,
    });

    expect(released).toMatchObject({
      domain: "SKILLS",
      planId: "skills-plan",
      versionId: "skills-active-version",
      baseVersionId: "skills-active-version",
      requesterCanRevise: true,
      baseVersionAvailable: true,
      mutationEnabled: false,
      placeholderVisible: true,
      reason: "future_base_version_ready",
    });

    const approved = resolveDomainReviseAvailability({
      domain: "NUTRITION",
      workflowStatus: "approved",
      planId: "nutrition-plan",
      versionId: "nutrition-approved-version",
      baseVersionId: "nutrition-approved-version",
      assignmentDomainContext: shellAssignmentDomain({
        ownerType: "ASSIGNED_DOMAIN_COACH",
        ownedByCurrentUser: true,
        canRevise: true,
      }),
      legacyRequesterOwnsDomain: false,
    });

    expect(approved).toMatchObject({
      domain: "NUTRITION",
      baseVersionAvailable: true,
      mutationEnabled: false,
      placeholderVisible: true,
      reason: "future_base_version_ready",
    });
  });

  it("does not infer W2B Head Coach Skills revise authority from generic capability", () => {
    expect(
      resolveDomainReviseAvailability({
        domain: "SKILLS",
        workflowStatus: "released",
        planId: "skills-plan",
        versionId: "skills-active-version",
        baseVersionId: "skills-active-version",
        assignmentDomainContext: shellAssignmentDomain({
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "separate-skills-coach",
          ownerCoachProfileId: "skills-profile",
          ownedByCurrentUser: false,
          canOpen: true,
          canGenerate: false,
          canRevise: true,
          canSubmitForReview: false,
          canApprove: true,
          canRelease: true,
        }),
        legacyRequesterOwnsDomain: true,
      }),
    ).toMatchObject({
      requesterCanRevise: false,
      mutationEnabled: false,
      placeholderVisible: false,
      reason: "not_authorized",
    });
  });
});

describe("Training Plan Workspace lifecycle display", () => {
  it("keeps Domain Plans Integration active for W1 partial domain release", () => {
    const base = workflow1OwnedSkillsWorkspace();
    const workspace = workflow1OwnedSkillsWorkspace({
      domains: {
        SKILLS: {
          ...base.domains.SKILLS,
          summary: {
            trainingPlanId: "skills-plan",
            versionId: "skills-version",
            generationDomain: "SKILLS",
            status: "ACTIVE",
            versionNumber: 1,
          },
        },
        NUTRITION: base.domains.NUTRITION,
        S_AND_C: base.domains.S_AND_C,
      },
      assignmentContext: shellAssignmentContext({
        domains: {
          SKILLS: shellAssignmentDomain({ ownerType: "ASSIGNED_DOMAIN_COACH" }),
          NUTRITION: shellAssignmentDomain({ ownerType: "ASSIGNED_DOMAIN_COACH" }),
          S_AND_C: shellAssignmentDomain({ ownerType: "ASSIGNED_DOMAIN_COACH" }),
        },
      }),
    });

    const domainIntegrationComplete =
      resolveTrainingPlanWorkspaceDomainIntegrationComplete(workspace);
    const steps = resolveTrainingPlanWorkspaceLifecycleSteps({
      activeMode: "plan-viewer",
      contextComplete: true,
      domainAvailable: true,
      planViewerAvailable: true,
      domainIntegrationComplete,
    });

    expect(domainIntegrationComplete).toBe(false);
    expect(steps.find((step) => step.key === "domain-integration")?.state).toBe("active");
    expect(steps.find((step) => step.key === "plan-viewer")?.state).toBe("active");
  });

  it("marks Domain Plans Integration complete when all assigned domains are released", () => {
    const base = workflow1OwnedSkillsWorkspace();
    const releasedDomain = (domain: "SKILLS" | "NUTRITION" | "S_AND_C") => ({
      ...base.domains[domain],
      summary: {
        trainingPlanId: `${domain.toLowerCase()}-plan`,
        versionId: `${domain.toLowerCase()}-version`,
        generationDomain: domain,
        status: "ACTIVE",
        versionNumber: 1,
      },
    });
    const workspace = workflow1OwnedSkillsWorkspace({
      domains: {
        SKILLS: releasedDomain("SKILLS"),
        NUTRITION: releasedDomain("NUTRITION"),
        S_AND_C: releasedDomain("S_AND_C"),
      },
      assignmentContext: shellAssignmentContext({
        domains: {
          SKILLS: shellAssignmentDomain({ ownerType: "ASSIGNED_DOMAIN_COACH" }),
          NUTRITION: shellAssignmentDomain({ ownerType: "ASSIGNED_DOMAIN_COACH" }),
          S_AND_C: shellAssignmentDomain({ ownerType: "ASSIGNED_DOMAIN_COACH" }),
        },
      }),
    });

    const domainIntegrationComplete =
      resolveTrainingPlanWorkspaceDomainIntegrationComplete(workspace);
    const steps = resolveTrainingPlanWorkspaceLifecycleSteps({
      activeMode: "plan-viewer",
      contextComplete: true,
      domainAvailable: true,
      planViewerAvailable: true,
      domainIntegrationComplete,
    });

    expect(domainIntegrationComplete).toBe(true);
    expect(steps.find((step) => step.key === "domain-integration")?.state).toBe(
      "completed",
    );
    expect(steps.find((step) => step.key === "plan-viewer")?.state).toBe("active");
  });
});

describe("resolveDomainSubmitForReviewVisible", () => {
  it("uses legacy submit visibility only when assignment domain context is missing", () => {
    expect(
      resolveDomainSubmitForReviewVisible({
        assignmentDomainContext: undefined,
        legacyCanSubmitForReview: true,
        workflowStatus: "draft_generated",
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(true);

    expect(
      resolveDomainSubmitForReviewVisible({
        assignmentDomainContext: undefined,
        legacyCanSubmitForReview: false,
        workflowStatus: "draft_generated",
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(false);
  });

  it("uses assignment canSubmitForReview and ownedByCurrentUser as source of truth when assignment domain context exists", () => {
    expect(
      resolveDomainSubmitForReviewVisible({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "coach-1",
          ownerCoachProfileId: "profile-1",
          ownedByCurrentUser: true,
          canOpen: false,
          canGenerate: false,
          canRevise: false,
          canSubmitForReview: true,
          canApprove: false,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyCanSubmitForReview: false,
        workflowStatus: "draft_generated",
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(true);

    expect(
      resolveDomainSubmitForReviewVisible({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "other-coach",
          ownerCoachProfileId: "profile-2",
          ownedByCurrentUser: false,
          canOpen: true,
          canGenerate: true,
          canRevise: true,
          canSubmitForReview: true,
          canApprove: false,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyCanSubmitForReview: true,
        workflowStatus: "draft_generated",
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(false);

    expect(
      resolveDomainSubmitForReviewVisible({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "coach-1",
          ownerCoachProfileId: "profile-1",
          ownedByCurrentUser: true,
          canOpen: true,
          canGenerate: true,
          canRevise: true,
          canSubmitForReview: false,
          canApprove: false,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyCanSubmitForReview: true,
        workflowStatus: "draft_generated",
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(false);
  });

  it("allows Workflow 2A Head Coach-owned Skills submit when assignment allows it", () => {
    expect(
      resolveDomainSubmitForReviewVisible({
        assignmentDomainContext: {
          ownerType: "HEAD_COACH_SELF",
          ownerUserId: "head-coach",
          ownerCoachProfileId: "head-coach-profile",
          ownedByCurrentUser: true,
          canOpen: true,
          canGenerate: true,
          canRevise: true,
          canSubmitForReview: true,
          canApprove: false,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyCanSubmitForReview: false,
        workflowStatus: "draft_generated",
        planId: "skills-plan",
        versionId: "skills-v1",
      }),
    ).toBe(true);
  });

  it("denies Workflow 2B Head Coach planning-only Skills submit when assignment is owned by another coach", () => {
    expect(
      resolveDomainSubmitForReviewVisible({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "separate-skills-coach",
          ownerCoachProfileId: "skills-profile",
          ownedByCurrentUser: false,
          canOpen: true,
          canGenerate: false,
          canRevise: false,
          canSubmitForReview: true,
          canApprove: false,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyCanSubmitForReview: true,
        workflowStatus: "draft_generated",
        planId: "skills-plan",
        versionId: "skills-v1",
      }),
    ).toBe(false);
  });

  it("still requires existing plan state and plan/version ids after assignment permission passes", () => {
    expect(
      resolveDomainSubmitForReviewVisible({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "coach-1",
          ownerCoachProfileId: "profile-1",
          ownedByCurrentUser: true,
          canOpen: true,
          canGenerate: true,
          canRevise: true,
          canSubmitForReview: true,
          canApprove: false,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyCanSubmitForReview: true,
        workflowStatus: "submitted_for_review",
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(false);

    expect(
      resolveDomainSubmitForReviewVisible({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "coach-1",
          ownerCoachProfileId: "profile-1",
          ownedByCurrentUser: true,
          canOpen: true,
          canGenerate: true,
          canRevise: true,
          canSubmitForReview: true,
          canApprove: false,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyCanSubmitForReview: true,
        workflowStatus: "draft_generated",
        planId: "plan-1",
        versionId: null,
      }),
    ).toBe(false);
  });
});

describe("resolveDomainHeadCoachReviewActionVisible", () => {
  it("uses legacy review visibility only when assignment domain context is missing", () => {
    expect(
      resolveDomainHeadCoachReviewActionVisible({
        assignmentDomainContext: undefined,
        legacyCanShowReviewAction: true,
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(true);

    expect(
      resolveDomainHeadCoachReviewActionVisible({
        assignmentDomainContext: undefined,
        legacyCanShowReviewAction: false,
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(false);
  });

  it("uses assignment canApprove as source of truth when assignment domain context exists", () => {
    expect(
      resolveDomainHeadCoachReviewActionVisible({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "domain-coach",
          ownerCoachProfileId: "domain-profile",
          ownedByCurrentUser: false,
          canOpen: true,
          canGenerate: false,
          canRevise: false,
          canSubmitForReview: false,
          canApprove: true,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyCanShowReviewAction: true,
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(true);

    expect(
      resolveDomainHeadCoachReviewActionVisible({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "domain-coach",
          ownerCoachProfileId: "domain-profile",
          ownedByCurrentUser: true,
          canOpen: true,
          canGenerate: true,
          canRevise: true,
          canSubmitForReview: true,
          canApprove: false,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyCanShowReviewAction: true,
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(false);
  });

  it("still requires existing review state/action checks after assignment permission passes", () => {
    expect(
      resolveDomainHeadCoachReviewActionVisible({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "domain-coach",
          ownerCoachProfileId: "domain-profile",
          ownedByCurrentUser: false,
          canOpen: true,
          canGenerate: false,
          canRevise: false,
          canSubmitForReview: false,
          canApprove: true,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyCanShowReviewAction: false,
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(false);
  });

  it("requires both plan and version ids before showing review actions", () => {
    expect(
      resolveDomainHeadCoachReviewActionVisible({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "domain-coach",
          ownerCoachProfileId: "domain-profile",
          ownedByCurrentUser: false,
          canOpen: true,
          canGenerate: false,
          canRevise: false,
          canSubmitForReview: false,
          canApprove: true,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyCanShowReviewAction: true,
        planId: "plan-1",
        versionId: null,
      }),
    ).toBe(false);
  });

  it("hides review actions for a domain owner when assignment denies canApprove", () => {
    expect(
      resolveDomainHeadCoachReviewActionVisible({
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "domain-coach",
          ownerCoachProfileId: "domain-profile",
          ownedByCurrentUser: true,
          canOpen: true,
          canGenerate: true,
          canRevise: true,
          canSubmitForReview: true,
          canApprove: false,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        legacyCanShowReviewAction: true,
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(false);
  });

  it("keeps Workflow 2A submitted Nutrition and S&C review actions active when release is not allowed", () => {
    for (const domain of ["NUTRITION", "S_AND_C"] as const) {
      const assignmentDomainContext = shellAssignmentDomain({
        ownerType: "ASSIGNED_DOMAIN_COACH",
        ownerUserId: `${domain.toLowerCase()}-coach`,
        ownerCoachProfileId: `${domain.toLowerCase()}-profile`,
        ownedByCurrentUser: false,
        canOpen: true,
        canApprove: true,
        canRequestRevision: true,
        canRelease: false,
        blockers: [],
      });
      const allowedActions = new Set(["HEAD_APPROVE", "REQUEST_REVISION"]);

      expect(
        resolveDomainHeadCoachReviewActionVisible({
          assignmentDomainContext,
          reviewAction: "HEAD_APPROVE",
          legacyCanShowReviewAction: allowedActions.has("HEAD_APPROVE"),
          planId: `${domain.toLowerCase()}-plan`,
          versionId: `${domain.toLowerCase()}-version`,
        }),
      ).toBe(true);
      expect(
        resolveDomainHeadCoachReviewActionVisible({
          assignmentDomainContext,
          reviewAction: "REQUEST_REVISION",
          legacyCanShowReviewAction: allowedActions.has("REQUEST_REVISION"),
          planId: `${domain.toLowerCase()}-plan`,
          versionId: `${domain.toLowerCase()}-version`,
        }),
      ).toBe(true);
      expect(
        resolveDomainReleaseVisible({
          assignmentReleaseMode: "HEAD_COACH_APPROVAL",
          assignmentDomainContext,
          requiredReleaseMode: "HEAD_COACH_APPROVAL",
          legacyCanRelease: true,
          planId: `${domain.toLowerCase()}-plan`,
          versionId: `${domain.toLowerCase()}-version`,
        }),
      ).toBe(false);
    }
  });
});

describe("Workflow 3 Skills coach Tab 6", () => {
  function workflow3SkillsCoachWorkspace(
    overrides: Partial<TrainingPlanWorkspace> = {},
  ): TrainingPlanWorkspace {
    const base = workflow1OwnedSkillsWorkspace();
    return workflow1OwnedSkillsWorkspace({
      workflowShape: "DIRECT_DOMAIN_RELEASE",
      shell: "SKILLS_COACH_PLANNING",
      workflowMode: "SKILLS_COACH_PLANNING",
      currentDomain: "SKILLS",
      initialTab: "DOMAIN",
      ownershipFlags: {
        ...base.ownershipFlags,
        hasHeadCoach: false,
        requesterIsHeadCoach: false,
        requesterHasSkillsFunction: true,
        requesterOwnsCurrentDomain: true,
        requesterOwnsSkillsForThisAthlete: true,
        headCoachOwnsPlanningContext: false,
        directReleaseAllowed: true,
      },
      assignmentContext: shellAssignmentContext({
        hasHeadCoach: false,
        releaseMode: "DIRECT_DOMAIN_RELEASE",
        planningContext: {
          ownerType: "SKILLS_FALLBACK",
          ownerUserId: "skills-coach",
          ownerCoachProfileId: "skills-profile",
          canRead: true,
          canCreate: true,
          canLock: true,
          canManage: true,
        },
        domains: {
          SKILLS: shellAssignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownerUserId: "skills-coach",
            ownerCoachProfileId: "skills-profile",
            ownedByCurrentUser: true,
            canOpen: true,
            canGenerate: true,
            canRevise: true,
            canApprove: true,
            canRelease: true,
            releaseMode: "DIRECT_DOMAIN_RELEASE",
          }),
          NUTRITION: shellAssignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
          S_AND_C: shellAssignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
        },
      }),
      ...overrides,
    });
  }

  it("shows the Skills generate, approve, and direct-release path without Head Coach review cards", () => {
    const workspace = workflow3SkillsCoachWorkspace();
    const skillsAssignmentContext = workspace.assignmentContext?.domains.SKILLS;

    expect(resolveWorkflowModeFromWorkspace(workspace)).toBe("skills_coach_planning");
    expect(
      resolveDomainGeneratePermission({
        assignmentDomainContext: skillsAssignmentContext,
        legacyOwnershipFlags: {
          canGeneratePlan: false,
          canGenerateCurrentDomainPlan: false,
        },
      }).canShowGenerate,
    ).toBe(true);
    expect(
      resolveDirectReleaseSkillsOwnerApproveVisible({
        assignmentReleaseMode: workspace.assignmentContext?.releaseMode,
        assignmentDomainContext: skillsAssignmentContext,
        domain: "SKILLS",
        legacyCanApprove: true,
        planId: "skills-plan",
        versionId: "skills-version",
      }),
    ).toBe(true);
    expect(
      resolveDomainReleaseVisible({
        assignmentReleaseMode: workspace.assignmentContext?.releaseMode,
        assignmentDomainContext: skillsAssignmentContext,
        requiredReleaseMode: "DIRECT_DOMAIN_RELEASE",
        legacyCanRelease: true,
        planId: "skills-plan",
        versionId: "skills-version",
      }),
    ).toBe(true);
    expect(
      resolveHeadCoachSubmittedReviewCardDomains({
        shell: "specialist_domain",
        headCoachOwnsSkills: false,
        workspace,
      }),
    ).toEqual([]);
  });

  it("does not show Nutrition or S&C review cards for Workflow 3 Skills coach", () => {
    const workspace = workflow3SkillsCoachWorkspace({
      domains: {
        ...workflow3SkillsCoachWorkspace().domains,
        NUTRITION: {
          ...workflow3SkillsCoachWorkspace().domains.NUTRITION,
          summary: {
            trainingPlanId: "nutrition-plan",
            versionId: "nutrition-version",
            generationDomain: "NUTRITION",
            status: "ACTIVE",
            versionNumber: 1,
          },
          allowedActions: ["HEAD_APPROVE", "REQUEST_REVISION"],
        },
        S_AND_C: {
          ...workflow3SkillsCoachWorkspace().domains.S_AND_C,
          summary: {
            trainingPlanId: "sandc-plan",
            versionId: "sandc-version",
            generationDomain: "S_AND_C",
            status: "ACTIVE",
            versionNumber: 1,
          },
          allowedActions: ["HEAD_APPROVE", "REQUEST_REVISION"],
        },
      },
    });

    expect(
      resolveHeadCoachSubmittedReviewCardDomains({
        shell: "specialist_domain",
        headCoachOwnsSkills: false,
        workspace,
      }),
    ).toEqual([]);
  });

  it("keeps Workflow 3 Skills approve payload scoped to Skills only", () => {
    const workspace = workflow3SkillsCoachWorkspace();
    const actionContext = resolveWorkflowActionContext({
      workspace,
      legacyContext: {
        planId: "skills-plan",
        versionId: "skills-version",
        generationDomain: "SKILLS",
      },
      legacyAllowedActions: ["HEAD_APPROVE"],
      currentDomain: "SKILLS",
    });

    expect(actionContext).toMatchObject({
      planId: "skills-plan",
      versionId: "skills-version",
      generationDomain: "SKILLS",
      allowedActions: ["HEAD_APPROVE"],
    });
  });

  it("does not expose request-revision controls for direct-release Skills owner approval", () => {
    const workspace = workflow3SkillsCoachWorkspace({
      assignmentContext: shellAssignmentContext({
        hasHeadCoach: false,
        releaseMode: "DIRECT_DOMAIN_RELEASE",
        planningContext: {
          ownerType: "SKILLS_FALLBACK",
          ownerUserId: "skills-coach",
          ownerCoachProfileId: "skills-profile",
          canRead: true,
          canCreate: true,
          canLock: true,
          canManage: true,
        },
        domains: {
          SKILLS: shellAssignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: true,
            canOpen: true,
            canGenerate: true,
            canApprove: true,
            canRequestRevision: true,
            canRelease: true,
            releaseMode: "DIRECT_DOMAIN_RELEASE",
          }),
          NUTRITION: shellAssignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
          S_AND_C: shellAssignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
        },
      }),
    });
    const skillsAssignmentContext = workspace.assignmentContext?.domains.SKILLS;
    const canShowDirectApprove = resolveDirectReleaseSkillsOwnerApproveVisible({
      assignmentReleaseMode: workspace.assignmentContext?.releaseMode,
      assignmentDomainContext: skillsAssignmentContext,
      domain: "SKILLS",
      legacyCanApprove: true,
      planId: "skills-plan",
      versionId: "skills-version",
    });
    const canShowRequestRevision =
      !canShowDirectApprove &&
      resolveDomainHeadCoachReviewActionVisible({
        assignmentDomainContext: skillsAssignmentContext,
        reviewAction: "REQUEST_REVISION",
        legacyCanShowReviewAction: true,
        planId: "skills-plan",
        versionId: "skills-version",
      });

    expect(canShowDirectApprove).toBe(true);
    expect(canShowRequestRevision).toBe(false);
  });
});

describe("resolveContextAppStepCompleteForNavigation", () => {
  it("unlocks Step 2 for Workflow 3 Skills when only level validation is pending", () => {
    expect(
      resolveContextAppStepCompleteForNavigation({
        appCompleteness: "INCOMPLETE",
        planningEligibility: "PENDING_LEVEL_VALIDATION",
        missingRequiredFields: [],
        backendBlockers: [],
        skillsOwnedDirectRelease: true,
      }),
    ).toBe(true);
  });

  it("keeps Step 2 locked when required APP fields are missing", () => {
    expect(
      resolveContextAppStepCompleteForNavigation({
        appCompleteness: "INCOMPLETE",
        planningEligibility: "PENDING_LEVEL_VALIDATION",
        missingRequiredFields: ["dateOfBirth"],
        backendBlockers: [],
        skillsOwnedDirectRelease: true,
      }),
    ).toBe(false);
  });

  it("keeps Step 2 locked when backend blockers are present", () => {
    expect(
      resolveContextAppStepCompleteForNavigation({
        appCompleteness: "INCOMPLETE",
        planningEligibility: "PENDING_LEVEL_VALIDATION",
        missingRequiredFields: [],
        backendBlockers: ["Athlete profile missing sport"],
        skillsOwnedDirectRelease: true,
      }),
    ).toBe(false);
  });

  it("keeps Workflow 2A/2B navigation requiring complete Context APP", () => {
    expect(
      resolveContextAppStepCompleteForNavigation({
        appCompleteness: "INCOMPLETE",
        planningEligibility: "PENDING_LEVEL_VALIDATION",
        missingRequiredFields: [],
        backendBlockers: [],
        skillsOwnedDirectRelease: false,
      }),
    ).toBe(false);
    expect(
      resolveContextAppStepCompleteForNavigation({
        appCompleteness: "COMPLETE",
        planningEligibility: "PENDING_LEVEL_VALIDATION",
        missingRequiredFields: [],
        backendBlockers: [],
        skillsOwnedDirectRelease: false,
      }),
    ).toBe(true);
  });
});

describe("season create display state", () => {
  const emptySetupState = {
    seasons: [],
    phasesBySeasonCycleId: {},
    goals: [],
    coachFunctions: [],
    hasHeadCoachConfigured: false,
    academyCoachRole: "",
    trainingPlanReleaseMode: "",
  };
  const createdCustomSeason = {
    id: "season-custom-1",
    seasonCycleId: "season-custom-1",
    entityId: "entity-1",
    sport: "GOLF",
    year: 2026,
    name: "Trott 2026 Golf Season",
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-12-31T00:00:00.000Z",
    phases: [],
  };

  it("keeps a custom backend season name displayed after create", () => {
    const next = resolveSetupStateAfterSeasonCreate(emptySetupState, createdCustomSeason);
    const selectedSeason = next.seasons.find(
      (season) => season.seasonCycleId === createdCustomSeason.seasonCycleId,
    );

    expect(selectedSeason?.name).toBe("Trott 2026 Golf Season");
    expect(formatSeasonOptionLabel(createdCustomSeason)).toBe("Trott 2026 Golf Season");
  });

  it("does not display the generated default as the saved selected name after custom create", () => {
    const next = resolveSetupStateAfterSeasonCreate(emptySetupState, createdCustomSeason);
    const selectedSeason = next.seasons.find(
      (season) => season.seasonCycleId === createdCustomSeason.seasonCycleId,
    );

    expect(selectedSeason?.name).not.toBe("2026 Golf Season");
    expect(formatSeasonOptionLabel(createdCustomSeason)).not.toBe("2026 Golf Season");
  });

  it("removes the empty seasons state after successful create", () => {
    const next = resolveSetupStateAfterSeasonCreate(emptySetupState, createdCustomSeason);

    expect(emptySetupState.seasons.length).toBe(0);
    expect(next.seasons.length).toBe(1);
    expect(next.seasons[0]?.seasonCycleId).toBe("season-custom-1");
  });

  it("keeps generated default season labeling before a custom create", () => {
    expect(
      formatSeasonOptionLabel({
        ...createdCustomSeason,
        id: "season-default-1",
        seasonCycleId: "season-default-1",
        name: "2026 Golf Season",
      }),
    ).toBe("2026 Golf Season");
  });
});

describe("resolveCompetitionSeasonPhaseForDate", () => {
  const createdPhases = [
    {
      phaseId: "created-off-season-id",
      seasonCycleId: "season-1",
      phase: "OFF_SEASON",
      startDate: "2026-06-01T00:00:00.000Z",
      endDate: "2026-07-31T00:00:00.000Z",
    },
    {
      phaseId: "created-pre-season-id",
      seasonCycleId: "season-1",
      phase: "PRE_SEASON",
      startDate: "2026-08-01T00:00:00.000Z",
      endDate: "2026-09-30T00:00:00.000Z",
    },
    {
      phaseId: "created-in-season-id",
      seasonCycleId: "season-1",
      phase: "IN_SEASON",
      startDate: "2026-10-01T00:00:00.000Z",
      endDate: "2027-05-31T00:00:00.000Z",
    },
  ];

  it("maps a competition date inside IN_SEASON to the created IN_SEASON phase id", () => {
    expect(
      resolveCompetitionSeasonPhaseForDate({
        phases: createdPhases,
        competitionDate: "2027-01-14",
      })?.phaseId,
    ).toBe("created-in-season-id");
  });

  it("returns null when the competition date is outside all created phases", () => {
    expect(
      resolveCompetitionSeasonPhaseForDate({
        phases: createdPhases,
        competitionDate: "2027-06-01",
      }),
    ).toBeNull();
  });

  it("uses created phase ids rather than default phase labels", () => {
    const phase = resolveCompetitionSeasonPhaseForDate({
      phases: createdPhases,
      competitionDate: "2027-01-14",
    });

    expect(phase?.phase).toBe("IN_SEASON");
    expect(phase?.phaseId).toBe("created-in-season-id");
    expect(phase?.phaseId).not.toBe("IN_SEASON");
  });

  it("preserves existing created phase ranges for non-competition season setup", () => {
    expect(
      resolveCompetitionSeasonPhaseForDate({
        phases: createdPhases,
        competitionDate: "2026-06-01",
      })?.phaseId,
    ).toBe("created-off-season-id");
    expect(
      resolveCompetitionSeasonPhaseForDate({
        phases: createdPhases,
        competitionDate: "2026-09-30",
      })?.phaseId,
    ).toBe("created-pre-season-id");
  });
});

describe("resolveDomainReleaseVisible", () => {
  it("uses legacy release visibility only when assignment context is missing", () => {
    expect(
      resolveDomainReleaseVisible({
        assignmentReleaseMode: undefined,
        assignmentDomainContext: undefined,
        legacyCanRelease: true,
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(true);

    expect(
      resolveDomainReleaseVisible({
        assignmentReleaseMode: undefined,
        assignmentDomainContext: undefined,
        legacyCanRelease: false,
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(false);
  });

  it("allows Head Coach approval release only when assignment mode and canRelease allow it", () => {
    expect(
      resolveDomainReleaseVisible({
        assignmentReleaseMode: "HEAD_COACH_APPROVAL",
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "domain-coach",
          ownerCoachProfileId: "domain-profile",
          ownedByCurrentUser: false,
          canOpen: true,
          canGenerate: false,
          canRevise: false,
          canSubmitForReview: false,
          canApprove: true,
          canRelease: true,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        requiredReleaseMode: "HEAD_COACH_APPROVAL",
        legacyCanRelease: true,
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(true);

    expect(
      resolveDomainReleaseVisible({
        assignmentReleaseMode: "HEAD_COACH_APPROVAL",
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "domain-coach",
          ownerCoachProfileId: "domain-profile",
          ownedByCurrentUser: false,
          canOpen: true,
          canGenerate: false,
          canRevise: false,
          canSubmitForReview: false,
          canApprove: true,
          canRelease: false,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        requiredReleaseMode: "HEAD_COACH_APPROVAL",
        legacyCanRelease: true,
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(false);
  });

  it("allows direct domain release only when assignment mode and canRelease allow it", () => {
    expect(
      resolveDomainReleaseVisible({
        assignmentReleaseMode: "DIRECT_DOMAIN_RELEASE",
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "domain-coach",
          ownerCoachProfileId: "domain-profile",
          ownedByCurrentUser: true,
          canOpen: true,
          canGenerate: true,
          canRevise: true,
          canSubmitForReview: false,
          canApprove: false,
          canRelease: true,
          releaseMode: "DIRECT_DOMAIN_RELEASE",
        },
        requiredReleaseMode: "DIRECT_DOMAIN_RELEASE",
        legacyCanRelease: true,
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(true);

    expect(
      resolveDomainReleaseVisible({
        assignmentReleaseMode: "HEAD_COACH_APPROVAL",
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "domain-coach",
          ownerCoachProfileId: "domain-profile",
          ownedByCurrentUser: true,
          canOpen: true,
          canGenerate: true,
          canRevise: true,
          canSubmitForReview: false,
          canApprove: false,
          canRelease: true,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        requiredReleaseMode: "DIRECT_DOMAIN_RELEASE",
        legacyCanRelease: true,
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(false);
  });

  it("hides Workflow 3 non-owned domain release when assignment denies canRelease", () => {
    expect(
      resolveDomainReleaseVisible({
        assignmentReleaseMode: "DIRECT_DOMAIN_RELEASE",
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "other-domain-coach",
          ownerCoachProfileId: "other-domain-profile",
          ownedByCurrentUser: false,
          canOpen: true,
          canGenerate: false,
          canRevise: false,
          canSubmitForReview: false,
          canApprove: false,
          canRelease: false,
          releaseMode: "DIRECT_DOMAIN_RELEASE",
        },
        requiredReleaseMode: "DIRECT_DOMAIN_RELEASE",
        legacyCanRelease: true,
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(false);
  });

  it("still requires existing release state and plan/version ids after assignment permission passes", () => {
    expect(
      resolveDomainReleaseVisible({
        assignmentReleaseMode: "HEAD_COACH_APPROVAL",
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "domain-coach",
          ownerCoachProfileId: "domain-profile",
          ownedByCurrentUser: false,
          canOpen: true,
          canGenerate: false,
          canRevise: false,
          canSubmitForReview: false,
          canApprove: true,
          canRelease: true,
          releaseMode: "HEAD_COACH_APPROVAL",
        },
        requiredReleaseMode: "HEAD_COACH_APPROVAL",
        legacyCanRelease: false,
        planId: "plan-1",
        versionId: "version-1",
      }),
    ).toBe(false);

    expect(
      resolveDomainReleaseVisible({
        assignmentReleaseMode: "DIRECT_DOMAIN_RELEASE",
        assignmentDomainContext: {
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: "domain-coach",
          ownerCoachProfileId: "domain-profile",
          ownedByCurrentUser: true,
          canOpen: true,
          canGenerate: true,
          canRevise: true,
          canSubmitForReview: false,
          canApprove: false,
          canRelease: true,
          releaseMode: "DIRECT_DOMAIN_RELEASE",
        },
        requiredReleaseMode: "DIRECT_DOMAIN_RELEASE",
        legacyCanRelease: true,
        planId: "plan-1",
        versionId: null,
      }),
    ).toBe(false);
  });
});

describe("resolveTrainingPlanShellOwnership", () => {
  it("resolves Head Coach release ownership for a Head Coach with no generation function", () => {
    expect(
      resolveTrainingPlanShellOwnership({
        isCoachSetupLoaded: true,
        coachUserId: "coach-1",
        athleteId: "athlete-1",
        entityId: "entity-1",
        hasHeadCoachConfigured: true,
        trainingPlanReleaseMode: "HEAD_COACH_RELEASE",
        headCoachOwnsPlanningContext: true,
        skillsCoachOwnsPlanningContext: false,
        academyCoachRole: "HEAD_COACH",
        coachAssignedGenerationDomains: [],
      }),
    ).toEqual({
      planningContextShellOwner: "head_coach",
      releaseMode: "head_coach_review",
    });
  });

  it("keeps Head Coach release ownership with Head Coach plus Skills function", () => {
    expect(
      resolveTrainingPlanShellOwnership({
        isCoachSetupLoaded: true,
        coachUserId: "coach-1",
        athleteId: "athlete-1",
        entityId: "entity-1",
        hasHeadCoachConfigured: true,
        trainingPlanReleaseMode: "HEAD_COACH_RELEASE",
        headCoachOwnsPlanningContext: true,
        skillsCoachOwnsPlanningContext: false,
        academyCoachRole: "HEAD_COACH",
        coachAssignedGenerationDomains: ["SKILLS"],
      }),
    ).toEqual({
      planningContextShellOwner: "head_coach",
      releaseMode: "head_coach_review",
    });
  });

  it("resolves Direct Release without a Head Coach to the Skills Coach owner", () => {
    expect(
      resolveTrainingPlanShellOwnership({
        isCoachSetupLoaded: true,
        coachUserId: "coach-1",
        athleteId: "athlete-1",
        entityId: "entity-1",
        hasHeadCoachConfigured: false,
        trainingPlanReleaseMode: "DIRECT_RELEASE",
        headCoachOwnsPlanningContext: false,
        skillsCoachOwnsPlanningContext: true,
        academyCoachRole: "COACH",
        coachAssignedGenerationDomains: ["SKILLS"],
      }),
    ).toEqual({
      planningContextShellOwner: "skills_coach",
      releaseMode: "direct_release",
    });
  });

  it("keeps Nutrition waiting in Direct Release without a Head Coach", () => {
    expect(
      resolveTrainingPlanShellOwnership({
        isCoachSetupLoaded: true,
        coachUserId: "coach-1",
        athleteId: "athlete-1",
        entityId: "entity-1",
        hasHeadCoachConfigured: false,
        trainingPlanReleaseMode: "DIRECT_RELEASE",
        headCoachOwnsPlanningContext: false,
        skillsCoachOwnsPlanningContext: true,
        academyCoachRole: "COACH",
        coachAssignedGenerationDomains: ["NUTRITION"],
      }),
    ).toEqual({
      planningContextShellOwner: "waiting_role",
      releaseMode: "direct_release",
    });
  });

  it("keeps S&C waiting in Direct Release without a Head Coach", () => {
    expect(
      resolveTrainingPlanShellOwnership({
        isCoachSetupLoaded: true,
        coachUserId: "coach-1",
        athleteId: "athlete-1",
        entityId: "entity-1",
        hasHeadCoachConfigured: false,
        trainingPlanReleaseMode: "DIRECT_RELEASE",
        headCoachOwnsPlanningContext: false,
        skillsCoachOwnsPlanningContext: true,
        academyCoachRole: "COACH",
        coachAssignedGenerationDomains: ["S_AND_C"],
      }),
    ).toEqual({
      planningContextShellOwner: "waiting_role",
      releaseMode: "direct_release",
    });
  });
});

describe("resolveNoHeadCoachDirectReleaseLockedPlanningContext", () => {
  it("treats lock flags as locked", () => {
    expect(
      resolveNoHeadCoachDirectReleaseLockedPlanningContext({
        planningContextLocked: false,
        upstreamPlanningContextLocked: true,
        planWindow: null,
        seasonCycleId: null,
        goalIds: [],
        startDate: null,
        endDate: null,
        phase: null,
        workloadSummary: {
          weeklyTrainingHours: null,
          recommendedMinHours: null,
          recommendedMaxHours: null,
          status: null,
          sportCode: null,
          validatedLevel: null,
        },
        season: null,
        workload: null,
        goals: [],
        planningContext: {
          seasonCycleId: null,
          goalIds: [],
          lockedGoalIds: [],
          startDate: null,
          endDate: null,
          phase: null,
          validatedLevel: null,
          season: null,
          workload: null,
          goals: [],
        },
        blockers: [],
        raw: {},
      }),
    ).toBe(true);
  });

  it("treats a blocker-free shared plan window as locked for no-HC direct release", () => {
    expect(
      resolveNoHeadCoachDirectReleaseLockedPlanningContext({
        planningContextLocked: false,
        upstreamPlanningContextLocked: false,
        planWindow: { startDate: "2026-06-20", endDate: "2026-06-26" },
        seasonCycleId: null,
        goalIds: [],
        startDate: null,
        endDate: null,
        phase: null,
        workloadSummary: {
          weeklyTrainingHours: null,
          recommendedMinHours: null,
          recommendedMaxHours: null,
          status: null,
          sportCode: null,
          validatedLevel: null,
        },
        season: null,
        workload: null,
        goals: [],
        planningContext: {
          seasonCycleId: null,
          goalIds: [],
          lockedGoalIds: [],
          startDate: null,
          endDate: null,
          phase: null,
          validatedLevel: null,
          season: null,
          workload: null,
          goals: [],
        },
        blockers: [],
        raw: {},
      }),
    ).toBe(true);
  });

  it("does not treat a shared plan window with blockers as locked", () => {
    expect(
      resolveNoHeadCoachDirectReleaseLockedPlanningContext({
        planningContextLocked: false,
        upstreamPlanningContextLocked: false,
        planWindow: { startDate: "2026-06-20", endDate: "2026-06-26" },
        seasonCycleId: null,
        goalIds: [],
        startDate: null,
        endDate: null,
        phase: null,
        workloadSummary: {
          weeklyTrainingHours: null,
          recommendedMinHours: null,
          recommendedMaxHours: null,
          status: null,
          sportCode: null,
          validatedLevel: null,
        },
        season: null,
        workload: null,
        goals: [],
        planningContext: {
          seasonCycleId: null,
          goalIds: [],
          lockedGoalIds: [],
          startDate: null,
          endDate: null,
          phase: null,
          validatedLevel: null,
          season: null,
          workload: null,
          goals: [],
        },
        blockers: ["Missing level validation"],
        raw: {},
      }),
    ).toBe(false);
  });
});

describe("resolveTrainingPlanWorkflowMode", () => {
  it("waits until coach setup is loaded before choosing a shell", () => {
    expect(
      resolveTrainingPlanWorkflowMode({
        isCoachSetupLoaded: false,
        coachUserId: "coach-1",
        athleteId: "athlete-1",
        entityId: "entity-1",
        academyCoachRole: "HEAD_COACH",
        hasHeadCoachConfigured: true,
        coachAssignedGenerationDomains: [],
        isPlanningContextResolved: false,
        areHeadCoachDomainPlansResolved: false,
        planningContextLocked: false,
        hasSubmittedDomainPlans: false,
      }),
    ).toBe("loading");
  });

  it("waits for planning context and submitted-plan state before resolving pure Head Coach shell", () => {
    expect(
      resolveTrainingPlanWorkflowMode({
        isCoachSetupLoaded: true,
        coachUserId: "coach-1",
        athleteId: "athlete-1",
        entityId: "entity-1",
        academyCoachRole: "HEAD_COACH",
        hasHeadCoachConfigured: true,
        coachAssignedGenerationDomains: [],
        isPlanningContextResolved: false,
        areHeadCoachDomainPlansResolved: false,
        planningContextLocked: false,
        hasSubmittedDomainPlans: false,
      }),
    ).toBe("loading");
  });

  it("uses head_coach_planning for Head Coach with no function before context is locked", () => {
    expect(
      resolveTrainingPlanWorkflowMode({
        isCoachSetupLoaded: true,
        coachUserId: "coach-1",
        athleteId: "athlete-1",
        entityId: "entity-1",
        academyCoachRole: "HEAD_COACH",
        hasHeadCoachConfigured: true,
        coachAssignedGenerationDomains: [],
        isPlanningContextResolved: true,
        areHeadCoachDomainPlansResolved: true,
        planningContextLocked: false,
        hasSubmittedDomainPlans: false,
      }),
    ).toBe("head_coach_planning");
  });

  it("uses head_coach_review for Head Coach with no function once context is locked", () => {
    expect(
      resolveTrainingPlanWorkflowMode({
        isCoachSetupLoaded: true,
        coachUserId: "coach-1",
        athleteId: "athlete-1",
        entityId: "entity-1",
        academyCoachRole: "HEAD_COACH",
        hasHeadCoachConfigured: true,
        coachAssignedGenerationDomains: [],
        isPlanningContextResolved: true,
        areHeadCoachDomainPlansResolved: true,
        planningContextLocked: true,
        hasSubmittedDomainPlans: false,
      }),
    ).toBe("head_coach_review");
  });

  it("uses head_coach_review for Head Coach with no function when submitted domain plans already exist", () => {
    expect(
      resolveTrainingPlanWorkflowMode({
        isCoachSetupLoaded: true,
        coachUserId: "coach-1",
        athleteId: "athlete-1",
        entityId: "entity-1",
        academyCoachRole: "HEAD_COACH",
        hasHeadCoachConfigured: true,
        coachAssignedGenerationDomains: [],
        isPlanningContextResolved: true,
        areHeadCoachDomainPlansResolved: true,
        planningContextLocked: false,
        hasSubmittedDomainPlans: true,
      }),
    ).toBe("head_coach_review");
  });

  it("uses head_coach_function_aware for Head Coach with Skills function assigned when assignment allows generation", () => {
    expect(
      resolveTrainingPlanWorkflowMode({
        isCoachSetupLoaded: true,
        coachUserId: "coach-1",
        athleteId: "athlete-1",
        entityId: "entity-1",
        academyCoachRole: "HEAD_COACH",
        hasHeadCoachConfigured: true,
        coachAssignedGenerationDomains: ["SKILLS"],
        isPlanningContextResolved: true,
        areHeadCoachDomainPlansResolved: true,
        planningContextLocked: false,
        hasSubmittedDomainPlans: false,
        headCoachOwnsAssignedDomainGeneration: true,
      }),
    ).toBe("head_coach_function_aware");
  });

  it("uses head_coach_review for Head Coach with Skills function when Skills Coach owns generation (athlete22)", () => {
    expect(
      resolveTrainingPlanWorkflowMode({
        isCoachSetupLoaded: true,
        coachUserId: "coach-1",
        athleteId: "athlete-22",
        entityId: "entity-1",
        academyCoachRole: "HEAD_COACH",
        hasHeadCoachConfigured: true,
        coachAssignedGenerationDomains: ["SKILLS"],
        isPlanningContextResolved: true,
        areHeadCoachDomainPlansResolved: true,
        planningContextLocked: true,
        hasSubmittedDomainPlans: false,
        headCoachOwnsAssignedDomainGeneration: false,
      }),
    ).toBe("head_coach_review");
  });

  it("keeps Workflow 2A Head Coach plus Skills owner on the function-aware Skills shell after lock", () => {
    const workspace = workflow2AHeadCoachOwnedSkillsWorkspace();
    const headCoachOwnsSkills = workspaceHeadCoachOwnsSkillsForAthlete(workspace);

    expect(workspace.workflowShape).toBe("HEAD_COACH_SKILLS_OWNER");
    expect(workspace.shell).toBe("HEAD_COACH_FUNCTION_AWARE");
    const staleWorkflowModeWorkspace = workflow2AHeadCoachOwnedSkillsWorkspace({
      workflowMode: "HEAD_COACH_REVIEW",
    });
    expect(resolveWorkflowModeFromWorkspace(staleWorkflowModeWorkspace)).toBe(
      "head_coach_function_aware",
    );
    expect(workspace.currentDomain).toBe("SKILLS");
    expect(workspace.initialTab).toBe("DOMAIN");
    expect(parseWorkspaceInitialTab(workspace.initialTab)).toBe("generate");
    expect(workspace.ownershipFlags.requesterIsHeadCoach).toBe(true);
    expect(workspace.ownershipFlags.requesterOwnsCurrentDomain).toBe(true);
    expect(workspace.ownershipFlags.requesterOwnsSkillsForThisAthlete).toBe(true);
    expect(workspace.ownershipFlags.requesterOwnsNutritionForThisAthlete).toBe(false);
    expect(workspace.ownershipFlags.requesterOwnsStrengthForThisAthlete).toBe(false);
    expect(headCoachOwnsSkills).toBe(true);
    expect(workspace.domains.SKILLS.reviewAccess).toBe("HEAD_COACH");
    expect(workspace.domains.SKILLS.canOpen).toBe(true);
    expect(workspace.domains.SKILLS.allowedActions).toEqual([]);
    expect(workspace.domains.SKILLS.summary.status).toBeNull();
    expect(workspace.domains.SKILLS.summary.trainingPlanId).toBeNull();
    expect(workspace.domains.SKILLS.summary.versionId).toBeNull();

    expect(
      resolveWorkflowResetScopeMode({
        workspace: staleWorkflowModeWorkspace,
        isHeadCoachPlanningContextOwner: true,
        planningContextLocked: true,
        workflowMode: "head_coach_review",
      }),
    ).toBe("head_coach_function_aware");
    expect(workspaceHeadCoachCanCreateSkillsPlan(workspace, false)).toBe(true);
    expect(workflow2AHeadCoachStep6Intro("head_coach_function_aware")).not.toBe(
      "Head Coach mode focuses on locking planning context and reviewing submitted domain plans.",
    );
    expect(
      headCoachSubmittedReviewDomains({
        shell: "head_coach_function_aware",
        headCoachOwnsSkills,
      }),
    ).toEqual(["NUTRITION", "S_AND_C"]);
  });

  it("uses locked workspace goals for Workflow 2A Skills generation when local goals are stale", () => {
    const workspace = workflow2AHeadCoachOwnedSkillsWorkspace({
      planningContext: {
        locked: true,
        resolved: true,
        lockId: "lock-1",
        snapshotId: "snapshot-1",
        selectedSeasonCycleId: "season-1",
        planStartDate: "2026-06-20",
        planEndDate: "2026-06-26",
        selectedGoalsSnapshot: [
          {
            goalId: "goal-1",
            goalName: "Improve first touch",
            status: "ACTIVE",
            domain: "SKILLS",
          },
        ],
        athletePlanningContextSnapshot: {
          goals: [],
        },
      },
    });
    const lockedGoalIds = readLockedWorkspaceGoalIds({
      selectedGoalsSnapshot: workspace.planningContext.selectedGoalsSnapshot,
      athletePlanningContextSnapshot:
        workspace.planningContext.athletePlanningContextSnapshot,
      goalIds: workspace.planningContext.goalIds,
      lockedGoalIds: workspace.planningContext.lockedGoalIds,
    });
    const canUseLockedContext = canGenerateFromLockedPlanningContextForDomain({
      domain: "SKILLS",
      effectiveDownstreamPlanningContextLocked: workspace.planningContext.locked,
      ownershipFlags: {
        canGeneratePlan: true,
        canGenerateCurrentDomainPlan: true,
      },
      lockedSeasonCycleId: workspace.planningContext.selectedSeasonCycleId,
      lockedPlanWindowStart: workspace.planningContext.planStartDate,
      lockedPlanWindowEnd: workspace.planningContext.planEndDate,
      lockedSportCode: "TENNIS",
    });
    const localSelectedGoalsLength = 0;

    expect(readWorkspaceSnapshotGoalCount(workspace.planningContext.selectedGoalsSnapshot)).toBe(1);
    expect(lockedGoalIds).toEqual(["goal-1"]);
    expect(workspaceHeadCoachCanCreateSkillsPlan(workspace, false)).toBe(true);
    expect(
      resolveGeneratePlanLocalError({
        entityId: "entity-1",
        athleteId: "athlete-24",
        generationDomain: "SKILLS",
        selectedSeasonCycleId: null,
        selectedGoalCount: lockedGoalIds.length,
        sportCode: "TENNIS",
        selectedSeason: null,
        currentPhase: null,
        planStartDate: "",
        planEndDate: "",
        canUseLockedPlanningContextForGeneration: canUseLockedContext,
        lockedSeasonCycleId: workspace.planningContext.selectedSeasonCycleId,
        lockedPlanWindowStart: workspace.planningContext.planStartDate,
        lockedPlanWindowEnd: workspace.planningContext.planEndDate,
      }),
    ).toBeNull();
    expect(localSelectedGoalsLength).toBe(0);
  });

  it("shows the active-goal blocker only when locked workspace context has no goals", () => {
    const workspace = workflow2AHeadCoachOwnedSkillsWorkspace({
      planningContext: {
        locked: true,
        resolved: true,
        lockId: "lock-1",
        snapshotId: "snapshot-1",
        selectedSeasonCycleId: "season-1",
        planStartDate: "2026-06-20",
        planEndDate: "2026-06-26",
        selectedGoalsSnapshot: [],
        athletePlanningContextSnapshot: {
          goals: [],
        },
      },
    });
    const lockedGoalIds = readLockedWorkspaceGoalIds({
      selectedGoalsSnapshot: workspace.planningContext.selectedGoalsSnapshot,
      athletePlanningContextSnapshot:
        workspace.planningContext.athletePlanningContextSnapshot,
      goalIds: workspace.planningContext.goalIds,
      lockedGoalIds: workspace.planningContext.lockedGoalIds,
    });

    expect(readWorkspaceSnapshotGoalCount(workspace.planningContext.selectedGoalsSnapshot)).toBe(0);
    expect(
      readWorkspaceSnapshotGoalCount(
        workspace.planningContext.athletePlanningContextSnapshot,
      ),
    ).toBe(0);
    expect(lockedGoalIds).toEqual([]);
    expect(
      resolveGeneratePlanLocalError({
        entityId: "entity-1",
        athleteId: "athlete-24",
        generationDomain: "SKILLS",
        selectedSeasonCycleId: null,
        selectedGoalCount: lockedGoalIds.length,
        sportCode: "TENNIS",
        selectedSeason: null,
        currentPhase: null,
        planStartDate: "",
        planEndDate: "",
        canUseLockedPlanningContextForGeneration: true,
        lockedSeasonCycleId: workspace.planningContext.selectedSeasonCycleId,
        lockedPlanWindowStart: workspace.planningContext.planStartDate,
        lockedPlanWindowEnd: workspace.planningContext.planEndDate,
      }),
    ).toBe("Select at least one active goal before generating a plan.");
  });

  it("resolves Workflow 2 Head Coach Skills View Plan from workspace summary ids", () => {
    const workspace = workflow2AHeadCoachOwnedSkillsWorkspace({
      domains: {
        ...workflow2AHeadCoachOwnedSkillsWorkspace().domains,
        SKILLS: {
          ...workflow2AHeadCoachOwnedSkillsWorkspace().domains.SKILLS,
          summary: {
            trainingPlanId: "workspace-skills-plan",
            versionId: "workspace-skills-version",
            generationDomain: "SKILLS",
            status: "AI_GENERATED",
            versionNumber: 1,
          },
        },
      },
    });

    expect(
      resolveWorkspaceDomainViewPlanContext({
        workspace,
        domain: "SKILLS",
        fallbackPlanId: null,
        fallbackVersionId: null,
      }),
    ).toEqual({
      planId: "workspace-skills-plan",
      versionId: "workspace-skills-version",
      status: "AI_GENERATED",
      source: "workspace.domains.SKILLS.summary",
    });
    expect(
      shouldRenderWorkspaceDomainPlanContent({
        shell: "head_coach_function_aware",
        clickedDomain: "SKILLS",
        detailDomain: "SKILLS",
        hasDetail: true,
      }),
    ).toBe(true);
    expect(resolveWorkflowModeFromWorkspace({
      ...workspace,
      workflowMode: "HEAD_COACH_REVIEW",
    })).toBe("head_coach_function_aware");
  });

  it("uses Workflow 2A Skills workspace summary for action context when other domains are not created", () => {
    const base = workflow2AHeadCoachOwnedSkillsWorkspace();
    const workspace = workflow2AHeadCoachOwnedSkillsWorkspace({
      domains: {
        ...base.domains,
        SKILLS: {
          ...base.domains.SKILLS,
          summary: {
            trainingPlanId: "plan-skills-1",
            versionId: "version-skills-1",
            latestVersionId: "version-skills-1",
            approvedVersionId: "version-skills-1",
            activeVersionId: "version-skills-1",
            versionNumber: 1,
            status: "ACTIVE",
            generationDomain: "SKILLS",
          },
          allowedActions: [],
        },
        NUTRITION: {
          ...base.domains.NUTRITION,
          summary: {
            ...base.domains.NUTRITION.summary,
            trainingPlanId: null,
            versionId: null,
            status: null,
          },
        },
        S_AND_C: {
          ...base.domains.S_AND_C,
          summary: {
            ...base.domains.S_AND_C.summary,
            trainingPlanId: null,
            versionId: null,
            status: null,
          },
        },
      },
    });

    expect(isHeadCoachSkillsOwnerWorkflow(workspace)).toBe(true);
    expect(
      resolveWorkflowActionContext({
        workspace,
        legacyContext: {
          planId: "legacy-nutrition-plan",
          versionId: "legacy-nutrition-version",
          generationDomain: "NUTRITION",
        },
        legacyAllowedActions: ["HEAD_APPROVE"],
        currentDomain: "NUTRITION",
      }),
    ).toEqual({
      planId: "plan-skills-1",
      versionId: "version-skills-1",
      generationDomain: "SKILLS",
      versionNumber: 1,
      status: "ACTIVE",
      allowedActions: [],
      source: "workspace.domains.SKILLS.summary",
    });
    expect(deriveWorkflowStatusFromWorkspaceDomain(workspace.domains.SKILLS)).toBe("released");
    expect(
      resolveHeadCoachSubmittedReviewCardDomains({
        shell: "head_coach_function_aware",
        headCoachOwnsSkills: true,
        workspace,
      }),
    ).toEqual(["NUTRITION", "S_AND_C"]);
    expect(deriveWorkflowStatusFromWorkspaceDomain(workspace.domains.NUTRITION)).toBe(
      "not_created",
    );
    expect(deriveWorkflowStatusFromWorkspaceDomain(workspace.domains.S_AND_C)).toBe("not_created");
  });

  it("resolves Workflow 2A Head Coach review actions from the reviewed domain summary", () => {
    const base = workflow2AHeadCoachOwnedSkillsWorkspace();
    const workspace = workflow2AHeadCoachOwnedSkillsWorkspace({
      domains: {
        ...base.domains,
        SKILLS: {
          ...base.domains.SKILLS,
          summary: {
            trainingPlanId: "de729d07-cba3-4f01-a220-bedab4af4b88",
            versionId: "1399cc59-bc78-4c24-8a32-6794c2fc460e",
            selectedVersionId: "1399cc59-bc78-4c24-8a32-6794c2fc460e",
            latestVersionId: "1399cc59-bc78-4c24-8a32-6794c2fc460e",
            approvedVersionId: "1399cc59-bc78-4c24-8a32-6794c2fc460e",
            activeVersionId: "1399cc59-bc78-4c24-8a32-6794c2fc460e",
            versionNumber: 1,
            status: "ACTIVE",
            generationDomain: "SKILLS",
          },
          allowedActions: [],
        },
        NUTRITION: {
          ...base.domains.NUTRITION,
          summary: {
            trainingPlanId: "e1f80d9c-52af-46ef-a1d0-43be05655c47",
            versionId: null,
            selectedVersionId: "04d31412-fc3e-434b-a206-9924b2d2fd44",
            latestVersionId: "04d31412-fc3e-434b-a206-9924b2d2fd44",
            approvedVersionId: null,
            activeVersionId: null,
            versionNumber: 1,
            status: "ASSISTANT_COACH_APPROVED",
            generationDomain: "NUTRITION",
          },
          allowedActions: ["HEAD_APPROVE", "REQUEST_REVISION"],
        },
        S_AND_C: {
          ...base.domains.S_AND_C,
          summary: {
            trainingPlanId: "e2daeb66-b6fa-4b07-b2aa-42f8a55f40c2",
            versionId: null,
            selectedVersionId: "2ab433a2-1efe-4844-94c1-e7f80f74aa33",
            latestVersionId: "2ab433a2-1efe-4844-94c1-e7f80f74aa33",
            approvedVersionId: null,
            activeVersionId: null,
            versionNumber: 1,
            status: "ASSISTANT_COACH_APPROVED",
            generationDomain: "S_AND_C",
          },
          allowedActions: ["HEAD_APPROVE", "REQUEST_REVISION"],
        },
      },
    });

    expect(
      resolveHeadCoachReviewActionContext({
        workspace,
        domain: "NUTRITION",
        fallbackPlanId: "de729d07-cba3-4f01-a220-bedab4af4b88",
        fallbackVersionId: "1399cc59-bc78-4c24-8a32-6794c2fc460e",
      }),
    ).toEqual({
      planId: "e1f80d9c-52af-46ef-a1d0-43be05655c47",
      versionId: "04d31412-fc3e-434b-a206-9924b2d2fd44",
      generationDomain: "NUTRITION",
    });
    expect(
      resolveHeadCoachReviewActionContext({
        workspace,
        domain: "S_AND_C",
        fallbackPlanId: "de729d07-cba3-4f01-a220-bedab4af4b88",
        fallbackVersionId: "1399cc59-bc78-4c24-8a32-6794c2fc460e",
      }),
    ).toEqual({
      planId: "e2daeb66-b6fa-4b07-b2aa-42f8a55f40c2",
      versionId: "2ab433a2-1efe-4844-94c1-e7f80f74aa33",
      generationDomain: "S_AND_C",
    });
  });

  it("resolves Workflow 2B Head Coach review actions from each clicked domain summary", () => {
    const base = workflow2AHeadCoachOwnedSkillsWorkspace();
    const workspace = workflow2AHeadCoachOwnedSkillsWorkspace({
      assignmentContext: shellAssignmentContext({
        hasHeadCoach: true,
        releaseMode: "HEAD_COACH_APPROVAL",
        domains: {
          SKILLS: shellAssignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: true,
            canRequestRevision: true,
          }),
          NUTRITION: shellAssignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: true,
            canRequestRevision: true,
          }),
          S_AND_C: shellAssignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: true,
            canRequestRevision: true,
          }),
        },
      }),
      domains: {
        ...base.domains,
        SKILLS: {
          ...base.domains.SKILLS,
          summary: {
            trainingPlanId: "skills-plan",
            versionId: null,
            selectedVersionId: "skills-selected-version",
            latestVersionId: "skills-latest-version",
            approvedVersionId: "skills-approved-version",
            activeVersionId: "skills-active-version",
            versionNumber: 1,
            status: "ASSISTANT_COACH_APPROVED",
            generationDomain: "SKILLS",
          },
          allowedActions: ["HEAD_APPROVE", "REQUEST_REVISION"],
        },
        NUTRITION: {
          ...base.domains.NUTRITION,
          summary: {
            trainingPlanId: "nutrition-plan",
            versionId: null,
            selectedVersionId: "nutrition-selected-version",
            latestVersionId: "nutrition-latest-version",
            approvedVersionId: "nutrition-approved-version",
            activeVersionId: "nutrition-active-version",
            versionNumber: 1,
            status: "ASSISTANT_COACH_APPROVED",
            generationDomain: "NUTRITION",
          },
          allowedActions: ["HEAD_APPROVE", "REQUEST_REVISION"],
        },
        S_AND_C: {
          ...base.domains.S_AND_C,
          summary: {
            trainingPlanId: "sandc-plan",
            versionId: null,
            selectedVersionId: "sandc-selected-version",
            latestVersionId: "sandc-latest-version",
            approvedVersionId: "sandc-approved-version",
            activeVersionId: "sandc-active-version",
            versionNumber: 1,
            status: "ASSISTANT_COACH_APPROVED",
            generationDomain: "S_AND_C",
          },
          allowedActions: ["HEAD_APPROVE", "REQUEST_REVISION"],
        },
      },
    });

    expect(
      resolveHeadCoachReviewActionContext({
        workspace,
        domain: "SKILLS",
        fallbackPlanId: "global-skills-plan",
        fallbackVersionId: "global-skills-version",
      }),
    ).toEqual({
      planId: "skills-plan",
      versionId: "skills-selected-version",
      generationDomain: "SKILLS",
    });
    expect(
      resolveHeadCoachReviewActionContext({
        workspace,
        domain: "NUTRITION",
        fallbackPlanId: "global-skills-plan",
        fallbackVersionId: "global-skills-version",
      }),
    ).toEqual({
      planId: "nutrition-plan",
      versionId: "nutrition-selected-version",
      generationDomain: "NUTRITION",
    });
    expect(
      resolveHeadCoachReviewActionContext({
        workspace,
        domain: "S_AND_C",
        fallbackPlanId: "global-skills-plan",
        fallbackVersionId: "global-skills-version",
      }),
    ).toEqual({
      planId: "sandc-plan",
      versionId: "sandc-selected-version",
      generationDomain: "S_AND_C",
    });
  });

  it("falls back to legacy ids for non-workspace View Plan behavior", () => {
    expect(
      resolveWorkspaceDomainViewPlanContext({
        workspace: null,
        domain: "NUTRITION",
        fallbackPlanId: "legacy-nutrition-plan",
        fallbackVersionId: "legacy-nutrition-version",
        fallbackStatus: "AI_GENERATED",
        fallbackSource: "legacy activeDetail",
      }),
    ).toEqual({
      planId: "legacy-nutrition-plan",
      versionId: "legacy-nutrition-version",
      status: "AI_GENERATED",
      source: "legacy activeDetail",
    });
  });

  it("resolves Nutrition View Plan from workspace summary ids after generation", () => {
    const workspace = workflow1OwnedSkillsWorkspace({
      currentDomain: "NUTRITION",
      domains: {
        ...workflow1OwnedSkillsWorkspace().domains,
        NUTRITION: {
          ...workflow1OwnedSkillsWorkspace().domains.NUTRITION,
          summary: {
            trainingPlanId: "nutrition-plan-1",
            versionId: "nutrition-version-1",
            generationDomain: "NUTRITION",
            status: "AI_GENERATED",
            versionNumber: 1,
          },
        },
      },
    });

    expect(
      resolveWorkspaceDomainViewPlanContext({
        workspace,
        domain: "NUTRITION",
        fallbackPlanId: null,
        fallbackVersionId: null,
      }),
    ).toEqual({
      planId: "nutrition-plan-1",
      versionId: "nutrition-version-1",
      status: "AI_GENERATED",
      source: "workspace.domains.NUTRITION.summary",
    });
  });

  it("does not mark local generated Nutrition draft as persisted without plan and version ids", () => {
    expect(
      deriveAssistantDomainWorkflowStatus({
        latestDraft: {
          status: "AI_GENERATED",
          trainingPlanId: null,
          trainingPlanVersionId: null,
        } as never,
        activeDetail: null,
      }),
    ).toBe("not_created");
    expect(
      shouldShowGeneratedPlanSyncingNotice({
        generateResultMatchesCurrentDomain: true,
        currentDomainHasPersistedIds: false,
      }),
    ).toBe(true);
  });

  it("does not render Skills plan load errors inside Nutrition domain panels", () => {
    const skillsError = domainDraftLoadErrorMessage("SKILLS");

    expect(skillsError).toBe("Unable to load Skills plan. Please retry.");
    expect(
      errorForRenderedDomain({
        error: skillsError,
        errorDomain: "SKILLS",
        renderedDomain: "NUTRITION",
      }),
    ).toBeNull();
    expect(
      errorForRenderedDomain({
        error: skillsError,
        errorDomain: "SKILLS",
        renderedDomain: "SKILLS",
      }),
    ).toBe(skillsError);
  });

  it("does not render loaded Skills detail inside Nutrition domain panels", () => {
    expect(
      shouldRenderPersistedDetailForDomain({
        detailDomain: "SKILLS",
        renderedDomain: "NUTRITION",
        hasDetail: true,
      }),
    ).toBe(false);
    expect(
      shouldRenderPersistedDetailForDomain({
        detailDomain: "NUTRITION",
        renderedDomain: "NUTRITION",
        hasDetail: true,
      }),
    ).toBe(true);
    expect(
      shouldRenderPersistedDetailForDomain({
        detailDomain: "S_AND_C",
        renderedDomain: "SKILLS",
        hasDetail: true,
      }),
    ).toBe(false);
  });

  it("keeps Nutrition and S&C load errors domain-specific", () => {
    const nutritionError = domainDraftLoadErrorMessage("NUTRITION");
    const sandCError = domainDraftLoadErrorMessage("S_AND_C");

    expect(nutritionError).toBe("Unable to load Nutrition plan. Please retry.");
    expect(sandCError).toBe("Unable to load S&C plan. Please retry.");
    expect(
      errorForRenderedDomain({
        error: nutritionError,
        errorDomain: "NUTRITION",
        renderedDomain: "S_AND_C",
      }),
    ).toBeNull();
  });

  it("keeps S&C revise visible for v1 and v2 editable drafts", () => {
    const v1 = resolveDomainRevisePlanIds({
      domain: "S_AND_C",
      workspace: workflow1OwnedSkillsWorkspace({
        domains: {
          ...workflow1OwnedSkillsWorkspace().domains,
          S_AND_C: {
            ...workflow1OwnedSkillsWorkspace().domains.S_AND_C,
            summary: {
              trainingPlanId: "sandc-plan",
              versionId: "sandc-v1",
              generationDomain: "S_AND_C",
              status: "AI_GENERATED",
              versionNumber: 1,
            },
          },
        },
      }),
      persistedDetailDomain: null,
      persistedPlanId: null,
      persistedVersionId: null,
      latestDraftDomain: null,
      latestDraftPlanId: null,
      latestDraftVersionId: null,
    });
    const v2 = resolveDomainRevisePlanIds({
      domain: "S_AND_C",
      workspace: workflow1OwnedSkillsWorkspace({
        domains: {
          ...workflow1OwnedSkillsWorkspace().domains,
          S_AND_C: {
            ...workflow1OwnedSkillsWorkspace().domains.S_AND_C,
            summary: {
              trainingPlanId: "sandc-plan",
              versionId: "sandc-v2",
              generationDomain: "S_AND_C",
              status: "AI_GENERATED",
              versionNumber: 2,
            },
          },
        },
      }),
      persistedDetailDomain: null,
      persistedPlanId: null,
      persistedVersionId: null,
      latestDraftDomain: null,
      latestDraftPlanId: null,
      latestDraftVersionId: null,
    });

    expect(v1).toEqual({ trainingPlanId: "sandc-plan", versionId: "sandc-v1" });
    expect(v2).toEqual({ trainingPlanId: "sandc-plan", versionId: "sandc-v2" });
    expect(
      canShowDomainReviseAction({
        workflowStatus: "draft_generated",
        reviseIds: v1,
        requesterOwnsDomain: true,
      }),
    ).toBe(true);
    expect(
      canShowDomainReviseAction({
        workflowStatus: "draft_generated",
        reviseIds: v2,
        requesterOwnsDomain: true,
      }),
    ).toBe(true);
  });

  it("keeps Nutrition and Skills revise visible for revised editable v2 drafts", () => {
    for (const domain of ["NUTRITION", "SKILLS"] as const) {
      const ids = resolveDomainRevisePlanIds({
        domain,
        workspace: null,
        persistedDetailDomain: domain,
        persistedPlanId: `${domain.toLowerCase()}-plan`,
        persistedVersionId: `${domain.toLowerCase()}-v2`,
        latestDraftDomain: null,
        latestDraftPlanId: null,
        latestDraftVersionId: null,
      });

      expect(
        canShowDomainReviseAction({
          workflowStatus: "draft_generated",
          reviseIds: ids,
          requesterOwnsDomain: true,
        }),
      ).toBe(true);
    }
  });

  it("hides domain-owner Revise Plan after submit, approval, or release", () => {
    const ids = { trainingPlanId: "plan-1", versionId: "version-1" };

    for (const workflowStatus of ["submitted_for_review", "approved", "released"] as const) {
      expect(
        canShowDomainReviseAction({
          workflowStatus,
          reviseIds: ids,
          requesterOwnsDomain: true,
        }),
      ).toBe(false);
    }
  });

  it("uses the Skills-owned planning-context tab shell in Direct Release without a Head Coach", () => {
    expect(
      resolveTrainingPlanWorkflowMode({
        isCoachSetupLoaded: true,
        coachUserId: "coach-1",
        athleteId: "athlete-1",
        entityId: "entity-1",
        academyCoachRole: "COACH",
        hasHeadCoachConfigured: false,
        trainingPlanReleaseMode: "DIRECT_RELEASE",
        coachAssignedGenerationDomains: ["SKILLS"],
        isPlanningContextResolved: true,
        areHeadCoachDomainPlansResolved: true,
        planningContextLocked: false,
        hasSubmittedDomainPlans: false,
      }),
    ).toBe("skills_coach_planning");
  });

  it("keeps Nutrition and S&C in the waiting shell for Direct Release without a Head Coach", () => {
    for (const domain of ["NUTRITION", "S_AND_C"] as const) {
      expect(
        resolveTrainingPlanWorkflowMode({
          isCoachSetupLoaded: true,
          coachUserId: "coach-1",
          athleteId: "athlete-1",
          entityId: "entity-1",
          academyCoachRole: "COACH",
          hasHeadCoachConfigured: false,
          trainingPlanReleaseMode: "DIRECT_RELEASE",
          coachAssignedGenerationDomains: [domain],
          isPlanningContextResolved: true,
          areHeadCoachDomainPlansResolved: true,
          planningContextLocked: true,
          hasSubmittedDomainPlans: false,
        }),
      ).toBe("specialist_domain");
    }
  });

  it("uses head_coach_function_aware for Head Coach with any generation function assigned when assignment allows generation", () => {
    for (const domain of ["SKILLS", "NUTRITION", "S_AND_C"] as const) {
      expect(
        resolveTrainingPlanWorkflowMode({
          isCoachSetupLoaded: true,
          coachUserId: "coach-1",
          athleteId: "athlete-1",
          entityId: "entity-1",
          academyCoachRole: "HEAD_COACH",
          hasHeadCoachConfigured: true,
          coachAssignedGenerationDomains: [domain],
          isPlanningContextResolved: true,
          areHeadCoachDomainPlansResolved: true,
          planningContextLocked: false,
          hasSubmittedDomainPlans: false,
          headCoachOwnsAssignedDomainGeneration: true,
        }),
      ).toBe("head_coach_function_aware");
    }
  });

  it("routes Skills, Nutrition, and S&C coaches to the specialist domain shell", () => {
    for (const domain of ["SKILLS", "NUTRITION", "S_AND_C"] as const) {
      expect(
        resolveTrainingPlanWorkflowMode({
          isCoachSetupLoaded: true,
          coachUserId: "coach-1",
          athleteId: "athlete-1",
          entityId: "entity-1",
          academyCoachRole: "COACH",
          hasHeadCoachConfigured: true,
          coachAssignedGenerationDomains: [domain],
          isPlanningContextResolved: true,
          areHeadCoachDomainPlansResolved: true,
          planningContextLocked: true,
          hasSubmittedDomainPlans: true,
        }),
      ).toBe("specialist_domain");
    }
  });

  it("does not infer function-aware Head Coach mode from stale review state when coach has no function", () => {
    expect(
      resolveTrainingPlanWorkflowMode({
        isCoachSetupLoaded: true,
        coachUserId: "coach-1",
        athleteId: "athlete-1",
        entityId: "entity-1",
        academyCoachRole: "HEAD_COACH",
        hasHeadCoachConfigured: true,
        coachAssignedGenerationDomains: [],
        isPlanningContextResolved: true,
        areHeadCoachDomainPlansResolved: true,
        planningContextLocked: true,
        hasSubmittedDomainPlans: true,
      }),
    ).toBe("head_coach_review");
  });
});

describe("resolveInitialTrainingPlanWorkflowTab", () => {
  it("lands pure Head Coach review on Step 6 when context is already locked", () => {
    expect(
      resolveInitialTrainingPlanWorkflowTab({
        workflowMode: "head_coach_review",
        requestedPlanId: null,
        urlPlanCandidate: null,
        planningContextLocked: true,
        hasSubmittedDomainPlans: false,
        appStepComplete: true,
        levelStepComplete: true,
        workloadComplete: true,
        seasonGoalsGateComplete: true,
        planDatesStepComplete: false,
        isDownstreamDomainCoach: false,
      }),
    ).toBe("generate");
  });

  it("lands function-aware Head Coach on Step 6 when submitted plans exist", () => {
    expect(
      resolveInitialTrainingPlanWorkflowTab({
        workflowMode: "head_coach_function_aware",
        requestedPlanId: null,
        urlPlanCandidate: null,
        planningContextLocked: false,
        hasSubmittedDomainPlans: true,
        appStepComplete: true,
        levelStepComplete: true,
        workloadComplete: true,
        seasonGoalsGateComplete: true,
        planDatesStepComplete: false,
        isDownstreamDomainCoach: false,
      }),
    ).toBe("generate");
  });

  it("lands specialist coaches on Step 6 after APP and level are ready", () => {
    expect(
      resolveInitialTrainingPlanWorkflowTab({
        workflowMode: "specialist_domain",
        requestedPlanId: null,
        urlPlanCandidate: null,
        planningContextLocked: false,
        hasSubmittedDomainPlans: false,
        appStepComplete: true,
        levelStepComplete: true,
        workloadComplete: false,
        seasonGoalsGateComplete: false,
        planDatesStepComplete: false,
        isDownstreamDomainCoach: true,
      }),
    ).toBe("generate");
  });

  it("lands Skills-owned direct-release planning shell on Step 6 when context is locked", () => {
    expect(
      resolveInitialTrainingPlanWorkflowTab({
        workflowMode: "skills_coach_planning",
        requestedPlanId: null,
        urlPlanCandidate: null,
        planningContextLocked: true,
        hasSubmittedDomainPlans: false,
        appStepComplete: true,
        levelStepComplete: true,
        workloadComplete: false,
        seasonGoalsGateComplete: false,
        planDatesStepComplete: false,
        isDownstreamDomainCoach: false,
      }),
    ).toBe("generate");
  });

  it("keeps pure Head Coach planning on the planning workflow before lock", () => {
    expect(
      resolveInitialTrainingPlanWorkflowTab({
        workflowMode: "head_coach_planning",
        requestedPlanId: null,
        urlPlanCandidate: null,
        planningContextLocked: false,
        hasSubmittedDomainPlans: false,
        appStepComplete: true,
        levelStepComplete: true,
        workloadComplete: true,
        seasonGoalsGateComplete: false,
        planDatesStepComplete: false,
        isDownstreamDomainCoach: false,
      }),
    ).toBe("workload");
  });
});

describe("resolveSkillsOwnedDirectReleaseCurrentStep", () => {
  it("resumes Skills-owned direct release to Generate when context is locked and no Skills plan exists", () => {
    expect(
      resolveSkillsOwnedDirectReleaseCurrentStep({
        workflowMode: "skills_coach_planning",
        requestedPlanId: null,
        urlPlanCandidate: null,
        planningContextLocked: true,
        skillsPlanExists: false,
        contextHasPlanWindow: true,
      }),
    ).toBe("generate");
  });

  it("resumes to Generate when context has plan window dates even without strict lock flag", () => {
    expect(
      resolveSkillsOwnedDirectReleaseCurrentStep({
        workflowMode: "skills_coach_planning",
        requestedPlanId: null,
        urlPlanCandidate: null,
        planningContextLocked: false,
        skillsPlanExists: false,
        contextHasPlanWindow: true,
      }),
    ).toBe("generate");
  });

  it("does not force Generate before planning context is locked and has no plan window", () => {
    expect(
      resolveSkillsOwnedDirectReleaseCurrentStep({
        workflowMode: "skills_coach_planning",
        requestedPlanId: null,
        urlPlanCandidate: null,
        planningContextLocked: false,
        skillsPlanExists: false,
        contextHasPlanWindow: false,
      }),
    ).toBeNull();
  });

  it("does not affect Head Coach workflow modes", () => {
    expect(
      resolveSkillsOwnedDirectReleaseCurrentStep({
        workflowMode: "head_coach_planning",
        requestedPlanId: null,
        urlPlanCandidate: null,
        planningContextLocked: true,
        skillsPlanExists: false,
        contextHasPlanWindow: true,
      }),
    ).toBeNull();
  });
});

describe("resolveTrainingPlanPageBootstrapModel", () => {
  it("waits for authenticated identity first", () => {
    expect(
      resolveTrainingPlanPageBootstrapModel({
        identityReady: false,
        assignmentReady: false,
        workflowMode: "loading",
        planningContextRequired: false,
        planningContextLoadState: "idle",
        submittedDomainPlansRequired: false,
        submittedDomainPlansLoadState: "idle",
      }),
    ).toMatchObject({ ready: false, waitingFor: "identity", shell: "loading" });
  });

  it("waits for assignment before workflow shell selection", () => {
    expect(
      resolveTrainingPlanPageBootstrapModel({
        identityReady: true,
        assignmentReady: false,
        workflowMode: "loading",
        planningContextRequired: false,
        planningContextLoadState: "idle",
        submittedDomainPlansRequired: false,
        submittedDomainPlansLoadState: "idle",
      }),
    ).toMatchObject({ ready: false, waitingFor: "assignment", shell: "loading" });
  });

  it("waits for planning context before rendering a required shell", () => {
    expect(
      resolveTrainingPlanPageBootstrapModel({
        identityReady: true,
        assignmentReady: true,
        workflowMode: "head_coach_planning",
        planningContextRequired: true,
        planningContextLoadState: "loading",
        submittedDomainPlansRequired: false,
        submittedDomainPlansLoadState: "idle",
      }),
    ).toMatchObject({ ready: false, waitingFor: "planning_context", shell: "loading" });
  });

  it("waits for submitted domain plans before rendering Head Coach review", () => {
    expect(
      resolveTrainingPlanPageBootstrapModel({
        identityReady: true,
        assignmentReady: true,
        workflowMode: "head_coach_review",
        planningContextRequired: true,
        planningContextLoadState: "loaded",
        submittedDomainPlansRequired: true,
        submittedDomainPlansLoadState: "loading",
      }),
    ).toMatchObject({
      ready: false,
      waitingFor: "submitted_domain_plans",
      shell: "loading",
    });
  });

  it("renders exactly the resolved shell after all required bootstrap states settle", () => {
    expect(
      resolveTrainingPlanPageBootstrapModel({
        identityReady: true,
        assignmentReady: true,
        workflowMode: "specialist_domain",
        planningContextRequired: true,
        planningContextLoadState: "loaded",
        submittedDomainPlansRequired: false,
        submittedDomainPlansLoadState: "idle",
      }),
    ).toMatchObject({
      ready: true,
      waitingFor: null,
      shell: "specialist_domain",
    });
  });
});

describe("deriveHeadCoachDomainWorkflowStatus", () => {
  it("treats submitted summary status as submitted for review", () => {
    expect(
      deriveHeadCoachDomainWorkflowStatus({
        summaryStatus: "ASSISTANT_COACH_APPROVED",
        summaryPlanId: "plan-skills",
        summaryVersionId: "version-skills",
        activeDetail: null,
      }),
    ).toBe("submitted_for_review");
  });

  it("treats released summary status from backend as released instead of not created", () => {
    expect(
      deriveHeadCoachDomainWorkflowStatus({
        summaryStatus: "RELEASED",
        summaryPlanId: "plan-skills",
        summaryVersionId: "version-skills",
        activeDetail: null,
      }),
    ).toBe("released");
  });

  it("does not fall back to not_created when persisted reviewable ids exist", () => {
    expect(
      deriveHeadCoachDomainWorkflowStatus({
        summaryStatus: null,
        summaryPlanId: "plan-nutrition",
        summaryVersionId: "version-nutrition",
        activeDetail: null,
      }),
    ).toBe("draft_generated");
  });

  it("uses latest draft status when domain summary is still empty", () => {
    expect(
      deriveHeadCoachDomainWorkflowStatus({
        summaryStatus: null,
        summaryPlanId: null,
        summaryVersionId: null,
        activeDetail: null,
        latestDraft: {
          trainingPlanId: "plan-skills",
          trainingPlanVersionId: "version-skills",
          versionNumber: 1,
          status: "AI_GENERATED",
          source: "AI",
          revision: null,
          durationDays: 7,
          daysCreated: 7,
          sessionsCreated: 5,
          itemsPersisted: 12,
          days: [],
          raw: null,
        },
      }),
    ).toBe("draft_generated");
  });

  it("uses workspace summary as the Head Coach review source after approval", () => {
    const workspace = workflow1OwnedSkillsWorkspace({
      domains: {
        SKILLS: {
          summary: {
            trainingPlanId: "workspace-plan-skills",
            versionId: "workspace-version-approved",
            generationDomain: "SKILLS",
            status: "HEAD_COACH_APPROVED",
            versionNumber: 2,
          },
          reviewAccess: "HEAD_COACH",
          releaseMode: null,
          submittedForReview: false,
          canOpen: true,
          allowedActions: [],
        },
        NUTRITION: workflow1OwnedSkillsWorkspace().domains.NUTRITION,
        S_AND_C: workflow1OwnedSkillsWorkspace().domains.S_AND_C,
      },
    });

    expect(
      resolveHeadCoachReviewSummarySource({
        workspace,
        domain: "SKILLS",
        legacySummary: {
          trainingPlanId: null,
          versionId: null,
          latestVersionId: null,
          approvedVersionId: null,
          activeVersionId: null,
          versionNumber: null,
          status: null,
          generationDomain: "SKILLS",
        },
      }),
    ).toEqual({
      planId: "workspace-plan-skills",
      versionId: "workspace-version-approved",
      status: "HEAD_COACH_APPROVED",
      hasWorkspaceIds: true,
    });
  });

  it("does not show no-data empty state when workspace summary has review ids", () => {
    expect(
      shouldShowHeadCoachReviewEmptyState({
        activeDetail: null,
        workspacePlanId: "workspace-plan-skills",
        workspaceVersionId: "workspace-version-approved",
        isLoading: false,
        loadError: null,
      }),
    ).toBe(false);
  });

  it("shows no-data empty state only when no detail or workspace ids exist", () => {
    expect(
      shouldShowHeadCoachReviewEmptyState({
        activeDetail: null,
        workspacePlanId: null,
        workspaceVersionId: null,
        isLoading: false,
        loadError: null,
      }),
    ).toBe(true);
  });

  it("keeps release hidden while other required domains are still submitted", () => {
    expect(
      canShowHeadCoachReviewReleaseAction({
        allowedActions: new Set(["HEAD_APPROVE", "REQUEST_REVISION"]),
        status: "HEAD_COACH_APPROVED",
      }),
    ).toBe(false);
  });

  it("shows release when backend exposes RELEASE for an approved review plan", () => {
    expect(
      canShowHeadCoachReviewReleaseAction({
        allowedActions: new Set(["RELEASE"]),
        status: "HEAD_COACH_APPROVED",
      }),
    ).toBe(true);
  });
});

describe("Workflow 1 Step 6 workspace state transitions", () => {
  it("keeps the reset scope stable across workspace review/release mode changes", () => {
    const workspace = workflow1OwnedSkillsWorkspace({
      workflowMode: "REVIEW_REQUIRED",
      shell: "HEAD_COACH_REVIEW",
    });

    expect(
      resolveWorkflowResetScopeMode({
        workspace,
        isHeadCoachPlanningContextOwner: true,
        planningContextLocked: true,
        workflowMode: "head_coach_planning",
      }),
    ).toBe("head_coach_review");
    expect(
      resolveWorkflowResetScopeMode({
        workspace: {
          ...workspace,
          workflowMode: "RELEASE_READY",
        },
        isHeadCoachPlanningContextOwner: true,
        planningContextLocked: true,
        workflowMode: "head_coach_review",
      }),
    ).toBe("head_coach_review");
  });

  it("does not block workspace refreshes after Step 6 is already loaded", () => {
    expect(
      shouldBlockWorkflowRenderForWorkspace({
        workspaceLoading: true,
        workspaceRefreshing: true,
        workspace: workflow1OwnedSkillsWorkspace(),
        isHeadCoachPlanningContextOwner: true,
        planningContextLocked: true,
        hasRenderableWorkflowFallback: true,
      }),
    ).toBe(false);
  });

  it("blocks stale legacy shell while initial locked Head Coach workspace is loading", () => {
    expect(
      shouldBlockWorkflowRenderForWorkspace({
        workspaceLoading: true,
        workspaceRefreshing: false,
        workspace: null,
        isHeadCoachPlanningContextOwner: true,
        planningContextLocked: true,
        hasRenderableWorkflowFallback: true,
      }),
    ).toBe(true);
  });
});

describe("resolveWorkflow2SubmittedDomainSkillsSlotProjection", () => {
  it("projects draft_generated for HC-owned Skills draft when summary slot is empty", () => {
    expect(
      resolveWorkflow2SubmittedDomainSkillsSlotProjection({
        summaryStatus: null,
        summaryPlanId: null,
        summaryVersionId: null,
        summaryActiveDetail: null,
        ownedLatestDraft: {
          trainingPlanId: "plan-skills",
          trainingPlanVersionId: "version-skills",
          versionNumber: 1,
          status: "AI_GENERATED",
          source: "AI",
          revision: null,
          durationDays: 7,
          daysCreated: 7,
          sessionsCreated: 5,
          itemsPersisted: 12,
          days: [],
          raw: null,
        },
        ownedActiveDetail: null,
      }),
    ).toEqual({
      workflowStatus: "draft_generated",
      planId: "plan-skills",
      versionId: "version-skills",
    });
  });

  it("prefers submitted summary status over owned draft when both exist", () => {
    expect(
      resolveWorkflow2SubmittedDomainSkillsSlotProjection({
        summaryStatus: "ASSISTANT_COACH_APPROVED",
        summaryPlanId: "plan-skills",
        summaryVersionId: "version-skills",
        summaryActiveDetail: null,
        ownedLatestDraft: {
          trainingPlanId: "plan-skills",
          trainingPlanVersionId: "version-skills",
          versionNumber: 1,
          status: "AI_GENERATED",
          source: "AI",
          revision: null,
          durationDays: 7,
          daysCreated: 7,
          sessionsCreated: 5,
          itemsPersisted: 12,
          days: [],
          raw: null,
        },
        ownedActiveDetail: null,
      }).workflowStatus,
    ).toBe("submitted_for_review");
  });
});

describe("Workflow 2 submit-review reconciliation helpers", () => {
  it("skips persisted versions fetch when domain summary status is already present", () => {
    expect(shouldSkipPersistedVersionsFetchWhenSummaryStatusPresent(null)).toBe(false);
    expect(
      shouldSkipPersistedVersionsFetchWhenSummaryStatusPresent("ASSISTANT_COACH_APPROVED"),
    ).toBe(true);
  });

  it("clears slot timeout noise once submitted-for-review is confirmed", () => {
    expect(
      shouldClearWorkflow2SkillsSubmitSlotError({
        workflowStatus: "submitted_for_review",
        slotError: "Request timed out",
      }),
    ).toBe(true);
    expect(
      shouldClearWorkflow2SkillsSubmitSlotError({
        workflowStatus: "draft_generated",
        slotError: "Request timed out",
      }),
    ).toBe(false);
  });

  it("treats submitted, approved, and released as reconciled submit outcomes", () => {
    expect(workflow2SkillsSubmitReviewReconciled("submitted_for_review")).toBe(true);
    expect(workflow2SkillsSubmitReviewReconciled("approved")).toBe(true);
    expect(workflow2SkillsSubmitReviewReconciled("released")).toBe(true);
    expect(workflow2SkillsSubmitReviewReconciled("draft_generated")).toBe(false);
  });
});

describe("resolveStep6GenerationLifecyclePhase", () => {
  it("returns pre_generation when no plan exists and generation is idle", () => {
    expect(
      resolveStep6GenerationLifecyclePhase({
        generationInProgress: false,
        hasExistingDomainPlan: false,
        persistedDetailLoaded: false,
        latestDraftLoaded: false,
        generateSuccessLoaded: false,
      }),
    ).toBe("pre_generation");
  });

  it("returns generating while a generation job is active", () => {
    expect(
      resolveStep6GenerationLifecyclePhase({
        generationInProgress: true,
        hasExistingDomainPlan: false,
        persistedDetailLoaded: false,
        latestDraftLoaded: false,
        generateSuccessLoaded: false,
      }),
    ).toBe("generating");
  });

  it("returns generated_draft when a persisted plan or latest draft is loaded", () => {
    expect(
      resolveStep6GenerationLifecyclePhase({
        generationInProgress: false,
        hasExistingDomainPlan: true,
        persistedDetailLoaded: false,
        latestDraftLoaded: false,
        generateSuccessLoaded: false,
      }),
    ).toBe("generated_draft");

    expect(
      resolveStep6GenerationLifecyclePhase({
        generationInProgress: false,
        hasExistingDomainPlan: false,
        persistedDetailLoaded: true,
        latestDraftLoaded: false,
        generateSuccessLoaded: false,
      }),
    ).toBe("generated_draft");
  });

  it("prefers generating over generated_draft while a job is still running", () => {
    expect(
      resolveStep6GenerationLifecyclePhase({
        generationInProgress: true,
        hasExistingDomainPlan: true,
        persistedDetailLoaded: true,
        latestDraftLoaded: true,
        generateSuccessLoaded: true,
      }),
    ).toBe("generating");
  });
});

describe("shouldShowStep6PreGenerationReadiness", () => {
  it("shows readiness only before generation for non-downstream coaches", () => {
    expect(
      shouldShowStep6PreGenerationReadiness({
        isDownstreamDomainCoach: false,
        lifecyclePhase: "pre_generation",
      }),
    ).toBe(true);

    expect(
      shouldShowStep6PreGenerationReadiness({
        isDownstreamDomainCoach: false,
        lifecyclePhase: "generated_draft",
      }),
    ).toBe(false);

    expect(
      shouldShowStep6PreGenerationReadiness({
        isDownstreamDomainCoach: true,
        lifecyclePhase: "pre_generation",
      }),
    ).toBe(false);
  });
});

function shellAssignmentDomain(
  overrides: Partial<
    NonNullable<TrainingPlanWorkspace["assignmentContext"]>["domains"]["SKILLS"]
  > = {},
): NonNullable<TrainingPlanWorkspace["assignmentContext"]>["domains"]["SKILLS"] {
  return {
    ownerType: "NONE",
    ownerUserId: null,
    ownerCoachProfileId: null,
    ownedByCurrentUser: false,
    canOpen: false,
    canGenerate: false,
    canRevise: false,
    canSubmitForReview: false,
    canApprove: false,
    canRequestRevision: false,
    canRelease: false,
    releaseMode: "HEAD_COACH_APPROVAL",
    ...overrides,
  };
}

function shellAssignmentContext(
  overrides: Partial<NonNullable<TrainingPlanWorkspace["assignmentContext"]>> = {},
): NonNullable<TrainingPlanWorkspace["assignmentContext"]> {
  return {
    hasHeadCoach: true,
    releaseMode: "HEAD_COACH_APPROVAL",
    planningContext: {
      ownerType: "HEAD_COACH",
      ownerUserId: "head-coach",
      ownerCoachProfileId: "head-coach-profile",
      canRead: true,
      canCreate: true,
      canLock: true,
      canManage: true,
    },
    domains: {
      SKILLS: shellAssignmentDomain(),
      NUTRITION: shellAssignmentDomain(),
      S_AND_C: shellAssignmentDomain(),
    },
    ...overrides,
  };
}

function workflow1OwnedSkillsWorkspace(
  overrides: Partial<TrainingPlanWorkspace> = {},
): TrainingPlanWorkspace {
  return {
    entityId: "entity-1",
    athleteId: "athlete-1",
    workflowShape: "WORKFLOW_1",
    shell: "specialist_domain",
    workflowMode: "specialist_domain",
    currentDomain: "SKILLS",
    initialTab: null,
    planningContext: {
      locked: true,
      resolved: true,
      lockId: "lock-1",
      snapshotId: null,
    },
    ownershipFlags: {
      hasHeadCoach: true,
      requesterIsHeadCoach: false,
      requesterHasSkillsFunction: true,
      requesterOwnsCurrentDomain: true,
      headCoachOwnsPlanningContext: true,
      directReleaseAllowed: false,
    },
    blockers: [],
    domains: {
      SKILLS: {
        summary: {
          trainingPlanId: null,
          versionId: null,
          generationDomain: "SKILLS",
          status: null,
          versionNumber: null,
        },
        reviewAccess: null,
        releaseMode: null,
        submittedForReview: false,
        canOpen: true,
        allowedActions: ["SUBMIT_REVIEW"],
      },
      NUTRITION: {
        summary: {
          trainingPlanId: null,
          versionId: null,
          generationDomain: "NUTRITION",
          status: null,
          versionNumber: null,
        },
        reviewAccess: null,
        releaseMode: null,
        submittedForReview: false,
        canOpen: false,
        allowedActions: [],
      },
      S_AND_C: {
        summary: {
          trainingPlanId: null,
          versionId: null,
          generationDomain: "S_AND_C",
          status: null,
          versionNumber: null,
        },
        reviewAccess: null,
        releaseMode: null,
        submittedForReview: false,
        canOpen: false,
        allowedActions: [],
      },
    },
    ...overrides,
  };
}

function workflow2AHeadCoachOwnedSkillsWorkspace(
  overrides: Partial<TrainingPlanWorkspace> = {},
): TrainingPlanWorkspace {
  const base = workflow1OwnedSkillsWorkspace();
  return {
    ...base,
    workflowShape: "HEAD_COACH_SKILLS_OWNER",
    shell: "HEAD_COACH_FUNCTION_AWARE",
    workflowMode: "HEAD_COACH_FUNCTION_AWARE",
    currentDomain: "SKILLS",
    initialTab: "DOMAIN",
    ownershipFlags: {
      ...base.ownershipFlags,
      hasHeadCoach: true,
      requesterIsHeadCoach: true,
      requesterHasSkillsFunction: true,
      requesterOwnsCurrentDomain: true,
      requesterOwnsSkillsForThisAthlete: true,
      requesterOwnsNutritionForThisAthlete: false,
      requesterOwnsStrengthForThisAthlete: false,
      headCoachOwnsPlanningContext: true,
      directReleaseAllowed: false,
    },
    domains: {
      SKILLS: {
        ...base.domains.SKILLS,
        reviewAccess: "HEAD_COACH",
        releaseMode: null,
        submittedForReview: false,
        canOpen: true,
        allowedActions: [],
      },
      NUTRITION: {
        ...base.domains.NUTRITION,
        reviewAccess: "HEAD_COACH",
        canOpen: true,
        allowedActions: [],
      },
      S_AND_C: {
        ...base.domains.S_AND_C,
        reviewAccess: "HEAD_COACH",
        canOpen: true,
        allowedActions: [],
      },
    },
    ...overrides,
  };
}

describe("Workflow 1 assistant domain action visibility", () => {
  it("enables create for assigned Skills coach with effective locked context and no plan", () => {
    const workspace = workflow1OwnedSkillsWorkspace({
      domains: {
        SKILLS: {
          ...workflow1OwnedSkillsWorkspace().domains.SKILLS,
          canOpen: false,
          allowedActions: [],
        },
        NUTRITION: workflow1OwnedSkillsWorkspace().domains.NUTRITION,
        S_AND_C: workflow1OwnedSkillsWorkspace().domains.S_AND_C,
      },
    });
    const useWorkflow1Gate = shouldUseWorkflow1SpecialistCreateGate({
      hasHeadCoachConfigured: true,
      isHeadCoachPlanningContextOwner: false,
      domain: "SKILLS",
      effectiveDownstreamPlanningContextLocked: true,
      ownershipFlags: {
        canGeneratePlan: true,
        canGenerateCurrentDomainPlan: true,
      },
    });
    const generatePlanActionDisabled = useWorkflow1Gate
      ? resolveWorkflow1SpecialistCreateDisabled({
          generationJobRunning: false,
          planOwnershipLoading: false,
        })
      : true;
    const hasHeadCoachConfigured = true;
    const currentCoachGenerationDomain: "SKILLS" | null = "SKILLS";
    const effectiveDownstreamPlanningContextLocked = true;
    const planOwnershipLoading = false;
    const ownershipBlocked = false;
    const currentDomainGenerationJobStatus: "QUEUED" | "RUNNING" | null = null;
    const workflow1LockedContextDomainCoachCanCreate =
      hasHeadCoachConfigured &&
      currentCoachGenerationDomain !== null &&
      effectiveDownstreamPlanningContextLocked &&
      !planOwnershipLoading &&
      !ownershipBlocked &&
      currentDomainGenerationJobStatus !== "QUEUED" &&
      currentDomainGenerationJobStatus !== "RUNNING";
    const staleLocalError = "Select a season before generating a plan.";
    const localError = workflow1LockedContextDomainCoachCanCreate
      ? null
      : staleLocalError;

    expect(workspace.domains.SKILLS.canOpen).toBe(false);
    expect(workspace.domains.SKILLS.allowedActions).toEqual([]);
    expect(useWorkflow1Gate).toBe(true);
    expect(workflow1LockedContextDomainCoachCanCreate).toBe(true);
    expect(generatePlanActionDisabled).toBe(false);
    expect(localError).toBeNull();
    expect(
      workflow1LockedContextDomainCoachCanCreate
        ? false
        : resolveLegacyAssistantCreateButtonDisabled({
            generatePlanActionDisabled,
            localError,
          }),
    ).toBe(false);
    expect(workspaceShowsDomainSubmitReview(workspace, "SKILLS")).toBe(false);
  });

  it("uses locked downstream context instead of local season selection", () => {
    const usesLockedContext = shouldUseLockedDownstreamGenerationContext({
      hasHeadCoachConfigured: true,
      isHeadCoachPlanningContextOwner: false,
      domain: "SKILLS",
      effectiveDownstreamPlanningContextLocked: true,
    });

    const localError = usesLockedContext
      ? resolveGeneratePlanLocalError({
          entityId: "entity-1",
          athleteId: "athlete-1",
          generationDomain: "SKILLS",
          selectedSeasonCycleId: null,
          selectedGoalCount: 1,
          sportCode: "TENNIS",
          selectedSeason: null,
          currentPhase: null,
          planStartDate: "",
          planEndDate: "",
          canUseLockedPlanningContextForGeneration: true,
          lockedSeasonCycleId: "season-1",
          lockedPlanWindowStart: "2026-06-20",
          lockedPlanWindowEnd: "2026-06-26",
        })
      : resolveGeneratePlanLocalError({
          entityId: "entity-1",
          athleteId: "athlete-1",
          generationDomain: "SKILLS",
          selectedSeasonCycleId: null,
          selectedGoalCount: 0,
          sportCode: "TENNIS",
          selectedSeason: null,
          currentPhase: null,
          planStartDate: "",
          planEndDate: "",
        });

    expect(usesLockedContext).toBe(true);
    expect(localError).toBeNull();
  });

  it("allows Workflow 1 Skills coach locked-context generation without local selected season", () => {
    const canGenerateFromLockedPlanningContext =
      canGenerateFromLockedPlanningContextForDomain({
        domain: "SKILLS",
        effectiveDownstreamPlanningContextLocked: true,
        ownershipFlags: {
          canGeneratePlan: true,
          canGenerateCurrentDomainPlan: true,
        },
        lockedSeasonCycleId: "locked-season-cycle-1",
        lockedPlanWindowStart: "2026-06-20",
        lockedPlanWindowEnd: "2026-06-26",
        lockedSportCode: "TENNIS",
      });

    expect(canGenerateFromLockedPlanningContext).toBe(true);
    expect(
      resolveGeneratePlanLocalError({
        entityId: "entity-1",
        athleteId: "athlete-1",
        generationDomain: "SKILLS",
        selectedSeasonCycleId: null,
        selectedGoalCount: 1,
        sportCode: "TENNIS",
        selectedSeason: null,
        currentPhase: null,
        planStartDate: "",
        planEndDate: "",
        canUseLockedPlanningContextForGeneration: canGenerateFromLockedPlanningContext,
        lockedSeasonCycleId: "locked-season-cycle-1",
        lockedPlanWindowStart: "2026-06-20",
        lockedPlanWindowEnd: "2026-06-26",
      }),
    ).toBeNull();
  });

  it("does not fall back to selected-season validation when locked context is expected", () => {
    const usesLockedDownstreamContext = false;
    const lockedContextExpectedForDomain = true;
    const canGenerateFromLockedPlanningContext = true;
    const localSeasonError = resolveGeneratePlanLocalError({
      entityId: "entity-1",
      athleteId: "athlete-1",
      generationDomain: "SKILLS",
      selectedSeasonCycleId: null,
      selectedGoalCount: 0,
      sportCode: "TENNIS",
      selectedSeason: null,
      currentPhase: null,
      planStartDate: "",
      planEndDate: "",
    });
    let localGenerationError: string | null = null;

    if (canGenerateFromLockedPlanningContext) {
      localGenerationError = null;
    } else if (lockedContextExpectedForDomain) {
      localGenerationError = LOCKED_CONTEXT_MISSING_GENERATION_DETAILS_MESSAGE;
    } else if (!usesLockedDownstreamContext) {
      localGenerationError = localSeasonError;
    }

    expect(localSeasonError).toBe("Select a season before generating a plan.");
    expect(localGenerationError).toBeNull();
  });

  it("returns locked-context missing details when locked context is expected but incomplete", () => {
    const lockedContextExpectedForDomain = true;
    const canGenerateFromLockedPlanningContext = false;
    const localSeasonError = resolveGeneratePlanLocalError({
      entityId: "entity-1",
      athleteId: "athlete-1",
      generationDomain: "SKILLS",
      selectedSeasonCycleId: null,
      selectedGoalCount: 0,
      sportCode: "TENNIS",
      selectedSeason: null,
      currentPhase: null,
      planStartDate: "",
      planEndDate: "",
    });
    const localGenerationError = canGenerateFromLockedPlanningContext
      ? null
      : lockedContextExpectedForDomain
        ? LOCKED_CONTEXT_MISSING_GENERATION_DETAILS_MESSAGE
        : localSeasonError;

    expect(localSeasonError).toBe("Select a season before generating a plan.");
    expect(localGenerationError).toBe(LOCKED_CONTEXT_MISSING_GENERATION_DETAILS_MESSAGE);
  });

  it("uses locked season, window, and goals for Workflow 1 locked-context payload", () => {
    const lockedGenerationSeasonCycleId = "locked-season-cycle-1";
    const lockedGenerationPlanStartDate = "2026-06-20";
    const lockedGenerationPlanEndDate = "2026-06-26";
    const lockedGenerationSportCode = "TENNIS";
    const lockedGoalIds = ["goal-1", "goal-2"];
    const canGenerateFromLockedPlanningContext =
      canGenerateFromLockedPlanningContextForDomain({
        domain: "SKILLS",
        effectiveDownstreamPlanningContextLocked: true,
        ownershipFlags: {
          canGeneratePlan: true,
          canGenerateCurrentDomainPlan: true,
        },
        lockedSeasonCycleId: lockedGenerationSeasonCycleId,
        lockedPlanWindowStart: lockedGenerationPlanStartDate,
        lockedPlanWindowEnd: lockedGenerationPlanEndDate,
        lockedSportCode: lockedGenerationSportCode,
      });
    const generationPayload = {
      seasonCycleId: canGenerateFromLockedPlanningContext
        ? lockedGenerationSeasonCycleId
        : null,
      planStartDate: canGenerateFromLockedPlanningContext
        ? lockedGenerationPlanStartDate
        : "local-start",
      planEndDate: canGenerateFromLockedPlanningContext
        ? lockedGenerationPlanEndDate
        : "local-end",
      sportCode: canGenerateFromLockedPlanningContext
        ? lockedGenerationSportCode
        : "LOCAL",
      goalIds: canGenerateFromLockedPlanningContext
        ? lockedGoalIds
        : ["local-goal"],
    };

    expect(generationPayload).toEqual({
      seasonCycleId: "locked-season-cycle-1",
      planStartDate: "2026-06-20",
      planEndDate: "2026-06-26",
      sportCode: "TENNIS",
      goalIds: ["goal-1", "goal-2"],
    });
  });

  it("keeps Workflow 3 Skills generation to one progress card without empty draft copy", () => {
    const skillsGenerationJob = {
      status: "RUNNING" as const,
      domain: "SKILLS" as const,
      progressStage: "BUILDING_DOMAIN_CONTEXT",
    };
    const generationInProgress = isGenerationJobInProgress(skillsGenerationJob);
    const canonicalStep6ProgressCards = generationInProgress ? 1 : 0;
    const buttonProgressCards = shouldShowDomainButtonProgress({
      domain: "SKILLS",
      currentDomain: "SKILLS",
      generationInProgress,
    })
      ? 1
      : 0;

    expect(generationInProgress).toBe(true);
    expect(canonicalStep6ProgressCards + buttonProgressCards).toBe(1);
    expect(skillsGenerationJob.progressStage).toBe("BUILDING_DOMAIN_CONTEXT");
    expect(
      shouldShowGeneratedDraftEmptyState({
        draftMissing: true,
        generationInProgress,
      }),
    ).toBe(false);
    expect(
      resolveLegacyAssistantCreateButtonDisabled({
        generatePlanActionDisabled: true,
        localError: null,
      }),
    ).toBe(true);
    expect(renderGenerationJobButtonLabel("SKILLS", skillsGenerationJob)).toBe(
      "Generating plan...",
    );
  });

  it("shows locked-context missing details instead of season error for incomplete locked context", () => {
    expect(
      canGenerateFromLockedPlanningContextForDomain({
        domain: "SKILLS",
        effectiveDownstreamPlanningContextLocked: true,
        ownershipFlags: {
          canGeneratePlan: true,
          canGenerateCurrentDomainPlan: true,
        },
        lockedSeasonCycleId: null,
        lockedPlanWindowStart: "2026-06-20",
        lockedPlanWindowEnd: "2026-06-26",
        lockedSportCode: "TENNIS",
      }),
    ).toBe(false);
    expect(
      resolveGeneratePlanLocalError({
        entityId: "entity-1",
        athleteId: "athlete-1",
        generationDomain: "SKILLS",
        selectedSeasonCycleId: null,
        selectedGoalCount: 1,
        sportCode: "TENNIS",
        selectedSeason: null,
        currentPhase: null,
        planStartDate: "",
        planEndDate: "",
        canUseLockedPlanningContextForGeneration: true,
        lockedSeasonCycleId: null,
        lockedPlanWindowStart: "2026-06-20",
        lockedPlanWindowEnd: "2026-06-26",
      }),
    ).toBe(LOCKED_CONTEXT_MISSING_GENERATION_DETAILS_MESSAGE);
  });

  it("keeps season selection required for planning context owner before lock", () => {
    expect(
      resolveGeneratePlanLocalError({
        entityId: "entity-1",
        athleteId: "athlete-1",
        generationDomain: "SKILLS",
        selectedSeasonCycleId: null,
        selectedGoalCount: 0,
        sportCode: "TENNIS",
        selectedSeason: null,
        currentPhase: null,
        planStartDate: "",
        planEndDate: "",
      }),
    ).toBe("Select a season before generating a plan.");
  });

  it("blocks downstream coach without locked planning context", () => {
    expect(
      shouldUseLockedDownstreamGenerationContext({
        hasHeadCoachConfigured: true,
        isHeadCoachPlanningContextOwner: false,
        domain: "SKILLS",
        effectiveDownstreamPlanningContextLocked: false,
      }),
    ).toBe(false);
  });

  it("legacy create enabled when upstream planning context is locked and no local error", () => {
    expect(
      resolveLegacyPlanningContextLocked({
        hasHeadCoachConfigured: true,
        upstreamPlanningContextLocked: true,
        upstreamPlanningContextUpstreamLocked: false,
        clientHasSubmittedDomainPlans: false,
      }),
    ).toBe(true);
    expect(
      resolveLegacyAssistantCreateButtonDisabled({
        generatePlanActionDisabled: false,
        localError: null,
      }),
    ).toBe(false);
  });

  it("keeps planning context locked when workspace is stale but upstream is locked", () => {
    const workspace = workflow1OwnedSkillsWorkspace({
      planningContext: {
        locked: false,
        resolved: false,
        lockId: null,
        snapshotId: null,
      },
    });

    expect(
      resolvePlanningContextLocked({
        legacyLocked: true,
        workspace,
      }),
    ).toBe(true);
  });

  it("owned Skills domain with no created plan hides submit", () => {
    const workspace = workflow1OwnedSkillsWorkspace();

    expect(workspaceShowsDomainSubmitReview(workspace, "SKILLS")).toBe(false);
  });

  it("owned Skills domain with created draft and SUBMIT_REVIEW shows submit", () => {
    const workspace = workflow1OwnedSkillsWorkspace({
      domains: {
        SKILLS: {
          summary: {
            trainingPlanId: "tp-1",
            versionId: "ver-1",
            generationDomain: "SKILLS",
            status: "DRAFT",
            versionNumber: 1,
          },
          reviewAccess: null,
          releaseMode: null,
          submittedForReview: false,
          canOpen: true,
          allowedActions: ["SUBMIT_REVIEW"],
        },
        NUTRITION: workflow1OwnedSkillsWorkspace().domains.NUTRITION,
        S_AND_C: workflow1OwnedSkillsWorkspace().domains.S_AND_C,
      },
    });

    expect(workspaceShowsDomainSubmitReview(workspace, "SKILLS")).toBe(true);
  });

  it("shows submit from workspace even when latest visible draft version is stale", () => {
    const workspace = workflow1OwnedSkillsWorkspace({
      domains: {
        SKILLS: {
          summary: {
            trainingPlanId: "tp-1",
            versionId: "workspace-ver-1",
            generationDomain: "SKILLS",
            status: "AI_GENERATED",
            versionNumber: 1,
          },
          reviewAccess: "SPECIALIST_COACH",
          releaseMode: null,
          submittedForReview: false,
          canOpen: true,
          allowedActions: ["SUBMIT_REVIEW"],
        },
        NUTRITION: workflow1OwnedSkillsWorkspace().domains.NUTRITION,
        S_AND_C: workflow1OwnedSkillsWorkspace().domains.S_AND_C,
      },
    });

    expect(
      resolveAssistantDomainSubmitActionVisible({
        workspace,
        currentDomain: "SKILLS",
        discoveryLoading: false,
        governedDetailRefreshing: false,
        hasHeadCoachConfigured: true,
        allowedActionsHasSubmitReview: true,
        governedContext: {
          planId: "tp-1",
          versionId: "workspace-ver-1",
          generationDomain: "SKILLS",
        },
        latestDraft: {
          trainingPlanId: "tp-1",
          trainingPlanVersionId: "stale-draft-ver",
        },
      }),
    ).toBe(true);
  });

  it("uses workspace summary ids for submit instead of stale latest draft ids", () => {
    const workspace = workflow1OwnedSkillsWorkspace({
      domains: {
        SKILLS: {
          summary: {
            trainingPlanId: "workspace-plan-1",
            versionId: "workspace-ver-1",
            generationDomain: "SKILLS",
            status: "AI_GENERATED",
            versionNumber: 1,
          },
          reviewAccess: "SPECIALIST_COACH",
          releaseMode: null,
          submittedForReview: false,
          canOpen: true,
          allowedActions: ["SUBMIT_REVIEW"],
        },
        NUTRITION: workflow1OwnedSkillsWorkspace().domains.NUTRITION,
        S_AND_C: workflow1OwnedSkillsWorkspace().domains.S_AND_C,
      },
    });

    expect(
      resolveSubmitReviewPlanVersionIds({
        workspace,
        domain: "SKILLS",
        fallbackPlanId: "workspace-plan-1",
        fallbackVersionId: "stale-draft-ver",
      }),
    ).toEqual({
      planId: "workspace-plan-1",
      versionId: "workspace-ver-1",
    });
  });

  it("hides submit when workspace submit state is false", () => {
    const workspace = workflow1OwnedSkillsWorkspace({
      domains: {
        SKILLS: {
          summary: {
            trainingPlanId: "tp-1",
            versionId: "ver-1",
            generationDomain: "SKILLS",
            status: "AI_GENERATED",
            versionNumber: 1,
          },
          reviewAccess: "SPECIALIST_COACH",
          releaseMode: null,
          submittedForReview: false,
          canOpen: true,
          allowedActions: [],
        },
        NUTRITION: workflow1OwnedSkillsWorkspace().domains.NUTRITION,
        S_AND_C: workflow1OwnedSkillsWorkspace().domains.S_AND_C,
      },
    });

    expect(
      resolveAssistantDomainSubmitActionVisible({
        workspace,
        currentDomain: "SKILLS",
        discoveryLoading: false,
        governedDetailRefreshing: false,
        hasHeadCoachConfigured: true,
        allowedActionsHasSubmitReview: true,
        governedContext: {
          planId: "tp-1",
          versionId: "ver-1",
          generationDomain: "SKILLS",
        },
        latestDraft: {
          trainingPlanId: "tp-1",
          trainingPlanVersionId: "ver-1",
        },
      }),
    ).toBe(false);
  });

  it("falls back to legacy submit visibility when workspace is unavailable", () => {
    expect(
      resolveAssistantDomainSubmitActionVisible({
        workspace: null,
        currentDomain: "SKILLS",
        discoveryLoading: false,
        governedDetailRefreshing: false,
        hasHeadCoachConfigured: true,
        allowedActionsHasSubmitReview: true,
        governedContext: {
          planId: "tp-1",
          versionId: "ver-1",
          generationDomain: "SKILLS",
        },
        latestDraft: {
          trainingPlanId: "tp-1",
          trainingPlanVersionId: "ver-1",
        },
      }),
    ).toBe(true);
  });

  it("never shows submit review when plan or version id is missing", () => {
    const workspace = workflow1OwnedSkillsWorkspace({
      domains: {
        SKILLS: {
          summary: {
            trainingPlanId: null,
            versionId: null,
            generationDomain: "SKILLS",
            status: null,
            versionNumber: null,
          },
          reviewAccess: null,
          releaseMode: null,
          submittedForReview: false,
          canOpen: true,
          allowedActions: ["SUBMIT_REVIEW"],
        },
        NUTRITION: workflow1OwnedSkillsWorkspace().domains.NUTRITION,
        S_AND_C: workflow1OwnedSkillsWorkspace().domains.S_AND_C,
      },
    });

    expect(workspaceShowsDomainSubmitReview(workspace, "SKILLS")).toBe(false);
  });
});
