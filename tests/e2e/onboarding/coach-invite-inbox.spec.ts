import { expect, test } from "@playwright/test";
import { E2E_CREDENTIALS } from "../fixtures/credentials";
import {
  accessContextMockBodies,
  onboardingMockBodies,
} from "../helpers/onboarding-mock-bodies";
import {
  mockAccessContextGet,
  unmockAccessContext,
} from "../helpers/access-context-route-mock";
import { performLogin } from "../helpers/e2e-login";
import {
  mockOnboardingGetStatus,
  unmockOnboardingRoutes,
} from "../helpers/onboarding-route-mock";

const coachWaitingInviteBody = {
  success: true,
  data: {
    isAuthenticated: true,
    availableRoles: ["ATHLETE", "COACH", "ACADEMY_ADMIN"],
    activeOnboardingRole: "COACH",
    hasAthleteProfile: false,
    hasCoachProfile: true,
    activeMembershipCount: 0,
    pendingInvitationCount: 1,
    onboardingStatus: "WAITING_FOR_INVITE",
    nextStep: "WAIT_FOR_INVITE",
  },
} as const;

test.describe("Coach invitation inbox (mocked onboarding)", () => {
  test.afterEach(async ({ page }) => {
    await unmockOnboardingRoutes(page);
    await unmockAccessContext(page);
  });

  test("login with coach invite phase lands on /coach/invitations", async ({
    page,
  }) => {
    await mockOnboardingGetStatus(page, coachWaitingInviteBody);
    await mockAccessContextGet(page, accessContextMockBodies.onboardingRequired);
    await performLogin(
      page,
      E2E_CREDENTIALS.coach.email,
      E2E_CREDENTIALS.coach.password,
    );
    await expect(page).toHaveURL(/\/coach\/invitations/);
    await expect(
      page.getByRole("heading", { name: /^invitations$/i }),
    ).toBeVisible();
  });

  test("athlete invite redirect unchanged (regression)", async ({ page }) => {
    await mockOnboardingGetStatus(page, {
      success: true,
      data: {
        ...onboardingMockBodies.roleSelection.data,
        activeOnboardingRole: "ATHLETE",
        hasAthleteProfile: false,
        hasCoachProfile: false,
        onboardingStatus: "WAITING_FOR_INVITE",
        nextStep: "SHOW_INVITES",
      },
    });
    await mockAccessContextGet(page, accessContextMockBodies.onboardingRequired);
    await performLogin(
      page,
      E2E_CREDENTIALS.athlete.email,
      E2E_CREDENTIALS.athlete.password,
    );
    await expect(page).toHaveURL(/\/athlete\/invitations/);
  });
});
