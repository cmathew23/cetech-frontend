import { BasketballWeeklyPerformanceContent } from "@/components/dashboard/athlete/BasketballWeeklyPerformanceSection";
import { parseSportMetricsBasketballWeeklySummaryPayload } from "@/lib/api/sportMetricsBasketball";
import { readFileSync } from "node:fs";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/Card", async () => {
  const { createElement } = await import("react");
  return {
    Card: ({
      title,
      children,
    }: {
      title?: string;
      children: ReactNode;
    }) =>
      createElement(
        "article",
        null,
        title ? createElement("h3", null, title) : null,
        children,
      ),
  };
});

function summaryFrom(data: Record<string, unknown>) {
  return parseSportMetricsBasketballWeeklySummaryPayload({
    success: true,
    data,
  });
}

function renderSummary(data: Record<string, unknown>): string {
  return renderToStaticMarkup(
    createElement(BasketballWeeklyPerformanceContent, {
      summary: summaryFrom(data),
    }),
  );
}

function sectionHtml(html: string, title: string): string {
  const marker = `<h3>${title}</h3>`;
  const start = html.indexOf(marker);
  expect(start).toBeGreaterThan(-1);
  const next = html.indexOf("<h3>", start + marker.length);
  return html.slice(start, next === -1 ? undefined : next);
}

function metricValue(html: string, title: string): string {
  const match = html.match(
    new RegExp(`${title}</h4><p[^>]*>([^<]*)</p>`),
  );
  return match?.[1] ?? "";
}

const firstExercise = {
  exerciseTrends: [
    {
      exerciseName: "Free Throws",
      metricName: "Shot Make Rate",
      unit: "PERCENT",
      currentActual: 80,
      previousActual: null,
      trendScore: null,
      trendDirection: null,
    },
  ],
  taxonomyScores: [
    {
      taxonomyAreaKey: "SHOOTING",
      normalizedScore: null,
      scoreOutOf100: null,
      direction: null,
    },
  ],
  practiceScoreOutOf100: null,
  competitionPerformance: null,
  overallPerformance: null,
};

