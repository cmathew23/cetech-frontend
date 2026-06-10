"use client";

import { Card } from "@/components/ui/Card";
import { StatusBadge, type StatusBadgeVariant } from "@/components/ui/StatusBadge";
import { formatDateOnly } from "@/lib/dateTime";
import { cn } from "@/lib/utils";
import {
  isNutritionContext,
  isSessionContext,
  resolveNutritionCompletionCredit,
  resolveNutritionTotalPrescribedItems,
  resolveSessionCompletionCredit,
  resolveSessionTotalPrescribedItems,
  shouldUseNutritionWeightedCreditLine,
  type NutritionDomainContext,
  type SessionDomainContext,
  type WeeklyAdherenceDomainContext,
  type WeeklyAdherenceDomainKey,
  type WeeklyAdherenceSummary,
} from "@/lib/api/weeklyAdherence";

const DOMAIN_LABELS: Record<WeeklyAdherenceDomainKey, string> = {
  SKILL: "Skills",
  NUTRITION: "Nutrition",
  STRENGTH_CONDITIONING: "S&C",
};

const DOMAIN_ORDER: WeeklyAdherenceDomainKey[] = [
  "SKILL",
  "NUTRITION",
  "STRENGTH_CONDITIONING",
];

export const ADHERENCE_PERCENT_MEANING: Record<
  WeeklyAdherenceDomainKey | "overall",
  string
> = {
  overall: "Item-based plan adherence",
  SKILL: "Prescribed drill completion",
  NUTRITION: "Meal item adherence",
  STRENGTH_CONDITIONING: "Prescribed exercise completion",
};

export type WeeklyAdherenceMetricTile = {
  key: string;
  domainKey: WeeklyAdherenceDomainKey | "overall";
  label: string;
  percentMeaning: string;
  adherencePercent: number;
  context: WeeklyAdherenceDomainContext | null;
  plannedItems: number;
  isOverall: boolean;
};

export function buildWeeklyAdherenceMetricTiles(
  summary: WeeklyAdherenceSummary,
): WeeklyAdherenceMetricTile[] {
  const tiles: WeeklyAdherenceMetricTile[] = [];

  if (summary.overall != null) {
    tiles.push({
      key: "overall",
      domainKey: "overall",
      label: "Overall",
      percentMeaning: ADHERENCE_PERCENT_MEANING.overall,
      adherencePercent: summary.overall.adherencePercent,
      context: null,
      plannedItems: 0,
      isOverall: true,
    });
  }

  for (const domainKey of DOMAIN_ORDER) {
    const domain = summary.domains[domainKey];
    if (domain) {
      tiles.push({
        key: domainKey,
        domainKey,
        label: DOMAIN_LABELS[domainKey],
        percentMeaning: ADHERENCE_PERCENT_MEANING[domainKey],
        adherencePercent: domain.adherencePercent,
        context: domain.context,
        plannedItems: domain.plannedSessions,
        isOverall: false,
      });
    }
  }

  return tiles;
}

