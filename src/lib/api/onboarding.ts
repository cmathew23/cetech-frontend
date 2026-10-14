import { paths } from "@/config/endpoints";
import { apiRequest } from "@/lib/apiClient";
import type { RegistrationRole } from "@/types/auth.types";
import type {
  AcademySetupRequest,
  AthleteProfileRequest,
  CoachProfileRequest,
} from "@/types/onboarding.types";

/**
 * Contracts: cetech-backend onboarding module (validator + controller).
 * GET /onboarding/status -> successResponse data shape (activeOnboardingRole, availableRoles, …)
 * POST /onboarding/athlete-profile -> { sport } required; { level } optional
 * Football also sends existing disciplineOrEvent (GOALKEEPER). Golf and Basketball do not.
 * POST /onboarding/coach-profile -> optional { academyId }; {} valid
 */

export type AthleteProfilePayload = AthleteProfileRequest;
export type CoachProfilePayload = CoachProfileRequest;

const FOOTBALL_ONBOARDING_SPORT = "FOOTBALL";

/** Maps the athlete profile form onto the existing POST /onboarding/athlete-profile body. */
export function toAthleteProfilePayload(
  payload: AthleteProfilePayload,
): AthleteProfilePayload {
  const sport = payload.sport.trim();
  const body: AthleteProfilePayload = { sport };
  const level = payload.level?.trim() ?? "";
  if (level !== "") {
    body.level = level;
  }
  if (sport === FOOTBALL_ONBOARDING_SPORT) {
    const disciplineOrEvent = payload.disciplineOrEvent?.trim() ?? "";
    if (disciplineOrEvent !== "") {
      body.disciplineOrEvent = disciplineOrEvent;
    }
  }
  return body;
}

export async function getOnboardingStatus() {
  return apiRequest(paths.onboarding.status, { method: "GET" });
}

/** POST /onboarding/role — body.role matches `RegistrationRole` (backend validator). */
export async function selectRole(role: RegistrationRole) {
  return apiRequest(paths.onboarding.role, {
    method: "POST",
    body: JSON.stringify({ role }),
  });
}

export async function createAthleteProfile(payload: AthleteProfilePayload) {
  return apiRequest(paths.onboarding.athleteProfile, {
    method: "POST",
    body: JSON.stringify(toAthleteProfilePayload(payload)),
  });
}

export async function createCoachProfile(payload: CoachProfilePayload = {}) {
  const body: { academyId?: string } = {};
  const id = payload.academyId?.trim();
  if (id) {
    body.academyId = id;
  }
  return apiRequest(paths.onboarding.coachProfile, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type AcademySetupPayload = AcademySetupRequest;

/**
 * POST /onboarding/academy-setup — required for new ACADEMY_ADMIN before any dashboard access.
 * Backend creates academy, training entity, and ACTIVE ENTITY_ADMIN membership.
 */
export async function submitAcademySetup(payload: AcademySetupPayload) {
  return apiRequest(paths.onboarding.academySetup, {
    method: "POST",
    body: JSON.stringify({
      name: payload.name.trim(),
      address: payload.address.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
    }),
  });
}
