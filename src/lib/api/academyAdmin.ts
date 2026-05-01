/**
 * Academy Admin API — all calls unwrap via adaptBackendSuccess (no envelope handling in UI).
 *
 * Parsing assumes canonical backend DTOs (camelCase) after unwrap; unknown shapes fail fast.
 */

import { paths } from "@/config/endpoints";
import { primaryPersonNameFromMemberFields } from "@/lib/adminPersonLabel";
import { apiRequest } from "@/lib/apiClient";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { parseCoachPersonName } from "@/lib/api/academyMeCoaches";
import { athleteTableNameFromRow } from "@/lib/api/academyMeAthletes";
import type {
  AthleteAssignmentOption,
  CoachAssignmentOption,
  EntityAssignmentRow,
  EntityMemberRow,
  PendingInvitationRow,
} from "@/types/academyAdmin.types";

export type CreateAcademyInput = {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
};

export type CreateAcademyResult = {
  academyId: string;
  entityId: string;
  name: string;
};

/**
 * Canonical POST /academies success payload (after `adaptBackendSuccess`): flat object.
 */
function parseCreateAcademyBody(
  data: unknown,
  fallbackName: string,
): CreateAcademyResult {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw {
      message: "Invalid create academy response body",
      status: 500,
      code: "ACADEMY_CREATE_INVALID_BODY",
    };
  }
  const o = data as Record<string, unknown>;

  const academyIdRaw =
    typeof o.academyId === "string" && o.academyId.trim() !== ""
      ? o.academyId.trim()
      : typeof o.academy_id === "string" && o.academy_id.trim() !== ""
        ? o.academy_id.trim()
        : typeof o.id === "string" && o.id.trim() !== ""
          ? o.id.trim()
          : "";
  const entityIdRaw =
    typeof o.entityId === "string" && o.entityId.trim() !== ""
      ? o.entityId.trim()
      : typeof o.entity_id === "string" && o.entity_id.trim() !== ""
        ? o.entity_id.trim()
        : "";

  if (academyIdRaw === "" || entityIdRaw === "") {
    throw {
      message: "Create academy response missing academyId or entityId",
      status: 500,
      code: "ACADEMY_CREATE_MISSING_IDS",
      details: data,
    };
  }

  const name =
    typeof o.name === "string" && o.name.trim() !== ""
      ? o.name.trim()
      : fallbackName.trim() !== ""
        ? fallbackName.trim()
        : "Academy";

  return { academyId: academyIdRaw, entityId: entityIdRaw, name };
}

