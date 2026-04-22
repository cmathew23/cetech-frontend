import { expect, test } from "@playwright/test";

type MockInvitation = {
  id: string;
  entityName: string;
  role: string;
  status: string;
  createdAt: string;
  invitedByEmail?: string;
};

type OnboardingStatusPayload = {
  onboardingStatus:
    | "INVITE_PENDING_ACTION"
    | "WAITING_FOR_INVITE"
    | "COMPLETE";
  nextStep: "SHOW_INVITES" | "WAIT_FOR_INVITE" | "GO_TO_DASHBOARD";
};

async function mockAuthenticatedAthleteContext(
  page: Parameters<typeof test>[0]["page"],
  opts: {
    onboardingStatus: OnboardingStatusPayload;
    invitations: MockInvitation[];
    invitationsLoadError?: { status: number; message: string };
    acceptError?: { status: number; message: string };
    declineError?: { status: number; message: string };
    onAcceptStatus?: OnboardingStatusPayload;
    onDeclineStatus?: OnboardingStatusPayload;
  },
) {
  await page.addInitScript(() => {
    localStorage.setItem("token", "e2e-athlete-token");
  });

  let currentStatus = opts.onboardingStatus;
  let invitations = [...opts.invitations];
  let activeMembershipCount = 0;

  await page.route("**/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          userId: "athlete-user-1",
          roles: ["ATHLETE"],
        },
      }),
    });
  });

  await page.route("**/onboarding/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          isAuthenticated: true,
          availableRoles: ["ATHLETE"],
          activeOnboardingRole: "ATHLETE",
          hasAthleteProfile: true,
          hasCoachProfile: false,
          activeMembershipCount,
          pendingInvitationCount: invitations.filter(
            (i) => i.status.trim().toUpperCase() === "PENDING",
          ).length,
          onboardingStatus: currentStatus.onboardingStatus,
          nextStep: currentStatus.nextStep,
        },
      }),
    });
  });

  await page.route("**/entities/invitations/me", async (route) => {
    if (opts.invitationsLoadError) {
      await route.fulfill({
        status: opts.invitationsLoadError.status,
        contentType: "application/json",
        body: JSON.stringify({ message: opts.invitationsLoadError.message }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: invitations,
      }),
    });
  });

  await page.route("**/entities/invitations/*/accept", async (route) => {
    if (opts.acceptError) {
      await route.fulfill({
        status: opts.acceptError.status,
        contentType: "application/json",
        body: JSON.stringify({ message: opts.acceptError.message }),
      });
      return;
    }
    const url = route.request().url();
    const id = url.match(/\/entities\/invitations\/([^/]+)\/accept$/)?.[1];
    if (id) {
      invitations = invitations.filter((inv) => inv.id !== id);
    }
    if (opts.onAcceptStatus) {
      currentStatus = opts.onAcceptStatus;
      activeMembershipCount = 1;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: {} }),
    });
  });

  await page.route("**/entities/invitations/*/decline", async (route) => {
    if (opts.declineError) {
      await route.fulfill({
        status: opts.declineError.status,
        contentType: "application/json",
        body: JSON.stringify({ message: opts.declineError.message }),
      });
      return;
    }
    const url = route.request().url();
    const id = url.match(/\/entities\/invitations\/([^/]+)\/decline$/)?.[1];
    if (id) {
      invitations = invitations.filter((inv) => inv.id !== id);
    }
    if (opts.onDeclineStatus) {
      currentStatus = opts.onDeclineStatus;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: {} }),
    });
  });
}

const sampleInvitation: MockInvitation = {
  id: "inv-1",
  entityName: "Peakflow Academy",
  role: "ATHLETE",
  status: "PENDING",
  createdAt: "2026-04-08T10:00:00.000Z",
  invitedByEmail: "admin@peakflow.test",
};

