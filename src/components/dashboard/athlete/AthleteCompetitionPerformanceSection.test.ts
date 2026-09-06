import {
  AthleteCompetitionHistoryList,
  AthleteCompetitionHoleSummaryFields,
  AthleteCompetitionOgpCheckpoint,
  AthleteCompetitionPerformanceScores,
  AthleteCompetitionReadOnlyHoles,
  AthleteCompetitionSubmittedDetail,
  displayBackendNumber,
} from "@/components/dashboard/athlete/AthleteCompetitionPerformanceSection";
import type {
  GolfCompetitionDetail,
  GolfCompetitionHistoryPoint,
  GolfCompetitionHoleSummary,
} from "@/lib/api/sportMetricsGolfCompetitions";
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

const emptyPar = {
  holesPlayed: 0,
  totalPar: null,
  totalStrokes: null,
  scoreToPar: null,
};

function summary(
  overrides: Partial<GolfCompetitionHoleSummary> = {},
): GolfCompetitionHoleSummary {
  return {
    holesPlayed: 1,
    totalPar: 4,
    totalStrokes: 5,
    scoreToPar: 1,
    albatrossOrBetter: 0,
    eagles: 0,
    birdies: 0,
    pars: 0,
    bogeys: 1,
    doubleBogeys: 0,
    tripleOrWorse: 0,
    fairwaysHitPercent: 50,
    girPercent: 0,
    totalPutts: 2,
    puttsPerHole: 2,
    totalPenaltyStrokes: 0,
    par3: emptyPar,
    par4: { holesPlayed: 1, totalPar: 4, totalStrokes: 5, scoreToPar: 1 },
    par5: emptyPar,
    averageHoleSatisfaction: 4,
    ...overrides,
  };
}

const submittedDetail: GolfCompetitionDetail = {
  id: "competition-1",
  entityId: "entity-1",
  athleteProfileId: "athlete-1",
  createdByUserId: "athlete-user-1",
  trainingPlanId: "skills-plan-1",
  trainingPlanVersionId: "skills-version-1",
  planningContextSnapshotId: "snapshot-1",
  seasonPhase: "PRE_SEASON",
  name: "Club Championship",
  type: "CHAMPIONSHIP",
  format: 18,
  venue: "PeakFlow Golf Club",
  startDate: "2026-09-12T00:00:00.000Z",
  numberOfDays: 1,
  competitionNotes: null,
  status: "SUBMITTED",
  submittedAt: "2026-09-13T08:00:00.000Z",
  createdAt: "2026-09-05T10:00:00.000Z",
  updatedAt: "2026-09-13T08:00:00.000Z",
  days: [
    {
      id: "day-1",
      competitionId: "competition-1",
      dayNumber: 1,
      date: "2026-09-12T00:00:00.000Z",
      weatherConditions: null,
      wind: null,
      courseConditions: null,
      dayNotes: null,
      createdAt: "2026-09-12T10:00:00.000Z",
      updatedAt: "2026-09-12T10:00:00.000Z",
      daySummary: summary(),
      holeResults: [
        {
          id: "hole-1",
          competitionDayId: "day-1",
          holeNumber: 1,
          par: 4,
          strokes: 5,
          fairwayHit: "YES",
          greenInRegulation: false,
          putts: 2,
          penaltyStrokes: 0,
          satisfactionRating: 4,
          notes: "Missed approach",
          createdAt: "2026-09-12T10:00:00.000Z",
          updatedAt: "2026-09-12T10:00:00.000Z",
          scoreToPar: 1,
          outcome: "BOGEY",
        },
      ],
    },
  ],
  competitionSummary: summary(),
  athleteAverageSatisfaction: 4,
  athleteCompetitionScore: 75,
  coachCompetitionAssessment: {
    id: "assessment-1",
    competitionId: "competition-1",
    coachProfileId: "coach-1",
    createdByUserId: "coach-user-1",
    rating: 4,
    notes: "Good decisions",
    coachCompetitionScore: 75,
    createdAt: "2026-09-13T10:00:00.000Z",
    updatedAt: "2026-09-13T10:00:00.000Z",
  },
  coachCompetitionScore: 75,
  competitionPerformance: 75,
  overallGolferPerformanceCheckpoint: {
    id: "ogp-1",
    entityId: "entity-1",
    athleteProfileId: "athlete-1",
    seasonCycleId: "season-2026",
    competitionId: "competition-1",
    practicePerformance: 80,
    competitionPerformance: 75,
    overallGolferPerformance: 77.25,
    checkpointAt: "2026-09-13T10:00:00.000Z",
  },
};

