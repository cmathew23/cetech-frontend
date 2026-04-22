/**
 * Academy admin athletes — GET /academies/me/athletes (payload after adaptBackendSuccess).
 *
 * `data` is an array of flat athlete DTOs (camelCase).
 */

import { paths } from "@/config/endpoints";
import { apiRequest } from "@/lib/apiClient";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";

export type AcademyMeAthleteRow = {
  userId: string;
  displayName: string;
  email: string;
  membershipStatus: string;
  joinedAt: string;
  sport: string;
  level: string;
  athleteProfileId: string;
  membershipRole: string;
  lifecycle: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readStr(o: Record<string, unknown>, key: string): string {
  const v = o[key];
  if (typeof v !== "string") return "";
  return v.trim();
}

function parseJoinedAt(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") return "—";
  return value.trim();
}

/**
 * Same name parts as the Athletes table `displayName` when real names exist:
 * top-level `firstName` + `lastName` on the row (`parseMeAthleteRow`).
 * Does not fall back to email (callers add email fallback if needed).
 */
export function athleteTableNameFromRow(o: Record<string, unknown>): string {
  const firstName = readStr(o, "firstName");
  const lastName = readStr(o, "lastName");
  return [firstName, lastName].filter(Boolean).join(" ");
}

function parseMeAthleteRow(raw: unknown): AcademyMeAthleteRow | null {
  const o = asRecord(raw);
  if (!o) return null;

  const userId = readStr(o, "userId");
  if (userId === "") return null;

  const email = readStr(o, "email");
  const nameFromParts = athleteTableNameFromRow(o);
  const displayName =
    nameFromParts !== "" ? nameFromParts : email !== "" ? email : "—";

  return {
    userId,
    displayName,
    email: email !== "" ? email : "—",
    membershipStatus: readStr(o, "membershipStatus"),
    joinedAt: parseJoinedAt(o.joinedAt),
    sport: readStr(o, "sport"),
    level: readStr(o, "level"),
    athleteProfileId: readStr(o, "athleteProfileId"),
    membershipRole: readStr(o, "membershipRole"),
    lifecycle: readStr(o, "lifecycle"),
  };
}

export async function fetchMyAcademyAthletes(): Promise<AcademyMeAthleteRow[]> {
  const raw = await apiRequest(paths.academies.meAthletes, { method: "GET" });
  const data = adaptBackendSuccess(raw);
  if (!Array.isArray(data)) {
    throw {
      message:
        "GET /academies/me/athletes: expected `data` to be an array of athlete rows",
      status: 500,
      code: "ACADEMY_ME_ATHLETES_NOT_ARRAY",
      details: data,
    };
  }
  return data.reduce<AcademyMeAthleteRow[]>((acc, row) => {
    const n = parseMeAthleteRow(row);
    if (n !== null) acc.push(n);
    return acc;
  }, []);
}
