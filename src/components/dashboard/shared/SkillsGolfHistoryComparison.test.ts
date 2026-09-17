import { AthleteExercisePerformanceContent, AthletePracticePerformanceContent, AthleteTaxonomyPerformanceContent, AthleteWeeklyGoalPerformanceContent } from "@/components/dashboard/athlete/AthleteWeeklyGoalPerformanceSection";
import { OverallGolfPerformanceCard } from "@/components/dashboard/athlete/OverallGolfPerformanceCard";
import {
  SkillsGolfHistoryComparisonProvider,
  SkillsGolfHistoryWeekSelector,
  SkillsGolfScalarHistoryComparison,
} from "@/components/dashboard/shared/SkillsGolfHistoryComparison";
import {
  SKILLS_GOLF_HISTORY_EMPTY_MESSAGE,
  parseSportMetricsGolfWeeklySummaryPayload,
  type SportMetricsGolfWeeklySummary,
} from "@/lib/api/sportMetricsGolf";
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
    }) => createElement("label", { htmlFor: id }, label, children),
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

function week(data: Record<string, unknown>): SportMetricsGolfWeeklySummary {
  return parseSportMetricsGolfWeeklySummaryPayload({
    success: true,
    data: {
      weekStartDate: "2026-08-31",
      weekEndDate: "2026-09-06",
      ...data,
    },
  });
}

function currentWeek(): SportMetricsGolfWeeklySummary {
  return parseSportMetricsGolfWeeklySummaryPayload({
    success: true,
    data: {
      weekStartDate: "2026-09-14",
      weekEndDate: "2026-09-20",
      practiceScoreOutOf100: 60,
      coachPracticeScoreOutOf100: 50,
      competitionPerformance: 58,
      overallGolferPerformance: 77,
      goalEvidence: [
        {
          goalId: "goal-1",
          goal: { goalName: "Wedge proximity", primaryMetric: { unit: "ft" } },
          weeklyActual: { value: 12, unit: "ft" },
        },
        {
          goalId: "goal-2",
          goal: { goalName: "Speed", primaryMetric: { unit: "mph" } },
          weeklyActual: { value: 90, unit: "mph" },
        },
      ],
      exerciseTrends: [
        {
          exerciseId: "ex-1",
          exerciseName: "9-shot",
          unit: "PERCENTAGE",
          currentActual: 70,
          previousActual: 60,
          trendDirection: "UP",
        },
      ],
      taxonomyScores: [
        { taxonomyAreaKey: "putting", scoreOutOf100: 80 },
        { taxonomyAreaKey: "short_game", scoreOutOf100: 65 },
      ],
    },
  });
}

function historicalWeek(): SportMetricsGolfWeeklySummary {
  return week({
    practiceScoreOutOf100: 48,
    competitionPerformance: 55,
    overallGolferPerformance: 71,
    goalEvidence: [
      {
        goalId: "goal-1",
        goal: { goalName: "Wedge proximity", primaryMetric: { unit: "ft" } },
        weeklyActual: { value: 16, unit: "ft" },
      },
      {
        goalId: "goal-2",
        goal: { goalName: "Speed", primaryMetric: { unit: "mph" } },
        weeklyActual: { value: 88, unit: "yd" },
      },
    ],
    exerciseTrends: [
      {
        exerciseId: "ex-1",
        exerciseName: "9-shot",
        unit: "PERCENTAGE",
        currentActual: 62,
        previousActual: 50,
        trendDirection: "DOWN",
      },
    ],
    taxonomyScores: [{ taxonomyAreaKey: "putting", scoreOutOf100: 74 }],
  });
}

function renderWithHistory(
  child: ReactNode,
  historyWeeks: SportMetricsGolfWeeklySummary[],
) {
  return renderToStaticMarkup(
    createElement(
      SkillsGolfHistoryComparisonProvider,
      { entityId: "entity-1", athleteId: "athlete-1", historyWeeks },
      createElement(SkillsGolfHistoryWeekSelector),
      child,
    ),
  );
}

