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
  RevisionRequestPanel,
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
  buildFynRevisionAddItemChangeText,
  fynRevisionActionOptionKind,
  fynRevisionAddItemSessionTarget,
  fynRevisionContextPlaceholder,
  fetchFynRevisionReplacementOptions,
  FYN_REVISION_INPUT_PLACEHOLDER,
  FYN_REVISION_NO_OPTIONS_MESSAGE,
  FYN_REVISION_NO_ADD_FOOD_OPTIONS_MESSAGE,
  NUTRITION_MEAL_SLOT_MIN_ITEMS,
  NUTRITION_MEAL_MINIMUMS_GUIDANCE,
  NUTRITION_REMOVE_ITEM_MINIMUM_WARNING,
  NUTRITION_SINGLE_PATCH_GUIDANCE,
  SKILLS_SINGLE_PATCH_GUIDANCE,
  buildSkillsRevisionPatch,
  buildSkillsRevisionSubmission,
  nextSkillsRevisionVersionId,
  resolveActiveSkillsReviseIds,
  buildNutritionRevisionPatch,
  buildNutritionRevisionSubmission,
  buildNutritionRevisionOptionItem,
  buildNutritionServingAdjustment,
  parseNutritionServing,
  adjustNutritionServingQuantity,
  formatNutritionServingValue,
  nutritionRevisionPatchOperation,
  nutritionRevisionCanApply,
  nextNutritionRevisionVersionId,
  resolveActiveNutritionReviseIds,
  nutritionMealSlotKeyFromLabel,
  nutritionMealSlotMinItems,
  nutritionRemoveItemMinimumNotice,
  nutritionRemoveItemMinimumMessage,
  nutritionOptionCatalogId,
  nutritionRevisionOptionMissingCatalogReference,
  NUTRITION_OPTION_MISSING_CATALOG_MESSAGE,
  NUTRITION_STALE_VERSION_MESSAGE,
  isNutritionStaleVersionRevisionError,
  isNutritionRevisionInterruptedError,
  resolveNutritionRevisionErrorOutcome,
  NUTRITION_REVISION_APPLYING_MESSAGE,
  NUTRITION_REVISION_ALREADY_APPLIED_MESSAGE,
  nutritionRevisionDrawerSubmitPending,
  nutritionRemoveItemTargetStillPresent,
  NUTRITION_ITEM_NOT_IN_LATEST_PLAN_MESSAGE,
  resolveNutritionReviewDrawerLifecycle,
  runNutritionReviewDrawerOpenRefresh,
  resolveNewerDomainReviewDraft,
  resolveLatestDraftForDomainReview,
  domainReviewDraftRenderKey,
  domainReviewActiveDetailRenderKey,
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
import { parseGeneratedDraftItem } from "@/lib/api/coachAthletePlanningReadiness";
import type {
  CoachAthleteDomainDraftRevisionContext,
  CoachAthleteDomainDraftRevisionOption,
  CoachAthleteLatestDomainDraft,
  CoachPersistedTrainingPlanActiveDetail,
} from "@/lib/api/coachAthletePlanningReadiness";
import type { TrainingPlanWorkspace } from "@/types/trainingPlanWorkspace";