export async function createAcademy(
  input: CreateAcademyInput,
): Promise<CreateAcademyResult> {
  const name = input.name.trim();
  const payload: Record<string, string> = { name };
  const address = input.address?.trim() ?? "";
  const phone = input.phone?.trim() ?? "";
  const email = input.email?.trim() ?? "";
  if (address !== "") payload.address = address;
  if (phone !== "") payload.phone = phone;
  if (email !== "") payload.email = email;
  const raw = await apiRequest(paths.academies.root, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = adaptBackendSuccess(raw);
  return parseCreateAcademyBody(data, input.name);
}

/**
 * After unwrap, GET /entities/:entityId/members is expected to be the array in `data`
 * (i.e. body is `{ success, data: Member[] }` and adapter returns `data`).
 */
function assertMembersArrayAfterUnwrap(data: unknown): unknown[] {
  if (!Array.isArray(data)) {
    throw {
      message:
        "Members response must be a JSON array after unwrap (expected envelope data array)",
      status: 500,
      code: "MEMBERS_NOT_ARRAY",
      details: data,
    };
  }
  return data;
}

function formatJoinedAt(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  return "—";
}

function readFirstNonEmptyString(
  source: Record<string, unknown>,
  keys: string[],
): string {
  for (const key of keys) {
    if (!(key in source)) continue;
    const value = source[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return "";
}

export async function fetchEntityMembers(
  entityId: string,
): Promise<EntityMemberRow[]> {
  const path = paths.entities.members(entityId);
  const raw = await apiRequest(path, { method: "GET" });
  const data = adaptBackendSuccess(raw);
  const list = assertMembersArrayAfterUnwrap(data);
  return list.reduce<EntityMemberRow[]>((acc, row) => {
    const n = normalizeMemberRow(row);
    if (n !== null) acc.push(n);
    return acc;
  }, []);
}

/**
 * POST /entities/:entityId/members/:targetUserId/deactivate
 * Removes membership in this entity (e.g. REMOVED); does not delete the user account.
 * Optional body (reason) omitted in MVP UI.
 */
export async function deactivateEntityMember(
  entityId: string,
  targetUserId: string,
): Promise<void> {
  const eid = entityId.trim();
  const uid = targetUserId.trim();
  if (eid === "" || uid === "") {
    throw {
      message: "entityId and targetUserId are required",
      status: 400,
      code: "DEACTIVATE_MEMBER_INPUT_REQUIRED",
    };
  }
  const raw = await apiRequest(paths.entities.deactivateMember(eid, uid), {
    method: "POST",
    body: JSON.stringify({}),
  });
  adaptBackendSuccess(raw);
}


function assertInvitationsArrayAfterUnwrap(data: unknown): unknown[] {
  if (!Array.isArray(data)) {
    throw {
      message:
        "Invitations response must be a JSON array after unwrap (expected envelope data array)",
      status: 500,
      code: "INVITATIONS_NOT_ARRAY",
      details: data,
    };
  }
  return data;
}

function formatInvitationTimestamp(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  return "—";
}

/**
 * One invitation row: aligned with `InvitationResponse` in `trainingEntity.types.ts`
 * (`id`, `email`, `role`, `status`, `createdAt`).
 */
function normalizePendingInvitationRow(
  raw: unknown,
): PendingInvitationRow | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;

  if (typeof o.id !== "string" || o.id.trim() === "") {
    return null;
  }

  const email =
    typeof o.email === "string" && o.email.trim() !== ""
      ? o.email.trim()
      : "—";
  const role =
    typeof o.role === "string" && o.role.trim() !== "" ? o.role.trim() : "—";
  const status =
    typeof o.status === "string" && o.status.trim() !== ""
      ? o.status.trim()
      : "—";
  const createdAt = formatInvitationTimestamp(o.createdAt);
  const entity =
    o.entity && typeof o.entity === "object" && !Array.isArray(o.entity)
      ? (o.entity as Record<string, unknown>)
      : null;
  const entityName =
    typeof o.entityName === "string" && o.entityName.trim() !== ""
      ? o.entityName.trim()
      : entity &&
          typeof entity.name === "string" &&
          entity.name.trim() !== ""
        ? entity.name.trim()
        : undefined;

  return {
    invitationId: o.id.trim(),
    entityName,
    email,
    role,
    status,
    createdAt,
  };
}

export const INVITATION_STATUS_FILTERS = [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "REVOKED",
  "EXPIRED",
] as const;
export type InvitationStatusFilter = (typeof INVITATION_STATUS_FILTERS)[number];

export async function fetchEntityInvitations(
  entityId: string,
  status?: InvitationStatusFilter,
): Promise<PendingInvitationRow[]> {
  const base = paths.entities.invitations(entityId);
  const path =
    status !== undefined
      ? `${base}?status=${encodeURIComponent(status)}`
      : base;
  const raw = await apiRequest(path, { method: "GET" });
  const data = adaptBackendSuccess(raw);
  const list = assertInvitationsArrayAfterUnwrap(data);
  return list.reduce<PendingInvitationRow[]>((acc, row) => {
    const n = normalizePendingInvitationRow(row);
    if (n !== null) acc.push(n);
    return acc;
  }, []);
}

export type CreateEntityInvitationInput = {
  entityId: string;
  email: string;
  role: "COACH" | "ATHLETE";
};

/**
 * POST /entities/:entityId/invite — create coach/athlete invitation in entity context.
 */
export async function createEntityInvitation(
  input: CreateEntityInvitationInput,
): Promise<void> {
  const entityId = input.entityId.trim();
  const email = input.email.trim();
  if (entityId === "" || email === "") {
    throw {
      message: "entityId and email are required",
      status: 400,
      code: "INVITATION_INPUT_REQUIRED",
    };
  }
  const raw = await apiRequest(paths.entities.invite(entityId), {
    method: "POST",
    body: JSON.stringify({
      email,
      role: input.role,
    }),
  });
  adaptBackendSuccess(raw);
}

/**
 * POST /entities/invitations/:id/revoke — success body parsed through adapter; no return value.
 */
export async function revokeEntityInvitation(
  invitationId: string,
): Promise<void> {
  const id = invitationId.trim();
  if (id === "") {
    throw {
      message: "Invitation id is required",
      status: 400,
      code: "INVITATION_ID_REQUIRED",
    };
  }
  const raw = await apiRequest(paths.entities.revokeInvitation(id), {
    method: "POST",
    body: JSON.stringify({}),
  });
  adaptBackendSuccess(raw);
}

function assertAcademyRosterArrayAfterUnwrap(
  data: unknown,
  code: "ACADEMY_ATHLETES_NOT_ARRAY" | "ACADEMY_COACHES_NOT_ARRAY",
): unknown[] {
  if (!Array.isArray(data)) {
    throw {
      message:
        "Academy roster response must be a JSON array after unwrap (expected envelope data array)",
      status: 500,
      code,
      details: data,
    };
  }
  return data;
}

function profileNameFromRecord(profile: Record<string, unknown>): string {
  const fn = readFirstNonEmptyString(profile, ["firstName", "first_name"]);
  const ln = readFirstNonEmptyString(profile, ["lastName", "last_name"]);
  const joined = [fn, ln].filter(Boolean).join(" ");
  if (joined !== "") return joined;
  return readFirstNonEmptyString(profile, ["displayName", "fullName", "name"]);
}

function looksLikeEmailAddress(s: string): boolean {
  const t = s.trim();
  return t.includes("@") && !t.includes(" ");
}

/**
 * Display name from a user-like object (nested `user`, `targetUser`, `profile`, etc.).
 * Does not use email as a name — email belongs in the Email column only.
 */
function displayNameFromUserLikeRecord(
  rec: Record<string, unknown> | null,
): string {
  if (rec === null) return "";
  const profile = asRecord(rec["profile"]);
  if (profile !== null) {
    const n = profileNameFromRecord(profile);
    if (n !== "") return n;
  }
  const fn = readFirstNonEmptyString(rec, [
    "firstName",
    "first_name",
    "givenName",
    "given_name",
  ]);
  const ln = readFirstNonEmptyString(rec, [
    "lastName",
    "last_name",
    "familyName",
    "family_name",
  ]);
  const joined = [fn, ln].filter(Boolean).join(" ");
  if (joined !== "") return joined;
  const single = readFirstNonEmptyString(rec, [
    "displayName",
    "display_name",
    "fullName",
    "full_name",
    "legalName",
    "name",
  ]);
  if (single !== "") return single;
  const handle = readFirstNonEmptyString(rec, ["username", "userName", "login"]);
  if (handle !== "" && !looksLikeEmailAddress(handle)) return handle;
  return "";
}

/** User row on membership DTOs often carries legal/display name while profile is sport-only. */
function rosterDisplayNameFromUser(
  user: Record<string, unknown> | null,
): string {
  return displayNameFromUserLikeRecord(user);
}

function rosterPersonEmail(
  row: Record<string, unknown>,
  user: Record<string, unknown> | null,
): string {
  const fromUser =
    user && typeof user.email === "string" && user.email.trim() !== ""
      ? user.email.trim()
      : "";
  if (fromUser !== "") return fromUser;
  return readFirstNonEmptyString(row, ["email"]);
}

/**
 * Nested person on GET /academies/:id/athletes|coaches rows — backend may use `user`,
 * `targetUser`, `memberUser`, or `member` instead of only top-level name fields.
 */
function membershipRowUser(o: Record<string, unknown>): Record<string, unknown> | null {
  const direct = asRecord(o.user);
  if (direct !== null) return direct;
  const target = asRecord(o.targetUser);
  if (target !== null) return target;
  const memberUser = asRecord(o.memberUser);
  if (memberUser !== null) return memberUser;
  return asRecord(o.member);
}

/** Athlete roster row: names on the row, else on the nested user object (GET roster often nests under `user`). */
function athleteDisplayNameForAssignmentRow(
  row: Record<string, unknown>,
  user: Record<string, unknown> | null,
): string {
  const top = athleteTableNameFromRow(row);
  if (top !== "") return top;
  if (user !== null) {
    const fromUserParts = athleteTableNameFromRow(user);
    if (fromUserParts !== "") return fromUserParts;
    const fromUserDisplay = displayNameFromUserLikeRecord(user);
    if (fromUserDisplay !== "") return fromUserDisplay;
  }
  return "";
}

/** Name + email for assignment dropdowns; same name priority as roster tables (athlete row, coach row, profile, user). */
function rosterOptionDisplayParts(
  profile: Record<string, unknown> | null,
  row: Record<string, unknown>,
  user: Record<string, unknown> | null,
  fallbackId: string,
): { displayName: string; displayEmail: string } {
  const displayEmail = rosterPersonEmail(row, user);
  const athleteNameFromRow = athleteDisplayNameForAssignmentRow(row, user);
  const rowForCoach =
    user !== null && asRecord(row.user) === null
      ? ({ ...row, user } as Record<string, unknown>)
      : row;
  const { firstName, lastName } = parseCoachPersonName(rowForCoach);
  const coachNameFromRow = [firstName, lastName].filter(Boolean).join(" ");
  const fromAthleteOrCoachRow =
    athleteNameFromRow !== "" ? athleteNameFromRow : coachNameFromRow;

  const fromProfile = profile !== null ? profileNameFromRecord(profile) : "";
  const fn = readFirstNonEmptyString(row, ["firstName", "first_name"]);
  const ln = readFirstNonEmptyString(row, ["lastName", "last_name"]);
  const fromRow = [fn, ln].filter(Boolean).join(" ");
  const fromUser = rosterDisplayNameFromUser(user);
  const displayName =
    fromAthleteOrCoachRow !== ""
      ? fromAthleteOrCoachRow
      : fromProfile !== ""
        ? fromProfile
        : fromRow !== ""
          ? fromRow
          : fromUser !== ""
            ? fromUser
            : readFirstNonEmptyString(row, ["displayName", "fullName", "name"]);
  if (displayName === "" && displayEmail === "") {
    return { displayName: "", displayEmail: fallbackId };
  }
  return { displayName, displayEmail };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/**
 * Human-readable name for entity member rows (never email in this string — email is a separate column).
 * ENTITY_ADMIN: nested `user` name fields and top-level row only — never athlete/coach profile cross-reads.
 * ATHLETE: same top-level row first/last as {@link athleteTableNameFromRow}, then athlete profile.
 * COACH: same as {@link parseCoachPersonName}, then coach profile.
 */
function resolveEntityMemberDisplayName(
  o: Record<string, unknown>,
  user: Record<string, unknown> | null,
  roleUpper: string,
): string {
  const athleteFromUser =
    user !== null ? asRecord(user["athlete"]) : null;
  const athleteFromRow = asRecord(o["athlete"]);
  const coachFromUser = user !== null ? asRecord(user["coach"]) : null;
  const coachFromRow = asRecord(o["coach"]);

  const adminRoles = new Set([
    "ENTITY_ADMIN",
    "ACADEMY_ADMIN",
    "ADMIN",
  ]);
  if (adminRoles.has(roleUpper)) {
    const fromUser = rosterDisplayNameFromUser(user);
    if (fromUser !== "") return fromUser;
    for (const key of ["targetUser", "memberUser", "member"] as const) {
      const nested = asRecord(o[key]);
      if (nested === null) continue;
      const n = displayNameFromUserLikeRecord(nested);
      if (n !== "") return n;
    }
    const fn = readFirstNonEmptyString(o, [
      "firstName",
      "first_name",
      "givenName",
      "given_name",
    ]);
    const ln = readFirstNonEmptyString(o, [
      "lastName",
      "last_name",
      "familyName",
      "family_name",
    ]);
    const fromRow = [fn, ln].filter(Boolean).join(" ");
    if (fromRow !== "") return fromRow;
    return readFirstNonEmptyString(o, [
      "displayName",
      "display_name",
      "fullName",
      "full_name",
      "name",
    ]);
  }

  if (roleUpper === "ATHLETE") {
    const fromAthletesTable = athleteTableNameFromRow(o);
    if (fromAthletesTable !== "") return fromAthletesTable;
    const profile = athleteFromUser ?? athleteFromRow;
    if (profile !== null) {
      const n = profileNameFromRecord(profile);
      if (n !== "") return n;
    }
  }
  if (roleUpper === "COACH") {
    const { firstName, lastName } = parseCoachPersonName(o);
    const fromCoachesTable = [firstName, lastName].filter(Boolean).join(" ");
    if (fromCoachesTable !== "") return fromCoachesTable;
    const profile = coachFromUser ?? coachFromRow;
    if (profile !== null) {
      const n = profileNameFromRecord(profile);
      if (n !== "") return n;
    }
  }

  const fromUser = rosterDisplayNameFromUser(user);
  if (fromUser !== "") return fromUser;

  const fn = readFirstNonEmptyString(o, ["firstName", "first_name"]);
  const ln = readFirstNonEmptyString(o, ["lastName", "last_name"]);
  const fromRow = [fn, ln].filter(Boolean).join(" ");
  if (fromRow !== "") return fromRow;

  const fromTop = readFirstNonEmptyString(o, ["displayName", "fullName", "name"]);
  if (fromTop !== "") return fromTop;

  return "";
}

/**
 * One membership row: aligned with `MembershipResponse` in `trainingEntity.types.ts`
 * (membershipId, role, status, joinedAt); email only from nested `user.email` when present.
 * `memberDisplayName` uses athlete/coach profile names when present (GET /entities/:id/members).
 */
function normalizeMemberRow(raw: unknown): EntityMemberRow | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;

  const membershipId = readFirstNonEmptyString(o, ["membershipId", "id"]);
  if (membershipId === "") {
    return null;
  }

  const user =
    o.user && typeof o.user === "object" && !Array.isArray(o.user)
      ? (o.user as Record<string, unknown>)
      : null;
  const userFirstName =
    user && typeof user.firstName === "string" ? user.firstName.trim() : "";
  const userLastName =
    user && typeof user.lastName === "string" ? user.lastName.trim() : "";
  const userName = [userFirstName, userLastName].filter(Boolean).join(" ");
  const userEmailFromNested =
    user && typeof user.email === "string" ? user.email.trim() : "";
  const userEmailFromTop = typeof o.email === "string" ? o.email.trim() : "";
  const userEmail =
    userName !== ""
      ? userName
      : userEmailFromNested !== ""
        ? userEmailFromNested
        : userEmailFromTop !== ""
          ? userEmailFromTop
          : "—";

  const memberEmailOnly =
    userEmailFromNested !== "" ? userEmailFromNested : userEmailFromTop;

  const targetUserIdTop = readFirstNonEmptyString(o, [
    "userId",
    "targetUserId",
    "memberUserId",
  ]);
  const targetUserIdNested =
    user !== null
      ? readFirstNonEmptyString(user, ["userId", "id"])
      : "";
  const targetUserId =
    targetUserIdTop !== "" ? targetUserIdTop : targetUserIdNested;

  const role = readFirstNonEmptyString(o, ["role", "membershipRole"]) || "—";
  const status = readFirstNonEmptyString(o, ["status", "membershipStatus"]) || "—";
  const joinedAt = formatJoinedAt(o.joinedAt ?? o.createdAt);

  const roleUpper = role.trim().toUpperCase();
  const memberDisplayName = resolveEntityMemberDisplayName(o, user, roleUpper);

  return {
    membershipId,
    targetUserId,
    memberDisplayName,
    memberEmailOnly,
    userEmail,
    role,
    status,
    joinedAt,
  };
}

/**
 * Membership row → athlete option when an athlete profile id can be resolved.
 */
function adaptAcademyAthleteOption(raw: unknown): AthleteAssignmentOption | null {
  const o = asRecord(raw);
  if (!o) return null;
  const user = membershipRowUser(o);
  const athleteFromUser = asRecord(user?.athlete);
  const athleteFromRow = asRecord(o.athlete);
  const athleteProfileId =
    readFirstNonEmptyString(o, [
      "athleteProfileId",
      "athlete_profile_id",
      "athleteId",
      "athlete_id",
    ]) ||
    (athleteFromUser
      ? readFirstNonEmptyString(athleteFromUser, ["id", "athleteProfileId"])
      : "") ||
    (athleteFromRow
      ? readFirstNonEmptyString(athleteFromRow, ["id", "athleteProfileId"])
      : "");
  if (athleteProfileId === "") return null;
  const profile = athleteFromUser ?? athleteFromRow;
  const { displayName, displayEmail } = rosterOptionDisplayParts(
    profile,
    o,
    user,
    athleteProfileId,
  );
  return {
    athleteProfileId,
    displayName,
    displayEmail,
  };
}

/**
 * Membership row → coach option when a coach profile id can be resolved.
 */
function adaptAcademyCoachOption(raw: unknown): CoachAssignmentOption | null {
  const o = asRecord(raw);
  if (!o) return null;
  const user = membershipRowUser(o);
  const coachFromUser = asRecord(user?.coach);
  const coachFromRow = asRecord(o.coach);
  const coachProfileId =
    readFirstNonEmptyString(o, [
      "coachProfileId",
      "coach_profile_id",
      "coachId",
      "coach_id",
    ]) ||
    (coachFromUser
      ? readFirstNonEmptyString(coachFromUser, ["id", "coachProfileId"])
      : "") ||
    (coachFromRow
      ? readFirstNonEmptyString(coachFromRow, ["id", "coachProfileId"])
      : "");
  if (coachProfileId === "") return null;
  const profile = coachFromUser ?? coachFromRow;
  const { displayName, displayEmail } = rosterOptionDisplayParts(
    profile,
    o,
    user,
    coachProfileId,
  );
  return {
    coachProfileId,
    displayName,
    displayEmail,
  };
}

function entityMemberRowPrimaryPersonName(
  o: Record<string, unknown>,
  user: Record<string, unknown> | null,
): string {
  const topD = readFirstNonEmptyString(o, ["displayName", "display_name"]);
  const topFn = readFirstNonEmptyString(o, ["firstName", "first_name"]);
  const topLn = readFirstNonEmptyString(o, ["lastName", "last_name"]);
  const fromTop = primaryPersonNameFromMemberFields({
    displayName: topD,
    firstName: topFn,
    lastName: topLn,
  });
  if (fromTop !== "") return fromTop;
  if (user === null) return "";
  const uD = readFirstNonEmptyString(user, ["displayName", "display_name"]);
  const uFn = readFirstNonEmptyString(user, ["firstName", "first_name"]);
  const uLn = readFirstNonEmptyString(user, ["lastName", "last_name"]);
  return primaryPersonNameFromMemberFields({
    displayName: uD,
    firstName: uFn,
    lastName: uLn,
  });
}


function assignmentOptionLabelSortKey(a: {
  displayName: string;
  displayEmail: string;
}): string {
  const primary = a.displayName.trim();
  const secondary = a.displayEmail.trim();
  return (primary !== "" ? primary : secondary).toLowerCase();
}

/**
 * Assignment-candidates endpoint body after unwrap:
 * `{ coaches: CandidateCoach[]; athletes: CandidateAthlete[] }`
 */
function parseAssignmentCandidatesBody(data: unknown): {
  coaches: unknown[];
  athletes: unknown[];
} {
  const o = asRecord(data);
  if (!o) {
    throw {
      message: "Assignment candidates response must be an object",
      status: 500,
      code: "ASSIGNMENT_CANDIDATES_INVALID_BODY",
      details: data,
    };
  }
  if (!Array.isArray(o.coaches) || !Array.isArray(o.athletes)) {
    throw {
      message:
        "Assignment candidates response must include `coaches[]` and `athletes[]`",
      status: 500,
      code: "ASSIGNMENT_CANDIDATES_MISSING_ARRAYS",
      details: data,
    };
  }
  return {
    coaches: o.coaches as unknown[],
    athletes: o.athletes as unknown[],
  };
}

function fullName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

function candidateDisplayName(
  row: Record<string, unknown>,
  profileId: string,
): string {
  const displayName = readFirstNonEmptyString(row, ["displayName", "display_name"]);
  if (displayName !== "") return displayName;
  const first = readFirstNonEmptyString(row, ["firstName", "first_name"]);
  const last = readFirstNonEmptyString(row, ["lastName", "last_name"]);
  const joined = fullName(first, last);
  if (joined !== "") return joined;
  return profileId;
}

function adaptCandidateCoachOption(raw: unknown): CoachAssignmentOption | null {
  const o = asRecord(raw);
  if (!o) return null;
  const coachProfileId = readFirstNonEmptyString(o, ["coachId"]);
  if (coachProfileId === "") return null;
  const displayEmail = readFirstNonEmptyString(o, ["email"]);
  return {
    coachProfileId,
    displayName: candidateDisplayName(o, coachProfileId),
    displayEmail,
  };
}

function adaptCandidateAthleteOption(raw: unknown): AthleteAssignmentOption | null {
  const o = asRecord(raw);
  if (!o) return null;
  const athleteProfileId = readFirstNonEmptyString(o, ["athleteId"]);
  if (athleteProfileId === "") return null;
  const displayEmail = readFirstNonEmptyString(o, ["email"]);
  return {
    athleteProfileId,
    displayName: candidateDisplayName(o, athleteProfileId),
    displayEmail,
  };
}

export async function fetchEntityAssignmentCandidates(
  entityId: string,
): Promise<{
  athletes: AthleteAssignmentOption[];
  coaches: CoachAssignmentOption[];
}> {
  const id = entityId.trim();
  if (id === "") {
    throw {
      message: "entityId is required",
      status: 400,
      code: "ENTITY_ID_REQUIRED",
    };
  }
  const raw = await apiRequest(paths.entities.assignmentCandidates(id), {
    method: "GET",
    cache: "no-store",
  });
  const data = adaptBackendSuccess(raw);
  const { coaches: coachRows, athletes: athleteRows } =
    parseAssignmentCandidatesBody(data);

  const athleteById = new Map<string, AthleteAssignmentOption>();
  const coachById = new Map<string, CoachAssignmentOption>();
  for (const row of athleteRows) {
    const a = adaptCandidateAthleteOption(row);
    if (a !== null) {
      athleteById.set(a.athleteProfileId, a);
    }
  }
  for (const row of coachRows) {
    const c = adaptCandidateCoachOption(row);
    if (c !== null) {
      coachById.set(c.coachProfileId, c);
    }
  }

  const cmp = (
    x: { displayName: string; displayEmail: string },
    y: { displayName: string; displayEmail: string },
  ) =>
    assignmentOptionLabelSortKey(x).localeCompare(
      assignmentOptionLabelSortKey(y),
      undefined,
      { sensitivity: "base" },
    );

  const result = {
    athletes: [...athleteById.values()].sort(cmp),
    coaches: [...coachById.values()].sort(cmp),
  };
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.debug(
      "[ASSIGNMENT_REFRESH] fetched coaches:",
      result.coaches.map((coach) => ({
        value: coach.coachProfileId,
        label: coach.displayName,
        email: coach.displayEmail,
      })),
    );
  }
  return result;
}

export async function fetchAcademyAthletes(
  academyId: string,
): Promise<AthleteAssignmentOption[]> {
  const id = academyId.trim();
  if (id === "") {
    throw {
      message: "academyId is required",
      status: 400,
      code: "ACADEMY_ID_REQUIRED",
    };
  }
  const raw = await apiRequest(paths.academies.athletes(id), { method: "GET" });
  const data = adaptBackendSuccess(raw);
  const list = assertAcademyRosterArrayAfterUnwrap(data, "ACADEMY_ATHLETES_NOT_ARRAY");
  return list.reduce<AthleteAssignmentOption[]>((acc, row) => {
    const opt = adaptAcademyAthleteOption(row);
    if (opt !== null) acc.push(opt);
    return acc;
  }, []);
}

export async function fetchAcademyCoaches(
  academyId: string,
): Promise<CoachAssignmentOption[]> {
  const id = academyId.trim();
  if (id === "") {
    throw {
      message: "academyId is required",
      status: 400,
      code: "ACADEMY_ID_REQUIRED",
    };
  }
  const raw = await apiRequest(paths.academies.coaches(id), { method: "GET" });
  const data = adaptBackendSuccess(raw);
  const list = assertAcademyRosterArrayAfterUnwrap(data, "ACADEMY_COACHES_NOT_ARRAY");
  return list.reduce<CoachAssignmentOption[]>((acc, row) => {
    const opt = adaptAcademyCoachOption(row);
    if (opt !== null) acc.push(opt);
    return acc;
  }, []);
}

function assertEntityAssignmentsArrayAfterUnwrap(data: unknown): unknown[] {
  if (!Array.isArray(data)) {
    throw {
      message:
        "Assignments response must be a JSON array after unwrap (expected envelope data array)",
      status: 500,
      code: "ASSIGNMENTS_NOT_ARRAY",
      details: data,
    };
  }
  return data;
}

function normalizeEntityAssignmentRow(raw: unknown): EntityAssignmentRow | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;

  const assignmentId =
    typeof o.id === "string" && o.id.trim() !== "" ? o.id.trim() : "";
  const athleteProfileId =
    typeof o.athleteId === "string" && o.athleteId.trim() !== ""
      ? o.athleteId.trim()
      : "";
  const coachProfileId =
    typeof o.coachId === "string" && o.coachId.trim() !== ""
      ? o.coachId.trim()
      : "";

  if (assignmentId === "" || athleteProfileId === "" || coachProfileId === "") {
    return null;
  }

  const status =
    typeof o.status === "string" && o.status.trim() !== "" ? o.status.trim() : "—";
  const relationshipType =
    typeof o.relationshipType === "string" && o.relationshipType.trim() !== ""
      ? o.relationshipType.trim()
      : "—";
  const location =
    typeof o.location === "string" && o.location.trim() !== ""
      ? o.location.trim()
      : "—";
  const isPrimary = o.isPrimary === true;
  const createdAt = formatInvitationTimestamp(o.createdAt);

  const athleteName =
    typeof o.athleteName === "string" ? o.athleteName.trim() : "";
  const athleteEmail =
    typeof o.athleteEmail === "string" ? o.athleteEmail.trim() : "";
  const coachName =
    typeof o.coachName === "string" ? o.coachName.trim() : "";
  const coachEmail =
    typeof o.coachEmail === "string" ? o.coachEmail.trim() : "";

  return {
    assignmentId,
    athleteProfileId,
    athleteName,
    athleteEmail,
    coachProfileId,
    coachName,
    coachEmail,
    relationshipType,
    location,
    isPrimary,
    createdAt,
    status,
  };
}

