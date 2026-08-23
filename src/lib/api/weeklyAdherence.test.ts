import { describe, expect, it } from "vitest";
import {
  hasNutritionAdherenceDomain,
  parseTrainingLoadComparison,
  parseWeeklyAdherenceSummaryPayload,
  shouldShowWeeklyTrainingLoadCard,
  visibleTrainingLoadDomains,
} from "@/lib/api/weeklyAdherence";

const TRAINING_LOAD_CONTRACT = {
  reportedBaselineHours: 8.5,
  aiPlanned: {
    skillsMinutes: 240,
    skillsHours: 4,
    sandCMinutes: 192,
    sandCHours: 3.2,
    totalMinutes: 432,
    totalHours: 7.2,
  },
  actualCompleted: {
    skillsMinutes: 120,
    skillsHours: 2,
    sandCMinutes: 66,
    sandCHours: 1.1,
    totalMinutes: 186,
    totalHours: 3.1,
  },
  plannedVsBaselineHours: -1.3,
  plannedVsBaselinePercent: -15.3,
  plannedVsBaselineStatus: "LOWER",
  actualVsPlannedHours: -4.1,
  actualVsPlannedPercent: -56.9,
  actualVsPlannedStatus: "LOWER",
  baselineAvailable: true,
  skillsPlanAvailable: true,
  sandCPlanAvailable: true,
  plannedComplete: true,
  completionDataAvailable: true,
  isCurrentWeek: true,
  completedToDate: true,
};

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

  it("parses backend overall summary aliases without frontend recalculation", () => {
    const parsed = parseWeeklyAdherenceSummaryPayload({
      athleteId: "athlete-1",
      weekStart: "2026-06-22",
      weekEnd: "2026-06-28",
      summary: {
        adherencePercent: 25,
        completedItems: 3,
        plannedItems: 12,
      },
      domains: {
        SKILL: { adherencePercent: 100 },
        NUTRITION: { adherencePercent: 0 },
        STRENGTH_CONDITIONING: { adherencePercent: 0 },
      },
      visibleDomains: ["SKILL", "NUTRITION", "STRENGTH_CONDITIONING"],
    });

    expect(parsed.overall).toMatchObject({
      adherencePercent: 25,
      completedItems: 3,
      plannedItems: 12,
    });
  });

  it("parses zero overall adherence only when the backend explicitly returns zero", () => {
    const parsed = parseWeeklyAdherenceSummaryPayload({
      athleteId: "athlete-1",
      weekStart: "2026-06-22",
      weekEnd: "2026-06-28",
      overallSummary: {
        adherencePercent: 0,
        completedItems: 0,
        plannedItems: 9,
      },
      domains: {
        SKILL: { adherencePercent: 0 },
      },
      visibleDomains: ["SKILL"],
    });

    expect(parsed.overall?.adherencePercent).toBe(0);
    expect(parsed.overall?.completedItems).toBe(0);
    expect(parsed.overall?.plannedItems).toBe(9);
  });

  it("does not fabricate overall adherence when the overall percent is missing", () => {
    const parsed = parseWeeklyAdherenceSummaryPayload({
      athleteId: "athlete-1",
      weekStart: "2026-06-22",
      weekEnd: "2026-06-28",
      summary: {
        completedItems: 0,
        plannedItems: 9,
      },
      domains: {
        SKILL: { adherencePercent: 0 },
      },
      visibleDomains: ["SKILL"],
    });

    expect(parsed.overall).toBeNull();
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

  it("parses trainingLoadComparison from the exact backend contract", () => {
    const parsed = parseWeeklyAdherenceSummaryPayload({
      athleteId: "athlete-1",
      weekStart: "2026-08-17",
      weekEnd: "2026-08-23",
      domains: {
        SKILL: { plannedSessions: 2, loggedSessions: 1, adherencePercent: 50 },
      },
      overall: null,
      visibleDomains: ["SKILL", "STRENGTH_CONDITIONING"],
      trainingLoadComparison: TRAINING_LOAD_CONTRACT,
    });

    expect(parsed.trainingLoadComparison).toEqual(TRAINING_LOAD_CONTRACT);
  });

  it("ignores guessed aliases and does not invent classifications", () => {
    const parsed = parseTrainingLoadComparison({
      baselineHoursPerWeek: 9,
      reportedBaselineHoursPerWeek: 9,
      baselineHours: 9,
      plannedHours: 9,
      aiPlannedHours: 9,
      actualHours: 9,
      planVsBaseline: { classification: "HIGHER", differenceHours: 2 },
      actualVsPlan: { classification: "LOWER", differenceHours: -2 },
      domains: { SKILL: { plannedHours: 4, actualHours: 2 } },
      isPartialPlan: true,
      planCompleteness: "PARTIAL",
      hasAdherence: true,
      reportedBaselineHours: 8.5,
      aiPlanned: TRAINING_LOAD_CONTRACT.aiPlanned,
      actualCompleted: TRAINING_LOAD_CONTRACT.actualCompleted,
      plannedVsBaselineStatus: "LOWER",
      plannedVsBaselineHours: -1.3,
      actualVsPlannedStatus: null,
    });

    expect(parsed?.reportedBaselineHours).toBe(8.5);
    expect(parsed?.aiPlanned.totalHours).toBe(7.2);
    expect(parsed?.actualCompleted.totalHours).toBe(3.1);
    expect(parsed?.plannedVsBaselineStatus).toBe("LOWER");
    expect(parsed?.plannedVsBaselineHours).toBe(-1.3);
    expect(parsed?.actualVsPlannedStatus).toBeNull();
    expect(parsed).not.toHaveProperty("baselineHoursPerWeek");
    expect(parsed).not.toHaveProperty("plannedHours");
    expect(parsed).not.toHaveProperty("actualHours");
    expect(parsed).not.toHaveProperty("domains");
    expect(parsed).not.toHaveProperty("planVsBaseline");
    expect(parsed).not.toHaveProperty("isPartialPlan");
    expect(parsed).not.toHaveProperty("hasAdherence");
  });

  it("does not map alias-only payloads onto contract fields", () => {
    const parsed = parseTrainingLoadComparison({
      baselineHoursPerWeek: 8.5,
      plannedHours: 7.2,
      actualHours: 3.1,
      planVsBaseline: { classification: "LOWER", differenceHours: -1.3 },
    });

    expect(parsed?.reportedBaselineHours).toBeNull();
    expect(parsed?.aiPlanned.totalHours).toBe(0);
    expect(parsed?.actualCompleted.totalHours).toBe(0);
    expect(parsed?.plannedVsBaselineStatus).toBeNull();
    expect(parsed?.plannedVsBaselineHours).toBeNull();
  });
});

