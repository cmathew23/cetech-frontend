/**
 * Coach invitation inbox must be reachable before onboarding COMPLETE (mirrors /athlete/invitations).
 * DashboardGate uses this to allow `/coach/invitations` while onboarding is still in invite-related phases.
 */

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
): boolean {
  const path = pathname.trim() || "/";
  if (!path.startsWith("/coach/invitations")) return false;
  const isCoach =
    jwtRoles.includes("COACH") ||
    onboardingData?.activeOnboardingRole === "COACH";
  if (!isCoach) return false;
  return coachInInviteOnboardingPhase(onboardingData);
}
