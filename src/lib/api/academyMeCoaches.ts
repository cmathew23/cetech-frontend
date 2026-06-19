/**
 * Academy coaches admin — GET/PATCH /academies/me/coaches and GET /academies/me/coach-functions
 * (payloads after adaptBackendSuccess unwrap).
 *
 * GET /academies/me/coaches — coach rows: membershipStatus, academyCoachRole, functions.
 * GET /academies/me/coach-functions — after adaptBackendSuccess, `data` is
 * `{ value: string, label: string }[]` (HTTP envelope: `{ success: true, data: [...] }`).
 * PATCH /academies/me/coaches/:coachUserId — body { role, functions } (role never null).
 */

import { paths } from "@/config/endpoints";
import { apiRequest } from "@/lib/apiClient";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";

/** Set `NEXT_PUBLIC_DEBUG_COACH_ROLE=1` to log save/readback (remove when done debugging). */
function debugCoachRole(...args: unknown[]): void {
  if (process.env.NEXT_PUBLIC_DEBUG_COACH_ROLE !== "1") return;
  console.debug("[AcademyCoachRole]", ...args);
}

/** Matches API enum on GET; null if academyCoachRole missing or invalid. */
export type AcademyCoachRole = "HEAD_COACH" | "ASSISTANT_COACH" | null;

/** Role values allowed on PATCH and in the edit modal (always explicit). */
export type AcademyCoachAssignableRole = "HEAD_COACH" | "ASSISTANT_COACH";

export type AcademyCoachStructureRow = {
  coachUserId: string;
  /** Coach profile UUID when the API exposes it (links to assignment `coachId`). */
  coachProfileId?: string;
  firstName: string;
  lastName: string;
  email: string;
  membershipStatus: string;
  joinedAt: string;
  role: AcademyCoachRole;
  functions: string[];
};

export type FetchMyAcademyCoachesResult = {
  coaches: AcademyCoachStructureRow[];
};

export type PatchAcademyCoachStructureInput = {
  role: AcademyCoachAssignableRole;
  functions: string[];
};

/** Selectable coach function from GET /academies/me/coach-functions (`data` items). */
export type AcademyCoachFunctionOption = {
  value: string;
  label: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  if (typeof value === "string") return value.trim();
  return "";
}

function readFirstString(
  source: Record<string, unknown> | null,
  keys: string[],
): string {
  if (!source) return "";
  for (const key of keys) {
    const value = readString(source, key);
    if (value !== "") return value;
  }
  return "";
}

/** Coach row may expose names on the row, under `user`, or as snake_case / displayName. */
export function parseCoachPersonName(o: Record<string, unknown>): {
  firstName: string;
  lastName: string;
} {
  const user = asRecord(o.user);
  const firstFromRow =
    readFirstString(o, ["firstName", "first_name", "givenName", "given_name"]) ||
    readFirstString(user, ["firstName", "first_name", "givenName", "given_name"]);
  const lastFromRow =
    readFirstString(o, ["lastName", "last_name", "familyName", "family_name"]) ||
    readFirstString(user, ["lastName", "last_name", "familyName", "family_name"]);
  const displayName =
    readFirstString(o, [
      "displayName",
      "display_name",
      "fullName",
      "full_name",
      "name",
    ]) ||
    readFirstString(user, [
      "displayName",
      "display_name",
      "fullName",
      "full_name",
      "name",
    ]);
  if (firstFromRow !== "" || lastFromRow !== "") {
    return { firstName: firstFromRow, lastName: lastFromRow };
  }
  if (displayName !== "") {
    return { firstName: displayName, lastName: "" };
  }
  return { firstName: "", lastName: "" };
}

function normalizeRoleString(raw: string): AcademyCoachRole {
  const u = raw.trim().toUpperCase().replace(/-/g, "_");
  if (u === "HEAD_COACH") return "HEAD_COACH";
  if (u === "ASSISTANT_COACH") return "ASSISTANT_COACH";
  return null;
}

function parseAcademyCoachRole(value: unknown): AcademyCoachRole {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    if (value.trim() === "") return null;
    return normalizeRoleString(value);
  }
  return null;
}

/** Row role: academyCoachRole only (canonical). */
function parseRowRole(o: Record<string, unknown>): AcademyCoachRole {
  return parseAcademyCoachRole(o.academyCoachRole);
}

/** Row status: membershipStatus only (canonical). */
function parseMembershipStatus(o: Record<string, unknown>): string {
  const v = readString(o, "membershipStatus");
  return v !== "" ? v : "Unknown";
}

/** Row functions: `functions` array of string codes. */
function parseRowFunctions(o: Record<string, unknown>): string[] {
  const raw = o.functions;
  if (!Array.isArray(raw)) return [];
  return raw.reduce<string[]>((acc, x) => {
    if (typeof x === "string" && x.trim() !== "") acc.push(x.trim());
    return acc;
  }, []);
}

