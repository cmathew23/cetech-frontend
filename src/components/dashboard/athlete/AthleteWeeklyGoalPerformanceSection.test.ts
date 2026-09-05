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
    expect(html).toContain("Make 8 of 10 from 6 feet");
    expect(html).toContain("PUTT_MAKE_PCT");
    expect(html).toContain("%");
    expect(html).toContain("Higher is better");
    expect(html).toContain("75 %");
    expect(html).toContain("80 %");
    expect(html).toContain("Target not met");
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
    expect(html).toContain("Make 8 of 10");
    expect(html).toContain("Make 6 of 10");
    expect(html).toContain("70 %");
    expect(html).toContain("50 %");
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

    expect(html).toContain("10 %");
    expect(html).toContain("90 %");
    expect(html).toContain("Target met");
    expect(html).not.toContain("Target not met");
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
    expect(html).toContain("Not set");
    expect(html).toContain("Lower is better");
    expect(html).not.toContain("Target met");
    expect(html).not.toContain("Target not met");
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

    expect(html).toContain("No result recorded");
    expect(html).toContain("80 %");
    expect(html).toContain(
      'Weekly Actual</dt><dd class="text-sm text-textPrimary">No result recorded</dd>',
    );
    expect(html).not.toContain(
      'Weekly Actual</dt><dd class="text-sm text-textPrimary">0',
    );
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
    expect(html).toContain("75 %");
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
    expect(html).toContain("Improve putting");
    expect(html).toContain("putting");
    expect(html).toContain("Proximity");
    expect(html).toContain("Make percentage");
    expect(html).toContain(">Z<");
    expect(html).toContain(">Y<");
    expect(html).toContain("8.2 ft");
    expect(html).toContain("75 %");
    expect(html).toContain("70 %");
    expect(html).toContain("No previous result");
    expect(html).toContain("Up");
    expect(html).not.toContain(
      'Previous Actual</dt><dd class="text-sm text-textPrimary">0',
    );
    expect(html.indexOf("Lag putting")).toBeLessThan(html.indexOf("6ft putts"));
    expect(html.indexOf("18/08/2026")).toBe(-1);
    expect(html.indexOf("25/08/2026")).toBeLessThan(html.indexOf("01/09/2026"));
  });

  it("renders Goal history Actual and comparison only when the backend supplies them", () => {
    const html = renderGoals([
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
    ]);

    expect(html).toContain("60 %");
    expect(html).toContain("62 %");
    expect(html).toContain("Target met");
    expect(html).toContain("No Goal history");
    expect(html.indexOf("18/08/2026")).toBeLessThan(html.indexOf("25/08/2026"));
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

    expect(html).toContain("wedge_play");
    expect(html).toContain("putting");
    expect(html).toContain("54");
    expect(html).toContain("0.2");
    expect(html).toContain("-0.1");
    expect(html).toContain("53");
    expect(html).toContain("Rank");
    expect(html).toContain("Not enough data");
    expect(html).not.toContain(
      'Current Week score</dt><dd class="text-sm text-textPrimary">0</dd>',
    );
    expect(html.indexOf("wedge_play")).toBeLessThan(html.indexOf(">putting<"));
    expect(html.indexOf("18/08/2026")).toBeLessThan(html.indexOf("25/08/2026"));
    expect(html).toContain("Strongest taxonomy");
    expect(html).toContain("Weakest taxonomy");
    expect((html.match(/wedge_play/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it("shows a neutral unavailable state when strongest and weakest taxonomies are null", () => {
    const html = renderToStaticMarkup(
      createElement(AthleteTaxonomyPerformanceContent, {
        taxonomyScores: [],
        strongestTaxonomy: null,
        weakestTaxonomy: null,
      }),
    );

    expect(html).toContain("No strongest taxonomy available");
    expect(html).toContain("No weakest taxonomy available");
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
    expect(html).toContain("Coach Practice Performance");
    expect(html).toContain("70");
    expect(html).toContain("Practice-side Performance");
    expect(html).toContain("65");
    expect(html).toContain("putting: 4 · 75");
    expect(html).toContain("wedge_play: Unrated");
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
    expect(html).toContain("Not rated");
    expect(html).toContain("Unavailable");
    expect(html).toContain("putting: Unrated");
    expect(html).not.toContain(
      'Practice-side Performance</dt><dd class="text-sm text-textPrimary">0</dd>',
    );
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
});
