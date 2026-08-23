"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  shouldShowWeeklyTrainingLoadCard,
  trainingLoadHoursForViewer,
  visibleTrainingLoadDomains,
  type TrainingLoadComparison,
  type TrainingLoadHoursDirection,
  type WeeklyAdherenceDomainKey,
  type WeeklyTrainingLoadViewerContext,
} from "@/lib/api/weeklyAdherence";

export function formatTrainingLoadHours(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

export function formatTrainingLoadComparisonPhrase(
  status: TrainingLoadHoursDirection,
  differenceHours: number | null,
): string {
  if (status === "ABOUT_SAME") return "About the same";
  if (differenceHours === null) {
    return status === "HIGHER" ? "Higher" : "Lower";
  }
  const hours = formatTrainingLoadHours(Math.abs(differenceHours));
  return status === "HIGHER" ? `${hours} h higher` : `${hours} h lower`;
}

function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function formatDayMonth(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function formatTrainingLoadWeekRange(
  weekStart?: string | null,
  weekEnd?: string | null,
): string | null {
  if (!weekStart?.trim() || !weekEnd?.trim()) return null;
  const start = parseDateOnly(weekStart);
  const end = parseDateOnly(weekEnd);
  if (!start || !end) return null;
  const endYear = end.getFullYear();
  if (start.getFullYear() === endYear) {
    return `${formatDayMonth(start)} – ${formatDayMonth(end)} ${endYear}`;
  }
  return `${formatDayMonth(start)} ${start.getFullYear()} – ${formatDayMonth(end)} ${endYear}`;
}

function scopeCaption(
  domainKeys: Array<"SKILL" | "STRENGTH_CONDITIONING">,
  viewerContext: WeeklyTrainingLoadViewerContext,
): string {
  if (viewerContext === "SKILLS") return "Skills";
  if (viewerContext === "S_AND_C") return "S&C";
  if (
    domainKeys.includes("SKILL") &&
    domainKeys.includes("STRENGTH_CONDITIONING")
  ) {
    return "Skills + S&C";
  }
  if (domainKeys.includes("SKILL")) return "Skills";
  if (domainKeys.includes("STRENGTH_CONDITIONING")) return "S&C";
  return "Skills + S&C";
}

function HeadlineMetric({
  label,
  value,
  caption,
  mutedValue = false,
}: {
  label: string;
  value: string;
  caption: string;
  mutedValue?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200/80 bg-slate-50/60 px-3 py-2.5">
      <p className="text-xs font-medium tracking-wide text-textMuted">{label}</p>
      <p
        className={cn(
          "mt-1 font-medium leading-tight text-textPrimary",
          mutedValue
            ? "text-sm leading-snug"
            : "text-2xl tabular-nums leading-none",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] leading-tight text-textMuted">{caption}</p>
    </div>
  );
}

function ComparisonLine({
  label,
  status,
  differenceHours,
}: {
  label: string;
  status: TrainingLoadHoursDirection;
  differenceHours: number | null;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-textMuted">{label}</span>
      <span className="text-sm tabular-nums text-textPrimary">
        {formatTrainingLoadComparisonPhrase(status, differenceHours)}
      </span>
    </div>
  );
}

export function WeeklyTrainingLoadCard({
  comparison,
  visibleDomains,
  viewerContext = "DEFAULT",
  weekStart,
  weekEnd,
  cardClassName,
  titleClassName,
}: {
  comparison: TrainingLoadComparison | null | undefined;
  visibleDomains?: WeeklyAdherenceDomainKey[];
  viewerContext?: WeeklyTrainingLoadViewerContext;
  weekStart?: string | null;
  weekEnd?: string | null;
  cardClassName?: string;
  titleClassName?: string;
}) {
  if (
    !shouldShowWeeklyTrainingLoadCard({
      comparison,
      visibleDomains,
      viewerContext,
    }) ||
    !comparison
  ) {
    return null;
  }

  const baselineMissing =
    comparison.baselineAvailable === false ||
    comparison.reportedBaselineHours === null;
  const plannedHours = trainingLoadHoursForViewer(
    comparison.aiPlanned,
    viewerContext,
  );
  const actualHours = trainingLoadHoursForViewer(
    comparison.actualCompleted,
    viewerContext,
  );
  const completedLabel =
    comparison.completedToDate || comparison.isCurrentWeek
      ? "Completed to date"
      : "Completed";
  const completionMissing = comparison.completionDataAvailable === false;
  const domainKeys = visibleTrainingLoadDomains(comparison, viewerContext);
  const caption = scopeCaption(domainKeys, viewerContext);
  const showSkills = domainKeys.includes("SKILL");
  const showSandC = domainKeys.includes("STRENGTH_CONDITIONING");
  const weekRangeLabel = formatTrainingLoadWeekRange(weekStart, weekEnd);

  return (
    <Card
      title="Weekly Training Load"
      subtitle={weekRangeLabel ?? undefined}
      accent={false}
      padding="compact"
      className={cn("shadow-[0_10px_30px_rgba(15,23,42,0.05)]", cardClassName)}
      titleClassName={titleClassName}
      actions={
        comparison.plannedComplete === false ? (
          <Badge variant="neutral">Partial plan</Badge>
        ) : null
      }
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <HeadlineMetric
          label="Reported weekly training"
          value={
            baselineMissing
              ? "Not reported"
              : `${formatTrainingLoadHours(comparison.reportedBaselineHours!)} h`
          }
          caption="per week"
          mutedValue={baselineMissing}
        />
        <HeadlineMetric
          label="AI planned"
          value={`${formatTrainingLoadHours(plannedHours)} h`}
          caption={caption}
        />
        <HeadlineMetric
          label={completedLabel}
          value={
            completionMissing
              ? "No completion data yet"
              : `${formatTrainingLoadHours(actualHours)} h`
          }
          caption={caption}
          mutedValue={completionMissing}
        />
      </div>

      {showSkills || showSandC ? (
        <div className="mt-3 border-t border-border pt-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-x-4 gap-y-1.5 text-sm">
            <span />
            <span className="text-right text-textMuted">Planned</span>
            <span className="text-right text-textMuted">Completed</span>
            {showSkills ? (
              <>
                <span className="text-textPrimary">Skills</span>
                <span className="text-right tabular-nums text-textPrimary">
                  {formatTrainingLoadHours(comparison.aiPlanned.skillsHours)} h
                </span>
                <span className="text-right tabular-nums text-textPrimary">
                  {formatTrainingLoadHours(
                    comparison.actualCompleted.skillsHours,
                  )}{" "}
                  h
                </span>
              </>
            ) : null}
            {showSandC ? (
              <>
                <span className="text-textPrimary">S&C</span>
                <span className="text-right tabular-nums text-textPrimary">
                  {formatTrainingLoadHours(comparison.aiPlanned.sandCHours)} h
                </span>
                <span className="text-right tabular-nums text-textPrimary">
                  {formatTrainingLoadHours(
                    comparison.actualCompleted.sandCHours,
                  )}{" "}
                  h
                </span>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {comparison.plannedVsBaselineStatus ||
      comparison.actualVsPlannedStatus ? (
        <div className="mt-3 space-y-1.5 border-t border-border pt-3">
          {comparison.plannedVsBaselineStatus ? (
            <ComparisonLine
              label="AI planned vs reported total"
              status={comparison.plannedVsBaselineStatus}
              differenceHours={comparison.plannedVsBaselineHours}
            />
          ) : null}
          {comparison.actualVsPlannedStatus ? (
            <ComparisonLine
              label="Completed vs AI planned"
              status={comparison.actualVsPlannedStatus}
              differenceHours={comparison.actualVsPlannedHours}
            />
          ) : null}
        </div>
      ) : null}

      <p className="mt-3 text-[11px] leading-snug text-textMuted">
        Reported total training may include activities outside the Skills and
        S&C plans.
      </p>
    </Card>
  );
}
