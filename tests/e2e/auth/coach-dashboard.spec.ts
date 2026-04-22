import { expect, test } from "@playwright/test";
import {
  assertUrlStableAfterSettling,
  loginAsPersistentUser,
} from "../helpers/persistent-users-login";

test("coach: login lands on coach dashboard and view is stable", async ({
  page,
}) => {
  await loginAsPersistentUser(page, "coach");

  await assertUrlStableAfterSettling(
    page,
    (u) => new URL(u).pathname.startsWith("/coach/dashboard"),
  );

  await expect(
    page.getByRole("heading", { name: "Coach Dashboard" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByText("Your academy context, release settings, and assigned athletes."),
  ).toBeVisible();
});
