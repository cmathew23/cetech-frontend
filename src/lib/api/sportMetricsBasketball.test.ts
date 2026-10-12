import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

import {
  buildBasketballCompetitionAssessmentCreateBody,
  buildBasketballSportMetricRecordRequestBody,
  createBasketballCompetitionAssessment,
  fetchBasketballCompetitionAssessments,
  fetchSportMetricsBasketballWeeklySummary,
  parseBasketballCompetitionAssessmentPayload,
  parseSportMetricsBasketballWeeklySummaryPayload,
  postBasketballSportMetricRecord,
  submitBasketballCompetitionAssessment,
} from "@/lib/api/sportMetricsBasketball";

function parsePostJsonBody(options: Record<string, unknown>): Record<string, unknown> {
  expect(typeof options.body).toBe("string");
  return JSON.parse(options.body as string) as Record<string, unknown>;
}

describe("buildBasketballSportMetricRecordRequestBody", () => {
  it("keeps only contract fields in valueJson and lifts notes", () => {
    const requestBody = buildBasketballSportMetricRecordRequestBody({
      trainingPlanVersionId: "version-1",
      plannedSessionId: "session-1",
      skillCode: "BB_SHOT_002",
      occurredAt: "2026-10-02T10:00:00.000Z",
      metricType: "DRILL_RESULT",
      entryMode: "INDIVIDUAL",
      valueJson: {
        entryMode: "INDIVIDUAL",
        notes: "form notes",
        attempts: [{ made: true }],
      },
      goalId: "goal-1",
      plannedSkillItemOrder: 2,
      notes: "coach-visible notes",
    });

    expect(requestBody).toEqual({
      trainingPlanVersionId: "version-1",
      plannedSessionId: "session-1",
      skillCode: "BB_SHOT_002",
      occurredAt: "2026-10-02T10:00:00.000Z",
      metricType: "DRILL_RESULT",
      entryMode: "INDIVIDUAL",
      valueJson: { result: { attempts: [{ made: true }] } },
      goalId: "goal-1",
      plannedSkillItemOrder: 2,
      notes: "coach-visible notes",
    });
    expect(requestBody).not.toHaveProperty("environment");
    expect(requestBody).not.toHaveProperty("source");
    expect(requestBody).not.toHaveProperty("prescribedContextJson");
    expect(requestBody.valueJson).not.toHaveProperty("entryMode");
    expect(requestBody.valueJson).not.toHaveProperty("notes");
  });

  it("omits plannedSkillItemOrder when the item has no persisted order", () => {
    const requestBody = buildBasketballSportMetricRecordRequestBody({
      trainingPlanVersionId: "version-1",
      plannedSessionId: "session-1",
      skillCode: "BB_SHOT_002",
      occurredAt: "2026-10-02T10:00:00.000Z",
      metricType: "DRILL_RESULT",
      entryMode: "CUMULATIVE",
      valueJson: { attempts: 4, successes: 3 },
    });

    expect(requestBody.valueJson).toEqual({ result: { attempts: 4, successes: 3 } });
    expect(requestBody).not.toHaveProperty("plannedSkillItemOrder");
    expect(requestBody).not.toHaveProperty("notes");
    expect(requestBody).not.toHaveProperty("goalId");
  });
});

describe("postBasketballSportMetricRecord", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("POSTs athlete self-entry evidence to the Basketball records route", async () => {
    apiRequestMock.mockResolvedValue({ success: true, data: { id: "record-1" } });

    await postBasketballSportMetricRecord("entity-1", "athlete-1", {
      trainingPlanVersionId: "version-1",
      plannedSessionId: "session-1",
      skillCode: "BB_SHOT_002",
      occurredAt: "2026-10-02T10:00:00.000Z",
      metricType: "DRILL_RESULT",
      entryMode: "INDIVIDUAL",
      valueJson: {
        entryMode: "INDIVIDUAL",
        notes: "ignore me",
        attempts: [{ made: true }],
      },
      goalId: "goal-1",
      plannedSkillItemOrder: 1,
      notes: "made the first rep",
    });

    const [path, options] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(path).toBe(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/basketball/records",
    );
    expect(path).not.toContain("/golf/");
    expect(options.method).toBe("POST");

    const body = parsePostJsonBody(options);
    expect(body.metricType).toBe("DRILL_RESULT");
    expect(body.entryMode).toBe("INDIVIDUAL");
    expect(body.skillCode).toBe("BB_SHOT_002");
    expect(body.goalId).toBe("goal-1");
    expect(body.notes).toBe("made the first rep");
    expect(body.valueJson).toEqual({ result: { attempts: [{ made: true }] } });
    expect(body).not.toHaveProperty("prescribedContextJson");
    expect(body).not.toHaveProperty("environment");
    expect(body).not.toHaveProperty("source");
  });
});

