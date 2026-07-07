import { describe, expect, it } from "vitest";

import {
  assistantCreateRequiresLockedPlanningContext,
  canHeadCoachCreateSkillsPlan,
  canShowAssistantDomainSubmitReview,
  hasAssistantGovernedDetailVersionMismatch,
  isAssistantDomainGeneratePlanDisabled,
  isAssistantGovernedDetailAlignedWithVisibleDraft,
  isCreatePlanBlockedByPlanningContextLock,
  shouldSkipAssistantDomainReadinessGate,
  headCoachOwnsAssignedDomainGeneration,
  isPlanGenerationBlockedByOwnership,
  mergePlanGenerationOwnershipForDomain,
  PLAN_GENERATION_NOT_ASSIGNED_MESSAGE,
  resolveTrainingPlanAction,
  PLANNING_CONTEXT_REQUIRED_BUTTON_LABEL,
  WAITING_FOR_HEAD_COACH_PLANNING_CONTEXT_MESSAGE,
  existingCoachAthletePlanningProfileHref,
} from "@/lib/coachTrainingPlanActions";

describe("resolveTrainingPlanAction", () => {
  it("disables domain create action when backend sets canGenerateCurrentDomainPlan=false", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete101",
      assignedFunctions: ["SKILLS_COACH"],
      athletePlanGenerationDomain: null,
      currentPlanId: null,
      currentPlanStatus: null,
      fallbackDomain: "SKILLS",
      hasPlanningProfile: true,
      canGeneratePlan: true,
      canGenerateCurrentDomainPlan: false,
    });

    expect(action.buttonLabel).toBe("Create Skills Plan");
    expect(action.href).toBeNull();
    expect(action.disabled).toBe(true);
    expect(action.helperBelowButton).toBe(PLAN_GENERATION_NOT_ASSIGNED_MESSAGE);
    expect(action.resolvedButtonState).toBe("plan_creation_unavailable");
  });

  it("does not block Edit Plan when canGenerateCurrentDomainPlan is false but a plan exists", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete101",
      assignedFunctions: ["SKILLS"],
      athletePlanGenerationDomain: "SKILLS",
      currentPlanId: "plan-skills",
      currentPlanStatus: "ACTIVE",
      fallbackDomain: "SKILLS",
      hasPlanningProfile: true,
      canGeneratePlan: false,
      canGenerateCurrentDomainPlan: false,
    });

    expect(action.buttonLabel).toBe("Edit Skills Plan");
    expect(action.disabled).toBe(false);
    expect(action.href).toContain("plan-skills");
    expect(action.resolvedButtonState).toBe("edit_plan");
  });

  it("routes Workflow 3 Skills coach Edit Skills Plan to the existing workspace page", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete101",
      assignedFunctions: ["SKILLS"],
      athletePlanGenerationDomain: "SKILLS",
      currentPlanId: "plan-skills-101",
      currentPlanStatus: "ACTIVE",
      fallbackDomain: "SKILLS",
      hasPlanningProfile: true,
      hasHeadCoachConfigured: false,
    });

    expect(action.buttonLabel).toBe("Edit Skills Plan");
    expect(action.planStatusLabel).toBe("Plan: ACTIVE");
    expect(action.href).toBe(
      "/coach/athletes/athlete101/planning-profile?planId=plan-skills-101&skillsPlanId=plan-skills-101",
    );
    expect(action.href).not.toContain("/workflow");
    expect(action.disabled).toBe(false);
  });

  it("builds Workflow 3 edit route against the existing planning-profile page", () => {
    const href = existingCoachAthletePlanningProfileHref("athlete101", "plan-skills-101");

    expect(href).toBe(
      "/coach/athletes/athlete101/planning-profile?planId=plan-skills-101&skillsPlanId=plan-skills-101",
    );
    expect(href).not.toContain("/workflow");
  });

  it("keeps Head Coach-configured Skills edit navigation on the workflow route", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete-2b",
      assignedFunctions: ["SKILLS"],
      athletePlanGenerationDomain: "SKILLS",
      currentPlanId: "plan-skills-2b",
      currentPlanStatus: "ACTIVE",
      fallbackDomain: "SKILLS",
      hasPlanningProfile: true,
      hasHeadCoachConfigured: true,
      isHeadCoachPlanningContextOwner: false,
      planningContextLocked: true,
    });

    expect(action.buttonLabel).toBe("Edit Skills Plan");
    expect(action.href).toBe(
      "/coach/training-plans/athlete-2b/workflow?planId=plan-skills-2b&skillsPlanId=plan-skills-2b",
    );
  });

  it("keeps Head Coach-owned Skills edit navigation on the workflow route", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete-2a",
      assignedFunctions: ["SKILLS"],
      athletePlanGenerationDomain: "SKILLS",
      currentPlanId: "plan-skills-2a",
      currentPlanStatus: "ACTIVE",
      fallbackDomain: "SKILLS",
      hasPlanningProfile: true,
      hasHeadCoachConfigured: true,
      isHeadCoachPlanningContextOwner: true,
      planningContextLocked: true,
    });

    expect(action.buttonLabel).toBe("Edit Skills Plan");
    expect(action.href).toBe(
      "/coach/training-plans/athlete-2a/workflow?planId=plan-skills-2a&skillsPlanId=plan-skills-2a",
    );
  });

  it("shows Edit Nutrition Plan for a nutrition coach with a persisted plan", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete101",
      assignedFunctions: ["NUTRITION"],
      athletePlanGenerationDomain: "NUTRITION",
      currentPlanId: "plan-nutrition-101",
      currentPlanStatus: "DRAFT",
      fallbackDomain: "NUTRITION",
      hasPlanningProfile: true,
    });

    expect(action.buttonLabel).toBe("Edit Nutrition Plan");
    expect(action.planStatusLabel).toBe("Plan: DRAFT");
    expect(action.disabled).toBe(false);
  });

  it("shows Edit S&C Plan for an S&C coach with a persisted plan", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete101",
      assignedFunctions: ["S_AND_C"],
      athletePlanGenerationDomain: "S_AND_C",
      currentPlanId: "plan-snc-101",
      currentPlanStatus: "PUBLISHED",
      fallbackDomain: "S_AND_C",
      hasPlanningProfile: true,
    });

    expect(action.buttonLabel).toBe("Edit S&C Plan");
    expect(action.planStatusLabel).toBe("Plan: PUBLISHED");
    expect(action.disabled).toBe(false);
  });

  it("shows APP Required when no planning profile exists", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "sharan",
      assignedFunctions: ["SKILLS"],
      athletePlanGenerationDomain: null,
      currentPlanId: null,
      currentPlanStatus: null,
      fallbackDomain: "SKILLS",
      hasPlanningProfile: false,
    });

    expect(action.buttonLabel).toBe("APP Required");
    expect(action.href).toBeNull();
    expect(action.disabled).toBe(true);
  });

  it("shows Create only when currentPlanId is null and assignment allows generation", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete102",
      assignedFunctions: ["NUTRITION"],
      athletePlanGenerationDomain: null,
      currentPlanId: null,
      currentPlanStatus: null,
      fallbackDomain: "NUTRITION",
      hasPlanningProfile: true,
      canGeneratePlan: true,
      canGenerateCurrentDomainPlan: true,
      planningContextLocked: true,
    });

    expect(action.buttonLabel).toBe("Create Nutrition Plan");
    expect(action.planStatusLabel).toBeNull();
    expect(action.href).toBe("/coach/training-plans/athlete102/workflow");
    expect(action.disabled).toBe(false);
  });

  it("disables Skills create for HC academy assistant before planning context lock when assignment allows generation", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete-601",
      assignedFunctions: ["SKILLS_COACH"],
      athletePlanGenerationDomain: null,
      currentPlanId: null,
      currentPlanStatus: null,
      fallbackDomain: "SKILLS",
      hasPlanningProfile: true,
      hasHeadCoachConfigured: true,
      isHeadCoachPlanningContextOwner: false,
      planningContextLocked: false,
      canGeneratePlan: true,
      canGenerateCurrentDomainPlan: true,
    });

    expect(action.buttonLabel).toBe(PLANNING_CONTEXT_REQUIRED_BUTTON_LABEL);
    expect(action.disabled).toBe(true);
    expect(action.href).toBeNull();
    expect(action.helperBelowButton).toBe(
      WAITING_FOR_HEAD_COACH_PLANNING_CONTEXT_MESSAGE,
    );
  });

  it("enables Skills create for HC academy assistant after planning context lock when assignment allows generation", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete-601",
      assignedFunctions: ["SKILLS_COACH"],
      athletePlanGenerationDomain: null,
      currentPlanId: null,
      currentPlanStatus: null,
      fallbackDomain: "SKILLS",
      hasPlanningProfile: true,
      hasHeadCoachConfigured: true,
      isHeadCoachPlanningContextOwner: false,
      planningContextLocked: true,
      canGeneratePlan: true,
      canGenerateCurrentDomainPlan: true,
    });

    expect(action.buttonLabel).toBe("Create Skills Plan");
    expect(action.disabled).toBe(false);
    expect(action.href).toBe("/coach/training-plans/athlete-601/workflow");
    expect(action.helperBelowButton).toBeNull();
  });

  it("disables Skills create when separate Skills Coach owns generation (canGeneratePlan=false)", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete-602",
      assignedFunctions: ["SKILLS_COACH"],
      athletePlanGenerationDomain: "SKILLS",
      currentPlanId: null,
      currentPlanStatus: null,
      fallbackDomain: "SKILLS",
      hasPlanningProfile: true,
      hasHeadCoachConfigured: true,
      isHeadCoachPlanningContextOwner: true,
      planningContextLocked: true,
      canGeneratePlan: false,
      canGenerateCurrentDomainPlan: false,
    });

    expect(action.buttonLabel).toBe("Open Planning Workflow");
    expect(action.disabled).toBe(false);
    expect(action.href).toBe("/coach/training-plans/athlete-602/workflow");
    expect(action.resolvedButtonState).toBe("create_plan");
  });

  it("disables assistant Skills create when canGeneratePlan=false even with SKILLS_COACH function", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete-602",
      assignedFunctions: ["SKILLS_COACH"],
      athletePlanGenerationDomain: null,
      currentPlanId: null,
      currentPlanStatus: null,
      fallbackDomain: "SKILLS",
      hasPlanningProfile: true,
      hasHeadCoachConfigured: true,
      isHeadCoachPlanningContextOwner: false,
      planningContextLocked: true,
      canGeneratePlan: false,
      canGenerateCurrentDomainPlan: false,
    });

    expect(action.buttonLabel).toBe("Create Skills Plan");
    expect(action.disabled).toBe(true);
    expect(action.helperBelowButton).toBe(PLAN_GENERATION_NOT_ASSIGNED_MESSAGE);
    expect(action.href).toBeNull();
  });

  it.each([
    ["NUTRITION", "Create Nutrition Plan"],
    ["S_AND_C", "Create S&C Plan"],
  ] as const)(
    "disables %s create action while planning context is unlocked",
    (domain) => {
      const action = resolveTrainingPlanAction({
        athleteId: "athlete-locked",
        assignedFunctions: [domain],
        athletePlanGenerationDomain: null,
        currentPlanId: null,
        currentPlanStatus: null,
        fallbackDomain: null,
        hasPlanningProfile: true,
        hasHeadCoachConfigured: true,
        isHeadCoachPlanningContextOwner: false,
        planningContextLocked: false,
        canGeneratePlan: true,
        canGenerateCurrentDomainPlan: true,
      });

      expect(action.buttonLabel).toBe(PLANNING_CONTEXT_REQUIRED_BUTTON_LABEL);
      expect(action.disabled).toBe(true);
      expect(action.href).toBeNull();
      expect(action.helperBelowButton).toBe(
        WAITING_FOR_HEAD_COACH_PLANNING_CONTEXT_MESSAGE,
      );
    },
  );

  it.each([
    ["SKILLS", "Create Skills Plan"],
    ["NUTRITION", "Create Nutrition Plan"],
    ["S_AND_C", "Create S&C Plan"],
  ] as const)(
    "enables %s create action after planning context is locked when assignment allows generation",
    (domain, buttonLabel) => {
      const action = resolveTrainingPlanAction({
        athleteId: "athlete-unlocked",
        assignedFunctions: [domain],
        athletePlanGenerationDomain: null,
        currentPlanId: null,
        currentPlanStatus: null,
        fallbackDomain: null,
        hasPlanningProfile: true,
        hasHeadCoachConfigured: true,
        isHeadCoachPlanningContextOwner: false,
        planningContextLocked: true,
        canGeneratePlan: true,
        canGenerateCurrentDomainPlan: true,
      });

      expect(action.buttonLabel).toBe(buttonLabel);
      expect(action.disabled).toBe(false);
      expect(action.href).toBe("/coach/training-plans/athlete-unlocked/workflow");
      expect(action.helperBelowButton).toBeNull();
    },
  );

  it("enables Skills Coach fallback in no-HC academy when assignment allows generation without lock", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete-no-head",
      assignedFunctions: ["SKILLS_COACH"],
      athletePlanGenerationDomain: null,
      currentPlanId: null,
      currentPlanStatus: null,
      fallbackDomain: "SKILLS",
      hasPlanningProfile: true,
      hasHeadCoachConfigured: false,
      isHeadCoachPlanningContextOwner: false,
      planningContextLocked: false,
      canGeneratePlan: true,
      canGenerateCurrentDomainPlan: true,
    });

    expect(action.buttonLabel).toBe("Create Skills Plan");
    expect(action.disabled).toBe(false);
    expect(action.href).toBe("/coach/training-plans/athlete-no-head/workflow");
    expect(action.helperBelowButton).toBeNull();
  });

  it("disables Skills create in no-HC academy when canGeneratePlan=false", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete-no-head",
      assignedFunctions: ["SKILLS_COACH"],
      athletePlanGenerationDomain: null,
      currentPlanId: null,
      currentPlanStatus: null,
      fallbackDomain: "SKILLS",
      hasPlanningProfile: true,
      hasHeadCoachConfigured: false,
      isHeadCoachPlanningContextOwner: false,
      planningContextLocked: false,
      canGeneratePlan: false,
    });

    expect(action.buttonLabel).toBe("Create Skills Plan");
    expect(action.disabled).toBe(true);
    expect(action.helperBelowButton).toBe(PLAN_GENERATION_NOT_ASSIGNED_MESSAGE);
  });

  it("opens the planning workflow for a Head Coach without a generation function", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete103",
      assignedFunctions: [],
      athletePlanGenerationDomain: null,
      currentPlanId: null,
      currentPlanStatus: null,
      fallbackDomain: null,
      hasPlanningProfile: true,
      isHeadCoachPlanningContextOwner: true,
    });

    expect(action.buttonLabel).toBe("Set Planning Context");
    expect(action.helperBelowButton).toBeNull();
    expect(action.href).toBe("/coach/training-plans/athlete103/workflow");
    expect(action.disabled).toBe(false);
  });

  it("Head Coach workflow entry uses Set Planning Context when context is not locked", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete-302",
      assignedFunctions: ["SKILLS_COACH"],
      athletePlanGenerationDomain: null,
      currentPlanId: null,
      currentPlanStatus: null,
      fallbackDomain: "SKILLS",
      hasPlanningProfile: true,
      hasHeadCoachConfigured: true,
      isHeadCoachPlanningContextOwner: true,
      planningContextLocked: false,
      canGeneratePlan: false,
    });

    expect(action.buttonLabel).toBe("Set Planning Context");
    expect(action.disabled).toBe(false);
    expect(action.helperBelowButton).toBeNull();
  });

  it("domain coach ignores another domain plan on row (Skills plan, Nutrition viewer)", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete-mix",
      assignedFunctions: ["NUTRITION"],
      athletePlanGenerationDomain: "SKILLS",
      currentPlanId: "plan-skills-1",
      currentPlanStatus: "ACTIVE",
      fallbackDomain: "NUTRITION",
      hasPlanningProfile: true,
      planningContextLocked: true,
      canGeneratePlan: true,
      canGenerateCurrentDomainPlan: true,
    });

    expect(action.buttonLabel).toBe("Create Nutrition Plan");
    expect(action.planStatusLabel).toBeNull();
    expect(action.href).toBe("/coach/training-plans/athlete-mix/workflow");
    expect(action.href?.includes("planId")).toBe(false);
    expect(action.disabled).toBe(false);
  });
});

