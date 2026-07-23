import { paths } from "@/config/endpoints";
import {
  fetchWeeklyAdherenceComparison,
  fetchWeeklyAdherenceSnapshots,
  parseWeeklyAdherenceComparisonPayload,
  parseWeeklyAdherenceSnapshotsPayload,
} from "@/lib/api/weeklyAdherence";
import { apiRequest } from "@/lib/apiClient";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/apiClient", () => ({
  apiRequest: vi.fn(),
}));

const nutrients = {
  caloriesKcal: 500,
  proteinG: 30,
  carbohydrateG: 60,
  fatG: 15,
  fiberG: null,
  calciumMg: 120,
  magnesiumMg: null,
  sodiumMg: 300,
  potassiumMg: null,
};

function comparisonPayload() {
  return {
    message: "Weekly adherence comparison loaded",
    ignoredEnvelopeField: "ignored",
    data: {
      athleteId: "athlete-1",
      visibleDomains: ["NUTRITION"],
      ignoredDataField: "ignored",
      snapshotA: {
        planningContextSnapshotId: "snapshot-a",
        planStartDate: "2026-07-06",
        planEndDate: "2026-07-12",
        weeklyAdherenceSummary: {
          athleteId: "athlete-1",
          weekStart: "2026-07-06",
          weekEnd: "2026-07-12",
          domains: {
            NUTRITION: {
              plannedSessions: 7,
              loggedSessions: 6,
              adherencePercent: 80,
            },
          },
          overall: null,
          visibleDomains: ["NUTRITION"],
        },
        domainBreakdowns: {
          NUTRITION: {
            availability: "COMPLETE",
            ignoredBreakdownField: "ignored",
            weekly: {
              plannedSessions: 7,
              loggedSessions: 6,
              totalPrescribedItems: 21,
              loggedItems: 18,
              completedItems: 15,
              partialItems: 2,
              skippedItems: 1,
              unloggedItems: 3,
              completionCredit: 16,
              adherencePercent: 76.2,
              context: { mealCount: 21 },
              fullItems: 15,
              halfItems: 2,
              missedItems: 4,
              plannedCalories: 14_000,
              actualCalories: 12_500,
              ignoredWeeklyField: "ignored",
            },
            daily: [
              {
                date: "2026-07-06",
                plannedSessions: 1,
                loggedSessions: 1,
                totalPrescribedItems: 3,
                loggedItems: 3,
                completedItems: 2,
                partialItems: 1,
                skippedItems: 0,
                unloggedItems: 0,
                completionCredit: 2.5,
                adherencePercent: 83.3,
                ignoredDailyField: "ignored",
                sessions: [
                  {
                    plannedSessionId: "nutrition-session-1",
                    trainingDayId: "day-1",
                    date: "2026-07-06",
                    sessionType: "NUTRITION",
                    domain: "NUTRITION",
                    plannedDurationMinutes: 0,
                    logged: true,
                    adherenceOutcome: "PARTIAL",
                    completionPercent: 83.3,
                    actualDurationMinutes: 0,
                    totalPrescribedItems: 3,
                    loggedItems: 3,
                    completedItems: 2,
                    partialItems: 1,
                    skippedItems: 0,
                    unloggedItems: 0,
                    ignoredSessionField: "ignored",
                    nutritionDetail: {
                      label: null,
                      plannedNutrients: {
                        ...nutrients,
                        ignoredNutrientField: 999,
                      },
                      consumedNutrients: {
                        ...nutrients,
                        caloriesKcal: 450,
                        fiberG: 8,
                      },
                      variance: {
                        caloriesKcal: -50,
                        proteinG: 0,
                        carbohydrateG: null,
                        fatG: 0,
                        fiberG: null,
                        calciumMg: 0,
                        magnesiumMg: null,
                        sodiumMg: 0,
                        potassiumMg: null,
                      },
                      ignoredNutritionDetailField: "ignored",
                    },
                  },
                ],
              },
            ],
          },
          unauthorizedDomain: {
            availability: "COMPLETE",
            weekly: {},
            daily: [],
          },
        },
        ignoredSnapshotField: "ignored",
      },
      snapshotB: {
        planningContextSnapshotId: "snapshot-b",
        planStartDate: "2026-07-13",
        planEndDate: "2026-07-19",
        weeklyAdherenceSummary: {
          athleteId: "athlete-1",
          weekStart: "2026-07-13",
          weekEnd: "2026-07-19",
          domains: {},
          overall: null,
          visibleDomains: [],
        },
        domainBreakdowns: {},
      },
      domains: {
        NUTRITION: {
          comparisonStatus: "COMPARABLE",
          delta: {
            adherencePercent: 4.5,
            plannedSessions: 0,
            loggedSessions: 1,
            completedItems: 2,
            partialItems: -1,
            skippedItems: 0,
            unloggedItems: -1,
            completionCredit: 1.5,
            actualDurationMinutes: null,
            ignoredDeltaField: 10,
          },
          ignoredComparisonField: "ignored",
        },
      },
      overall: {
        comparisonStatus: "NOT_COMPARABLE",
        delta: {
          adherencePercent: 0,
          completedItems: 0,
          plannedItems: 0,
          partialItems: 0,
          missedItems: 0,
          ignoredOverallDeltaField: 10,
        },
      },
    },
  };
}

