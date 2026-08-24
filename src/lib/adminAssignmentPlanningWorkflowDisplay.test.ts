import { describe, expect, it } from "vitest";

import {
  describeAthletePlanningWorkflow,
  INCOMPLETE_PLANNING_CONFIGURATION_TITLE,
  OPERATIONAL_SUCCESS_MESSAGE_COPY,
  PLAN_GENERATION_NOT_ENABLED_COPY,
  type AdminAssignmentWorkflowCoachInput,
} from "@/lib/adminAssignmentPlanningWorkflowDisplay";

function coach(
  overrides: Partial<AdminAssignmentWorkflowCoachInput> &
    Pick<AdminAssignmentWorkflowCoachInput, "coachProfileId">,
): AdminAssignmentWorkflowCoachInput {
  return {
    displayName: overrides.displayName ?? overrides.coachProfileId,
    role: overrides.role ?? "ASSISTANT_COACH",
    functions: overrides.functions ?? [],
    canGeneratePlan: overrides.canGeneratePlan ?? false,
    ...overrides,
  };
}

const nutritionEnabled = coach({
  coachProfileId: "nut",
  functions: ["NUTRITION_COACH"],
  canGeneratePlan: true,
});
const sandCEnabled = coach({
  coachProfileId: "sc",
  functions: ["STRENGTH_AND_CONDITIONING_COACH"],
  canGeneratePlan: true,
});
const skillsEnabled = coach({
  coachProfileId: "skills",
  functions: ["SKILLS_COACH"],
  canGeneratePlan: true,
});

