"use client";

import {
  DASHBOARD_METRIC_TILE_CLASS,
  DASHBOARD_METRIC_TITLE_CLASS,
  DASHBOARD_SECTION_HEADING_CLASS,
} from "@/components/dashboard/shared/dashboardTypography";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import {
  NUTRITION_HISTORY_NUTRIENT_METRICS,
  NUTRITION_PERFORMANCE_MEAL_ORDER,
  formatNutritionHistoryChangeLabel,
  nutritionDeviationForSelection,
  nutritionDeviationPointChange,
  type NutritionHistoryComparisonType,
  type NutritionPerformanceData,
  type NutritionPerformanceMealBreakdown,
  type NutritionPerformanceMetric,
  type NutritionWeeklySummary,
} from "@/lib/api/nutritionPerformance";
import { formatDateOnly } from "@/lib/dateTime";
import { cn } from "@/lib/utils";
import { useState, type ChangeEvent } from "react";

const UNAVAILABLE = "—";

const NUTRIENT_ROWS: Array<{
  key: keyof NutritionPerformanceData["weeklyTotals"];
  title: string;
  kind: "calories" | "grams";
  fallbackUnit: string;
}> = [
  { key: "calories", title: "Calories", kind: "calories", fallbackUnit: "kcal" },
  { key: "protein", title: "Protein", kind: "grams", fallbackUnit: "g" },
  { key: "carbohydrates", title: "Carbohydrates", kind: "grams", fallbackUnit: "g" },
  { key: "fat", title: "Fat", kind: "grams", fallbackUnit: "g" },
  { key: "fiber", title: "Fiber", kind: "grams", fallbackUnit: "g" },
  { key: "calcium", title: "Calcium", kind: "grams", fallbackUnit: "mg" },
  { key: "magnesium", title: "Magnesium", kind: "grams", fallbackUnit: "mg" },
  { key: "sodium", title: "Sodium", kind: "grams", fallbackUnit: "mg" },
  { key: "potassium", title: "Potassium", kind: "grams", fallbackUnit: "mg" },
];

const MEAL_LABELS: Record<(typeof NUTRITION_PERFORMANCE_MEAL_ORDER)[number], string> = {
  BREAKFAST: "Breakfast",
  MID_MORNING_SNACK: "Mid-morning snack",
  LUNCH: "Lunch",
  MID_AFTERNOON_SNACK: "Mid-afternoon snack",
  DINNER: "Dinner",
};

type NutritionComparisonRow = {
  name: string;
  weeklyTarget: string;
  plannedToDate: string;
  actualToDate: string;
  deviation: string;
};

export function formatNutritionCalories(value: number | null): string {
  if (value === null) return UNAVAILABLE;
  return Math.round(value).toLocaleString("en-US");
}

