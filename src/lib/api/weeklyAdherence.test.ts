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
});
