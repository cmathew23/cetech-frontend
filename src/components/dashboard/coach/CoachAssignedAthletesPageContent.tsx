"use client";

import { AssignedAthletesTable } from "@/components/dashboard/coach/AssignedAthletesTable";
import { DASHBOARD_PAGE_CONTENT_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { fetchCoachAssignedAthletes, type CoachAssignedAthleteRow } from "@/lib/api/coachMe";
import { isNormalizedApiError } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchCoachAssignedAthletes();
        if (cancelled) return;
        setAthletes(rows);
      } catch (e) {
        if (cancelled) return;
        setAthletes([]);
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
    <div className={cn(DASHBOARD_PAGE_CONTENT_CLASS, "space-y-6")}>
      <PageHeader
        title="Assigned Athletes"
        subtitle="Roster of athletes assigned to you: status and academy membership."
      />

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div className="flex min-h-0 flex-col overflow-hidden">
        <AssignedAthletesTable loading={loading} error={error} athletes={athletes} />
      </div>
    </div>
  );
}