export async function fetchEntityAssignments(
  entityId: string,
): Promise<EntityAssignmentRow[]> {
  const id = entityId.trim();
  if (id === "") {
    throw {
      message: "entityId is required",
      status: 400,
      code: "ENTITY_ID_REQUIRED",
    };
  }
  const raw = await apiRequest(paths.entities.assignments(id), { method: "GET" });
  const data = adaptBackendSuccess(raw);
  const list = assertEntityAssignmentsArrayAfterUnwrap(data);
  return list.reduce<EntityAssignmentRow[]>((acc, row) => {
    const normalized = normalizeEntityAssignmentRow(row);
    if (normalized !== null) acc.push(normalized);
    return acc;
  }, []);
}

/**
 * All ACTIVE coach–athlete assignment rows for one athlete (API order preserved).
 * Same `status === ACTIVE` filter as the Assignments workspace duplicate check.
 */
export function getActiveCoachAssignmentsForAthlete(
  athleteProfileId: string,
  assignments: EntityAssignmentRow[],
): EntityAssignmentRow[] {
  const aid = athleteProfileId.trim();
  if (aid === "") return [];
  return assignments.filter(
    (row) =>
      row.athleteProfileId === aid &&
      row.status.trim().toUpperCase() === "ACTIVE",
  );
}

