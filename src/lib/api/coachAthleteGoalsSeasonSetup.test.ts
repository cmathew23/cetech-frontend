import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

import {
  createPhaseAwareGoal,
  fetchGoalLibrary,
} from "@/lib/api/coachAthleteGoalsSeasonSetup";

describe("fetchGoalLibrary", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("calls goal library with sport, season phase, and level filters", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        sportCode: "GOLF",
        providerKey: "golf",
        version: "v1",
        categories: [
          {
            categoryKey: "putting",
            categoryLabel: "Putting",
            levels: {
              BEGINNER: [
                {
                  libraryGoalId: "golf_putting_beginner_xxx_v1",
                  goalName: "Improve putting setup and alignment",
                  goalType: "PERFORMANCE",
                  goalCategory: "TRAINING",
                  domain: "SKILLS",
                  categoryKey: "putting",
                  categoryLabel: "Putting",
                  taxonomyAreaKey: "putting",
                  athleteLevel: "BEGINNER",
                  seasonPhases: ["OFF_SEASON", "PRE_SEASON"],
                  successCriteria: ["Improve start line control"],
                  metricsToWatch: ["Putts per round"],
                  capabilityCodes: ["BALANCE"],
                  recommendedDomains: ["SKILLS", "S_AND_C"],
                },
              ],
              INTERMEDIATE: [],
              ADVANCED: [],
              ELITE: [],
            },
          },
        ],
      },
    });

    const result = await fetchGoalLibrary({
      sport: "GOLF",
      seasonPhase: "OFF_SEASON",
      level: "BEGINNER",
    });

    const [path, options] = apiRequestMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe("/goal-library?sport=GOLF&seasonPhase=OFF_SEASON&level=BEGINNER");
    expect(options.method).toBe("GET");
    expect(result.categories[0]?.levels.BEGINNER[0]?.libraryGoalId).toBe(
      "golf_putting_beginner_xxx_v1",
    );
  });
});

describe("createPhaseAwareGoal", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("includes library metadata when creating a goal from Goal Library", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        goalId: "goal-1",
        athleteId: "athlete-1",
        entityId: "entity-1",
        seasonCycleId: "season-1",
        seasonPhaseId: "phase-1",
        domain: "SKILLS",
        status: "ACTIVE",
        goalType: "PERFORMANCE",
        goalName: "Improve putting setup and alignment",
        successCriteria: "Improve start line control",
        goalCategory: "TRAINING",
        priority: "MEDIUM",
        targetDate: "2026-06-30T00:00:00.000Z",
      },
    });

    await createPhaseAwareGoal({
      athleteId: "athlete-1",
      entityId: "entity-1",
      seasonCycleId: "season-1",
      seasonPhaseId: "phase-1",
      goalType: "PERFORMANCE",
      domain: "SKILLS",
      goalName: "Improve putting setup and alignment",
      goalCategory: "TRAINING",
      createdByCoachId: "coach-1",
      goalSourceType: "LIBRARY",
      libraryGoalId: "golf_putting_beginner_xxx_v1",
      categoryKey: "putting",
      taxonomyAreaKey: "putting",
      athleteLevelSnapshot: "BEGINNER",
      librarySnapshotJson: {
        goalName: "Improve putting setup and alignment",
        categoryLabel: "Putting",
        successCriteria: ["Improve start line control"],
        metricsToWatch: ["Putts per round"],
        capabilityCodes: ["BALANCE"],
        recommendedDomains: ["SKILLS", "S_AND_C"],
        seasonPhases: ["OFF_SEASON", "PRE_SEASON"],
      },
    });

    const [, options] = apiRequestMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(options.method).toBe("POST");
    expect(JSON.parse(String(options.body))).toMatchObject({
      goalSourceType: "LIBRARY",
      libraryGoalId: "golf_putting_beginner_xxx_v1",
      categoryKey: "putting",
      taxonomyAreaKey: "putting",
      athleteLevelSnapshot: "BEGINNER",
      librarySnapshotJson: {
        goalName: "Improve putting setup and alignment",
        categoryLabel: "Putting",
      },
    });
  });

  it("includes goalSourceType CUSTOM without requiring library fields", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        goalId: "goal-2",
        athleteId: "athlete-1",
        entityId: "entity-1",
        seasonCycleId: "season-1",
        seasonPhaseId: "phase-1",
        domain: "SKILLS",
        status: "ACTIVE",
        goalType: "PERFORMANCE",
        goalName: "Custom skill goal",
        goalCategory: "TRAINING",
      },
    });

    await createPhaseAwareGoal({
      athleteId: "athlete-1",
      entityId: "entity-1",
      seasonCycleId: "season-1",
      seasonPhaseId: "phase-1",
      goalType: "PERFORMANCE",
      domain: "SKILLS",
      goalName: "Custom skill goal",
      goalCategory: "TRAINING",
      createdByCoachId: "coach-1",
      goalSourceType: "CUSTOM",
    });

    const [, options] = apiRequestMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(JSON.parse(String(options.body))).toMatchObject({
      goalSourceType: "CUSTOM",
    });
    expect(JSON.parse(String(options.body))).not.toHaveProperty("libraryGoalId");
  });
});
