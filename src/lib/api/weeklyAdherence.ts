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
  plannedItems: number | null;
  completedItems: number | null;
};

export type WeeklyAdherenceSummary = {
  athleteId: string;
  weekStart: string;
  weekEnd: string;
  domains: Partial<Record<WeeklyAdherenceDomainKey, WeeklyAdherenceDomainSummary>>;
  overall: WeeklyAdherenceOverallSummary | null;
  visibleDomains: WeeklyAdherenceDomainKey[];
};

export type WeeklyAdherenceComparisonAvailability =
  | "COMPLETE"
  | "PARTIAL"
  | "NO_PLAN"
  | "NO_SESSIONS"
  | "NO_ADHERENCE";

export type WeeklyAdherenceComparisonStatus =
  | "COMPARABLE"
  | "NOT_COMPARABLE";

export type WeeklyAdherenceComparisonNutrients = {
  caloriesKcal: number | null;
  proteinG: number | null;
  carbohydrateG: number | null;
  fatG: number | null;
  fiberG: number | null;
  calciumMg: number | null;
  magnesiumMg: number | null;
  sodiumMg: number | null;
  potassiumMg: number | null;
};

export type WeeklyAdherenceComparisonNutritionDetail = {
  label: string | null;
  plannedNutrients: WeeklyAdherenceComparisonNutrients;
  consumedNutrients: WeeklyAdherenceComparisonNutrients;
  variance: WeeklyAdherenceComparisonNutrients;
};

export type WeeklyAdherenceComparisonSession = {
  plannedSessionId: string;
  trainingDayId: string;
  date: string;
  sessionType: string;
  domain: string;
  plannedDurationMinutes: number;
  logged: boolean;
  adherenceOutcome: string;
  completionPercent: number;
  actualDurationMinutes: number;
};

export type WeeklyAdherenceComparisonNutritionSession =
  WeeklyAdherenceComparisonSession & {
    totalPrescribedItems: number;
    loggedItems: number;
    completedItems: number;
    partialItems: number;
    skippedItems: number;
    unloggedItems: number;
    nutritionDetail: WeeklyAdherenceComparisonNutritionDetail;
  };

export type WeeklyAdherenceComparisonDailyBreakdown = {
  date: string;
  plannedSessions: number;
  loggedSessions: number;
  totalPrescribedItems: number;
  loggedItems: number;
  completedItems: number;
  partialItems: number;
  skippedItems: number;
  unloggedItems: number;
  completionCredit: number;
  adherencePercent: number;
  sessions: Array<
    WeeklyAdherenceComparisonSession | WeeklyAdherenceComparisonNutritionSession
  >;
};

export type WeeklyAdherenceComparisonWeeklyBreakdown = {
  plannedSessions: number;
  loggedSessions: number;
  totalPrescribedItems: number;
  loggedItems: number;
  completedItems: number;
  partialItems: number;
  skippedItems: number;
  unloggedItems: number;
  completionCredit: number;
  adherencePercent: number;
  context: Record<string, unknown>;
  plannedMinutes?: number;
  actualMinutes?: number;
  fullItems?: number;
  halfItems?: number;
  missedItems?: number;
  plannedCalories?: number;
  actualCalories?: number;
};

export type WeeklyAdherenceComparisonDomainBreakdown = {
  availability: WeeklyAdherenceComparisonAvailability;
  weekly: WeeklyAdherenceComparisonWeeklyBreakdown;
  daily: WeeklyAdherenceComparisonDailyBreakdown[];
};

export type WeeklyAdherenceComparisonSnapshot = {
  planningContextSnapshotId: string;
  planStartDate: string;
  planEndDate: string;
  weeklyAdherenceSummary: WeeklyAdherenceSummary;
  domainBreakdowns: Partial<
    Record<WeeklyAdherenceDomainKey, WeeklyAdherenceComparisonDomainBreakdown>
  >;
};

export type WeeklyAdherenceComparisonDomainDelta = {
  adherencePercent: number;
  plannedSessions: number;
  loggedSessions: number;
  completedItems: number;
  partialItems: number;
  skippedItems: number;
  unloggedItems: number;
  completionCredit: number;
  actualDurationMinutes: number | null;
};

export type WeeklyAdherenceComparisonDomain = {
  comparisonStatus: WeeklyAdherenceComparisonStatus;
  delta: WeeklyAdherenceComparisonDomainDelta | null;
};

export type WeeklyAdherenceComparisonOverallDelta = {
  adherencePercent: number;
  completedItems: number;
  plannedItems: number;
  partialItems: number;
  missedItems: number;
};

