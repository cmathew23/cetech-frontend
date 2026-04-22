import { expect, test, type Page } from "@playwright/test";
import { E2E_CREDENTIALS } from "./fixtures/credentials";

function headingFirst(page: Page, name: string | RegExp) {
  return page.getByRole("heading", { name }).first();
}

test.describe("login + post-login redirection", () => {
  test("john1 coach account", async ({ page }, testInfo) => {
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

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in/i }),
    ).toBeVisible();

    const loginForm = page
      .locator("form")
      .filter({ has: page.getByLabel("Email") });

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);

    const loginPost = page.waitForResponse(
      (r) =>
        r.url().includes("/auth/login") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /sign in/i }).click();
    const loginRes = await loginPost;
    const loginStatus = loginRes.status();

    await Promise.race([
      page.waitForURL((u) => u.pathname !== "/login", { timeout: 15_000 }),
      loginForm.getByRole("alert").waitFor({ state: "visible", timeout: 15_000 }),
    ]).catch(() => {});

    const hasLoginError = await loginForm
      .getByRole("alert")
      .isVisible()
      .catch(() => false);
    const loginErrorText = hasLoginError
      ? ((await loginForm.getByRole("alert").textContent()) ?? "").trim()
      : "";

    expect(
      loginStatus === 200,
      `login API must return 200 (got ${loginStatus}; 429 = rate limit — ensure API NODE_ENV=development for local E2E, or see README "Development Auth Rate Limiting")`,
    ).toBe(true);
    expect(hasLoginError, "no visible login error alert").toBe(false);
    expect(loginErrorText).toBe("");

    await expect(page).not.toHaveURL(/\/login$/);

    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token, "auth token in localStorage").toBeTruthy();

    await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 30_000 });

    const finalUrl = page.url();
    const pathname = new URL(finalUrl).pathname;

    const headings = await page
      .locator("h1, h2, h3")
      .allInnerTexts()
      .then((t) => t.map((s) => s.trim()).filter(Boolean));

    let detectedFlow: string;

    if (pathname.includes("/coach/dashboard")) {
      detectedFlow = "coach";
      await expect(
        page.getByRole("heading", { name: "Coach Dashboard" }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText("Welcome to your dashboard")).toBeVisible();
    } else if (pathname.includes("/athlete/dashboard")) {
      detectedFlow = "athlete_dashboard";
      await expect(
        page.getByRole("heading", { name: "Athlete Dashboard" }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText("Welcome to your dashboard")).toBeVisible();
    } else if (pathname.includes("/admin/dashboard")) {
      detectedFlow = "academy_admin_dashboard";
      await expect(
        page.getByRole("heading", { name: "Academy Admin Dashboard" }),
      ).toBeVisible({ timeout: 15_000 });
    } else if (pathname.includes("/onboarding")) {
      const academyCreate = headingFirst(page, "Create your academy");
      const waiting = headingFirst(page, "Waiting for invitation");
      const athleteProfile = headingFirst(page, "Create your athlete profile");
      const coachGroup = headingFirst(page, "Create your coaching group");

      if (await academyCreate.isVisible({ timeout: 5_000 }).catch(() => false)) {
        detectedFlow = "academy_admin_onboarding";
        await expect(academyCreate).toBeVisible();
      } else if (await waiting.isVisible({ timeout: 3_000 }).catch(() => false)) {
        detectedFlow = "athlete_waiting";
        await expect(waiting).toBeVisible();
      } else if (
        await athleteProfile.isVisible({ timeout: 3_000 }).catch(() => false)
      ) {
        detectedFlow = "athlete_onboarding_profile";
        await expect(athleteProfile).toBeVisible();
      } else if (await coachGroup.isVisible({ timeout: 3_000 }).catch(() => false)) {
        detectedFlow = "coach_onboarding_entity";
        await expect(coachGroup).toBeVisible();
      } else {
        await expect(
          page
            .getByRole("heading", { name: /Complete onboarding|Choose your role/i })
            .first(),
        ).toBeVisible({ timeout: 10_000 });
        detectedFlow = "onboarding_other";
      }
    } else {
      throw new Error(`Unexpected post-login path: ${pathname} (${finalUrl})`);
    }

    // eslint-disable-next-line no-console
    console.log("[e2e login-redirect] final URL:", finalUrl);
    // eslint-disable-next-line no-console
    console.log("[e2e login-redirect] detected flow:", detectedFlow);
    // eslint-disable-next-line no-console
    console.log("[e2e login-redirect] headings:", headings.join(" | "));
    // eslint-disable-next-line no-console
    console.log("[e2e login-redirect] token present:", Boolean(token));

    expect(
      [...consoleErrors, ...pageErrors],
      `no console/page errors: ${[...consoleErrors, ...pageErrors].join("; ")}`,
    ).toHaveLength(0);

    const shotPath = testInfo.outputPath("login-redirect-final.png");
    await page.screenshot({ path: shotPath, fullPage: true });
    await testInfo.attach("final-screenshot", {
      path: shotPath,
      contentType: "image/png",
    });
  });
});
