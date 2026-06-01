import { describe, expect, it } from "vitest";
import {
  buildGolfPrescribedContext,
  mapGolfSportMetricLogMode,
  validateGolfDrillSportMetricForm,
} from "@/lib/sportMetrics/buildGolfPrescribedContext";

describe("buildGolfPrescribedContext", () => {
  it("includes label, skillCode, order, reps, and parent linkage ids", () => {
    const context = buildGolfPrescribedContext({
      drill: {
        label: "3-6-9 Circle Pressure Drill",
        summary: "Pressure putting ladder",
        itemType: "PUTTING_DRILL",
        order: 2,
        reps: "3x9",
        durationMinutes: 15,
      },
      itemIndex: 1,
      plannedSessionId: "session-abc",
      trainingPlanVersionId: "version-skills",
      sectionKey: "skill",
      sessionTitle: "Short Game Session",
      dayDate: "2026-05-24",
    });

    expect(context).toEqual({
      label: "3-6-9 Circle Pressure Drill",
      summary: "Pressure putting ladder",
      skillCode: "PUTTING_DRILL",
      order: 2,
      reps: "3x9",
      durationMinutes: 15,
      plannedSessionId: "session-abc",
      trainingPlanVersionId: "version-skills",
      sectionKey: "skill",
      sessionTitle: "Short Game Session",
      dayDate: "2026-05-24",
    });
  });

  it("resolves skillCode from itemType and order from itemIndex fallback", () => {
    const context = buildGolfPrescribedContext({
      drill: { name: "Chip Ladder", itemType: "SHORT_GAME" },
      itemIndex: 0,
      plannedSessionId: "ps-1",
      trainingPlanVersionId: "tv-1",
      sectionKey: "skill",
      sessionTitle: null,
      dayDate: null,
    });

    expect(context.label).toBe("Chip Ladder");
    expect(context.skillCode).toBe("SHORT_GAME");
    expect(context.order).toBe(1);
    expect(context).not.toHaveProperty("dayDate");
    expect(context).not.toHaveProperty("sessionTitle");
  });

  it("omits undefined optional fields", () => {
    const context = buildGolfPrescribedContext({
      drill: { label: "Warm-up" },
      itemIndex: 2,
      plannedSessionId: "ps-2",
      trainingPlanVersionId: "tv-2",
      sectionKey: "skill",
      sessionTitle: "Range",
      dayDate: "2026-05-25",
    });

    expect(context).not.toHaveProperty("summary");
    expect(context).not.toHaveProperty("reps");
    expect(context).not.toHaveProperty("goalId");
    expect(context).not.toHaveProperty("trainingSessionId");
  });
});

describe("mapGolfSportMetricLogMode", () => {
  it("maps Practice Facility to drill enums", () => {
    expect(mapGolfSportMetricLogMode("PRACTICE_FACILITY")).toEqual({
      metricType: "DRILL_RESULT",
      environment: "PRACTICE_FACILITY",
      source: "ATHLETE_MANUAL",
    });
  });

  it("maps Simulator to drill enums", () => {
    expect(mapGolfSportMetricLogMode("SIMULATOR")).toEqual({
      metricType: "DRILL_RESULT",
      environment: "SIMULATOR",
      source: "SIMULATOR_MANUAL",
    });
  });

  it("maps Actual Round to round enums", () => {
    expect(mapGolfSportMetricLogMode("ACTUAL_ROUND")).toEqual({
      metricType: "ROUND_RESULT",
      environment: "ON_COURSE",
      source: "ATHLETE_MANUAL",
    });
  });
});

describe("validateGolfDrillSportMetricForm", () => {
  it("blocks successes greater than attempts", () => {
    const result = validateGolfDrillSportMetricForm({
      attempts: "10",
      successes: "11",
      distanceBand: "",
      missPattern: "",
      provider: "",
      carryDistance: "",
      ballSpeed: "",
      clubSpeed: "",
      offlineDispersion: "",
      notes: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("cannot exceed");
    }
  });
});
