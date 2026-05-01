/**
 * GET /me/app-context — bootstrap payload (user, academy, invitation, access, coachSummary, assignedCoaches).
 * Parse only fields returned by the backend; use `access.canAccessDashboard` + `access.reasonCode` for gating.
 */

import { paths } from "@/config/endpoints";
import { apiRequest, MEMBERSHIP_INACTIVE_ROUTE } from "@/lib/apiClient";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";

export type AppContextUser = {
  userId: string;
  roles: string[];
};

export type AppContextAcademy = {
  hasMembership: boolean;
  membershipStatus: string;
  trainingEntityId: string | null;
  trainingEntityName: string | null;
};

export type AppContextInvitation = {
  hasPendingInvitation: boolean;
  pendingInvitationCount: number;
};

/** Allowed `access.reasonCode` values from GET /me/app-context (backend contract). */
export type AppContextReasonCode =
  | "READY"
  | "WAIT_FOR_INVITATION"
  | "PROFILE_REQUIRED"
  | "INVITATION_ACTION_REQUIRED"
  | "MEMBERSHIP_REQUIRED"
  | "ACCESS_DENIED";

export const INVITATION_REQUIRED_ROUTE = "/access/invitation-required";
export const ATHLETE_INVITATION_ROUTE = "/athlete/dashboard/invitations";
export const COACH_INVITATION_ROUTE = "/coach/dashboard/invitations";

export type AppContextAccess = {
  canAccessDashboard: boolean;
  dashboardType: string;
  reasonCode: string;
};

export type AppContextCoachSummary = {
  assignedAthleteCount: number;
};

/** Coach row from `assignedCoaches` on GET /me/app-context (athlete-facing). */
export type AppContextAssignedCoach = {
  coachId: string;
  coachName: string;
  coachRole: string;
  coachFunction: string;
  email: string;
  phone: string | null;
  trainingEntityId: string;
  trainingEntityName: string;
  status: string;
};

/** Normalized GET /me/app-context `data` object (after `{ success, data }` unwrap). */
export type AccessContextPayload = {
  user: AppContextUser;
  activeRole: string | null;
  academy: AppContextAcademy;
  invitation: AppContextInvitation;
  access: AppContextAccess;
  coachSummary: AppContextCoachSummary;
  assignedCoaches: AppContextAssignedCoach[];
};

function normalizedDashboardType(
  access: AccessContextPayload | null | undefined,
): string {
  return access?.access.dashboardType.trim() ?? "";
}

