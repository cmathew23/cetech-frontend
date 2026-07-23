"use client";

import {
  buildWeeklyAdherenceMetricTiles,
  WeeklyAdherenceCards,
} from "@/components/dashboard/WeeklyAdherenceCards";
import { ATHLETE_DASHBOARD_CARD_TITLE_CLASS } from "@/components/dashboard/athlete/athleteDashboardTypography";
import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import { Card } from "@/components/ui/Card";
import {
  formatAdherencePercent,
  isChronologicalWeeklyAdherenceSnapshotPair,
  useAthleteWeeklyAdherence,
} from "@/components/dashboard/athlete/AthleteWeeklyAdherenceContext";
import { formatDateOnly } from "@/lib/dateTime";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import type {
  WeeklyAdherenceComparisonData,
  WeeklyAdherenceComparisonDomainDelta,
  WeeklyAdherenceComparisonWeeklyBreakdown,
  WeeklyAdherenceDomainKey,
} from "@/lib/api/weeklyAdherence";
import { useState, type ChangeEvent } from "react";

type WeeklyComparisonCategory =
  | "OVERALL"
  | "SKILL"
  | "NUTRITION"
  | "STRENGTH_CONDITIONING";

type WeeklyComparisonParameter =
  | "OVERALL_ADHERENCE"
  | "SKILLS_ADHERENCE"
  | "NUTRITION_ADHERENCE"
  | "S_AND_C_ADHERENCE";

const WEEKLY_COMPARISON_CATEGORY_CONFIG: Record<
  WeeklyComparisonCategory,
  {
    label: string;
    parameter: WeeklyComparisonParameter;
    parameterLabel: string;
    domain?: WeeklyAdherenceDomainKey;
  }
> = {
  OVERALL: {
    label: "Overall",
    parameter: "OVERALL_ADHERENCE",
    parameterLabel: "Overall adherence",
  },
  SKILL: {
    label: "Skills",
    parameter: "SKILLS_ADHERENCE",
    parameterLabel: "Skills adherence",
    domain: "SKILL",
  },
  NUTRITION: {
    label: "Nutrition",
    parameter: "NUTRITION_ADHERENCE",
    parameterLabel: "Nutrition adherence",
    domain: "NUTRITION",
  },
  STRENGTH_CONDITIONING: {
    label: "S&C",
    parameter: "S_AND_C_ADHERENCE",
    parameterLabel: "S&C adherence",
    domain: "STRENGTH_CONDITIONING",
  },
};

export function weeklyComparisonCategoryOptions(
  comparisonData: WeeklyAdherenceComparisonData | null,
): WeeklyComparisonCategory[] {
  if (comparisonData === null) return ["OVERALL"];
  const categories: WeeklyComparisonCategory[] = [];
  const parsedDomainKeys = new Set(
    Object.keys(comparisonData.domains ?? {}),
  );
  if (comparisonData.overall !== null) categories.push("OVERALL");
  for (const category of [
    "SKILL",
    "NUTRITION",
    "STRENGTH_CONDITIONING",
  ] as const) {
    if (
      parsedDomainKeys.has(
        WEEKLY_COMPARISON_CATEGORY_CONFIG[category].domain!,
      )
    ) {
      categories.push(category);
    }
  }
  return categories.length > 0 ? categories : ["OVERALL"];
}

export function reconcileWeeklyComparisonControlSelection(
  categories: WeeklyComparisonCategory[],
  selectedCategory: WeeklyComparisonCategory,
  selectedParameter: WeeklyComparisonParameter,
): [WeeklyComparisonCategory, WeeklyComparisonParameter] {
  const category = categories.includes(selectedCategory)
    ? selectedCategory
    : (categories[0] ?? "OVERALL");
  const parameter = WEEKLY_COMPARISON_CATEGORY_CONFIG[category].parameter;
  return [
    category,
    selectedParameter === parameter ? selectedParameter : parameter,
  ];
}

type WeeklyBreakdownMetric = {
  label: string;
  value: number | null | undefined;
  unit?: "min" | "kcal";
};

