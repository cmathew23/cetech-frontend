import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  buildGolfPrescribedContext,
  isAttemptsTargetHitsContract,
  readDrillMeasurementContract,
  validateGolfDrillV2Form,
  validateGolfRoundSportMetricForm,
  type GolfDrillV2FormValues,
} from "@/lib/sportMetrics/buildGolfPrescribedContext";
import { buildLoggedDrillSummary } from "@/components/dashboard/athlete/LogSportResultModal";

function drillForm(overrides: Partial<GolfDrillV2FormValues> = {}): GolfDrillV2FormValues {
  return {
    context: "",
    attempts: "",
    successes: "",
    targetHits: "",
    qualityRating: "",
    distanceBand: "",
    targetRadius: "",
    missesLeft: "",
    missesRight: "",
    missesShort: "",
    missesLong: "",
    notes: "",
    ...overrides,
  };
}

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

    const valueResult = validateGolfDrillV2Form(
      drillForm({
        context: "Practice green",
        attempts: "9",
        successes: "7",
        qualityRating: "4",
        distanceBand: "3-9ft",
        missesLeft: "1",
        missesRight: "1",
        missesShort: "0",
        missesLong: "0",
        notes: "Good session",
      }),
    );

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
    const result = validateGolfDrillV2Form(
      drillForm({
        attempts: "",
        successes: "5",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Attempts");
    }
  });

  it("blocks successes greater than attempts", () => {
    const result = validateGolfDrillV2Form(
      drillForm({
        attempts: "5",
        successes: "10",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("cannot exceed");
    }
  });

  it("blocks quality rating outside 1-5 range", () => {
    const result = validateGolfDrillV2Form(
      drillForm({
        attempts: "10",
        successes: "8",
        qualityRating: "6",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("between 1 and 5");
    }
  });

  it("accepts valid v2 drill form with miss breakdown", () => {
    const result = validateGolfDrillV2Form(
      drillForm({
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
      }),
    );

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
    const result = validateGolfDrillV2Form(
      drillForm({
        attempts: "10",
        successes: "8",
      }),
    );

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

describe("measurementContract-driven drill logging", () => {
  const attemptsTargetHitsContract = {
    requiredResultFields: ["attempts", "targetHits"],
    numeratorField: "targetHits",
    denominatorField: "attempts",
  };

  it("treats requiredResultFields [attempts, targetHits] as contract-driven regardless of metricKey", () => {
    const fromStartLine = readDrillMeasurementContract({
      measurementContract: {
        ...attemptsTargetHitsContract,
        metricKey: "start_line_consistency",
      },
    });
    const fromCustomKey = readDrillMeasurementContract({
      measurementContract: {
        ...attemptsTargetHitsContract,
        metricKey: "any_other_key",
      },
    });
    expect(isAttemptsTargetHitsContract(fromStartLine)).toBe(true);
    expect(isAttemptsTargetHitsContract(fromCustomKey)).toBe(true);
  });

  it("does not treat missing or empty measurementContract as contract-driven", () => {
    expect(isAttemptsTargetHitsContract(readDrillMeasurementContract({}))).toBe(false);
    expect(
      isAttemptsTargetHitsContract(
        readDrillMeasurementContract({ measurementContract: { metricKey: "start_line_consistency" } }),
      ),
    ).toBe(false);
    expect(
      isAttemptsTargetHitsContract(
        readDrillMeasurementContract({
          label: "Custom Goal drill",
          skillCode: "CUSTOM_GOAL",
        }),
      ),
    ).toBe(false);
  });

  it("saves only attempts and targetHits and drops stale hidden measurement values", () => {
    const contract = readDrillMeasurementContract({
      measurementContract: attemptsTargetHitsContract,
    });
    const result = validateGolfDrillV2Form(
      drillForm({
        context: "Range",
        attempts: "12",
        targetHits: "8",
        successes: "99",
        qualityRating: "5",
        distanceBand: "20-30yd",
        targetRadius: "3ft",
        missesLeft: "3",
        missesRight: "2",
        missesShort: "1",
        missesLong: "1",
        notes: "Solid window",
      }),
      contract,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.valueJson).toEqual({
      attempts: 12,
      targetHits: 8,
      context: "Range",
      notes: "Solid window",
    });
    expect(result.valueJson).not.toHaveProperty("successes");
    expect(result.valueJson).not.toHaveProperty("qualityRating");
    expect(result.valueJson).not.toHaveProperty("distanceBand");
    expect(result.valueJson).not.toHaveProperty("targetRadius");
    expect(result.valueJson).not.toHaveProperty("missesLeft");
    expect(result.valueJson).not.toHaveProperty("percentage");
    expect(result.valueJson).not.toHaveProperty("missCounts");
  });

  it("posts contract-driven valueJson through the existing sport-metric save helper", async () => {
    postGolfSportMetricRecordMock.mockReset();
    postGolfSportMetricRecordMock.mockResolvedValue({ success: true });

    const drill = {
      label: "Start line window",
      measurementContract: attemptsTargetHitsContract,
      order: 1,
    };
    const contract = readDrillMeasurementContract(drill);
    const valueResult = validateGolfDrillV2Form(
      drillForm({
        attempts: "10",
        targetHits: "7",
        successes: "4",
        qualityRating: "3",
      }),
      contract,
    );
    expect(valueResult.ok).toBe(true);
    if (!valueResult.ok) return;

    await postGolfSportMetricRecord("entity-1", "athlete-1", {
      trainingPlanVersionId: "version-skills",
      plannedSessionId: "session-1",
      occurredAt: "2026-05-24T16:00:00.000Z",
      metricType: "DRILL_RESULT",
      environment: "PRACTICE_FACILITY",
      source: "ATHLETE_MANUAL",
      prescribedContextJson: { label: "Start line window" },
      valueJson: valueResult.valueJson,
      plannedSkillItemOrder: 1,
    });

    const payload = postGolfSportMetricRecordMock.mock.calls[0]?.[2] as {
      valueJson: Record<string, unknown>;
    };
    expect(payload.valueJson).toEqual({ attempts: 10, targetHits: 7 });
    expect(Object.keys(payload.valueJson).sort()).toEqual(["attempts", "targetHits"]);
  });

  it("preserves legacy payload when measurementContract is absent (unsupported library / custom goal)", () => {
    const unsupportedLibrary = validateGolfDrillV2Form(
      drillForm({
        attempts: "9",
        successes: "6",
        qualityRating: "4",
        missesLeft: "1",
      }),
    );
    const customGoal = validateGolfDrillV2Form(
      drillForm({
        attempts: "9",
        successes: "6",
        qualityRating: "4",
        missesLeft: "1",
      }),
      readDrillMeasurementContract({ label: "Custom Goal", primaryGoalName: "Make 8/10" }),
    );

    expect(unsupportedLibrary.ok).toBe(true);
    expect(customGoal.ok).toBe(true);
    if (!unsupportedLibrary.ok || !customGoal.ok) return;

    expect(unsupportedLibrary.valueJson).toEqual({
      attempts: 9,
      successes: 6,
      qualityRating: 4,
      missesLeft: 1,
    });
    expect(customGoal.valueJson).toEqual(unsupportedLibrary.valueJson);
  });

  it("keeps common modal chrome and gates extra measurement fields behind the contract check", () => {
    const modalSource = readFileSync(
      new URL("./LogSportResultModal.tsx", import.meta.url),
      "utf8",
    );
    const journalSource = readFileSync(
      new URL("./AthleteWeeklyPlanJournalPageContent.tsx", import.meta.url),
      "utf8",
    );

    expect(modalSource).toContain("Log Sport Result");
    expect(modalSource).toContain("About the Exercise");
    expect(modalSource).toContain("Planned Drill Classification");
    expect(modalSource).toContain("Metric Source");
    expect(modalSource).toContain("formatMeasurementMetricSource");
    expect(modalSource).toContain("measurementMetricName");
    expect(modalSource).toContain("Where are you doing this?");
    expect(modalSource).toContain("Practice Facility");
    expect(modalSource).toContain("Simulator");
    expect(modalSource).toContain("On Golf Course");
    expect(modalSource).toContain("Context / Location (optional)");
    expect(modalSource).toContain("Notes (optional)");
    expect(modalSource).toContain("Wearables logging — Coming soon");
    expect(modalSource).toContain("Cancel");
    expect(modalSource).toContain("Save sport result");
    expect(modalSource).toContain("attemptsTargetHitsOnly");
    expect(modalSource).toContain('label="Target Hits"');
    expect(modalSource).toContain('label="Successes"');
    expect(modalSource).toContain("Quality rating");
    expect(modalSource).toContain("Distance band");
    expect(modalSource).toContain("Target radius");
    expect(modalSource).toContain("Miss breakdown");
    expect(modalSource).toContain("validateGolfDrillV2Form(drillForm, measurementContract)");
    expect(modalSource).toContain("readMeasurementEntryContract");
    expect(modalSource).toContain("validateMeasurementEntryForm");
    expect(modalSource).toContain("entryMode");
    expect(modalSource).toContain("INDIVIDUAL");
    expect(modalSource).toContain("CUMULATIVE");
    expect(modalSource).toContain("+ Add attempt");
    expect(modalSource).toContain("postGolfSportMetricRecord");
    expect(modalSource).not.toContain("fetch(");
    expect(modalSource).not.toContain("fetchMeasurementContract");
    expect(journalSource).toContain("drill: mergedSkillItem");
    expect(journalSource).not.toContain("measurementContract");
    expect(journalSource).not.toContain("measurementEntryContract");
    expect(journalSource).not.toContain("fetchMeasurementContract");
  });
});

describe("measurementEntryContract-driven result logging", () => {
  const clubHeadSpeedContract = {
    INDIVIDUAL: {
      fields: [{ key: "speed", label: "Club Head Speed", type: "NUMBER", unit: "mph" }],
    },
    CUMULATIVE: {
      fields: [
        { key: "attempts", label: "Attempts", type: "INTEGER" },
        { key: "averageSpeed", label: "Average club head speed", type: "NUMBER", unit: "mph" },
      ],
    },
  };

  const proximityContract = {
    INDIVIDUAL: {
      fields: [
        { key: "proximityFeet", label: "Proximity to Hole", type: "INTEGER", unit: "ft" },
        { key: "proximityInches", label: "Proximity to Hole", type: "INTEGER", unit: "in" },
      ],
    },
    CUMULATIVE: {
      fields: [
        { key: "attempts", label: "Attempts", type: "INTEGER" },
        { key: "averageProximityFeet", label: "Average proximity", type: "INTEGER", unit: "ft" },
        { key: "averageProximityInches", label: "Average proximity", type: "INTEGER", unit: "in" },
      ],
    },
  };

  const scramblingContract = {
    INDIVIDUAL: {
      fields: [{ key: "success", label: "Success", type: "BOOLEAN" }],
    },
    CUMULATIVE: {
      fields: [
        { key: "attempts", label: "Attempts", type: "INTEGER" },
        { key: "successes", label: "Successes", type: "INTEGER" },
      ],
    },
  };

  const puttingPercentContract = {
    INDIVIDUAL: {
      fields: [
        { key: "puttDistance", label: "Putt distance", type: "NUMBER", unit: "ft" },
        { key: "made", label: "Made", type: "BOOLEAN" },
      ],
    },
    CUMULATIVE: {
      fields: [
        { key: "puttDistance", label: "Putt distance", type: "NUMBER", unit: "ft" },
        { key: "attempts", label: "Attempts", type: "INTEGER" },
        { key: "made", label: "Made", type: "INTEGER" },
      ],
    },
  };

  async function postValueJson(valueJson: Record<string, unknown>) {
    postGolfSportMetricRecordMock.mockReset();
    postGolfSportMetricRecordMock.mockResolvedValue({ success: true });
    await postGolfSportMetricRecord("entity-1", "athlete-1", {
      trainingPlanVersionId: "version-skills",
      plannedSessionId: "session-1",
      occurredAt: "2026-05-24T16:00:00.000Z",
      metricType: "DRILL_RESULT",
      environment: "PRACTICE_FACILITY",
      source: "ATHLETE_MANUAL",
      prescribedContextJson: { label: "Contract drill" },
      valueJson,
    });
    return postGolfSportMetricRecordMock.mock.calls[0]?.[2] as {
      valueJson: Record<string, unknown>;
    };
  }

  it("posts Club Head Speed Individual and Cumulative with exact keys", async () => {
    const { readMeasurementEntryContract, validateMeasurementEntryForm } = await import(
      "@/lib/sportMetrics/measurementEntryContract"
    );
    const contract = readMeasurementEntryContract({
      measurementEntryContract: clubHeadSpeedContract,
    });
    expect(contract).not.toBeNull();
    if (!contract) return;

    const individual = validateMeasurementEntryForm({
      contract,
      entryMode: "INDIVIDUAL",
      attempts: [{ speed: "96" }, { speed: "98" }],
      cumulative: { attempts: "20", averageSpeed: "96" },
      notes: "",
    });
    expect(individual.ok).toBe(true);
    if (!individual.ok) return;
    expect((await postValueJson(individual.valueJson)).valueJson).toEqual({
      entryMode: "INDIVIDUAL",
      attempts: [{ speed: 96 }, { speed: 98 }],
    });

    const cumulative = validateMeasurementEntryForm({
      contract,
      entryMode: "CUMULATIVE",
      attempts: [{ speed: "96" }],
      cumulative: { attempts: "20", averageSpeed: "96" },
      notes: "",
    });
    expect(cumulative.ok).toBe(true);
    if (!cumulative.ok) return;
    expect((await postValueJson(cumulative.valueJson)).valueJson).toEqual({
      entryMode: "CUMULATIVE",
      attempts: 20,
      averageSpeed: 96,
    });
  });

  it("posts Proximity Individual and Cumulative with exact keys", async () => {
    const { readMeasurementEntryContract, validateMeasurementEntryForm } = await import(
      "@/lib/sportMetrics/measurementEntryContract"
    );
    const contract = readMeasurementEntryContract({
      measurementEntryContract: proximityContract,
    });
    expect(contract).not.toBeNull();
    if (!contract) return;

    const individual = validateMeasurementEntryForm({
      contract,
      entryMode: "INDIVIDUAL",
      attempts: [
        { proximityFeet: "8", proximityInches: "4" },
        { proximityFeet: "6", proximityInches: "9" },
      ],
      cumulative: {
        attempts: "10",
        averageProximityFeet: "7",
        averageProximityInches: "2",
      },
      notes: "",
    });
    expect(individual.ok).toBe(true);
    if (!individual.ok) return;
    expect((await postValueJson(individual.valueJson)).valueJson).toEqual({
      entryMode: "INDIVIDUAL",
      attempts: [
        { proximityFeet: 8, proximityInches: 4 },
        { proximityFeet: 6, proximityInches: 9 },
      ],
    });

    const cumulative = validateMeasurementEntryForm({
      contract,
      entryMode: "CUMULATIVE",
      attempts: [{ proximityFeet: "8", proximityInches: "4" }],
      cumulative: {
        attempts: "12",
        averageProximityFeet: "7",
        averageProximityInches: "6",
      },
      notes: "",
    });
    expect(cumulative.ok).toBe(true);
    if (!cumulative.ok) return;
    expect((await postValueJson(cumulative.valueJson)).valueJson).toEqual({
      entryMode: "CUMULATIVE",
      attempts: 12,
      averageProximityFeet: 7,
      averageProximityInches: 6,
    });
  });

  it("posts Scrambling Individual and Cumulative with exact keys", async () => {
    const { readMeasurementEntryContract, validateMeasurementEntryForm } = await import(
      "@/lib/sportMetrics/measurementEntryContract"
    );
    const contract = readMeasurementEntryContract({
      measurementEntryContract: scramblingContract,
    });
    expect(contract).not.toBeNull();
    if (!contract) return;

    const individual = validateMeasurementEntryForm({
      contract,
      entryMode: "INDIVIDUAL",
      attempts: [{ success: "true" }, { success: "false" }],
      cumulative: { attempts: "10", successes: "6" },
      notes: "",
    });
    expect(individual.ok).toBe(true);
    if (!individual.ok) return;
    expect((await postValueJson(individual.valueJson)).valueJson).toEqual({
      entryMode: "INDIVIDUAL",
      attempts: [{ success: true }, { success: false }],
    });

    const cumulative = validateMeasurementEntryForm({
      contract,
      entryMode: "CUMULATIVE",
      attempts: [{ success: "true" }],
      cumulative: { attempts: "10", successes: "6" },
      notes: "",
    });
    expect(cumulative.ok).toBe(true);
    if (!cumulative.ok) return;
    expect((await postValueJson(cumulative.valueJson)).valueJson).toEqual({
      entryMode: "CUMULATIVE",
      attempts: 10,
      successes: 6,
    });
  });

  it("posts Putting % Individual and Cumulative with exact keys", async () => {
    const { readMeasurementEntryContract, validateMeasurementEntryForm } = await import(
      "@/lib/sportMetrics/measurementEntryContract"
    );
    const contract = readMeasurementEntryContract({
      measurementEntryContract: puttingPercentContract,
    });
    expect(contract).not.toBeNull();
    if (!contract) return;

    const individual = validateMeasurementEntryForm({
      contract,
      entryMode: "INDIVIDUAL",
      attempts: [
        { puttDistance: "6", made: "true" },
        { puttDistance: "6", made: "false" },
      ],
      cumulative: { puttDistance: "6", attempts: "20", made: "14" },
      notes: "",
    });
    expect(individual.ok).toBe(true);
    if (!individual.ok) return;
    expect((await postValueJson(individual.valueJson)).valueJson).toEqual({
      entryMode: "INDIVIDUAL",
      attempts: [
        { puttDistance: 6, made: true },
        { puttDistance: 6, made: false },
      ],
    });

    const cumulative = validateMeasurementEntryForm({
      contract,
      entryMode: "CUMULATIVE",
      attempts: [{ puttDistance: "6", made: "true" }],
      cumulative: { puttDistance: "6", attempts: "20", made: "14" },
      notes: "",
    });
    expect(cumulative.ok).toBe(true);
    if (!cumulative.ok) return;
    expect((await postValueJson(cumulative.valueJson)).valueJson).toEqual({
      entryMode: "CUMULATIVE",
      puttDistance: 6,
      attempts: 20,
      made: 14,
    });
  });

  it("keeps generic measurement fields in source for uncontracted exercises only", () => {
    const modalSource = readFileSync(
      new URL("./LogSportResultModal.tsx", import.meta.url),
      "utf8",
    );
    expect(modalSource).toContain("measurementEntryContract ? (");
    expect(modalSource).toContain("attemptsTargetHitsOnly ? (");
    expect(modalSource).toContain('label="Successes"');
    expect(modalSource).not.toMatch(/reps.*length|length.*reps/);
    expect(modalSource).not.toContain("clubHeadSpeed");
    expect(modalSource).not.toContain("finalDistanceFt");
    expect(modalSource).toContain("formatMeasurementMetricSource");
    expect(modalSource).toContain('field.type === "ENUM"');
    expect(modalSource).toContain('field.type === "STRING"');
    expect(modalSource).toContain("hasMeasurementEntryContractPayload");
    expect(modalSource).toContain("measurementEntryFieldDisplayLabel");
    expect(modalSource).toContain("measurementEntryFieldHelperText");
    expect(modalSource).toContain("isGripPressureMetricField");
    expect(modalSource).not.toContain("targetCarryDistance");
    expect(modalSource).not.toContain("puttDistanceFeet");
    expect(modalSource).not.toContain("throughWindow");
    expect(modalSource).not.toContain("startLie");
  });
});

describe("B-exercise contract-driven logging", () => {
  async function postValueJson(valueJson: Record<string, unknown>) {
    postGolfSportMetricRecordMock.mockReset();
    postGolfSportMetricRecordMock.mockResolvedValue({ success: true });
    await postGolfSportMetricRecord("entity-1", "athlete-1", {
      trainingPlanVersionId: "version-skills",
      plannedSessionId: "session-1",
      occurredAt: "2026-05-24T16:00:00.000Z",
      metricType: "DRILL_RESULT",
      environment: "PRACTICE_FACILITY",
      source: "ATHLETE_MANUAL",
      prescribedContextJson: { label: "B drill" },
      valueJson,
    });
    return postGolfSportMetricRecordMock.mock.calls[0]?.[2] as {
      valueJson: Record<string, unknown>;
    };
  }

  it("posts carry-distance Individual and Cumulative with exact keys", async () => {
    const { readMeasurementEntryContract, validateMeasurementEntryForm } = await import(
      "@/lib/sportMetrics/measurementEntryContract"
    );
    const contract = readMeasurementEntryContract({
      measurementEntryContract: {
        INDIVIDUAL: {
          fields: [
            { key: "targetCarryDistance", label: "Target carry", type: "NUMBER", unit: "yd" },
            { key: "actualCarryDistance", label: "Actual carry", type: "NUMBER", unit: "yd" },
          ],
        },
        CUMULATIVE: {
          fields: [
            { key: "targetCarryDistance", label: "Target carry", type: "NUMBER", unit: "yd" },
            { key: "attempts", label: "Attempts", type: "INTEGER" },
            {
              key: "totalActualCarryDistance",
              label: "Total actual carry",
              type: "NUMBER",
              unit: "yd",
            },
          ],
        },
      },
    });
    expect(contract).not.toBeNull();
    if (!contract) return;

    const individual = validateMeasurementEntryForm({
      contract,
      entryMode: "INDIVIDUAL",
      attempts: [{ targetCarryDistance: "160", actualCarryDistance: "158" }],
      cumulative: {
        targetCarryDistance: "160",
        attempts: "20",
        totalActualCarryDistance: "3160",
      },
      notes: "",
    });
    expect(individual.ok).toBe(true);
    if (!individual.ok) return;
    expect((await postValueJson(individual.valueJson)).valueJson).toEqual({
      entryMode: "INDIVIDUAL",
      attempts: [{ targetCarryDistance: 160, actualCarryDistance: 158 }],
    });

    const cumulative = validateMeasurementEntryForm({
      contract,
      entryMode: "CUMULATIVE",
      attempts: [{ targetCarryDistance: "160", actualCarryDistance: "158" }],
      cumulative: {
        targetCarryDistance: "160",
        attempts: "20",
        totalActualCarryDistance: "3108",
      },
      notes: "",
    });
    expect(cumulative.ok).toBe(true);
    if (!cumulative.ok) return;
    expect((await postValueJson(cumulative.valueJson)).valueJson).toEqual({
      entryMode: "CUMULATIVE",
      targetCarryDistance: 160,
      attempts: 20,
      totalActualCarryDistance: 3108,
    });
  });

  it("posts enum + boolean Individual with exact keys", async () => {
    const { readMeasurementEntryContract, validateMeasurementEntryForm } = await import(
      "@/lib/sportMetrics/measurementEntryContract"
    );
    const contract = readMeasurementEntryContract({
      measurementEntryContract: {
        INDIVIDUAL: {
          fields: [
            {
              key: "startLie",
              label: "Start lie",
              type: "ENUM",
              options: ["FAIRWAY", "ROUGH"],
            },
            { key: "success", label: "Success", type: "BOOLEAN" },
          ],
        },
        CUMULATIVE: {
          fields: [
            { key: "attempts", label: "Attempts", type: "INTEGER" },
            { key: "successes", label: "Successes", type: "INTEGER" },
          ],
        },
      },
    });
    expect(contract).not.toBeNull();
    if (!contract) return;
    const individual = validateMeasurementEntryForm({
      contract,
      entryMode: "INDIVIDUAL",
      attempts: [{ startLie: "FAIRWAY", success: "true" }],
      cumulative: { attempts: "8", successes: "5" },
      notes: "notes",
    });
    expect(individual.ok).toBe(true);
    if (!individual.ok) return;
    expect((await postValueJson(individual.valueJson)).valueJson).toEqual({
      entryMode: "INDIVIDUAL",
      attempts: [{ startLie: "FAIRWAY", success: true }],
      notes: "notes",
    });
  });

  it("location radio onChange does not rewrite result-entry rows", () => {
    const modalSource = readFileSync(
      new URL("./LogSportResultModal.tsx", import.meta.url),
      "utf8",
    );
    expect(modalSource).toMatch(
      /name="sport-metric-log-mode"[\s\S]*?onChange=\{\(\) => \{\s*setMode\(option\.value\);\s*setError\(null\);\s*\}\}/,
    );
    expect(modalSource).not.toMatch(/setMode\(option\.value\);[\s\S]{0,80}setAttemptRows/);
    expect(modalSource).not.toMatch(/setMode\(option\.value\);[\s\S]{0,80}setCumulativeValues/);
  });
});
