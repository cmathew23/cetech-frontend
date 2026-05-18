"use client";

import { AthleteHeaderIdentityMetadata } from "@/components/dashboard/athlete/AthleteHeaderIdentityMetadata";
import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAthletePlanningIdentifiers } from "@/hooks/useAthletePlanningIdentifiers";
import {
  fetchAthleteWeeklyPlanJournal,
  type AthleteWeeklyPlanJournal,
} from "@/lib/api/coachAthletePlanningReadiness";
import { formatDateOnly } from "@/lib/dateTime";
import { formatEnumeratedLabel, toTitleCaseInput } from "@/lib/textFormat";
import { useCallback, useEffect, useState } from "react";

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

const NUTRITION_MACRO_NEST_KEYS = [
  "macrosPerBaseServing",
  "macros",
  "nutrients",
  "nutritionFacts",
  "macroTotals",
  "adjustedNutrition",
  "adjustedMacros",
  "nutrition",
  "nutrientTotals",
  "totals",
  "mealTotals",
  "dailyTotals",
] as const;

const ALL_CANONICAL_MACRO_SCALAR_KEYS = [
  ...CALORIE_SOURCE_KEYS,
  ...PROTEIN_SOURCE_KEYS,
  ...CARB_SOURCE_KEYS,
  ...FAT_SOURCE_KEYS,
];

const MACRO_SCALAR_KEY_SET = new Set<string>(ALL_CANONICAL_MACRO_SCALAR_KEYS);
const MACRO_NEST_KEY_SET = new Set<string>(NUTRITION_MACRO_NEST_KEYS);

const NUTRITION_UI_SUPPRESSED_KEYS = new Set([
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
  "itemType",
  "ItemType",
  "order",
  "Order",
  "itemOrder",
  "orderIndex",
  "index",
]);

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

/** Explicit backend-provided daily / rollup totals — displayed only when present (never summed client-side). */
const EXPLICIT_DAY_TOTAL_ROW_KEYS = [
  "estimatedDailyCalories",
  "dailyTotalCalories",
  "totalDailyCalories",
  "dayTotalCalories",
  "dailyCalorieTotal",
  "targetDailyCalories",
  "dailyTotals",
  "dailyTotalProteinGrams",
  "dailyTotalCarbsGrams",
  "dailyTotalFatGrams",
  "dailyProteinGrams",
  "dailyCarbsGrams",
  "dailyFatGrams",
  "nutrientTotals",
] as const;

const NUTRITION_SCALAR_ROW_PRIORITY: string[] = [
  ...EXPLICIT_DAY_TOTAL_ROW_KEYS,
  "mealType",
  "timing",
  "slot",
  "quantity",
  "unit",
  "serving",
  "notes",
  "description",
  "summary",
];

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

