"use client";

import { AdminTableSearchInput } from "@/components/dashboard/admin/AdminTableSearchInput";
import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminTableSearchMatches } from "@/lib/adminTableSearch";
import {
  formatDateTime,
  parseTimestampMsForSort,
} from "@/lib/dateTime";
import { formatEnumeratedLabel } from "@/lib/textFormat";
import type { PendingInvitationRow } from "@/types/academyAdmin.types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

function formatMetric(
  loading: boolean,
  error: string | null,
  value: number | null,
): string {
  if (loading) return "…";
  if (error) return "—";
  if (value === null) return "—";
  return String(value);
}

function sortInvitationsRecent(
  rows: PendingInvitationRow[],
): PendingInvitationRow[] {
  return [...rows].sort((a, b) => {
    const ta = parseTimestampMsForSort(a.createdAt);
    const tb = parseTimestampMsForSort(b.createdAt);
    const aBad = !Number.isFinite(ta);
    const bBad = !Number.isFinite(tb);
    if (aBad && bBad) return 0;
    if (aBad) return 1;
    if (bBad) return -1;
    return tb - ta;
  });
}

/** Single primary CTA — full-width intent, not a leftover grid cell. */
const PRIMARY_ACTION_CLASS =
  "flex w-full flex-col gap-4 rounded-xl border-2 border-primary bg-primary/10 p-6 shadow-md transition-colors hover:border-primary hover:bg-primary/[0.14] focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6";

type AdminDashboardOverviewProps = {
  kpiLoading: boolean;
  kpiError: string | null;
  athleteCount: number | null;
  coachCount: number | null;
  pendingInvitationCount: number | null;
  allInvitations: PendingInvitationRow[];
  invitationsHref: string;
};

export function AdminDashboardOverview({
  kpiLoading,
  kpiError,
  athleteCount,
  coachCount,
  pendingInvitationCount,
  allInvitations,
  invitationsHref,
}: AdminDashboardOverviewProps) {
  const [recentSearchQuery, setRecentSearchQuery] = useState("");

  const recentInvitations = useMemo(() => {
    return sortInvitationsRecent(allInvitations)
      .filter((row) =>
        adminTableSearchMatches(recentSearchQuery, [
          row.email,
          row.role,
          row.status,
        ]),
      )
      .slice(0, 5);
  }, [allInvitations, recentSearchQuery]);

  const hasAnyInvitations = allInvitations.length > 0;
  const recentEmptyMessage = !hasAnyInvitations
    ? "No invitations yet."
    : recentInvitations.length === 0
      ? "No results found."
      : "";

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-textSecondary">
            Summary
          </h2>
          <p className="mt-1 text-xs text-textMuted">
            Roster totals and pending invites for your academy.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-textSecondary">
              Total Athletes
            </p>
            <p className="text-2xl font-semibold tabular-nums text-textPrimary">
              {formatMetric(kpiLoading, kpiError, athleteCount)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-textSecondary">
              Total Coaches
            </p>
            <p className="text-2xl font-semibold tabular-nums text-textPrimary">
              {formatMetric(kpiLoading, kpiError, coachCount)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-textSecondary">
              Pending Invitations
            </p>
            <p className="text-2xl font-semibold tabular-nums text-textPrimary">
              {formatMetric(kpiLoading, kpiError, pendingInvitationCount)}
            </p>
          </div>
        </div>
        {kpiError ? (
          <p className="text-sm text-danger">{kpiError}</p>
        ) : null}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-textSecondary">
            Action required
          </h2>
          <p className="mt-1 text-xs text-textMuted">
            Review and send follow-up from the invitations workspace.
          </p>
        </div>
        <DashboardCardShell title="Pending Invitations" className="space-y-2" accent={false}>
          <Link href={invitationsHref} className={cn(PRIMARY_ACTION_CLASS)}>
            <div className="min-w-0 flex-1 space-y-1">
              {kpiLoading ? (
                <p className="text-sm text-textSecondary">Loading…</p>
              ) : kpiError ? (
                <p className="text-sm text-textSecondary">Could not load count.</p>
              ) : (
                <p className="text-sm text-textSecondary">
                  <span className="text-3xl font-semibold tabular-nums text-textPrimary">
                    {pendingInvitationCount ?? "—"}
                  </span>
                  <span className="ml-2">
                    pending
                    {pendingInvitationCount === 1 ? " invite" : " invites"}
                  </span>
                </p>
              )}
            </div>
            <span className="shrink-0 text-sm font-semibold text-primary sm:text-base">
              Open invitations →
            </span>
          </Link>
        </DashboardCardShell>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div />
          <AdminTableSearchInput
            id="admin-dashboard-recent-invitations-search"
            value={recentSearchQuery}
            onChange={setRecentSearchQuery}
            placeholder="Search recent invitations"
            disabled={kpiLoading || !hasAnyInvitations}
          />
        </div>
        <DashboardCardShell
          title="Recent Invitations"
          subtitle="Latest five by sent date; search filters this list only."
          className="flex min-h-0 flex-col"
          accent={false}
        >
          <ul className="space-y-3">
            {recentInvitations.length === 0 ? (
              <li className="text-sm text-textSecondary">
                {recentEmptyMessage}
              </li>
            ) : (
              recentInvitations.map((row) => (
                <li
                  key={row.invitationId}
                  className="flex flex-col gap-1 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-textPrimary">
                      {row.email}
                    </span>
                    <StatusBadge status={row.status}>
                      {formatEnumeratedLabel(row.status)}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-textMuted">
                    Role {formatEnumeratedLabel(row.role)} ·{" "}
                    {formatDateTime(row.createdAt)}
                  </p>
                </li>
              ))
            )}
          </ul>
          <Link
            href={invitationsHref}
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            View all invitations
          </Link>
        </DashboardCardShell>
      </section>
    </div>
  );
}
