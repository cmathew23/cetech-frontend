import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

import {
  buildBasketballSportMetricRecordRequestBody,
  postBasketballSportMetricRecord,
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
