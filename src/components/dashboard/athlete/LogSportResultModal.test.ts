import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  buildGolfPrescribedContext,
  validateGolfDrillV2Form,
  validateGolfRoundSportMetricForm,
} from "@/lib/sportMetrics/buildGolfPrescribedContext";
import { buildLoggedDrillSummary } from "@/components/dashboard/athlete/LogSportResultModal";

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

  it("passes v2 drill result with miss breakdown to postGolfSportMetricRecord", async () => {
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
        skillCategory: "Putting",
        order: 1,
      },
      itemIndex: 0,
    };

    const valueResult = validateGolfDrillV2Form({
      context: "Practice green",
      attempts: "9",
      successes: "7",
      qualityRating: "4",
      distanceBand: "3-9ft",
      targetRadius: "",
      missesLeft: "1",
      missesRight: "1",
      missesShort: "0",
      missesLong: "0",
      notes: "Good session",
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
      environment: "PRACTICE_FACILITY",
      source: "ATHLETE_MANUAL",
      prescribedContextJson,
      valueJson: valueResult.valueJson,
      plannedSkillItemOrder: 1,
    });

    const payload = postGolfSportMetricRecordMock.mock.calls[0]?.[2] as {
      prescribedContextJson: unknown;
      valueJson: unknown;
      plannedSkillItemOrder?: number;
    };

    expect(typeof payload.prescribedContextJson).toBe("object");
    expect(typeof payload.valueJson).toBe("object");
    expect(payload.prescribedContextJson).toEqual(
      expect.objectContaining({
        label: "3-6-9 Circle Pressure Drill",
        skillCode: "PUTTING_DRILL",
        skillCategory: "Putting",
      }),
    );
    expect(payload.valueJson).toEqual(
      expect.objectContaining({
        attempts: 9,
        successes: 7,
        qualityRating: 4,
        context: "Practice green",
        distanceBand: "3-9ft",
        missesLeft: 1,
        missesRight: 1,
        missesShort: 0,
        missesLong: 0,
        notes: "Good session",
      }),
    );
    expect(payload.plannedSkillItemOrder).toBe(1);
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

describe("v2 drill form validation", () => {
  it("validates attempts and successes are required", () => {
    const result = validateGolfDrillV2Form({
      context: "",
      attempts: "",
      successes: "5",
      qualityRating: "",
      distanceBand: "",
      targetRadius: "",
      missesLeft: "",
      missesRight: "",
      missesShort: "",
      missesLong: "",
      notes: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Attempts");
    }
  });

  it("blocks successes greater than attempts", () => {
    const result = validateGolfDrillV2Form({
      context: "",
      attempts: "5",
      successes: "10",
      qualityRating: "",
      distanceBand: "",
      targetRadius: "",
      missesLeft: "",
      missesRight: "",
      missesShort: "",
      missesLong: "",
      notes: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("cannot exceed");
    }
  });

  it("blocks quality rating outside 1-5 range", () => {
    const result = validateGolfDrillV2Form({
      context: "",
      attempts: "10",
      successes: "8",
      qualityRating: "6",
      distanceBand: "",
      targetRadius: "",
      missesLeft: "",
      missesRight: "",
      missesShort: "",
      missesLong: "",
      notes: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("between 1 and 5");
    }
  });

  it("accepts valid v2 drill form with miss breakdown", () => {
    const result = validateGolfDrillV2Form({
      context: "Practice facility",
      attempts: "20",
      successes: "15",
      qualityRating: "3",
      distanceBand: "10-20yd",
      targetRadius: "6ft",
      missesLeft: "2",
      missesRight: "1",
      missesShort: "1",
      missesLong: "1",
      notes: "Good session",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.valueJson).toEqual({
      attempts: 20,
      successes: 15,
      qualityRating: 3,
      context: "Practice facility",
      distanceBand: "10-20yd",
      targetRadius: "6ft",
      missesLeft: 2,
      missesRight: 1,
      missesShort: 1,
      missesLong: 1,
      notes: "Good session",
    });
  });

  it("omits optional fields when empty", () => {
    const result = validateGolfDrillV2Form({
      context: "",
      attempts: "10",
      successes: "8",
      qualityRating: "",
      distanceBand: "",
      targetRadius: "",
      missesLeft: "",
      missesRight: "",
      missesShort: "",
      missesLong: "",
      notes: "",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.valueJson).toEqual({ attempts: 10, successes: 8 });
  });
});

describe("prescribed context includes v2 classification fields", () => {
  it("includes skillArea, sportCapability, skillCategory from drill data", () => {
    const context = buildGolfPrescribedContext({
      drill: {
        label: "Bunker Escape",
        skillCode: "BUNKER_DRILL",
        skillArea: "Short Game",
        sportCapability: "Bunker Play",
        skillCategory: "Bunker",
        order: 2,
      },
      itemIndex: 1,
      plannedSessionId: "ps-1",
      trainingPlanVersionId: "tv-1",
      sectionKey: "skill",
      sessionTitle: "Bunker Session",
      dayDate: "2026-06-05",
    });

    expect(context.skillArea).toBe("Short Game");
    expect(context.sportCapability).toBe("Bunker Play");
    expect(context.skillCategory).toBe("Bunker");
    expect(context.skillCode).toBe("BUNKER_DRILL");
  });
});

describe("buildLoggedDrillSummary", () => {
  it("builds summary from form valueJson with client-computed successRate", () => {
    const valueJson = { attempts: 10, successes: 7, qualityRating: 4, context: "Practice green" };
    const summary = buildLoggedDrillSummary(valueJson, null);

    expect(summary.attempts).toBe(10);
    expect(summary.successes).toBe(7);
    expect(summary.successRate).toBe(70);
    expect(summary.qualityRating).toBe(4);
    expect(summary.context).toBe("Practice green");
    expect(summary.missesLeft).toBeNull();
  });

  it("prefers backend successRate over client-computed", () => {
    const valueJson = { attempts: 9, successes: 7 };
    const backendResponse = { result: { successRate: 77.8 } };
    const summary = buildLoggedDrillSummary(valueJson, backendResponse);

    expect(summary.successRate).toBe(77.8);
  });

  it("extracts backend successRate from nested data.result", () => {
    const valueJson = { attempts: 20, successes: 15 };
    const backendResponse = { data: { result: { successRate: 75 } } };
    const summary = buildLoggedDrillSummary(valueJson, backendResponse);

    expect(summary.successRate).toBe(75);
  });

  it("includes miss breakdown fields", () => {
    const valueJson = {
      attempts: 10,
      successes: 7,
      missesLeft: 1,
      missesRight: 2,
      missesShort: 0,
      missesLong: 0,
    };
    const summary = buildLoggedDrillSummary(valueJson, null);

    expect(summary.missesLeft).toBe(1);
    expect(summary.missesRight).toBe(2);
    expect(summary.missesShort).toBe(0);
    expect(summary.missesLong).toBe(0);
  });

  it("returns null fields for empty valueJson", () => {
    const summary = buildLoggedDrillSummary({}, null);

    expect(summary.attempts).toBeNull();
    expect(summary.successes).toBeNull();
    expect(summary.successRate).toBeNull();
    expect(summary.qualityRating).toBeNull();
    expect(summary.context).toBeNull();
  });
});
