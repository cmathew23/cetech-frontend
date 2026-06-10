import { describe, expect, it } from "vitest";
import {
  hasNutritionAdherenceDomain,
  parseWeeklyAdherenceSummaryPayload,
} from "@/lib/api/weeklyAdherence";

describe("parseWeeklyAdherenceSummaryPayload", () => {
  it("unwraps { message, data } envelope", () => {
    const parsed = parseWeeklyAdherenceSummaryPayload({
      message: "OK",
      data: {
        athleteId: "athlete-1",
        weekStart: "2026-05-12",
        weekEnd: "2026-05-18",
        domains: {
          NUTRITION: {
            plannedSessions: 7,
            loggedSessions: 5,
            adherencePercent: 53.9,
          },
        },
        overall: null,
        visibleDomains: ["NUTRITION"],
      },
    });

    expect(parsed.domains.NUTRITION?.adherencePercent).toBe(53.9);
    expect(hasNutritionAdherenceDomain(parsed)).toBe(true);
  });

  it("unwraps { success: true, data } envelope", () => {
    const parsed = parseWeeklyAdherenceSummaryPayload({
      success: true,
      message: "OK",
      data: {
        athleteId: "athlete-1",
        weekStart: "2026-05-12",
        weekEnd: "2026-05-18",
        domains: {
          NUTRITION: {
            plannedSessions: 2,
            loggedSessions: 1,
            adherencePercent: "80",
          },
        },
        overall: null,
        visibleDomains: [],
      },
    });

    expect(parsed.domains.NUTRITION?.adherencePercent).toBe(80);
  });

  it("parses item-based session context fields with legacy session aliases", () => {
    const parsed = parseWeeklyAdherenceSummaryPayload({
      athleteId: "athlete-1",
      weekStart: "2026-05-12",
      weekEnd: "2026-05-18",
      domains: {
        SKILL: {
          plannedSessions: 10,
          loggedSessions: 8,
          adherencePercent: 75,
          context: {
            completedSessions: 7,
            partialSessions: 2,
            missedSessions: 1,
            plannedDurationMinutes: 90,
            actualDurationMinutes: 85,
            completionCredit: 8,
          },
        },
      },
      overall: null,
      visibleDomains: ["SKILL"],
    });

    const ctx = parsed.domains.SKILL?.context;
    expect(ctx).toMatchObject({
      completedItems: 7,
      partialItems: 2,
      missedItems: 1,
      plannedItems: 10,
      completionCredit: 8,
      plannedDurationMinutes: 90,
      actualDurationMinutes: 85,
    });
    expect(parsed.domains.SKILL?.plannedSessions).toBe(10);
  });

  it("parses session item fields from domain row instead of plannedSessions", () => {
    const parsed = parseWeeklyAdherenceSummaryPayload({
      athleteId: "801",
      weekStart: "2026-05-12",
      weekEnd: "2026-05-18",
      domains: {
        SKILL: {
          plannedSessions: 2,
          loggedSessions: 2,
          adherencePercent: 50,
          totalPrescribedItems: 6,
          completedItems: 3,
          partialItems: 0,
          completionCredit: 3,
          plannedDurationMinutes: 120,
          actualDurationMinutes: 95,
        },
        STRENGTH_CONDITIONING: {
          plannedSessions: 2,
          loggedSessions: 2,
          adherencePercent: 50,
          totalPrescribedItems: 8,
          completedItems: 4,
          partialItems: 0,
          completionCredit: 4,
          plannedDurationMinutes: 180,
          actualDurationMinutes: 210,
        },
      },
      overall: null,
      visibleDomains: ["SKILL", "STRENGTH_CONDITIONING"],
    });

    expect(parsed.domains.SKILL?.plannedSessions).toBe(2);
    expect(parsed.domains.SKILL?.context).toMatchObject({
      plannedItems: 6,
      completedItems: 3,
      completionCredit: 3,
    });
    expect(parsed.domains.STRENGTH_CONDITIONING?.plannedSessions).toBe(2);
    expect(parsed.domains.STRENGTH_CONDITIONING?.context).toMatchObject({
      plannedItems: 8,
      completedItems: 4,
      completionCredit: 4,
    });
  });

  it("parses nutrition completionCredit alongside meal item counts", () => {
    const parsed = parseWeeklyAdherenceSummaryPayload({
      athleteId: "athlete-1",
      weekStart: "2026-05-12",
      weekEnd: "2026-05-18",
      domains: {
        NUTRITION: {
          plannedSessions: 14,
          loggedSessions: 12,
          adherencePercent: 64.3,
          context: {
            plannedCaloriesKcal: 2800,
            actualCaloriesKcal: 2600,
            fullItems: 8,
            halfItems: 2,
            notEatenItems: 4,
            totalItems: 14,
            completionCredit: 9,
          },
        },
      },
      overall: null,
      visibleDomains: ["NUTRITION"],
    });

    const ctx = parsed.domains.NUTRITION?.context;
    expect(ctx).toMatchObject({
      fullItems: 8,
      halfItems: 2,
      notEatenItems: 4,
      totalItems: 14,
      completionCredit: 9,
    });
  });

  it("parses nutrition aliases: totalPrescribedItems, plannedCalories, string completionCredit", () => {
    const parsed = parseWeeklyAdherenceSummaryPayload({
      athleteId: "801",
      weekStart: "2026-05-12",
      weekEnd: "2026-05-18",
      domains: {
        NUTRITION: {
          adherencePercent: "41.9",
          plannedCalories: 12400,
          actualCalories: 1557,
          context: {
            totalPrescribedItems: 31,
            fullItems: 11,
            halfItems: 4,
            notEatenItems: 0,
            completionCredit: "13",
          },
        },
      },
      overall: null,
      visibleDomains: ["NUTRITION"],
    });

    const ctx = parsed.domains.NUTRITION?.context;
    expect(parsed.domains.NUTRITION?.adherencePercent).toBe(41.9);
    expect(ctx).toMatchObject({
      totalItems: 31,
      fullItems: 11,
      halfItems: 4,
      completionCredit: 13,
      plannedCaloriesKcal: 12_400,
      actualCaloriesKcal: 1557,
    });
  });

  it("merges domain-level nutrition fields when context is partial", () => {
    const parsed = parseWeeklyAdherenceSummaryPayload({
      athleteId: "801",
      weekStart: "2026-05-12",
      weekEnd: "2026-05-18",
      domains: {
        NUTRITION: {
          adherencePercent: 41.9,
          plannedCalories: 9800,
          context: {
            fullItems: 11,
            halfItems: 4,
            totalPrescribedItems: 31,
            completionCredit: 13,
            actualCaloriesKcal: 1557,
          },
        },
      },
      overall: null,
      visibleDomains: ["NUTRITION"],
    });

    expect(parsed.domains.NUTRITION?.context).toMatchObject({
      plannedCaloriesKcal: 9800,
      actualCaloriesKcal: 1557,
      completionCredit: 13,
      totalItems: 31,
    });
  });
});
