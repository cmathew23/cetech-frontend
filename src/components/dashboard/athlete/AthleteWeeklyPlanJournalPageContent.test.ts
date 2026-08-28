import { describe, expect, it } from "vitest";
import {
  buildNutritionWeeklySummaryRows,
  canLogSportResultForDayDate,
  collectDetailRows,
  collectStructureItemDetailRows,
  deriveNutritionTotalsFromFoodLeaves,
  formatAdherenceStatusLabel,
  formatJournalDomainItemCount,
  formatNutritionMacroInlineClause,
  formatNutritionTotalsCompactLine,
  nutritionTotalsToRows,
} from "@/components/dashboard/athlete/AthleteWeeklyPlanJournalPageContent";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

describe("Log Sport Result planning-date guard", () => {
  const planningToday = "2026-08-03";

  it("enables logging for yesterday", () => {
    expect(canLogSportResultForDayDate("2026-08-02", planningToday)).toBe(true);
  });

  it("enables logging for today", () => {
    expect(canLogSportResultForDayDate("2026-08-03", planningToday)).toBe(true);
  });

  it("disables logging for tomorrow", () => {
    expect(canLogSportResultForDayDate("2026-08-04", planningToday)).toBe(false);
  });

  it("enables logging when the planning date advances to the plan day", () => {
    expect(canLogSportResultForDayDate("2026-08-04", "2026-08-03")).toBe(false);
    expect(canLogSportResultForDayDate("2026-08-04", "2026-08-04")).toBe(true);
  });

  it("disables logging when the plan day date is missing or invalid", () => {
    expect(canLogSportResultForDayDate("", planningToday)).toBe(false);
    expect(canLogSportResultForDayDate("not-a-date", planningToday)).toBe(false);
  });

  it("keeps Practice Facility, Simulator, and On Course modal flows unchanged", () => {
    const modalSource = readFileSync(
      fileURLToPath(new URL("./LogSportResultModal.tsx", import.meta.url)),
      "utf8",
    );

    expect(modalSource).toContain('"PRACTICE_FACILITY"');
    expect(modalSource).toContain('"SIMULATOR"');
    expect(modalSource).toContain('"ACTUAL_ROUND"');
    expect(modalSource).toContain("On Course");
    expect(modalSource).not.toContain("canLogSportResult");
  });

  it("disables the journal Log Sport Result button for future plan days", () => {
    const journalSource = readFileSync(
      fileURLToPath(
        new URL("./AthleteWeeklyPlanJournalPageContent.tsx", import.meta.url),
      ),
      "utf8",
    );

    expect(journalSource).toContain("disabled={!skillsSportMetrics.canLogSportResult}");
    expect(journalSource).toContain("canLogSportResultForDayDate(day.date)");
  });
});