describe("weekly adherence comparison endpoint", () => {
  it("builds the frozen path with snapshotAId and snapshotBId", () => {
    expect(
      paths.entities.weeklyAdherenceComparison("entity-1", "athlete-1", {
        snapshotAId: "snapshot-a",
        snapshotBId: "snapshot-b",
      }),
    ).toBe(
      "/entities/entity-1/athletes/athlete-1/weekly-adherence-comparison?snapshotAId=snapshot-a&snapshotBId=snapshot-b",
    );
  });
});

describe("parseWeeklyAdherenceComparisonPayload", () => {
  it("preserves snapshots, dynamic maps, statuses, deltas, and nullable nutrients", () => {
    const parsed = parseWeeklyAdherenceComparisonPayload(comparisonPayload());
    const nutrition =
      parsed.data.snapshotA.domainBreakdowns.NUTRITION?.daily[0]?.sessions[0];

    expect(parsed.message).toBe("Weekly adherence comparison loaded");
    expect(parsed.data.snapshotA.planningContextSnapshotId).toBe("snapshot-a");
    expect(parsed.data.snapshotB.planningContextSnapshotId).toBe("snapshot-b");
    expect(parsed.data.visibleDomains).toEqual(["NUTRITION"]);
    expect(Object.keys(parsed.data.snapshotA.domainBreakdowns)).toEqual([
      "NUTRITION",
    ]);
    expect(parsed.data.snapshotB.domainBreakdowns).toEqual({});
    expect(Object.keys(parsed.data.domains)).toEqual(["NUTRITION"]);
    expect(parsed.data.snapshotA.domainBreakdowns.NUTRITION?.availability).toBe(
      "COMPLETE",
    );
    expect(parsed.data.domains.NUTRITION).toEqual({
      comparisonStatus: "COMPARABLE",
      delta: {
        adherencePercent: 4.5,
        plannedSessions: 0,
        loggedSessions: 1,
        completedItems: 2,
        partialItems: -1,
        skippedItems: 0,
        unloggedItems: -1,
        completionCredit: 1.5,
        actualDurationMinutes: null,
      },
    });
    expect(parsed.data.overall).toEqual({
      comparisonStatus: "NOT_COMPARABLE",
      delta: {
        adherencePercent: 0,
        completedItems: 0,
        plannedItems: 0,
        partialItems: 0,
        missedItems: 0,
      },
    });

    expect(nutrition).toMatchObject({
      nutritionDetail: {
        label: null,
        plannedNutrients: nutrients,
        consumedNutrients: {
          ...nutrients,
          caloriesKcal: 450,
          fiberG: 8,
        },
        variance: {
          caloriesKcal: -50,
          proteinG: 0,
          carbohydrateG: null,
          fatG: 0,
          fiberG: null,
          calciumMg: 0,
          magnesiumMg: null,
          sodiumMg: 0,
          potassiumMg: null,
        },
      },
    });
  });

  it("preserves a NOT_COMPARABLE overall status with a null delta", () => {
    const payload = comparisonPayload();
    (
      payload.data.overall as {
        comparisonStatus: string;
        delta: unknown;
      }
    ).delta = null;

    const parsed = parseWeeklyAdherenceComparisonPayload(payload);

    expect(parsed.data.overall).toEqual({
      comparisonStatus: "NOT_COMPARABLE",
      delta: null,
    });
  });

  it("ignores unknown fields at decoded contract boundaries", () => {
    const parsed = parseWeeklyAdherenceComparisonPayload(comparisonPayload());
    const breakdown = parsed.data.snapshotA.domainBreakdowns.NUTRITION;
    const day = breakdown?.daily[0];
    const session = day?.sessions[0];
    const nutrition =
      session && "nutritionDetail" in session
        ? session.nutritionDetail
        : null;

    expect(parsed).not.toHaveProperty("ignoredEnvelopeField");
    expect(parsed.data).not.toHaveProperty("ignoredDataField");
    expect(parsed.data.snapshotA).not.toHaveProperty("ignoredSnapshotField");
    expect(breakdown).not.toHaveProperty("ignoredBreakdownField");
    expect(breakdown?.weekly).not.toHaveProperty("ignoredWeeklyField");
    expect(day).not.toHaveProperty("ignoredDailyField");
    expect(session).not.toHaveProperty("ignoredSessionField");
    expect(nutrition).not.toHaveProperty("ignoredNutritionDetailField");
    expect(nutrition?.plannedNutrients).not.toHaveProperty(
      "ignoredNutrientField",
    );
    expect(parsed.data.domains.NUTRITION).not.toHaveProperty(
      "ignoredComparisonField",
    );
    expect(parsed.data.domains.NUTRITION?.delta).not.toHaveProperty(
      "ignoredDeltaField",
    );
    expect(parsed.data.overall?.delta).not.toHaveProperty(
      "ignoredOverallDeltaField",
    );
  });
});