export type WeeklyAdherenceComparisonOverall = {
  comparisonStatus: WeeklyAdherenceComparisonStatus;
  delta: WeeklyAdherenceComparisonOverallDelta;
};

export type WeeklyAdherenceComparisonData = {
  athleteId: string;
  visibleDomains: WeeklyAdherenceDomainKey[];
  snapshotA: WeeklyAdherenceComparisonSnapshot;
  snapshotB: WeeklyAdherenceComparisonSnapshot;
  domains: Partial<
    Record<WeeklyAdherenceDomainKey, WeeklyAdherenceComparisonDomain>
  >;
  overall: WeeklyAdherenceComparisonOverall | null;
};

export type WeeklyAdherenceComparisonResponse = {
  message: string;
  data: WeeklyAdherenceComparisonData;
};

export type FetchWeeklyAdherenceComparisonParams = {
  entityId: string;
  athleteId: string;
  snapshotAId: string;
  snapshotBId: string;
};

export type WeeklyAdherenceSnapshotOption = {
  id: string;
  weekStart: string;
  weekEnd: string;
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

function readOptionalPercent(value: unknown): number | null {
  const parsed = readNumericValue(value);
  if (parsed === null) return null;
  return Math.max(0, Math.min(100, parsed));
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
  const adherencePercent = readOptionalPercent(
    row.adherencePercent ??
      row.overallAdherencePercent ??
      row.itemAdherencePercent ??
      row.percent,
  );
  if (adherencePercent === null) return null;
  return {
    plannedSessions: readNonNegInt(row.plannedSessions),
    loggedSessions: readNonNegInt(row.loggedSessions),
    adherencePercent,
    plannedItems: readOptionalFiniteNumberFromKeys(row, [
      "plannedItems",
      "totalItems",
      "totalPrescribedItems",
      "plannedItemCount",
    ]),
    completedItems: readOptionalFiniteNumberFromKeys(row, [
      "completedItems",
      "completedItemCount",
      "completionCredit",
      "weightedCompletionCredit",
    ]),
  };
}

function parseOverallSummaryFromRecord(
  record: Record<string, unknown>,
): WeeklyAdherenceOverallSummary | null {
  return (
    parseOverallSummary(record.overall) ??
    parseOverallSummary(record.overallSummary) ??
    parseOverallSummary(record.adherenceSummary) ??
    parseOverallSummary(record.summary)
  );
}

function weeklyAdherenceOverallDiagnostic(input: {
  rawResponse: unknown;
  parsed: WeeklyAdherenceSummary;
}) {
  if (process.env.NODE_ENV === "production") return;
  const rawRecord = asRecord(input.rawResponse);
  const unwrappedRecord = unwrapWeeklyAdherencePayload(input.rawResponse);
  const rawTopLevelKeys = rawRecord ? Object.keys(rawRecord) : [];
  const unwrappedTopLevelKeys = Object.keys(unwrappedRecord);
  const candidateFields = [
    "overall",
    "overallSummary",
    "adherenceSummary",
    "summary",
  ] as const;
  const matchedOverallField =
    candidateFields.find((field) => parseOverallSummary(unwrappedRecord[field]) !== null) ??
    null;
  console.info("[WeeklyAdherence overall diagnostic]", {
    rawTopLevelKeys,
    unwrappedTopLevelKeys,
    matchedOverallField,
    parsedOverall: input.parsed.overall,
    parsedDomainKeys: Object.keys(input.parsed.domains),
    shouldRenderOverall: input.parsed.overall !== null,
    hiddenReason:
      input.parsed.overall !== null
        ? null
        : "No backend overall adherence percent found in parsed payload.",
  });
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
    "athleteId" in record ||
    "overall" in record
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

    const summary = asRecord(record.summary);
    if (summary && looksLikeWeeklyAdherenceRecord(summary)) {
      current = summary;
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
    overall: parseOverallSummaryFromRecord(record),
    visibleDomains: parseVisibleDomains(record.visibleDomains),
  };
}

function readComparisonString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readComparisonNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readComparisonNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readComparisonNullableNumber(value: unknown): number | null {
  if (value === null) return null;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readComparisonBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function readComparisonVisibleDomains(raw: unknown): WeeklyAdherenceDomainKey[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (value): value is WeeklyAdherenceDomainKey =>
      typeof value === "string" &&
      DOMAIN_KEYS.includes(value as WeeklyAdherenceDomainKey),
  );
}

function parseComparisonNutrients(
  raw: unknown,
): WeeklyAdherenceComparisonNutrients {
  const record = asRecord(raw) ?? {};
  return {
    caloriesKcal: readComparisonNullableNumber(record.caloriesKcal),
    proteinG: readComparisonNullableNumber(record.proteinG),
    carbohydrateG: readComparisonNullableNumber(record.carbohydrateG),
    fatG: readComparisonNullableNumber(record.fatG),
    fiberG: readComparisonNullableNumber(record.fiberG),
    calciumMg: readComparisonNullableNumber(record.calciumMg),
    magnesiumMg: readComparisonNullableNumber(record.magnesiumMg),
    sodiumMg: readComparisonNullableNumber(record.sodiumMg),
    potassiumMg: readComparisonNullableNumber(record.potassiumMg),
  };
}

function parseComparisonNutritionDetail(
  raw: unknown,
): WeeklyAdherenceComparisonNutritionDetail {
  const record = asRecord(raw) ?? {};
  return {
    label: readComparisonNullableString(record.label),
    plannedNutrients: parseComparisonNutrients(record.plannedNutrients),
    consumedNutrients: parseComparisonNutrients(record.consumedNutrients),
    variance: parseComparisonNutrients(record.variance),
  };
}

function parseComparisonSessionBase(
  record: Record<string, unknown>,
): WeeklyAdherenceComparisonSession {
  return {
    plannedSessionId: readComparisonString(record.plannedSessionId),
    trainingDayId: readComparisonString(record.trainingDayId),
    date: readComparisonString(record.date),
    sessionType: readComparisonString(record.sessionType),
    domain: readComparisonString(record.domain),
    plannedDurationMinutes: readComparisonNumber(record.plannedDurationMinutes),
    logged: readComparisonBoolean(record.logged),
    adherenceOutcome: readComparisonString(record.adherenceOutcome),
    completionPercent: readComparisonNumber(record.completionPercent),
    actualDurationMinutes: readComparisonNumber(record.actualDurationMinutes),
  };
}

function parseComparisonSession(
  raw: unknown,
): WeeklyAdherenceComparisonSession | WeeklyAdherenceComparisonNutritionSession | null {
  const record = asRecord(raw);
  if (!record) return null;
  const base = parseComparisonSessionBase(record);
  if (!asRecord(record.nutritionDetail)) return base;
  return {
    ...base,
    totalPrescribedItems: readComparisonNumber(record.totalPrescribedItems),
    loggedItems: readComparisonNumber(record.loggedItems),
    completedItems: readComparisonNumber(record.completedItems),
    partialItems: readComparisonNumber(record.partialItems),
    skippedItems: readComparisonNumber(record.skippedItems),
    unloggedItems: readComparisonNumber(record.unloggedItems),
    nutritionDetail: parseComparisonNutritionDetail(record.nutritionDetail),
  };
}

function parseComparisonDailyBreakdown(
  raw: unknown,
): WeeklyAdherenceComparisonDailyBreakdown | null {
  const record = asRecord(raw);
  if (!record) return null;
  return {
    date: readComparisonString(record.date),
    plannedSessions: readComparisonNumber(record.plannedSessions),
    loggedSessions: readComparisonNumber(record.loggedSessions),
    totalPrescribedItems: readComparisonNumber(record.totalPrescribedItems),
    loggedItems: readComparisonNumber(record.loggedItems),
    completedItems: readComparisonNumber(record.completedItems),
    partialItems: readComparisonNumber(record.partialItems),
    skippedItems: readComparisonNumber(record.skippedItems),
    unloggedItems: readComparisonNumber(record.unloggedItems),
    completionCredit: readComparisonNumber(record.completionCredit),
    adherencePercent: readComparisonNumber(record.adherencePercent),
    sessions: Array.isArray(record.sessions)
      ? record.sessions
          .map(parseComparisonSession)
          .filter(
            (
              session,
            ): session is
              | WeeklyAdherenceComparisonSession
              | WeeklyAdherenceComparisonNutritionSession => session !== null,
          )
      : [],
  };
}

function copyOptionalComparisonNumber(
  target: WeeklyAdherenceComparisonWeeklyBreakdown,
  source: Record<string, unknown>,
  key:
    | "plannedMinutes"
    | "actualMinutes"
    | "fullItems"
    | "halfItems"
    | "missedItems"
    | "plannedCalories"
    | "actualCalories",
) {
  const value = source[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    target[key] = value;
  }
}

function parseComparisonWeeklyBreakdown(
  raw: unknown,
): WeeklyAdherenceComparisonWeeklyBreakdown {
  const record = asRecord(raw) ?? {};
  const parsed: WeeklyAdherenceComparisonWeeklyBreakdown = {
    plannedSessions: readComparisonNumber(record.plannedSessions),
    loggedSessions: readComparisonNumber(record.loggedSessions),
    totalPrescribedItems: readComparisonNumber(record.totalPrescribedItems),
    loggedItems: readComparisonNumber(record.loggedItems),
    completedItems: readComparisonNumber(record.completedItems),
    partialItems: readComparisonNumber(record.partialItems),
    skippedItems: readComparisonNumber(record.skippedItems),
    unloggedItems: readComparisonNumber(record.unloggedItems),
    completionCredit: readComparisonNumber(record.completionCredit),
    adherencePercent: readComparisonNumber(record.adherencePercent),
    context: { ...(asRecord(record.context) ?? {}) },
  };
  copyOptionalComparisonNumber(parsed, record, "plannedMinutes");
  copyOptionalComparisonNumber(parsed, record, "actualMinutes");
  copyOptionalComparisonNumber(parsed, record, "fullItems");
  copyOptionalComparisonNumber(parsed, record, "halfItems");
  copyOptionalComparisonNumber(parsed, record, "missedItems");
  copyOptionalComparisonNumber(parsed, record, "plannedCalories");
  copyOptionalComparisonNumber(parsed, record, "actualCalories");
  return parsed;
}

function parseComparisonAvailability(
  value: unknown,
): WeeklyAdherenceComparisonAvailability | null {
  return value === "COMPLETE" ||
    value === "PARTIAL" ||
    value === "NO_PLAN" ||
    value === "NO_SESSIONS" ||
    value === "NO_ADHERENCE"
    ? value
    : null;
}

function parseComparisonStatus(
  value: unknown,
): WeeklyAdherenceComparisonStatus | null {
  return value === "COMPARABLE" || value === "NOT_COMPARABLE" ? value : null;
}

function parseComparisonDomainBreakdown(
  raw: unknown,
): WeeklyAdherenceComparisonDomainBreakdown | null {
  const record = asRecord(raw);
  if (!record) return null;
  const availability = parseComparisonAvailability(record.availability);
  if (availability === null) return null;
  return {
    availability,
    weekly: parseComparisonWeeklyBreakdown(record.weekly),
    daily: Array.isArray(record.daily)
      ? record.daily
          .map(parseComparisonDailyBreakdown)
          .filter(
            (day): day is WeeklyAdherenceComparisonDailyBreakdown => day !== null,
          )
      : [],
  };
}

function parseComparisonDomainBreakdowns(
  raw: unknown,
): Partial<
  Record<WeeklyAdherenceDomainKey, WeeklyAdherenceComparisonDomainBreakdown>
> {
  const record = asRecord(raw) ?? {};
  const parsed: Partial<
    Record<WeeklyAdherenceDomainKey, WeeklyAdherenceComparisonDomainBreakdown>
  > = {};
  for (const domain of DOMAIN_KEYS) {
    const breakdown = parseComparisonDomainBreakdown(record[domain]);
    if (breakdown !== null) parsed[domain] = breakdown;
  }
  return parsed;
}

function parseComparisonSnapshot(
  raw: unknown,
): WeeklyAdherenceComparisonSnapshot {
  const record = asRecord(raw) ?? {};
  return {
    planningContextSnapshotId: readComparisonString(
      record.planningContextSnapshotId,
    ),
    planStartDate: readComparisonString(record.planStartDate),
    planEndDate: readComparisonString(record.planEndDate),
    weeklyAdherenceSummary: parseWeeklyAdherenceSummaryPayload(
      record.weeklyAdherenceSummary,
    ),
    domainBreakdowns: parseComparisonDomainBreakdowns(record.domainBreakdowns),
  };
}

function parseComparisonDomainDelta(
  raw: unknown,
): WeeklyAdherenceComparisonDomainDelta {
  const record = asRecord(raw) ?? {};
  return {
    adherencePercent: readComparisonNumber(record.adherencePercent),
    plannedSessions: readComparisonNumber(record.plannedSessions),
    loggedSessions: readComparisonNumber(record.loggedSessions),
    completedItems: readComparisonNumber(record.completedItems),
    partialItems: readComparisonNumber(record.partialItems),
    skippedItems: readComparisonNumber(record.skippedItems),
    unloggedItems: readComparisonNumber(record.unloggedItems),
    completionCredit: readComparisonNumber(record.completionCredit),
    actualDurationMinutes: readComparisonNullableNumber(
      record.actualDurationMinutes,
    ),
  };
}

function parseComparisonDomain(
  raw: unknown,
): WeeklyAdherenceComparisonDomain | null {
  const record = asRecord(raw);
  if (!record) return null;
  const comparisonStatus = parseComparisonStatus(record.comparisonStatus);
  if (comparisonStatus === null) return null;
  return {
    comparisonStatus,
    delta:
      record.delta === null ? null : parseComparisonDomainDelta(record.delta),
  };
}

function parseComparisonDomains(
  raw: unknown,
): Partial<Record<WeeklyAdherenceDomainKey, WeeklyAdherenceComparisonDomain>> {
  const record = asRecord(raw) ?? {};
  const parsed: Partial<
    Record<WeeklyAdherenceDomainKey, WeeklyAdherenceComparisonDomain>
  > = {};
  for (const domain of DOMAIN_KEYS) {
    const comparison = parseComparisonDomain(record[domain]);
    if (comparison !== null) parsed[domain] = comparison;
  }
  return parsed;
}

function parseComparisonOverall(
  raw: unknown,
): WeeklyAdherenceComparisonOverall | null {
  if (raw === null || raw === undefined) return null;
  const record = asRecord(raw);
  if (!record) return null;
  const comparisonStatus = parseComparisonStatus(record.comparisonStatus);
  const delta = asRecord(record.delta);
  if (comparisonStatus === null || delta === null) return null;
  return {
    comparisonStatus,
    delta: {
      adherencePercent: readComparisonNumber(delta.adherencePercent),
      completedItems: readComparisonNumber(delta.completedItems),
      plannedItems: readComparisonNumber(delta.plannedItems),
      partialItems: readComparisonNumber(delta.partialItems),
      missedItems: readComparisonNumber(delta.missedItems),
    },
  };
}

export function parseWeeklyAdherenceComparisonPayload(
  payload: unknown,
): WeeklyAdherenceComparisonResponse {
  const response = asRecord(payload) ?? {};
  const data = asRecord(response.data) ?? {};
  return {
    message: readComparisonString(response.message),
    data: {
      athleteId: readComparisonString(data.athleteId),
      visibleDomains: readComparisonVisibleDomains(data.visibleDomains),
      snapshotA: parseComparisonSnapshot(data.snapshotA),
      snapshotB: parseComparisonSnapshot(data.snapshotB),
      domains: parseComparisonDomains(data.domains),
      overall: parseComparisonOverall(data.overall),
    },
  };
}

export function parseWeeklyAdherenceSnapshotsPayload(
  payload: unknown,
): WeeklyAdherenceSnapshotOption[] {
  const response = asRecord(payload) ?? {};
  if (!Array.isArray(response.data)) return [];
  return response.data.reduce<WeeklyAdherenceSnapshotOption[]>(
    (snapshots, value) => {
      const snapshot = asRecord(value);
      const id = readComparisonString(
        snapshot?.planningContextSnapshotId,
      ).trim();
      if (id === "") return snapshots;
      snapshots.push({
        id,
        weekStart: readComparisonString(snapshot?.planStartDate),
        weekEnd: readComparisonString(snapshot?.planEndDate),
      });
      return snapshots;
    },
    [],
  );
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
  const parsed = parseWeeklyAdherenceSummaryPayload(raw);
  weeklyAdherenceOverallDiagnostic({ rawResponse: raw, parsed });
  return parsed;
}

export async function fetchWeeklyAdherenceSnapshots(params: {
  entityId: string;
  athleteId: string;
}): Promise<WeeklyAdherenceSnapshotOption[]> {
  const raw = await apiRequest(
    paths.entities.weeklyAdherenceSnapshots(
      params.entityId,
      params.athleteId,
    ),
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: WEEKLY_ADHERENCE_SUMMARY_TIMEOUT_MS,
    },
  );
  return parseWeeklyAdherenceSnapshotsPayload(raw);
}

export async function fetchWeeklyAdherenceComparison(
  params: FetchWeeklyAdherenceComparisonParams,
): Promise<WeeklyAdherenceComparisonResponse> {
  const raw = await apiRequest(
    paths.entities.weeklyAdherenceComparison(
      params.entityId,
      params.athleteId,
      {
        snapshotAId: params.snapshotAId,
        snapshotBId: params.snapshotBId,
      },
    ),
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: WEEKLY_ADHERENCE_SUMMARY_TIMEOUT_MS,
    },
  );
  return parseWeeklyAdherenceComparisonPayload(raw);
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