export function appContextUsesStrictInvitationGate(
  access: AccessContextPayload | null | undefined,
): boolean {
  const dashboardType = normalizedDashboardType(access);
  return dashboardType === "ATHLETE" || dashboardType === "COACH";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parseUser(raw: unknown): AppContextUser {
  const o = asRecord(raw);
  if (!o) return { userId: "", roles: [] };
  const userId = typeof o.userId === "string" ? o.userId.trim() : "";
  const roles = Array.isArray(o.roles)
    ? o.roles.filter((x): x is string => typeof x === "string")
    : [];
  return { userId, roles };
}

function parseAcademy(raw: unknown): AppContextAcademy {
  const o = asRecord(raw);
  if (!o) {
    return {
      hasMembership: false,
      membershipStatus: "",
      trainingEntityId: null,
      trainingEntityName: null,
    };
  }
  const trainingEntityId =
    o.trainingEntityId === null
      ? null
      : typeof o.trainingEntityId === "string"
        ? o.trainingEntityId.trim()
        : null;
  const trainingEntityName =
    o.trainingEntityName === null
      ? null
      : typeof o.trainingEntityName === "string"
        ? o.trainingEntityName.trim()
        : null;
  return {
    hasMembership: o.hasMembership === true,
    membershipStatus:
      typeof o.membershipStatus === "string" ? o.membershipStatus.trim() : "",
    trainingEntityId: trainingEntityId === "" ? null : trainingEntityId,
    trainingEntityName: trainingEntityName === "" ? null : trainingEntityName,
  };
}

function parseInvitation(raw: unknown): AppContextInvitation {
  const o = asRecord(raw);
  if (!o) {
    return { hasPendingInvitation: false, pendingInvitationCount: 0 };
  }
  const count = o.pendingInvitationCount;
  return {
    hasPendingInvitation: o.hasPendingInvitation === true,
    pendingInvitationCount:
      typeof count === "number" && Number.isFinite(count) ? Math.max(0, count) : 0,
  };
}

function parseAccess(raw: unknown): AppContextAccess {
  const o = asRecord(raw);
  if (!o) {
    return { canAccessDashboard: false, dashboardType: "", reasonCode: "" };
  }
  return {
    canAccessDashboard: o.canAccessDashboard === true,
    dashboardType:
      typeof o.dashboardType === "string" ? o.dashboardType.trim() : "",
    reasonCode: typeof o.reasonCode === "string" ? o.reasonCode.trim() : "",
  };
}

function parseCoachSummary(raw: unknown): AppContextCoachSummary {
  const o = asRecord(raw);
  if (!o) return { assignedAthleteCount: 0 };
  const n = o.assignedAthleteCount;
  return {
    assignedAthleteCount:
      typeof n === "number" && Number.isFinite(n) ? Math.max(0, n) : 0,
  };
}

function readOptionalPhone(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const t = value.trim();
    return t === "" ? null : t;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function parseAssignedCoachRow(raw: unknown): AppContextAssignedCoach | null {
  const o = asRecord(raw);
  if (!o) return null;
  const coachId = typeof o.coachId === "string" ? o.coachId.trim() : "";
  const coachName = typeof o.coachName === "string" ? o.coachName.trim() : "";
  const coachRole = typeof o.coachRole === "string" ? o.coachRole.trim() : "";
  const coachFunction =
    typeof o.coachFunction === "string" ? o.coachFunction.trim() : "";
  const email = typeof o.email === "string" ? o.email.trim() : "";
  const phone = readOptionalPhone(o.phone);
  const trainingEntityId =
    typeof o.trainingEntityId === "string" ? o.trainingEntityId.trim() : "";
  const trainingEntityName =
    typeof o.trainingEntityName === "string" ? o.trainingEntityName.trim() : "";
  const status = typeof o.status === "string" ? o.status.trim() : "";
  if (
    coachId === "" &&
    coachName === "" &&
    email === "" &&
    trainingEntityId === ""
  ) {
    return null;
  }
  return {
    coachId,
    coachName,
    coachRole,
    coachFunction,
    email,
    phone,
    trainingEntityId,
    trainingEntityName,
    status,
  };
}

function parseAssignedCoaches(raw: unknown): AppContextAssignedCoach[] {
  if (!Array.isArray(raw)) return [];
  return raw.reduce<AppContextAssignedCoach[]>((acc, item) => {
    const row = parseAssignedCoachRow(item);
    if (row !== null) acc.push(row);
    return acc;
  }, []);
}

/**
 * Coach with MEMBERSHIP_REQUIRED → `/membership-inactive`.
 * ACADEMY_ADMIN and ATHLETE use onboarding / invitation resolution instead (not this route).
 */
export function bootstrapRedirectsToMembershipInactive(
  access: AccessContextPayload | null | undefined,
): boolean {
  if (!access) return false;
  const a = access.access;
  if (a.canAccessDashboard || a.reasonCode !== "MEMBERSHIP_REQUIRED") {
    return false;
  }
  const t = a.dashboardType.trim();
  return t !== "ACADEMY_ADMIN" && t !== "ATHLETE";
}

/**
 * Strict blocked-access state from GET /me/app-context.
 * Frontend must not reinterpret invitation truth when backend says WAIT_FOR_INVITATION.
 */
export function bootstrapRequiresInvitationRequiredRoute(
  access: AccessContextPayload | null | undefined,
): boolean {
  if (!access) return false;
  const a = access.access;
  return (
    !a.canAccessDashboard &&
    appContextUsesStrictInvitationGate(access) &&
    a.reasonCode === "WAIT_FOR_INVITATION"
  );
}

/**
 * Academy admin without org membership — backend signals setup via onboarding (not generic inactive page).
 */
export function bootstrapAcademyAdminMembershipSetupRequired(
  access: AccessContextPayload | null | undefined,
): boolean {
  if (!access) return false;
  const a = access.access;
  return (
    !a.canAccessDashboard &&
    a.dashboardType === "ACADEMY_ADMIN" &&
    a.reasonCode === "MEMBERSHIP_REQUIRED"
  );
}

/**
 * When onboarding is COMPLETE and access allows, dashboard URL from `dashboardType` + READY (honors backend priority).
 */
export function dashboardPathFromAppContextWhenReady(
  access: AccessContextPayload | null | undefined,
): string | null {
  if (!access?.access.canAccessDashboard) return null;
  if (access.access.reasonCode !== "READY") return null;
  const t = access.access.dashboardType.trim();
  if (t === "ACADEMY_ADMIN") return "/admin/dashboard";
  if (t === "COACH") return "/coach/dashboard";
  if (t === "ATHLETE") return "/athlete/dashboard";
  return null;
}

/** Profile / onboarding completion required before dashboard. */
export function bootstrapRequiresOnboardingRoute(
  access: AccessContextPayload | null | undefined,
): boolean {
  if (!access) return false;
  const a = access.access;
  return !a.canAccessDashboard && a.reasonCode === "PROFILE_REQUIRED";
}

/**
 * Invitation-action routes live inside the role dashboard shell.
 */
export function dashboardInvitationActionRoute(
  access: AccessContextPayload | null | undefined,
): string | null {
  if (!access) return null;
  const a = access.access;
  if (a.canAccessDashboard || a.reasonCode !== "INVITATION_ACTION_REQUIRED") {
    return null;
  }
  const dashboardType = normalizedDashboardType(access);
  if (dashboardType === "ATHLETE") return ATHLETE_INVITATION_ROUTE;
  if (dashboardType === "COACH") return COACH_INVITATION_ROUTE;
  return null;
}

/** ATHLETE + INVITATION_ACTION_REQUIRED → existing athlete invitation inbox. */
export function bootstrapAthleteRequiresInvitationInbox(
  access: AccessContextPayload | null | undefined,
): boolean {
  return dashboardInvitationActionRoute(access) === ATHLETE_INVITATION_ROUTE;
}

/** COACH + INVITATION_ACTION_REQUIRED → existing coach invitation inbox. */
export function bootstrapCoachRequiresInvitationInbox(
  access: AccessContextPayload | null | undefined,
): boolean {
  return dashboardInvitationActionRoute(access) === COACH_INVITATION_ROUTE;
}

/** ATHLETE + MEMBERSHIP_REQUIRED → resolve via onboarding (membership / entity flow), not generic inactive. */
export function bootstrapAthleteMembershipResolutionRequired(
  access: AccessContextPayload | null | undefined,
): boolean {
  if (!access) return false;
  const a = access.access;
  return (
    !a.canAccessDashboard &&
    a.dashboardType.trim() === "ATHLETE" &&
    a.reasonCode === "MEMBERSHIP_REQUIRED"
  );
}

/** Any bootstrap state that should resolve via `/onboarding` (profile, admin or athlete membership setup). */
export function bootstrapRequiresOnboardingResolution(
  access: AccessContextPayload | null | undefined,
): boolean {
  return (
    bootstrapRequiresOnboardingRoute(access) ||
    bootstrapAcademyAdminMembershipSetupRequired(access) ||
    bootstrapAthleteMembershipResolutionRequired(access)
  );
}

/** Dashboard subtree access is fully owned by app-context for hardened coach/athlete flows. */
export function appContextOwnsDashboardGate(
  access: AccessContextPayload | null | undefined,
): boolean {
  if (!access) return false;
  return (
    appContextUsesStrictInvitationGate(access) &&
    [
      "READY",
      "WAIT_FOR_INVITATION",
      "INVITATION_ACTION_REQUIRED",
      "PROFILE_REQUIRED",
      "MEMBERSHIP_REQUIRED",
    ].includes(access.access.reasonCode)
  );
}

/** Top-level route dictated by GET /me/app-context when backend has a concrete answer. */
export function routeFromAccessContext(
  access: AccessContextPayload | null | undefined,
): string | null {
  if (!access) return null;
  if (bootstrapRequiresInvitationRequiredRoute(access)) {
    return INVITATION_REQUIRED_ROUTE;
  }
  const invitationActionRoute = dashboardInvitationActionRoute(access);
  if (invitationActionRoute) {
    return invitationActionRoute;
  }
  if (bootstrapRedirectsToMembershipInactive(access)) {
    return MEMBERSHIP_INACTIVE_ROUTE;
  }
  if (bootstrapRequiresOnboardingResolution(access)) {
    return "/onboarding";
  }
  return dashboardPathFromAppContextWhenReady(access);
}

/**
 * Normalizes GET /me/app-context `data` after `adaptBackendSuccess` unwrap.
 */
export function parseAccessContextPayload(data: unknown): AccessContextPayload {
  const o = asRecord(data);
  if (!o) {
    return {
      user: { userId: "", roles: [] },
      activeRole: null,
      academy: {
        hasMembership: false,
        membershipStatus: "",
        trainingEntityId: null,
        trainingEntityName: null,
      },
      invitation: { hasPendingInvitation: false, pendingInvitationCount: 0 },
      access: {
        canAccessDashboard: false,
        dashboardType: "",
        reasonCode: "",
      },
      coachSummary: { assignedAthleteCount: 0 },
      assignedCoaches: [],
    };
  }

  const activeRaw = o.activeRole;
  const activeRole =
    activeRaw === null || activeRaw === undefined
      ? null
      : typeof activeRaw === "string" && activeRaw.trim() !== ""
        ? activeRaw.trim()
        : null;

  return {
    user: parseUser(o.user),
    activeRole,
    academy: parseAcademy(o.academy),
    invitation: parseInvitation(o.invitation),
    access: parseAccess(o.access),
    coachSummary: parseCoachSummary(o.coachSummary),
    assignedCoaches: parseAssignedCoaches(o.assignedCoaches),
  };
}

export async function fetchAccessContext(): Promise<AccessContextPayload> {
  const raw = await apiRequest<unknown>(paths.me.appContext, {
    method: "GET",
  });
  const data = adaptBackendSuccess(raw);
  return parseAccessContextPayload(data);
}
