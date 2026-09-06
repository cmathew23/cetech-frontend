import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/apiClient")>();
  return {
    ...actual,
    apiRequest: apiRequestMock,
  };
});

import {
  buildPlanningProfileDefaults,
  createPlanningProfileMe,
  patchPlanningProfileMe,
  type PlanningProfileFormState,
} from "@/lib/api/planning-profile";

function completedDraft(): PlanningProfileFormState {
  const draft = buildPlanningProfileDefaults({ primarySport: "Football" });
  draft.athleteContext = {
    dateOfBirth: "2000-01-02",
    sex: "MALE",
    heightCm: "180",
    weightKg: "75",
  };
  draft.sportContext.selfReportedLevel = "ADVANCED";
  draft.sportPerformance = {
    highestCompetitionLevelReachedPast12Months: "NATIONAL",
    highestRankingAchievedAtThatLevelPast12Months: "3",
  };
  draft.trainingExposure = {
    trainingAgeYears: "5",
    currentWeeklyTrainingExposureHours: "12",
    weeklyAvailabilityDays: "6",
    weeklyAvailabilityHours: "18",
  };
  draft.healthStatus = { injuryStatus: "HEALTHY" };
  draft.nutritionContext = {
    dietType: "OMNIVORE",
    regionalCuisinePreference: ["INDIAN"],
    allergiesIntolerances: {
      selected: ["Milk"],
      othersText: "",
      noFoodAllergies: false,
    },
  };
  return draft;
}

const createdPayload = {
  success: true,
  data: {
    athleteContext: {
      dateOfBirth: "2000-01-02T00:00:00.000Z",
      sex: "MALE",
      heightCm: 180,
      weightKg: 75,
    },
  },
};

describe("APP create vs update apiRequest timeout", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue(createdPayload);
  });

  it("uses a 30s timeout on create POST only", async () => {
    await createPlanningProfileMe("entity-1", completedDraft());

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athlete-planning-profile/me",
      expect.objectContaining({
        method: "POST",
        timeoutMs: 30_000,
      }),
    );
  });

  it("does not pass an endpoint timeout on PATCH (global default)", async () => {
    const baseline = completedDraft();
    const draft = structuredClone(baseline);
    draft.sportContext.disciplineOrEvent = "200m";

    await patchPlanningProfileMe("entity-1", baseline, draft);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const options = apiRequestMock.mock.calls[0]?.[1] as Record<
      string,
      unknown
    >;
    expect(options.method).toBe("PATCH");
    expect(options).not.toHaveProperty("timeoutMs");
  });
});
