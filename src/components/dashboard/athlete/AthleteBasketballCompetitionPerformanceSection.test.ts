import {
  AthleteBasketballCompetitionPerformanceContent,
  formatMaxTwoDecimals,
  submittedBasketballAssessments,
} from "@/components/dashboard/athlete/AthleteBasketballCompetitionPerformanceSection";
import type { BasketballCompetitionAssessment } from "@/lib/api/sportMetricsBasketball";
import { readFileSync } from "node:fs";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/Card", async () => {
  const { createElement } = await import("react");
  return {
    Card: ({ title, children }: { title?: string; children: ReactNode }) =>
      createElement("article", null, title ? createElement("h3", null, title) : null, children),
  };
});

function assessment(
  overrides: Partial<BasketballCompetitionAssessment>,
): BasketballCompetitionAssessment {
  return {
    id: "assessment-1",
    competitionName: "LBA LOCAL 1",
    competitionDate: "2026-10-01",
    status: "SUBMITTED",
    seasonCycleId: "season-1",
    taxonomyRatings: { DRIBBLING: 3, PASSING: 4, SHOOTING: 3 },
    normalizedTaxonomyScores: { DRIBBLING: 50, PASSING: 75, SHOOTING: 50 },
    competitionPerformance: 58.333333333333336,
    submittedAt: "2026-10-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("AthleteBasketballCompetitionPerformanceSection", () => {
  it("shows submitted backend scores at two decimals and hides drafts", () => {
    const submitted = assessment({});
    const draft = assessment({
      id: "draft-1",
      competitionName: "Hidden draft",
      status: "DRAFT",
      competitionPerformance: 10,
    });
    expect(submittedBasketballAssessments([submitted, draft])).toEqual([submitted]);
    expect(formatMaxTwoDecimals(58.333333333333336)).toBe("58.33");

    const html = renderToStaticMarkup(
      createElement(AthleteBasketballCompetitionPerformanceContent, {
        assessments: [submitted],
        detail: submitted,
        selectedId: submitted.id,
        onSelect: () => undefined,
        currentCompetitionPerformance: 58.33,
        error: null,
        loading: false,
        seasonCycleId: "season-1",
      }),
    );

    expect(html).toContain("Competition Performance");
    expect(html).toContain("LBA LOCAL 1");
    expect(html).toContain("58.33");
    expect(html).toContain("DRIBBLING rating: 3");
    expect(html).toContain("PASSING: 75");
    expect(html).toContain("Status: SUBMITTED");
    expect(html).not.toContain("Hidden draft");
    expect(html).not.toContain("Submit Competition");
    expect(html).not.toContain("58.333333333333336");
  });

  it("loads Basketball competition reads from the weekly-summary season only", () => {
    const source = readFileSync(
      new URL("./AthleteBasketballCompetitionPerformanceSection.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain("fetchSportMetricsBasketballWeeklySummary");
    expect(source).toContain("summary.seasonCycleId");
    expect(source).toContain("fetchBasketballCompetitionAssessments");
    expect(source).toContain("fetchBasketballCompetitionAssessment");
    expect(source).toContain('assessment.status === "SUBMITTED"');
    expect(source).not.toContain("createBasketballCompetitionAssessment");
    expect(source).not.toContain("submitBasketballCompetitionAssessment");
    expect(source).not.toContain("fetchSportMetricsGolf");
    expect(source).not.toContain("sport-metrics/golf");
    expect(source).not.toContain("0.45");
    expect(source).not.toContain("0.55");
  });
});