export type CreateAthleteCoachAssignmentInput = {
  entityId: string;
  athleteProfileId: string;
  coachProfileId: string;
  isPrimary: boolean;
};

/**
 * POST /entities/:entityId/assignments/athlete-coach
 * Body uses API field names `athleteId` / `coachId` with **profile** UUIDs (not user ids).
 */
export async function createAthleteCoachAssignment(
  input: CreateAthleteCoachAssignmentInput,
): Promise<void> {
  const entityId = input.entityId.trim();
  const athleteProfileId = input.athleteProfileId.trim();
  const coachProfileId = input.coachProfileId.trim();
  if (entityId === "" || athleteProfileId === "" || coachProfileId === "") {
    throw {
      message: "entityId, athleteProfileId, and coachProfileId are required",
      status: 400,
      code: "ASSIGNMENT_INPUT_REQUIRED",
    };
  }
  const raw = await apiRequest(
    paths.entities.assignmentsAthleteCoach(entityId),
    {
      method: "POST",
      body: JSON.stringify({
        athleteId: athleteProfileId,
        coachId: coachProfileId,
        relationshipType: "STANDARD",
        location: "HQ",
        isPrimary: input.isPrimary,
      }),
    },
  );
  adaptBackendSuccess(raw);
}

export async function removeAthleteCoachAssignment(
  entityId: string,
  athleteProfileId: string,
  coachProfileId: string,
): Promise<void> {
  const eid = entityId.trim();
  const aid = athleteProfileId.trim();
  const cid = coachProfileId.trim();
  if (eid === "" || aid === "" || cid === "") {
    throw {
      message: "entityId, athleteProfileId, and coachProfileId are required",
      status: 400,
      code: "ASSIGNMENT_REMOVE_INPUT_REQUIRED",
    };
  }
  const raw = await apiRequest(paths.entities.unassignAthleteCoach(eid, aid, cid), {
    method: "DELETE",
  });
  adaptBackendSuccess(raw);
}