describe("Athlete weekly plan Nutrition presentation", () => {
  it("renders backend-exposed planned weekly Nutrition summary fields", () => {
    const rows = buildNutritionWeeklySummaryRows({
      data: {
        domains: {
          NUTRITION: {
            status: "RELEASED",
            plannedWeeklySummary: {
              plannedWeeklyCaloriesKcal: 13002,
              plannedWeeklyProteinG: 397.4,
              plannedWeeklyCarbsG: 1530.5,
              plannedWeeklyFatG: 590,
              plannedWeeklyFiberG: 112.8,
              averageDailyCaloriesKcal: 1857,
              averageDailyProteinG: 56.8,
              averageDailyCarbsG: 218.6,
              averageDailyFatG: 84.3,
              averageDailyFiberG: 16.1,
            },
          },
        },
        days: [
          {
            nutrition: [
              {
                items: [
                  { calories: 9999, protein: 9999, carbs: 9999, fat: 9999, fiber: 9999 },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(rows).toEqual([
      { label: "Calories", value: "13002 kcal" },
      { label: "Protein", value: "397.4 g" },
      { label: "Carbs", value: "1530.5 g" },
      { label: "Fat", value: "590 g" },
      { label: "Fiber", value: "112.8 g" },
      { label: "Average daily calories", value: "1857 kcal" },
      { label: "Average daily protein", value: "56.8 g" },
      { label: "Average daily carbs", value: "218.6 g" },
      { label: "Average daily fat", value: "84.3 g" },
      { label: "Average daily fiber", value: "16.1 g" },
    ]);
    expect(rows).not.toContainEqual({ label: "Calories", value: "9999 kcal" });
  });

  it("does not invent missing planned weekly Nutrition summary fields", () => {
    const rows = buildNutritionWeeklySummaryRows({
      data: {
        domains: {
          NUTRITION: {
            status: "RELEASED",
            weeklySummary: {
              weeklyCaloriesKcal: 2000,
              weeklyFiberG: 21,
            },
          },
        },
      },
    });

    expect(rows).toEqual([
      { label: "Calories", value: "2000 kcal" },
      { label: "Fiber", value: "21 g" },
    ]);
  });

  it("renders one daily Nutrition target shape with calories, macros, and fiber", () => {
    const totals = deriveNutritionTotalsFromFoodLeaves([
      { calories: 138, protein: 4.6, carbohydrates: 28.2, fat: 0.3, fiber: 2.3 },
      { calories: 266, protein: 3.6, carbs: 8.3, fat: 25, fiberGrams: 6.7 },
      { calories: 65, protein: 1.8, carbohydrateGrams: 9.1, fat: 2.4, fiberG: 0.3 },
    ]);

    expect(nutritionTotalsToRows(totals)).toEqual([
      { label: "Calories", value: "469 kcal" },
      { label: "Protein", value: "10 g" },
      { label: "Carbs", value: "45.6 g" },
      { label: "Fat", value: "27.7 g" },
      { label: "Fiber", value: "9.3 g" },
    ]);
  });

  it("formats food items with one compact macro line", () => {
    expect(
      formatNutritionMacroInlineClause(
        { calories: 138, protein: 4.6, carbs: 28.2, fat: 0.3, fiber: 2.3 },
        { compact: true },
      ),
    ).toBe("138 kcal · P 4.6g · C 28.2g · F 0.3g · Fiber 2.3g");
  });

  it("formats logged intake as one compact meal-level summary", () => {
    expect(
      formatNutritionTotalsCompactLine({
        calories: 469,
        protein: 10.1,
        carbs: 45.6,
        fat: 27.7,
        fiber: 9.3,
      }),
    ).toBe("469 kcal · Protein 10.1g · Carbs 45.6g · Fat 27.7g · Fiber 9.3g");
  });

  it("formats selected-day compact domain counts", () => {
    expect(formatJournalDomainItemCount(1)).toBe("1 item released");
    expect(formatJournalDomainItemCount(3)).toBe("3 items released");
  });

  it("formats adherence panel status labels from existing event state", () => {
    expect(formatAdherenceStatusLabel(null)).toBe("Not logged");
    expect(formatAdherenceStatusLabel({ adherenceOutcome: null })).toBe("Logged");
    expect(formatAdherenceStatusLabel({ adherenceOutcome: "COMPLETED" })).toBe("Completed");
    expect(formatAdherenceStatusLabel({ adherenceOutcome: "PARTIAL" })).toBe("Partial");
    expect(formatAdherenceStatusLabel({ adherenceOutcome: "SKIPPED" })).toBe("Skipped");
  });

  it("hides database-style session fields from Skills and S&C default detail rows", () => {
    const rows = collectDetailRows({
      name: "Mobility and Balance Coordination",
      sessionOrder: 3,
      sessionType: "STRENGTH_CONDITIONING",
      hasItems: true,
      itemCount: 2,
      itemTypes: "Exercise",
      objective: "Improve balance and trunk control.",
      plannedDurationMinutes: 28,
      intensity: "Low",
      notes: "Move smoothly.",
    });

    expect(rows).toEqual([
      { label: "Objective", value: "Improve balance and trunk control." },
      { label: "Duration", value: "28 min" },
      { label: "Intensity", value: "Low" },
      { label: "Notes", value: "Move smoothly." },
    ]);
  });

  it("hides database-style drill and exercise item fields from default detail rows", () => {
    const rows = collectStructureItemDetailRows({
      label: "Arabesque",
      itemType: "Exercise",
      order: 1,
      sets: 2,
      reps: "6 each side",
      durationMinutes: 8,
      intensity: "Low",
      notes: "Balance tall.",
    });

    expect(rows).toEqual([
      { label: "Sets", value: "2" },
      { label: "Reps", value: "6 each side" },
      { label: "Duration", value: "8 min" },
      { label: "Intensity", value: "Low" },
      { label: "Notes", value: "Balance tall." },
    ]);
  });

  it("does not flatten videos URLs into generic exercise detail rows", () => {
    const rows = collectStructureItemDetailRows({
      label: "Back squat",
      sets: 3,
      reps: "5",
      videos: [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://youtu.be/abcdefghijk",
      ],
    });
    expect(rows).toEqual([
      { label: "Sets", value: "3" },
      { label: "Reps", value: "5" },
    ]);
    expect(rows.some((row) => row.label === "Videos")).toBe(false);
    expect(JSON.stringify(rows)).not.toContain("youtube.com");
    expect(JSON.stringify(rows)).not.toContain("youtu.be");
  });

  it("does not flatten videos URLs into session-level detail rows", () => {
    const rows = collectDetailRows({
      name: "Lower body",
      objective: "Strength",
      videos: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
    });
    expect(rows.some((row) => row.label === "Videos")).toBe(false);
    expect(JSON.stringify(rows)).not.toContain("youtube.com");
  });
});

describe("S&C demonstration video journal wiring", () => {
  const journalSource = readFileSync(
    fileURLToPath(new URL("./AthleteWeeklyPlanJournalPageContent.tsx", import.meta.url)),
    "utf8",
  );

  it("shows demonstration videos only on S&C structured exercises", () => {
    expect(journalSource).toContain('sandCDomain: adherenceDomainKey === "S_AND_C"');
    expect(journalSource).toContain("{sandCDomain ? (");
    expect(journalSource).toContain(
      "<SandCExerciseDemonstrationVideos videos={mergedSkillItem.videos} />",
    );
    expect(journalSource).toContain(
      'from "@/components/dashboard/shared/SandCExerciseDemonstrationVideos"',
    );
  });

  it("does not add demonstration videos to Skills or Nutrition render branches", () => {
    expect(journalSource).toContain('skillDomain: adherenceDomainKey === "SKILLS"');
    expect(journalSource).toContain("nutritionDomain: domain.key === \"NUTRITION\"");
    expect(journalSource).not.toContain('sandCDomain: adherenceDomainKey === "SKILLS"');
  });
});
