import { describe, expect, it } from "vitest";

import type { TrainingPlanWorkspace } from "@/types/trainingPlanWorkspace";
import {
  parseWorkspaceCurrentDomain,
  parseWorkspaceInitialTab,
  parseWorkspaceWorkflowMode,
  resolveEffectiveDownstreamPlanningContextLocked,
  resolveLegacyAssistantCreateButtonDisabled,
  resolveLegacyPlanningContextLocked,
  resolvePlanningContextLocked,
  resolveTrainingPlanTab6Authority,
  resolveWorkflowModeFromWorkspace,
  workspaceAssignedGenerationDomains,
  workspaceDomainHasPersistedPlanIds,
  workspaceDirectReleaseAllowed,
  workspaceHasSubmittedDomainPlans,
  workspaceHeadCoachCanCreateSkillsPlan,
  workspaceHeadCoachOwnsPlanningContext,
  workspaceHeadCoachOwnsSkillsForAthlete,
  workspaceResolveReleaseMode,
  workspaceShowsDomainSubmitReview,
} from "@/lib/trainingPlanWorkspaceView";

function emptyDomain(generationDomain: "SKILLS" | "NUTRITION" | "S_AND_C") {
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
    nextCycleAction: "NONE",
    planningContext: {
      locked: true,
      resolved: true,
      lockId: "lock-1",
      snapshotId: null,
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

function assignmentDomain(overrides: Partial<NonNullable<TrainingPlanWorkspace["assignmentContext"]>["domains"]["SKILLS"]> = {}) {
  return {
    ownerType: "NONE" as const,
    ownerUserId: null,
    ownerCoachProfileId: null,
    ownedByCurrentUser: false,
    canOpen: false,
    canGenerate: false,
    canRevise: false,
    canSubmitForReview: false,
    canApprove: false,
    canRelease: false,
    releaseMode: "HEAD_COACH_APPROVAL" as const,
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

describe("trainingPlanWorkspaceView", () => {
  it("maps backend workflow shell and mode tokens", () => {
    expect(parseWorkspaceWorkflowMode("HEAD_COACH_FUNCTION_AWARE")).toBe(
      "head_coach_function_aware",
    );
    expect(parseWorkspaceWorkflowMode("REVIEW_REQUIRED")).toBe("head_coach_review");
    expect(parseWorkspaceWorkflowMode("RELEASE_READY")).toBe("head_coach_review");
    expect(parseWorkspaceWorkflowMode("specialist_domain")).toBe("specialist_domain");
    expect(resolveWorkflowModeFromWorkspace(
      baseWorkspace({
        shell: "HEAD_COACH_REVIEW",
        workflowMode: "",
      }),
    )).toBe("head_coach_review");
    expect(resolveWorkflowModeFromWorkspace(
      baseWorkspace({
        shell: "HEAD_COACH_FUNCTION_AWARE",
        workflowMode: "HEAD_COACH_REVIEW",
      }),
    )).toBe("head_coach_function_aware");
  });

  it("parses current domain and initial tab", () => {
    expect(parseWorkspaceCurrentDomain("S_AND_C")).toBe("S_AND_C");
    expect(parseWorkspaceInitialTab("DOMAIN")).toBe("generate");
    expect(parseWorkspaceInitialTab("GENERATE_PLAN")).toBe("generate");
  });

  it("detects submitted domain plans from workspace domains", () => {
    const workspace = baseWorkspace({
      domains: {
        SKILLS: { ...emptyDomain("SKILLS"), submittedForReview: true },
        NUTRITION: emptyDomain("NUTRITION"),
        S_AND_C: emptyDomain("S_AND_C"),
      },
    });
    expect(workspaceHasSubmittedDomainPlans(workspace)).toBe(true);
  });

  it("prefers assignmentContext release mode over legacy direct release flags", () => {
    const headCoachApproval = baseWorkspace({
      ownershipFlags: {
        hasHeadCoach: false,
        requesterIsHeadCoach: false,
        requesterHasSkillsFunction: false,
        requesterOwnsCurrentDomain: true,
        headCoachOwnsPlanningContext: false,
        directReleaseAllowed: true,
      },
      assignmentContext: assignmentContext({
        releaseMode: "HEAD_COACH_APPROVAL",
      }),
    });

    expect(workspaceDirectReleaseAllowed(headCoachApproval)).toBe(false);
    expect(workspaceResolveReleaseMode(headCoachApproval)).toBe("head_coach_review");

    const directRelease = baseWorkspace({
      ownershipFlags: {
        hasHeadCoach: true,
        requesterIsHeadCoach: true,
        requesterHasSkillsFunction: false,
        requesterOwnsCurrentDomain: false,
        headCoachOwnsPlanningContext: true,
        directReleaseAllowed: false,
      },
      assignmentContext: assignmentContext({
        releaseMode: "DIRECT_DOMAIN_RELEASE",
      }),
    });

    expect(workspaceDirectReleaseAllowed(directRelease)).toBe(true);
    expect(workspaceResolveReleaseMode(directRelease)).toBe("direct_release");
  });

  it("prefers assignmentContext planning owner over legacy planning ownership flags", () => {
    expect(
      workspaceHeadCoachOwnsPlanningContext(
        baseWorkspace({
          ownershipFlags: {
            hasHeadCoach: true,
            requesterIsHeadCoach: true,
            requesterHasSkillsFunction: false,
            requesterOwnsCurrentDomain: false,
            headCoachOwnsPlanningContext: false,
            directReleaseAllowed: false,
          },
          assignmentContext: assignmentContext({
            planningContext: {
              ownerType: "HEAD_COACH",
              ownerUserId: "head-coach",
              ownerCoachProfileId: "head-coach-profile",
              canRead: true,
              canCreate: true,
              canLock: true,
              canManage: true,
            },
          }),
        }),
      ),
    ).toBe(true);

    for (const ownerType of ["SKILLS_FALLBACK", "NONE"] as const) {
      expect(
        workspaceHeadCoachOwnsPlanningContext(
          baseWorkspace({
            ownershipFlags: {
              hasHeadCoach: true,
              requesterIsHeadCoach: true,
              requesterHasSkillsFunction: false,
              requesterOwnsCurrentDomain: false,
              headCoachOwnsPlanningContext: true,
              directReleaseAllowed: false,
            },
            assignmentContext: assignmentContext({
              planningContext: {
                ownerType,
                ownerUserId: null,
                ownerCoachProfileId: null,
                canRead: true,
                canCreate: false,
                canLock: false,
                canManage: false,
              },
            }),
          }),
        ),
      ).toBe(false);
    }
  });

  it("prefers assignmentContext Skills ownership over legacy Skills ownership inference", () => {
    const headCoachSelf = baseWorkspace({
      ownershipFlags: {
        hasHeadCoach: true,
        requesterIsHeadCoach: true,
        requesterHasSkillsFunction: true,
        requesterOwnsCurrentDomain: false,
        requesterOwnsSkillsForThisAthlete: false,
        headCoachOwnsPlanningContext: true,
        directReleaseAllowed: false,
      },
      currentDomain: "NUTRITION",
      assignmentContext: assignmentContext({
        domains: {
          SKILLS: assignmentDomain({
            ownerType: "HEAD_COACH_SELF",
            ownedByCurrentUser: true,
          }),
          NUTRITION: assignmentDomain(),
          S_AND_C: assignmentDomain(),
        },
      }),
    });

    expect(workspaceHeadCoachOwnsSkillsForAthlete(headCoachSelf)).toBe(true);

    const assignedSkillsCoach = baseWorkspace({
      ownershipFlags: {
        hasHeadCoach: true,
        requesterIsHeadCoach: true,
        requesterHasSkillsFunction: true,
        requesterOwnsCurrentDomain: true,
        requesterOwnsSkillsForThisAthlete: true,
        headCoachOwnsPlanningContext: true,
        directReleaseAllowed: false,
      },
      currentDomain: "SKILLS",
      domains: {
        SKILLS: {
          ...emptyDomain("SKILLS"),
          allowedActions: ["SUBMIT_REVIEW", "RELEASE"],
        },
        NUTRITION: emptyDomain("NUTRITION"),
        S_AND_C: emptyDomain("S_AND_C"),
      },
      assignmentContext: assignmentContext({
        domains: {
          SKILLS: assignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
          }),
          NUTRITION: assignmentDomain(),
          S_AND_C: assignmentDomain(),
        },
      }),
    });

    expect(workspaceHeadCoachOwnsSkillsForAthlete(assignedSkillsCoach)).toBe(false);
  });

  it("Workflow 2: uses requesterOwnsSkillsForThisAthlete instead of Skills function alone", () => {
    const assigned = baseWorkspace({
      shell: "head_coach_function_aware",
      workflowMode: "head_coach_function_aware",
      ownershipFlags: {
        hasHeadCoach: true,
        requesterIsHeadCoach: true,
        requesterHasSkillsFunction: true,
        requesterOwnsCurrentDomain: true,
        requesterOwnsSkillsForThisAthlete: true,
        headCoachOwnsPlanningContext: true,
        directReleaseAllowed: false,
      },
      currentDomain: "SKILLS",
      domains: {
        SKILLS: {
          ...emptyDomain("SKILLS"),
          canOpen: true,
          allowedActions: ["SUBMIT_REVIEW"],
        },
        NUTRITION: emptyDomain("NUTRITION"),
        S_AND_C: emptyDomain("S_AND_C"),
      },
    });
    expect(workspaceHeadCoachOwnsSkillsForAthlete(assigned)).toBe(true);
    expect(workspaceHeadCoachCanCreateSkillsPlan(assigned, false)).toBe(true);
    expect(workspaceShowsDomainSubmitReview(assigned, "SKILLS")).toBe(false);

    const assignedWithDraft = baseWorkspace({
      shell: "head_coach_function_aware",
      workflowMode: "head_coach_function_aware",
      ownershipFlags: {
        hasHeadCoach: true,
        requesterIsHeadCoach: true,
        requesterHasSkillsFunction: true,
        requesterOwnsCurrentDomain: true,
        requesterOwnsSkillsForThisAthlete: true,
        headCoachOwnsPlanningContext: true,
        directReleaseAllowed: false,
      },
      currentDomain: "SKILLS",
      domains: {
        SKILLS: {
          ...emptyDomain("SKILLS"),
          canOpen: true,
          allowedActions: ["SUBMIT_REVIEW"],
          summary: {
            trainingPlanId: "tp-skills-1",
            versionId: "ver-skills-1",
            generationDomain: "SKILLS",
            status: "DRAFT",
            versionNumber: 1,
          },
        },
        NUTRITION: emptyDomain("NUTRITION"),
        S_AND_C: emptyDomain("S_AND_C"),
      },
    });
    expect(workspaceShowsDomainSubmitReview(assignedWithDraft, "SKILLS")).toBe(true);
    expect(workspaceShowsDomainSubmitReview(assignedWithDraft, "NUTRITION")).toBe(false);

    const notAssigned = baseWorkspace({
      ownershipFlags: {
        hasHeadCoach: true,
        requesterIsHeadCoach: true,
        requesterHasSkillsFunction: true,
        requesterOwnsCurrentDomain: false,
        requesterOwnsSkillsForThisAthlete: false,
        headCoachOwnsPlanningContext: true,
        directReleaseAllowed: false,
      },
      shell: "head_coach_review",
      workflowMode: "head_coach_review",
      domains: {
        SKILLS: emptyDomain("SKILLS"),
        NUTRITION: emptyDomain("NUTRITION"),
        S_AND_C: emptyDomain("S_AND_C"),
      },
    });
    expect(workspaceHeadCoachOwnsSkillsForAthlete(notAssigned)).toBe(false);
    expect(workspaceHeadCoachCanCreateSkillsPlan(notAssigned, false)).toBe(false);
  });

  it("Workflow 3: resolves direct release without Head Coach review shell", () => {
    const workspace = baseWorkspace({
      shell: "specialist_domain",
      workflowMode: "specialist_domain",
      currentDomain: "NUTRITION",
      ownershipFlags: {
        hasHeadCoach: false,
        requesterIsHeadCoach: false,
        requesterHasSkillsFunction: false,
        requesterOwnsCurrentDomain: true,
        headCoachOwnsPlanningContext: false,
        directReleaseAllowed: true,
      },
      domains: {
        SKILLS: emptyDomain("SKILLS"),
        NUTRITION: {
          ...emptyDomain("NUTRITION"),
          canOpen: true,
          releaseMode: "DIRECT_RELEASE",
          allowedActions: ["RELEASE"],
        },
        S_AND_C: emptyDomain("S_AND_C"),
      },
    });
    expect(workspaceDirectReleaseAllowed(workspace)).toBe(true);
    expect(workspaceResolveReleaseMode(workspace)).toBe("direct_release");
    expect(resolveWorkflowModeFromWorkspace(workspace)).toBe("specialist_domain");
  });

  it("derives Workflow 1 Head Coach Tab 6 authority without domain generation", () => {
    const workspace = baseWorkspace({
      workflowShape: "HEAD_COACH_REVIEWER",
      assignmentContext: assignmentContext({
        domains: {
          SKILLS: assignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: true,
            canRelease: true,
          }),
          NUTRITION: assignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: true,
          }),
          S_AND_C: assignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: true,
          }),
        },
      }),
    });

    expect(resolveTrainingPlanTab6Authority(workspace)).toMatchObject({
      canManagePlanningContext: true,
      canGenerateSkills: false,
      canGenerateNutrition: false,
      canGenerateSC: false,
      isAssignedSkillsOwner: false,
      isGovernanceCoach: true,
      canApproveDomains: true,
      canReleaseToAthlete: true,
    });
  });

  it("derives Workflow 2A Head Coach as assigned Skills owner plus governance coach", () => {
    const workspace = baseWorkspace({
      workflowShape: "HEAD_COACH_SKILLS_OWNER",
      shell: "HEAD_COACH_FUNCTION_AWARE",
      workflowMode: "HEAD_COACH_FUNCTION_AWARE",
      currentDomain: "SKILLS",
      ownershipFlags: {
        hasHeadCoach: true,
        requesterIsHeadCoach: true,
        requesterHasSkillsFunction: true,
        requesterOwnsCurrentDomain: false,
        requesterOwnsSkillsForThisAthlete: false,
        headCoachOwnsPlanningContext: true,
        directReleaseAllowed: false,
      },
      assignmentContext: assignmentContext({
        domains: {
          SKILLS: assignmentDomain({
            ownerType: "HEAD_COACH_SELF",
            ownedByCurrentUser: true,
            canOpen: true,
            canGenerate: true,
            canSubmitForReview: true,
          }),
          NUTRITION: assignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: true,
            canRelease: true,
          }),
          S_AND_C: assignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: true,
          }),
        },
      }),
    });

    expect(resolveTrainingPlanTab6Authority(workspace)).toMatchObject({
      canManagePlanningContext: true,
      canGenerateSkills: true,
      canGenerateNutrition: false,
      canGenerateSC: false,
      canSubmitSkillsForReview: true,
      isAssignedSkillsOwner: true,
      isAssignedNutritionOwner: false,
      isAssignedSCOwner: false,
      isGovernanceCoach: true,
      canApproveDomains: true,
      canReleaseToAthlete: true,
    });
  });

  it("protects Workflow 2B Head Coach from Skills generation when Skills is separately assigned", () => {
    const workspace = baseWorkspace({
      workflowShape: "HEAD_COACH_REVIEWER",
      ownershipFlags: {
        hasHeadCoach: true,
        requesterIsHeadCoach: true,
        requesterHasSkillsFunction: true,
        requesterOwnsCurrentDomain: true,
        requesterOwnsSkillsForThisAthlete: true,
        headCoachOwnsPlanningContext: true,
        directReleaseAllowed: false,
      },
      assignmentContext: assignmentContext({
        domains: {
          SKILLS: assignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canGenerate: false,
            canApprove: true,
          }),
          NUTRITION: assignmentDomain({ canApprove: true }),
          S_AND_C: assignmentDomain({ canApprove: true }),
        },
      }),
    });

    expect(resolveTrainingPlanTab6Authority(workspace)).toMatchObject({
      canGenerateSkills: false,
      isAssignedSkillsOwner: false,
      isGovernanceCoach: true,
      canApproveDomains: true,
    });
  });

  it("derives Workflow 2B assigned Skills coach as Skills generation owner", () => {
    const workspace = baseWorkspace({
      workflowShape: "WORKFLOW_1",
      shell: "specialist_domain",
      workflowMode: "specialist_domain",
      currentDomain: "SKILLS",
      ownershipFlags: {
        hasHeadCoach: true,
        requesterIsHeadCoach: false,
        requesterHasSkillsFunction: true,
        requesterOwnsCurrentDomain: false,
        headCoachOwnsPlanningContext: true,
        directReleaseAllowed: false,
      },
      assignmentContext: assignmentContext({
        domains: {
          SKILLS: assignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: true,
            canOpen: true,
            canGenerate: true,
            canSubmitForReview: true,
          }),
          NUTRITION: assignmentDomain(),
          S_AND_C: assignmentDomain(),
        },
      }),
    });

    expect(resolveTrainingPlanTab6Authority(workspace)).toMatchObject({
      canGenerateSkills: true,
      canSubmitSkillsForReview: true,
      isAssignedSkillsOwner: true,
      isGovernanceCoach: false,
      canApproveDomains: false,
    });
  });

  it("derives Workflow 3 domain coach direct generation and release authority", () => {
    const workspace = baseWorkspace({
      workflowShape: "DIRECT_DOMAIN_RELEASE",
      shell: "skills_coach_planning",
      workflowMode: "skills_coach_planning",
      currentDomain: "SKILLS",
      ownershipFlags: {
        hasHeadCoach: false,
        requesterIsHeadCoach: false,
        requesterHasSkillsFunction: true,
        requesterOwnsCurrentDomain: false,
        headCoachOwnsPlanningContext: false,
        directReleaseAllowed: true,
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
            canOpen: true,
            canGenerate: true,
            canRelease: true,
            releaseMode: "DIRECT_DOMAIN_RELEASE",
          }),
          NUTRITION: assignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
          S_AND_C: assignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
        },
      }),
    });

    expect(resolveTrainingPlanTab6Authority(workspace)).toMatchObject({
      canManagePlanningContext: true,
      canGenerateSkills: true,
      canReleaseToAthlete: true,
      isAssignedSkillsOwner: true,
      isGovernanceCoach: false,
      isDirectReleaseDomainCoach: true,
    });
  });

  it("derives generation candidate domains from assignment ownership only", () => {
    const workflow2AHeadCoach = baseWorkspace({
      ownershipFlags: {
        hasHeadCoach: true,
        requesterIsHeadCoach: true,
        requesterHasSkillsFunction: true,
        requesterOwnsCurrentDomain: false,
        requesterOwnsSkillsForThisAthlete: false,
        headCoachOwnsPlanningContext: true,
        directReleaseAllowed: false,
      },
      assignmentContext: assignmentContext({
        domains: {
          SKILLS: assignmentDomain({
            ownerType: "HEAD_COACH_SELF",
            ownedByCurrentUser: true,
          }),
          NUTRITION: assignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
          }),
          S_AND_C: assignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
          }),
        },
      }),
    });
    const workflow2BHeadCoach = baseWorkspace({
      ownershipFlags: {
        hasHeadCoach: true,
        requesterIsHeadCoach: true,
        requesterHasSkillsFunction: true,
        requesterOwnsCurrentDomain: true,
        requesterOwnsSkillsForThisAthlete: true,
        headCoachOwnsPlanningContext: true,
        directReleaseAllowed: false,
      },
      assignmentContext: assignmentContext({
        domains: {
          SKILLS: assignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: false,
            canApprove: true,
          }),
          NUTRITION: assignmentDomain({ canApprove: true }),
          S_AND_C: assignmentDomain({ canApprove: true }),
        },
      }),
    });
    const workflow2BAssignedSkillsCoach = baseWorkspace({
      ownershipFlags: {
        hasHeadCoach: true,
        requesterIsHeadCoach: false,
        requesterHasSkillsFunction: true,
        requesterOwnsCurrentDomain: false,
        headCoachOwnsPlanningContext: true,
        directReleaseAllowed: false,
      },
      assignmentContext: assignmentContext({
        domains: {
          SKILLS: assignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: true,
          }),
          NUTRITION: assignmentDomain(),
          S_AND_C: assignmentDomain(),
        },
      }),
    });
    const workflow3NutritionCoach = baseWorkspace({
      assignmentContext: assignmentContext({
        hasHeadCoach: false,
        releaseMode: "DIRECT_DOMAIN_RELEASE",
        domains: {
          SKILLS: assignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
          NUTRITION: assignmentDomain({
            ownerType: "ASSIGNED_DOMAIN_COACH",
            ownedByCurrentUser: true,
            releaseMode: "DIRECT_DOMAIN_RELEASE",
          }),
          S_AND_C: assignmentDomain({ releaseMode: "DIRECT_DOMAIN_RELEASE" }),
        },
      }),
    });

    expect(workspaceAssignedGenerationDomains(workflow2AHeadCoach)).toEqual(["SKILLS"]);
    expect(workspaceAssignedGenerationDomains(workflow2BHeadCoach)).toEqual([]);
    expect(workspaceAssignedGenerationDomains(workflow2BAssignedSkillsCoach)).toEqual(["SKILLS"]);
    expect(workspaceAssignedGenerationDomains(workflow3NutritionCoach)).toEqual(["NUTRITION"]);
    expect(workspaceAssignedGenerationDomains(baseWorkspace())).toEqual([]);
  });

  it("keeps legacy planning ownership fallback when assignmentContext is missing", () => {
    expect(
      workspaceHeadCoachOwnsPlanningContext(
        baseWorkspace({
          ownershipFlags: {
            hasHeadCoach: true,
            requesterIsHeadCoach: true,
            requesterHasSkillsFunction: false,
            requesterOwnsCurrentDomain: false,
            headCoachOwnsPlanningContext: true,
            directReleaseAllowed: false,
          },
        }),
      ),
    ).toBe(true);

    expect(
      workspaceHeadCoachOwnsPlanningContext(
        baseWorkspace({
          ownershipFlags: {
            hasHeadCoach: false,
            requesterIsHeadCoach: false,
            requesterHasSkillsFunction: false,
            requesterOwnsCurrentDomain: true,
            headCoachOwnsPlanningContext: false,
            directReleaseAllowed: true,
          },
        }),
      ),
    ).toBe(false);
  });

  it("keeps legacy planning context lock when workspace is unlocked", () => {
    const workspace = baseWorkspace({
      planningContext: {
        locked: false,
        resolved: false,
        lockId: null,
        snapshotId: null,
      },
    });

    expect(
      resolveLegacyPlanningContextLocked({
        hasHeadCoachConfigured: true,
        upstreamPlanningContextLocked: true,
        upstreamPlanningContextUpstreamLocked: false,
        clientHasSubmittedDomainPlans: false,
      }),
    ).toBe(true);
    expect(
      resolvePlanningContextLocked({
        legacyLocked: true,
        workspace,
      }),
    ).toBe(true);
    expect(
      resolveEffectiveDownstreamPlanningContextLocked({
        workspace,
        noHeadCoachDirectReleaseLocked: false,
        upstreamContextLockedForDownstream: true,
      }),
    ).toBe(true);
  });

  it("Workflow 1: legacy create enabled when upstream lock is ready and no local error", () => {
    expect(
      resolveLegacyAssistantCreateButtonDisabled({
        generatePlanActionDisabled: false,
        localError: null,
      }),
    ).toBe(false);
  });

  it("Workflow 1: owned Skills domain with no created plan hides submit", () => {
    const workspace = baseWorkspace({
      workflowShape: "WORKFLOW_1",
      shell: "specialist_domain",
      workflowMode: "specialist_domain",
      currentDomain: "SKILLS",
      ownershipFlags: {
        hasHeadCoach: true,
        requesterIsHeadCoach: false,
        requesterHasSkillsFunction: true,
        requesterOwnsCurrentDomain: true,
        headCoachOwnsPlanningContext: true,
        directReleaseAllowed: false,
      },
      domains: {
        SKILLS: {
          ...emptyDomain("SKILLS"),
          canOpen: false,
          allowedActions: ["SUBMIT_REVIEW"],
        },
        NUTRITION: emptyDomain("NUTRITION"),
        S_AND_C: emptyDomain("S_AND_C"),
      },
    });

    expect(workspaceShowsDomainSubmitReview(workspace, "SKILLS")).toBe(false);
    expect(workspaceDomainHasPersistedPlanIds(workspace.domains.SKILLS)).toBe(false);
  });

  it("Workflow 1: owned Skills domain with created draft and SUBMIT_REVIEW shows submit", () => {
    const workspace = baseWorkspace({
      workflowShape: "WORKFLOW_1",
      shell: "specialist_domain",
      workflowMode: "specialist_domain",
      currentDomain: "SKILLS",
      ownershipFlags: {
        hasHeadCoach: true,
        requesterIsHeadCoach: false,
        requesterHasSkillsFunction: true,
        requesterOwnsCurrentDomain: true,
        headCoachOwnsPlanningContext: true,
        directReleaseAllowed: false,
      },
      domains: {
        SKILLS: {
          ...emptyDomain("SKILLS"),
          canOpen: true,
          allowedActions: ["SUBMIT_REVIEW"],
          summary: {
            trainingPlanId: "tp-1",
            versionId: "ver-1",
            generationDomain: "SKILLS",
            status: "DRAFT",
            versionNumber: 1,
          },
        },
        NUTRITION: emptyDomain("NUTRITION"),
        S_AND_C: emptyDomain("S_AND_C"),
      },
    });

    expect(workspaceShowsDomainSubmitReview(workspace, "SKILLS")).toBe(true);
  });

  it("never shows submit review when trainingPlanId or versionId is missing", () => {
    const missingPlanId = baseWorkspace({
      workflowShape: "WORKFLOW_1",
      shell: "specialist_domain",
      workflowMode: "specialist_domain",
      currentDomain: "SKILLS",
      domains: {
        SKILLS: {
          ...emptyDomain("SKILLS"),
          canOpen: true,
          allowedActions: ["SUBMIT_REVIEW"],
          summary: {
            trainingPlanId: null,
            versionId: "ver-1",
            generationDomain: "SKILLS",
            status: "DRAFT",
            versionNumber: 1,
          },
        },
        NUTRITION: emptyDomain("NUTRITION"),
        S_AND_C: emptyDomain("S_AND_C"),
      },
    });
    const missingVersionId = baseWorkspace({
      workflowShape: "WORKFLOW_1",
      shell: "specialist_domain",
      workflowMode: "specialist_domain",
      currentDomain: "SKILLS",
      domains: {
        SKILLS: {
          ...emptyDomain("SKILLS"),
          canOpen: true,
          allowedActions: ["SUBMIT_REVIEW"],
          summary: {
            trainingPlanId: "tp-1",
            versionId: null,
            generationDomain: "SKILLS",
            status: "DRAFT",
            versionNumber: 1,
          },
        },
        NUTRITION: emptyDomain("NUTRITION"),
        S_AND_C: emptyDomain("S_AND_C"),
      },
    });

    expect(workspaceShowsDomainSubmitReview(missingPlanId, "SKILLS")).toBe(false);
    expect(workspaceShowsDomainSubmitReview(missingVersionId, "SKILLS")).toBe(false);
  });
});