function selectedWeeklyBreakdownMetrics(
  category: Exclude<WeeklyComparisonCategory, "OVERALL">,
  weekly: WeeklyAdherenceComparisonWeeklyBreakdown | null,
): WeeklyBreakdownMetric[] {
  if (category === "NUTRITION") {
    return [
      { label: "Weighted meal credit", value: weekly?.completionCredit },
      { label: "Full meals", value: weekly?.fullItems },
      { label: "Half meals", value: weekly?.halfItems },
      { label: "Missed meals", value: weekly?.missedItems },
      { label: "Planned calories", value: weekly?.plannedCalories },
      { label: "Consumed calories", value: weekly?.actualCalories },
    ];
  }
  return [
    {
      label:
        category === "SKILL"
          ? "Prescribed drills"
          : "Prescribed exercises",
      value: weekly?.totalPrescribedItems,
    },
    {
      label:
        category === "SKILL" ? "Completed drills" : "Completed exercises",
      value: weekly?.completedItems,
    },
    { label: "Planned minutes", value: weekly?.plannedMinutes },
    { label: "Actual minutes", value: weekly?.actualMinutes },
  ];
}

function selectedWeeklyBreakdownDeltaMetrics(
  category: Exclude<WeeklyComparisonCategory, "OVERALL">,
  delta: WeeklyAdherenceComparisonDomainDelta | null,
): WeeklyBreakdownMetric[] {
  if (category === "NUTRITION") {
    return [
      { label: "Weighted meal credit", value: delta?.completionCredit },
      { label: "Full meals", value: delta?.fullItems },
      { label: "Half meals", value: delta?.halfItems },
      { label: "Missed meals", value: delta?.missedItems },
      {
        label: "Planned calories",
        value: delta?.plannedCalories,
        unit: "kcal",
      },
      {
        label: "Consumed calories",
        value: delta?.actualCalories,
        unit: "kcal",
      },
    ];
  }
  return [
    {
      label:
        category === "SKILL"
          ? "Prescribed drills"
          : "Prescribed exercises",
      value: delta?.totalPrescribedItems,
    },
    {
      label:
        category === "SKILL" ? "Completed drills" : "Completed exercises",
      value: delta?.completedItems,
    },
    { label: "Planned minutes", value: delta?.plannedMinutes, unit: "min" },
    { label: "Actual minutes", value: delta?.actualMinutes, unit: "min" },
  ];
}

function formatWeeklyBreakdownDelta(metric: WeeklyBreakdownMetric): string {
  if (metric.value === null || metric.value === undefined) {
    return "Not available";
  }
  if (metric.value === 0) return "—";
  const value = `${metric.value > 0 ? "+" : ""}${metric.value}`;
  return metric.unit ? `${value} ${metric.unit}` : value;
}

