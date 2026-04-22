import { expect, test } from "@playwright/test";
import { E2E_CREDENTIALS } from "../fixtures/credentials";
import { onboardingPageTitle } from "../fixtures/onboarding-ui";
import { onboardingMockBodies } from "../helpers/onboarding-mock-bodies";
import { mockOnboardingGetStatus, unmockOnboardingRoutes } from "../helpers/onboarding-route-mock";
import { performLogin } from "../helpers/e2e-login";

test.describe("mocked GET /onboarding/status", () => {
  test.afterEach(async ({ page }) => {
    await unmockOnboardingRoutes(page);
  });

  test("COMPLETE ACADEMY_ADMIN redirects to /admin/dashboard", async ({ page }) => {
    await mockOnboardingGetStatus(page, onboardingMockBodies.completeAdmin);
    await performLogin(page, E2E_CREDENTIALS.admin.email, E2E_CREDENTIALS.admin.password);
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test("COMPLETE COACH redirects to /coach/dashboard", async ({ page }) => {
    await mockOnboardingGetStatus(page, onboardingMockBodies.completeCoach);
    await performLogin(page, E2E_CREDENTIALS.coach.email, E2E_CREDENTIALS.coach.password);
    await expect(page).toHaveURL(/\/coach\/dashboard/);
  });

  test("COMPLETE ATHLETE redirects to /athlete/dashboard", async ({ page }) => {
    await mockOnboardingGetStatus(page, onboardingMockBodies.completeAthlete);
    await performLogin(
      page,
      E2E_CREDENTIALS.athlete.email,
      E2E_CREDENTIALS.athlete.password,
    );
    await expect(page).toHaveURL(/\/athlete\/dashboard/);
  });
});
