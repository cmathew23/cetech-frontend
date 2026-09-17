import { NutritionPerformanceCard } from "@/components/dashboard/NutritionPerformanceCard";
import { coachCanViewNutritionPerformance } from "@/components/dashboard/NutritionPerformanceSection";
import { parseNutritionPerformancePayload } from "@/lib/api/nutritionPerformance";
import type { NutritionWeeklySummary } from "@/lib/api/nutritionPerformance";
import { readFileSync } from "node:fs";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/Select", async () => {
  const { createElement } = await import("react");
  return {
    Select: (props: Record<string, unknown>) => createElement("select", props),
  };
});

vi.mock("@/components/ui/FormField", async () => {
  const { createElement } = await import("react");
  return {
    FormField: ({
      id,
      label,
      children,
    }: {
      id: string;
      label: string;
      children: ReactNode;
    }) =>
      createElement(
        "label",
        { htmlFor: id },
        label,
        children,
      ),
  };
});

vi.mock("@/components/ui/Card", async () => {
  const { createElement } = await import("react");
  return {
    Card: ({
      title,
      subtitle,
      children,
    }: {
      title?: string;
      subtitle?: string;
      children: ReactNode;
    }) =>
      createElement(
        "section",
        null,
        title ? createElement("h2", null, title) : null,
        subtitle ? createElement("p", null, subtitle) : null,
        children,
      ),
  };
});

const CONTRACT_PAYLOAD = {
  message: "Nutrition performance fetched successfully",
  data: {
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
        mealType: "DINNER",
        weeklyPlannedCaloriesKcal: 3820.12,
        plannedToDateCaloriesKcal: 2208.04,
        actualToDateCaloriesKcal: 1127.55,
        deviationPercent: -48.93,
      },
      {
        mealType: "BREAKFAST",
        weeklyPlannedCaloriesKcal: 4065.2,
        plannedToDateCaloriesKcal: 2304.83,
        actualToDateCaloriesKcal: 1098.89,
        deviationPercent: -52.32,
      },
      {
        mealType: "LUNCH",
        weeklyPlannedCaloriesKcal: 4281.57,
        plannedToDateCaloriesKcal: 2493.85,
        actualToDateCaloriesKcal: 1260.23,
        deviationPercent: -49.47,
      },
      {
        mealType: "MID_MORNING_SNACK",
        weeklyPlannedCaloriesKcal: 1788.85,
        plannedToDateCaloriesKcal: 1166.99,
        actualToDateCaloriesKcal: 769.69,
        deviationPercent: -34.04,
      },
      {
        mealType: "MID_AFTERNOON_SNACK",
        weeklyPlannedCaloriesKcal: 1505.77,
        plannedToDateCaloriesKcal: 844.26,
        actualToDateCaloriesKcal: 452.53,
        deviationPercent: -46.4,
      },
    ],
  },
};

function renderCard(
  data = parseNutritionPerformancePayload(CONTRACT_PAYLOAD),
  extras: {
    historyWeeks?: NutritionWeeklySummary[];
    historyLoading?: boolean;
    historyError?: string | null;
  } = {},
) {
  return renderToStaticMarkup(
    createElement(NutritionPerformanceCard, { data, ...extras }),
  );
}

function headerOrder(html: string, labels: string[]): number[] {
  return labels.map((label) => html.indexOf(`>${label}<`));
}

function assertIncreasing(indexes: number[]) {
  for (let i = 1; i < indexes.length; i += 1) {
    expect(indexes[i]).toBeGreaterThan(indexes[i - 1]!);
  }
}

