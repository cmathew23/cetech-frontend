import { expect, test } from "@playwright/test";
import { ensureAthletePlanningProfileExists } from "../helpers/athlete-planning-profile-ensure";
import { loginAsPersistentUser } from "../helpers/persistent-users-login";

/** Grouped APP card titles (Phase 1 `SECTION_ORDER` in AthleteProfilePlanningPageContent). */
const GROUPED_SECTION_TITLES = [
  "Athlete Context",
  "Sport Context",
  "Sport Performance",
  "Training Exposure",
  "Health Status",
  "Nutrition Context",
  "Wearables",
  "Derived Planning Inputs",
  "Blood Report Parameters",
  "Body Composition Parameters",
] as const;

test.describe.configure({ mode: "serial" });

test("APP: grouped section headings visible after profile exists", async ({
  page,
}) => {
  await loginAsPersistentUser(page, "athlete");
  await page.goto("/athlete/profile-planning");

  await ensureAthletePlanningProfileExists(page);

  for (const title of GROUPED_SECTION_TITLES) {
    await expect(
      page.getByRole("heading", { name: title, level: 3 }),
    ).toBeVisible({ timeout: 30_000 });
  }

  await expect(
    page.getByRole("heading", { name: "Planning Profile Form", level: 3 }),
  ).toBeVisible();
});
