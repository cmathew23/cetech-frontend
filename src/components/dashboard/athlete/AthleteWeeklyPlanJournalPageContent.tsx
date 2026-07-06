"use client";

import { AthleteHeaderIdentityMetadata } from "@/components/dashboard/athlete/AthleteHeaderIdentityMetadata";
import {
  buildSportMetricsDrillKey,
  LogSportResultModal,
  type LoggedDrillResultSummary,
  type SportMetricsDrillLogContext,
} from "@/components/dashboard/athlete/LogSportResultModal";
import { useAthleteInvitationGate } from "@/components/dashboard/athlete/useAthleteInvitationGate";
import {
  normalizeSkillPrimaryGoalName,
  SkillGoalAttributionText,
} from "@/components/dashboard/SkillGoalAttribution";
import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { designSystem } from "@/config/design-system";
import { useAthletePlanningIdentifiers } from "@/hooks/useAthletePlanningIdentifiers";
import {
  fetchPlannedSessionAdherenceEvents,
  recordNutritionPlannedSessionAdherenceEvent,
  recordPlannedSessionAdherenceEvent,
  type AthleteSessionAdherenceEvent,
  type SessionAdherenceOutcome,
} from "@/lib/api/athleteSessionAdherence";
import {
  fetchAthleteWeeklyPlanJournal,
  type AthleteWeeklyPlanJournal,
  type AthleteWeeklyPlanJournalDay,
} from "@/lib/api/coachAthletePlanningReadiness";
import { isNormalizedApiError } from "@/lib/apiClient";
import {
  formatDateOnly,
  formatDateWithWeekday,
  getLocalDateKey,
  normalizeDateOnlyKey,
  parseToLocalDate,
} from "@/lib/dateTime";
import { formatEnumeratedLabel, toTitleCaseInput } from "@/lib/textFormat";
import { cn } from "@/lib/utils";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactElement,
} from "react";

type ViewState =
  | { phase: "loading" }
  | { phase: "ready"; journal: AthleteWeeklyPlanJournal }
  | { phase: "error"; message: string };

type Scalar = string | number | boolean;

const DOMAIN_SECTIONS = [
  {
    key: "SKILLS",
    label: "Skills",
    sectionTitle: "Skills",
    emptyMessage: "No skills session released for this day.",
  },
  {
    key: "NUTRITION",
    label: "Nutrition",
    sectionTitle: "Nutrition",
    emptyMessage: "No nutrition plan released for this day.",
  },
  {
    key: "S_AND_C",
    label: "Strength & Conditioning",
    sectionTitle: "Strength & Conditioning",
    emptyMessage: "No S&C session released for this day.",
  },
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isScalar(value: unknown): value is Scalar {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function isScalarArray(value: unknown): value is Scalar[] {
  return Array.isArray(value) && value.every((item) => isScalar(item));
}

function formatFieldLabel(key: string): string {
  const withSpaces = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
  return withSpaces === "" ? "Field" : toTitleCaseInput(withSpaces);
}

function formatScalarValue(value: Scalar): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "—";
  const trimmed = value.trim();
  if (trimmed === "") return "—";
  const looksLikeDate = /^\d{4}-\d{2}-\d{2}(?:[T ][^ ]+)?/.test(trimmed);
  if (looksLikeDate) {
    const formatted = formatDateOnly(trimmed, "");
    if (formatted !== "") return formatted;
  }
  if (/^[A-Z0-9_]+$/.test(trimmed)) return formatEnumeratedLabel(trimmed);
  return trimmed;
}

function joinScalarArray(values: Scalar[]): string {
  return values
    .map((value) => formatScalarValue(value))
    .filter((value) => value !== "—")
    .join(", ");
}

function summarizeUnknown(value: unknown): string | null {
  if (isScalar(value)) return formatScalarValue(value);
  if (isScalarArray(value)) {
    const joined = joinScalarArray(value);
    return joined !== "" ? joined : null;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? `${value.length} item(s)` : null;
  }
  if (!isRecord(value)) return null;

  const entries = Object.entries(value);
  for (const [key, fieldValue] of entries) {
    if (key === "id") continue;
    if (isScalar(fieldValue)) {
      const formatted = formatScalarValue(fieldValue);
      if (formatted !== "—") return formatted;
    }
  }
  return null;
}

/** Merge objective/intensity etc. from nested candidateMetadata when top-level is missing. */
function mergeJournalRecordCandidateFields(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...record };
  const pickMetadata = (): Record<string, unknown> | null => {
    const direct = merged.candidateMetadata;
    if (isRecord(direct)) return direct;
    const ss = merged.sessionStructure;
    if (!isRecord(ss)) return null;
    const nested = ss.candidateMetadata;
    return isRecord(nested) ? nested : null;
  };
  const md = pickMetadata();
  if (md) {
    for (const [key, value] of Object.entries(md)) {
      const cur = merged[key];
      const missing =
        cur === undefined ||
        cur === null ||
        (typeof cur === "string" && cur.trim() === "");
      if (missing && value !== undefined && value !== null) {
        merged[key] = value;
      }
    }
  }
  return merged;
}

const CALORIE_SOURCE_KEYS = [
  "calories",
  "Calories",
  "plannedCalories",
  "totalCalories",
  "kcal",
  "energyKcal",
  "energyCalories",
  "calorie",
  "Calorie",
] as const;

const PROTEIN_SOURCE_KEYS = [
  "protein",
  "Protein",
  "proteinGrams",
  "totalProtein",
  "proteinG",
] as const;

const CARB_SOURCE_KEYS = [
  "carbs",
  "Carbs",
  "carbohydrates",
  "carbohydrateGrams",
  "carbohydrate",
  "totalCarbs",
  "carbGrams",
] as const;

const FAT_SOURCE_KEYS = ["fat", "Fat", "fatGrams", "totalFat"] as const;

const FIBER_SOURCE_KEYS = [
  "plannedFiberG",
  "fiberG",
  "fiber",
  "Fiber",
  "fiberGrams",
  "totalFiber",
] as const;

/** Omit noisy planner labels from athlete-facing nutrition card titles/subtitles. */
const NUTRITION_JOURNAL_PRIMARY_SUPPRESS_KEYS = new Set(["itemType"]);

/** Skip descending into huge structural blobs when deep-scanning for macros (mergeJournalRecordCandidateFields already lifts candidateMetadata scalars). */
const NUTRITION_MACRO_SCAN_SKIP_DESCENT_KEYS = new Set([
  "sessionStructure",
  "sessionStructureSections",
  "sessionStructureRaw",
  "raw",
]);

/** Keys whose presence we report in dev diagnostics for weekly journal nutrition payloads. */
const NUTRITION_DIAGNOSTIC_KEYS = new Set([
  "calories",
  "calorie",
  "kcal",
  "plannedCalories",
  "totalCalories",
  "energyKcal",
  "protein",
  "proteinGrams",
  "carbs",
  "carbohydrate",
  "carbohydrateGrams",
  "fat",
  "fatGrams",
  "macros",
  "nutrition",
  "nutritionFacts",
  "nutrientTotals",
  "totals",
  "mealTotals",
  "dailyTotals",
  "candidateMetadata",
  "sessionStructure",
  "sessionStructureSections",
]);

function parseFiniteNumber(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (t === "") return null;
    const n = Number(t);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function objectFieldPresent(record: Record<string, unknown>, key: string): boolean {
  return (
    Object.prototype.hasOwnProperty.call(record, key) &&
    record[key] !== undefined &&
    record[key] !== null
  );
}

const NUTRITION_MACRO_BUCKET_WALK_CAP = 96;

function nutritionMacroBucketsDeep(root: Record<string, unknown>): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const seen = new WeakSet<object>();

  function walk(node: Record<string, unknown>) {
    if (out.length >= NUTRITION_MACRO_BUCKET_WALK_CAP) return;
    if (seen.has(node)) return;
    seen.add(node);
    out.push(node);
    for (const [k, v] of Object.entries(node)) {
      if (NUTRITION_MACRO_SCAN_SKIP_DESCENT_KEYS.has(k)) continue;
      if (isRecord(v) && !Array.isArray(v)) {
        walk(v);
      } else if (Array.isArray(v)) {
        for (const el of v) {
          if (out.length >= NUTRITION_MACRO_BUCKET_WALK_CAP) return;
          if (isRecord(el) && !Array.isArray(el)) {
            walk(el);
          }
        }
      }
    }
  }

  walk(root);
  return out;
}

/**
 * Pick the first explicitly-present numeric macro for a category across merged + nested blobs.
 * Display-only precedence walk — not an aggregate or estimate.
 */
function pickExplicitMacroNumber(
  merged: Record<string, unknown>,
  keys: readonly string[],
): number | null {
  for (const bucket of nutritionMacroBucketsDeep(merged)) {
    for (const key of keys) {
      if (!objectFieldPresent(bucket, key)) continue;
      const n = parseFiniteNumber(bucket[key]);
      if (n !== null) return n;
    }
  }
  return null;
}

/** Dev-only: locate diagnostic keys anywhere under nutrition payloads (arrays descend into first element only). */
function collectWeeklyJournalNutritionDiagnosticPaths(node: unknown, prefix: string, depth: number): string[] {
  if (depth > 10) return [];
  if (!isRecord(node)) return [];
  const paths: string[] = [];
  for (const [k, v] of Object.entries(node)) {
    const p = prefix === "" ? k : `${prefix}.${k}`;
    if (NUTRITION_DIAGNOSTIC_KEYS.has(k)) paths.push(p);
    if (isRecord(v) && !Array.isArray(v)) {
      paths.push(...collectWeeklyJournalNutritionDiagnosticPaths(v, p, depth + 1));
    } else if (Array.isArray(v) && v.length > 0 && depth < 8) {
      const head = v[0];
      if (isRecord(head)) {
        paths.push(...collectWeeklyJournalNutritionDiagnosticPaths(head, `${p}[0]`, depth + 1));
      }
    }
  }
  return paths;
}

function developmentLogWeeklyJournalNutritionInspection(journal: AthleteWeeklyPlanJournal) {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") return;

  const report: unknown[] = [];
  for (const day of journal.days) {
    for (let i = 0; i < day.nutrition.length; i++) {
      const entry = day.nutrition[i];
      const paths = collectWeeklyJournalNutritionDiagnosticPaths(entry, "", 0);
      report.push({
        dayDate: day.date,
        rootIndex: i,
        diagnosticPaths: paths,
        topKeys: isRecord(entry) ? Object.keys(entry).slice(0, 40) : [],
      });
      if (report.length >= 4) break;
    }
    if (report.length >= 4) break;
  }

  console.debug("[weekly-journal nutrition inspection]", {
    note:
      "Sample of first nutrition roots: diagnostic key paths + top-level keys. Expand objects in Network tab for full payloads.",
    samples: report,
  });
}

function formatCompactGrams(value: number): string {
  return `${formatGramsRounded(value)}g`;
}

