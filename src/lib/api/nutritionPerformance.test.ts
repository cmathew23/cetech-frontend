import { paths } from "@/config/endpoints";
import {
  fetchNutritionPerformance,
  fetchNutritionPerformanceHistory,
  formatNutritionHistoryChangeLabel,
  nutritionDeviationForSelection,
  nutritionDeviationPointChange,
  parseNutritionPerformanceHistoryPayload,
  parseNutritionPerformancePayload,
  type NutritionPerformanceMetric,
  type NutritionPerformanceResponse,
} from "@/lib/api/nutritionPerformance";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

const CONTRACT_DATA = {
  athleteId: "athlete-uuid",
  weekStart: "2026-09-14",
  weekEnd: "2026-09-20",
  weeklyTotals: {
    calories: {
      unit: "kcal",
      weeklyPlanned: 15461.526,
      plannedToDate: 9017.961,
      actualToDate: 4708.89,
      deviationPercent: -47.78,
    },
    protein: {
      unit: "g",
      weeklyPlanned: 613.071,
      plannedToDate: 356.422,
      actualToDate: 181.4,
      deviationPercent: -49.11,
    },
    carbohydrates: {
      unit: "g",
      weeklyPlanned: 2145.703,
      plannedToDate: 1274.671,
      actualToDate: 671.9,
      deviationPercent: -47.29,
    },
    fat: {
      unit: "g",
      weeklyPlanned: 487.883,
      plannedToDate: 273.471,
      actualToDate: 142.07,
      deviationPercent: -48.05,
    },
    fiber: {
      unit: "g",
      weeklyPlanned: 343.419,
      plannedToDate: 202.039,
      actualToDate: 90.01,
      deviationPercent: -55.45,
    },
  },
  mealBreakdown: [
    {
      mealType: "BREAKFAST",
      weeklyPlannedCaloriesKcal: 4065.2,
      plannedToDateCaloriesKcal: 2304.83,
      actualToDateCaloriesKcal: 1098.89,
      deviationPercent: -52.32,
    },
    {
      mealType: "MID_MORNING_SNACK",
      weeklyPlannedCaloriesKcal: 1788.85,
      plannedToDateCaloriesKcal: 1166.99,
      actualToDateCaloriesKcal: 769.69,
      deviationPercent: -34.04,
    },
    {
      mealType: "LUNCH",
      weeklyPlannedCaloriesKcal: 4281.57,
      plannedToDateCaloriesKcal: 2493.85,
      actualToDateCaloriesKcal: 1260.23,
      deviationPercent: -49.47,
    },
    {
      mealType: "MID_AFTERNOON_SNACK",
      weeklyPlannedCaloriesKcal: 1505.77,
      plannedToDateCaloriesKcal: 844.26,
      actualToDateCaloriesKcal: 452.53,
      deviationPercent: -46.4,
    },
    {
      mealType: "DINNER",
      weeklyPlannedCaloriesKcal: 3820.12,
      plannedToDateCaloriesKcal: 2208.04,
      actualToDateCaloriesKcal: 1127.55,
      deviationPercent: -48.93,
    },
  ],
};

function contractEnvelope(): NutritionPerformanceResponse {
  return {
    message: "Nutrition performance fetched successfully",
    data: CONTRACT_DATA,
  };
}

function expectMetric(
  metric: NutritionPerformanceMetric | null,
  expected: NutritionPerformanceMetric,
) {
  expect(metric).toEqual(expected);
}