/** Profile from GET /academies/me or PATCH /academies/me (after unwrap). */
export type MyAcademyProfile = {
  academyId: string;
  entityId: string;
  name: string;
  address: string;
  phone: string;
  email: string;
};

export type MyAcademyContext = MyAcademyProfile | null;

function optionalStringField(
  o: Record<string, unknown>,
  key: string,
): string {
  const v = o[key];
  if (typeof v === "string") return v;
  return "";
}

/**
 * After unwrap, GET /academies/me `data` is either `null` or a flat profile object.
 */
function parseAcademyMeProfileData(data: unknown): MyAcademyProfile {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw {
      message: "Invalid academy profile response body",
      status: 500,
      code: "ACADEMY_ME_INVALID_BODY",
      details: data,
    };
  }
  const o = data as Record<string, unknown>;

  const academyId =
    typeof o.academyId === "string" && o.academyId.trim() !== ""
      ? o.academyId.trim()
      : "";
  const entityId =
    typeof o.entityId === "string" && o.entityId.trim() !== ""
      ? o.entityId.trim()
      : "";
  if (academyId === "" || entityId === "") {
    throw {
      message: "Academy profile response missing academyId or entityId",
      status: 500,
      code: "ACADEMY_ME_MISSING_IDS",
      details: data,
    };
  }

  return {
    academyId,
    entityId,
    name: optionalStringField(o, "name"),
    address: optionalStringField(o, "address"),
    phone: optionalStringField(o, "phone"),
    email: optionalStringField(o, "email"),
  };
}

