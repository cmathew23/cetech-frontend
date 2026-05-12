import type { AccessContextPayload } from "@/lib/accessContext";
import type { AthleteMeProfile } from "@/lib/api/athleteMe";

export type AthletePlanningIdentifiers = {
  entityId: string;
  athleteProfileId: string;
  athleteId: string;
};

export type AthletePlanningIdentifierResolution =
  | {
      status: "ready";
      ids: AthletePlanningIdentifiers;
    }
  | {
      status: "not_ready";
      reason: "missing_context" | "not_athlete_context" | "missing_entity" | "missing_athlete_profile";
    };

function clean(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function isAthleteAppContext(accessContext: AccessContextPayload | null | undefined): boolean {
  if (!accessContext) return false;
  const dashboardType = accessContext.access.dashboardType.trim().toUpperCase();
  const activeRole = accessContext.activeRole?.trim().toUpperCase() ?? "";
  return dashboardType === "ATHLETE" || activeRole === "ATHLETE";
}

export function shouldLoadAthletesMeForPlanningIdentifiers(
  accessContext: AccessContextPayload | null | undefined,
): boolean {
  if (!isAthleteAppContext(accessContext)) return false;
  return clean(accessContext?.athleteProfile?.athleteProfileId) === "";
}

export function resolveCurrentAthletePlanningIdentifiers(
  accessContext: AccessContextPayload | null | undefined,
  athleteProfile: Pick<AthleteMeProfile, "athleteProfileId"> | null | undefined,
): AthletePlanningIdentifierResolution {
  if (!accessContext) {
    return { status: "not_ready", reason: "missing_context" };
  }
  if (!isAthleteAppContext(accessContext)) {
    return { status: "not_ready", reason: "not_athlete_context" };
  }

  const entityId =
    clean(accessContext.athleteProfile?.trainingEntityId) ||
    clean(accessContext.academy.trainingEntityId);
  if (entityId === "") {
    return { status: "not_ready", reason: "missing_entity" };
  }

  const athleteProfileId =
    clean(accessContext.athleteProfile?.athleteProfileId) ||
    clean(athleteProfile?.athleteProfileId);
  if (athleteProfileId === "") {
    return { status: "not_ready", reason: "missing_athlete_profile" };
  }

  return {
    status: "ready",
    ids: {
      entityId,
      athleteProfileId,
      athleteId: athleteProfileId,
    },
  };
}
