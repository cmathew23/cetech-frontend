import { expect, type Page } from "@playwright/test";

/**
 * If the athlete planning UI is in create mode, fills minimal valid fields and saves once (real POST).
 * If a profile already exists, does nothing.
 *
 * This only guarantees a planning profile **record exists** for flows that need an existing profile.
 * It does **not** aim for completeness-valid derived planning status (eligibility / completeness /
 * missing-required-fields may still be INCOMPLETE or non-empty per backend rules).
 *
 * Some API builds reject many grouped keys on POST — the fill set stays intentionally small.
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
  await page.getByLabel(/^Date of Birth$/i).fill("1999-06-12");
  await page.getByLabel(/^Gender$/i).selectOption("MALE");

  // Keep create payload minimal: this API build rejects several grouped keys on POST
  // (e.g. trainingExposure.*, heightCm/weightKg) with "Unrecognized keys".

  await page.getByLabel(/^Diet Type$/i).selectOption("OMNIVORE");

  await saveProfile.click();

  await expect(
    page.getByText("Athlete profile planning saved."),
  ).toBeVisible({ timeout: 60_000 });

  await expect(
    page.getByRole("button", { name: "Edit Profile" }),
  ).toBeVisible({ timeout: 30_000 });
}
