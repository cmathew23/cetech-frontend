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
  "Blood Report Parameters",
  "Body Composition Parameters",
  "Derived Planning Inputs",
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

  const renderedSectionOrder = await page
    .getByRole("heading", { level: 3 })
    .allTextContents();
  expect(
    renderedSectionOrder.filter((title) =>
      GROUPED_SECTION_TITLES.includes(
        title as (typeof GROUPED_SECTION_TITLES)[number],
      ),
    ),
  ).toEqual([...GROUPED_SECTION_TITLES]);

  await expect(
    page.getByRole("heading", { name: "Planning Profile Form", level: 3 }),
  ).toBeVisible();
});
