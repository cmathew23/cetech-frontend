import { expect, test, type Page } from "@playwright/test";
import { E2E_CREDENTIALS } from "./fixtures/credentials";
import { clickLogoutAndConfirm } from "./helpers/dashboard-logout";

/** 429 retries target production-like limits; local API with NODE_ENV=development uses relaxed auth limits (README). */

function loginForm(page: Page) {
  return page.locator("form").filter({ has: page.getByLabel(/email/i) });
}

function waitMsBeforeLoginRetry(
  headers: Record<string, string>,
  retryIndex: number,
): number {
  const ra = headers["retry-after"] ?? headers["Retry-After"];
  if (ra !== undefined) {
    const sec = Number.parseFloat(String(ra).trim());
    if (!Number.isNaN(sec) && sec >= 0) {
      return Math.min(Math.max(sec * 1000, 2_000), 60_000);
    }
  }
  const base = 12_000;
  return Math.min(base * 2 ** retryIndex, 90_000);
}

test("fresh COACH john1: login → coach dashboard → logout clears session", async ({
  page,
}, testInfo) => {
  test.setTimeout(300_000);

  const { email, password } = E2E_CREDENTIALS.coach;

  const loginPostAudit: { status: number; retryAfter?: string }[] = [];
  page.on("response", (response) => {
    const req = response.request();
    if (
      req.method() === "POST" &&
      response.url().includes("/auth/login")
    ) {
      const h = response.headers();
      loginPostAudit.push({
        status: response.status(),
        retryAfter: h["retry-after"] ?? h["Retry-After"],
      });
    }
  });

  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await page.goto("/login");
  const form = loginForm(page);

  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  const maxLoginAttempts = 4;
  let loginRes: Awaited<ReturnType<Page["waitForResponse"]>> | null = null;
  let consecutive429 = 0;
  for (let attempt = 0; attempt < maxLoginAttempts; attempt++) {
    if (attempt > 0 && loginRes?.status() === 429) {
      const delay = waitMsBeforeLoginRetry(loginRes.headers(), consecutive429 - 1);
      // eslint-disable-next-line no-console
      console.log(
        `[e2e fresh-coach-user11] rate limit: waiting ${delay}ms before login retry ${attempt}/${maxLoginAttempts - 1}`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
    const loginPost = page.waitForResponse(
      (r) =>
        r.url().includes("/auth/login") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /sign in/i }).click();
    loginRes = await loginPost;
    if (loginRes.status() === 429) {
      consecutive429++;
      continue;
    }
    break;
  }

  expect(loginRes, "login response received").toBeTruthy();
  const loginStatus = loginRes!.status();

  const had429OnWire = loginPostAudit.some((e) => e.status === 429);

  // eslint-disable-next-line no-console
  console.log(
    "[e2e fresh-coach-user11] login POST /auth/login audit:",
    JSON.stringify(loginPostAudit),
  );
  // eslint-disable-next-line no-console
  console.log(
    "[e2e fresh-coach-user11] final login response status:",
    loginStatus,
  );
  // eslint-disable-next-line no-console
  console.log(
    "[e2e fresh-coach-user11] rate-limit on wire (any 429):",
    had429OnWire,
  );

  expect(
    loginStatus,
    loginStatus === 429
      ? `login API rate-limited (429) after ${maxLoginAttempts} attempts — audit: ${JSON.stringify(loginPostAudit)}; run backend with NODE_ENV=development or see README "Development Auth Rate Limiting"`
      : `login API status ${loginStatus}`,
  ).toBe(200);

  await Promise.race([
    page.waitForURL((u) => u.pathname !== "/login", { timeout: 20_000 }),
    form.getByRole("alert").waitFor({ state: "visible", timeout: 20_000 }),
  ]).catch(() => {});

  const hasLoginError = await form
    .getByRole("alert")
    .isVisible()
    .catch(() => false);
  const loginAlertText = hasLoginError
    ? ((await form.getByRole("alert").textContent()) ?? "").trim()
    : "";
  const rateLimitUiLikely =
    hasLoginError &&
    /too many|rate limit|429|try again later/i.test(loginAlertText);

  // eslint-disable-next-line no-console
  console.log(
    "[e2e fresh-coach-user11] rate-limit UI (login form alert visible):",
    rateLimitUiLikely,
    loginAlertText ? `— "${loginAlertText.slice(0, 200)}"` : "",
  );

  expect(hasLoginError, "no visible login error alert").toBe(false);

  await expect(page).not.toHaveURL(/\/login$/);

  const tokenAfterLogin = await page.evaluate(() => localStorage.getItem("token"));
  expect(tokenAfterLogin, "token after login").toBeTruthy();

  await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByText("Loading...")).toHaveCount(0, { timeout: 30_000 });

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
  console.log("[e2e fresh-coach-user11] final URL after login:", urlAfterLogin);
  // eslint-disable-next-line no-console
  console.log(
    "[e2e fresh-coach-user11] token before logout:",
    Boolean(tokenAfterLogin),
  );
  // eslint-disable-next-line no-console
  console.log(
    "[e2e fresh-coach-user11] dashboard headings:",
    headings.join(" | "),
  );
  // eslint-disable-next-line no-console
  console.log(
    "[e2e fresh-coach-user11] rate-limit summary: resolved=",
    !had429OnWire || loginStatus === 200,
    "(retries OK if final status 200); any 429 seen=",
    had429OnWire,
  );

  const dashShot = testInfo.outputPath("fresh-coach-user11-dashboard.png");
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
  console.log("[e2e fresh-coach-user11] URL after logout:", urlAfterLogout);
  // eslint-disable-next-line no-console
  console.log(
    "[e2e fresh-coach-user11] token after logout:",
    Boolean(tokenAfterLogout),
  );

  expect(new URL(urlAfterLogout).pathname).toBe("/login");
  expect(tokenAfterLogout).toBeNull();

  await expect(form.getByLabel(/email/i)).toBeVisible();
  await expect(form.getByLabel(/password/i)).toBeVisible();

  const loginShot = testInfo.outputPath("fresh-coach-user11-login-after-logout.png");
  await page.screenshot({ path: loginShot, fullPage: true });
  await testInfo.attach("login-after-logout", {
    path: loginShot,
    contentType: "image/png",
  });

  await page.reload();
  await expect(page).toHaveURL(/\/login/);
  expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
  await expect(form.getByLabel(/email/i)).toBeVisible();
  await expect(page).not.toHaveURL(/\/coach\/dashboard/);

  expect(
    [...consoleErrors, ...pageErrors],
    `no console/page errors: ${[...consoleErrors, ...pageErrors].join("; ")}`,
  ).toHaveLength(0);
});
