import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type { EntityAssignmentRow } from "@/types/academyAdmin.types";
import {
  MISSING_HEAD_COACH_MESSAGE,
  academyHasActiveHeadCoach,
  domainCoachLimitMessage,
  formatAssignmentApiError,
  orderCoachesForAssignment,
  resolveAcademyAssignmentCoachRoster,
  validateAssignmentSelection,
  type AcademyAssignmentCoachRosterEntry,
} from "@/lib/academyAssignmentValidation";

const ATHLETE_ID = "athlete-1";
const HEAD_COACH_ID = "coach-head";
const SKILLS_COACH_A = "coach-skills-a";
const SKILLS_COACH_B = "coach-skills-b";
const NUTRITION_COACH_A = "coach-nutrition-a";
const NUTRITION_COACH_B = "coach-nutrition-b";
const S_AND_C_COACH_A = "coach-sandc-a";
const S_AND_C_COACH_B = "coach-sandc-b";

function roster(
  entries: Array<{
    coachProfileId: string;
    role?: AcademyAssignmentCoachRosterEntry["role"];
    functions?: string[];
    membershipStatus?: string;
  }>,
): AcademyAssignmentCoachRosterEntry[] {
  return entries.map((entry) => ({
    coachProfileId: entry.coachProfileId,
    role: entry.role ?? "ASSISTANT_COACH",
    functions: entry.functions ?? [],
    membershipStatus: entry.membershipStatus ?? "ACTIVE",
  }));
}

function activeAssignment(
  coachProfileId: string,
  status = "ACTIVE",
): EntityAssignmentRow {
  return {
    assignmentId: `assignment-${coachProfileId}`,
    athleteProfileId: ATHLETE_ID,
    athleteName: "Athlete One",
    athleteEmail: "athlete@example.com",
    coachProfileId,
    coachName: coachProfileId,
    coachEmail: `${coachProfileId}@example.com`,
    relationshipType: "STANDARD",
    location: "HQ",
    isPrimary: false,
    createdAt: "2026-01-01T00:00:00Z",
    status,
    missingHeadCoachAssignment: false,
    canGeneratePlan: false,
  };
}

const academyWithHeadCoach = roster([
  {
    coachProfileId: HEAD_COACH_ID,
    role: "HEAD_COACH",
  },
  {
    coachProfileId: SKILLS_COACH_A,
    functions: ["SKILLS_COACH"],
  },
  {
    coachProfileId: SKILLS_COACH_B,
    functions: ["SKILLS_COACH"],
  },
  {
    coachProfileId: NUTRITION_COACH_A,
    functions: ["NUTRITION_COACH"],
  },
  {
    coachProfileId: NUTRITION_COACH_B,
    functions: ["NUTRITION_COACH"],
  },
  {
    coachProfileId: S_AND_C_COACH_A,
    functions: ["STRENGTH_AND_CONDITIONING_COACH"],
  },
  {
    coachProfileId: S_AND_C_COACH_B,
    functions: ["STRENGTH_AND_CONDITIONING_COACH"],
  },
]);

describe("academyHasActiveHeadCoach", () => {
  it("returns true when an active Head Coach exists", () => {
    expect(academyHasActiveHeadCoach(academyWithHeadCoach)).toBe(true);
  });

  it("returns false when Head Coach membership is not active", () => {
    expect(
      academyHasActiveHeadCoach(
        roster([
          {
            coachProfileId: HEAD_COACH_ID,
            role: "HEAD_COACH",
            membershipStatus: "REMOVED",
          },
        ]),
      ),
    ).toBe(false);
  });
});