describe("NutritionPerformanceCard", () => {
  it("renders one outer Nutrition Performance section with compact metric cards", () => {
    const html = renderCard();
    const source = readFileSync(
      new URL("./NutritionPerformanceCard.tsx", import.meta.url),
      "utf8",
    );

    expect(html.match(/<h2>Nutrition Performance<\/h2>/g)).toEqual([
      "<h2>Nutrition Performance</h2>",
    ]);
    expect(html).toContain("Current plan week: 14/09/2026 – 20/09/2026");
    expect(html).toContain("Nutrient Performance");
    expect(html).toContain("Meal Distribution");
    expect(html).not.toContain("<table");
    expect(html).toContain("Historical Comparison");
    expect(html).toContain(
      "Historical comparison will appear after the first completed Nutrition week.",
    );
    expect(html).not.toContain('id="nutrition-history-week"');
    expect(source).not.toContain("DashboardMetricTile");
    expect(source).toContain("DASHBOARD_METRIC_TILE_CLASS");
    expect(html).not.toContain("Actual / Planned to date");
  });

  it("renders nutrient cards with the previous table values", () => {
    const html = renderCard();
    const nutrientStart = html.indexOf("Nutrient Performance");
    const mealStart = html.indexOf("Meal Distribution");
    const nutrientHtml = html.slice(nutrientStart, mealStart);

    assertIncreasing(
      headerOrder(nutrientHtml, [
        "Calories",
        "Protein",
        "Carbohydrates",
        "Fat",
        "Fiber",
      ]),
    );
    expect(nutrientHtml).toContain("Weekly Target");
    expect(nutrientHtml).toContain("Planned to Date");
    expect(nutrientHtml).toContain("Actual to Date");
    expect(nutrientHtml).toContain("Deviation");
    expect(nutrientHtml).toContain("15,462 kcal");
    expect(nutrientHtml).toContain("9,018 kcal");
    expect(nutrientHtml).toContain("4,709 kcal");
    expect(nutrientHtml).toContain("-47.8%");
    expect(nutrientHtml).toContain("613.1 g");
    expect(nutrientHtml).toContain("356.4 g");
    expect(nutrientHtml).toContain("181.4 g");
    expect(nutrientHtml).toContain("2,145.7 g");
    expect(nutrientHtml).toContain("1,274.7 g");
    expect(nutrientHtml).toContain("671.9 g");
    expect(nutrientHtml).toContain("487.9 g");
    expect(nutrientHtml).toContain("273.5 g");
    expect(nutrientHtml).toContain("142.1 g");
    expect(nutrientHtml).toContain("343.4 g");
    expect(nutrientHtml).toContain("202.0 g");
    expect(nutrientHtml).toContain("90.0 g");
    expect(nutrientHtml).toContain("-55.5%");
  });

  it("renders meal cards in canonical order with the previous table values", () => {
    const html = renderCard();
    const mealHtml = html.slice(html.indexOf("Meal Distribution"));

    assertIncreasing(
      headerOrder(mealHtml, [
        "Breakfast",
        "Mid-morning snack",
        "Lunch",
        "Mid-afternoon snack",
        "Dinner",
      ]),
    );
    expect(mealHtml).toContain("Weekly Target");
    expect(mealHtml).toContain("Planned to Date");
    expect(mealHtml).toContain("Actual to Date");
    expect(mealHtml).toContain("Deviation");
    expect(mealHtml).toContain("4,065 kcal");
    expect(mealHtml).toContain("2,305 kcal");
    expect(mealHtml).toContain("1,099 kcal");
    expect(mealHtml).toContain("-52.3%");
    expect(mealHtml).toContain("1,789 kcal");
    expect(mealHtml).toContain("1,167 kcal");
    expect(mealHtml).toContain("770 kcal");
    expect(mealHtml).toContain("-34.0%");
  });

  it("uses a wrapping grid without page overflow", () => {
    const source = readFileSync(
      new URL("./NutritionPerformanceCard.tsx", import.meta.url),
      "utf8",
    );
    const html = renderCard();

    expect(source).toContain(
      "grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3",
    );
    expect(source).not.toContain("xl:grid-cols-5");
    expect(source).not.toContain("xl:grid-cols-3");
    expect(source).toContain("whitespace-nowrap");
    expect(source).toContain("basis-[65%]");
    expect(source).toContain("basis-[35%]");
    expect(source).not.toContain("overflow-x-auto");
    expect(source).not.toContain("min-w-[");
    expect(source).not.toContain("<table");
    expect(html).toContain("<dl");
    expect(html).toContain("Mid-afternoon snack");
  });

  it("renders null actual as an em dash and numeric zero as zero", () => {
    const html = renderCard(
      parseNutritionPerformancePayload({
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
      }),
    );

    expect(html).toContain("1,000 kcal");
    expect(html).toContain("500 kcal");
    expect(html).toContain("80.0 g");
    expect(html).toContain("40.0 g");
    expect(html).toContain("0 g");
    expect(html).toContain("0 kcal");
    expect(html).toContain("—");
    expect(html).toMatch(
      /Calories<\/h4>[\s\S]*?Actual to Date<\/dt><dd class="[^"]*">—<\/dd>/,
    );
    expect(html).toMatch(
      /Protein<\/h4>[\s\S]*?Actual to Date<\/dt><dd class="[^"]*">0 g<\/dd>/,
    );
    expect(html).toMatch(
      /Breakfast<\/h4>[\s\S]*?Actual to Date<\/dt><dd class="[^"]*">—<\/dd>/,
    );
    expect(html).toMatch(
      /Lunch<\/h4>[\s\S]*?Actual to Date<\/dt><dd class="[^"]*">0 kcal<\/dd>/,
    );
  });

  it("compares current and historical nutrient deviations without extra tables", () => {
    const html = renderCard(parseNutritionPerformancePayload(CONTRACT_PAYLOAD), {
      historyWeeks: [
        {
          athleteId: "athlete-uuid",
          weekStart: "2026-08-24",
          weekEnd: "2026-08-30",
          weeklyTotals: {
            calories: {
              unit: "kcal",
              weeklyPlanned: 1,
              plannedToDate: 1,
              actualToDate: 1,
              deviationPercent: -20,
            },
            protein: null,
            carbohydrates: null,
            fat: null,
            fiber: null,
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
            protein: null,
            carbohydrates: null,
            fat: null,
            fiber: null,
          },
          mealBreakdown: [
            {
              mealType: "BREAKFAST",
              weeklyPlannedCaloriesKcal: 1,
              plannedToDateCaloriesKcal: 1,
              actualToDateCaloriesKcal: 1,
              deviationPercent: null,
            },
          ],
        },
      ],
    });

    expect(html).not.toContain("<table");
    expect(html).toContain("Historical Comparison");
    expect(html).toContain("Week 1 — 24/08/2026 – 30/08/2026");
    expect(html).toContain("Week 2 — 31/08/2026 – 06/09/2026");
    expect(html).toContain(">Nutrient<");
    expect(html).toContain(">Meal<");
    expect(html).toContain(">Calories<");
    expect(html).toContain(">Protein<");
    expect(html).toContain(">Carbohydrates<");
    expect(html).toContain(">Fat<");
    expect(html).toContain(">Fiber<");
    expect(html).toContain("Current Week");
    expect(html).toContain("-47.8%");
    expect(html).toContain("-32.4%");
    expect(html).toContain("↓ 15.4 pp");
    expect(html).not.toContain(
      "Historical comparison will appear after the first completed Nutrition week.",
    );
  });

  it("keeps a null historical deviation unavailable instead of zero", () => {
    const html = renderCard(parseNutritionPerformancePayload(CONTRACT_PAYLOAD), {
      historyWeeks: [
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
              deviationPercent: null,
            },
            protein: null,
            carbohydrates: null,
            fat: null,
            fiber: null,
          },
          mealBreakdown: [],
        },
      ],
    });

    expect(html).toContain("Current Week");
    expect(html).toContain("-47.8%");
    expect(html).toContain("Change");
    expect(html).not.toContain("↓");
    expect(html).not.toContain("↑");
    expect(html).not.toContain("→ 0.0 pp");
    expect(html).toMatch(/<dd class="[^"]*">—<\/dd>/);
  });
});

