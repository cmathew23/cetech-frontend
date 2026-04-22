import type { ParsedOnboardingStatus } from "@/lib/onboarding-status";

/**
 * Dashboard path for a user's active onboarding role (server truth from GET /onboarding/status).
 * Used for post-login routing and onboarding COMPLETE redirect — single mapping for admin/coach/athlete.
 */
export function dashboardPathForActiveRole(role: string | null): string | null {
  if (role === "ACADEMY_ADMIN") return "/admin/dashboard";
  if (role === "COACH") return "/coach/dashboard";
  if (role === "ATHLETE") return "/athlete/dashboard";
  return null;
}

/**
 * Where to send the user immediately after successful POST /auth/login + GET /auth/me,
 * using GET /onboarding/status as the single source for "needs onboarding" vs "go to dashboard".
 *
 * Rules:
 * - Onboarding not COMPLETE (including `ACADEMY_SETUP_REQUIRED` for new academy admins) → `/onboarding` only.
 * - COMPLETE → dashboard for `activeOnboardingRole` from server; if missing, fall back to JWT role order.
 */
export function resolvePostLoginDestination(
  parsed: ParsedOnboardingStatus,
  jwtRoles: string[],
): string {
  if (parsed.onboardingStatus !== "COMPLETE") {
    return "/onboarding";
  }

  const fromServer = dashboardPathForActiveRole(parsed.activeOnboardingRole);
  if (fromServer) return fromServer;

  if (jwtRoles.includes("ACADEMY_ADMIN")) return "/admin/dashboard";
  if (jwtRoles.includes("COACH")) return "/coach/dashboard";
  if (jwtRoles.includes("ATHLETE")) return "/athlete/dashboard";

  return "/onboarding";
}
