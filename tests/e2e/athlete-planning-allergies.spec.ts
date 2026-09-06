import { expect, test } from "@playwright/test";

type AllergiesPayload = {
  selected: string[];
  othersText: string | null;
  noFoodAllergies: boolean;
};

type GroupedPlanningPayload = {
  nutritionContext?: {
    allergiesIntolerances?: AllergiesPayload;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

function ok(data: unknown) {
  return { success: true, data };
}

test.describe("athlete planning allergies/intolerances", () => {
  test("create + patch + reload keep allergiesIntolerances behavior", async ({
    page,
  }) => {
    let record: GroupedPlanningPayload | null = null;
    let patchValidationError: string | null = null;
    let holdCreateResponse = false;
    let releaseCreateResponse: () => void = () => {};
    const createBodies: GroupedPlanningPayload[] = [];
    const patchBodies: GroupedPlanningPayload[] = [];

    await page.addInitScript(() => {
      localStorage.setItem("token", "e2e-token");
    });

    await page.route("**/auth/me", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok({ userId: "athlete-1", roles: ["ATHLETE"] })),
      });
    });

    await page.route("**/me/app-context", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok({
            user: { userId: "athlete-1", roles: ["ATHLETE"] },
            activeRole: "ATHLETE",
            academy: {
              hasMembership: true,
              membershipStatus: "ACTIVE",
              trainingEntityId: "entity-1",
              trainingEntityName: "E2E Academy",
            },
            invitation: { hasPendingInvitation: false, pendingInvitationCount: 0 },
            access: {
              canAccessDashboard: true,
              dashboardType: "ATHLETE",
              reasonCode: "READY",
            },
            coachSummary: { assignedAthleteCount: 0 },
          }),
        ),
      });
    });

    await page.route("**/onboarding/status", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok({
            isAuthenticated: true,
            activeOnboardingRole: "ATHLETE",
            availableRoles: ["ATHLETE"],
            hasAthleteProfile: true,
            hasCoachProfile: false,
            activeMembershipCount: 1,
            pendingInvitationCount: 0,
            onboardingStatus: "COMPLETE",
            nextStep: "GO_TO_DASHBOARD",
          }),
        ),
      });
    });

    await page.route("**/entities/invitations/me", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok([])),
      });
    });

    await page.route("**/athletes/me", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok({ sport: "Football", level: "STATE" })),
      });
    });

    await page.route("**/entities/entity-1/athlete-planning-profile/me", async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        if (!record) {
          await route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ success: false, message: "Not found" }),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(ok(record)),
        });
        return;
      }

      const bodyText = route.request().postData() ?? "{}";
      const body = JSON.parse(bodyText) as GroupedPlanningPayload;

      if (method === "POST") {
        createBodies.push(body);
        record = body;
        if (holdCreateResponse) {
          await new Promise<void>((resolve) => {
            releaseCreateResponse = resolve;
          });
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(ok(record)),
        });
        return;
      }

      if (method === "PATCH") {
        if (patchValidationError) {
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({
              success: false,
              message: patchValidationError,
              code: "VALIDATION_ERROR",
            }),
          });
          return;
        }
        patchBodies.push(body);
        record = {
          ...(record ?? {}),
          ...body,
          nutritionContext: {
            ...(record?.nutritionContext ?? {}),
            ...(body.nutritionContext ?? {}),
          },
        };
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(ok(record)),
        });
        return;
      }

      await route.continue();
    });

    await page.goto("/athlete/profile-planning");
    await expect(
      page.getByRole("heading", { name: "Athlete Profile Planning" }),
    ).toBeVisible();
    const saveProfile = page.getByRole("button", { name: "Save Profile" });
    await expect(saveProfile).toBeVisible();
    await expect(saveProfile).toBeDisabled();
    await expect(page.getByText("Allergies")).toBeVisible();
    await expect(page.getByText("Intolerances")).toBeVisible();
    await expect(page.getByText("Special")).toBeVisible();

    const allergyField = page
      .locator("div")
      .filter({
        has: page.locator('label[for="nutritionContext-allergiesIntolerances"]'),
      })
      .first();

    const checkboxOrder = await allergyField
      .locator('input[type="checkbox"]')
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const label = node.closest("label");
          const text = label?.querySelector("span")?.textContent ?? "";
          return text.trim();
        }),
      );

    expect(checkboxOrder.indexOf("Fructose Intolerance")).toBeGreaterThan(
      checkboxOrder.indexOf("Sulphites"),
    );
    expect(checkboxOrder.indexOf("Others")).toBeGreaterThan(
      checkboxOrder.indexOf("Fructose Intolerance"),
    );
    expect(checkboxOrder.at(-1)).toBe("I do not have food allergies");

    const mandatoryControlIds = [
      "athleteContext-dateOfBirth",
      "athleteContext-sex",
      "athleteContext-heightCm",
      "athleteContext-weightKg",
      "sportContext-selfReportedLevel",
      "sportPerformance-highestCompetitionLevelReachedPast12Months",
      "sportPerformance-highestRankingAchievedAtThatLevelPast12Months",
      "trainingExposure-trainingAgeYears",
      "trainingExposure-currentWeeklyTrainingExposureHours",
      "trainingExposure-weeklyAvailabilityDays",
      "trainingExposure-weeklyAvailabilityHours",
      "healthStatus-injuryStatus",
      "nutritionContext-dietType",
      "nutritionContext-regionalCuisinePreference",
      "nutritionContext-allergiesIntolerances",
    ];
    for (const id of mandatoryControlIds) {
      await expect(page.locator(`label[for="${id}"]`)).toContainText("*");
    }

    await expect(page.getByLabel("How many years of training have you done so far?")).toHaveAttribute("min", "1");
    await expect(page.getByLabel("How many hours do you usually train per week?")).toHaveAttribute("max", "40");
    await expect(page.getByLabel("How many days are you generally available to train in a week?")).toHaveAttribute("min", "1");
    await expect(page.getByLabel("How many days are you generally available to train in a week?")).toHaveAttribute("max", "7");
    await expect(page.getByLabel("How many days are you generally available to train in a week?")).toHaveAttribute("step", "1");
    await expect(page.getByLabel("How many hours in a week are you generally available for training?")).toHaveAttribute("max", "40");
    await expect(page.getByLabel("Height (cm)")).toHaveAttribute("min", "100");
    await expect(page.getByLabel("Height (cm)")).toHaveAttribute("max", "220");
    await expect(page.getByLabel("Weight (kg)")).toHaveAttribute("min", "15");
    await expect(page.getByLabel("Weight (kg)")).toHaveAttribute("max", "200");

    await page.getByLabel("Date of Birth").fill("2022-07-30");
    await expect(
      page.getByText("Athlete age must be between 8 and 70 years for plan generation."),
    ).toBeVisible();
    await page.getByLabel("Date of Birth").fill("2000-01-02");
    await expect(
      page.getByText("Athlete age must be between 8 and 70 years for plan generation."),
    ).toHaveCount(0);
    await page.getByLabel("Gender").selectOption("MALE");
    await page.getByLabel("Height (cm)").fill("99");
    await expect(
      page.getByText("Height must be between 100 and 220 cm"),
    ).toBeVisible();
    await page.getByLabel("Height (cm)").fill("180");
    await page.getByLabel("Weight (kg)").fill("14");
    await expect(
      page.getByText("Weight must be between 15 and 200 kg"),
    ).toBeVisible();
    await page.getByLabel("Weight (kg)").fill("75");
    await page.getByLabel("Height (cm)").fill("100");
    await expect(
      page.getByText(
        "Height and weight produce a BMI outside the allowed range of 10 to 60",
      ),
    ).toBeVisible();
    await page.getByLabel("Height (cm)").fill("180");
    await expect(
      page.getByText(
        "Height and weight produce a BMI outside the allowed range of 10 to 60",
      ),
    ).toHaveCount(0);
    await page.getByLabel("Self-Reported Level").selectOption("ADVANCED");
    await page
      .getByLabel("Highest Competition Level Reached in the Past 12 Months")
      .selectOption("NATIONAL");
    await page
      .getByLabel("Highest Ranking Achieved at That Level in the Past 12 Months")
      .fill("3");
    await page
      .getByLabel("How many years of training have you done so far?")
      .fill("5");
    await page
      .getByLabel("How many hours do you usually train per week?")
      .fill("12");
    await page
      .getByLabel("How many days are you generally available to train in a week?")
      .fill("6");
    await page
      .getByLabel("How many hours in a week are you generally available for training?")
      .fill("18");
    await page.getByLabel("Injury Status").selectOption("HEALTHY");
    await page.getByLabel("Diet Type").selectOption("OMNIVORE");
    await page.getByLabel("South Indian").check();

    await expect(saveProfile).toBeDisabled();
    expect(createBodies).toHaveLength(0);

    await page.getByLabel("Lactose Intolerant").check();
    await page.getByLabel("FODMAP Sensitivity").check();
    await expect(saveProfile).toBeEnabled();

    await page.getByLabel("Date of Birth").fill("2022-07-30");
    await expect(saveProfile).toBeDisabled();
    await page.getByLabel("Date of Birth").fill("2000-01-02");
    await expect(saveProfile).toBeEnabled();

    await page.getByLabel("Height (cm)").fill("99");
    await expect(saveProfile).toBeDisabled();
    await page.getByLabel("Height (cm)").fill("221");
    await expect(saveProfile).toBeDisabled();
    await page.getByLabel("Height (cm)").fill("180");
    await expect(saveProfile).toBeEnabled();

    await page.getByLabel("Weight (kg)").fill("14");
    await expect(saveProfile).toBeDisabled();
    await page.getByLabel("Weight (kg)").fill("201");
    await expect(saveProfile).toBeDisabled();
    await page.getByLabel("Weight (kg)").fill("75");
    await expect(saveProfile).toBeEnabled();

    await page.getByLabel("Height (cm)").fill("100");
    await expect(saveProfile).toBeDisabled();
    await page.getByLabel("Height (cm)").fill("180");
    await expect(saveProfile).toBeEnabled();

    const hemoglobin = page.getByLabel("Hemoglobin (g/dL)");
    await expect(hemoglobin).toHaveAttribute("min", "3");
    await expect(hemoglobin).toHaveAttribute("max", "25");
    await hemoglobin.fill("26");
    await expect(
      page.getByText("Hemoglobin must be between 3 and 25 g/dL"),
    ).toBeVisible();
    await expect(saveProfile).toBeDisabled();
    await hemoglobin.fill("14");
    await expect(
      page.getByText("Hemoglobin must be between 3 and 25 g/dL"),
    ).toHaveCount(0);
    await expect(saveProfile).toBeEnabled();

    const visceralFatLevel = page.getByLabel("Visceral Fat Level");
    await expect(visceralFatLevel).toHaveAttribute("step", "1");
    await visceralFatLevel.fill("4.5");
    await expect(
      page.getByText(
        "Visceral Fat Level must be a whole number between 1 and 30",
      ),
    ).toBeVisible();
    await expect(saveProfile).toBeDisabled();
    await visceralFatLevel.fill("5");
    await expect(saveProfile).toBeEnabled();

    const bodyFatMass = page.getByLabel("Body Fat Mass (kg)");
    await bodyFatMass.fill("76");
    await expect(
      page.getByText("Body Fat Mass must not exceed athlete weight"),
    ).toBeVisible();
    await expect(saveProfile).toBeDisabled();
    await bodyFatMass.fill("20");
    await expect(
      page.getByText("Body Fat Mass must not exceed athlete weight"),
    ).toHaveCount(0);
    await expect(saveProfile).toBeEnabled();

    holdCreateResponse = true;
    await saveProfile.click();
    await expect(page.getByRole("button", { name: "Loading..." })).toBeDisabled();
    expect(createBodies).toHaveLength(1);
    releaseCreateResponse();
    await expect(page.getByText("Athlete profile planning saved.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit Profile" })).toBeVisible();

    expect(createBodies).toHaveLength(1);
    expect(createBodies[0].nutritionContext?.allergiesIntolerances).toEqual({
      selected: ["Lactose Intolerant", "FODMAP Sensitivity"],
      othersText: null,
      noFoodAllergies: false,
    });

    await page.reload();
    await expect(page.getByLabel("Lactose Intolerant")).toBeChecked();
    await expect(page.getByLabel("FODMAP Sensitivity")).toBeChecked();

    await page.getByRole("button", { name: "Edit Profile" }).click();
    await page.getByLabel("Fish").check();
    await page.getByLabel("Histamine Intolerance").check();
    await page.getByLabel("Others").check();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(
      page.getByText("Others (please specify) is required."),
    ).toBeVisible();

    await page.getByPlaceholder("Others (please specify)").fill("Nightshades");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Athlete profile planning updated.")).toBeVisible();

    expect(patchBodies).toHaveLength(1);
    expect(Object.keys(patchBodies[0])).toEqual(["nutritionContext"]);
    expect(patchBodies[0].nutritionContext?.allergiesIntolerances).toEqual({
      selected: [
        "Fish",
        "Lactose Intolerant",
        "FODMAP Sensitivity",
        "Histamine Intolerance",
        "Others",
      ],
      othersText: "Nightshades",
      noFoodAllergies: false,
    });

    await page.reload();
    await expect(page.getByLabel("Others")).toBeChecked();
    await expect(page.getByPlaceholder("Others (please specify)")).toHaveValue(
      "Nightshades",
    );

    await page.getByRole("button", { name: "Edit Profile" }).click();
    await page.getByLabel("I do not have food allergies").check();
    await expect(page.getByLabel("Fish")).toBeDisabled();
    await expect(page.getByLabel("Lactose Intolerant")).toBeDisabled();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Athlete profile planning updated.")).toBeVisible();

    expect(patchBodies).toHaveLength(2);
    expect(patchBodies[1].nutritionContext?.allergiesIntolerances).toEqual({
      selected: [],
      othersText: null,
      noFoodAllergies: true,
    });

    await page.reload();
    await expect(page.getByLabel("I do not have food allergies")).toBeChecked();
    await expect(page.getByLabel("Fish")).toBeDisabled();
    await expect(page.getByLabel("Lactose Intolerant")).toBeDisabled();
    await expect(page.getByLabel("Others")).not.toBeChecked();

    await page.getByRole("button", { name: "Edit Profile" }).click();
    await page.getByLabel("Discipline / Event").fill("Backend rejection");
    patchValidationError = "Discipline / Event was rejected by backend validation.";
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(
      page.getByText("Discipline / Event was rejected by backend validation."),
    ).toBeVisible();
  });
});