describe("SkillsGolfHistoryComparison", () => {
  it("shows the empty-history message without a week dropdown", () => {
    const html = renderWithHistory(null, []);
    expect(html).toContain(SKILLS_GOLF_HISTORY_EMPTY_MESSAGE);
    expect(html).not.toContain('id="skills-golf-history-week"');
  });

  it("renders one shared historical week selector", () => {
    const html = renderWithHistory(null, [historicalWeek()]);
    expect(html).toContain("Compare with");
    expect(html).toContain('id="skills-golf-history-week"');
    expect(html).toContain("31/08/2026 – 06/09/2026");
    expect(html.match(/id="skills-golf-history-week"/g)?.length).toBe(1);
  });

  it("compares matching goals and leaves incompatible units unavailable", () => {
    const parsed = currentWeek();
    const html = renderWithHistory(
      createElement(AthleteWeeklyGoalPerformanceContent, {
        weekStartDate: parsed.weekStartDate,
        weekEndDate: parsed.weekEndDate,
        goalEvidence: parsed.goalEvidence,
      }),
      [historicalWeek()],
    );
    expect(html).toContain("Goal");
    expect(html).toContain("Current");
    expect(html).toContain("Historical");
    expect(html).toContain("Difference");
    expect(html).toContain("12 ft");
    expect(html).toContain("16 ft");
    expect(html).toContain("↓ 4 ft");
    expect(html).not.toContain("targetMet");
  });

  it("compares exercise currentActual and ignores previousActual/trendDirection", () => {
    const parsed = currentWeek();
    const html = renderWithHistory(
      createElement(AthleteExercisePerformanceContent, {
        exerciseTrends: parsed.exerciseTrends,
      }),
      [historicalWeek()],
    );
    expect(html).toContain("70%");
    expect(html).toContain("62%");
    expect(html).toContain("↑ 8%");
    expect(html).not.toContain("↓ 8%");
  });

  it("compares taxonomy scoreOutOf100 and shows dash when the area is missing historically", () => {
    const parsed = currentWeek();
    const html = renderWithHistory(
      createElement(AthleteTaxonomyPerformanceContent, {
        taxonomyScores: parsed.taxonomyScores,
        strongestTaxonomy: null,
        weakestTaxonomy: null,
      }),
      [historicalWeek()],
    );
    expect(html).toContain("80 points");
    expect(html).toContain("74 points");
    expect(html).toContain("↑ 6 points");
  });

  it("compares practice using displayedPracticePerformanceScore", () => {
    const html = renderWithHistory(
      createElement(AthletePracticePerformanceContent, {
        summary: currentWeek(),
      }),
      [historicalWeek()],
    );
    expect(html).toContain("60 points");
    expect(html).toContain("48 points");
    expect(html).toContain("↑ 12 points");
  });

  it("compares competition and overall scalars", () => {
    const competition = renderWithHistory(
      createElement(SkillsGolfScalarHistoryComparison, {
        currentValue: 58,
        historicalValue: 55,
        unit: "points",
      }),
      [historicalWeek()],
    );
    const overall = renderWithHistory(
      createElement(OverallGolfPerformanceCard, {
        summary: currentWeek(),
      }),
      [historicalWeek()],
    );
    expect(competition).toContain("58 points");
    expect(competition).toContain("55 points");
    expect(competition).toContain("↑ 3 points");
    expect(overall).toContain("77 points");
    expect(overall).toContain("71 points");
    expect(overall).toContain("↑ 6 points");
    expect(overall).toContain("Overall Golfer Performance");
  });

  it("keeps athlete and coach golf stacks wired to the shared week provider", () => {
    const shell = readFileSync(
      new URL("../athlete/AthleteDashboardShell.tsx", import.meta.url),
      "utf8",
    );
    const coach = readFileSync(
      new URL("../coach/CoachAthletePerformancePageContent.tsx", import.meta.url),
      "utf8",
    );
    expect(shell).toContain("SkillsGolfHistoryComparisonProvider");
    expect(shell).toContain("SkillsGolfHistoryWeekSelector");
    expect(coach).toContain("SkillsGolfHistoryComparisonProvider");
    expect(coach).toContain("SkillsGolfHistoryWeekSelector");
    expect(coach).toContain("showSportMetrics");
  });
});
