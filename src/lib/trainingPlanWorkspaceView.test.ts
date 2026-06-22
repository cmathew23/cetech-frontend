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
  resolveWorkflowModeFromWorkspace,
  workspaceDomainHasPersistedPlanIds,
  workspaceHasSubmittedDomainPlans,
  workspaceHeadCoachCanCreateSkillsPlan,
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
    expect(workspaceResolveReleaseMode(workspace)).toBe("direct_release");
    expect(resolveWorkflowModeFromWorkspace(workspace)).toBe("specialist_domain");
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
