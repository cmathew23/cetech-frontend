import { expect, type Page } from "@playwright/test";

export async function fillMandatoryAthletePlanningProfileFields(page: Page) {
  await page.getByLabel(/^Date of Birth$/i).fill("1999-06-12");
  await page.getByLabel(/^Gender$/i).selectOption("MALE");
  await page.getByLabel(/^Height \(cm\)$/i).fill("175");
  await page.getByLabel(/^Weight \(kg\)$/i).fill("70");
  await page.getByLabel(/^Self-Reported Level$/i).selectOption("INTERMEDIATE");
  await page
    .getByLabel(/^Highest Competition Level Reached in the Past 12 Months$/i)
    .selectOption("DISTRICT");
  await page
    .getByLabel(
      /^Highest Ranking Achieved at That Level in the Past 12 Months$/i,
    )
    .fill("1");
  await page
    .getByLabel(/^How many years of training have you done so far\?$/i)
    .fill("1");
  await page
    .getByLabel(/^How many hours do you usually train per week\?$/i)
    .fill("5");
  await page
    .getByLabel(
      /^How many days are you generally available to train in a week\?$/i,
    )
    .fill("3");
  await page
    .getByLabel(
      /^How many hours in a week are you generally available for training\?$/i,
    )
    .fill("8");
  await page.getByLabel(/^Injury Status$/i).selectOption("HEALTHY");
  await page.getByLabel(/^Diet Type$/i).selectOption("OMNIVORE");
  await page.getByLabel("Open to all").check();
  await page.getByLabel("I do not have food allergies").check();
}

/**
 * If the athlete planning UI is in create mode, fills the mandatory fields and saves once (real POST).
 * If a profile already exists, does nothing.
 *
 * This guarantees a planning profile record exists for flows that need an existing profile.
 */
export async function ensureAthletePlanningProfileExists(page: Page) {
  await expect(
    page.getByText("Loading athlete profile planning…"),
  ).toHaveCount(0, { timeout: 45_000 });

  const saveProfile = page.getByRole("button", { name: "Save Profile" });
  if (!(await saveProfile.isVisible())) {
    return;
  }

  // Native <input type="date"> requires ISO yyyy-mm-dd (dd/mm is rejected by Playwright as malformed).
  await fillMandatoryAthletePlanningProfileFields(page);

  await saveProfile.click();

  await expect(
    page.getByText("Athlete profile planning saved."),
  ).toBeVisible({ timeout: 60_000 });

  await expect(
    page.getByRole("button", { name: "Edit Profile" }),
  ).toBeVisible({ timeout: 30_000 });
}
