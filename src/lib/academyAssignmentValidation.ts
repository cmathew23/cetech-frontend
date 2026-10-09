import { getActiveCoachAssignmentsForAthlete } from "@/lib/api/academyAdmin";
import type { AcademyCoachRole } from "@/lib/api/academyMeCoaches";
import {
  coachFunctionToPlanDomain,
  currentCoachIsHeadCoach,
  type CoachPlanCreationDomain,
} from "@/lib/coachAuthority";
import type { EntityAssignmentRow } from "@/types/academyAdmin.types";

export type AcademyAssignmentCoachRosterEntry = {
  coachProfileId: string;
  role: AcademyCoachRole;
  functions: readonly string[];
  membershipStatus: string;
};

export type AcademyAssignmentCoachSourceRow = Omit<
  AcademyAssignmentCoachRosterEntry,
  "coachProfileId"
> & {
  coachProfileId?: string;
  email: string;
};

export type AssignmentCoachIdentity = {
  coachProfileId: string;
  displayEmail?: string;
  coachEmail?: string;
};

const DOMAIN_LABELS: Record<CoachPlanCreationDomain, string> = {
  SKILLS: "Skills",
  NUTRITION: "Nutrition",
  S_AND_C: "Strength & Conditioning",
};

const DOMAIN_CHECK_ORDER: CoachPlanCreationDomain[] = [
  "SKILLS",
  "NUTRITION",
  "S_AND_C",
];

export const MISSING_HEAD_COACH_MESSAGE =
  "Select the Head Coach for this athlete before assigning coaches.";

export const DUPLICATE_SKILLS_PLAN_GENERATOR_MESSAGE =
  "Only one coach can generate Skills plans for this athlete.";

const ASSIGNMENT_DOMAIN_ERROR_MESSAGES: Record<string, string> = {
  ATHLETE_ALREADY_HAS_HEAD_COACH:
    "Only one Head Coach can be assigned to an athlete.",
  ATHLETE_ALREADY_HAS_SKILLS_COACH:
    "Only one Skills Coach can be assigned to an athlete.",
  ATHLETE_ALREADY_HAS_NUTRITION_COACH:
    "Only one Nutrition Coach can be assigned to an athlete.",
  ATHLETE_ALREADY_HAS_S_AND_C_COACH:
    "Only one Strength & Conditioning Coach can be assigned to an athlete.",
  ATHLETE_ALREADY_HAS_STRENGTH_AND_CONDITIONING_COACH:
    "Only one Strength & Conditioning Coach can be assigned to an athlete.",
};

export function domainCoachLimitMessage(
  domain: CoachPlanCreationDomain,
): string {
  return `Only one ${DOMAIN_LABELS[domain]} Coach can be assigned to an athlete.`;
}

function isActiveMembershipStatus(status: string): boolean {
  return status.trim().toUpperCase() === "ACTIVE";
}

