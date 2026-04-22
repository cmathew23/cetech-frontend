"use client";

import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { Alert } from "@/components/ui/Alert";
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  Th,
  Td,
} from "@/components/ui/Table";
import {
  fetchCoachAssignedAthletes,
  fetchCoachMeDashboard,
  formatAcademyCoachRoleForUi,
  formatTrainingPlanReleaseModeForUi,
  type CoachAssignedAthleteRow,
  type CoachMeDashboardData,
} from "@/lib/api/coachMe";
import { fetchMyProfile } from "@/lib/api/profile";
import { isNormalizedApiError } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

const INVITATIONS_HREF = "/coach/invitations";

const PRIMARY_ACTION_CLASS =
  "flex w-full items-center justify-between gap-4 rounded-full border border-border bg-surface px-5 py-4 shadow-sm transition hover:bg-surfaceElevated";

function formatCoachApiError(e: unknown, fallback: string): string {
  if (isNormalizedApiError(e)) {
    if (e.status === 403) {
      const server = e.message.trim();
      if (server !== "") {
        return `Access denied. ${server}`;
      }
      return "Access denied. You don't have permission to perform this action.";
    }
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

function formatMetric(
  loading: boolean,
  error: string | null,
  value: string | number | boolean | null | undefined,
): string {
  if (loading) return "…";
  if (error) return "—";
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function formatDashboardStringField(
  loading: boolean,
  error: string | null,
  raw: string | null | undefined,
  format: (s: string) => string,
): string {
  if (loading) return "…";
  if (error) return "—";
  if (raw === null || raw === undefined) return "—";
  return format(raw);
}

function buildCoachSelfDisplayName(input: {
  firstName: string;
  lastName: string;
  email: string;
}): string | null {
  const name = [input.firstName, input.lastName]
    .map((s) => s.trim())
    .filter((s) => s !== "")
    .join(" ");
  if (name.trim() !== "") return name.trim();
  const email = input.email.trim();
  if (email !== "") return email;
  return null;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="text-xs font-medium text-textMuted sm:w-40 sm:shrink-0">
        {label}
      </dt>
      <dd className="min-w-0 text-sm text-textPrimary">{value}</dd>
    </div>
  );
}

export function CoachDashboardView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<CoachMeDashboardData | null>(
    null,
  );
  const [athletes, setAthletes] = useState<CoachAssignedAthleteRow[]>([]);
  const [coachSelfDisplayName, setCoachSelfDisplayName] = useState<
    string | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const profilePromise = fetchMyProfile().catch(() => null);
        const [dash, rows, profile] = await Promise.all([
          fetchCoachMeDashboard(),
          fetchCoachAssignedAthletes(),
          profilePromise,
        ]);
        if (cancelled) return;
        setDashboard(dash);
        setAthletes(rows);
        setCoachSelfDisplayName(
          profile ? buildCoachSelfDisplayName(profile) : null,
        );
      } catch (e) {
        if (cancelled) return;
        setDashboard(null);
        setAthletes([]);
        setCoachSelfDisplayName(null);
        setError(
          formatCoachApiError(
            e,
            "Could not load coach dashboard. Try again shortly.",
          ),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const dash = dashboard;

  return (
    <div className="w-full max-w-5xl space-y-10">
      <header className="flex w-full min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">
            Coach Dashboard
          </h1>
          <p className="text-sm text-textSecondary">
            Your academy context, release settings, and assigned athletes.
          </p>
          {coachSelfDisplayName ? (
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-sm font-medium text-textSecondary">
                Coach
              </span>
              <span
                className="text-sm font-medium text-textPrimary"
                aria-live="polite"
              >
                {coachSelfDisplayName}
              </span>
            </div>
          ) : null}
        </div>
      </header>

      {error ? (
        <Alert variant="danger">{error}</Alert>
      ) : null}

      <section className="space-y-3">
        <Link href={INVITATIONS_HREF} className={cn(PRIMARY_ACTION_CLASS)}>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-lg font-semibold text-textPrimary">
              Invitations
            </p>
            <p className="text-sm text-textSecondary">
              Accept or decline academy invitations in a dedicated workspace.
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-primary sm:text-base">
            Open invitations →
          </span>
        </Link>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-textSecondary">
              Academy
            </h2>
            <p className="mt-1 text-xs text-textMuted">
              Training entity linked to your coach membership.
            </p>
          </div>
          <DashboardCardShell title="Training entity" className="space-y-3">
            <dl className="space-y-2">
              <DetailRow
                label="Name"
                value={formatMetric(
                  loading,
                  error,
                  dash?.trainingEntityName ?? null,
                )}
              />
            </dl>
          </DashboardCardShell>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-textSecondary">
              Coach
            </h2>
            <p className="mt-1 text-xs text-textMuted">
              Your role and functions within the academy.
            </p>
          </div>
          <DashboardCardShell title="Profile" className="space-y-3">
            <dl className="space-y-2">
              <DetailRow
                label="Academy coach role"
                value={formatDashboardStringField(
                  loading,
                  error,
                  dash?.academyCoachRole ?? null,
                  formatAcademyCoachRoleForUi,
                )}
              />
              <DetailRow
                label="Functions"
                value={formatMetric(
                  loading,
                  error,
                  dash?.functionsDisplay ?? null,
                )}
              />
            </dl>
          </DashboardCardShell>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-textSecondary">
              Release mode
            </h2>
            <p className="mt-1 text-xs text-textMuted">
              How training plans are released for this academy.
            </p>
          </div>
          <DashboardCardShell title="Configuration" className="space-y-3">
            <dl className="space-y-2">
              <DetailRow
                label="Head coach configured"
                value={formatMetric(
                  loading,
                  error,
                  dash?.hasHeadCoachConfigured ?? null,
                )}
              />
              <DetailRow
                label="Training plan release mode"
                value={formatDashboardStringField(
                  loading,
                  error,
                  dash?.trainingPlanReleaseMode ?? null,
                  formatTrainingPlanReleaseModeForUi,
                )}
              />
            </dl>
          </DashboardCardShell>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-textSecondary">
              Summary
            </h2>
            <p className="mt-1 text-xs text-textMuted">
              Roster count from the coach dashboard context.
            </p>
          </div>
          <DashboardCardShell title="Assigned athletes" className="space-y-2">
            <p className="text-2xl font-semibold tabular-nums text-textPrimary">
              {formatMetric(
                loading,
                error,
                dash?.assignedAthleteCount ?? null,
              )}
            </p>
          </DashboardCardShell>
        </section>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-textSecondary">
            Assigned athletes
          </h2>
          <p className="mt-1 text-xs text-textMuted">
            Athletes currently assigned to you.
          </p>
        </div>
        <DashboardCardShell className="flex min-h-0 flex-col overflow-hidden p-0">
          {loading ? (
            <p className="p-4 text-sm text-textSecondary md:p-5">
              Loading assigned athletes…
            </p>
          ) : error ? (
            <p className="p-4 text-sm text-textSecondary md:p-5">
              Could not load assigned athletes.
            </p>
          ) : athletes.length === 0 ? (
            <p className="p-4 text-sm text-textSecondary md:p-5">
              No assigned athletes yet.
            </p>
          ) : (
            <Table className="w-full min-w-[760px] table-auto border-0 shadow-none">
              <TableHead>
                <TableRow variant="head">
                  <Th>Display name</Th>
                  <Th>Email</Th>
                  <Th>Athlete status</Th>
                  <Th>Membership</Th>
                  <Th>Planning profile</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {athletes.map((row, index) => (
                  <TableRow key={`${row.email}-${index}`}>
                    <Td>{row.displayName}</Td>
                    <Td className="max-w-[12rem] truncate" title={row.email}>
                      {row.email}
                    </Td>
                    <Td>{row.lifecycle}</Td>
                    <Td>{row.membershipStatus}</Td>
                    <Td>
                      {row.hasPlanningProfile && row.athleteId.trim() !== "" ? (
                        <Link
                          href={`/coach/athletes/${encodeURIComponent(row.athleteId)}/planning-profile`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          View
                        </Link>
                      ) : (
                        <span className="text-sm text-textMuted">Not Available</span>
                      )}
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DashboardCardShell>
      </section>
    </div>
  );
}