function formatNutritionMacroInlineClause(merged: Record<string, unknown>): string | null {
  const parts: string[] = [];
  const cal = pickExplicitMacroNumber(merged, CALORIE_SOURCE_KEYS);
  if (cal !== null) parts.push(`Calories ${Math.round(cal)} kcal`);
  const p = pickExplicitMacroNumber(merged, PROTEIN_SOURCE_KEYS);
  if (p !== null) parts.push(`Protein ${formatGramsRounded(p)} g`);
  const c = pickExplicitMacroNumber(merged, CARB_SOURCE_KEYS);
  if (c !== null) parts.push(`Carbs ${formatGramsRounded(c)} g`);
  const f = pickExplicitMacroNumber(merged, FAT_SOURCE_KEYS);
  if (f !== null) parts.push(`Fat ${formatGramsRounded(f)} g`);
  return parts.length > 0 ? parts.join(", ") : null;
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

function timingPhrase(merged: Record<string, unknown>): string | null {
  const timing = merged.timing ?? merged.slot;
  if (typeof timing === "string" && timing.trim() !== "") return timing.trim();
  return null;
}

function appendCalorieGramSuffix(labelKey: string, rawScalar: Scalar): string {
  const formatted = formatScalarValue(rawScalar);
  const lk = labelKey.toLowerCase();
  if (formatted === "—") return formatted;
  const calorieMeasure =
    (lk.includes("calorie") || lk.endsWith("kcal")) &&
    !lk.includes("status") &&
    !lk.includes("adequacy");
  if (calorieMeasure) return `${formatted} kcal`;
  if (
    lk.includes("protein") ||
    lk.includes("carbs") ||
    lk.includes("carbohydrate") ||
    (lk.includes("fat") && !lk.includes("status")) ||
    lk.includes("fiber") ||
    lk.endsWith("grams") ||
    lk.endsWith("gram")
  ) {
    return `${formatted} g`;
  }
  return formatted;
}

function pushCanonicalNutritionMacroRows(
  merged: Record<string, unknown>,
  rows: Array<{ label: string; value: string }>,
  seenKeys: Set<string>,
) {
  const cal = pickExplicitMacroNumber(merged, CALORIE_SOURCE_KEYS);
  if (cal !== null) {
    rows.push({ label: "Calories", value: `${Math.round(cal)} kcal` });
    for (const k of CALORIE_SOURCE_KEYS) seenKeys.add(k);
  }
  const p = pickExplicitMacroNumber(merged, PROTEIN_SOURCE_KEYS);
  if (p !== null) {
    rows.push({ label: "Protein", value: `${formatGramsRounded(p)} g` });
    for (const k of PROTEIN_SOURCE_KEYS) seenKeys.add(k);
  }
  const c = pickExplicitMacroNumber(merged, CARB_SOURCE_KEYS);
  if (c !== null) {
    rows.push({ label: "Carbs", value: `${formatGramsRounded(c)} g` });
    for (const k of CARB_SOURCE_KEYS) seenKeys.add(k);
  }
  const f = pickExplicitMacroNumber(merged, FAT_SOURCE_KEYS);
  if (f !== null) {
    rows.push({ label: "Fat", value: `${formatGramsRounded(f)} g` });
    for (const k of FAT_SOURCE_KEYS) seenKeys.add(k);
  }
}

function appendDedupedCanonicalMacroRowsWithPrefix(
  merged: Record<string, unknown>,
  labelPrefix: string,
  accumulator: Array<{ label: string; value: string }>,
  dedupe: Set<string>,
) {
  const chunk: Array<{ label: string; value: string }> = [];
  const consumed = new Set<string>();
  pushCanonicalNutritionMacroRows(merged, chunk, consumed);
  for (const row of chunk) {
    const label = `${labelPrefix} · ${row.label}`;
    const sig = `${label}:${row.value}`;
    if (dedupe.has(sig)) continue;
    dedupe.add(sig);
    accumulator.push({ label, value: row.value });
  }
}

function collectNutritionFacingRows(
  record: Record<string, unknown>,
  options?: { omitKeys?: Set<string> },
): Array<{ label: string; value: string }> {
  const merged = mergeJournalRecordCandidateFields(record);
  const omitKeys = options?.omitKeys ?? new Set<string>();
  const rows: Array<{ label: string; value: string }> = [];
  const seenKeys = new Set<string>();

  pushCanonicalNutritionMacroRows(merged, rows, seenKeys);

  function pushScalar(key: string, raw: unknown) {
    if (omitKeys.has(key) || seenKeys.has(key) || NUTRITION_UI_SUPPRESSED_KEYS.has(key)) return;
    if (JOURNAL_DETAIL_STRUCTURE_KEYS.has(key)) return;
    if (
      key === "id" ||
      key === "trainingDayId" ||
      key === "nutritionCatalogItemId" ||
      key === "exerciseCatalogItemId"
    ) {
      return;
    }
    if (MACRO_SCALAR_KEY_SET.has(key)) {
      return;
    }
    if (MACRO_NEST_KEY_SET.has(key)) {
      return;
    }

    let value: string | null = null;
    if (isScalar(raw)) {
      const formatted = appendCalorieGramSuffix(key, raw);
      value = formatted !== "—" ? formatted : null;
    } else if (isScalarArray(raw)) {
      const joined = joinScalarArray(raw);
      value = joined !== "" ? joined : null;
    }
    if (!value) return;
    seenKeys.add(key);
    rows.push({ label: formatFieldLabel(key), value });
  }

  for (const key of NUTRITION_SCALAR_ROW_PRIORITY) {
    pushScalar(key, merged[key]);
  }

  for (const [key, val] of Object.entries(merged)) {
    pushScalar(key, val);
  }

  return rows;
}

/** Objects that sometimes carry planner-authored daily totals without flattening to root scalars. */
const OBJECT_DAY_MACRO_CONTAINERS = ["dailyTotals", "nutrientTotals"] as const;

function collectExplicitNutritionDayTotalRows(
  entries: unknown[],
): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = [];
  const dedupe = new Set<string>();

  for (const entry of entries) {
    if (!isRecord(entry)) continue;
    const merged = mergeJournalRecordCandidateFields(entry);
    for (const key of EXPLICIT_DAY_TOTAL_ROW_KEYS) {
      if (!objectFieldPresent(merged, key)) continue;
      const raw = merged[key];
      if (!isScalar(raw)) continue;
      const label = formatFieldLabel(key);
      const value = appendCalorieGramSuffix(key, raw);
      if (value === "—") continue;
      const sig = `${label}:${value}`;
      if (dedupe.has(sig)) continue;
      dedupe.add(sig);
      out.push({ label, value });
    }

    for (const ck of OBJECT_DAY_MACRO_CONTAINERS) {
      const sub = merged[ck];
      if (!isRecord(sub)) continue;
      appendDedupedCanonicalMacroRowsWithPrefix(
        sub,
        formatFieldLabel(ck),
        out,
        dedupe,
      );
    }
  }

  return out;
}

