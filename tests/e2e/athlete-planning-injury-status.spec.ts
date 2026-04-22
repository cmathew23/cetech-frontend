import { expect, test, type Page } from "@playwright/test";

type HealthStatusPayload = {
  injuryStatus?: "HEALTHY" | "INJURED" | "IN_REHAB";
  injuryArea?: string | null;
  injuryNotes?: string | null;
  [key: string]: unknown;
};

type GroupedPlanningPayload = {
  healthStatus?: HealthStatusPayload;
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
        healthStatus: {
          ...(record?.healthStatus ?? {}),
          ...(body.healthStatus ?? {}),
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

test.describe("athlete planning injury status", () => {
  test("create healthy then edit to injured and rehydrate", async ({ page }) => {
    const { createBodies, patchBodies } = await setupPlanningRoutes(page);
    await page.goto("/athlete/profile-planning");
    await expect(page.getByRole("button", { name: "Save Profile" })).toBeVisible();

    await page.getByLabel("Injury Status").selectOption("HEALTHY");
    await expect(page.getByLabel("Injury Area")).toHaveCount(0);
    await expect(page.getByLabel("Injury Notes")).toHaveCount(0);
    await page.getByRole("button", { name: "Save Profile" }).click();
    await expect(page.getByText("Athlete profile planning saved.")).toBeVisible();

    expect(createBodies).toHaveLength(1);
    expect(createBodies[0].healthStatus).toEqual({
      injuryStatus: "HEALTHY",
    });

    await page.getByRole("button", { name: "Edit Profile" }).click();
    await page.getByLabel("Injury Status").selectOption("INJURED");
    await expect(page.getByLabel("Injury Area")).toBeVisible();
    await expect(page.getByLabel("Injury Notes")).toBeVisible();
    await page.getByLabel("Injury Area").fill("Left shoulder");
    await page.getByLabel("Injury Notes").fill("Grade 1 strain, monitored daily.");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Athlete profile planning updated.")).toBeVisible();

    expect(patchBodies).toHaveLength(1);
    expect(patchBodies[0].healthStatus).toEqual({
      injuryStatus: "INJURED",
      injuryArea: "Left shoulder",
      injuryNotes: "Grade 1 strain, monitored daily.",
    });

    await page.reload();
    await expect(page.getByLabel("Injury Status")).toHaveValue("INJURED");
    await expect(page.getByLabel("Injury Area")).toHaveValue("Left shoulder");
    await expect(page.getByLabel("Injury Notes")).toHaveValue(
      "Grade 1 strain, monitored daily.",
    );
  });

  test("create injured then switch to healthy clears injury fields", async ({ page }) => {
    const { createBodies, patchBodies } = await setupPlanningRoutes(page);
    await page.goto("/athlete/profile-planning");
    await expect(page.getByRole("button", { name: "Save Profile" })).toBeVisible();

    await page.getByLabel("Injury Status").selectOption("IN_REHAB");
    await page.getByLabel("Injury Area").fill("Right knee");
    await page.getByLabel("Injury Notes").fill("Rehab week 3.");
    await page.getByRole("button", { name: "Save Profile" }).click();
    await expect(page.getByText("Athlete profile planning saved.")).toBeVisible();

    expect(createBodies).toHaveLength(1);
    expect(createBodies[0].healthStatus).toEqual({
      injuryStatus: "IN_REHAB",
      injuryArea: "Right knee",
      injuryNotes: "Rehab week 3.",
    });

    await page.getByRole("button", { name: "Edit Profile" }).click();
    await page.getByLabel("Injury Status").selectOption("HEALTHY");
    await expect(page.getByLabel("Injury Area")).toHaveCount(0);
    await expect(page.getByLabel("Injury Notes")).toHaveCount(0);
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Athlete profile planning updated.")).toBeVisible();

    expect(patchBodies).toHaveLength(1);
    expect(patchBodies[0].healthStatus).toEqual({
      injuryStatus: "HEALTHY",
      injuryArea: null,
      injuryNotes: null,
    });

    await page.reload();
    await expect(page.getByLabel("Injury Status")).toHaveValue("HEALTHY");
    await expect(page.getByLabel("Injury Area")).toHaveCount(0);
    await expect(page.getByLabel("Injury Notes")).toHaveCount(0);
  });
});
