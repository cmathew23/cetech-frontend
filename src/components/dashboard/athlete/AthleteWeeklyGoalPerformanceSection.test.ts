import {
  AthleteExercisePerformanceContent,
  AthletePracticePerformanceContent,
  AthleteSportsMetricsStep4aContent,
  AthleteTaxonomyPerformanceContent,
  AthleteWeeklyGoalPerformanceContent,
  COACH_PRACTICE_RATING_OPTIONS,
  CoachPracticeRatingForm,
  formatGoalMetricDirection,
} from "@/components/dashboard/athlete/AthleteWeeklyGoalPerformanceSection";
import { parseSportMetricsGolfWeeklySummaryPayload } from "@/lib/api/sportMetricsGolf";
import { readFileSync } from "node:fs";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/Button", async () => {
  const { createElement } = await import("react");
  return {
    Button: ({
      children,
      ...props
    }: {
      children?: ReactNode;
      [key: string]: unknown;
    }) => createElement("button", props, children),
  };
});

vi.mock("@/components/ui/Select", async () => {
  const { createElement } = await import("react");
  return {
    Select: ({
      children,
      ...props
    }: {
      children?: ReactNode;
      [key: string]: unknown;
    }) => createElement("select", props, children),
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
        "article",
        null,
        title ? createElement("h3", null, title) : null,
        subtitle ? createElement("p", null, subtitle) : null,
        children,
      ),
  };
});

function parseSummary(goalEvidence: unknown[]) {
  return parseSportMetricsGolfWeeklySummaryPayload({
    success: true,
    data: {
      sport: "GOLF",
      weekStartDate: "2026-09-01",
      weekEndDate: "2026-09-07",
      goalEvidence,
    },
  });
}

function renderGoals(goalEvidence: unknown[]): string {
  const parsed = parseSummary(goalEvidence);
  return renderToStaticMarkup(
    createElement(AthleteWeeklyGoalPerformanceContent, {
      weekStartDate: parsed.weekStartDate,
      weekEndDate: parsed.weekEndDate,
      goalEvidence: parsed.goalEvidence,
    }),
  );
}

function renderCoachStep4a(data: Record<string, unknown>): string {
  const parsed = parseSportMetricsGolfWeeklySummaryPayload({
    success: true,
    data: {
      sport: "GOLF",
      weekStartDate: "2026-09-01",
      weekEndDate: "2026-09-07",
      ...data,
    },
  });
  return renderToStaticMarkup(
    createElement(AthleteSportsMetricsStep4aContent, {
      summary: parsed,
      allowCoachPracticeRating: true,
      coachRatingForm: createElement("div", null, "Coach form"),
    }),
  );
}

function renderStep4a(data: Record<string, unknown>): string {
  const parsed = parseSportMetricsGolfWeeklySummaryPayload({
    success: true,
    data: {
      sport: "GOLF",
      weekStartDate: "2026-09-01",
      weekEndDate: "2026-09-07",
      ...data,
    },
  });
  return renderToStaticMarkup(
    createElement(AthleteSportsMetricsStep4aContent, { summary: parsed }),
  );
}

