import { expect, test } from "@playwright/test";
import { loginAsPersistentUser } from "../helpers/persistent-users-login";

test("athlete planning: profile-planning route loads grouped APP shell", async ({
  page,
}) => {
  await loginAsPersistentUser(page, "athlete");
  await page.goto("/athlete/profile-planning");

  await expect(
    page.getByRole("heading", { name: "Athlete Profile Planning" }),
  ).toBeVisible({ timeout: 30_000 });

  await expect(
    page.getByText("Loading athlete profile planning…"),
  ).toHaveCount(0, { timeout: 45_000 });

  await expect(
    page.getByRole("heading", { name: "Planning Profile Form" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Athlete Context" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Nutrition Context" }),
  ).toBeVisible();
});
