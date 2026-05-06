import { expect, test } from "@playwright/test";
import { clickLogoutAndConfirm } from "./helpers/dashboard-logout";
import { performLogin } from "./helpers/e2e-login";
import { integrationSeeds } from "./fixtures/onboarding-e2e-seeds";

type LogoutScenario = {
  name: string;
  email: string;
  password: string;
  route: string;
  protectedPathPattern: RegExp;
};

const scenarios: LogoutScenario[] = [
  {
    name: "athlete dashboard logout redirects to login",
    email: integrationSeeds.athleteComplete.email,
    password: integrationSeeds.athleteComplete.password,
    route: "/athlete/dashboard",
    protectedPathPattern: /\/athlete\//,
  },
  {
    name: "athlete profile-planning logout redirects to login",
    email: integrationSeeds.athleteComplete.email,
    password: integrationSeeds.athleteComplete.password,
    route: "/athlete/profile-planning",
    protectedPathPattern: /\/athlete\//,
  },
  {
    name: "admin dashboard logout redirects to login",
    email: integrationSeeds.adminComplete.email,
    password: integrationSeeds.adminComplete.password,
    route: "/admin/dashboard",
    protectedPathPattern: /\/admin\//,
  },
  {
    name: "admin about-academy logout redirects to login",
    email: integrationSeeds.adminComplete.email,
    password: integrationSeeds.adminComplete.password,
    route: "/admin/about-academy",
    protectedPathPattern: /\/admin\//,
  },
  {
    name: "coach dashboard logout redirects to login",
    email: integrationSeeds.coachComplete.email,
    password: integrationSeeds.coachComplete.password,
    route: "/coach/dashboard",
    protectedPathPattern: /\/coach\//,
  },
];

for (const scenario of scenarios) {
  test(scenario.name, async ({ page }) => {
    const { form } = await performLogin(page, scenario.email, scenario.password);

    await page.goto(scenario.route);
    await page.waitForURL(new RegExp(`${scenario.route.replace(/\//g, "\\/")}(\\/|$|\\?)`), {
      timeout: 30_000,
    });

    await expect(
      page.getByRole("button", { name: /^logout$/i }).first(),
    ).toBeVisible();

    await clickLogoutAndConfirm(page);

    await page.waitForURL(/\/login/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
    await expect(form.getByLabel(/email/i)).toBeVisible();

    const storageState = await page.evaluate(() => ({
      token: localStorage.getItem("token"),
      returnUrl: localStorage.getItem("returnUrl"),
      lastPath: localStorage.getItem("lastPath"),
      redirectTo: localStorage.getItem("redirectTo"),
      sessionReturnUrl: sessionStorage.getItem("returnUrl"),
      sessionLastPath: sessionStorage.getItem("lastPath"),
      sessionRedirectTo: sessionStorage.getItem("redirectTo"),
    }));

    expect(storageState).toEqual({
      token: null,
      returnUrl: null,
      lastPath: null,
      redirectTo: null,
      sessionReturnUrl: null,
      sessionLastPath: null,
      sessionRedirectTo: null,
    });

    await page.goBack().catch(() => null);
    await page.waitForURL(/\/login/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(scenario.protectedPathPattern);
    await expect(form.getByLabel(/email/i)).toBeVisible();
  });
}