describe("resolveAcademyAssignmentCoachRoster", () => {
  it("links active functions by email when academy rows omit coachProfileId", () => {
    const resolved = resolveAcademyAssignmentCoachRoster(
      [
        {
          email: "skills-a@example.com",
          role: "ASSISTANT_COACH",
          functions: ["SKILLS_COACH"],
          membershipStatus: "ACTIVE",
        },
        {
          email: "skills-b@example.com",
          role: "ASSISTANT_COACH",
          functions: ["SKILLS_COACH"],
          membershipStatus: "ACTIVE",
        },
      ],
      [
        {
          coachProfileId: SKILLS_COACH_A,
          displayEmail: "skills-a@example.com",
        },
        {
          coachProfileId: SKILLS_COACH_B,
          displayEmail: "skills-b@example.com",
        },
      ],
    );

    const result = validateAssignmentSelection({
      athleteProfileId: ATHLETE_ID,
      selectedCoachProfileIds: [SKILLS_COACH_A, SKILLS_COACH_B],
      assignments: [],
      academyCoaches: resolved,
    });

    expect(result).toEqual({
      ok: false,
      useModal: true,
      message: domainCoachLimitMessage("SKILLS"),
    });
  });
});

describe("formatAssignmentApiError", () => {
  it("renders a friendly domain message instead of a raw backend code", () => {
    expect(
      formatAssignmentApiError(
        {
          status: 409,
          code: "ATHLETE_ALREADY_HAS_SKILLS_COACH",
          message: "ATHLETE_ALREADY_HAS_SKILLS_COACH",
        },
        "Could not create assignment.",
      ),
    ).toBe("Only one Skills Coach can be assigned to an athlete.");
  });

  it("does not render an unknown raw backend code", () => {
    expect(
      formatAssignmentApiError(
        { status: 409, message: "SOME_INTERNAL_ASSIGNMENT_CODE" },
        "Could not create assignment.",
      ),
    ).toBe("Could not create assignment.");
  });
});

describe("assignment submit handler integration", () => {
  it("clears success feedback and returns before requests for invalid selections", () => {
    const source = readFileSync(
      new URL(
        "../components/dashboard/admin/AcademyAdminWorkspacePage.tsx",
        import.meta.url,
      ),
      "utf8",
    );
    const invalidStart = source.indexOf("if (!validation.ok)");
    const requestStart = source.indexOf(
      "await createAthleteCoachAssignment",
      invalidStart,
    );
    const invalidBranch = source.slice(invalidStart, requestStart);

    expect(invalidBranch).toContain("setAssignmentError(null)");
    expect(invalidBranch).toContain("setAssignmentSuccess(null)");
    expect(invalidBranch).toContain("setAssignmentValidationModalOpen(true)");
    expect(invalidBranch).toContain("return;");
  });
});

