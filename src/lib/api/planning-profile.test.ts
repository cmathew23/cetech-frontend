import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildPlanningProfileCreateBody,
  buildPlanningProfileDefaults,
  buildPlanningProfileFormState,
  buildPlanningProfilePatchBody,
  collectPlanningProfileValidationErrors,
  parsePlanningProfileRecord,
  type PlanningProfileFormState,
} from "@/lib/api/planning-profile";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-29T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

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
    regionalCuisinePreference: ["South Indian"],
    allergiesIntolerances: {
      selected: ["Milk"],
      othersText: "",
      noFoodAllergies: false,
    },
  };
  return draft;
}

const mandatoryFields = [
  ["athleteContext", "dateOfBirth"],
  ["athleteContext", "sex"],
  ["athleteContext", "heightCm"],
  ["athleteContext", "weightKg"],
  ["sportContext", "selfReportedLevel"],
  ["sportPerformance", "highestCompetitionLevelReachedPast12Months"],
  ["sportPerformance", "highestRankingAchievedAtThatLevelPast12Months"],
  ["trainingExposure", "trainingAgeYears"],
  ["trainingExposure", "currentWeeklyTrainingExposureHours"],
  ["trainingExposure", "weeklyAvailabilityDays"],
  ["trainingExposure", "weeklyAvailabilityHours"],
  ["healthStatus", "injuryStatus"],
  ["nutritionContext", "dietType"],
  ["nutritionContext", "regionalCuisinePreference"],
  ["nutritionContext", "allergiesIntolerances"],
] as const;

const advancedFieldCases = [
  ["bloodReportParameters", "hemoglobin", 3, 25],
  ["bloodReportParameters", "vitaminD", 1, 250],
  ["bloodReportParameters", "vitaminB12", 50, 5000],
  ["bloodReportParameters", "ferritin", 1, 3000],
  ["bloodReportParameters", "crp", 0, 500],
  ["bloodReportParameters", "fastingBloodGlucoseFBS", 30, 600],
  ["bloodReportParameters", "postprandialBloodGlucosePPBS", 30, 800],
  ["bodyCompositionParameters", "bodyFatPercent", 1, 70],
  ["bodyCompositionParameters", "skeletalLeanMassKg", 1, 200],
  ["bodyCompositionParameters", "skeletalFatMassKg", 0.5, 200],
  ["bodyCompositionParameters", "visceralFatLevel", 1, 30],
  ["bodyCompositionParameters", "visceralFatArea", 1, 500],
  ["bodyCompositionParameters", "bmrKcalDay", 500, 5000],
  ["bodyCompositionParameters", "muscleMassKg", 1, 200],
] as const;

function advancedDraft(): PlanningProfileFormState {
  const draft = completedDraft();
  draft.athleteContext.heightCm = "200";
  draft.athleteContext.weightKg = "200";
  draft.bloodReportParameters = {};
  draft.bodyCompositionParameters = {};
  return draft;
}