export function formatAdherencePercentDisplay(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded % 1 === 0 ? Math.round(rounded) : rounded.toFixed(1)}%`;
}

function formatCompletionCredit(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return rounded % 1 === 0 ? String(Math.round(rounded)) : rounded.toFixed(1);
}

function formatNum(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function formatSessionItemCompletionLine(
  domainKey: "SKILL" | "STRENGTH_CONDITIONING",
  ctx: SessionDomainContext,
  plannedFallback: number,
): string {
  const itemLabel =
    domainKey === "SKILL" ? "prescribed skill drills" : "prescribed S&C exercises";
  const planned = resolveSessionTotalPrescribedItems(ctx, plannedFallback);
  const completionCredit = resolveSessionCompletionCredit(ctx);

  if (completionCredit != null && planned > 0) {
    return `${formatCompletionCredit(completionCredit)} of ${planned} ${itemLabel} completed`;
  }

  if (ctx.partialItems > 0) {
    return `${ctx.completedItems} of ${planned} ${itemLabel} completed · ${ctx.partialItems} partial`;
  }

  return `${ctx.completedItems} of ${planned} ${itemLabel} completed`;
}

export function formatSessionMinutesContextLines(
  ctx: SessionDomainContext,
): string[] {
  if (ctx.plannedDurationMinutes <= 0 && ctx.actualDurationMinutes <= 0) {
    return [];
  }

  const variance = ctx.actualDurationMinutes - ctx.plannedDurationMinutes;
  let varianceLine = "On planned duration";
  if (variance > 0) {
    varianceLine = `+${formatNum(variance)} min vs planned`;
  } else if (variance < 0) {
    varianceLine = `-${formatNum(Math.abs(variance))} min vs planned`;
  }

  return [
    varianceLine,
    `${formatNum(ctx.plannedDurationMinutes)} min planned · ${formatNum(ctx.actualDurationMinutes)} min actual`,
  ];
}

export function formatNutritionItemCompletionLine(
  ctx: NutritionDomainContext,
): string {
  const total = resolveNutritionTotalPrescribedItems(ctx);
  const weightedCredit = resolveNutritionCompletionCredit(ctx);
  const rawLogged = ctx.fullItems + ctx.halfItems;

  if (
    weightedCredit != null &&
    total > 0 &&
    shouldUseNutritionWeightedCreditLine(ctx)
  ) {
    return `${formatCompletionCredit(weightedCredit)} of ${total} weighted meal-credit followed`;
  }

  return `${rawLogged} of ${total} meal items followed`;
}

export function formatNutritionItemStatusLine(ctx: NutritionDomainContext): string {
  const parts = [
    `${ctx.fullItems} full`,
    `${ctx.halfItems} half`,
    `${ctx.notEatenItems} missed`,
  ];
  if (ctx.extraItems > 0) {
    parts.push(`${ctx.extraItems} extra`);
  }
  return parts.join(" · ");
}

export function formatNutritionCalorieContextLine(
  ctx: NutritionDomainContext,
): string {
  return `${formatNum(ctx.actualCaloriesKcal)} / ${formatNum(ctx.plannedCaloriesKcal)} kcal`;
}

type AdherenceStatus = {
  label: string;
  variant: StatusBadgeVariant;
};

function resolveAdherenceStatus(percent: number): AdherenceStatus {
  if (!Number.isFinite(percent)) {
    return { label: "No Data", variant: "neutral" };
  }
  if (percent >= 85) {
    return { label: "On Track", variant: "success" };
  }
  if (percent >= 60) {
    return { label: "Needs Review", variant: "warning" };
  }
  return { label: "Action Required", variant: "error" };
}

function percentToneClass(percent: number): string {
  if (!Number.isFinite(percent)) return "text-slate-600";
  if (percent >= 85) return "text-emerald-700";
  if (percent >= 60) return "text-amber-700";
  return "text-slate-600";
}

function AdherenceStatusBadge({ percent }: { percent: number }) {
  const status = resolveAdherenceStatus(percent);
  return (
    <StatusBadge variant={status.variant} className="shrink-0 text-[10px]">
      {status.label}
    </StatusBadge>
  );
}

function SessionContextLines({
  domainKey,
  ctx,
  plannedItems,
}: {
  domainKey: "SKILL" | "STRENGTH_CONDITIONING";
  ctx: SessionDomainContext;
  plannedItems: number;
}) {
  const minuteLines = formatSessionMinutesContextLines(ctx);

  return (
    <>
      <p className="text-[11px] leading-tight text-textSecondary">
        {formatSessionItemCompletionLine(domainKey, ctx, plannedItems)}
      </p>
      {minuteLines.map((line) => (
        <p
          key={line}
          className={cn(
            "text-[11px] leading-tight text-textSecondary",
            line.includes("min planned") && "text-[10px] text-textMuted",
          )}
        >
          {line}
        </p>
      ))}
    </>
  );
}

function NutritionContextLines({ ctx }: { ctx: NutritionDomainContext }) {
  return (
    <>
      <p className="text-[11px] leading-tight text-textSecondary">
        {formatNutritionItemCompletionLine(ctx)}
      </p>
      <p className="text-[11px] leading-tight text-textSecondary">
        {formatNutritionItemStatusLine(ctx)}
      </p>
      <p className="text-[10px] leading-tight text-textMuted">
        {formatNutritionCalorieContextLine(ctx)}
      </p>
    </>
  );
}

function OverallContextLines() {
  return (
    <p className="text-[11px] leading-tight text-textSecondary">
      Combined item-based adherence across visible plan domains
    </p>
  );
}

function TileContextDetail({ tile }: { tile: WeeklyAdherenceMetricTile }) {
  if (tile.isOverall) {
    return <OverallContextLines />;
  }
  if (tile.context === null) return null;
  if (isSessionContext(tile.context)) {
    return (
      <SessionContextLines
        domainKey={tile.domainKey as "SKILL" | "STRENGTH_CONDITIONING"}
        ctx={tile.context}
        plannedItems={tile.plannedItems}
      />
    );
  }
  if (isNutritionContext(tile.context)) {
    return <NutritionContextLines ctx={tile.context} />;
  }
  return null;
}

function AdherenceMetricTile({ tile }: { tile: WeeklyAdherenceMetricTile }) {
  const contextDetail = <TileContextDetail tile={tile} />;

  return (
    <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 px-3 py-2.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-textMuted">{tile.label}</p>
        <AdherenceStatusBadge percent={tile.adherencePercent} />
      </div>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold leading-none tabular-nums",
          percentToneClass(tile.adherencePercent),
        )}
      >
        {formatAdherencePercentDisplay(tile.adherencePercent)}
      </p>
      <p className="mt-1 text-[10px] leading-tight text-textMuted">{tile.percentMeaning}</p>
      {contextDetail ? <div className="mt-1.5 space-y-0.5">{contextDetail}</div> : null}
    </div>
  );
}

export type WeeklyAdherenceCardsProps = {
  summary: WeeklyAdherenceSummary;
  athleteHeading?: string;
  showSectionHeader?: boolean;
};

export function WeeklyAdherenceCards({
  summary,
  athleteHeading,
  showSectionHeader = true,
}: WeeklyAdherenceCardsProps) {
  const tiles = buildWeeklyAdherenceMetricTiles(summary);
  const weekLabel = `${formatDateOnly(summary.weekStart, summary.weekStart)} – ${formatDateOnly(summary.weekEnd, summary.weekEnd)}`;

  const grid = (
    <div
      className={cn(
        "grid gap-3",
        tiles.length >= 4
          ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
          : tiles.length === 3
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : tiles.length === 2
              ? "grid-cols-1 sm:grid-cols-2"
              : "max-w-lg grid-cols-1",
      )}
    >
      {tiles.map((tile) => (
        <AdherenceMetricTile key={tile.key} tile={tile} />
      ))}
    </div>
  );

  if (tiles.length === 0) {
    return (
      <p className="text-sm text-textSecondary">
        No adherence metrics returned for this week.
      </p>
    );
  }

  if (!showSectionHeader) {
    return (
      <div className="space-y-2">
        {athleteHeading ? (
          <p className="text-sm font-semibold text-textPrimary">{athleteHeading}</p>
        ) : null}
        {grid}
      </div>
    );
  }

  return (
    <Card
      title="Weekly Adherence"
      subtitle={`Current plan week: ${weekLabel}`}
      accent={false}
      padding="compact"
      className="shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
    >
      {athleteHeading ? (
        <p className="mb-3 text-sm font-semibold text-textPrimary">{athleteHeading}</p>
      ) : null}
      {grid}
    </Card>
  );
}
