import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readSection(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

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
    expect(source).toContain("onAssessmentSaved");
    expect(source).toContain("refreshKey={golfWeeklySummaryRefreshKey}");
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

  it("opens the existing Basketball measurement form from a coach-entry deep link", () => {
    expect(source).toContain("parseBasketballCoachEntrySearchParams");
    expect(source).toContain("resolveBasketballCoachEntryExercise");
    expect(source).toContain('selectedAthleteSport === "FOOTBALL"');
    expect(source).toContain('? "FOOTBALL"');
    expect(source).toContain(': "BASKETBALL"');
    expect(source).toContain("sport: coachEntryMeasurementSport");
    expect(source).toContain("<LogSportResultModal");
    expect(source).toContain("This athlete is not in your assigned roster.");
    expect(source).not.toContain("postGolfSportMetricRecord");
    expect(source).toContain(
      "allowCoachPracticeRating={coachHasSkillsPlanGenerationAuthority(",
    );
  });

  it("renders the Football performance block for Head Coach and Skills Coach", () => {
    const football = source.slice(
      source.indexOf("loadHistory={loadFootballPracticeHistoryWeeks}"),
      source.indexOf("{showNutritionPerformance"),
    );
    const golf = source.slice(
      source.indexOf('selectedAthleteSport === "GOLF"'),
      source.indexOf('selectedAthleteSport === "BASKETBALL"'),
    );
    const basketball = source.slice(
      source.indexOf('selectedAthleteSport === "BASKETBALL"'),
      source.indexOf("loadHistory={loadFootballPracticeHistoryWeeks}"),
    );

    expect(source).toContain(
      'showSportMetrics &&\n          selectedAthleteId !== "" &&\n          selectedAthleteSport === "FOOTBALL"',
    );
    expect(football).toContain("<SkillsGolfHistoryWeekSelector />");
    expect(football).toContain("<AthleteWeeklyGoalPerformanceSection");
    expect(football).toContain('sportCode="FOOTBALL"');
    expect(football).toContain('audience="coach"');
    expect(football).toContain(
      "allowCoachPracticeRating={coachHasSkillsPlanGenerationAuthority(",
    );
    expect(football).not.toContain("allowCoachPracticeRating={false}");
    expect(football).toContain("<CoachBasketballCompetitionSection");
    expect(football).toContain('sportCode="FOOTBALL"');
    expect(football).toContain(
      "allowEntry={coachHasSkillsPlanGenerationAuthority(selectedAthlete)}",
    );
    expect(football).toContain("setFootballWeeklySummaryRefreshKey((current) => current + 1)");
    expect(football).toContain("<BasketballWeeklyPerformanceSection");
    expect(football).toContain('sections="overall"');
    expect(football).toContain("refreshKey={footballWeeklySummaryRefreshKey}");
    expect(football).toContain("onSubmitted={() => {");
    expect(football.indexOf("<AthleteWeeklyGoalPerformanceSection")).toBeLessThan(
      football.indexOf("<CoachBasketballCompetitionSection"),
    );
    expect(football.indexOf("<CoachBasketballCompetitionSection")).toBeLessThan(
      football.indexOf("<BasketballWeeklyPerformanceSection"),
    );
    expect(football).toContain("coachHasSkillsPlanGenerationAuthority");
    expect(football).not.toContain("loadBasketballPracticeHistoryWeeks");
    expect(football).not.toContain("fetchSportMetricsGolf");
    expect(football).not.toContain("sport-metrics/basketball");
    expect(football).not.toContain("sport-metrics/golf");
    expect(football).not.toContain("<CoachCompetitionPerformanceSection");
    expect(football).not.toContain("<AthleteBasketballCompetitionPerformanceSection");

    expect(golf).toContain("<OverallGolfPerformanceSection");
    expect(golf).toContain(
      "allowCoachPracticeRating={coachHasSkillsPlanGenerationAuthority(",
    );
    expect(golf).not.toContain("FOOTBALL");
    expect(golf).not.toContain("loadFootballPracticeHistoryWeeks");
    expect(basketball).toContain('sportCode="BASKETBALL"');
    expect(basketball).toContain("loadHistory={loadBasketballPracticeHistoryWeeks}");
    expect(basketball).toContain("<CoachBasketballCompetitionSection");
    expect(basketball).toContain(
      "allowCoachPracticeRating={coachHasSkillsPlanGenerationAuthority(",
    );
    expect(basketball).not.toContain('sportCode="FOOTBALL"');
    expect(basketball).not.toContain("loadFootballPracticeHistoryWeeks");
    expect(source).toContain("coachCanViewNutritionPerformance");
    expect(source).toContain("coachCanViewSandCSessionLoad");
    expect(source).toContain("setAdherenceReloadKey((current) => current + 1)");
    expect(source).toContain("[adherenceReloadKey, entityId, selectedAthleteId]");
    expect(source).toContain("fetchWeeklyAdherenceSummary");

    const practice = readSection("../athlete/AthleteWeeklyGoalPerformanceSection.tsx");
    const footballSubmit = practice.slice(
      practice.indexOf("if (isFootball)"),
      practice.indexOf("} else if (isBasketball)"),
    );
    const basketballStart = practice.indexOf("} else if (isBasketball)");
    const basketballSubmit = practice.slice(
      basketballStart,
      practice.indexOf("submitGolfCoachPracticeRatingThenRefetch", basketballStart),
    );
    expect(footballSubmit).toContain("postFootballCoachPracticeRating");
    expect(footballSubmit).toContain("taxonomyAreaKey");
    expect(footballSubmit).toContain("rating");
    expect(footballSubmit).toContain("trainingPlanVersionId");
    expect(footballSubmit).toContain("fetchSportMetricsFootballWeeklySummary");
    expect(footballSubmit).toContain("onFootballCoachRatingSubmitted?.()");
    expect(footballSubmit).not.toContain("postBasketballCoachPracticeRating");
    expect(football).toContain("onFootballCoachRatingSubmitted={() => {");
    expect(football).toContain(
      "setFootballWeeklySummaryRefreshKey((current) => current + 1);",
    );
    expect(footballSubmit).not.toContain("postGolfCoachPracticeRating");
    expect(basketballSubmit).toContain("postBasketballCoachPracticeRating");
    expect(basketballSubmit).toContain("fetchSportMetricsBasketballWeeklySummary");
    expect(practice).toContain("postGolfCoachPracticeRating");
    expect(practice).toContain("fetchSportMetricsGolfWeeklySummary");
    expect(practice).toContain("{allowCoachPracticeRating ? coachRatingForm : null}");
  });

  it("renders Average Weekly Session Load for Head Coach and S&C Coach", () => {
    expect(source).toContain("<SandCSessionLoadSection");
    expect(source).toContain("coachCanViewSandCSessionLoad");
    expect(source).toContain("showSandCSessionLoad");
    expect(source.indexOf("<WeeklyTrainingLoadCard")).toBeLessThan(
      source.indexOf("<SandCSessionLoadSection"),
    );
  });
});
