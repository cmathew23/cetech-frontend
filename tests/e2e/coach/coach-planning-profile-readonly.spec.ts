import { expect, test } from "@playwright/test";
import { CETECH_PERSISTENT_TEST_USERS } from "../fixtures/persistent-test-users";
import { loginAsPersistentUser } from "../helpers/persistent-users-login";

const ATHLETE_EMAIL = CETECH_PERSISTENT_TEST_USERS.athlete.email;

test("coach: read-only athlete planning profile for assigned athlete01", async ({
  page,
}) => {
  await loginAsPersistentUser(page, "coach");

  await expect(page).toHaveURL(/\/coach\/dashboard/, { timeout: 45_000 });
  await expect(
    page.getByRole("heading", { name: "Coach Dashboard" }),
  ).toBeVisible({ timeout: 20_000 });

  await expect(
    page.getByText("Loading assigned athletes…"),
  ).toHaveCount(0, { timeout: 30_000 });

  const athleteRow = page
    .locator("tbody tr")
    .filter({ hasText: ATHLETE_EMAIL });

  if ((await athleteRow.count()) === 0) {
    throw new Error(
      `Fixture/data-state: Expected an assigned-athletes row for ${ATHLETE_EMAIL} (athlete01 assigned to coach01) but none matched. Assigned-athlete rendering does not match expected fixture state.`,
    );
  }

  const row = athleteRow.first();
  const viewLink = row.getByRole("link", { name: "View" });
  const notAvailable = row.getByText("Not Available");

  if (await viewLink.isVisible()) {
    await viewLink.click();
  } else if (await notAvailable.isVisible()) {
    throw new Error(
      `Likely app/UI/data-propagation: ${ATHLETE_EMAIL} appears in Assigned athletes but Planning profile shows "Not Available" (no View). Expected a View link when the athlete has a planning profile and athleteId is present.`,
    );
  } else {
    throw new Error(
      `Test issue: Row for ${ATHLETE_EMAIL} has neither a View link nor "Not Available" in the planning column.`,
    );
  }

  await expect(page).toHaveURL(/\/coach\/athletes\/[^/]+\/planning-profile/, {
    timeout: 30_000,
  });

  await expect(
    page.getByRole("heading", { name: "Athlete Planning Profile" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByText("Read-only planning profile for assigned athlete."),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Athlete Planning Fields" }),
  ).toBeVisible({ timeout: 30_000 });

  await expect(page.getByRole("button", { name: "Save Changes" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("button", { name: "Save Profile" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Back to Dashboard" }),
  ).toBeVisible();
});
