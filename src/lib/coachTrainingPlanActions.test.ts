import { describe, expect, it } from "vitest";

import {
  resolveTrainingPlanAction,
  WAITING_FOR_HEAD_COACH_PLANNING_CONTEXT_MESSAGE,
} from "@/lib/coachTrainingPlanActions";

describe("resolveTrainingPlanAction", () => {
  it("shows Edit Skills Plan for a skills coach with a persisted plan", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete101",
      assignedFunctions: ["SKILLS"],
      athletePlanGenerationDomain: "SKILLS",
      currentPlanId: "plan-skills-101",
      currentPlanStatus: "ACTIVE",
      fallbackDomain: "SKILLS",
      hasPlanningProfile: true,
    });

    expect(action.buttonLabel).toBe("Edit Skills Plan");
    expect(action.planStatusLabel).toBe("Plan: ACTIVE");
    expect(action.href).toBe(
      "/coach/training-plans/athlete101/workflow?planId=plan-skills-101&skillsPlanId=plan-skills-101",
    );
    expect(action.disabled).toBe(false);
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

  it("shows Create only when currentPlanId is null", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete102",
      assignedFunctions: ["NUTRITION"],
      athletePlanGenerationDomain: null,
      currentPlanId: null,
      currentPlanStatus: null,
      fallbackDomain: "NUTRITION",
      hasPlanningProfile: true,
    });

    expect(action.buttonLabel).toBe("Create Nutrition Plan");
    expect(action.planStatusLabel).toBeNull();
    expect(action.href).toBe("/coach/training-plans/athlete102/workflow");
    expect(action.disabled).toBe(false);
  });

  it.each([
    ["SKILLS", "Create Skills Plan"],
    ["NUTRITION", "Create Nutrition Plan"],
    ["S_AND_C", "Create S&C Plan"],
  ] as const)(
    "disables %s create action while Head Coach planning context is unlocked",
    (domain, buttonLabel) => {
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
      });

      expect(action.buttonLabel).toBe(buttonLabel);
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
    "enables %s create action after Head Coach planning context is locked",
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
      });

      expect(action.buttonLabel).toBe(buttonLabel);
      expect(action.disabled).toBe(false);
      expect(action.href).toBe("/coach/training-plans/athlete-unlocked/workflow");
      expect(action.helperBelowButton).toBeNull();
    },
  );

  it("preserves Skills Coach fallback when no Head Coach is configured", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete-no-head",
      assignedFunctions: ["SKILLS"],
      athletePlanGenerationDomain: null,
      currentPlanId: null,
      currentPlanStatus: null,
      fallbackDomain: null,
      hasPlanningProfile: true,
      hasHeadCoachConfigured: false,
      isHeadCoachPlanningContextOwner: false,
      planningContextLocked: false,
    });

    expect(action.buttonLabel).toBe("Create Skills Plan");
    expect(action.disabled).toBe(false);
    expect(action.href).toBe("/coach/training-plans/athlete-no-head/workflow");
    expect(action.helperBelowButton).toBeNull();
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

    expect(action.buttonLabel).toBe("Open Planning Workflow");
    expect(action.helperBelowButton).toBeNull();
    expect(action.href).toBe("/coach/training-plans/athlete103/workflow");
    expect(action.disabled).toBe(false);
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
    });

    expect(action.buttonLabel).toBe("Create Nutrition Plan");
    expect(action.planStatusLabel).toBeNull();
    expect(action.href).toBe("/coach/training-plans/athlete-mix/workflow");
    expect(action.href?.includes("planId")).toBe(false);
    expect(action.disabled).toBe(false);
  });
});