describe("fetchSportMetricsBasketballWeeklySummary", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("GETs Basketball weekly-summary and does not call Golf", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      message: "Basketball metric weekly summary fetched successfully",
      data: {
        sport: "BASKETBALL",
        trainingPlanVersionId: "version-1",
        exerciseTrends: [],
        goalEvidence: [],
        taxonomyScores: [],
        practiceScoreOutOf100: null,
        competitionPerformance: null,
        overallPerformance: null,
      },
    });

    const summary = await fetchSportMetricsBasketballWeeklySummary({
      entityId: "entity-1",
      athleteId: "athlete-1",
      trainingPlanVersionId: "version-1",
    });

    const [path, options] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(path).toBe(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/basketball/weekly-summary?trainingPlanVersionId=version-1",
    );
    expect(path).not.toContain("/golf/");
    expect(options).toMatchObject({ method: "GET", cache: "no-store" });
    expect(summary.sport).toBe("BASKETBALL");
    expect(summary.practiceScoreOutOf100).toBeNull();
    expect(summary.competitionPerformance).toBeNull();
    expect(summary.overallPerformance).toBeNull();
  });

  it("does not request a summary without a released training plan version", async () => {
    await expect(
      fetchSportMetricsBasketballWeeklySummary({
        entityId: "entity-1",
        athleteId: "athlete-1",
        trainingPlanVersionId: " ",
      }),
    ).rejects.toMatchObject({ code: "SPORT_METRICS_BASKETBALL_IDS_REQUIRED" });
    expect(apiRequestMock).not.toHaveBeenCalled();
  });
});

