/**
 * Single place for "may an ACADEMY_ADMIN use /admin/*?" decisions.
 * Aligns with backend: setup via POST /onboarding/academy-setup only; no client bootstrap.
 */

import type { AccessContextPayload } from "@/lib/accessContext";
import type { ParsedOnboardingStatus } from "@/lib/onboarding-status";

export function isAcademyAdminContext(
  jwtRoles: string[],
  onboarding: ParsedOnboardingStatus | null,
): boolean {
  return (
    jwtRoles.includes("ACADEMY_ADMIN") ||
    onboarding?.activeOnboardingRole === "ACADEMY_ADMIN"
  );
}

/**
 * When true, `/admin/*` must redirect to `/onboarding` (academy setup or generic onboarding).
 * Call only when auth + access gate are ready and onboarding status has been fetched.
 */
export function shouldRedirectAcademyAdminFromAdminRoutes(
  pathname: string,
  jwtRoles: string[],
  onboardingData: ParsedOnboardingStatus | null,
  accessContext: AccessContextPayload | null | undefined,
): boolean {
  const path = pathname.trim() || "/";
  if (!path.startsWith("/admin")) return false;
  if (!isAcademyAdminContext(jwtRoles, onboardingData)) return false;
  /** Status not loaded yet or fetch failed — block admin routes only for academy admins. */
  if (!onboardingData) {
    return isAcademyAdminContext(jwtRoles, null);
  }

  if (onboardingData.onboardingStatus === "ACADEMY_SETUP_REQUIRED") {
    return true;
  }

  if (onboardingData.onboardingStatus !== "COMPLETE") {
    return false;
  }

  if (!accessContext) return false;

  if (
    !accessContext.access.canAccessDashboard &&
    accessContext.access.reasonCode === "PROFILE_REQUIRED"
  ) {
    return true;
  }

  const entityId = accessContext.academy.trainingEntityId?.trim() ?? "";
  if (entityId === "") return true;

  return false;
}
