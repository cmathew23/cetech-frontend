import {
  formatTrainingLoadComparisonPhrase,
  WeeklyTrainingLoadCard,
} from "@/components/dashboard/WeeklyTrainingLoadCard";
import {
  parseTrainingLoadComparison,
  shouldShowWeeklyTrainingLoadCard,
  type TrainingLoadComparison,
} from "@/lib/api/weeklyAdherence";
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
      actions,
      children,
    }: {
      title?: string;
      subtitle?: string;
      actions?: ReactNode;
      children: ReactNode;
    }) =>
      createElement(
        "section",
        null,
        title ? createElement("h2", null, title) : null,
        subtitle ? createElement("p", null, subtitle) : null,
        actions,
        children,
      ),
  };
});

vi.mock("@/components/ui/Badge", async () => {
  const { createElement } = await import("react");
  return {
    Badge: ({ children }: { children: ReactNode }) =>
      createElement("span", null, children),
  };
});

const hours = {
  skillsMinutes: 240,
  skillsHours: 4.0,
  sandCMinutes: 192,
  sandCHours: 3.2,
  totalMinutes: 432,
  totalHours: 7.2,
};

function comparisonPayload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    reportedBaselineHours: 8.5,
    aiPlanned: { ...hours },
    actualCompleted: {
      skillsMinutes: 180,
      skillsHours: 3.0,
      sandCMinutes: 180,
      sandCHours: 3.0,
      totalMinutes: 360,
      totalHours: 6.0,
    },
    plannedVsBaselineHours: -1.3,
    plannedVsBaselinePercent: -15.3,
    plannedVsBaselineStatus: "LOWER",
    actualVsPlannedHours: 0.2,
    actualVsPlannedPercent: 2.8,
    actualVsPlannedStatus: "ABOUT_SAME",
    baselineAvailable: true,
    skillsPlanAvailable: true,
    sandCPlanAvailable: true,
    plannedComplete: true,
    completionDataAvailable: true,
    isCurrentWeek: false,
    completedToDate: false,
    ...overrides,
  };
}

function comparison(
  overrides: Record<string, unknown> = {},
): TrainingLoadComparison {
  return parseTrainingLoadComparison(comparisonPayload(overrides))!;
}

function render(
  props: Partial<Parameters<typeof WeeklyTrainingLoadCard>[0]> & {
    comparison: TrainingLoadComparison | null;
  },
) {
  return renderToStaticMarkup(
    createElement(WeeklyTrainingLoadCard, {
      viewerContext: "ATHLETE",
      visibleDomains: ["SKILL", "STRENGTH_CONDITIONING"],
      ...props,
    }),
  );
}

describe("formatTrainingLoadComparisonPhrase", () => {
  it("uses natural wording instead of signed Lower · -X h", () => {
    expect(formatTrainingLoadComparisonPhrase("LOWER", -11.9)).toBe(
      "11.9 h lower",
    );
    expect(formatTrainingLoadComparisonPhrase("HIGHER", 2)).toBe("2.0 h higher");
    expect(formatTrainingLoadComparisonPhrase("ABOUT_SAME", 0.2)).toBe(
      "About the same",
    );
  });
});

