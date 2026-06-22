import { describe, expect, it } from "vitest";

import { deriveTrainingPlanWorkspaceTabStates } from "@/lib/trainingPlanWorkspaceTabs";
import type { TrainingPlanWorkspace } from "@/types/trainingPlanWorkspace";

type Domain = "SKILLS" | "NUTRITION" | "S_AND_C";

function emptyDomain(generationDomain: Domain) {
  return {
    summary: {
      trainingPlanId: null,
      versionId: null,
      generationDomain,
      status: null,
      versionNumber: null,
    },
    reviewAccess: null,
    releaseMode: null,
    submittedForReview: false,
    canOpen: false,
    allowedActions: [] as string[],
  };
}

function domainWithPlan(generationDomain: Domain, status = "HEAD_COACH_APPROVED") {
  return {
    ...emptyDomain(generationDomain),
    summary: {
      trainingPlanId: `${generationDomain.toLowerCase()}-plan`,
      versionId: `${generationDomain.toLowerCase()}-version`,
      generationDomain,
      status,
      versionNumber: 1,
    },
  };
}

function assignmentDomain(
  overrides: Partial<
    NonNullable<TrainingPlanWorkspace["assignmentContext"]>["domains"]["SKILLS"]
  > = {},
): NonNullable<TrainingPlanWorkspace["assignmentContext"]>["domains"]["SKILLS"] {
  return {
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
    releaseMode: "HEAD_COACH_APPROVAL",
    ...overrides,
  };
}

function assignmentContext(
  overrides: Partial<NonNullable<TrainingPlanWorkspace["assignmentContext"]>> = {},
): NonNullable<TrainingPlanWorkspace["assignmentContext"]> {
  return {
    hasHeadCoach: true,
    releaseMode: "HEAD_COACH_APPROVAL",
    planningContext: {
      ownerType: "HEAD_COACH",
      ownerUserId: "head-coach",
      ownerCoachProfileId: "head-coach-profile",
      canRead: true,
      canCreate: true,
      canLock: true,
      canManage: true,
    },
    domains: {
      SKILLS: assignmentDomain(),
      NUTRITION: assignmentDomain(),
      S_AND_C: assignmentDomain(),
    },
    ...overrides,
  };
}

function baseWorkspace(
  overrides: Partial<TrainingPlanWorkspace> = {},
): TrainingPlanWorkspace {
  return {
    entityId: "entity-1",
    athleteId: "athlete-1",
    workflowShape: "WORKFLOW_1",
    shell: "head_coach_review",
    workflowMode: "head_coach_review",
    currentDomain: null,
    initialTab: null,
    planningContext: {
      locked: true,
      resolved: true,
      lockId: "lock-1",
      snapshotId: null,
      goalIds: ["goal-1"],
      lockedGoalIds: ["goal-1"],
    },
    ownershipFlags: {
      hasHeadCoach: true,
      requesterIsHeadCoach: true,
      requesterHasSkillsFunction: false,
      requesterOwnsCurrentDomain: false,
      headCoachOwnsPlanningContext: true,
      directReleaseAllowed: false,
    },
    blockers: [],
    domains: {
      SKILLS: emptyDomain("SKILLS"),
      NUTRITION: emptyDomain("NUTRITION"),
      S_AND_C: emptyDomain("S_AND_C"),
    },
    ...overrides,
  };
}