type JournalNutritionTotals = {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
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

function deriveNutritionTotalsFromFoodLeaves(leaves: Record<string, unknown>[]): JournalNutritionTotals {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let hasCalories = false;
  let hasProtein = false;
  let hasCarbs = false;
  let hasFat = false;

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
  }

  return {
    calories: hasCalories ? calories : null,
    protein: hasProtein ? protein : null,
    carbs: hasCarbs ? carbs : null,
    fat: hasFat ? fat : null,
  };
}

function nutritionTotalsToRows(totals: JournalNutritionTotals): Array<{ label: string; value: string }> {
  const derivedRows: Array<{ label: string; value: string }> = [];
  if (totals.calories !== null) {
    derivedRows.push({ label: "Calories", value: `${Math.round(totals.calories)} kcal` });
  }
  if (totals.protein !== null) {
    derivedRows.push({ label: "Protein", value: `${formatGramsRounded(totals.protein)} g` });
  }
  if (totals.carbs !== null) {
    derivedRows.push({ label: "Carbs", value: `${formatGramsRounded(totals.carbs)} g` });
  }
  if (totals.fat !== null) {
    derivedRows.push({ label: "Fat", value: `${formatGramsRounded(totals.fat)} g` });
  }
  return derivedRows;
}

function renderNutritionDayTotalsPanel(entries: unknown[]) {
  const explicitRows = collectExplicitNutritionDayTotalRows(entries);
  const leaves = collectNutritionFoodLeavesFromRoots(entries);
  const derivedTotals = deriveNutritionTotalsFromFoodLeaves(leaves);
  const derivedRows = nutritionTotalsToRows(derivedTotals);

  if (explicitRows.length === 0 && derivedRows.length === 0) return null;

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
        Daily Nutrition (Plan)
      </p>
      {derivedRows.length > 0 ? (
        <div className="mt-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-textMuted">
            Day total (plan items)
          </p>
          <dl className="mt-1 space-y-1">{renderRows(derivedRows, "day-derived")}</dl>
        </div>
      ) : null}
      {explicitRows.length > 0 ? (
        <div className={derivedRows.length > 0 ? "mt-3" : "mt-2"}>
          {derivedRows.length > 0 ? (
            <p className="text-[11px] font-medium uppercase tracking-wide text-textMuted">
              Additional plan totals
            </p>
          ) : null}
          <dl className={`space-y-1 ${derivedRows.length > 0 ? "mt-1" : ""}`}>
            {renderRows(explicitRows, "day-explicit")}
          </dl>
        </div>
      ) : null}
    </div>
  );
}

