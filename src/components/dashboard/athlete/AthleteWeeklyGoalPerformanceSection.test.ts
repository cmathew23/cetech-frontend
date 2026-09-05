import {
  AthleteWeeklyGoalPerformanceContent,
  formatGoalMetricDirection,
} from "@/components/dashboard/athlete/AthleteWeeklyGoalPerformanceSection";
import { parseSportMetricsGolfWeeklySummaryPayload } from "@/lib/api/sportMetricsGolf";
import { readFileSync } from "node:fs";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

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
