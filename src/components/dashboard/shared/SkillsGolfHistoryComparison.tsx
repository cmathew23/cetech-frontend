"use client";

import { DASHBOARD_SECTION_HEADING_CLASS } from "@/components/dashboard/shared/dashboardTypography";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import {
  SKILLS_GOLF_HISTORY_EMPTY_MESSAGE,
  fetchSportMetricsGolfWeeklySummaryHistory,
  formatGolfHistoryAbsoluteLabel,
  formatGolfHistoryDifferenceLabel,
  golfHistoryWeekKey,
  type SportMetricsGolfWeeklySummary,
} from "@/lib/api/sportMetricsGolf";
import { formatDateOnly } from "@/lib/dateTime";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

export function formatSkillsGolfHistoryWeekLabel(
  weekStartDate: string,
  weekEndDate: string,
): string {
  return `${formatDateOnly(weekStartDate, weekStartDate)} – ${formatDateOnly(weekEndDate, weekEndDate)}`;
}

type SkillsGolfHistoryComparisonValue = {
  historyWeeks: SportMetricsGolfWeeklySummary[];
  selectedWeek: SportMetricsGolfWeeklySummary | null;
  historyLoading: boolean;
  historyError: string | null;
  hasHistory: boolean;
  setSelectedWeekKey: (key: string) => void;
};

const SkillsGolfHistoryComparisonContext =
  createContext<SkillsGolfHistoryComparisonValue | null>(null);

export function useSkillsGolfHistoryComparison(): SkillsGolfHistoryComparisonValue | null {
  return useContext(SkillsGolfHistoryComparisonContext);
}

