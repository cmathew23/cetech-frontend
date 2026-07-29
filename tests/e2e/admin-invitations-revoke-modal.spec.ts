import { expect, test } from "@playwright/test";
import { loginAsPersistentUser } from "./helpers/persistent-users-login";

function ok(data: unknown) {
  return { success: true, data };
}

test("admin invitation revoke uses the app confirmation modal", async ({ page }) => {
  await loginAsPersistentUser(page, "admin");

  let revokedInvitationId: string | null = null;
  let revokeRequestCount = 0;
  let releaseRevoke: () => void = () => {
    throw new Error("Revoke request was not intercepted");
  };
  let nativeDialogSeen = false;

  page.on("dialog", async (dialog) => {
    nativeDialogSeen = true;
    await dialog.dismiss();
  });

  await page.route(
    /\/entities\/invitations\/([^/]+)\/revoke$/,
    async (route) => {
      revokeRequestCount += 1;
      revokedInvitationId = new URL(route.request().url()).pathname.split("/").at(-2) ?? null;
      await new Promise<void>((resolve) => {
        releaseRevoke = resolve;
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok({})),
      });
    },
  );

  await page.route(/\/entities\/[^/]+\/invitations(?:\?.*)?$/, async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const invitations = [
      {
        id: "invitation-a",
        email: "first-pending@example.com",
        role: "ATHLETE",
        status: "PENDING",
        createdAt: "2026-07-29T08:00:00.000Z",
      },
      ...(revokedInvitationId === "invitation-b"
        ? []
        : [
            {
              id: "invitation-b",
              email: "selected-pending@example.com",
              role: "COACH",
              status: "PENDING",
              createdAt: "2026-07-29T08:01:00.000Z",
            },
          ]),
    ];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(ok(invitations)),
    });
  });

  await page.goto("/admin/invitations");

  const selectedRow = page
    .getByRole("row")
    .filter({ hasText: "selected-pending@example.com" });
  await selectedRow.getByRole("button", { name: "Revoke" }).click();

  const modal = page.getByRole("dialog", { name: "Revoke invitation" });
  await expect(modal).toBeVisible();
  await expect(
    modal.getByText(
      "Revoke this invitation? The invitee will no longer be able to accept it.",
    ),
  ).toBeVisible();
  expect(nativeDialogSeen).toBe(false);

  await modal.getByRole("button", { name: "Cancel" }).click();
  await expect(modal).toHaveCount(0);
  expect(revokeRequestCount).toBe(0);

  await selectedRow.getByRole("button", { name: "Revoke" }).click();
  await modal.getByRole("button", { name: "Revoke" }).click();
  await expect.poll(() => revokeRequestCount).toBe(1);
  const loadingRevokeButton = modal.getByRole("button", { name: "Loading..." });
  await expect(loadingRevokeButton).toBeDisabled();

  await loadingRevokeButton.evaluate((button: HTMLButtonElement) => button.click());
  expect(revokeRequestCount).toBe(1);
  expect(revokedInvitationId).toBe("invitation-b");

  releaseRevoke();

  await expect(modal).toHaveCount(0);
  await expect(page.getByText("selected-pending@example.com")).toHaveCount(0);
  await expect(page.getByText("first-pending@example.com")).toBeVisible();
});
