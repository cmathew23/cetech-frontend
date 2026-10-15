import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

import { validateMeasurementEntryForm } from "@/lib/sportMetrics/measurementEntryContract";
import {
  createFootballCompetitionAssessment,
  fetchFootballCompetitionAssessment,
  fetchFootballCompetitionAssessments,
  fetchSportMetricsFootballWeeklySummary,
  fetchSportMetricsFootballWeeklySummaryHistory,
  postFootballCoachPracticeRating,
  postFootballSportMetricRecord,
  submitFootballCompetitionAssessment,
  updateFootballCompetitionAssessment,
} from "@/lib/api/sportMetricsFootball";

function parsePostJsonBody(options: Record<string, unknown>): Record<string, unknown> {
  expect(typeof options.body).toBe("string");
  return JSON.parse(options.body as string) as Record<string, unknown>;
}

const footballContract = {
  INDIVIDUAL: {
    fields: [
      {
        key: "successfulExecution",
        label: "Successful execution",
        type: "BOOLEAN" as const,
        unit: null,
        required: true,
        options: [],
      },
    ],
  },
  CUMULATIVE: {
    fields: [
      {
        key: "attempts",
        label: "Attempts",
        type: "NUMBER" as const,
        unit: null,
        required: true,
        options: [],
      },
      {
        key: "successes",
        label: "Successes",
        type: "NUMBER" as const,
        unit: null,
        required: true,
        options: [],
      },
    ],
  },
};

