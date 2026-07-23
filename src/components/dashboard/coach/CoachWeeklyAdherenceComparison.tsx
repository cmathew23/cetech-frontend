"use client";

import {
  WeeklyAdherenceProvider,
} from "@/components/dashboard/athlete/AthleteWeeklyAdherenceContext";
import { AthleteWeeklyAdherenceSection } from "@/components/dashboard/athlete/AthleteWeeklyAdherenceSection";

export function CoachWeeklyAdherenceComparison({
  entityId,
  athleteId,
}: {
  entityId: string;
  athleteId: string;
}) {
  return (
    <WeeklyAdherenceProvider
      entityId={entityId}
      athleteId={athleteId}
      isGateReady
      hasActiveAcademyMembership
      identifiersPhase={
        entityId !== "" && athleteId !== "" ? "ready" : "not_ready"
      }
      loadCurrentSummary={false}
    >
      <AthleteWeeklyAdherenceSection comparisonOnly />
    </WeeklyAdherenceProvider>
  );
}
