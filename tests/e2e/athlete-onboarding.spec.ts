import { expect, test, type Page } from "@playwright/test";
import { E2E_CREDENTIALS } from "./fixtures/credentials";

function headingFirst(page: Page, name: string | RegExp) {
  return page.getByRole("heading", { name }).first();
}

type AthleteUiState =
  | "dashboard"
  | "role_selection"
  | "profile"
  | "connect"
  | "invitation_inbox"
  | "other_onboarding";

async function classifyAthleteUi(
  page: Page,
  path: string,
): Promise<AthleteUiState> {
  if (path.startsWith("/athlete/dashboard")) {
    return "dashboard";
  }
  if (!path.includes("/onboarding")) {
    return "other_onboarding";
  }

  if (await headingFirst(page, /^Invitations$/i).isVisible().catch(() => false)) {
    return "invitation_inbox";
  }
  if (await page.getByRole("heading", { name: "Choose your role" }).isVisible().catch(() => false)) {
    return "role_selection";
  }
  if (
    await page.getByRole("heading", { name: "Athlete profile" }).isVisible().catch(() => false)
  ) {
    return "profile";
  }
  if (
    await page
      .getByRole("heading", { name: "Create your athlete profile" })
      .isVisible()
      .catch(() => false)
  ) {
    return "profile";
  }
  if (
    await page.getByRole("heading", { name: "Connect as an athlete" }).isVisible().catch(() => false)
  ) {
    return "connect";
  }
  if (
    await page
      .getByRole("heading", { name: "How do you want to connect?" })
      .isVisible()
      .catch(() => false)
  ) {
    return "connect";
  }
  return "other_onboarding";
}

test("athlete login and onboarding outcome", async ({ page }, testInfo) => {
  const { email, password } = E2E_CREDENTIALS.athlete;

  const pageErrors: string[] = [];
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();

  const loginForm = page
    .locator("form")
    .filter({ has: page.getByLabel("Email") });

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);

  const loginPost = page.waitForResponse(
    (r) =>
      r.url().includes("/auth/login") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Sign in" }).click();
  const loginResponse = await loginPost;

  const leftLoginOrError = await Promise.race([
    page.waitForURL((u) => u.pathname !== "/login", { timeout: 10_000 }).then(() => true),
    loginForm.getByRole("alert").waitFor({ state: "visible", timeout: 10_000 }).then(() => true),
  ]).catch(() => false);

  if (!leftLoginOrError && new URL(page.url()).pathname === "/login") {
    await page.getByLabel("Password").press("Enter");
  }

  await Promise.race([
    page.waitForURL(/\/onboarding(\/|$|\?)/, { timeout: 45_000 }),
    page.waitForURL(/\/athlete\/dashboard(\/|$|\?)/, { timeout: 45_000 }),
    loginForm.getByRole("alert").waitFor({ state: "visible", timeout: 45_000 }),
  ]).catch(() => {});

  const urlAfterLogin = page.url();
  const loginErrorLocator = loginForm.getByRole("alert");
  const hasLoginError = await loginErrorLocator.isVisible().catch(() => false);

  const token = await page.evaluate(() => localStorage.getItem("token"));

  expect(loginResponse.status()).toBe(200);
  expect(hasLoginError, "no login form error").toBe(false);
  expect(token).toBeTruthy();

  const path = new URL(urlAfterLogin).pathname;
  expect(path).not.toBe("/login");

  if (path === "/onboarding") {
    await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 30_000 });
  }

  const ui = await classifyAthleteUi(page, path);

  if (ui === "dashboard") {
    await expect(
      page.getByRole("heading", { name: "Athlete Dashboard" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Welcome to your dashboard")).toBeVisible();
  } else if (ui === "invitation_inbox") {
    await expect(headingFirst(page, /^Invitations$/i)).toBeVisible();
  } else if (ui === "role_selection") {
    await expect(page.getByRole("heading", { name: "Choose your role" })).toBeVisible();
    await page.getByRole("button", { name: "ATHLETE" }).click();
    await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 30_000 });
  } else if (ui === "profile") {
    const h2 = page.getByRole("heading", { name: "Athlete profile" });
    const h3 = page.getByRole("heading", { name: "Create your athlete profile" });
    await expect(h2.or(h3).first()).toBeVisible();
  } else if (ui === "connect") {
    await expect(
      page.getByRole("heading", { name: /Connect as an athlete|How do you want to connect\?/ }),
    ).toBeVisible();
  } else if (path.includes("/onboarding") && ui === "other_onboarding") {
    await expect(page.getByRole("heading").first()).toBeVisible({
      timeout: 15_000,
    });
  }

  expect(pageErrors, pageErrors.join("; ")).toHaveLength(0);

  const shotPath = testInfo.outputPath("athlete-final.png");
  await page.screenshot({ path: shotPath, fullPage: true });
  await testInfo.attach("final-screenshot", {
    path: shotPath,
    contentType: "image/png",
  });
});
