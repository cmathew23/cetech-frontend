import { describe, expect, it, vi } from "vitest";

import type { CoachAthleteUpstreamPlanningContext } from "@/lib/api/coachAthletePlanningReadiness";
import type { CoachAssignedAthleteRow } from "@/lib/api/coachMe";
import {
  assignedAthleteActionDependsOnPlanningContextLock,
  fetchRequiredPlanningContextLocks,
  resolveAssignedAthleteTrainingPlanAction,
  type TrainingPlanListActionContext,
} from "@/lib/coachTrainingPlanListPlanningContext";
import {
  PLANNING_CONTEXT_REQUIRED_BUTTON_LABEL,
  WAITING_FOR_HEAD_COACH_PLANNING_CONTEXT_MESSAGE,
} from "@/lib/coachTrainingPlanActions";

const assistantContext: TrainingPlanListActionContext = {
  domain: "NUTRITION",
  hasHeadCoachConfigured: true,
  isHeadCoachPlanningContextOwner: false,
};

function athleteRow(
  athleteId: string,
  overrides: Partial<CoachAssignedAthleteRow> = {},
): CoachAssignedAthleteRow {
  return {
    athleteId,
    assignedFunctions: ["NUTRITION"],
    hasPlanningProfile: true,
    currentGenerationDomain: null,
    currentPlanId: null,
    currentPlanStatus: null,
    displayPlanStatus: null,
    canGeneratePlan: true,
    canGenerateCurrentDomainPlan: true,
    validationStatus: null,
    displayName: athleteId,
    email: `${athleteId}@example.com`,
    lifecycle: "ACTIVE",
    membershipStatus: "ACTIVE",
    skillsPlanId: null,
    planStatus: null,
    ...overrides,
  };
}

function upstreamContext(locked: boolean): CoachAthleteUpstreamPlanningContext {
  return {
    planningContextLocked: locked,
    upstreamPlanningContextLocked: false,
  } as CoachAthleteUpstreamPlanningContext;
}

function contextFetcher(locked: boolean) {
  return vi.fn(async (entityId: string, athleteId: string) => {
    void entityId;
    void athleteId;
    return upstreamContext(locked);
  });
}