describe("fetchWeeklyAdherenceComparison", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("requests and parses the frozen comparison endpoint", async () => {
    vi.mocked(apiRequest).mockResolvedValue(comparisonPayload());

    const result = await fetchWeeklyAdherenceComparison({
      entityId: "entity-1",
      athleteId: "athlete-1",
      snapshotAId: "snapshot-a",
      snapshotBId: "snapshot-b",
    });

    expect(apiRequest).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/weekly-adherence-comparison?snapshotAId=snapshot-a&snapshotBId=snapshot-b",
      {
        method: "GET",
        cache: "no-store",
        timeoutMs: 240_000,
      },
    );
    expect(result.data.athleteId).toBe("athlete-1");
  });
});

describe("weekly adherence snapshot endpoint", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("parses authoritative snapshot options without a domain dependency", () => {
    expect(
      parseWeeklyAdherenceSnapshotsPayload({
        data: [
          {
            planningContextSnapshotId: "snapshot-nutrition-only",
            planStartDate: "2026-07-06",
            planEndDate: "2026-07-12",
            ignored: true,
          },
        ],
      }),
    ).toEqual([
      {
        id: "snapshot-nutrition-only",
        weekStart: "2026-07-06",
        weekEnd: "2026-07-12",
      },
    ]);
  });

  it("uses the shared weekly snapshot endpoint instead of domain history", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ data: [] });

    await fetchWeeklyAdherenceSnapshots({
      entityId: "entity-1",
      athleteId: "athlete-1",
    });

    expect(apiRequest).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/weekly-adherence-snapshots",
      {
        method: "GET",
        cache: "no-store",
        timeoutMs: 240_000,
      },
    );
    expect(vi.mocked(apiRequest).mock.calls[0]?.[0]).not.toContain(
      "training-plan-management",
    );
  });
});
