"use client";

import { coachPeakFlowSportCode } from "@/config/dashboardNav";
import { useAuth } from "@/hooks/useAuth";
import { fetchSeasonCyclesForEntity } from "@/lib/api/coachAthleteGoalsSeasonSetup";
import { useEffect, useState } from "react";

/**
 * Entity sport from existing season cycles. Not the assigned-athlete roster.
 * An empty or failed read stays blank so a missing season is not treated as another sport.
 */
export function useCoachSportCode(): { sportCode: string | null; ready: boolean } {
  const { accessContext, accessGateReady } = useAuth();
  const entityId = accessContext?.academy.trainingEntityId?.trim() ?? "";
  const [sportCode, setSportCode] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!accessGateReady) return;
    if (entityId === "") {
      setSportCode("");
      setReady(true);
      return;
    }
    let cancelled = false;
    void fetchSeasonCyclesForEntity(entityId)
      .then((cycles) => {
        if (!cancelled) setSportCode(coachPeakFlowSportCode(cycles.map((cycle) => cycle.sport)));
      })
      .catch(() => {
        if (!cancelled) setSportCode("");
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [accessGateReady, entityId]);

  return { sportCode, ready };
}
