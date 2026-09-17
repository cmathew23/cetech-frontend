"use client";

import {
  DASHBOARD_METRIC_VALUE_CLASS,
  DASHBOARD_SECTION_HEADING_CLASS,
} from "@/components/dashboard/shared/dashboardTypography";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { formatDateOnly } from "@/lib/dateTime";
import {
  SANDC_SESSION_LOAD_HISTORY_EMPTY_MESSAGE,
  formatAverageSessionLoadAu,
  formatAverageSessionLoadDifference,
  sessionLoadHistoryWeekKey,
  type SandCSessionLoadWeek,
} from "@/lib/api/sessionLoadHistory";
import { cn } from "@/lib/utils";
import { useState, type ChangeEvent } from "react";

function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = formatDateOnly(weekStart, weekStart);
  const end = formatDateOnly(weekEnd, weekEnd);
  if (start === "" || end === "") return weekStart;
  return `${start} – ${end}`;
}

function SandCSessionLoadHistoryComparison({
  currentLoad,
  currentWeekStart,
  currentWeekEnd,
  historyWeeks,
  historyLoading,
  historyError,
}: {
  currentLoad: number | null;
  currentWeekStart?: string;
  currentWeekEnd?: string;
  historyWeeks: SandCSessionLoadWeek[];
  historyLoading: boolean;
  historyError: string | null;
}) {
  const [selectedWeekKey, setSelectedWeekKey] = useState("");
  const latestWeekKey =
    historyWeeks.length > 0
      ? sessionLoadHistoryWeekKey(historyWeeks[historyWeeks.length - 1]!)
      : "";
  const effectiveWeekKey = historyWeeks.some(
    (week) => sessionLoadHistoryWeekKey(week) === selectedWeekKey,
  )
    ? selectedWeekKey
    : latestWeekKey;
  const selectedWeek =
    historyWeeks.find(
      (week) => sessionLoadHistoryWeekKey(week) === effectiveWeekKey,
    ) ?? null;
  const currentWeekLabel =
    currentWeekStart && currentWeekEnd
      ? formatWeekRange(currentWeekStart, currentWeekEnd)
      : "Current week";

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
        <p className="text-sm text-textSecondary">
          {SANDC_SESSION_LOAD_HISTORY_EMPTY_MESSAGE}
        </p>
      </section>
    );
  }

  return (
    <section className="min-w-0 space-y-3">
      <h4 className={DASHBOARD_SECTION_HEADING_CLASS}>
        Historical Comparison
      </h4>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          id="sandc-session-load-history-current-week"
          label="Current week"
          className="min-w-0"
        >
          <Select
            id="sandc-session-load-history-current-week"
            value="current"
            disabled
          >
            <option value="current">{currentWeekLabel}</option>
          </Select>
        </FormField>
        <FormField
          id="sandc-session-load-history-week"
          label="Historical week"
          className="min-w-0"
        >
          <Select
            id="sandc-session-load-history-week"
            value={effectiveWeekKey}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setSelectedWeekKey(event.target.value)
            }
          >
            {historyWeeks.map((week) => (
              <option
                key={sessionLoadHistoryWeekKey(week)}
                value={sessionLoadHistoryWeekKey(week)}
              >
                {formatWeekRange(week.weekStart, week.weekEnd)}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <dl className="space-y-1.5">
        {(
          [
            [
              "Current Week Average Session Load",
              formatAverageSessionLoadAu(currentLoad),
            ],
            [
              "Historical Week Average Session Load",
              formatAverageSessionLoadAu(selectedWeek?.averageSessionLoad ?? null),
            ],
            [
              "Difference",
              formatAverageSessionLoadDifference(
                currentLoad,
                selectedWeek?.averageSessionLoad ?? null,
              ),
            ],
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
    </section>
  );
}

export function SandCSessionLoadCard({
  averageSessionLoad,
  weekStart,
  weekEnd,
  historyWeeks = [],
  historyLoading = false,
  historyError = null,
  titleClassName,
  cardClassName,
}: {
  averageSessionLoad: number | null;
  weekStart?: string;
  weekEnd?: string;
  historyWeeks?: SandCSessionLoadWeek[];
  historyLoading?: boolean;
  historyError?: string | null;
  titleClassName?: string;
  cardClassName?: string;
}) {
  const weekLabel =
    weekStart && weekEnd ? formatWeekRange(weekStart, weekEnd) : undefined;

  return (
    <Card
      title="Average Weekly Session Load"
      subtitle={weekLabel ? `Current plan week: ${weekLabel}` : undefined}
      accent={false}
      padding="compact"
      className={cn(
        "shadow-[0_10px_30px_rgba(15,23,42,0.05)]",
        cardClassName,
      )}
      titleClassName={titleClassName}
    >
      <div className="space-y-5">
        <p className={DASHBOARD_METRIC_VALUE_CLASS}>
          {formatAverageSessionLoadAu(averageSessionLoad)}
        </p>
        <SandCSessionLoadHistoryComparison
          currentLoad={averageSessionLoad}
          currentWeekStart={weekStart}
          currentWeekEnd={weekEnd}
          historyWeeks={historyWeeks}
          historyLoading={historyLoading}
          historyError={historyError}
        />
      </div>
    </Card>
  );
}