function extractCoachRows(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const o = asRecord(data);
  if (!o) {
    throw {
      message: "Academy coaches response has invalid shape",
      status: 500,
      code: "ACADEMY_ME_COACHES_INVALID",
      details: data,
    };
  }
  const list = o.coaches;
  if (!Array.isArray(list)) {
    throw {
      message: "Academy coaches response must be an array or { coaches: [] }",
      status: 500,
      code: "ACADEMY_ME_COACHES_NOT_ARRAY",
      details: data,
    };
  }
  return list;
}

function parseCoachStructureRow(raw: unknown): AcademyCoachStructureRow | null {
  const o = asRecord(raw);
  if (!o) return null;

  const userRec = asRecord(o.user);
  const coachUserId =
    readFirstString(o, ["coachUserId", "coach_user_id", "userId", "user_id"]) ||
    readFirstString(userRec, ["userId", "user_id", "id"]);
  if (coachUserId === "") return null;

  const coachNested =
    (userRec ? asRecord(userRec.coach) : null) ?? asRecord(o.coach);
  let coachProfileId =
    readString(o, "coachProfileId") || readString(o, "coach_profile_id");
  if (coachProfileId === "" && coachNested) {
    coachProfileId =
      readString(coachNested, "id") ||
      readString(coachNested, "coachProfileId") ||
      readString(coachNested, "coach_profile_id");
  }

  const joinedAt = readString(o, "joinedAt");
  const { firstName, lastName } = parseCoachPersonName(o);

  const row: AcademyCoachStructureRow = {
    coachUserId,
    firstName,
    lastName,
    email: readString(o, "email") || (userRec ? readString(userRec, "email") : ""),
    membershipStatus: parseMembershipStatus(o),
    joinedAt: joinedAt !== "" ? joinedAt : "—",
    role: parseRowRole(o),
    functions: parseRowFunctions(o),
  };
  if (coachProfileId !== "") {
    row.coachProfileId = coachProfileId;
  }
  return row;
}

export async function fetchMyAcademyCoaches(): Promise<FetchMyAcademyCoachesResult> {
  const raw = await apiRequest(paths.academies.meCoaches, { method: "GET" });
  debugCoachRole("GET /academies/me/coaches raw (after HTTP)", raw);
  const data = adaptBackendSuccess(raw);
  const rows = extractCoachRows(data);
  const coaches = rows.reduce<AcademyCoachStructureRow[]>((acc, row) => {
    const n = parseCoachStructureRow(row);
    if (n !== null) acc.push(n);
    return acc;
  }, []);
  debugCoachRole(
    "GET parsed table roles",
    coaches.map((c) => ({
      coachUserId: c.coachUserId,
      role: c.role,
    })),
  );
  return { coaches };
}

function parseCoachFunctionOptionsPayload(data: unknown): AcademyCoachFunctionOption[] {
  if (!Array.isArray(data)) {
    throw {
      message:
        "GET /academies/me/coach-functions: expected `data` to be an array of { value, label }",
      status: 500,
      code: "ACADEMY_COACH_FUNCTIONS_INVALID",
      details: data,
    };
  }
  return data.map((item, index) => {
    const o = asRecord(item);
    if (!o) {
      throw {
        message: `GET /academies/me/coach-functions: expected object at index ${index}`,
        status: 500,
        code: "ACADEMY_COACH_FUNCTIONS_INVALID",
        details: { index, item },
      };
    }
    const valueRaw = o.value;
    const labelRaw = o.label;
    if (typeof valueRaw !== "string" || valueRaw.trim() === "") {
      throw {
        message: `GET /academies/me/coach-functions: expected non-empty string value at index ${index}`,
        status: 500,
        code: "ACADEMY_COACH_FUNCTIONS_INVALID",
        details: { index, item },
      };
    }
    if (typeof labelRaw !== "string") {
      throw {
        message: `GET /academies/me/coach-functions: expected string label at index ${index}`,
        status: 500,
        code: "ACADEMY_COACH_FUNCTIONS_INVALID",
        details: { index, item },
      };
    }
    return {
      value: valueRaw.trim(),
      label: labelRaw.trim(),
    };
  });
}

/**
 * GET /academies/me/coach-functions — `data` must be `{ value, label }[]` after unwrap.
 */
export async function fetchAcademyCoachFunctionCatalog(): Promise<
  AcademyCoachFunctionOption[]
> {
  const raw = await apiRequest(paths.academies.meCoachFunctions, {
    method: "GET",
  });
  const data = adaptBackendSuccess(raw);
  return parseCoachFunctionOptionsPayload(data);
}

export async function patchMyAcademyCoachStructure(
  coachUserId: string,
  input: PatchAcademyCoachStructureInput,
): Promise<void> {
  const id = coachUserId.trim();
  if (id === "") {
    throw {
      message: "coachUserId is required",
      status: 400,
      code: "COACH_USER_ID_REQUIRED",
    };
  }
  const payload = {
    role: input.role,
    functions: input.functions,
  };
  const body = JSON.stringify(payload);
  debugCoachRole("PATCH body string", body);
  debugCoachRole("PATCH payload object", payload);
  const raw = await apiRequest(paths.academies.meCoach(id), {
    method: "PATCH",
    body,
  });
  debugCoachRole("PATCH /academies/me/coaches/:id raw (after HTTP)", raw);
  adaptBackendSuccess(raw);
}
