import {
  AthleteCompetitionSubmittedDetail,
  displayBackendNumber,
} from "@/components/dashboard/athlete/AthleteCompetitionPerformanceSection";
import {
  canShowCoachCompetitionAssessmentForm,
  CoachCompetitionAssessmentForm,
  submitCoachCompetitionAssessmentThenRefetch,
} from "@/components/dashboard/coach/CoachCompetitionPerformanceSection";
import type { GolfCompetitionDetail } from "@/lib/api/sportMetricsGolfCompetitions";
import { readFileSync } from "node:fs";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { postGolfCoachCompetitionAssessmentMock, fetchGolfCompetitionMock } =
  vi.hoisted(() => ({
    postGolfCoachCompetitionAssessmentMock: vi.fn(),
    fetchGolfCompetitionMock: vi.fn(),
  }));

vi.mock("@/lib/api/sportMetricsGolfCompetitions", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/api/sportMetricsGolfCompetitions")>();
  return {
    ...actual,
    postGolfCoachCompetitionAssessment: postGolfCoachCompetitionAssessmentMock,
    fetchGolfCompetition: fetchGolfCompetitionMock,
  };
});

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

vi.mock("@/components/ui/FormField", async () => {
  const { createElement } = await import("react");
  return {
    FormField: ({
      label,
      children,
    }: {
      label?: string;
      children: ReactNode;
    }) =>
      createElement(
        "div",
        null,
        label ? createElement("label", null, label) : null,
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

const summary = {
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
  girPercent: null,
  totalPutts: 2,
  puttsPerHole: 2,
  totalPenaltyStrokes: 0,
  par3: emptyPar,
  par4: { holesPlayed: 1, totalPar: 4, totalStrokes: 5, scoreToPar: 1 },
  par5: emptyPar,
  averageHoleSatisfaction: 4,
};

function submittedDetail(
  overrides: Partial<GolfCompetitionDetail> = {},
): GolfCompetitionDetail {
  return {
    id: "competition-1",
    entityId: "entity-1",
    athleteProfileId: "athlete-1",
    createdByUserId: "athlete-user-1",
    trainingPlanId: "skills-plan-1",
    trainingPlanVersionId: "skills-version-1",
    planningContextSnapshotId: "snapshot-1",
    seasonPhase: "IN_SEASON",
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
        daySummary: summary,
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
    competitionSummary: summary,
    athleteAverageSatisfaction: 4,
    athleteCompetitionScore: 75,
    coachCompetitionAssessment: null,
    coachCompetitionScore: null,
    competitionPerformance: null,
    overallGolferPerformanceCheckpoint: null,
    ...overrides,
  };
}

function readCoachSource(): string {
  return readFileSync(
    new URL("./CoachCompetitionPerformanceSection.tsx", import.meta.url),
    "utf8",
  );
}

function readPageSource(): string {
  return readFileSync(
    new URL("./CoachAthletePerformancePageContent.tsx", import.meta.url),
    "utf8",
  );
}

describe("coach competition season scope", () => {
  it("requests history with backend weekly-summary seasonCycleId and does not infer season from date", () => {
    const source = readCoachSource();
    expect(source).toContain("fetchSportMetricsGolfWeeklySummary");
    expect(source).toContain("summary.seasonCycleId");
    expect(source).toContain("fetchGolfCompetitionHistory({");
    expect(source).toContain("seasonCycleId: nextSeasonCycleId");
    expect(source).not.toContain("getFullYear");
    expect(source).not.toContain("new Date()");
    expect(source).not.toContain("seasonCycleId: competition.startDate");
    expect(source).not.toContain("fetchGolfCompetitions");
    expect(readPageSource()).toContain("releasedSkillsTrainingPlanVersionId(journal)");
    expect(readPageSource()).toContain("<CoachCompetitionPerformanceSection");
    expect(readPageSource()).toContain("trainingPlanVersionId={trainingPlanVersionId}");
  });

  it("loads SUBMITTED detail after history selection", () => {
    const source = readCoachSource();
    expect(source).toContain("onSelect={setSelectedId}");
    expect(source).toContain("fetchGolfCompetition({");
    expect(source).toContain('result.competition.status !== "SUBMITTED"');
    expect(source).toContain("<AthleteCompetitionSubmittedDetail");
  });
});

describe("coach read-only evidence", () => {
  it("renders full backend evidence read-only", () => {
    const html = renderToStaticMarkup(
      createElement(AthleteCompetitionSubmittedDetail, {
        competition: submittedDetail({
          coachCompetitionAssessment: {
            id: "assessment-1",
            competitionId: "competition-1",
            coachProfileId: "coach-1",
            createdByUserId: "coach-user",
            rating: 4,
            notes: "Good decisions",
            coachCompetitionScore: 75,
            createdAt: "2026-09-13T10:00:00.000Z",
            updatedAt: "2026-09-13T10:00:00.000Z",
          },
          coachCompetitionScore: 75,
          competitionPerformance: 75,
        }),
      }),
    );
    expect(html).toContain("Club Championship");
    expect(html).toContain("IN_SEASON");
    expect(html).toContain("Athlete Average Satisfaction");
    expect(html).toContain("BOGEY");
    expect(html).toContain("Good decisions");
    expect(html).not.toContain("<input");
    expect(html).not.toContain("Save assessment");
  });

  it("does not convert null values to zero", () => {
    expect(displayBackendNumber(null)).toBe("Unavailable");
    expect(displayBackendNumber(0)).toBe("0");
    const html = renderToStaticMarkup(
      createElement(AthleteCompetitionSubmittedDetail, {
        competition: submittedDetail(),
      }),
    );
    expect(html).toContain("Unavailable");
    expect(html).toContain("Competition performance required");
  });
});

describe("coach assessment form visibility", () => {
  it("shows assessment UI only when SUBMITTED and no existing assessment", () => {
    expect(canShowCoachCompetitionAssessmentForm(submittedDetail())).toBe(true);
    expect(
      canShowCoachCompetitionAssessmentForm(
        submittedDetail({
          coachCompetitionAssessment: {
            id: "assessment-1",
            competitionId: "competition-1",
            coachProfileId: "coach-1",
            createdByUserId: "coach-user",
            rating: 4,
            notes: null,
            coachCompetitionScore: 75,
            createdAt: "2026-09-13T10:00:00.000Z",
            updatedAt: "2026-09-13T10:00:00.000Z",
          },
        }),
      ),
    ).toBe(false);
    expect(
      canShowCoachCompetitionAssessmentForm(
        submittedDetail({ status: "DRAFT" }),
      ),
    ).toBe(false);
  });

  it("renders rating 1–5 labels and does not include a second POST path when assessment exists", () => {
    const form = renderToStaticMarkup(
      createElement(CoachCompetitionAssessmentForm, {
        onSubmit: () => {},
      }),
    );
    expect(form).toContain("1 — Very Poor");
    expect(form).toContain("5 — Very Good");
    expect(form).toContain("Save assessment");

    const source = readCoachSource();
    expect(source).toContain("canShowCoachCompetitionAssessmentForm(detail)");
    expect(source).toContain("{canAssess ? (");
    expect(source).toContain("Save assessment");
    expect(source).not.toContain("patchGolfCoachCompetitionAssessment");
  });
});

describe("coach assessment POST and refetch", () => {
  beforeEach(() => {
    postGolfCoachCompetitionAssessmentMock.mockReset();
    fetchGolfCompetitionMock.mockReset();
  });

  it("POSTs rating and notes without coachCompetitionScore, then refetches detail", async () => {
    postGolfCoachCompetitionAssessmentMock.mockResolvedValue({
      coachCompetitionAssessment: { id: "assessment-1", rating: 4 },
    });
    const refetched = submittedDetail({
      coachCompetitionAssessment: {
        id: "assessment-1",
        competitionId: "competition-1",
        coachProfileId: "coach-1",
        createdByUserId: "coach-user",
        rating: 4,
        notes: "Solid",
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
    });
    fetchGolfCompetitionMock.mockResolvedValue({ competition: refetched });

    const result = await submitCoachCompetitionAssessmentThenRefetch({
      entityId: "entity-1",
      athleteId: "athlete-1",
      competitionId: "competition-1",
      payload: { rating: 4, notes: "Solid" },
    });

    expect(postGolfCoachCompetitionAssessmentMock).toHaveBeenCalledWith(
      "entity-1",
      "athlete-1",
      "competition-1",
      { rating: 4, notes: "Solid" },
    );
    const body = postGolfCoachCompetitionAssessmentMock.mock.calls[0]?.[3] as Record<
      string,
      unknown
    >;
    expect(body).not.toHaveProperty("coachCompetitionScore");
    expect(fetchGolfCompetitionMock).toHaveBeenCalledWith({
      entityId: "entity-1",
      athleteId: "athlete-1",
      competitionId: "competition-1",
    });
    expect(postGolfCoachCompetitionAssessmentMock.mock.invocationCallOrder[0]).toBeLessThan(
      fetchGolfCompetitionMock.mock.invocationCallOrder[0]!,
    );
    expect(result.competitionPerformance).toBe(75);
    expect(result.overallGolferPerformanceCheckpoint?.overallGolferPerformance).toBe(
      77.25,
    );
    expect(result.coachCompetitionScore).toBe(75);
  });
});

describe("no frontend Competition/OGP calculations", () => {
  it("does not compute Competition Performance or OGP in the coach UI", () => {
    const source = readCoachSource();
    expect(source).not.toContain("0.45 *");
    expect(source).not.toContain("0.55 *");
    expect(source).not.toContain("(rating - 1)");
    expect(source).not.toContain("strokes -");
    expect(source).toContain("submitCoachCompetitionAssessmentThenRefetch");
    expect(source).toContain("fetchGolfCompetition");
    expect(source).toContain('presentation="dashboard"');
    expect(source).toContain("CoachCompetitionAssessmentForm");
    expect(source).toContain("showRateCompetitionAction");
    expect(source.match(/<CoachCompetitionAssessmentForm/g)).toEqual([
      "<CoachCompetitionAssessmentForm",
    ]);
    expect(source).not.toContain("HEAD_COACH");
    expect(source).not.toContain("SKILLS_COACH");
  });
});
