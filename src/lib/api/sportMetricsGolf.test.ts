import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

import {
  buildGolfSportMetricRecordRequestBody,
  fetchSportMetricsGolfWeeklySummary,
  formatSportMetricsStatusLabel,
  hasSportMetricsGolfEvidence,
  parseSportMetricsGolfWeeklySummaryPayload,
  postGolfSportMetricRecord,
} from "@/lib/api/sportMetricsGolf";

function parsePostJsonBody(options: Record<string, unknown>): Record<string, unknown> {
  const rawBody = options.body;
  expect(typeof rawBody).toBe("string");
  expect(rawBody).not.toBe("[object Object]");
  return JSON.parse(rawBody as string) as Record<string, unknown>;
}

describe("sport metrics golf weekly summary", () => {
  it("unwraps backend payload and preserves key weekly summary fields", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        weekStartDate: "2026-05-04",
        weekEndDate: "2026-05-10",
        status: "EVIDENCE_LOGGED",
        goalEvidence: [
          {
            goalId: "goal-1",
            goalTitle: "Improve wedge proximity",
            successCriteria: "Average proximity under 15 ft",
            evidenceStatus: "EVIDENCE_LOGGED",
            evidence: [
              {
                id: "record-1",
                label: "Wedge proximity",
                value: "14.2",
                unit: "ft",
                environment: "PRACTICE_FACILITY",
                source: "COACH_MANUAL",
              },
            ],
          },
        ],
        unlinkedEvidence: [
          {
            id: "record-2",
            label: "Round notes",
            notes: "Windy practice round",
            environment: "ON_COURSE",
            source: "ATHLETE_MANUAL",
          },
        ],
      },
    });

    expect(parsed.sport).toBe("GOLF");
    expect(parsed.weekStartDate).toBe("2026-05-04");
    expect(parsed.weekEndDate).toBe("2026-05-10");
    expect(parsed.goalEvidence[0]?.goalTitle).toBe("Improve wedge proximity");
    expect(parsed.unlinkedEvidence[0]?.label).toBe("Round notes");
  });

  it("fetches with trainingPlanVersionId query param only", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        sport: "GOLF",
        weekStartDate: "2026-05-04",
        weekEndDate: "2026-05-10",
        status: "NO_DATA_LOGGED",
        goalEvidence: [],
        unlinkedEvidence: [],
      },
    });

    await fetchSportMetricsGolfWeeklySummary({
      entityId: "entity-1",
      athleteId: "athlete-1",
      trainingPlanVersionId: "version-1",
    });

    const [path, options] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];

    expect(path).toContain(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/golf/weekly-summary?",
    );
    expect(path).toContain("trainingPlanVersionId=version-1");
    expect(path).not.toContain("weekStart=");
    expect(path).not.toContain("weekEnd=");
    expect(path).not.toContain("startDate=");
    expect(path).not.toContain("endDate=");
    expect(path).not.toContain("period=");
    expect(options).toMatchObject({
      method: "GET",
      cache: "no-store",
    });
  });

  it("maps supported backend status values to labels", () => {
    expect(formatSportMetricsStatusLabel("NO_DATA_LOGGED")).toBe("No Results Logged");
    expect(formatSportMetricsStatusLabel("EVIDENCE_LOGGED")).toBe("Results Logged");
    expect(formatSportMetricsStatusLabel("NEEDS_COACH_REVIEW")).toBe(
      "Needs Coach Review",
    );
  });

  it("does not import wearable period helpers", () => {
    const source = readFileSync(
      new URL("./sportMetricsGolf.ts", import.meta.url),
      "utf8",
    );
    expect(source).not.toContain("wearablePeriod");
    expect(source).not.toContain("resolveWearable");
  });
});

describe("parseSportMetricsGolfWeeklySummaryPayload unlinkedEvidence", () => {
  it("preserves unlinkedEvidence.records from nested container", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        weekStartDate: "2026-05-21",
        weekEndDate: "2026-05-27",
        status: "NO_DATA_LOGGED",
        goalEvidence: [],
        unlinkedEvidence: {
          records: [
            {
              id: "unlinked-1",
              metricType: "DRILL_RESULT",
              environment: "SIMULATOR",
              source: "SIMULATOR_MANUAL",
              occurredAt: "2026-05-24T14:30:00.000Z",
              prescribedContextJson: {
                label: "3-6-9 Circle Pressure Drill",
              },
              valueJson: {
                attempts: 9,
                successes: 7,
                provider: { key: "trackman" },
              },
            },
          ],
        },
      },
    });

    expect(parsed.goalEvidence).toEqual([]);
    expect(parsed.unlinkedEvidence).toHaveLength(1);
    expect(parsed.unlinkedEvidence[0]?.id).toBe("unlinked-1");
    const raw = parsed.unlinkedEvidence[0]?.raw as Record<string, unknown>;
    expect(raw.prescribedContextJson).toEqual(
      expect.objectContaining({ label: "3-6-9 Circle Pressure Drill" }),
    );
    expect(hasSportMetricsGolfEvidence(parsed)).toBe(true);
  });

  it("preserves goalEvidence and flat unlinkedEvidence arrays", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        weekStartDate: "2026-05-04",
        weekEndDate: "2026-05-10",
        status: "EVIDENCE_LOGGED",
        goalEvidence: [
          {
            goalId: "goal-1",
            goalTitle: "Putting",
            evidence: [{ id: "g-1", label: "Goal drill" }],
          },
        ],
        unlinkedEvidence: [{ id: "u-1", label: "Flat unlinked" }],
      },
    });

    expect(parsed.goalEvidence).toHaveLength(1);
    expect(parsed.goalEvidence[0]?.evidence).toHaveLength(1);
    expect(parsed.unlinkedEvidence).toHaveLength(1);
    expect(parsed.unlinkedEvidence[0]?.label).toBe("Flat unlinked");
  });

  it("does not treat an empty goal evidence shell as a linked evidence record", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        weekStartDate: "2026-06-01",
        weekEndDate: "2026-06-07",
        status: "NO_DATA_LOGGED",
        goalEvidence: [
          {
            goalId: "goal-801",
            goalTitle: "Improving Putting performance",
            evidenceStatus: "NO_DATA_LOGGED",
            status: "NO_DATA_LOGGED",
            evidence: [],
          },
        ],
        unlinkedEvidence: [
          {
            id: "r1",
            label: "Drill 1",
            result: { attempts: 8, successes: 6, successRate: 75 },
          },
        ],
      },
    });

    expect(parsed.goalEvidence[0]?.evidence).toEqual([]);
    expect(parsed.goalEvidence[0]?.evidenceStatus).toBe("NO_DATA_LOGGED");
    expect(parsed.unlinkedEvidence).toHaveLength(1);
    expect(hasSportMetricsGolfEvidence(parsed)).toBe(true);
  });

  it("parses optional prescribedSkillsCount from summary payload", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        prescribedSkillsCount: 6,
        goalEvidence: [],
        unlinkedEvidence: [],
      },
    });

    expect(parsed.prescribedSkillsCount).toBe(6);
  });
});

