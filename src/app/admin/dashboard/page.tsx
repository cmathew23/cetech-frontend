"use client";

import { AdminDashboardHeader } from "@/components/dashboard/admin/AdminDashboardHeader";
import { AdminDashboardOverview } from "@/components/dashboard/admin/AdminDashboardOverview";
import { adminPaths } from "@/config/adminNav";
import { Alert } from "@/components/ui/Alert";
import {
  fetchAcademyAthleteRosterCount,
  fetchAcademyCoachRosterCount,
  fetchEntityInvitations,
  fetchMyAcademy,
} from "@/lib/api/academyAdmin";
import { isNormalizedApiError } from "@/lib/apiClient";
import type { PendingInvitationRow, SelectedAcademy } from "@/types/academyAdmin.types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const LOADING_ACADEMY_CONTEXT = "Loading academy context…";

function formatAdminApiError(e: unknown, fallback: string): string {
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

export default function AdminDashboardPage() {
  const router = useRouter();
  const [selectedAcademy, setSelectedAcademy] = useState<SelectedAcademy | null>(
    null,
  );
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const [academyContextLoading, setAcademyContextLoading] = useState(true);
  const [academyContextMissing, setAcademyContextMissing] = useState(false);
  const [academyContextError, setAcademyContextError] = useState<string | null>(
    null,
  );

  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [athleteCount, setAthleteCount] = useState<number | null>(null);
  const [coachCount, setCoachCount] = useState<number | null>(null);
  const [pendingInvitationCount, setPendingInvitationCount] = useState<
    number | null
  >(null);
  const [dashboardInvitationsAll, setDashboardInvitationsAll] = useState<
    PendingInvitationRow[]
  >([]);

  const showNoAcademyContext =
    !academyContextLoading && academyContextMissing && academyContextError === null;

  useEffect(() => {
    if (showNoAcademyContext) {
      router.replace("/onboarding");
    }
  }, [router, showNoAcademyContext]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateAcademyContext() {
      setAcademyContextLoading(true);
      setAcademyContextMissing(false);
      setAcademyContextError(null);
      try {
        const ctx = await fetchMyAcademy();
        if (cancelled) return;
        if (ctx) {
          setSelectedAcademy({
            academyId: ctx.academyId,
            name: ctx.name,
          });
          setSelectedEntityId(ctx.entityId);
          setAcademyContextMissing(false);
        } else {
          setAcademyContextMissing(true);
        }
      } catch (e) {
        if (!cancelled) {
          setAcademyContextMissing(false);
          setAcademyContextError(
            formatAdminApiError(e, "Could not load academy context."),
          );
        }
      } finally {
        if (!cancelled) {
          setAcademyContextLoading(false);
        }
      }
    }

    void hydrateAcademyContext();
    return () => {
      cancelled = true;
    };
  }, []);

  const reloadDashboardSnapshot = useCallback(async () => {
    const aid = selectedAcademy?.academyId?.trim() ?? "";
    const eid = selectedEntityId?.trim() ?? "";
    if (aid === "" || eid === "") {
      setAthleteCount(null);
      setCoachCount(null);
      setPendingInvitationCount(null);
      setDashboardInvitationsAll([]);
      return;
    }
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const [a, co, invAll] = await Promise.all([
        fetchAcademyAthleteRosterCount(aid),
        fetchAcademyCoachRosterCount(aid),
        fetchEntityInvitations(eid),
      ]);
      setAthleteCount(a);
      setCoachCount(co);
      setDashboardInvitationsAll(invAll);
      setPendingInvitationCount(
        invAll.filter((row) => row.status.trim().toUpperCase() === "PENDING")
          .length,
      );
    } catch (e) {
      setMetricsError(
        formatAdminApiError(e, "Could not load dashboard metrics."),
      );
      setAthleteCount(null);
      setCoachCount(null);
      setPendingInvitationCount(null);
      setDashboardInvitationsAll([]);
    } finally {
      setMetricsLoading(false);
    }
  }, [selectedAcademy?.academyId, selectedEntityId]);

  useEffect(() => {
    void reloadDashboardSnapshot();
  }, [reloadDashboardSnapshot]);

  if (
    academyContextLoading &&
    selectedAcademy === null &&
    !academyContextError
  ) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-textSecondary">
        {LOADING_ACADEMY_CONTEXT}
      </div>
    );
  }

  if (academyContextError) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <Alert variant="danger">{academyContextError}</Alert>
      </div>
    );
  }

  if (showNoAcademyContext) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-textSecondary">
        Taking you to onboarding…
      </div>
    );
  }

  if (!selectedAcademy || !selectedEntityId) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-textSecondary">
        {LOADING_ACADEMY_CONTEXT}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <div className="min-w-0">
        <AdminDashboardHeader academyName={selectedAcademy.name} />
      </div>

      <AdminDashboardOverview
        kpiLoading={metricsLoading}
        kpiError={metricsError}
        athleteCount={athleteCount}
        coachCount={coachCount}
        pendingInvitationCount={pendingInvitationCount}
        allInvitations={dashboardInvitationsAll}
        invitationsHref={adminPaths.invitations}
      />
    </div>
  );
}