function parseMyAcademyResponseData(data: unknown): MyAcademyContext {
  if (data === null || data === undefined) {
    return null;
  }
  return parseAcademyMeProfileData(data);
}

/**
 * GET /academies/me — current user academy (envelope unwrapped).
 * Returns null when `data` is null; throws when `data` is present but invalid.
 */
export async function fetchMyAcademy(): Promise<MyAcademyContext> {
  const raw = await apiRequest(paths.academies.me, { method: "GET" });
  const data = adaptBackendSuccess(raw);
  return parseMyAcademyResponseData(data);
}

export type PatchMyAcademyInput = {
  name: string;
  address: string;
  phone: string;
  email: string;
};

/**
 * PATCH /academies/me — update allowed profile fields (envelope unwrapped).
 */
export async function patchMyAcademy(
  input: PatchMyAcademyInput,
): Promise<MyAcademyProfile> {
  const raw = await apiRequest(paths.academies.me, {
    method: "PATCH",
    body: JSON.stringify({
      name: input.name,
      address: input.address,
      phone: input.phone,
      email: input.email,
    }),
  });
  const data = adaptBackendSuccess(raw);
  return parseAcademyMeProfileData(data);
}

/** GET /academies — success body is a raw JSON array (no `{ success, data }` envelope). */
export type AcademyListItem = {
  id: string;
  name: string;
  entityId: string;
  createdAt?: string;
  updatedAt?: string;
};

