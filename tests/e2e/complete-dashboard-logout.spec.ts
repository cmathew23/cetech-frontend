/**
 * Session regression: login with **COMPLETE** seeded users → role dashboard → logout.
 *
 * Same seed contract as `onboarding/integration.spec.ts` (`integrationSeeds` in
 * `fixtures/onboarding-e2e-seeds.ts`). Incomplete flows: mocked specs under
 * `onboarding/`, optional real incomplete admin in `onboarding/integration.incomplete.spec.ts`.
 */
import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { integrationSeeds } from "./fixtures/onboarding-e2e-seeds";
import { clickLogoutAndConfirm } from "./helpers/dashboard-logout";
import { performLogin } from "./helpers/e2e-login";
import {
  expectAcademyAdminDashboard,
  expectAthleteDashboard,
  expectCoachDashboard,
} from "./onboarding/assertions";

async function assertLogoutSessionCleared(
  page: Page,
  form: Locator,
  testInfo: TestInfo,
  roleTag: string,
  filePrefix: string,
  forbidDashboardPath: RegExp,
) {
  await page.waitForURL(/\/login/, { timeout: 15_000 });

  const urlAfterLogout = page.url();
  const tokenAfterLogout = await page.evaluate(() => localStorage.getItem("token"));

  // eslint-disable-next-line no-console
  console.log(`[e2e dashboard-logout ${roleTag}] URL after logout:`, urlAfterLogout);
  // eslint-disable-next-line no-console
  console.log(
    `[e2e dashboard-logout ${roleTag}] token after logout:`,
    Boolean(tokenAfterLogout),
  );

  expect(new URL(urlAfterLogout).pathname).toBe("/login");
  expect(tokenAfterLogout).toBeNull();

  await expect(form.getByLabel(/email/i)).toBeVisible();
  await expect(form.getByLabel(/password/i)).toBeVisible();

  const loginShot = testInfo.outputPath(`${filePrefix}-login-after-logout.png`);
  await page.screenshot({ path: loginShot, fullPage: true });
  await testInfo.attach(`${filePrefix}-after-logout`, {
    path: loginShot,
    contentType: "image/png",
  });

  await page.reload();
  await expect(page).toHaveURL(/\/login/);
  expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
  await expect(form.getByLabel(/email/i)).toBeVisible();
  await expect(page).not.toHaveURL(forbidDashboardPath);
}

test.describe("complete dashboard → logout", () => {
  test.describe.configure({ timeout: 180_000 });

  const loginGapMs = Number(process.env.PLAYWRIGHT_LOGIN_GAP_MS ?? 16_000);
  let lastTestEndedAt = 0;

  test.beforeEach(async () => {
    if (lastTestEndedAt > 0) {
      const elapsed = Date.now() - lastTestEndedAt;
      const wait = Math.max(0, loginGapMs - elapsed);
      if (wait > 0) {
        // eslint-disable-next-line no-console
        console.log(
          `[e2e dashboard-logout] login spacing: ${wait}ms before next test (gap=${loginGapMs}ms)`,
        );
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  });

  test.afterEach(() => {
    lastTestEndedAt = Date.now();
  });

  test("COACH — seed must be COMPLETE/COACH → /coach/dashboard only", async ({
    page,
  }, testInfo) => {
    const roleTag = "COACH";
    const s = integrationSeeds.coachComplete;
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    const { form, token } = await performLogin(page, s.email, s.password);

    await expectCoachDashboard(page);
    expect(
      new URL(page.url()).pathname.includes("/coach/dashboard"),
      `expected /coach/dashboard for COMPLETE coach seed; got ${page.url()}`,
    ).toBe(true);

    // eslint-disable-next-line no-console
    console.log(`[e2e dashboard-logout ${roleTag}] token before logout:`, Boolean(token));

    const landShot = testInfo.outputPath("complete-coach-post-login.png");
    await page.screenshot({ path: landShot, fullPage: true });
    await testInfo.attach("complete-coach-post-login", {
      path: landShot,
      contentType: "image/png",
    });

    await expect(
      page.getByRole("button", { name: /^logout$/i }).first(),
    ).toBeVisible();
    await clickLogoutAndConfirm(page);
    await assertLogoutSessionCleared(
      page,
      form,
      testInfo,
      roleTag,
      "complete-coach",
      /\/coach\/dashboard/,
    );

    expect(
      [...consoleErrors, ...pageErrors],
      `no console/page errors: ${[...consoleErrors, ...pageErrors].join("; ")}`,
    ).toHaveLength(0);
  });

  test("ACADEMY ADMIN — seed must be COMPLETE/ACADEMY_ADMIN → /admin/dashboard only", async ({
    page,
  }, testInfo) => {
    const roleTag = "ACADEMY_ADMIN";
    const s = integrationSeeds.adminComplete;
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    const { form, token } = await performLogin(page, s.email, s.password);

    await expectAcademyAdminDashboard(page);
    expect(
      new URL(page.url()).pathname.includes("/admin/dashboard"),
      `expected /admin/dashboard for COMPLETE admin seed; got ${page.url()}`,
    ).toBe(true);

    // eslint-disable-next-line no-console
    console.log(`[e2e dashboard-logout ${roleTag}] token before logout:`, Boolean(token));

    const landShot = testInfo.outputPath("complete-academy-admin-post-login.png");
    await page.screenshot({ path: landShot, fullPage: true });
    await testInfo.attach("complete-academy-admin-post-login", {
      path: landShot,
      contentType: "image/png",
    });

    await expect(
      page.getByRole("button", { name: /^logout$/i }).first(),
    ).toBeVisible();
    await clickLogoutAndConfirm(page);
    await assertLogoutSessionCleared(
      page,
      form,
      testInfo,
      roleTag,
      "complete-academy-admin",
      /\/admin\/dashboard/,
    );

    expect(
      [...consoleErrors, ...pageErrors],
      `no console/page errors: ${[...consoleErrors, ...pageErrors].join("; ")}`,
    ).toHaveLength(0);
  });

  test("ATHLETE — seed must be COMPLETE/ATHLETE → /athlete/dashboard only", async ({
    page,
  }, testInfo) => {
    const roleTag = "ATHLETE";
    const s = integrationSeeds.athleteComplete;
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    const { form, token } = await performLogin(page, s.email, s.password);

    await expectAthleteDashboard(page);
    expect(
      new URL(page.url()).pathname.includes("/athlete/dashboard"),
      `expected /athlete/dashboard for COMPLETE athlete seed; got ${page.url()}`,
    ).toBe(true);

    // eslint-disable-next-line no-console
    console.log(`[e2e dashboard-logout ${roleTag}] token before logout:`, Boolean(token));

    const landShot = testInfo.outputPath("complete-athlete-post-login.png");
    await page.screenshot({ path: landShot, fullPage: true });
    await testInfo.attach("complete-athlete-post-login", {
      path: landShot,
      contentType: "image/png",
    });

    await expect(
      page.getByRole("button", { name: /^logout$/i }).first(),
    ).toBeVisible();
    await clickLogoutAndConfirm(page);
    await assertLogoutSessionCleared(
      page,
      form,
      testInfo,
      roleTag,
      "complete-athlete",
      /\/athlete\/dashboard/,
    );

    expect(
      [...consoleErrors, ...pageErrors],
      `no console/page errors: ${[...consoleErrors, ...pageErrors].join("; ")}`,
    ).toHaveLength(0);
  });
});
