"use client";

import type { AccessContextPayload } from "@/lib/accessContext";
import { fetchAthleteMeProfile, type AthleteMeProfile } from "@/lib/api/athleteMe";
import {
  isAthleteAppContext,
  resolveCurrentAthletePlanningIdentifiers,
  shouldLoadAthletesMeForPlanningIdentifiers,
  type AthletePlanningIdentifiers,
} from "@/lib/athletePlanningIdentity";
import { useEffect, useMemo, useState } from "react";

export type AthletePlanningAuthContext = {
  accessContext: AccessContextPayload | null;
  accessGateReady: boolean;
};

type AthletePlanningIdentifierState =
  | { phase: "loading"; ids: null }
  | { phase: "ready"; ids: AthletePlanningIdentifiers }
  | { phase: "not_ready"; ids: null };

/**
 * Resolves athlete planning identifiers (entityId, athleteId, sport) from the
 * shared auth context provided by AthleteInvitationProvider.
 *
 * `sport` comes from GET /athletes/me. Callers MUST pass the auth context from
 * the invitation gate to avoid redundant useAuth() bootstraps.
 */
export function useAthletePlanningIdentifiers(
  authCtx: AthletePlanningAuthContext,
): AthletePlanningIdentifierState {
  const { accessContext, accessGateReady } = authCtx;
  const [athleteProfile, setAthleteProfile] = useState<AthleteMeProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileLoadAttempted, setProfileLoadAttempted] = useState(false);

  const resolution = useMemo(
    () => resolveCurrentAthletePlanningIdentifiers(accessContext, athleteProfile),
    [accessContext, athleteProfile],
  );
  const needsAthleteProfileId = shouldLoadAthletesMeForPlanningIdentifiers(accessContext);

  useEffect(() => {
    if (!accessGateReady) return;
    if (!isAthleteAppContext(accessContext)) {
      setAthleteProfile(null);
      setProfileLoadAttempted(false);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    if (needsAthleteProfileId) {
      setProfileLoading(true);
      setProfileLoadAttempted(false);
    }
    void (async () => {
      try {
        const profile = await fetchAthleteMeProfile();
        if (!cancelled) setAthleteProfile(profile);
      } catch {
        if (!cancelled && needsAthleteProfileId) setAthleteProfile(null);
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
  }, [accessContext, accessGateReady, needsAthleteProfileId]);

  if (
    !accessGateReady ||
    profileLoading ||
    (needsAthleteProfileId && athleteProfile === null && !profileLoadAttempted)
  ) {
    return { phase: "loading", ids: null };
  }
  if (resolution.status === "ready") {
    return {
      phase: "ready",
      ids: {
        ...resolution.ids,
        sport: profileLoadAttempted ? (resolution.ids.sport ?? "") : null,
      },
    };
  }
  return { phase: "not_ready", ids: null };
}