describe("assistantCreateRequiresLockedPlanningContext", () => {
  it("requires lock for Skills in Head Coach academies", () => {
    expect(assistantCreateRequiresLockedPlanningContext("SKILLS", true)).toBe(true);
  });

  it("does not require lock for Skills when no Head Coach is configured", () => {
    expect(assistantCreateRequiresLockedPlanningContext("SKILLS", false)).toBe(false);
  });

  it("requires lock for Nutrition and S&C in all workflows", () => {
    expect(assistantCreateRequiresLockedPlanningContext("NUTRITION", true)).toBe(true);
    expect(assistantCreateRequiresLockedPlanningContext("S_AND_C", true)).toBe(true);
    expect(assistantCreateRequiresLockedPlanningContext("NUTRITION", false)).toBe(true);
    expect(assistantCreateRequiresLockedPlanningContext("S_AND_C", false)).toBe(true);
  });
});

describe("isCreatePlanBlockedByPlanningContextLock", () => {
  it("blocks HC academy assistant Skills before lock", () => {
    expect(
      isCreatePlanBlockedByPlanningContextLock({
        domain: "SKILLS",
        hasHeadCoachConfigured: true,
        isHeadCoachPlanningContextOwner: false,
        planningContextLocked: false,
        upstreamContextLockedForDownstream: false,
      }),
    ).toBe(true);
  });

  it("does not block HC academy assistant when upstream helper reports locked but planningContextLocked is false", () => {
    expect(
      isCreatePlanBlockedByPlanningContextLock({
        domain: "NUTRITION",
        hasHeadCoachConfigured: true,
        isHeadCoachPlanningContextOwner: false,
        planningContextLocked: false,
        upstreamContextLockedForDownstream: true,
      }),
    ).toBe(false);
  });

  it("does not block no-HC Skills fallback before lock when assignment allows generation", () => {
    expect(
      isCreatePlanBlockedByPlanningContextLock({
        domain: "SKILLS",
        hasHeadCoachConfigured: false,
        isHeadCoachPlanningContextOwner: false,
        planningContextLocked: false,
        upstreamContextLockedForDownstream: false,
      }),
    ).toBe(false);
  });

  it("blocks Nutrition before upstream lock in no-HC academy", () => {
    expect(
      isCreatePlanBlockedByPlanningContextLock({
        domain: "NUTRITION",
        hasHeadCoachConfigured: false,
        isHeadCoachPlanningContextOwner: false,
        planningContextLocked: false,
        upstreamContextLockedForDownstream: false,
      }),
    ).toBe(true);
  });
});

