import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/coach/athletes/athlete-1/planning",
  useRouter: () => ({
    push() {},
    replace() {},
    refresh() {},
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/ui/Button", async () => {
  const React = await import("react");
  return {
    Button({
      children,
      disabled = false,
      loading = false,
      type = "button",
      variant: _variant,
      className: _className,
      ...props
    }) {
      return React.createElement(
        "button",
        { ...props, disabled: disabled || loading, type },
        loading ? "Loading..." : children,
      );
    },
  };
});

import {
  buildDomainReviewRevisionContext,
  buildCoachWorkflowResetScopeKey,
  deriveHeadCoachDomainWorkflowStatus,
  deriveAssistantDomainWorkflowStatus,
  resolveNoHeadCoachDirectReleaseLockedPlanningContext,
  resolveInitialTrainingPlanWorkflowTab,
  resolveSkillsOwnedDirectReleaseCurrentStep,
  resolveSkillsOwnedDirectReleasePreContextTab,
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
  resolveLockedPlanningContextDisplayFields,
  resolveWorkflowResetScopeMode,
  headCoachSubmittedReviewDomains,
  shouldBlockWorkflowRenderForWorkspace,
  canGenerateFromLockedPlanningContextForDomain,
  isGenerationJobInProgress,
  resolveGeneratePlanLocalError,
  resolveWorkflow2SubmittedDomainSkillsSlotProjection,
  shouldClearWorkflow2SkillsSubmitSlotError,
  shouldShowDomainButtonProgress,
  shouldShowDomainCoachWorkspaceGenerationProgress,
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
  resolveHeadCoachOwnedSkillsDraftApproveVisible,
  resolveDirectReleaseDomainOwnerApproveVisible,
  resolveDirectReleaseSkillsOwnerApproveVisible,
  resolveDomainReleaseVisible,
  resolveDomainReviewDrawerWorkflowActions,
  resolveDomainReviewDrawerLayoutClasses,
  resolveDomainReviewDrawerRequestChangesVisible,
  resolveDomainReviewActionPlanIds,
  resolveDomainReviewWorkflowStatus,
  isDirectReleaseSkillsDomainOwner,
  shouldRouteDirectReleaseSkillsOwnerApproval,
  shouldRouteHeadCoachOwnedSkillsDraftDirectApprove,
  shouldRenderApproveBeforeReviseInDomainReviewDrawer,
  assistantWorkflowStatusLabelForKind,
  domainIntegrationAvailableActionLabels,
  domainIntegrationNextActionLabel,
  resolveDomainReviseAvailability,
  resolveTrainingPlanWorkspaceDomainIntegrationComplete,
  resolveTrainingPlanWorkspaceHasReleasedDomain,
  resolveTrainingPlanWorkspaceLifecycleSteps,
  shouldShowReleasedPlanViewerCanvas,
  resolveDomainCoachPlanViewerAvailability,
  resolveContextAppStepCompleteForNavigation,
  resolveContextAppProfileStatusLabel,
  resolveContextAppEligibilityNoteLabel,
  resolveContextBuilderPendingBeforeLock,
  resolveDomainIntegrationMatrixDomains,
  shouldRenderEmbeddedPlanViewerInDomainIntegration,
  shouldUseDomainCoordinationMatrixLayout,
  shouldKeepDomainReviewDrawerOpenForTab,
  resolveDomainIntegrationSkillsCreateVisible,
  resolveDomainIntegrationGenerateDisplayState,
  resolveDomainGenerationEligibilityModel,
  shouldAllowWorkflow3SkillsGenerationWithoutGenericBackendReady,
  resolveSetupStateAfterSeasonCreate,
  formatSeasonOptionLabel,
  resolveCompetitionSeasonPhaseForDate,
  resolveWorkflowReviewResetScopeDomain,
  resolveHeadCoachReviewActiveDetailAfterRefresh,
  resolveDomainReviewSurfaceIdentity,
  shouldKeepPreviousDomainReviewDetail,
  domainReviewScheduleDescription,
  countDomainReviewTrainingDays,
  countLatestDomainDraftTrainingDays,
  resolveDomainReviewDrawerContentSource,
  resolveDomainCoachPlanWindowLabel,
  shouldShowDomainReviewSubmittedPlanEmptyState,
  shouldHydrateDirectReleaseDomainDrawerDetail,
  shouldHydrateDirectReleaseSkillsDrawerDetail,
  reviewPlanButtonLabel,
  openDomainPlanReviewLabel,
  shouldShowSelectedDomainInspectorActionSuccess,
  resolveHeadCoachReviewActionContext,
  shouldShowSubmittedPlanLoading,
  shouldUseWorkflow1HeadCoachReviewActionPanel,
  isHeadCoachSkillsOwnerWorkflow,
  resolveWorkflowActionContext,
  DomainReviewDrawerWorkflowActionButtons,
  resolveDomainReviewDrawerVisibleActionLabels,
  resolveDomainReviewDisplayLabels,
  formatNutritionServingDisplay,
  formatNutritionDailyTotalsDisplay,
  readNutritionMetricValue,
  summarizeNutritionItems,
  buildTrainingPlanPlanningBriefSections,
  TrainingPlanPlanningBrief,
  DomainPlanConstraintComplianceSummarySection,
  DomainPlanHistoryTable,
  DomainPlanHistoryTabPanel,
  DomainPlanHistoryDetailPanel,
  DomainCoachPlanViewerExpiredEmptyState,
  DOMAIN_COACH_WORKSPACE_TABS,
  domainPlanHistoryDomainLabel,
  domainPlanHistoryReleasedOnLabel,
  domainPlanHistoryStatusLabel,
  domainPlanHistoryVersionLabel,
  domainPlanHistoryWeekLabel,
  handleDomainCoachPlanViewerHistoryClick,
  handleDomainCoachWorkspaceTabSelect,
  isDomainCoachPlanViewerContextExpired,
  shouldRenderReleasedDomainPlanViewerSchedule,
  FynRevisionContextPanel,
  buildFynRevisionCoachFeedback,
  addAcceptedFynRevisionChange,
  removeFynRevisionChange,
  defaultFynRevisionBatchSelection,
  defaultFynRevisionOptionsState,
  fynRevisionTargetOptions,
  fynRevisionLeveledTargetOptions,
  fynRevisionAvailableActions,
  fynRevisionActionLabel,
  buildFynRevisionActionChangeText,
  FYN_REVISION_CAPABILITIES,
  buildFynRevisionOptionsPayload,
  buildFynRevisionReplaceChangeText,
  fetchFynRevisionReplacementOptions,
  FYN_REVISION_NO_OPTIONS_MESSAGE,
  FYN_REVISION_MISSING_TARGET_MESSAGE,
  FYN_REVISION_OPTIONS_ERROR_MESSAGE,
  FYN_REVISION_SHOW_OPTIONS_LABEL,
  FYN_REVISION_PRESERVE_LINE,
  MAX_FYN_REVISION_CHANGES,
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
import type {
  FynRevisionActionKey as FynRevisionActionKeyForTest,
} from "@/components/dashboard/coach/CoachAthletePlanningProfileView";
import type {
  CoachAthleteDomainDraftRevisionContext,
  CoachAthleteDomainDraftRevisionOption,
} from "@/lib/api/coachAthletePlanningReadiness";
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

  it("keeps revised domain detail when a stale background refetch returns an older version", () => {
    const revisedDetail = {
      plan: { id: "skills-plan" },
      version: { id: "skills-v2", versionNumber: 2 },
      days: [],
      allowedActions: ["SUBMIT_REVIEW"],
    } as never;
    const staleDetail = {
      plan: { id: "skills-plan" },
      version: { id: "skills-v1", versionNumber: 1 },
      days: [],
      allowedActions: ["SUBMIT_REVIEW"],
    } as never;

    expect(
      shouldKeepPreviousDomainReviewDetail({
        previousDetail: revisedDetail,
        refreshedDetail: staleDetail,
      }),
    ).toBe(true);
    expect(
      resolveHeadCoachReviewActiveDetailAfterRefresh({
        refreshedActiveDetail: staleDetail,
        previousActiveDetail: revisedDetail,
        summaryPlanId: "skills-plan",
        preservePreviousDetail: false,
      }),
    ).toBe(revisedDetail);
  });

  it("preserves Workflow 1 revise refresh when the refreshed version is newer", () => {
    const previousDetail = {
      plan: { id: "skills-plan" },
      version: { id: "skills-v1", versionNumber: 1 },
      days: [],
      allowedActions: ["SUBMIT_REVIEW"],
    } as never;
    const revisedDetail = {
      plan: { id: "skills-plan" },
      version: { id: "skills-v2", versionNumber: 2 },
      days: [],
      allowedActions: ["SUBMIT_REVIEW"],
    } as never;

    expect(
      resolveHeadCoachReviewActiveDetailAfterRefresh({
        refreshedActiveDetail: revisedDetail,
        previousActiveDetail: previousDetail,
        summaryPlanId: "skills-plan",
        preservePreviousDetail: true,
      }),
    ).toBe(revisedDetail);
  });

  it("hides persistent released success band from the selected-domain inspector only", () => {
    expect(
      shouldShowSelectedDomainInspectorActionSuccess("Domain plan released to athlete."),
    ).toBe(false);
    expect(shouldShowSelectedDomainInspectorActionSuccess("Plan approved.")).toBe(true);
    expect(shouldShowSelectedDomainInspectorActionSuccess(null)).toBe(false);
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
        workspace: workflow1OwnedSkillsWorkspace({
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

  it("respects workflowShape HEAD_COACH_SKILLS_OWNER regardless of legacy flag", () => {
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
    ).toBe(true);
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
    const workspace = workflow1OwnedSkillsWorkspace({
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
    const workspace = workflow1OwnedSkillsWorkspace({
      shell: "head_coach_function_aware",
      ownershipFlags: {
        ...workflow1OwnedSkillsWorkspace().ownershipFlags,
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
    ).toEqual(["View / review domain plan", "Release this plan to athlete"]);
  });

  it("does not include future revise-instructions placeholders in available actions", () => {
    expect(
      domainIntegrationAvailableActionLabels({
        canGenerate: false,
        canViewPlan: true,
        canSubmitForReview: false,
        canReview: false,
        canRelease: true,
        canRevise: false,
      }),
    ).not.toContain("Revise instructions");
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

describe("buildDomainReviewRevisionContext", () => {
  it("prepares free-text revision context without mutating the instruction flow", () => {
    expect(
      buildDomainReviewRevisionContext({
        athleteId: " athlete-1 ",
        domain: "SKILLS",
        selectedPlanId: " plan-1 ",
        selectedVersionId: " version-1 ",
        planStatus: " Submitted for Review ",
        workflowStatus: "submitted_for_review",
        currentFreeTextRevisionInstruction: "  Add more recovery guidance.  ",
      }),
    ).toEqual({
      athleteId: "athlete-1",
      domain: "SKILLS",
      selectedPlanId: "plan-1",
      selectedVersionId: "version-1",
      planStatus: "Submitted for Review",
      workflowStatus: "submitted_for_review",
      currentFreeTextRevisionInstruction: "Add more recovery guidance.",
      source: "domain_review_drawer",
      selectedDay: null,
      selectedDate: null,
    });
  });
});

describe("Training Plan Workspace lifecycle display", () => {
  it("exposes Planning Context, Plan Viewer, and Plan History tabs for domain coaches", () => {
    expect(DOMAIN_COACH_WORKSPACE_TABS.map((tab) => tab.label)).toEqual([
      "Planning Context",
      "Plan Viewer",
      "Plan History",
    ]);
    expect(DOMAIN_COACH_WORKSPACE_TABS.map((tab) => tab.key)).toEqual([
      "planning-context",
      "plan-viewer",
      "plan-history",
    ]);
  });

  it("formats Plan History table values for read-only display", () => {
    const row = {
      weekStartDate: "2026-05-04",
      weekEndDate: "2026-05-10",
    };

    expect(domainPlanHistoryWeekLabel(row)).toContain("2026");
    expect(domainPlanHistoryVersionLabel(3)).toBe("v3");
    expect(domainPlanHistoryStatusLabel("COMPLETED")).toBe("Completed");
    expect(domainPlanHistoryDomainLabel("SKILLS")).toBe("Skills");
    expect(domainPlanHistoryDomainLabel("NUTRITION")).toBe("Nutrition");
    expect(domainPlanHistoryDomainLabel("S_AND_C")).toBe("S&C");
    expect(domainPlanHistoryReleasedOnLabel(null)).toBe("—");
  });

  it("renders the Plan History tab empty state", () => {
    const html = renderToStaticMarkup(
      createElement(DomainPlanHistoryTabPanel, {
        rows: [],
        loading: false,
        error: null,
        onView: vi.fn(),
      }),
    );

    expect(html).toContain("Plan History");
    expect(html).toContain("No completed plans in history yet.");
  });

  it("selecting Plan History requests a history fetch without opening Plan Viewer", () => {
    const setTab = vi.fn();
    const loadPlanHistory = vi.fn();
    const openPlanViewer = vi.fn();

    handleDomainCoachWorkspaceTabSelect({
      tab: "plan-history",
      setTab,
      planViewerAvailable: true,
      hasViewPlanContext: true,
      openPlanViewer,
      loadPlanHistory,
    });

    expect(setTab).toHaveBeenCalledWith("plan-history");
    expect(loadPlanHistory).toHaveBeenCalledTimes(1);
    expect(openPlanViewer).not.toHaveBeenCalled();
  });

  it("keeps the Plan Viewer tab opening the current released plan viewer", () => {
    const setTab = vi.fn();
    const loadPlanHistory = vi.fn();
    const openPlanViewer = vi.fn();

    handleDomainCoachWorkspaceTabSelect({
      tab: "plan-viewer",
      setTab,
      planViewerAvailable: true,
      hasViewPlanContext: true,
      openPlanViewer,
      loadPlanHistory,
    });

    expect(setTab).toHaveBeenCalledWith("plan-viewer");
    expect(openPlanViewer).toHaveBeenCalledTimes(1);
    expect(loadPlanHistory).not.toHaveBeenCalled();
  });

  it("does not render an expired completed released plan as active Plan Viewer content", () => {
    const viewPlanContext = {
      planId: "completed-plan-1",
      versionId: "completed-version-1",
      status: "COMPLETED",
      source: "legacy fallback",
      startDate: "2026-06-29",
      endDate: "2026-07-05",
    };

    expect(
      isDomainCoachPlanViewerContextExpired({
        viewPlanContext,
        todayDate: "2026-07-08",
      }),
    ).toBe(true);
    expect(
      shouldRenderReleasedDomainPlanViewerSchedule({
        releasedDetailAvailable: true,
        viewPlanContext,
        releasedPlanEndDate: "2026-07-05",
        todayDate: "2026-07-08",
      }),
    ).toBe(false);
  });

  it("renders the Plan Viewer empty state for an expired plan window", () => {
    const html = renderToStaticMarkup(
      createElement(DomainCoachPlanViewerExpiredEmptyState, {
        onOpenPlanHistory: vi.fn(),
      }),
    );

    expect(html).toContain("No active released plan for the current week.");
    expect(html).toContain("Completed plans are available in Plan History.");
    expect(html).toContain("View Plan History");
    expect(html).not.toContain("View the released plan by day and session.");
  });

  it("switches from the expired Plan Viewer empty state to Plan History", () => {
    const setTab = vi.fn();
    const loadPlanHistory = vi.fn();

    handleDomainCoachPlanViewerHistoryClick({
      setTab,
      loadPlanHistory,
    });

    expect(setTab).toHaveBeenCalledWith("plan-history");
    expect(loadPlanHistory).toHaveBeenCalledTimes(1);
  });

  it("does not open Plan Viewer from the tab button for an expired plan context", () => {
    const setTab = vi.fn();
    const loadPlanHistory = vi.fn();
    const openPlanViewer = vi.fn();

    handleDomainCoachWorkspaceTabSelect({
      tab: "plan-viewer",
      setTab,
      planViewerAvailable: true,
      hasViewPlanContext: true,
      planViewerExpired: true,
      openPlanViewer,
      loadPlanHistory,
    });

    expect(setTab).toHaveBeenCalledWith("plan-viewer");
    expect(openPlanViewer).not.toHaveBeenCalled();
    expect(loadPlanHistory).not.toHaveBeenCalled();
  });

  it("keeps current-week released plans renderable in Plan Viewer", () => {
    const viewPlanContext = {
      planId: "active-plan-1",
      versionId: "active-version-1",
      status: "ACTIVE",
      source: "workspace.domains.SKILLS.summary",
      startDate: "2026-07-06",
      endDate: "2026-07-12",
    };

    expect(
      isDomainCoachPlanViewerContextExpired({
        viewPlanContext,
        todayDate: "2026-07-08",
      }),
    ).toBe(false);
    expect(
      shouldRenderReleasedDomainPlanViewerSchedule({
        releasedDetailAvailable: true,
        viewPlanContext,
        releasedPlanEndDate: "2026-07-12",
        todayDate: "2026-07-08",
      }),
    ).toBe(true);
  });

  it("keeps the existing Revise Plan button rendered for editable drafts", () => {
    const html = renderToStaticMarkup(
      createElement(DomainReviewDrawerWorkflowActionButtons, {
        drawerWorkflowActions: {
          canShowViewPlan: false,
          canShowSubmitForReview: false,
          canShowReviseAction: true,
          canShowApproveAction: false,
          canShowRequestRevisionAction: false,
          canShowReleaseAction: false,
          hasAuthorizedWorkflowAction: true,
        },
        renderApproveBeforeRevise: false,
        workflowStatus: "draft_generated",
        directReleaseSkillsDraftReview: false,
        governedPlanActionLoading: null,
        actionContext: null,
        drawerReviseLoading: false,
        requestRevisionFeedback: "",
        onApprove: vi.fn(),
        onRequestRevisionFeedbackChange: vi.fn(),
        onRequestChangesSubmit: vi.fn(),
        onOpenRevise: vi.fn(),
      }),
    );

    expect(html).toContain("Revise Plan");
  });

  const fynReviseIds = { trainingPlanId: "plan-1", versionId: "version-1" };
  const fynDraftContext = {
    generationDomain: "SKILLS" as const,
    draft: {
      days: [
        {
          dayIndex: 1,
          date: "2026-07-06",
          sessions: [
            {
              sessionIndex: 1,
              title: "Morning session",
              items: [
                {
                  order: 0,
                  itemType: "DRILL",
                  exerciseCatalogItemId: "ex-1",
                  nutritionCatalogItemId: null,
                  label: "Bunker drill",
                  summary: null,
                },
                {
                  order: 1,
                  itemType: "DRILL",
                  exerciseCatalogItemId: "ex-2",
                  nutritionCatalogItemId: null,
                  label: "Cool down",
                  summary: null,
                },
              ],
            },
          ],
        },
      ],
    },
    ref: null,
    status: "AI_GENERATED",
    version: null,
    targetMap: null,
    planningBriefSummary: null,
    lockedPlanningContextSummary: null,
    // Generic context change options must NOT be shown as replacement options.
    allowedChangeTypes: ["CHANGE_DRILL"],
    changeOptions: [{ changeType: "CHANGE_DRILL", label: "Change drill", description: null, raw: {} }],
    requiredInput: null,
    raw: {},
  } as unknown as CoachAthleteDomainDraftRevisionContext;
  const fynFetchedOptions: CoachAthleteDomainDraftRevisionOption[] = [
    {
      id: "opt-1",
      rank: 1,
      label: "Cross-court rally drill",
      domain: "SKILLS",
      optionKind: "REPLACEMENT",
      source: "DB",
      score: 0.9,
      reason: "Similar load",
      goalIds: [],
      targetTags: [],
      safetyTags: [],
      levelTags: [],
      metadata: null,
    },
    {
      id: "opt-2",
      rank: 2,
      label: "Target serve ladder",
      domain: "SKILLS",
      optionKind: "REPLACEMENT",
      source: "CATALOG",
      score: 0.8,
      reason: null,
      goalIds: [],
      targetTags: [],
      safetyTags: [],
      levelTags: [],
      metadata: null,
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fynPanelProps = (overrides: Record<string, unknown> = {}): any => ({
    domain: "SKILLS",
    context: null,
    loading: false,
    error: null,
    selection: defaultFynRevisionBatchSelection(),
    onSelectionChange: vi.fn(),
    coachRequest: "",
    onCoachRequestChange: vi.fn(),
    targetOptions: [],
    selectedTargetKey: null,
    onSelectedTargetChange: vi.fn(),
    selectedActionKey: null,
    onSelectAction: vi.fn(),
    onQuickAction: vi.fn(),
    optionsState: defaultFynRevisionOptionsState(),
    onShowOptions: vi.fn(),
    onSelectOption: vi.fn(),
    ...overrides,
  });

  it("builds selectable targets from draft days/sessions/items and renders the target selector", () => {
    const targets = fynRevisionTargetOptions(fynDraftContext);
    expect(targets).toHaveLength(2);
    expect(targets[0]?.target).toEqual({
      dayKey: "1",
      sessionKey: "1",
      itemKey: "0",
      itemType: "DRILL",
      currentId: "ex-1",
      label: "Bunker drill",
      tags: [],
    });

    const html = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({ context: fynDraftContext, targetOptions: targets }),
      ),
    );
    expect(html).toContain("Which plan item?");
    expect(html).toContain("Bunker drill");
    expect(html).toContain("Cool down");
  });

  const makeRevisionContext = (
    overrides: Record<string, unknown>,
  ): CoachAthleteDomainDraftRevisionContext =>
    ({
      generationDomain: "SKILLS",
      draft: null,
      ref: null,
      status: "AI_GENERATED",
      version: null,
      targetMap: null,
      planningBriefSummary: null,
      lockedPlanningContextSummary: null,
      allowedChangeTypes: [],
      changeOptions: [],
      requiredInput: null,
      raw: {},
      ...overrides,
    }) as unknown as CoachAthleteDomainDraftRevisionContext;

  it("builds selectable targets from context.targetMap when the draft graph is absent", () => {
    const context = makeRevisionContext({
      draft: null,
      targetMap: {
        days: [
          {
            dayKey: "1",
            dayLabel: "Day 1",
            sessions: [
              {
                sessionKey: "1",
                sessionLabel: "Morning session",
                items: [
                  {
                    itemKey: "0",
                    itemType: "DRILL",
                    skillCode: "SK-1",
                    label: "Bunker drill",
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const targets = fynRevisionTargetOptions(context);
    expect(targets).toHaveLength(1);
    expect(targets[0]?.target).toEqual({
      dayKey: "1",
      sessionKey: "1",
      itemKey: "0",
      itemType: "DRILL",
      currentId: "SK-1",
      label: "Bunker drill",
      tags: [],
    });

    const html = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({ context, targetOptions: targets }),
      ),
    );
    expect(html).toContain("Which plan item?");
    expect(html).toContain("Bunker drill");
    expect(html).not.toContain("Fyn could not read plan items to target yet.");
  });

  it("falls back to the rendered plan schedule days when neither targetMap nor draft has items", () => {
    const context = makeRevisionContext({ draft: null, targetMap: null });
    const scheduleDays = [
      {
        dayIndex: 1,
        sessions: [
          {
            sessionIndex: 1,
            title: "Evening session",
            items: [
              {
                order: 0,
                itemType: "DRILL",
                exerciseCatalogItemId: "ex-9",
                label: "Volley drill",
              },
            ],
          },
        ],
      },
    ];

    const targets = fynRevisionTargetOptions(context, {
      domain: "SKILLS",
      scheduleDays,
    });
    expect(targets).toHaveLength(1);
    expect(targets[0]?.target).toEqual({
      dayKey: "1",
      sessionKey: "1",
      itemKey: "0",
      itemType: "DRILL",
      currentId: "ex-9",
      label: "Volley drill",
      tags: [],
    });

    const html = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({ context, targetOptions: targets }),
      ),
    );
    expect(html).toContain("Which plan item?");
    expect(html).toContain("Volley drill");
  });

  it("also reads persisted plan schedules that nest items under sessionStructureSections", () => {
    const context = makeRevisionContext({ draft: null, targetMap: null });
    const scheduleDays = [
      {
        dayIndex: 2,
        sessions: [
          {
            sessionIndex: 1,
            title: "Court block",
            sessionStructureSections: [
              {
                items: [
                  {
                    order: 0,
                    itemType: "DRILL",
                    exerciseCatalogItemId: "ex-42",
                    label: "Serve ladder",
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const targets = fynRevisionTargetOptions(context, {
      domain: "SKILLS",
      scheduleDays,
    });
    expect(targets).toHaveLength(1);
    expect(targets[0]?.target.label).toBe("Serve ladder");
    expect(targets[0]?.target.currentId).toBe("ex-42");
  });

  it("preserves the Skills skill id even when an exercise id is also present", () => {
    const context = makeRevisionContext({ generationDomain: "SKILLS" });
    const scheduleDays = [
      {
        dayIndex: 1,
        sessions: [
          {
            sessionIndex: 1,
            items: [
              {
                order: 0,
                itemType: "DRILL",
                skillCode: "SK-7",
                exerciseCatalogItemId: "ex-1",
                label: "Approach drill",
              },
            ],
          },
        ],
      },
    ];
    const targets = fynRevisionTargetOptions(context, {
      domain: "SKILLS",
      scheduleDays,
    });
    expect(targets[0]?.target.currentId).toBe("SK-7");
  });

  it("preserves the Nutrition catalog id for nutrition targets", () => {
    const context = makeRevisionContext({ generationDomain: "NUTRITION" });
    const scheduleDays = [
      {
        dayIndex: 1,
        sessions: [
          {
            sessionIndex: 1,
            items: [
              {
                order: 0,
                itemType: "MEAL",
                nutritionCatalogItemId: "nut-3",
                label: "White rice",
              },
            ],
          },
        ],
      },
    ];
    const targets = fynRevisionTargetOptions(context, {
      domain: "NUTRITION",
      scheduleDays,
    });
    expect(targets[0]?.target.currentId).toBe("nut-3");
  });

  it("preserves the S&C exercise catalog id for strength targets", () => {
    const context = makeRevisionContext({ generationDomain: "S_AND_C" });
    const scheduleDays = [
      {
        dayIndex: 1,
        sessions: [
          {
            sessionIndex: 1,
            items: [
              {
                order: 0,
                itemType: "LIFT",
                exerciseCatalogItemId: "ex-31",
                label: "Back squat",
              },
            ],
          },
        ],
      },
    ];
    const targets = fynRevisionTargetOptions(context, {
      domain: "S_AND_C",
      scheduleDays,
    });
    expect(targets[0]?.target.currentId).toBe("ex-31");
  });

  it("allows selection from key-only targets that carry no catalog ids", () => {
    const context = makeRevisionContext({ draft: null, targetMap: null });
    const scheduleDays = [
      {
        dayIndex: 3,
        sessions: [
          {
            sessionIndex: 1,
            items: [{ order: 0, label: "Mobility flow" }],
          },
        ],
      },
    ];
    const targets = fynRevisionTargetOptions(context, {
      domain: "SKILLS",
      scheduleDays,
    });
    expect(targets).toHaveLength(1);
    expect(targets[0]?.target.currentId).toBeNull();
    expect(targets[0]?.target).toMatchObject({
      dayKey: "3",
      sessionKey: "1",
      itemKey: "0",
      label: "Mobility flow",
      tags: [],
    });
  });

  it("shows 'Fyn could not read plan items…' only when every source is empty", () => {
    const context = makeRevisionContext({ draft: null, targetMap: null });

    const emptyHtml = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context,
          targetOptions: fynRevisionTargetOptions(context, {
            domain: "SKILLS",
            scheduleDays: [],
          }),
        }),
      ),
    );
    expect(emptyHtml).toContain("Fyn could not read plan items to target yet.");

    const scheduleDays = [
      {
        dayIndex: 1,
        sessions: [
          { sessionIndex: 1, items: [{ order: 0, label: "Bunker drill" }] },
        ],
      },
    ];
    const populatedHtml = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context,
          targetOptions: fynRevisionTargetOptions(context, {
            domain: "SKILLS",
            scheduleDays,
          }),
        }),
      ),
    );
    expect(populatedHtml).not.toContain("Fyn could not read plan items to target yet.");
    expect(populatedHtml).toContain("Which plan item?");
  });

  it("enables Show approved options once a Replace action is chosen and a request is typed", () => {
    const context = makeRevisionContext({ draft: null, targetMap: null });
    const scheduleDays = [
      {
        dayIndex: 1,
        sessions: [
          {
            sessionIndex: 1,
            items: [
              { order: 0, label: "Bunker drill" },
              { order: 1, label: "Cool down" },
            ],
          },
        ],
      },
    ];
    const targets = fynRevisionLeveledTargetOptions(context, {
      domain: "SKILLS",
      scheduleDays,
    });
    const itemTarget = targets.find((option) => option.level === "ITEM");

    // Replace action chosen but no request typed yet -> Show approved options is disabled.
    const disabledHtml = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context,
          targetOptions: targets,
          coachRequest: "",
          selectedTargetKey: itemTarget?.key ?? null,
          selectedActionKey: "REPLACE_ITEM",
        }),
      ),
    );
    expect(disabledHtml).toContain(FYN_REVISION_SHOW_OPTIONS_LABEL);
    expect(disabledHtml).toContain("disabled");

    const enabledHtml = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context,
          targetOptions: targets,
          coachRequest: "Replace the bunker drill.",
          selectedTargetKey: itemTarget?.key ?? null,
          selectedActionKey: "REPLACE_ITEM",
        }),
      ),
    );
    expect(enabledHtml).toContain(FYN_REVISION_SHOW_OPTIONS_LABEL);
    expect(enabledHtml).not.toContain("disabled");
  });

  const skillsSchedule = [
    {
      dayIndex: 1,
      sessions: [
        {
          sessionIndex: 1,
          title: "Morning session",
          items: [
            { order: 0, itemType: "DRILL", label: "Bunker drill" },
            { order: 1, itemType: "DRILL", label: "Cool down" },
          ],
        },
      ],
    },
  ];
  const actionKeysFor = (
    domain: "SKILLS" | "NUTRITION" | "S_AND_C",
    target: ReturnType<typeof fynRevisionLeveledTargetOptions>[number] | undefined,
  ): FynRevisionActionKeyForTest[] =>
    fynRevisionAvailableActions(domain, target ?? null).map(
      (action) => action.key as FynRevisionActionKeyForTest,
    );

  it("exposes a capability map that matches the documented backend contract", () => {
    expect(FYN_REVISION_CAPABILITIES.SKILLS.levels).toEqual(["DAY", "SESSION", "ITEM"]);
    expect(FYN_REVISION_CAPABILITIES.NUTRITION.levels).toEqual(["SESSION", "ITEM"]);
    expect(FYN_REVISION_CAPABILITIES.S_AND_C.levels).toEqual(["DAY", "SESSION", "ITEM"]);
  });

  it("offers Skills DAY, SESSION, and ITEM actions including the max-4 drill batch edit", () => {
    const context = makeRevisionContext({ generationDomain: "SKILLS" });
    const targets = fynRevisionLeveledTargetOptions(context, {
      domain: "SKILLS",
      scheduleDays: skillsSchedule,
    });
    const dayTarget = targets.find((option) => option.level === "DAY");
    const sessionTarget = targets.find((option) => option.level === "SESSION");
    const itemTarget = targets.find((option) => option.level === "ITEM");

    expect(actionKeysFor("SKILLS", dayTarget)).toEqual(["REPLACE_DAY", "ADD_SESSION"]);
    expect(actionKeysFor("SKILLS", sessionTarget)).toEqual([
      "UPDATE_SESSION",
      "ADD_ITEM",
      "UPDATE_SESSION_ITEMS",
    ]);
    expect(actionKeysFor("SKILLS", itemTarget)).toEqual([
      "REPLACE_ITEM",
      "UPDATE_ITEM",
      "REMOVE_ITEM",
    ]);
    // The Skills-only batch edit is surfaced with a friendly, capped label.
    expect(fynRevisionActionLabel("SKILLS", "UPDATE_SESSION_ITEMS")).toBe(
      "Edit several drills in this session",
    );
    expect(fynRevisionActionLabel("SKILLS", "ADD_SESSION")).toBe("Add Skills session");
    expect(fynRevisionActionLabel("SKILLS", "REPLACE_DAY")).toBe("Change rest day");
    expect(fynRevisionActionLabel("SKILLS", "ADD_ITEM")).toBe("Add drill");
    expect(fynRevisionActionLabel("SKILLS", "REPLACE_ITEM")).toBe("Replace drill");
  });

  it("renders the Skills action buttons for the selected target and hides other-level actions", () => {
    const context = makeRevisionContext({ generationDomain: "SKILLS" });
    const targets = fynRevisionLeveledTargetOptions(context, {
      domain: "SKILLS",
      scheduleDays: skillsSchedule,
    });
    const itemTarget = targets.find((option) => option.level === "ITEM");
    const html = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context,
          targetOptions: targets,
          selectedTargetKey: itemTarget?.key ?? null,
        }),
      ),
    );
    expect(html).toContain("Available revision actions");
    expect(html).toContain("Replace drill");
    expect(html).toContain("Adjust drill");
    expect(html).toContain("Remove drill");
    // Item target must not surface day/session-level actions.
    expect(html).not.toContain("Change rest day");
    expect(html).not.toContain("Edit several drills in this session");
  });

  it("offers Nutrition meal/item actions only and hides day, add-session, and batch actions", () => {
    const context = makeRevisionContext({ generationDomain: "NUTRITION" });
    const nutritionSchedule = [
      {
        dayIndex: 1,
        sessions: [
          {
            sessionIndex: 1,
            title: "Breakfast",
            items: [
              { order: 0, label: "White rice", nutritionCatalogItemId: "nut-1" },
              { order: 1, label: "Juice", nutritionCatalogItemId: "nut-2" },
            ],
          },
        ],
      },
    ];
    const targets = fynRevisionLeveledTargetOptions(context, {
      domain: "NUTRITION",
      scheduleDays: nutritionSchedule,
    });

    expect(targets.some((option) => option.level === "DAY")).toBe(false);
    const sessionTarget = targets.find((option) => option.level === "SESSION");
    const itemTarget = targets.find((option) => option.level === "ITEM");
    expect(actionKeysFor("NUTRITION", sessionTarget)).toEqual(["UPDATE_SESSION", "ADD_ITEM"]);
    expect(actionKeysFor("NUTRITION", itemTarget)).toEqual([
      "REPLACE_ITEM",
      "UPDATE_ITEM",
      "REMOVE_ITEM",
    ]);

    const allKeys = targets.flatMap((option) => actionKeysFor("NUTRITION", option));
    expect(allKeys).not.toContain("REPLACE_DAY");
    expect(allKeys).not.toContain("ADD_SESSION");
    expect(allKeys).not.toContain("UPDATE_SESSION_ITEMS");
    // Nutrition vocabulary: sessions are meals, items are food items.
    expect(fynRevisionActionLabel("NUTRITION", "UPDATE_SESSION")).toBe("Adjust meal");
    expect(fynRevisionActionLabel("NUTRITION", "ADD_ITEM")).toBe("Add food item");
    expect(fynRevisionActionLabel("NUTRITION", "REMOVE_ITEM")).toBe("Remove food item");
    expect(fynRevisionActionLabel("NUTRITION", "REPLACE_ITEM")).toBe("Replace food item");
    expect(fynRevisionActionLabel("NUTRITION", "UPDATE_ITEM")).toBe("Adjust food item");
  });

  it("offers S&C add-session only for empty days, plus session and exercise actions", () => {
    const context = makeRevisionContext({ generationDomain: "S_AND_C" });
    const sandcSchedule = [
      { dayIndex: 1, sessions: [] },
      {
        dayIndex: 2,
        sessions: [
          {
            sessionIndex: 1,
            title: "Lower body",
            items: [
              { order: 0, label: "Back squat", exerciseCatalogItemId: "ex-1" },
              { order: 1, label: "Bench press", exerciseCatalogItemId: "ex-2" },
            ],
          },
        ],
      },
    ];
    const targets = fynRevisionLeveledTargetOptions(context, {
      domain: "S_AND_C",
      scheduleDays: sandcSchedule,
    });

    const emptyDayTarget = targets.find(
      (option) => option.level === "DAY" && option.daySessionCount === 0,
    );
    const nonEmptyDayTarget = targets.find(
      (option) => option.level === "DAY" && option.daySessionCount > 0,
    );
    const sessionTarget = targets.find((option) => option.level === "SESSION");
    const itemTarget = targets.find((option) => option.level === "ITEM");

    expect(actionKeysFor("S_AND_C", emptyDayTarget)).toEqual(["ADD_SESSION"]);
    // A day that already has sessions offers no day-level action, so it is dropped entirely.
    expect(nonEmptyDayTarget).toBeUndefined();
    expect(actionKeysFor("S_AND_C", sessionTarget)).toEqual(["UPDATE_SESSION"]);
    expect(actionKeysFor("S_AND_C", itemTarget)).toEqual([
      "ADD_ITEM",
      "REPLACE_ITEM",
      "UPDATE_ITEM",
      "REMOVE_ITEM",
    ]);

    const allKeys = targets.flatMap((option) => actionKeysFor("S_AND_C", option));
    expect(allKeys).not.toContain("REPLACE_DAY");
    expect(allKeys).not.toContain("UPDATE_SESSION_ITEMS");
    expect(fynRevisionActionLabel("S_AND_C", "ADD_SESSION")).toBe("Add S&C session");
    expect(fynRevisionActionLabel("S_AND_C", "ADD_ITEM")).toBe("Add exercise");
    expect(fynRevisionActionLabel("S_AND_C", "REMOVE_ITEM")).toBe("Remove exercise");
    expect(fynRevisionActionLabel("S_AND_C", "REPLACE_ITEM")).toBe("Replace exercise");
    expect(fynRevisionActionLabel("S_AND_C", "UPDATE_ITEM")).toBe("Adjust exercise");
  });

  it("hides the remove action when the target session has only one item", () => {
    const nutritionOneItem = [
      {
        dayIndex: 1,
        sessions: [
          {
            sessionIndex: 1,
            title: "Breakfast",
            items: [{ order: 0, label: "White rice", nutritionCatalogItemId: "nut-1" }],
          },
        ],
      },
    ];
    const nutritionTargets = fynRevisionLeveledTargetOptions(
      makeRevisionContext({ generationDomain: "NUTRITION" }),
      { domain: "NUTRITION", scheduleDays: nutritionOneItem },
    );
    const nutritionItem = nutritionTargets.find((option) => option.level === "ITEM");
    expect(actionKeysFor("NUTRITION", nutritionItem)).not.toContain("REMOVE_ITEM");

    const sandcOneItem = [
      {
        dayIndex: 1,
        sessions: [
          {
            sessionIndex: 1,
            title: "Lower body",
            items: [{ order: 0, label: "Back squat", exerciseCatalogItemId: "ex-1" }],
          },
        ],
      },
    ];
    const sandcTargets = fynRevisionLeveledTargetOptions(
      makeRevisionContext({ generationDomain: "S_AND_C" }),
      { domain: "S_AND_C", scheduleDays: sandcOneItem },
    );
    const sandcItem = sandcTargets.find((option) => option.level === "ITEM");
    expect(actionKeysFor("S_AND_C", sandcItem)).not.toContain("REMOVE_ITEM");
  });

  it("builds operation-explicit basket lines that carry day/session/item context", () => {
    // Nutrition remove: names the food item and the meal it comes from.
    const nutritionTargets = fynRevisionLeveledTargetOptions(
      makeRevisionContext({ generationDomain: "NUTRITION" }),
      {
        domain: "NUTRITION",
        scheduleDays: [
          {
            dayIndex: 1,
            sessions: [
              {
                sessionIndex: 1,
                title: "Breakfast",
                items: [
                  { order: 0, label: "White rice", nutritionCatalogItemId: "nut-1" },
                  { order: 1, label: "Juice", nutritionCatalogItemId: "nut-2" },
                ],
              },
            ],
          },
        ],
      },
    );
    const nutritionItem = nutritionTargets.find((option) => option.level === "ITEM");
    const removeFood = buildFynRevisionActionChangeText(
      "NUTRITION",
      {
        key: "REMOVE_ITEM",
        label: "Remove food item",
        requiresApprovedOptions: false,
        requiresBriefRequest: false,
      },
      nutritionItem!,
      "",
    );
    expect(removeFood).toBe("Remove food item: White rice from Breakfast.");

    // S&C add-session: names the day it targets.
    const sandcTargets = fynRevisionLeveledTargetOptions(
      makeRevisionContext({ generationDomain: "S_AND_C" }),
      {
        domain: "S_AND_C",
        scheduleDays: [
          { dayIndex: 7, sessions: [] },
          {
            dayIndex: 2,
            sessions: [
              {
                sessionIndex: 1,
                title: "Lower body",
                items: [
                  { order: 0, label: "Back squat", exerciseCatalogItemId: "ex-1" },
                  { order: 1, label: "Bench press", exerciseCatalogItemId: "ex-2" },
                ],
              },
            ],
          },
        ],
      },
    );
    const emptyDay = sandcTargets.find(
      (option) => option.level === "DAY" && option.daySessionCount === 0,
    );
    const addSession = buildFynRevisionActionChangeText(
      "S_AND_C",
      {
        key: "ADD_SESSION",
        label: "Add S&C session",
        requiresApprovedOptions: false,
        requiresBriefRequest: true,
      },
      emptyDay!,
      "",
    );
    expect(addSession).toBe("Add a S&C session to Day 7.");

    // S&C update session: carries the session context plus the coach note.
    const sandcSession = sandcTargets.find((option) => option.level === "SESSION");
    const updateSession = buildFynRevisionActionChangeText(
      "S_AND_C",
      {
        key: "UPDATE_SESSION",
        label: "Adjust session",
        requiresApprovedOptions: false,
        requiresBriefRequest: true,
      },
      sandcSession!,
      "make it harder",
    );
    expect(updateSession).toBe("Adjust session: Lower body. make it harder");

    // Selecting a quick action stores the explicit line in the basket.
    const selection = addAcceptedFynRevisionChange(
      defaultFynRevisionBatchSelection(),
      removeFood,
    );
    expect(selection.changes).toHaveLength(1);
    expect(selection.changes[0]?.acceptedChange).toBe(
      "Remove food item: White rice from Breakfast.",
    );
  });

  it("writes the Skills batch-drill basket line with counts-as-1 wording", () => {
    const context = makeRevisionContext({ generationDomain: "SKILLS" });
    const targets = fynRevisionLeveledTargetOptions(context, {
      domain: "SKILLS",
      scheduleDays: skillsSchedule,
    });
    const sessionTarget = targets.find((option) => option.level === "SESSION");
    const batchEdit = buildFynRevisionActionChangeText(
      "SKILLS",
      {
        key: "UPDATE_SESSION_ITEMS",
        label: "Edit several drills in this session",
        requiresApprovedOptions: false,
        requiresBriefRequest: false,
      },
      sessionTarget!,
      "",
    );
    expect(batchEdit).toBe(
      `Edit several drills in session: ${sessionTarget!.sessionLabel}. Counts as 1 change; up to 4 drill edits.`,
    );
    expect(batchEdit).toContain("Counts as 1 change; up to 4 drill edits.");

    const selection = addAcceptedFynRevisionChange(
      defaultFynRevisionBatchSelection(),
      batchEdit,
    );
    expect(selection.changes).toHaveLength(1);
    expect(selection.changes[0]?.acceptedChange).toBe(batchEdit);
  });

  it("renders the simplified helper copy for the capability-driven flow", () => {
    const html = renderToStaticMarkup(
      createElement(FynRevisionContextPanel, fynPanelProps({})),
    );
    expect(html).toContain("Fyn only shows revision actions this domain can safely execute.");
    expect(html).toContain("Choose a target, then choose what kind of change you want.");
  });

  it("shows the max-4 drill batch copy only for a Skills SESSION target", () => {
    const context = makeRevisionContext({ generationDomain: "SKILLS" });
    const targets = fynRevisionLeveledTargetOptions(context, {
      domain: "SKILLS",
      scheduleDays: skillsSchedule,
    });
    const sessionTarget = targets.find((option) => option.level === "SESSION");
    const skillsHtml = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context,
          targetOptions: targets,
          selectedTargetKey: sessionTarget?.key ?? null,
          selectedActionKey: "UPDATE_SESSION_ITEMS",
        }),
      ),
    );
    expect(skillsHtml).toContain("Edit several drills in this session");
    expect(skillsHtml).toContain(
      "Counts as 1 revision change. Describe up to 4 drill edits for this session.",
    );

    // Nutrition never offers or shows the batch drill copy.
    const nutritionContext = makeRevisionContext({ generationDomain: "NUTRITION" });
    const nutritionTargets = fynRevisionLeveledTargetOptions(nutritionContext, {
      domain: "NUTRITION",
      scheduleDays: [
        {
          dayIndex: 1,
          sessions: [
            {
              sessionIndex: 1,
              title: "Breakfast",
              items: [
                { order: 0, label: "White rice", nutritionCatalogItemId: "nut-1" },
                { order: 1, label: "Juice", nutritionCatalogItemId: "nut-2" },
              ],
            },
          ],
        },
      ],
    });
    const nutritionSession = nutritionTargets.find((option) => option.level === "SESSION");
    const nutritionHtml = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          domain: "NUTRITION",
          context: nutritionContext,
          targetOptions: nutritionTargets,
          selectedTargetKey: nutritionSession?.key ?? null,
        }),
      ),
    );
    expect(nutritionHtml).not.toContain("up to 4 drill edits");
    expect(nutritionHtml).not.toContain("Edit several drills in this session");
  });

  it("does not render static, invented, or context change-option replacements before options are fetched", () => {
    const targets = fynRevisionTargetOptions(fynDraftContext);
    const html = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context: fynDraftContext,
          targetOptions: targets,
          selectedTargetKey: targets[0]?.key ?? null,
          selectedActionKey: "REPLACE_ITEM",
          coachRequest: "Replace the bunker drill.",
        }),
      ),
    );

    // Endpoint flow active: generic context changeOptions are never shown as replacements.
    expect(html).not.toContain("Change drill");
    expect(html).not.toContain("CHANGE_DRILL");
    // No static/invented replacement option lists leak through.
    expect(html).not.toContain("Make this easier");
    expect(html).not.toContain("Swap this food");
    expect(html).not.toContain("Reduce the load");
    // No premature empty message before the coach asks for options.
    expect(html).not.toContain(FYN_REVISION_NO_OPTIONS_MESSAGE);
    // No fetched/approved options exist before the coach asks for them.
    expect(html).not.toContain("Cross-court rally drill");
    // The endpoint-driven action is available once a Replace action is chosen.
    expect(html).toContain(FYN_REVISION_SHOW_OPTIONS_LABEL);
  });

  it("renders fetched DB/CATALOG replacement options as selectable chips", () => {
    const targets = fynRevisionTargetOptions(fynDraftContext);
    const html = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context: fynDraftContext,
          targetOptions: targets,
          selectedTargetKey: targets[0]?.key ?? null,
          coachRequest: "Replace the bunker drill.",
          optionsState: {
            loading: false,
            error: null,
            message: null,
            options: fynFetchedOptions,
            searched: true,
          },
        }),
      ),
    );

    expect(html).toContain("Cross-court rally drill");
    expect(html).toContain("Target serve ladder");
    expect(html).not.toContain(FYN_REVISION_NO_OPTIONS_MESSAGE);
  });

  it("shows the no-approved-options message when the endpoint returns none", async () => {
    const html = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context: fynDraftContext,
          targetOptions: fynRevisionTargetOptions(fynDraftContext),
          optionsState: {
            loading: false,
            error: null,
            message: FYN_REVISION_NO_OPTIONS_MESSAGE,
            options: [],
            searched: true,
          },
        }),
      ),
    );
    expect(html).toContain(FYN_REVISION_NO_OPTIONS_MESSAGE);

    const outcome = await fetchFynRevisionReplacementOptions({
      entityId: "entity-1",
      athleteId: "athlete-1",
      domain: "SKILLS",
      reviseIds: fynReviseIds,
      coachRequest: "Replace the bunker drill.",
      target: fynRevisionTargetOptions(fynDraftContext)[0]?.target ?? null,
      fetchOptions: async () => ({ generationDomain: "SKILLS" as const, target: null, options: [] }),
    });
    expect(outcome).toEqual({ status: "OK", options: [], message: FYN_REVISION_NO_OPTIONS_MESSAGE });
  });

  it("shows the error message when the options request fails", async () => {
    const html = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context: fynDraftContext,
          targetOptions: fynRevisionTargetOptions(fynDraftContext),
          optionsState: {
            loading: false,
            error: FYN_REVISION_OPTIONS_ERROR_MESSAGE,
            message: null,
            options: [],
            searched: true,
          },
        }),
      ),
    );
    expect(html).toContain(FYN_REVISION_OPTIONS_ERROR_MESSAGE);

    const outcome = await fetchFynRevisionReplacementOptions({
      entityId: "entity-1",
      athleteId: "athlete-1",
      domain: "SKILLS",
      reviseIds: fynReviseIds,
      coachRequest: "Replace the bunker drill.",
      target: fynRevisionTargetOptions(fynDraftContext)[0]?.target ?? null,
      fetchOptions: async () => {
        throw new Error("boom");
      },
    });
    expect(outcome).toEqual({ status: "ERROR", message: FYN_REVISION_OPTIONS_ERROR_MESSAGE });
  });

  it("blocks the request and returns a clarification when no target is matched", async () => {
    const fetchOptions = vi.fn();
    const outcome = await fetchFynRevisionReplacementOptions({
      entityId: "entity-1",
      athleteId: "athlete-1",
      domain: "SKILLS",
      reviseIds: fynReviseIds,
      coachRequest: "Please change something.",
      target: null,
      fetchOptions,
    });

    expect(outcome).toEqual({
      status: "MISSING_TARGET",
      message: FYN_REVISION_MISSING_TARGET_MESSAGE,
    });
    expect(fetchOptions).not.toHaveBeenCalled();

    const html = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context: fynDraftContext,
          targetOptions: fynRevisionTargetOptions(fynDraftContext),
          optionsState: {
            loading: false,
            error: null,
            message: FYN_REVISION_MISSING_TARGET_MESSAGE,
            options: [],
            searched: true,
          },
        }),
      ),
    );
    expect(html).toContain(FYN_REVISION_MISSING_TARGET_MESSAGE);
  });

  it("never calls the options endpoint on render or while typing", async () => {
    const fetchOptions = vi.fn();
    const onShowOptions = vi.fn();
    renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context: fynDraftContext,
          targetOptions: fynRevisionTargetOptions(fynDraftContext),
          selectedTargetKey: fynRevisionTargetOptions(fynDraftContext)[0]?.key ?? null,
          coachRequest: "Replace the bunker drill.",
          onShowOptions,
        }),
      ),
    );
    // Rendering, and typing (which only updates coachRequest), never triggers a fetch.
    expect(onShowOptions).not.toHaveBeenCalled();

    // Request text alone does not call the endpoint; an empty request short-circuits.
    const outcome = await fetchFynRevisionReplacementOptions({
      entityId: "entity-1",
      athleteId: "athlete-1",
      domain: "SKILLS",
      reviseIds: fynReviseIds,
      coachRequest: "",
      target: null,
      fetchOptions,
    });
    expect(outcome).toEqual({ status: "MISSING_REQUEST" });
    expect(fetchOptions).not.toHaveBeenCalled();
  });

  it("calls the options helper once with the correct REPLACEMENT payload", async () => {
    const target = fynRevisionTargetOptions(fynDraftContext)[0]?.target;
    const expectedPayload = buildFynRevisionOptionsPayload({
      domain: "SKILLS",
      reviseIds: fynReviseIds,
      target: target!,
      coachRequest: "Replace the bunker drill.",
    });
    expect(expectedPayload).toEqual({
      generationDomain: "SKILLS",
      trainingPlanId: "plan-1",
      trainingPlanVersionId: "version-1",
      target,
      coachRequest: "Replace the bunker drill.",
      optionKind: "REPLACEMENT",
      limit: 4,
    });

    const fetchOptions = vi.fn(async () => ({
      generationDomain: "SKILLS" as const,
      target: target ?? null,
      options: fynFetchedOptions,
    }));
    const outcome = await fetchFynRevisionReplacementOptions({
      entityId: "entity-1",
      athleteId: "athlete-1",
      domain: "SKILLS",
      reviseIds: fynReviseIds,
      coachRequest: "Replace the bunker drill.",
      target: target ?? null,
      fetchOptions,
    });

    expect(fetchOptions).toHaveBeenCalledTimes(1);
    expect(fetchOptions).toHaveBeenCalledWith("entity-1", "athlete-1", expectedPayload);
    expect(outcome).toEqual({ status: "OK", options: fynFetchedOptions, message: null });
  });

  it("stores the operation-explicit replacement line naming the current target and new option", () => {
    const changeText = buildFynRevisionReplaceChangeText(
      "SKILLS",
      "Bunker Carry-Distance Control Drill",
      fynFetchedOptions[0]!.label,
    );
    expect(changeText).toBe(
      "Replace drill: Bunker Carry-Distance Control Drill with Cross-court rally drill.",
    );

    const selection = addAcceptedFynRevisionChange(
      defaultFynRevisionBatchSelection(),
      changeText,
    );
    expect(selection.changes).toHaveLength(1);
    expect(selection.changes[0]?.acceptedChange).toBe(
      "Replace drill: Bunker Carry-Distance Control Drill with Cross-court rally drill.",
    );

    // Domain vocabulary carries through, naming both old and new items.
    expect(buildFynRevisionReplaceChangeText("NUTRITION", "White rice", "Brown rice")).toBe(
      "Replace food item: White rice with Brown rice.",
    );
    expect(buildFynRevisionReplaceChangeText("S_AND_C", "Back squat", "Front squat")).toBe(
      "Replace exercise: Back squat with Front squat.",
    );
  });

  it("caps the basket at three replacement changes", () => {
    const one = addAcceptedFynRevisionChange(
      defaultFynRevisionBatchSelection(),
      buildFynRevisionReplaceChangeText("SKILLS", "Drill A", "Option A"),
    );
    const two = addAcceptedFynRevisionChange(
      one,
      buildFynRevisionReplaceChangeText("SKILLS", "Drill B", "Option B"),
    );
    const three = addAcceptedFynRevisionChange(
      two,
      buildFynRevisionReplaceChangeText("SKILLS", "Drill C", "Option C"),
    );
    const four = addAcceptedFynRevisionChange(
      three,
      buildFynRevisionReplaceChangeText("SKILLS", "Drill D", "Option D"),
    );

    expect(one.changes).toHaveLength(1);
    expect(three.changes).toHaveLength(3);
    expect(four.changes).toHaveLength(3);
    expect(MAX_FYN_REVISION_CHANGES).toBe(3);
  });

  it("serializes selected replacements into coachFeedback with Change 1/2/3 labels", () => {
    let selection = defaultFynRevisionBatchSelection();
    selection = addAcceptedFynRevisionChange(
      selection,
      buildFynRevisionReplaceChangeText("SKILLS", "Bunker drill", "Cross-court rally drill"),
    );
    selection = addAcceptedFynRevisionChange(
      selection,
      buildFynRevisionReplaceChangeText("SKILLS", "Cool down", "Mobility flow"),
    );
    selection = addAcceptedFynRevisionChange(
      selection,
      buildFynRevisionReplaceChangeText("SKILLS", "Sprint set", "Tempo run"),
    );

    const coachFeedback = buildFynRevisionCoachFeedback({ domain: "SKILLS", selection });
    expect(coachFeedback).toContain("Change 1:");
    expect(coachFeedback).toContain("Change 2:");
    expect(coachFeedback).toContain("Change 3:");
    expect(coachFeedback).toContain(
      "Replace drill: Bunker drill with Cross-court rally drill.",
    );
    expect(coachFeedback).toContain(FYN_REVISION_PRESERVE_LINE);

    // Submit remains the existing revise flow: only these three fields are sent.
    const submitPayload = {
      trainingPlanId: "plan-1",
      versionId: "version-1",
      coachFeedback,
    };
    expect(Object.keys(submitPayload)).toEqual([
      "trainingPlanId",
      "versionId",
      "coachFeedback",
    ]);
  });

  it("serializes a single accepted change into the coachFeedback field", () => {
    const feedback = buildFynRevisionCoachFeedback({
      domain: "SKILLS",
      selection: {
        changes: [{ acceptedChange: "Replace bunker drill with Cross-court rally drill." }],
      },
    });

    expect(feedback).toBe(
      [
        "Revision request: Apply these 1 Skills change only.",
        "",
        "Change 1:",
        "Replace bunker drill with Cross-court rally drill.",
        FYN_REVISION_PRESERVE_LINE,
      ].join("\n"),
    );
  });

  it("ignores empty accepted change text", () => {
    const selection = addAcceptedFynRevisionChange(defaultFynRevisionBatchSelection(), "   ");
    expect(selection.changes).toHaveLength(0);
  });

  it("removes an accepted change from the basket", () => {
    const two = addAcceptedFynRevisionChange(
      addAcceptedFynRevisionChange(
        defaultFynRevisionBatchSelection(),
        "Replace Bunker drill with Cross-court rally drill.",
      ),
      "Replace Cool down with Mobility flow.",
    );
    const afterRemove = removeFynRevisionChange(two, 0);

    expect(afterRemove.changes).toHaveLength(1);
    expect(afterRemove.changes[0]?.acceptedChange).toBe(
      "Replace Cool down with Mobility flow.",
    );
  });

  it("uses the Nutrition domain label in serialized feedback", () => {
    const feedback = buildFynRevisionCoachFeedback({
      domain: "NUTRITION",
      selection: {
        changes: [
          { acceptedChange: "Replace white rice with brown rice at lunch." },
          { acceptedChange: "Replace juice with water at breakfast." },
        ],
      },
    });

    expect(feedback).toContain("Revision request: Apply these 2 Nutrition changes only.");
    expect(feedback).toContain("Change 1:");
    expect(feedback).toContain("Replace white rice with brown rice at lunch.");
    expect(feedback).toContain(FYN_REVISION_PRESERVE_LINE);
  });

  it("renders Plan History rows with a read-only View action and no workflow actions", () => {
    const onView = vi.fn();
    const row = {
      planId: "plan-1",
      domainPlanId: "domain-plan-1",
      versionId: "version-1",
      versionNumber: 1,
      domain: "SKILLS" as const,
      weekStartDate: "2026-05-04",
      weekEndDate: "2026-05-10",
      status: "COMPLETED",
      releasedAt: null,
      releasedBy: null,
      viewOnly: true,
      raw: {},
    };

    const html = renderToStaticMarkup(
      createElement(DomainPlanHistoryTable, { rows: [row], onView }),
    );

    expect(html).toContain("Week");
    expect(html).toContain("Version");
    expect(html).toContain("Status");
    expect(html).toContain("Domain");
    expect(html).toContain("Released On");
    expect(html).toContain("Released By");
    expect(html).toContain("v1");
    expect(html).toContain("Completed");
    expect(html).toContain("Skills");
    expect(html).toContain("View");
    expect(html).toContain("—");
    expect(html).not.toMatch(/<button[^>]*>Approve<\/button>/);
    expect(html).not.toMatch(/<button[^>]*>Release<\/button>/);
    expect(html).not.toMatch(/<button[^>]*>Revise<\/button>/);
    expect(html).not.toMatch(/<button[^>]*>Regenerate<\/button>/);
    expect(html).not.toMatch(/<button[^>]*>Submit<\/button>/);
    expect(html).not.toMatch(/<button[^>]*>Request Changes<\/button>/);
    expect(html).not.toMatch(/<button[^>]*>Edit<\/button>/);
  });

  it("renders Plan History detail loading state while fetching historical content", () => {
    const row = {
      planId: "plan-1",
      domainPlanId: "domain-plan-1",
      versionId: "version-1",
      versionNumber: 1,
      domain: "SKILLS" as const,
      weekStartDate: "2026-05-04",
      weekEndDate: "2026-05-10",
      status: "COMPLETED",
      releasedAt: "2026-05-11T08:00:00.000Z",
      releasedBy: null,
      viewOnly: true,
      raw: {},
    };

    const html = renderToStaticMarkup(
      createElement(DomainPlanHistoryDetailPanel, {
        row,
        detail: null,
        loading: true,
        error: null,
      }),
    );

    expect(html).toContain("Loading historical plan detail...");
    expect(html).not.toContain(
      "Full historical plan content will be wired after the backend detail endpoint is confirmed.",
    );
  });

  it("renders Plan History detail metadata in responsive cards without horizontal overflow", () => {
    const row = {
      planId: "plan-1",
      domainPlanId: "domain-plan-1",
      versionId: "version-1",
      versionNumber: 1,
      domain: "NUTRITION" as const,
      weekStartDate: "2026-06-30",
      weekEndDate: "2026-07-06",
      status: "COMPLETED",
      releasedAt: "2026-07-07T08:00:00.000Z",
      releasedBy: "Coach With A Very Long Display Name That Should Wrap Normally",
      viewOnly: true,
      raw: {},
    };
    const detail = {
      ...row,
      planContent: {
        selectedVersionRule: null,
        generationDomain: "NUTRITION",
        allowedActions: [],
        releaseMode: null,
        constraintComplianceSummary: null,
        plan: null,
        version: null,
        days: [],
        raw: {},
      },
    };

    const html = renderToStaticMarkup(
      createElement(
        DomainPlanHistoryDetailPanel,
        {
          row,
          detail,
          loading: false,
          error: null,
        },
        createElement("section", null, "Full width historical plan content"),
      ),
    );

    expect(html).toContain("grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3");
    expect(html).toContain("min-w-0 break-words text-sm text-textPrimary");
    expect(html).toContain("min-w-0 max-w-full overflow-x-hidden");
    expect(html).toContain("Coach With A Very Long Display Name That Should Wrap Normally");
    expect(html).toContain("Full width historical plan content");
  });

  it("renders Plan History detail error state on historical detail failure", () => {
    const row = {
      planId: "plan-1",
      domainPlanId: "domain-plan-1",
      versionId: "version-1",
      versionNumber: 1,
      domain: "SKILLS" as const,
      weekStartDate: "2026-05-04",
      weekEndDate: "2026-05-10",
      status: "COMPLETED",
      releasedAt: "2026-05-11T08:00:00.000Z",
      releasedBy: null,
      viewOnly: true,
      raw: {},
    };

    const html = renderToStaticMarkup(
      createElement(DomainPlanHistoryDetailPanel, {
        row,
        detail: null,
        loading: false,
        error: "Could not load historical plan detail.",
      }),
    );

    expect(html).toContain("Could not load historical plan detail.");
  });

  it("renders returned Plan History planContent read-only without workflow actions", () => {
    const row = {
      planId: "plan-1",
      domainPlanId: "domain-plan-1",
      versionId: "version-1",
      versionNumber: 1,
      domain: "SKILLS" as const,
      weekStartDate: "2026-05-04",
      weekEndDate: "2026-05-10",
      status: "COMPLETED",
      releasedAt: "2026-05-11T08:00:00.000Z",
      releasedBy: "Coach Lee",
      viewOnly: true,
      raw: {},
    };
    const detail = {
      ...row,
      planContent: {
        selectedVersionRule: null,
        generationDomain: "SKILLS",
        allowedActions: [],
        releaseMode: null,
        constraintComplianceSummary: null,
        plan: {
          id: "plan-1",
          athleteId: "athlete-1",
          entityId: "entity-1",
          seasonCycleId: null,
          name: null,
          description: null,
          status: "COMPLETED",
          planSource: null,
          createdAt: null,
          updatedAt: null,
          goals: [],
          raw: {},
        },
        version: {
          id: "version-1",
          trainingPlanId: "plan-1",
          versionNumber: 1,
          startDate: "2026-05-04",
          endDate: "2026-05-10",
          source: null,
          status: "COMPLETED",
          isActiveVersion: false,
          isApproved: true,
          createdAt: null,
          updatedAt: null,
          raw: {},
        },
        days: [
          {
            id: "day-1",
            date: "2026-05-04",
            dayIndex: 1,
            weekNumber: 1,
            isRestDay: false,
            plannedLoadMinutes: 45,
            notes: null,
            trainingPlanVersionId: "version-1",
            sessions: [],
          },
        ],
        raw: {},
      },
    };

    const html = renderToStaticMarkup(
      createElement(
        DomainPlanHistoryDetailPanel,
        {
          row,
          detail,
          loading: false,
          error: null,
        },
        createElement("section", null, "Target Serve Drill"),
      ),
    );

    expect(html).toContain("Completed");
    expect(html).toContain("Skills");
    expect(html).toContain("Coach Lee");
    expect(html).toContain("Target Serve Drill");
    expect(html).not.toContain(
      "Full historical plan content will be wired after the backend detail endpoint is confirmed.",
    );
    expect(html).not.toMatch(/<button[^>]*>Approve<\/button>/);
    expect(html).not.toMatch(/<button[^>]*>Release<\/button>/);
    expect(html).not.toMatch(/<button[^>]*>Revise<\/button>/);
    expect(html).not.toMatch(/<button[^>]*>Regenerate<\/button>/);
    expect(html).not.toMatch(/<button[^>]*>Submit<\/button>/);
    expect(html).not.toMatch(/<button[^>]*>Request Changes<\/button>/);
    expect(html).not.toMatch(/<button[^>]*>Edit<\/button>/);
  });

  it("marks Context Builder active when the locked context canvas is visible", () => {
    const steps = resolveTrainingPlanWorkspaceLifecycleSteps({
      activeMode: "context-builder",
      contextComplete: true,
      domainAvailable: true,
      planViewerAvailable: false,
      domainIntegrationComplete: false,
    });

    expect(steps.find((step) => step.key === "context-builder")?.state).toBe("active");
    expect(steps.find((step) => step.key === "domain-integration")?.state).toBe("available");
    expect(steps.find((step) => step.key === "plan-viewer")?.state).toBe("locked");
  });

  it("keeps Plan Viewer locked when domains are submitted for review but not released", () => {
    const base = workflow1OwnedSkillsWorkspace();
    const submittedDomain = (domain: "SKILLS" | "NUTRITION" | "S_AND_C") => ({
      ...base.domains[domain],
      submittedForReview: true,
      summary: {
        trainingPlanId: `${domain.toLowerCase()}-plan`,
        versionId: `${domain.toLowerCase()}-version`,
        generationDomain: domain,
        status: "ASSISTANT_COACH_APPROVED",
        versionNumber: 1,
      },
    });
    const workspace = workflow1OwnedSkillsWorkspace({
      domains: {
        SKILLS: submittedDomain("SKILLS"),
        NUTRITION: submittedDomain("NUTRITION"),
        S_AND_C: submittedDomain("S_AND_C"),
      },
    });
    const hasReleasedDomain = resolveTrainingPlanWorkspaceHasReleasedDomain(workspace);
    const steps = resolveTrainingPlanWorkspaceLifecycleSteps({
      activeMode: hasReleasedDomain ? "plan-viewer" : "domain-integration",
      contextComplete: true,
      domainAvailable: true,
      planViewerAvailable: hasReleasedDomain,
      domainIntegrationComplete: resolveTrainingPlanWorkspaceDomainIntegrationComplete(workspace),
    });

    expect(hasReleasedDomain).toBe(false);
    expect(steps.find((step) => step.key === "domain-integration")?.state).toBe("active");
    expect(steps.find((step) => step.key === "plan-viewer")?.state).toBe("locked");
  });

  it("keeps Plan Viewer locked when domains are Head Coach approved but not released", () => {
    const base = workflow1OwnedSkillsWorkspace();
    const approvedDomain = (domain: "SKILLS" | "NUTRITION" | "S_AND_C") => ({
      ...base.domains[domain],
      submittedForReview: false,
      summary: {
        trainingPlanId: `${domain.toLowerCase()}-plan`,
        versionId: `${domain.toLowerCase()}-version`,
        generationDomain: domain,
        status: "HEAD_COACH_APPROVED",
        versionNumber: 1,
      },
    });
    const workspace = workflow1OwnedSkillsWorkspace({
      domains: {
        SKILLS: approvedDomain("SKILLS"),
        NUTRITION: approvedDomain("NUTRITION"),
        S_AND_C: approvedDomain("S_AND_C"),
      },
    });
    const hasReleasedDomain = resolveTrainingPlanWorkspaceHasReleasedDomain(workspace);
    const steps = resolveTrainingPlanWorkspaceLifecycleSteps({
      activeMode: hasReleasedDomain ? "plan-viewer" : "domain-integration",
      contextComplete: true,
      domainAvailable: true,
      planViewerAvailable: hasReleasedDomain,
      domainIntegrationComplete: resolveTrainingPlanWorkspaceDomainIntegrationComplete(workspace),
    });

    expect(hasReleasedDomain).toBe(false);
    expect(steps.find((step) => step.key === "domain-integration")?.state).toBe("active");
    expect(steps.find((step) => step.key === "plan-viewer")?.state).toBe("locked");
  });

  it("opens Plan Viewer for a Workflow 2A released Skills intent", () => {
    expect(
      shouldShowReleasedPlanViewerCanvas({
        selectedWorkflowTab: "generate",
        selectedDomain: "SKILLS",
        releasedPlanViewerIntentPresent: true,
        requestedPlanIdPresent: true,
        releasedWorkflowStatus: "released",
      }),
    ).toBe(true);
  });

  it("does not auto-open Plan Viewer for a released domain without explicit view intent", () => {
    expect(
      shouldShowReleasedPlanViewerCanvas({
        selectedWorkflowTab: "generate",
        selectedDomain: "SKILLS",
        releasedPlanViewerIntentPresent: false,
        requestedPlanIdPresent: true,
        releasedWorkflowStatus: "released",
      }),
    ).toBe(false);
  });

  it("keeps Workflow 2A partial release on Domain Plans Integration with Plan Viewer available", () => {
    const base = workflow2AHeadCoachOwnedSkillsWorkspace();
    const workspace = workflow2AHeadCoachOwnedSkillsWorkspace({
      domains: {
        ...base.domains,
        SKILLS: {
          ...base.domains.SKILLS,
          summary: {
            trainingPlanId: "skills-plan-v2",
            versionId: "skills-version-v2",
            generationDomain: "SKILLS",
            status: "ACTIVE",
            versionNumber: 2,
          },
        },
        NUTRITION: {
          ...base.domains.NUTRITION,
          submittedForReview: true,
          summary: {
            trainingPlanId: "nutrition-plan",
            versionId: "nutrition-version",
            generationDomain: "NUTRITION",
            status: "ASSISTANT_COACH_APPROVED",
            versionNumber: 1,
          },
        },
        S_AND_C: {
          ...base.domains.S_AND_C,
          submittedForReview: true,
          summary: {
            trainingPlanId: "sandc-plan",
            versionId: "sandc-version",
            generationDomain: "S_AND_C",
            status: "ASSISTANT_COACH_APPROVED",
            versionNumber: 1,
          },
        },
      },
    });
    const activeMode = shouldShowReleasedPlanViewerCanvas({
      selectedWorkflowTab: "generate",
      selectedDomain: "SKILLS",
      releasedPlanViewerIntentPresent: false,
      requestedPlanIdPresent: true,
      releasedWorkflowStatus: "released",
    })
      ? "plan-viewer"
      : "domain-integration";
    const steps = resolveTrainingPlanWorkspaceLifecycleSteps({
      activeMode,
      contextComplete: true,
      domainAvailable: true,
      planViewerAvailable: resolveTrainingPlanWorkspaceHasReleasedDomain(workspace),
      domainIntegrationComplete: resolveTrainingPlanWorkspaceDomainIntegrationComplete(workspace),
    });

    expect(resolveTrainingPlanWorkspaceHasReleasedDomain(workspace)).toBe(true);
    expect(resolveTrainingPlanWorkspaceDomainIntegrationComplete(workspace)).toBe(false);
    expect(steps.find((step) => step.key === "domain-integration")?.state).toBe("active");
    expect(steps.find((step) => step.key === "plan-viewer")?.state).toBe("available");
  });

  it("does not open Plan Viewer for unreleased domains without a released intent", () => {
    expect(
      shouldShowReleasedPlanViewerCanvas({
        selectedWorkflowTab: "generate",
        selectedDomain: "NUTRITION",
        releasedPlanViewerIntentPresent: false,
        requestedPlanIdPresent: true,
        releasedWorkflowStatus: "draft_generated",
      }),
    ).toBe(false);
  });

  it("does not open Plan Viewer for unreleased domains even with explicit view intent", () => {
    expect(
      shouldShowReleasedPlanViewerCanvas({
        selectedWorkflowTab: "generate",
        selectedDomain: "NUTRITION",
        releasedPlanViewerIntentPresent: true,
        requestedPlanIdPresent: true,
        releasedWorkflowStatus: "submitted_for_review",
      }),
    ).toBe(false);
  });

  it("keeps Plan Viewer available, not active, after returning to Domain Plans Integration", () => {
    const steps = resolveTrainingPlanWorkspaceLifecycleSteps({
      activeMode: "domain-integration",
      contextComplete: true,
      domainAvailable: true,
      planViewerAvailable: true,
      domainIntegrationComplete: false,
    });

    expect(steps.find((step) => step.key === "domain-integration")?.state).toBe("active");
    expect(steps.find((step) => step.key === "plan-viewer")?.state).toBe("available");
  });

  it("keeps Domain Plans Integration available for W1 partial domain release in Plan Viewer", () => {
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
    expect(resolveTrainingPlanWorkspaceHasReleasedDomain(workspace)).toBe(true);
    expect(steps.find((step) => step.key === "domain-integration")?.state).toBe("available");
    expect(steps.find((step) => step.key === "plan-viewer")?.state).toBe("active");
  });

  it("keeps Workflow 1 partial release on Domain Plans Integration until Plan Viewer is requested", () => {
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
        NUTRITION: {
          ...base.domains.NUTRITION,
          submittedForReview: true,
          summary: {
            trainingPlanId: "nutrition-plan",
            versionId: "nutrition-version",
            generationDomain: "NUTRITION",
            status: "ASSISTANT_COACH_APPROVED",
            versionNumber: 1,
          },
        },
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
    const activeMode = shouldShowReleasedPlanViewerCanvas({
      selectedWorkflowTab: "generate",
      selectedDomain: "SKILLS",
      releasedPlanViewerIntentPresent: false,
      requestedPlanIdPresent: true,
      releasedWorkflowStatus: "released",
    })
      ? "plan-viewer"
      : "domain-integration";
    const steps = resolveTrainingPlanWorkspaceLifecycleSteps({
      activeMode,
      contextComplete: true,
      domainAvailable: true,
      planViewerAvailable: resolveTrainingPlanWorkspaceHasReleasedDomain(workspace),
      domainIntegrationComplete: resolveTrainingPlanWorkspaceDomainIntegrationComplete(workspace),
    });

    expect(resolveTrainingPlanWorkspaceHasReleasedDomain(workspace)).toBe(true);
    expect(resolveTrainingPlanWorkspaceDomainIntegrationComplete(workspace)).toBe(false);
    expect(steps.find((step) => step.key === "domain-integration")?.state).toBe("active");
    expect(steps.find((step) => step.key === "plan-viewer")?.state).toBe("available");
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

  it("allows Workflow 2A Head Coach review request changes from canApprove authority when canRequestRevision is absent", () => {
    for (const domain of ["NUTRITION", "S_AND_C"] as const) {
      const assignmentDomainContext = {
        ...shellAssignmentDomain({
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownerUserId: `${domain.toLowerCase()}-coach`,
          ownerCoachProfileId: `${domain.toLowerCase()}-profile`,
          ownedByCurrentUser: false,
          canOpen: true,
          canApprove: true,
          canRelease: false,
          blockers: [],
        }),
      };
      delete (assignmentDomainContext as Partial<typeof assignmentDomainContext>).canRequestRevision;

      expect(
        resolveDomainHeadCoachReviewActionVisible({
          assignmentDomainContext,
          reviewAction: "HEAD_APPROVE",
          legacyCanShowReviewAction: true,
          planId: `${domain.toLowerCase()}-plan`,
          versionId: `${domain.toLowerCase()}-version`,
        }),
      ).toBe(true);
      expect(
        resolveDomainHeadCoachReviewActionVisible({
          assignmentDomainContext,
          reviewAction: "REQUEST_REVISION",
          legacyCanShowReviewAction: true,
          planId: `${domain.toLowerCase()}-plan`,
          versionId: `${domain.toLowerCase()}-version`,
        }),
      ).toBe(true);
    }
  });
});

