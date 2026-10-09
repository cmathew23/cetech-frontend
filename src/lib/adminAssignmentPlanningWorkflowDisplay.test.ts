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

function skillsLine(
  display: ReturnType<typeof describeAthletePlanningWorkflow>,
) {
  return display.domainLines.find((l) => l.domain === "SKILLS");
}
function nutritionLine(
  display: ReturnType<typeof describeAthletePlanningWorkflow>,
) {
  return display.domainLines.find((l) => l.domain === "NUTRITION");
}
function sandCLine(
  display: ReturnType<typeof describeAthletePlanningWorkflow>,
) {
  return display.domainLines.find((l) => l.domain === "S_AND_C");
}

const headCoachNoSkills = coach({
  coachProfileId: "hc",
  role: "HEAD_COACH",
  functions: [],
  canGeneratePlan: false,
});
const headCoachSkillsGenerator = coach({
  coachProfileId: "hc",
  role: "HEAD_COACH",
  functions: ["SKILLS_COACH"],
  canGeneratePlan: true,
});
const headCoachSkillsNonGenerator = coach({
  coachProfileId: "hc",
  role: "HEAD_COACH",
  functions: ["SKILLS_COACH"],
  canGeneratePlan: false,
});
const chrisBakerGenerator = coach({
  coachProfileId: "chris-baker",
  displayName: "Chris Baker",
  role: "HEAD_COACH",
  functions: ["SKILLS_COACH"],
  canGeneratePlan: true,
});
const chrisBakerNonGenerator = coach({
  coachProfileId: "chris-baker",
  displayName: "Chris Baker",
  role: "HEAD_COACH",
  functions: ["SKILLS_COACH"],
  canGeneratePlan: false,
});
const tedBallNonGenerator = coach({
  coachProfileId: "ted-ball",
  displayName: "Ted Ball",
  functions: ["SKILLS_COACH"],
  canGeneratePlan: false,
});
const tedBallGenerator = coach({
  coachProfileId: "ted-ball",
  displayName: "Ted Ball",
  functions: ["SKILLS_COACH"],
  canGeneratePlan: true,
});

