"use client";

import { useAthleteInvitationGate } from "@/components/dashboard/athlete/useAthleteInvitationGate";
import { fetchAthleteMeProfile } from "@/lib/api/athleteMe";
import { useEffect, useState } from "react";

/**
 * Athlete sport code from GET /athletes/me (`AthleteMeProfile.sport`).
 * That field is the onboarding sport enum (for example "GOLF").
 */
export function useAthleteSportCode(): {
  sportCode: string | null;
  ready: boolean;
} {
  const { accessGateReady } = useAthleteInvitationGate();
  const [sportCode, setSportCode] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!accessGateReady) return;
    let cancelled = false;
    void fetchAthleteMeProfile()
      .then((profile) => {
        if (!cancelled) setSportCode(profile.sport);
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
  }, [accessGateReady]);

  return { sportCode, ready };
}