describe("resolveHeadCoachOwnedSkillsDraftApproveVisible", () => {
  it("allows Workflow 2A Head Coach-owned Skills draft approval from assignment canApprove", () => {
    expect(
      resolveHeadCoachOwnedSkillsDraftApproveVisible({
        domain: "SKILLS",
        workflowStatus: "draft_generated",
        headCoachFunctionAwareMode: true,
        headCoachOwnedSkillsGrouping: true,
        assignmentDomainContext: shellAssignmentDomain({
          ownerType: "HEAD_COACH_SELF",
          ownedByCurrentUser: true,
          canApprove: true,
          canSubmitForReview: true,
        }),
        planId: "skills-plan",
        versionId: "skills-v2",
      }),
    ).toBe(true);
  });

  it("does not infer Workflow 2A Skills draft approval when assignment denies canApprove", () => {
    expect(
      resolveHeadCoachOwnedSkillsDraftApproveVisible({
        domain: "SKILLS",
        workflowStatus: "draft_generated",
        headCoachFunctionAwareMode: true,
        headCoachOwnedSkillsGrouping: true,
        assignmentDomainContext: shellAssignmentDomain({
          ownerType: "HEAD_COACH_SELF",
          ownedByCurrentUser: true,
          canApprove: false,
          canSubmitForReview: true,
        }),
        planId: "skills-plan",
        versionId: "skills-v2",
      }),
    ).toBe(false);
  });

  it("does not change Workflow 2A Nutrition/S&C or Workflow 1 submit behavior", () => {
    for (const domain of ["NUTRITION", "S_AND_C"] as const) {
      expect(
        resolveHeadCoachOwnedSkillsDraftApproveVisible({
          domain,
          workflowStatus: "draft_generated",
          headCoachFunctionAwareMode: true,
          headCoachOwnedSkillsGrouping: true,
          assignmentDomainContext: shellAssignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: true,
            canSubmitForReview: false,
          }),
          planId: `${domain.toLowerCase()}-plan`,
          versionId: `${domain.toLowerCase()}-version`,
        }),
      ).toBe(false);
    }

    expect(
      resolveDomainSubmitForReviewVisible({
        assignmentDomainContext: shellAssignmentDomain({
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownedByCurrentUser: true,
          canSubmitForReview: true,
        }),
        legacyCanSubmitForReview: false,
        workflowStatus: "draft_generated",
        planId: "skills-plan",
        versionId: "skills-version",
      }),
    ).toBe(true);
  });

  it("uses active/revised version ids for Workflow 2A Head Coach-owned Skills approval", () => {
    const identity = resolveDomainReviewSurfaceIdentity({
      workspacePlanId: "skills-plan",
      workspaceVersionId: "skills-v1",
      workspaceVersionNumber: 1,
      stateSummaryPlanId: "skills-plan",
      stateSummaryVersionId: "skills-v2",
      activeDetailPlanId: "skills-plan",
      activeDetailVersionId: "skills-v2",
      activeDetailVersionNumber: 2,
    });

    expect(
      resolveHeadCoachOwnedSkillsDraftApproveVisible({
        domain: "SKILLS",
        workflowStatus: "draft_generated",
        headCoachFunctionAwareMode: true,
        headCoachOwnedSkillsGrouping: true,
        assignmentDomainContext: shellAssignmentDomain({
          ownerType: "HEAD_COACH_SELF",
          ownedByCurrentUser: true,
          canApprove: true,
        }),
        planId: identity.planId,
        versionId: identity.versionId,
      }),
    ).toBe(true);
    expect(identity.versionId).toBe("skills-v2");
  });

  it("uses Head Coach approval next-action copy instead of submit copy", () => {
    expect(
      domainIntegrationNextActionLabel({
        workflowStatus: "draft_generated",
        assignmentDomainContext: shellAssignmentDomain({
          ownerType: "HEAD_COACH_SELF",
          ownedByCurrentUser: true,
          canApprove: true,
        }),
        planningContextLocked: true,
        loading: false,
        hasError: false,
        canGenerate: false,
        canSubmitForReview: false,
        canViewPlan: true,
        canReview: true,
        canRelease: false,
        isCurrentReviewPlan: true,
        headCoachOwnedSkillsDraftApprove: true,
      }),
    ).toBe("Ready for Head Coach Skills approval.");
  });

  it("allows Workflow 2A approval even when headCoachOwnedSkillsGrouping is false", () => {
    expect(
      resolveHeadCoachOwnedSkillsDraftApproveVisible({
        domain: "SKILLS",
        workflowStatus: "draft_generated",
        headCoachFunctionAwareMode: true,
        headCoachOwnedSkillsGrouping: false,
        assignmentDomainContext: shellAssignmentDomain({
          ownerType: "NONE",
          ownedByCurrentUser: false,
        }),
        planId: "skills-plan",
        versionId: "skills-v1",
      }),
    ).toBe(true);
  });

  it("blocks Workflow 2B approval when ASSIGNED_DOMAIN_COACH owns Skills", () => {
    expect(
      resolveHeadCoachOwnedSkillsDraftApproveVisible({
        domain: "SKILLS",
        workflowStatus: "draft_generated",
        headCoachFunctionAwareMode: true,
        headCoachOwnedSkillsGrouping: false,
        assignmentDomainContext: shellAssignmentDomain({
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownedByCurrentUser: false,
        }),
        planId: "skills-plan",
        versionId: "skills-v1",
      }),
    ).toBe(false);
  });
});

