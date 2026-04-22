import { expect, test } from "@playwright/test";
import { E2E_CREDENTIALS } from "./fixtures/credentials";

test("athlete invite phase shows invitation inbox (dashboard or onboarding)", async ({
  page,
}, testInfo) => {
  const { email, password } = E2E_CREDENTIALS.athlete;

  await page.goto("/login");

  const loginForm = page
    .locator("form")
    .filter({ has: page.getByLabel(/email/i) });

  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  const loginPost = page.waitForResponse(
    (r) =>
      r.url().includes("/auth/login") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: /sign in/i }).click();
  await loginPost;

  await expect(page).not.toHaveURL(/\/login$/);
  await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 30_000 });

  const path = new URL(page.url()).pathname;
  expect(
    path.startsWith("/athlete/dashboard") || path === "/onboarding",
    `expected /athlete/dashboard or /onboarding, got ${path}`,
  ).toBe(true);

  const invitationsHeading = page.getByRole("heading", { name: /^Invitations$/i });
  await expect(invitationsHeading.first()).toBeVisible({ timeout: 20_000 });

  await expect(
    page.getByRole("heading", { name: /waiting for invitation/i }),
  ).toHaveCount(0);

  const tokenBefore = await page.evaluate(() => localStorage.getItem("token"));
  const shot = testInfo.outputPath("athlete-invite-inbox-before-logout.png");
  await page.screenshot({ path: shot, fullPage: true });
  await testInfo.attach("invite-inbox", { path: shot, contentType: "image/png" });

  expect(tokenBefore, "token present while authenticated").toBeTruthy();
  await expect(loginForm.getByLabel(/email/i)).toBeHidden();
});
