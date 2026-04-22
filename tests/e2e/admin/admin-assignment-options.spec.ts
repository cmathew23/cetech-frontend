import { expect, test } from "@playwright/test";
import { CETECH_PERSISTENT_TEST_USERS } from "../fixtures/persistent-test-users";
import { loginAsPersistentUser } from "../helpers/persistent-users-login";

const ATHLETE_EMAIL = CETECH_PERSISTENT_TEST_USERS.athlete.email;
const COACH_EMAIL = CETECH_PERSISTENT_TEST_USERS.coach.email;

test("admin assignments: dropdowns include fixture athlete and coach emails", async ({
  page,
}) => {
  await loginAsPersistentUser(page, "admin");
  await page.goto("/admin/assignments");

  await expect(
    page.getByRole("heading", { name: "Assignments" }),
  ).toBeVisible({ timeout: 45_000 });

  const athleteSelect = page.locator("#assignment-athlete");
  const coachSelect = page.locator("#assignment-coach");

  await expect(athleteSelect).toBeEnabled({ timeout: 60_000 });
  await expect(coachSelect).toBeEnabled({ timeout: 60_000 });

  const athleteOptionTexts = await athleteSelect.locator("option").allTextContents();
  const coachOptionTexts = await coachSelect.locator("option").allTextContents();

  expect(
    athleteOptionTexts.some((t) => t.includes(ATHLETE_EMAIL)),
    `athlete dropdown should list ${ATHLETE_EMAIL}`,
  ).toBe(true);
  expect(
    coachOptionTexts.some((t) => t.includes(COACH_EMAIL)),
    `coach dropdown should list ${COACH_EMAIL}`,
  ).toBe(true);

  await expect(page.getByPlaceholder("Search assignments")).toBeEditable();
  await expect(page.getByLabel("Coach filter")).toBeEnabled();

  await athleteSelect.focus();
  await expect(athleteSelect).toBeFocused();
  await coachSelect.focus();
  await expect(coachSelect).toBeFocused();
});