describe("no-HC downstream assistant Create gating", () => {
  const nutritionOwnership = {
    canGeneratePlan: true,
    canGenerateCurrentDomainPlan: true,
  } satisfies Parameters<typeof isAssistantDomainGeneratePlanDisabled>[0]["ownershipFlags"];

  const noHcNutritionBase = {
    domain: "NUTRITION" as const,
    baseBusy: false,
    generationReadinessFromApis: false,
    ownershipFlags: nutritionOwnership,
    hasHeadCoachConfigured: false,
    isHeadCoachPlanningContextOwner: false,
  } satisfies Omit<Parameters<typeof isAssistantDomainGeneratePlanDisabled>[0], "skipMainReadinessForGenerationGate" | "planningContextLocked" | "upstreamContextLockedForDownstream">;

  it("enables Create Nutrition Plan after lock without re-running list-page API readiness", () => {
    expect(
      shouldSkipAssistantDomainReadinessGate({
        hasHeadCoachConfigured: false,
        isHeadCoachPlanningContextOwner: false,
        currentDomain: "NUTRITION",
        isDownstreamDomainCoach: true,
        planningContextLocked: true,
        upstreamContextLockedForDownstream: true,
      }),
    ).toBe(true);
    expect(
      isAssistantDomainGeneratePlanDisabled({
        ...noHcNutritionBase,
        skipMainReadinessForGenerationGate: true,
        planningContextLocked: true,
        upstreamContextLockedForDownstream: true,
      }),
    ).toBe(false);
  });

  it("disables Create Nutrition Plan with Planning Context Required before lock", () => {
    expect(
      shouldSkipAssistantDomainReadinessGate({
        hasHeadCoachConfigured: false,
        isHeadCoachPlanningContextOwner: false,
        currentDomain: "NUTRITION",
        isDownstreamDomainCoach: true,
        planningContextLocked: false,
        upstreamContextLockedForDownstream: false,
      }),
    ).toBe(false);
    expect(
      isAssistantDomainGeneratePlanDisabled({
        ...noHcNutritionBase,
        skipMainReadinessForGenerationGate: false,
        planningContextLocked: false,
        upstreamContextLockedForDownstream: false,
      }),
    ).toBe(true);
  });

  it("disables Create Nutrition Plan when assignment blocks generation even if context is locked", () => {
    expect(
      isAssistantDomainGeneratePlanDisabled({
        ...noHcNutritionBase,
        skipMainReadinessForGenerationGate: true,
        planningContextLocked: true,
        upstreamContextLockedForDownstream: true,
        ownershipFlags: {
          canGeneratePlan: false,
          canGenerateCurrentDomainPlan: false,
        },
      }),
    ).toBe(true);
  });
});