function nutritionStructureItemInlineOmitKeys(rawItem: Record<string, unknown>): Set<string> {
  const merged = mergeJournalRecordCandidateFields(rawItem);
  const omit = new Set<string>([
    "label",
    "name",
    "title",
    "summary",
    "serving",
    "timing",
    "slot",
    "quantity",
    "unit",
  ]);
  if (nutritionServingPhrase(merged)) {
    omit.add("serving");
    omit.add("quantity");
    omit.add("unit");
  }
  const tp = timingPhrase(merged);
  if (tp) {
    omit.add("timing");
    omit.add("slot");
  }
  if (formatNutritionMacroInlineClause(merged)) {
    for (const k of ALL_CANONICAL_MACRO_SCALAR_KEYS) omit.add(k);
    for (const k of NUTRITION_MACRO_NEST_KEYS) omit.add(k);
  }
  return omit;
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
  "sessionOrder",
  "sessionType",
  "objective",
  "plannedDurationMinutes",
  "durationMinutes",
  "plannedStartTime",
  "plannedEndTime",
  "intensity",
  "description",
  "mealType",
  "timing",
  "quantity",
  "unit",
  "serving",
  "calories",
  "protein",
  "carbs",
  "fat",
  "estimatedDailyCalories",
  "targetCalorieMin",
  "targetCalorieMax",
  "calorieAdequacyStatus",
  "estimatedProteinGrams",
  "estimatedCarbohydrateGrams",
  "estimatedFatGrams",
  "estimatedFiberGrams",
  "macroAdequacyStatus",
  "sets",
  "reps",
  "notes",
  "dayIndex",
  "weekNumber",
  "plannedLoadMinutes",
  "isRestDay",
];

const MAX_SCALAR_DETAIL_ROWS = 28;