function WeeklyBreakdownColumn({
  weekLabel,
  metrics,
  change = false,
}: {
  weekLabel: string;
  metrics: WeeklyBreakdownMetric[];
  change?: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-textPrimary">{weekLabel}</p>
      <dl className="space-y-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <dt className="text-textSecondary">{metric.label}</dt>
            <dd className="font-medium text-textPrimary">
              {change
                ? formatWeeklyBreakdownDelta(metric)
                : metric.value === null || metric.value === undefined
                  ? "Not available"
                  : metric.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function WeeklyAdherenceSectionCard({
  weekLabel,
  children,
}: {
  weekLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      title="Weekly Adherence"
      subtitle={`Current plan week: ${weekLabel}`}
      accent={false}
      padding="compact"
      className={DASHBOARD_MAJOR_OUTER_CARD_CLASS}
      titleClassName={ATHLETE_DASHBOARD_CARD_TITLE_CLASS}
    >
      {children}
    </Card>
  );
}

export function AthleteWeeklyAdherenceSection() {
  const {
    phase,
    summary,
    error,
    reload,
    weekStart,
    weekEnd,
    availableSnapshots,
    snapshotsLoading,
    snapshotsError,
    comparisonLoading,
    comparisonError,
    comparisonData,
    selectedSnapshotAId,
    selectedSnapshotBId,
    setSelectedSnapshotAId,
    setSelectedSnapshotBId,
  } = useAthleteWeeklyAdherence();
  const [selectedCategory, setSelectedCategory] =
    useState<WeeklyComparisonCategory>("OVERALL");
  const [selectedParameter, setSelectedParameter] =
    useState<WeeklyComparisonParameter>("OVERALL_ADHERENCE");
  const categoryOptions = weeklyComparisonCategoryOptions(comparisonData);
  const [activeCategory, activeParameter] =
    reconcileWeeklyComparisonControlSelection(
      categoryOptions,
      selectedCategory,
      selectedParameter,
    );
  const activeCategoryConfig =
    WEEKLY_COMPARISON_CATEGORY_CONFIG[activeCategory];

  const weekLabel =
    weekStart !== "" && weekEnd !== ""
      ? `${formatDateOnly(weekStart, weekStart)} – ${formatDateOnly(weekEnd, weekEnd)}`
      : "Loading plan week...";

  if (phase === "hidden") {
    return null;
  }

  if (phase === "awaiting_identifiers") {
    return (
      <WeeklyAdherenceSectionCard weekLabel={weekLabel}>
        <p className="text-sm text-textSecondary">
          Preparing adherence summary…
        </p>
      </WeeklyAdherenceSectionCard>
    );
  }

  const insufficientHistory = availableSnapshots.length < 2;
  const earlierOptions =
    selectedSnapshotBId === ""
      ? availableSnapshots
      : availableSnapshots.filter((snapshot) =>
          isChronologicalWeeklyAdherenceSnapshotPair(
            availableSnapshots,
            snapshot.id,
            selectedSnapshotBId,
          ),
        );
  const laterOptions =
    selectedSnapshotAId === ""
      ? availableSnapshots
      : availableSnapshots.filter((snapshot) =>
          isChronologicalWeeklyAdherenceSnapshotPair(
            availableSnapshots,
            selectedSnapshotAId,
            snapshot.id,
          ),
        );
  const snapshotSelectors = (
    <div className="space-y-3">
      {snapshotsLoading ? (
        <p className="text-sm text-textSecondary">Loading historical weeks…</p>
      ) : null}
      {!snapshotsLoading && snapshotsError ? (
        <Alert variant="danger">
          Snapshot loading failed: {snapshotsError}
        </Alert>
      ) : null}
      {!snapshotsLoading &&
      !snapshotsError &&
      insufficientHistory ? (
        <Alert variant="warning">No historical weeks available.</Alert>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField id="weekly-adherence-snapshot-a" label="Earlier week">
          <Select
            id="weekly-adherence-snapshot-a"
            value={selectedSnapshotAId}
            disabled={snapshotsLoading || snapshotsError !== null || insufficientHistory}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setSelectedSnapshotAId(event.target.value)
            }
          >
            <option value="">
              {snapshotsLoading
                ? "Loading historical weeks…"
                : snapshotsError
                  ? "Historical weeks unavailable"
                  : insufficientHistory
                    ? "No historical weeks available"
                    : "Select an earlier week"}
            </option>
            {earlierOptions.map((snapshot) => (
              <option
                key={snapshot.id}
                value={snapshot.id}
                disabled={snapshot.id === selectedSnapshotBId}
              >
                {snapshot.weekStart && snapshot.weekEnd
                  ? `${formatDateOnly(snapshot.weekStart, snapshot.weekStart)} – ${formatDateOnly(snapshot.weekEnd, snapshot.weekEnd)}`
                  : snapshot.id}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          id="weekly-adherence-snapshot-b"
          label="Later week"
        >
          <Select
            id="weekly-adherence-snapshot-b"
            value={selectedSnapshotBId}
            disabled={snapshotsLoading || snapshotsError !== null || insufficientHistory}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setSelectedSnapshotBId(event.target.value)
            }
          >
            <option value="">
              {snapshotsLoading
                ? "Loading historical weeks…"
                : snapshotsError
                  ? "Historical weeks unavailable"
                  : insufficientHistory
                    ? "No historical weeks available"
                    : "Select a later week"}
            </option>
            {laterOptions.map((snapshot) => (
              <option
                key={snapshot.id}
                value={snapshot.id}
                disabled={snapshot.id === selectedSnapshotAId}
              >
                {snapshot.weekStart && snapshot.weekEnd
                  ? `${formatDateOnly(snapshot.weekStart, snapshot.weekStart)} – ${formatDateOnly(snapshot.weekEnd, snapshot.weekEnd)}`
                  : snapshot.id}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField id="weekly-adherence-category" label="Category">
          <Select
            id="weekly-adherence-category"
            value={activeCategory}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              const category = event.target.value as WeeklyComparisonCategory;
              setSelectedCategory(category);
              setSelectedParameter(
                WEEKLY_COMPARISON_CATEGORY_CONFIG[category].parameter,
              );
            }}
          >
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {WEEKLY_COMPARISON_CATEGORY_CONFIG[category].label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField id="weekly-adherence-parameter" label="Parameter">
          <Select
            id="weekly-adherence-parameter"
            value={activeParameter}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setSelectedParameter(
                event.target.value as WeeklyComparisonParameter,
              )
            }
          >
            <option value={activeCategoryConfig.parameter}>
              {activeCategoryConfig.parameterLabel}
            </option>
          </Select>
        </FormField>
      </div>
      {comparisonLoading ? (
        <p className="text-sm text-textSecondary">Loading comparison…</p>
      ) : null}
      {comparisonError ? (
        <Alert variant="danger">{comparisonError}</Alert>
      ) : null}
    </div>
  );
  const showComparisonSummary =
    selectedSnapshotAId !== "" &&
    selectedSnapshotBId !== "" &&
    isChronologicalWeeklyAdherenceSnapshotPair(
      availableSnapshots,
      selectedSnapshotAId,
      selectedSnapshotBId,
    ) &&
    !comparisonLoading &&
    comparisonError === null &&
    comparisonData !== null;
  const activeDomain = activeCategoryConfig.domain;
  const activeComparison =
    activeCategory === "OVERALL"
      ? (comparisonData?.overall ?? null)
      : activeDomain
        ? (comparisonData?.domains[activeDomain] ?? null)
        : null;
  const earlierComparisonValue =
    activeCategory === "OVERALL"
      ? (comparisonData?.snapshotA?.weeklyAdherenceSummary.overall
          ?.adherencePercent ?? null)
      : activeDomain
        ? (comparisonData?.snapshotA?.domainBreakdowns[activeDomain]?.weekly
            .adherencePercent ?? null)
        : null;
  const laterComparisonValue =
    activeCategory === "OVERALL"
      ? (comparisonData?.snapshotB?.weeklyAdherenceSummary.overall
          ?.adherencePercent ?? null)
      : activeDomain
        ? (comparisonData?.snapshotB?.domainBreakdowns[activeDomain]?.weekly
            .adherencePercent ?? null)
        : null;
  const comparisonDelta =
    activeComparison?.delta?.adherencePercent ?? null;
  const comparisonIsComparable =
    activeComparison?.comparisonStatus === "COMPARABLE";
  const comparisonOutcome =
    comparisonDelta === null
      ? null
      : comparisonDelta > 0
        ? "Improved"
        : comparisonDelta < 0
          ? "Declined"
          : "No change";
  const comparisonSummary = showComparisonSummary ? (
    <Card
      title={`${activeCategoryConfig.label} — ${activeCategoryConfig.parameterLabel}`}
      subtitle="Weekly Comparison"
      accent={false}
      padding="compact"
      className={DASHBOARD_MAJOR_OUTER_CARD_CLASS}
      titleClassName={ATHLETE_DASHBOARD_CARD_TITLE_CLASS}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-textPrimary">Earlier week</p>
          <p className="text-sm text-textSecondary">
            {formatDateOnly(
              comparisonData.snapshotA.planStartDate,
              comparisonData.snapshotA.planStartDate,
            )}{" "}
            –{" "}
            {formatDateOnly(
              comparisonData.snapshotA.planEndDate,
              comparisonData.snapshotA.planEndDate,
            )}
          </p>
          <p className="text-lg font-medium text-textPrimary">
            {earlierComparisonValue === null
              ? "Not available"
              : formatAdherencePercent(earlierComparisonValue)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-textPrimary">Later week</p>
          <p className="text-sm text-textSecondary">
            {formatDateOnly(
              comparisonData.snapshotB.planStartDate,
              comparisonData.snapshotB.planStartDate,
            )}{" "}
            –{" "}
            {formatDateOnly(
              comparisonData.snapshotB.planEndDate,
              comparisonData.snapshotB.planEndDate,
            )}
          </p>
          <p className="text-lg font-medium text-textPrimary">
            {laterComparisonValue === null
              ? "Not available"
              : formatAdherencePercent(laterComparisonValue)}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-textPrimary">Change</p>
          {comparisonIsComparable && comparisonOutcome && comparisonDelta !== null ? (
            <>
              <Badge
                variant={
                  comparisonDelta > 0
                    ? "success"
                    : comparisonDelta < 0
                      ? "error"
                      : "neutral"
                }
              >
                {comparisonOutcome}
              </Badge>
              <p className="text-sm text-textSecondary">
                {comparisonDelta > 0 ? "+" : ""}
                {formatAdherencePercent(comparisonDelta)}
              </p>
            </>
          ) : (
            <>
              <Badge variant="neutral">Comparison unavailable</Badge>
              {comparisonIsComparable ? (
                <p className="text-sm text-textSecondary">Not available</p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </Card>
  ) : null;
  const breakdownCategory =
    activeCategory === "OVERALL" ? null : activeCategory;
  const earlierWeeklyBreakdown =
    activeDomain && comparisonData
      ? (comparisonData.snapshotA.domainBreakdowns[activeDomain]?.weekly ??
        null)
      : null;
  const laterWeeklyBreakdown =
    activeDomain && comparisonData
      ? (comparisonData.snapshotB.domainBreakdowns[activeDomain]?.weekly ??
        null)
      : null;
  const activeDomainDelta =
    activeDomain && comparisonData
      ? (comparisonData.domains[activeDomain]?.delta ?? null)
      : null;
  const comparisonBreakdown =
    showComparisonSummary && breakdownCategory ? (
      <Card
        title={`${activeCategoryConfig.label} Weekly Breakdown`}
        accent={false}
        padding="compact"
        className={DASHBOARD_MAJOR_OUTER_CARD_CLASS}
        titleClassName={ATHLETE_DASHBOARD_CARD_TITLE_CLASS}
      >
        {earlierWeeklyBreakdown === null &&
        laterWeeklyBreakdown === null ? (
          <p className="text-sm text-textSecondary">
            Weekly breakdown unavailable
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <WeeklyBreakdownColumn
              weekLabel="Earlier week"
              metrics={selectedWeeklyBreakdownMetrics(
                breakdownCategory,
                earlierWeeklyBreakdown,
              )}
            />
            <WeeklyBreakdownColumn
              weekLabel="Later week"
              metrics={selectedWeeklyBreakdownMetrics(
                breakdownCategory,
                laterWeeklyBreakdown,
              )}
            />
            <WeeklyBreakdownColumn
              weekLabel="Change"
              metrics={selectedWeeklyBreakdownDeltaMetrics(
                breakdownCategory,
                activeDomainDelta,
              )}
              change
            />
          </div>
        )}
      </Card>
    ) : null;
  const comparisonArea = (
    <>
      {snapshotSelectors}
      {comparisonSummary}
      {comparisonBreakdown}
    </>
  );

  if (phase === "loading") {
    return (
      <>
        {comparisonArea}
        <WeeklyAdherenceSectionCard weekLabel={weekLabel}>
          <p className="text-sm text-textSecondary">Loading…</p>
        </WeeklyAdherenceSectionCard>
      </>
    );
  }

  if (phase === "error") {
    return (
      <>
        {comparisonArea}
        <WeeklyAdherenceSectionCard weekLabel={weekLabel}>
          <div className="space-y-3">
            <Alert variant="danger">{error ?? "Unable to load"}</Alert>
            <Button type="button" variant="secondary" onClick={reload}>
              Try again
            </Button>
          </div>
        </WeeklyAdherenceSectionCard>
      </>
    );
  }

  if (phase === "loaded" && summary) {
    const tiles = buildWeeklyAdherenceMetricTiles(summary);
    if (tiles.length > 0) {
      return (
        <>
          {comparisonArea}
          <WeeklyAdherenceCards
            summary={summary}
            cardTitleClassName={ATHLETE_DASHBOARD_CARD_TITLE_CLASS}
            cardClassName={DASHBOARD_MAJOR_OUTER_CARD_CLASS}
            softTileTypography
          />
        </>
      );
    }
    return (
      <>
        {comparisonArea}
        <WeeklyAdherenceSectionCard weekLabel={weekLabel}>
          <p className="text-sm text-textSecondary">
            No adherence metrics returned for this week.
          </p>
        </WeeklyAdherenceSectionCard>
      </>
    );
  }

  return (
    <>
      {comparisonArea}
      <WeeklyAdherenceSectionCard weekLabel={weekLabel}>
        <p className="text-sm text-textSecondary">Loading…</p>
      </WeeklyAdherenceSectionCard>
    </>
  );
}
