import { expect, test } from "@playwright/test";
import { ensureAthletePlanningProfileExists } from "../helpers/athlete-planning-profile-ensure";
import { loginAsPersistentUser } from "../helpers/persistent-users-login";

test.describe.configure({ mode: "serial" });

test("APP: Phase 1 locked / read-only fields are not athlete-editable in edit mode", async ({
  page,
}) => {
  await loginAsPersistentUser(page, "athlete");
  await page.goto("/athlete/profile-planning");

  await ensureAthletePlanningProfileExists(page);

  await page.getByRole("button", { name: "Edit Profile" }).click();

  // Primary Sport: coach/backend-sourced; input stays disabled in APP (LOCKED_FIELDS).
  await expect(page.getByLabel(/^Primary Sport$/i)).toBeDisabled();

  // Validated Level: rendered as read-only copy, not a text input (no editable control).
  await expect(
    page.getByRole("textbox", { name: /^Validated Level$/i }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Sport Context", level: 3 }),
  ).toBeVisible();
  await expect(page.getByText(/^Validated Level$/).first()).toBeVisible();

  // Wearables MVP: fixed copy, not an ingestion workflow.
  await expect(page.getByText("Wearable Status: No")).toBeVisible();

  // Derived planning status: badges / copy, not athlete-editable scalar inputs here.
  await expect(
    page.getByRole("heading", { name: "Derived Planning Inputs", level: 3 }),
  ).toBeVisible();
  await expect(page.getByText("Planning Eligibility:")).toBeVisible();
  await expect(page.getByText("Planning Input Completeness:")).toBeVisible();
});