describe("Nutrition Performance dashboard mounts", () => {
  it("renders Nutrition Performance immediately above Wearables on the athlete dashboard", () => {
    const shell = readFileSync(
      new URL("./athlete/AthleteDashboardShell.tsx", import.meta.url),
      "utf8",
    );
    expect(shell).toContain("<AthleteWeeklyAdherenceSection />");
    expect(shell).toContain("<NutritionPerformanceSection");
    expect(shell).toContain(
      "<AthleteNutritionPerformanceWithPlanWindow\n            entityId={entityId}\n            athleteId={athleteId}\n          />\n          <AthleteWearableSummaryWithPlanWindow",
    );
  });

  it("renders Nutrition Performance on Head Coach and Nutrition Coach athlete performance views", () => {
    const performance = readFileSync(
      new URL("./coach/CoachAthletePerformancePageContent.tsx", import.meta.url),
      "utf8",
    );
    expect(performance).toContain("<WeeklyAdherenceCards");
    expect(performance).toContain("<NutritionPerformanceSection");
    expect(performance).toContain("coachCanViewNutritionPerformance");
    expect(performance.indexOf("<WeeklyAdherenceCards")).toBeLessThan(
      performance.indexOf("<NutritionPerformanceSection"),
    );
    expect(performance.indexOf("<OverallGolfPerformanceSection")).toBeLessThan(
      performance.indexOf("<NutritionPerformanceSection"),
    );
    expect(performance.indexOf("<NutritionPerformanceSection")).toBeLessThan(
      performance.indexOf("<WearableSummarySection"),
    );
  });

  it("keeps Weekly Adherence and Overall Golf Performance mounts unchanged besides Nutrition Performance insertion", () => {
    const shell = readFileSync(
      new URL("./athlete/AthleteDashboardShell.tsx", import.meta.url),
      "utf8",
    );
    const performance = readFileSync(
      new URL("./coach/CoachAthletePerformancePageContent.tsx", import.meta.url),
      "utf8",
    );
    const weeklyAdherence = readFileSync(
      new URL("./WeeklyAdherenceCards.tsx", import.meta.url),
      "utf8",
    );
    const overall = readFileSync(
      new URL("./athlete/OverallGolfPerformanceCard.tsx", import.meta.url),
      "utf8",
    );

    expect(shell).toContain("<AthleteWeeklyAdherenceSection />");
    expect(shell).toContain("<OverallGolfPerformanceSection");
    expect(performance).toContain("<WeeklyAdherenceCards");
    expect(performance).toContain("<OverallGolfPerformanceSection");
    expect(weeklyAdherence).toContain('title="Weekly Adherence"');
    expect(overall).toContain('title="Overall Golf Performance"');
    expect(weeklyAdherence).not.toContain("NutritionPerformance");
    expect(overall).not.toContain("NutritionPerformance");
  });
});

describe("coachCanViewNutritionPerformance", () => {
  it("allows Head Coach and Nutrition Coach and denies Skills-only and S&C-only", () => {
    expect(
      coachCanViewNutritionPerformance({
        academyCoachRole: "HEAD_COACH",
        functions: [],
      }),
    ).toBe(true);
    expect(
      coachCanViewNutritionPerformance({
        academyCoachRole: "COACH",
        functions: ["NUTRITION_COACH"],
      }),
    ).toBe(true);
    expect(
      coachCanViewNutritionPerformance({
        academyCoachRole: "COACH",
        functions: ["SKILLS_COACH", "NUTRITION"],
      }),
    ).toBe(true);
    expect(
      coachCanViewNutritionPerformance({
        academyCoachRole: "COACH",
        functions: ["SKILLS_COACH"],
      }),
    ).toBe(false);
    expect(
      coachCanViewNutritionPerformance({
        academyCoachRole: "COACH",
        functions: ["S_AND_C_COACH"],
      }),
    ).toBe(false);
    expect(
      coachCanViewNutritionPerformance({
        academyCoachRole: "COACH",
        functions: ["STRENGTH_AND_CONDITIONING"],
      }),
    ).toBe(false);
  });
});
