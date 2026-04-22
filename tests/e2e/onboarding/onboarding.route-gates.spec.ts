import { expect, test } from "@playwright/test";
import { E2E_CREDENTIALS } from "../fixtures/credentials";
import { onboardingPageTitle } from "../fixtures/onboarding-ui";
import { onboardingMockBodies } from "../helpers/onboarding-mock-bodies";
import { mockOnboardingGetStatus, unmockOnboardingRoutes } from "../helpers/onboarding-route-mock";
import { performLogin } from "../helpers/e2e-login";

test.describe("mocked route gates", () => {
  test.afterEach(async ({ page }) => {
    await unmockOnboardingRoutes(page);
  });

  test("COMPLETE user opening /onboarding goes to dashboard", async ({ page }) => {
    await mockOnboardingGetStatus(page, onboardingMockBodies.completeAdmin);
    await performLogin(page, E2E_CREDENTIALS.admin.email, E2E_CREDENTIALS.admin.password);
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 15_000 });
  });

  test("ROLE_SELECTION user opening /admin/dashboard goes to /onboarding", async ({
    page,
  }) => {
    await mockOnboardingGetStatus(page, onboardingMockBodies.roleSelection);
    await performLogin(page, E2E_CREDENTIALS.admin.email, E2E_CREDENTIALS.admin.password);
    await expect(page).toHaveURL(/\/onboarding(\/|$|\?)/);
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/onboarding(\/|$|\?)/, { timeout: 20_000 });
    await expect(
      page.getByRole("heading", onboardingPageTitle.chooseRole),
    ).toBeVisible({ timeout: 15_000 });
  });
});