function parseAcademyListItem(raw: unknown): AcademyListItem | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = readFirstNonEmptyString(o, ["id", "academyId"]);
  const entityId = readFirstNonEmptyString(o, ["entityId", "entity_id"]);
  const name = readFirstNonEmptyString(o, ["name"]);
  if (id === "" || entityId === "" || name === "") return null;
  return {
    id,
    name,
    entityId,
    createdAt:
      typeof o.createdAt === "string" && o.createdAt.trim() !== ""
        ? o.createdAt.trim()
        : undefined,
    updatedAt:
      typeof o.updatedAt === "string" && o.updatedAt.trim() !== ""
        ? o.updatedAt.trim()
        : undefined,
  };
}

export async function fetchAcademyList(): Promise<AcademyListItem[]> {
  const raw = await apiRequest(paths.academies.root, { method: "GET" });
  const data = adaptBackendSuccess(raw);
  if (!Array.isArray(data)) {
    throw {
      message: "Academies list must be a JSON array",
      status: 500,
      code: "ACADEMIES_NOT_ARRAY",
      details: data,
    };
  }
  return data.reduce<AcademyListItem[]>((acc, row) => {
    const item = parseAcademyListItem(row);
    if (item !== null) acc.push(item);
    return acc;
  }, []);
}

function rosterRole(raw: unknown): string {
  const o = asRecord(raw);
  if (!o) return "";
  return typeof o.role === "string" ? o.role.trim() : "";
}

