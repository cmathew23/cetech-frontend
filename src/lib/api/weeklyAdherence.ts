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
  /** Prescribed drills or S&C exercises completed (item-based). */
  completedItems: number;
  /** Prescribed items with partial (0.5) credit. */
  partialItems: number;
  /** Prescribed items skipped or unlogged. */
  missedItems: number;
  /** Total prescribed items when provided in context. */
  plannedItems: number;
  /** Backend weighted completion credit when available. */
  completionCredit: number | null;
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
  /** Backend weighted meal-item follow credit when available. */
  completionCredit: number | null;
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

function readNumericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readFiniteNumber(value: unknown): number {
  return readNumericValue(value) ?? 0;
}

function readOptionalFiniteNumber(value: unknown): number | null {
  return readNumericValue(value);
}

function readFiniteNumberFromKeys(
  raw: Record<string, unknown>,
  keys: readonly string[],
): number {
  for (const key of keys) {
    const parsed = readNumericValue(raw[key]);
    if (parsed !== null) return parsed;
  }
  return 0;
}

function readNonNegIntFromKeys(
  raw: Record<string, unknown>,
  keys: readonly string[],
): number {
  for (const key of keys) {
    const parsed = readNumericValue(raw[key]);
    if (parsed !== null && parsed >= 0) return Math.floor(parsed);
  }
  return 0;
}

function readOptionalFiniteNumberFromKeys(
  raw: Record<string, unknown>,
  keys: readonly string[],
): number | null {
  for (const key of keys) {
    const parsed = readNumericValue(raw[key]);
    if (parsed !== null) return parsed;
  }
  return null;
}

function parseSessionDomainContext(raw: Record<string, unknown>): SessionDomainContext {
  return {
    completedItems: readNonNegInt(
      raw.completedItems ??
        raw.completedEntries ??
        raw.completedSessions ??
        raw.completedCount,
    ),
    partialItems: readNonNegInt(
      raw.partialItems ??
        raw.partialEntries ??
        raw.partialSessions ??
        raw.partialCount,
    ),
    missedItems: readNonNegInt(
      raw.missedItems ??
        raw.skippedItems ??
        raw.missedEntries ??
        raw.missedSessions ??
        raw.missedCount,
    ),
    plannedItems: readNonNegInt(
      raw.plannedItems ??
        raw.totalItems ??
        raw.totalPrescribedItems ??
        raw.prescribedItems ??
        raw.plannedEntries ??
        raw.plannedSessions,
    ),
    completionCredit: readOptionalFiniteNumberFromKeys(raw, [
      "completionCredit",
      "weightedCompletionCredit",
      "weightedExerciseCredit",
      "exerciseCompletionCredit",
      "drillCompletionCredit",
    ]),
    plannedDurationMinutes: readNonNegInt(raw.plannedDurationMinutes),
    actualDurationMinutes: readNonNegInt(raw.actualDurationMinutes),
  };
}

function parseNutritionDomainContext(raw: Record<string, unknown>): NutritionDomainContext {
  return {
    plannedCaloriesKcal: readFiniteNumberFromKeys(raw, [
      "plannedCaloriesKcal",
      "plannedCalories",
      "plannedKcal",
      "totalPlannedCaloriesKcal",
      "totalPlannedCalories",
    ]),
    actualCaloriesKcal: readFiniteNumberFromKeys(raw, [
      "actualCaloriesKcal",
      "actualCalories",
      "consumedCaloriesKcal",
      "consumedCalories",
      "loggedCaloriesKcal",
      "loggedCalories",
    ]),
    calorieGapKcal: readFiniteNumberFromKeys(raw, [
      "calorieGapKcal",
      "calorieGap",
      "caloriesGapKcal",
    ]),
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
    totalItems: readNonNegIntFromKeys(raw, [
      "totalItems",
      "totalPrescribedItems",
      "prescribedItems",
      "plannedItems",
    ]),
    completionCredit: readOptionalFiniteNumberFromKeys(raw, [
      "completionCredit",
      "weightedCompletionCredit",
      "weightedMealCredit",
      "mealCompletionCredit",
    ]),
  };
}

