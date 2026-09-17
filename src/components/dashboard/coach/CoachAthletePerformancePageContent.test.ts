import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("CoachAthletePerformancePageContent Coach Practice Rating authority", () => {
  const source = readFileSync(
    new URL("./CoachAthletePerformancePageContent.tsx", import.meta.url),
    "utf8",
  );

  it("reuses Skills plan-generation ownership instead of a role-based rating gate", () => {
    expect(source).toContain("coachHasSkillsPlanGenerationAuthority");
    expect(source).toContain(
      "allowCoachPracticeRating={coachHasSkillsPlanGenerationAuthority(",
    );
    expect(source).toContain("audience=\"coach\"");
    expect(source).not.toContain("currentCoachIsHeadCoach");
    expect(source).not.toMatch(/^\s*allowCoachPracticeRating\s*$/m);
  });

  it("hides the legacy SPORT Metrics evidence card and keeps SportMetricsSection comparison", () => {
    expect(source).toContain("<SportMetricsSection");
    expect(source).toContain("hideWeeklyEvidenceCard");
    expect(source).not.toContain("SportMetricsEvidenceCards");
  });

  it("renders Overall Golf Performance above Wearables for Head Coach and Skills Coach", () => {
    expect(source).toContain("<OverallGolfPerformanceSection");
    expect(source.indexOf("<OverallGolfPerformanceSection")).toBeLessThan(
      source.indexOf("<WearableSummarySection"),
    );
  });

  it("renders Nutrition Performance immediately above Wearables for Head Coach and Nutrition Coach", () => {
    expect(source).toContain("<NutritionPerformanceSection");
    expect(source).toContain("coachCanViewNutritionPerformance");
    expect(source).toContain("showNutritionPerformance");
    expect(source.indexOf("<WeeklyAdherenceCards")).toBeLessThan(
      source.indexOf("<NutritionPerformanceSection"),
    );
    expect(source.indexOf("<NutritionPerformanceSection")).toBeLessThan(
      source.indexOf("<WearableSummarySection"),
    );
  });
});
