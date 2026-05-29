"use client";

import { AthleteCoachCommunicationCard } from "@/components/dashboard/athlete/AthleteCoachCommunicationCard";
import { AthleteDashboardHeader } from "@/components/dashboard/athlete/AthleteDashboardHeader";
import { AthleteInsightsCard } from "@/components/dashboard/athlete/AthleteInsightsCard";
import { AthleteKpiRow } from "@/components/dashboard/athlete/AthleteKpiRow";
import {
  AthleteWeeklyAdherenceProvider,
  useAthleteWeeklyAdherence,
} from "@/components/dashboard/athlete/AthleteWeeklyAdherenceContext";
import { AthleteWeeklyAdherenceSection } from "@/components/dashboard/athlete/AthleteWeeklyAdherenceSection";
import { AthleteNutritionCard } from "@/components/dashboard/athlete/AthleteNutritionCard";
import { AthletePendingInvitationCard } from "@/components/dashboard/athlete/AthletePendingInvitationCard";
import { AthleteRecoveryStatusCard } from "@/components/dashboard/athlete/AthleteRecoveryStatusCard";
import { AthleteTodayPlanCard } from "@/components/dashboard/athlete/AthleteTodayPlanCard";
import { AthleteUpcomingScheduleCard } from "@/components/dashboard/athlete/AthleteUpcomingScheduleCard";
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
          <AthleteKpiRow />
          <AthleteWeeklyAdherenceSection />

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <AthleteTodayPlanCard />
            </div>
            <div className="xl:col-span-4">
              <AthleteInsightsCard />
            </div>
          </section>

          <AthleteWearableSummaryWithPlanWindow
            entityId={entityId}
            athleteId={athleteId}
          />

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AthleteNutritionCard />
            <AthleteCoachCommunicationCard />
            <AthleteRecoveryStatusCard />
            <AthleteUpcomingScheduleCard />
          </section>
        </div>
      </AthleteWeeklyAdherenceProvider>
    </DashboardLayout>
  );
}