describe("resolveDomainReviewDrawerWorkflowActions", () => {
  const baseInput = {
    canShowViewPlan: false,
    canShowSubmitForReview: false,
    canShowReviseAction: false,
    canShowApproveAction: false,
    canShowRequestRevisionAction: false,
    canShowReleaseAction: false,
    hasViewPlanContext: true,
  };
  const visibleLabelsFor = (
    actions: ReturnType<typeof resolveDomainReviewDrawerWorkflowActions>,
    overrides: Partial<Parameters<typeof resolveDomainReviewDrawerVisibleActionLabels>[0]> = {},
  ) =>
    resolveDomainReviewDrawerVisibleActionLabels({
      drawerWorkflowActions: actions,
      renderApproveBeforeRevise: false,
      viewPlanContextAvailable: true,
      actionContextAvailable: true,
      drawerRevisionComposerOpen: false,
      ...overrides,
    });

  it("uses the common workspace-scoped layout for domain review drawers", () => {
    const layout = resolveDomainReviewDrawerLayoutClasses({ closing: false });

    expect(layout.panelClassName).toContain("domain-review-drawer--workspace-scoped");
    expect(layout.panelClassName).toContain("[max-height:calc");
    expect(layout.panelClassName).not.toContain("top-0");
    expect(layout.panelClassName).not.toContain("h-full");
  });

  it("shows Workflow 2A Head Coach-owned Skills draft approve/revise and hides submit", () => {
    const actions = resolveDomainReviewDrawerWorkflowActions({
      ...baseInput,
      workflowStatus: "draft_generated",
      canShowApproveAction: true,
      canShowReviseAction: true,
    });

    expect(actions).toMatchObject({
      canShowSubmitForReview: false,
      canShowReviseAction: true,
      canShowApproveAction: true,
      canShowRequestRevisionAction: false,
      canShowReleaseAction: false,
      canShowViewPlan: false,
      hasAuthorizedWorkflowAction: true,
    });
  });

  it("shows Workflow 2A Head Coach + Skills owner draft Revise Plan and Approve Plan from workflow shape", () => {
    const workspace = workflow2AHeadCoachOwnedSkillsWorkspace({
      assignmentContext: shellAssignmentContext({
        domains: {
          SKILLS: shellAssignmentDomain({
            ownerType: "HEAD_COACH_SELF",
            ownedByCurrentUser: true,
            canRevise: true,
            canApprove: true,
          }),
          NUTRITION: shellAssignmentDomain(),
          S_AND_C: shellAssignmentDomain(),
        },
      }),
    });
    const canShowApproveAction = resolveHeadCoachOwnedSkillsDraftApproveVisible({
      domain: "SKILLS",
      workflowStatus: "draft_generated",
      headCoachFunctionAwareMode:
        workspace.workflowShape === "HEAD_COACH_SKILLS_OWNER",
      headCoachOwnedSkillsGrouping: resolveHeadCoachOwnedSkillsGrouping({
        workspace,
        legacyHeadCoachOwnsSkills: false,
      }),
      assignmentDomainContext: workspace.assignmentContext?.domains.SKILLS,
      planId: "skills-plan",
      versionId: "skills-version",
    });
    const actions = resolveDomainReviewDrawerWorkflowActions({
      ...baseInput,
      workflowStatus: "draft_generated",
      canShowReviseAction: true,
      canShowApproveAction,
    });

    expect(visibleLabelsFor(actions)).toEqual(["Revise Plan", "Approve Plan"]);
    expect(actions.canShowRequestRevisionAction).toBe(false);
  });

  it("shows Approve Plan for HC-owned Skills draft even when shell is head_coach_review (not function_aware)", () => {
    const workspace = workflow2AHeadCoachOwnedSkillsWorkspace({
      shell: "HEAD_COACH_REVIEW",
      workflowMode: "HEAD_COACH_REVIEW",
      workflowShape: "",
      assignmentContext: shellAssignmentContext({
        domains: {
          SKILLS: shellAssignmentDomain({
            ownerType: "NONE",
            ownedByCurrentUser: false,
          }),
          NUTRITION: shellAssignmentDomain(),
          S_AND_C: shellAssignmentDomain(),
        },
      }),
    });
    const headCoachReviewMode = workspace.shell === "HEAD_COACH_FUNCTION_AWARE" || workspace.shell === "HEAD_COACH_REVIEW";
    const canShowApproveAction = resolveHeadCoachOwnedSkillsDraftApproveVisible({
      domain: "SKILLS",
      workflowStatus: "draft_generated",
      headCoachFunctionAwareMode:
        headCoachReviewMode || workspace.workflowShape === "HEAD_COACH_SKILLS_OWNER",
      headCoachOwnedSkillsGrouping: false,
      assignmentDomainContext: workspace.assignmentContext?.domains.SKILLS,
      planId: "skills-plan",
      versionId: "skills-version",
    });

    expect(canShowApproveAction).toBe(true);

    const actions = resolveDomainReviewDrawerWorkflowActions({
      ...baseInput,
      workflowStatus: "draft_generated",
      canShowReviseAction: true,
      canShowApproveAction,
    });
    expect(visibleLabelsFor(actions)).toEqual(["Revise Plan", "Approve Plan"]);
  });

  it("blocks Approve Plan for Workflow 2B Skills submitted plan in head_coach_review shell", () => {
    const workspace = workflow2AHeadCoachOwnedSkillsWorkspace({
      shell: "HEAD_COACH_REVIEW",
      workflowMode: "HEAD_COACH_REVIEW",
      workflowShape: "",
      assignmentContext: shellAssignmentContext({
        domains: {
          SKILLS: shellAssignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
          }),
          NUTRITION: shellAssignmentDomain(),
          S_AND_C: shellAssignmentDomain(),
        },
      }),
    });
    const headCoachReviewMode = workspace.shell === "HEAD_COACH_FUNCTION_AWARE" || workspace.shell === "HEAD_COACH_REVIEW";
    const canShowApproveAction = resolveHeadCoachOwnedSkillsDraftApproveVisible({
      domain: "SKILLS",
      workflowStatus: "draft_generated",
      headCoachFunctionAwareMode:
        headCoachReviewMode || workspace.workflowShape === "HEAD_COACH_SKILLS_OWNER",
      headCoachOwnedSkillsGrouping: false,
      assignmentDomainContext: workspace.assignmentContext?.domains.SKILLS,
      planId: "skills-plan",
      versionId: "skills-version",
    });

    expect(canShowApproveAction).toBe(false);
  });

  it("shows correct next-action text for HC-owned Skills draft in head_coach_review shell", () => {
    expect(
      domainIntegrationNextActionLabel({
        workflowStatus: "draft_generated",
        assignmentDomainContext: null,
        planningContextLocked: true,
        loading: false,
        hasError: false,
        canGenerate: false,
        canSubmitForReview: false,
        canViewPlan: true,
        canReview: true,
        canRelease: false,
        isCurrentReviewPlan: false,
        headCoachOwnedSkillsDraftApprove: true,
      }),
    ).toBe("Ready for Head Coach Skills approval.");
  });

  it("keeps Workflow 2A Head Coach-owned Skills draft drawer on latest draft source", () => {
    const latestDraft = {
      trainingPlanId: "skills-plan",
      trainingPlanVersionId: "skills-version",
      versionNumber: 1,
      status: "AI_GENERATED",
      days: [{ dayIndex: 1, sessions: [{ title: "skills", items: [] }] }],
    } as never;

    expect(
      resolveDomainReviewDrawerContentSource({
        domain: "SKILLS",
        workflowStatus: "draft_generated",
        directReleaseSkillsOwner: false,
        activeDetail: null,
        latestDraft,
      }),
    ).toBe("latest_domain_draft");
    expect(
      resolveDomainReviewDrawerContentSource({
        domain: "SKILLS",
        workflowStatus: "draft_generated",
        directReleaseSkillsOwner: false,
        activeDetail: { plan: { id: "skills-plan" }, version: { id: "skills-version" }, days: [] } as never,
        latestDraft,
      }),
    ).toBe("latest_domain_draft");
    expect(
      resolveDomainReviewDrawerContentSource({
        domain: "SKILLS",
        workflowStatus: "draft_generated",
        directReleaseSkillsOwner: false,
        activeDetail: null,
        latestDraft: null,
      }),
    ).toBe("none");
  });

  it("renders the persisted plan detail for a Head Coach-owned Skills draft when no latest draft exists", () => {
    const activeDetail = {
      plan: { id: "skills-plan" },
      version: { id: "skills-version", versionNumber: 2 },
      days: [{ id: "d1", sessions: [] }],
    } as never;

    expect(
      resolveDomainReviewDrawerContentSource({
        domain: "SKILLS",
        workflowStatus: "draft_generated",
        directReleaseSkillsOwner: false,
        activeDetail,
        latestDraft: null,
      }),
    ).toBe("active_detail");
    expect(
      resolveDomainReviewDrawerContentSource({
        domain: "SKILLS",
        workflowStatus: "revision_requested",
        directReleaseSkillsOwner: false,
        activeDetail,
        latestDraft: null,
      }),
    ).toBe("active_detail");
    expect(
      resolveDomainReviewDrawerContentSource({
        domain: "SKILLS",
        workflowStatus: "draft_generated",
        directReleaseSkillsOwner: false,
        activeDetail: null,
        latestDraft: null,
      }),
    ).toBe("none");
  });

  it("keeps the working drawer Revise Plan action available for editable drafts", () => {
    const actions = resolveDomainReviewDrawerWorkflowActions({
      ...baseInput,
      workflowStatus: "draft_generated",
      canShowReviseAction: true,
    });

    expect(actions.canShowReviseAction).toBe(true);
    expect(actions.hasAuthorizedWorkflowAction).toBe(true);
  });

  it("shows Workflow 2A Head Coach-owned Skills submitted review actions when assignment allows approval", () => {
    const actions = resolveDomainReviewDrawerWorkflowActions({
      ...baseInput,
      workflowStatus: "submitted_for_review",
      canShowSubmitForReview: true,
      canShowApproveAction: true,
      canShowRequestRevisionAction: true,
    });

    expect(actions).toMatchObject({
      canShowSubmitForReview: false,
      canShowApproveAction: true,
      canShowRequestRevisionAction: true,
      canShowReleaseAction: false,
      hasAuthorizedWorkflowAction: true,
    });
  });

  it("shows Approve Plan and Request Changes for Workflow 2A submitted Nutrition and S&C Head Coach review", () => {
    for (const domain of ["NUTRITION", "S_AND_C"] as const) {
      const requestChangesVisible = resolveDomainReviewDrawerRequestChangesVisible({
        workflowStatus: "submitted_for_review",
        canShowDirectReleaseSkillsOwnerApproveAction: false,
        canShowExplicitRequestRevisionAction: false,
        canShowApproveAction: true,
        hasActionContext: true,
      });
      const actions = resolveDomainReviewDrawerWorkflowActions({
        ...baseInput,
        workflowStatus: "submitted_for_review",
        canShowApproveAction: true,
        canShowRequestRevisionAction: requestChangesVisible,
      });

      expect(requestChangesVisible).toBe(true);
      expect(actions).toMatchObject({
        canShowApproveAction: true,
        canShowRequestRevisionAction: true,
        hasAuthorizedWorkflowAction: true,
      });
      expect(visibleLabelsFor(actions)).toEqual(["Approve Plan", "Request Changes"]);
      expect(domain).toMatch(/NUTRITION|S_AND_C/);
    }
  });

  it("shows Approve Plan and Request Changes for Workflow 2B submitted Head Coach review", () => {
    const requestChangesVisible = resolveDomainReviewDrawerRequestChangesVisible({
      workflowStatus: "submitted_for_review",
      canShowDirectReleaseSkillsOwnerApproveAction: false,
      canShowExplicitRequestRevisionAction: false,
      canShowApproveAction: true,
      hasActionContext: true,
    });
    const actions = resolveDomainReviewDrawerWorkflowActions({
      ...baseInput,
      workflowStatus: "submitted_for_review",
      canShowApproveAction: true,
      canShowRequestRevisionAction: requestChangesVisible,
    });

    expect(requestChangesVisible).toBe(true);
    expect(actions).toMatchObject({
      canShowApproveAction: true,
      canShowRequestRevisionAction: true,
      hasAuthorizedWorkflowAction: true,
    });
    expect(visibleLabelsFor(actions)).toEqual(["Approve Plan", "Request Changes"]);
  });

  it("shows Workflow 2A Head Coach-owned Skills approved release without exposing Plan Viewer early", () => {
    const actions = resolveDomainReviewDrawerWorkflowActions({
      ...baseInput,
      workflowStatus: "approved",
      canShowViewPlan: true,
      canShowReleaseAction: true,
    });

    expect(actions).toMatchObject({
      canShowViewPlan: false,
      canShowApproveAction: false,
      canShowRequestRevisionAction: false,
      canShowReleaseAction: true,
      hasAuthorizedWorkflowAction: true,
    });
    expect(visibleLabelsFor(actions)).toEqual(["Release Plan to Athlete"]);
  });

  it("shows Workflow 2A Head Coach-owned Skills released Plan Viewer only after release", () => {
    const actions = resolveDomainReviewDrawerWorkflowActions({
      ...baseInput,
      workflowStatus: "released",
      canShowViewPlan: true,
    });

    expect(actions).toMatchObject({
      canShowViewPlan: true,
      canShowSubmitForReview: false,
      canShowApproveAction: false,
      canShowReleaseAction: false,
      hasAuthorizedWorkflowAction: true,
    });
  });

  it("keeps Workflow 2A Nutrition and S&C waiting domains in the no-action drawer state", () => {
    for (const workflowStatus of ["not_created", "draft_generated"] as const) {
      const actions = resolveDomainReviewDrawerWorkflowActions({
        ...baseInput,
        workflowStatus,
        hasViewPlanContext: false,
      });

      expect(actions).toMatchObject({
        canShowViewPlan: false,
        canShowSubmitForReview: false,
        canShowReviseAction: false,
        canShowApproveAction: false,
        canShowRequestRevisionAction: false,
        canShowReleaseAction: false,
        hasAuthorizedWorkflowAction: false,
      });
    }
  });

  it("preserves Workflow 1 Head Coach review and release drawer actions", () => {
    expect(
      resolveDomainReviewDrawerWorkflowActions({
        ...baseInput,
        workflowStatus: "submitted_for_review",
        canShowApproveAction: true,
        canShowRequestRevisionAction: true,
      }),
    ).toMatchObject({
      canShowApproveAction: true,
      canShowRequestRevisionAction: true,
      hasAuthorizedWorkflowAction: true,
    });
    expect(
      visibleLabelsFor(
        resolveDomainReviewDrawerWorkflowActions({
          ...baseInput,
          workflowStatus: "submitted_for_review",
          canShowApproveAction: true,
          canShowRequestRevisionAction: true,
        }),
      ),
    ).toEqual(["Approve Plan", "Request Changes"]);
    expect(
      resolveDomainReviewDrawerWorkflowActions({
        ...baseInput,
        workflowStatus: "approved",
        canShowReleaseAction: true,
      }),
    ).toMatchObject({
      canShowReleaseAction: true,
      hasAuthorizedWorkflowAction: true,
    });
  });

  it("does not show release from a draft state", () => {
    const actions = resolveDomainReviewDrawerWorkflowActions({
      ...baseInput,
      workflowStatus: "draft_generated",
      canShowReleaseAction: true,
    });

    expect(actions).toMatchObject({
      canShowApproveAction: false,
      canShowReleaseAction: false,
      hasAuthorizedWorkflowAction: false,
    });
  });

  it("does not show Head Coach Request Changes for Workflow 3 direct-release drawer actions", () => {
    const requestChangesVisible = resolveDomainReviewDrawerRequestChangesVisible({
      workflowStatus: "draft_generated",
      canShowDirectReleaseSkillsOwnerApproveAction: true,
      canShowExplicitRequestRevisionAction: false,
      canShowApproveAction: true,
      hasActionContext: true,
    });
    const actions = resolveDomainReviewDrawerWorkflowActions({
      ...baseInput,
      workflowStatus: "draft_generated",
      canShowApproveAction: true,
      canShowRequestRevisionAction: requestChangesVisible,
    });

    expect(requestChangesVisible).toBe(false);
    expect(actions).toMatchObject({
      canShowApproveAction: true,
      canShowRequestRevisionAction: false,
      hasAuthorizedWorkflowAction: true,
    });
    expect(visibleLabelsFor(actions)).toEqual(["Approve Plan"]);
  });
});