describe("WeeklyTrainingLoadCard", () => {
  it("renders athlete/head cumulative hierarchy, table, and natural comparisons", () => {
    const html = render({ comparison: comparison() });

    expect(html).toContain("Weekly Training Load");
    expect(html).toContain("Reported weekly training");
    expect(html).not.toContain("Reported baseline");
    expect(html).toContain("8.5 h");
    expect(html).toContain("per week");
    expect(html).toContain("AI planned");
    expect(html).toContain("7.2 h");
    expect(html).toContain("Skills + S&amp;C");
    expect(html).toContain("Completed");
    expect(html).toContain("6.0 h");
    expect(html).toContain("Planned");
    expect(html).toContain("Skills");
    expect(html).toContain("4.0 h");
    expect(html).toContain("3.0 h");
    expect(html).toContain("S&amp;C");
    expect(html).toContain("3.2 h");
    expect(html).not.toContain("4.0 h / 3.0 h");
    expect(html).toContain("AI planned vs reported total");
    expect(html).toContain("1.3 h lower");
    expect(html).not.toContain("Lower ·");
    expect(html).not.toContain("−1.3 h");
    expect(html).toContain("Completed vs AI planned");
    expect(html).toContain("About the same");
    expect(html).toContain(
      "Reported total training may include activities outside the Skills and S&amp;C plans.",
    );
    expect(html).not.toContain("Actual completed");
    expect(html).not.toContain("text-danger");
    expect(html).not.toContain("text-success");
    expect(html).not.toContain("Partial plan");
    expect(html).not.toContain("Completed to date");
  });

  it("renders the metric week under the title when dates are provided", () => {
    const html = render({
      comparison: comparison(),
      weekStart: "2026-08-10",
      weekEnd: "2026-08-16",
    });

    expect(html).toContain("10 Aug – 16 Aug 2026");
  });

  it("omits the week line when dates are unavailable", () => {
    const html = render({ comparison: comparison() });
    const missingStart = render({
      comparison: comparison(),
      weekStart: "",
      weekEnd: "2026-08-16",
    });

    expect(html).not.toContain("Aug 2026");
    expect(missingStart).not.toContain("Aug 2026");
  });

  it("uses contract flags for missing/partial/current-week states", () => {
    const html = render({
      comparison: comparison({
        reportedBaselineHours: null,
        baselineAvailable: false,
        plannedComplete: false,
        completionDataAvailable: false,
        isCurrentWeek: true,
        completedToDate: true,
        plannedVsBaselineStatus: null,
        actualVsPlannedStatus: null,
      }),
    });

    expect(html).toContain("Not reported");
    expect(html).toContain("Partial plan");
    expect(html).toContain("Completed to date");
    expect(html).toContain("No completion data yet");
    expect(html).not.toContain("AI planned vs reported total");
  });

  it("shows Skills only for a Skills coach and S&C only for an S&C coach", () => {
    const data = comparison();
    const skillsHtml = render({
      comparison: data,
      viewerContext: "SKILLS",
    });
    const sncHtml = render({
      comparison: data,
      viewerContext: "S_AND_C",
    });
    const headHtml = render({
      comparison: data,
      viewerContext: "HEAD_COACH",
    });

    expect(headHtml).toContain("Skills + S&amp;C");
    expect(skillsHtml).toContain("Skills");
    expect(skillsHtml).toContain("4.0 h");
    expect(skillsHtml).not.toContain("Skills + S&amp;C");
    expect(skillsHtml).not.toContain(">S&amp;C</span>");
    expect(skillsHtml).not.toContain("7.2 h");
    expect(skillsHtml).not.toContain("3.2 h");
    expect(sncHtml).toContain("S&amp;C");
    expect(sncHtml).toContain("3.2 h");
    expect(sncHtml).not.toContain("Skills + S&amp;C");
    expect(sncHtml).not.toContain(">Skills</span>");
    expect(sncHtml).not.toContain("7.2 h");
    expect(sncHtml).not.toContain("4.0 h");
  });

  it("does not render for a nutrition coach or a missing payload", () => {
    expect(
      render({
        comparison: comparison(),
        viewerContext: "NUTRITION",
      }),
    ).toBe("");
    expect(
      shouldShowWeeklyTrainingLoadCard({
        comparison: comparison(),
        viewerContext: "NUTRITION",
      }),
    ).toBe(false);
    expect(
      render({
        comparison: null,
        viewerContext: "ATHLETE",
      }),
    ).toBe("");
  });

  it("hides a domain row when that plan is unavailable", () => {
    const html = render({
      comparison: comparison({ sandCPlanAvailable: false }),
      viewerContext: "HEAD_COACH",
    });
    expect(html).toContain("Skills");
    expect(html).not.toContain("Skills + S&amp;C");
    expect(html).not.toContain(">S&amp;C</span>");
  });

  it("is mounted on athlete and coach adherence dashboards and excluded for nutrition via viewer context", () => {
    const athleteSource = readFileSync(
      new URL("./athlete/AthleteWeeklyAdherenceSection.tsx", import.meta.url),
      "utf8",
    );
    const overviewSource = readFileSync(
      new URL("./coach/CoachWeeklyAdherenceOverview.tsx", import.meta.url),
      "utf8",
    );
    const performanceSource = readFileSync(
      new URL("./coach/CoachAthletePerformancePageContent.tsx", import.meta.url),
      "utf8",
    );

    expect(athleteSource).toContain("WeeklyTrainingLoadCard");
    expect(athleteSource).toContain('viewerContext="ATHLETE"');
    expect(overviewSource).toContain("WeeklyTrainingLoadCard");
    expect(overviewSource).toContain("viewerContext={wearableViewerContext}");
    expect(performanceSource).toContain("WeeklyTrainingLoadCard");
    expect(performanceSource).toContain(
      "viewerContext={wearableViewerContext}",
    );
  });
});
