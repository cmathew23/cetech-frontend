import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest } from "@/lib/apiClient";

const WEEKLY_ADHERENCE_SUMMARY_TIMEOUT_MS = 240_000;

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
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(100, value));
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.min(100, parsed));
    }
  }
  return 0;
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

const DOMAIN_KEY_ALIASES: Record<string, WeeklyAdherenceDomainKey> = {
  SKILL: "SKILL",
  SKILLS: "SKILL",
  NUTRITION: "NUTRITION",
  STRENGTH_CONDITIONING: "STRENGTH_CONDITIONING",
  S_AND_C: "STRENGTH_CONDITIONING",
  SNC: "STRENGTH_CONDITIONING",
  "S&C": "STRENGTH_CONDITIONING",
};

export type WeeklyAdherenceRecentNote = {
  date: string;
  plannedSessionId: string;
  note: string;
};

export type SessionDomainContext = {
  completedSessions: number;
  partialSessions: number;
  missedSessions: number;
  plannedDurationMinutes: number;
  actualDurationMinutes: number;
};

export type NutritionDomainContext = {
  plannedCaloriesKcal: number;
  actualCaloriesKcal: number;
  calorieGapKcal: number;
  plannedProteinG: number;
  actualProteinG: number;
  plannedCarbohydrateG: number;
  actualCarbohydrateG: number;
  plannedFatG: number;
  actualFatG: number;
  fullItems: number;
  halfItems: number;
  notEatenItems: number;
  extraItems: number;
  totalItems: number;
};

export type WeeklyAdherenceDomainContext =
  | SessionDomainContext
  | NutritionDomainContext;

export type WeeklyAdherenceDomainSummary = {
  plannedSessions: number;
  loggedSessions: number;
  adherencePercent: number;
  recentNotes: WeeklyAdherenceRecentNote[];
  context: WeeklyAdherenceDomainContext | null;
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

function readFiniteNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
}

function parseSessionDomainContext(raw: Record<string, unknown>): SessionDomainContext {
  return {
    completedSessions: readNonNegInt(raw.completedSessions),
    partialSessions: readNonNegInt(raw.partialSessions),
    missedSessions: readNonNegInt(raw.missedSessions),
    plannedDurationMinutes: readNonNegInt(raw.plannedDurationMinutes),
    actualDurationMinutes: readNonNegInt(raw.actualDurationMinutes),
  };
}

function parseNutritionDomainContext(raw: Record<string, unknown>): NutritionDomainContext {
  return {
    plannedCaloriesKcal: readFiniteNumber(raw.plannedCaloriesKcal),
    actualCaloriesKcal: readFiniteNumber(raw.actualCaloriesKcal),
    calorieGapKcal: readFiniteNumber(raw.calorieGapKcal),
    plannedProteinG: readFiniteNumber(raw.plannedProteinG),
    actualProteinG: readFiniteNumber(raw.actualProteinG),
    plannedCarbohydrateG: readFiniteNumber(raw.plannedCarbohydrateG),
    actualCarbohydrateG: readFiniteNumber(raw.actualCarbohydrateG),
    plannedFatG: readFiniteNumber(raw.plannedFatG),
    actualFatG: readFiniteNumber(raw.actualFatG),
    fullItems: readNonNegInt(raw.fullItems),
    halfItems: readNonNegInt(raw.halfItems),
    notEatenItems: readNonNegInt(raw.notEatenItems),
    extraItems: readNonNegInt(raw.extraItems),
    totalItems: readNonNegInt(raw.totalItems),
  };
}

function parseDomainContext(
  domainKey: WeeklyAdherenceDomainKey | null,
  raw: unknown,
): WeeklyAdherenceDomainContext | null {
  const ctx = asRecord(raw);
  if (!ctx) return null;
  if (domainKey === "NUTRITION") return parseNutritionDomainContext(ctx);
  return parseSessionDomainContext(ctx);
}

function parseDomainSummary(
  raw: unknown,
  domainKey: WeeklyAdherenceDomainKey | null = null,
): WeeklyAdherenceDomainSummary | null {
  const row = asRecord(raw);
  if (!row) return null;
  return {
    plannedSessions: readNonNegInt(row.plannedSessions),
    loggedSessions: readNonNegInt(row.loggedSessions),
    adherencePercent: readPercent(row.adherencePercent),
    recentNotes: parseRecentNotes(row.recentNotes),
    context: parseDomainContext(domainKey, row.context),
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
    const key = DOMAIN_KEY_ALIASES[readString(item).toUpperCase()];
    if (key && !acc.includes(key)) acc.push(key);
    return acc;
  }, []);
}

function looksLikeWeeklyAdherenceRecord(record: Record<string, unknown>): boolean {
  return (
    "domains" in record ||
    "weekStart" in record ||
    "weekEnd" in record ||
    "athleteId" in record
  );
}

/** Unwrap `{ success, data }`, `{ message, data }`, or a direct summary object. */
export function unwrapWeeklyAdherencePayload(payload: unknown): Record<string, unknown> {
  let current: unknown = adaptBackendSuccess(payload);

  for (let depth = 0; depth < 4; depth += 1) {
    const record = asRecord(current);
    if (!record) return {};

    if (looksLikeWeeklyAdherenceRecord(record)) {
      return record;
    }

    const nested = record.data;
    if (nested !== undefined && nested !== null) {
      current = nested;
      continue;
    }

    return record;
  }

  return asRecord(current) ?? {};
}

function normalizeDomainKey(rawKey: string): WeeklyAdherenceDomainKey | null {
  return DOMAIN_KEY_ALIASES[rawKey.trim().toUpperCase()] ?? null;
}

export function parseWeeklyAdherenceSummaryPayload(
  payload: unknown,
): WeeklyAdherenceSummary {
  const record = unwrapWeeklyAdherencePayload(payload);

  const domainsRaw = asRecord(record.domains) ?? {};
  const domains: Partial<
    Record<WeeklyAdherenceDomainKey, WeeklyAdherenceDomainSummary>
  > = {};

  for (const key of DOMAIN_KEYS) {
    const parsed = parseDomainSummary(domainsRaw[key], key);
    if (parsed) domains[key] = parsed;
  }

  for (const [rawKey, rawValue] of Object.entries(domainsRaw)) {
    const normalized = normalizeDomainKey(rawKey);
    if (!normalized || domains[normalized]) continue;
    const parsed = parseDomainSummary(rawValue, normalized);
    if (parsed) domains[normalized] = parsed;
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
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: WEEKLY_ADHERENCE_SUMMARY_TIMEOUT_MS,
    },
  );
  return parseWeeklyAdherenceSummaryPayload(raw);
}

export function hasNutritionAdherenceDomain(
  summary: WeeklyAdherenceSummary | null | undefined,
): boolean {
  return summary?.domains.NUTRITION != null;
}

export function isNutritionContext(
  ctx: WeeklyAdherenceDomainContext | null | undefined,
): ctx is NutritionDomainContext {
  return ctx != null && "plannedCaloriesKcal" in ctx;
}

export function isSessionContext(
  ctx: WeeklyAdherenceDomainContext | null | undefined,
): ctx is SessionDomainContext {
  return ctx != null && "completedSessions" in ctx;
}