export function formatNutritionGrams(value: number | null): string {
  if (value === null) return UNAVAILABLE;
  const rounded =
    (Math.round(Math.abs(value) * 10) / 10) * (value < 0 ? -1 : 1);
  const normalized = Object.is(rounded, -0) ? 0 : rounded;
  if (normalized === 0) return "0";
  return normalized.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function formatNutritionDeviationPercent(value: number | null): string {
  if (value === null) return UNAVAILABLE;
  const rounded =
    (Math.round(Math.abs(value) * 10) / 10) * (value < 0 ? -1 : 1);
  const normalized = Object.is(rounded, -0) ? 0 : rounded;
  return `${normalized.toFixed(1)}%`;
}

function formatQuantity(
  value: number | null,
  kind: "calories" | "grams",
): string {
  return kind === "calories"
    ? formatNutritionCalories(value)
    : formatNutritionGrams(value);
}

function formatQuantityWithUnit(
  value: number | null,
  kind: "calories" | "grams",
  unit: string,
): string {
  if (value === null) return UNAVAILABLE;
  return `${formatQuantity(value, kind)} ${unit}`;
}

function mealByType(
  meals: NutritionPerformanceMealBreakdown[],
  mealType: string,
): NutritionPerformanceMealBreakdown | null {
  return meals.find((meal) => meal.mealType === mealType) ?? null;
}

function nutrientRow(
  title: string,
  metric: NutritionPerformanceMetric | null,
  kind: "calories" | "grams",
  fallbackUnit: string,
): NutritionComparisonRow {
  const unit = metric?.unit?.trim() || fallbackUnit;
  return {
    name: title,
    weeklyTarget: formatQuantityWithUnit(
      metric?.weeklyPlanned ?? null,
      kind,
      unit,
    ),
    plannedToDate: formatQuantityWithUnit(
      metric?.plannedToDate ?? null,
      kind,
      unit,
    ),
    actualToDate: formatQuantityWithUnit(
      metric?.actualToDate ?? null,
      kind,
      unit,
    ),
    deviation: formatNutritionDeviationPercent(
      metric?.deviationPercent ?? null,
    ),
  };
}

function mealRow(
  title: string,
  meal: NutritionPerformanceMealBreakdown | null,
): NutritionComparisonRow {
  return {
    name: title,
    weeklyTarget: formatQuantityWithUnit(
      meal?.weeklyPlannedCaloriesKcal ?? null,
      "calories",
      "kcal",
    ),
    plannedToDate: formatQuantityWithUnit(
      meal?.plannedToDateCaloriesKcal ?? null,
      "calories",
      "kcal",
    ),
    actualToDate: formatQuantityWithUnit(
      meal?.actualToDateCaloriesKcal ?? null,
      "calories",
      "kcal",
    ),
    deviation: formatNutritionDeviationPercent(meal?.deviationPercent ?? null),
  };
}

function NutritionMetricCard({ row }: { row: NutritionComparisonRow }) {
  return (
    <article
      className={cn(
        DASHBOARD_METRIC_TILE_CLASS,
        "h-full min-w-0 !min-h-0",
      )}
    >
      <h4 className={DASHBOARD_METRIC_TITLE_CLASS}>{row.name}</h4>
      <div className="mt-2 flex min-w-0 flex-col gap-3 min-[480px]:flex-row min-[480px]:items-stretch">
        <dl className="min-w-0 grow basis-[65%] min-[480px]:pr-3">
          {(
            [
              ["Weekly Target", row.weeklyTarget],
              ["Planned to Date", row.plannedToDate],
              ["Actual to Date", row.actualToDate],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-3 py-0.5 text-sm"
            >
              <dt className="shrink-0 whitespace-nowrap text-textSecondary">
                {label}
              </dt>
              <dd className="min-w-0 shrink-0 whitespace-nowrap text-right tabular-nums text-textPrimary">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex shrink-0 grow-0 basis-[35%] flex-col items-center justify-center border-t border-border pt-2 text-center min-[480px]:border-l min-[480px]:border-t-0 min-[480px]:pl-3 min-[480px]:pt-0">
          <p className="text-xl font-medium leading-none tabular-nums text-textPrimary">
            {row.deviation}
          </p>
          <p className="mt-1 text-xs text-textSecondary">Deviation</p>
        </div>
      </div>
    </article>
  );
}

function NutritionMetricCardGrid({ rows }: { rows: NutritionComparisonRow[] }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <NutritionMetricCard key={row.name} row={row} />
      ))}
    </div>
  );
}

const NUTRIENT_METRIC_LABELS: Record<
  (typeof NUTRITION_HISTORY_NUTRIENT_METRICS)[number],
  string
> = {
  calories: "Calories",
  protein: "Protein",
  carbohydrates: "Carbohydrates",
  fat: "Fat",
  fiber: "Fiber",
};

const HISTORY_EMPTY_MESSAGE =
  "Historical comparison will appear after the first completed Nutrition week.";

function weekKey(week: Pick<NutritionWeeklySummary, "weekStart" | "weekEnd">): string {
  return `${week.weekStart}|${week.weekEnd}`;
}

function formatWeekRange(weekStart: string, weekEnd: string): string {
  return `${formatDateOnly(weekStart, weekStart)} – ${formatDateOnly(weekEnd, weekEnd)}`;
}

