import { describe, expect, it } from "vitest";

import { parseTrainingPlanWorkspacePayload } from "@/lib/api/trainingPlanWorkspace";

describe("parseTrainingPlanWorkspacePayload", () => {
  it("preserves Workflow 2A Head Coach Skills owner workspace fields", () => {
    const workspace = parseTrainingPlanWorkspacePayload({
      workflowShape: "HEAD_COACH_SKILLS_OWNER",
      shell: "HEAD_COACH_FUNCTION_AWARE",
      workflowMode: "HEAD_COACH_FUNCTION_AWARE",
      currentDomain: "SKILLS",
      initialTab: "DOMAIN",
      planningContext: {
        planningContextLocked: true,
        resolved: true,
      },
      ownershipFlags: {
        hasHeadCoach: true,
        requesterIsHeadCoach: true,
        requesterHasSkillsFunction: true,
        requesterOwnsCurrentDomain: true,
        requesterOwnsSkillsForThisAthlete: true,
        requesterOwnsNutritionForThisAthlete: false,
        requesterOwnsStrengthForThisAthlete: false,
        headCoachOwnsPlanningContext: true,
      },
      domains: {
        SKILLS: {
          reviewAccess: "HEAD_COACH",
          canOpen: true,
          allowedActions: [],
          summary: {
            generationDomain: "SKILLS",
            status: null,
            trainingPlanId: null,
            versionId: null,
          },
        },
      },
    });

    expect(workspace.workflowShape).toBe("HEAD_COACH_SKILLS_OWNER");
    expect(workspace.shell).toBe("HEAD_COACH_FUNCTION_AWARE");
    expect(workspace.currentDomain).toBe("SKILLS");
    expect(workspace.initialTab).toBe("DOMAIN");
    expect(workspace.planningContext.locked).toBe(true);
    expect(workspace.ownershipFlags.requesterOwnsCurrentDomain).toBe(true);
    expect(workspace.ownershipFlags.requesterOwnsSkillsForThisAthlete).toBe(true);
    expect(workspace.ownershipFlags.requesterOwnsNutritionForThisAthlete).toBe(false);
    expect(workspace.ownershipFlags.requesterOwnsStrengthForThisAthlete).toBe(false);
    expect(workspace.domains.SKILLS.reviewAccess).toBe("HEAD_COACH");
    expect(workspace.domains.SKILLS.canOpen).toBe(true);
    expect(workspace.domains.SKILLS.allowedActions).toEqual([]);
    expect(workspace.domains.SKILLS.summary.trainingPlanId).toBeNull();
    expect(workspace.domains.SKILLS.summary.versionId).toBeNull();
  });
});