function nutritionContextHasSignal(raw: Record<string, unknown>): boolean {
  const signalKeys = [
    "fullItems",
    "halfItems",
    "notEatenItems",
    "totalItems",
    "totalPrescribedItems",
    "plannedCaloriesKcal",
    "plannedCalories",
    "actualCaloriesKcal",
    "actualCalories",
    "completionCredit",
    "weightedCompletionCredit",
  ] as const;
  return signalKeys.some((key) => key in raw);
}

function parseNutritionContextFromDomainRow(
  row: Record<string, unknown>,
): NutritionDomainContext | null {
  const contextRecord = asRecord(row.context);
  const merged: Record<string, unknown> = { ...row };
  if (contextRecord) {
    Object.assign(merged, contextRecord);
  }
  if (!nutritionContextHasSignal(merged)) return null;
  return parseNutritionDomainContext(merged);
}

function sessionContextHasSignal(raw: Record<string, unknown>): boolean {
  const signalKeys = [
    "completedItems",
    "completedEntries",
    "completedSessions",
    "partialItems",
    "partialEntries",
    "partialSessions",
    "missedItems",
    "missedSessions",
    "plannedItems",
    "totalItems",
    "totalPrescribedItems",
    "prescribedItems",
    "completionCredit",
    "weightedCompletionCredit",
    "plannedDurationMinutes",
    "actualDurationMinutes",
  ] as const;
  return signalKeys.some((key) => key in raw);
}

function parseSessionContextFromDomainRow(
  row: Record<string, unknown>,
): SessionDomainContext | null {
  const contextRecord = asRecord(row.context);
  const merged: Record<string, unknown> = { ...row };
  if (contextRecord) {
    Object.assign(merged, contextRecord);
  }
  if (!sessionContextHasSignal(merged)) return null;
  return parseSessionDomainContext(merged);
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
    context:
      domainKey === "NUTRITION"
        ? parseNutritionContextFromDomainRow(row)
        : parseSessionContextFromDomainRow(row),
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

export function resolveNutritionTotalPrescribedItems(
  ctx: NutritionDomainContext,
): number {
  if (ctx.totalItems > 0) return ctx.totalItems;
  return ctx.fullItems + ctx.halfItems + ctx.notEatenItems;
}

/** Weighted meal-item credit for display; prefers backend completionCredit. */
export function resolveNutritionCompletionCredit(
  ctx: NutritionDomainContext,
): number | null {
  if (ctx.completionCredit != null) return ctx.completionCredit;
  if (ctx.fullItems > 0 || ctx.halfItems > 0) {
    return ctx.fullItems + ctx.halfItems * 0.5;
  }
  return null;
}

export function shouldUseNutritionWeightedCreditLine(
  ctx: NutritionDomainContext,
): boolean {
  if (ctx.completionCredit != null) return true;
  return ctx.halfItems > 0;
}

export function resolveSessionTotalPrescribedItems(
  ctx: SessionDomainContext,
  plannedFallback: number,
): number {
  if (ctx.plannedItems > 0) return ctx.plannedItems;
  return plannedFallback;
}

export function resolveSessionCompletionCredit(
  ctx: SessionDomainContext,
): number | null {
  if (ctx.completionCredit != null) return ctx.completionCredit;
  if (ctx.completedItems > 0 || ctx.partialItems > 0) {
    return ctx.completedItems + ctx.partialItems * 0.5;
  }
  return null;
}

export function isNutritionContext(
  ctx: WeeklyAdherenceDomainContext | null | undefined,
): ctx is NutritionDomainContext {
  return (
    ctx != null &&
    ("plannedCaloriesKcal" in ctx ||
      "fullItems" in ctx ||
      "totalItems" in ctx ||
      "completionCredit" in ctx)
  );
}

export function isSessionContext(
  ctx: WeeklyAdherenceDomainContext | null | undefined,
): ctx is SessionDomainContext {
  return (
    ctx != null &&
    ("completedItems" in ctx ||
      "plannedDurationMinutes" in ctx ||
      "actualDurationMinutes" in ctx)
  );
}
