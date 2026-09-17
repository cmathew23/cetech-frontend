import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest } from "@/lib/apiClient";

const NUTRITION_PERFORMANCE_TIMEOUT_MS = 240_000;

export const NUTRITION_PERFORMANCE_MEAL_ORDER = [
  "BREAKFAST",
  "MID_MORNING_SNACK",
  "LUNCH",
  "MID_AFTERNOON_SNACK",
  "DINNER",
] as const;

export type NutritionPerformanceMealType =
  (typeof NUTRITION_PERFORMANCE_MEAL_ORDER)[number];

export type NutritionPerformanceMetric = {
  unit: string;
  weeklyPlanned: number | null;
  plannedToDate: number | null;
  actualToDate: number | null;
  deviationPercent: number | null;
};

export type NutritionPerformanceMealBreakdown = {
  mealType: string;
  weeklyPlannedCaloriesKcal: number | null;
  plannedToDateCaloriesKcal: number | null;
  actualToDateCaloriesKcal: number | null;
  deviationPercent: number | null;
};

export type NutritionPerformanceWeeklyTotals = {
  calories: NutritionPerformanceMetric | null;
  protein: NutritionPerformanceMetric | null;
  carbohydrates: NutritionPerformanceMetric | null;
  fat: NutritionPerformanceMetric | null;
  fiber: NutritionPerformanceMetric | null;
};

export type NutritionPerformanceData = {
  athleteId: string;
  weekStart: string;
  weekEnd: string;
  weeklyTotals: NutritionPerformanceWeeklyTotals;
  mealBreakdown: NutritionPerformanceMealBreakdown[];
};