describe("APP mandatory field validation", () => {
  it.each(mandatoryFields)(
    "blocks full create when %s.%s is unanswered",
    (group, field) => {
      const draft = completedDraft();
      if (field === "regionalCuisinePreference") {
        draft[group][field] = [];
      } else if (field === "allergiesIntolerances") {
        draft[group][field] = {
          selected: [],
          othersText: "",
          noFoodAllergies: false,
        };
      } else {
        draft[group][field] = "   ";
      }

      const errors = collectPlanningProfileValidationErrors(draft);

      expect(errors[`${group}.${field}`]).toBeTruthy();
      expect(() => buildPlanningProfileCreateBody(draft)).toThrow();
    },
  );

  it("applies the required numeric lower and upper limits", () => {
    const validEdges = completedDraft();
    validEdges.trainingExposure = {
      trainingAgeYears: "1",
      currentWeeklyTrainingExposureHours: "40",
      weeklyAvailabilityDays: "7",
      weeklyAvailabilityHours: "1",
    };
    expect(collectPlanningProfileValidationErrors(validEdges)).toEqual({});

    const cases = [
      ["trainingAgeYears", "0"],
      ["currentWeeklyTrainingExposureHours", "0"],
      ["currentWeeklyTrainingExposureHours", "41"],
      ["weeklyAvailabilityDays", "0"],
      ["weeklyAvailabilityDays", "8"],
      ["weeklyAvailabilityDays", "1.5"],
      ["weeklyAvailabilityHours", "0"],
      ["weeklyAvailabilityHours", "41"],
    ] as const;

    for (const [field, value] of cases) {
      const draft = completedDraft();
      draft.trainingExposure[field] = value;
      expect(
        collectPlanningProfileValidationErrors(draft)[
          `trainingExposure.${field}`
        ],
      ).toBeTruthy();
    }
  });

  it("accepts an explicit no-food-allergies declaration", () => {
    const draft = completedDraft();
    draft.nutritionContext.allergiesIntolerances = {
      selected: [],
      othersText: "",
      noFoodAllergies: true,
    };

    expect(collectPlanningProfileValidationErrors(draft)).toEqual({});
    expect(
      buildPlanningProfileCreateBody(draft).nutritionContext,
    ).toMatchObject({
      allergiesIntolerances: {
        selected: [],
        othersText: null,
        noFoodAllergies: true,
      },
    });
  });

  it("rejects an empty allergy state", () => {
    const draft = completedDraft();
    draft.nutritionContext.allergiesIntolerances = {
      selected: [],
      othersText: "",
      noFoodAllergies: false,
    };

    expect(
      collectPlanningProfileValidationErrors(draft)[
        "nutritionContext.allergiesIntolerances"
      ],
    ).toContain("Select at least one allergy");
  });

  it("submits a valid completed APP using the existing grouped contract", () => {
    expect(buildPlanningProfileCreateBody(completedDraft())).toMatchObject({
      athleteContext: {
        dateOfBirth: "2000-01-02T00:00:00.000Z",
        sex: "MALE",
        heightCm: 180,
        weightKg: 75,
      },
      sportContext: {
        primarySport: "Football",
        selfReportedLevel: "ADVANCED",
      },
      sportPerformance: {
        highestCompetitionLevelReachedPast12Months: "NATIONAL",
        highestRankingAchievedAtThatLevelPast12Months: 3,
      },
      trainingExposure: {
        yearsOfTraining: 5,
        weeklyTrainingHours: 12,
        weeklyAvailabilityDays: 6,
        weeklyAvailabilityHours: 18,
      },
      healthStatus: { injuryStatus: "HEALTHY" },
      nutritionContext: {
        dietType: "OMNIVORE",
        regionalCuisinePreference: ["South Indian"],
        allergiesIntolerances: {
          selected: ["Milk"],
          othersText: null,
          noFoodAllergies: false,
        },
      },
    });
  });

  it("does not include BMI in create or PATCH payloads", () => {
    const baseline = completedDraft();
    const createBody = buildPlanningProfileCreateBody(baseline);
    const draft = structuredClone(baseline);
    draft.athleteContext.heightCm = "190";
    const patchBody = buildPlanningProfilePatchBody(baseline, draft);

    expect(createBody).not.toHaveProperty("derivedPlanningInputs");
    expect(createBody.athleteContext).not.toHaveProperty("derivedBmi");
    expect(patchBody).toEqual({
      athleteContext: { heightCm: 190 },
    });
    expect(patchBody.athleteContext).not.toHaveProperty("derivedBmi");
  });
});

