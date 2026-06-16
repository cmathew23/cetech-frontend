import { describe, expect, it } from "vitest";

import {
  buildCoachWorkflowResetScopeKey,
  resolveTrainingPlanWorkflowMode,
  shouldUseSpecialistTrainingPlanWorkspace,
} from "@/components/dashboard/coach/CoachAthletePlanningProfileView";

describe("buildCoachWorkflowResetScopeKey", () => {
  it("changes when the authenticated coach user changes", () => {
    const first = buildCoachWorkflowResetScopeKey({
      athleteId: "athlete-1",
      entityId: "entity-1",
      coachUserId: "coach-a",
      activeRole: "HEAD_COACH",
      domain: "SKILLS",
    });
    const second = buildCoachWorkflowResetScopeKey({
      athleteId: "athlete-1",
      entityId: "entity-1",
      coachUserId: "coach-b",
      activeRole: "HEAD_COACH",
      domain: "SKILLS",
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
    });
    const sandcCoach = buildCoachWorkflowResetScopeKey({
      athleteId: "athlete-1",
      entityId: "entity-1",
      coachUserId: "coach-1",
      activeRole: "COACH",
      domain: "S_AND_C",
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
    });
    const nutrition = buildCoachWorkflowResetScopeKey({
      athleteId: "athlete-1",
      entityId: "entity-1",
      coachUserId: "coach-1",
      activeRole: "COACH",
      domain: "NUTRITION",
    });

    expect(skills).not.toBe(nutrition);
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

describe("resolveTrainingPlanWorkflowMode", () => {
  it("waits until coach setup is loaded before choosing a shell", () => {
    expect(
      resolveTrainingPlanWorkflowMode({
        isCoachSetupLoaded: false,
        isHeadCoachPlanningContextOwner: false,
        currentCoachGenerationDomain: "NUTRITION",
        hasHeadCoachConfigured: true,
      }),
    ).toBe("loading");
  });

  it("uses Head Coach review mode only for the Head Coach planning context owner", () => {
    expect(
      resolveTrainingPlanWorkflowMode({
        isCoachSetupLoaded: true,
        isHeadCoachPlanningContextOwner: true,
        currentCoachGenerationDomain: null,
        hasHeadCoachConfigured: true,
      }),
    ).toBe("head_coach_review");
  });

  it("routes Skills, Nutrition, and S&C contexts to the specialist domain shell when not Head Coach", () => {
    for (const domain of ["SKILLS", "NUTRITION", "S_AND_C"] as const) {
      expect(
        resolveTrainingPlanWorkflowMode({
          isCoachSetupLoaded: true,
          isHeadCoachPlanningContextOwner: false,
          currentCoachGenerationDomain: domain,
          hasHeadCoachConfigured: true,
        }),
      ).toBe("specialist_domain");
    }
  });

  it("keeps non-Head-Coach context out of Head Coach review even while domain is unresolved", () => {
    expect(
      resolveTrainingPlanWorkflowMode({
        isCoachSetupLoaded: true,
        isHeadCoachPlanningContextOwner: false,
        currentCoachGenerationDomain: null,
        hasHeadCoachConfigured: true,
      }),
    ).toBe("specialist_domain");
  });
});