export type NutritionPerformanceResponse = {
  message: string;
  data: NutritionPerformanceData;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function unwrapNutritionPerformancePayload(
  payload: unknown,
): Record<string, unknown> {
  let current: unknown = adaptBackendSuccess(payload);

  for (let depth = 0; depth < 4; depth += 1) {
    const record = asRecord(current);
    if (!record) return {};

    if ("weeklyTotals" in record || "mealBreakdown" in record) {
      return record;
    }

    const nested = asRecord(record.data);
    if (nested) {
      current = nested;
      continue;
    }

    return record;
  }

  return asRecord(current) ?? {};
}

function parseMetric(
  raw: unknown,
  fallbackUnit: string,
): NutritionPerformanceMetric | null {
  const record = asRecord(raw);
  if (!record) return null;
  const unit = readString(record.unit);
  return {
    unit: unit === "" ? fallbackUnit : unit,
    weeklyPlanned: readNullableNumber(record.weeklyPlanned),
    plannedToDate: readNullableNumber(record.plannedToDate),
    actualToDate: readNullableNumber(record.actualToDate),
    deviationPercent: readNullableNumber(record.deviationPercent),
  };
}

function parseMealBreakdown(raw: unknown): NutritionPerformanceMealBreakdown[] {
  if (!Array.isArray(raw)) return [];
  return raw.reduce<NutritionPerformanceMealBreakdown[]>((meals, value) => {
    const record = asRecord(value);
    if (!record) return meals;
    const mealType = readString(record.mealType);
    if (mealType === "") return meals;
    meals.push({
      mealType,
      weeklyPlannedCaloriesKcal: readNullableNumber(
        record.weeklyPlannedCaloriesKcal,
      ),
      plannedToDateCaloriesKcal: readNullableNumber(
        record.plannedToDateCaloriesKcal,
      ),
      actualToDateCaloriesKcal: readNullableNumber(
        record.actualToDateCaloriesKcal,
      ),
      deviationPercent: readNullableNumber(record.deviationPercent),
    });
    return meals;
  }, []);
}

export function parseNutritionPerformancePayload(
  payload: unknown,
): NutritionPerformanceData {
  const record = unwrapNutritionPerformancePayload(payload);
  const totals = asRecord(record.weeklyTotals) ?? {};

  return {
    athleteId: readString(record.athleteId),
    weekStart: readString(record.weekStart),
    weekEnd: readString(record.weekEnd),
    weeklyTotals: {
      calories: parseMetric(totals.calories, "kcal"),
      protein: parseMetric(totals.protein, "g"),
      carbohydrates: parseMetric(totals.carbohydrates, "g"),
      fat: parseMetric(totals.fat, "g"),
      fiber: parseMetric(totals.fiber, "g"),
    },
    mealBreakdown: parseMealBreakdown(record.mealBreakdown),
  };
}

export function hasNutritionPerformanceData(
  data: NutritionPerformanceData | null | undefined,
): boolean {
  if (!data) return false;
  const totals = data.weeklyTotals;
  const hasTotals = [
    totals.calories,
    totals.protein,
    totals.carbohydrates,
    totals.fat,
    totals.fiber,
  ].some((metric) => metric != null);
  return hasTotals || data.mealBreakdown.length > 0;
}

export type NutritionWeeklySummary = NutritionPerformanceData;

export type NutritionHistoryComparisonType = "NUTRIENT" | "MEAL";

export const NUTRITION_HISTORY_NUTRIENT_METRICS = [
  "calories",
  "protein",
  "carbohydrates",
  "fat",
  "fiber",
] as const;

export type NutritionHistoryNutrientMetric =
  (typeof NUTRITION_HISTORY_NUTRIENT_METRICS)[number];

function isNutrientMetric(
  value: string,
): value is NutritionHistoryNutrientMetric {
  return (NUTRITION_HISTORY_NUTRIENT_METRICS as readonly string[]).includes(
    value,
  );
}

export function nutritionDeviationForSelection(
  summary: NutritionWeeklySummary | null | undefined,
  type: NutritionHistoryComparisonType,
  metric: string,
): number | null {
  if (!summary) return null;
  if (type === "NUTRIENT") {
    if (!isNutrientMetric(metric)) return null;
    return summary.weeklyTotals[metric]?.deviationPercent ?? null;
  }
  const meal = summary.mealBreakdown.find((row) => row.mealType === metric);
  return meal?.deviationPercent ?? null;
}

export type NutritionDeviationPointChange = {
  direction: "up" | "down" | "same";
  points: number;
};

export function nutritionDeviationPointChange(
  currentDeviation: number | null,
  historicalDeviation: number | null,
): NutritionDeviationPointChange | null {
  if (currentDeviation === null || historicalDeviation === null) return null;
  const raw = currentDeviation - historicalDeviation;
  const points = Math.round(Math.abs(raw) * 10) / 10;
  if (raw === 0 || points === 0) {
    return { direction: "same", points: 0 };
  }
  return {
    direction: raw > 0 ? "up" : "down",
    points,
  };
}

export function formatNutritionHistoryChangeLabel(
  change: NutritionDeviationPointChange | null,
): string {
  if (change === null) return "—";
  if (change.direction === "up") return `↑ ${change.points.toFixed(1)} pp`;
  if (change.direction === "down") return `↓ ${change.points.toFixed(1)} pp`;
  return "→ 0.0 pp";
}

function parseHistoryWeekList(payload: unknown): unknown[] {
  const adapted = adaptBackendSuccess(payload);
  if (Array.isArray(adapted)) return adapted;

  const record = asRecord(adapted);
  if (!record) return [];

  if (Array.isArray(record.weeks)) return record.weeks;
  if (Array.isArray(record.history)) return record.history;
  if (Array.isArray(record.summaries)) return record.summaries;
  if (Array.isArray(record.data)) return record.data;

  const nested = asRecord(record.data);
  if (!nested) return [];
  if (Array.isArray(nested.weeks)) return nested.weeks;
  if (Array.isArray(nested.history)) return nested.history;
  if (Array.isArray(nested.summaries)) return nested.summaries;
  return [];
}

export function parseNutritionPerformanceHistoryPayload(
  payload: unknown,
): NutritionWeeklySummary[] {
  return parseHistoryWeekList(payload).reduce<NutritionWeeklySummary[]>(
    (weeks, value) => {
      const parsed = parseNutritionPerformancePayload(value);
      if (parsed.weekStart === "" || parsed.weekEnd === "") return weeks;
      weeks.push(parsed);
      return weeks;
    },
    [],
  );
}

export async function fetchNutritionPerformance(params: {
  entityId: string;
  athleteId: string;
  weekStart: string;
  weekEnd: string;
}): Promise<NutritionPerformanceData> {
  const raw = await apiRequest(
    paths.entities.nutritionPerformance(
      params.entityId,
      params.athleteId,
      { weekStart: params.weekStart, weekEnd: params.weekEnd },
    ),
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: NUTRITION_PERFORMANCE_TIMEOUT_MS,
    },
  );
  return parseNutritionPerformancePayload(raw);
}

export async function fetchNutritionPerformanceHistory(params: {
  entityId: string;
  athleteId: string;
}): Promise<NutritionWeeklySummary[]> {
  const raw = await apiRequest(
    paths.entities.nutritionPerformanceHistory(
      params.entityId,
      params.athleteId,
    ),
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: NUTRITION_PERFORMANCE_TIMEOUT_MS,
    },
  );
  return parseNutritionPerformanceHistoryPayload(raw);
}
