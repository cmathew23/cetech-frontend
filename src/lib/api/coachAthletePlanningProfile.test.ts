import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

import { fetchCoachAthletePlanningProfile } from "@/lib/api/coachAthletePlanningProfile";

describe("fetchCoachAthletePlanningProfile", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("uses the extended timeout for training plan page loads", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        athleteContext: { dateOfBirth: "2008-01-01" },
        sportContext: { primarySport: "TENNIS" },
      },
    });

    await fetchCoachAthletePlanningProfile("entity-1", "athlete-1");

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/planning-profile",
      {
        method: "GET",
        cache: "no-store",
        timeoutMs: 240_000,
      },
    );
  });
});
