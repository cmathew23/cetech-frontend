import { releasedSkillsTrainingPlanVersionId } from "@/lib/weeklyAdherenceWeek";
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
