"use client";

import { AthleteDashboardHeader } from "@/components/dashboard/athlete/AthleteDashboardHeader";
import { ATHLETE_DASHBOARD_CARD_TITLE_CLASS } from "@/components/dashboard/athlete/athleteDashboardTypography";
import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import {
  AthleteWeeklyAdherenceProvider,
  useAthleteWeeklyAdherence,
} from "@/components/dashboard/athlete/AthleteWeeklyAdherenceContext";
import { AthleteWeeklyAdherenceSection } from "@/components/dashboard/athlete/AthleteWeeklyAdherenceSection";
import { AthletePendingInvitationCard } from "@/components/dashboard/athlete/AthletePendingInvitationCard";
import { AthleteTodayPlanCard } from "@/components/dashboard/athlete/AthleteTodayPlanCard";
import { SportMetricsSection } from "@/components/dashboard/SportMetricsSection";
import { WearableSummarySection } from "@/components/dashboard/WearableSummarySection";
import { AthleteSidebar } from "@/components/dashboard/athlete/AthleteSidebar";
import { useAthleteInvitationGate } from "@/components/dashboard/athlete/useAthleteInvitationGate";
import { useAthletePlanningIdentifiers } from "@/hooks/useAthletePlanningIdentifiers";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { routeFromAccessContext } from "@/lib/accessContext";
import { useRouter } from "next/navigation";

function isPendingStatus(status: string): boolean {
  return status.trim().toUpperCase() === "PENDING";
}

function AthleteWearableSummaryWithPlanWindow({
  entityId,
  athleteId,
}: {
  entityId: string;
  athleteId: string;
}) {
  const { weekStart, weekEnd, phase } = useAthleteWeeklyAdherence();
  const planWindowPending =
    phase === "loading" || phase === "awaiting_identifiers";

  return (
    <WearableSummarySection
      entityId={entityId}
      athleteId={athleteId}
      planStartDate={weekStart !== "" ? weekStart : undefined}
      planEndDate={weekEnd !== "" ? weekEnd : undefined}
      planWindowPending={planWindowPending}
      hideWhenEmpty
      titleClassName={ATHLETE_DASHBOARD_CARD_TITLE_CLASS}
      cardClassName={DASHBOARD_MAJOR_OUTER_CARD_CLASS}
    />
  );
}

function AthleteSportMetricsWithPlanVersion({
  entityId,
  athleteId,
}: {
  entityId: string;
  athleteId: string;
}) {
  const { trainingPlanVersionId } = useAthleteWeeklyAdherence();

  return (
    <SportMetricsSection
      entityId={entityId}
      athleteId={athleteId}
      trainingPlanVersionId={trainingPlanVersionId}
      titleClassName={ATHLETE_DASHBOARD_CARD_TITLE_CLASS}
      cardClassName={DASHBOARD_MAJOR_OUTER_CARD_CLASS}
    />
  );
}

export function AthleteDashboardShell() {
  const router = useRouter();
  const {
    invitations,
    isGateReady,
    hasActiveAcademyMembership,
    acceptInvitation,
    declineInvitation,
    accessContext,
    accessGateReady,
  } = useAthleteInvitationGate();
  const planningIds = useAthletePlanningIdentifiers({ accessContext, accessGateReady });
  const pendingInvitation =
    invitations.find((inv) => isPendingStatus(inv.status)) ?? null;
  const entityId = planningIds.ids?.entityId ?? "";
  const athleteId = planningIds.ids?.athleteId ?? "";

  return (
    <DashboardLayout sidebar={<AthleteSidebar />}>
      <AthleteWeeklyAdherenceProvider>
        <div className="space-y-4">
          <AthleteDashboardHeader />
          {isGateReady &&
          hasActiveAcademyMembership &&
          pendingInvitation ? (
            <AthletePendingInvitationCard
              invitation={pendingInvitation}
              onAccept={async () => {
                const session = await acceptInvitation(pendingInvitation.id);
                const nextRoute = routeFromAccessContext(session?.accessContext);
                if (nextRoute && nextRoute !== "/athlete/dashboard") {
                  router.replace(nextRoute);
                }
              }}
              onDecline={async () => {
                await declineInvitation(pendingInvitation.id);
              }}
            />
          ) : null}
          <AthleteWeeklyAdherenceSection />
          <AthleteTodayPlanCard />

          <AthleteSportMetricsWithPlanVersion
            entityId={entityId}
            athleteId={athleteId}
          />

          <AthleteWearableSummaryWithPlanWindow
            entityId={entityId}
            athleteId={athleteId}
          />
        </div>
      </AthleteWeeklyAdherenceProvider>
    </DashboardLayout>
  );
}
