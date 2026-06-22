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
    expect(workspace.assignmentContext).toBeUndefined();
  });

  it("preserves assignmentContext planning and domain permissions", () => {
    const workspace = parseTrainingPlanWorkspacePayload({
      data: {
        entityId: "entity-1",
        athleteId: "athlete-1",
        workflowShape: "HEAD_COACH_APPROVAL",
        shell: "SPECIALIST_DOMAIN",
        workflowMode: "SPECIALIST_DOMAIN",
        currentDomain: "NUTRITION",
        initialTab: "GENERATE",
        planningContext: {
          locked: true,
          resolved: true,
          lockId: "lock-1",
          snapshotId: "snapshot-1",
          seasonCycleId: "season-cycle-1",
        },
        ownershipFlags: {
          hasHeadCoach: true,
          requesterIsHeadCoach: false,
          requesterHasSkillsFunction: false,
          requesterOwnsCurrentDomain: true,
          headCoachOwnsPlanningContext: false,
          directReleaseAllowed: false,
        },
        domains: {
          SKILLS: {
            canOpen: false,
            summary: {
              generationDomain: "SKILLS",
              trainingPlanId: "skills-plan",
              versionId: "skills-version",
              status: "ASSISTANT_COACH_APPROVED",
            },
          },
          NUTRITION: {
            canOpen: true,
            allowedActions: ["SUBMIT_REVIEW"],
            summary: {
              generationDomain: "NUTRITION",
              trainingPlanId: "nutrition-plan",
              versionId: "nutrition-version",
              status: "AI_GENERATED",
            },
          },
          S_AND_C: {
            canOpen: false,
            summary: {
              generationDomain: "S_AND_C",
              trainingPlanId: null,
              versionId: null,
              status: null,
            },
          },
        },
        assignmentContext: {
          hasHeadCoach: true,
          releaseMode: "HEAD_COACH_APPROVAL",
          planningContext: {
            ownerType: "HEAD_COACH",
            ownerUserId: "hc-user",
            ownerCoachProfileId: "hc-profile",
            canRead: true,
            canCreate: false,
            canLock: false,
            canManage: false,
            blockers: ["Planning context already locked"],
          },
          domains: {
            SKILLS: {
              ownerType: "ASSIGNED_DOMAIN_COACH",
              ownerUserId: "skills-user",
              ownerCoachProfileId: "skills-profile",
              ownedByCurrentUser: false,
              canOpen: false,
              canGenerate: false,
              canRevise: false,
              canSubmitForReview: false,
              canApprove: false,
              canRelease: false,
              releaseMode: "HEAD_COACH_APPROVAL",
              blockers: ["Assigned to another coach"],
            },
            NUTRITION: {
              ownerType: "ASSIGNED_DOMAIN_COACH",
              ownerUserId: "nutrition-user",
              ownerCoachProfileId: "nutrition-profile",
              ownedByCurrentUser: true,
              canOpen: true,
              canGenerate: true,
              canRevise: true,
              canSubmitForReview: true,
              canApprove: false,
              canRelease: false,
              releaseMode: "HEAD_COACH_APPROVAL",
              blockers: [],
            },
            S_AND_C: {
              ownerType: "NONE",
              ownerUserId: null,
              ownerCoachProfileId: null,
              ownedByCurrentUser: false,
              canOpen: false,
              canGenerate: false,
              canRevise: false,
              canSubmitForReview: false,
              canApprove: false,
              canRelease: false,
              releaseMode: "DIRECT_DOMAIN_RELEASE",
            },
          },
        },
      },
    });

    expect(workspace.entityId).toBe("entity-1");
    expect(workspace.athleteId).toBe("athlete-1");
    expect(workspace.planningContext.locked).toBe(true);
    expect(workspace.domains.NUTRITION.summary.trainingPlanId).toBe("nutrition-plan");
    expect(workspace.domains.NUTRITION.allowedActions).toEqual(["SUBMIT_REVIEW"]);

    expect(workspace.assignmentContext).toBeDefined();
    expect(workspace.assignmentContext?.hasHeadCoach).toBe(true);
    expect(workspace.assignmentContext?.releaseMode).toBe("HEAD_COACH_APPROVAL");
    expect(workspace.assignmentContext?.planningContext).toEqual({
      ownerType: "HEAD_COACH",
      ownerUserId: "hc-user",
      ownerCoachProfileId: "hc-profile",
      canRead: true,
      canCreate: false,
      canLock: false,
      canManage: false,
      blockers: ["Planning context already locked"],
    });
    expect(workspace.assignmentContext?.domains.SKILLS).toEqual({
      ownerType: "ASSIGNED_DOMAIN_COACH",
      ownerUserId: "skills-user",
      ownerCoachProfileId: "skills-profile",
      ownedByCurrentUser: false,
      canOpen: false,
      canGenerate: false,
      canRevise: false,
      canSubmitForReview: false,
      canApprove: false,
      canRelease: false,
      releaseMode: "HEAD_COACH_APPROVAL",
      blockers: ["Assigned to another coach"],
    });
    expect(workspace.assignmentContext?.domains.NUTRITION).toEqual({
      ownerType: "ASSIGNED_DOMAIN_COACH",
      ownerUserId: "nutrition-user",
      ownerCoachProfileId: "nutrition-profile",
      ownedByCurrentUser: true,
      canOpen: true,
      canGenerate: true,
      canRevise: true,
      canSubmitForReview: true,
      canApprove: false,
      canRelease: false,
      releaseMode: "HEAD_COACH_APPROVAL",
      blockers: [],
    });
    expect(workspace.assignmentContext?.domains.S_AND_C).toEqual({
      ownerType: "NONE",
      ownerUserId: null,
      ownerCoachProfileId: null,
      ownedByCurrentUser: false,
      canOpen: false,
      canGenerate: false,
      canRevise: false,
      canSubmitForReview: false,
      canApprove: false,
      canRelease: false,
      releaseMode: "DIRECT_DOMAIN_RELEASE",
    });
  });
});
