import { expect, test, type Page } from "@playwright/test";
import { E2E_CREDENTIALS } from "../fixtures/credentials";
import {
  accessContextMockBodies,
  onboardingMockBodies,
} from "../helpers/onboarding-mock-bodies";
import { unmockAcademySetupPost } from "../helpers/academy-setup-route-mock";
import {
  mockAccessContextGet,
  unmockAccessContext,
} from "../helpers/access-context-route-mock";
import { performLogin } from "../helpers/e2e-login";
import {
  mockOnboardingGetStatus,
  unmockOnboardingRoutes,
} from "../helpers/onboarding-route-mock";

async function unmockAcademyMocks(page: Page): Promise<void> {
  await unmockOnboardingRoutes(page);
  await unmockAccessContext(page);
  await unmockAcademySetupPost(page);
}

test.describe("Academy admin onboarding contract (mocked APIs)", () => {
  test.afterEach(async ({ page }) => {
    await unmockAcademyMocks(page);
  });

  test("login lands on /onboarding with academy setup step visible", async ({
    page,
  }) => {
    await mockOnboardingGetStatus(
      page,
      onboardingMockBodies.academySetupRequiredAdmin,
    );
    await mockAccessContextGet(page, accessContextMockBodies.onboardingRequired);
    await performLogin(
      page,
      E2E_CREDENTIALS.admin.email,
      E2E_CREDENTIALS.admin.password,
    );
    await expect(page).toHaveURL(/\/onboarding/);
    await expect(page.getByRole("heading", { name: /^Academy setup$/i })).toBeVisible();
    await expect(page.getByLabel(/^Academy name$/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /create academy and continue/i })).toBeVisible();
  });

  test("direct /admin/dashboard before setup redirects to /onboarding", async ({
    page,
  }) => {
    await mockOnboardingGetStatus(
      page,
      onboardingMockBodies.academySetupRequiredAdmin,
    );
    await mockAccessContextGet(page, accessContextMockBodies.onboardingRequired);
    await performLogin(
      page,
      E2E_CREDENTIALS.admin.email,
      E2E_CREDENTIALS.admin.password,
    );
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test("academy setup POST then status COMPLETE + ACTIVE access navigates to admin dashboard", async ({
    page,
  }) => {
    const completeAfterSetup = {
      success: true,
      data: {
        isAuthenticated: true,
        availableRoles: ["ATHLETE", "COACH", "ACADEMY_ADMIN"],
        activeOnboardingRole: "ACADEMY_ADMIN",
        hasAthleteProfile: false,
        hasCoachProfile: false,
        activeMembershipCount: 1,
        pendingInvitationCount: 0,
        onboardingStatus: "COMPLETE",
        nextStep: "GO_TO_DASHBOARD",
      },
    };

    let afterAcademySetupPost = false;
    let accessPhase: "onboarding" | "active" = "onboarding";

    await page.route("**/onboarding/status", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      const body = afterAcademySetupPost
        ? completeAfterSetup
        : onboardingMockBodies.academySetupRequiredAdmin;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });

    await page.route("**/me/app-context", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      const payload =
        accessPhase === "active"
          ? accessContextMockBodies.activeWithDefaultEntity
          : accessContextMockBodies.onboardingRequired;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
    });

    await page.route("**/onboarding/academy-setup", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      afterAcademySetupPost = true;
      accessPhase = "active";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            academyId: "acad-e2e",
            entityId: "ent-e2e-1",
            name: "E2E Academy",
          },
        }),
      });
    });

    await performLogin(
      page,
      E2E_CREDENTIALS.admin.email,
      E2E_CREDENTIALS.admin.password,
    );

    await page.getByLabel(/^Academy name$/i).fill("E2E Academy");
    await page.getByLabel(/^Address$/i).fill("1 Test St");
    await page.getByLabel(/^Email$/i).fill("a@example.com");
    await page.getByLabel(/^Phone$/i).fill("555-0100");

    await page.getByRole("button", { name: /create academy and continue/i }).click();

    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 30_000 });
  });
});