describe("parseSportMetricsBasketballWeeklySummaryPayload", () => {
  it("keeps the first exercise currentActual when previousActual and trend are null", () => {
    const parsed = parseSportMetricsBasketballWeeklySummaryPayload({
      success: true,
      data: {
        sport: "BASKETBALL",
        exerciseTrends: [
          {
            exerciseName: "Free Throws",
            metricName: "Shot Make Rate",
            metricKey: "shot_make_rate",
            unit: "PERCENT",
            currentActual: 80,
            previousActual: null,
            trendScore: null,
            trendDirection: null,
          },
        ],
      },
    });

    expect(parsed.exerciseTrends[0]).toMatchObject({
      currentActual: 80,
      previousActual: null,
      trendScore: null,
      trendDirection: null,
      unit: "PERCENT",
      metricName: "Shot Make Rate",
    });
  });

  it("copies null Practice, Competition, and Overall without turning them into 0", () => {
    const parsed = parseSportMetricsBasketballWeeklySummaryPayload({
      success: true,
      data: {
        practiceScoreOutOf100: null,
        competitionPerformance: null,
        overallPerformance: null,
        practiceNormalizedScore: null,
      },
    });

    expect(parsed.practiceScoreOutOf100).toBeNull();
    expect(parsed.competitionPerformance).toBeNull();
    expect(parsed.overallPerformance).toBeNull();
    expect(parsed.practiceNormalizedScore).toBeNull();
  });

  it("leaves omitted scores null and ignores Golf score fields", () => {
    const parsed = parseSportMetricsBasketballWeeklySummaryPayload({
      success: true,
      data: {
        sport: "BASKETBALL",
        visibility: "FILTERED",
        overallGolferPerformance: 50,
        practiceSideScoreOutOf100: 50,
        exercisePerformance: [{ currentActual: 1 }],
        goalEvidence: [{ goalId: "goal-1", goal: { goalName: "Shooting", targetValue: 75 } }],
      },
    });

    expect(parsed.exerciseTrends).toEqual([]);
    expect(parsed.practiceScoreOutOf100).toBeNull();
    expect(parsed.competitionPerformance).toBeNull();
    expect(parsed.overallPerformance).toBeNull();
    expect(parsed.goalEvidence[0]?.weeklyActual).toBeNull();
    expect(parsed.goalEvidence[0]?.targetComparison).toBeNull();
    expect(parsed.goalEvidence[0]?.goal.targetValue).toBe(75);
  });

  it("copies supplied scores and target comparison without calculating them", () => {
    const parsed = parseSportMetricsBasketballWeeklySummaryPayload({
      success: true,
      data: {
        practiceScoreOutOf100: 40,
        competitionPerformance: 69.38,
        overallPerformance: 81.25,
        taxonomyScores: [
          {
            taxonomyAreaKey: "SHOOTING",
            normalizedScore: 0.25,
            scoreOutOf100: 62.5,
            direction: "UP",
          },
        ],
        competitionTaxonomyScores: [
          { taxonomyAreaKey: "SHOOTING", taxonomyCompetitionScore: 91.67 },
        ],
        goalEvidence: [
          {
            goalId: "goal-shooting",
            goal: {
              goalName: "Shooting",
              targetValue: 75,
              primaryMetric: {
                key: "shot_make_rate",
                unit: "PERCENT",
                direction: "HIGHER_IS_BETTER",
              },
            },
            weeklyActual: {
              metricKey: "shot_make_rate",
              unit: "PERCENT",
              value: 73.33,
              attempts: 30,
              successes: 22,
              recordCount: 3,
            },
            targetComparison: {
              targetValue: 75,
              actualValue: 73.33,
              direction: "HIGHER_IS_BETTER",
              targetMet: false,
            },
          },
        ],
      },
    });

    expect(parsed.practiceScoreOutOf100).toBe(40);
    expect(parsed.competitionPerformance).toBe(69.38);
    expect(parsed.overallPerformance).toBe(81.25);
    expect(parsed.taxonomyScores[0]?.scoreOutOf100).toBe(62.5);
    expect(parsed.competitionTaxonomyScores[0]?.taxonomyCompetitionScore).toBe(91.67);
    expect(parsed.goalEvidence[0]?.weeklyActual?.value).toBe(73.33);
    expect(parsed.goalEvidence[0]?.targetComparison).toEqual({
      targetValue: 75,
      actualValue: 73.33,
      direction: "HIGHER_IS_BETTER",
      targetMet: false,
    });
  });

  it("does not derive weeklyActual.value or targetMet from attempts and a target", () => {
    const parsed = parseSportMetricsBasketballWeeklySummaryPayload({
      success: true,
      data: {
        goalEvidence: [
          {
            goalId: "goal-1",
            goal: { goalName: "Shooting", targetValue: 75 },
            weeklyActual: { attempts: 10, successes: 8, unit: "PERCENT" },
            targetComparison: {
              targetValue: 75,
              actualValue: 10,
              direction: "HIGHER_IS_BETTER",
            },
          },
        ],
      },
    });

    expect(parsed.goalEvidence[0]?.weeklyActual?.value).toBeNull();
    expect(parsed.goalEvidence[0]?.weeklyActual?.attempts).toBe(10);
    expect(parsed.goalEvidence[0]?.weeklyActual?.successes).toBe(8);
    expect(parsed.goalEvidence[0]?.targetComparison?.targetMet).toBeNull();
  });

  it("does not calculate Basketball scores in the client", () => {
    const source = readFileSync(new URL("./sportMetricsBasketball.ts", import.meta.url), "utf8");
    expect(source).not.toContain("0.45");
    expect(source).not.toContain("0.55");
    expect(source).not.toContain("successes /");
    expect(source).not.toContain("?? 0");
    expect(source).not.toContain("|| 0");
    expect(source).not.toContain("/sport-metrics/golf/");
    expect(source).toContain("athleteSportMetricsBasketballWeeklySummary");
    expect(source).toContain("athleteSportMetricsBasketballCompetitionAssessments");
    expect(source).toContain("athleteSportMetricsBasketballCompetitionAssessmentSubmit");
    expect(source).not.toContain("(rating - 1)");
    expect(source).not.toContain("/ 4");
  });
});

