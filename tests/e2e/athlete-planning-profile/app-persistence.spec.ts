import { expect, test } from "@playwright/test";
import { installAthletePlanningProfileMeGetPatchMock } from "../helpers/app-planning-profile-me-mock";
import { ensureAthletePlanningProfileExists } from "../helpers/athlete-planning-profile-ensure";
import { loginAsPersistentUser } from "../helpers/persistent-users-login";

const DISCIPLINE_LABEL = /^Discipline \/ Event$/i;
const PERSIST_MARKER = " ·e2e-persist";

test.describe.configure({ mode: "serial" });

test("athlete planning: Discipline / Event survives reload (GET/PATCH mocked)", async ({
  page,
}) => {
  await loginAsPersistentUser(page, "athlete");
  await page.goto("/athlete/profile-planning");

  await ensureAthletePlanningProfileExists(page);

  await installAthletePlanningProfileMeGetPatchMock(page);
  await page.reload();

  await expect(
    page.getByText("Loading athlete profile planning…"),
  ).toHaveCount(0, { timeout: 45_000 });

  if (await page.getByRole("button", { name: "Edit Profile" }).isVisible()) {
    await page.getByRole("button", { name: "Edit Profile" }).click();
  }

  const discipline = page.getByLabel(DISCIPLINE_LABEL);
  await expect(discipline).toBeVisible({ timeout: 15_000 });

  const original = await discipline.inputValue();
  const persisted =
    original.includes(PERSIST_MARKER) ? original : `${original}${PERSIST_MARKER}`;

  await discipline.fill(persisted);
  await page.getByRole("button", { name: "Save Changes" }).click();

  await expect(
    page.getByText(
      /Athlete profile planning (updated|saved)\.|No changes to save/,
    ),
  ).toBeVisible({ timeout: 45_000 });

  await page.reload();

  await expect(
    page.getByText("Loading athlete profile planning…"),
  ).toHaveCount(0, { timeout: 45_000 });

  if (await page.getByRole("button", { name: "Edit Profile" }).isVisible()) {
    await page.getByRole("button", { name: "Edit Profile" }).click();
  }

  await expect(page.getByLabel(DISCIPLINE_LABEL)).toHaveValue(persisted);

  await page.getByLabel(DISCIPLINE_LABEL).fill(original);
  await page.getByRole("button", { name: "Save Changes" }).click();

  await expect(
    page.getByText(
      /Athlete profile planning (updated|saved)\.|No changes to save/,
    ),
  ).toBeVisible({ timeout: 45_000 });
});