function normalizedEmail(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

/**
 * Links academy coach roles/functions to assignment profile ids. The academy roster's
 * coachProfileId is optional, so candidate/assignment email is the required fallback.
 */
export function resolveAcademyAssignmentCoachRoster(
  coaches: readonly AcademyAssignmentCoachSourceRow[],
  identities: readonly AssignmentCoachIdentity[],
): AcademyAssignmentCoachRosterEntry[] {
  const idsByEmail = new Map<string, Set<string>>();
  for (const identity of identities) {
    const id = identity.coachProfileId.trim();
    const email = normalizedEmail(identity.displayEmail ?? identity.coachEmail);
    if (id === "" || email === "") continue;
    const ids = idsByEmail.get(email) ?? new Set<string>();
    ids.add(id);
    idsByEmail.set(email, ids);
  }

  const resolved = new Map<string, AcademyAssignmentCoachRosterEntry>();
  for (const coach of coaches) {
    const ids = new Set<string>();
    const directId = coach.coachProfileId?.trim() ?? "";
    if (directId !== "") ids.add(directId);
    const email = normalizedEmail(coach.email);
    for (const id of idsByEmail.get(email) ?? []) ids.add(id);
    for (const coachProfileId of ids) {
      resolved.set(coachProfileId, {
        coachProfileId,
        role: coach.role,
        functions: coach.functions,
        membershipStatus: coach.membershipStatus,
      });
    }
  }
  return [...resolved.values()];
}

export function formatAssignmentApiError(
  error: unknown,
  fallback: string,
): string {
  if (error && typeof error === "object") {
    const candidate = error as { code?: unknown; message?: unknown; status?: unknown };
    const code = typeof candidate.code === "string" ? candidate.code.trim() : "";
    const message =
      typeof candidate.message === "string" ? candidate.message.trim() : "";
    const domainMessage =
      ASSIGNMENT_DOMAIN_ERROR_MESSAGES[code] ??
      ASSIGNMENT_DOMAIN_ERROR_MESSAGES[message];
    if (domainMessage) return domainMessage;
    if (candidate.status === 403) {
      return message !== ""
        ? `Access denied. ${message}`
        : "Access denied. You don't have permission to perform this action.";
    }
    if (/^[A-Z][A-Z0-9_]+$/.test(message)) return fallback;
    if (message !== "") return message;
  }
  if (error instanceof Error) {
    const message = error.message.trim();
    return /^[A-Z][A-Z0-9_]+$/.test(message) || message === ""
      ? fallback
      : message;
  }
  return fallback;
}

export function academyHasActiveHeadCoach(
  coaches: readonly AcademyAssignmentCoachRosterEntry[],
): boolean {
  return coaches.some(
    (coach) =>
      currentCoachIsHeadCoach(coach.role) &&
      isActiveMembershipStatus(coach.membershipStatus),
  );
}

function buildCoachLookup(
  coaches: readonly AcademyAssignmentCoachRosterEntry[],
): Map<string, AcademyAssignmentCoachRosterEntry> {
  const map = new Map<string, AcademyAssignmentCoachRosterEntry>();
  for (const coach of coaches) {
    const id = coach.coachProfileId.trim();
    if (id !== "" && isActiveMembershipStatus(coach.membershipStatus)) {
      map.set(id, coach);
    }
  }
  return map;
}

function coachHasPlanDomain(
  coach: AcademyAssignmentCoachRosterEntry | undefined,
  domain: CoachPlanCreationDomain,
): boolean {
  if (!coach) return false;
  return coach.functions.some((fn) => coachFunctionToPlanDomain(fn) === domain);
}

function isHeadCoachProfile(
  coachProfileId: string,
  lookup: Map<string, AcademyAssignmentCoachRosterEntry>,
): boolean {
  const coach = lookup.get(coachProfileId.trim());
  return coach ? currentCoachIsHeadCoach(coach.role) : false;
}

export type ValidateAssignmentSelectionInput = {
  athleteProfileId: string;
  selectedCoachProfileIds: readonly string[];
  assignments: readonly EntityAssignmentRow[];
  academyCoaches: readonly AcademyAssignmentCoachRosterEntry[];
};

export type AssignmentSelectionValidationResult =
  | { ok: true; coachesToCreate: string[] }
  | { ok: false; message: string; useModal: true };

export function orderCoachesForAssignment(
  coachProfileIds: readonly string[],
  lookup: Map<string, AcademyAssignmentCoachRosterEntry>,
): string[] {
  const headCoaches: string[] = [];
  const others: string[] = [];
  for (const id of coachProfileIds) {
    if (isHeadCoachProfile(id, lookup)) {
      headCoaches.push(id);
    } else {
      others.push(id);
    }
  }
  return [...headCoaches, ...others];
}

export function validateAssignmentSelection(
  input: ValidateAssignmentSelectionInput,
): AssignmentSelectionValidationResult {
  const athleteProfileId = input.athleteProfileId.trim();
  const lookup = buildCoachLookup(input.academyCoaches);
  const activeForAthlete = getActiveCoachAssignmentsForAthlete(
    athleteProfileId,
    [...input.assignments],
  );
  const activeCoachIds = new Set(
    activeForAthlete.map((row) => row.coachProfileId.trim()).filter(Boolean),
  );
  const selectedCoachIds = new Set(
    input.selectedCoachProfileIds.map((id) => id.trim()).filter(Boolean),
  );
  const finalCoachIds = new Set([...activeCoachIds, ...selectedCoachIds]);

  if (academyHasActiveHeadCoach(input.academyCoaches)) {
    const headCoachIds = [...finalCoachIds].filter((coachProfileId) =>
      isHeadCoachProfile(coachProfileId, lookup),
    );
    if (headCoachIds.length === 0) {
      return {
        ok: false,
        useModal: true,
        message: MISSING_HEAD_COACH_MESSAGE,
      };
    }
    if (headCoachIds.length > 1) {
      return {
        ok: false,
        useModal: true,
        message: "Only one Head Coach can be assigned to an athlete.",
      };
    }
  }

  for (const domain of DOMAIN_CHECK_ORDER) {
    if (domain === "SKILLS") continue;
    const domainCoachIds = [...finalCoachIds].filter((coachProfileId) =>
      coachHasPlanDomain(lookup.get(coachProfileId), domain),
    );
    if (domainCoachIds.length > 1) {
      return {
        ok: false,
        useModal: true,
        message: domainCoachLimitMessage(domain),
      };
    }
  }

  const canGenerateByCoachId = new Map<string, boolean>();
  for (const row of activeForAthlete) {
    const id = row.coachProfileId.trim();
    if (id === "") continue;
    canGenerateByCoachId.set(id, row.canGeneratePlan === true);
  }
  const skillsGeneratorIds = [...finalCoachIds].filter((coachProfileId) => {
    if (!coachHasPlanDomain(lookup.get(coachProfileId), "SKILLS")) return false;
    return canGenerateByCoachId.get(coachProfileId) === true;
  });
  if (skillsGeneratorIds.length > 1) {
    return {
      ok: false,
      useModal: true,
      message: DUPLICATE_SKILLS_PLAN_GENERATOR_MESSAGE,
    };
  }

  const coachesToCreate = [...selectedCoachIds].filter(
    (id) => !activeCoachIds.has(id),
  );

  return {
    ok: true,
    coachesToCreate: orderCoachesForAssignment(coachesToCreate, lookup),
  };
}
