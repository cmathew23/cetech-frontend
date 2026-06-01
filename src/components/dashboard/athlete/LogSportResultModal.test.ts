import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  buildGolfPrescribedContext,
  validateGolfDrillSportMetricForm,
  validateGolfRoundSportMetricForm,
} from "@/lib/sportMetrics/buildGolfPrescribedContext";

const { postGolfSportMetricRecordMock } = vi.hoisted(() => ({
  postGolfSportMetricRecordMock: vi.fn(),
}));

vi.mock("@/lib/api/sportMetricsGolf", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/sportMetricsGolf")>();
  return {
    ...actual,
    postGolfSportMetricRecord: postGolfSportMetricRecordMock,
  };
});

import { postGolfSportMetricRecord } from "@/lib/api/sportMetricsGolf";

describe("LogSportResultModal regression guards", () => {
  it("does not import wearable period helpers", () => {
    const source = readFileSync(
      new URL("./LogSportResultModal.tsx", import.meta.url),
      "utf8",
    );
    expect(source).not.toContain("wearablePeriod");
  });

  it("does not call adherence API helpers", () => {
    const source = readFileSync(
      new URL("./LogSportResultModal.tsx", import.meta.url),
      "utf8",
    );
    expect(source).not.toContain("recordPlannedSessionAdherenceEvent");
    expect(source).not.toContain("fetchPlannedSessionAdherenceEvents");
    expect(source).toContain("postGolfSportMetricRecord");
  });
});

describe("modal submit payload", () => {
  beforeEach(() => {
    postGolfSportMetricRecordMock.mockReset();
    postGolfSportMetricRecordMock.mockResolvedValue({ success: true });
  });

  it("passes object prescribedContextJson and valueJson to postGolfSportMetricRecord", async () => {
    const context = {
      entityId: "entity-1",
      athleteId: "athlete-1",
      trainingPlanVersionId: "version-skills",
      plannedSessionId: "session-1",
      dayDate: "2026-05-24",
      sessionTitle: "Short Game",
      sectionKey: "skill",
      drill: {
        label: "3-6-9 Circle Pressure Drill",
        skillCode: "PUTTING_DRILL",
        order: 1,
      },
      itemIndex: 0,
    };

    const valueResult = validateGolfDrillSportMetricForm({
      attempts: "9",
      successes: "7",
      distanceBand: "",
      missPattern: "",
      provider: "trackman",
      carryDistance: "",
      ballSpeed: "",
      clubSpeed: "",
      offlineDispersion: "",
      notes: "",
    });

    expect(valueResult.ok).toBe(true);
    if (!valueResult.ok) return;

    const prescribedContextJson = buildGolfPrescribedContext({
      drill: context.drill,
      itemIndex: context.itemIndex,
      plannedSessionId: context.plannedSessionId,
      trainingPlanVersionId: context.trainingPlanVersionId,
      sectionKey: context.sectionKey,
      sessionTitle: context.sessionTitle,
      dayDate: context.dayDate,
    });

    await postGolfSportMetricRecord(context.entityId, context.athleteId, {
      trainingPlanVersionId: context.trainingPlanVersionId,
      plannedSessionId: context.plannedSessionId,
      occurredAt: "2026-05-24T16:00:00.000Z",
      metricType: "DRILL_RESULT",
      environment: "SIMULATOR",
      source: "SIMULATOR_MANUAL",
      prescribedContextJson,
      valueJson: valueResult.valueJson,
    });

    const payload = postGolfSportMetricRecordMock.mock.calls[0]?.[2] as {
      prescribedContextJson: unknown;
      valueJson: unknown;
    };

    expect(typeof payload.prescribedContextJson).toBe("object");
    expect(typeof payload.valueJson).toBe("object");
    expect(payload.prescribedContextJson).not.toBe("[object Object]");
    expect(payload.valueJson).not.toBe("[object Object]");
    expect(payload.prescribedContextJson).toEqual(
      expect.objectContaining({ label: "3-6-9 Circle Pressure Drill" }),
    );
    expect(payload.valueJson).toEqual(
      expect.objectContaining({
        attempts: 9,
        successes: 7,
        provider: { key: "trackman" },
      }),
    );
  });
});

describe("round sport metric form validation", () => {
  it("requires holes played, score, and par", () => {
    const result = validateGolfRoundSportMetricForm({
      holesPlayed: "",
      score: "82",
      par: "72",
      putts: "",
      fairwaysHit: "",
      fairwaysPossible: "",
      greensInRegulation: "",
      girPossible: "",
      penalties: "",
      notes: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Holes played");
    }
  });
});