describe("Basketball weekly performance display", () => {
  it("renders the first exercise currentActual when previousActual and trend are null", () => {
    const html = renderSummary(firstExercise);
    const exercise = sectionHtml(html, "Exercise Performance");

    expect(metricValue(exercise, "Free Throws")).toBe("80");
    expect(exercise).toContain("Metric: Shot Make Rate");
    expect(exercise).toContain("Unit: PERCENT");
    expect(exercise).toContain("First recorded result");
    expect(exercise).not.toContain("Unavailable");
    expect(exercise).not.toContain("Not enough data");
    expect(exercise).not.toContain("Previous: 0");
    expect(exercise).not.toContain("Trend: 0");
  });

  it("shows NO RESULT YET on every null Basketball goal and keeps metric, unit, and target", () => {
    const html = renderSummary({
      goalEvidence: [
        {
          goalId: "goal-dribble",
          goal: {
            goalName: "Improve Ball Control Under Defensive Pressure",
            targetValue: 70,
            primaryMetric: { key: "control_rate", unit: "PERCENT", direction: "HIGHER_IS_BETTER" },
          },
        },
        {
          goalId: "goal-pass",
          goal: {
            goalName: "Improve Pass Selection and Decision Making",
            targetValue: 75,
            primaryMetric: { key: "pass_rate", unit: "PERCENT", direction: "HIGHER_IS_BETTER" },
          },
        },
        {
          goalId: "goal-shot",
          goal: {
            goalName: "Improve Shooting Off the Dribble",
            targetValue: 60,
            primaryMetric: { key: "shot_make_rate", unit: "PERCENT", direction: "HIGHER_IS_BETTER" },
          },
        },
      ],
    });
    const goals = sectionHtml(html, "Goal Performance");

    expect(metricValue(goals, "Improve Ball Control Under Defensive Pressure")).toBe(
      "NO RESULT YET",
    );
    expect(metricValue(goals, "Improve Pass Selection and Decision Making")).toBe(
      "NO RESULT YET",
    );
    expect(metricValue(goals, "Improve Shooting Off the Dribble")).toBe("NO RESULT YET");
    expect(goals).toContain("Metric: control_rate");
    expect(goals).toContain("Unit: PERCENT");
    expect(goals).toContain("Target: 70");
    expect(goals).toContain("Target: 75");
    expect(goals).toContain("Target: 60");
    expect(goals).not.toContain("Unavailable");
    expect(goals).not.toContain("Not enough data");
    expect(goals).not.toContain(">0<");
  });

  it("keeps a draft weekly summary at NO RESULT YET and shows a submitted backend result", () => {
    const draft = renderSummary({
      competitionPerformance: null,
      competitionTaxonomyScores: [
        { taxonomyAreaKey: "DRIBBLING", taxonomyCompetitionScore: null },
        { taxonomyAreaKey: "PASSING", taxonomyCompetitionScore: null },
        { taxonomyAreaKey: "SHOOTING", taxonomyCompetitionScore: null },
      ],
      overallPerformance: null,
    });
    const draftOverall = sectionHtml(draft, "Overall Performance");
    expect(metricValue(draftOverall, "Competition Performance")).toBe("NO RESULT YET");
    expect(draftOverall).toContain("DRIBBLING: NO RESULT YET");
    expect(metricValue(draftOverall, "Overall Performance")).toBe("NO RESULT YET");

    const submitted = renderSummary({
      practiceScoreOutOf100: 40,
      competitionPerformance: 75,
      competitionTaxonomyScores: [
        { taxonomyAreaKey: "DRIBBLING", taxonomyCompetitionScore: 75 },
        { taxonomyAreaKey: "PASSING", taxonomyCompetitionScore: 50 },
        { taxonomyAreaKey: "SHOOTING", taxonomyCompetitionScore: 100 },
      ],
      overallPerformance: 81.25,
    });
    const submittedOverall = sectionHtml(submitted, "Overall Performance");
    expect(metricValue(submittedOverall, "Competition Performance")).toBe("75");
    expect(submittedOverall).toContain("DRIBBLING: 75");
    expect(submittedOverall).toContain("PASSING: 50");
    expect(submittedOverall).toContain("SHOOTING: 100");
    expect(metricValue(submittedOverall, "Overall Performance")).toBe("81.25");
  });

  it("renders null Practice, Competition, and Overall in one Golf-style card as NO RESULT YET", () => {
    const html = renderSummary(firstExercise);
    const overall = sectionHtml(html, "Overall Performance");

    expect(html).not.toContain("<h3>Practice Performance</h3>");
    expect(html).not.toContain("<h3>Competition Performance</h3>");
    expect(metricValue(overall, "Practice Performance")).toBe("NO RESULT YET");
    expect(metricValue(overall, "Competition Performance")).toBe("NO RESULT YET");
    expect(metricValue(overall, "Overall Performance")).toBe("NO RESULT YET");
    expect(overall).not.toContain("Unavailable");
    expect(overall).not.toContain("Not enough data");
    expect(overall).not.toContain(">0<");
  });

  it("does not turn one exercise result into Practice, Competition, or Overall", () => {
    const html = renderSummary({
      ...firstExercise,
      taxonomyScores: [
        {
          taxonomyAreaKey: "SHOOTING",
          normalizedScore: 0.25,
          scoreOutOf100: null,
          direction: null,
        },
      ],
    });

    expect(metricValue(sectionHtml(html, "Taxonomy Performance"), "SHOOTING")).toBe(
      "NO RESULT YET",
    );
    expect(sectionHtml(html, "Taxonomy Performance")).not.toContain("62.5");
    expect(metricValue(html, "Practice Performance")).toBe("NO RESULT YET");
    expect(metricValue(html, "Competition Performance")).toBe("NO RESULT YET");
    expect(metricValue(html, "Overall Performance")).toBe("NO RESULT YET");
    expect(html).not.toContain("62.5");
    expect(html).not.toContain("Golf");
  });

  it("renders backend Competition and Overall values exactly", () => {
    const html = renderSummary({
      exerciseTrends: [],
      goalEvidence: [
        {
          goalId: "goal-shooting",
          goal: { goalName: "Shooting", targetValue: 75 },
          weeklyActual: {
            metricKey: "shot_make_rate",
            unit: "PERCENT",
            value: 73.33,
          },
          targetComparison: {
            targetValue: 75,
            actualValue: 73.33,
            direction: "HIGHER_IS_BETTER",
            targetMet: false,
          },
        },
      ],
      taxonomyScores: [
        { taxonomyAreaKey: "SHOOTING", scoreOutOf100: 62.5, direction: "UP" },
      ],
      practiceScoreOutOf100: 40,
      competitionPerformance: 69.38,
      competitionTaxonomyScores: [
        { taxonomyAreaKey: "SHOOTING", taxonomyCompetitionScore: 91.67 },
      ],
      overallPerformance: 81.25,
    });

    expect(metricValue(sectionHtml(html, "Goal Performance"), "Shooting")).toBe("73.33");
    expect(sectionHtml(html, "Goal Performance")).toContain("Target: 75");
    expect(sectionHtml(html, "Goal Performance")).toContain("Target not met");
    expect(metricValue(sectionHtml(html, "Taxonomy Performance"), "SHOOTING")).toBe("62.5");
    const overall = sectionHtml(html, "Overall Performance");
    expect(metricValue(overall, "Practice Performance")).toBe("40");
    expect(metricValue(overall, "Competition Performance")).toBe("69.38");
    expect(overall).toContain("SHOOTING: 91.67");
    expect(metricValue(overall, "Overall Performance")).toBe("81.25");
    expect(html).not.toContain("Overall Golf");
    expect(html).not.toContain("Golfer");
  });

  it("renders every returned taxonomy, including null scores, without a hardcoded list", () => {
    const html = renderSummary({
      taxonomyScores: [
        { taxonomyAreaKey: "DRIBBLING", normalizedScore: null, scoreOutOf100: null, direction: null },
        { taxonomyAreaKey: "PASSING", normalizedScore: 0, scoreOutOf100: 50, direction: "NEUTRAL" },
        { taxonomyAreaKey: "SHOOTING", normalizedScore: null, scoreOutOf100: null, direction: null },
      ],
    });
    const taxonomy = sectionHtml(html, "Taxonomy Performance");

    expect(metricValue(taxonomy, "DRIBBLING")).toBe("NO RESULT YET");
    expect(metricValue(taxonomy, "PASSING")).toBe("50");
    expect(metricValue(taxonomy, "SHOOTING")).toBe("NO RESULT YET");
    expect(taxonomy).not.toContain("Unavailable");
    expect(taxonomy).not.toContain("Not enough data");
    expect(taxonomy).not.toContain("62.5");
  });

  it("does not mark a target met when the backend omits targetMet", () => {
    const html = renderSummary({
      goalEvidence: [
        {
          goalId: "goal-1",
          goal: { goalName: "Shooting", targetValue: 75 },
          weeklyActual: { attempts: 10, successes: 8, unit: "PERCENT" },
          targetComparison: {
            targetValue: 75,
            actualValue: 10,
            direction: "HIGHER_IS_BETTER",
          },
        },
      ],
    });
    const goal = sectionHtml(html, "Goal Performance");
    expect(metricValue(goal, "Shooting")).toBe("NO RESULT YET");
    expect(goal).toContain("Unit: PERCENT");
    expect(goal).toContain("Target: 75");
    expect(goal).not.toContain("Unavailable");
    expect(goal).not.toContain("Not enough data");
    expect(goal).not.toContain("Target met");
    expect(goal).not.toContain("Target not met");
    expect(goal).not.toContain(">80<");
    expect(goal).not.toContain(">8<");
  });
});