describe("isAssistantDomainGeneratePlanDisabled", () => {
  const assistantOwnership = {
    canGeneratePlan: true,
    canGenerateCurrentDomainPlan: true,
  } satisfies Parameters<typeof isAssistantDomainGeneratePlanDisabled>[0]["ownershipFlags"];

  const hcAssistantBase = {
    baseBusy: false,
    skipMainReadinessForGenerationGate: true,
    generationReadinessFromApis: false,
    ownershipFlags: assistantOwnership,
    hasHeadCoachConfigured: true,
    isHeadCoachPlanningContextOwner: false,
    planningContextLocked: true,
    upstreamContextLockedForDownstream: true,
  } satisfies Omit<Parameters<typeof isAssistantDomainGeneratePlanDisabled>[0], "domain">;

  it("enables HC academy assistant Nutrition when assignment and lock are valid and main readiness is skipped", () => {
    expect(
      isAssistantDomainGeneratePlanDisabled({
        ...hcAssistantBase,
        domain: "NUTRITION",
      }),
    ).toBe(false);
  });

  it("enables HC academy assistant S&C when assignment and lock are valid and main readiness is skipped", () => {
    expect(
      isAssistantDomainGeneratePlanDisabled({
        ...hcAssistantBase,
        domain: "S_AND_C",
      }),
    ).toBe(false);
  });

  it("disables HC academy assistant Skills before planning context lock", () => {
    expect(
      isAssistantDomainGeneratePlanDisabled({
        ...hcAssistantBase,
        domain: "SKILLS",
        planningContextLocked: false,
        upstreamContextLockedForDownstream: false,
      }),
    ).toBe(true);
  });

  it("enables HC academy assistant Skills after planning context lock when main readiness is skipped", () => {
    expect(
      isAssistantDomainGeneratePlanDisabled({
        ...hcAssistantBase,
        domain: "SKILLS",
      }),
    ).toBe(false);
  });

  it("disables any domain when assignment blocks generation", () => {
    expect(
      isAssistantDomainGeneratePlanDisabled({
        ...hcAssistantBase,
        domain: "NUTRITION",
        ownershipFlags: {
          canGeneratePlan: false,
          canGenerateCurrentDomainPlan: false,
        },
      }),
    ).toBe(true);
  });

  it("still requires generationReadinessFromApis on planning-owner paths", () => {
    expect(
      isAssistantDomainGeneratePlanDisabled({
        ...hcAssistantBase,
        domain: "NUTRITION",
        skipMainReadinessForGenerationGate: false,
        generationReadinessFromApis: false,
      }),
    ).toBe(true);
  });
});

