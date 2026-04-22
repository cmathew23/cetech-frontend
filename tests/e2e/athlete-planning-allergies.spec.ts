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
    await expect(page.getByRole("button", { name: "Save Profile" })).toBeVisible();
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

    await page.getByLabel("Lactose Intolerant").check();
    await page.getByLabel("FODMAP Sensitivity").check();
    await page.getByRole("button", { name: "Save Profile" }).click();
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
  });
});
