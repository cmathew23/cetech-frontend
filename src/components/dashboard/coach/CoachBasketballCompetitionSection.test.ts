import {
  CoachBasketballCompetitionCards,
  CoachBasketballCompetitionResult,
} from "@/components/dashboard/coach/CoachBasketballCompetitionSection";
import type { BasketballCompetitionAssessment } from "@/lib/api/sportMetricsBasketball";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("Coach basketball competition entry", () => {
  it("uses the Competition form fields for backend taxonomy keys and omits Golf fields", () => {
    const source = readFileSync(
      new URL("./CoachBasketballCompetitionSection.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain('label="Competition Name"');
    expect(source).toContain('label="Competition Date"');
    expect(source).toContain("label={`${key} rating`}");
    expect(source).toContain("Create draft");
    expect(source).toContain("{taxonomyKeys.map((key) => (");
    expect(source).not.toContain("holes");
    expect(source).not.toContain("Golf Course");
    expect(source).not.toContain("Fairway");
    expect(source).not.toContain("Venue");
  });

  it("shows DRAFT without a Competition Performance when the backend omits it", () => {
    const html = renderToStaticMarkup(
      createElement(CoachBasketballCompetitionResult, {
        assessment: {
          id: "assessment-1",
          competitionName: "League fixture",
          competitionDate: "2026-10-12",
          status: "DRAFT",
          seasonCycleId: "season-1",
          taxonomyRatings: { DRIBBLING: 4, PASSING: 3, SHOOTING: 5 },
          normalizedTaxonomyScores: null,
          competitionPerformance: null,
          submittedAt: null,
        },
      }),
    );

    expect(html).not.toContain("Competition Performance");
    expect(html).not.toContain(">0<");
  });

  it("keeps the saved competition visible with the backend status and result", () => {
    const assessment: BasketballCompetitionAssessment = {
      id: "assessment-1",
      competitionName: "League fixture",
      competitionDate: "2026-10-12",
      status: "SUBMITTED",
      seasonCycleId: "season-1",
      taxonomyRatings: { DRIBBLING: 1, PASSING: 1, SHOOTING: 1 },
      normalizedTaxonomyScores: { DRIBBLING: 1, PASSING: 1, SHOOTING: 1 },
      competitionPerformance: 75,
      submittedAt: "2026-10-12T00:00:00.000Z",
    };
    const html = renderToStaticMarkup(
      createElement(CoachBasketballCompetitionCards, {
        assessments: [assessment],
        onSelect: () => {},
      }),
    );

    expect(html).toContain("League fixture");
    expect(html).toContain("SUBMITTED");
    expect(html).toContain("DRIBBLING rating: 1");
    expect(html).toContain("Competition Performance: 75");
    expect(html).toContain("DRIBBLING: 1");
    expect(html).not.toContain(">0<");
    expect(html).not.toContain("holes");
  });

  it("creates and submits through Basketball endpoints only", () => {
    const source = readFileSync(
      new URL("./CoachBasketballCompetitionSection.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("fetchSportMetricsBasketballWeeklySummary");
    expect(source).toContain("summary.competitionTaxonomyScores");
    expect(source).toContain("fetchBasketballCompetitionAssessments");
    expect(source).toContain("createBasketballCompetitionAssessment(");
    expect(source).toContain("submitBasketballCompetitionAssessment(");
    expect(source).toContain("Submit competition");
    expect(source).not.toContain("sport-metrics/golf");
    expect(source).not.toContain("fetchGolf");
    expect(source).not.toContain("normalizedTaxonomyScores:");
    expect(source).not.toContain("competitionPerformance:");
    expect(source).not.toContain("(rating - 1)");
    expect(source).not.toContain("DRIBBLING");
    expect(source).not.toContain("PASSING");
    expect(source).not.toContain("SHOOTING");
  });
});
