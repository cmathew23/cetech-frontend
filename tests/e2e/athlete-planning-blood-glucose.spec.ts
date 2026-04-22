import { expect, test, type Page } from "@playwright/test";

type BloodReportPayload = {
  fastingBloodGlucoseFBS?: number | null;
  postprandialBloodGlucosePPBS?: number | null;
  [key: string]: unknown;
};

type GroupedPlanningPayload = {
  bloodReportParameters?: BloodReportPayload;
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
        bloodReportParameters: {
          ...(record?.bloodReportParameters ?? {}),
          ...(body.bloodReportParameters ?? {}),
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

test.describe("athlete planning blood glucose fields", () => {
  test("create, patch and reload with blood glucose values", async ({ page }) => {
    const { createBodies, patchBodies } = await setupPlanningRoutes(page);
    await page.goto("/athlete/profile-planning");
    await expect(page.getByRole("button", { name: "Save Profile" })).toBeVisible();

    const fbs = page.getByLabel("Fasting Blood Glucose (FBS)");
    const ppbs = page.getByLabel("Postprandial Blood Glucose (PPBS)");
    await expect(fbs).toBeVisible();
    await expect(ppbs).toBeVisible();
    await expect(page.getByText("Unit: mg/dL").first()).toBeVisible();

    await fbs.fill("92.5");
    await ppbs.fill("131");
    await page.getByRole("button", { name: "Save Profile" }).click();
    await expect(page.getByText("Athlete profile planning saved.")).toBeVisible();

    expect(createBodies).toHaveLength(1);
    expect(createBodies[0].bloodReportParameters).toEqual({
      fastingBloodGlucoseFBS: 92.5,
      postprandialBloodGlucosePPBS: 131,
    });

    await page.reload();
    await expect(fbs).toHaveValue("92.5");
    await expect(ppbs).toHaveValue("131");

    await page.getByRole("button", { name: "Edit Profile" }).click();
    await fbs.fill("");
    await ppbs.fill("140");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Athlete profile planning updated.")).toBeVisible();

    expect(patchBodies).toHaveLength(1);
    expect(patchBodies[0].bloodReportParameters).toEqual({
      fastingBloodGlucoseFBS: null,
      postprandialBloodGlucosePPBS: 140,
    });
  });

  test("negative glucose values are blocked by frontend validation", async ({ page }) => {
    await setupPlanningRoutes(page);
    await page.goto("/athlete/profile-planning");
    await expect(page.getByRole("button", { name: "Save Profile" })).toBeVisible();

    await page.getByLabel("Fasting Blood Glucose (FBS)").fill("-1");
    await page.getByRole("button", { name: "Save Profile" }).click();
    await expect(
      page.getByText(
        "Fasting Blood Glucose (FBS) must be a number greater than or equal to 0",
      ),
    ).toBeVisible();
  });
});