describe("AthleteWeeklyGoalPerformanceSection", () => {
  it("renders weekly Goal performance fields from backend Step 3", () => {
    const html = renderGoals([
      {
        goalId: "goal-1",
        goal: {
          goalName: "Improve putting",
          successCriteria: "Make 8 of 10 from 6 feet",
          targetValue: 80,
          primaryMetric: {
            key: "PUTT_MAKE_PCT",
            unit: "%",
            direction: "HIGHER_IS_BETTER",
          },
        },
        weeklyActual: {
          metricKey: "PUTT_MAKE_PCT",
          unit: "%",
          direction: "HIGHER_IS_BETTER",
          value: 75,
          attempts: 20,
          successes: 15,
          recordCount: 2,
        },
        targetComparison: {
          targetValue: 80,
          actualValue: 75,
          direction: "HIGHER_IS_BETTER",
          targetMet: false,
        },
      },
    ]);

    expect(html).toContain("Weekly Goal Performance");
    expect(html).toContain("01/09/2026");
    expect(html).toContain("07/09/2026");
    expect(html).toContain("Improve putting");
    expect(html).toContain("75%");
    expect(html).toContain("Target ≥ 80%");
    expect(html).toContain("TARGET NOT MET");
    expect(html).not.toContain("PUTT_MAKE_PCT");
    expect(html).not.toContain("Success Criterion");
    expect(html).not.toContain("HIGHER_IS_BETTER");
    expect(html).not.toContain("Goal history");
  });

  it("uses the same weekly Goal dashboard hierarchy for coach and athlete", () => {
    const html = renderCoachStep4a({
      goalEvidence: [
        {
          goalId: "goal-1",
          goal: {
            goalName: "Improve putting",
            successCriteria: "Make 8 of 10 from 6 feet",
            targetValue: 80,
            primaryMetric: {
              key: "PUTT_MAKE_PCT",
              unit: "%",
              direction: "HIGHER_IS_BETTER",
            },
          },
          weeklyActual: {
            metricKey: "PUTT_MAKE_PCT",
            unit: "%",
            direction: "HIGHER_IS_BETTER",
            value: 75,
            attempts: 20,
            successes: 15,
            recordCount: 2,
          },
          targetComparison: {
            targetValue: 80,
            actualValue: 75,
            direction: "HIGHER_IS_BETTER",
            targetMet: false,
          },
        },
      ],
    });

    expect(html).toContain("text-3xl font-bold");
    expect(html).toContain("Improve putting");
    expect(html).toContain("75%");
    expect(html).toContain("TARGET NOT MET");
    expect(html).toContain("Coach form");
    expect(html).not.toContain("PUTT_MAKE_PCT");
    expect(html).not.toContain("Goal history");
    expect(html).not.toContain("Success Criterion");
  });

  it("renders multiple Goals independently without merging same-metric items", () => {
    const html = renderGoals([
      {
        goalId: "goal-a",
        goal: {
          goalName: "Putting from 6 feet",
          successCriteria: "Make 8 of 10",
          targetValue: 80,
          primaryMetric: {
            key: "PUTT_MAKE_PCT",
            unit: "%",
            direction: "HIGHER_IS_BETTER",
          },
        },
        weeklyActual: {
          metricKey: "PUTT_MAKE_PCT",
          unit: "%",
          direction: "HIGHER_IS_BETTER",
          value: 70,
          recordCount: 1,
        },
      },
      {
        goalId: "goal-b",
        goal: {
          goalName: "Putting from 10 feet",
          successCriteria: "Make 6 of 10",
          targetValue: 60,
          primaryMetric: {
            key: "PUTT_MAKE_PCT",
            unit: "%",
            direction: "HIGHER_IS_BETTER",
          },
        },
        weeklyActual: {
          metricKey: "PUTT_MAKE_PCT",
          unit: "%",
          direction: "HIGHER_IS_BETTER",
          value: 50,
          recordCount: 1,
        },
      },
    ]);

    expect(html).toContain("Putting from 6 feet");
    expect(html).toContain("Putting from 10 feet");
    expect(html).toContain("70%");
    expect(html).toContain("50%");
    expect(html).not.toContain("Make 8 of 10");
    expect(html).not.toContain("Make 6 of 10");
    expect(html.indexOf("Putting from 6 feet")).toBeLessThan(
      html.indexOf("Putting from 10 feet"),
    );
  });

  it("renders backend targetMet even when Actual and Target would not match a frontend comparison", () => {
    const html = renderGoals([
      {
        goalId: "goal-backend-result",
        goal: {
          goalName: "Backend comparison wins",
          successCriteria: "Hit target",
          targetValue: 90,
          primaryMetric: {
            key: "PUTT_MAKE_PCT",
            unit: "%",
            direction: "HIGHER_IS_BETTER",
          },
        },
        weeklyActual: {
          metricKey: "PUTT_MAKE_PCT",
          unit: "%",
          direction: "HIGHER_IS_BETTER",
          value: 10,
          recordCount: 1,
        },
        targetComparison: {
          targetValue: 90,
          actualValue: 10,
          direction: "HIGHER_IS_BETTER",
          targetMet: true,
        },
      },
    ]);

    expect(html).toContain("10%");
    expect(html).toContain("Target ≥ 90%");
    expect(html).toContain("TARGET MET");
    expect(html).not.toContain("TARGET NOT MET");
  });

  it("keeps Weekly Actual visible with Target Not set and no comparison when target is null", () => {
    const html = renderGoals([
      {
        goalId: "goal-no-target",
        goal: {
          goalName: "No numeric target",
          successCriteria: "Track proximity",
          targetValue: null,
          primaryMetric: {
            key: "WEDGE_PROXIMITY",
            unit: "ft",
            direction: "LOWER_IS_BETTER",
          },
        },
        weeklyActual: {
          metricKey: "WEDGE_PROXIMITY",
          unit: "ft",
          direction: "LOWER_IS_BETTER",
          value: 12.4,
          recordCount: 3,
        },
      },
    ]);

    expect(html).toContain("12.4 ft");
    expect(html).not.toContain("Not set");
    expect(html).not.toContain("LOWER_IS_BETTER");
    expect(html).not.toContain("WEDGE_PROXIMITY");
    expect(html).not.toContain("TARGET MET");
    expect(html).not.toContain("TARGET NOT MET");
    expect(html).not.toContain("Target Result");
  });

  it("shows a neutral missing-result state instead of 0 when weeklyActual is omitted", () => {
    const html = renderGoals([
      {
        goalId: "goal-missing-actual",
        goal: {
          goalName: "No evidence this week",
          successCriteria: "Log putting",
          targetValue: 80,
          primaryMetric: {
            key: "PUTT_MAKE_PCT",
            unit: "%",
            direction: "HIGHER_IS_BETTER",
          },
        },
      },
    ]);

    expect(html).toContain("NO RESULT YET");
    expect(html).toContain("Target ≥ 80%");
    expect(html).not.toContain("No result recorded");
    expect(html).not.toContain("TARGET MET");
    expect(html).not.toContain("TARGET NOT MET");
    expect(html).not.toContain("Target Result");
  });

  it("formats direction labels without introducing metric calculations", () => {
    expect(formatGoalMetricDirection("HIGHER_IS_BETTER")).toBe("Higher is better");
    expect(formatGoalMetricDirection("LOWER_IS_BETTER")).toBe("Lower is better");
    expect(formatGoalMetricDirection("AS_REPORTED")).toBe("AS_REPORTED");

    const source = readFileSync(
      new URL("./AthleteWeeklyGoalPerformanceSection.tsx", import.meta.url),
      "utf8",
    );
    expect(source).not.toContain("successes /");
    expect(source).not.toContain("attempts /");
    expect(source).not.toContain("actualValue >=");
    expect(source).not.toContain("actualValue <=");
    expect(source).not.toContain("targetValue >=");
    expect(source).not.toContain("weeklyActual.value +");
    expect(source).not.toContain("SportMetricsSection");
    expect(source).not.toContain("GolfSportsMetricsComparison");
  });

  it("leaves the athlete dashboard legacy SportMetricsSection unmounted", () => {
    const shell = readFileSync(
      new URL("./AthleteDashboardShell.tsx", import.meta.url),
      "utf8",
    );
    const uncommentedMount = shell
      .split("\n")
      .filter((line) => line.includes("<SportMetricsSection"))
      .filter((line) => !line.trimStart().startsWith("//"));

    expect(uncommentedMount).toEqual([]);
    expect(shell).toContain("//   <SportMetricsSection");
    expect(shell).toContain("<AthleteWeeklyGoalPerformanceSection");
    expect(shell).not.toContain("allowCoachPracticeRating");
  });

  it("requests weekly-summary only when a released Skills versionId is supplied", () => {
    const section = readFileSync(
      new URL("./AthleteWeeklyGoalPerformanceSection.tsx", import.meta.url),
      "utf8",
    );
    const context = readFileSync(
      new URL("./AthleteWeeklyAdherenceContext.tsx", import.meta.url),
      "utf8",
    );

    expect(context).toContain("releasedSkillsTrainingPlanVersionId(journal)");
    expect(section).toContain(
      'if (!hasIdentifiers || versionId === "" || fetchKey === "") return',
    );
    expect(section).toContain("fetchSportMetricsGolfWeeklySummary");
    expect(section).toContain(
      "No Skills plan week available for weekly Goal performance yet.",
    );
  });
});

