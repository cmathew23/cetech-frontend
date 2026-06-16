import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

import { fetchMyAcademyCoaches } from "@/lib/api/academyMeCoaches";

describe("fetchMyAcademyCoaches", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("parses current coach identity from nested user-shaped rows", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        coaches: [
          {
            user: {
              id: "coach-user-1",
              full_name: "Kendra James",
              email: "kendra@example.com",
            },
            academyCoachRole: "ASSISTANT_COACH",
            functions: ["NUTRITION_COACH"],
            membershipStatus: "ACTIVE",
          },
        ],
      },
    });

    const result = await fetchMyAcademyCoaches();

    expect(result.coaches[0]).toMatchObject({
      coachUserId: "coach-user-1",
      firstName: "Kendra James",
      lastName: "",
      email: "kendra@example.com",
      role: "ASSISTANT_COACH",
      functions: ["NUTRITION_COACH"],
    });
  });
});
