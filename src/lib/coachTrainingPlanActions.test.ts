import { describe, expect, it } from "vitest";

import { resolveTrainingPlanAction } from "@/lib/coachTrainingPlanActions";

describe("resolveTrainingPlanAction", () => {
  it("shows Edit Skills Plan for a skills coach with a persisted plan", () => {
    const action = resolveTrainingPlanAction({
      athleteId: "athlete101",
      assignedFunctions: ["SKILLS"],
      currentGenerationDomain: "SKILLS",
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
      currentGenerationDomain: "NUTRITION",
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
      currentGenerationDomain: "S_AND_C",
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
      currentGenerationDomain: null,
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
      currentGenerationDomain: null,
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
});
