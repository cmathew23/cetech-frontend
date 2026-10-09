import type { AthleteWeeklyPlanJournal } from "@/lib/api/coachAthletePlanningReadiness";
import {
  releasedSkillsTrainingPlanVersionId,
  resolveWeeklyAdherenceSummaryQueryFromJournal,
  weeklyAdherenceSummaryQueryKey,
} from "@/lib/weeklyAdherenceWeek";
import { describe, expect, it } from "vitest";

function journalDomains(status: "RELEASED" | "NOT_RELEASED", versionId: string | null) {
  return {
    domains: {
      SKILLS: { status, versionId, planId: "plan-skills" },
      NUTRITION: { status: "NOT_RELEASED" as const, versionId: null, planId: null },
      S_AND_C: { status: "NOT_RELEASED" as const, versionId: null, planId: null },
    },
  };
}

describe("releasedSkillsTrainingPlanVersionId", () => {
  it("returns the Skills versionId when status is RELEASED and versionId is non-empty", () => {
    expect(
      releasedSkillsTrainingPlanVersionId(
        journalDomains("RELEASED", " skills-released-version "),
      ),
    ).toBe("skills-released-version");
  });

  it("returns empty when Skills is NOT_RELEASED even if a versionId is present", () => {
    expect(
      releasedSkillsTrainingPlanVersionId(
        journalDomains("NOT_RELEASED", "should-not-be-used"),
      ),
    ).toBe("");
  });

  it("returns empty when Skills is RELEASED but versionId is missing", () => {
    expect(
      releasedSkillsTrainingPlanVersionId(journalDomains("RELEASED", null)),
    ).toBe("");
  });
});

function releasedJournal(
  overrides: Partial<AthleteWeeklyPlanJournal> = {},
): AthleteWeeklyPlanJournal {
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
    ...overrides,
  };
}

describe("resolveWeeklyAdherenceSummaryQueryFromJournal", () => {
  it("uses journal entityId, athleteId, weekStart, and weekEnd for the dashboard GET", () => {
    expect(
      resolveWeeklyAdherenceSummaryQueryFromJournal(releasedJournal(), {
        entityId: "fallback-entity",
        athleteId: "fallback-athlete",
      }),
    ).toEqual({
      entityId: "journal-entity",
      athleteId: "journal-athlete",
      weekStart: "2026-09-21",
      weekEnd: "2026-09-27",
    });
  });

  it("falls back to caller identifiers when journal ids are blank", () => {
    expect(
      resolveWeeklyAdherenceSummaryQueryFromJournal(
        releasedJournal({ entityId: "  ", athleteId: "" }),
        { entityId: "fallback-entity", athleteId: "fallback-athlete" },
      ),
    ).toEqual({
      entityId: "fallback-entity",
      athleteId: "fallback-athlete",
      weekStart: "2026-09-21",
      weekEnd: "2026-09-27",
    });
  });

  it("builds a stable query key from the same four params", () => {
    const query = resolveWeeklyAdherenceSummaryQueryFromJournal(
      releasedJournal(),
      { entityId: "fallback-entity", athleteId: "fallback-athlete" },
    );
    expect(query).not.toBeNull();
    expect(weeklyAdherenceSummaryQueryKey(query!)).toBe(
      "journal-entity|journal-athlete|2026-09-21|2026-09-27",
    );
  });
});
