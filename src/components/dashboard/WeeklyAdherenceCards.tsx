"use client";

import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { Badge } from "@/components/ui/Badge";
import { formatDateOnly } from "@/lib/dateTime";
import type {
  WeeklyAdherenceDomainKey,
  WeeklyAdherenceSummary,
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

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded % 1 === 0 ? Math.round(rounded) : rounded}%`;
}

function adherenceBadgeVariant(
  percent: number,
): "success" | "warning" | "neutral" {
  if (percent >= 80) return "success";
  if (percent >= 50) return "warning";
  return "neutral";
}

function AdherenceMetricCard({
  title,
  plannedSessions,
  loggedSessions,
  adherencePercent,
  recentNotes,
}: {
  title: string;
  plannedSessions: number;
  loggedSessions: number;
  adherencePercent: number;
  recentNotes?: { date: string; plannedSessionId: string; note: string }[];
}) {
  const notes = recentNotes ?? [];

  return (
    <DashboardCardShell title={title} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={adherenceBadgeVariant(adherencePercent)}>
          {formatPercent(adherencePercent)}
        </Badge>
        <span className="text-xs text-textMuted">adherence</span>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs font-medium text-textMuted">Planned</dt>
          <dd className="font-semibold tabular-nums text-textPrimary">
            {plannedSessions}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-textMuted">Logged</dt>
          <dd className="font-semibold tabular-nums text-textPrimary">
            {loggedSessions}
          </dd>
        </div>
      </dl>
      {notes.length > 0 ? (
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-semibold text-textSecondary">Recent notes</p>
          <ul className="space-y-2">
            {notes.map((entry) => (
              <li
                key={`${entry.plannedSessionId}-${entry.date}-${entry.note.slice(0, 24)}`}
                className="rounded-lg border border-slate-200/80 bg-slate-50/60 px-3 py-2"
              >
                <p className="text-xs font-medium text-textMuted">
                  {formatDateOnly(entry.date, entry.date || "—")}
                </p>
                <p className="mt-0.5 text-sm text-textPrimary">{entry.note}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </DashboardCardShell>
  );
}

export type WeeklyAdherenceCardsProps = {
  summary: WeeklyAdherenceSummary;
  /** Optional heading above the card grid (e.g. athlete name for coach view). */
  heading?: string;
};

export function WeeklyAdherenceCards({
  summary,
  heading,
}: WeeklyAdherenceCardsProps) {
  const domainKeys = DOMAIN_ORDER.filter((key) => summary.domains[key] != null);
  const weekLabel = `${formatDateOnly(summary.weekStart, summary.weekStart)} – ${formatDateOnly(summary.weekEnd, summary.weekEnd)}`;

  return (
    <div className="space-y-3">
      {heading ? (
        <h3 className="text-sm font-semibold text-textPrimary">{heading}</h3>
      ) : null}
      <p className="text-xs text-textMuted">Week of {weekLabel}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summary.overall != null ? (
          <AdherenceMetricCard
            title="Overall"
            plannedSessions={summary.overall.plannedSessions}
            loggedSessions={summary.overall.loggedSessions}
            adherencePercent={summary.overall.adherencePercent}
          />
        ) : null}
        {domainKeys.map((key) => {
          const domain = summary.domains[key];
          if (!domain) return null;
          return (
            <AdherenceMetricCard
              key={key}
              title={DOMAIN_LABELS[key]}
              plannedSessions={domain.plannedSessions}
              loggedSessions={domain.loggedSessions}
              adherencePercent={domain.adherencePercent}
              recentNotes={
                domain.recentNotes.length > 0 ? domain.recentNotes : undefined
              }
            />
          );
        })}
      </div>
      {domainKeys.length === 0 && summary.overall == null ? (
        <p className="text-sm text-textSecondary">
          No adherence domains returned for this week.
        </p>
      ) : null}
    </div>
  );
}
