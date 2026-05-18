import { describe, expect, it } from "vitest";

import type { CoachAssignedAthleteRow } from "@/lib/api/coachMe";
import { deriveTrainingPlanReadiness } from "@/lib/trainingPlanReadiness";

function minimalRow(
  overrides: Partial<CoachAssignedAthleteRow>,
): CoachAssignedAthleteRow {
  return {
    athleteId: "a1",
    assignedFunctions: ["SKILLS"],
    hasPlanningProfile: false,
    currentGenerationDomain: null,
    currentPlanId: null,
    currentPlanStatus: null,
    canGeneratePlan: null,
    canGenerateCurrentDomainPlan: null,
    validationStatus: null,
    displayName: "X",
    email: "x@example.com",
    lifecycle: "ACTIVE",
    membershipStatus: "ACTIVE",
    skillsPlanId: null,
    planStatus: null,
    ...overrides,
  };
}

describe("deriveTrainingPlanReadiness", () => {
  it("prefers Plan Generated when aligned currentPlanId exists even without APP", () => {
    expect(
      deriveTrainingPlanReadiness(
        minimalRow({
          assignedFunctions: ["SKILLS"],
          hasPlanningProfile: false,
          currentPlanId: "plan-99",
          currentGenerationDomain: null,
          validationStatus: null,
        }),
      ),
    ).toEqual({
      kind: "plan_generated",
      badgeLabel: "Plan Generated",
    });
  });

  it("does not treat mismatched-domain row plan as generated for domain coach", () => {
    expect(
      deriveTrainingPlanReadiness(
        minimalRow({
          assignedFunctions: ["NUTRITION"],
          currentGenerationDomain: "SKILLS",
          currentPlanId: "plan-skills-only",
          hasPlanningProfile: true,
        }),
        {
          fallbackCoachPlanDomain: "NUTRITION",
          isHeadCoachPlanningContextOwner: false,
        },
      ),
    ).toEqual({
      kind: "app_complete_no_plan",
      badgeLabel: "APP Complete",
    });
  });

  it("shows Plan Generated when plan domain aligns with viewer domain", () => {
    expect(
      deriveTrainingPlanReadiness(
        minimalRow({
          assignedFunctions: ["NUTRITION"],
          currentGenerationDomain: "NUTRITION",
          currentPlanId: "plan-nutrition",
          hasPlanningProfile: true,
        }),
        {
          fallbackCoachPlanDomain: "NUTRITION",
          isHeadCoachPlanningContextOwner: false,
        },
      ),
    ).toEqual({
      kind: "plan_generated",
      badgeLabel: "Plan Generated",
    });
  });

  it("Head Coach still sees Plan Generated when row plan is from another assistant domain", () => {
    expect(
      deriveTrainingPlanReadiness(
        minimalRow({
          assignedFunctions: [],
          currentGenerationDomain: "SKILLS",
          currentPlanId: "plan-any",
          hasPlanningProfile: true,
        }),
        {
          fallbackCoachPlanDomain: null,
          isHeadCoachPlanningContextOwner: true,
        },
      ),
    ).toEqual({
      kind: "plan_generated",
      badgeLabel: "Plan Generated",
    });
  });

  it("shows APP Incomplete when no plan and no APP", () => {
    expect(
      deriveTrainingPlanReadiness(
        minimalRow({
          hasPlanningProfile: false,
          currentPlanId: null,
        }),
      ),
    ).toEqual({ kind: "app_incomplete", badgeLabel: "APP Incomplete" });
  });

  it("shows APP Complete when APP complete and no plan (including CONFIRMED validation)", () => {
    expect(
      deriveTrainingPlanReadiness(
        minimalRow({
          hasPlanningProfile: true,
          currentPlanId: null,
          validationStatus: "CONFIRMED",
        }),
      ),
    ).toEqual({
      kind: "app_complete_no_plan",
      badgeLabel: "APP Complete",
    });
  });

  it("shows APP Complete when APP complete, no plan, validation omitted", () => {
    expect(
      deriveTrainingPlanReadiness(
        minimalRow({
          hasPlanningProfile: true,
          currentPlanId: null,
          validationStatus: null,
        }),
      ),
    ).toEqual({
      kind: "app_complete_no_plan",
      badgeLabel: "APP Complete",
    });
  });
});