describe("training-plan list planning-context fan-out", () => {
  it("makes no upstream request for a lock-independent row", async () => {
    const fetchContext = contextFetcher(true);

    const lockMap = await fetchRequiredPlanningContextLocks(
      "entity-1",
      [athleteRow("app-required", { hasPlanningProfile: false })],
      assistantContext,
      fetchContext,
    );

    expect(fetchContext).not.toHaveBeenCalled();
    expect(lockMap).toEqual({});
  });

  it("makes exactly one upstream request for a lock-dependent row", async () => {
    const fetchContext = contextFetcher(true);

    const lockMap = await fetchRequiredPlanningContextLocks(
      "entity-1",
      [athleteRow("needs-lock")],
      assistantContext,
      fetchContext,
    );

    expect(fetchContext).toHaveBeenCalledTimes(1);
    expect(fetchContext).toHaveBeenCalledWith("entity-1", "needs-lock");
    expect(lockMap).toEqual({ "needs-lock": true });
  });

  it("fetches only required athletes in a mixed roster", async () => {
    const fetchContext = contextFetcher(false);
    const roster = [
      athleteRow("app-required", { hasPlanningProfile: false }),
      athleteRow("existing-plan", {
        currentGenerationDomain: "NUTRITION",
        currentPlanId: "plan-1",
        currentPlanStatus: "ACTIVE",
      }),
      athleteRow("ownership-denied", {
        canGeneratePlan: false,
        canGenerateCurrentDomainPlan: false,
      }),
      athleteRow("needs-lock-1"),
      athleteRow("needs-lock-2"),
    ];

    await fetchRequiredPlanningContextLocks(
      "entity-1",
      roster,
      assistantContext,
      fetchContext,
    );

    expect(fetchContext).toHaveBeenCalledTimes(2);
    expect(fetchContext.mock.calls.map((call) => call[1])).toEqual([
      "needs-lock-1",
      "needs-lock-2",
    ]);
  });

  it("skips an existing-plan row whose rendered action is lock-independent", async () => {
    const row = athleteRow("existing-plan", {
      currentGenerationDomain: "NUTRITION",
      currentPlanId: "plan-1",
      currentPlanStatus: "ACTIVE",
    });
    const fetchContext = contextFetcher(true);

    await fetchRequiredPlanningContextLocks(
      "entity-1",
      [row],
      assistantContext,
      fetchContext,
    );

    expect(fetchContext).not.toHaveBeenCalled();
    expect(
      resolveAssignedAthleteTrainingPlanAction(row, assistantContext, null)
        .buttonLabel,
    ).toBe("Edit Nutrition Plan");
  });

  it("skips an ownership-denied row", async () => {
    const row = athleteRow("ownership-denied", {
      canGeneratePlan: false,
      canGenerateCurrentDomainPlan: false,
    });
    const fetchContext = contextFetcher(true);

    await fetchRequiredPlanningContextLocks(
      "entity-1",
      [row],
      assistantContext,
      fetchContext,
    );

    expect(fetchContext).not.toHaveBeenCalled();
    expect(
      resolveAssignedAthleteTrainingPlanAction(row, assistantContext, null)
        .disabled,
    ).toBe(true);
  });

  it("remains conservative when an upstream request fails", async () => {
    const row = athleteRow("upstream-failure");
    const fetchContext = vi.fn(async (entityId: string, athleteId: string) => {
      void entityId;
      void athleteId;
      throw new Error("upstream unavailable");
    });

    const lockMap = await fetchRequiredPlanningContextLocks(
      "entity-1",
      [row],
      assistantContext,
      fetchContext,
    );
    const action = resolveAssignedAthleteTrainingPlanAction(
      row,
      assistantContext,
      lockMap[row.athleteId] ?? null,
    );

    expect(fetchContext).toHaveBeenCalledTimes(1);
    expect(lockMap).toEqual({});
    expect(action.buttonLabel).toBe(PLANNING_CONTEXT_REQUIRED_BUTTON_LABEL);
    expect(action.disabled).toBe(true);
    expect(action.href).toBeNull();
    expect(action.helperBelowButton).toBe(
      WAITING_FOR_HEAD_COACH_PLANNING_CONTEXT_MESSAGE,
    );
  });

  it.each([
    ["SKILLS", "Create Skills Plan"],
    ["NUTRITION", "Create Nutrition Plan"],
    ["S_AND_C", "Create S&C Plan"],
  ] as const)(
    "preserves lock gating for %s actions",
    (domain, expectedCreateLabel) => {
      const context = { ...assistantContext, domain };
      const row = athleteRow(`athlete-${domain}`, {
        assignedFunctions: [domain],
      });

      expect(
        assignedAthleteActionDependsOnPlanningContextLock(row, context),
      ).toBe(true);
      expect(
        resolveAssignedAthleteTrainingPlanAction(row, context, false),
      ).toMatchObject({
        buttonLabel: PLANNING_CONTEXT_REQUIRED_BUTTON_LABEL,
        disabled: true,
        href: null,
      });
      expect(
        resolveAssignedAthleteTrainingPlanAction(row, context, true),
      ).toMatchObject({
        buttonLabel: expectedCreateLabel,
        disabled: false,
        href: `/coach/training-plans/athlete-${domain}/workflow`,
      });
    },
  );

  it("keeps no-Head-Coach Skills creation lock-independent", () => {
    const context: TrainingPlanListActionContext = {
      domain: "SKILLS",
      hasHeadCoachConfigured: false,
      isHeadCoachPlanningContextOwner: false,
    };
    const row = athleteRow("skills-no-head-coach", {
      assignedFunctions: ["SKILLS"],
    });

    expect(
      assignedAthleteActionDependsOnPlanningContextLock(row, context),
    ).toBe(false);
    expect(
      resolveAssignedAthleteTrainingPlanAction(row, context, false),
    ).toEqual(resolveAssignedAthleteTrainingPlanAction(row, context, true));
  });
});