export function formatNutritionMacroInlineClause(
  merged: Record<string, unknown>,
  options: { compact?: boolean } = {},
): string | null {
  const parts: string[] = [];
  const cal = pickExplicitMacroNumber(merged, CALORIE_SOURCE_KEYS);
  if (cal !== null) {
    parts.push(options.compact ? `${Math.round(cal)} kcal` : `Calories ${Math.round(cal)} kcal`);
  }
  const p = pickExplicitMacroNumber(merged, PROTEIN_SOURCE_KEYS);
  if (p !== null) {
    parts.push(options.compact ? `P ${formatCompactGrams(p)}` : `Protein ${formatGramsRounded(p)} g`);
  }
  const c = pickExplicitMacroNumber(merged, CARB_SOURCE_KEYS);
  if (c !== null) {
    parts.push(options.compact ? `C ${formatCompactGrams(c)}` : `Carbs ${formatGramsRounded(c)} g`);
  }
  const f = pickExplicitMacroNumber(merged, FAT_SOURCE_KEYS);
  if (f !== null) {
    parts.push(options.compact ? `F ${formatCompactGrams(f)}` : `Fat ${formatGramsRounded(f)} g`);
  }
  const fiber = pickExplicitMacroNumber(merged, FIBER_SOURCE_KEYS);
  if (fiber !== null) {
    parts.push(`Fiber ${formatCompactGrams(fiber)}`);
  }
  return parts.length > 0 ? parts.join(options.compact ? " · " : ", ") : null;
}

function formatGramsRounded(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  const rounded = Math.round(value * 10) / 10;
  if (Math.abs(Math.round(rounded) - rounded) < 1e-6) {
    return `${Math.round(rounded)}`;
  }
  return `${rounded.toFixed(1)}`;
}

function nutritionServingPhrase(merged: Record<string, unknown>): string | null {
  const serving = merged.serving;
  if (typeof serving === "string" && serving.trim() !== "") return serving.trim();
  const qtyParsed = parseFiniteNumber(merged.quantity);
  const unit = merged.unit;
  if (qtyParsed !== null) {
    const u = typeof unit === "string" && unit.trim() !== "" ? unit.trim() : "";
    const qtyStr =
      Math.abs(Math.round(qtyParsed) - qtyParsed) < 1e-6
        ? String(Math.round(qtyParsed))
        : String(qtyParsed);
    return u !== "" ? `${qtyStr} ${u}` : qtyStr;
  }
  return null;
}

type JournalNutritionTotals = {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
};

/** Same leaves used for rendering structured sections — totals only sum explicitly-present per-item macros. */
function collectNutritionFoodLeavesFromRoots(roots: unknown[]): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const root of roots) {
    if (!isRecord(root)) continue;
    const sections = extractJournalStructureSections(root);
    if (sections.length > 0) {
      for (const section of sections) {
        for (const rawItem of section.items) {
          if (isRecord(rawItem)) out.push(rawItem);
        }
      }
      continue;
    }
    const flat =
      Array.isArray(root.items) ? root.items : Array.isArray(root.Items) ? root.Items : [];
    for (const rawItem of flat) {
      if (isRecord(rawItem)) out.push(rawItem);
    }
  }
  return out;
}

export function deriveNutritionTotalsFromFoodLeaves(
  leaves: Record<string, unknown>[],
): JournalNutritionTotals {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fiber = 0;
  let hasCalories = false;
  let hasProtein = false;
  let hasCarbs = false;
  let hasFat = false;
  let hasFiber = false;

  for (const leaf of leaves) {
    const merged = mergeJournalRecordCandidateFields(leaf);
    const c = pickExplicitMacroNumber(merged, CALORIE_SOURCE_KEYS);
    if (c !== null) {
      calories += c;
      hasCalories = true;
    }
    const p = pickExplicitMacroNumber(merged, PROTEIN_SOURCE_KEYS);
    if (p !== null) {
      protein += p;
      hasProtein = true;
    }
    const cb = pickExplicitMacroNumber(merged, CARB_SOURCE_KEYS);
    if (cb !== null) {
      carbs += cb;
      hasCarbs = true;
    }
    const f = pickExplicitMacroNumber(merged, FAT_SOURCE_KEYS);
    if (f !== null) {
      fat += f;
      hasFat = true;
    }
    const fi = pickExplicitMacroNumber(merged, FIBER_SOURCE_KEYS);
    if (fi !== null) {
      fiber += fi;
      hasFiber = true;
    }
  }

  return {
    calories: hasCalories ? calories : null,
    protein: hasProtein ? protein : null,
    carbs: hasCarbs ? carbs : null,
    fat: hasFat ? fat : null,
    fiber: hasFiber ? fiber : null,
  };
}

export function nutritionTotalsToRows(
  totals: JournalNutritionTotals,
): Array<{ label: string; value: string }> {
  const hasAnyTotal = Object.values(totals).some((value) => value !== null);
  if (!hasAnyTotal) return [];
  return [
    {
      label: "Calories",
      value: totals.calories !== null ? `${Math.round(totals.calories)} kcal` : "—",
    },
    {
      label: "Protein",
      value: totals.protein !== null ? `${formatGramsRounded(totals.protein)} g` : "—",
    },
    {
      label: "Carbs",
      value: totals.carbs !== null ? `${formatGramsRounded(totals.carbs)} g` : "—",
    },
    {
      label: "Fat",
      value: totals.fat !== null ? `${formatGramsRounded(totals.fat)} g` : "—",
    },
    {
      label: "Fiber",
      value: totals.fiber !== null ? `${formatGramsRounded(totals.fiber)} g` : "—",
    },
  ];
}