describe("assistant governed submit alignment", () => {
  const governedContext = {
    planId: "plan-sandc",
    versionId: "version-v2",
    generationDomain: "S_AND_C",
  } as const;

  const latestDraft = {
    trainingPlanId: "plan-sandc",
    trainingPlanVersionId: "version-v2",
  };

  it("hides Submit when visible latest draft version differs from persisted detail version", () => {
    expect(
      isAssistantGovernedDetailAlignedWithVisibleDraft({
        governedContext,
        latestDraft: {
          trainingPlanId: "plan-sandc",
          trainingPlanVersionId: "version-v4",
        },
        currentDomain: "S_AND_C",
      }),
    ).toBe(false);
    expect(
      canShowAssistantDomainSubmitReview({
        discoveryLoading: false,
        governedDetailRefreshing: false,
        hasHeadCoachConfigured: true,
        allowedActionsHasSubmitReview: true,
        governedContext,
        latestDraft: {
          trainingPlanId: "plan-sandc",
          trainingPlanVersionId: "version-v4",
        },
        currentDomain: "S_AND_C",
      }),
    ).toBe(false);
    expect(
      hasAssistantGovernedDetailVersionMismatch({
        allowedActionsHasSubmitReview: true,
        governedContext,
        latestDraft: {
          trainingPlanId: "plan-sandc",
          trainingPlanVersionId: "version-v4",
        },
        currentDomain: "S_AND_C",
      }),
    ).toBe(true);
  });

  it("shows Submit when visible latest draft matches persisted detail with SUBMIT_REVIEW", () => {
    expect(
      canShowAssistantDomainSubmitReview({
        discoveryLoading: false,
        governedDetailRefreshing: false,
        hasHeadCoachConfigured: true,
        allowedActionsHasSubmitReview: true,
        governedContext,
        latestDraft,
        currentDomain: "S_AND_C",
      }),
    ).toBe(true);
  });

  it("treats aligned governed context as the submit planId/versionId pair", () => {
    expect(
      isAssistantGovernedDetailAlignedWithVisibleDraft({
        governedContext,
        latestDraft,
        currentDomain: "S_AND_C",
      }),
    ).toBe(true);
    expect(governedContext.planId).toBe(latestDraft.trainingPlanId);
    expect(governedContext.versionId).toBe(latestDraft.trainingPlanVersionId);
  });
});

