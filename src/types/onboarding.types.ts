/**
 * Onboarding DTOs aligned with `src/lib/onboarding-status.ts` + `src/lib/api/onboarding.ts`
 * and onboarding UI role/entity strings (cetech-backend onboarding module).
 */

import type { RegistrationRole } from "@/types/auth.types";

/** Exact `onboardingStatus` strings returned by GET /onboarding/status (see parser allowlist). */
export const ONBOARDING_STATUS_VALUES = [
  "ROLE_SELECTION_REQUIRED",
  "PROFILE_REQUIRED",
  "ENTITY_ACTION_REQUIRED",
  "INVITE_PENDING_ACTION",
  "WAITING_FOR_INVITE",
  "ACADEMY_SETUP_REQUIRED",
  "COMPLETE",
] as const;

export type OnboardingStatus = (typeof ONBOARDING_STATUS_VALUES)[number];
export type OnboardingStatusEnum = OnboardingStatus;

/**
 * Runtime object map for the same values (for iteration / dropdowns if needed).
 */
export const OnboardingStatus = {
  ROLE_SELECTION_REQUIRED: "ROLE_SELECTION_REQUIRED",
  PROFILE_REQUIRED: "PROFILE_REQUIRED",
  ENTITY_ACTION_REQUIRED: "ENTITY_ACTION_REQUIRED",
  INVITE_PENDING_ACTION: "INVITE_PENDING_ACTION",
  WAITING_FOR_INVITE: "WAITING_FOR_INVITE",
  ACADEMY_SETUP_REQUIRED: "ACADEMY_SETUP_REQUIRED",
  COMPLETE: "COMPLETE",
} as const satisfies Record<string, OnboardingStatus>;

export const NEXT_STEP_VALUES = [
  "SELECT_ROLE",
  "COMPLETE_PROFILE",
  "CREATE_OR_JOIN_ENTITY",
  "SHOW_INVITES",
  "WAIT_FOR_INVITE",
  "COMPLETE_ACADEMY_SETUP",
  "GO_TO_DASHBOARD",
] as const;

export type NextStep = (typeof NEXT_STEP_VALUES)[number];
export type NextStepEnum = NextStep;

export const NextStep = {
  SELECT_ROLE: "SELECT_ROLE",
  COMPLETE_PROFILE: "COMPLETE_PROFILE",
  CREATE_OR_JOIN_ENTITY: "CREATE_OR_JOIN_ENTITY",
  SHOW_INVITES: "SHOW_INVITES",
  WAIT_FOR_INVITE: "WAIT_FOR_INVITE",
  COMPLETE_ACADEMY_SETUP: "COMPLETE_ACADEMY_SETUP",
  GO_TO_DASHBOARD: "GO_TO_DASHBOARD",
} as const satisfies Record<string, NextStep>;

/** Data object inside GET /onboarding/status success payload (parsed by `parseOnboardingPayload`). */
export interface OnboardingStatusData {
  isAuthenticated: boolean;
  availableRoles: string[];
  activeOnboardingRole: string | null;
  hasAthleteProfile: boolean;
  hasCoachProfile: boolean;
  activeMembershipCount: number;
  pendingInvitationCount: number;
  onboardingStatus: OnboardingStatus;
  nextStep: NextStep;
}

/** POST /onboarding/role */
export interface RoleSelectionRequest {
  role: RegistrationRole;
}

/** POST /onboarding/athlete-profile */
export interface AthleteProfileRequest {
  sport: string;
  level?: string;
}

/** POST /onboarding/coach-profile */
export interface CoachProfileRequest {
  academyId?: string;
}

/** POST /onboarding/academy-setup — creates academy + entity + membership when valid. */
export interface AcademySetupRequest {
  name: string;
  address: string;
  email: string;
  phone: string;
}
