import { expect, test, type Page } from "@playwright/test";
import { E2E_CREDENTIALS } from "./fixtures/credentials";

function invitationsHeading(page: Page) {
  return page.getByRole("heading", { name: /^Invitations$/i });
}

test("athlete login post-login state", async ({ page }, testInfo) => {
  const { email, password } = E2E_CREDENTIALS.athlete;

  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await page.goto("/login");
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();

  const loginForm = page
    .locator("form")
    .filter({ has: page.getByLabel(/email/i) });

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  const loginPost = page.waitForResponse(
    (r) =>
      r.url().includes("/auth/login") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: /sign in/i }).click();
  const loginRes = await loginPost;

  await Promise.race([
    page.waitForURL((u) => u.pathname !== "/login", { timeout: 15_000 }),
    loginForm.getByRole("alert").waitFor({ state: "visible", timeout: 15_000 }),
  ]).catch(() => {});

  expect(loginRes.status(), "login 200").toBe(200);
  expect(
    await loginForm.getByRole("alert").isVisible().catch(() => false),
    "no login error",
  ).toBe(false);

  await expect(page).not.toHaveURL(/\/login$/);
  const token = await page.evaluate(() => localStorage.getItem("token"));
  expect(token).toBeTruthy();

  await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 30_000 });

  const pathname = new URL(page.url()).pathname;

  if (pathname.includes("/athlete/dashboard")) {
    await expect(
      page.getByRole("heading", { name: "Athlete Dashboard" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Welcome to your dashboard")).toBeVisible();
    if (await invitationsHeading(page).first().isVisible().catch(() => false)) {
      await expect(invitationsHeading(page).first()).toBeVisible();
    }
  } else if (pathname.includes("/onboarding")) {
    const role = page.getByRole("heading", { name: "Choose your role" });
    const profileH2 = page.getByRole("heading", { name: "Athlete profile" });
    const profileForm = page.getByRole("heading", {
      name: "Create your athlete profile",
    });
    const connect = page.getByRole("heading", { name: "Connect as an athlete" });
    const connectChoice = page.getByRole("heading", {
      name: "How do you want to connect?",
    });
    const inviteH2 = page.getByRole("heading", { name: /^Invitations$/i });

    const matched =
      (await role.isVisible().catch(() => false)) ||
      (await profileH2.isVisible().catch(() => false)) ||
      (await profileForm.isVisible().catch(() => false)) ||
      (await connect.isVisible().catch(() => false)) ||
      (await connectChoice.isVisible().catch(() => false)) ||
      (await inviteH2.first().isVisible().catch(() => false));

    expect(
      matched,
      "expected a known athlete onboarding panel on /onboarding",
    ).toBe(true);
  } else {
    throw new Error(`Unexpected post-login path: ${pathname}`);
  }

  const shotPath = testInfo.outputPath("athlete-login-state-final.png");
  await page.screenshot({ path: shotPath, fullPage: true });
  await testInfo.attach("final", { path: shotPath, contentType: "image/png" });

  expect(
    [...consoleErrors, ...pageErrors],
    consoleErrors.concat(pageErrors).join("; "),
  ).toHaveLength(0);
});
