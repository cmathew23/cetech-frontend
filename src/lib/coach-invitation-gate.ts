/**
 * Coach invitation inbox access is governed by GET /me/app-context.
 * Legacy onboarding-derived invite phases are no longer routing owners.
 */

import {
  bootstrapCoachRequiresInvitationInbox,
  type AccessContextPayload,
} from "@/lib/accessContext";
import type { ParsedOnboardingStatus } from "@/lib/onboarding-status";

/** True when coach is in a phase where pending entity invitations should be actionable. */
export function coachInInviteOnboardingPhase(
  onboarding: ParsedOnboardingStatus | null,
): boolean {
  if (!onboarding || onboarding.activeOnboardingRole !== "COACH") {
    return false;
  }
  const pending =
    typeof onboarding.pendingInvitationCount === "number" &&
    onboarding.pendingInvitationCount > 0;
  return (
    pending ||
    onboarding.onboardingStatus === "INVITE_PENDING_ACTION" ||
    onboarding.onboardingStatus === "WAITING_FOR_INVITE" ||
    onboarding.nextStep === "WAIT_FOR_INVITE"
  );
}

export function allowCoachInvitationInboxRoute(
  pathname: string,
  jwtRoles: string[],
  onboardingData: ParsedOnboardingStatus | null,
  accessContext: AccessContextPayload | null = null,
): boolean {
  const path = pathname.trim() || "/";
  if (
    !path.startsWith("/coach/dashboard/invitations") &&
    !path.startsWith("/coach/invitations")
  ) {
    return false;
  }
  const isCoach =
    jwtRoles.includes("COACH") ||
    onboardingData?.activeOnboardingRole === "COACH";
  if (!isCoach) return false;
  return bootstrapCoachRequiresInvitationInbox(accessContext);
}