export function formatNutritionHistoryWeekOption(
  index: number,
  weekStart: string,
  weekEnd: string,
): string {
  return `Week ${index + 1} — ${formatWeekRange(weekStart, weekEnd)}`;
}

function NutritionPerformanceHistoryComparison({
  current,
  historyWeeks,
  historyLoading = false,
  historyError = null,
}: {
  current: NutritionPerformanceData;
  historyWeeks: NutritionWeeklySummary[];
  historyLoading?: boolean;
  historyError?: string | null;
}) {
  const [selectedWeekKey, setSelectedWeekKey] = useState("");
  const [comparisonType, setComparisonType] =
    useState<NutritionHistoryComparisonType>("NUTRIENT");
  const [metric, setMetric] = useState<string>("calories");

  const latestWeekKey =
    historyWeeks.length > 0
      ? weekKey(historyWeeks[historyWeeks.length - 1]!)
      : "";
  const effectiveWeekKey = historyWeeks.some(
    (week) => weekKey(week) === selectedWeekKey,
  )
    ? selectedWeekKey
    : latestWeekKey;

  const selectedWeek =
    historyWeeks.find((week) => weekKey(week) === effectiveWeekKey) ?? null;
  const selectedWeekIndex = historyWeeks.findIndex(
    (week) => weekKey(week) === effectiveWeekKey,
  );

  const metricLabel =
    comparisonType === "NUTRIENT"
      ? NUTRIENT_METRIC_LABELS[
          metric as (typeof NUTRITION_HISTORY_NUTRIENT_METRICS)[number]
        ] ?? metric
      : MEAL_LABELS[metric as (typeof NUTRITION_PERFORMANCE_MEAL_ORDER)[number]] ??
        metric;

  const currentDeviation = nutritionDeviationForSelection(
    current,
    comparisonType,
    metric,
  );
  const historicalDeviation = nutritionDeviationForSelection(
    selectedWeek,
    comparisonType,
    metric,
  );
  const change = nutritionDeviationPointChange(
    currentDeviation,
    historicalDeviation,
  );

  const currentWeekLabel = formatWeekRange(current.weekStart, current.weekEnd);

  if (historyLoading) {
    return (
      <section className="min-w-0 space-y-3">
        <h4 className={DASHBOARD_SECTION_HEADING_CLASS}>
          Historical Comparison
        </h4>
        <p className="text-sm text-textSecondary">Loading…</p>
      </section>
    );
  }

  if (historyError) {
    return (
      <section className="min-w-0 space-y-3">
        <h4 className={DASHBOARD_SECTION_HEADING_CLASS}>
          Historical Comparison
        </h4>
        <p className="text-sm text-textSecondary">{historyError}</p>
      </section>
    );
  }

  if (historyWeeks.length === 0) {
    return (
      <section className="min-w-0 space-y-3">
        <h4 className={DASHBOARD_SECTION_HEADING_CLASS}>
          Historical Comparison
        </h4>
        <p className="text-sm text-textSecondary">{HISTORY_EMPTY_MESSAGE}</p>
      </section>
    );
  }

  return (
    <section className="min-w-0 space-y-3">
      <h4 className={DASHBOARD_SECTION_HEADING_CLASS}>
        Historical Comparison
      </h4>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FormField
          id="nutrition-history-current-week"
          label="Current week"
          className="min-w-0"
        >
          <Select
            id="nutrition-history-current-week"
            value="current"
            disabled
          >
            <option value="current">{currentWeekLabel}</option>
          </Select>
        </FormField>
        <FormField
          id="nutrition-history-week"
          label="Historical week"
          className="min-w-0"
        >
          <Select
            id="nutrition-history-week"
            value={effectiveWeekKey}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setSelectedWeekKey(event.target.value)
            }
          >
            {historyWeeks.map((week, index) => (
              <option key={weekKey(week)} value={weekKey(week)}>
                {formatNutritionHistoryWeekOption(
                  index,
                  week.weekStart,
                  week.weekEnd,
                )}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField id="nutrition-history-type" label="Type" className="min-w-0">
          <Select
            id="nutrition-history-type"
            value={comparisonType}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              const next = event.target.value as NutritionHistoryComparisonType;
              setComparisonType(next);
              setMetric(next === "NUTRIENT" ? "calories" : "BREAKFAST");
            }}
          >
            <option value="NUTRIENT">Nutrient</option>
            <option value="MEAL">Meal</option>
          </Select>
        </FormField>
        <FormField
          id="nutrition-history-metric"
          label="Metric"
          className="min-w-0"
        >
          <Select
            id="nutrition-history-metric"
            value={metric}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setMetric(event.target.value)
            }
          >
            {comparisonType === "NUTRIENT"
              ? NUTRITION_HISTORY_NUTRIENT_METRICS.map((key) => (
                  <option key={key} value={key}>
                    {NUTRIENT_METRIC_LABELS[key]}
                  </option>
                ))
              : NUTRITION_PERFORMANCE_MEAL_ORDER.map((mealType) => (
                  <option key={mealType} value={mealType}>
                    {MEAL_LABELS[mealType]}
                  </option>
                ))}
          </Select>
        </FormField>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-textPrimary">{metricLabel}</p>
        <dl className="space-y-1.5">
          {(
            [
              ["Current Week", formatNutritionDeviationPercent(currentDeviation)],
              [
                selectedWeekIndex >= 0 ? `Week ${selectedWeekIndex + 1}` : "Historical week",
                formatNutritionDeviationPercent(historicalDeviation),
              ],
              ["Change", formatNutritionHistoryChangeLabel(change)],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="flex min-w-0 items-baseline justify-between gap-4 text-sm"
            >
              <dt className="min-w-0 text-textSecondary">{label}</dt>
              <dd className="shrink-0 tabular-nums text-textPrimary">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function NutritionPerformanceCard({
  data,
  historyWeeks = [],
  historyLoading = false,
  historyError = null,
  titleClassName,
  cardClassName,
}: {
  data: NutritionPerformanceData;
  historyWeeks?: NutritionWeeklySummary[];
  historyLoading?: boolean;
  historyError?: string | null;
  titleClassName?: string;
  cardClassName?: string;
}) {
  const weekStart = formatDateOnly(data.weekStart, data.weekStart);
  const weekEnd = formatDateOnly(data.weekEnd, data.weekEnd);
  const weekLabel =
    weekStart !== "" && weekEnd !== ""
      ? `${weekStart} – ${weekEnd}`
      : "";

  const nutrientRows = NUTRIENT_ROWS.map((row) =>
    nutrientRow(
      row.title,
      data.weeklyTotals[row.key],
      row.kind,
      row.fallbackUnit,
    ),
  );

  const mealRows = NUTRITION_PERFORMANCE_MEAL_ORDER.map((mealType) =>
    mealRow(
      MEAL_LABELS[mealType],
      mealByType(data.mealBreakdown, mealType),
    ),
  );

  return (
    <Card
      title="Nutrition Performance"
      subtitle={
        weekLabel !== "" ? `Current plan week: ${weekLabel}` : undefined
      }
      accent={false}
      padding="compact"
      className={cn(
        "shadow-[0_10px_30px_rgba(15,23,42,0.05)]",
        cardClassName,
      )}
      titleClassName={titleClassName}
    >
      <div className="space-y-5">
        <section className="min-w-0 space-y-3">
          <h4 className={DASHBOARD_SECTION_HEADING_CLASS}>
            Nutrient Performance
          </h4>
          <NutritionMetricCardGrid rows={nutrientRows} />
        </section>

        <section className="min-w-0 space-y-3">
          <h4 className={DASHBOARD_SECTION_HEADING_CLASS}>Meal Distribution</h4>
          <NutritionMetricCardGrid rows={mealRows} />
        </section>

        <div className="pb-5">
          <NutritionPerformanceHistoryComparison
            current={data}
            historyWeeks={historyWeeks}
            historyLoading={historyLoading}
            historyError={historyError}
          />
        </div>
      </div>
    </Card>
  );
}
