import { expect, test } from "@playwright/test";
import { loginAsPersistentUser } from "../helpers/persistent-users-login";

test("smoke: athlete dashboard and profile-planning load", async ({ page }) => {
  await loginAsPersistentUser(page, "athlete");
  await page.goto("/athlete/dashboard");
  await expect(
    page.getByRole("heading", { name: "Athlete Dashboard" }),
  ).toBeVisible({ timeout: 20_000 });
  await page.goto("/athlete/profile-planning");
  await expect(
    page.getByRole("heading", { name: "Athlete Profile Planning" }),
  ).toBeVisible({ timeout: 20_000 });
});

test("smoke: coach dashboard loads", async ({ page }) => {
  await loginAsPersistentUser(page, "coach");
  await page.goto("/coach/dashboard");
  await expect(
    page.getByRole("heading", { name: "Coach Dashboard" }),
  ).toBeVisible({ timeout: 20_000 });
});

test("smoke: admin dashboard and assignments load", async ({ page }) => {
  await loginAsPersistentUser(page, "admin");
  await page.goto("/admin/dashboard");
  await expect(
    page.getByRole("heading", { name: "Academy Admin Dashboard" }),
  ).toBeVisible({ timeout: 20_000 });
  await page.goto("/admin/assignments");
  await expect(
    page.getByRole("heading", { name: "Assignments" }),
  ).toBeVisible({ timeout: 30_000 });
});