export function formatNutritionTotalsCompactLine(
  totals: JournalNutritionTotals,
  options: { includeCaloriesLabel?: boolean } = {},
): string | null {
  const parts: string[] = [];
  if (totals.calories !== null) {
    parts.push(
      options.includeCaloriesLabel
        ? `Calories ${Math.round(totals.calories)} kcal`
        : `${Math.round(totals.calories)} kcal`,
    );
  }
  if (totals.protein !== null) parts.push(`Protein ${formatCompactGrams(totals.protein)}`);
  if (totals.carbs !== null) parts.push(`Carbs ${formatCompactGrams(totals.carbs)}`);
  if (totals.fat !== null) parts.push(`Fat ${formatCompactGrams(totals.fat)}`);
  if (totals.fiber !== null) parts.push(`Fiber ${formatCompactGrams(totals.fiber)}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

type PlannedWeeklyNutritionSummaryField = {
  label: string;
  aliases: readonly string[];
  unit: "kcal" | "g";
};

const PLANNED_WEEKLY_NUTRITION_SUMMARY_FIELDS: readonly PlannedWeeklyNutritionSummaryField[] = [
  {
    label: "Calories",
    aliases: [
      "calories",
      "caloriesKcal",
      "plannedCaloriesKcal",
      "plannedWeeklyCalories",
      "plannedWeeklyCaloriesKcal",
      "weeklyCalories",
      "weeklyCaloriesKcal",
      "totalWeeklyCalories",
      "totalWeeklyCaloriesKcal",
    ],
    unit: "kcal",
  },
  {
    label: "Protein",
    aliases: [
      "protein",
      "proteinG",
      "proteinGrams",
      "plannedProteinG",
      "plannedWeeklyProteinG",
      "plannedWeeklyProteinGrams",
      "weeklyProteinG",
      "weeklyProteinGrams",
      "totalWeeklyProteinG",
      "totalWeeklyProteinGrams",
    ],
    unit: "g",
  },
  {
    label: "Carbs",
    aliases: [
      "carbs",
      "carbsG",
      "carbsGrams",
      "carbohydrates",
      "carbohydrateG",
      "carbohydrateGrams",
      "plannedCarbohydrateG",
      "plannedWeeklyCarbsG",
      "plannedWeeklyCarbsGrams",
      "plannedWeeklyCarbohydrateG",
      "plannedWeeklyCarbohydrateGrams",
      "weeklyCarbsG",
      "weeklyCarbsGrams",
      "weeklyCarbohydrateG",
      "weeklyCarbohydrateGrams",
      "totalWeeklyCarbsG",
      "totalWeeklyCarbsGrams",
    ],
    unit: "g",
  },
  {
    label: "Fat",
    aliases: [
      "fat",
      "fatG",
      "fatGrams",
      "plannedFatG",
      "plannedWeeklyFatG",
      "plannedWeeklyFatGrams",
      "weeklyFatG",
      "weeklyFatGrams",
      "totalWeeklyFatG",
      "totalWeeklyFatGrams",
    ],
    unit: "g",
  },
  {
    label: "Fiber",
    aliases: [
      "fiber",
      "fiberG",
      "fiberGrams",
      "plannedFiberG",
      "plannedWeeklyFiberG",
      "plannedWeeklyFiberGrams",
      "weeklyFiberG",
      "weeklyFiberGrams",
      "totalWeeklyFiberG",
      "totalWeeklyFiberGrams",
    ],
    unit: "g",
  },
  {
    label: "Average daily calories",
    aliases: [
      "averageDailyCalories",
      "averageDailyCaloriesKcal",
      "avgDailyCalories",
      "avgDailyCaloriesKcal",
      "dailyAverageCalories",
      "dailyAverageCaloriesKcal",
      "plannedAverageDailyCalories",
      "plannedAverageDailyCaloriesKcal",
    ],
    unit: "kcal",
  },
  {
    label: "Average daily protein",
    aliases: [
      "averageDailyProtein",
      "averageDailyProteinG",
      "averageDailyProteinGrams",
      "avgDailyProtein",
      "avgDailyProteinG",
      "avgDailyProteinGrams",
      "dailyAverageProteinG",
      "dailyAverageProteinGrams",
      "plannedAverageDailyProteinG",
      "plannedAverageDailyProteinGrams",
    ],
    unit: "g",
  },
  {
    label: "Average daily carbs",
    aliases: [
      "averageDailyCarbs",
      "averageDailyCarbsG",
      "averageDailyCarbsGrams",
      "averageDailyCarbohydrateG",
      "averageDailyCarbohydrateGrams",
      "avgDailyCarbs",
      "avgDailyCarbsG",
      "avgDailyCarbsGrams",
      "dailyAverageCarbsG",
      "dailyAverageCarbsGrams",
      "plannedAverageDailyCarbsG",
      "plannedAverageDailyCarbsGrams",
    ],
    unit: "g",
  },
  {
    label: "Average daily fat",
    aliases: [
      "averageDailyFat",
      "averageDailyFatG",
      "averageDailyFatGrams",
      "avgDailyFat",
      "avgDailyFatG",
      "avgDailyFatGrams",
      "dailyAverageFatG",
      "dailyAverageFatGrams",
      "plannedAverageDailyFatG",
      "plannedAverageDailyFatGrams",
    ],
    unit: "g",
  },
  {
    label: "Average daily fiber",
    aliases: [
      "averageDailyFiber",
      "averageDailyFiberG",
      "averageDailyFiberGrams",
      "avgDailyFiber",
      "avgDailyFiberG",
      "avgDailyFiberGrams",
      "dailyAverageFiberG",
      "dailyAverageFiberGrams",
      "plannedAverageDailyFiberG",
      "plannedAverageDailyFiberGrams",
    ],
    unit: "g",
  },
];

const PLANNED_WEEKLY_NUTRITION_SUMMARY_CONTAINERS = [
  "plannedWeekSummary",
  "plannedWeeklySummary",
  "plannedWeeklyNutritionSummary",
  "plannedWeeklyTotals",
  "weeklyPlanSummary",
  "weeklySummary",
  "weeklyNutritionSummary",
  "weeklyTotals",
  "weekSummary",
  "nutritionWeeklySummary",
  "plannedSummary",
  "summary",
  "totals",
] as const;

function formatPlannedNutritionSummaryValue(value: unknown, unit: "kcal" | "g"): string | null {
  const parsed = parseFiniteNumber(value);
  if (parsed !== null) {
    return unit === "kcal" ? `${Math.round(parsed)} kcal` : `${formatGramsRounded(parsed)} g`;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function collectPlannedWeeklyNutritionSummaryCandidates(rawJournal: unknown): Record<string, unknown>[] {
  const root = isRecord(rawJournal) ? rawJournal : {};
  const record = isRecord(root.data) ? root.data : root;
  const domains = isRecord(record.domains) ? record.domains : {};
  const nutritionDomain = isRecord(domains.NUTRITION) ? domains.NUTRITION : null;
  const candidates: Record<string, unknown>[] = [];

  const pushRecord = (value: unknown) => {
    if (isRecord(value)) candidates.push(value);
  };

  if (nutritionDomain) {
    for (const key of PLANNED_WEEKLY_NUTRITION_SUMMARY_CONTAINERS) {
      pushRecord(nutritionDomain[key]);
    }
    pushRecord(nutritionDomain);
  }

  for (const key of [
    "nutritionPlannedWeekSummary",
    "nutritionPlannedWeeklySummary",
    "nutritionWeeklyPlanSummary",
    "nutritionWeeklySummary",
    "plannedWeeklyNutritionSummary",
    "weeklyNutritionSummary",
  ] as const) {
    pushRecord(record[key]);
  }

  return candidates;
}

export function buildNutritionWeeklySummaryRows(rawJournal: unknown): Array<{
  label: string;
  value: string;
}> {
  const candidates = collectPlannedWeeklyNutritionSummaryCandidates(rawJournal);
  const rows: Array<{ label: string; value: string }> = [];

  for (const field of PLANNED_WEEKLY_NUTRITION_SUMMARY_FIELDS) {
    let value: string | null = null;
    for (const candidate of candidates) {
      for (const alias of field.aliases) {
        if (!objectFieldPresent(candidate, alias)) continue;
        value = formatPlannedNutritionSummaryValue(candidate[alias], field.unit);
        if (value !== null) break;
      }
      if (value !== null) break;
    }
    if (value !== null) rows.push({ label: field.label, value });
  }

  return rows;
}

function renderNutritionDayTotalsPanel(entries: unknown[]) {
  const leaves = collectNutritionFoodLeavesFromRoots(entries);
  const derivedTotals = deriveNutritionTotalsFromFoodLeaves(leaves);
  const derivedRows = nutritionTotalsToRows(derivedTotals);

  if (derivedRows.length === 0) return null;

  const renderRows = (rows: Array<{ label: string; value: string }>, keyPrefix: string) =>
    rows.map((row) => (
      <div
        key={`${keyPrefix}-${row.label}-${row.value}`}
        className="grid grid-cols-[minmax(0,9rem)_1fr] gap-2 text-sm"
      >
        <dt className="font-medium text-textSecondary">{row.label}</dt>
        <dd className="min-w-0 text-textPrimary">{row.value}</dd>
      </div>
    ));

  return (
    <div className="rounded-lg border border-slate-200/90 bg-bg/80 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-textSecondary">
        Daily Nutrition Target
      </p>
      <dl className="mt-2 space-y-1">{renderRows(derivedRows, "day-derived")}</dl>
    </div>
  );
}

function formatDurationMinutesLabel(raw: unknown): string | null {
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) return null;
  const rounded = Math.round(raw);
  return `${rounded} min`;
}

function collectPrimaryLines(
  record: Record<string, unknown>,
  options?: { suppressKeys?: Set<string> },
): string[] {
  const suppressKeys = options?.suppressKeys ?? new Set<string>();
  const merged = mergeJournalRecordCandidateFields(record);
  const keys = [
    "title",
    "name",
    "label",
    "summary",
    "description",
    "objective",
    "mealType",
    "sessionType",
    "itemType",
    "notes",
  ];
  const lines: string[] = [];
  for (const key of keys) {
    if (suppressKeys.has(key)) continue;
    const value = merged[key];
    const summary = summarizeUnknown(value);
    if (summary && !lines.includes(summary)) {
      lines.push(summary);
    }
  }
  return lines;
}

/** Keys not flattened into scalar rows (handled by structured sections or noise). */
const JOURNAL_DETAIL_STRUCTURE_KEYS = new Set([
  "sessionStructure",
  "sessionStructureRaw",
  "sessionStructureSections",
  "candidateMetadata",
  "raw",
]);

/** Prefer readable athlete-facing rows first; remainder fills from other scalar fields. */
const JOURNAL_SCALAR_DETAIL_PRIORITY = [
  "objective",
  "plannedDurationMinutes",
  "durationMinutes",
  "intensity",
  "description",
  "notes",
  "plannedLoadMinutes",
  "isRestDay",
];

const JOURNAL_DEFAULT_HIDDEN_DETAIL_KEYS = new Set([
  "name",
  "title",
  "label",
  "sessionOrder",
  "sessionType",
  "hasItems",
  "HasItems",
  "has_items",
  "itemCount",
  "item_count",
  "itemsCount",
  "items_count",
  "itemTypes",
  "item_types",
  "childItemTypes",
  "nestedItemCount",
]);

const MAX_SCALAR_DETAIL_ROWS = 28;

export function collectDetailRows(record: Record<string, unknown>): Array<{ label: string; value: string }> {
  const merged = mergeJournalRecordCandidateFields(record);
  const seen = new Set<string>();
  const rows: Array<{ label: string; value: string }> = [];

  function pushRow(key: string, rawValue: unknown) {
    if (
      seen.has(key) ||
      key === "id" ||
      key === "trainingDayId" ||
      key === "assignedCoachId" ||
      key === "exerciseCatalogItemId" ||
      key === "nutritionCatalogItemId" ||
      JOURNAL_DEFAULT_HIDDEN_DETAIL_KEYS.has(key)
    ) {
      return;
    }
    let value: string | null = null;
    if (
      key === "plannedDurationMinutes" ||
      key === "durationMinutes" ||
      key === "plannedLoadMinutes"
    ) {
      const mins = formatDurationMinutesLabel(rawValue);
      if (mins) {
        seen.add(key);
        rows.push({ label: "Duration", value: mins });
      }
      return;
    }
    if (isScalar(rawValue)) {
      const formatted = formatScalarValue(rawValue);
      value = formatted !== "—" ? formatted : null;
    } else if (isScalarArray(rawValue)) {
      const joined = joinScalarArray(rawValue);
      value = joined !== "" ? joined : null;
    }
    if (!value) return;
    seen.add(key);
    rows.push({ label: formatFieldLabel(key), value });
  }

  for (const key of JOURNAL_SCALAR_DETAIL_PRIORITY) {
    pushRow(key, merged[key]);
  }
  for (const [key, value] of Object.entries(merged)) {
    if (JOURNAL_DETAIL_STRUCTURE_KEYS.has(key)) continue;
    pushRow(key, value);
  }
  return rows.slice(0, MAX_SCALAR_DETAIL_ROWS);
}

type LooseStructureSection = {
  key: string;
  items: unknown[];
  /** Fields on the meal/section wrapper (e.g. totals) excluding nested items. */
  mealScalarsSource: Record<string, unknown>;
};

/** Supports persisted-plan shapes: `sessionStructureSections[]` or `sessionStructure.{sectionKey}.items`. */
function extractJournalStructureSections(record: Record<string, unknown>): LooseStructureSection[] {
  const sections: LooseStructureSection[] = [];

  const readSectionItems = (entry: Record<string, unknown>): unknown[] => {
    if (Array.isArray(entry.items)) return entry.items;
    if (Array.isArray(entry.Items)) return entry.Items;
    return [];
  };

  const direct = record.sessionStructureSections;
  if (Array.isArray(direct)) {
    for (const entry of direct) {
      if (!isRecord(entry)) continue;
      const sectionKey =
        typeof entry.key === "string" && entry.key.trim() !== ""
          ? entry.key.trim()
          : "Activities";
      const items = readSectionItems(entry);
      if (items.length === 0) continue;
      const mealScalarsSource: Record<string, unknown> = { ...entry };
      delete mealScalarsSource.key;
      delete mealScalarsSource.items;
      delete mealScalarsSource.Items;
      sections.push({ key: sectionKey, items, mealScalarsSource });
    }
  }

  if (sections.length > 0) {
    return sections;
  }

  const ss = record.sessionStructure;
  if (isRecord(ss)) {
    for (const [sectionKey, nextValue] of Object.entries(ss)) {
      if (sectionKey === "candidateMetadata") continue;
      if (!isRecord(nextValue)) continue;
      const items = readSectionItems(nextValue);
      if (items.length === 0) continue;
      const mealScalarsSource: Record<string, unknown> = { ...nextValue };
      delete mealScalarsSource.items;
      delete mealScalarsSource.Items;
      sections.push({
        key: sectionKey.trim() !== "" ? sectionKey : "Activities",
        items,
        mealScalarsSource,
      });
    }
  }

  if (sections.length > 0) {
    return sections;
  }

  const flatItems = readSectionItems(record);
  if (flatItems.length === 0) {
    return sections;
  }

  const mealScalarsSource: Record<string, unknown> = { ...record };
  delete mealScalarsSource.items;
  delete mealScalarsSource.Items;
  sections.push({
    key: "Items",
    items: flatItems,
    mealScalarsSource,
  });

  return sections;
}

function getTotalPrescribedItems(item: Record<string, unknown>): number {
  return extractJournalStructureSections(item).reduce(
    (total, section) => total + section.items.length,
    0,
  );
}

const STRUCTURE_ITEM_ROW_PRIORITY = [
  "summary",
  "description",
  "sets",
  "reps",
  "durationMinutes",
  "intensity",
  "notes",
];

const STRUCTURE_ITEM_HIDDEN_DETAIL_KEYS = new Set([
  "label",
  "name",
  "title",
  "itemType",
  "mealType",
  "order",
  "Order",
  "itemOrder",
  "orderIndex",
  "index",
]);

export function collectStructureItemDetailRows(
  item: Record<string, unknown>,
): Array<{ label: string; value: string }> {
  const merged = mergeJournalRecordCandidateFields(item);
  const seen = new Set<string>();
  const rows: Array<{ label: string; value: string }> = [];

  function push(key: string, raw: unknown) {
    if (
      seen.has(key) ||
      key === "id" ||
      key === "exerciseCatalogItemId" ||
      key === "nutritionCatalogItemId" ||
      STRUCTURE_ITEM_HIDDEN_DETAIL_KEYS.has(key)
    ) {
      return;
    }
    let value: string | null = null;
    if (key === "durationMinutes") {
      const mins = formatDurationMinutesLabel(raw);
      if (mins) {
        seen.add(key);
        rows.push({ label: "Duration", value: mins });
      }
      return;
    }
    if (isScalar(raw)) {
      const formatted = formatScalarValue(raw);
      value = formatted !== "—" ? formatted : null;
    } else if (isScalarArray(raw)) {
      const joined = joinScalarArray(raw);
      value = joined !== "" ? joined : null;
    }
    if (!value) return;
    seen.add(key);
    rows.push({ label: formatFieldLabel(key), value });
  }

  for (const key of STRUCTURE_ITEM_ROW_PRIORITY) {
    push(key, merged[key]);
  }
  for (const [key, val] of Object.entries(merged)) {
    if (JOURNAL_DETAIL_STRUCTURE_KEYS.has(key)) continue;
    push(key, val);
  }
  return rows.slice(0, 16);
}

function structureItemHeading(item: Record<string, unknown>, index: number): string {
  const merged = mergeJournalRecordCandidateFields(item);
  for (const key of ["label", "name", "title", "summary"]) {
    const v = merged[key];
    if (typeof v === "string" && v.trim() !== "") return v.trim();
  }
  return `Item ${index + 1}`;
}

function nutritionStructuredItemLeadingLine(opts: {
  heading: string;
  hideHeading: boolean;
  serving: string | null;
  macros: string | null;
}) {
  const { heading, hideHeading, serving, macros } = opts;
  if (hideHeading && !serving && !macros) return null;

  return (
    <div className="space-y-1">
      {!hideHeading ? <p className="text-sm font-medium text-textPrimary">{heading}</p> : null}
      {serving ? <p className="text-xs text-textSecondary">Serving: {serving}</p> : null}
      {macros ? <p className="text-xs text-textSecondary">{macros}</p> : null}
    </div>
  );
}

type SkillsSportMetricsJournalOptions = {
  entityId: string;
  athleteId: string;
  trainingPlanVersionId: string;
  plannedSessionId: string;
  dayDate: string;
  sessionTitle: string;
  loggedDrillKeys: Record<string, LoggedDrillResultSummary>;
  onOpenLog: (context: SportMetricsDrillLogContext) => void;
};

function LoggedDrillSummaryInline({ summary }: { summary: LoggedDrillResultSummary }) {
  const parts: string[] = [];

  if (summary.attempts !== null && summary.successes !== null) {
    let ratePart = `${summary.successes}/${summary.attempts}`;
    if (summary.successRate !== null) {
      ratePart += ` (${summary.successRate.toFixed(1)}%)`;
    }
    parts.push(ratePart);
  } else if (summary.attempts !== null) {
    parts.push(`${summary.attempts} attempts`);
  }

  if (summary.qualityRating !== null) {
    parts.push(`Quality: ${summary.qualityRating}/5`);
  }

  if (summary.context) {
    parts.push(summary.context);
  }

  const missParts: string[] = [];
  if (summary.missesLeft != null && summary.missesLeft > 0)
    missParts.push(`L${summary.missesLeft}`);
  if (summary.missesRight != null && summary.missesRight > 0)
    missParts.push(`R${summary.missesRight}`);
  if (summary.missesShort != null && summary.missesShort > 0)
    missParts.push(`S${summary.missesShort}`);
  if (summary.missesLong != null && summary.missesLong > 0)
    missParts.push(`Lg${summary.missesLong}`);

  if (parts.length === 0 && missParts.length === 0) {
    return (
      <p className="mt-1.5 text-xs font-medium text-emerald-700">
        Sport result logged
      </p>
    );
  }

  return (
    <div className="mt-1.5 rounded border border-emerald-200/60 bg-emerald-50/40 px-2 py-1.5">
      <p className="text-[11px] font-semibold text-emerald-700">Result logged</p>
      {parts.length > 0 ? (
        <p className="mt-0.5 text-[11px] text-textSecondary">{parts.join(" · ")}</p>
      ) : null}
      {missParts.length > 0 ? (
        <p className="text-[11px] text-textSecondary">
          Misses: {missParts.join(" ")}
        </p>
      ) : null}
    </div>
  );
}

function readSessionTitleFromItem(item: Record<string, unknown>): string {
  const merged = mergeJournalRecordCandidateFields(item);
  for (const key of ["name", "title", "label"]) {
    const value = merged[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return "Skills session";
}

function renderJournalStructureSections(
  record: Record<string, unknown>,
  options?: {
    nutritionDomain?: boolean;
    skillDomain?: boolean;
    skillsSportMetrics?: SkillsSportMetricsJournalOptions;
  },
) {
  const sections = extractJournalStructureSections(record);
  if (sections.length === 0) return null;

  const nutritionDomain = options?.nutritionDomain === true;
  const skillDomain = options?.skillDomain === true;

  return (
    <div className="space-y-3 border-t border-slate-200/80 pt-2">
      {sections.map((section, sectionIdx) => {
        return (
          <div key={`${sectionIdx}-${section.key}`} className="space-y-2">
            {!nutritionDomain ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-textSecondary">
                {formatFieldLabel(section.key)}
              </p>
            ) : null}
            <div className="space-y-2">
              {section.items.map((rawItem, itemIndex) => {
                if (isScalar(rawItem)) {
                  return (
                    <p
                      key={`${sectionIdx}-${section.key}-s-${itemIndex}`}
                      className="rounded border border-slate-200/80 bg-white/60 px-2 py-1.5 text-sm text-textPrimary"
                    >
                      {formatScalarValue(rawItem)}
                    </p>
                  );
                }
                if (!isRecord(rawItem)) return null;

                if (!nutritionDomain) {
                  const mergedSkillItem = mergeJournalRecordCandidateFields(rawItem);
                  const heading = structureItemHeading(rawItem, itemIndex);
                  const itemRows = collectStructureItemDetailRows(rawItem);
                  const detailRows = itemRows.filter(
                    (row) =>
                      row.value.trim().toLowerCase() !== heading.trim().toLowerCase() &&
                      !(
                        skillDomain &&
                        (row.label === "Primary Goal Id" || row.label === "Primary Goal Name")
                      ),
                  );
                  const primaryGoalName = skillDomain
                    ? normalizeSkillPrimaryGoalName(mergedSkillItem.primaryGoalName)
                    : null;
                  const hideGenericHeading =
                    /^Item\s+\d+$/i.test(heading.trim()) && detailRows.length > 0;
                  const skillsSportMetrics = options?.skillsSportMetrics;
                  const drillLogContext: SportMetricsDrillLogContext | null =
                    skillsSportMetrics
                      ? {
                          entityId: skillsSportMetrics.entityId,
                          athleteId: skillsSportMetrics.athleteId,
                          trainingPlanVersionId:
                            skillsSportMetrics.trainingPlanVersionId,
                          plannedSessionId: skillsSportMetrics.plannedSessionId,
                          dayDate: skillsSportMetrics.dayDate,
                          sessionTitle: skillsSportMetrics.sessionTitle,
                          sectionKey: "skill",
                          drill: mergedSkillItem,
                          itemIndex,
                        }
                      : null;
                  const drillKey = drillLogContext
                    ? buildSportMetricsDrillKey(drillLogContext)
                    : null;
                  const drillSummary =
                    drillKey !== null
                      ? skillsSportMetrics?.loggedDrillKeys[drillKey] ?? null
                      : null;

                  return (
                    <div
                      key={`${sectionIdx}-${section.key}-${itemIndex}`}
                      className="rounded border border-slate-200/80 bg-white/60 p-2"
                    >
                      {!hideGenericHeading ? (
                        <p className="text-sm font-medium text-textPrimary">{heading}</p>
                      ) : null}
                      <SkillGoalAttributionText
                        primaryGoalName={primaryGoalName}
                        className={hideGenericHeading ? undefined : "mt-1"}
                      />
                      {detailRows.length > 0 ? (
                        <dl
                          className={hideGenericHeading ? "space-y-0.5" : "mt-1 space-y-0.5"}
                        >
                          {detailRows.map((row, rowIdx) => (
                            <div
                              key={`${sectionIdx}-${section.key}-${itemIndex}-r-${rowIdx}`}
                              className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-2 gap-y-0.5 text-xs"
                            >
                              <dt className="text-textSecondary">{row.label}</dt>
                              <dd className="min-w-0 break-words text-textPrimary">
                                {row.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : heading.startsWith("Item ") ? (
                        <p className="text-xs text-textSecondary">Structured entry</p>
                      ) : null}
                      {drillLogContext && skillsSportMetrics ? (
                        <div className="mt-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              className="text-xs"
                              onClick={() => skillsSportMetrics.onOpenLog(drillLogContext)}
                            >
                              Log Sport Result
                            </Button>
                          </div>
                          {drillSummary ? (
                            <LoggedDrillSummaryInline summary={drillSummary} />
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                }

                const mergedItem = mergeJournalRecordCandidateFields(rawItem);
                const heading = structureItemHeading(rawItem, itemIndex);
                const serving = nutritionServingPhrase(mergedItem);
                const macros = formatNutritionMacroInlineClause(mergedItem, { compact: true });
                const hideGenericHeading =
                  /^Item\s+\d+$/i.test(heading.trim()) &&
                  !!(serving || macros);

                const leading = nutritionStructuredItemLeadingLine({
                  heading,
                  hideHeading: hideGenericHeading,
                  serving,
                  macros,
                });

                return (
                  <div
                    key={`${sectionIdx}-${section.key}-${itemIndex}`}
                    className="rounded border border-slate-200/80 bg-white/60 p-2"
                  >
                    {leading}
                    {!leading && heading.startsWith("Item ") ? (
                      <p className="text-xs text-textSecondary">Structured entry</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function itemHeading(
  item: unknown,
  index: number,
  options?: { nutritionDomain?: boolean },
): string {
  if (isScalar(item)) {
    const value = formatScalarValue(item);
    return value === "—" ? `Entry ${index + 1}` : value;
  }
  if (isRecord(item)) {
    const primaryLines = collectPrimaryLines(
      item,
      options?.nutritionDomain === true
        ? { suppressKeys: NUTRITION_JOURNAL_PRIMARY_SUPPRESS_KEYS }
        : undefined,
    );
    if (primaryLines.length > 0) return primaryLines[0];
  }
  return `Entry ${index + 1}`;
}

type AdherenceJournalDomainKey = "SKILLS" | "S_AND_C" | "NUTRITION";

const ADHERENCE_ELIGIBLE_SESSION_TYPES = new Set([
  "SKILL",
  "STRENGTH_CONDITIONING",
]);

function prescribedWorkLabelForAdherenceDomain(
  domainKey: AdherenceJournalDomainKey,
): string {
  if (domainKey === "SKILLS") return "Prescribed Skill Drills";
  if (domainKey === "S_AND_C") return "Prescribed S&C Exercises";
  return "Prescribed Meal Items";
}

const ADHERENCE_OUTCOME_OPTIONS: Array<{
  value: SessionAdherenceOutcome;
  label: string;
}> = [
  { value: "COMPLETED", label: "Completed" },
  { value: "PARTIAL", label: "Partial" },
  { value: "SKIPPED", label: "Skipped" },
];

function readPlannedSessionIdFromItem(item: Record<string, unknown>): string | null {
  const id = item.id;
  if (typeof id !== "string") return null;
  const trimmed = id.trim();
  return trimmed === "" ? null : trimmed;
}

function readItemSessionType(item: Record<string, unknown>): string | null {
  const merged = mergeJournalRecordCandidateFields(item);
  const raw = merged.sessionType;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}

function isSessionAdherenceEligible(
  showAdherenceForm: boolean,
  item: Record<string, unknown>,
): boolean {
  if (!showAdherenceForm) return false;
  if (!readPlannedSessionIdFromItem(item)) return false;
  const sessionType = readItemSessionType(item);
  if (!sessionType) return false;
  return ADHERENCE_ELIGIBLE_SESSION_TYPES.has(sessionType);
}

function resolveAdherenceCompletionPercent(input: {
  outcome: SessionAdherenceOutcome;
  totalPrescribedItems: number;
  partialCompletedItemsRaw: string;
}):
  | { completionPercent: number }
  | { error: string } {
  const { outcome, totalPrescribedItems, partialCompletedItemsRaw } = input;
  if (outcome === "COMPLETED") return { completionPercent: 100 };
  if (outcome === "SKIPPED") return { completionPercent: 0 };
  if (totalPrescribedItems === 0 || totalPrescribedItems === 1) {
    return { completionPercent: 50 };
  }
  const parsed = Number(partialCompletedItemsRaw.trim());
  if (!Number.isInteger(parsed) || parsed < 1 || parsed >= totalPrescribedItems) {
    return {
      error: `Completed items must be a whole number from 1 to ${totalPrescribedItems - 1}.`,
    };
  }
  return {
    completionPercent: Math.round((parsed / totalPrescribedItems) * 100),
  };
}

function findLatestAthleteAdherenceEvent(
  events: AthleteSessionAdherenceEvent[],
): AthleteSessionAdherenceEvent | null {
  return (
    events.find(
      (event) => event.eventType === "RECORDED" || event.eventType === "UPDATED",
    ) ?? null
  );
}

function formatAdherenceOccurredAt(value: string | null): string {
  if (!value) return "—";
  const formatted = formatDateOnly(value, "");
  return formatted !== "" ? formatted : value;
}

export function formatAdherenceStatusLabel(
  event: Pick<AthleteSessionAdherenceEvent, "adherenceOutcome"> | null,
): string {
  if (!event) return "Not logged";
  return event.adherenceOutcome
    ? formatEnumeratedLabel(event.adherenceOutcome)
    : "Logged";
}

const NUTRITION_PORTION_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: "Not eaten" },
  { value: 0.5, label: "Half" },
  { value: 1, label: "Full" },
  { value: 1.25, label: "Extra" },
];

type NutritionAdherenceFoodRow = {
  plannedItemOrder: number;
  label: string;
  serving: string | null;
};

function isNutritionSessionAdherenceEligible(
  nutritionDomain: boolean,
  item: Record<string, unknown>,
): boolean {
  if (!nutritionDomain) return false;
  if (!readPlannedSessionIdFromItem(item)) return false;
  return readItemSessionType(item) === "NUTRITION";
}

function resolvePlannedItemOrderFromLeaf(
  leaf: Record<string, unknown>,
  fallbackIndex: number,
): number | null {
  const merged = mergeJournalRecordCandidateFields(leaf);
  const candidates = [
    merged.plannedItemOrder,
    merged.order,
    merged.Order,
    merged.itemOrder,
    merged.orderIndex,
    merged.index,
  ];
  for (const candidate of candidates) {
    const parsed = parseFiniteNumber(candidate);
    if (parsed !== null && Number.isInteger(parsed) && parsed >= 1) {
      return parsed;
    }
  }
  return fallbackIndex >= 0 ? fallbackIndex + 1 : null;
}

function nutritionFoodLabelFromLeaf(leaf: Record<string, unknown>, index: number): string {
  const merged = mergeJournalRecordCandidateFields(leaf);
  for (const key of ["label", "name", "title", "foodName", "itemName"] as const) {
    const raw = merged[key];
    if (typeof raw === "string" && raw.trim() !== "") return raw.trim();
  }
  return `Item ${index + 1}`;
}

function collectNutritionAdherenceFoodRows(sessionItem: Record<string, unknown>): {
  rows: NutritionAdherenceFoodRow[];
  hasUnresolvedOrder: boolean;
} {
  const leaves = collectNutritionFoodLeavesFromRoots([sessionItem]);
  const rows: NutritionAdherenceFoodRow[] = [];
  let hasUnresolvedOrder = false;

  leaves.forEach((leaf, index) => {
    const plannedItemOrder = resolvePlannedItemOrderFromLeaf(leaf, index);
    if (plannedItemOrder === null) {
      hasUnresolvedOrder = true;
      return;
    }
    rows.push({
      plannedItemOrder,
      label: nutritionFoodLabelFromLeaf(leaf, index),
      serving: nutritionServingPhrase(mergeJournalRecordCandidateFields(leaf)),
    });
  });

  return { rows, hasUnresolvedOrder };
}

function deriveConsumedNutritionTotalsFromEvent(
  event: AthleteSessionAdherenceEvent | null,
): JournalNutritionTotals {
  const totals: JournalNutritionTotals = {
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
  };
  if (!event?.items) return totals;

  for (const item of event.items) {
    if (typeof item.consumedCaloriesKcal === "number") {
      totals.calories = (totals.calories ?? 0) + item.consumedCaloriesKcal;
    }
    if (typeof item.consumedProteinG === "number") {
      totals.protein = (totals.protein ?? 0) + item.consumedProteinG;
    }
    if (typeof item.consumedCarbohydrateG === "number") {
      totals.carbs = (totals.carbs ?? 0) + item.consumedCarbohydrateG;
    }
    if (typeof item.consumedFatG === "number") {
      totals.fat = (totals.fat ?? 0) + item.consumedFatG;
    }
    if (typeof item.consumedFiberG === "number") {
      totals.fiber = (totals.fiber ?? 0) + item.consumedFiberG;
    }
  }

  return totals;
}

function portionFactorsFromLatestEvent(
  event: AthleteSessionAdherenceEvent | null,
): Record<number, number> {
  const map: Record<number, number> = {};
  if (!event?.items) return map;
  for (const item of event.items) {
    map[item.plannedItemOrder] = item.consumedPortionFactor;
  }
  return map;
}

function NutritionSessionAdherencePanel({
  plannedSessionId,
  sessionItem,
  canLogAdherence = true,
  loggingOpensOn,
}: {
  plannedSessionId: string;
  sessionItem: Record<string, unknown>;
  canLogAdherence?: boolean;
  loggingOpensOn?: string;
}) {
  const { rows: foodRows, hasUnresolvedOrder } = useMemo(
    () => collectNutritionAdherenceFoodRows(sessionItem),
    [sessionItem],
  );

  const [historyPhase, setHistoryPhase] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [events, setEvents] = useState<AthleteSessionAdherenceEvent[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [portionByOrder, setPortionByOrder] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    variant: "success" | "danger";
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHistoryPhase("loading");
    void (async () => {
      try {
        const fetched = await fetchPlannedSessionAdherenceEvents(plannedSessionId);
        if (cancelled) return;
        setEvents(fetched);
        setHistoryPhase("ready");
      } catch {
        if (cancelled) return;
        setEvents([]);
        setHistoryPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [plannedSessionId, reloadKey]);

  const latestAthleteEvent = useMemo(
    () => findLatestAthleteAdherenceEvent(events),
    [events],
  );
  const loggedIntakeSummary = useMemo(
    () =>
      formatNutritionTotalsCompactLine(
        deriveConsumedNutritionTotalsFromEvent(latestAthleteEvent),
      ),
    [latestAthleteEvent],
  );

  useEffect(() => {
    const prefilled = portionFactorsFromLatestEvent(latestAthleteEvent);
    const next: Record<number, number> = {};
    for (const row of foodRows) {
      next[row.plannedItemOrder] =
        prefilled[row.plannedItemOrder] ?? 0;
    }
    setPortionByOrder(next);
    setNotes(latestAthleteEvent?.athleteNotes ?? "");
  }, [foodRows, latestAthleteEvent, plannedSessionId, reloadKey]);

  const handleSubmit = useCallback(async () => {
    if (!canLogAdherence) {
      return;
    }
    if (hasUnresolvedOrder) {
      setSubmitMessage({
        variant: "danger",
        text: "Cannot log adherence until each food item has a valid order.",
      });
      return;
    }
    if (foodRows.length === 0) {
      setSubmitMessage({
        variant: "danger",
        text: "No loggable meal items found for this session.",
      });
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);
    try {
      const eventType = latestAthleteEvent ? "UPDATED" : "RECORDED";
      await recordNutritionPlannedSessionAdherenceEvent(plannedSessionId, {
        eventType,
        items: foodRows.map((row) => ({
          plannedItemOrder: row.plannedItemOrder,
          consumedPortionFactor: portionByOrder[row.plannedItemOrder] ?? 0,
        })),
        ...(notes.trim() !== "" ? { notes: notes.trim() } : {}),
      });
      setSubmitMessage({ variant: "success", text: "Nutrition adherence saved." });
      setReloadKey((current) => current + 1);
    } catch (error) {
      setSubmitMessage({
        variant: "danger",
        text: isNormalizedApiError(error)
          ? error.message
          : "Could not save nutrition adherence.",
      });
    } finally {
      setSubmitting(false);
    }
  }, [
    canLogAdherence,
    foodRows,
    hasUnresolvedOrder,
    latestAthleteEvent,
    notes,
    portionByOrder,
    plannedSessionId,
  ]);

  const submitDisabled =
    submitting || !canLogAdherence || hasUnresolvedOrder || foodRows.length === 0;
  const statusLabel = formatAdherenceStatusLabel(latestAthleteEvent);

  return (
    <div className="mt-4 rounded-xl border border-orange-200/90 border-l-4 border-l-orange-500 bg-orange-50/90 p-4 shadow-sm ring-1 ring-orange-100/80">
      <div className="flex flex-col gap-2 border-b border-orange-200/80 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-textPrimary">Log nutrition intake</h4>
          <p className="mt-1 text-xs leading-relaxed text-textSecondary">
            Update the foods you ate for this meal.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-orange-200 bg-white/80 px-2.5 py-1 text-xs font-semibold text-orange-700">
          {statusLabel}
        </span>
      </div>

      {historyPhase === "loading" ? (
        <p className="mt-2.5 text-xs text-textSecondary">Loading adherence…</p>
      ) : null}

      {historyPhase === "error" ? (
        <p className="mt-2.5 text-xs text-textSecondary">
          Previous adherence status unavailable. You can still log this meal.
        </p>
      ) : null}

      {historyPhase === "ready" && latestAthleteEvent ? (
        <dl className="mt-3 space-y-1 rounded-lg border border-orange-100 bg-white/55 p-2.5 text-xs">
          {latestAthleteEvent.athleteNotes ? (
            <div className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-2">
              <dt className="text-textSecondary">Note</dt>
              <dd className="min-w-0 break-words text-textPrimary">
                {latestAthleteEvent.athleteNotes}
              </dd>
            </div>
          ) : null}
          <div className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-2">
            <dt className="text-textSecondary">Logged</dt>
            <dd className="text-textPrimary">
              {formatAdherenceOccurredAt(latestAthleteEvent.occurredAt)}
            </dd>
          </div>
        </dl>
      ) : null}

      {loggedIntakeSummary ? (
        <div className="mt-3 rounded-lg border border-orange-100 bg-white/60 px-3 py-2">
          <p className="text-xs font-semibold text-textPrimary">
            Logged intake:{" "}
            <span className="font-medium text-textSecondary">{loggedIntakeSummary}</span>
          </p>
        </div>
      ) : null}

      {hasUnresolvedOrder ? (
        <p className="mt-2 text-xs text-red-700">
          Some food items are missing a valid order. Logging is disabled until the plan
          includes order for each item.
        </p>
      ) : null}

      {foodRows.length === 0 ? (
        <p className="mt-2 text-xs text-textSecondary">
          No structured meal items to log for this session.
        </p>
      ) : null}

      {loggingOpensOn && !canLogAdherence ? (
        <p className="mt-2 text-xs text-textSecondary">
          Logging opens on {loggingOpensOn}
        </p>
      ) : null}

      {/* History readiness must not lock past/current adherence. Backend enforces final write rules. */}
      <fieldset
        className="mt-4 space-y-3 rounded-lg border border-orange-100 bg-white/65 p-3"
        disabled={submitting || !canLogAdherence}
      >
        <legend className="px-1 text-xs font-semibold text-textPrimary">
          What did you eat?
        </legend>
        <p className="text-xs font-medium text-textSecondary">
          {prescribedWorkLabelForAdherenceDomain("NUTRITION")}: {foodRows.length}
        </p>

        {foodRows.map((row) => {
          return (
            <div
              key={`nutrition-adherence-${plannedSessionId}-${row.plannedItemOrder}`}
              className="rounded-lg border border-orange-100 bg-white/55 px-3 py-2.5"
            >
              <p className="text-sm font-medium text-textPrimary">{row.label}</p>
              {row.serving ? (
                <p className="text-xs text-textSecondary">Serving: {row.serving}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {NUTRITION_PORTION_OPTIONS.map((option) => (
                  <label
                    key={`${row.plannedItemOrder}-${option.value}`}
                    className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-textPrimary"
                  >
                    <input
                      type="radio"
                      name={`nutrition-portion-${plannedSessionId}-${row.plannedItemOrder}`}
                      checked={
                        (portionByOrder[row.plannedItemOrder] ?? 0) === option.value
                      }
                      onChange={() =>
                        setPortionByOrder((current) => ({
                          ...current,
                          [row.plannedItemOrder]: option.value,
                        }))
                      }
                      className="h-3.5 w-3.5 border-slate-300 text-primary focus:ring-primary/30"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        <div className="space-y-1">
          <label
            htmlFor={`nutrition-adherence-notes-${plannedSessionId}`}
            className="text-xs font-medium text-textSecondary"
          >
            Note (optional)
          </label>
          <textarea
            id={`nutrition-adherence-notes-${plannedSessionId}`}
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className={cn(designSystem.input.root, "min-h-[4rem] w-full resize-y")}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleSubmit()}
            disabled={submitDisabled}
            className="w-full justify-center sm:w-auto"
          >
            {submitting
              ? "Saving…"
              : latestAthleteEvent
                ? "Update your intake"
                : "Submit"}
          </Button>
          {submitting ? (
            <span className="text-xs text-textSecondary">Saving…</span>
          ) : null}
        </div>
      </fieldset>

      {submitMessage ? (
        <p
          className={cn(
            "mt-2 text-xs",
            submitMessage.variant === "success"
              ? "text-emerald-700"
              : "text-red-700",
          )}
        >
          {submitMessage.text}
        </p>
      ) : null}
    </div>
  );
}

function SessionAdherencePanel({
  plannedSessionId,
  totalPrescribedItems,
  adherenceDomainKey,
  canLogAdherence = true,
  loggingOpensOn,
  plannedDurationLabel,
}: {
  plannedSessionId: string;
  totalPrescribedItems: number;
  adherenceDomainKey: AdherenceJournalDomainKey;
  canLogAdherence?: boolean;
  loggingOpensOn?: string;
  plannedDurationLabel?: string | null;
}) {
  const [historyPhase, setHistoryPhase] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [events, setEvents] = useState<AthleteSessionAdherenceEvent[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [outcome, setOutcome] = useState<SessionAdherenceOutcome | "">("");
  const [partialCompletedItems, setPartialCompletedItems] = useState("");
  const [actualDurationMinutes, setActualDurationMinutes] = useState("");
  const [athleteNotes, setAthleteNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    variant: "success" | "danger";
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHistoryPhase("loading");
    void (async () => {
      try {
        const fetched = await fetchPlannedSessionAdherenceEvents(plannedSessionId);
        if (cancelled) return;
        setEvents(fetched);
        setHistoryPhase("ready");
      } catch {
        if (cancelled) return;
        setEvents([]);
        setHistoryPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [plannedSessionId, reloadKey]);

  const latestAthleteEvent = useMemo(
    () => findLatestAthleteAdherenceEvent(events),
    [events],
  );

  const handleSubmit = useCallback(async () => {
    if (!canLogAdherence) {
      return;
    }

    if (outcome === "") {
      setSubmitMessage({
        variant: "danger",
        text: "Select a status before submitting.",
      });
      return;
    }

    const durationRaw = actualDurationMinutes.trim();
    let durationValue: number | undefined;
    if (durationRaw !== "") {
      const parsed = Number(durationRaw);
      if (!Number.isInteger(parsed) || parsed < 0) {
        setSubmitMessage({
          variant: "danger",
          text: "Actual duration must be a whole number of minutes.",
        });
        return;
      }
      durationValue = parsed;
    }

    const completionResult = resolveAdherenceCompletionPercent({
      outcome,
      totalPrescribedItems,
      partialCompletedItemsRaw: partialCompletedItems,
    });
    if ("error" in completionResult) {
      setSubmitMessage({
        variant: "danger",
        text: completionResult.error,
      });
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);
    try {
      const eventType = latestAthleteEvent ? "UPDATED" : "RECORDED";
      await recordPlannedSessionAdherenceEvent(plannedSessionId, {
        eventType,
        adherenceOutcome: outcome,
        completionPercent: completionResult.completionPercent,
        ...(durationValue !== undefined
          ? { actualDurationMinutes: durationValue }
          : {}),
        ...(athleteNotes.trim() !== "" ? { athleteNotes: athleteNotes.trim() } : {}),
      });
      setSubmitMessage({ variant: "success", text: "Adherence saved." });
      setReloadKey((current) => current + 1);
    } catch (error) {
      setSubmitMessage({
        variant: "danger",
        text: isNormalizedApiError(error)
          ? error.message
          : "Could not save adherence.",
      });
    } finally {
      setSubmitting(false);
    }
  }, [
    actualDurationMinutes,
    athleteNotes,
    canLogAdherence,
    latestAthleteEvent,
    outcome,
    partialCompletedItems,
    plannedSessionId,
    totalPrescribedItems,
  ]);

  // History readiness must not lock past/current adherence. Backend enforces final write rules.
  const formFieldsDisabled = submitting || !canLogAdherence;
  const submitDisabled = formFieldsDisabled || outcome === "";
  const hasExistingAthleteLog = Boolean(latestAthleteEvent);
  const statusLabel = formatAdherenceStatusLabel(latestAthleteEvent);

  return (
    <div className="mt-4 rounded-xl border border-orange-200/90 border-l-4 border-l-orange-500 bg-orange-50/90 p-4 shadow-sm ring-1 ring-orange-100/80">
      <div className="flex flex-col gap-2 border-b border-orange-200/80 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-textPrimary">Log this session</h4>
          <p className="mt-1 text-xs leading-relaxed text-textSecondary">
            Record your completion for this session.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-orange-200 bg-white/80 px-2.5 py-1 text-xs font-semibold text-orange-700">
          {statusLabel}
        </span>
      </div>

      {historyPhase === "loading" ? (
        <p className="mt-2.5 text-xs text-textSecondary">Loading adherence…</p>
      ) : null}

      {historyPhase === "error" ? (
        <p className="mt-2.5 text-xs text-textSecondary">
          Previous adherence status unavailable. You can still log this session.
        </p>
      ) : null}

      {historyPhase === "ready" && latestAthleteEvent ? (
        <dl className="mt-3 space-y-1 rounded-lg border border-orange-100 bg-white/55 p-2.5 text-xs">
          <div className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-2">
            <dt className="text-textSecondary">Status</dt>
            <dd className="text-textPrimary">
              {latestAthleteEvent.adherenceOutcome
                ? formatEnumeratedLabel(latestAthleteEvent.adherenceOutcome)
                : "—"}
            </dd>
          </div>
          {latestAthleteEvent.completionPercent !== null ? (
            <div className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-2">
              <dt className="text-textSecondary">Completion</dt>
              <dd className="text-textPrimary">
                {Math.round(latestAthleteEvent.completionPercent)}%
              </dd>
            </div>
          ) : null}
          {latestAthleteEvent.actualDurationMinutes !== null ? (
            <div className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-2">
              <dt className="text-textSecondary">Duration</dt>
              <dd className="text-textPrimary">
                {Math.round(latestAthleteEvent.actualDurationMinutes)} min
              </dd>
            </div>
          ) : null}
          {latestAthleteEvent.athleteNotes ? (
            <div className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-2">
              <dt className="text-textSecondary">Note</dt>
              <dd className="min-w-0 break-words text-textPrimary">
                {latestAthleteEvent.athleteNotes}
              </dd>
            </div>
          ) : null}
          <div className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-2">
            <dt className="text-textSecondary">Logged</dt>
            <dd className="text-textPrimary">
              {formatAdherenceOccurredAt(latestAthleteEvent.occurredAt)}
            </dd>
          </div>
        </dl>
      ) : null}

      {loggingOpensOn && !canLogAdherence ? (
        <p className="mt-2 text-xs text-textSecondary">
          Logging opens on {loggingOpensOn}
        </p>
      ) : null}

      <fieldset
        className="mt-4 space-y-3 rounded-lg border border-orange-100 bg-white/65 p-3"
        disabled={formFieldsDisabled}
      >
        <legend className="px-1 text-xs font-semibold text-textPrimary">
          How much did you complete?
        </legend>
        <div className="flex flex-wrap gap-2 text-xs font-medium text-textSecondary">
          {totalPrescribedItems > 0 ? (
            <span>
              {prescribedWorkLabelForAdherenceDomain(adherenceDomainKey)}:{" "}
              {totalPrescribedItems}
            </span>
          ) : null}
          {plannedDurationLabel ? <span>Planned duration: {plannedDurationLabel}</span> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          {ADHERENCE_OUTCOME_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-textPrimary"
            >
              <input
                type="radio"
                name={`adherence-outcome-${plannedSessionId}`}
                value={option.value}
                checked={outcome === option.value}
                onChange={() => {
                  setOutcome(option.value);
                  if (option.value !== "PARTIAL") {
                    setPartialCompletedItems("");
                  }
                }}
                className="h-3.5 w-3.5 border-slate-300 text-primary focus:ring-primary/30"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {outcome === "PARTIAL" &&
        totalPrescribedItems > 1 ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-textPrimary">
            <label
              htmlFor={`adherence-partial-completed-${plannedSessionId}`}
              className="text-xs font-medium text-textSecondary"
            >
              Completed items:
            </label>
            <Input
              id={`adherence-partial-completed-${plannedSessionId}`}
              type="number"
              min={1}
              max={totalPrescribedItems - 1}
              step={1}
              inputMode="numeric"
              value={partialCompletedItems}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setPartialCompletedItems(event.target.value)}
              className="max-w-[5rem]"
            />
            <span className="text-xs text-textSecondary">
              of {totalPrescribedItems}
            </span>
          </div>
        ) : null}
        <div className="space-y-1">
          <label
            htmlFor={`adherence-duration-${plannedSessionId}`}
            className="text-xs font-medium text-textSecondary"
          >
            Actual duration (minutes)
          </label>
          <Input
            id={`adherence-duration-${plannedSessionId}`}
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={actualDurationMinutes}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setActualDurationMinutes(event.target.value)}
            className="max-w-[10rem]"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor={`adherence-notes-${plannedSessionId}`}
            className="text-xs font-medium text-textSecondary"
          >
            Note (optional)
          </label>
          <textarea
            id={`adherence-notes-${plannedSessionId}`}
            rows={2}
            value={athleteNotes}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              setAthleteNotes(event.target.value)}
            className={cn(designSystem.input.root, "min-h-[4rem] w-full resize-y")}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleSubmit()}
            disabled={submitDisabled}
            className="w-full justify-center sm:w-auto"
          >
            {submitting
              ? "Saving…"
              : hasExistingAthleteLog
                ? "Update completion"
                : "Submit"}
          </Button>
        </div>
      </fieldset>

      {submitMessage ? (
        <p
          className={cn(
            "mt-2 text-xs",
            submitMessage.variant === "success"
              ? "text-emerald-700"
              : "text-red-700",
          )}
        >
          {submitMessage.text}
        </p>
      ) : null}
    </div>
  );
}

function renderJournalItem(
  item: unknown,
  index: number,
  options?: {
    nutritionDomain?: boolean;
    showAdherenceForm?: boolean;
    adherenceDomainKey?: AdherenceJournalDomainKey;
    canLogAdherence?: boolean;
    loggingOpensOn?: string;
    adherenceDayScopeKey?: string;
    skillsSportMetrics?: SkillsSportMetricsJournalOptions;
  },
) {
  const nutritionDomain = options?.nutritionDomain === true;
  const showAdherenceForm = options?.showAdherenceForm === true;
  const adherenceDomainKey = options?.adherenceDomainKey;
  const canLogAdherence = options?.canLogAdherence ?? true;
  const loggingOpensOn = options?.loggingOpensOn;
  const adherenceDayScopeKey = options?.adherenceDayScopeKey ?? "unknown-day";
  if (isScalar(item)) {
    return (
      <Card key={`scalar-${index}`} accent={false} padding="compact" className="bg-bg">
        <p className="text-sm text-textPrimary">{formatScalarValue(item)}</p>
      </Card>
    );
  }

  if (!isRecord(item)) {
    return (
      <Card key={`unknown-${index}`} accent={false} padding="compact" className="bg-bg">
        <p className="text-sm text-textSecondary">Plan details are available for this entry.</p>
      </Card>
    );
  }

  const primaryLines = collectPrimaryLines(
    item,
    nutritionDomain ? { suppressKeys: NUTRITION_JOURNAL_PRIMARY_SUPPRESS_KEYS } : undefined,
  );
  const detailRows = nutritionDomain
    ? []
    : collectDetailRows(item);
  const structureSections = extractJournalStructureSections(item);
  const hasStructuredContent = structureSections.length > 0;
  const plannedSessionId = readPlannedSessionIdFromItem(item);
  const showAdherencePanel =
    isSessionAdherenceEligible(showAdherenceForm, item) && plannedSessionId !== null;
  const showNutritionAdherencePanel =
    isNutritionSessionAdherenceEligible(nutritionDomain, item) &&
    plannedSessionId !== null;
  const nutritionLeaves = nutritionDomain ? collectNutritionFoodLeavesFromRoots([item]) : [];
  const nutritionMealTotalsLine = nutritionDomain
    ? formatNutritionTotalsCompactLine(deriveNutritionTotalsFromFoodLeaves(nutritionLeaves))
    : null;
  const nutritionItemCountLabel =
    nutritionDomain && nutritionLeaves.length > 0
      ? `${nutritionLeaves.length} ${nutritionLeaves.length === 1 ? "item" : "items"}`
      : null;
  const heading = itemHeading(item, index, { nutritionDomain });
  const nutritionSummaryLine = nutritionDomain ? nutritionMealSummaryLine(item, heading) : null;
  const plannedDurationLabel =
    !nutritionDomain && isRecord(item)
      ? formatDurationMinutesLabel(
          mergeJournalRecordCandidateFields(item).plannedDurationMinutes,
        )
      : null;

  return (
    <div
      key={`record-${index}`}
      className="rounded-lg border border-slate-200/80 bg-white/70 p-3"
    >
      <div className="space-y-2">
        <div>
          <p className="text-sm font-semibold text-textPrimary">
            {heading}
          </p>
          {nutritionDomain ? (
            <>
              {nutritionSummaryLine ? (
                <p className="mt-1 text-sm text-textSecondary">{nutritionSummaryLine}</p>
              ) : null}
              {nutritionItemCountLabel || nutritionMealTotalsLine ? (
                <p className="mt-1 text-xs text-textSecondary">
                  {[nutritionItemCountLabel, nutritionMealTotalsLine].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </>
          ) : (
            primaryLines.slice(1, 3).map((line) => (
              <p key={line} className="text-sm text-textSecondary">
                {line}
              </p>
            ))
          )}
        </div>
        {detailRows.length > 0 ? (
          <dl className="space-y-1">
            {detailRows.map((row) => (
              <div
                key={`${row.label}-${row.value}`}
                className="grid grid-cols-[minmax(0,160px)_1fr] gap-2 text-sm"
              >
                <dt className="font-medium text-textSecondary">{row.label}</dt>
                <dd className="min-w-0 break-words text-textPrimary">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {renderJournalStructureSections(item, {
          nutritionDomain,
          skillDomain: adherenceDomainKey === "SKILLS",
          skillsSportMetrics: options?.skillsSportMetrics,
        })}
        {!hasStructuredContent && detailRows.length === 0 ? (
          <p className="text-sm text-textSecondary">
            Plan details are available for this entry.
          </p>
        ) : null}
        {showNutritionAdherencePanel ? (
          <NutritionSessionAdherencePanel
            key={`nutrition-adherence-${adherenceDayScopeKey}-${plannedSessionId}`}
            plannedSessionId={plannedSessionId}
            sessionItem={item}
            canLogAdherence={canLogAdherence}
            loggingOpensOn={loggingOpensOn}
          />
        ) : null}
        {showAdherencePanel && adherenceDomainKey ? (
          <SessionAdherencePanel
            key={`session-adherence-${adherenceDayScopeKey}-${plannedSessionId}`}
            plannedSessionId={plannedSessionId}
            totalPrescribedItems={getTotalPrescribedItems(item)}
            adherenceDomainKey={adherenceDomainKey}
            canLogAdherence={canLogAdherence}
            loggingOpensOn={loggingOpensOn}
            plannedDurationLabel={plannedDurationLabel}
          />
        ) : null}
      </div>
    </div>
  );
}

function findJournalDayForLocalToday(
  days: AthleteWeeklyPlanJournalDay[],
  localTodayKey: string,
): AthleteWeeklyPlanJournalDay | null {
  return (
    days.find((day) => normalizeDateOnlyKey(day.date) === localTodayKey) ?? null
  );
}

function journalDayKey(day: AthleteWeeklyPlanJournalDay): string | null {
  const fromNormalize = normalizeDateOnlyKey(day.date);
  if (fromNormalize !== null) return fromNormalize;

  const parsed = parseToLocalDate(day.date);
  if (parsed === null) return null;
  return getLocalDateKey(parsed);
}

export function formatJournalDomainItemCount(count: number): string {
  return `${count} ${count === 1 ? "item" : "items"} released`;
}

function resolveJournalDayAdherenceLogging(day: AthleteWeeklyPlanJournalDay): {
  canLogAdherence: boolean;
  isFutureDay: boolean;
  loggingOpensOn: string;
  adherenceDayScopeKey: string;
} {
  const localTodayKey = getLocalDateKey();
  const dayKey = journalDayKey(day);
  const loggingOpensOn = formatDateOnly(day.date);
  const adherenceDayScopeKey = dayKey ?? `day-${day.dayNumber}`;

  const isFutureDay = dayKey !== null && dayKey > localTodayKey;
  const canLogAdherence = !isFutureDay;

  return {
    canLogAdherence,
    isFutureDay,
    loggingOpensOn,
    adherenceDayScopeKey,
  };
}

function findJournalDayByKey(
  days: AthleteWeeklyPlanJournalDay[],
  selectedDayKey: string | null,
): AthleteWeeklyPlanJournalDay | null {
  if (selectedDayKey === null) return null;
  return (
    days.find((day) => normalizeDateOnlyKey(day.date) === selectedDayKey) ?? null
  );
}

function resolveDefaultSelectedDayKey(
  days: AthleteWeeklyPlanJournalDay[],
  localTodayKey: string,
): string | null {
  const todayDay = findJournalDayForLocalToday(days, localTodayKey);
  if (todayDay !== null) {
    const todayKey = journalDayKey(todayDay);
    if (todayKey !== null) return todayKey;
  }
  for (const day of days) {
    const key = journalDayKey(day);
    if (key !== null) return key;
  }
  return null;
}

function renderJournalDaySelector(props: {
  days: AthleteWeeklyPlanJournalDay[];
  selectedDayKey: string | null;
  localTodayKey: string;
  onSelectDayKey: (dayKey: string) => void;
}): ReactElement {
  const { days, selectedDayKey, localTodayKey, onSelectDayKey } = props;
  return (
    <div className="flex flex-wrap gap-2">
      {days.map((day) => {
        const dayKey = journalDayKey(day);
        if (dayKey === null) return null;
        const isToday = dayKey === localTodayKey;
        const isSelected = dayKey === selectedDayKey;
        return (
          <button
            key={`${day.date}-${day.dayNumber}`}
            type="button"
            onClick={() => onSelectDayKey(dayKey)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              isSelected
                ? "border-orange-500 bg-orange-100 text-textPrimary shadow-sm"
                : isToday
                  ? "border-orange-300 bg-orange-50 text-textPrimary hover:border-orange-400"
                  : "border-slate-200/90 bg-white text-textSecondary hover:border-slate-300 hover:text-textPrimary",
            )}
          >
            {isToday ? "Today" : `Day ${day.dayNumber}`}
          </button>
        );
      })}
    </div>
  );
}

function nutritionMealSummaryLine(item: Record<string, unknown>, heading: string): string | null {
  const merged = mergeJournalRecordCandidateFields(item);
  for (const key of ["objective", "description", "summary", "dayFocus", "notes"] as const) {
    const value = merged[key];
    const formatted = isScalar(value) ? formatScalarValue(value) : null;
    if (!formatted || formatted === "—") continue;
    if (formatted.trim().toLowerCase() === heading.trim().toLowerCase()) continue;
    return formatted;
  }
  return null;
}

function renderJournalDayDomainGrid(
  day: AthleteWeeklyPlanJournalDay,
  journalOptions?: {
    skillsSportMetricsBase?: Omit<
      SkillsSportMetricsJournalOptions,
      "plannedSessionId" | "dayDate" | "sessionTitle"
    >;
  },
): ReactElement {
  const { canLogAdherence, loggingOpensOn, adherenceDayScopeKey } =
    resolveJournalDayAdherenceLogging(day);
  const domainItemsByKey = {
    SKILLS: day.skills,
    NUTRITION: day.nutrition,
    S_AND_C: day.sandc,
  } satisfies Record<(typeof DOMAIN_SECTIONS)[number]["key"], unknown[]>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
            Day {day.dayNumber}
          </p>
          <h3 className="mt-1 text-base font-semibold text-textPrimary">
            {formatDateWithWeekday(day.date)}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {DOMAIN_SECTIONS.map((domain) => {
            const items = domainItemsByKey[domain.key];
            return (
              <span
                key={`day-count-${domain.key}`}
                className="rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-xs font-medium text-textSecondary"
              >
                {domain.label}: {formatJournalDomainItemCount(items.length)}
              </span>
            );
          })}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {DOMAIN_SECTIONS.map((domain, domainIndex) => {
          const items = domainItemsByKey[domain.key];
          return (
            <section
              key={`${day.date}-${domain.key}`}
              className="space-y-3 rounded-xl border border-slate-200/90 bg-white/60 p-3"
            >
              <div className="flex items-start gap-3 border-b border-slate-200/80 pb-3">
                <span className="text-lg font-semibold leading-none text-orange-500/80">
                  {String(domainIndex + 1).padStart(2, "0")}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-textPrimary">
                    {domain.sectionTitle}
                  </h4>
                  <p className="text-xs text-textSecondary">
                    {items.length > 0
                      ? formatJournalDomainItemCount(items.length)
                      : domain.emptyMessage}
                  </p>
                </div>
              </div>
              {items.length === 0 ? (
                <Card
                  padding="compact"
                  accent={false}
                  className="bg-bg text-sm text-textSecondary"
                >
                  {domain.emptyMessage}
                </Card>
              ) : (
                <div className="space-y-3">
                  {domain.key === "NUTRITION" ? renderNutritionDayTotalsPanel(items) : null}
                  {items.map((item, index) => {
                    const skillsSportMetrics =
                      domain.key === "SKILLS" &&
                      journalOptions?.skillsSportMetricsBase &&
                      isRecord(item) &&
                      readPlannedSessionIdFromItem(item)
                        ? {
                            ...journalOptions.skillsSportMetricsBase,
                            plannedSessionId: readPlannedSessionIdFromItem(item)!,
                            dayDate: day.date,
                            sessionTitle: readSessionTitleFromItem(item),
                          }
                        : undefined;

                    return renderJournalItem(item, index, {
                      nutritionDomain: domain.key === "NUTRITION",
                      showAdherenceForm:
                        domain.key === "SKILLS" || domain.key === "S_AND_C",
                      adherenceDomainKey:
                        domain.key === "SKILLS" || domain.key === "S_AND_C"
                          ? domain.key
                          : undefined,
                      canLogAdherence,
                      loggingOpensOn,
                      adherenceDayScopeKey,
                      skillsSportMetrics,
                    });
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function domainBadge(status: "RELEASED" | "NOT_RELEASED") {
  if (status === "RELEASED") {
    return <StatusBadge variant="success">Released</StatusBadge>;
  }
  return <StatusBadge variant="neutral">Not Released</StatusBadge>;
}

export function AthleteWeeklyPlanJournalPageContent() {
  const { accessContext, accessGateReady } = useAthleteInvitationGate();
  const planningIds = useAthletePlanningIdentifiers({ accessContext, accessGateReady });
  const entityId = planningIds.ids?.entityId ?? "";
  const athleteId = planningIds.ids?.athleteId ?? "";
  const [state, setState] = useState<ViewState>({ phase: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [sportLogContext, setSportLogContext] =
    useState<SportMetricsDrillLogContext | null>(null);
  const [loggedDrillKeys, setLoggedDrillKeys] = useState<Record<string, LoggedDrillResultSummary>>({});

  const retryLoadJournal = useCallback(() => {
    setState({ phase: "loading" });
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (planningIds.phase === "loading") return;
    if (planningIds.phase === "not_ready") return;
    let cancelled = false;
    void (async () => {
      try {
        const journal = await fetchAthleteWeeklyPlanJournal(entityId, athleteId);
        if (!cancelled) {
          setState({ phase: "ready", journal });
        }
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof Error
          ? e.message
          : "Could not load your weekly plan journal. Please try again.";
        setState({ phase: "error", message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [athleteId, entityId, planningIds.phase, reloadKey]);

  useEffect(() => {
    if (state.phase !== "ready") return;
    developmentLogWeeklyJournalNutritionInspection(state.journal);
  }, [state]);

  useEffect(() => {
    if (state.phase !== "ready") return;
    const localTodayKey = getLocalDateKey();
    const defaultDayKey = resolveDefaultSelectedDayKey(
      state.journal.days,
      localTodayKey,
    );
    // Reset invalid selection after journal fetch/reload (not user chip clicks).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync key to loaded days
    setSelectedDayKey((current) => {
      const stillValid =
        current !== null &&
        state.journal.days.some(
          (day) => normalizeDateOnlyKey(day.date) === current,
        );
      if (stillValid) return current;
      return defaultDayKey;
    });
  }, [state, reloadKey]);

  const isLoading = planningIds.phase === "loading" ||
    (planningIds.phase === "ready" && state.phase === "loading");
  const journal = state.phase === "ready" ? state.journal : null;
  const weekSubtitle = journal
    ? `${formatDateOnly(journal.weekStartDate)} - ${formatDateOnly(journal.weekEndDate)}`
    : "Review the released sessions and plan items for your current training week.";
  const allDomainsNotReleased = journal
    ? DOMAIN_SECTIONS.every((domain) => journal.domains[domain.key].status === "NOT_RELEASED")
    : false;

  const resolvedJournalEntityId = journal?.entityId.trim() || entityId;
  const resolvedJournalAthleteId = journal?.athleteId.trim() || athleteId;
  const skillsTrainingPlanVersionId = journal?.domains.SKILLS.versionId?.trim() ?? "";
  const skillsSportMetricsBase =
    journal &&
    skillsTrainingPlanVersionId !== "" &&
    journal.domains.SKILLS.status === "RELEASED"
      ? {
          entityId: resolvedJournalEntityId,
          athleteId: resolvedJournalAthleteId,
          trainingPlanVersionId: skillsTrainingPlanVersionId,
          loggedDrillKeys,
          onOpenLog: setSportLogContext,
        }
      : undefined;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Weekly Plan Journal"
        subtitle={weekSubtitle}
        trailing={<AthleteHeaderIdentityMetadata />}
      />
      {isLoading ? (
        <DashboardCardShell majorOuter title="Weekly Plan Journal" className="min-h-[220px]">
          <div className="flex min-h-[120px] items-center justify-center text-sm text-textSecondary">
            Loading weekly plan journal…
          </div>
        </DashboardCardShell>
      ) : planningIds.phase === "not_ready" ? (
        <DashboardCardShell majorOuter title="Weekly Plan Journal">
          <Alert variant="warning">
            Athlete profile not ready
          </Alert>
        </DashboardCardShell>
      ) : state.phase === "error" ? (
        <DashboardCardShell majorOuter title="Weekly Plan Journal">
          <div className="space-y-3">
            <Alert variant="danger">{state.message}</Alert>
            <div>
              <Button type="button" variant="secondary" onClick={retryLoadJournal}>
                Retry
              </Button>
            </div>
          </div>
        </DashboardCardShell>
      ) : (
        <>
          {(() => {
            const readyJournal = journal;
            if (readyJournal === null) return null;
            return (
              <>
          <DashboardCardShell majorOuter title="Current Week" subtitle={weekSubtitle}>
            <div className="grid gap-3 md:grid-cols-3">
              {DOMAIN_SECTIONS.map((domain) => {
                const summary = readyJournal.domains[domain.key];
                const weekTotalsRows =
                  domain.key === "NUTRITION" && summary.status === "RELEASED"
                    ? buildNutritionWeeklySummaryRows(readyJournal.raw)
                    : [];
                return (
                  <Card
                    key={domain.key}
                    padding="compact"
                    accent={false}
                    className="bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-textPrimary">{domain.label}</h3>
                          <p className="mt-1 text-sm text-textSecondary">
                            {summary.status === "RELEASED"
                              ? "Released for this week"
                              : "Not released yet"}
                          </p>
                        </div>
                        {domainBadge(summary.status)}
                      </div>
                      {weekTotalsRows.length > 0 ? (
                        <div className="border-t border-slate-200/80 pt-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-textSecondary">
                            Planned Week Summary
                          </p>
                          <dl className="mt-1 space-y-0.5">
                            {weekTotalsRows.map((row) => (
                              <div
                                key={`week-nut-${row.label}-${row.value}`}
                                className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-2 text-xs"
                              >
                                <dt className="text-textSecondary">{row.label}</dt>
                                <dd className="min-w-0 text-textPrimary">{row.value}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </div>
          </DashboardCardShell>

          {allDomainsNotReleased ? (
            <DashboardCardShell majorOuter title="Weekly Journal">
              <p className="text-sm text-textSecondary">
                Your weekly plan has not been released yet.
              </p>
            </DashboardCardShell>
          ) : null}

          {readyJournal.days.length === 0 ? (
            <DashboardCardShell majorOuter title="Journal Days">
              <p className="text-sm text-textSecondary">
                No weekly journal entries are available yet.
              </p>
            </DashboardCardShell>
          ) : (
            (() => {
              const localTodayKey = getLocalDateKey();
              const defaultDayKey = resolveDefaultSelectedDayKey(
                readyJournal.days,
                localTodayKey,
              );
              const effectiveDayKey = selectedDayKey ?? defaultDayKey;
              const selectedDay = findJournalDayByKey(
                readyJournal.days,
                effectiveDayKey,
              );
              const selectedIsToday =
                effectiveDayKey !== null && effectiveDayKey === localTodayKey;
              return (
                <div className="space-y-3">
                  <DashboardCardShell
                    majorOuter
                    title="Plan by day"
                    subtitle="Choose a day to view your released plan"
                    className="shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
                  >
                    {renderJournalDaySelector({
                      days: readyJournal.days,
                      selectedDayKey: effectiveDayKey,
                      localTodayKey,
                      onSelectDayKey: setSelectedDayKey,
                    })}
                  </DashboardCardShell>

                  {selectedDay === null ? (
                    <DashboardCardShell majorOuter title="Journal Days">
                      <p className="text-sm text-textSecondary">
                        No weekly journal entries are available yet.
                      </p>
                    </DashboardCardShell>
                  ) : (
                    <DashboardCardShell
                      majorOuter
                      title={
                        selectedIsToday
                          ? "Today's Plan"
                          : `Day ${selectedDay.dayNumber}`
                      }
                      subtitle={formatDateWithWeekday(selectedDay.date)}
                      className={cn(
                        "shadow-[0_10px_30px_rgba(15,23,42,0.05)]",
                        selectedIsToday && "ring-1 ring-orange-200/90",
                      )}
                    >
                      {renderJournalDayDomainGrid(selectedDay, {
                        skillsSportMetricsBase,
                      })}
                    </DashboardCardShell>
                  )}
                </div>
              );
            })()
          )}
              </>
            );
          })()}
        </>
      )}
      {journal ? (
        <LogSportResultModal
          open={sportLogContext !== null}
          context={sportLogContext}
          weekStartDate={journal.weekStartDate}
          weekEndDate={journal.weekEndDate}
          onClose={() => setSportLogContext(null)}
          onSuccess={(drillKey, summary) => {
            setLoggedDrillKeys((current) => ({ ...current, [drillKey]: summary }));
          }}
        />
      ) : null}
    </div>
  );
}
