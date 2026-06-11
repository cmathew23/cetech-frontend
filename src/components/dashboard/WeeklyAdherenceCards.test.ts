import { describe, expect, it } from "vitest";
import {
  ADHERENCE_PERCENT_MEANING,
  buildWeeklyAdherenceMetricTiles,
  formatAdherencePercentDisplay,
  formatNutritionCalorieContextLine,
  formatNutritionItemCompletionLine,
  formatNutritionItemStatusLine,
  formatSessionItemCompletionLine,
  formatSessionMinutesContextLines,
} from "@/components/dashboard/WeeklyAdherenceCards";
import {
  parseWeeklyAdherenceSummaryPayload,
  type NutritionDomainContext,
  type SessionDomainContext,
  type WeeklyAdherenceSummary,
} from "@/lib/api/weeklyAdherence";

function buildItemBasedSummary(
  overrides: Partial<WeeklyAdherenceSummary> = {},
): WeeklyAdherenceSummary {
  return parseWeeklyAdherenceSummaryPayload({
    athleteId: "athlete-1",
    weekStart: "2026-05-12",
    weekEnd: "2026-05-18",
    overall: {
      plannedSessions: 42,
      loggedSessions: 30,
      adherencePercent: 72.5,
    },
    visibleDomains: ["SKILL", "NUTRITION", "STRENGTH_CONDITIONING"],
    domains: {
      SKILL: {
        plannedSessions: 2,
        loggedSessions: 2,
        adherencePercent: 50,
        context: {
          totalPrescribedItems: 6,
          completedItems: 3,
          partialItems: 0,
          missedItems: 3,
          completionCredit: 3,
          plannedDurationMinutes: 120,
          actualDurationMinutes: 95,
        },
      },
      NUTRITION: {
        plannedSessions: 21,
        loggedSessions: 18,
        adherencePercent: 53.9,
        context: {
          plannedCaloriesKcal: 14_000,
          actualCaloriesKcal: 12_500,
          calorieGapKcal: -1500,
          fullItems: 12,
          halfItems: 3,
          notEatenItems: 6,
          extraItems: 0,
          totalItems: 21,
        },
      },
      STRENGTH_CONDITIONING: {
        plannedSessions: 2,
        loggedSessions: 2,
        adherencePercent: 50,
        context: {
          totalPrescribedItems: 8,
          completedItems: 4,
          partialItems: 0,
          missedItems: 4,
          completionCredit: 4,
          plannedDurationMinutes: 180,
          actualDurationMinutes: 210,
        },
      },
    },
    ...overrides,
  });
}

describe("buildWeeklyAdherenceMetricTiles", () => {
  it("uses backend overall adherence percent without recalculating", () => {
    const summary = buildItemBasedSummary();
    const tiles = buildWeeklyAdherenceMetricTiles(summary);
    const overall = tiles.find((tile) => tile.key === "overall");

    expect(overall?.adherencePercent).toBe(72.5);
    expect(overall?.percentMeaning).toBe(ADHERENCE_PERCENT_MEANING.overall);
    expect(formatAdherencePercentDisplay(overall!.adherencePercent)).toBe("72.5%");
  });

  it("uses backend nutrition percent, not calorie ratio", () => {
    const summary = buildItemBasedSummary();
    const tiles = buildWeeklyAdherenceMetricTiles(summary);
    const nutrition = tiles.find((tile) => tile.key === "NUTRITION");

    expect(nutrition?.adherencePercent).toBe(53.9);
    expect(nutrition?.percentMeaning).toBe("Meal item adherence");

    const calorieRatio =
      (summary.domains.NUTRITION!.context as { actualCaloriesKcal: number })
        .actualCaloriesKcal /
      (summary.domains.NUTRITION!.context as { plannedCaloriesKcal: number })
        .plannedCaloriesKcal *
      100;
    expect(calorieRatio).toBeCloseTo(89.3, 1);
    expect(nutrition?.adherencePercent).not.toBeCloseTo(calorieRatio, 0);
  });

  it("only includes domains returned in the summary payload", () => {
    const summary = parseWeeklyAdherenceSummaryPayload({
      athleteId: "athlete-1",
      weekStart: "2026-05-12",
      weekEnd: "2026-05-18",
      overall: null,
      visibleDomains: ["NUTRITION"],
      domains: {
        NUTRITION: {
          plannedSessions: 7,
          loggedSessions: 5,
          adherencePercent: 71,
          context: {
            plannedCaloriesKcal: 2000,
            actualCaloriesKcal: 1800,
            fullItems: 5,
            halfItems: 0,
            notEatenItems: 2,
            totalItems: 7,
          },
        },
      },
    });

    const tiles = buildWeeklyAdherenceMetricTiles(summary);
    expect(tiles.map((tile) => tile.key)).toEqual(["NUTRITION"]);
  });
});