describe("canHeadCoachCreateSkillsPlan", () => {
  it("shows Create Skills Plan for Head Coach when assignment allows, context is locked, and no draft exists", () => {
    expect(
      canHeadCoachCreateSkillsPlan({
        isHeadCoachPlanningContextOwner: true,
        planningContextLocked: true,
        allowedGenerationDomains: ["SKILLS"],
        skillsOwnershipFlags: {
          canGeneratePlan: true,
          canGenerateCurrentDomainPlan: true,
        },
        skillsPlanExists: false,
      }),
    ).toBe(true);
  });

  it("hides Create Skills Plan for Head Coach when assignment blocks generation", () => {
    expect(
      canHeadCoachCreateSkillsPlan({
        isHeadCoachPlanningContextOwner: true,
        planningContextLocked: true,
        allowedGenerationDomains: ["SKILLS"],
        skillsOwnershipFlags: {
          canGeneratePlan: false,
          canGenerateCurrentDomainPlan: false,
        },
      }),
    ).toBe(false);
  });

  it("hides Create Skills Plan for Head Coach before planning context lock", () => {
    expect(
      canHeadCoachCreateSkillsPlan({
        isHeadCoachPlanningContextOwner: true,
        planningContextLocked: false,
        allowedGenerationDomains: ["SKILLS"],
        skillsOwnershipFlags: {
          canGeneratePlan: true,
          canGenerateCurrentDomainPlan: true,
        },
      }),
    ).toBe(false);
  });

  it("hides Create Skills Plan when a Skills draft already exists", () => {
    expect(
      canHeadCoachCreateSkillsPlan({
        isHeadCoachPlanningContextOwner: true,
        planningContextLocked: true,
        allowedGenerationDomains: ["SKILLS"],
        skillsOwnershipFlags: {
          canGeneratePlan: true,
          canGenerateCurrentDomainPlan: true,
        },
        skillsPlanExists: true,
      }),
    ).toBe(false);
  });
});