describe("APP anthropometric validation", () => {
  it.each([
    ["2021-07-29", "exactly age 5"],
    ["1946-07-29", "exactly age 80"],
  ])("accepts %s (%s)", (dateOfBirth) => {
    const draft = completedDraft();
    draft.athleteContext.dateOfBirth = dateOfBirth;

    expect(
      collectPlanningProfileValidationErrors(draft)[
        "athleteContext.dateOfBirth"
      ],
    ).toBeUndefined();
  });

  it.each([
    ["2021-07-30", "younger than 5"],
    ["1945-07-29", "older than 80"],
  ])("rejects %s (%s)", (dateOfBirth) => {
    const draft = completedDraft();
    draft.athleteContext.dateOfBirth = dateOfBirth;

    expect(
      collectPlanningProfileValidationErrors(draft)[
        "athleteContext.dateOfBirth"
      ],
    ).toBe("Athlete age must be between 5 and 80 years");
  });

  it("rejects a future DOB", () => {
    const draft = completedDraft();
    draft.athleteContext.dateOfBirth = "2027-07-29";

    expect(
      collectPlanningProfileValidationErrors(draft)[
        "athleteContext.dateOfBirth"
      ],
    ).toBe("Date of Birth must be a valid past date.");
  });

  it.each(["100", "220"])("accepts height %s cm", (heightCm) => {
    const draft = completedDraft();
    draft.athleteContext.heightCm = heightCm;
    draft.athleteContext.weightKg = heightCm === "100" ? "60" : "50";

    expect(
      collectPlanningProfileValidationErrors(draft)["athleteContext.heightCm"],
    ).toBeUndefined();
  });

  it.each(["99", "221", "abc", "Infinity"])(
    "rejects invalid height %s",
    (heightCm) => {
      const draft = completedDraft();
      draft.athleteContext.heightCm = heightCm;

      expect(
        collectPlanningProfileValidationErrors(draft)[
          "athleteContext.heightCm"
        ],
      ).toBe("Height must be between 100 and 220 cm");
    },
  );

  it.each(["15", "200"])("accepts weight %s kg", (weightKg) => {
    const draft = completedDraft();
    draft.athleteContext.heightCm = weightKg === "15" ? "120" : "200";
    draft.athleteContext.weightKg = weightKg;

    expect(
      collectPlanningProfileValidationErrors(draft)["athleteContext.weightKg"],
    ).toBeUndefined();
  });

  it.each(["14.9", "201", "abc", "Infinity"])(
    "rejects invalid weight %s",
    (weightKg) => {
      const draft = completedDraft();
      draft.athleteContext.weightKg = weightKg;

      expect(
        collectPlanningProfileValidationErrors(draft)[
          "athleteContext.weightKg"
        ],
      ).toBe("Weight must be between 15 and 200 kg");
    },
  );

  it.each([
    ["200", "40", 10],
    ["100", "60", 60],
  ])("accepts BMI boundary %s", (heightCm, weightKg, expectedBmi) => {
    const draft = completedDraft();
    draft.athleteContext.heightCm = heightCm;
    draft.athleteContext.weightKg = weightKg;

    const bmi = Number(weightKg) / ((Number(heightCm) / 100) ** 2);
    expect(bmi).toBeCloseTo(expectedBmi, 10);
    expect(
      collectPlanningProfileValidationErrors(draft)["athleteContext.weightKg"],
    ).toBeUndefined();
  });

  it.each([
    ["220", "48", "below 10"],
    ["100", "61", "above 60"],
  ])("rejects BMI %s", (heightCm, weightKg) => {
    const draft = completedDraft();
    draft.athleteContext.heightCm = heightCm;
    draft.athleteContext.weightKg = weightKg;

    expect(
      collectPlanningProfileValidationErrors(draft)["athleteContext.weightKg"],
    ).toBe(
      "Height and weight produce a BMI outside the allowed range of 10 to 60",
    );
  });

  it("does not add a BMI error when height already has a scalar error", () => {
    const draft = completedDraft();
    draft.athleteContext.heightCm = "99";
    draft.athleteContext.weightKg = "200";

    const errors = collectPlanningProfileValidationErrors(draft);
    expect(errors["athleteContext.heightCm"]).toBe(
      "Height must be between 100 and 220 cm",
    );
    expect(errors["athleteContext.weightKg"]).toBeUndefined();
  });

  it("shows only the weight scalar error when weight is invalid", () => {
    const draft = completedDraft();
    draft.athleteContext.heightCm = "220";
    draft.athleteContext.weightKg = "201";

    expect(
      collectPlanningProfileValidationErrors(draft)["athleteContext.weightKg"],
    ).toBe("Weight must be between 15 and 200 kg");
  });

  it("recalculates BMI for a height-only edit using existing weight", () => {
    const baseline = completedDraft();
    const draft = structuredClone(baseline);
    draft.athleteContext.heightCm = "100";

    expect(
      collectPlanningProfileValidationErrors(draft, { baseline })[
        "athleteContext.weightKg"
      ],
    ).toBe(
      "Height and weight produce a BMI outside the allowed range of 10 to 60",
    );
  });

  it("recalculates BMI for a weight-only edit using existing height", () => {
    const baseline = completedDraft();
    const draft = structuredClone(baseline);
    draft.athleteContext.weightKg = "200";

    expect(
      collectPlanningProfileValidationErrors(draft, { baseline })[
        "athleteContext.weightKg"
      ],
    ).toBe(
      "Height and weight produce a BMI outside the allowed range of 10 to 60",
    );
  });

  it("validates age for a DOB-only edit", () => {
    const baseline = completedDraft();
    const draft = structuredClone(baseline);
    draft.athleteContext.dateOfBirth = "2021-07-30";

    expect(
      collectPlanningProfileValidationErrors(draft, { baseline })[
        "athleteContext.dateOfBirth"
      ],
    ).toBe("Athlete age must be between 5 and 80 years");
  });
});

