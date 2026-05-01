import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest } from "@/lib/apiClient";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export type AthleteMeProfile = {
  sport: string;
  level: string;
  /** AthleteProfile UUID when API exposes it (used for entity assignment joins). */
  athleteProfileId: string;
};

/**
 * Athlete self profile truth source for onboarding-selected sport/level.
 * Contract source: GET /athletes/me.
 */
export async function fetchAthleteMeProfile(): Promise<AthleteMeProfile> {
  const raw = await apiRequest(paths.athletes.me, { method: "GET" });
  const data = adaptBackendSuccess(raw);
  const root = asRecord(data);
  const nestedData = asRecord(root?.data);
  const profile =
    asRecord(root?.athleteProfile) ??
    asRecord(nestedData?.athleteProfile) ??
    asRecord(root?.profile) ??
    asRecord(nestedData?.profile);

  const sources = [root, nestedData, profile];
  let sport = "";
  let level = "";
  let athleteProfileId = "";
  for (const source of sources) {
    if (!source) continue;
    if (sport === "") sport = readString(source.sport);
    if (level === "") level = readString(source.level);
    if (athleteProfileId === "") {
      const ap = asRecord(source.athleteProfile) ?? asRecord(source.profile);
      athleteProfileId =
        readString(source.athleteProfileId) ||
        readString(source.athleteId) ||
        (ap ? readString(ap.id) || readString(ap.athleteProfileId) : "");
    }
  }

  return { sport, level, athleteProfileId };
}
