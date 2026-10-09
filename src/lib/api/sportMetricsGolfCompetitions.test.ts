import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

import {
  createGolfCompetition,
  fetchGolfCompetition,
  fetchGolfCompetitionHistory,
  fetchGolfCompetitions,
  patchGolfCompetition,
  postGolfCoachCompetitionAssessment,
  submitGolfCompetition,
} from "@/lib/api/sportMetricsGolfCompetitions";

function parseJsonBody(options: Record<string, unknown>): Record<string, unknown> {
  const rawBody = options.body;
  expect(typeof rawBody).toBe("string");
  return JSON.parse(rawBody as string) as Record<string, unknown>;
}

const persistedCompetition = {
  id: "competition-1",
  name: "Club Championship",
  status: "DRAFT",
  days: [],
};

describe("golf competition API", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("POSTs create metadata only and does not send days or holes", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      message: "Competition draft created successfully",
      data: { competition: persistedCompetition },
    });

    const result = await createGolfCompetition("entity-1", "athlete-1", {
      name: "Club Championship",
      type: "CHAMPIONSHIP",
      format: 18,
      venue: "PeakFlow Golf Club",
      startDate: "2026-09-12",
      numberOfDays: 2,
    });

    expect(result.competition).toEqual(persistedCompetition);
    const [path, options] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(path).toBe(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/golf/competitions",
    );
    expect(options.method).toBe("POST");
    const body = parseJsonBody(options);
    expect(body).toEqual({
      name: "Club Championship",
      type: "CHAMPIONSHIP",
      format: 18,
      venue: "PeakFlow Golf Club",
      startDate: "2026-09-12",
      numberOfDays: 2,
    });
    expect(body).not.toHaveProperty("days");
    expect(body).not.toHaveProperty("holes");
    expect(body).not.toHaveProperty("holeResults");
  });

  it("GETs competition detail and returns backend data as-is", async () => {
    const detail = {
      ...persistedCompetition,
      status: "SUBMITTED",
      competitionSummary: { holesPlayed: 1 },
      athleteCompetitionScore: 75,
    };
    apiRequestMock.mockResolvedValue({
      success: true,
      message: "Competition fetched successfully",
      data: { competition: detail },
    });

    const result = await fetchGolfCompetition({
      entityId: " entity/1 ",
      athleteId: " athlete 1 ",
      competitionId: " competition/1 ",
    });

    expect(result.competition).toEqual(detail);
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity%2F1/athletes/athlete%201/sport-metrics/golf/competitions/competition%2F1",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        timeoutMs: 240_000,
      }),
    );
  });

  it("omits days from PATCH when the caller does not send days", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: { competition: persistedCompetition },
    });

    await patchGolfCompetition("entity-1", "athlete-1", "competition-1", {
      venue: "Updated Venue",
    });

    const body = parseJsonBody(
      apiRequestMock.mock.calls[0]?.[1] as Record<string, unknown>,
    );
    expect(body).toEqual({ venue: "Updated Venue" });
    expect(Object.prototype.hasOwnProperty.call(body, "days")).toBe(false);
  });

  it("PATCHes days as a full replacement, including an empty collection", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: { competition: persistedCompetition },
    });

    const days = [
      {
        dayNumber: 1,
        date: "2026-09-12",
        holeResults: [
          {
            holeNumber: 1,
            par: 4,
            strokes: 5,
            fairwayHit: "YES" as const,
            greenInRegulation: false,
            putts: 2,
            penaltyStrokes: 0,
            satisfactionRating: 4 as const,
          },
        ],
      },
    ];

    await patchGolfCompetition("entity-1", "athlete-1", "competition-1", {
      days,
    });
    expect(
      parseJsonBody(apiRequestMock.mock.calls[0]?.[1] as Record<string, unknown>),
    ).toEqual({ days });

    await patchGolfCompetition("entity-1", "athlete-1", "competition-1", {
      days: [],
    });
    const emptyBody = parseJsonBody(
      apiRequestMock.mock.calls[1]?.[1] as Record<string, unknown>,
    );
    expect(Object.prototype.hasOwnProperty.call(emptyBody, "days")).toBe(true);
    expect(emptyBody.days).toEqual([]);
  });

  it("POSTs submit with no request body", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: { competition: { ...persistedCompetition, status: "SUBMITTED" } },
    });

    await submitGolfCompetition({
      entityId: "entity-1",
      athleteId: "athlete-1",
      competitionId: "competition-1",
    });

    const [path, options] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(path).toBe(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/golf/competitions/competition-1/submit",
    );
    expect(options.method).toBe("POST");
    expect(options.body).toBeUndefined();
  });

  it("GETs the season competition list with required seasonCycleId and does not infer it", async () => {
    await expect(
      fetchGolfCompetitions({
        entityId: "entity-1",
        athleteId: "athlete-1",
        seasonCycleId: "   ",
      }),
    ).rejects.toMatchObject({
      code: "SPORT_METRICS_GOLF_IDS_REQUIRED",
    });
    expect(apiRequestMock).not.toHaveBeenCalled();

    apiRequestMock.mockResolvedValue({
      success: true,
      message: "Competitions fetched successfully",
      data: {
        seasonCycleId: "season-2026",
        seasonYear: 2026,
        competitions: [],
      },
    });

    const result = await fetchGolfCompetitions({
      entityId: "entity-1",
      athleteId: "athlete-1",
      seasonCycleId: "season-2026",
    });

    expect(result).toEqual({
      seasonCycleId: "season-2026",
      seasonYear: 2026,
      competitions: [],
    });
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/golf/competitions?seasonCycleId=season-2026",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        timeoutMs: 240_000,
      }),
    );
  });

  it("requires seasonCycleId for history and does not infer it", async () => {
    await expect(
      fetchGolfCompetitionHistory({
        entityId: "entity-1",
        athleteId: "athlete-1",
        seasonCycleId: "   ",
      }),
    ).rejects.toMatchObject({
      code: "SPORT_METRICS_GOLF_IDS_REQUIRED",
    });
    expect(apiRequestMock).not.toHaveBeenCalled();

    apiRequestMock.mockResolvedValue({
      success: true,
      data: { seasonCycleId: "season-2026", seasonYear: 2026, competitions: [] },
    });

    const result = await fetchGolfCompetitionHistory({
      entityId: "entity-1",
      athleteId: "athlete-1",
      seasonCycleId: "season-2026",
    });

    expect(result).toEqual({
      seasonCycleId: "season-2026",
      seasonYear: 2026,
      competitions: [],
    });
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/golf/competitions/history?seasonCycleId=season-2026",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        timeoutMs: 240_000,
      }),
    );
  });

  it("POSTs coach assessment without coachCompetitionScore", async () => {
    const assessment = { id: "assessment-1", rating: 4, coachCompetitionScore: 75 };
    apiRequestMock.mockResolvedValue({
      success: true,
      data: { coachCompetitionAssessment: assessment },
    });

    const result = await postGolfCoachCompetitionAssessment(
      "entity-1",
      "athlete-1",
      "competition-1",
      { rating: 4, notes: "Good decisions" },
    );

    expect(result.coachCompetitionAssessment).toEqual(assessment);
    const [path, options] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    const body = parseJsonBody(options);
    expect(path).toBe(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/golf/competitions/competition-1/coach-assessments",
    );
    expect(body).toEqual({ rating: 4, notes: "Good decisions" });
    expect(body).not.toHaveProperty("coachCompetitionScore");
  });
});