function readPerformanceSource(): string {
  return readFileSync(
    new URL("./AthleteCompetitionPerformanceSection.tsx", import.meta.url),
    "utf8",
  );
}

describe("displayBackendNumber", () => {
  it("does not convert null backend values to zero", () => {
    expect(displayBackendNumber(null)).toBe("Unavailable");
    expect(displayBackendNumber(0)).toBe("0");
    expect(displayBackendNumber(75)).toBe("75");
  });
});

describe("SUBMITTED competition performance display", () => {
  it("renders SUBMITTED detail as read-only backend values", () => {
    const html = renderToStaticMarkup(
      createElement(AthleteCompetitionSubmittedDetail, {
        competition: submittedDetail,
      }),
    );
    expect(html).toContain("Club Championship");
    expect(html).toContain("CHAMPIONSHIP");
    expect(html).toContain("PeakFlow Golf Club");
    expect(html).toContain("PRE_SEASON");
    expect(html).not.toContain("type=\"number\"");
    expect(html).not.toContain("<input");
    expect(html).not.toContain("Save draft");
    expect(html).not.toContain("Submit competition");
  });

  it("renders B4 summary values from the backend response", () => {
    const html = renderToStaticMarkup(
      createElement(AthleteCompetitionHoleSummaryFields, {
        summary: summary({
          scoreToPar: 2,
          fairwaysHitPercent: 50,
          girPercent: 25,
          totalPutts: 6,
          puttsPerHole: 2,
          totalPenaltyStrokes: 3,
        }),
      }),
    );
    expect(html).toContain("Score to Par");
    expect(html).toContain("2");
    expect(html).toContain("50");
    expect(html).toContain("25");
    expect(html).toContain("6");
    expect(html).toContain("3");
  });

  it("renders B6 athlete/coach/Competition Performance from the backend response", () => {
    const html = renderToStaticMarkup(
      createElement(AthleteCompetitionPerformanceScores, {
        athleteCompetitionScore: 75,
        coachCompetitionScore: 50,
        competitionPerformance: 62.5,
      }),
    );
    expect(html).toContain("75");
    expect(html).toContain("50");
    expect(html).toContain("62.5");
  });

  it("renders Unavailable for null B4/B6 values instead of zero", () => {
    const html = renderToStaticMarkup(
      createElement(AthleteCompetitionHoleSummaryFields, {
        summary: summary({
          scoreToPar: null,
          fairwaysHitPercent: null,
          girPercent: null,
          totalPutts: null,
          puttsPerHole: null,
          totalPenaltyStrokes: null,
        }),
      }),
    );
    const scores = renderToStaticMarkup(
      createElement(AthleteCompetitionPerformanceScores, {
        athleteCompetitionScore: null,
        coachCompetitionScore: null,
        competitionPerformance: null,
      }),
    );
    expect(html).toContain("Unavailable");
    expect(scores).toContain("Unavailable");
    expect(html).not.toMatch(/>0</);
    expect(scores).not.toMatch(/>0</);
  });

  it("renders backend hole scoreToPar, outcome, satisfaction, and notes", () => {
    const html = renderToStaticMarkup(
      createElement(AthleteCompetitionReadOnlyHoles, {
        holes: submittedDetail.days[0]!.holeResults,
      }),
    );
    expect(html).toContain("Hole 1");
    expect(html).toContain("BOGEY");
    expect(html).toContain("Missed approach");
    expect(html).toContain("4");
  });
});

describe("OGP checkpoint display", () => {
  it("renders backend Practice / Competition / OGP values", () => {
    const html = renderToStaticMarkup(
      createElement(AthleteCompetitionOgpCheckpoint, {
        checkpoint: submittedDetail.overallGolferPerformanceCheckpoint,
      }),
    );
    expect(html).toContain("80");
    expect(html).toContain("75");
    expect(html).toContain("77.25");
  });

  it("renders pending state when checkpoint is null", () => {
    const html = renderToStaticMarkup(
      createElement(AthleteCompetitionOgpCheckpoint, {
        checkpoint: null,
      }),
    );
    expect(html).toContain("Competition performance required");
    expect(html).not.toContain("0.45");
  });
});

