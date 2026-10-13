"use client";

import { AthleteCompetitionsPageContent } from "@/components/dashboard/athlete/AthleteCompetitionsPageContent";
import { AthleteSidebar } from "@/components/dashboard/athlete/AthleteSidebar";
import { useAthleteInvitationGate } from "@/components/dashboard/athlete/useAthleteInvitationGate";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAthletePlanningIdentifiers } from "@/hooks/useAthletePlanningIdentifiers";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AthleteCompetitionsPage() {
  const router = useRouter();
  const { accessContext, accessGateReady } = useAthleteInvitationGate();
  const planningIds = useAthletePlanningIdentifiers({
    accessContext,
    accessGateReady,
  });
  const sportCode = planningIds.phase === "ready" ? planningIds.ids.sport : null;
  const isBasketballAthlete = sportCode === "BASKETBALL";

  useEffect(() => {
    if (!isBasketballAthlete) return;
    router.replace("/athlete/dashboard");
  }, [isBasketballAthlete, router]);

  if (
    isBasketballAthlete ||
    planningIds.phase === "loading" ||
    (planningIds.phase === "ready" && sportCode === null)
  ) {
    return <DashboardLayout sidebar={<AthleteSidebar />} />;
  }

  return (
    <DashboardLayout sidebar={<AthleteSidebar />}>
      <AthleteCompetitionsPageContent />
    </DashboardLayout>
  );
}
