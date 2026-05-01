"use client";

import { AssignedAthletesTable } from "@/components/dashboard/coach/AssignedAthletesTable";
import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import {
  fetchCoachAssignedAthletes,
  fetchCoachMeDashboard,
  type CoachAssignedAthleteRow,
} from "@/lib/api/coachMe";
import { isNormalizedApiError } from "@/lib/apiClient";
import { canCoachValidateLevel } from "@/lib/coachAuthority";
import { useEffect, useState } from "react";

function formatCoachApiError(e: unknown, fallback: string): string {
  if (isNormalizedApiError(e)) {
    if (e.status === 403) {
      const server = e.message.trim();
      if (server !== "") return `Access denied. ${server}`;
      return "Access denied. You don't have permission to perform this action.";
    }
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

export function CoachAssignedAthletesPageContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<CoachAssignedAthleteRow[]>([]);
  const [canValidateLevelActions, setCanValidateLevelActions] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [dash, rows] = await Promise.all([
          fetchCoachMeDashboard(),
          fetchCoachAssignedAthletes(),
        ]);
        if (cancelled) return;
        setAthletes(rows);
        setCanValidateLevelActions(
          canCoachValidateLevel({
            hasHeadCoachConfigured: dash.hasHeadCoachConfigured,
            academyCoachRole: dash.academyCoachRole,
            functions: dash.functions,
          }),
        );
      } catch (e) {
        if (cancelled) return;
        setAthletes([]);
        setCanValidateLevelActions(false);
        setError(
          formatCoachApiError(e, "Could not load assigned athletes. Try again shortly."),
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

  return (
    <div className="w-full max-w-5xl space-y-6">
      <PageHeader
        title="Assigned Athletes"
        subtitle="Athletes currently assigned to you."
      />

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <DashboardCardShell className="flex min-h-0 flex-col overflow-hidden p-0">
        <AssignedAthletesTable
          loading={loading}
          error={error}
          athletes={athletes}
          canValidateLevel={canValidateLevelActions}
        />
      </DashboardCardShell>
    </div>
  );
}
