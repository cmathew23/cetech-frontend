/**
 * Coach module — GET /coach/me/dashboard, GET /coach/me/assigned-athletes.
 * Unwraps via adaptBackendSuccess; parses only fields used by the coach dashboard UI.
 */

import { paths } from "@/config/endpoints";
import { apiRequest } from "@/lib/apiClient";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readStringField(o: Record<string, unknown>, key: string): string {
  const v = o[key];
  if (typeof v === "string" && v.trim() !== "") return v.trim();
  return "";
}

function readNonNegIntField(o: Record<string, unknown>, key: string): number | null {
  if (!(key in o)) return null;
  const v = o[key];
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return Math.floor(v);
  return null;
}

function readNonNegInt(o: Record<string, unknown>, keys: string[]): number {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
      return Math.floor(v);
    }
  }
  return 0;
}

function readOptionalNonNegInt(
  o: Record<string, unknown>,
  key: string,
): number | null {
  if (!(key in o)) return null;
  const v = o[key];
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
    return Math.floor(v);
  }
  return null;
}

function readBooleanField(o: Record<string, unknown>, key: string): boolean {
  const v = o[key];
  return v === true;
}

function mergeDashboardRoot(data: unknown): Record<string, unknown> {
  const root = asRecord(data) ?? {};
  const nested = asRecord(root.data);
  if (!nested) return root;
  return { ...root, ...nested };
}

function titleCaseEnumToken(raw: string): string {
  const token = raw.trim();
  if (token === "") return "";
  return token
    .split("_")
    .map((part) => {
      const p = part.trim().toLowerCase();
      if (p === "") return "";
      return `${p[0].toUpperCase()}${p.slice(1)}`;
    })
    .filter((p) => p !== "")
    .join(" ");
}

function formatFunctions(raw: unknown): string {
  if (raw === null || raw === undefined) return "—";
  if (typeof raw === "string") {
    const label = titleCaseEnumToken(raw);
    return label !== "" ? label : "—";
  }
  if (Array.isArray(raw)) {
    const labels = raw
      .filter((x): x is string => typeof x === "string")
      .map((x) => titleCaseEnumToken(x))
      .filter((x) => x !== "");
    return labels.length > 0 ? labels.join(", ") : "—";
  }
  return "—";
}

export type CoachMeDashboardData = {
  trainingEntityName: string;
  academyCoachRole: string;
  functionsDisplay: string;
  hasHeadCoachConfigured: boolean;
  trainingPlanReleaseMode: string;
  assignedAthleteCount: number;
};

export function parseCoachMeDashboardPayload(data: unknown): CoachMeDashboardData {
  const root = mergeDashboardRoot(data);
  const academy = asRecord(root.academy);
  const summary = asRecord(root.summary);
  const authority =
    asRecord(root.authority) ??
    asRecord(asRecord((asRecord(data) ?? {}).data)?.authority);
  const releaseGate =
    asRecord(root.releaseGate) ??
    asRecord(asRecord((asRecord(data) ?? {}).data)?.releaseGate);

  const trainingEntityName =
    readStringField(root, "trainingEntityName") ||
    (academy ? readStringField(academy, "trainingEntityName") : "") ||
    readStringField(root, "name") ||
    (academy ? readStringField(academy, "name") : "") ||
    "—";

  const academyCoachRole =
    (authority ? readStringField(authority, "academyCoachRole") : "") || "—";

  const functionsDisplay = authority ? formatFunctions(authority.functions) : "—";

  const hasHeadCoachConfiguredRaw =
    releaseGate?.hasHeadCoachConfigured === true || false;

  const trainingPlanReleaseMode =
    (releaseGate ? readStringField(releaseGate, "trainingPlanReleaseMode") : "") ||
    "—";

  const countFromRoot = readOptionalNonNegInt(root, "assignedAthleteCount");
  const countFromSummary = summary
    ? readOptionalNonNegInt(summary, "assignedAthleteCount")
    : null;
  const assignedAthleteCount =
    countFromRoot !== null
      ? countFromRoot
      : countFromSummary !== null
        ? countFromSummary
        : readNonNegInt(root, ["assignedAthleteCount"]) ||
          (summary ? readNonNegInt(summary, ["assignedAthleteCount"]) : 0);

  return {
    trainingEntityName,
    academyCoachRole,
    functionsDisplay,
    hasHeadCoachConfigured: hasHeadCoachConfiguredRaw,
    trainingPlanReleaseMode,
    assignedAthleteCount,
  };
}

export async function fetchCoachMeDashboard(): Promise<CoachMeDashboardData> {
  const raw = await apiRequest(paths.coach.meDashboard, {
    method: "GET",
    cache: "no-store",
  });
  const data = adaptBackendSuccess(raw);
  return parseCoachMeDashboardPayload(data);
}

export type CoachAssignedAthleteRow = {
  athleteId: string;
  hasPlanningProfile: boolean;
  displayName: string;
  email: string;
  lifecycle: string;
  membershipStatus: string;
};

function parseAssignedAthleteRow(raw: unknown): CoachAssignedAthleteRow | null {
  const o = asRecord(raw);
  if (!o) return null;
  const athleteId =
    readStringField(o, "athleteId") ||
    readStringField(o, "athleteUserId") ||
    readStringField(o, "userId");
  return {
    athleteId,
    hasPlanningProfile: readBooleanField(o, "hasPlanningProfile"),
    displayName:
      readStringField(o, "displayName") ||
      readStringField(o, "name") ||
      readStringField(o, "fullName") ||
      "—",
    email: readStringField(o, "email") || "—",
    lifecycle: readStringField(o, "lifecycle") || "—",
    membershipStatus:
      readStringField(o, "membershipStatus") ||
      readStringField(o, "status") ||
      "—",
  };
}

function assertAthletesArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const o = asRecord(data);
  if (!o) return [];
  const athletes = o.athletes;
  if (Array.isArray(athletes)) return athletes;
  const items = o.items;
  if (Array.isArray(items)) return items;
  return [];
}

export async function fetchCoachAssignedAthletes(): Promise<CoachAssignedAthleteRow[]> {
  const raw = await apiRequest(paths.coach.assignedAthletes, {
    method: "GET",
    cache: "no-store",
  });
  const data = adaptBackendSuccess(raw);
  const list = assertAthletesArray(data);
  return list.reduce<CoachAssignedAthleteRow[]>((acc, row) => {
    const n = parseAssignedAthleteRow(row);
    if (n !== null) acc.push(n);
    return acc;
  }, []);
}

/**
 * Human-readable label for `trainingPlanReleaseMode` values from the coach dashboard API.
 * Backend contract stays enum strings (e.g. DIRECT_RELEASE); this is display-only.
 */
export function formatTrainingPlanReleaseModeForUi(code: string): string {
  const c = code.trim().toUpperCase();
  if (c === "" || c === "—") return "—";
  switch (c) {
    case "DIRECT_RELEASE":
      return "Direct Release";
    case "HEAD_COACH_REVIEW":
      return "Head Coach Review";
    default:
      return titleCaseEnumToken(code) || code.trim();
  }
}

/** Matches admin roster wording for known academy coach role enums. */
export function formatAcademyCoachRoleForUi(role: string): string {
  const r = role.trim().toUpperCase();
  if (r === "" || r === "—") return "—";
  switch (r) {
    case "HEAD_COACH":
      return "Head Coach";
    case "ASSISTANT_COACH":
      return "Assistant Coach";
    default:
      return role.trim();
  }
}
