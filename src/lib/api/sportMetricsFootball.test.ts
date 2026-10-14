import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

import { validateMeasurementEntryForm } from "@/lib/sportMetrics/measurementEntryContract";
import { postFootballSportMetricRecord } from "@/lib/api/sportMetricsFootball";

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
