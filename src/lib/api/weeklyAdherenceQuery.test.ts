import {
  readWeeklyAdherenceSummaryQueryCache,
  refetchWeeklyAdherenceSummaryQuery,
  refreshWeeklyAdherenceSummaryAfterAdherence,
  resetWeeklyAdherenceSummaryQueryCacheForTests,
  subscribeWeeklyAdherenceSummaryQuery,
} from "@/lib/api/weeklyAdherence";
import type { AthleteWeeklyPlanJournal } from "@/lib/api/coachAthletePlanningReadiness";
import { apiRequest } from "@/lib/apiClient";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/apiClient", () => ({
  apiRequest: vi.fn(),
}));

const mockedApiRequest = vi.mocked(apiRequest);

function journal(): AthleteWeeklyPlanJournal {
  return {
    athleteId: "journal-athlete",
    entityId: "journal-entity",
    weekStartDate: "2026-09-21",
    weekEndDate: "2026-09-27",
    domains: {
      SKILLS: { status: "RELEASED", versionId: "skills-v1", planId: "plan-skills" },
      NUTRITION: { status: "NOT_RELEASED", versionId: null, planId: null },
      S_AND_C: { status: "RELEASED", versionId: "sandc-v1", planId: "plan-sandc" },
    },
    days: [
      {
        date: "2020-01-06",
        dayNumber: 1,
        skills: [],
        nutrition: [],
        sandc: [],
      },
    ],
    raw: {},
  };
}

function sandcSummaryPayload() {
  return {
    athleteId: "journal-athlete",
    weekStart: "2026-09-21",
    weekEnd: "2026-09-27",
    domains: {
      STRENGTH_CONDITIONING: {
        plannedSessions: 1,
        loggedSessions: 1,
        totalPrescribedItems: 6,
        loggedItems: 6,
        completedItems: 6,
        adherencePercent: 100,
        actualDurationMinutes: 55,
        averageSessionLoad: 275,
        context: {
          totalPrescribedItems: 6,
          completedItems: 6,
          actualDurationMinutes: 55,
          averageSessionLoad: 275,
        },
      },
    },
    visibleDomains: ["STRENGTH_CONDITIONING"],
  };
}

describe("weekly adherence dashboard query refresh", () => {
  beforeEach(() => {
    resetWeeklyAdherenceSummaryQueryCacheForTests();
    mockedApiRequest.mockReset();
  });

  it("refetches GET weekly-adherence-summary for the exact query key and replaces cache", async () => {
    mockedApiRequest.mockResolvedValueOnce(sandcSummaryPayload());
    const query = {
      entityId: "journal-entity",
      athleteId: "journal-athlete",
      weekStart: "2026-09-21",
      weekEnd: "2026-09-27",
    };

    const heard: string[] = [];
    const unsubscribe = subscribeWeeklyAdherenceSummaryQuery((record) => {
      heard.push(record.key);
    });

    const summary = await refetchWeeklyAdherenceSummaryQuery(query);
    unsubscribe();

    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/entities/journal-entity/athletes/journal-athlete/weekly-adherence-summary?weekStart=2026-09-21&weekEnd=2026-09-27",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
    expect(summary.domains.STRENGTH_CONDITIONING?.adherencePercent).toBe(100);
    expect(
      summary.domains.STRENGTH_CONDITIONING?.context,
    ).toMatchObject({
      plannedItems: 6,
      completedItems: 6,
      averageSessionLoad: 275,
    });
    expect(readWeeklyAdherenceSummaryQueryCache(query)).toBe(summary);
    expect(heard).toEqual([
      "journal-entity|journal-athlete|2026-09-21|2026-09-27",
    ]);
  });

  it("after adherence uses the same journal-derived entityId, athleteId, weekStart, and weekEnd", async () => {
    mockedApiRequest.mockResolvedValueOnce(sandcSummaryPayload());

    await refreshWeeklyAdherenceSummaryAfterAdherence({
      entityId: "fallback-entity",
      athleteId: "fallback-athlete",
      journal: journal(),
    });

    expect(mockedApiRequest).toHaveBeenCalledTimes(1);
    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/entities/journal-entity/athletes/journal-athlete/weekly-adherence-summary?weekStart=2026-09-21&weekEnd=2026-09-27",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
  });
});
