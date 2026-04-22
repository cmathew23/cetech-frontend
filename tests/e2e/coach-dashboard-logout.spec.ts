import { expect, test } from "@playwright/test";
import { E2E_CREDENTIALS } from "./fixtures/credentials";
import { clickLogoutAndConfirm } from "./helpers/dashboard-logout";

test("coach dashboard login then Logout clears session (john1)", async ({
  page,
}, testInfo) => {
  const { email, password } = E2E_CREDENTIALS.coach;

  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  await page.goto("/login");

  const loginForm = page
    .locator("form")
    .filter({ has: page.getByLabel(/email/i) });

  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /sign in/i }),
  ).toBeVisible();

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  const loginPost = page.waitForResponse(
    (r) =>
      r.url().includes("/auth/login") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: /sign in/i }).click();
  const loginRes = await loginPost;

  await Promise.race([
    page.waitForURL((u) => u.pathname !== "/login", { timeout: 20_000 }),
    loginForm.getByRole("alert").waitFor({ state: "visible", timeout: 20_000 }),
  ]).catch(() => {});

  const hasLoginError = await loginForm
    .getByRole("alert")
    .isVisible()
    .catch(() => false);
  expect(loginRes.status(), `login API status ${loginRes.status()}`).toBe(200);
  expect(hasLoginError, "no login error alert").toBe(false);

  await expect(page).not.toHaveURL(/\/login$/);

  const tokenAfterLogin = await page.evaluate(() => localStorage.getItem("token"));
  expect(tokenAfterLogin, "token after login").toBeTruthy();

  await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 30_000 });

  await page.waitForURL(/\/coach\/dashboard(\/|$|\?)/, { timeout: 30_000 });
  const urlAfterLogin = page.url();
  expect(urlAfterLogin).toContain("/coach/dashboard");

  await expect(
    page.getByRole("heading", { name: "Coach Dashboard" }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Welcome to your dashboard")).toBeVisible();

  const headings = await page
    .locator("h1, h2, h3")
    .allInnerTexts()
    .then((t) => t.map((s) => s.trim()).filter(Boolean));

  // eslint-disable-next-line no-console
  console.log("[e2e coach-logout] URL after login:", urlAfterLogin);
  // eslint-disable-next-line no-console
  console.log("[e2e coach-logout] token before logout:", Boolean(tokenAfterLogin));
  // eslint-disable-next-line no-console
  console.log("[e2e coach-logout] dashboard headings:", headings.join(" | "));

  const dashShot = testInfo.outputPath("coach-dashboard-before-logout.png");
  await page.screenshot({ path: dashShot, fullPage: true });
  await testInfo.attach("dashboard-before-logout", {
    path: dashShot,
    contentType: "image/png",
  });

  await expect(
    page.getByRole("button", { name: /^logout$/i }).first(),
  ).toBeVisible();
  await clickLogoutAndConfirm(page);

  await page.waitForURL(/\/login/, { timeout: 15_000 });

  const urlAfterLogout = page.url();
  const tokenAfterLogout = await page.evaluate(() => localStorage.getItem("token"));

  // eslint-disable-next-line no-console
  console.log("[e2e coach-logout] URL after logout:", urlAfterLogout);
  // eslint-disable-next-line no-console
  console.log("[e2e coach-logout] token after logout:", Boolean(tokenAfterLogout));

  expect(new URL(urlAfterLogout).pathname).toBe("/login");
  expect(tokenAfterLogout).toBeNull();

  await expect(loginForm.getByLabel(/email/i)).toBeVisible();
  await expect(loginForm.getByLabel(/password/i)).toBeVisible();

  const loginShot = testInfo.outputPath("coach-login-after-logout.png");
  await page.screenshot({ path: loginShot, fullPage: true });
  await testInfo.attach("login-after-logout", {
    path: loginShot,
    contentType: "image/png",
  });

  await page.reload();
  await expect(page).toHaveURL(/\/login/);
  expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
  await expect(loginForm.getByLabel(/email/i)).toBeVisible();
  await expect(page).not.toHaveURL(/\/coach\/dashboard/);

  expect(
    [...consoleErrors, ...pageErrors],
    `no console/page errors: ${[...consoleErrors, ...pageErrors].join("; ")}`,
  ).toHaveLength(0);
});
