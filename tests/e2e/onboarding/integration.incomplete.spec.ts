/**
 * Optional real API: ROLE_SELECTION_REQUIRED when E2E_SEED_ADMIN_ROLE_SELECTION_* are set.
 * Otherwise skipped. Mocked coverage lives in onboarding/*.spec.ts with mockOnboardingGetStatus.
 */
import { expect, test } from "@playwright/test";
import { onboardingPageTitle } from "../fixtures/onboarding-ui";
import { performLogin } from "../helpers/e2e-login";

const email = (process.env.E2E_SEED_ADMIN_ROLE_SELECTION_EMAIL ?? "").trim();
const password = (process.env.E2E_SEED_ADMIN_ROLE_SELECTION_PASSWORD ?? "").trim();

test.describe("integration incomplete admin", () => {
  test("ROLE_SELECTION_REQUIRED post-login /onboarding", async ({ page }) => {
    test.skip(
      !email || !password,
      "Set E2E_SEED_ADMIN_ROLE_SELECTION_EMAIL and E2E_SEED_ADMIN_ROLE_SELECTION_PASSWORD.",
    );

    await performLogin(page, email, password);
    await expect(page).toHaveURL(/\/onboarding(\/|$|\?)/);
    await expect(
      page.getByRole("heading", onboardingPageTitle.chooseRole),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page).not.toHaveURL(/\/admin\/dashboard/);
  });
});