describe("nutrition performance API", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("calls /entities/:entityId/athletes/:athleteId/nutrition-performance with weekStart and weekEnd", async () => {
    apiRequestMock.mockResolvedValue(contractEnvelope());

    await fetchNutritionPerformance({
      entityId: "entity-1",
      athleteId: "athlete-1",
      weekStart: "2026-09-14",
      weekEnd: "2026-09-20",
    });

    expect(apiRequestMock).toHaveBeenCalledWith(
      paths.entities.nutritionPerformance("entity-1", "athlete-1", {
        weekStart: "2026-09-14",
        weekEnd: "2026-09-20",
      }),
      {
        method: "GET",
        cache: "no-store",
        timeoutMs: 240_000,
      },
    );
    expect(
      paths.entities.nutritionPerformance("entity-1", "athlete-1", {
        weekStart: "2026-09-14",
        weekEnd: "2026-09-20",
      }),
    ).toBe(
      "/entities/entity-1/athletes/athlete-1/nutrition-performance?weekStart=2026-09-14&weekEnd=2026-09-20",
    );
  });

  it("preserves weeklyPlanned, plannedToDate, actualToDate, and deviationPercent without recalculating", () => {
    const parsed = parseNutritionPerformancePayload(contractEnvelope());

    expectMetric(parsed.weeklyTotals.calories, {
      unit: "kcal",
      weeklyPlanned: 15461.526,
      plannedToDate: 9017.961,
      actualToDate: 4708.89,
      deviationPercent: -47.78,
    });
    expectMetric(parsed.weeklyTotals.protein, {
      unit: "g",
      weeklyPlanned: 613.071,
      plannedToDate: 356.422,
      actualToDate: 181.4,
      deviationPercent: -49.11,
    });
    expect(parsed.weeklyTotals.calories?.actualToDate).not.toBe(
      parsed.weeklyTotals.calories?.weeklyPlanned,
    );
    expect(parsed.mealBreakdown[0]?.actualToDateCaloriesKcal).toBe(1098.89);
    expect(parsed.mealBreakdown[0]?.plannedToDateCaloriesKcal).toBe(2304.83);
    expect(parsed.mealBreakdown[0]?.deviationPercent).toBe(-52.32);
  });

  it("keeps null actualToDate as null and numeric zero as zero", () => {
    const parsed = parseNutritionPerformancePayload({
      message: "Nutrition performance fetched successfully",
      data: {
        athleteId: "athlete-1",
        weekStart: "2026-09-14",
        weekEnd: "2026-09-20",
        weeklyTotals: {
          calories: {
            unit: "kcal",
            weeklyPlanned: 1000,
            plannedToDate: 500,
            actualToDate: null,
            deviationPercent: null,
          },
          protein: {
            unit: "g",
            weeklyPlanned: 80,
            plannedToDate: 40,
            actualToDate: 0,
            deviationPercent: -100,
          },
        },
        mealBreakdown: [
          {
            mealType: "BREAKFAST",
            weeklyPlannedCaloriesKcal: 400,
            plannedToDateCaloriesKcal: 200,
            actualToDateCaloriesKcal: null,
            deviationPercent: null,
          },
          {
            mealType: "LUNCH",
            weeklyPlannedCaloriesKcal: 400,
            plannedToDateCaloriesKcal: 200,
            actualToDateCaloriesKcal: 0,
            deviationPercent: -100,
          },
        ],
      },
    });

    expect(parsed.weeklyTotals.calories?.actualToDate).toBeNull();
    expect(parsed.weeklyTotals.calories?.deviationPercent).toBeNull();
    expect(parsed.weeklyTotals.protein?.actualToDate).toBe(0);
    expect(parsed.mealBreakdown[0]?.actualToDateCaloriesKcal).toBeNull();
    expect(parsed.mealBreakdown[1]?.actualToDateCaloriesKcal).toBe(0);
  });

  it("calls nutrition-performance/history and preserves completed-week deviations", async () => {
    apiRequestMock.mockResolvedValue({
      message: "Nutrition performance history fetched successfully",
      data: {
        weeks: [
          {
            athleteId: "athlete-uuid",
            weekStart: "2026-08-31",
            weekEnd: "2026-09-06",
            weeklyTotals: {
              calories: {
                unit: "kcal",
                weeklyPlanned: 15000,
                plannedToDate: 15000,
                actualToDate: 10140,
                deviationPercent: -32.4,
              },
            },
            mealBreakdown: [
              {
                mealType: "BREAKFAST",
                weeklyPlannedCaloriesKcal: 4000,
                plannedToDateCaloriesKcal: 4000,
                actualToDateCaloriesKcal: 2400,
                deviationPercent: -40.1,
              },
            ],
          },
        ],
      },
    });

    const weeks = await fetchNutritionPerformanceHistory({
      entityId: "entity-1",
      athleteId: "athlete-1",
    });

    expect(apiRequestMock).toHaveBeenCalledWith(
      paths.entities.nutritionPerformanceHistory("entity-1", "athlete-1"),
      {
        method: "GET",
        cache: "no-store",
        timeoutMs: 240_000,
      },
    );
    expect(
      paths.entities.nutritionPerformanceHistory("entity-1", "athlete-1"),
    ).toBe(
      "/entities/entity-1/athletes/athlete-1/nutrition-performance/history",
    );
    expect(weeks).toHaveLength(1);
    expect(weeks[0]?.weeklyTotals.calories?.deviationPercent).toBe(-32.4);
    expect(weeks[0]?.mealBreakdown[0]?.deviationPercent).toBe(-40.1);
  });

  it("parses an empty history list without inventing weeks", () => {
    expect(
      parseNutritionPerformanceHistoryPayload({
        message: "OK",
        data: { weeks: [] },
      }),
    ).toEqual([]);
  });
});