describe("mergePlanGenerationOwnershipForDomain", () => {
  it("uses assigned-athletes row flags when readiness omits them for the row domain", () => {
    expect(
      mergePlanGenerationOwnershipForDomain(
        "SKILLS",
        {},
        {
          currentGenerationDomain: "SKILLS",
          canGeneratePlan: false,
          canGenerateCurrentDomainPlan: null,
        },
      ),
    ).toEqual({
      canGeneratePlan: false,
      canGenerateCurrentDomainPlan: null,
    });
    expect(
      isPlanGenerationBlockedByOwnership(
        mergePlanGenerationOwnershipForDomain("NUTRITION", { canGeneratePlan: true }, {
          currentGenerationDomain: "SKILLS",
          canGeneratePlan: false,
          canGenerateCurrentDomainPlan: false,
        }),
      ),
    ).toBe(false);
  });

  it("prefers assigned-athletes row over readiness when both specify canGeneratePlan", () => {
    expect(
      mergePlanGenerationOwnershipForDomain(
        "SKILLS",
        { canGeneratePlan: true, canGenerateCurrentDomainPlan: true },
        {
          currentGenerationDomain: "SKILLS",
          canGeneratePlan: false,
          canGenerateCurrentDomainPlan: false,
        },
      ),
    ).toEqual({
      canGeneratePlan: false,
      canGenerateCurrentDomainPlan: false,
    });
  });
});

describe("headCoachOwnsAssignedDomainGeneration", () => {
  it("returns true when assignment allows Head Coach to generate an assigned domain", () => {
    expect(
      headCoachOwnsAssignedDomainGeneration({
        coachAssignedGenerationDomains: ["SKILLS"],
        assignedAthleteRow: {
          currentGenerationDomain: "SKILLS",
          canGeneratePlan: true,
          canGenerateCurrentDomainPlan: true,
        },
      }),
    ).toBe(true);
  });

  it("returns false when Skills Coach owns Skills generation despite Head Coach Skills function", () => {
    expect(
      headCoachOwnsAssignedDomainGeneration({
        coachAssignedGenerationDomains: ["SKILLS"],
        assignedAthleteRow: {
          currentGenerationDomain: "SKILLS",
          canGeneratePlan: false,
          canGenerateCurrentDomainPlan: false,
        },
        readinessByDomain: {
          SKILLS: { canGeneratePlan: true, canGenerateCurrentDomainPlan: true },
        },
      }),
    ).toBe(false);
  });
});
