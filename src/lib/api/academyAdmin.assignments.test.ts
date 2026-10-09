import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

import {
  fetchEntityAssignments,
  patchAthleteCoachAssignment,
} from "@/lib/api/academyAdmin";

const ATHLETE = "athlete-702";
const SKILLS_COACH = "coach-ted";

function apiAssignment(coachId: string, canGeneratePlan: boolean) {
  return {
    id: `assignment-${coachId}`,
    athleteId: ATHLETE,
    coachId,
    athleteName: "Shiv Kapoor",
    athleteEmail: "athlete_702@test.com",
    coachName: coachId,
    coachEmail: `${coachId}@test.com`,
    relationshipType: "STANDARD",
    location: "HQ",
    isPrimary: false,
    createdAt: "2026-08-29T16:37:00Z",
    status: "ACTIVE",
    missingHeadCoachAssignment: false,
    canGeneratePlan,
  };
}

describe("fetchEntityAssignments", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("parses GET data as a JSON array after unwrap", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: [apiAssignment(SKILLS_COACH, false)],
    });
    const rows = await fetchEntityAssignments("entity-1");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.coachProfileId).toBe(SKILLS_COACH);
    expect(rows[0]?.athleteProfileId).toBe(ATHLETE);
    expect(rows[0]?.canGeneratePlan).toBe(false);
  });

  it("rejects a non-array GET data payload", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: { assignments: [apiAssignment(SKILLS_COACH, true)] },
    });
    await expect(fetchEntityAssignments("entity-1")).rejects.toMatchObject({
      code: "ASSIGNMENTS_NOT_ARRAY",
    });
  });
});

describe("patchAthleteCoachAssignment", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("PATCHes canGeneratePlan only; athleteId and coachId stay in the URL", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: apiAssignment(SKILLS_COACH, true),
    });
    await patchAthleteCoachAssignment("entity-1", ATHLETE, SKILLS_COACH, {
      canGeneratePlan: true,
    });
    expect(apiRequestMock).toHaveBeenCalledWith(
      `/entities/entity-1/assignments/athlete-coach/${ATHLETE}/${SKILLS_COACH}`,
      {
        method: "PATCH",
        body: JSON.stringify({ canGeneratePlan: true }),
      },
    );
  });
});
