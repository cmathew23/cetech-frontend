import { expect, test } from "@playwright/test";
import { loginAsPersistentUser } from "../helpers/persistent-users-login";

test("academy admin: dashboard overview loads", async ({ page }) => {
  await loginAsPersistentUser(page, "admin");

  await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 45_000 });

  await expect(
    page.getByRole("heading", { name: "Academy Admin Dashboard" }),
  ).toBeVisible({ timeout: 20_000 });

  await expect(
    page.getByRole("heading", { name: "Summary", exact: true }),
  ).toBeVisible();
});
