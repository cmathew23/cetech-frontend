"use client";

import { AdminTableSearchInput } from "@/components/dashboard/admin/AdminTableSearchInput";
import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { adminTableSearchMatches } from "@/lib/adminTableSearch";
import { formatEnumeratedLabel } from "@/lib/textFormat";
import type { PendingInvitationRow } from "@/types/academyAdmin.types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

function statusBadgeClass(status: string): string {
  const upper = status.trim().toUpperCase();
  if (upper === "PENDING")
    return "bg-amber-50 text-amber-800 ring-amber-600/20";
  if (upper === "ACCEPTED")
    return "bg-emerald-50 text-emerald-800 ring-emerald-600/20";
  if (upper === "DECLINED")
    return "bg-rose-50 text-rose-800 ring-rose-600/20";
  if (upper === "REVOKED")
    return "bg-orange-50 text-orange-800 ring-orange-600/20";
  if (upper === "EXPIRED")
    return "bg-zinc-100 text-zinc-700 ring-zinc-600/20";
  return "bg-gray-100 text-gray-700 ring-gray-600/20";
}

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
    const ae = a.createdAt.trim();
    const be = b.createdAt.trim();
    if (ae === "" || ae === "—") return 1;
    if (be === "" || be === "—") return -1;
    return be.localeCompare(ae);
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
          <DashboardCardShell title="Total Athletes" className="space-y-2">
            <p className="text-2xl font-semibold tabular-nums text-textPrimary">
              {formatMetric(kpiLoading, kpiError, athleteCount)}
            </p>
          </DashboardCardShell>
          <DashboardCardShell title="Total Coaches" className="space-y-2">
            <p className="text-2xl font-semibold tabular-nums text-textPrimary">
              {formatMetric(kpiLoading, kpiError, coachCount)}
            </p>
          </DashboardCardShell>
          <DashboardCardShell title="Pending Invitations" className="space-y-2">
            <p className="text-2xl font-semibold tabular-nums text-textPrimary">
              {formatMetric(kpiLoading, kpiError, pendingInvitationCount)}
            </p>
          </DashboardCardShell>
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
        <Link href={invitationsHref} className={cn(PRIMARY_ACTION_CLASS)}>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-lg font-semibold text-textPrimary">
              Pending invitations
            </p>
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
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-textSecondary">
              Recent invitations
            </h2>
            <p className="mt-1 text-xs text-textMuted">
              Latest five by sent date; search filters this list only.
            </p>
          </div>
          <AdminTableSearchInput
            id="admin-dashboard-recent-invitations-search"
            value={recentSearchQuery}
            onChange={setRecentSearchQuery}
            placeholder="Search recent invitations"
            disabled={kpiLoading || !hasAnyInvitations}
          />
        </div>
        <DashboardCardShell className="flex min-h-0 flex-col">
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
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                        statusBadgeClass(row.status),
                      )}
                    >
                      {formatEnumeratedLabel(row.status)}
                    </span>
                  </div>
                  <p className="text-xs text-textMuted">
                    Role {formatEnumeratedLabel(row.role)} · {row.createdAt}
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
