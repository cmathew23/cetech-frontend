/**
 * Integration: real GET /onboarding/status (no mocks). Each test expects exactly one post-login URL.
 *
 * Required backend state per seed (override with env vars — see `integrationSeeds` in
 * `tests/e2e/fixtures/onboarding-e2e-seeds.ts`):
 * - admin: COMPLETE, activeOnboardingRole ACADEMY_ADMIN → must land /admin/dashboard
 * - coach: COMPLETE, activeOnboardingRole COACH → must land /coach/dashboard
 * - athlete: COMPLETE, activeOnboardingRole ATHLETE → must land /athlete/dashboard
 *
 * If a test fails, the API response does not match — fix seed data or env; do not relax assertions.
 */
import { expect, test } from "@playwright/test";
import { integrationSeeds } from "../fixtures/onboarding-e2e-seeds";
import { onboardingPageTitle } from "../fixtures/onboarding-ui";
import { performLogin } from "../helpers/e2e-login";
import {
  expectAcademyAdminDashboard,
  expectAthleteDashboard,
  expectCoachDashboard,
} from "./assertions";

test.describe("integration — COMPLETE onboarding (real API)", () => {
  test("admin: post-login is /admin/dashboard only", async ({ page }) => {
    const s = integrationSeeds.adminComplete;
    await performLogin(page, s.email, s.password);
    await expectAcademyAdminDashboard(page);
    await expect(
      page.getByRole("heading", onboardingPageTitle.chooseRole),
    ).toHaveCount(0);
  });

  test("coach: post-login is /coach/dashboard only", async ({ page }) => {
    const s = integrationSeeds.coachComplete;
    await performLogin(page, s.email, s.password);
    await expectCoachDashboard(page);
    await expect(
      page.getByRole("heading", onboardingPageTitle.chooseRole),
    ).toHaveCount(0);
  });

  test("athlete: post-login is /athlete/dashboard only", async ({ page }) => {
    const s = integrationSeeds.athleteComplete;
    await performLogin(page, s.email, s.password);
    await expectAthleteDashboard(page);
    await expect(
      page.getByRole("heading", onboardingPageTitle.chooseRole),
    ).toHaveCount(0);
  });
});