describe("describeAthletePlanningWorkflow", () => {
  describe("canonical complete workflows (table-driven)", () => {
    it.each([
      {
        label: "W1",
        coaches: [headCoachNoSkills, skillsEnabled, nutritionEnabled, sandCEnabled],
        workflowId: "W1" as const,
        workflowTitle: "W1 — Head Coach reviews; domain coaches generate",
        headCoachLabel: "Head Coach builds the Planning Context.",
        skillsSummary: "Skills Coach generates the Skills plan.",
        skillsOwnerId: "skills",
        nutritionSummary: "Nutrition Coach generates the Nutrition plan.",
        sandCSummary: "S&C Coach generates the Strength & Conditioning plan.",
      },
      {
        label: "W2A",
        coaches: [headCoachSkillsGenerator, nutritionEnabled, sandCEnabled],
        workflowId: "W2A" as const,
        workflowTitle:
          "W2A — Head Coach generates Skills; specialists generate other domains",
        headCoachLabel:
          "Head Coach builds the Planning Context and generates the Skills plan.",
        skillsSummary:
          "Head Coach builds the Planning Context and generates the Skills plan.",
        skillsOwnerId: "hc",
        nutritionSummary: "Nutrition Coach generates the Nutrition plan.",
        sandCSummary: "S&C Coach generates the Strength & Conditioning plan.",
      },
      {
        label: "W2A Athlete 701",
        coaches: [
          chrisBakerGenerator,
          tedBallNonGenerator,
          nutritionEnabled,
          sandCEnabled,
        ],
        workflowId: "W2A" as const,
        workflowTitle:
          "W2A — Head Coach generates Skills; specialists generate other domains",
        headCoachLabel:
          "Head Coach builds the Planning Context and generates the Skills plan.",
        skillsSummary:
          "Head Coach builds the Planning Context and generates the Skills plan.",
        skillsOwnerId: "chris-baker",
        nutritionSummary: "Nutrition Coach generates the Nutrition plan.",
        sandCSummary: "S&C Coach generates the Strength & Conditioning plan.",
      },
      {
        label: "W2B",
        coaches: [
          headCoachSkillsNonGenerator,
          skillsEnabled,
          nutritionEnabled,
          sandCEnabled,
        ],
        workflowId: "W2B" as const,
        workflowTitle:
          "W2B — Head Coach reviews; separate Skills Coach generates Skills",
        headCoachLabel: "Head Coach builds the Planning Context only.",
        skillsSummary: "Skills Coach generates the Skills plan.",
        skillsOwnerId: "skills",
        nutritionSummary: "Nutrition Coach generates the Nutrition plan.",
        sandCSummary: "S&C Coach generates the Strength & Conditioning plan.",
      },
      {
        label: "W2B Athlete 702",
        coaches: [
          chrisBakerNonGenerator,
          tedBallGenerator,
          nutritionEnabled,
          sandCEnabled,
        ],
        workflowId: "W2B" as const,
        workflowTitle:
          "W2B — Head Coach reviews; separate Skills Coach generates Skills",
        headCoachLabel: "Head Coach builds the Planning Context only.",
        skillsSummary: "Skills Coach generates the Skills plan.",
        skillsOwnerId: "ted-ball",
        nutritionSummary: "Nutrition Coach generates the Nutrition plan.",
        sandCSummary: "S&C Coach generates the Strength & Conditioning plan.",
      },
      {
        label: "W3",
        coaches: [skillsEnabled, nutritionEnabled, sandCEnabled],
        workflowId: "W3" as const,
        workflowTitle: "W3 — No Head Coach",
        headCoachLabel: "No Head Coach is assigned.",
        skillsSummary:
          "Skills Coach builds the Planning Context and generates the Skills plan.",
        skillsOwnerId: "skills",
        nutritionSummary: "Nutrition Coach generates the Nutrition plan.",
        sandCSummary: "S&C Coach generates the Strength & Conditioning plan.",
      },
    ])(
      "$label: workflowId, title, Head Coach, and domain generators",
      ({
        coaches,
        workflowId,
        workflowTitle,
        headCoachLabel,
        skillsSummary,
        skillsOwnerId,
        nutritionSummary,
        sandCSummary,
      }) => {
        const reversed = [...coaches].reverse();
        for (const input of [coaches, reversed]) {
          const display = describeAthletePlanningWorkflow(input);
          expect(display.workflowId).toBe(workflowId);
          expect(display.workflowTitle).toBe(workflowTitle);
          expect(display.headCoachLabel).toBe(headCoachLabel);
          expect(display.headCoachAssigned).toBe(workflowId !== "W3");
          expect(skillsLine(display)?.summary).toBe(skillsSummary);
          expect(skillsLine(display)?.ownerCoachProfileId).toBe(skillsOwnerId);
          expect(skillsLine(display)?.canGeneratePlan).toBe(true);
          expect(nutritionLine(display)?.summary).toBe(nutritionSummary);
          expect(sandCLine(display)?.summary).toBe(sandCSummary);
          expect(display.operational).toBe(true);
          expect(display.statusMessage).toBe(OPERATIONAL_SUCCESS_MESSAGE_COPY);
          expect(display.guidanceLine).toBeNull();
        }
      },
    );
  });

  it("does not let SKILLS capability with canGeneratePlan=false claim Skills generation", () => {
    const display = describeAthletePlanningWorkflow([
      chrisBakerGenerator,
      tedBallNonGenerator,
      nutritionEnabled,
      sandCEnabled,
    ]);
    expect(display.workflowId).toBe("W2A");
    expect(skillsLine(display)?.ownerCoachProfileId).toBe("chris-baker");
    expect(skillsLine(display)?.summary).not.toContain("Skills Coach generates");
  });

  it("does not classify W1 or W2B from presence of a separate Skills Coach alone", () => {
    const display = describeAthletePlanningWorkflow([
      headCoachSkillsGenerator,
      tedBallNonGenerator,
      nutritionEnabled,
      sandCEnabled,
    ]);
    expect(display.workflowId).not.toBe("W1");
    expect(display.workflowId).not.toBe("W2B");
    expect(display.workflowId).toBe("W2A");
  });

  it("does not classify W2A from Head Coach SKILLS capability when a separate Skills Coach owns generation", () => {
    const display = describeAthletePlanningWorkflow([
      headCoachSkillsNonGenerator,
      skillsEnabled,
      nutritionEnabled,
      sandCEnabled,
    ]);
    expect(display.workflowId).not.toBe("W2A");
    expect(display.workflowId).toBe("W2B");
  });

  it("does not invent a Head Coach for W3", () => {
    const display = describeAthletePlanningWorkflow([
      skillsEnabled,
      nutritionEnabled,
      sandCEnabled,
    ]);
    expect(display.workflowId).toBe("W3");
    expect(display.headCoachAssigned).toBe(false);
    expect(display.headCoachLabel).toBe("No Head Coach is assigned.");
    expect(display.headCoachLabel).not.toMatch(/Planning Context only/i);
    expect(display.headCoachLabel).not.toMatch(/generates the Skills plan/i);
  });

  it("does not silently pick W2A or W2B when both Skills-capable coaches own generation", () => {
    const display = describeAthletePlanningWorkflow([
      headCoachSkillsGenerator,
      skillsEnabled,
      nutritionEnabled,
      sandCEnabled,
    ]);
    expect(display.workflowId).toBeNull();
    expect(display.workflowTitle).toBe(INCOMPLETE_PLANNING_CONFIGURATION_TITLE);
  });

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

  it("describes Athlete 701 as W2A when Head Coach generates Skills and a separate Skills Coach does not", () => {
    const display = describeAthletePlanningWorkflow([
      coach({
        coachProfileId: "chris-baker",
        displayName: "Chris Baker",
        role: "HEAD_COACH",
        functions: ["SKILLS_COACH"],
        canGeneratePlan: true,
      }),
      coach({
        coachProfileId: "ted-ball",
        displayName: "Ted Ball",
        functions: ["SKILLS_COACH"],
        canGeneratePlan: false,
      }),
      nutritionEnabled,
      sandCEnabled,
    ]);

    expect(display.workflowId).toBe("W2A");
    expect(display.workflowTitle).toBe(
      "W2A — Head Coach generates Skills; specialists generate other domains",
    );
    expect(display.operational).toBe(true);
    expect(display.headCoachLabel).toBe(
      "Head Coach builds the Planning Context and generates the Skills plan.",
    );
    expect(display.domainLines.find((l) => l.domain === "SKILLS")?.ownerCoachProfileId).toBe(
      "chris-baker",
    );
    expect(display.domainLines.find((l) => l.domain === "SKILLS")?.summary).toBe(
      "Head Coach builds the Planning Context and generates the Skills plan.",
    );
    expect(display.domainLines.find((l) => l.domain === "SKILLS")?.summary).not.toContain(
      "Skills Coach generates",
    );
    expect(display.domainLines.find((l) => l.domain === "NUTRITION")?.summary).toBe(
      "Nutrition Coach generates the Nutrition plan.",
    );
    expect(display.domainLines.find((l) => l.domain === "S_AND_C")?.summary).toBe(
      "S&C Coach generates the Strength & Conditioning plan.",
    );
    expect(display.statusMessage).toBe(OPERATIONAL_SUCCESS_MESSAGE_COPY);
  });

  it("describes Athlete 702 as W2B when the separate Skills Coach generates and Head Coach does not", () => {
    const display = describeAthletePlanningWorkflow([
      coach({
        coachProfileId: "chris-baker",
        displayName: "Chris Baker",
        role: "HEAD_COACH",
        functions: ["SKILLS_COACH"],
        canGeneratePlan: false,
      }),
      coach({
        coachProfileId: "ted-ball",
        displayName: "Ted Ball",
        functions: ["SKILLS_COACH"],
        canGeneratePlan: true,
      }),
      nutritionEnabled,
      sandCEnabled,
    ]);

    expect(display.workflowId).toBe("W2B");
    expect(display.workflowTitle).toBe(
      "W2B — Head Coach reviews; separate Skills Coach generates Skills",
    );
    expect(display.operational).toBe(true);
    expect(display.headCoachLabel).toBe(
      "Head Coach builds the Planning Context only.",
    );
    expect(display.domainLines.find((l) => l.domain === "SKILLS")?.ownerCoachProfileId).toBe(
      "ted-ball",
    );
    expect(display.domainLines.find((l) => l.domain === "SKILLS")?.summary).toBe(
      "Skills Coach generates the Skills plan.",
    );
    expect(display.domainLines.find((l) => l.domain === "SKILLS")?.summary).not.toContain(
      "Head Coach generates",
    );
    expect(display.domainLines.find((l) => l.domain === "NUTRITION")?.summary).toBe(
      "Nutrition Coach generates the Nutrition plan.",
    );
    expect(display.domainLines.find((l) => l.domain === "S_AND_C")?.summary).toBe(
      "S&C Coach generates the Strength & Conditioning plan.",
    );
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

  it("does not treat a non-generating separate Skills Coach as W2B before they own generation", () => {
    const beforeEnable = describeAthletePlanningWorkflow([
      coach({
        coachProfileId: "hc",
        role: "HEAD_COACH",
        functions: ["SKILLS_COACH"],
        canGeneratePlan: false,
      }),
      coach({
        coachProfileId: "skills",
        functions: ["SKILLS_COACH"],
        canGeneratePlan: false,
      }),
      nutritionEnabled,
      sandCEnabled,
    ]);
    expect(beforeEnable.workflowId).toBe("W2A");
    expect(beforeEnable.operational).toBe(false);
    expect(beforeEnable.domainLines.find((l) => l.domain === "SKILLS")?.ownerCoachProfileId).toBe(
      "hc",
    );

    const afterEnable = describeAthletePlanningWorkflow([
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
    expect(afterEnable.workflowId).toBe("W2B");
    expect(afterEnable.operational).toBe(true);
    expect(
      afterEnable.domainLines.find((l) => l.domain === "SKILLS")?.canGeneratePlan,
    ).toBe(true);
    expect(afterEnable.domainLines.find((l) => l.domain === "SKILLS")?.ownerCoachProfileId).toBe(
      "skills",
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
