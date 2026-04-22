import { expect, test } from "@playwright/test";
import {
  assertUrlStableAfterSettling,
  loginAsPersistentUser,
} from "../helpers/persistent-users-login";

test("athlete: login lands on athlete dashboard and view is stable", async ({
  page,
}) => {
  await loginAsPersistentUser(page, "athlete");

  await assertUrlStableAfterSettling(
    page,
    (u) => new URL(u).pathname.startsWith("/athlete/dashboard"),
  );

  await expect(
    page.getByRole("heading", { name: "Athlete Dashboard" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByRole("navigation", { name: "Athlete sidebar" }),
  ).toBeVisible();
});
