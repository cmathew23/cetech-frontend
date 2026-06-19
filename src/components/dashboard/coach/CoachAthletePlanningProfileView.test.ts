import { describe, expect, it } from "vitest";

import {
  buildCoachWorkflowResetScopeKey,
  deriveHeadCoachDomainWorkflowStatus,
  resolveNoHeadCoachDirectReleaseLockedPlanningContext,
  resolveInitialTrainingPlanWorkflowTab,
  resolveSkillsOwnedDirectReleaseCurrentStep,
  resolveStep6GenerationLifecyclePhase,
  resolveTrainingPlanShellOwnership,
  resolveTrainingPlanPageBootstrapModel,
  resolveTrainingPlanWorkflowMode,
  resolveWorkflow2SubmittedDomainSkillsSlotProjection,
  shouldClearWorkflow2SkillsSubmitSlotError,
  shouldSkipPersistedVersionsFetchWhenSummaryStatusPresent,
  shouldShowStep6PreGenerationReadiness,
  shouldUseSpecialistTrainingPlanWorkspace,
  workflow2SkillsSubmitReviewReconciled,
} from "@/components/dashboard/coach/CoachAthletePlanningProfileView";

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
