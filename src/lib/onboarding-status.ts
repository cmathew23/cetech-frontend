import {
  NEXT_STEP_VALUES,
  ONBOARDING_STATUS_VALUES,
  type NextStepEnum,
  type OnboardingStatusData,
  type OnboardingStatusEnum,
} from "@/types/onboarding.types";

/** @deprecated Prefer `ONBOARDING_STATUS_VALUES` from `@/types/onboarding.types`. */
export const ONBOARDING_STATUSES = ONBOARDING_STATUS_VALUES;

export type OnboardingStatusValue = OnboardingStatusEnum;

/** Mirrors GET /onboarding/status `data` object (cetech-backend onboarding.service). */
export type ParsedOnboardingStatus = OnboardingStatusData;

function fallbackNextStepFromStatus(
  onboardingStatus: OnboardingStatusValue,
): NextStepEnum {
  switch (onboardingStatus) {
    case "ROLE_SELECTION_REQUIRED":
      return "SELECT_ROLE";
    case "PROFILE_REQUIRED":
      return "COMPLETE_PROFILE";
    case "ENTITY_ACTION_REQUIRED":
      return "CREATE_OR_JOIN_ENTITY";
    case "INVITE_PENDING_ACTION":
      return "SHOW_INVITES";
    case "WAITING_FOR_INVITE":
      return "WAIT_FOR_INVITE";
    case "ACADEMY_SETUP_REQUIRED":
      return "COMPLETE_ACADEMY_SETUP";
    case "COMPLETE":
      return "GO_TO_DASHBOARD";
    default:
      return "SELECT_ROLE";
  }
}

export function parseOnboardingPayload(body: unknown): ParsedOnboardingStatus {
  if (!body || typeof body !== "object") {
    return {
      isAuthenticated: false,
      activeOnboardingRole: null,
      availableRoles: [],
      hasAthleteProfile: false,
      hasCoachProfile: false,
      activeMembershipCount: 0,
      pendingInvitationCount: 0,
      onboardingStatus: "ROLE_SELECTION_REQUIRED",
      nextStep: "SELECT_ROLE",
    };
  }
  const o = body as Record<string, unknown>;
  const data =
    o.data && typeof o.data === "object"
      ? (o.data as Record<string, unknown>)
      : null;
  const src = data ?? o;

  const raw =
    typeof src.onboardingStatus === "string"
      ? src.onboardingStatus
      : typeof o.onboardingStatus === "string"
        ? o.onboardingStatus
        : null;

  const onboardingStatus =
    raw !== null &&
    (ONBOARDING_STATUS_VALUES as readonly string[]).includes(raw)
      ? (raw as OnboardingStatusValue)
      : "ROLE_SELECTION_REQUIRED";

  const availableRolesRaw = src.availableRoles;
  const availableRoles = Array.isArray(availableRolesRaw)
    ? availableRolesRaw.filter((x): x is string => typeof x === "string")
    : [];

  const activeOnboardingRole =
    typeof src.activeOnboardingRole === "string"
      ? src.activeOnboardingRole
      : null;

  const pic = src.pendingInvitationCount;
  const pendingInvitationCount =
    typeof pic === "number" && Number.isFinite(pic) ? pic : 0;

  const isAuthenticated = src.isAuthenticated === true;
  const hasAthleteProfile = src.hasAthleteProfile === true;
  const hasCoachProfile = src.hasCoachProfile === true;

  const amc = src.activeMembershipCount;
  const activeMembershipCount =
    typeof amc === "number" && Number.isFinite(amc) ? amc : 0;

  const rawNextStep =
    typeof src.nextStep === "string"
      ? src.nextStep
      : typeof o.nextStep === "string"
        ? o.nextStep
        : null;
  const nextStep =
    rawNextStep !== null &&
    (NEXT_STEP_VALUES as readonly string[]).includes(rawNextStep)
      ? (rawNextStep as NextStepEnum)
      : fallbackNextStepFromStatus(onboardingStatus);

  return {
    isAuthenticated,
    activeOnboardingRole,
    availableRoles,
    hasAthleteProfile,
    hasCoachProfile,
    activeMembershipCount,
    pendingInvitationCount,
    onboardingStatus,
    nextStep,
  };
}