describe("describeAthletePlanningWorkflow", () => {
  it("describes complete W1 with Planning Context and domain generators", () => {
    const display = describeAthletePlanningWorkflow([
      coach({
        coachProfileId: "hc",
        role: "HEAD_COACH",
        functions: [],
        canGeneratePlan: false,
      }),
      skillsEnabled,
      nutritionEnabled,
      sandCEnabled,
    ]);

    expect(display.workflowId).toBe("W1");
    expect(display.operational).toBe(true);
    expect(display.headCoachLabel).toBe("Head Coach builds the Planning Context.");
    expect(display.domainLines.find((l) => l.domain === "SKILLS")?.summary).toBe(
      "Skills Coach generates the Skills plan.",
    );
    expect(display.domainLines.find((l) => l.domain === "NUTRITION")?.summary).toBe(
      "Nutrition Coach generates the Nutrition plan.",
    );
    expect(display.domainLines.find((l) => l.domain === "S_AND_C")?.summary).toBe(
      "S&C Coach generates the Strength & Conditioning plan.",
    );
    expect(display.statusMessage).toBe(OPERATIONAL_SUCCESS_MESSAGE_COPY);
  });

  it("describes complete W2A when Head Coach owns Skills and specialists cover other domains", () => {
    const display = describeAthletePlanningWorkflow([
      coach({
        coachProfileId: "hc",
        role: "HEAD_COACH",
        functions: ["SKILLS_COACH"],
        canGeneratePlan: true,
      }),
      nutritionEnabled,
      sandCEnabled,
    ]);

    expect(display.workflowId).toBe("W2A");
    expect(display.operational).toBe(true);
    expect(display.headCoachLabel).toBe(
      "Head Coach builds the Planning Context and generates the Skills plan.",
    );
    expect(display.domainLines.find((l) => l.domain === "SKILLS")?.canGeneratePlan).toBe(
      true,
    );
    expect(display.domainLines.find((l) => l.domain === "NUTRITION")?.summary).toBe(
      "Nutrition Coach generates the Nutrition plan.",
    );
  });

  it("describes complete W2B when Head Coach has Skills capability and a separate Skills Coach generates", () => {
    const display = describeAthletePlanningWorkflow([
      coach({
        coachProfileId: "hc",
        role: "HEAD_COACH",
        functions: ["SKILLS_COACH"],
        canGeneratePlan: false,
      }),
      skillsEnabled,
      nutritionEnabled,
      sandCEnabled,
    ]);

    expect(display.workflowId).toBe("W2B");
    expect(display.operational).toBe(true);
    expect(display.headCoachLabel).toBe(
      "Head Coach builds the Planning Context only.",
    );
    expect(display.domainLines.find((l) => l.domain === "SKILLS")?.ownerCoachProfileId).toBe(
      "skills",
    );
    expect(display.domainLines.find((l) => l.domain === "SKILLS")?.summary).toBe(
      "Skills Coach generates the Skills plan.",
    );
    expect(display.domainLines.find((l) => l.domain === "SKILLS")?.summary).not.toContain(
      "Head Coach generates",
    );
  });

  it("describes complete W3 with Skills Coach building Planning Context and generating Skills", () => {
    const display = describeAthletePlanningWorkflow([
      skillsEnabled,
      nutritionEnabled,
      sandCEnabled,
    ]);

    expect(display.workflowId).toBe("W3");
    expect(display.workflowTitle).toBe("W3 — No Head Coach");
    expect(display.workflowTitle).not.toMatch(/release/i);
    expect(display.headCoachAssigned).toBe(false);
    expect(display.operational).toBe(true);
    expect(display.domainLines.find((l) => l.domain === "SKILLS")?.summary).toBe(
      "Skills Coach builds the Planning Context and generates the Skills plan.",
    );
    expect(display.domainLines.find((l) => l.domain === "NUTRITION")?.summary).toBe(
      "Nutrition Coach generates the Nutrition plan.",
    );
    expect(display.domainLines.find((l) => l.domain === "S_AND_C")?.summary).toBe(
      "S&C Coach generates the Strength & Conditioning plan.",
    );
  });

  it("does not label a no-Head-Coach assignment as W3 when Skills Coach is missing", () => {
    const display = describeAthletePlanningWorkflow([
      nutritionEnabled,
      sandCEnabled,
    ]);

    expect(display.workflowId).toBeNull();
    expect(display.workflowTitle).toBe(INCOMPLETE_PLANNING_CONFIGURATION_TITLE);
    expect(display.operational).toBe(false);
    expect(display.statusMessage).toBeNull();
    expect(display.headCoachLabel).toBe("No Head Coach is assigned.");
    expect(display.domainLines.find((l) => l.domain === "SKILLS")?.summary).toBe(
      "No Skills Coach is assigned.",
    );
    expect(display.domainLines.find((l) => l.domain === "NUTRITION")?.summary).toBe(
      "Nutrition Coach is assigned and plan generation is enabled.",
    );
    expect(display.domainLines.find((l) => l.domain === "S_AND_C")?.summary).toBe(
      "S&C Coach is assigned and plan generation is enabled.",
    );
    expect(display.guidanceLine).toBe(
      "A Skills Coach is required to establish Workflow 3.",
    );
    expect(display.statusMessage).not.toBe(OPERATIONAL_SUCCESS_MESSAGE_COPY);
  });

  it("does not identify W1 when a required structural coach is missing", () => {
    const display = describeAthletePlanningWorkflow([
      coach({
        coachProfileId: "hc",
        role: "HEAD_COACH",
        functions: [],
        canGeneratePlan: false,
      }),
      skillsEnabled,
      sandCEnabled,
    ]);
    expect(display.workflowId).toBeNull();
    expect(display.workflowTitle).toBe(INCOMPLETE_PLANNING_CONFIGURATION_TITLE);
  });

  it("does not identify W2A when a required specialist is missing", () => {
    const display = describeAthletePlanningWorkflow([
      coach({
        coachProfileId: "hc",
        role: "HEAD_COACH",
        functions: ["SKILLS_COACH"],
        canGeneratePlan: true,
      }),
      nutritionEnabled,
    ]);
    expect(display.workflowId).toBeNull();
    expect(display.workflowTitle).toBe(INCOMPLETE_PLANNING_CONFIGURATION_TITLE);
  });

  it("does not identify W2B when a required specialist is missing", () => {
    const display = describeAthletePlanningWorkflow([
      coach({
        coachProfileId: "hc",
        role: "HEAD_COACH",
        functions: ["SKILLS_COACH"],
        canGeneratePlan: false,
      }),
      skillsEnabled,
      nutritionEnabled,
    ]);
    expect(display.workflowId).toBeNull();
    expect(display.workflowTitle).toBe(INCOMPLETE_PLANNING_CONFIGURATION_TITLE);
  });

  it("keeps a valid workflow id when a required generator has canGeneratePlan false", () => {
    const display = describeAthletePlanningWorkflow([
      coach({
        coachProfileId: "hc",
        role: "HEAD_COACH",
        functions: ["SKILLS_COACH"],
        canGeneratePlan: true,
      }),
      coach({
        coachProfileId: "nut",
        functions: ["NUTRITION_COACH"],
        canGeneratePlan: false,
      }),
      sandCEnabled,
    ]);

    expect(display.workflowId).toBe("W2A");
    expect(display.operational).toBe(false);
    expect(display.statusMessage).not.toBe(OPERATIONAL_SUCCESS_MESSAGE_COPY);
    const nutrition = display.domainLines.find((l) => l.domain === "NUTRITION");
    expect(nutrition?.assigned).toBe(true);
    expect(nutrition?.canGeneratePlan).toBe(false);
    expect(nutrition?.summary).toContain(PLAN_GENERATION_NOT_ENABLED_COPY);
    expect(nutrition?.summary).not.toContain("generates the Nutrition plan");
  });

  it("reads canGeneratePlan from existing assignment data and does not mutate it", () => {
    const nutrition = coach({
      coachProfileId: "nut",
      functions: ["NUTRITION_COACH"],
      canGeneratePlan: false,
    });
    Object.freeze(nutrition);
    const display = describeAthletePlanningWorkflow([
      coach({
        coachProfileId: "hc",
        role: "HEAD_COACH",
        functions: ["SKILLS_COACH"],
        canGeneratePlan: true,
      }),
      nutrition,
      sandCEnabled,
    ]);
    expect(nutrition.canGeneratePlan).toBe(false);
    expect(display.domainLines.find((l) => l.domain === "NUTRITION")?.canGeneratePlan).toBe(
      false,
    );

    const enabled = describeAthletePlanningWorkflow([
      coach({
        coachProfileId: "hc",
        role: "HEAD_COACH",
        functions: ["SKILLS_COACH"],
        canGeneratePlan: true,
      }),
      nutritionEnabled,
      sandCEnabled,
    ]);
    expect(enabled.domainLines.find((l) => l.domain === "NUTRITION")?.canGeneratePlan).toBe(
      true,
    );
    expect(enabled.domainLines.find((l) => l.domain === "NUTRITION")?.summary).toBe(
      "Nutrition Coach generates the Nutrition plan.",
    );
  });
});
