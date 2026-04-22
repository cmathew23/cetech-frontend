import { expect, type Page } from "@playwright/test";
import { performLogin } from "./e2e-login";
import { CETECH_PERSISTENT_TEST_USERS } from "../fixtures/persistent-test-users";

export type PersistentRole = keyof typeof CETECH_PERSISTENT_TEST_USERS;

export async function loginAsPersistentUser(
  page: Page,
  role: PersistentRole,
) {
  const creds = CETECH_PERSISTENT_TEST_USERS[role];
  await performLogin(page, creds.email, creds.password);
}

/**
 * Waits for the URL to match, then checks it stays stable (guards against tight redirect loops).
 */
export async function assertUrlStableAfterSettling(
  page: Page,
  urlPredicate: (url: string) => boolean,
) {
  await expect(page).toHaveURL(
    (u: URL) => urlPredicate(u.toString()),
    { timeout: 45_000 },
  );
  const snapshot = page.url();
  await page.waitForTimeout(2500);
  expect(page.url(), "URL should remain stable (no redirect loop)").toBe(
    snapshot,
  );
  expect(urlPredicate(page.url()), "still on expected route").toBe(true);
}