describe("validateAssignmentSelection", () => {
  it("blocks with modal when Head Coach is required but absent", () => {
    const createAssignment = vi.fn();
    const result = validateAssignmentSelection({
      athleteProfileId: ATHLETE_ID,
      selectedCoachProfileIds: [SKILLS_COACH_A],
      assignments: [],
      academyCoaches: academyWithHeadCoach,
    });

    expect(result).toEqual({
      ok: false,
      useModal: true,
      message: MISSING_HEAD_COACH_MESSAGE,
    });
    if (result.ok) {
      for (const coachId of result.coachesToCreate) createAssignment(coachId);
    }
    expect(createAssignment).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: "Skills",
      selected: [SKILLS_COACH_A, SKILLS_COACH_B],
      domain: "SKILLS" as const,
    },
    {
      label: "Nutrition",
      selected: [NUTRITION_COACH_A, NUTRITION_COACH_B],
      domain: "NUTRITION" as const,
    },
    {
      label: "S&C",
      selected: [S_AND_C_COACH_A, S_AND_C_COACH_B],
      domain: "S_AND_C" as const,
    },
  ])(
    "blocks two newly selected $label coaches before any request",
    ({ selected, domain }) => {
      const createAssignment = vi.fn();
      const result = validateAssignmentSelection({
        athleteProfileId: ATHLETE_ID,
        selectedCoachProfileIds: [HEAD_COACH_ID, ...selected],
        assignments: [],
        academyCoaches: academyWithHeadCoach,
      });

      if (result.ok) {
        for (const coachId of result.coachesToCreate) createAssignment(coachId);
      }

      expect(result).toEqual({
        ok: false,
        useModal: true,
        message: domainCoachLimitMessage(domain),
      });
      expect(createAssignment).not.toHaveBeenCalled();
    },
  );

  it.each([
    {
      label: "Skills",
      existing: SKILLS_COACH_A,
      selected: SKILLS_COACH_B,
      domain: "SKILLS" as const,
    },
    {
      label: "Nutrition",
      existing: NUTRITION_COACH_A,
      selected: NUTRITION_COACH_B,
      domain: "NUTRITION" as const,
    },
    {
      label: "S&C",
      existing: S_AND_C_COACH_A,
      selected: S_AND_C_COACH_B,
      domain: "S_AND_C" as const,
    },
  ])(
    "blocks one existing plus one newly selected $label coach before any request",
    ({ existing, selected, domain }) => {
      const createAssignment = vi.fn();
      const result = validateAssignmentSelection({
        athleteProfileId: ATHLETE_ID,
        selectedCoachProfileIds: [HEAD_COACH_ID, selected],
        assignments: [activeAssignment(existing)],
        academyCoaches: academyWithHeadCoach,
      });

      if (result.ok) {
        for (const coachId of result.coachesToCreate) createAssignment(coachId);
      }

      expect(result).toEqual({
        ok: false,
        useModal: true,
        message: domainCoachLimitMessage(domain),
      });
      expect(createAssignment).not.toHaveBeenCalled();
    },
  );

  it("allows additional domain assignment when Head Coach is already assigned", () => {
    const result = validateAssignmentSelection({
      athleteProfileId: ATHLETE_ID,
      selectedCoachProfileIds: [SKILLS_COACH_A],
      assignments: [activeAssignment(HEAD_COACH_ID)],
      academyCoaches: academyWithHeadCoach,
    });

    expect(result).toEqual({
      ok: true,
      coachesToCreate: [SKILLS_COACH_A],
    });
  });

  it("orders Head Coach before other new coaches", () => {
    const result = validateAssignmentSelection({
      athleteProfileId: ATHLETE_ID,
      selectedCoachProfileIds: [SKILLS_COACH_A, HEAD_COACH_ID, NUTRITION_COACH_A],
      assignments: [],
      academyCoaches: academyWithHeadCoach,
    });

    expect(result).toEqual({
      ok: true,
      coachesToCreate: [HEAD_COACH_ID, SKILLS_COACH_A, NUTRITION_COACH_A],
    });
  });

  it("allows valid Head Coach, Skills, Nutrition, and S&C requests to proceed", () => {
    const createAssignment = vi.fn();
    const result = validateAssignmentSelection({
      athleteProfileId: ATHLETE_ID,
      selectedCoachProfileIds: [
        SKILLS_COACH_A,
        NUTRITION_COACH_A,
        S_AND_C_COACH_A,
        HEAD_COACH_ID,
      ],
      assignments: [],
      academyCoaches: academyWithHeadCoach,
    });

    if (result.ok) {
      for (const coachId of result.coachesToCreate) createAssignment(coachId);
    }

    expect(result).toEqual({
      ok: true,
      coachesToCreate: [
        HEAD_COACH_ID,
        SKILLS_COACH_A,
        NUTRITION_COACH_A,
        S_AND_C_COACH_A,
      ],
    });
    expect(createAssignment).toHaveBeenCalledTimes(4);
  });

  it("blocks a second Skills coach with modal copy", () => {
    const result = validateAssignmentSelection({
      athleteProfileId: ATHLETE_ID,
      selectedCoachProfileIds: [HEAD_COACH_ID, SKILLS_COACH_B],
      assignments: [activeAssignment(SKILLS_COACH_A)],
      academyCoaches: academyWithHeadCoach,
    });

    expect(result).toEqual({
      ok: false,
      useModal: true,
      message: domainCoachLimitMessage("SKILLS"),
    });
  });

  it("blocks a second Nutrition coach with modal copy", () => {
    const result = validateAssignmentSelection({
      athleteProfileId: ATHLETE_ID,
      selectedCoachProfileIds: [HEAD_COACH_ID, NUTRITION_COACH_B],
      assignments: [activeAssignment(NUTRITION_COACH_A)],
      academyCoaches: academyWithHeadCoach,
    });

    expect(result).toEqual({
      ok: false,
      useModal: true,
      message: domainCoachLimitMessage("NUTRITION"),
    });
  });

  it("blocks a second S&C coach with modal copy", () => {
    const result = validateAssignmentSelection({
      athleteProfileId: ATHLETE_ID,
      selectedCoachProfileIds: [HEAD_COACH_ID, S_AND_C_COACH_B],
      assignments: [activeAssignment(S_AND_C_COACH_A)],
      academyCoaches: [
        ...academyWithHeadCoach,
        {
          coachProfileId: S_AND_C_COACH_B,
          role: "ASSISTANT_COACH",
          functions: ["STRENGTH_AND_CONDITIONING_COACH"],
          membershipStatus: "ACTIVE",
        },
      ],
    });

    expect(result).toEqual({
      ok: false,
      useModal: true,
      message: domainCoachLimitMessage("S_AND_C"),
    });
  });

  it("allows zero Nutrition and S&C coaches when Head Coach is present", () => {
    const result = validateAssignmentSelection({
      athleteProfileId: ATHLETE_ID,
      selectedCoachProfileIds: [HEAD_COACH_ID, SKILLS_COACH_A],
      assignments: [],
      academyCoaches: academyWithHeadCoach,
    });

    expect(result).toEqual({
      ok: true,
      coachesToCreate: [HEAD_COACH_ID, SKILLS_COACH_A],
    });
  });

  it("ignores non-active assignments when counting domain coaches", () => {
    const result = validateAssignmentSelection({
      athleteProfileId: ATHLETE_ID,
      selectedCoachProfileIds: [HEAD_COACH_ID, SKILLS_COACH_B],
      assignments: [activeAssignment(SKILLS_COACH_A, "REMOVED")],
      academyCoaches: academyWithHeadCoach,
    });

    expect(result).toEqual({
      ok: true,
      coachesToCreate: [HEAD_COACH_ID, SKILLS_COACH_B],
    });
  });

  it("does not resubmit coaches that are already actively assigned", () => {
    const result = validateAssignmentSelection({
      athleteProfileId: ATHLETE_ID,
      selectedCoachProfileIds: [HEAD_COACH_ID, SKILLS_COACH_A],
      assignments: [activeAssignment(HEAD_COACH_ID)],
      academyCoaches: academyWithHeadCoach,
    });

    expect(result).toEqual({
      ok: true,
      coachesToCreate: [SKILLS_COACH_A],
    });
  });

  it("skips Head Coach requirement when the academy has no active Head Coach", () => {
    const result = validateAssignmentSelection({
      athleteProfileId: ATHLETE_ID,
      selectedCoachProfileIds: [SKILLS_COACH_A],
      assignments: [],
      academyCoaches: roster([
        {
          coachProfileId: SKILLS_COACH_A,
          functions: ["SKILLS_COACH"],
        },
      ]),
    });

    expect(result).toEqual({
      ok: true,
      coachesToCreate: [SKILLS_COACH_A],
    });
  });
});

describe("orderCoachesForAssignment", () => {
  it("places Head Coach first", () => {
    const lookup = new Map(
      roster([
        { coachProfileId: HEAD_COACH_ID, role: "HEAD_COACH" },
        { coachProfileId: SKILLS_COACH_A, functions: ["SKILLS_COACH"] },
      ]).map((entry) => [entry.coachProfileId, entry]),
    );

    expect(
      orderCoachesForAssignment(
        [NUTRITION_COACH_A, HEAD_COACH_ID, SKILLS_COACH_A],
        lookup,
      ),
    ).toEqual([HEAD_COACH_ID, NUTRITION_COACH_A, SKILLS_COACH_A]);
  });
});