test("invitation inbox lists pending invitation metadata on athlete invitations page", async ({
  page,
}) => {
  await mockAuthenticatedAthleteContext(page, {
    onboardingStatus: {
      onboardingStatus: "INVITE_PENDING_ACTION",
      nextStep: "SHOW_INVITES",
    },
    invitations: [sampleInvitation],
  });

  await page.goto("/athlete/dashboard");
  await expect(page).toHaveURL(/\/athlete\/invitations/);
  await expect(page.getByRole("heading", { name: "Athlete Dashboard" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Pending Invitations" }),
  ).toBeVisible();
  await expect(page.getByText("Peakflow Academy")).toBeVisible();
  await expect(page.getByText("Role: ATHLETE")).toBeVisible();
  await expect(page.getByText("PENDING")).toBeVisible();
  await expect(page.getByText(/Invited:/)).toBeVisible();
});

test("invite phase shows inbox on athlete dashboard not passive waiting copy", async ({
  page,
}) => {
  await mockAuthenticatedAthleteContext(page, {
    onboardingStatus: {
      onboardingStatus: "WAITING_FOR_INVITE",
      nextStep: "WAIT_FOR_INVITE",
    },
    invitations: [sampleInvitation],
  });

  await page.goto("/athlete/dashboard");
  await expect(page).toHaveURL(/\/athlete\/invitations/);
  await expect(
    page.getByRole("heading", { name: "Pending Invitations" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Waiting for invitation" }),
  ).toHaveCount(0);
});

test("accept success shows toast and clears pending row", async ({ page }) => {
  await mockAuthenticatedAthleteContext(page, {
    onboardingStatus: {
      onboardingStatus: "INVITE_PENDING_ACTION",
      nextStep: "SHOW_INVITES",
    },
    invitations: [sampleInvitation],
    onAcceptStatus: {
      onboardingStatus: "COMPLETE",
      nextStep: "GO_TO_DASHBOARD",
    },
  });

  await page.goto("/athlete/invitations");
  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByText("Invitation accepted.")).toBeVisible();
  await expect(page).toHaveURL(/\/athlete\/dashboard/);
});

test("decline success shows toast and empty list", async ({ page }) => {
  await mockAuthenticatedAthleteContext(page, {
    onboardingStatus: {
      onboardingStatus: "WAITING_FOR_INVITE",
      nextStep: "WAIT_FOR_INVITE",
    },
    invitations: [sampleInvitation],
    onDeclineStatus: {
      onboardingStatus: "WAITING_FOR_INVITE",
      nextStep: "WAIT_FOR_INVITE",
    },
  });

  await page.goto("/athlete/invitations");
  await page.getByRole("button", { name: "Decline" }).click();
  await expect(page.getByText("Invitation declined.")).toBeVisible();
  await expect(
    page.getByText("There are no invitations currently."),
  ).toBeVisible();
});

test("empty inbox copy when no invitations", async ({ page }) => {
  await mockAuthenticatedAthleteContext(page, {
    onboardingStatus: {
      onboardingStatus: "WAITING_FOR_INVITE",
      nextStep: "WAIT_FOR_INVITE",
    },
    invitations: [],
  });

  await page.goto("/athlete/dashboard");
  await expect(page).toHaveURL(/\/athlete\/invitations/);
  await expect(
    page.getByText("There are no invitations currently."),
  ).toBeVisible();
});

test("load failure shows invitations error alert", async ({ page }) => {
  await mockAuthenticatedAthleteContext(page, {
    onboardingStatus: {
      onboardingStatus: "WAITING_FOR_INVITE",
      nextStep: "WAIT_FOR_INVITE",
    },
    invitations: [],
    invitationsLoadError: {
      status: 500,
      message: "server boom",
    },
  });

  await page.goto("/athlete/dashboard");
  await expect(page).toHaveURL(/\/athlete\/invitations/);
  const alert = page
    .getByRole("alert")
    .filter({ hasText: /invitations|server boom|Could not load/i });
  await expect(alert.first()).toBeVisible();
});

test("accept API error surfaces in inbox alert", async ({ page }) => {
  await mockAuthenticatedAthleteContext(page, {
    onboardingStatus: {
      onboardingStatus: "INVITE_PENDING_ACTION",
      nextStep: "SHOW_INVITES",
    },
    invitations: [sampleInvitation],
    acceptError: {
      status: 400,
      message: "Invitation cannot be accepted",
    },
  });

  await page.goto("/athlete/invitations");
  await page.getByRole("button", { name: "Accept" }).click();
  await expect(
    page.getByText("Invitation cannot be accepted"),
  ).toBeVisible();
});