describe("Athlete Sports Metrics Step 4A", () => {
  it("keeps Step 1 Weekly Goal Performance visible with Step 4A sections", () => {
    const html = renderStep4a({
      goalEvidence: [
        {
          goalId: "goal-1",
          goal: {
            goalName: "Improve putting",
            successCriteria: "Make 8 of 10",
            targetValue: 80,
            primaryMetric: {
              key: "PUTT_MAKE_PCT",
              unit: "%",
              direction: "HIGHER_IS_BETTER",
            },
          },
          weeklyActual: {
            metricKey: "PUTT_MAKE_PCT",
            unit: "%",
            direction: "HIGHER_IS_BETTER",
            value: 75,
          },
        },
      ],
    });

    expect(html).toContain("Weekly Goal Performance");
    expect(html).toContain("Improve putting");
    expect(html).toContain("75%");
    expect(html).toContain("Exercise Performance");
    expect(html).toContain("Taxonomy Performance");
  });

  it("renders Y and Z exercise trends from backend values without calculating trend", () => {
    const html = renderToStaticMarkup(
      createElement(AthleteExercisePerformanceContent, {
        exerciseTrends: parseSportMetricsGolfWeeklySummaryPayload({
          success: true,
          data: {
            exerciseTrends: [
              {
                exerciseId: "ex-z",
                exerciseName: "Lag putting",
                taxonomyAreaKey: "putting",
                linkedGoal: { id: "goal-1", goalName: "Improve putting" },
                metricName: "Proximity",
                unit: "ft",
                direction: "LOWER_IS_BETTER",
                exerciseType: "Z",
                currentActual: 8.2,
                previousActual: null,
                trendDirection: null,
                history: [
                  {
                    planStartDate: "2026-08-25",
                    planEndDate: "2026-08-31",
                    actual: 9,
                  },
                  {
                    planStartDate: "2026-09-01",
                    planEndDate: "2026-09-07",
                    actual: 8.2,
                  },
                ],
              },
              {
                exerciseId: "ex-y",
                exerciseName: "6ft putts",
                taxonomyAreaKey: "putting",
                linkedGoal: { id: "goal-1", goalName: "Improve putting" },
                metricName: "Make percentage",
                unit: "%",
                direction: "HIGHER_IS_BETTER",
                exerciseType: "Y",
                currentActual: 75,
                previousActual: 70,
                trendDirection: "UP",
                history: [],
              },
            ],
          },
        }).exerciseTrends,
      }),
    );

    expect(html).toContain("Lag putting");
    expect(html).toContain("6ft putts");
    expect(html).toContain("Putting");
    expect(html).toContain("8.2 ft");
    expect(html).toContain("75%");
    expect(html).toContain("Previous: 70%");
    expect(html).toContain("First recorded result");
    expect(html).toContain("Improving ↑");
    expect(html).toContain("Lower is better");
    expect(html).toContain("Higher is better");
    expect(html).not.toContain("Proximity");
    expect(html).not.toContain("Make percentage");
    expect(html).not.toContain(">Z<");
    expect(html).not.toContain(">Y<");
    expect(html).not.toContain("Exercise history");
    expect(html).not.toContain("TARGET MET");
    expect(html).not.toContain("No previous result");
    expect(html.indexOf("Lag putting")).toBeLessThan(html.indexOf("6ft putts"));
  });

  it("formats Exercise Performance backend unit enums for athlete display", () => {
    const html = renderToStaticMarkup(
      createElement(AthleteExercisePerformanceContent, {
        exerciseTrends: parseSportMetricsGolfWeeklySummaryPayload({
          success: true,
          data: {
            exerciseTrends: [
              {
                exerciseName: "Step-Through Flow Drill",
                currentActual: 95.88,
                previousActual: 90,
                unit: "MILES_PER_HOUR",
                direction: "HIGHER_IS_BETTER",
              },
              {
                exerciseName: "Lag putting",
                currentActual: 2.32,
                unit: "FEET",
                direction: "LOWER_IS_BETTER",
              },
              {
                exerciseName: "Chalk Line Start Drill",
                currentActual: 100,
                unit: "PERCENTAGE",
                direction: "HIGHER_IS_BETTER",
              },
            ],
          },
        }).exerciseTrends,
      }),
    );

    expect(html).toContain("95.9 mph");
    expect(html).toContain("Previous: 90 mph");
    expect(html).toContain("2.3 ft");
    expect(html).toContain("100%");
    expect(html).toContain("Higher is better");
    expect(html).toContain("Lower is better");
    expect(html).not.toContain("MILES_PER_HOUR");
    expect(html).not.toContain("95.88");
    expect(html).not.toContain("2.32 FEET");
    expect(html).not.toContain("100 PERCENTAGE");
  });

  it("adds linked Goal context on coach exercise cards without report fields", () => {
    const html = renderToStaticMarkup(
      createElement(AthleteExercisePerformanceContent, {
        audience: "coach",
        exerciseTrends: parseSportMetricsGolfWeeklySummaryPayload({
          success: true,
          data: {
            exerciseTrends: [
              {
                exerciseId: "ex-z",
                exerciseName: "Lag putting",
                taxonomyAreaKey: "putting",
                linkedGoal: { id: "goal-1", goalName: "Improve putting" },
                metricName: "Proximity",
                unit: "ft",
                direction: "LOWER_IS_BETTER",
                exerciseType: "Z",
                currentActual: 8.2,
                previousActual: null,
                trendDirection: null,
                history: [
                  {
                    planStartDate: "2026-08-25",
                    planEndDate: "2026-08-31",
                    actual: 9,
                  },
                ],
              },
            ],
          },
        }).exerciseTrends,
      }),
    );

    expect(html).toContain("Improve putting");
    expect(html).toContain("8.2 ft");
    expect(html).toContain("First recorded result");
    expect(html).toContain("text-3xl font-bold");
    expect(html).not.toContain(">Z<");
    expect(html).not.toContain("Proximity");
    expect(html).not.toContain("Exercise history");
  });

  it("hides Goal history for both athlete and coach dashboard cards", () => {
    const payload = [
      {
        goalId: "goal-history",
        goal: {
          goalName: "History goal",
          successCriteria: "Track it",
          targetValue: 80,
          primaryMetric: {
            key: "PUTT_MAKE_PCT",
            unit: "%",
            direction: "HIGHER_IS_BETTER",
          },
        },
        history: [
          {
            planStartDate: "2026-08-18",
            planEndDate: "2026-08-24",
            actual: 60,
            targetValue: 80,
            targetComparison: {
              targetValue: 80,
              actualValue: 60,
              direction: "HIGHER_IS_BETTER",
              targetMet: true,
            },
          },
          {
            planStartDate: "2026-08-25",
            planEndDate: "2026-08-31",
            actual: 62,
          },
        ],
      },
      {
        goalId: "goal-empty-history",
        goal: {
          goalName: "Empty history goal",
          successCriteria: "None",
          targetValue: null,
          primaryMetric: {
            key: "PUTT_MAKE_PCT",
            unit: "%",
            direction: "HIGHER_IS_BETTER",
          },
        },
        history: [],
      },
    ];

    const athleteHtml = renderGoals(payload);
    expect(athleteHtml).not.toContain("Goal history");
    expect(athleteHtml).not.toContain("60 %");
    expect(athleteHtml).toContain("History goal");

    const coachHtml = renderCoachStep4a({ goalEvidence: payload });
    expect(coachHtml).not.toContain("Goal history");
    expect(coachHtml).not.toContain("60 %");
    expect(coachHtml).toContain("History goal");
    expect(coachHtml).toContain("Coach form");
  });

  it("renders taxonomy scores, history order, and nulls without converting them to 0", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        taxonomyScores: [
          {
            taxonomyAreaKey: "wedge_play",
            YTrend: 0.2,
            ZTrend: -0.1,
            scoreOutOf100: 54,
            direction: "HIGHER_IS_BETTER",
            multiWeekScoreOutOf100: 53,
            multiWeekDirection: "HIGHER_IS_BETTER",
            rank: 1,
            history: [
              {
                planStartDate: "2026-08-18",
                planEndDate: "2026-08-24",
                scoreOutOf100: 50,
                direction: "HIGHER_IS_BETTER",
              },
              {
                planStartDate: "2026-08-25",
                planEndDate: "2026-08-31",
                scoreOutOf100: 54,
                direction: "HIGHER_IS_BETTER",
              },
            ],
          },
          {
            taxonomyAreaKey: "putting",
            YTrend: null,
            ZTrend: null,
            scoreOutOf100: null,
            direction: null,
            multiWeekScoreOutOf100: null,
            multiWeekDirection: null,
            history: [],
          },
        ],
        strongestTaxonomy: {
          taxonomyAreaKey: "wedge_play",
          multiWeekScoreOutOf100: 53,
          multiWeekDirection: "HIGHER_IS_BETTER",
          rank: 1,
        },
        weakestTaxonomy: {
          taxonomyAreaKey: "wedge_play",
          multiWeekScoreOutOf100: 53,
          multiWeekDirection: "HIGHER_IS_BETTER",
          rank: 1,
        },
      },
    });

    const html = renderToStaticMarkup(
      createElement(AthleteTaxonomyPerformanceContent, {
        taxonomyScores: parsed.taxonomyScores,
        strongestTaxonomy: parsed.strongestTaxonomy,
        weakestTaxonomy: parsed.weakestTaxonomy,
      }),
    );

    expect(html).toContain("Wedge Play");
    expect(html).toContain("Putting");
    expect(html).toContain("54 / 100");
    expect(html).toContain("Current week");
    expect(html).toContain("BASELINE");
    expect(html).toContain("Trend available after comparable results");
    expect(html).not.toContain("YTrend");
    expect(html).not.toContain("ZTrend");
    expect(html).not.toContain("Taxonomy history");
    expect(html).not.toContain("Not enough data");
    expect(html).toContain("Strongest: Wedge Play");
    expect(html).toContain("Weakest: Wedge Play");
    expect(html.indexOf("Wedge Play")).toBeLessThan(html.indexOf("Putting"));
  });

  it("shows a neutral unavailable state when strongest and weakest taxonomies are null", () => {
    const html = renderToStaticMarkup(
      createElement(AthleteTaxonomyPerformanceContent, {
        taxonomyScores: [],
        strongestTaxonomy: null,
        weakestTaxonomy: null,
      }),
    );

    expect(html).not.toContain("No strongest taxonomy available");
    expect(html).not.toContain("No weakest taxonomy available");
    expect(html).not.toContain("Strongest:");
    expect(html).not.toContain("Weakest:");
  });

  it("does not introduce Step 4A math or Step 4B fields", () => {
    const source = readFileSync(
      new URL("./AthleteWeeklyGoalPerformanceSection.tsx", import.meta.url),
      "utf8",
    );
    expect(source).not.toContain("0.60");
    expect(source).not.toContain("0.40");
    expect(source).not.toContain("YTrend +");
    expect(source).not.toContain("taxonomyScores.sort");
    expect(source).not.toContain("overallScore");
    expect(source).not.toContain("coachMatchRating");
    expect(source).not.toContain("SportMetricsSection");
  });
});