describe("postFootballSportMetricRecord", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("POSTs the Basketball record shape to the Football records route", async () => {
    apiRequestMock.mockResolvedValue({ success: true, data: { id: "record-1" } });
    const individual = validateMeasurementEntryForm({
      contract: footballContract,
      entryMode: "INDIVIDUAL",
      attempts: [{ successfulExecution: "true" }],
      cumulative: {},
      notes: "",
    });
    expect(individual.ok).toBe(true);
    if (!individual.ok) return;

    await postFootballSportMetricRecord("entity-1", "athlete-1", {
      trainingPlanVersionId: "version-1",
      plannedSessionId: "session-1",
      skillCode: "FBGK_HANDLING_001",
      occurredAt: "2026-10-02T10:00:00.000Z",
      metricType: "DRILL_RESULT",
      entryMode: "INDIVIDUAL",
      valueJson: individual.valueJson,
      goalId: "goal-1",
      plannedSkillItemOrder: 2,
      notes: "kept the ball",
    });

    const [path, options] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(path).toBe(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/football/records",
    );
    expect(path).not.toContain("/basketball/");
    expect(path).not.toContain("/golf/");
    expect(options.method).toBe("POST");

    const body = parsePostJsonBody(options);
    expect(body).toMatchObject({
      trainingPlanVersionId: "version-1",
      plannedSessionId: "session-1",
      skillCode: "FBGK_HANDLING_001",
      metricType: "DRILL_RESULT",
      entryMode: "INDIVIDUAL",
      goalId: "goal-1",
      plannedSkillItemOrder: 2,
      notes: "kept the ball",
    });
    expect(body.valueJson).toEqual({
      result: { attempts: [{ successfulExecution: true }] },
    });
    expect(JSON.stringify(body)).not.toContain("successRate");
    expect(JSON.stringify(body)).not.toContain("PERCENT");
  });

  it("GETs Football weekly-summary, history, and competition assessments only", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        sport: "FOOTBALL",
        trainingPlanVersionId: "version-1",
        seasonCycleId: "season-1",
        exerciseTrends: [],
        goalEvidence: [],
        taxonomyScores: [],
        practiceScoreOutOf100: 40,
        competitionPerformance: 55,
        overallPerformance: 48,
      },
    });

    const summary = await fetchSportMetricsFootballWeeklySummary({
      entityId: "entity-1",
      athleteId: "athlete-1",
      trainingPlanVersionId: "version-1",
    });

    expect(apiRequestMock.mock.calls[0]?.[0]).toBe(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/football/weekly-summary?trainingPlanVersionId=version-1",
    );
    expect(String(apiRequestMock.mock.calls[0]?.[0])).not.toContain("/basketball/");
    expect(String(apiRequestMock.mock.calls[0]?.[0])).not.toContain("/golf/");
    expect(summary.sport).toBe("FOOTBALL");
    expect(summary.practiceScoreOutOf100).toBe(40);
    expect(summary.competitionPerformance).toBe(55);
    expect(summary.overallPerformance).toBe(48);

    apiRequestMock.mockResolvedValue({
      success: true,
      data: [
        {
          weekStart: "2026-10-01",
          weekEnd: "2026-10-07",
          performance: {
            sport: "FOOTBALL",
            weekStartDate: "2026-10-01",
            weekEndDate: "2026-10-07",
          },
        },
      ],
    });
    const weeks = await fetchSportMetricsFootballWeeklySummaryHistory({
      entityId: "entity-1",
      athleteId: "athlete-1",
    });
    expect(apiRequestMock.mock.calls[1]?.[0]).toBe(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/football/weekly-summary/history",
    );
    expect(String(apiRequestMock.mock.calls[1]?.[0])).not.toContain("/basketball/");
    expect(weeks[0]?.performance?.sport).toBe("FOOTBALL");

    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        basketballCompetitionAssessments: [{ id: "basketball-only", status: "SUBMITTED" }],
      },
    });
    const leaked = await fetchFootballCompetitionAssessments({
      entityId: "entity-1",
      athleteId: "athlete-1",
      seasonCycleId: "season-1",
    });
    expect(leaked).toEqual([]);
    expect(String(apiRequestMock.mock.calls[2]?.[0])).toContain(
      "/sport-metrics/football/competition-assessments?seasonCycleId=season-1",
    );

    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        footballCompetitionAssessments: [
          {
            id: "assessment-1",
            competitionName: "Cup",
            status: "SUBMITTED",
            competitionPerformance: 55,
          },
        ],
      },
    });
    const listed = await fetchFootballCompetitionAssessments({
      entityId: "entity-1",
      athleteId: "athlete-1",
      seasonCycleId: "season-1",
    });
    expect(listed[0]?.id).toBe("assessment-1");
    expect(listed[0]?.competitionPerformance).toBe(55);

    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        footballCompetitionAssessment: {
          id: "assessment-1",
          competitionName: "Cup",
          status: "SUBMITTED",
        },
      },
    });
    const detail = await fetchFootballCompetitionAssessment({
      entityId: "entity-1",
      athleteId: "athlete-1",
      assessmentId: "assessment-1",
    });
    expect(apiRequestMock.mock.calls[4]?.[0]).toBe(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/football/competition-assessments/assessment-1",
    );
    expect(String(apiRequestMock.mock.calls[4]?.[0])).not.toContain("/basketball/");
    expect(String(apiRequestMock.mock.calls[4]?.[0])).not.toContain("/golf/");
    expect(detail.id).toBe("assessment-1");
  });

  it("POSTs Football coach practice ratings and does not call Basketball or Golf", async () => {
    apiRequestMock.mockResolvedValue({ success: true, data: {} });

    await postFootballCoachPracticeRating("entity-1", "athlete-1", {
      trainingPlanVersionId: "version-1",
      taxonomyAreaKey: "HANDLING_SHOT_STOPPING",
      rating: 1,
    });

    const [path, options] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(path).toBe(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/football/coach-practice-ratings",
    );
    expect(path).not.toContain("/basketball/");
    expect(path).not.toContain("/golf/");
    expect(options.method).toBe("POST");
    expect(parsePostJsonBody(options)).toEqual({
      trainingPlanVersionId: "version-1",
      taxonomyAreaKey: "HANDLING_SHOT_STOPPING",
      rating: 1,
    });
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
  });

  it("creates, edits, and submits Football competition assessments on Football endpoints only", async () => {
    const taxonomyRatings = { HANDLING_SHOT_STOPPING: 4 };
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        footballCompetitionAssessment: {
          id: "assessment-1",
          competitionName: "Cup",
          status: "DRAFT",
          taxonomyRatings,
        },
      },
    });

    await createFootballCompetitionAssessment("entity-1", "athlete-1", {
      seasonCycleId: "season-1",
      competitionName: "Cup",
      competitionDate: "2026-10-15",
      taxonomyRatings,
    });
    const [createPath, createOptions] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(createPath).toBe(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/football/competition-assessments",
    );
    expect(createPath).not.toContain("/basketball/");
    expect(createPath).not.toContain("/golf/");
    expect(createOptions.method).toBe("POST");
    expect(parsePostJsonBody(createOptions)).toEqual({
      seasonCycleId: "season-1",
      competitionName: "Cup",
      competitionDate: "2026-10-15",
      taxonomyRatings,
    });

    apiRequestMock.mockReset();
    apiRequestMock
      .mockResolvedValueOnce({ success: true, data: {} })
      .mockResolvedValueOnce({
        success: true,
        data: {
          footballCompetitionAssessment: {
            id: "assessment-1",
            competitionName: "Cup",
            status: "DRAFT",
            taxonomyRatings,
          },
        },
      });
    await updateFootballCompetitionAssessment({
      entityId: "entity-1",
      athleteId: "athlete-1",
      assessmentId: "assessment-1",
      payload: {
        competitionName: "Cup",
        competitionDate: "2026-10-15",
        taxonomyRatings,
      },
    });
    const [patchPath, patchOptions] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(patchPath).toBe(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/football/competition-assessments/assessment-1",
    );
    expect(patchPath).not.toContain("/basketball/");
    expect(patchPath).not.toContain("/submit");
    expect(patchOptions.method).toBe("PATCH");
    expect(parsePostJsonBody(patchOptions).taxonomyRatings).toEqual(taxonomyRatings);
    expect(apiRequestMock.mock.calls[1]?.[1]).toMatchObject({ method: "GET" });

    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        footballCompetitionAssessment: {
          id: "assessment-1",
          status: "SUBMITTED",
          taxonomyRatings,
        },
      },
    });
    const submitted = await submitFootballCompetitionAssessment({
      entityId: "entity-1",
      athleteId: "athlete-1",
      assessmentId: "assessment-1",
    });
    const [submitPath, submitOptions] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(submitPath).toBe(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/football/competition-assessments/assessment-1/submit",
    );
    expect(submitPath).not.toContain("/basketball/");
    expect(submitPath).not.toContain("/golf/");
    expect(submitOptions.method).toBe("POST");
    expect(submitted.status).toBe("SUBMITTED");
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
  });

  it("keeps cumulative contract fields and does not calculate a percentage", async () => {
    apiRequestMock.mockResolvedValue({ success: true });
    const cumulative = validateMeasurementEntryForm({
      contract: footballContract,
      entryMode: "CUMULATIVE",
      attempts: [],
      cumulative: { attempts: "8", successes: "5" },
      notes: "",
    });
    expect(cumulative.ok).toBe(true);
    if (!cumulative.ok) return;

    await postFootballSportMetricRecord("entity-1", "athlete-1", {
      trainingPlanVersionId: "version-1",
      plannedSessionId: "session-1",
      skillCode: "FBGK_DIVING_001",
      occurredAt: "2026-10-02T10:00:00.000Z",
      metricType: "DRILL_RESULT",
      entryMode: "CUMULATIVE",
      valueJson: cumulative.valueJson,
    });

    const [path, options] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(path).toContain("/sport-metrics/football/records");
    expect(path).not.toContain("/basketball/");
    expect(parsePostJsonBody(options).valueJson).toEqual({
      result: { attempts: 8, successes: 5 },
    });
  });
});
