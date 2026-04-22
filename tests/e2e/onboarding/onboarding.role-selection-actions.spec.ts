import { expect, test } from "@playwright/test";
import { E2E_CREDENTIALS } from "../fixtures/credentials";
import { onboardingPageTitle } from "../fixtures/onboarding-ui";
import { onboardingMockBodies } from "../helpers/onboarding-mock-bodies";
import { mockOnboardingGetStatus, unmockOnboardingRoutes } from "../helpers/onboarding-route-mock";
import { performLogin } from "../helpers/e2e-login";

test.describe("mocked ROLE_SELECTION_REQUIRED", () => {
  test.afterEach(async ({ page }) => {
    await unmockOnboardingRoutes(page);
  });

  test("post-login stays on /onboarding", async ({ page }) => {
    await mockOnboardingGetStatus(page, onboardingMockBodies.roleSelection);
    await performLogin(page, E2E_CREDENTIALS.admin.email, E2E_CREDENTIALS.admin.password);
    await expect(page).toHaveURL(/\/onboarding(\/|$|\?)/);
    await expect(
      page.getByRole("heading", onboardingPageTitle.chooseRole),
    ).toBeVisible({ timeout: 15_000 });
  });
});
