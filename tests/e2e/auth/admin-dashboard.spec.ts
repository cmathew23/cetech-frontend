import { expect, test } from "@playwright/test";
import {
  assertUrlStableAfterSettling,
  loginAsPersistentUser,
} from "../helpers/persistent-users-login";

test("academy admin: login lands on admin dashboard and view is stable", async ({
  page,
}) => {
  await loginAsPersistentUser(page, "admin");

  await assertUrlStableAfterSettling(
    page,
    (u) => new URL(u).pathname.startsWith("/admin/dashboard"),
  );

  await expect(
    page.getByRole("heading", { name: "Academy Admin Dashboard" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByText("Manage members, invitations, and assignments."),
  ).toBeVisible();
});
