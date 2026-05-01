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

function readStringArrayField(
  o: Record<string, unknown>,
  key: string,
): string[] {
  const value = o[key];
  if (!Array.isArray(value)) return [];
  return value.reduce<string[]>((acc, item) => {
    if (typeof item !== "string") return acc;
    const trimmed = item.trim();
    if (trimmed !== "") acc.push(trimmed);
    return acc;
  }, []);
}

function mergeDashboardRoot(data: unknown): Record<string, unknown> {
  const root = asRecord(data) ?? {};
  const nested = asRecord(root.data);
  if (!nested) return root;
  return { ...root, ...nested };
}

export type CoachMeDashboardData = {
  trainingEntityName: string;
  academyCoachRole: string;
  functions: string[];
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

  const functions = authority ? readStringArrayField(authority, "functions") : [];

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
    functions,
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