function collectDetailRows(record: Record<string, unknown>): Array<{ label: string; value: string }> {
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
      key === "nutritionCatalogItemId"
    ) {
      return;
    }
    let value: string | null = null;
    if (key === "plannedDurationMinutes" || key === "durationMinutes") {
      const label =
        key === "plannedDurationMinutes" ? "Planned duration" : "Duration";
      const mins = formatDurationMinutesLabel(rawValue);
      if (mins) {
        seen.add(key);
        rows.push({ label, value: mins });
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

const STRUCTURE_ITEM_ROW_PRIORITY = [
  "label",
  "name",
  "title",
  "summary",
  "description",
  "mealType",
  "itemType",
  "quantity",
  "unit",
  "serving",
  "calories",
  "totalCalories",
  "kcal",
  "energyKcal",
  "protein",
  "proteinGrams",
  "totalProtein",
  "carbs",
  "totalCarbs",
  "carbohydrates",
  "fat",
  "totalFat",
  "timing",
  "sets",
  "reps",
  "durationMinutes",
  "intensity",
  "notes",
];

function collectStructureItemDetailRows(
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
      key === "order" ||
      key === "itemOrder" ||
      key === "orderIndex"
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
  timing: string | null;
}) {
  const { heading, hideHeading, serving, macros, timing } = opts;
  const segments: Array<{ text: string; emphasize: boolean }> = [];
  if (!hideHeading) segments.push({ text: heading, emphasize: true });
  if (serving) segments.push({ text: `Serving ${serving}`, emphasize: false });
  if (macros) segments.push({ text: macros, emphasize: false });
  if (timing) segments.push({ text: `Timing ${timing}`, emphasize: false });

  if (segments.length === 0) return null;

  return (
    <p className="text-sm text-textPrimary">
      {segments.map((seg, idx) => (
        <span key={`${seg.text}-${idx}`}>
          {idx > 0 ? <span className="text-textSecondary"> — </span> : null}
          <span
            className={
              seg.emphasize ? "font-medium text-textPrimary" : "text-textSecondary"
            }
          >
            {seg.text}
          </span>
        </span>
      ))}
    </p>
  );
}

function renderJournalStructureSections(
  record: Record<string, unknown>,
  options?: { nutritionDomain?: boolean },
) {
  const sections = extractJournalStructureSections(record);
  if (sections.length === 0) return null;

  const nutritionDomain = options?.nutritionDomain === true;

  return (
    <div className="space-y-3 border-t border-slate-200/80 pt-2">
      {sections.map((section, sectionIdx) => {
        const mealExtras = nutritionDomain
          ? collectNutritionFacingRows(section.mealScalarsSource)
          : [];

        return (
          <div key={`${sectionIdx}-${section.key}`} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-textSecondary">
              {formatFieldLabel(section.key)}
            </p>
            {nutritionDomain && mealExtras.length > 0 ? (
              <dl className="space-y-0.5 rounded border border-slate-200/70 bg-white/40 px-2 py-1.5">
                {mealExtras.map((row, ri) => (
                  <div
                    key={`${sectionIdx}-meal-${ri}-${row.label}`}
                    className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-2 gap-y-0.5 text-xs"
                  >
                    <dt className="text-textSecondary">{row.label}</dt>
                    <dd className="min-w-0 break-words text-textPrimary">{row.value}</dd>
                  </div>
                ))}
              </dl>
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
                  const heading = structureItemHeading(rawItem, itemIndex);
                  const itemRows = collectStructureItemDetailRows(rawItem);
                  const detailRows = itemRows.filter(
                    (row) =>
                      row.value.trim().toLowerCase() !== heading.trim().toLowerCase(),
                  );
                  const hideGenericHeading =
                    /^Item\s+\d+$/i.test(heading.trim()) && detailRows.length > 0;

                  return (
                    <div
                      key={`${sectionIdx}-${section.key}-${itemIndex}`}
                      className="rounded border border-slate-200/80 bg-white/60 p-2"
                    >
                      {!hideGenericHeading ? (
                        <p className="text-sm font-medium text-textPrimary">{heading}</p>
                      ) : null}
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
                    </div>
                  );
                }

                const mergedItem = mergeJournalRecordCandidateFields(rawItem);
                const heading = structureItemHeading(rawItem, itemIndex);
                const serving = nutritionServingPhrase(mergedItem);
                const macros = formatNutritionMacroInlineClause(mergedItem);
                const timing = timingPhrase(mergedItem);
                const omit = nutritionStructureItemInlineOmitKeys(rawItem);
                const secondary = collectNutritionFacingRows(rawItem, { omitKeys: omit }).filter(
                  (row) => row.value.trim().toLowerCase() !== heading.trim().toLowerCase(),
                );
                const hideGenericHeading =
                  /^Item\s+\d+$/i.test(heading.trim()) &&
                  (!!(serving || macros || timing) || secondary.length > 0);

                const leading = nutritionStructuredItemLeadingLine({
                  heading,
                  hideHeading: hideGenericHeading,
                  serving,
                  macros,
                  timing,
                });

                return (
                  <div
                    key={`${sectionIdx}-${section.key}-${itemIndex}`}
                    className="rounded border border-slate-200/80 bg-white/60 p-2"
                  >
                    {leading}
                    {secondary.length > 0 ? (
                      <dl className={leading ? "mt-1 space-y-0.5" : "space-y-0.5"}>
                        {secondary.map((row, rowIdx) => (
                          <div
                            key={`${sectionIdx}-${section.key}-${itemIndex}-r-${rowIdx}`}
                            className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-2 gap-y-0.5 text-xs"
                          >
                            <dt className="text-textSecondary">{row.label}</dt>
                            <dd className="min-w-0 break-words text-textPrimary">{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : !leading && heading.startsWith("Item ") ? (
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

function renderJournalItem(
  item: unknown,
  index: number,
  options?: { nutritionDomain?: boolean },
) {
  const nutritionDomain = options?.nutritionDomain === true;
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
    ? collectNutritionFacingRows(item)
    : collectDetailRows(item);
  const structureSections = extractJournalStructureSections(item);
  const hasStructuredContent = structureSections.length > 0;

  return (
    <Card key={`record-${index}`} accent={false} padding="compact" className="bg-bg">
      <div className="space-y-2">
        <div>
          <p className="text-sm font-semibold text-textPrimary">
            {itemHeading(item, index, { nutritionDomain })}
          </p>
          {primaryLines.slice(1, 3).map((line) => (
            <p key={line} className="text-sm text-textSecondary">
              {line}
            </p>
          ))}
        </div>
        {detailRows.length > 0 ? (
          <dl className="space-y-1">
            {detailRows.map((row) => (
              <div key={`${row.label}-${row.value}`} className="grid grid-cols-[minmax(0,160px)_1fr] gap-2 text-sm">
                <dt className="font-medium text-textSecondary">{row.label}</dt>
                <dd className="min-w-0 break-words text-textPrimary">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {renderJournalStructureSections(item, {
          nutritionDomain,
        })}
        {!hasStructuredContent && detailRows.length === 0 ? (
          <p className="text-sm text-textSecondary">
            Plan details are available for this entry.
          </p>
        ) : null}
      </div>
    </Card>
  );
}

function domainBadge(status: "RELEASED" | "NOT_RELEASED") {
  if (status === "RELEASED") {
    return <StatusBadge variant="success">Released</StatusBadge>;
  }
  return <StatusBadge variant="neutral">Not Released</StatusBadge>;
}

export function AthleteWeeklyPlanJournalPageContent() {
  const planningIds = useAthletePlanningIdentifiers();
  const entityId = planningIds.ids?.entityId ?? "";
  const athleteId = planningIds.ids?.athleteId ?? "";
  const [state, setState] = useState<ViewState>({ phase: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

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

  const isLoading = planningIds.phase === "loading" ||
    (planningIds.phase === "ready" && state.phase === "loading");
  const journal = state.phase === "ready" ? state.journal : null;
  const weekSubtitle = journal
    ? `${formatDateOnly(journal.weekStartDate)} - ${formatDateOnly(journal.weekEndDate)}`
    : "Review the released sessions and plan items for your current training week.";
  const allDomainsNotReleased = journal
    ? DOMAIN_SECTIONS.every((domain) => journal.domains[domain.key].status === "NOT_RELEASED")
    : false;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Weekly Plan Journal"
        subtitle={weekSubtitle}
        trailing={<AthleteHeaderIdentityMetadata />}
      />
      {isLoading ? (
        <DashboardCardShell title="Weekly Plan Journal" className="min-h-[220px]">
          <div className="flex min-h-[120px] items-center justify-center text-sm text-textSecondary">
            Loading weekly plan journal…
          </div>
        </DashboardCardShell>
      ) : planningIds.phase === "not_ready" ? (
        <DashboardCardShell title="Weekly Plan Journal">
          <Alert variant="warning">
            Athlete profile not ready
          </Alert>
        </DashboardCardShell>
      ) : state.phase === "error" ? (
        <DashboardCardShell title="Weekly Plan Journal">
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
          <DashboardCardShell title="Current Week" subtitle={weekSubtitle}>
            <div className="grid gap-3 md:grid-cols-3">
              {DOMAIN_SECTIONS.map((domain) => {
                const summary = readyJournal.domains[domain.key];
                const weekTotalsRows =
                  domain.key === "NUTRITION" && summary.status === "RELEASED"
                    ? nutritionTotalsToRows(
                        deriveNutritionTotalsFromFoodLeaves(
                          readyJournal.days.flatMap((d) =>
                            collectNutritionFoodLeavesFromRoots(d.nutrition),
                          ),
                        ),
                      )
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
                            Week total (plan items)
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
            <DashboardCardShell title="Weekly Journal">
              <p className="text-sm text-textSecondary">
                Your weekly plan has not been released yet.
              </p>
            </DashboardCardShell>
          ) : null}

          {readyJournal.days.length === 0 ? (
            <DashboardCardShell title="Journal Days">
              <p className="text-sm text-textSecondary">
                No weekly journal entries are available yet.
              </p>
            </DashboardCardShell>
          ) : (
            readyJournal.days.map((day) => (
              <DashboardCardShell
                key={`${day.date}-${day.dayNumber}`}
                title={`Day ${day.dayNumber}`}
                subtitle={formatDateOnly(day.date)}
                className="shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
              >
                <div className="grid gap-4 xl:grid-cols-3">
                  {DOMAIN_SECTIONS.map((domain) => {
                    const items =
                      domain.key === "SKILLS"
                        ? day.skills
                        : domain.key === "NUTRITION"
                          ? day.nutrition
                          : day.sandc;
                    return (
                      <div key={`${day.date}-${domain.key}`} className="space-y-3">
                        <div className="border-l-2 border-primary/60 pl-3">
                          <h4 className="text-sm font-semibold text-textPrimary">
                            {domain.sectionTitle}
                          </h4>
                          <p className="text-xs text-textSecondary">
                            {items.length > 0
                              ? `${items.length} item(s) released`
                              : domain.emptyMessage}
                          </p>
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
                            {domain.key === "NUTRITION"
                              ? renderNutritionDayTotalsPanel(items)
                              : null}
                            {items.map((item, index) =>
                              renderJournalItem(item, index, {
                                nutritionDomain: domain.key === "NUTRITION",
                              }),
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </DashboardCardShell>
            ))
          )}
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