describe("Athlete Sports Metrics Step 4B", () => {
  it("displays backend practice, coach practice, and practice-side scores without using 0 for null", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        practiceScoreOutOf100: 62,
        practiceNormalizedScore: 0.62,
        coachPracticeScoreOutOf100: 70,
        coachPracticeNormalized: 0.7,
        practiceSideScoreOutOf100: 65,
        practiceSideNormalized: 0.65,
        coachPracticeRatings: [
          {
            taxonomyAreaKey: "putting",
            rating: 4,
            coachRatingScoreOutOf100: 75,
          },
        ],
        goalEvidence: [
          { goalId: "g1", goal: { goalName: "Putting", taxonomyAreaKey: "putting" } },
          { goalId: "g2", goal: { goalName: "Wedges", taxonomyAreaKey: "wedge_play" } },
        ],
        taxonomyScores: [{ taxonomyAreaKey: "driving" }],
      },
    });
    const html = renderToStaticMarkup(
      createElement(AthletePracticePerformanceContent, { summary: parsed }),
    );

    expect(html).toContain("Practice Performance");
    expect(html).toContain("62");
    expect(html).not.toContain("62 / 100");
    expect(html).toContain("Putting: Good");
    expect(html).toContain("Coach rating: 4 / 5");
    expect(html).toContain("Practice-side Performance 65 / 100");
    expect(html).not.toContain("Coach Practice Performance 70 / 100");
    expect(html).not.toContain("putting: 4 · 75");
    expect(html).not.toContain("wedge_play: Unrated");
    expect(html).not.toContain("Not enough data");

    const coachHtml = renderToStaticMarkup(
      createElement(AthletePracticePerformanceContent, {
        audience: "coach",
        summary: parsed,
      }),
    );
    expect(coachHtml).toContain("Putting: 4");
    expect(coachHtml).not.toContain("wedge_play: Unrated");
    expect(coachHtml).toContain("text-3xl font-bold");
  });

  it("shows unavailable practice-side and unrated coach scores when backend values are null", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        practiceScoreOutOf100: 50,
        coachPracticeScoreOutOf100: null,
        practiceSideScoreOutOf100: null,
        coachPracticeRatings: [],
        goalEvidence: [
          { goalId: "g1", goal: { goalName: "Putting", taxonomyAreaKey: "putting" } },
        ],
      },
    });
    const html = renderToStaticMarkup(
      createElement(AthletePracticePerformanceContent, { summary: parsed }),
    );

    expect(html).toContain("50");
    expect(html).not.toContain("50 / 100");
    expect(html).toContain("Coach rating: Pending");
    expect(html).not.toContain("Unavailable");
    expect(html).not.toContain("putting: Unrated");
    expect(html).not.toContain("Not rated");
  });

  it("does not expose Coach Practice Rating controls in the athlete Step 4B view", () => {
    const html = renderStep4a({
      practiceScoreOutOf100: 40,
      taxonomyScores: [{ taxonomyAreaKey: "putting" }],
    });
    expect(html).toContain("Practice Performance");
    expect(html).not.toContain("Submit rating");
    expect(html).not.toContain("Very Poor");
    expect(html).not.toContain(">Coach Practice Rating<");
  });

  it("shows Coach Practice Rating controls when Skills plan-generation authority is granted", () => {
    const html = renderCoachStep4a({
      practiceScoreOutOf100: 50,
      taxonomyScores: [{ taxonomyAreaKey: "putting" }],
    });
    expect(html).toContain("Coach form");
    expect(html).toContain("Practice Performance");
    expect(html).toContain("50");
    expect(html).not.toContain("50 / 100");
  });

  it("hides Coach Practice Rating controls without Skills plan-generation authority and keeps read-only practice info", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        practiceScoreOutOf100: 50,
        coachPracticeScoreOutOf100: 60,
        practiceSideScoreOutOf100: 55,
        taxonomyScores: [{ taxonomyAreaKey: "putting" }],
        coachPracticeRatings: [{ taxonomyAreaKey: "putting", rating: 4 }],
      },
    });
    const html = renderToStaticMarkup(
      createElement(AthleteSportsMetricsStep4aContent, {
        summary: parsed,
        audience: "coach",
        allowCoachPracticeRating: false,
        coachRatingForm: createElement("div", null, "Coach form"),
      }),
    );

    expect(html).toContain("Practice Performance");
    expect(html).toContain("50");
    expect(html).not.toContain("50 / 100");
    expect(html).toContain("Coach Practice Performance 60 / 100");
    expect(html).toContain("Putting: 4");
    expect(html).not.toContain("Coach form");
    expect(html).not.toContain("Submit rating");
    expect(html).not.toContain(">Coach Practice Rating<");
  });

  it("shows a baseline week state when practice score is unavailable without fabricating a score", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        practiceScoreOutOf100: null,
        coachPracticeScoreOutOf100: null,
        practiceSideScoreOutOf100: null,
        exerciseTrends: [
          { exerciseName: "Chalk Line Start Drill", currentActual: 100, unit: "%" },
        ],
      },
    });
    const html = renderToStaticMarkup(
      createElement(AthletePracticePerformanceContent, { summary: parsed }),
    );

    expect(html).toContain("NO RESULT YET");
    expect(html).toContain("BASELINE WEEK");
    expect(html).toContain("Coach rating: Pending");
    expect(html).toContain("Exercise results recorded");
    expect(html).toContain("Your trend will appear after another comparable week.");
    expect(html).not.toContain(" / 100");
    expect(html).not.toContain("Not enough data");
    expect(html).not.toContain("Unavailable");
    expect(html).not.toContain("5 exercise results recorded");
  });

  it("makes backend practice score dominant after a coach rating on a baseline week", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        practiceScoreOutOf100: null,
        coachPracticeScoreOutOf100: 50,
        practiceSideScoreOutOf100: null,
        exerciseTrends: [
          { exerciseName: "Chalk Line Start Drill", currentActual: 100, unit: "%" },
        ],
        coachPracticeRatings: [
          {
            taxonomyAreaKey: "putting",
            rating: 3,
            coachRatingScoreOutOf100: 50,
          },
        ],
      },
    });
    const html = renderToStaticMarkup(
      createElement(AthletePracticePerformanceContent, { summary: parsed }),
    );

    expect(html).toContain("50");
    expect(html).not.toContain("50 / 100");
    expect(html).toContain("BASELINE WEEK");
    expect(html).toContain("Putting: Average / Stable");
    expect(html).toContain("Coach rating: 3 / 5");
    expect(html).toContain("Exercise results recorded");
    expect(html).toContain("Your trend will appear after another comparable week.");
    expect(html).not.toContain("Coach Practice Performance 50 / 100");
    expect(html).not.toContain("Exercise evidence recorded");
  });

  it("uses dashboard practice cards for coaches and keeps rating actions", () => {
    const html = renderCoachStep4a({
      practiceScoreOutOf100: null,
      exerciseTrends: [
        { exerciseName: "Lag putting", currentActual: 2.32, unit: "ft" },
      ],
      taxonomyScores: [
        {
          taxonomyAreaKey: "putting",
          YTrend: 0.2,
          ZTrend: -0.1,
          scoreOutOf100: null,
        },
      ],
    });
    expect(html).toContain("Coach form");
    expect(html).toContain("BASELINE WEEK");
    expect(html).toContain("BASELINE");
    expect(html).toContain("text-3xl font-bold");
    expect(html).not.toContain("YTrend");
    expect(html).not.toContain("Not enough data");
    expect(html).not.toContain("Not rated");
  });

  it("lets a coach POST another rating for an already-rated taxonomy", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        goalEvidence: [
          { goalId: "g1", goal: { goalName: "Putting", taxonomyAreaKey: "putting" } },
        ],
        taxonomyScores: [{ taxonomyAreaKey: "driving" }],
        coachPracticeRatings: [
          {
            taxonomyAreaKey: "putting",
            rating: 3,
            coachRatingScoreOutOf100: 50,
          },
        ],
      },
    });
    const html = renderToStaticMarkup(
      createElement(CoachPracticeRatingForm, {
        summary: parsed,
        taxonomyAreaKey: "putting",
        rating: 5,
        error: null,
        submitting: false,
        onTaxonomyAreaKeyChange: () => undefined,
        onRatingChange: () => undefined,
        onSubmit: () => undefined,
      }),
    );

    expect(html).toContain("Coach Practice Rating");
    expect(html).toContain("Submit rating");
    expect(html).toContain("putting");
    expect(html).toContain("5 — Very Good");
    expect(COACH_PRACTICE_RATING_OPTIONS.map((option) => option.rating)).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });

  it("does not calculate Step 4B scores in the UI", () => {
    const source = readFileSync(
      new URL("./AthleteWeeklyGoalPerformanceSection.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain("submitGolfCoachPracticeRatingThenRefetch");
    expect(source).not.toContain("0.70 *");
    expect(source).not.toContain("practiceSideScoreOutOf100 +");
    expect(source).not.toContain("Overall Golfer Performance");
  });

  it("does not change the Log Sport Result workflow", () => {
    const source = readFileSync(
      new URL("./AthleteWeeklyGoalPerformanceSection.tsx", import.meta.url),
      "utf8",
    );
    const modal = readFileSync(
      new URL("./LogSportResultModal.tsx", import.meta.url),
      "utf8",
    );
    expect(source).not.toContain("LogSportResultModal");
    expect(modal).toContain("Log Sport Result");
  });
});

describe("athlete dashboard visual hierarchy", () => {
  it("renders numeric performance as the dominant athlete value", () => {
    const html = renderGoals([
      {
        goalId: "goal-1",
        goal: {
          goalName: "Improve putting",
          targetValue: 80,
          primaryMetric: { unit: "%", direction: "HIGHER_IS_BETTER" },
        },
        weeklyActual: { value: 75, unit: "%" },
        targetComparison: { targetMet: false },
      },
    ]);
    expect(html).toContain("text-3xl font-bold");
    expect(html).toContain("75%");
  });
});