describe("session domain context lines", () => {
  it("renders skills item completion separately from minutes", () => {
    const itemLine = formatSessionItemCompletionLine(
      "SKILL",
      {
        completedItems: 3,
        partialItems: 0,
        missedItems: 3,
        plannedItems: 6,
        completionCredit: 3,
        plannedDurationMinutes: 120,
        actualDurationMinutes: 95,
      },
      2,
    );
    const minuteLines = formatSessionMinutesContextLines({
      completedItems: 3,
      partialItems: 0,
      missedItems: 3,
      plannedItems: 6,
      completionCredit: 3,
      plannedDurationMinutes: 120,
      actualDurationMinutes: 95,
    });

    expect(itemLine).toBe("3 of 6 prescribed skill drills completed");
    expect(itemLine).not.toContain("min");
    expect(itemLine).not.toContain("2 prescribed");
    expect(minuteLines).toEqual([
      "-25 min vs planned",
      "120 min planned · 95 min actual",
    ]);
  });

  it("renders S&C item completion separately from minutes", () => {
    const itemLine = formatSessionItemCompletionLine(
      "STRENGTH_CONDITIONING",
      {
        completedItems: 4,
        partialItems: 0,
        missedItems: 4,
        plannedItems: 8,
        completionCredit: 4,
        plannedDurationMinutes: 180,
        actualDurationMinutes: 210,
      },
      2,
    );
    const minuteLines = formatSessionMinutesContextLines({
      completedItems: 4,
      partialItems: 0,
      missedItems: 4,
      plannedItems: 8,
      completionCredit: 4,
      plannedDurationMinutes: 180,
      actualDurationMinutes: 210,
    });

    expect(itemLine).toBe("4 of 8 prescribed S&C exercises completed");
    expect(itemLine).not.toContain("min");
    expect(itemLine).not.toContain("2 prescribed");
    expect(minuteLines[0]).toBe("+30 min vs planned");
    expect(minuteLines[1]).toContain("180 min planned");
  });

  it("supports weighted completion credit from backend for partial session items", () => {
    const itemLine = formatSessionItemCompletionLine(
      "SKILL",
      {
        completedItems: 7,
        partialItems: 2,
        missedItems: 1,
        plannedItems: 10,
        completionCredit: 8.5,
        plannedDurationMinutes: 0,
        actualDurationMinutes: 0,
      },
      10,
    );

    expect(itemLine).toBe("8.5 of 10 prescribed skill drills completed");
  });

  it("uses item totals from payload instead of plannedSessions fallback", () => {
    const summary = buildItemBasedSummary();
    const skillTile = buildWeeklyAdherenceMetricTiles(summary).find(
      (tile) => tile.key === "SKILL",
    );

    expect(skillTile?.plannedItems).toBe(2);
    expect(
      formatSessionItemCompletionLine(
        "SKILL",
        skillTile?.context as SessionDomainContext,
        skillTile?.plannedItems ?? 0,
      ),
    ).toBe("3 of 6 prescribed skill drills completed");
  });
});

describe("nutrition domain context lines", () => {
  const nutritionContext = {
    plannedCaloriesKcal: 14_000,
    actualCaloriesKcal: 12_500,
    calorieGapKcal: -1500,
    plannedProteinG: 0,
    actualProteinG: 0,
    plannedCarbohydrateG: 0,
    actualCarbohydrateG: 0,
    plannedFatG: 0,
    actualFatG: 0,
    fullItems: 12,
    halfItems: 3,
    notEatenItems: 6,
    extraItems: 0,
    totalItems: 21,
    completionCredit: null,
  };

  it("renders meal item counts separately from calories", () => {
    const itemLine = formatNutritionItemCompletionLine(nutritionContext);
    const statusLine = formatNutritionItemStatusLine(nutritionContext);
    const calorieLine = formatNutritionCalorieContextLine(nutritionContext);

    expect(itemLine).toBe("13.5 of 21 weighted meal-credit followed");
    expect(statusLine).toBe("12 full · 3 half · 6 missed");
    expect(calorieLine).toBe("12,500 / 14,000 kcal");
    expect(itemLine).not.toContain("kcal");
    expect(statusLine).not.toContain("kcal");
  });

  it("supports weighted meal-item completion credit from backend", () => {
    const itemLine = formatNutritionItemCompletionLine({
      ...nutritionContext,
      completionCredit: 14.5,
    });

    expect(itemLine).toBe("14.5 of 21 weighted meal-credit followed");
  });

  it("renders athlete 801 weighted credit line, not raw logged count", () => {
    const parsed = parseWeeklyAdherenceSummaryPayload({
      athleteId: "801",
      weekStart: "2026-05-12",
      weekEnd: "2026-05-18",
      overall: null,
      visibleDomains: ["NUTRITION"],
      domains: {
        NUTRITION: {
          plannedSessions: 31,
          loggedSessions: 15,
          adherencePercent: 41.9,
          context: {
            totalPrescribedItems: 31,
            fullItems: 11,
            halfItems: 4,
            notEatenItems: 0,
            completionCredit: 13,
            plannedCalories: 12_400,
            actualCaloriesKcal: 1557,
          },
        },
      },
    });

    const nutrition = parsed.domains.NUTRITION!;
    const ctx = nutrition.context as NutritionDomainContext;
    expect(nutrition.adherencePercent).toBe(41.9);
    expect(formatNutritionItemCompletionLine(ctx)).toBe(
      "13 of 31 weighted meal-credit followed",
    );
    expect(formatNutritionItemCompletionLine(ctx)).not.toContain("15 of 31");
    expect(formatNutritionItemStatusLine(ctx)).toBe("11 full · 4 half · 0 missed");
    expect(formatNutritionCalorieContextLine(ctx)).toBe("1,557 / 12,400 kcal");
  });

  it("derives weighted credit line from full/half counts when completionCredit is absent", () => {
    const itemLine = formatNutritionItemCompletionLine({
      ...nutritionContext,
      fullItems: 11,
      halfItems: 4,
      notEatenItems: 0,
      totalItems: 31,
      completionCredit: null,
    });

    expect(itemLine).toBe("13 of 31 weighted meal-credit followed");
    expect(itemLine).not.toContain("15 of 31");
  });
});