describe("basketball competition assessments", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("POSTs coach ratings only and keeps draft scores null", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        basketballCompetitionAssessment: {
          id: "assessment-1",
          competitionName: "League fixture",
          competitionDate: "2026-10-12T00:00:00.000Z",
          status: "DRAFT",
          seasonCycleId: "season-1",
          taxonomyRatings: { DRIBBLING: 4, PASSING: 3, SHOOTING: 5 },
          normalizedTaxonomyScores: null,
          competitionPerformance: null,
        },
      },
    });

    const created = await createBasketballCompetitionAssessment("entity-1", "athlete-1", {
      seasonCycleId: "season-1",
      competitionName: "League fixture",
      competitionDate: "2026-10-12",
      taxonomyRatings: { DRIBBLING: 4, PASSING: 3, SHOOTING: 5 },
    });

    const [path, options] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(path).toBe(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/basketball/competition-assessments",
    );
    expect(path).not.toContain("/golf/");
    expect(options.method).toBe("POST");
    const body = parsePostJsonBody(options);
    expect(body).toEqual({
      seasonCycleId: "season-1",
      competitionName: "League fixture",
      competitionDate: "2026-10-12",
      taxonomyRatings: { DRIBBLING: 4, PASSING: 3, SHOOTING: 5 },
    });
    expect(body).not.toHaveProperty("normalizedTaxonomyScores");
    expect(body).not.toHaveProperty("competitionPerformance");
    expect(body).not.toHaveProperty("holes");
    expect(body).not.toHaveProperty("venue");
    expect(body).not.toHaveProperty("format");
    expect(created.competitionPerformance).toBeNull();
    expect(created.normalizedTaxonomyScores).toBeNull();
    expect(created.status).toBe("DRAFT");
  });

  it("POSTs submit without client scores and copies the backend result", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        basketballCompetitionAssessment: {
          id: "assessment-1",
          competitionName: "League fixture",
          competitionDate: "2026-10-12T00:00:00.000Z",
          status: "SUBMITTED",
          taxonomyRatings: { DRIBBLING: 4, PASSING: 3, SHOOTING: 5 },
          normalizedTaxonomyScores: { DRIBBLING: 1, PASSING: 1, SHOOTING: 1 },
          competitionPerformance: 2,
        },
      },
    });

    const submitted = await submitBasketballCompetitionAssessment({
      entityId: "entity-1",
      athleteId: "athlete-1",
      assessmentId: "assessment-1",
    });

    const [path, options] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(path).toBe(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/basketball/competition-assessments/assessment-1/submit",
    );
    expect(path).not.toContain("/golf/");
    expect(options.method).toBe("POST");
    expect(parsePostJsonBody(options)).toEqual({});
    expect(submitted.status).toBe("SUBMITTED");
    expect(submitted.competitionPerformance).toBe(2);
    expect(submitted.normalizedTaxonomyScores).toEqual({
      DRIBBLING: 1,
      PASSING: 1,
      SHOOTING: 1,
    });
  });

  it("lists saved assessments for the Basketball season and does not call Golf", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        basketballCompetitionAssessments: [
          {
            id: "assessment-1",
            competitionName: "League fixture",
            status: "SUBMITTED",
            competitionPerformance: 75,
          },
        ],
      },
    });

    const assessments = await fetchBasketballCompetitionAssessments({
      entityId: "entity-1",
      athleteId: "athlete-1",
      seasonCycleId: "season-1",
    });

    const [path, options] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(path).toBe(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/basketball/competition-assessments?seasonCycleId=season-1",
    );
    expect(path).not.toContain("/golf/");
    expect(options.method).toBe("GET");
    expect(options.cache).toBe("no-store");
    expect(assessments[0]?.competitionName).toBe("League fixture");
    expect(assessments[0]?.competitionPerformance).toBe(75);
  });

  it("rejects rating math and non 1-5 ratings before the request", () => {
    expect(() =>
      buildBasketballCompetitionAssessmentCreateBody({
        seasonCycleId: "season-1",
        competitionName: "League fixture",
        competitionDate: "2026-10-12",
        taxonomyRatings: { DRIBBLING: 2.5 },
      }),
    ).toThrow();
    expect(apiRequestMock).not.toHaveBeenCalled();

    const parsed = parseBasketballCompetitionAssessmentPayload({
      basketballCompetitionAssessment: {
        id: "assessment-1",
        competitionName: "League fixture",
        status: "DRAFT",
        taxonomyRatings: { DRIBBLING: 4, PASSING: 3, SHOOTING: 5 },
        normalizedTaxonomyScores: null,
        competitionPerformance: null,
      },
    });
    expect(parsed.competitionPerformance).toBeNull();
    expect(parsed.normalizedTaxonomyScores).toBeNull();
  });
});
