import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest } from "@/lib/apiClient";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readNonNegInt(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.floor(value);
}

function readPercent(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export type WeeklyAdherenceDomainKey =
  | "SKILL"
  | "NUTRITION"
  | "STRENGTH_CONDITIONING";

const DOMAIN_KEYS: WeeklyAdherenceDomainKey[] = [
  "SKILL",
  "NUTRITION",
  "STRENGTH_CONDITIONING",
];

export type WeeklyAdherenceRecentNote = {
  date: string;
  plannedSessionId: string;
  note: string;
};

export type WeeklyAdherenceDomainSummary = {
  plannedSessions: number;
  loggedSessions: number;
  adherencePercent: number;
  recentNotes: WeeklyAdherenceRecentNote[];
};

export type WeeklyAdherenceOverallSummary = {
  plannedSessions: number;
  loggedSessions: number;
  adherencePercent: number;
};

export type WeeklyAdherenceSummary = {
  athleteId: string;
  weekStart: string;
  weekEnd: string;
  domains: Partial<Record<WeeklyAdherenceDomainKey, WeeklyAdherenceDomainSummary>>;
  overall: WeeklyAdherenceOverallSummary | null;
  visibleDomains: WeeklyAdherenceDomainKey[];
};

function parseRecentNotes(raw: unknown): WeeklyAdherenceRecentNote[] {
  if (!Array.isArray(raw)) return [];
  return raw.reduce<WeeklyAdherenceRecentNote[]>((acc, item) => {
    const row = asRecord(item);
    if (!row) return acc;
    const note = readString(row.note);
    if (note === "") return acc;
    acc.push({
      date: readString(row.date),
      plannedSessionId: readString(row.plannedSessionId),
      note,
    });
    return acc;
  }, []);
}

function parseDomainSummary(raw: unknown): WeeklyAdherenceDomainSummary | null {
  const row = asRecord(raw);
  if (!row) return null;
  const recentNotes = parseRecentNotes(row.recentNotes);
  return {
    plannedSessions: readNonNegInt(row.plannedSessions),
    loggedSessions: readNonNegInt(row.loggedSessions),
    adherencePercent: readPercent(row.adherencePercent),
    recentNotes,
  };
}

function parseOverallSummary(raw: unknown): WeeklyAdherenceOverallSummary | null {
  if (raw === null || raw === undefined) return null;
  const row = asRecord(raw);
  if (!row) return null;
  return {
    plannedSessions: readNonNegInt(row.plannedSessions),
    loggedSessions: readNonNegInt(row.loggedSessions),
    adherencePercent: readPercent(row.adherencePercent),
  };
}

function parseVisibleDomains(raw: unknown): WeeklyAdherenceDomainKey[] {
  if (!Array.isArray(raw)) return [];
  return raw.reduce<WeeklyAdherenceDomainKey[]>((acc, item) => {
    const key = readString(item).toUpperCase();
    if (
      key === "SKILL" ||
      key === "NUTRITION" ||
      key === "STRENGTH_CONDITIONING"
    ) {
      acc.push(key);
    }
    return acc;
  }, []);
}

export function parseWeeklyAdherenceSummaryPayload(
  data: unknown,
): WeeklyAdherenceSummary {
  const root = asRecord(data) ?? {};
  const nested = asRecord(root.data);
  const record = nested ?? root;

  const domainsRaw = asRecord(record.domains) ?? {};
  const domains: Partial<
    Record<WeeklyAdherenceDomainKey, WeeklyAdherenceDomainSummary>
  > = {};

  for (const key of DOMAIN_KEYS) {
    const parsed = parseDomainSummary(domainsRaw[key]);
    if (parsed) domains[key] = parsed;
  }

  return {
    athleteId: readString(record.athleteId),
    weekStart: readString(record.weekStart),
    weekEnd: readString(record.weekEnd),
    domains,
    overall: parseOverallSummary(record.overall),
    visibleDomains: parseVisibleDomains(record.visibleDomains),
  };
}

export async function fetchWeeklyAdherenceSummary(params: {
  entityId: string;
  athleteId: string;
  weekStart: string;
  weekEnd: string;
}): Promise<WeeklyAdherenceSummary> {
  const raw = await apiRequest(
    paths.entities.weeklyAdherenceSummary(
      params.entityId,
      params.athleteId,
      { weekStart: params.weekStart, weekEnd: params.weekEnd },
    ),
    { method: "GET", cache: "no-store" },
  );
  return parseWeeklyAdherenceSummaryPayload(adaptBackendSuccess(raw));
}