describe("deriveTrainingPlanWorkspaceTabStates", () => {
  it("maps Workflow 1 Head Coach to planning, review, and release authority", () => {
    const tabs = deriveTrainingPlanWorkspaceTabStates(
      baseWorkspace({
        domains: {
          SKILLS: domainWithPlan("SKILLS"),
          NUTRITION: domainWithPlan("NUTRITION"),
          S_AND_C: domainWithPlan("S_AND_C"),
        },
        assignmentContext: assignmentContext({
          domains: {
            SKILLS: assignmentDomain({ canApprove: true, canRelease: true }),
            NUTRITION: assignmentDomain({ canApprove: true, canRelease: true }),
            S_AND_C: assignmentDomain({ canApprove: true, canRelease: true }),
          },
        }),
      }),
    );

    expect(tabs.APP_READINESS).toMatchObject({ visible: true, readOnly: true });
    expect(tabs.GOALS).toMatchObject({ enabled: true, primaryAction: "MANAGE_GOALS" });
    expect(tabs.PLANNING_CONTEXT).toMatchObject({
      enabled: true,
      primaryAction: "MANAGE_PLANNING_CONTEXT",
    });
    expect(tabs.GENERATE_PLAN).toMatchObject({
      enabled: false,
      readOnly: true,
      emptyState: "NO_OWNED_GENERATION_DOMAIN",
    });
    expect(tabs.REVIEW_REVISE).toMatchObject({
      enabled: true,
      primaryAction: "REVIEW_DOMAIN_PLANS",
    });
    expect(tabs.RELEASE).toMatchObject({
      enabled: true,
      primaryAction: "RELEASE_TO_ATHLETE",
    });
  });

  it("maps Workflow 1 domain coach to own generation and revise/submit without release", () => {
    const tabs = deriveTrainingPlanWorkspaceTabStates(
      baseWorkspace({
        assignmentContext: assignmentContext({
          planningContext: {
            ownerType: "HEAD_COACH",
            ownerUserId: "head-coach",
            ownerCoachProfileId: "head-coach-profile",
            canRead: true,
            canCreate: false,
            canLock: false,
            canManage: false,
          },
          domains: {
            SKILLS: assignmentDomain({
              ownerType: "ASSIGNED_DOMAIN_COACH",
              ownedByCurrentUser: true,
              canGenerate: true,
              canRevise: true,
              canSubmitForReview: true,
            }),
            NUTRITION: assignmentDomain(),
            S_AND_C: assignmentDomain(),
          },
        }),
      }),
    );

    expect(tabs.GOALS).toMatchObject({ enabled: false, readOnly: true });
    expect(tabs.PLANNING_CONTEXT).toMatchObject({ enabled: false, readOnly: true });
    expect(tabs.GENERATE_PLAN).toMatchObject({
      enabled: true,
      primaryAction: "GENERATE_OWN_DOMAIN_PLAN",
      emptyState: "NO_OWNED_DOMAIN_PLAN",
    });
    expect(tabs.REVIEW_REVISE).toMatchObject({
      enabled: true,
      primaryAction: "REVISE_OR_SUBMIT_OWN_DOMAIN_PLAN",
    });
    expect(tabs.RELEASE).toMatchObject({
      enabled: false,
      readOnly: true,
      emptyState: "NO_RELEASABLE_DOMAIN",
    });
  });

  it("maps Workflow 2A Head Coach to Skills generation and Head Coach review release", () => {
    const tabs = deriveTrainingPlanWorkspaceTabStates(
      baseWorkspace({
        domains: {
          SKILLS: domainWithPlan("SKILLS", "DRAFT"),
          NUTRITION: domainWithPlan("NUTRITION"),
          S_AND_C: domainWithPlan("S_AND_C"),
        },
        assignmentContext: assignmentContext({
          domains: {
            SKILLS: assignmentDomain({
              ownerType: "HEAD_COACH_SELF",
              ownedByCurrentUser: true,
              canGenerate: true,
              canRevise: true,
              canSubmitForReview: true,
              canApprove: false,
            }),
            NUTRITION: assignmentDomain({ canApprove: true, canRelease: true }),
            S_AND_C: assignmentDomain({ canApprove: true, canRelease: true }),
          },
        }),
      }),
    );

    expect(tabs.GENERATE_PLAN).toMatchObject({
      enabled: true,
      primaryAction: "GENERATE_OWN_DOMAIN_PLAN",
      emptyState: "NONE",
    });
    expect(tabs.REVIEW_REVISE).toMatchObject({
      enabled: true,
      primaryAction: "REVIEW_DOMAIN_PLANS",
    });
    expect(tabs.RELEASE).toMatchObject({
      enabled: true,
      primaryAction: "RELEASE_TO_ATHLETE",
    });
  });

  it("maps Workflow 2B Head Coach to review/release without owned generation", () => {
    const tabs = deriveTrainingPlanWorkspaceTabStates(
      baseWorkspace({
        domains: {
          SKILLS: domainWithPlan("SKILLS"),
          NUTRITION: domainWithPlan("NUTRITION"),
          S_AND_C: domainWithPlan("S_AND_C"),
        },
        assignmentContext: assignmentContext({
          domains: {
            SKILLS: assignmentDomain({
              ownerType: "ASSIGNED_DOMAIN_COACH",
              ownedByCurrentUser: false,
              canGenerate: false,
              canApprove: true,
              canRelease: true,
            }),
            NUTRITION: assignmentDomain({ canApprove: true, canRelease: true }),
            S_AND_C: assignmentDomain({ canApprove: true, canRelease: true }),
          },
        }),
      }),
    );

    expect(tabs.GENERATE_PLAN).toMatchObject({
      enabled: false,
      readOnly: true,
      emptyState: "NO_OWNED_GENERATION_DOMAIN",
    });
    expect(tabs.REVIEW_REVISE).toMatchObject({
      enabled: true,
      primaryAction: "REVIEW_DOMAIN_PLANS",
    });
    expect(tabs.RELEASE).toMatchObject({ enabled: true });
  });

  it("maps Workflow 3 Skills fallback to planning, Skills generation, revise, and direct release", () => {
    const tabs = deriveTrainingPlanWorkspaceTabStates(
      baseWorkspace({
        domains: {
          SKILLS: domainWithPlan("SKILLS", "ACTIVE"),
          NUTRITION: emptyDomain("NUTRITION"),
          S_AND_C: emptyDomain("S_AND_C"),
        },
        assignmentContext: assignmentContext({
          hasHeadCoach: false,
          releaseMode: "DIRECT_DOMAIN_RELEASE",
          planningContext: {
            ownerType: "SKILLS_FALLBACK",
            ownerUserId: "skills-coach",
            ownerCoachProfileId: "skills-profile",
            canRead: true,
            canCreate: true,
            canLock: true,
            canManage: true,
          },
          domains: {
            SKILLS: assignmentDomain({
              ownerType: "ASSIGNED_DOMAIN_COACH",
              ownedByCurrentUser: true,
              canGenerate: true,
              canRevise: true,
              canSubmitForReview: true,
              canRelease: true,
              releaseMode: "DIRECT_DOMAIN_RELEASE",
            }),
            NUTRITION: assignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
            S_AND_C: assignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
          },
        }),
      }),
    );

    expect(tabs.GOALS).toMatchObject({ enabled: true, primaryAction: "MANAGE_GOALS" });
    expect(tabs.PLANNING_CONTEXT).toMatchObject({
      enabled: true,
      primaryAction: "MANAGE_PLANNING_CONTEXT",
    });
    expect(tabs.GENERATE_PLAN).toMatchObject({ enabled: true });
    expect(tabs.REVIEW_REVISE).toMatchObject({
      enabled: true,
      primaryAction: "REVISE_OR_SUBMIT_OWN_DOMAIN_PLAN",
    });
    expect(tabs.RELEASE).toMatchObject({
      enabled: true,
      primaryAction: "RELEASE_TO_ATHLETE",
    });
  });

  it("maps Workflow 3 Nutrition/S&C coach to own generation, revise, and direct release only", () => {
    const tabs = deriveTrainingPlanWorkspaceTabStates(
      baseWorkspace({
        domains: {
          SKILLS: domainWithPlan("SKILLS", "ACTIVE"),
          NUTRITION: domainWithPlan("NUTRITION", "ACTIVE"),
          S_AND_C: emptyDomain("S_AND_C"),
        },
        assignmentContext: assignmentContext({
          hasHeadCoach: false,
          releaseMode: "DIRECT_DOMAIN_RELEASE",
          planningContext: {
            ownerType: "SKILLS_FALLBACK",
            ownerUserId: "skills-coach",
            ownerCoachProfileId: "skills-profile",
            canRead: true,
            canCreate: false,
            canLock: false,
            canManage: false,
          },
          domains: {
            SKILLS: assignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
            NUTRITION: assignmentDomain({
              ownerType: "ASSIGNED_DOMAIN_COACH",
              ownedByCurrentUser: true,
              canGenerate: true,
              canRevise: true,
              canSubmitForReview: true,
              canRelease: true,
              releaseMode: "DIRECT_DOMAIN_RELEASE",
            }),
            S_AND_C: assignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
          },
        }),
      }),
    );

    expect(tabs.GOALS).toMatchObject({ enabled: false, readOnly: true });
    expect(tabs.PLANNING_CONTEXT).toMatchObject({ enabled: false, readOnly: true });
    expect(tabs.GENERATE_PLAN).toMatchObject({ enabled: true });
    expect(tabs.REVIEW_REVISE).toMatchObject({
      enabled: true,
      primaryAction: "REVISE_OR_SUBMIT_OWN_DOMAIN_PLAN",
    });
    expect(tabs.RELEASE).toMatchObject({
      enabled: true,
      primaryAction: "RELEASE_TO_ATHLETE",
    });
  });

  it("returns conservative read-only defaults when assignmentContext is missing", () => {
    const tabs = deriveTrainingPlanWorkspaceTabStates(baseWorkspace());

    for (const tab of Object.values(tabs)) {
      expect(tab).toMatchObject({
        visible: true,
        enabled: false,
        readOnly: true,
        emptyState: "ASSIGNMENT_CONTEXT_MISSING",
        source: "ASSIGNMENT_CONTEXT_MISSING",
      });
    }
  });
});