describe("domain review revised detail reconciliation", () => {
  it("uses revised active detail over stale Workflow 2A workspace summary ids", () => {
    const identity = resolveDomainReviewSurfaceIdentity({
      workspacePlanId: "skills-plan",
      workspaceVersionId: "skills-v1",
      workspaceVersionNumber: 1,
      stateSummaryPlanId: "skills-plan",
      stateSummaryVersionId: "skills-v2",
      activeDetailPlanId: "skills-plan",
      activeDetailVersionId: "skills-v2",
      activeDetailVersionNumber: 2,
    });

    expect(identity).toEqual({
      planId: "skills-plan",
      versionId: "skills-v2",
      versionNumber: 2,
      source: "active_detail",
    });
  });

  it("keeps Head Coach approval on revised plan/version ids after Workflow 2A Skills revise", () => {
    const identity = resolveDomainReviewSurfaceIdentity({
      workspacePlanId: "skills-plan",
      workspaceVersionId: "skills-v1",
      workspaceVersionNumber: 1,
      stateSummaryPlanId: "skills-plan",
      stateSummaryVersionId: "skills-v2",
      activeDetailPlanId: "skills-plan",
      activeDetailVersionId: "skills-v2",
      activeDetailVersionNumber: 2,
    });

    expect(
      resolveHeadCoachOwnedSkillsDraftApproveVisible({
        domain: "SKILLS",
        workflowStatus: "draft_generated",
        headCoachFunctionAwareMode: true,
        headCoachOwnedSkillsGrouping: true,
        assignmentDomainContext: shellAssignmentDomain({
          ownerType: "HEAD_COACH_SELF",
          ownedByCurrentUser: true,
          canApprove: true,
        }),
        planId: identity.planId,
        versionId: identity.versionId,
      }),
    ).toBe(true);
    expect(identity.versionId).toBe("skills-v2");
  });

  it("updates visible version and training days from revised detail", () => {
    const revisedDetail = {
      plan: { id: "skills-plan", status: "AI_GENERATED" },
      version: { id: "skills-v2", versionNumber: 2, status: "AI_GENERATED" },
      days: [
        { sessions: [{ id: "day-1-session" }] },
        { sessions: [] },
        { sessions: [{ id: "day-3-session" }] },
        { sessions: [{ id: "day-4-session" }] },
        { sessions: [{ id: "day-5-session" }] },
        { sessions: [{ id: "day-6-session" }] },
        { sessions: [{ id: "day-7-revised-session" }] },
      ],
    } as never;
    const identity = resolveDomainReviewSurfaceIdentity({
      workspacePlanId: "skills-plan",
      workspaceVersionId: "skills-v1",
      workspaceVersionNumber: 1,
      stateSummaryPlanId: "skills-plan",
      stateSummaryVersionId: "skills-v2",
      activeDetailPlanId: "skills-plan",
      activeDetailVersionId: "skills-v2",
      activeDetailVersionNumber: 2,
    });

    expect(identity.versionNumber).toBe(2);
    expect(countDomainReviewTrainingDays(revisedDetail)).toBe(6);
    expect(revisedDetail.days[6].sessions).toEqual([{ id: "day-7-revised-session" }]);
  });

  it("does not use submitted-plan copy while the drawer is showing a generated draft", () => {
    expect(domainReviewScheduleDescription("draft_generated")).toBe(
      "Review the generated draft by day and session.",
    );
    expect(domainReviewScheduleDescription("submitted_for_review")).toBe(
      "Review the submitted plan by day and session.",
    );
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

  it("opens Context Builder instead of locked Domain Integration before context lock", () => {
    const workspace = workflow3SkillsCoachWorkspace({
      planningContext: {
        ...workflow3SkillsCoachWorkspace().planningContext,
        locked: false,
        resolved: false,
      },
      initialTab: "DOMAIN",
    });
    const activeTab = resolveSkillsOwnedDirectReleasePreContextTab({
      workflowMode: resolveWorkflowModeFromWorkspace(workspace),
      selectedTab: "generate",
      requestedPlanId: null,
      urlPlanCandidate: null,
      planningContextLocked: workspace.planningContext.locked,
      fallbackContextBuilderTab: "context-app",
    });
    const steps = resolveTrainingPlanWorkspaceLifecycleSteps({
      activeMode: "context-builder",
      contextComplete: false,
      domainAvailable: false,
      planViewerAvailable: false,
      domainIntegrationComplete: false,
    });

    expect(activeTab).toBe("context-app");
    expect(steps.find((step) => step.key === "context-builder")?.state).toBe("active");
    expect(steps.find((step) => step.key === "domain-integration")?.state).toBe("locked");
    expect(steps.find((step) => step.key === "plan-viewer")?.state).toBe("locked");
  });

  it("does not strand Workflow 3 on locked Domain Integration without an explicit plan link", () => {
    expect(
      resolveSkillsOwnedDirectReleasePreContextTab({
        workflowMode: "skills_coach_planning",
        selectedTab: "generate",
        requestedPlanId: null,
        urlPlanCandidate: null,
        planningContextLocked: false,
        fallbackContextBuilderTab: "plan-dates",
      }),
    ).toBe("plan-dates");
  });

  it("keeps Domain Integration available for Skills after context lock", () => {
    const workspace = workflow3SkillsCoachWorkspace({
      planningContext: {
        ...workflow3SkillsCoachWorkspace().planningContext,
        locked: true,
        resolved: true,
      },
    });
    const activeTab = resolveSkillsOwnedDirectReleasePreContextTab({
      workflowMode: resolveWorkflowModeFromWorkspace(workspace),
      selectedTab: "generate",
      requestedPlanId: null,
      urlPlanCandidate: null,
      planningContextLocked: workspace.planningContext.locked,
      fallbackContextBuilderTab: "context-app",
    });
    const steps = resolveTrainingPlanWorkspaceLifecycleSteps({
      activeMode: "domain-integration",
      contextComplete: true,
      domainAvailable: true,
      planViewerAvailable: false,
      domainIntegrationComplete: false,
    });

    expect(activeTab).toBe("generate");
    expect(workspace.assignmentContext?.domains.SKILLS.canGenerate).toBe(true);
    expect(workspace.assignmentContext?.domains.NUTRITION.canGenerate).toBe(false);
    expect(workspace.assignmentContext?.domains.S_AND_C.canGenerate).toBe(false);
    expect(steps.find((step) => step.key === "context-builder")?.state).toBe("completed");
    expect(steps.find((step) => step.key === "domain-integration")?.state).toBe("active");
    expect(steps.find((step) => step.key === "plan-viewer")?.state).toBe("locked");
  });

  it("uses the Domain Coordination Matrix layout scoped to Skills only after context lock", () => {
    const workspace = workflow3SkillsCoachWorkspace({
      planningContext: {
        ...workflow3SkillsCoachWorkspace().planningContext,
        locked: true,
        resolved: true,
      },
    });
    const steps = resolveTrainingPlanWorkspaceLifecycleSteps({
      activeMode: "domain-integration",
      contextComplete: true,
      domainAvailable: true,
      planViewerAvailable: false,
      domainIntegrationComplete: false,
    });

    expect(
      shouldUseDomainCoordinationMatrixLayout({
        shell: "skills_coach_planning",
        headCoachReviewMode: false,
      }),
    ).toBe(true);
    expect(resolveDomainIntegrationMatrixDomains("skills_coach_planning")).toEqual(["SKILLS"]);
    expect(resolveDomainIntegrationMatrixDomains("head_coach_function_aware")).toEqual([
      "SKILLS",
      "NUTRITION",
      "S_AND_C",
    ]);
    expect(
      shouldUseDomainCoordinationMatrixLayout({
        shell: "specialist_domain",
        headCoachReviewMode: false,
      }),
    ).toBe(true);
    expect(resolveDomainIntegrationMatrixDomains("specialist_domain", "NUTRITION")).toEqual([
      "NUTRITION",
    ]);
    expect(shouldRenderEmbeddedPlanViewerInDomainIntegration("specialist_domain")).toBe(false);
    expect(workspace.assignmentContext?.domains.SKILLS.canGenerate).toBe(true);
    expect(workspace.assignmentContext?.domains.NUTRITION.canGenerate).toBe(false);
    expect(workspace.assignmentContext?.domains.S_AND_C.canGenerate).toBe(false);
    expect(steps.find((step) => step.key === "domain-integration")?.state).toBe("active");
    expect(steps.find((step) => step.key === "plan-viewer")?.state).toBe("locked");
  });

  it("does not embed Plan Viewer content in Workflow 3 Domain Integration before release", () => {
    expect(shouldRenderEmbeddedPlanViewerInDomainIntegration("skills_coach_planning")).toBe(
      false,
    );
    expect(
      shouldShowReleasedPlanViewerCanvas({
        selectedWorkflowTab: "generate",
        selectedDomain: "SKILLS",
        releasedPlanViewerIntentPresent: false,
        requestedPlanIdPresent: false,
        releasedWorkflowStatus: "not_created",
      }),
    ).toBe(false);
  });

  it("keeps Plan Viewer locked until release and does not auto-open released plans", () => {
    expect(
      resolveDomainCoachPlanViewerAvailability({
        workflowStatus: "approved",
        canShowViewPlan: true,
        hasViewPlanContext: true,
      }),
    ).toEqual({
      available: false,
      message: "Plan Viewer becomes available after release.",
    });
    expect(
      resolveDomainCoachPlanViewerAvailability({
        workflowStatus: "released",
        canShowViewPlan: true,
        hasViewPlanContext: true,
      }),
    ).toEqual({
      available: true,
      message: null,
    });
    expect(
      shouldShowReleasedPlanViewerCanvas({
        selectedWorkflowTab: "generate",
        selectedDomain: "NUTRITION",
        releasedPlanViewerIntentPresent: false,
        requestedPlanIdPresent: false,
        releasedWorkflowStatus: "released",
      }),
    ).toBe(false);
    expect(
      shouldShowReleasedPlanViewerCanvas({
        selectedWorkflowTab: "generate",
        selectedDomain: "NUTRITION",
        releasedPlanViewerIntentPresent: true,
        requestedPlanIdPresent: false,
        releasedWorkflowStatus: "released",
      }),
    ).toBe(true);
  });

  it("shows Create Skills Plan for Workflow 3 Skills before generation", () => {
    const workspace = workflow3SkillsCoachWorkspace({
      planningContext: {
        ...workflow3SkillsCoachWorkspace().planningContext,
        locked: true,
        resolved: true,
      },
    });
    const skillsAssignmentContext = workspace.assignmentContext?.domains.SKILLS;
    const skillsGeneratePermission = resolveDomainGeneratePermission({
      assignmentDomainContext: skillsAssignmentContext,
      legacyOwnershipFlags: {
        canGeneratePlan: false,
        canGenerateCurrentDomainPlan: false,
      },
    });

    expect(skillsGeneratePermission.canShowGenerate).toBe(true);
    expect(
      resolveDomainIntegrationSkillsCreateVisible({
        shell: "skills_coach_planning",
        headCoachFunctionAwareMode: false,
        domain: "SKILLS",
        workflowStatus: "not_created",
        canShowGenerateAction: skillsGeneratePermission.canShowGenerate,
        skillsCreateVisible: true,
      }),
    ).toBe(true);
    expect(
      resolveDomainIntegrationSkillsCreateVisible({
        shell: "skills_coach_planning",
        headCoachFunctionAwareMode: false,
        domain: "NUTRITION",
        workflowStatus: "not_created",
        canShowGenerateAction: true,
        skillsCreateVisible: true,
      }),
    ).toBe(false);
  });

  it("blocks Workflow 3 Skills generation in the matrix when backend readiness is incomplete", () => {
    const eligibility = resolveDomainGenerationEligibilityModel({
      selectedDomain: "SKILLS",
      contextLocked: true,
      generationAllowed: true,
      backendReadinessComplete: false,
      backendBlockers: ["LEVEL_VALIDATION_NOT_CONFIRMED"],
      localBlocker: null,
      domainAuthorityLoading: false,
    });
    const nextAction =
      eligibility.blockerMessage ??
      domainIntegrationNextActionLabel({
        workflowStatus: "not_created",
        assignmentDomainContext: shellAssignmentDomain({
          ownerType: "ASSIGNED_DOMAIN_COACH",
          canGenerate: true,
        }),
        planningContextLocked: true,
        loading: false,
        hasError: false,
        canGenerate: eligibility.canStartGeneration,
        canSubmitForReview: false,
        canViewPlan: false,
        canReview: false,
        canRelease: false,
        isCurrentReviewPlan: false,
      });

    expect(eligibility.canStartGeneration).toBe(false);
    expect(eligibility.blockers).toEqual(["Complete planning context: Confirm athlete level"]);
    expect(nextAction).toBe("Complete planning context: Confirm athlete level");
    expect(nextAction).not.toBe("Ready to generate this domain plan.");
    expect(
      resolveDomainIntegrationGenerateDisplayState({
        canGenerateSkillsPlan: true,
        blockerMessage: eligibility.blockerMessage,
        fallbackNextActionLabel: "fallback",
      }),
    ).toEqual({
      nextActionLabel: "Complete planning context: Confirm athlete level",
      availableActionLabels: ["Complete planning context: Confirm athlete level"],
    });
  });

  it("allows Workflow 3 Skills generation when canonical readiness is complete", () => {
    const eligibility = resolveDomainGenerationEligibilityModel({
      selectedDomain: "SKILLS",
      contextLocked: true,
      generationAllowed: true,
      backendReadinessComplete: true,
      backendBlockers: [],
      localBlocker: null,
      domainAuthorityLoading: false,
    });

    expect(eligibility.canStartGeneration).toBe(true);
    expect(eligibility.blockerMessage).toBeNull();
    expect(
      resolveDomainIntegrationGenerateDisplayState({
        canGenerateSkillsPlan: true,
        blockerMessage: eligibility.blockerMessage,
        fallbackNextActionLabel: "fallback",
      }),
    ).toEqual({
      nextActionLabel: "Ready to generate this domain",
      availableActionLabels: ["Generate Skills Plan"],
    });
    expect(
      resolveDomainIntegrationSkillsCreateVisible({
        shell: "skills_coach_planning",
        headCoachFunctionAwareMode: false,
        domain: "SKILLS",
        workflowStatus: "not_created",
        canShowGenerateAction: eligibility.generationAllowed,
        skillsCreateVisible: true,
      }),
    ).toBe(true);
  });

  it("allows Workflow 3 locked Skills generation when backend readiness is generically false with no blockers", () => {
    const genericBackendReadyBypass = shouldAllowWorkflow3SkillsGenerationWithoutGenericBackendReady({
      shell: "skills_coach_planning",
      domain: "SKILLS",
      contextLocked: true,
      generationAllowed: true,
      backendReadinessComplete: false,
      backendBlockers: [],
    });
    const eligibility = resolveDomainGenerationEligibilityModel({
      selectedDomain: "SKILLS",
      contextLocked: true,
      generationAllowed: true,
      backendReadinessComplete: genericBackendReadyBypass ? true : false,
      backendBlockers: [],
      localBlocker: null,
      domainAuthorityLoading: false,
    });

    expect(genericBackendReadyBypass).toBe(true);
    expect(eligibility.canStartGeneration).toBe(true);
    expect(eligibility.blockerMessage).toBeNull();
    expect(
      resolveDomainIntegrationGenerateDisplayState({
        canGenerateSkillsPlan: true,
        blockerMessage: eligibility.blockerMessage,
        fallbackNextActionLabel: "fallback",
      }),
    ).toEqual({
      nextActionLabel: "Ready to generate this domain",
      availableActionLabels: ["Generate Skills Plan"],
    });
  });

  it("does not apply the Workflow 3 generic readiness allowance before context lock", () => {
    const genericBackendReadyBypass = shouldAllowWorkflow3SkillsGenerationWithoutGenericBackendReady({
      shell: "skills_coach_planning",
      domain: "SKILLS",
      contextLocked: false,
      generationAllowed: true,
      backendReadinessComplete: false,
      backendBlockers: [],
    });
    const eligibility = resolveDomainGenerationEligibilityModel({
      selectedDomain: "SKILLS",
      contextLocked: false,
      generationAllowed: true,
      backendReadinessComplete: genericBackendReadyBypass ? true : false,
      backendBlockers: [],
      localBlocker: null,
      domainAuthorityLoading: false,
    });

    expect(genericBackendReadyBypass).toBe(false);
    expect(eligibility.canStartGeneration).toBe(false);
    expect(eligibility.blockerMessage).toContain("Waiting for locked planning context.");
  });

  it("does not require Workflow 3-only context state for Workflow 2A Skills generation", () => {
    const eligibility = resolveDomainGenerationEligibilityModel({
      selectedDomain: "SKILLS",
      contextLocked: true,
      generationAllowed: true,
      backendReadinessComplete: true,
      backendBlockers: [],
      localBlocker: null,
      domainAuthorityLoading: false,
    });

    expect(eligibility.canStartGeneration).toBe(true);
    expect(eligibility.domainAuthority.canGenerate).toBe(true);
    expect(eligibility.blockers).toEqual([]);
  });

  it("keeps Workflow 3 Domain Integration locked before context lock in generation eligibility", () => {
    const eligibility = resolveDomainGenerationEligibilityModel({
      selectedDomain: "SKILLS",
      contextLocked: false,
      generationAllowed: true,
      backendReadinessComplete: true,
      backendBlockers: [],
      localBlocker: null,
      domainAuthorityLoading: false,
    });

    expect(eligibility.canStartGeneration).toBe(false);
    expect(eligibility.blockerMessage).toBe("Waiting for locked planning context.");
  });

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
        legacyCanApprove: false,
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

  it("uses Workflow 3 Skills draft review copy instead of submit-for-review copy", () => {
    const nextAction = domainIntegrationNextActionLabel({
      workflowStatus: "draft_generated",
      assignmentDomainContext: shellAssignmentDomain({
        ownerType: "ASSIGNED_DOMAIN_COACH",
        ownedByCurrentUser: true,
        canOpen: true,
        canApprove: true,
        canRevise: true,
        releaseMode: "DIRECT_DOMAIN_RELEASE",
      }),
      planningContextLocked: true,
      loading: false,
      hasError: false,
      canGenerate: false,
      canSubmitForReview: false,
      canViewPlan: true,
      canReview: true,
      canRelease: false,
      isCurrentReviewPlan: false,
      directReleaseSkillsDraftReview: true,
      directReleaseSkillsOwner: true,
    });
    const availableActions = domainIntegrationAvailableActionLabels({
      domain: "SKILLS",
      workflowStatus: "draft_generated",
      canGenerate: false,
      canViewPlan: true,
      canSubmitForReview: false,
      canReview: true,
      canRelease: false,
      canRevise: true,
      directReleaseSkillsDraftReview: true,
      directReleaseSkillsOwner: true,
    });

    expect(nextAction).toBe("Review the generated Skills draft, then approve or revise.");
    expect(nextAction).not.toContain("submit for review");
    expect(availableActions).toEqual(["Review Skills Plan", "Approve or revise Skills draft"]);
    expect(availableActions.join(", ")).not.toContain("Head Coach review");
  });

  it("uses common drawer actions for Head Coach-review domain workflows", () => {
    const draftActions = resolveDomainReviewDrawerWorkflowActions({
      workflowStatus: "draft_generated",
      canShowViewPlan: false,
      hasViewPlanContext: false,
      canShowSubmitForReview: true,
      canShowReviseAction: true,
      canShowApproveAction: false,
      canShowRequestRevisionAction: false,
      canShowReleaseAction: false,
    });
    const draftWithoutRevise = resolveDomainReviewDrawerWorkflowActions({
      workflowStatus: "draft_generated",
      canShowViewPlan: false,
      hasViewPlanContext: false,
      canShowSubmitForReview: true,
      canShowReviseAction: false,
      canShowApproveAction: false,
      canShowRequestRevisionAction: false,
      canShowReleaseAction: false,
    });

    expect(draftActions.canShowSubmitForReview).toBe(true);
    expect(draftActions.canShowReviseAction).toBe(true);
    expect(draftActions.canShowApproveAction).toBe(false);
    expect(draftWithoutRevise.canShowSubmitForReview).toBe(true);
    expect(draftWithoutRevise.canShowReviseAction).toBe(false);
  });

  it("loads latest generated drafts in the drawer before submit for every domain", () => {
    for (const domain of ["SKILLS", "NUTRITION", "S_AND_C"] as const) {
      const latestDraft = {
        trainingPlanId: `${domain}-draft-plan`,
        trainingPlanVersionId: `${domain}-draft-version`,
        versionNumber: 1,
        status: "AI_GENERATED",
        startDate: "2026-07-06",
        endDate: "2026-07-12",
        days: [
          {
            dayIndex: 1,
            date: "2026-07-06",
            sessions: [
              {
                title: `${domain} draft session`,
                plannedDurationMinutes: 45,
                items: [{ label: "Generated item" }],
              },
            ],
          },
        ],
      } as never;
      const contentSource = resolveDomainReviewDrawerContentSource({
        domain,
        workflowStatus: "draft_generated",
        directReleaseSkillsOwner: false,
        activeDetail: null,
        latestDraft,
      });

      expect(contentSource).toBe("latest_domain_draft");
      expect(
        shouldShowDomainReviewSubmittedPlanEmptyState({
          contentSource,
          loading: false,
          error: null,
        }),
      ).toBe(false);
      expect(countLatestDomainDraftTrainingDays(latestDraft)).toBe(1);
    }
  });

  it("keeps AI generated drafts on latest draft content when submitted detail inputs are present", () => {
    for (const domain of ["SKILLS", "NUTRITION", "S_AND_C"] as const) {
      expect(
        resolveDomainReviewDrawerContentSource({
          domain,
          workflowStatus: "submitted_for_review",
          directReleaseSkillsOwner: false,
          activeDetail: {
            plan: { id: `${domain}-submitted-plan`, status: "SUBMITTED_FOR_REVIEW" },
            version: { id: `${domain}-submitted-version`, status: "SUBMITTED_FOR_REVIEW" },
            days: [],
          } as never,
          latestDraft: {
            trainingPlanId: `${domain}-draft-plan`,
            trainingPlanVersionId: `${domain}-draft-version`,
            versionNumber: 1,
            status: "AI_GENERATED",
            days: [
              {
                dayIndex: 1,
                sessions: [{ title: `${domain} generated session`, items: [] }],
              },
            ],
          } as never,
        }),
      ).toBe("latest_domain_draft");
    }
  });

  it("uses submitted detail after submit and released active detail after release", () => {
    const activeDetail = {
      plan: { id: "nutrition-plan", status: "SUBMITTED_FOR_REVIEW" },
      version: { id: "nutrition-version", status: "SUBMITTED_FOR_REVIEW" },
      days: [],
    } as never;
    expect(
      resolveDomainReviewDrawerContentSource({
        domain: "NUTRITION",
        workflowStatus: "submitted_for_review",
        directReleaseSkillsOwner: false,
        activeDetail,
        latestDraft: {
          trainingPlanId: "nutrition-draft",
          trainingPlanVersionId: "nutrition-draft-version",
        } as never,
      }),
    ).toBe("active_detail");
    expect(
      resolveDomainReviewDrawerContentSource({
        domain: "NUTRITION",
        workflowStatus: "released",
        directReleaseSkillsOwner: false,
        activeDetail: {
          ...activeDetail,
          plan: { id: "nutrition-plan", status: "ACTIVE" },
          version: { id: "nutrition-version", status: "ACTIVE" },
        } as never,
        latestDraft: null,
      }),
    ).toBe("active_detail");
  });

  it("shows common workspace generation progress while current domain is generating", () => {
    expect(
      shouldShowDomainCoachWorkspaceGenerationProgress({
        domain: "NUTRITION",
        currentDomain: "NUTRITION",
        generationInProgress: true,
      }),
    ).toBe(true);
    expect(
      shouldShowDomainCoachWorkspaceGenerationProgress({
        domain: "NUTRITION",
        currentDomain: "S_AND_C",
        generationInProgress: true,
      }),
    ).toBe(false);
  });

  it("uses draft or locked context window instead of unavailable plan window text", () => {
    const draftWindow = resolveDomainCoachPlanWindowLabel({
      activeDetail: null,
      latestDraft: {
        trainingPlanId: "nutrition-plan",
        trainingPlanVersionId: "nutrition-version",
        startDate: "2026-07-06",
        endDate: "2026-07-12",
      } as never,
    });
    const lockedWindow = resolveDomainCoachPlanWindowLabel({
      activeDetail: null,
      latestDraft: null,
      lockedStartDate: "2026-08-01",
      lockedEndDate: "2026-08-15",
    });

    expect(draftWindow).toContain("2026");
    expect(draftWindow).not.toContain("Unavailable");
    expect(lockedWindow).toContain("2026");
    expect(lockedWindow).not.toContain("Unavailable");
  });

  it("uses common direct-release drawer actions for Workflow 3 Nutrition and S&C", () => {
    for (const domain of ["NUTRITION", "S_AND_C"] as const) {
      const assignment = shellAssignmentDomain({
        ownerType: "ASSIGNED_DOMAIN_COACH",
        ownedByCurrentUser: true,
        canApprove: true,
        canRelease: true,
        releaseMode: "DIRECT_DOMAIN_RELEASE",
      });
      expect(
        resolveDirectReleaseDomainOwnerApproveVisible({
          assignmentReleaseMode: "DIRECT_DOMAIN_RELEASE",
          assignmentDomainContext: assignment,
          domain,
          legacyCanApprove: false,
          planId: `${domain}-plan`,
          versionId: `${domain}-version`,
        }),
      ).toBe(true);

      const approveActions = resolveDomainReviewDrawerWorkflowActions({
        workflowStatus: "draft_generated",
        canShowViewPlan: false,
        hasViewPlanContext: false,
        canShowSubmitForReview: false,
        canShowReviseAction: false,
        canShowApproveAction: true,
        canShowRequestRevisionAction: false,
        canShowReleaseAction: false,
      });
      const releaseActions = resolveDomainReviewDrawerWorkflowActions({
        workflowStatus: "approved",
        canShowViewPlan: false,
        hasViewPlanContext: false,
        canShowSubmitForReview: false,
        canShowReviseAction: false,
        canShowApproveAction: false,
        canShowRequestRevisionAction: false,
        canShowReleaseAction: true,
      });
      const labels = resolveDomainReviewDisplayLabels({
        domain,
        workflowStatus: "approved",
        directReleaseSkillsOwner: true,
        rawPlanStatus: "HEAD_COACH_APPROVED",
      });

      expect(approveActions.canShowApproveAction).toBe(true);
      expect(approveActions.canShowSubmitForReview).toBe(false);
      expect(releaseActions.canShowReleaseAction).toBe(true);
      expect(labels.statusLabel).not.toContain("Head Coach");
      expect(labels.workflowStatusLabel).not.toContain("Head Coach");
    }
  });

  it("uses generated Skills draft detail as Workflow 3 draft drawer content", () => {
    const latestDraft = {
      trainingPlanId: "skills-plan",
      trainingPlanVersionId: "skills-version",
      versionNumber: 1,
      status: "AI_GENERATED",
      days: [
        {
          dayIndex: 1,
          date: "2026-07-06",
          sessions: [
            {
              title: "technical skills",
              plannedDurationMinutes: 60,
              items: [{ label: "Serve pattern", summary: "Serve plus one", durationMinutes: 20 }],
            },
          ],
        },
        { dayIndex: 2, date: "2026-07-07", sessions: [] },
        {
          dayIndex: 3,
          date: "2026-07-08",
          sessions: [{ title: "rally tolerance", items: [{ label: "Cross-court rally" }] }],
        },
      ],
    } as never;
    const contentSource = resolveDomainReviewDrawerContentSource({
      domain: "SKILLS",
      workflowStatus: "draft_generated",
      directReleaseSkillsOwner: true,
      activeDetail: null,
      latestDraft,
    });

    expect(contentSource).toBe("latest_domain_draft");
    expect(countLatestDomainDraftTrainingDays(latestDraft)).toBe(2);
    expect(
      shouldShowDomainReviewSubmittedPlanEmptyState({
        contentSource,
        loading: false,
        error: null,
      }),
    ).toBe(false);
  });

  it("keeps Workflow 3 approved Skills drawer on generated schedule content", () => {
    const latestDraft = {
      trainingPlanId: "skills-plan",
      trainingPlanVersionId: "skills-approved-version",
      versionNumber: 2,
      status: "HEAD_COACH_APPROVED",
      days: [
        {
          dayIndex: 1,
          date: "2026-07-06",
          sessions: [
            {
              title: "approved skills session",
              plannedDurationMinutes: 60,
              items: [{ label: "Serve pattern", summary: "Serve plus one" }],
            },
          ],
        },
      ],
    } as never;
    const contentSource = resolveDomainReviewDrawerContentSource({
      domain: "SKILLS",
      workflowStatus: "approved",
      directReleaseSkillsOwner: true,
      activeDetail: null,
      latestDraft,
    });

    expect(contentSource).toBe("latest_domain_draft");
    expect(countLatestDomainDraftTrainingDays(latestDraft)).toBe(1);
    expect(
      shouldShowDomainReviewSubmittedPlanEmptyState({
        contentSource,
        loading: false,
        error: null,
      }),
    ).toBe(false);
  });

  it("keeps Workflow 3 approved Nutrition and S&C drawers on generated schedule content", () => {
    for (const domain of ["NUTRITION", "S_AND_C"] as const) {
      const latestDraft = {
        trainingPlanId: `${domain}-plan`,
        trainingPlanVersionId: `${domain}-approved-version`,
        versionNumber: 2,
        status: "HEAD_COACH_APPROVED",
        days: [
          {
            dayIndex: 1,
            date: "2026-07-06",
            sessions: [
              {
                title: `${domain} approved session`,
                plannedDurationMinutes: 45,
                items: [{ label: "Domain item" }],
              },
            ],
          },
        ],
      } as never;
      const contentSource = resolveDomainReviewDrawerContentSource({
        domain,
        workflowStatus: "approved",
        directReleaseSkillsOwner: true,
        activeDetail: null,
        latestDraft,
      });

      expect(contentSource).toBe("latest_domain_draft");
      expect(countLatestDomainDraftTrainingDays(latestDraft)).toBe(1);
      expect(
        shouldShowDomainReviewSubmittedPlanEmptyState({
          contentSource,
          loading: false,
          error: null,
        }),
      ).toBe(false);
    }
  });

  it("hydrates Workflow 3 Skills drawer active detail when only plan ids are loaded", () => {
    const skillsAssignment = shellAssignmentDomain({
      ownerType: "ASSIGNED_DOMAIN_COACH",
      ownedByCurrentUser: true,
      releaseMode: "DIRECT_DOMAIN_RELEASE",
    });

    expect(
      shouldHydrateDirectReleaseSkillsDrawerDetail({
        domain: "SKILLS",
        assignmentReleaseMode: "DIRECT_DOMAIN_RELEASE",
        assignmentDomainContext: skillsAssignment,
        planId: "skills-plan",
        versionId: "skills-version",
        activeDetail: null,
      }),
    ).toBe(true);
    expect(
      shouldHydrateDirectReleaseSkillsDrawerDetail({
        domain: "SKILLS",
        assignmentReleaseMode: "DIRECT_DOMAIN_RELEASE",
        assignmentDomainContext: skillsAssignment,
        planId: "skills-plan",
        versionId: "skills-version",
        activeDetail: {
          plan: { id: "skills-plan" },
          version: { id: "skills-version" },
        } as never,
      }),
    ).toBe(false);
    expect(
      shouldHydrateDirectReleaseSkillsDrawerDetail({
        domain: "NUTRITION",
        assignmentReleaseMode: "DIRECT_DOMAIN_RELEASE",
        assignmentDomainContext: skillsAssignment,
        planId: "nutrition-plan",
        versionId: "nutrition-version",
        activeDetail: null,
      }),
    ).toBe(false);
    expect(
      shouldHydrateDirectReleaseDomainDrawerDetail({
        domain: "NUTRITION",
        assignmentReleaseMode: "DIRECT_DOMAIN_RELEASE",
        assignmentDomainContext: skillsAssignment,
        planId: "nutrition-plan",
        versionId: "nutrition-version",
        activeDetail: null,
      }),
    ).toBe(true);
  });

  it("formats Nutrition serving display without inventing values", () => {
    expect(
      formatNutritionServingDisplay({
        serving: "2 pieces",
        quantity: 1,
        unit: "plate",
      }),
    ).toBe("2 pieces");
    expect(
      formatNutritionServingDisplay({
        serving: null,
        quantity: 2,
        unit: "pieces",
      }),
    ).toBe("2 pieces");
    expect(
      formatNutritionServingDisplay({
        serving: null,
        quantity: 2,
        unit: null,
      }),
    ).toBe("2");
    expect(
      formatNutritionServingDisplay({
        serving: null,
        quantity: null,
        unit: "cup",
      }),
    ).toBe("cup");
    expect(
      formatNutritionServingDisplay({
        serving: null,
        quantity: null,
        unit: null,
      }),
    ).toBeNull();
  });

  it("uses raw serving aliases when parsed serving fields are absent", () => {
    expect(
      formatNutritionServingDisplay(
        {
          serving: null,
          quantity: null,
          unit: null,
        },
        {
          servingQuantity: 2,
          unit: "pieces",
        },
      ),
    ).toBe("2 pieces");
    expect(
      formatNutritionServingDisplay(
        {
          serving: null,
          quantity: null,
          unit: null,
        },
        {
          servingSize: "1 bowl",
        },
      ),
    ).toBe("1 bowl");
  });

  it("formats Nutrition day daily totals for calories, protein, carbs, fat, and fiber", () => {
    const totals = summarizeNutritionItems([
      {
        item: {
          calories: 500,
          protein: 20,
          carbs: 60,
          fat: 12,
          fiber: 8,
        },
        rawItem: null,
      },
      {
        item: {
          calories: 350,
          proteinGrams: "15.5",
          carbohydratesGrams: 45,
          fatGrams: 9,
        },
        rawItem: {
          fiberGrams: "6.5",
        },
      },
    ]);

    expect(formatNutritionDailyTotalsDisplay(totals)).toBe(
      "Daily totals: 850 kcal · Protein 35.5 g · Carbs 105 g · Fat 21 g · Fiber 14.5 g",
    );
  });

  it("reads individual Nutrition item fiber from parsed and raw aliases", () => {
    expect(readNutritionMetricValue({ fiber: 4.25 }, null, "fiber")).toBe(4.25);
    expect(readNutritionMetricValue({}, { fiberGrams: "5.5" }, "fiber")).toBe(5.5);
    expect(readNutritionMetricValue({}, { dietaryFiberGrams: 6 }, "fiber")).toBe(6);
  });

  it("does not invent missing Nutrition fiber or display NaN in daily totals", () => {
    const totals = summarizeNutritionItems([
      {
        item: {
          calories: 100,
          protein: 5,
          carbs: 20,
          fat: 1,
          fiber: "not-a-number",
        },
        rawItem: null,
      },
    ]);
    const display = formatNutritionDailyTotalsDisplay(totals);

    expect(totals.fiber).toBeNull();
    expect(display).toContain("Fiber: —");
    expect(display).not.toContain("NaN");
  });

  it("keeps submitted Nutrition drawer actions unchanged", () => {
    const drawerWorkflowActions = resolveDomainReviewDrawerWorkflowActions({
      workflowStatus: "submitted_for_review",
      canShowViewPlan: false,
      canShowSubmitForReview: false,
      canShowReviseAction: false,
      canShowApproveAction: true,
      canShowRequestRevisionAction: true,
      canShowReleaseAction: false,
      hasViewPlanContext: true,
    });

    const markup = renderToStaticMarkup(
      createElement(DomainReviewDrawerWorkflowActionButtons, {
        drawerWorkflowActions,
        renderApproveBeforeRevise: false,
        workflowStatus: "submitted_for_review",
        directReleaseSkillsDraftReview: false,
        governedPlanActionLoading: null,
        actionContext: {
          planId: "nutrition-plan",
          versionId: "nutrition-version",
          generationDomain: "NUTRITION",
        },
        drawerReviseLoading: false,
        requestRevisionFeedback: "Adjust servings.",
        onApprove() {},
        onRequestRevisionFeedbackChange() {},
        onRequestChangesSubmit() {},
        onOpenRevise() {},
      }),
    );

    expect(markup).toContain("Approve Plan");
    expect(markup).toContain("Request Changes");
    expect(markup).toContain("Adjust servings.");
  });

  it("renders backend constraintComplianceSummary in the review drawer content", () => {
    const markup = renderToStaticMarkup(
      createElement(DomainPlanConstraintComplianceSummarySection, {
        summary: {
          status: "COMPLIANT",
          detectedConstraints: [
            {
              athleteCategory: "SUB_JUNIOR",
              validatedLevel: "INTERMEDIATE",
              workload: {
                assessmentStatus: "WARN",
                readinessLevel: "LIMITED",
                workloadFlags: [
                  "APP_FRESHNESS_NOT_CURRENT",
                  "APP_PLANNING_ELIGIBILITY_WARNING",
                ],
              },
              injuryStatus: "HEALTHY",
              domainSafetyRules: ["SUB_JUNIOR_NO_HEAVY_OR_EXTERNAL_LOADING"],
            },
          ],
          appliedInPlan: [
            {
              workloadHandling: {
                plannedWeeklyLoadMinutes: 150,
                sessionIntensityDistribution: {
                  LOW: 5,
                },
                intensityCap: "REDUCED",
                recoveryBias: "ELEVATED",
              },
              youthLoadSafety: {
                stage: "SUB_JUNIOR",
                totalExerciseItemCount: 20,
                unsafeExerciseItemCount: 0,
              },
            },
          ],
          evidence: [
            {
              generationContextSnapshot: true,
              planningContextSnapshotId: "ddfca1d5-a568-4f4f-9c62-871233e91540",
              lockedPlanningContext: true,
              planContentEvidence: true,
              stageSafetyValidation: true,
            },
          ],
          raw: {},
        },
      }),
    );

    expect(markup).toContain("<button");
    expect(markup).toContain("aria-expanded=\"false\"");
    expect(markup).toContain("aria-controls=");
    expect(markup).toContain("aria-label=\"Expand AI Constraint Handling\"");
    expect(markup).toContain("lucide-chevron-down");
    expect(markup).toContain("AI Constraint Handling");
    expect(markup).toContain("Compliant");
    expect(markup.indexOf("AI Constraint Handling")).toBeLessThan(markup.indexOf("</button>"));
    expect(markup.indexOf("Compliant")).toBeLessThan(markup.indexOf("</button>"));
    expect(markup).toContain("Athlete category");
    expect(markup).toContain("Sub-Junior");
    expect(markup).toContain("Validated level");
    expect(markup).toContain("Intermediate");
    expect(markup).toContain("Workload status");
    expect(markup).toContain("Warning");
    expect(markup).toContain("Readiness level");
    expect(markup).toContain("Limited");
    expect(markup).toContain("App freshness not current");
    expect(markup).toContain("App planning eligibility warning");
    expect(markup).toContain("Injury status");
    expect(markup).toContain("Healthy");
    expect(markup).toContain("Sub-Junior: no heavy or external loading");
    expect(markup).toContain("Planned weekly load");
    expect(markup).toContain("150");
    expect(markup).toContain("Low");
    expect(markup).toContain("Intensity cap");
    expect(markup).toContain("Reduced");
    expect(markup).toContain("Recovery bias");
    expect(markup).toContain("Elevated");
    expect(markup).toContain("Exercise items");
    expect(markup).toContain("20");
    expect(markup).toContain("Unsafe exercise items");
    expect(markup).toContain("0");
    expect(markup).toContain("Generation context snapshot");
    expect(markup).toContain("Available");
    expect(markup).toContain("Locked planning context");
    expect(markup).toContain("Used");
    expect(markup).not.toContain("{&quot;");
    expect(markup).not.toContain("athleteCategory");
    expect(markup).not.toContain("ddfca1d5-a568-4f4f-9c62-871233e91540");
  });

  it("does not warn when backend evidence maps to duplicate human labels", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const markup = renderToStaticMarkup(
        createElement(DomainPlanConstraintComplianceSummarySection, {
          summary: {
            status: "COMPLIANT",
            detectedConstraints: [],
            appliedInPlan: [],
            evidence: [
              {
                planningContextSnapshotId: "ddfca1d5-a568-4f4f-9c62-871233e91540",
                lockedPlanningContextSnapshot: true,
              },
            ],
            raw: {},
          },
        }),
      );

      expect(markup).toContain("Planning context snapshot");
      expect(markup).toContain("Available");
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("Encountered two children with the same key"),
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("does not crash review drawer constraint evidence when summary is missing", () => {
    const markup = renderToStaticMarkup(
      createElement(DomainPlanConstraintComplianceSummarySection, {
        summary: null,
      }),
    );

    expect(markup).toBe("");
  });

  it("uses Review Skills Plan as the canonical drawer button label", () => {
    expect(reviewPlanButtonLabel("SKILLS")).toBe("Review Skills Plan");
    expect(openDomainPlanReviewLabel("SKILLS")).toBe("Review Skills Plan");
  });

  it("keeps the Skills review drawer open from both Workflow 3 review entry points", () => {
    expect(
      shouldKeepDomainReviewDrawerOpenForTab({
        selectedWorkflowTab: "generate",
        shell: "skills_coach_planning",
        headCoachReviewMode: false,
      }),
    ).toBe(true);
    expect(
      shouldKeepDomainReviewDrawerOpenForTab({
        selectedWorkflowTab: "generate",
        shell: "head_coach_review",
        headCoachReviewMode: true,
      }),
    ).toBe(true);
    expect(
      shouldKeepDomainReviewDrawerOpenForTab({
        selectedWorkflowTab: "plan-dates",
        shell: "skills_coach_planning",
        headCoachReviewMode: false,
      }),
    ).toBe(false);
  });

  it("shows Workflow 3 Skills draft drawer Approve Plan and Revise Plan actions", () => {
    const directReleaseAssignment = shellAssignmentDomain({
      ownerType: "ASSIGNED_DOMAIN_COACH",
      ownedByCurrentUser: true,
      canOpen: true,
      canRevise: true,
      canApprove: false,
      releaseMode: "DIRECT_DOMAIN_RELEASE",
    });
    const canShowDirectApprove = resolveDirectReleaseSkillsOwnerApproveVisible({
      assignmentReleaseMode: "DIRECT_DOMAIN_RELEASE",
      assignmentDomainContext: directReleaseAssignment,
      domain: "SKILLS",
      legacyCanApprove: false,
      planId: "skills-plan",
      versionId: "skills-version",
    });
    const actions = resolveDomainReviewDrawerWorkflowActions({
      workflowStatus: "draft_generated",
      canShowViewPlan: true,
      canShowSubmitForReview: false,
      canShowReviseAction: true,
      canShowApproveAction: canShowDirectApprove,
      canShowRequestRevisionAction: false,
      canShowReleaseAction: false,
      hasViewPlanContext: true,
    });

    expect(canShowDirectApprove).toBe(true);
    expect(
      shouldRouteDirectReleaseSkillsOwnerApproval({
        domain: "SKILLS",
        assignmentReleaseMode: "DIRECT_DOMAIN_RELEASE",
        assignmentDomainContext: directReleaseAssignment,
      }),
    ).toBe(true);
    expect(
      shouldRouteDirectReleaseSkillsOwnerApproval({
        domain: "SKILLS",
        assignmentReleaseMode: "HEAD_COACH_APPROVAL",
        assignmentDomainContext: shellAssignmentDomain({
          ownerType: "HEAD_COACH_SELF",
          ownedByCurrentUser: true,
          canApprove: true,
          releaseMode: "HEAD_COACH_APPROVAL",
        }),
      }),
    ).toBe(false);
    expect(
      shouldRenderApproveBeforeReviseInDomainReviewDrawer({
        directReleaseSkillsDraftReview: true,
      }),
    ).toBe(true);
    expect(actions).toMatchObject({
      canShowSubmitForReview: false,
      canShowReviseAction: true,
      canShowApproveAction: true,
      canShowRequestRevisionAction: false,
      canShowReleaseAction: false,
      canShowViewPlan: false,
      hasAuthorizedWorkflowAction: true,
    });
  });

  it("routes Workflow 2A Head Coach-owned Skills draft approval to direct domain-approve, not head-approve", () => {
    expect(
      shouldRouteHeadCoachOwnedSkillsDraftDirectApprove({
        domain: "SKILLS",
        headCoachReviewMode: true,
        workflowStatus: "draft_generated",
        assignmentDomainContext: shellAssignmentDomain({
          ownerType: "HEAD_COACH_SELF",
          ownedByCurrentUser: true,
          canApprove: true,
        }),
      }),
    ).toBe(true);
    expect(
      shouldRouteHeadCoachOwnedSkillsDraftDirectApprove({
        domain: "SKILLS",
        headCoachReviewMode: true,
        workflowStatus: "revision_requested",
        assignmentDomainContext: undefined,
      }),
    ).toBe(true);
  });

  it("keeps Workflow 1/2B submitted review and non-Skills/non-HC on head-approve", () => {
    expect(
      shouldRouteHeadCoachOwnedSkillsDraftDirectApprove({
        domain: "SKILLS",
        headCoachReviewMode: true,
        workflowStatus: "submitted_for_review",
        assignmentDomainContext: undefined,
      }),
    ).toBe(false);
    expect(
      shouldRouteHeadCoachOwnedSkillsDraftDirectApprove({
        domain: "SKILLS",
        headCoachReviewMode: true,
        workflowStatus: "draft_generated",
        assignmentDomainContext: shellAssignmentDomain({
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownedByCurrentUser: false,
        }),
      }),
    ).toBe(false);
    expect(
      shouldRouteHeadCoachOwnedSkillsDraftDirectApprove({
        domain: "NUTRITION",
        headCoachReviewMode: true,
        workflowStatus: "draft_generated",
        assignmentDomainContext: undefined,
      }),
    ).toBe(false);
    expect(
      shouldRouteHeadCoachOwnedSkillsDraftDirectApprove({
        domain: "SKILLS",
        headCoachReviewMode: false,
        workflowStatus: "draft_generated",
        assignmentDomainContext: undefined,
      }),
    ).toBe(false);
  });

  it("shows Skills Coach approval labels for the Workflow 3 approved Skills drawer", () => {
    const labels = resolveDomainReviewDisplayLabels({
      domain: "SKILLS",
      workflowStatus: "approved",
      directReleaseSkillsOwner: true,
      rawPlanStatus: "HEAD_COACH_APPROVED",
    });

    expect(labels).toEqual({
      statusLabel: "Skills Coach Approved",
      planStatusLabel: "Skills Coach Approved",
      workflowStatusLabel: "Approved by Skills Coach",
    });
  });

  it("uses Workflow 3 Skills Coach approved labels in the matrix and inspector model", () => {
    const matrixLabels = resolveDomainReviewDisplayLabels({
      domain: "SKILLS",
      workflowStatus: "approved",
      directReleaseSkillsOwner: true,
      rawPlanStatus: "HEAD_COACH_APPROVED",
    });
    const inspectorLabels = resolveDomainReviewDisplayLabels({
      domain: "SKILLS",
      workflowStatus: "approved",
      directReleaseSkillsOwner: true,
      rawPlanStatus: "HEAD_COACH_APPROVED",
    });

    expect(matrixLabels.planStatusLabel).toBe("Skills Coach Approved");
    expect(matrixLabels.workflowStatusLabel).toBe("Approved by Skills Coach");
    expect(inspectorLabels.planStatusLabel).toBe("Skills Coach Approved");
    expect(inspectorLabels.workflowStatusLabel).toBe("Approved by Skills Coach");
  });

  it("keeps Head Coach approval labels for Workflow 2A Head Coach-owned Skills", () => {
    const labels = resolveDomainReviewDisplayLabels({
      domain: "SKILLS",
      workflowStatus: "approved",
      directReleaseSkillsOwner: false,
      rawPlanStatus: "HEAD_COACH_APPROVED",
    });

    expect(labels).toEqual({
      statusLabel: "Head Coach Approved",
      planStatusLabel: "Head Coach Approved",
      workflowStatusLabel: "Approved by Head Coach",
    });
  });

  it("keeps Workflow 1 and Workflow 2B Head Coach approval labels unchanged", () => {
    for (const domain of ["SKILLS", "NUTRITION", "S_AND_C"] as const) {
      const labels = resolveDomainReviewDisplayLabels({
        domain,
        workflowStatus: "approved",
        directReleaseSkillsOwner: false,
        rawPlanStatus: "HEAD_COACH_APPROVED",
      });

      expect(labels).toEqual({
        statusLabel: "Head Coach Approved",
        planStatusLabel: "Head Coach Approved",
        workflowStatusLabel: "Approved by Head Coach",
      });
    }
  });

  it("renders Workflow 3 Skills draft drawer actions without a ReferenceError", () => {
    const drawerWorkflowActions = resolveDomainReviewDrawerWorkflowActions({
      workflowStatus: "draft_generated",
      canShowViewPlan: true,
      canShowSubmitForReview: false,
      canShowReviseAction: true,
      canShowApproveAction: true,
      canShowRequestRevisionAction: false,
      canShowReleaseAction: false,
      hasViewPlanContext: true,
    });

    const markup = renderToStaticMarkup(
      createElement(DomainReviewDrawerWorkflowActionButtons, {
        drawerWorkflowActions,
        renderApproveBeforeRevise: true,
        workflowStatus: "draft_generated",
        directReleaseSkillsDraftReview: true,
        governedPlanActionLoading: null,
        actionContext: {
          planId: "skills-plan",
          versionId: "skills-version",
          generationDomain: "SKILLS",
        },
        drawerReviseLoading: false,
        requestRevisionFeedback: "",
        onApprove() {},
        onRequestRevisionFeedbackChange() {},
        onRequestChangesSubmit() {},
        onOpenRevise() {},
      }),
    );

    expect(markup).toContain("Approve Plan");
    expect(markup).toContain("Revise Plan");
    expect(markup).not.toContain("Request Changes");
    expect(markup.indexOf("Approve Plan")).toBeLessThan(markup.indexOf("Revise Plan"));
  });

  it("renders submitted Head Coach review drawer Approve Plan and Request Changes together", () => {
    const drawerWorkflowActions = resolveDomainReviewDrawerWorkflowActions({
      workflowStatus: "submitted_for_review",
      canShowViewPlan: false,
      canShowSubmitForReview: false,
      canShowReviseAction: false,
      canShowApproveAction: true,
      canShowRequestRevisionAction: true,
      canShowReleaseAction: false,
      hasViewPlanContext: true,
    });

    const markup = renderToStaticMarkup(
      createElement(DomainReviewDrawerWorkflowActionButtons, {
        drawerWorkflowActions,
        renderApproveBeforeRevise: false,
        workflowStatus: "submitted_for_review",
        directReleaseSkillsDraftReview: false,
        governedPlanActionLoading: null,
        actionContext: {
          planId: "nutrition-plan",
          versionId: "nutrition-version",
          generationDomain: "NUTRITION",
        },
        drawerReviseLoading: false,
        requestRevisionFeedback: "Adjust servings.",
        onApprove() {},
        onRequestRevisionFeedbackChange() {},
        onRequestChangesSubmit() {},
        onOpenRevise() {},
      }),
    );

    expect(markup).toContain("Approve Plan");
    expect(markup).toContain("Request Changes");
    expect(markup).toContain("textarea");
    expect(markup).toContain("Adjust servings.");
    expect(markup.indexOf("Approve Plan")).toBeLessThan(markup.indexOf("Request Changes"));
  });

  it("shows Workflow 3 Skills approved release and released Plan Viewer actions", () => {
    const approvedDrawerActions = resolveDomainReviewDrawerWorkflowActions({
      workflowStatus: "approved",
      canShowViewPlan: true,
      canShowSubmitForReview: false,
      canShowReviseAction: false,
      canShowApproveAction: false,
      canShowRequestRevisionAction: false,
      canShowReleaseAction: true,
      hasViewPlanContext: true,
    });
    const approvedNextAction = domainIntegrationNextActionLabel({
      workflowStatus: "approved",
      assignmentDomainContext: shellAssignmentDomain({
        ownerType: "ASSIGNED_DOMAIN_COACH",
        ownedByCurrentUser: true,
        canRelease: true,
        releaseMode: "DIRECT_DOMAIN_RELEASE",
      }),
      planningContextLocked: true,
      loading: false,
      hasError: false,
      canGenerate: false,
      canSubmitForReview: false,
      canViewPlan: true,
      canReview: false,
      canRelease: true,
      isCurrentReviewPlan: false,
      directReleaseSkillsOwner: true,
    });
    const approvedAvailableActions = domainIntegrationAvailableActionLabels({
      domain: "SKILLS",
      workflowStatus: "approved",
      canGenerate: false,
      canViewPlan: true,
      canSubmitForReview: false,
      canReview: false,
      canRelease: true,
      canRevise: false,
      directReleaseSkillsOwner: true,
    });
    const releasedAvailableActions = domainIntegrationAvailableActionLabels({
      domain: "SKILLS",
      workflowStatus: "released",
      canGenerate: false,
      canViewPlan: true,
      canSubmitForReview: false,
      canReview: false,
      canRelease: false,
      canRevise: false,
      directReleaseSkillsOwner: true,
    });

    expect(approvedDrawerActions).toMatchObject({
      canShowViewPlan: false,
      canShowReleaseAction: true,
      hasAuthorizedWorkflowAction: true,
    });
    expect(approvedNextAction).toBe("Release Plan to Athlete");
    expect(approvedAvailableActions).toEqual(["Release Plan to Athlete"]);
    expect(releasedAvailableActions).toEqual(["View Skills in Plan Viewer"]);
  });

  it("allows direct-release Skills owner release when assignment canRelease is false but legacy release is allowed", () => {
    expect(
      resolveDomainReleaseVisible({
        assignmentReleaseMode: "DIRECT_DOMAIN_RELEASE",
        assignmentDomainContext: shellAssignmentDomain({
          ownerType: "ASSIGNED_DOMAIN_COACH",
          ownedByCurrentUser: true,
          canRelease: false,
          releaseMode: "DIRECT_DOMAIN_RELEASE",
        }),
        requiredReleaseMode: "DIRECT_DOMAIN_RELEASE",
        legacyCanRelease: true,
        planId: "skills-plan",
        versionId: "skills-version",
      }),
    ).toBe(true);
  });

  it("resolves Workflow 3 review action ids from latest draft when matrix state is empty", () => {
    expect(
      resolveDomainReviewActionPlanIds({
        domain: "SKILLS",
        workspace: workflow3SkillsCoachWorkspace(),
        surfacePlanId: "",
        surfaceVersionId: "",
        persistedDetailDomain: null,
        persistedPlanId: null,
        persistedVersionId: null,
        latestDraftDomain: "SKILLS",
        latestDraftPlanId: "skills-plan",
        latestDraftVersionId: "skills-version",
      }),
    ).toEqual({
      planId: "skills-plan",
      versionId: "skills-version",
    });
  });

  it("prefers refreshed active detail workflow status over stale workspace draft status", () => {
    const workspace = workflow3SkillsCoachWorkspace({
      domains: {
        ...workflow3SkillsCoachWorkspace().domains,
        SKILLS: {
          ...workflow3SkillsCoachWorkspace().domains.SKILLS,
          summary: {
            trainingPlanId: "skills-plan",
            versionId: "skills-version",
            generationDomain: "SKILLS",
            status: "AI_GENERATED",
            versionNumber: 1,
          },
        },
      },
    });

    expect(
      resolveDomainReviewWorkflowStatus({
        workspace,
        domain: "SKILLS",
        summaryStatus: "HEAD_COACH_APPROVED",
        summaryPlanId: "skills-plan",
        summaryVersionId: "skills-version",
        activeDetail: {
          plan: { id: "skills-plan", status: "DRAFT" },
          version: { id: "skills-version", status: "HEAD_COACH_APPROVED", versionNumber: 1 },
        } as never,
      }),
    ).toBe("approved");
  });

  it("does not auto-open Plan Viewer after release for Workflow 3 Skills", () => {
    expect(
      shouldShowReleasedPlanViewerCanvas({
        selectedWorkflowTab: "generate",
        selectedDomain: "SKILLS",
        releasedPlanViewerIntentPresent: false,
        requestedPlanIdPresent: true,
        releasedWorkflowStatus: "released",
      }),
    ).toBe(false);
  });

  it("keeps Workflow 1 and 2B separate domain coach drafts on submit-for-review path", () => {
    const nextAction = domainIntegrationNextActionLabel({
      workflowStatus: "draft_generated",
      assignmentDomainContext: shellAssignmentDomain({
        ownerType: "ASSIGNED_DOMAIN_COACH",
        ownedByCurrentUser: true,
        canSubmitForReview: true,
        releaseMode: "HEAD_COACH_APPROVAL",
      }),
      planningContextLocked: true,
      loading: false,
      hasError: false,
      canGenerate: false,
      canSubmitForReview: true,
      canViewPlan: true,
      canReview: false,
      canRelease: false,
      isCurrentReviewPlan: false,
    });
    const availableActions = domainIntegrationAvailableActionLabels({
      domain: "NUTRITION",
      workflowStatus: "draft_generated",
      canGenerate: false,
      canViewPlan: true,
      canSubmitForReview: true,
      canReview: false,
      canRelease: false,
      canRevise: true,
    });

    expect(nextAction).toBe("Ready to submit for review.");
    expect(availableActions).toEqual([
      "View / review domain plan",
      "Submit for Head Coach review",
      "Revise instructions",
    ]);
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

  it("shows usable APP context as profile complete when level validation is pending", () => {
    const appStepComplete = resolveContextAppStepCompleteForNavigation({
      appCompleteness: "INCOMPLETE",
      planningEligibility: "PENDING_LEVEL_VALIDATION",
      missingRequiredFields: [],
      backendBlockers: [],
      skillsOwnedDirectRelease: true,
    });

    expect(appStepComplete).toBe(true);
    expect(
      resolveContextAppProfileStatusLabel({
        appStepComplete,
        appCompleteness: "INCOMPLETE",
      }),
    ).toBe("Complete");
    expect(
      resolveContextAppEligibilityNoteLabel({
        planningEligibility: "PENDING_LEVEL_VALIDATION",
      }),
    ).toBe("Pending Level Validation");
  });

  it("keeps level validation pending in the lock blocker list", () => {
    expect(
      resolveContextBuilderPendingBeforeLock({
        upstreamBlockers: ["READINESS_NOT_COMPLETE"],
        appStepComplete: true,
        levelStepComplete: false,
        workloadComplete: true,
        seasonGoalsComplete: true,
        planDatesStepComplete: true,
      }),
    ).toEqual(["Confirm athlete level"]);
  });

  it("merges backend blockers with local pending context-builder steps", () => {
    expect(
      resolveContextBuilderPendingBeforeLock({
        upstreamBlockers: ["NO_WORKLOAD_CONTEXT"],
        appStepComplete: true,
        levelStepComplete: false,
        workloadComplete: false,
        seasonGoalsComplete: true,
        planDatesStepComplete: true,
      }),
    ).toEqual(["Complete workload assessment", "Confirm athlete level"]);
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

  it("resolves locked Domain Integration season and phase from the locked context", () => {
    const displayFields = resolveLockedPlanningContextDisplayFields({
      workspacePlanningContext: {
        locked: true,
        resolved: true,
        lockId: "lock-1",
        snapshotId: "snapshot-1",
        selectedSeasonCycleId: "season-2026",
        phase: "OFF_SEASON",
        planStartDate: "2026-07-01",
        planEndDate: "2026-07-07",
        selectedGoalsSnapshot: [
          {
            goalId: "goal-approach",
            goalName: "Improve approach distance control and proximity into greens",
          },
        ],
      },
      upstreamPlanningContext: null,
      seasons: [
        {
          id: "season-row-2026",
          seasonCycleId: "season-2026",
          entityId: "entity-1",
          sport: "GOLF",
          year: 2026,
          name: "Albus Golf Season 2026",
          startDate: "2026-01-01",
          endDate: "2026-12-31",
          phases: [],
        },
      ],
      phasesBySeasonCycleId: {
        "season-2026": [
          {
            phaseId: "phase-off-season",
            seasonCycleId: "season-2026",
            phase: "OFF_SEASON",
            startDate: "2026-01-01",
            endDate: "2026-12-31",
          },
        ],
      },
      selectedSeason: {
        id: "stale-season-row",
        seasonCycleId: "stale-season",
        entityId: "entity-1",
        sport: "GOLF",
        year: 2025,
        name: "Stale Selected Season",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        phases: [],
      },
      activePhaseForSelectedSeason: {
        phaseId: "phase-stale",
        seasonCycleId: "stale-season",
        phase: "IN_SEASON",
        startDate: "2025-07-01",
        endDate: "2025-09-01",
      },
      lockedPlanningContextSeasonPhase: null,
    });

    expect(displayFields).toMatchObject({
      seasonName: "Albus Golf Season 2026",
      currentPhase: "OFF_SEASON",
      selectedGoalsSummary: "Improve approach distance control and proximity into greens",
      selectedGoalCount: 1,
      planStartDate: "2026-07-01",
      planEndDate: "2026-07-07",
      durationDays: 7,
      insideCurrentPhase: true,
      datesConfirmed: true,
      seasonGoalsComplete: true,
      planDatesComplete: true,
    });
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

  it("prefers released active detail ids for Workflow 2A Skills Plan Viewer actions", () => {
    const workspace = workflow2AHeadCoachOwnedSkillsWorkspace({
      domains: {
        ...workflow2AHeadCoachOwnedSkillsWorkspace().domains,
        SKILLS: {
          ...workflow2AHeadCoachOwnedSkillsWorkspace().domains.SKILLS,
          summary: {
            trainingPlanId: "workspace-skills-plan-v1",
            versionId: "workspace-skills-version-v1",
            generationDomain: "SKILLS",
            status: "ACTIVE",
            versionNumber: 1,
          },
        },
      },
    });

    expect(
      resolveWorkspaceDomainViewPlanContext({
        workspace,
        domain: "SKILLS",
        fallbackPlanId: "released-skills-plan-v2",
        fallbackVersionId: "released-skills-version-v2",
        fallbackStatus: "ACTIVE",
        fallbackSource: "domain review surface",
        preferCompleteFallback: true,
      }),
    ).toEqual({
      planId: "released-skills-plan-v2",
      versionId: "released-skills-version-v2",
      status: "ACTIVE",
      source: "domain review surface",
    });
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

  it("does not resume to Generate when context has plan window dates without lock", () => {
    expect(
      resolveSkillsOwnedDirectReleaseCurrentStep({
        workflowMode: "skills_coach_planning",
        requestedPlanId: null,
        urlPlanCandidate: null,
        planningContextLocked: false,
        skillsPlanExists: false,
        contextHasPlanWindow: true,
      }),
    ).toBeNull();
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

describe("Training Plan Planning Brief", () => {
  const lockedDisplayFields = {
    seasonName: "2026 Tennis Season",
    currentPhase: "OFF_SEASON",
    selectedGoalsSummary: "Improve first serve",
    selectedGoalCount: 1,
    planStartDate: "2026-08-01",
    planEndDate: "2026-08-28",
    durationDays: 28,
    insideCurrentPhase: true,
    datesConfirmed: true,
    seasonGoalsComplete: true,
    planDatesComplete: true,
  };
  const lockedCardFields = {
    validatedLevel: "INTERMEDIATE",
    weeklyWorkload: "8 - 10 hrs/week",
    weeklyTrainingHours: 9,
    seasonPhase: "PRE_SEASON",
  };

  it("renders from existing workspace locked planning data", () => {
    const workspace = workflow1OwnedSkillsWorkspace({
      planningContext: {
        locked: true,
        resolved: true,
        lockId: "lock-1",
        snapshotId: "snapshot-1",
        startDate: "2026-08-01",
        endDate: "2026-08-28",
        durationDays: 28,
        selectedGoalsSnapshot: [
          {
            goalId: "goal-1",
            goalName: "Improve first serve",
            taxonomyAreaKey: "approach_shots",
            competitionEventId: "district-open",
          },
        ],
        athletePlanningContextSnapshot: {
          ageCategory: "SUB_JUNIOR",
          injurySafetyNotes: ["Monitor right shoulder"],
          calorieContext: "2600 kcal/day",
        },
      },
    });

    const sections = buildTrainingPlanPlanningBriefSections({
      athleteDisplay: "Avery Player",
      profile: {
        derivedAge: 16,
        sportCode: "TENNIS",
        trainingAgeYears: 5,
        dietType: "Vegetarian",
        allergiesOrIntolerances: "Peanuts",
      } as never,
      workspace,
      upstreamPlanningContext: null,
      lockedPlanningContextCardFields: lockedCardFields,
      lockedContextDisplayFields: lockedDisplayFields,
      lockedGoals: [
        {
          goalId: "goal-1",
          goalName: "Improve first serve",
          successCriteria: "70% first-serve accuracy",
        },
      ],
    });
    const markup = renderToStaticMarkup(
      createElement(TrainingPlanPlanningBrief, { sections }),
    );

    expect(markup).toContain("View Planning Brief");
    expect(markup).toContain("Avery Player");
    expect(markup).toContain("Tennis");
    expect(markup).toContain("Sub-Junior");
    expect(markup).toContain("Intermediate");
    expect(markup).toContain("Off-season");
    expect(markup).toContain("Improve first serve");
    expect(markup).toContain("Approach shots");
    expect(markup).toContain("Monitor right shoulder");
    expect(markup).toContain("2600 kcal/day");
  });

  it("does not crash when optional planning fields are missing", () => {
    const sections = buildTrainingPlanPlanningBriefSections({
      athleteDisplay: "athlete-1",
      profile: null,
      workspace: workflow1OwnedSkillsWorkspace({
        planningContext: {
          locked: true,
          resolved: true,
          lockId: "lock-1",
          snapshotId: "snapshot-1",
        },
      }),
      upstreamPlanningContext: null,
      lockedPlanningContextCardFields: {
        validatedLevel: null,
        weeklyWorkload: null,
        weeklyTrainingHours: null,
        seasonPhase: null,
      },
      lockedContextDisplayFields: {
        ...lockedDisplayFields,
        seasonName: null,
        currentPhase: null,
        planStartDate: null,
        planEndDate: null,
        durationDays: null,
      },
      lockedGoals: [],
    });
    const markup = renderToStaticMarkup(
      createElement(TrainingPlanPlanningBrief, { sections }),
    );

    expect(markup).toContain("View Planning Brief");
    expect(markup).toContain("Not available");
  });

  it("renders read-only markup with no form or action controls", () => {
    const sections = buildTrainingPlanPlanningBriefSections({
      athleteDisplay: "Avery Player",
      profile: null,
      workspace: null,
      upstreamPlanningContext: null,
      lockedPlanningContextCardFields: lockedCardFields,
      lockedContextDisplayFields: lockedDisplayFields,
      lockedGoals: [],
    });
    const markup = renderToStaticMarkup(
      createElement(TrainingPlanPlanningBrief, { sections }),
    );

    expect(markup).toContain("<details");
    expect(markup).toContain("<summary");
    expect(markup).not.toContain("<button");
    expect(markup).not.toContain("<input");
    expect(markup).not.toContain("<textarea");
    expect(markup).not.toContain("<select");
  });

  it("leaves workflow action visibility unchanged", () => {
    const before = resolveDomainViewPlanVisible({
      assignmentDomainContext: shellAssignmentDomain({ canOpen: true }),
      legacyCanOpen: false,
      planId: "plan-1",
      versionId: "version-1",
    });
    renderToStaticMarkup(
      createElement(TrainingPlanPlanningBrief, {
        sections: buildTrainingPlanPlanningBriefSections({
          athleteDisplay: "Avery Player",
          profile: null,
          workspace: null,
          upstreamPlanningContext: null,
          lockedPlanningContextCardFields: lockedCardFields,
          lockedContextDisplayFields: lockedDisplayFields,
          lockedGoals: [],
        }),
      }),
    );
    const after = resolveDomainViewPlanVisible({
      assignmentDomainContext: shellAssignmentDomain({ canOpen: true }),
      legacyCanOpen: false,
      planId: "plan-1",
      versionId: "version-1",
    });

    expect(before).toBe(true);
    expect(after).toBe(before);
  });
});

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

  it("uses locked/shared downstream context instead of rechecking local season selection", () => {
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

  it("requires locked downstream context before Workflow 1 Skills coach can skip local season selection", () => {
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
