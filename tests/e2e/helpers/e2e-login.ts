import { expect, type Locator, type Page } from "@playwright/test";

export function loginForm(page: Page) {
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

async function waitForNoLoadingOverlay(page: Page) {
  await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByText("Loading...")).toHaveCount(0, { timeout: 30_000 });
}

/**
 * Login via `/login` with 429 retry behavior (same as legacy `fresh-user-auth-flows`).
 */
export async function performLogin(
  page: Page,
  email: string,
  password: string,
): Promise<{ form: Locator; token: string | null }> {
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
      const delay = waitMsBeforeLoginRetry(
        loginRes.headers(),
        consecutive429 - 1,
      );
      // eslint-disable-next-line no-console
      console.log(
        `[e2e login] 429: waiting ${delay}ms before retry ${attempt}/${maxLoginAttempts - 1}`,
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
  if (!loginRes) {
    throw new Error("login response not received");
  }
  const loginStatus = loginRes.status();
  expect(
    loginStatus,
    loginStatus === 429
      ? `login API rate-limited (429) after ${maxLoginAttempts} attempts — run backend with NODE_ENV=development; see README`
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
  expect(hasLoginError, "no login error alert").toBe(false);

  await expect(page).not.toHaveURL(/\/login$/);

  const token = await page.evaluate(() => localStorage.getItem("token"));
  expect(token, "token in localStorage after login").toBeTruthy();

  await waitForNoLoadingOverlay(page);

  return { form, token };
}
