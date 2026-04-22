import { expect, type Page } from "@playwright/test";

export async function expectAcademyAdminDashboard(page: Page) {
  await expect(page).toHaveURL(/\/admin\/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Academy Admin Dashboard" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Welcome to your dashboard")).toBeVisible();
}

export async function expectCoachDashboard(page: Page) {
  await expect(page).toHaveURL(/\/coach\/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Coach Dashboard" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Welcome to your dashboard")).toBeVisible();
}

export async function expectAthleteDashboard(page: Page) {
  await expect(page).toHaveURL(/\/athlete\/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Athlete Dashboard" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Welcome to your dashboard")).toBeVisible();
}
