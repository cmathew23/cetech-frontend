import { expect, test } from "@playwright/test";
import { loginAsPersistentUser } from "../helpers/persistent-users-login";

test("academy admin: assignments workspace loads with selects", async ({
  page,
}) => {
  await loginAsPersistentUser(page, "admin");
  await page.goto("/admin/assignments");

  await expect(
    page.getByRole("heading", { name: "Assignments" }),
  ).toBeVisible({ timeout: 45_000 });

  await expect(page.locator("#assignment-athlete")).toBeVisible();
  await expect(page.locator("#assignment-coach")).toBeVisible();

  await expect(
    page.getByPlaceholder("Search assignments"),
  ).toBeVisible();
  await expect(page.getByLabel("Coach filter")).toBeVisible();
});