describe("Basketball and Golf performance wiring", () => {
  const section = readFileSync(
    new URL("./BasketballWeeklyPerformanceSection.tsx", import.meta.url),
    "utf8",
  );
  const shell = readFileSync(
    new URL("./AthleteDashboardShell.tsx", import.meta.url),
    "utf8",
  );
  const coach = readFileSync(
    new URL("../coach/CoachAthletePerformancePageContent.tsx", import.meta.url),
    "utf8",
  );

  it("calls Basketball weekly-summary from the athlete dashboard and leaves Golf mounted for Golf", () => {
    const golfAthlete = shell.slice(
      shell.indexOf("function AthleteSportMetricsWithPlanVersion"),
      shell.indexOf("function AthleteBasketballWeeklyPerformance"),
    );
    const basketballAthlete = shell.slice(
      shell.indexOf("function AthleteBasketballWeeklyPerformance"),
      shell.indexOf("export function AthleteDashboardShell"),
    );
    const basketballMount = shell.slice(shell.indexOf('athleteSport === "BASKETBALL"'));

    expect(golfAthlete).toContain("SkillsGolfHistoryComparisonProvider");
    expect(golfAthlete).toContain("<SkillsGolfHistoryWeekSelector />");
    expect(golfAthlete).toContain("<AthleteWeeklyGoalPerformanceSection");
    expect(golfAthlete).toContain("<AthleteCompetitionPerformanceSection");
    expect(golfAthlete).toContain("<OverallGolfPerformanceSection");
    expect(golfAthlete).not.toContain("BasketballWeeklyPerformanceSection");
    expect(golfAthlete).not.toContain("sport-metrics/basketball");

    expect(basketballAthlete).toContain("<BasketballWeeklyPerformanceSection");
    expect(basketballAthlete).toContain("trainingPlanVersionId");
    expect(basketballAthlete).not.toContain("Golf");
    expect(basketballAthlete).not.toContain("sport-metrics/golf");
    expect(basketballMount).toContain("<AthleteBasketballWeeklyPerformance");
    expect(basketballMount).not.toContain("SkillsGolfHistoryComparisonProvider");
    expect(basketballMount).not.toContain("OverallGolfPerformanceSection");

    expect(section).toContain("fetchSportMetricsBasketballWeeklySummary");
    expect(section).not.toContain("fetchSportMetricsGolf");
    expect(section).not.toContain("sport-metrics/golf");
    expect(section).not.toContain("SkillsGolf");
    expect(section).not.toContain("OverallGolf");
    expect(section).not.toContain("?? 0");
    expect(section).not.toContain("|| 0");
    expect(section).not.toContain("0.45");
    expect(section).not.toContain("0.55");
    expect(section).toContain("NO RESULT YET");
    expect(section).toContain("athletePerformanceGridClass(3)");
    expect(section).not.toContain("DRIBBLING");
    expect(section).not.toContain("PASSING");
    expect(section).not.toContain("SHOOTING");
  });

  it("calls Basketball weekly-summary from coach performance and leaves the Golf tree unchanged", () => {
    const golfCoach = coach.slice(
      coach.indexOf('selectedAthleteSport === "GOLF"'),
      coach.indexOf('selectedAthleteSport === "BASKETBALL"'),
    );
    const basketballCoach = coach.slice(
      coach.indexOf('selectedAthleteSport === "BASKETBALL"'),
      coach.indexOf("{showNutritionPerformance"),
    );

    expect(golfCoach).toContain("SkillsGolfHistoryComparisonProvider");
    expect(golfCoach).toContain("<SkillsGolfHistoryWeekSelector />");
    expect(golfCoach).toContain("<AthleteWeeklyGoalPerformanceSection");
    expect(golfCoach).toContain("<SportMetricsSection");
    expect(golfCoach).toContain("<CoachCompetitionPerformanceSection");
    expect(golfCoach).toContain("<OverallGolfPerformanceSection");
    expect(golfCoach).toContain("setGolfWeeklySummaryRefreshKey");
    expect(golfCoach).not.toContain("BasketballWeeklyPerformanceSection");
    expect(golfCoach).not.toContain("setBasketballWeeklySummaryRefreshKey");
    expect(golfCoach).not.toContain("sport-metrics/basketball");

    expect(basketballCoach).toContain("<BasketballWeeklyPerformanceSection");
    expect(basketballCoach).toContain("<CoachBasketballCompetitionSection");
    expect(basketballCoach).toContain("refreshKey={basketballWeeklySummaryRefreshKey}");
    expect(basketballCoach).toContain("onSubmitted={() => {");
    expect(golfCoach).not.toContain("CoachBasketballCompetitionSection");
    expect(basketballCoach).not.toContain("Golf");
    expect(basketballCoach).not.toContain("SkillsGolfHistoryComparisonProvider");
    expect(basketballCoach).not.toContain("CoachCompetitionPerformanceSection");
    expect(basketballCoach).not.toContain("OverallGolfPerformanceSection");
    expect(basketballCoach).not.toContain("<SportMetricsSection");
    expect(section).toContain("fetchSportMetricsBasketballWeeklySummary");
  });

  it("refetches Basketball weekly-summary after a successful coach Basketball entry", () => {
    const successStart = coach.indexOf("onSuccess={() => {");
    const success = coach.slice(successStart, coach.indexOf("}}", successStart) + 2);

    expect(success).toContain(
      "setBasketballWeeklySummaryRefreshKey((current) => current + 1)",
    );
    expect(success).not.toContain("setGolfWeeklySummaryRefreshKey");
    expect(success).not.toContain("fetchSportMetricsGolf");
    expect(section).toContain(
      "[applicable, athleteId, entityId, refreshKey, versionId]",
    );
    expect(section.indexOf("fetchSportMetricsBasketballWeeklySummary(")).toBeGreaterThan(
      section.indexOf("useEffect("),
    );
    expect(section).toContain('if (!applicable) return;');
  });

  it("keeps Golf sport-metrics callers off the Basketball weekly-summary route", () => {
    const golfFiles = [
      "../../../lib/api/sportMetricsGolf.ts",
      "./AthleteWeeklyGoalPerformanceSection.tsx",
      "./OverallGolfPerformanceCard.tsx",
      "./AthleteCompetitionPerformanceSection.tsx",
      "../SportMetricsSection.tsx",
      "../coach/CoachCompetitionPerformanceSection.tsx",
      "../shared/SkillsGolfHistoryComparison.tsx",
    ];
    for (const path of golfFiles) {
      const source = readFileSync(new URL(path, import.meta.url), "utf8");
      expect(source).not.toContain("sport-metrics/basketball");
      expect(source).not.toContain("fetchSportMetricsBasketballWeeklySummary");
    }

    const endpoints = readFileSync(
      new URL("../../../config/endpoints.ts", import.meta.url),
      "utf8",
    );
    expect(endpoints).toContain("/sport-metrics/golf/weekly-summary");
    expect(endpoints).toContain("/sport-metrics/basketball/weekly-summary");
  });
});
