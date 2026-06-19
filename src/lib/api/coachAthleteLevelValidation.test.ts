import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

import { paths } from "@/config/endpoints";
import {
  fetchCoachAthleteLevelValidation,
  postCoachAthleteLevelValidation,
} from "@/lib/api/coachAthleteLevelValidation";

describe("coachAthleteLevelValidation API", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("uses the extended timeout for level validation reads", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        validatedLevel: "INTERMEDIATE",
      },
    });

    await fetchCoachAthleteLevelValidation("entity-1", "athlete-1");

    expect(apiRequestMock).toHaveBeenCalledWith(
      paths.entities.athleteTrainingPlanLevelValidation("entity-1", "athlete-1"),
      {
        method: "GET",
        cache: "no-store",
        timeoutMs: 60_000,
      },
    );
  });

  it("uses the extended timeout for level validation writes", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {},
    });

    await postCoachAthleteLevelValidation("entity-1", "athlete-1", {
      validatedLevel: "ADVANCED",
    });

    expect(apiRequestMock).toHaveBeenCalledWith(
      paths.entities.athleteTrainingPlanLevelValidation("entity-1", "athlete-1"),
      {
        method: "POST",
        timeoutMs: 60_000,
        body: JSON.stringify({ validatedLevel: "ADVANCED" }),
      },
    );
  });
});