/**
 * KPI: full `GET /academies/:id/athletes` `data` array length (all membership rows).
 */
export async function fetchAcademyAthleteRosterCount(
  academyId: string,
): Promise<number> {
  const id = academyId.trim();
  if (id === "") {
    throw {
      message: "academyId is required",
      status: 400,
      code: "ACADEMY_ID_REQUIRED",
    };
  }
  const raw = await apiRequest(paths.academies.athletes(id), { method: "GET" });
  const data = adaptBackendSuccess(raw);
  const list = assertAcademyRosterArrayAfterUnwrap(data, "ACADEMY_ATHLETES_NOT_ARRAY");
  return list.length;
}

/**
 * KPI: rows on `GET /academies/:id/coaches` where `role === "COACH"` (excludes ENTITY_ADMIN, etc.).
 */
export async function fetchAcademyCoachRosterCount(
  academyId: string,
): Promise<number> {
  const id = academyId.trim();
  if (id === "") {
    throw {
      message: "academyId is required",
      status: 400,
      code: "ACADEMY_ID_REQUIRED",
    };
  }
  const raw = await apiRequest(paths.academies.coaches(id), { method: "GET" });
  const data = adaptBackendSuccess(raw);
  const list = assertAcademyRosterArrayAfterUnwrap(data, "ACADEMY_COACHES_NOT_ARRAY");
  return list.filter((row) => rosterRole(row) === "COACH").length;
}

/**
 * KPI: raw `GET /entities/:id/assignments` array length (no row-shape assumptions).
 */
export async function fetchEntityAssignmentCount(
  entityId: string,
): Promise<number> {
  const id = entityId.trim();
  if (id === "") {
    throw {
      message: "entityId is required",
      status: 400,
      code: "ENTITY_ID_REQUIRED",
    };
  }
  const raw = await apiRequest(paths.entities.assignments(id), { method: "GET" });
  const data = adaptBackendSuccess(raw);
  if (!Array.isArray(data)) {
    throw {
      message:
        "Assignments response must be a JSON array after unwrap (expected envelope data array)",
      status: 500,
      code: "ASSIGNMENTS_NOT_ARRAY",
      details: data,
    };
  }
  return data.length;
}