describe("buildGolfSportMetricRecordRequestBody", () => {
  it("keeps prescribedContextJson and valueJson as objects before serialization", () => {
    const requestBody = buildGolfSportMetricRecordRequestBody({
      trainingPlanVersionId: "version-1",
      plannedSessionId: "ps-1",
      occurredAt: "2026-05-24T12:00:00.000Z",
      metricType: "DRILL_RESULT",
      environment: "PRACTICE_FACILITY",
      source: "ATHLETE_MANUAL",
      prescribedContextJson: { label: "Chip Ladder", order: 1 },
      valueJson: { attempts: 5, successes: 4 },
    });

    expect(requestBody.prescribedContextJson).toEqual({ label: "Chip Ladder", order: 1 });
    expect(requestBody.valueJson).toEqual({ attempts: 5, successes: 4 });
    expect(JSON.stringify(requestBody)).not.toContain("[object Object]");
  });
});

describe("postGolfSportMetricRecord", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("POSTs to golf records with required linkage fields", async () => {
    apiRequestMock.mockResolvedValue({ success: true, data: { id: "record-1" } });

    await postGolfSportMetricRecord("entity-1", "athlete-1", {
      trainingPlanVersionId: "version-skills",
      plannedSessionId: "session-1",
      occurredAt: "2026-05-24T16:00:00.000Z",
      metricType: "DRILL_RESULT",
      environment: "SIMULATOR",
      source: "SIMULATOR_MANUAL",
      prescribedContextJson: {
        label: "3-6-9 Circle Pressure Drill",
        plannedSessionId: "session-1",
        trainingPlanVersionId: "version-skills",
      },
      valueJson: { attempts: 9, successes: 7 },
    });

    const [path, options] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];

    expect(path).toBe(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/golf/records",
    );
    expect(path).not.toContain("adherence");
    expect(options.method).toBe("POST");

    const parsedBody = parsePostJsonBody(options);
    expect(parsedBody.trainingPlanVersionId).toBe("version-skills");
    expect(parsedBody.plannedSessionId).toBe("session-1");
    expect(parsedBody.prescribedContextJson).toEqual(
      expect.objectContaining({
        label: "3-6-9 Circle Pressure Drill",
      }),
    );
    expect(parsedBody.valueJson).toEqual({ attempts: 9, successes: 7 });
    expect(parsedBody.prescribedContextJson).not.toBe("[object Object]");
    expect(parsedBody.valueJson).not.toBe("[object Object]");
    expect(typeof parsedBody.prescribedContextJson).toBe("object");
    expect(typeof parsedBody.valueJson).toBe("object");
  });

  it("serializes nested provider inside valueJson as an object", async () => {
    apiRequestMock.mockResolvedValue({ success: true });

    await postGolfSportMetricRecord("entity-1", "athlete-1", {
      trainingPlanVersionId: "version-1",
      plannedSessionId: "ps-1",
      occurredAt: "2026-05-24T12:00:00.000Z",
      metricType: "DRILL_RESULT",
      environment: "SIMULATOR",
      source: "SIMULATOR_MANUAL",
      prescribedContextJson: { label: "Driver Ladder" },
      valueJson: {
        attempts: 12,
        successes: 10,
        provider: { key: "trackman" },
      },
    });

    const options = apiRequestMock.mock.calls[0]?.[1] as Record<string, unknown>;
    const parsedBody = parsePostJsonBody(options);
    const valueJson = parsedBody.valueJson as Record<string, unknown>;

    expect(valueJson.attempts).toBe(12);
    expect(valueJson.successes).toBe(10);
    expect(valueJson.provider).toEqual({ key: "trackman" });
    expect(typeof valueJson.provider).toBe("object");
  });

  it("does not call adherence endpoints", async () => {
    apiRequestMock.mockResolvedValue({ success: true });

    await postGolfSportMetricRecord("entity-1", "athlete-1", {
      trainingPlanVersionId: "version-1",
      plannedSessionId: "ps-1",
      occurredAt: "2026-05-24T12:00:00.000Z",
      metricType: "ROUND_RESULT",
      environment: "ON_COURSE",
      source: "ATHLETE_MANUAL",
      prescribedContextJson: { label: "Round" },
      valueJson: { holesPlayed: 18, score: 82, par: 72 },
    });

    const path = apiRequestMock.mock.calls[0]?.[0] as string;
    expect(path).not.toMatch(/adherence/i);
  });
});