export function SkillsGolfHistoryComparisonProvider({
  entityId,
  athleteId,
  historyWeeks: injectedWeeks,
  children,
}: {
  entityId: string;
  athleteId: string;
  historyWeeks?: SportMetricsGolfWeeklySummary[];
  children: ReactNode;
}) {
  const [fetchedWeeks, setFetchedWeeks] = useState<
    SportMetricsGolfWeeklySummary[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedWeekKey, setSelectedWeekKey] = useState("");

  const trimmedEntityId = entityId.trim();
  const trimmedAthleteId = athleteId.trim();
  const skipFetch = injectedWeeks !== undefined;
  const fetchKey =
    !skipFetch && trimmedEntityId !== "" && trimmedAthleteId !== ""
      ? `${trimmedEntityId}|${trimmedAthleteId}`
      : "";

  useEffect(() => {
    if (fetchKey === "") {
      if (!skipFetch) {
        setFetchedWeeks([]);
        setHistoryError(null);
        setHistoryLoading(false);
      }
      return;
    }

    let cancelled = false;
    setHistoryLoading(true);

    void (async () => {
      try {
        const weeks = await fetchSportMetricsGolfWeeklySummaryHistory({
          entityId: trimmedEntityId,
          athleteId: trimmedAthleteId,
        });
        if (cancelled) return;
        setFetchedWeeks(weeks);
        setHistoryError(null);
      } catch (e) {
        if (cancelled) return;
        setFetchedWeeks([]);
        setHistoryError(
          e instanceof Error
            ? e.message
            : "Unable to load Skills historical comparison.",
        );
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchKey, skipFetch, trimmedAthleteId, trimmedEntityId]);

  const historyWeeks = injectedWeeks ?? fetchedWeeks;
  const latestWeekKey =
    historyWeeks.length > 0
      ? golfHistoryWeekKey(historyWeeks[historyWeeks.length - 1]!)
      : "";
  const effectiveWeekKey = historyWeeks.some(
    (week) => golfHistoryWeekKey(week) === selectedWeekKey,
  )
    ? selectedWeekKey
    : latestWeekKey;
  const selectedWeek =
    historyWeeks.find((week) => golfHistoryWeekKey(week) === effectiveWeekKey) ??
    null;

  const value = useMemo(
    (): SkillsGolfHistoryComparisonValue => ({
      historyWeeks,
      selectedWeek,
      historyLoading: skipFetch ? false : historyLoading,
      historyError: skipFetch ? null : historyError,
      hasHistory: historyWeeks.length > 0,
      setSelectedWeekKey,
    }),
    [
      historyError,
      historyLoading,
      historyWeeks,
      selectedWeek,
      skipFetch,
    ],
  );

  return (
    <SkillsGolfHistoryComparisonContext.Provider value={value}>
      {children}
    </SkillsGolfHistoryComparisonContext.Provider>
  );
}

export function SkillsGolfHistoryWeekSelector() {
  const comparison = useSkillsGolfHistoryComparison();
  if (!comparison) return null;

  if (comparison.historyLoading) {
    return (
      <section className="min-w-0 space-y-2">
        <h4 className={DASHBOARD_SECTION_HEADING_CLASS}>
          Historical Comparison
        </h4>
        <p className="text-sm text-textSecondary">Loading…</p>
      </section>
    );
  }

  if (comparison.historyError) {
    return (
      <section className="min-w-0 space-y-2">
        <h4 className={DASHBOARD_SECTION_HEADING_CLASS}>
          Historical Comparison
        </h4>
        <p className="text-sm text-textSecondary">{comparison.historyError}</p>
      </section>
    );
  }

  if (!comparison.hasHistory) {
    return (
      <section className="min-w-0 space-y-2">
        <h4 className={DASHBOARD_SECTION_HEADING_CLASS}>
          Historical Comparison
        </h4>
        <p className="text-sm text-textSecondary">
          {SKILLS_GOLF_HISTORY_EMPTY_MESSAGE}
        </p>
      </section>
    );
  }

  const selectedKey = comparison.selectedWeek
    ? golfHistoryWeekKey(comparison.selectedWeek)
    : "";

  return (
    <section className="min-w-0 space-y-2">
      <FormField
        id="skills-golf-history-week"
        label="Compare with"
        className="min-w-0 max-w-md"
      >
        <Select
          id="skills-golf-history-week"
          value={selectedKey}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            comparison.setSelectedWeekKey(event.target.value)
          }
        >
          {comparison.historyWeeks.map((week) => (
            <option
              key={golfHistoryWeekKey(week)}
              value={golfHistoryWeekKey(week)}
            >
              {formatSkillsGolfHistoryWeekLabel(
                week.weekStartDate,
                week.weekEndDate,
              )}
            </option>
          ))}
        </Select>
      </FormField>
    </section>
  );
}

export function SkillsGolfHistoryValues({
  currentLabel,
  historicalLabel,
  differenceLabel,
}: {
  currentLabel: string;
  historicalLabel: string;
  differenceLabel: string;
}) {
  return (
    <dl className="mt-3 min-w-0 space-y-1.5">
      {(
        [
          ["Current", currentLabel],
          ["Historical", historicalLabel],
          ["Difference", differenceLabel],
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
  );
}

export function formatGolfHistoryValue(
  value: number | null,
  unit: string | null,
): string {
  return formatGolfHistoryAbsoluteLabel(value, unit);
}

export function SkillsGolfScalarHistoryComparison({
  currentValue,
  historicalValue,
  unit,
}: {
  currentValue: number | null;
  historicalValue: number | null;
  unit: string | null;
}) {
  const comparison = useSkillsGolfHistoryComparison();
  if (!comparison?.hasHistory) return null;

  return (
    <SkillsGolfHistoryValues
      currentLabel={formatGolfHistoryAbsoluteLabel(currentValue, unit)}
      historicalLabel={formatGolfHistoryAbsoluteLabel(historicalValue, unit)}
      differenceLabel={formatGolfHistoryDifferenceLabel(
        currentValue,
        historicalValue,
        unit,
      )}
    />
  );
}

export function SkillsGolfItemHistoryComparison({
  selectId,
  selectLabel,
  items,
  selectedKey,
  onSelectedKeyChange,
  currentValue,
  historicalValue,
  unit,
}: {
  selectId: string;
  selectLabel: string;
  items: Array<{ key: string; label: string }>;
  selectedKey: string;
  onSelectedKeyChange: (key: string) => void;
  currentValue: number | null;
  historicalValue: number | null;
  unit: string | null;
}) {
  const comparison = useSkillsGolfHistoryComparison();
  if (!comparison?.hasHistory || items.length === 0) return null;

  return (
    <div className="min-w-0">
      {items.length > 1 ? (
        <FormField id={selectId} label={selectLabel} className="min-w-0 max-w-md">
          <Select
            id={selectId}
            value={selectedKey}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              onSelectedKeyChange(event.target.value)
            }
          >
            {items.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </Select>
        </FormField>
      ) : null}
      <SkillsGolfScalarHistoryComparison
        currentValue={currentValue}
        historicalValue={historicalValue}
        unit={unit}
      />
    </div>
  );
}