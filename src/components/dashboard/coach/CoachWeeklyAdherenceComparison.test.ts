import { CoachWeeklyAdherenceComparison } from "@/components/dashboard/coach/CoachWeeklyAdherenceComparison";
import { readFileSync } from "node:fs";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock(
  "@/components/dashboard/athlete/AthleteWeeklyAdherenceContext",
  async () => {
    const { createElement } = await import("react");
    return {
      WeeklyAdherenceProvider: ({
        entityId,
        athleteId,
        loadCurrentSummary,
        children,
      }: {
        entityId: string;
        athleteId: string;
        loadCurrentSummary: boolean;
        children: ReactNode;
      }) =>
        createElement(
          "div",
          {
            "data-entity-id": entityId,
            "data-athlete-id": athleteId,
            "data-load-current-summary": String(loadCurrentSummary),
          },
          children,
        ),
    };
  },
);

vi.mock(
  "@/components/dashboard/athlete/AthleteWeeklyAdherenceSection",
  async () => {
    const { createElement } = await import("react");
    return {
      AthleteWeeklyAdherenceSection: ({
        comparisonOnly,
      }: {
        comparisonOnly: boolean;
      }) =>
        createElement(
          "section",
          { "data-comparison-only": String(comparisonOnly) },
          "Shared weekly adherence comparison",
        ),
    };
  },
);

describe("CoachWeeklyAdherenceComparison", () => {
  it("reuses the shared provider and Athlete comparison section", () => {
    const markup = renderToStaticMarkup(
      createElement(CoachWeeklyAdherenceComparison, {
        entityId: "entity-1",
        athleteId: "athlete-1",
      }),
    );

    expect(markup).toContain('data-entity-id="entity-1"');
    expect(markup).toContain('data-athlete-id="athlete-1"');
    expect(markup).toContain('data-load-current-summary="false"');
    expect(markup).toContain('data-comparison-only="true"');
    expect(markup).toContain("Shared weekly adherence comparison");
  });

  it("is mounted in the coach Athlete Performance workspace", () => {
    const source = readFileSync(
      new URL("./CoachAthletePerformancePageContent.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain(
      'import { CoachWeeklyAdherenceComparison } from "@/components/dashboard/coach/CoachWeeklyAdherenceComparison"',
    );
    expect(source).toContain("<CoachWeeklyAdherenceComparison");
  });
});
