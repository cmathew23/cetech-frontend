"use client";

import { getToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { shouldRedirectAcademyAdminFromAdminRoutes } from "@/lib/academy-admin-dashboard-eligibility";
import { allowCoachInvitationInboxRoute } from "@/lib/coach-invitation-gate";
import { MEMBERSHIP_INACTIVE_ROUTE } from "@/lib/apiClient";
import {
  bootstrapAthleteRequiresInvitationInbox,
  bootstrapRedirectsToMembershipInactive,
  bootstrapRequiresOnboardingResolution,
  type AccessContextPayload,
} from "@/lib/accessContext";
import type { ParsedOnboardingStatus } from "@/lib/onboarding-status";
import type { OnboardingStatusEnum } from "@/types/onboarding.types";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export type GuardRedirect =
  | "/login"
  | "/onboarding"
  | "/membership-inactive"
  | "/athlete/invitations"
  | null;

export type AuthGuardResult = {
  loading: boolean;
  allowed: boolean;
  redirectTo: GuardRedirect;
};

type ResolveGuardInput = {
  hasToken: boolean;
  isAuthenticated: boolean;
  authLoading: boolean;
  accessGateReady: boolean;
  onboardingLoading: boolean;
  onboardingStatus: OnboardingStatusEnum | null;
  /** Full GET /onboarding/status parse — required for ACADEMY_ADMIN academy-setup gating. */
  onboardingData: ParsedOnboardingStatus | null;
  jwtRoles: string[];
  accessContext: AccessContextPayload | null;
  pathname: string;
};

/**
 * Pure guard resolver for dashboard-style routes (used by `DashboardGate`).
 *
 * Must stay aligned with post-login routing in `@/lib/post-login-route` + `login/page.tsx`:
 * - Login uses GET /onboarding/status first; incomplete users go straight to `/onboarding` (no dashboard bounce).
 * - This guard enforces the same rule for direct URL hits: incomplete → `/onboarding`, never dashboards.
 *
 * Rules:
 * 1) No token or not authenticated → /login
 * 2) GET /me/app-context not ready → loading
 * 3) `MEMBERSHIP_REQUIRED` (typically COACH) → /membership-inactive — not ACADEMY_ADMIN or ATHLETE
 * 4) ATHLETE + `INVITATION_ACTION_REQUIRED` → /athlete/invitations when outside that route
 * 5) Profile / non-athlete invitation / admin or athlete membership resolution → /onboarding (except `/coach/invitations` when coach invite phase)
 * 6) Authenticated but onboardingStatus !== COMPLETE → /onboarding (coach invitation inbox exception)
 * 7) ACADEMY_ADMIN on /admin/* without completed academy setup (or missing trainingEntityId) → /onboarding
 * 8) COMPLETE → allow
 */
export function resolveAuthGuard(input: ResolveGuardInput): AuthGuardResult {
  const {
    hasToken,
    isAuthenticated,
    authLoading,
    accessGateReady,
    onboardingLoading,
    onboardingStatus,
    onboardingData,
    jwtRoles,
    accessContext,
    pathname,
  } = input;

  if (authLoading) {
    return { loading: true, allowed: false, redirectTo: null };
  }

  if (!hasToken || !isAuthenticated) {
    return { loading: false, allowed: false, redirectTo: "/login" };
  }

  if (!accessGateReady) {
    return { loading: true, allowed: false, redirectTo: null };
  }

  const path = pathname.trim() || "/";

  if (accessContext && bootstrapRedirectsToMembershipInactive(accessContext)) {
    if (
      path === MEMBERSHIP_INACTIVE_ROUTE ||
      path.startsWith(`${MEMBERSHIP_INACTIVE_ROUTE}/`)
    ) {
      return { loading: false, allowed: true, redirectTo: null };
    }
    return {
      loading: false,
      allowed: false,
      redirectTo: "/membership-inactive",
    };
  }

  if (accessContext && bootstrapAthleteRequiresInvitationInbox(accessContext)) {
    if (
      path === "/athlete/invitations" ||
      path.startsWith("/athlete/invitations/")
    ) {
      return { loading: false, allowed: true, redirectTo: null };
    }
    return {
      loading: false,
      allowed: false,
      redirectTo: "/athlete/invitations",
    };
  }

  if (onboardingLoading) {
    return { loading: true, allowed: false, redirectTo: null };
  }

  if (accessContext && bootstrapRequiresOnboardingResolution(accessContext)) {
    const onOnboardingPath =
      path === "/onboarding" || path.startsWith("/onboarding/");
    const coachInviteInbox = allowCoachInvitationInboxRoute(
      path,
      jwtRoles,
      onboardingData,
    );
    if (!onOnboardingPath && !coachInviteInbox) {
      return {
        loading: false,
        allowed: false,
        redirectTo: "/onboarding",
      };
    }
  }

  if (
    shouldRedirectAcademyAdminFromAdminRoutes(
      path,
      jwtRoles,
      onboardingData,
      accessContext,
    )
  ) {
    return { loading: false, allowed: false, redirectTo: "/onboarding" };
  }

  if (onboardingStatus !== "COMPLETE") {
    if (allowCoachInvitationInboxRoute(path, jwtRoles, onboardingData)) {
      return { loading: false, allowed: true, redirectTo: null };
    }
    return { loading: false, allowed: false, redirectTo: "/onboarding" };
  }

  return { loading: false, allowed: true, redirectTo: null };
}

/**
 * Minimal hook abstraction to gate protected routes/layouts with backend-driven state.
 * No API logic lives here: auth and onboarding data come from existing hooks.
 */
export function useAuthGuard({
  redirect = true,
}: {
  redirect?: boolean;
} = {}): AuthGuardResult {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isAuthenticated,
    loading: authLoading,
    accessContext,
    accessGateReady,
    roles: jwtRoles,
  } = useAuth();
  const {
    onboardingData,
    onboardingStatus,
    loading: onboardingLoading,
  } = useOnboarding();

  const result = resolveAuthGuard({
    hasToken: Boolean(getToken()),
    isAuthenticated,
    authLoading,
    accessGateReady,
    onboardingLoading,
    onboardingStatus,
    onboardingData,
    jwtRoles,
    accessContext: accessContext ?? null,
    pathname: pathname ?? "/",
  });

  useEffect(() => {
    if (!redirect || result.loading || !result.redirectTo) return;
    /** `replace` avoids stacking dashboard↔onboarding in history when fixing incomplete sessions. */
    router.replace(result.redirectTo);
  }, [redirect, result.loading, result.redirectTo, router]);

  return result;
}