describe("APP optional advanced field validation", () => {
  it("allows all advanced fields to remain blank", () => {
    const draft = advancedDraft();
    for (const [group, field] of advancedFieldCases) {
      draft[group][field] = "";
    }

    expect(collectPlanningProfileValidationErrors(draft)).toEqual({});
    const body = buildPlanningProfileCreateBody(draft);
    expect(body).not.toHaveProperty("bloodReportParameters");
    expect(body).not.toHaveProperty("bodyCompositionParameters");
  });

  it.each(advancedFieldCases)(
    "accepts inclusive bounds for %s.%s",
    (group, field, min, max) => {
      for (const value of [min, max]) {
        const draft = advancedDraft();
        draft[group][field] = String(value);
        expect(
          collectPlanningProfileValidationErrors(draft)[`${group}.${field}`],
        ).toBeUndefined();
      }
    },
  );

  it.each(advancedFieldCases)(
    "rejects out-of-range values for %s.%s",
    (group, field, min, max) => {
      for (const value of [min - 0.1, max + 0.1]) {
        const draft = advancedDraft();
        draft[group][field] = String(value);
        expect(
          collectPlanningProfileValidationErrors(draft)[`${group}.${field}`],
        ).toBeTruthy();
      }
    },
  );

  it.each(advancedFieldCases)(
    "rejects non-numeric values for %s.%s",
    (group, field) => {
      for (const value of ["not-a-number", "Infinity"]) {
        const draft = advancedDraft();
        draft[group][field] = value;
        expect(
          collectPlanningProfileValidationErrors(draft)[`${group}.${field}`],
        ).toBeTruthy();
      }
    },
  );

  it("rejects a decimal Visceral Fat Level", () => {
    const draft = advancedDraft();
    draft.bodyCompositionParameters.visceralFatLevel = "4.5";

    expect(
      collectPlanningProfileValidationErrors(draft)[
        "bodyCompositionParameters.visceralFatLevel"
      ],
    ).toBe("Visceral Fat Level must be a whole number between 1 and 30");
  });

  it.each([
    [
      "skeletalFatMassKg",
      "Body Fat Mass must not exceed athlete weight",
    ],
    [
      "skeletalLeanMassKg",
      "Skeletal Muscle Mass must not exceed athlete weight",
    ],
    ["muscleMassKg", "Muscle Mass must not exceed athlete weight"],
  ] as const)(
    "rejects %s above athlete weight",
    (field, expectedMessage) => {
      const draft = completedDraft();
      draft.bodyCompositionParameters[field] = "76";

      expect(
        collectPlanningProfileValidationErrors(draft)[
          `bodyCompositionParameters.${field}`
        ],
      ).toBe(expectedMessage);
    },
  );

  it("rejects Skeletal Muscle Mass above Muscle Mass", () => {
    const draft = completedDraft();
    draft.athleteContext.weightKg = "100";
    draft.bodyCompositionParameters.skeletalLeanMassKg = "80";
    draft.bodyCompositionParameters.muscleMassKg = "70";

    expect(
      collectPlanningProfileValidationErrors(draft)[
        "bodyCompositionParameters.skeletalLeanMassKg"
      ],
    ).toBe("Skeletal Muscle Mass must not exceed Muscle Mass");
  });

  it("uses persisted weight and body composition for edit relationships", () => {
    const baseline = completedDraft();
    baseline.bodyCompositionParameters.skeletalLeanMassKg = "60";
    baseline.bodyCompositionParameters.muscleMassKg = "70";
    const draft = structuredClone(baseline);
    draft.bodyCompositionParameters.muscleMassKg = "50";

    expect(
      collectPlanningProfileValidationErrors(draft, { baseline })[
        "bodyCompositionParameters.skeletalLeanMassKg"
      ],
    ).toBe("Skeletal Muscle Mass must not exceed Muscle Mass");
  });

  it("keeps existing API field names in the create payload", () => {
    const draft = advancedDraft();
    draft.bloodReportParameters = {
      hemoglobin: "14",
      vitaminD: "40",
      vitaminB12: "500",
      ferritin: "100",
      crp: "2",
      fastingBloodGlucoseFBS: "90",
      postprandialBloodGlucosePPBS: "130",
    };
    draft.bodyCompositionParameters = {
      bodyFatPercent: "20",
      skeletalLeanMassKg: "40",
      skeletalFatMassKg: "20",
      visceralFatLevel: "5",
      visceralFatArea: "80",
      bmrKcalDay: "1800",
      muscleMassKg: "50",
    };

    const body = buildPlanningProfileCreateBody(draft);

    expect(body.bloodReportParameters).toEqual({
      hemoglobinGdl: 14,
      vitaminDNgMl: 40,
      vitaminB12PgMl: 500,
      ferritinNgMl: 100,
      crpMgL: 2,
      fastingBloodGlucoseFBS: 90,
      postprandialBloodGlucosePPBS: 130,
    });
    expect(body.bodyCompositionParameters).toEqual({
      bodyFatPercent: 20,
      skeletalLeanMassKg: 40,
      skeletalFatMassKg: 20,
      visceralFatLevel: 5,
      visceralFatArea: 80,
      bmrKcalDay: 1800,
      muscleMassKg: 50,
    });
  });

  it("omits unchanged advanced values from an unrelated PATCH", () => {
    const baseline = advancedDraft();
    baseline.bloodReportParameters.hemoglobin = "14";
    baseline.bodyCompositionParameters.bodyFatPercent = "20";
    baseline.sportContext.disciplineOrEvent = "100m";
    const draft = structuredClone(baseline);
    draft.sportContext.disciplineOrEvent = "200m";

    expect(
      collectPlanningProfileValidationErrors(draft, { baseline }),
    ).toEqual({});
    expect(buildPlanningProfilePatchBody(baseline, draft)).toEqual({
      sportContext: { disciplineOrEvent: "200m" },
    });
  });

  it("normalizes a cleared advanced PATCH value to null", () => {
    const baseline = advancedDraft();
    baseline.bodyCompositionParameters.bodyFatPercent = "20";
    const draft = structuredClone(baseline);
    draft.bodyCompositionParameters.bodyFatPercent = "";

    expect(
      collectPlanningProfileValidationErrors(draft, { baseline }),
    ).toEqual({});
    expect(buildPlanningProfilePatchBody(baseline, draft)).toEqual({
      bodyCompositionParameters: { bodyFatPercent: null },
    });
  });
});