describe("history season scope", () => {
  it("renders backend history fields without mixing seasons", () => {
    const item: GolfCompetitionHistoryPoint = {
      id: "competition-1",
      name: "Club Championship",
      type: "CHAMPIONSHIP",
      format: 18,
      venue: "PeakFlow Golf Club",
      startDate: "2026-09-12T00:00:00.000Z",
      numberOfDays: 1,
      seasonPhase: "PRE_SEASON",
      seasonCycleId: "season-2026",
      seasonYear: 2026,
      status: "SUBMITTED",
      competitionSummary: summary({ scoreToPar: 2 }),
      athleteAverageSatisfaction: null,
      athleteCompetitionScore: 75,
      coachCompetitionAssessment: null,
      coachCompetitionScore: null,
      competitionPerformance: null,
      overallGolferPerformanceCheckpoint: null,
    };
    const html = renderToStaticMarkup(
      createElement(AthleteCompetitionHistoryList, {
        items: [item],
        selectedId: item.id,
        onSelect: () => {},
      }),
    );
    expect(html).toContain("Club Championship");
    expect(html).toContain("CHAMPIONSHIP");
    expect(html).toContain("PeakFlow Golf Club");
    expect(html).toContain("2026");
    expect(html).toContain("Score to Par");
    expect(html).toContain("2");
    expect(html).toContain("Competition Performance");
    expect(html).toContain("Unavailable");
    expect(html).not.toContain("Athlete Competition Score");
    expect(html).not.toContain("Coach Competition Score");
    expect(html).not.toContain("Overall Golfer Performance");
  });

  it("requests history with backend weekly-summary seasonCycleId and does not infer season from date", () => {
    const source = readPerformanceSource();
    expect(source).toContain("fetchSportMetricsGolfWeeklySummary");
    expect(source).toContain("summary.seasonCycleId");
    expect(source).toContain("fetchGolfCompetitionHistory({");
    expect(source).toContain("seasonCycleId: nextSeasonCycleId");
    expect(source).not.toContain("getFullYear");
    expect(source).not.toContain("new Date()");
    expect(source).not.toContain("seasonCycleId: competition.startDate");
  });
});

describe("no frontend derived competition or OGP calculations", () => {
  it("does not compute scores, percentages, or OGP in the performance UI", () => {
    const source = readPerformanceSource();
    expect(source).not.toContain("strokes -");
    expect(source).not.toContain("0.45 *");
    expect(source).not.toContain("0.55 *");
    expect(source).not.toContain("(rating - 1)");
    expect(source).not.toContain("fairwaysHit /");
    expect(source).toContain("displayBackendNumber");
    expect(source).not.toContain("postGolfCoachCompetitionAssessment");
  });
});

describe("F5 presentation", () => {
  it("shows Overall Golfer Performance in history only when a backend checkpoint exists", () => {
    const withCheckpoint: GolfCompetitionHistoryPoint = {
      id: "competition-1",
      name: "Club Championship",
      type: "CHAMPIONSHIP",
      format: 18,
      venue: "PeakFlow Golf Club",
      startDate: "2026-09-12T00:00:00.000Z",
      numberOfDays: 1,
      seasonPhase: "PRE_SEASON",
      seasonCycleId: "season-2026",
      seasonYear: 2026,
      status: "SUBMITTED",
      competitionSummary: summary({ scoreToPar: 2 }),
      athleteAverageSatisfaction: null,
      athleteCompetitionScore: 75,
      coachCompetitionAssessment: null,
      coachCompetitionScore: null,
      competitionPerformance: 62.5,
      overallGolferPerformanceCheckpoint: {
        id: "ogp-1",
        entityId: "entity-1",
        athleteProfileId: "athlete-1",
        seasonCycleId: "season-2026",
        competitionId: "competition-1",
        practicePerformance: 80,
        competitionPerformance: 62.5,
        overallGolferPerformance: 77.25,
        checkpointAt: "2026-09-13T10:00:00.000Z",
      },
    };
    const html = renderToStaticMarkup(
      createElement(AthleteCompetitionHistoryList, {
        items: [withCheckpoint],
        selectedId: withCheckpoint.id,
        onSelect: () => {},
      }),
    );
    expect(html).toContain("Overall Golfer Performance");
    expect(html).toContain("77.25");
    expect(html).toContain("62.5");
  });

  it("keeps selected detail hierarchy on backend values without calculating scores", () => {
    const html = renderToStaticMarkup(
      createElement(AthleteCompetitionSubmittedDetail, {
        competition: submittedDetail,
      }),
    );
    expect(html).toContain("Results");
    expect(html).toContain("Supporting stats");
    expect(html).toContain("Athlete Average Satisfaction");
    expect(html).toContain("Fairways Hit %");
    expect(html).toContain("Practice Performance");
    expect(html).toContain("Checkpoint");
    expect(html).toContain("Day evidence");
    expect(html).toContain("Hole 1 · BOGEY · Score to Par 1");
  });
});