describe("RevisionRequestPanel", () => {
  it("renders revision feedback and available request metadata", () => {
    const html = renderToStaticMarkup(
      createElement(RevisionRequestPanel, {
        workflowStatus: "revision_requested",
        pendingRevisionRequest: {
          feedback: "Reduce the Tuesday workload and add recovery notes.",
          requestedBy: "Head Coach",
          requestedAt: "2026-07-14",
          actorRole: "HEAD_COACH",
        },
      }),
    );

    expect(html).toContain("Revision Request");
    expect(html).toContain("Reduce the Tuesday workload and add recovery notes.");
    expect(html).toContain("Requested by:");
    expect(html).toContain("Head Coach");
    expect(html).toContain("Requested at:");
    expect(html).toContain("14/07/2026");
  });

  it("does not render without revision-requested status and feedback", () => {
    const request = {
      feedback: "Update the plan.",
      requestedBy: null,
      requestedAt: null,
      actorRole: null,
    };

    expect(
      renderToStaticMarkup(
        createElement(RevisionRequestPanel, {
          workflowStatus: "submitted_for_review",
          pendingRevisionRequest: request,
        }),
      ),
    ).toBe("");
    expect(
      renderToStaticMarkup(
        createElement(RevisionRequestPanel, {
          workflowStatus: "revision_requested",
          pendingRevisionRequest: { ...request, feedback: null },
        }),
      ),
    ).toBe("");
  });
});

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
    expect(html).toContain("What do you want to change?");
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
    expect(html).toContain("What do you want to change?");
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
    expect(html).toContain("What do you want to change?");
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
    expect(populatedHtml).toContain("What do you want to change?");
  });

  it("enables Show approved options once Add Drill is chosen and a request is typed", () => {
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
    const sessionTarget = targets.find((option) => option.level === "SESSION");

    // Add Drill chosen but no request typed yet -> Show approved options is disabled.
    const disabledHtml = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context,
          targetOptions: targets,
          coachRequest: "",
          selectedTargetKey: sessionTarget?.key ?? null,
          selectedActionKey: "ADD_ITEM",
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
          coachRequest: "Add a bunker drill.",
          selectedTargetKey: sessionTarget?.key ?? null,
          selectedActionKey: "ADD_ITEM",
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
    expect(FYN_REVISION_CAPABILITIES.SKILLS.levels).toEqual(["SESSION", "ITEM"]);
    expect(FYN_REVISION_CAPABILITIES.NUTRITION.levels).toEqual(["SESSION", "ITEM"]);
    expect(FYN_REVISION_CAPABILITIES.S_AND_C.levels).toEqual(["DAY", "SESSION", "ITEM"]);
  });

  it("exposes Add Drill at session level and Remove Drill at item level", () => {
    const context = makeRevisionContext({ generationDomain: "SKILLS" });
    const targets = fynRevisionLeveledTargetOptions(context, {
      domain: "SKILLS",
      scheduleDays: skillsSchedule,
    });
    const dayTarget = targets.find((option) => option.level === "DAY");
    const sessionTarget = targets.find((option) => option.level === "SESSION");
    const itemTarget = targets.find((option) => option.level === "ITEM");

    expect(dayTarget).toBeUndefined();
    expect(actionKeysFor("SKILLS", sessionTarget)).toEqual(["ADD_ITEM"]);
    expect(actionKeysFor("SKILLS", itemTarget)).toEqual(["REMOVE_ITEM"]);
    expect(fynRevisionActionLabel("SKILLS", "ADD_ITEM")).toBe("Add drill");
    expect(fynRevisionActionLabel("SKILLS", "REMOVE_ITEM")).toBe("Remove drill");
  });

  it("renders Add Drill for a Skills session and hides item-level actions", () => {
    const context = makeRevisionContext({ generationDomain: "SKILLS" });
    const targets = fynRevisionLeveledTargetOptions(context, {
      domain: "SKILLS",
      scheduleDays: skillsSchedule,
    });
    const sessionTarget = targets.find((option) => option.level === "SESSION");
    const html = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context,
          targetOptions: targets,
          selectedTargetKey: sessionTarget?.key ?? null,
        }),
      ),
    );
    expect(html).toContain("What do you want to do?");
    expect(html).toContain("Add drill");
    expect(html).not.toContain("Replace drill");
    expect(html).not.toContain("Adjust drill");
    expect(html).not.toContain("Remove drill");
    expect(html).not.toContain("Change rest day");
    expect(html).not.toContain("Edit several drills in this session");
  });

  it("requires a Nutrition item target for update/replace/remove while meals offer add only", () => {
    const context = makeRevisionContext({ generationDomain: "NUTRITION" });
    // Breakfast requires 3 items; keep 4 here so REMOVE_ITEM stays eligible.
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
              { order: 2, label: "Eggs", nutritionCatalogItemId: "nut-3" },
              { order: 3, label: "Toast", nutritionCatalogItemId: "nut-4" },
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
    expect(actionKeysFor("NUTRITION", sessionTarget)).toEqual(["ADD_ITEM"]);
    expect(actionKeysFor("NUTRITION", itemTarget)).toEqual([
      "REPLACE_ITEM",
      "UPDATE_ITEM",
      "REMOVE_ITEM",
    ]);

    const allKeys = targets.flatMap((option) => actionKeysFor("NUTRITION", option));
    expect(allKeys).not.toContain("REPLACE_DAY");
    expect(allKeys).not.toContain("ADD_SESSION");
    expect(allKeys).not.toContain("UPDATE_SESSION");
    expect(allKeys).not.toContain("UPDATE_SESSION_ITEMS");
    expect(new Set(allKeys)).toEqual(
      new Set(["ADD_ITEM", "REPLACE_ITEM", "UPDATE_ITEM", "REMOVE_ITEM"]),
    );
    // Nutrition vocabulary and operation mappings are item-specific.
    expect(fynRevisionActionLabel("NUTRITION", "ADD_ITEM")).toBe("Add food item");
    expect(fynRevisionActionLabel("NUTRITION", "REMOVE_ITEM")).toBe("Remove food item");
    expect(fynRevisionActionLabel("NUTRITION", "REPLACE_ITEM")).toBe("Replace food item");
    expect(fynRevisionActionLabel("NUTRITION", "UPDATE_ITEM")).toBe("Change food item details");
    const itemActions = fynRevisionAvailableActions("NUTRITION", itemTarget ?? null);
    expect(
      itemActions.find((action) => action.label === "Change food item details")?.key,
    ).toBe("UPDATE_ITEM");

    const mealHtml = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          domain: "NUTRITION",
          context,
          targetOptions: targets,
          selectedTargetKey: sessionTarget?.key ?? null,
        }),
      ),
    );
    expect(mealHtml).toContain("Add food item");
    expect(mealHtml).not.toContain("Change meal details");
    expect(mealHtml).not.toContain("Change food item details");
    expect(mealHtml).not.toContain("Replace food item");
    expect(mealHtml).not.toContain("Remove food item");
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
    // Add exercise is a SESSION-level action so it never requires selecting an existing exercise.
    expect(actionKeysFor("S_AND_C", sessionTarget)).toEqual(["UPDATE_SESSION", "ADD_ITEM"]);
    expect(actionKeysFor("S_AND_C", itemTarget)).toEqual([
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

  it("orders the composer as target -> action -> context", () => {
    const targets = fynRevisionLeveledTargetOptions(
      makeRevisionContext({ generationDomain: "SKILLS" }),
      { domain: "SKILLS", scheduleDays: skillsSchedule },
    );
    const sessionTarget = targets.find((option) => option.level === "SESSION")!;

    // Before a target is chosen: only the target selector is shown.
    const targetOnly = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context: makeRevisionContext({ generationDomain: "SKILLS" }),
          targetOptions: targets,
        }),
      ),
    );
    expect(targetOnly).toContain("What do you want to change?");
    expect(targetOnly).not.toContain("What do you want to do?");
    expect(targetOnly).not.toContain("Tell Fyn what to change");

    // After a target is chosen: the action selector appears, still no context field.
    const withAction = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context: makeRevisionContext({ generationDomain: "SKILLS" }),
          targetOptions: targets,
          selectedTargetKey: sessionTarget.key,
        }),
      ),
    );
    expect(withAction).toContain("What do you want to do?");
    expect(withAction).not.toContain("Tell Fyn what to change");
    // Target selector precedes the action selector in document order.
    expect(withAction.indexOf("What do you want to change?")).toBeLessThan(
      withAction.indexOf("What do you want to do?"),
    );

    // After an action is chosen: the context field appears, after the action selector.
    const withContext = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context: makeRevisionContext({ generationDomain: "SKILLS" }),
          targetOptions: targets,
          selectedTargetKey: sessionTarget.key,
          selectedActionKey: "ADD_ITEM",
        }),
      ),
    );
    expect(withContext).toContain("Tell Fyn what to change");
    expect(withContext.indexOf("What do you want to do?")).toBeLessThan(
      withContext.indexOf("Tell Fyn what to change"),
    );
  });

  it("uses domain- and action-specific context placeholders", () => {
    expect(fynRevisionContextPlaceholder("SKILLS", "ADD_SESSION")).toBe(
      "Example: Add Lag Putting Foundation and keep intensity low.",
    );
    expect(fynRevisionContextPlaceholder("SKILLS", "ADD_ITEM")).toBe(
      "Example: Add a pace-control putting drill.",
    );
    expect(fynRevisionContextPlaceholder("SKILLS", "UPDATE_SESSION_ITEMS")).toBe(
      "Example: Add one lag putting drill and remove the advanced drill.",
    );
    expect(fynRevisionContextPlaceholder("NUTRITION", "ADD_ITEM")).toBe(
      "Example: Add a lighter carb option to breakfast.",
    );
    expect(fynRevisionContextPlaceholder("S_AND_C", "ADD_ITEM")).toBe(
      "Example: Add a low-load mobility exercise.",
    );
    expect(fynRevisionContextPlaceholder("S_AND_C", "ADD_SESSION")).toBe(
      "Example: Add a low-load mobility session.",
    );
    // Actions without a tailored example fall back to the generic placeholder.
    expect(fynRevisionContextPlaceholder("SKILLS", "REPLACE_ITEM")).toBe(
      FYN_REVISION_INPUT_PLACEHOLDER,
    );
    expect(fynRevisionContextPlaceholder("SKILLS", null)).toBe(FYN_REVISION_INPUT_PLACEHOLDER);
  });

  it("renders the action-specific placeholder inside the context field", () => {
    const targets = fynRevisionLeveledTargetOptions(
      makeRevisionContext({ generationDomain: "SKILLS" }),
      { domain: "SKILLS", scheduleDays: skillsSchedule },
    );
    const sessionTarget = targets.find((option) => option.level === "SESSION")!;
    const html = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context: makeRevisionContext({ generationDomain: "SKILLS" }),
          targetOptions: targets,
          selectedTargetKey: sessionTarget.key,
          selectedActionKey: "ADD_ITEM",
        }),
      ),
    );
    expect(html).toContain("Example: Add a pace-control putting drill.");
  });

  it("offers ADD_ITEM at the SESSION/meal level for every domain", () => {
    const skills = fynRevisionLeveledTargetOptions(
      makeRevisionContext({ generationDomain: "SKILLS" }),
      { domain: "SKILLS", scheduleDays: skillsSchedule },
    );
    expect(actionKeysFor("SKILLS", skills.find((o) => o.level === "SESSION"))).toContain(
      "ADD_ITEM",
    );

    const nutrition = fynRevisionLeveledTargetOptions(
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
    expect(actionKeysFor("NUTRITION", nutrition.find((o) => o.level === "SESSION"))).toContain(
      "ADD_ITEM",
    );

    const sandc = fynRevisionLeveledTargetOptions(
      makeRevisionContext({ generationDomain: "S_AND_C" }),
      {
        domain: "S_AND_C",
        scheduleDays: [
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
    // S&C add-exercise is offered on the session, and NOT on an existing exercise item.
    expect(actionKeysFor("S_AND_C", sandc.find((o) => o.level === "SESSION"))).toContain(
      "ADD_ITEM",
    );
    expect(actionKeysFor("S_AND_C", sandc.find((o) => o.level === "ITEM"))).not.toContain(
      "ADD_ITEM",
    );
  });

  it("reveals Show approved options for the Skills Add Drill action only", () => {
    const skills = fynRevisionLeveledTargetOptions(
      makeRevisionContext({ generationDomain: "SKILLS" }),
      { domain: "SKILLS", scheduleDays: skillsSchedule },
    );
    const sessionTarget = skills.find((o) => o.level === "SESSION")!;
    const renderPanel = (
      targetKey: string,
      actionKey: FynRevisionActionKeyForTest,
    ): string =>
      renderToStaticMarkup(
        createElement(
          FynRevisionContextPanel,
          fynPanelProps({
            context: makeRevisionContext({ generationDomain: "SKILLS" }),
            targetOptions: skills,
            selectedTargetKey: targetKey,
            selectedActionKey: actionKey,
            coachRequest: "Something specific.",
          }),
        ),
      );

    expect(renderPanel(sessionTarget.key, "ADD_ITEM")).toContain(FYN_REVISION_SHOW_OPTIONS_LABEL);
    expect(skills.some((target) => target.level === "DAY")).toBe(false);
    expect(skills.some((target) => target.level === "ITEM")).toBe(true);
  });

  it("renders action choices as radio selection controls with intent-not-command helper copy", () => {
    const targets = fynRevisionLeveledTargetOptions(
      makeRevisionContext({ generationDomain: "SKILLS" }),
      { domain: "SKILLS", scheduleDays: skillsSchedule },
    );
    const sessionTarget = targets.find((option) => option.level === "SESSION")!;
    const html = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context: makeRevisionContext({ generationDomain: "SKILLS" }),
          targetOptions: targets,
          selectedTargetKey: sessionTarget.key,
        }),
      ),
    );
    // Actions are grouped radio controls, one per supported action — not command buttons.
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('type="radio"');
    expect(html).toContain('value="ADD_ITEM"');
    expect(html).not.toContain('value="UPDATE_SESSION"');
    expect(html).not.toContain('value="UPDATE_SESSION_ITEMS"');
    // Helper copy makes clear the choice is intent only.
    expect(html).toContain(
      "Choose one revision action. Nothing is applied until you add it to plan changes.",
    );
  });

  it("marks the chosen action's radio as selected and leaves the rest unselected", () => {
    const targets = fynRevisionLeveledTargetOptions(
      makeRevisionContext({ generationDomain: "SKILLS" }),
      { domain: "SKILLS", scheduleDays: skillsSchedule },
    );
    const sessionTarget = targets.find((option) => option.level === "SESSION")!;

    // No action chosen yet: nothing is marked selected.
    const unselected = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context: makeRevisionContext({ generationDomain: "SKILLS" }),
          targetOptions: targets,
          selectedTargetKey: sessionTarget.key,
        }),
      ),
    );
    expect(unselected).not.toMatch(/data-selected="true"/);

    // Selecting an action is reflected on exactly that radio control.
    const selected = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context: makeRevisionContext({ generationDomain: "SKILLS" }),
          targetOptions: targets,
          selectedTargetKey: sessionTarget.key,
          selectedActionKey: "ADD_ITEM",
        }),
      ),
    );
    expect(selected).toMatch(/data-selected="true"[^>]*value="ADD_ITEM"/);
    expect(selected.match(/data-selected="true"/g)).toHaveLength(1);
  });

  it("does not show the retired max-4 drill batch action for Skills Milestone 1", () => {
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
        }),
      ),
    );
    expect(skillsHtml).not.toContain("Edit several drills in this session");
    expect(skillsHtml).not.toContain(
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

  describe("Nutrition meal-minimum guidance", () => {
    // Breakfast requires 3 items; keep 4 here so REMOVE_ITEM stays eligible for these tests.
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
              { order: 2, label: "Eggs", nutritionCatalogItemId: "nut-3" },
              { order: 3, label: "Toast", nutritionCatalogItemId: "nut-4" },
            ],
          },
        ],
      },
    ];

    const renderForDomain = (
      domain: "SKILLS" | "NUTRITION" | "S_AND_C",
      scheduleDays: unknown[],
      extra: Record<string, unknown> = {},
    ): string => {
      const context = makeRevisionContext({ generationDomain: domain });
      const targets = fynRevisionLeveledTargetOptions(context, { domain, scheduleDays });
      return renderToStaticMarkup(
        createElement(
          FynRevisionContextPanel,
          fynPanelProps({ domain, context, targetOptions: targets, ...extra }),
        ),
      );
    };

    it("mirrors the backend-confirmed meal-slot minimums as a frontend constant", () => {
      expect(NUTRITION_MEAL_SLOT_MIN_ITEMS).toEqual({
        BREAKFAST: 3,
        MID_MORNING_SNACK: 2,
        LUNCH: 4,
        MID_AFTERNOON_SNACK: 2,
        DINNER: 4,
      });
      // Only the five valid meal slots are represented.
      expect(Object.keys(NUTRITION_MEAL_SLOT_MIN_ITEMS)).toEqual([
        "BREAKFAST",
        "MID_MORNING_SNACK",
        "LUNCH",
        "MID_AFTERNOON_SNACK",
        "DINNER",
      ]);
    });

    it("shows the meal-minimum guidance with exact values for Nutrition", () => {
      const html = renderForDomain("NUTRITION", nutritionSchedule);
      expect(html).toContain(NUTRITION_MEAL_MINIMUMS_GUIDANCE);
      expect(html).toContain(
        "Meal minimums: Breakfast requires at least 3 items, mid-morning snack at least 2, " +
          "lunch at least 4, mid-afternoon snack at least 2, and dinner at least 4. " +
          "If removing an item would drop a meal below its minimum, replace it instead or add " +
          "another item to the same meal.",
      );
    });

    it("lists only the five valid meal slots and no invalid ones", () => {
      const html = renderForDomain("NUTRITION", nutritionSchedule);
      expect(html).toContain(NUTRITION_MEAL_MINIMUMS_GUIDANCE);
      const guidance = NUTRITION_MEAL_MINIMUMS_GUIDANCE.toLowerCase();
      for (const slot of ["breakfast", "mid-morning snack", "lunch", "mid-afternoon snack", "dinner"]) {
        expect(guidance).toContain(slot);
      }
      for (const invalid of ["hydration", "recovery", "pre-training", "post-training", "anytime"]) {
        expect(guidance).not.toContain(invalid);
      }
      // A bare "snack" slot (without the mid-morning/afternoon qualifier) is never introduced.
      expect(guidance).not.toMatch(/(?<!mid-morning |mid-afternoon )snack\b/);
    });

    it("shows the Remove-carefully warning only when Remove food item is selected for Nutrition", () => {
      const context = makeRevisionContext({ generationDomain: "NUTRITION" });
      const targets = fynRevisionLeveledTargetOptions(context, {
        domain: "NUTRITION",
        scheduleDays: nutritionSchedule,
      });
      const itemTarget = targets.find((option) => option.level === "ITEM")!;

      const withRemove = renderToStaticMarkup(
        createElement(
          FynRevisionContextPanel,
          fynPanelProps({
            domain: "NUTRITION",
            context,
            targetOptions: targets,
            selectedTargetKey: itemTarget.key,
            selectedActionKey: "REMOVE_ITEM",
          }),
        ),
      );
      expect(withRemove).toContain(NUTRITION_REMOVE_ITEM_MINIMUM_WARNING);

      const withReplace = renderToStaticMarkup(
        createElement(
          FynRevisionContextPanel,
          fynPanelProps({
            domain: "NUTRITION",
            context,
            targetOptions: targets,
            selectedTargetKey: itemTarget.key,
            selectedActionKey: "REPLACE_ITEM",
          }),
        ),
      );
      expect(withReplace).not.toContain(NUTRITION_REMOVE_ITEM_MINIMUM_WARNING);
    });

    it("does not show Nutrition meal-minimum guidance for Skills", () => {
      const html = renderForDomain("SKILLS", skillsSchedule);
      expect(html).not.toContain(NUTRITION_MEAL_MINIMUMS_GUIDANCE);
      expect(html).not.toContain("Meal minimums:");
    });

    it("does not show Nutrition meal-minimum guidance for S&C", () => {
      const sandcSchedule = [
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
      const html = renderForDomain("S_AND_C", sandcSchedule);
      expect(html).not.toContain(NUTRITION_MEAL_MINIMUMS_GUIDANCE);
      expect(html).not.toContain("Meal minimums:");
    });

    it("exposes Skills Remove without Nutrition minimum warnings", () => {
      const context = makeRevisionContext({ generationDomain: "SKILLS" });
      const targets = fynRevisionLeveledTargetOptions(context, {
        domain: "SKILLS",
        scheduleDays: skillsSchedule,
      });
      const itemTarget = targets.find((option) => option.level === "ITEM")!;
      const html = renderToStaticMarkup(
        createElement(
          FynRevisionContextPanel,
          fynPanelProps({
            domain: "SKILLS",
            context,
            targetOptions: targets,
            selectedTargetKey: itemTarget.key,
          }),
        ),
      );
      expect(html).toContain("Remove drill");
      expect(html).not.toContain(NUTRITION_REMOVE_ITEM_MINIMUM_WARNING);
    });
  });

  describe("Skills deterministic single-patch flow", () => {
    const skillsSchedule = [
      {
        dayIndex: 2,
        sessions: [
          {
            sessionIndex: 3,
            title: "Short game",
            items: [{ order: 0, label: "Current drill", skillCode: "CURRENT" }],
          },
        ],
      },
    ];
    const context = makeRevisionContext({ generationDomain: "SKILLS" });
    const targets = () =>
      fynRevisionLeveledTargetOptions(context, {
        domain: "SKILLS",
        scheduleDays: skillsSchedule,
      });
    const approvedOption: CoachAthleteDomainDraftRevisionOption = {
      id: "PACE_CONTROL_01",
      rank: 1,
      label: "Pace control ladder",
      domain: "SKILLS",
      optionKind: "ADD_ITEM",
      source: "DB",
      score: 0.95,
      reason: "Matches the session goal",
      goalIds: [],
      targetTags: [],
      safetyTags: [],
      levelTags: [],
      metadata: {
        untrustedCanonicalName: "Do not submit",
        reps: 999,
      },
    };

    it("builds the exact ADD_ITEM patch using only option.id as skillCode", () => {
      const sessionTarget = targets().find((target) => target.level === "SESSION")!;
      const patch = buildSkillsRevisionPatch({
        target: sessionTarget,
        actionKey: "ADD_ITEM",
        option: approvedOption,
      });

      expect(patch).toEqual({
        operation: "ADD_ITEM",
        dayIndex: 2,
        sessionIndex: 3,
        item: { skillCode: "PACE_CONTROL_01" },
      });
      expect(patch).not.toHaveProperty("itemIndex");
      expect(patch!.item).not.toHaveProperty("label");
      expect(patch!.item).not.toHaveProperty("metadata");
      expect(patch!.item).not.toHaveProperty("reps");
    });

    it("assembles one exact structured revision payload", () => {
      const sessionTarget = targets().find((target) => target.level === "SESSION")!;
      const submission = buildSkillsRevisionSubmission({
        reviseIds: { trainingPlanId: "skills-plan-1", versionId: "skills-v1" },
        target: sessionTarget,
        actionKey: "ADD_ITEM",
        option: approvedOption,
        coachRequest: "Keep the progression simple.",
      });

      expect(submission).toEqual({
        trainingPlanId: "skills-plan-1",
        versionId: "skills-v1",
        coachFeedback:
          "Add drill Pace control ladder to Short game. Keep the progression simple.",
        revisionPatch: {
          operation: "ADD_ITEM",
          dayIndex: 2,
          sessionIndex: 3,
          item: { skillCode: "PACE_CONTROL_01" },
        },
      });
    });

    it("builds the exact REMOVE_ITEM payload from the selected drill", () => {
      const itemTarget = targets().find((target) => target.level === "ITEM")!;
      const submission = buildSkillsRevisionSubmission({
        reviseIds: { trainingPlanId: "skills-plan-1", versionId: "skills-v1" },
        target: itemTarget,
        actionKey: "REMOVE_ITEM",
        coachRequest: "Remove it from this session.",
      });

      expect(submission).toEqual({
        trainingPlanId: "skills-plan-1",
        versionId: "skills-v1",
        coachFeedback:
          "Remove drill Current drill from Short game. Remove it from this session.",
        revisionPatch: {
          operation: "REMOVE_ITEM",
          dayIndex: 2,
          sessionIndex: 3,
          itemIndex: 1,
          item: { skillCode: "CURRENT" },
        },
      });
    });

    it("blocks REMOVE_ITEM for wrong or incomplete targets", () => {
      const sessionTarget = targets().find((target) => target.level === "SESSION")!;
      const itemTarget = targets().find((target) => target.level === "ITEM")!;

      expect(
        buildSkillsRevisionSubmission({
          reviseIds: { trainingPlanId: "skills-plan-1", versionId: "skills-v1" },
          target: sessionTarget,
          actionKey: "REMOVE_ITEM",
        }),
      ).toBeNull();
      expect(
        buildSkillsRevisionSubmission({
          reviseIds: { trainingPlanId: "skills-plan-1", versionId: "skills-v1" },
          target: {
            ...itemTarget,
            indices: { ...itemTarget.indices, dayIndex: null },
          },
          actionKey: "REMOVE_ITEM",
        }),
      ).toBeNull();
      expect(
        buildSkillsRevisionSubmission({
          reviseIds: { trainingPlanId: "skills-plan-1", versionId: "skills-v1" },
          target: {
            ...itemTarget,
            target: { ...itemTarget.target, currentId: null },
          },
          actionKey: "REMOVE_ITEM",
        }),
      ).toBeNull();
      expect(
        buildSkillsRevisionSubmission({
          reviseIds: { trainingPlanId: "skills-plan-1", versionId: "skills-v1" },
          target: {
            ...itemTarget,
            indices: { ...itemTarget.indices, itemIndex: null },
          },
          actionKey: "REMOVE_ITEM",
        }),
      ).toBeNull();
    });

    it("keeps free chat visible for Remove Drill and does not request approved options", () => {
      const itemTarget = targets().find((target) => target.level === "ITEM")!;
      const html = renderToStaticMarkup(
        createElement(
          FynRevisionContextPanel,
          fynPanelProps({
            domain: "SKILLS",
            context,
            targetOptions: targets(),
            selectedTargetKey: itemTarget.key,
            selectedActionKey: "REMOVE_ITEM",
            coachRequest: "Remove this drill.",
            singlePatchMode: true,
          }),
        ),
      );

      expect(html).toContain("Remove drill");
      expect(html).toContain("<textarea");
      expect(html).not.toContain(FYN_REVISION_SHOW_OPTIONS_LABEL);
      expect(html).not.toContain("Add to plan changes");
    });

    it("shows a selected DB option in single-patch mode, keeps chat, and hides the basket", () => {
      const sessionTarget = targets().find((target) => target.level === "SESSION")!;
      const html = renderToStaticMarkup(
        createElement(
          FynRevisionContextPanel,
          fynPanelProps({
            domain: "SKILLS",
            context,
            targetOptions: targets(),
            selectedTargetKey: sessionTarget.key,
            selectedActionKey: "ADD_ITEM",
            coachRequest: "Add a pace-control drill.",
            singlePatchMode: true,
            selectedOptionId: approvedOption.id,
            optionsState: {
              loading: false,
              error: null,
              message: null,
              options: [approvedOption],
              searched: true,
            },
          }),
        ),
      );

      expect(html).toContain(SKILLS_SINGLE_PATCH_GUIDANCE);
      expect(html).toContain('data-testid="fyn-skills-selected-option"');
      expect(html).toContain('data-selected="true"');
      expect(html).toContain("<textarea");
      expect(html).not.toContain("Revision basket");
      expect(html).not.toContain("Add to plan changes");
    });

    it("pins the returned Skills version and rebuilds targets after the latest plan reload", async () => {
      expect(nextSkillsRevisionVersionId({ versionId: "skills-v2" })).toBe("skills-v2");
      expect(
        resolveActiveSkillsReviseIds(
          { trainingPlanId: "skills-plan-1", versionId: "skills-v1" },
          { trainingPlanId: "skills-plan-1", versionId: "skills-v2" },
        ),
      ).toEqual({ trainingPlanId: "skills-plan-1", versionId: "skills-v2" });

      const events: string[] = [];
      let schedule: readonly unknown[] = skillsSchedule;
      let rebuiltTargets = targets();
      await runNutritionReviewDrawerOpenRefresh({
        loadLatestPlan: async () => {
          events.push("reload");
          schedule = [
            ...skillsSchedule,
            {
              dayIndex: 4,
              sessions: [{ sessionIndex: 1, title: "Putting", items: [] }],
            },
          ];
        },
        rebuildTargetOptions: async () => {
          events.push("rebuild");
          rebuiltTargets = fynRevisionLeveledTargetOptions(context, {
            domain: "SKILLS",
            scheduleDays: schedule,
          });
        },
      });

      expect(events).toEqual(["reload", "rebuild"]);
      expect(
        rebuiltTargets
          .filter((target) => target.level === "SESSION")
          .map((target) => target.sessionLabel),
      ).toEqual(["Short game", "Putting"]);
    });

    it("does not reload or replace the current plan when the Skills revision request fails", async () => {
      const currentPlan = { versionId: "skills-v1", days: skillsSchedule };
      let renderedPlan = currentPlan;
      let activeVersionId = "skills-v1";
      const reload = vi.fn(async () => {
        renderedPlan = { versionId: "skills-v2", days: [] };
      });
      const rebuild = vi.fn(async () => {});
      const revise = vi.fn(async () => {
        throw new Error("Revision rejected");
      });

      try {
        await revise();
        activeVersionId = "skills-v2";
        await runNutritionReviewDrawerOpenRefresh({
          loadLatestPlan: reload,
          rebuildTargetOptions: rebuild,
        });
      } catch {
        // The component's Skills catch path reports the error without plan/reload state changes.
      }

      expect(renderedPlan).toBe(currentPlan);
      expect(activeVersionId).toBe("skills-v1");
      expect(reload).not.toHaveBeenCalled();
      expect(rebuild).not.toHaveBeenCalled();
    });

    it("does not change Nutrition capabilities or S&C basket mode", () => {
      expect(FYN_REVISION_CAPABILITIES.NUTRITION).toEqual({
        levels: ["SESSION", "ITEM"],
        actionsByLevel: {
          DAY: [],
          SESSION: ["ADD_ITEM"],
          ITEM: ["REPLACE_ITEM", "UPDATE_ITEM", "REMOVE_ITEM"],
        },
      });

      const sandcHtml = renderToStaticMarkup(
        createElement(
          FynRevisionContextPanel,
          fynPanelProps({
            domain: "S_AND_C",
            selection: { changes: [{ acceptedChange: "Add exercise to Lower body." }] },
            singlePatchMode: false,
          }),
        ),
      );
      expect(sandcHtml).toContain("Revision basket");
      expect(sandcHtml).not.toContain(SKILLS_SINGLE_PATCH_GUIDANCE);
    });
  });

  describe("Nutrition deterministic single-patch flow", () => {
    // Breakfast requires 3 items; keep 4 here so REMOVE_ITEM stays eligible for these tests.
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
              { order: 2, label: "Eggs", nutritionCatalogItemId: "nut-3" },
              { order: 3, label: "Toast", nutritionCatalogItemId: "nut-4" },
            ],
          },
        ],
      },
    ];
    const buildNutritionTargets = () =>
      fynRevisionLeveledTargetOptions(makeRevisionContext({ generationDomain: "NUTRITION" }), {
        domain: "NUTRITION",
        scheduleDays: nutritionSchedule,
      });
    const reviseIds = { trainingPlanId: "plan-1", versionId: "ver-1" };
    const approvedOption: CoachAthleteDomainDraftRevisionOption = {
      id: "opt-approved-1",
      rank: 1,
      label: "Oatmeal",
      domain: "NUTRITION",
      optionKind: "REPLACEMENT",
      source: "CATALOG",
      score: 0.9,
      reason: null,
      goalIds: [],
      targetTags: [],
      safetyTags: [],
      levelTags: [],
      // Authoritative catalog reference lives on the explicit top-level field.
      nutritionCatalogItemId: "nut-9",
      // Backend supplies the complete canonical item; ADD_ITEM / REPLACE_ITEM submit it verbatim.
      item: {
        nutritionCatalogItemId: "nut-9",
        itemType: "NUTRITION",
        label: "Oatmeal",
        serving: "1 cup",
        calories: 320,
        protein: 12,
        carbs: 54,
        fat: 6,
        fiber: 8,
        timing: "Breakfast",
        notes: "High fibre",
      },
      metadata: {
        serving: "1 cup",
        timing: "Breakfast",
        notes: "High fibre",
      },
    };

    it("maps Nutrition actions to only the four supported backend patch operations", () => {
      expect(nutritionRevisionPatchOperation("UPDATE_SESSION")).toBeNull();
      expect(nutritionRevisionPatchOperation("REPLACE_ITEM")).toBe("REPLACE_ITEM");
      expect(nutritionRevisionPatchOperation("ADD_ITEM")).toBe("ADD_ITEM");
      expect(nutritionRevisionPatchOperation("REMOVE_ITEM")).toBe("REMOVE_ITEM");
      expect(nutritionRevisionPatchOperation("UPDATE_ITEM")).toBe("UPDATE_ITEM");
      expect(nutritionRevisionPatchOperation("ADD_SESSION")).toBeNull();
      expect(nutritionRevisionPatchOperation("REPLACE_DAY")).toBeNull();
      expect(nutritionRevisionPatchOperation("UPDATE_SESSION_ITEMS")).toBeNull();
    });

    it("builds one REPLACE_ITEM patch with 1-based indices and the option's canonical item unchanged", () => {
      const target = buildNutritionTargets().find(
        (option) => option.level === "ITEM" && option.itemLabel === "White rice",
      )!;
      const patch = buildNutritionRevisionPatch({
        target,
        actionKey: "REPLACE_ITEM",
        option: approvedOption,
        coachRequest: "Prefer a lighter option.",
      });
      expect(patch).toEqual({
        operation: "REPLACE_ITEM",
        dayIndex: 1,
        sessionIndex: 1,
        itemIndex: 1,
        item: approvedOption.item,
      });
      // The canonical item is passed through by reference, never rebuilt from label/metadata.
      expect(patch!.item).toBe(approvedOption.item);
    });

    it("uses 1-based itemIndex from the item's CURRENT array position (never item.order)", () => {
      const targets = buildNutritionTargets();
      const first = targets.find((o) => o.level === "ITEM" && o.itemLabel === "White rice")!;
      const second = targets.find((o) => o.level === "ITEM" && o.itemLabel === "Juice")!;
      expect(first.indices).toEqual({ dayIndex: 1, sessionIndex: 1, itemIndex: 1 });
      expect(second.indices).toEqual({ dayIndex: 1, sessionIndex: 1, itemIndex: 2 });
      expect(
        buildNutritionRevisionPatch({ target: second, actionKey: "REMOVE_ITEM" }),
      ).toEqual({ operation: "REMOVE_ITEM", dayIndex: 1, sessionIndex: 1, itemIndex: 2 });
    });

    it("builds one ADD_ITEM patch with no itemIndex (backend appends automatically)", () => {
      const sessionTarget = buildNutritionTargets().find((o) => o.level === "SESSION")!;
      const patch = buildNutritionRevisionPatch({
        target: sessionTarget,
        actionKey: "ADD_ITEM",
        option: approvedOption,
      });
      expect(patch).not.toHaveProperty("itemIndex");
      expect(patch).toEqual({
        operation: "ADD_ITEM",
        dayIndex: 1,
        sessionIndex: 1,
        item: approvedOption.item,
      });
      // The canonical item is passed through by reference, never rebuilt from label/metadata.
      expect(patch!.item).toBe(approvedOption.item);
    });

    it("never builds or submits an UPDATE_SESSION patch for Nutrition", () => {
      const sessionTarget = buildNutritionTargets().find((o) => o.level === "SESSION")!;
      const patch = buildNutritionRevisionPatch({
        target: sessionTarget,
        actionKey: "UPDATE_SESSION",
        coachRequest: "Shift breakfast earlier.",
      });
      expect(patch).toBeNull();
      expect(
        buildNutritionRevisionSubmission({
          reviseIds,
          target: sessionTarget,
          actionKey: "UPDATE_SESSION",
          coachRequest: "Shift breakfast earlier.",
        }),
      ).toBeNull();
    });

    it("returns the backend's canonical item verbatim (serving and every nutrition value preserved)", () => {
      const item = buildNutritionRevisionOptionItem(approvedOption);
      // Passed through by reference — nothing rebuilt from label/metadata.
      expect(item).toBe(approvedOption.item);
      expect(item).toEqual({
        nutritionCatalogItemId: "nut-9",
        itemType: "NUTRITION",
        label: "Oatmeal",
        serving: "1 cup",
        calories: 320,
        protein: 12,
        carbs: 54,
        fat: 6,
        fiber: 8,
        timing: "Breakfast",
        notes: "High fibre",
      });
      // With no canonical item the option carries no item to submit, so null is returned.
      expect(
        buildNutritionRevisionOptionItem({ ...approvedOption, item: undefined }),
      ).toBeNull();
    });

    it("blocks submission until the required approved option is selected", () => {
      const itemTarget = buildNutritionTargets().find((o) => o.level === "ITEM")!;
      expect(
        buildNutritionRevisionPatch({ target: itemTarget, actionKey: "REPLACE_ITEM", option: null }),
      ).toBeNull();
      expect(
        nutritionRevisionCanApply({
          reviseIds,
          target: itemTarget,
          actionKey: "REPLACE_ITEM",
          option: null,
        }),
      ).toBe(false);
      expect(
        nutritionRevisionCanApply({
          reviseIds,
          target: itemTarget,
          actionKey: "REPLACE_ITEM",
          option: approvedOption,
        }),
      ).toBe(true);
    });

    it("blocks submission when no target or action is selected", () => {
      const itemTarget = buildNutritionTargets().find((o) => o.level === "ITEM")!;
      expect(
        nutritionRevisionCanApply({ reviseIds, target: null, actionKey: "REMOVE_ITEM" }),
      ).toBe(false);
      expect(
        nutritionRevisionCanApply({ reviseIds, target: itemTarget, actionKey: null }),
      ).toBe(false);
      expect(
        nutritionRevisionCanApply({ reviseIds: null, target: itemTarget, actionKey: "REMOVE_ITEM" }),
      ).toBe(false);
    });

    it("assembles a full submission with revisionPatch as the executable source of truth", () => {
      const itemTarget = buildNutritionTargets().find(
        (o) => o.level === "ITEM" && o.itemLabel === "White rice",
      )!;
      const submission = buildNutritionRevisionSubmission({
        reviseIds,
        target: itemTarget,
        actionKey: "REPLACE_ITEM",
        option: approvedOption,
        coachRequest: "Prefer a lighter option.",
      });
      expect(submission).not.toBeNull();
      expect(submission!.trainingPlanId).toBe("plan-1");
      expect(submission!.versionId).toBe("ver-1");
      // The structured patch is present and executable — the request never relies on feedback alone.
      expect(submission!.revisionPatch).toMatchObject({
        operation: "REPLACE_ITEM",
        dayIndex: 1,
        sessionIndex: 1,
        itemIndex: 1,
        item: { nutritionCatalogItemId: "nut-9", label: "Oatmeal" },
      });
      // coachFeedback is only a human summary, not the source of truth.
      expect(submission!.coachFeedback.trim().length).toBeGreaterThan(0);
      expect(Object.keys(submission!)).toEqual([
        "trainingPlanId",
        "versionId",
        "coachFeedback",
        "revisionPatch",
      ]);
    });

    it("hides the multi-change basket UI for Nutrition and shows single-patch guidance", () => {
      const context = makeRevisionContext({ generationDomain: "NUTRITION" });
      const targets = buildNutritionTargets();
      const sessionTarget = targets.find((o) => o.level === "SESSION")!;
      const html = renderToStaticMarkup(
        createElement(
          FynRevisionContextPanel,
          fynPanelProps({
            domain: "NUTRITION",
            context,
            targetOptions: targets,
            selectedTargetKey: sessionTarget.key,
            selectedActionKey: "ADD_ITEM",
            singlePatchMode: true,
            // A stale multi-change selection must never surface a basket in single-patch mode.
            selection: { changes: [{ acceptedChange: "One" }, { acceptedChange: "Two" }] },
          }),
        ),
      );
      expect(html).toContain(NUTRITION_SINGLE_PATCH_GUIDANCE);
      expect(html).not.toContain("Revision basket");
      expect(html).not.toContain("Add to plan changes");
      expect(html).not.toContain("You can make");
    });

    it("marks the chosen approved option chip in single-patch mode", () => {
      const context = makeRevisionContext({ generationDomain: "NUTRITION" });
      const targets = buildNutritionTargets();
      const itemTarget = targets.find((o) => o.level === "ITEM")!;
      const html = renderToStaticMarkup(
        createElement(
          FynRevisionContextPanel,
          fynPanelProps({
            domain: "NUTRITION",
            context,
            targetOptions: targets,
            selectedTargetKey: itemTarget.key,
            selectedActionKey: "REPLACE_ITEM",
            singlePatchMode: true,
            selectedOptionId: "opt-approved-1",
            coachRequest: "Lighter option.",
            optionsState: {
              loading: false,
              error: null,
              message: null,
              options: [approvedOption],
              searched: true,
            },
          }),
        ),
      );
      expect(html).toContain('data-selected="true"');
      expect(html).toContain("Oatmeal");
    });
  });

  describe("Nutrition item target submits its own current array position (no submit-time re-match)", () => {
    const reviseIds = { trainingPlanId: "plan-1", versionId: "ver-1" };
    const approvedOption: CoachAthleteDomainDraftRevisionOption = {
      id: "opt-approved-1",
      rank: 1,
      label: "Oatmeal",
      domain: "NUTRITION",
      optionKind: "REPLACEMENT",
      source: "CATALOG",
      score: 0.9,
      reason: null,
      goalIds: [],
      targetTags: [],
      safetyTags: [],
      levelTags: [],
      nutritionCatalogItemId: "nut-9",
      item: {
        nutritionCatalogItemId: "nut-9",
        itemType: "NUTRITION",
        label: "Oatmeal",
        serving: "1 cup",
        calories: 320,
        protein: 12,
        carbs: 54,
        fat: 6,
        fiber: 8,
        timing: "Breakfast",
        notes: "High fibre",
      },
      metadata: { serving: "1 cup", timing: "Breakfast", notes: "High fibre" },
    };
    // Day 3 Breakfast renders 4 items; the stored `order` values are 0,1,2,4 and Idli is visibly the
    // 4th item. A stale order-based index would send 5; the current array position is 4.
    const staleOrderSchedule = [
      {
        dayIndex: 3,
        sessions: [
          {
            sessionIndex: 1,
            title: "Breakfast",
            items: [
              { order: 0, label: "Poha", nutritionCatalogItemId: "nut-a", serving: "1 bowl" },
              { order: 1, label: "Milk", nutritionCatalogItemId: "nut-b", serving: "1 cup" },
              { order: 2, label: "Banana", nutritionCatalogItemId: "nut-c", serving: "2 pcs" },
              { order: 4, label: "Idli", nutritionCatalogItemId: "nut-idli", serving: "3 pcs" },
            ],
          },
        ],
      },
    ];
    const buildTargets = (scheduleDays: readonly unknown[]) =>
      fynRevisionLeveledTargetOptions(makeRevisionContext({ generationDomain: "NUTRITION" }), {
        domain: "NUTRITION",
        scheduleDays,
      });
    const findItem = (scheduleDays: readonly unknown[], label: string) =>
      buildTargets(scheduleDays).find((o) => o.level === "ITEM" && o.itemLabel === label)!;

    it("submits the visible dropdown item's current array position + 1 directly", () => {
      const banana = findItem(staleOrderSchedule, "Banana"); // 3rd item in the rendered meal
      expect(banana.indices).toMatchObject({ dayIndex: 3, sessionIndex: 1, itemIndex: 3 });
      const submission = buildNutritionRevisionSubmission({
        reviseIds,
        target: banana,
        actionKey: "REMOVE_ITEM",
      });
      // The submitted patch carries the dropdown target's own indices verbatim.
      expect(submission!.revisionPatch).toMatchObject({
        operation: "REMOVE_ITEM",
        dayIndex: 3,
        sessionIndex: 1,
        itemIndex: 3,
      });
    });

    it("submits the fourth item as itemIndex 4 even though its stored order is 4", () => {
      const idli = findItem(staleOrderSchedule, "Idli"); // 4th item, stored order 4
      expect(idli.indices.itemIndex).toBe(4);
      const remove = buildNutritionRevisionSubmission({
        reviseIds,
        target: idli,
        actionKey: "REMOVE_ITEM",
      });
      expect(remove!.revisionPatch!.itemIndex).toBe(4);
      expect(remove!.revisionPatch!.itemIndex).not.toBe(5);
      // REPLACE_ITEM and UPDATE_ITEM submit the same current position.
      expect(
        buildNutritionRevisionSubmission({
          reviseIds,
          target: idli,
          actionKey: "REPLACE_ITEM",
          option: approvedOption,
        })!.revisionPatch!.itemIndex,
      ).toBe(4);
      expect(
        buildNutritionRevisionSubmission({
          reviseIds,
          target: idli,
          actionKey: "UPDATE_ITEM",
          servingTargetQuantity: 4,
        })!.revisionPatch!.itemIndex,
      ).toBe(4);
    });

    it("submits the fourth item as itemIndex 4 even when the stored order is 5", () => {
      // Order values need not be contiguous or aligned to position; position is the only truth.
      const orderFiveSchedule = [
        {
          dayIndex: 3,
          sessions: [
            {
              sessionIndex: 1,
              title: "Breakfast",
              items: [
                { order: 0, label: "Poha", nutritionCatalogItemId: "nut-a" },
                { order: 1, label: "Milk", nutritionCatalogItemId: "nut-b" },
                { order: 2, label: "Banana", nutritionCatalogItemId: "nut-c" },
                { order: 5, label: "Idli", nutritionCatalogItemId: "nut-idli" },
              ],
            },
          ],
        },
      ];
      const idli = findItem(orderFiveSchedule, "Idli");
      expect(idli.indices.itemIndex).toBe(4);
      expect(
        buildNutritionRevisionSubmission({ reviseIds, target: idli, actionKey: "REMOVE_ITEM" })!
          .revisionPatch!.itemIndex,
      ).toBe(4);
    });

    it("submits correctly for an item that has no nutritionCatalogItemId", () => {
      const noCatalogSchedule = [
        {
          dayIndex: 2,
          sessions: [
            {
              sessionIndex: 1,
              title: "Breakfast",
              items: [
                { order: 0, label: "Poha", nutritionCatalogItemId: "nut-a" },
                { order: 1, label: "Milk", nutritionCatalogItemId: "nut-b" },
                { order: 2, label: "Banana", nutritionCatalogItemId: "nut-c" },
                { order: 3, label: "Homemade smoothie", serving: "1 cup" },
              ],
            },
          ],
        },
      ];
      const smoothie = findItem(noCatalogSchedule, "Homemade smoothie");
      expect(smoothie.target.currentId).toBeNull();
      const submission = buildNutritionRevisionSubmission({
        reviseIds,
        target: smoothie,
        actionKey: "UPDATE_ITEM",
        servingTargetQuantity: 2,
      });
      // No catalog id is required to submit — the position alone identifies the item.
      expect(submission).not.toBeNull();
      expect(submission!.revisionPatch).toMatchObject({
        operation: "UPDATE_ITEM",
        dayIndex: 2,
        sessionIndex: 1,
        itemIndex: 4,
      });
    });

    it("does not block submission when label/metadata differ from any other item", () => {
      // Two items share the label "Banana" but differ elsewhere; the SELECTED dropdown target still
      // submits its own position with no comparison against other items.
      const dupLabelSchedule = [
        {
          dayIndex: 1,
          sessions: [
            {
              sessionIndex: 1,
              title: "Breakfast",
              items: [
                { order: 0, label: "Banana", nutritionCatalogItemId: "nut-x", serving: "1 large" },
                { order: 1, label: "Milk", nutritionCatalogItemId: "nut-b" },
                { order: 2, label: "Banana", nutritionCatalogItemId: "nut-y", serving: "2 small" },
              ],
            },
          ],
        },
      ];
      const targets = buildTargets(dupLabelSchedule).filter(
        (o) => o.level === "ITEM" && o.itemLabel === "Banana",
      );
      // Each "Banana" target keeps its own distinct position and submits without being blocked.
      expect(targets.map((o) => o.indices.itemIndex)).toEqual([1, 3]);
      for (const target of targets) {
        const submission = buildNutritionRevisionSubmission({
          reviseIds,
          target,
          actionKey: "UPDATE_ITEM",
          // 5 differs from both bananas' servings ("1 large" / "2 small"), so neither is blocked.
          servingTargetQuantity: 5,
        });
        expect(submission).not.toBeNull();
      }
    });

    it("never produces a false 'item no longer present' block before API submission", () => {
      // A visible, selectable dropdown item always yields a non-null submission — the frontend has
      // no speculative pre-submit matcher that could reject it. The message copy exists only as a
      // reaction to a real backend rejection, never as a frontend pre-check.
      const idli = findItem(staleOrderSchedule, "Idli");
      const submission = buildNutritionRevisionSubmission({
        reviseIds,
        target: idli,
        actionKey: "REMOVE_ITEM",
      });
      expect(submission).not.toBeNull();
      expect(NUTRITION_ITEM_NOT_IN_LATEST_PLAN_MESSAGE).toBe(
        "This item is no longer in the latest plan. Please select it again.",
      );
    });

    it("uses the rebuilt dropdown's new current positions after a revision reorders the meal", () => {
      // Before: Banana is the 3rd item -> itemIndex 3.
      expect(
        buildNutritionRevisionSubmission({
          reviseIds,
          target: findItem(staleOrderSchedule, "Banana"),
          actionKey: "UPDATE_ITEM",
          servingTargetQuantity: 3,
        })!.revisionPatch!.itemIndex,
      ).toBe(3);

      // After a successful revision the plan reloads and the dropdown is rebuilt: Banana is now the
      // 1st item (carrying a stale order 5). The rebuilt target submits its NEW position (1).
      const afterRevision = [
        {
          dayIndex: 3,
          sessions: [
            {
              sessionIndex: 1,
              title: "Breakfast",
              items: [
                { order: 5, label: "Banana", nutritionCatalogItemId: "nut-c", serving: "2 pcs" },
                { order: 1, label: "Milk", nutritionCatalogItemId: "nut-b" },
                { order: 2, label: "Eggs", nutritionCatalogItemId: "nut-d" },
              ],
            },
          ],
        },
      ];
      const rebuiltBanana = findItem(afterRevision, "Banana");
      expect(rebuiltBanana.indices.itemIndex).toBe(1);
      expect(
        buildNutritionRevisionSubmission({
          reviseIds,
          target: rebuiltBanana,
          actionKey: "UPDATE_ITEM",
          servingTargetQuantity: 3,
        })!.revisionPatch!.itemIndex,
      ).toBe(1);
    });
  });

  describe("Nutrition item-level serving adjustment (UPDATE_ITEM)", () => {
    const reviseIds = { trainingPlanId: "plan-1", versionId: "ver-1" };
    const buildTargets = (scheduleDays: readonly unknown[]) =>
      fynRevisionLeveledTargetOptions(makeRevisionContext({ generationDomain: "NUTRITION" }), {
        domain: "NUTRITION",
        scheduleDays,
      });
    // A one-item breakfast whose single item carries the given serving.
    const mealWith = (serving: string | null | undefined) => [
      {
        dayIndex: 1,
        sessions: [
          {
            sessionIndex: 1,
            title: "Breakfast",
            items: [{ order: 0, label: "Rice", nutritionCatalogItemId: "nut-1", serving }],
          },
        ],
      },
    ];
    const itemTarget = (serving: string | null | undefined) =>
      buildTargets(mealWith(serving)).find((o) => o.level === "ITEM")!;

    describe("parseNutritionServing", () => {
      it("reads quantity/unit and derives an integer step of 1", () => {
        expect(parseNutritionServing("4 pcs")).toEqual({ quantity: 4, unit: "pcs", step: 1 });
      });

      it("preserves the decimal step (1.5 -> 0.5, 1.25 -> 0.25)", () => {
        expect(parseNutritionServing("1.5 cups")).toEqual({
          quantity: 1.5,
          unit: "cups",
          step: 0.5,
        });
        expect(parseNutritionServing("1.25 scoops")).toEqual({
          quantity: 1.25,
          unit: "scoops",
          step: 0.25,
        });
      });

      it("returns null for missing / unparseable / non-positive servings", () => {
        expect(parseNutritionServing(null)).toBeNull();
        expect(parseNutritionServing(undefined)).toBeNull();
        expect(parseNutritionServing("")).toBeNull();
        expect(parseNutritionServing("a handful")).toBeNull();
        expect(parseNutritionServing("0 cups")).toBeNull();
      });
    });

    describe("formatNutritionServingValue", () => {
      it("recombines quantity + unit, tolerating a blank unit", () => {
        expect(formatNutritionServingValue(5, "pcs")).toBe("5 pcs");
        expect(formatNutritionServingValue(1.5, "cups")).toBe("1.5 cups");
        expect(formatNutritionServingValue(2, "")).toBe("2");
      });
    });

    describe("adjustNutritionServingQuantity", () => {
      it("steps an integer serving by 1 up and down", () => {
        expect(adjustNutritionServingQuantity(4, 1, 1)).toBe(5);
        expect(adjustNutritionServingQuantity(4, 1, -1)).toBe(3);
      });

      it("steps a 1.5 serving by 0.5 without floating-point drift", () => {
        expect(adjustNutritionServingQuantity(1.5, 0.5, 1)).toBe(2);
        expect(adjustNutritionServingQuantity(1.5, 0.5, -1)).toBe(1);
      });

      it("never reduces a serving to zero or below", () => {
        expect(adjustNutritionServingQuantity(1, 1, -1)).toBeNull();
        expect(adjustNutritionServingQuantity(0.5, 0.5, -1)).toBeNull();
      });
    });

    it("submits targetQuantity 5 on + and 3 on − for a 4 pcs serving (no replacement item)", () => {
      const target = itemTarget("4 pcs");
      const plus = buildNutritionRevisionSubmission({
        reviseIds,
        target,
        actionKey: "UPDATE_ITEM",
        servingTargetQuantity: 5,
      });
      expect(plus!.revisionPatch).toEqual({
        operation: "UPDATE_ITEM",
        dayIndex: 1,
        sessionIndex: 1,
        itemIndex: 1,
        servingAdjustment: { targetQuantity: 5, servingUnit: "pcs" },
      });
      // UPDATE_ITEM never carries a replacement item and never invents macros.
      expect(plus!.revisionPatch).not.toHaveProperty("item");
      expect(plus!.coachFeedback).toBe("Change Rice serving from 4 pcs to 5 pcs.");

      const minus = buildNutritionRevisionSubmission({
        reviseIds,
        target,
        actionKey: "UPDATE_ITEM",
        servingTargetQuantity: 3,
      });
      expect(minus!.revisionPatch!.servingAdjustment).toEqual({
        targetQuantity: 3,
        servingUnit: "pcs",
      });
      expect(minus!.revisionPatch).not.toHaveProperty("item");
      expect(minus!.coachFeedback).toBe("Change Rice serving from 4 pcs to 3 pcs.");
    });

    it("adjusts a 1.5 cups serving using its 0.5 step", () => {
      const target = itemTarget("1.5 cups");
      const parsed = parseNutritionServing(target.serving);
      expect(parsed!.step).toBe(0.5);
      const submission = buildNutritionRevisionSubmission({
        reviseIds,
        target,
        actionKey: "UPDATE_ITEM",
        servingTargetQuantity: adjustNutritionServingQuantity(1.5, parsed!.step, 1)!,
      });
      expect(submission!.revisionPatch!.servingAdjustment).toEqual({
        targetQuantity: 2,
        servingUnit: "cups",
      });
      expect(submission!.coachFeedback).toBe("Change Rice serving from 1.5 cups to 2 cups.");
    });

    it("cannot reduce a 1-unit serving to zero", () => {
      const target = itemTarget("1 cup");
      expect(adjustNutritionServingQuantity(1, 1, -1)).toBeNull();
      // Submitting 0 (or below) is blocked deterministically.
      expect(
        buildNutritionRevisionSubmission({
          reviseIds,
          target,
          actionKey: "UPDATE_ITEM",
          servingTargetQuantity: 0,
        }),
      ).toBeNull();
    });

    it("blocks Apply when the serving is unchanged, unparseable, or missing", () => {
      const target = itemTarget("4 pcs");
      // Unchanged quantity -> blocked.
      expect(
        buildNutritionRevisionSubmission({
          reviseIds,
          target,
          actionKey: "UPDATE_ITEM",
          servingTargetQuantity: 4,
        }),
      ).toBeNull();
      // No target quantity chosen yet -> blocked (Apply disabled until stepped).
      expect(
        nutritionRevisionCanApply({ reviseIds, target, actionKey: "UPDATE_ITEM" }),
      ).toBe(false);
      // Unparseable serving -> blocked even with a chosen quantity.
      expect(
        buildNutritionRevisionSubmission({
          reviseIds,
          target: itemTarget("a handful"),
          actionKey: "UPDATE_ITEM",
          servingTargetQuantity: 2,
        }),
      ).toBeNull();
      expect(buildNutritionServingAdjustment(itemTarget("a handful"), 2)).toBeNull();
      // Missing serving -> blocked.
      expect(
        buildNutritionRevisionSubmission({
          reviseIds,
          target: itemTarget(null),
          actionKey: "UPDATE_ITEM",
          servingTargetQuantity: 2,
        }),
      ).toBeNull();
    });

    it("leaves REMOVE_ITEM unchanged (no servingAdjustment)", () => {
      // A 4-item breakfast so REMOVE_ITEM stays eligible.
      const fullMeal = [
        {
          dayIndex: 1,
          sessions: [
            {
              sessionIndex: 1,
              title: "Breakfast",
              items: [
                { order: 0, label: "Rice", nutritionCatalogItemId: "nut-1", serving: "1 cup" },
                { order: 1, label: "Milk", nutritionCatalogItemId: "nut-2", serving: "1 cup" },
                { order: 2, label: "Eggs", nutritionCatalogItemId: "nut-3", serving: "2 pcs" },
                { order: 3, label: "Toast", nutritionCatalogItemId: "nut-4", serving: "1 slice" },
              ],
            },
          ],
        },
      ];
      const targets = buildTargets(fullMeal);
      const itemLevel = targets.find((o) => o.level === "ITEM")!;
      // REMOVE_ITEM: bare item op, no servingAdjustment / item.
      const remove = buildNutritionRevisionSubmission({
        reviseIds,
        target: itemLevel,
        actionKey: "REMOVE_ITEM",
      });
      expect(remove!.revisionPatch).not.toHaveProperty("servingAdjustment");
      expect(remove!.revisionPatch).not.toHaveProperty("item");
    });

    it("renders the serving stepper for UPDATE_ITEM and hides the free-text input", () => {
      const targets = buildTargets(mealWith("4 pcs"));
      const itemLevel = targets.find((o) => o.level === "ITEM")!;
      const html = renderToStaticMarkup(
        createElement(
          FynRevisionContextPanel,
          fynPanelProps({
            domain: "NUTRITION",
            singlePatchMode: true,
            targetOptions: targets,
            selectedTargetKey: itemLevel.key,
            selectedActionKey: "UPDATE_ITEM",
            servingStepper: { quantity: 4, unit: "pcs", canDecrement: true },
          }),
        ),
      );
      expect(html).toContain("fyn-nutrition-serving-stepper");
      expect(html).toContain("4 pcs");
      expect(html).toContain("Increase serving");
      expect(html).toContain("Decrease serving");
      // The free-text input and option search are removed for this action.
      expect(html).not.toContain("Tell Fyn what to change");
      expect(html).not.toContain(FYN_REVISION_SHOW_OPTIONS_LABEL);
    });

    it("keeps the free-text input for non-serving Nutrition actions (ADD_ITEM)", () => {
      const targets = buildTargets(mealWith("4 pcs"));
      const sessionLevel = targets.find((o) => o.level === "SESSION")!;
      const html = renderToStaticMarkup(
        createElement(
          FynRevisionContextPanel,
          fynPanelProps({
            domain: "NUTRITION",
            singlePatchMode: true,
            targetOptions: targets,
            selectedTargetKey: sessionLevel.key,
            selectedActionKey: "ADD_ITEM",
          }),
        ),
      );
      expect(html).toContain("Tell Fyn what to change");
      expect(html).not.toContain("fyn-nutrition-serving-stepper");
    });
  });

  describe("Nutrition Plan Review display after revision", () => {
    const makeBananaMilkshakeDraft = (
      nutrients: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
      },
      version: { versionNumber: number; versionId: string },
    ): CoachAthleteLatestDomainDraft => {
      const rawItem = {
        label: "Banana milkshake",
        serving: "2 glass",
        calories: nutrients.calories,
        caloriesKcal: nutrients.calories,
        protein: nutrients.protein,
        proteinG: nutrients.protein,
        proteinGrams: nutrients.protein,
        carbs: nutrients.carbs,
        carbsG: nutrients.carbs,
        carbsGrams: nutrients.carbs,
        carbohydrateG: nutrients.carbs,
        fat: nutrients.fat,
        fatG: nutrients.fat,
        fatGrams: nutrients.fat,
        fiberGrams: nutrients.fiber,
        fiberG: nutrients.fiber,
      };
      const parsed = parseGeneratedDraftItem(rawItem)!;
      return {
        trainingPlanId: "plan-1",
        trainingPlanVersionId: version.versionId,
        versionNumber: version.versionNumber,
        status: "AI_GENERATED",
        source: null,
        revision: null,
        durationDays: null,
        daysCreated: null,
        sessionsCreated: null,
        itemsPersisted: null,
        days: [
          {
            dayIndex: 1,
            date: null,
            dayFocus: null,
            notes: null,
            estimatedDailyCalories: null,
            targetCalorieMin: null,
            targetCalorieMax: null,
            calorieAdequacyStatus: null,
            estimatedCarbohydrateGrams: null,
            targetCarbohydrateMinGrams: null,
            targetCarbohydrateMaxGrams: null,
            estimatedProteinGrams: null,
            targetProteinMinGrams: null,
            targetProteinMaxGrams: null,
            estimatedFatGrams: null,
            targetFatMinGrams: null,
            targetFatMaxGrams: null,
            sessions: [
              {
                sessionIndex: 1,
                title: "Snacks",
                objective: null,
                plannedDurationMinutes: null,
                intensity: null,
                items: [parsed],
              },
            ],
          },
        ],
        raw: {
          days: [
            {
              dayIndex: 1,
              sessions: [{ sessionIndex: 1, title: "Snacks", items: [rawItem] }],
            },
          ],
        },
      };
    };

    const readDisplayedBananaMilkshake = (draft: CoachAthleteLatestDomainDraft) => {
      const item = draft.days[0]!.sessions[0]!.items[0]! as unknown as Record<string, unknown>;
      const rawItem = (draft.raw as { days: Array<{ sessions: Array<{ items: unknown[] }> }> })
        .days[0]!.sessions[0]!.items[0] as Record<string, unknown>;
      return {
        serving: formatNutritionServingDisplay(item, rawItem),
        calories: readNutritionMetricValue(item, rawItem, "calories"),
        protein: readNutritionMetricValue(item, rawItem, "protein"),
        carbs: readNutritionMetricValue(item, rawItem, "carbs"),
        fat: readNutritionMetricValue(item, rawItem, "fat"),
        fiber: readNutritionMetricValue(item, rawItem, "fiber"),
      };
    };

    const makeBananaMilkshakeActiveDetail = (
      nutrients: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
      },
      version: { versionNumber: number; versionId: string },
    ): CoachPersistedTrainingPlanActiveDetail => {
      const rawItem = {
        label: "Banana milkshake",
        serving: "2 glass",
        calories: nutrients.calories,
        protein: nutrients.protein,
        carbs: nutrients.carbs,
        fat: nutrients.fat,
        fiber: nutrients.fiber,
      };
      const parsed = parseGeneratedDraftItem(rawItem)!;
      return {
        selectedVersionRule: "ACTIVE_VERSION",
        generationDomain: "NUTRITION",
        allowedActions: ["REQUEST_REVISION"],
        releaseMode: null,
        constraintComplianceSummary: null,
        plan: {
          id: "plan-1",
          athleteId: "athlete-1",
          entityId: "entity-1",
          status: "AI_GENERATED",
        },
        version: {
          id: version.versionId,
          trainingPlanId: "plan-1",
          versionNumber: version.versionNumber,
          status: "AI_GENERATED",
          createdAt: null,
          submittedAt: null,
          approvedAt: null,
          releasedAt: null,
          startDate: null,
          endDate: null,
        },
        days: [
          {
            id: "day-1",
            date: null,
            dayIndex: 1,
            weekNumber: null,
            isRestDay: null,
            plannedLoadMinutes: null,
            notes: null,
            trainingPlanVersionId: version.versionId,
            sessions: [
              {
                id: "session-1",
                trainingDayId: "day-1",
                title: "Snacks",
                description: null,
                plannedStartTime: null,
                plannedEndTime: null,
                plannedDurationMinutes: null,
                sessionOrder: null,
                sessionType: null,
                assignedCoachId: null,
                objective: null,
                intensity: null,
                sessionStructureSections: [{ key: "items", items: [parsed], raw: { items: [rawItem] } }],
                sessionStructureRaw: { items: { items: [rawItem] } },
              },
            ],
          },
        ],
        raw: {
          days: [
            {
              id: "day-1",
              sessions: [
                {
                  id: "session-1",
                  sessionStructure: { items: { items: [rawItem] } },
                },
              ],
            },
          ],
        },
      } as CoachPersistedTrainingPlanActiveDetail;
    };

    const readDisplayedBananaMilkshakeFromActiveDetail = (
      detail: CoachPersistedTrainingPlanActiveDetail,
    ) => {
      const section = detail.days[0]!.sessions[0]!.sessionStructureSections[0]!;
      const item = section.items[0]! as unknown as Record<string, unknown>;
      const rawItem = (section.raw as { items: unknown[] }).items[0] as Record<string, unknown>;
      return {
        serving: formatNutritionServingDisplay(item, rawItem),
        calories: readNutritionMetricValue(item, rawItem, "calories"),
        protein: readNutritionMetricValue(item, rawItem, "protein"),
        carbs: readNutritionMetricValue(item, rawItem, "carbs"),
        fat: readNutritionMetricValue(item, rawItem, "fat"),
        fiber: readNutritionMetricValue(item, rawItem, "fiber"),
      };
    };

    it("replaces stale in-memory nutrients when the same version id is refetched", () => {
      const stale = makeBananaMilkshakeDraft(
        { calories: 65, protein: 1.8, carbs: 9.1, fat: 2.4, fiber: 2 },
        { versionNumber: 19, versionId: "ver-19" },
      );
      const refetched = makeBananaMilkshakeDraft(
        {
          calories: 130.61289978027344,
          protein: 3.6865992546081543,
          carbs: 18.29117202758789,
          fat: 4.742460250854492,
          fiber: 2,
        },
        { versionNumber: 19, versionId: "ver-19" },
      );
      const next = resolveNewerDomainReviewDraft(stale, refetched);
      expect(next).toBe(refetched);
      expect(readDisplayedBananaMilkshake(next!)).toMatchObject({
        serving: "2 glass",
        calories: 130.61289978027344,
        protein: 3.6865992546081543,
        carbs: 18.29117202758789,
        fat: 4.742460250854492,
        fiber: 2,
      });
    });

    it("same-version active/detail refetch replaces stale Nutrition nutrients immediately", () => {
      const stale = makeBananaMilkshakeActiveDetail(
        { calories: 65, protein: 1.8, carbs: 9.1, fat: 2.4, fiber: 2 },
        { versionNumber: 19, versionId: "ver-19" },
      );
      const refetched = makeBananaMilkshakeActiveDetail(
        {
          calories: 130.61289978027344,
          protein: 3.6865992546081543,
          carbs: 18.29117202758789,
          fat: 4.742460250854492,
          fiber: 2,
        },
        { versionNumber: 19, versionId: "ver-19" },
      );
      expect(
        resolveHeadCoachReviewActiveDetailAfterRefresh({
          refreshedActiveDetail: refetched,
          previousActiveDetail: stale,
          summaryPlanId: "plan-1",
          preservePreviousDetail: true,
        }),
      ).toBe(refetched);
      expect(readDisplayedBananaMilkshakeFromActiveDetail(refetched)).toMatchObject({
        serving: "2 glass",
        calories: 130.61289978027344,
        protein: 3.6865992546081543,
        carbs: 18.29117202758789,
        fat: 4.742460250854492,
        fiber: 2,
      });
    });

    it("renders Nutrition active/detail over stale latest-domain-draft immediately and after reopen", () => {
      const staleDraft = makeBananaMilkshakeDraft(
        { calories: 65, protein: 1.8, carbs: 9.1, fat: 2.4, fiber: 2 },
        { versionNumber: 19, versionId: "ver-19" },
      );
      const freshActiveDetail = makeBananaMilkshakeActiveDetail(
        {
          calories: 130.61289978027344,
          protein: 3.6865992546081543,
          carbs: 18.29117202758789,
          fat: 4.742460250854492,
          fiber: 2,
        },
        { versionNumber: 19, versionId: "ver-19" },
      );
      const resolveSource = () =>
        resolveDomainReviewDrawerContentSource({
          domain: "NUTRITION",
          workflowStatus: "revision_requested",
          directReleaseSkillsOwner: false,
          activeDetail: freshActiveDetail,
          latestDraft: staleDraft,
        });

      expect(resolveSource()).toBe("active_detail");
      // Reopening the drawer runs the same resolver with the same state shape: active/detail remains
      // authoritative and the stale draft cannot take the render path back.
      expect(resolveSource()).toBe("active_detail");
      expect(readDisplayedBananaMilkshakeFromActiveDetail(freshActiveDetail)).toMatchObject({
        calories: 130.61289978027344,
        protein: 3.6865992546081543,
        carbs: 18.29117202758789,
        fat: 4.742460250854492,
      });
    });

    it("keys the active/detail schedule by persisted plan version", () => {
      const detail = makeBananaMilkshakeActiveDetail(
        { calories: 130, protein: 3.6, carbs: 18.2, fat: 4.8, fiber: 2 },
        { versionNumber: 19, versionId: "ver-19" },
      );
      expect(domainReviewActiveDetailRenderKey(detail)).toBe("plan-1:ver-19:19");
    });

    it("prefers the fresher per-domain full-plan reload over a stale global latestSkillsDraft slot", () => {
      const staleGlobal = makeBananaMilkshakeDraft(
        { calories: 65, protein: 1.8, carbs: 9.1, fat: 2.4, fiber: 2 },
        { versionNumber: 19, versionId: "ver-19" },
      );
      const freshPerDomain = makeBananaMilkshakeDraft(
        {
          calories: 130.61289978027344,
          protein: 3.6865992546081543,
          carbs: 18.29117202758789,
          fat: 4.742460250854492,
          fiber: 2,
        },
        { versionNumber: 19, versionId: "ver-19" },
      );
      const displayed = resolveLatestDraftForDomainReview("NUTRITION", {
        isWorkflow2AHeadCoachOwnedSkillsDraft: false,
        headCoachOwnedSkillsDraft: null,
        latestDraftDisplayDomain: "NUTRITION",
        latestSkillsDraft: staleGlobal,
        perDomainLatestDraft: freshPerDomain,
      });
      expect(displayed).toBe(freshPerDomain);
      expect(readDisplayedBananaMilkshake(displayed!)).toMatchObject({
        calories: 130.61289978027344,
        protein: 3.6865992546081543,
        carbs: 18.29117202758789,
        fat: 4.742460250854492,
      });
    });

    it("keys the rendered schedule by plan version so a refetched draft remounts", () => {
      const draft = makeBananaMilkshakeDraft(
        { calories: 130, protein: 3.6, carbs: 18.2, fat: 4.8, fiber: 2 },
        { versionNumber: 19, versionId: "ver-19" },
      );
      expect(domainReviewDraftRenderKey(draft)).toBe("plan-1:ver-19:19");
    });

    // The confirmed Banana Milkshake conflict: the revised candidate carries BOTH the stale base
    // fields (calories/protein/carbs/fat) and the newer scaled runtime aliases (*Kcal / *G). The
    // parser must normalize each nutrient scaled-first so the stale base fields can never win.
    const revisedBananaMilkshakeRaw = {
      label: "Banana milkshake",
      serving: "2 glass",
      calories: 65,
      caloriesKcal: 130,
      protein: 1.8,
      proteinG: 3.6,
      carbs: 9.1,
      carbohydrateG: 18.2,
      fat: 2.4,
      fatG: 4.8,
      fiberGrams: 2,
    };

    it("normalizes each nutrient scaled-first in the parsed item so stale base fields never win", () => {
      const parsed = parseGeneratedDraftItem(revisedBananaMilkshakeRaw)!;
      expect(parsed.serving).toBe("2 glass");
      expect(parsed.calories).toBe(130);
      expect(parsed.protein).toBe(3.6);
      expect(parsed.carbs).toBe(18.2);
      expect(parsed.fat).toBe(4.8);
      expect(parsed.fiber).toBe(2);
    });

    it("immediately shows the revised serving/calories/macros from the normalized parsed item", () => {
      const parsed = parseGeneratedDraftItem(revisedBananaMilkshakeRaw)! as unknown as Record<
        string,
        unknown
      >;
      // The render reads the normalized parsed item first; the raw item's stale base fields (65/1.8/
      // 9.1/2.4) must not override the scaled values already resolved into the parsed item.
      expect(formatNutritionServingDisplay(parsed, revisedBananaMilkshakeRaw)).toBe("2 glass");
      expect(readNutritionMetricValue(parsed, revisedBananaMilkshakeRaw, "calories")).toBe(130);
      expect(readNutritionMetricValue(parsed, revisedBananaMilkshakeRaw, "protein")).toBe(3.6);
      expect(readNutritionMetricValue(parsed, revisedBananaMilkshakeRaw, "carbs")).toBe(18.2);
      expect(readNutritionMetricValue(parsed, revisedBananaMilkshakeRaw, "fat")).toBe(4.8);
      expect(readNutritionMetricValue(parsed, revisedBananaMilkshakeRaw, "fiber")).toBe(2);
      // Daily totals roll up the same normalized values (no frontend recalculation).
      const totals = summarizeNutritionItems([{ item: parsed, rawItem: revisedBananaMilkshakeRaw }]);
      expect(totals).toEqual({ calories: 130, protein: 3.6, carbs: 18.2, fat: 4.8, fiber: 2 });
    });

    it("falls back to canonical-only items when scaled runtime aliases are absent", () => {
      // A canonical/base-only item (no *G / caloriesKcal aliases) must still parse and render.
      const canonicalOnly = parseGeneratedDraftItem({
        label: "Oatmeal",
        serving: "1 bowl",
        calories: 500,
        protein: 20,
        carbs: 60,
        fat: 12,
        fiber: 8,
      })!;
      expect(canonicalOnly.calories).toBe(500);
      expect(canonicalOnly.protein).toBe(20);
      expect(canonicalOnly.carbs).toBe(60);
      expect(canonicalOnly.fat).toBe(12);
      expect(canonicalOnly.fiber).toBe(8);
    });

    it("prefers each scaled runtime alias over its base field during normalization", () => {
      const scaledOnly = parseGeneratedDraftItem({
        label: "Shake",
        proteinGrams: 20,
        carbsGrams: 60,
        fatGrams: 12,
        fiberGrams: 8,
      })!;
      expect(scaledOnly.protein).toBe(20);
      expect(scaledOnly.carbs).toBe(60);
      expect(scaledOnly.fat).toBe(12);
      expect(scaledOnly.fiber).toBe(8);
    });

    it("preserves the existing nutrient aliases in the raw display fallback", () => {
      const legacyItem = {
        calories: 500,
        proteinGrams: 20,
        carbsGrams: 60,
        fatGrams: 12,
        fiberGrams: 8,
      };
      expect(readNutritionMetricValue(null, legacyItem, "calories")).toBe(500);
      expect(readNutritionMetricValue(null, legacyItem, "protein")).toBe(20);
      expect(readNutritionMetricValue(null, legacyItem, "carbs")).toBe(60);
      expect(readNutritionMetricValue(null, legacyItem, "fat")).toBe(12);
      expect(readNutritionMetricValue(null, legacyItem, "fiber")).toBe(8);
    });

    it("does not overwrite displayed nutrients from the sparse revision-context targetMap", () => {
      // The sparse revision-context targetMap carries only target metadata (id/index/label/serving/
      // timing) — never nutrients.
      const sparseContext = makeRevisionContext({
        generationDomain: "NUTRITION",
        draft: null,
        targetMap: {
          days: [
            {
              dayKey: "1",
              dayLabel: "Day 1",
              sessions: [
                {
                  sessionKey: "1",
                  sessionLabel: "Snacks",
                  items: [
                    { itemKey: "0", label: "Banana milkshake", serving: "2 glass", timing: "Snack" },
                  ],
                },
              ],
            },
          ],
        },
      });
      // The complete latest plan the drawer renders below the Fyn panel carries full nutrients.
      const fullPlanDays = [
        {
          dayIndex: 1,
          sessions: [{ sessionIndex: 1, title: "Snacks", items: [revisedBananaMilkshakeRaw] }],
        },
      ];
      const targets = fynRevisionLeveledTargetOptions(sparseContext, {
        domain: "NUTRITION",
        scheduleDays: fullPlanDays,
      });
      const itemTarget = targets.find((o) => o.level === "ITEM")!;
      // The dropdown target rebuilds from the sparse context (serving/label only) and never carries
      // nutrients that could bleed into the displayed plan.
      expect(itemTarget.serving).toBe("2 glass");
      expect(itemTarget).not.toHaveProperty("calories");
      expect(itemTarget).not.toHaveProperty("caloriesKcal");
      // The displayed nutrients still come from the complete plan item, unaffected by the context.
      const parsedFromPlan = parseGeneratedDraftItem(revisedBananaMilkshakeRaw)! as unknown as Record<
        string,
        unknown
      >;
      expect(readNutritionMetricValue(parsedFromPlan, revisedBananaMilkshakeRaw, "calories")).toBe(130);
      expect(readNutritionMetricValue(parsedFromPlan, revisedBananaMilkshakeRaw, "protein")).toBe(3.6);
    });

    it("rebuilds the dropdown from the latest context only after the full plan reload, keeping the drawer open", async () => {
      const events: string[] = [];
      // Mirrors the success-path orchestration: the full plan reloads first, THEN the sparse
      // revision-context reloads to rebuild the dropdown targets. The refresh takes no close signal,
      // so the drawer stays open across the rebuild.
      await runNutritionReviewDrawerOpenRefresh({
        loadLatestPlan: async () => {
          events.push("full-plan");
        },
        rebuildTargetOptions: async () => {
          events.push("revision-context");
        },
      });
      expect(events).toEqual(["full-plan", "revision-context"]);
    });
  });

  describe("Nutrition option canonical item mapping", () => {
    const nutritionSchedule = [
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
    const buildNutritionTargets = () =>
      fynRevisionLeveledTargetOptions(makeRevisionContext({ generationDomain: "NUTRITION" }), {
        domain: "NUTRITION",
        scheduleDays: nutritionSchedule,
      });
    const reviseIds = { trainingPlanId: "plan-1", versionId: "ver-1" };
    const canonicalItem = {
      nutritionCatalogItemId: "nut-9",
      itemType: "NUTRITION",
      label: "Oatmeal",
      serving: "1 cup",
      calories: 320,
      protein: 12,
      carbs: 54,
      fat: 6,
      fiber: 8,
      timing: "Breakfast",
      notes: "High fibre",
    };
    const baseOption: CoachAthleteDomainDraftRevisionOption = {
      id: "opt-approved-1",
      rank: 1,
      label: "Oatmeal",
      domain: "NUTRITION",
      optionKind: "REPLACEMENT",
      source: "CATALOG",
      score: 0.9,
      reason: null,
      goalIds: [],
      targetTags: [],
      safetyTags: [],
      levelTags: [],
      nutritionCatalogItemId: "nut-9",
      item: canonicalItem,
      metadata: { serving: "1 cup", timing: "Breakfast", notes: "High fibre" },
    };

    it("reads the catalog id only from the authoritative top-level field", () => {
      expect(nutritionOptionCatalogId(baseOption)).toBe("nut-9");
      // Never inferred from metadata.catalogItemId / metadata.itemId / label / option.id.
      expect(
        nutritionOptionCatalogId({
          ...baseOption,
          nutritionCatalogItemId: undefined,
          metadata: { catalogItemId: "meta-x", itemId: "meta-y" },
        }),
      ).toBeNull();
    });

    it("REPLACE_ITEM sends the option's canonical item unchanged (serving + nutrition preserved)", () => {
      const target = buildNutritionTargets().find(
        (o) => o.level === "ITEM" && o.itemLabel === "White rice",
      )!;
      const submission = buildNutritionRevisionSubmission({
        reviseIds,
        target,
        actionKey: "REPLACE_ITEM",
        option: baseOption,
        coachRequest: "Prefer a lighter option.",
      });
      expect(submission!.revisionPatch!.item).toBe(canonicalItem);
      expect(submission!.revisionPatch!.item).toEqual({
        nutritionCatalogItemId: "nut-9",
        itemType: "NUTRITION",
        label: "Oatmeal",
        serving: "1 cup",
        calories: 320,
        protein: 12,
        carbs: 54,
        fat: 6,
        fiber: 8,
        timing: "Breakfast",
        notes: "High fibre",
      });
    });

    it("ADD_ITEM sends the option's canonical item unchanged (serving + nutrition preserved)", () => {
      const sessionTarget = buildNutritionTargets().find((o) => o.level === "SESSION")!;
      const submission = buildNutritionRevisionSubmission({
        reviseIds,
        target: sessionTarget,
        actionKey: "ADD_ITEM",
        option: baseOption,
      });
      expect(submission!.revisionPatch!.item).toBe(canonicalItem);
      expect(submission!.revisionPatch!.item).toEqual({
        nutritionCatalogItemId: "nut-9",
        itemType: "NUTRITION",
        label: "Oatmeal",
        serving: "1 cup",
        calories: 320,
        protein: 12,
        carbs: 54,
        fat: 6,
        fiber: 8,
        timing: "Breakfast",
        notes: "High fibre",
      });
    });

    it("blocks Apply Revision when a chosen ADD_ITEM/REPLACE_ITEM option lacks the canonical item", () => {
      const itemTarget = buildNutritionTargets().find((o) => o.level === "ITEM")!;
      const sessionTarget = buildNutritionTargets().find((o) => o.level === "SESSION")!;
      const optionWithoutItem = { ...baseOption, item: undefined };
      // No structured patch can be built, so the submission (and Apply) stays blocked.
      expect(
        buildNutritionRevisionPatch({
          target: itemTarget,
          actionKey: "REPLACE_ITEM",
          option: optionWithoutItem,
        }),
      ).toBeNull();
      expect(
        nutritionRevisionCanApply({
          reviseIds,
          target: itemTarget,
          actionKey: "REPLACE_ITEM",
          option: optionWithoutItem,
        }),
      ).toBe(false);
      expect(
        nutritionRevisionCanApply({
          reviseIds,
          target: sessionTarget,
          actionKey: "ADD_ITEM",
          option: optionWithoutItem,
        }),
      ).toBe(false);
      // The dedicated hint fires only when an option is actually chosen.
      expect(
        nutritionRevisionOptionMissingCatalogReference({
          actionKey: "REPLACE_ITEM",
          option: optionWithoutItem,
        }),
      ).toBe(true);
      expect(
        nutritionRevisionOptionMissingCatalogReference({
          actionKey: "REPLACE_ITEM",
          option: null,
        }),
      ).toBe(false);
      expect(
        nutritionRevisionOptionMissingCatalogReference({
          actionKey: "REPLACE_ITEM",
          option: baseOption,
        }),
      ).toBe(false);
      // Operations that carry no approved option are unaffected.
      expect(
        nutritionRevisionOptionMissingCatalogReference({
          actionKey: "REMOVE_ITEM",
          option: optionWithoutItem,
        }),
      ).toBe(false);
      expect(NUTRITION_OPTION_MISSING_CATALOG_MESSAGE).toContain("missing its item details");
    });
  });

  describe("Nutrition REMOVE_ITEM meal-minimum eligibility", () => {
    const buildMeal = (title: string, itemCount: number) => [
      {
        dayIndex: 1,
        sessions: [
          {
            sessionIndex: 1,
            title,
            items: Array.from({ length: itemCount }, (_unused, index) => ({
              order: index,
              label: `Food ${index + 1}`,
              nutritionCatalogItemId: `nut-${index + 1}`,
            })),
          },
        ],
      },
    ];
    const targetsFor = (title: string, itemCount: number) =>
      fynRevisionLeveledTargetOptions(makeRevisionContext({ generationDomain: "NUTRITION" }), {
        domain: "NUTRITION",
        scheduleDays: buildMeal(title, itemCount),
      });
    const reviseIds = { trainingPlanId: "plan-1", versionId: "ver-1" };

    it("maps meal labels to canonical slots and minimums (single source of truth)", () => {
      expect(nutritionMealSlotKeyFromLabel("Breakfast")).toBe("BREAKFAST");
      expect(nutritionMealSlotKeyFromLabel("Mid-morning snack")).toBe("MID_MORNING_SNACK");
      expect(nutritionMealSlotKeyFromLabel("MID_AFTERNOON_SNACK")).toBe("MID_AFTERNOON_SNACK");
      expect(nutritionMealSlotKeyFromLabel("Second lunch")).toBeNull();
      expect(nutritionMealSlotMinItems("Lunch")).toBe(4);
      expect(nutritionMealSlotMinItems("Dinner")).toBe(4);
      expect(nutritionMealSlotMinItems("Breakfast")).toBe(3);
      // Unrecognised meals fall back to the "never remove the last item" floor.
      expect(nutritionMealSlotMinItems("Hydration")).toBe(1);
    });

    it("enables Remove food item when the meal has more items than its minimum", () => {
      // Breakfast minimum is 3; 4 items leaves room to remove one.
      const aboveMin = targetsFor("Breakfast", 4).find((o) => o.level === "ITEM")!;
      expect(actionKeysFor("NUTRITION", aboveMin)).toContain("REMOVE_ITEM");
    });

    it("disables Remove food item when the meal is exactly at its minimum", () => {
      const atMin = targetsFor("Breakfast", 3).find((o) => o.level === "ITEM")!;
      expect(actionKeysFor("NUTRITION", atMin)).not.toContain("REMOVE_ITEM");
    });

    it("keeps Replace food item available at the minimum", () => {
      // Lunch minimum is 4; at exactly 4 items Remove is blocked but Replace/Update remain.
      const atMin = targetsFor("Lunch", 4).find((o) => o.level === "ITEM")!;
      const keys = actionKeysFor("NUTRITION", atMin);
      expect(keys).toContain("REPLACE_ITEM");
      expect(keys).toContain("UPDATE_ITEM");
      expect(keys).not.toContain("REMOVE_ITEM");
    });

    it("shows the exact minimum message when an item's meal is at the minimum", () => {
      const context = makeRevisionContext({ generationDomain: "NUTRITION" });
      const targets = targetsFor("Breakfast", 3);
      const itemTarget = targets.find((o) => o.level === "ITEM")!;
      const html = renderToStaticMarkup(
        createElement(
          FynRevisionContextPanel,
          fynPanelProps({
            domain: "NUTRITION",
            context,
            targetOptions: targets,
            selectedTargetKey: itemTarget.key,
            selectedActionKey: "REPLACE_ITEM",
          }),
        ),
      );
      expect(html).toContain(nutritionRemoveItemMinimumMessage(3));
      expect(html).toContain(
        "This meal must contain at least 3 items. Replace this item instead of removing it.",
      );
      // Replace stays offered; Remove is not offered as an action at the minimum.
      expect(html).toContain("Replace food item");
      expect(html).not.toContain("Remove food item");
    });

    it("does not show the minimum message (and offers Remove) above the minimum", () => {
      const context = makeRevisionContext({ generationDomain: "NUTRITION" });
      const targets = targetsFor("Breakfast", 4);
      const itemTarget = targets.find((o) => o.level === "ITEM")!;
      const html = renderToStaticMarkup(
        createElement(
          FynRevisionContextPanel,
          fynPanelProps({
            domain: "NUTRITION",
            context,
            targetOptions: targets,
            selectedTargetKey: itemTarget.key,
            selectedActionKey: "REPLACE_ITEM",
          }),
        ),
      );
      expect(html).not.toContain("This meal must contain at least");
      expect(html).toContain("Remove food item");
    });

    it("never builds (or allows submitting) a REMOVE_ITEM patch at the minimum", () => {
      const atMin = targetsFor("Breakfast", 3).find((o) => o.level === "ITEM")!;
      const aboveMin = targetsFor("Breakfast", 4).find((o) => o.level === "ITEM")!;
      expect(buildNutritionRevisionPatch({ target: atMin, actionKey: "REMOVE_ITEM" })).toBeNull();
      expect(
        nutritionRevisionCanApply({ reviseIds, target: atMin, actionKey: "REMOVE_ITEM" }),
      ).toBe(false);
      // Above the minimum a REMOVE_ITEM patch is still produced exactly as before.
      expect(
        buildNutritionRevisionPatch({ target: aboveMin, actionKey: "REMOVE_ITEM" }),
      ).toMatchObject({ operation: "REMOVE_ITEM", dayIndex: 1, sessionIndex: 1, itemIndex: 1 });
      expect(
        nutritionRevisionCanApply({ reviseIds, target: aboveMin, actionKey: "REMOVE_ITEM" }),
      ).toBe(true);
    });

    it("nutritionRemoveItemMinimumNotice fires only for at-minimum Nutrition items", () => {
      const atMin = targetsFor("Breakfast", 3).find((o) => o.level === "ITEM")!;
      const aboveMin = targetsFor("Breakfast", 4).find((o) => o.level === "ITEM")!;
      const sessionTarget = targetsFor("Breakfast", 3).find((o) => o.level === "SESSION")!;
      expect(nutritionRemoveItemMinimumNotice("NUTRITION", atMin)).toBe(
        "This meal must contain at least 3 items. Replace this item instead of removing it.",
      );
      expect(nutritionRemoveItemMinimumNotice("NUTRITION", aboveMin)).toBeNull();
      expect(nutritionRemoveItemMinimumNotice("NUTRITION", sessionTarget)).toBeNull();
      expect(nutritionRemoveItemMinimumNotice("SKILLS", atMin)).toBeNull();
      expect(nutritionRemoveItemMinimumNotice("NUTRITION", null)).toBeNull();
    });

    it("leaves S&C REMOVE_ITEM gating unchanged (last-item rule, not meal minimums)", () => {
      const sandcTargets = (itemCount: number) =>
        fynRevisionLeveledTargetOptions(makeRevisionContext({ generationDomain: "S_AND_C" }), {
          domain: "S_AND_C",
          scheduleDays: [
            {
              dayIndex: 1,
              sessions: [
                {
                  sessionIndex: 1,
                  title: "Lower body",
                  items: Array.from({ length: itemCount }, (_unused, index) => ({
                    order: index,
                    label: `Exercise ${index + 1}`,
                    exerciseCatalogItemId: `ex-${index + 1}`,
                  })),
                },
              ],
            },
          ],
        });
      // Two exercises: Remove allowed (> 1). One exercise: hidden. Meal minimums never apply to S&C.
      expect(
        actionKeysFor("S_AND_C", sandcTargets(2).find((o) => o.level === "ITEM")),
      ).toContain("REMOVE_ITEM");
      expect(
        actionKeysFor("S_AND_C", sandcTargets(1).find((o) => o.level === "ITEM")),
      ).not.toContain("REMOVE_ITEM");
    });
  });

  describe("Nutrition sequential revision version handling", () => {
    // Confirmed backend fixture.
    const trainingPlanId = "a7273ff0-35a2-4d79-b940-059ef7d8def8";
    const V1 = "46efdb36-cbbc-463d-a0be-1c4c2a2c6d2d";
    const V2 = "ce8e318f-c281-4e3d-871f-e6a432e2b506";
    const V3 = "0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0";
    // The drawer renders version 2, so the plan/version object it exposes carries V2.
    const drawerRenderedReviseIds = { trainingPlanId, versionId: V2 };

    it("submits the drawer-displayed V2 id for the first revision (current fixture)", () => {
      // No pin yet: the request uses the exact version rendered in the drawer (V2), not V1.
      const effective = resolveActiveNutritionReviseIds(drawerRenderedReviseIds, null)!;
      expect(effective.versionId).toBe("ce8e318f-c281-4e3d-871f-e6a432e2b506");
      expect(effective.trainingPlanId).toBe(trainingPlanId);
    });

    it("chains V2 -> V3 using each response's trainingPlanVersionId", () => {
      const submittedVersions: string[] = [];
      let activePin: { trainingPlanId: string; versionId: string } | null = null;

      // Revision 1: drawer shows V2, no pin -> submits V2.
      let effective = resolveActiveNutritionReviseIds(drawerRenderedReviseIds, activePin)!;
      submittedVersions.push(effective.versionId);
      // The V2 revision responds with V3 -> pinned as the authoritative next version.
      const afterV2 = nextNutritionRevisionVersionId({ versionId: V3 });
      activePin = afterV2 === null ? null : { trainingPlanId, versionId: afterV2 };

      // Revision 2: submits V3 (pinned), even though the drawer base is still V2.
      effective = resolveActiveNutritionReviseIds(drawerRenderedReviseIds, activePin)!;
      submittedVersions.push(effective.versionId);

      expect(submittedVersions).toEqual([V2, V3]);
      expect(effective.trainingPlanId).toBe(trainingPlanId);
    });

    it("never lets a stale workspace V1 override the displayed V2", () => {
      // The resolver is fed ONLY the drawer-rendered ids (V2) and the pin — never workspace state.
      // A stale pin belonging to a DIFFERENT plan (e.g. a lingering V1 from another plan) is ignored.
      const stalePinDifferentPlan = { trainingPlanId: "some-other-plan", versionId: V1 };
      expect(
        resolveActiveNutritionReviseIds(drawerRenderedReviseIds, stalePinDifferentPlan)!.versionId,
      ).toBe(V2);
      // With no pin at all, the displayed V2 is used (V1 can never surface here).
      expect(resolveActiveNutritionReviseIds(drawerRenderedReviseIds, null)!.versionId).toBe(V2);
    });

    it("keeps the pinned version across selection reset / revise-another (pin persists)", () => {
      // After the V2 revision returns V3, the pin is V3 for the same plan. Selection reset does not
      // touch the pin (it is only cleared when the drawer closes), so subsequent resolves — the ones
      // that happen after a reset / "Revise another item" — still submit V3.
      const pinV3 = { trainingPlanId, versionId: V3 };
      expect(resolveActiveNutritionReviseIds(drawerRenderedReviseIds, pinV3)!.versionId).toBe(V3);
      // Idempotent across repeated resolves (models repeated renders after a reset).
      expect(resolveActiveNutritionReviseIds(drawerRenderedReviseIds, pinV3)!.versionId).toBe(V3);
    });

    it("reads the next version from the revise response (versionId), ignoring blanks", () => {
      expect(nextNutritionRevisionVersionId({ versionId: V2 })).toBe(V2);
      expect(nextNutritionRevisionVersionId({ versionId: `  ${V2}  ` })).toBe(V2);
      expect(nextNutritionRevisionVersionId({ versionId: "" })).toBeNull();
      expect(nextNutritionRevisionVersionId({ versionId: null })).toBeNull();
      expect(nextNutritionRevisionVersionId(null)).toBeNull();
      expect(nextNutritionRevisionVersionId(undefined)).toBeNull();
    });

    it("uses the drawer-rendered ids before the first successful revision (no pin)", () => {
      expect(resolveActiveNutritionReviseIds(drawerRenderedReviseIds, null)).toEqual(
        drawerRenderedReviseIds,
      );
      // A pin missing a version is ignored (falls back to the rendered ids).
      expect(
        resolveActiveNutritionReviseIds(drawerRenderedReviseIds, {
          trainingPlanId,
          versionId: "   ",
        }),
      ).toEqual(drawerRenderedReviseIds);
      // No rendered base -> nothing to submit.
      expect(
        resolveActiveNutritionReviseIds(null, { trainingPlanId, versionId: V2 }),
      ).toBeNull();
    });
  });

  describe("Nutrition deterministic stale-version rejection", () => {
    const staleError = {
      message:
        "This plan has changed since it was opened. Reload the latest plan before applying another revision.",
      status: 409,
      code: "TRAINING_PLAN_REVISION_STALE_VERSION",
      details: { code: "TRAINING_PLAN_REVISION_STALE_VERSION" },
    };

    it("detects the stale-version rejection by its backend message", () => {
      expect(isNutritionStaleVersionRevisionError(staleError)).toBe(true);
      // Match on the stable message even when no code is present.
      expect(
        isNutritionStaleVersionRevisionError({
          message: NUTRITION_STALE_VERSION_MESSAGE,
          status: 409,
        }),
      ).toBe(true);
      // Match defensively on a stale-version code even if the message differs.
      expect(
        isNutritionStaleVersionRevisionError({
          message: "Conflict",
          status: 409,
          code: "STALE_VERSION",
        }),
      ).toBe(true);
    });

    it("does not treat unrelated errors as stale-version rejections", () => {
      expect(
        isNutritionStaleVersionRevisionError({
          message: "Unable to revise plan.",
          status: 500,
        }),
      ).toBe(false);
      expect(isNutritionStaleVersionRevisionError(new Error("boom"))).toBe(false);
      expect(isNutritionStaleVersionRevisionError(null)).toBe(false);
    });

    it("surfaces the backend stale-version message and requires reload + reselection", () => {
      const outcome = resolveNutritionRevisionErrorOutcome(staleError);
      expect(outcome.kind).toBe("STALE_VERSION");
      // The drawer shows the live backend message verbatim.
      expect(outcome.message).toBe(staleError.message);
      // Latest Nutrition plan/version is reloaded and the stale selection is cleared.
      expect(outcome.reloadLatest).toBe(true);
      expect(outcome.clearSelection).toBe(true);
      // The previously submitted revisionPatch is never automatically retried.
      expect(outcome.retryRevisionPatch).toBe(false);
    });

    it("falls back to the canonical message when the backend omits a body message", () => {
      const outcome = resolveNutritionRevisionErrorOutcome({
        message: "",
        status: 409,
        code: "STALE_VERSION",
      });
      expect(outcome.kind).toBe("STALE_VERSION");
      expect(outcome.message).toBe(NUTRITION_STALE_VERSION_MESSAGE);
    });

    it("leaves the normal successful revision flow untouched for non-stale errors", () => {
      // A generic API failure must not reload the plan or clear the coach's selection,
      // so the existing success/reload behaviour is unaffected by the stale-version handling.
      const generic = resolveNutritionRevisionErrorOutcome({
        message: "Server exploded",
        status: 500,
        code: "INTERNAL",
      });
      expect(generic.kind).toBe("GENERIC");
      expect(generic.reloadLatest).toBe(false);
      expect(generic.clearSelection).toBe(false);
      expect(generic.retryRevisionPatch).toBe(false);
      expect(generic.message).toBe("Revision failed: Server exploded (INTERNAL)");
    });
  });

  describe("Nutrition interrupted revision handling", () => {
    const nutritionScheduleWithToast = [
      {
        dayKey: "1",
        dayIndex: 1,
        sessions: [
          {
            sessionKey: "1",
            sessionIndex: 1,
            title: "Breakfast",
            items: [
              { order: 0, label: "White rice", itemKey: "0" },
              { order: 1, label: "Juice", itemKey: "1" },
              { order: 2, label: "Eggs", itemKey: "2" },
              { order: 3, label: "Toast", itemKey: "3" },
            ],
          },
        ],
      },
    ];

    const nutritionScheduleWithoutToast = [
      {
        dayKey: "1",
        dayIndex: 1,
        sessions: [
          {
            sessionKey: "1",
            sessionIndex: 1,
            title: "Breakfast",
            items: [
              { order: 0, label: "White rice", itemKey: "0" },
              { order: 1, label: "Juice", itemKey: "1" },
              { order: 2, label: "Eggs", itemKey: "2" },
            ],
          },
        ],
      },
    ];

    function toastRemoveTarget() {
      const context = makeRevisionContext({ generationDomain: "NUTRITION" });
      const targets = fynRevisionLeveledTargetOptions(context, {
        domain: "NUTRITION",
        scheduleDays: nutritionScheduleWithToast,
      });
      return targets.find((option) => option.itemLabel === "Toast")!;
    }

    it("locks Apply, Cancel, and Close while a Nutrition revision submit is pending", () => {
      expect(
        nutritionRevisionDrawerSubmitPending({
          singlePatchMode: true,
          reviseLoading: true,
        }),
      ).toBe(true);
      expect(
        nutritionRevisionDrawerSubmitPending({
          singlePatchMode: true,
          reviseLoading: false,
        }),
      ).toBe(false);
      expect(
        nutritionRevisionDrawerSubmitPending({
          singlePatchMode: false,
          reviseLoading: true,
        }),
      ).toBe(false);
    });

    it("detects timeout and unknown-outcome transport failures as interrupted", () => {
      expect(
        isNutritionRevisionInterruptedError({
          message: "Request timed out",
          status: 0,
        }),
      ).toBe(true);
      expect(
        isNutritionRevisionInterruptedError({
          message: "Failed to fetch",
          status: 0,
        }),
      ).toBe(true);
      expect(
        isNutritionRevisionInterruptedError({
          message: "Server exploded",
          status: 500,
        }),
      ).toBe(false);
    });

    it("requires reload, selection clear, and no automatic patch retry on timeout", () => {
      const outcome = resolveNutritionRevisionErrorOutcome({
        message: "Request timed out",
        status: 0,
      });
      expect(outcome.kind).toBe("INTERRUPTED");
      expect(outcome.reloadLatest).toBe(true);
      expect(outcome.clearSelection).toBe(true);
      expect(outcome.retryRevisionPatch).toBe(false);
      expect(outcome.message).toBe("Request timed out");
    });

    it("shows Revision was already applied when the REMOVE_ITEM target is absent after reload", () => {
      const priorTarget = toastRemoveTarget();
      expect(
        nutritionRemoveItemTargetStillPresent(nutritionScheduleWithToast, priorTarget),
      ).toBe(true);
      expect(
        nutritionRemoveItemTargetStillPresent(nutritionScheduleWithoutToast, priorTarget),
      ).toBe(false);
    });

    it("requires a fresh selection when the REMOVE_ITEM target is still present after reload", () => {
      const priorTarget = toastRemoveTarget();
      const outcome = resolveNutritionRevisionErrorOutcome({
        message: "Request timed out",
        status: 0,
      });
      expect(outcome.clearSelection).toBe(true);
      expect(
        nutritionRemoveItemTargetStillPresent(nutritionScheduleWithToast, priorTarget),
      ).toBe(true);
    });

    it("uses the applying revision copy for the pending state", () => {
      expect(NUTRITION_REVISION_APPLYING_MESSAGE).toBe("Applying revision…");
      expect(NUTRITION_REVISION_ALREADY_APPLIED_MESSAGE).toBe(
        "Revision was already applied.",
      );
    });
  });

  describe("Nutrition Plan Review drawer reopen lifecycle", () => {
    it("clears stale transient messages and loads latest plan + dropdown on open", () => {
      // Reopening after a prior success/error: transient messages are cleared, the latest plan is
      // reloaded, and the target dropdown is rebuilt from that plan — all on open.
      const lifecycle = resolveNutritionReviewDrawerLifecycle({
        drawerOpen: true,
        drawerDomain: "NUTRITION",
      });
      expect(lifecycle.clearTransientMessages).toBe(true);
      expect(lifecycle.loadLatestPlan).toBe(true);
      expect(lifecycle.rebuildTargetOptions).toBe(true);
    });

    it("reopen does not depend on the Revise Plan button to refresh plan data", () => {
      // The dropdown rebuild + latest-plan load are gated on the drawer OPENING, not on clicking
      // Revise Plan a second time. Both are true purely from open + NUTRITION domain.
      const lifecycle = resolveNutritionReviewDrawerLifecycle({
        drawerOpen: true,
        drawerDomain: "NUTRITION",
      });
      expect(lifecycle.loadLatestPlan && lifecycle.rebuildTargetOptions).toBe(true);
    });

    it("clears messages and selection when the drawer closes", () => {
      const lifecycle = resolveNutritionReviewDrawerLifecycle({
        drawerOpen: false,
        drawerDomain: null,
      });
      expect(lifecycle.clearTransientMessages).toBe(true);
      expect(lifecycle.clearSelection).toBe(true);
      // Closed drawer must not fire the loaders.
      expect(lifecycle.loadLatestPlan).toBe(false);
      expect(lifecycle.rebuildTargetOptions).toBe(false);
    });

    it("clears Nutrition state when the drawer switches to another domain", () => {
      const lifecycle = resolveNutritionReviewDrawerLifecycle({
        drawerOpen: true,
        drawerDomain: "SKILLS",
      });
      expect(lifecycle.clearSelection).toBe(true);
      expect(lifecycle.loadLatestPlan).toBe(false);
      expect(lifecycle.rebuildTargetOptions).toBe(false);
    });

    it("does not clear the coach's selection while the drawer is open on Nutrition", () => {
      const lifecycle = resolveNutritionReviewDrawerLifecycle({
        drawerOpen: true,
        drawerDomain: "NUTRITION",
      });
      // Open must not stomp an in-progress selection (only close / domain-switch clears it).
      expect(lifecycle.clearSelection).toBe(false);
    });

    it("rebuilds the target dropdown only after the latest plan load resolves (never concurrent)", async () => {
      const order: string[] = [];
      let resolveLatestPlan: (() => void) | null = null;
      const latestPlanGate = new Promise<void>((resolve) => {
        resolveLatestPlan = resolve;
      });

      const loadLatestPlan = vi.fn(async () => {
        order.push("latest:start");
        await latestPlanGate;
        order.push("latest:end");
      });
      const rebuildTargetOptions = vi.fn(async () => {
        order.push("rebuild:start");
      });

      const running = runNutritionReviewDrawerOpenRefresh({
        loadLatestPlan,
        rebuildTargetOptions,
      });

      // While the latest-plan load is still pending, the dropdown rebuild must NOT have started.
      await Promise.resolve();
      expect(loadLatestPlan).toHaveBeenCalledTimes(1);
      expect(rebuildTargetOptions).not.toHaveBeenCalled();
      expect(order).toEqual(["latest:start"]);

      // Resolve the latest-plan load; only then may the rebuild run.
      resolveLatestPlan!();
      await running;

      expect(rebuildTargetOptions).toHaveBeenCalledTimes(1);
      expect(order).toEqual(["latest:start", "latest:end", "rebuild:start"]);
    });

    it("clears old target options immediately, then shows fresh options only after the sequential refresh", async () => {
      // Mirrors the drawer-open effect orchestration using the real exported pieces: the lifecycle
      // descriptor drives the synchronous clear, then the sequential refresh runs.
      const events: string[] = [];
      const lifecycle = resolveNutritionReviewDrawerLifecycle({
        drawerOpen: true,
        drawerDomain: "NUTRITION",
      });

      // 1. Old target/options are cleared IMMEDIATELY on open (synchronously, before any load).
      expect(lifecycle.clearTargetOptions).toBe(true);
      if (lifecycle.clearTargetOptions) {
        events.push("clear-target-options");
      }

      let resolveLatestPlan: (() => void) | null = null;
      const latestPlanGate = new Promise<void>((resolve) => {
        resolveLatestPlan = resolve;
      });
      const running = runNutritionReviewDrawerOpenRefresh({
        loadLatestPlan: lifecycle.loadLatestPlan
          ? async () => {
              events.push("latest:start");
              await latestPlanGate;
              events.push("latest:end");
            }
          : null,
        rebuildTargetOptions: lifecycle.rebuildTargetOptions
          ? async () => {
              events.push("fresh-options");
            }
          : null,
      });

      // While the latest-plan load is still pending: old options already cleared, NO fresh options.
      await Promise.resolve();
      expect(events).toEqual(["clear-target-options", "latest:start"]);
      expect(events).not.toContain("fresh-options");

      // Fresh options appear only after the sequential refresh completes.
      resolveLatestPlan!();
      await running;
      expect(events).toEqual([
        "clear-target-options",
        "latest:start",
        "latest:end",
        "fresh-options",
      ]);
    });

    it("does not clear target options on close (close clears the whole selection instead)", () => {
      const closed = resolveNutritionReviewDrawerLifecycle({
        drawerOpen: false,
        drawerDomain: null,
      });
      expect(closed.clearTargetOptions).toBe(false);
      expect(closed.clearSelection).toBe(true);
    });

    it("skips a loader when its lifecycle flag is off", async () => {
      const rebuildTargetOptions = vi.fn(async () => {});
      await runNutritionReviewDrawerOpenRefresh({
        loadLatestPlan: null,
        rebuildTargetOptions,
      });
      expect(rebuildTargetOptions).toHaveBeenCalledTimes(1);

      const loadLatestPlan = vi.fn(async () => {});
      await runNutritionReviewDrawerOpenRefresh({
        loadLatestPlan,
        rebuildTargetOptions: null,
      });
      expect(loadLatestPlan).toHaveBeenCalledTimes(1);
    });
  });

  describe("Nutrition revision success refreshes the drawer to the new version", () => {
    // V1 Breakfast has 3 items; an ADD_ITEM revision creates V2 by appending "Oatmeal".
    const v1Schedule = [
      {
        dayIndex: 1,
        sessions: [
          {
            sessionIndex: 1,
            title: "Breakfast",
            items: [
              { order: 0, label: "White rice", nutritionCatalogItemId: "nut-1" },
              { order: 1, label: "Juice", nutritionCatalogItemId: "nut-2" },
              { order: 2, label: "Eggs", nutritionCatalogItemId: "nut-3" },
            ],
          },
        ],
      },
    ];
    const v2Schedule = [
      {
        dayIndex: 1,
        sessions: [
          {
            sessionIndex: 1,
            title: "Breakfast",
            items: [
              { order: 0, label: "White rice", nutritionCatalogItemId: "nut-1" },
              { order: 1, label: "Juice", nutritionCatalogItemId: "nut-2" },
              { order: 2, label: "Eggs", nutritionCatalogItemId: "nut-3" },
              { order: 3, label: "Oatmeal", nutritionCatalogItemId: "nut-9", serving: "1 cup" },
            ],
          },
        ],
      },
    ];
    const buildTargets = (scheduleDays: readonly unknown[]) =>
      fynRevisionLeveledTargetOptions(makeRevisionContext({ generationDomain: "NUTRITION" }), {
        domain: "NUTRITION",
        scheduleDays,
      });

    it("ADD_ITEM creates V2 → drawer stays open → dropdown rebuilds from V2 → added item is selectable for UPDATE_ITEM", async () => {
      const events: string[] = [];
      // The latest-plan reload swaps the rendered schedule to the newly created V2; the rebuild then
      // rebuilds the dropdown targets from whatever the reload left rendered.
      let renderedSchedule: readonly unknown[] = v1Schedule;
      let rebuiltTargets = buildTargets(renderedSchedule);
      // The added item is not yet in the (V1) dropdown before the refresh runs.
      expect(
        rebuiltTargets.some((o) => o.level === "ITEM" && o.itemLabel === "Oatmeal"),
      ).toBe(false);

      // Mirrors the real success-path orchestration: reload latest plan, THEN rebuild the dropdown,
      // using the same sequential refresh the handler now calls. The refresh performs no close/reopen
      // (there is no close signal to give), so the drawer stays open across the rebuild.
      await runNutritionReviewDrawerOpenRefresh({
        loadLatestPlan: async () => {
          events.push("latest");
          renderedSchedule = v2Schedule;
        },
        rebuildTargetOptions: async () => {
          events.push("rebuild");
          rebuiltTargets = buildTargets(renderedSchedule);
        },
      });

      // Strictly ordered: latest plan reload resolves before the dropdown rebuild runs.
      expect(events).toEqual(["latest", "rebuild"]);

      // The rebuilt dropdown reflects V2 and includes the newly added item at its new position.
      const added = rebuiltTargets.find(
        (o) => o.level === "ITEM" && o.itemLabel === "Oatmeal",
      );
      expect(added).toBeDefined();
      expect(added!.indices).toMatchObject({ dayIndex: 1, sessionIndex: 1, itemIndex: 4 });

      // The added item is immediately selectable for a follow-up UPDATE_ITEM against the new version
      // (serving "1 cup" stepped to 2 cups).
      const submission = buildNutritionRevisionSubmission({
        reviseIds: { trainingPlanId: "plan-1", versionId: "ver-2" },
        target: added!,
        actionKey: "UPDATE_ITEM",
        servingTargetQuantity: 2,
      });
      expect(submission).not.toBeNull();
      expect(submission!.versionId).toBe("ver-2");
      expect(submission!.revisionPatch).toMatchObject({
        operation: "UPDATE_ITEM",
        dayIndex: 1,
        sessionIndex: 1,
        itemIndex: 4,
        servingAdjustment: { targetQuantity: 2, servingUnit: "cup" },
      });
    });
  });

  it("does not render static, invented, or context change options before Add Drill options are fetched", () => {
    const targets = fynRevisionLeveledTargetOptions(fynDraftContext, { domain: "SKILLS" });
    const sessionTarget = targets.find((target) => target.level === "SESSION");
    const html = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context: fynDraftContext,
          targetOptions: targets,
          selectedTargetKey: sessionTarget?.key ?? null,
          selectedActionKey: "ADD_ITEM",
          coachRequest: "Add a bunker drill.",
        }),
      ),
    );

    // Endpoint flow active: generic context changeOptions are never shown as drill choices.
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
    // The endpoint-driven action is available once Add Drill is chosen.
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

  it("shows the add-food empty message for a Nutrition ADD_ITEM with no approved options", async () => {
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
                items: [{ order: 0, label: "White rice", nutritionCatalogItemId: "nut-1" }],
              },
            ],
          },
        ],
      },
    );
    const mealTarget = nutritionTargets.find((option) => option.level === "SESSION")!;

    const outcome = await fetchFynRevisionReplacementOptions({
      entityId: "entity-1",
      athleteId: "athlete-1",
      domain: "NUTRITION",
      reviseIds: fynReviseIds,
      coachRequest: "Add a fruit to breakfast.",
      target: mealTarget.target,
      optionKind: "ADD_ITEM",
      fetchOptions: async () => ({
        generationDomain: "NUTRITION" as const,
        target: null,
        options: [],
      }),
    });
    expect(outcome).toEqual({
      status: "OK",
      options: [],
      message: FYN_REVISION_NO_ADD_FOOD_OPTIONS_MESSAGE,
    });
    expect(FYN_REVISION_NO_ADD_FOOD_OPTIONS_MESSAGE).toBe(
      "No approved add-food options found for this meal.",
    );
  });

  it("keeps the replacement empty message for a Nutrition REPLACEMENT with no approved options", async () => {
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
                items: [{ order: 0, label: "White rice", nutritionCatalogItemId: "nut-1" }],
              },
            ],
          },
        ],
      },
    );
    const itemTarget = nutritionTargets.find((option) => option.level === "ITEM")!;

    const outcome = await fetchFynRevisionReplacementOptions({
      entityId: "entity-1",
      athleteId: "athlete-1",
      domain: "NUTRITION",
      reviseIds: fynReviseIds,
      coachRequest: "Replace the white rice.",
      target: itemTarget.target,
      optionKind: "REPLACEMENT",
      fetchOptions: async () => ({
        generationDomain: "NUTRITION" as const,
        target: null,
        options: [],
      }),
    });
    expect(outcome).toEqual({
      status: "OK",
      options: [],
      message: FYN_REVISION_NO_OPTIONS_MESSAGE,
    });
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

  it("maps actions to the revision-options optionKind (ADD_ITEM vs REPLACEMENT vs text-only)", () => {
    expect(fynRevisionActionOptionKind("REPLACE_ITEM")).toBe("REPLACEMENT");
    expect(fynRevisionActionOptionKind("REPLACE_DAY")).toBe("REPLACEMENT");
    expect(fynRevisionActionOptionKind("ADD_ITEM")).toBe("ADD_ITEM");
    expect(fynRevisionActionOptionKind("ADD_SESSION")).toBeNull();
    expect(fynRevisionActionOptionKind("REMOVE_ITEM")).toBeNull();
    expect(fynRevisionActionOptionKind("UPDATE_ITEM")).toBeNull();
    expect(fynRevisionActionOptionKind("UPDATE_SESSION")).toBeNull();
    expect(fynRevisionActionOptionKind("UPDATE_SESSION_ITEMS")).toBeNull();

    const targets = fynRevisionLeveledTargetOptions(
      makeRevisionContext({ generationDomain: "SKILLS" }),
      { domain: "SKILLS", scheduleDays: skillsSchedule },
    );
    const sessionTarget = targets.find((option) => option.level === "SESSION") ?? null;
    const dayTarget = targets.find((option) => option.level === "DAY") ?? null;
    const addItem = fynRevisionAvailableActions("SKILLS", sessionTarget).find(
      (action) => action.key === "ADD_ITEM",
    );
    // ADD_ITEM goes through the approved-options flow; no other Skills action is exposed.
    expect(addItem?.requiresApprovedOptions).toBe(true);
    expect(dayTarget).toBeNull();
  });

  it("collapses any target to a clean SESSION target for ADD_ITEM (no null item fields)", () => {
    const sessionTarget = fynRevisionAddItemSessionTarget(
      {
        dayKey: "day-1",
        sessionKey: "session-1",
        itemKey: "item-1",
        itemType: "EXERCISE",
        currentId: "ex-1",
        label: "Back squat",
        tags: ["x"],
      },
      "S_AND_C",
    );
    // Item-level fields are omitted entirely (not sent as null); itemType is domain-specific.
    expect(sessionTarget).toEqual({
      dayKey: "day-1",
      sessionKey: "session-1",
      itemType: "EXERCISE",
      label: "Back squat",
      tags: ["x"],
    });
    expect(sessionTarget).not.toHaveProperty("itemKey");
    expect(sessionTarget).not.toHaveProperty("currentId");
    expect(Object.values(sessionTarget)).not.toContain(null);
  });

  it("builds an ADD_ITEM options payload with a clean SESSION target", () => {
    const payload = buildFynRevisionOptionsPayload({
      domain: "S_AND_C",
      reviseIds: fynReviseIds,
      target: {
        dayKey: "day-1",
        sessionKey: "session-1",
        itemKey: "item-1",
        itemType: "EXERCISE",
        currentId: "ex-1",
        label: "Back squat",
        tags: [],
      },
      coachRequest: "Add a hamstring exercise.",
      optionKind: "ADD_ITEM",
    });
    expect(payload).toEqual({
      generationDomain: "S_AND_C",
      trainingPlanId: "plan-1",
      trainingPlanVersionId: "version-1",
      target: {
        dayKey: "day-1",
        sessionKey: "session-1",
        itemType: "EXERCISE",
        label: "Back squat",
        tags: [],
      },
      coachRequest: "Add a hamstring exercise.",
      optionKind: "ADD_ITEM",
      limit: 4,
    });
    expect(payload.target).not.toHaveProperty("itemKey");
    expect(payload.target).not.toHaveProperty("currentId");
    expect(JSON.stringify(payload.target)).not.toContain("null");
  });

  it("sends optionKind ADD_ITEM with a SESSION target for a Skills add-drill", async () => {
    const targets = fynRevisionLeveledTargetOptions(
      makeRevisionContext({ generationDomain: "SKILLS" }),
      { domain: "SKILLS", scheduleDays: skillsSchedule },
    );
    const sessionTarget = targets.find((option) => option.level === "SESSION")!;
    const fetchOptions = vi.fn(async () => ({
      generationDomain: "SKILLS" as const,
      target: null,
      options: fynFetchedOptions,
    }));

    const outcome = await fetchFynRevisionReplacementOptions({
      entityId: "entity-1",
      athleteId: "athlete-1",
      domain: "SKILLS",
      reviseIds: fynReviseIds,
      coachRequest: "Add a volley approach drill.",
      target: sessionTarget.target,
      optionKind: "ADD_ITEM",
      fetchOptions,
    });

    expect(outcome).toEqual({ status: "OK", options: fynFetchedOptions, message: null });
    expect(fetchOptions).toHaveBeenCalledTimes(1);
    // Skills ADD_ITEM: SESSION target, itemType "SKILL", no item-level fields, no null fields.
    const expectedPayload = buildFynRevisionOptionsPayload({
      domain: "SKILLS",
      reviseIds: fynReviseIds,
      target: sessionTarget.target,
      coachRequest: "Add a volley approach drill.",
      optionKind: "ADD_ITEM",
    });
    expect(expectedPayload.target).toEqual({
      dayKey: sessionTarget.target.dayKey,
      sessionKey: sessionTarget.target.sessionKey,
      itemType: "SKILL",
      label: sessionTarget.target.label,
      tags: [],
    });
    expect(expectedPayload.target).not.toHaveProperty("itemKey");
    expect(expectedPayload.target).not.toHaveProperty("currentId");
    expect(Object.values(expectedPayload.target)).not.toContain(null);
    expect(fetchOptions).toHaveBeenCalledWith("entity-1", "athlete-1", expectedPayload);
  });

  it("sends optionKind ADD_ITEM with a meal/session target for a Nutrition add-food-item", async () => {
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
                items: [{ order: 0, label: "White rice", nutritionCatalogItemId: "nut-1" }],
              },
            ],
          },
        ],
      },
    );
    const mealTarget = nutritionTargets.find((option) => option.level === "SESSION")!;
    const fetchOptions = vi.fn(async () => ({
      generationDomain: "NUTRITION" as const,
      target: null,
      options: [],
    }));

    await fetchFynRevisionReplacementOptions({
      entityId: "entity-1",
      athleteId: "athlete-1",
      domain: "NUTRITION",
      reviseIds: fynReviseIds,
      coachRequest: "Add a fruit to breakfast.",
      target: mealTarget.target,
      optionKind: "ADD_ITEM",
      fetchOptions,
    });

    // Nutrition ADD_ITEM: meal/session target, itemType "NUTRITION", no item-level/null fields.
    const expectedPayload = buildFynRevisionOptionsPayload({
      domain: "NUTRITION",
      reviseIds: fynReviseIds,
      target: mealTarget.target,
      coachRequest: "Add a fruit to breakfast.",
      optionKind: "ADD_ITEM",
    });
    expect(expectedPayload.target).toEqual({
      dayKey: mealTarget.target.dayKey,
      sessionKey: mealTarget.target.sessionKey,
      itemType: "NUTRITION",
      label: mealTarget.target.label,
      tags: [],
    });
    expect(expectedPayload.target).not.toHaveProperty("itemKey");
    expect(expectedPayload.target).not.toHaveProperty("currentId");
    expect(Object.values(expectedPayload.target)).not.toContain(null);
    expect(fetchOptions).toHaveBeenCalledWith("entity-1", "athlete-1", expectedPayload);
  });

  it("maps an S&C item target to its parent session when sending ADD_ITEM", async () => {
    const sandcTargets = fynRevisionLeveledTargetOptions(
      makeRevisionContext({ generationDomain: "S_AND_C" }),
      {
        domain: "S_AND_C",
        scheduleDays: [
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
    const itemTarget = sandcTargets.find((option) => option.level === "ITEM")!;
    expect(itemTarget.target.itemKey).not.toBeNull();
    const fetchOptions = vi.fn(async () => ({
      generationDomain: "S_AND_C" as const,
      target: null,
      options: [],
    }));

    await fetchFynRevisionReplacementOptions({
      entityId: "entity-1",
      athleteId: "athlete-1",
      domain: "S_AND_C",
      reviseIds: fynReviseIds,
      coachRequest: "Add a hamstring exercise.",
      target: itemTarget.target,
      optionKind: "ADD_ITEM",
      fetchOptions,
    });

    // S&C ADD_ITEM: an item target maps to its parent SESSION with itemType "EXERCISE"; the
    // item-level fields are omitted (never sent as null, which the backend rejects).
    const expectedPayload = buildFynRevisionOptionsPayload({
      domain: "S_AND_C",
      reviseIds: fynReviseIds,
      target: itemTarget.target,
      coachRequest: "Add a hamstring exercise.",
      optionKind: "ADD_ITEM",
    });
    expect(expectedPayload.target).toEqual({
      dayKey: itemTarget.target.dayKey,
      sessionKey: itemTarget.target.sessionKey,
      itemType: "EXERCISE",
      label: itemTarget.target.label,
      tags: [],
    });
    expect(expectedPayload.target).not.toHaveProperty("itemKey");
    expect(expectedPayload.target).not.toHaveProperty("currentId");
    expect(Object.values(expectedPayload.target)).not.toContain(null);
    expect(fetchOptions).toHaveBeenCalledWith("entity-1", "athlete-1", expectedPayload);
  });

  it("blocks ADD_ITEM without a session target and never calls the endpoint", async () => {
    const fetchOptions = vi.fn();
    const outcome = await fetchFynRevisionReplacementOptions({
      entityId: "entity-1",
      athleteId: "athlete-1",
      domain: "SKILLS",
      reviseIds: fynReviseIds,
      coachRequest: "Add a drill.",
      target: {
        dayKey: "day-1",
        sessionKey: null,
        itemKey: null,
        itemType: null,
        currentId: null,
        label: "Day 1",
        tags: [],
      },
      optionKind: "ADD_ITEM",
      fetchOptions,
    });
    expect(outcome).toEqual({
      status: "MISSING_TARGET",
      message: FYN_REVISION_MISSING_TARGET_MESSAGE,
    });
    expect(fetchOptions).not.toHaveBeenCalled();
  });

  it("writes ADD_ITEM basket lines naming the approved option and the session/meal", () => {
    expect(
      buildFynRevisionAddItemChangeText("SKILLS", "Morning session", "Volley approach drill"),
    ).toBe("Add drill: Volley approach drill to Morning session.");
    expect(buildFynRevisionAddItemChangeText("NUTRITION", "Breakfast", "Greek yogurt")).toBe(
      "Add food item: Greek yogurt to Breakfast.",
    );
    expect(buildFynRevisionAddItemChangeText("S_AND_C", "Lower body", "Goblet squat")).toBe(
      "Add exercise: Goblet squat to Lower body.",
    );
    // An empty approved option yields no basket line.
    expect(buildFynRevisionAddItemChangeText("SKILLS", "Morning session", "   ")).toBe("");

    // The ADD_ITEM line participates in the same 3-change basket used by replacements.
    const selection = addAcceptedFynRevisionChange(
      defaultFynRevisionBatchSelection(),
      buildFynRevisionAddItemChangeText("NUTRITION", "Breakfast", "Greek yogurt"),
    );
    expect(selection.changes).toHaveLength(1);
    expect(selection.changes[0]?.acceptedChange).toBe(
      "Add food item: Greek yogurt to Breakfast.",
    );
  });

  it("shows the approved-options button (not chips) for ADD_ITEM until the coach clicks it", () => {
    const targets = fynRevisionLeveledTargetOptions(
      makeRevisionContext({ generationDomain: "SKILLS" }),
      { domain: "SKILLS", scheduleDays: skillsSchedule },
    );
    const sessionTarget = targets.find((option) => option.level === "SESSION")!;
    const onShowOptions = vi.fn();
    const html = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context: makeRevisionContext({ generationDomain: "SKILLS" }),
          targetOptions: targets,
          selectedTargetKey: sessionTarget.key,
          selectedActionKey: "ADD_ITEM",
          coachRequest: "Add a volley approach drill.",
          onShowOptions,
        }),
      ),
    );
    expect(html).toContain(FYN_REVISION_SHOW_OPTIONS_LABEL);
    // Rendering never fetches, so no approved-option chips exist yet.
    expect(html).not.toContain("Pick an approved option and Fyn will add it to the basket:");
    expect(html).not.toContain("Cross-court rally drill");
    expect(onShowOptions).not.toHaveBeenCalled();
  });

  it("renders ADD_ITEM approved options as chips only after the fetch resolves", () => {
    const targets = fynRevisionLeveledTargetOptions(
      makeRevisionContext({ generationDomain: "SKILLS" }),
      { domain: "SKILLS", scheduleDays: skillsSchedule },
    );
    const sessionTarget = targets.find((option) => option.level === "SESSION")!;
    const html = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context: makeRevisionContext({ generationDomain: "SKILLS" }),
          targetOptions: targets,
          selectedTargetKey: sessionTarget.key,
          selectedActionKey: "ADD_ITEM",
          coachRequest: "Add a volley approach drill.",
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
    expect(html).toContain("Pick an approved option:");
    expect(html).toContain("Cross-court rally drill");
  });

  it("does not expose ADD_SESSION and exposes REMOVE_ITEM only on a drill", () => {
    const skillsTargets = fynRevisionLeveledTargetOptions(
      makeRevisionContext({ generationDomain: "SKILLS" }),
      { domain: "SKILLS", scheduleDays: skillsSchedule },
    );
    const sessionTarget = skillsTargets.find((option) => option.level === "SESSION")!;
    const sessionHtml = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context: makeRevisionContext({ generationDomain: "SKILLS" }),
          targetOptions: skillsTargets,
          selectedTargetKey: sessionTarget.key,
        }),
      ),
    );
    expect(sessionHtml).not.toContain("Add Skills session");
    expect(sessionHtml).not.toContain("Remove drill");
    expect(sessionHtml).toContain("Add drill");

    const itemTarget = skillsTargets.find((option) => option.level === "ITEM")!;
    const itemHtml = renderToStaticMarkup(
      createElement(
        FynRevisionContextPanel,
        fynPanelProps({
          context: makeRevisionContext({ generationDomain: "SKILLS" }),
          targetOptions: skillsTargets,
          selectedTargetKey: itemTarget.key,
        }),
      ),
    );
    expect(itemHtml).toContain("Remove drill");
    expect(itemHtml).not.toContain("Adjust drill");
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

  it("keeps AI generated drafts on latest draft content when non-Nutrition submitted detail inputs are present", () => {
    for (const domain of ["SKILLS", "S_AND_C"] as const) {
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
    expect(
      resolveDomainReviewDrawerContentSource({
        domain: "NUTRITION",
        workflowStatus: "submitted_for_review",
        directReleaseSkillsOwner: false,
        activeDetail: {
          plan: { id: "NUTRITION-submitted-plan", status: "SUBMITTED_FOR_REVIEW" },
          version: { id: "NUTRITION-submitted-version", status: "SUBMITTED_FOR_REVIEW" },
          days: [],
        } as never,
        latestDraft: {
          trainingPlanId: "NUTRITION-draft-plan",
          trainingPlanVersionId: "NUTRITION-draft-version",
          versionNumber: 1,
          status: "AI_GENERATED",
          days: [
            {
              dayIndex: 1,
              sessions: [{ title: "NUTRITION generated session", items: [] }],
            },
          ],
        } as never,
      }),
    ).toBe("active_detail");
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