describe("APP existing and legacy profile editing", () => {
  it("populates existing grouped values, including allergies", () => {
    const record = parsePlanningProfileRecord({
      athleteContext: {
        dateOfBirth: "2000-01-02T00:00:00.000Z",
        sex: "FEMALE",
        heightCm: 165,
        weightKg: 60,
      },
      sportContext: { selfReportedLevel: "ELITE" },
      nutritionContext: {
        regionalCuisinePreference: ["Mediterranean"],
        allergiesIntolerances: {
          selected: ["Fish"],
          othersText: null,
          noFoodAllergies: false,
        },
      },
    });

    const form = buildPlanningProfileFormState(record);

    expect(form.athleteContext).toMatchObject({
      dateOfBirth: "2000-01-02",
      sex: "FEMALE",
      heightCm: "165",
      weightKg: "60",
    });
    expect(form.sportContext.selfReportedLevel).toBe("ELITE");
    expect(form.nutritionContext.regionalCuisinePreference).toEqual([
      "Mediterranean",
    ]);
    expect(form.nutritionContext.allergiesIntolerances).toEqual({
      selected: ["Fish"],
      othersText: "",
      noFoodAllergies: false,
    });
  });

  it("allows an unrelated partial edit on an incomplete legacy APP", () => {
    const baseline = buildPlanningProfileDefaults({});
    baseline.sportContext.disciplineOrEvent = "100m";
    baseline.nutritionContext.allergiesIntolerances = {
      selected: ["Milk"],
      othersText: "",
      noFoodAllergies: false,
    };
    baseline.sportPerformance.highestRankingAchievedAtThatLevelPast12Months =
      "2";
    const draft = structuredClone(baseline);
    draft.sportContext.disciplineOrEvent = "200m";

    expect(
      collectPlanningProfileValidationErrors(draft, { baseline }),
    ).toEqual({});
    expect(buildPlanningProfilePatchBody(baseline, draft)).toEqual({
      sportContext: { disciplineOrEvent: "200m" },
    });
  });

  it("does not clear allergies during an unrelated partial edit", () => {
    const baseline = completedDraft();
    baseline.sportContext.disciplineOrEvent = "100m";
    const draft = structuredClone(baseline);
    draft.sportContext.disciplineOrEvent = "200m";

    const patch = buildPlanningProfilePatchBody(baseline, draft);

    expect(patch).toEqual({
      sportContext: { disciplineOrEvent: "200m" },
    });
    expect(patch).not.toHaveProperty("nutritionContext");
  });

  it("does not add unchanged anthropometric values to an unrelated PATCH", () => {
    const baseline = completedDraft();
    baseline.sportContext.disciplineOrEvent = "100m";
    const draft = structuredClone(baseline);
    draft.sportContext.disciplineOrEvent = "200m";

    const patch = buildPlanningProfilePatchBody(baseline, draft);

    expect(patch).toEqual({
      sportContext: { disciplineOrEvent: "200m" },
    });
    expect(patch).not.toHaveProperty("athleteContext");
  });

  it("blocks explicitly clearing a mandatory field on a legacy APP", () => {
    const baseline = buildPlanningProfileDefaults({});
    baseline.healthStatus.injuryStatus = "HEALTHY";
    const draft = structuredClone(baseline);
    draft.healthStatus.injuryStatus = "   ";

    expect(
      collectPlanningProfileValidationErrors(draft, { baseline })[
        "healthStatus.injuryStatus"
      ],
    ).toBe("Injury Status is required.");
  });
});
