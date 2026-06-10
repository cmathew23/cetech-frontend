"use client";

import { CoachDashboardHeader } from "@/components/dashboard/coach/CoachDashboardHeader";
import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { Alert } from "@/components/ui/Alert";
import {
  fetchCoachMeDashboard,
  type CoachMeDashboardData,
} from "@/lib/api/coachMe";
import { isNormalizedApiError } from "@/lib/apiClient";
import {
  formatEnumeratedLabel,
  formatFunctionTokensForDisplay,
  formatHumanReadableOrCopy,
} from "@/lib/textFormat";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

const INVITATIONS_HREF = "/coach/dashboard/invitations";
const ATHLETES_HREF = "/coach/athletes";
const ATHLETE_PERFORMANCE_HREF = "/coach/athlete-performance";

/** Matches Admin Dashboard primary invitation CTA styling. */
const PRIMARY_ACTION_CLASS =
  "flex w-full flex-col gap-4 rounded-xl border-2 border-primary bg-primary/10 p-6 shadow-md transition-colors hover:border-primary hover:bg-primary/[0.14] focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6";

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

function formatDashboardFunctionField(
  loading: boolean,
  error: string | null,
  raw: string[] | null | undefined,
): string {
  if (loading) return "…";
  if (error) return "—";
  const cleaned = (raw ?? [])
    .map((value) => value.trim())
    .filter((value) => value !== "");
  if (cleaned.length === 0) return "—";
  return formatFunctionTokensForDisplay(cleaned);
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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const dash = await fetchCoachMeDashboard();
        if (cancelled) return;
        setDashboard(dash);
      } catch (e) {
        if (cancelled) return;
        setDashboard(null);
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
    <div className="w-full min-w-0 max-w-full space-y-4">
      <div className="min-w-0">
        <CoachDashboardHeader />
      </div>

      {error ? (
        <Alert variant="danger">{error}</Alert>
      ) : null}

      <div className="space-y-10">
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-textSecondary">
              Summary
            </h2>
            <p className="mt-1 text-xs text-textMuted">
              Roster and release settings from your coach dashboard context.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-wide text-textSecondary">
                Assigned Athletes
              </p>
              <p className="text-2xl font-semibold tabular-nums text-textPrimary">
                {formatMetric(
                  loading,
                  error,
                  dash?.assignedAthleteCount ?? null,
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-wide text-textSecondary">
                Academy Coach Role
              </p>
              <p className="min-w-0 text-lg font-semibold leading-snug text-textPrimary sm:text-2xl">
                {formatDashboardStringField(
                  loading,
                  error,
                  dash?.academyCoachRole ?? null,
                  formatEnumeratedLabel,
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-wide text-textSecondary">
                Function Slots
              </p>
              <p className="text-2xl font-semibold tabular-nums text-textPrimary">
                {loading || error
                  ? formatMetric(loading, error, null)
                  : String(dash?.functions?.length ?? 0)}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-textSecondary">
              Action required
            </h2>
            <p className="mt-1 text-xs text-textMuted">
              Jump to invitations, athlete performance, or your assigned athletes workspace.
            </p>
          </div>
          <DashboardCardShell
            accent={false}
            title="Workspaces"
            className="space-y-3"
          >
            <div className="space-y-3">
              <Link href={INVITATIONS_HREF} className={cn(PRIMARY_ACTION_CLASS)}>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-lg font-semibold text-textPrimary">
                    Invitations
                  </p>
                  <p className="text-sm text-textSecondary">
                    Accept or decline academy invitations.
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary sm:text-base">
                  Open invitations →
                </span>
              </Link>
              <Link href={ATHLETE_PERFORMANCE_HREF} className={cn(PRIMARY_ACTION_CLASS)}>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-lg font-semibold text-textPrimary">
                    Athlete Performance
                  </p>
                  <p className="text-sm text-textSecondary">
                    View weekly adherence and performance for your assigned athletes.
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary sm:text-base">
                  View performance →
                </span>
              </Link>
              <Link href={ATHLETES_HREF} className={cn(PRIMARY_ACTION_CLASS)}>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-lg font-semibold text-textPrimary">
                    Assigned athletes
                  </p>
                  <p className="text-sm text-textSecondary">
                    View roster and coaching actions.
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary sm:text-base">
                  View athletes →
                </span>
              </Link>
            </div>
          </DashboardCardShell>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-textSecondary">
              Details
            </h2>
            <p className="mt-1 text-xs text-textMuted">
              Academy, profile, and configuration from your membership.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <DashboardCardShell
              accent={false}
              title="Training entity"
              className="space-y-3"
            >
              <dl className="space-y-2">
                <DetailRow
                  label="Name"
                  value={formatDashboardStringField(
                    loading,
                    error,
                    dash?.trainingEntityName ?? null,
                    (s) => formatHumanReadableOrCopy(s, "—"),
                  )}
                />
              </dl>
            </DashboardCardShell>

            <DashboardCardShell
              accent={false}
              title="Profile"
              className="space-y-3"
            >
              <dl className="space-y-2">
                <DetailRow
                  label="Academy coach role"
                  value={formatDashboardStringField(
                    loading,
                    error,
                    dash?.academyCoachRole ?? null,
                    formatEnumeratedLabel,
                  )}
                />
                <DetailRow
                  label="Functions"
                  value={formatDashboardFunctionField(
                    loading,
                    error,
                    dash?.functions ?? null,
                  )}
                />
              </dl>
            </DashboardCardShell>

            <DashboardCardShell
              accent={false}
              title="Configuration"
              className="space-y-3 md:col-span-2 lg:col-span-1"
            >
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
                    formatEnumeratedLabel,
                  )}
                />
              </dl>
            </DashboardCardShell>
          </div>
        </section>
      </div>
    </div>
  );
}