describe("shouldShowWeeklyTrainingLoadCard", () => {
  const comparison = parseTrainingLoadComparison(TRAINING_LOAD_CONTRACT);

  it("shows the card for athlete and head coach when backend data is present", () => {
    expect(
      shouldShowWeeklyTrainingLoadCard({
        comparison,
        viewerContext: "ATHLETE",
      }),
    ).toBe(true);
    expect(
      shouldShowWeeklyTrainingLoadCard({
        comparison,
        viewerContext: "HEAD_COACH",
      }),
    ).toBe(true);
  });

  it("shows Skills and S&C coaches and hides nutrition", () => {
    expect(
      shouldShowWeeklyTrainingLoadCard({
        comparison,
        viewerContext: "SKILLS",
      }),
    ).toBe(true);
    expect(
      shouldShowWeeklyTrainingLoadCard({
        comparison,
        viewerContext: "S_AND_C",
      }),
    ).toBe(true);
    expect(
      shouldShowWeeklyTrainingLoadCard({
        comparison,
        viewerContext: "NUTRITION",
      }),
    ).toBe(false);
  });

  it("hides the card when the payload is missing", () => {
    expect(
      shouldShowWeeklyTrainingLoadCard({
        comparison: null,
        viewerContext: "ATHLETE",
      }),
    ).toBe(false);
  });

  it("does not expose unauthorized domain rows to a Skills or S&C coach", () => {
    const both = parseTrainingLoadComparison(TRAINING_LOAD_CONTRACT)!;
    expect(visibleTrainingLoadDomains(both, "SKILLS")).toEqual(["SKILL"]);
    expect(visibleTrainingLoadDomains(both, "S_AND_C")).toEqual([
      "STRENGTH_CONDITIONING",
    ]);
    expect(visibleTrainingLoadDomains(both, "ATHLETE")).toEqual([
      "SKILL",
      "STRENGTH_CONDITIONING",
    ]);
    expect(visibleTrainingLoadDomains(both, "HEAD_COACH")).toEqual([
      "SKILL",
      "STRENGTH_CONDITIONING",
    ]);
    expect(
      visibleTrainingLoadDomains(
        parseTrainingLoadComparison({
          ...TRAINING_LOAD_CONTRACT,
          sandCPlanAvailable: false,
        })!,
        "ATHLETE",
      ),
    ).toEqual(["SKILL"]);
  });
});
