import { expect, test, type Page } from "@playwright/test";

type SportPerformancePayload = {
  highestCompetitionLevelReachedPast12Months?:
    | "DISTRICT"
    | "STATE"
    | "NATIONAL"
    | "INTERNATIONAL"
    | null;
  highestRankingAchievedAtThatLevelPast12Months?: number | null;
  [key: string]: unknown;
};

type GroupedPlanningPayload = {
  sportPerformance?: SportPerformancePayload;
  [key: string]: unknown;
};

function ok(data: unknown) {
  return { success: true, data };
}

async function setupPlanningRoutes(page: Page) {
  let record: GroupedPlanningPayload | null = null;
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
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok(record)),
      });
      return;
    }
    if (method === "PATCH") {
      patchBodies.push(body);
      record = {
        ...(record ?? {}),
        ...body,
        sportPerformance: {
          ...(record?.sportPerformance ?? {}),
          ...(body.sportPerformance ?? {}),
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

  return { createBodies, patchBodies };
}

test.describe("athlete planning sport performance canonical fields", () => {
  test("create with level only, then add ranking and reload", async ({ page }) => {
    const { createBodies, patchBodies } = await setupPlanningRoutes(page);
    await page.goto("/athlete/profile-planning");
    await expect(page.getByRole("button", { name: "Save Profile" })).toBeVisible();

    await page
      .getByLabel("Highest Competition Level Reached in the Past 12 Months")
      .selectOption("STATE");
    await expect(
      page.getByLabel(
        "Highest Ranking Achieved at That Level in the Past 12 Months",
      ),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Save Profile" }).click();
    await expect(page.getByText("Athlete profile planning saved.")).toBeVisible();

    expect(createBodies).toHaveLength(1);
    expect(createBodies[0].sportPerformance).toEqual({
      highestCompetitionLevelReachedPast12Months: "STATE",
    });
    expect(createBodies[0].sportPerformance).not.toHaveProperty("highestLevelReached");
    expect(createBodies[0].sportPerformance).not.toHaveProperty("rankingLevel");

    await page.getByRole("button", { name: "Edit Profile" }).click();
    await page
      .getByLabel("Highest Ranking Achieved at That Level in the Past 12 Months")
      .fill("8");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Athlete profile planning updated.")).toBeVisible();

    expect(patchBodies).toHaveLength(1);
    expect(patchBodies[0].sportPerformance).toEqual({
      highestRankingAchievedAtThatLevelPast12Months: 8,
    });

    await page.reload();
    await expect(
      page.getByLabel("Highest Competition Level Reached in the Past 12 Months"),
    ).toHaveValue("STATE");
    await expect(
      page.getByLabel(
        "Highest Ranking Achieved at That Level in the Past 12 Months",
      ),
    ).toHaveValue("8");
  });

  test("clearing level clears and nulls ranking", async ({ page }) => {
    const { createBodies, patchBodies } = await setupPlanningRoutes(page);
    await page.goto("/athlete/profile-planning");
    await expect(page.getByRole("button", { name: "Save Profile" })).toBeVisible();

    await page
      .getByLabel("Highest Competition Level Reached in the Past 12 Months")
      .selectOption("NATIONAL");
    await page
      .getByLabel("Highest Ranking Achieved at That Level in the Past 12 Months")
      .fill("15");
    await page.getByRole("button", { name: "Save Profile" }).click();
    await expect(page.getByText("Athlete profile planning saved.")).toBeVisible();
    expect(createBodies).toHaveLength(1);

    await page.getByRole("button", { name: "Edit Profile" }).click();
    await page
      .getByLabel("Highest Competition Level Reached in the Past 12 Months")
      .selectOption("");
    await expect(
      page.getByLabel(
        "Highest Ranking Achieved at That Level in the Past 12 Months",
      ),
    ).toBeDisabled();
    await expect(
      page.getByLabel(
        "Highest Ranking Achieved at That Level in the Past 12 Months",
      ),
    ).toHaveValue("");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Athlete profile planning updated.")).toBeVisible();

    expect(patchBodies).toHaveLength(1);
    expect(patchBodies[0].sportPerformance).toEqual({
      highestCompetitionLevelReachedPast12Months: null,
      highestRankingAchievedAtThatLevelPast12Months: null,
    });

    await page.reload();
    await expect(
      page.getByLabel("Highest Competition Level Reached in the Past 12 Months"),
    ).toHaveValue("");
    await expect(
      page.getByLabel(
        "Highest Ranking Achieved at That Level in the Past 12 Months",
      ),
    ).toBeDisabled();
    await expect(
      page.getByLabel(
        "Highest Ranking Achieved at That Level in the Past 12 Months",
      ),
    ).toHaveValue("");
  });
});