describe("nutrition deviation comparison", () => {
  it("reads current and historical deviations without recalculating them", () => {
    const current = parseNutritionPerformancePayload(contractEnvelope());
    const historical = parseNutritionPerformanceHistoryPayload({
      data: {
        weeks: [
          {
            athleteId: "athlete-uuid",
            weekStart: "2026-08-31",
            weekEnd: "2026-09-06",
            weeklyTotals: {
              calories: {
                unit: "kcal",
                weeklyPlanned: 1,
                plannedToDate: 1,
                actualToDate: 1,
                deviationPercent: -32.4,
              },
            },
            mealBreakdown: [
              {
                mealType: "BREAKFAST",
                weeklyPlannedCaloriesKcal: 1,
                plannedToDateCaloriesKcal: 1,
                actualToDateCaloriesKcal: 1,
                deviationPercent: -40.1,
              },
            ],
          },
        ],
      },
    })[0];

    expect(
      nutritionDeviationForSelection(current, "NUTRIENT", "calories"),
    ).toBe(-47.78);
    expect(
      nutritionDeviationForSelection(historical, "NUTRIENT", "calories"),
    ).toBe(-32.4);
    expect(
      nutritionDeviationForSelection(current, "MEAL", "BREAKFAST"),
    ).toBe(-52.32);
    expect(
      nutritionDeviationForSelection(historical, "MEAL", "BREAKFAST"),
    ).toBe(-40.1);
  });

  it("computes percentage-point change as current minus historical", () => {
    expect(nutritionDeviationPointChange(-47.78, -32.4)).toEqual({
      direction: "down",
      points: 15.4,
    });
    expect(formatNutritionHistoryChangeLabel(
      nutritionDeviationPointChange(-47.78, -32.4),
    )).toBe("↓ 15.4 pp");
    expect(nutritionDeviationPointChange(-32.4, -47.78)).toEqual({
      direction: "up",
      points: 15.4,
    });
    expect(formatNutritionHistoryChangeLabel(
      nutritionDeviationPointChange(-32.4, -47.78),
    )).toBe("↑ 15.4 pp");
    expect(nutritionDeviationPointChange(-32.4, -32.4)).toEqual({
      direction: "same",
      points: 0,
    });
    expect(formatNutritionHistoryChangeLabel(
      nutritionDeviationPointChange(-32.4, -32.4),
    )).toBe("→ 0.0 pp");
    expect(nutritionDeviationPointChange(null, -32.4)).toBeNull();
    expect(formatNutritionHistoryChangeLabel(null)).toBe("—");
  });
});
