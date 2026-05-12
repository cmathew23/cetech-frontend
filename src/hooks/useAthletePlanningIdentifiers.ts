"use client";

import { useAuth } from "@/hooks/useAuth";
import { fetchAthleteMeProfile, type AthleteMeProfile } from "@/lib/api/athleteMe";
import {
  resolveCurrentAthletePlanningIdentifiers,
  shouldLoadAthletesMeForPlanningIdentifiers,
  type AthletePlanningIdentifiers,
} from "@/lib/athletePlanningIdentity";
import { useEffect, useMemo, useState } from "react";

type AthletePlanningIdentifierState =
  | { phase: "loading"; ids: null }
  | { phase: "ready"; ids: AthletePlanningIdentifiers }
  | { phase: "not_ready"; ids: null };

export function useAthletePlanningIdentifiers(): AthletePlanningIdentifierState {
  const { accessContext, accessGateReady } = useAuth();
  const [athleteProfile, setAthleteProfile] = useState<AthleteMeProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileLoadAttempted, setProfileLoadAttempted] = useState(false);

  const resolution = useMemo(
    () => resolveCurrentAthletePlanningIdentifiers(accessContext, athleteProfile),
    [accessContext, athleteProfile],
  );

  useEffect(() => {
    if (!accessGateReady) return;
    if (!shouldLoadAthletesMeForPlanningIdentifiers(accessContext)) {
      setAthleteProfile(null);
      setProfileLoadAttempted(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);
    setProfileLoadAttempted(false);
    void (async () => {
      try {
        const profile = await fetchAthleteMeProfile();
        if (!cancelled) setAthleteProfile(profile);
      } catch {
        if (!cancelled) setAthleteProfile(null);
      } finally {
        if (!cancelled) {
          setProfileLoadAttempted(true);
          setProfileLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessContext, accessGateReady]);

  if (
    !accessGateReady ||
    profileLoading ||
    (shouldLoadAthletesMeForPlanningIdentifiers(accessContext) &&
      athleteProfile === null &&
      !profileLoadAttempted)
  ) {
    return { phase: "loading", ids: null };
  }
  if (resolution.status === "ready") return { phase: "ready", ids: resolution.ids };
  return { phase: "not_ready", ids: null };
}
