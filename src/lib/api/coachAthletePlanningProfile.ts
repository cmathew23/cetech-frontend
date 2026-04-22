import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest, type NormalizedApiError } from "@/lib/apiClient";
import {
  flattenPlanningProfileRecord,
  parsePlanningProfileRecord,
  type PlanningProfileRecord,
} from "@/lib/api/planning-profile";

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export type CoachAthletePlanningProfileView = {
  dateOfBirth: string | null;
  sex: string | null;
  primarySport: string | null;
  disciplineOrEvent: string | null;
  selfReportedLevel: string | null;
  validatedLevel: string | null;
  trainingAgeYears: number | null;
  currentWeeklyTrainingExposureHours: number | null;
  weeklyAvailabilityDays: number | null;
  weeklyAvailabilityHours: number | null;
  dietType: string | null;
  regionalCuisinePreference: string | null;
  allergiesOrIntolerances: string | null;
  heightCm: number | null;
  weightKg: number | null;
  hasWearable: boolean | null;
  wearableProvider: string | null;
  deviceModel: string | null;
  lastSyncAt: string | null;
  avgRestingHeartRate: number | null;
  avgSleepDurationHours: number | null;
  avgDailyActivityVolume: number | null;
  recentActivityDaysCount: number | null;
  wearableDataQuality: string | null;
  derivedAge: number | null;
  derivedBmi: number | null;
  completenessStatus: string | null;
  freshnessStatus: string | null;
  planningEligibilityStatus: string | null;
  stage: string | null;
  revision: number | null;
  lastConfirmedAt: string | null;
  updatedAt: string | null;
};

function parseCoachAthletePlanningProfile(
  data: unknown,
): CoachAthletePlanningProfileView {
  const grouped = parsePlanningProfileRecord(data) as PlanningProfileRecord;
  const flat = flattenPlanningProfileRecord(grouped);

  return {
    dateOfBirth: readString(flat.dateOfBirth),
    sex: readString(flat.sex),
    primarySport: readString(flat.primarySport),
    disciplineOrEvent: readString(flat.disciplineOrEvent),
    selfReportedLevel: readString(flat.selfReportedLevel),
    validatedLevel: readString(grouped.validatedLevel),
    trainingAgeYears: readNumber(flat.trainingAgeYears),
    currentWeeklyTrainingExposureHours: readNumber(
      flat.currentWeeklyTrainingExposureHours,
    ),
    weeklyAvailabilityDays: readNumber(flat.weeklyAvailabilityDays),
    weeklyAvailabilityHours: readNumber(flat.weeklyAvailabilityHours),
    dietType: readString(flat.dietType),
    regionalCuisinePreference:
      readString(flat.regionalCuisinePreference)
      ?? (Array.isArray(flat.regionalCuisinePreference)
        ? flat.regionalCuisinePreference
            .filter((item): item is string => typeof item === "string")
            .join(", ")
        : null),
    allergiesOrIntolerances:
      readString(flat.allergiesOrIntolerances)
      ?? (flat.allergiesIntolerances
          && typeof flat.allergiesIntolerances === "object"
          && !Array.isArray(flat.allergiesIntolerances)
        ? [
            ...(Array.isArray(flat.allergiesIntolerances.selected)
              ? flat.allergiesIntolerances.selected.filter(
                  (item): item is string => typeof item === "string",
                )
              : []),
            ...(typeof flat.allergiesIntolerances.othersText === "string"
              && flat.allergiesIntolerances.othersText.trim() !== ""
              ? [flat.allergiesIntolerances.othersText.trim()]
              : []),
          ].join(", ") || null
        : null),
    heightCm: readNumber(flat.heightCm),
    weightKg: readNumber(flat.weightKg),
    hasWearable: readBoolean(flat.hasWearable),
    wearableProvider: readString(flat.wearableProvider),
    deviceModel: readString(flat.deviceModel),
    lastSyncAt: readString(flat.lastSyncAt),
    avgRestingHeartRate: readNumber(flat.avgRestingHeartRate),
    avgSleepDurationHours: readNumber(flat.avgSleepDurationHours),
    avgDailyActivityVolume: readNumber(flat.avgDailyActivityVolume),
    recentActivityDaysCount: readNumber(flat.recentActivityDaysCount),
    wearableDataQuality: readString(flat.wearableDataQuality),
    derivedAge: readNumber(flat.derivedAge),
    derivedBmi: readNumber(flat.derivedBmi),
    completenessStatus:
      readString(grouped.planningInputCompleteness) ?? readString(flat.completenessStatus),
    freshnessStatus: readString(flat.freshnessStatus),
    planningEligibilityStatus: readString(grouped.planningEligibilityStatus),
    stage: readString(flat.stage),
    revision: readNumber(flat.revision),
    lastConfirmedAt: readString(flat.lastConfirmedAt) ?? readString(flat.confirmedAt),
    updatedAt: readString(flat.updatedAt),
  };
}

export async function fetchCoachAthletePlanningProfile(
  entityId: string,
  athleteId: string,
): Promise<CoachAthletePlanningProfileView> {
  const e = entityId.trim();
  const a = athleteId.trim();
  if (e === "" || a === "") {
    throw {
      message: "entity id and athlete id are required",
      status: 400,
      code: "ENTITY_OR_ATHLETE_ID_REQUIRED",
    } satisfies NormalizedApiError;
  }

  const raw = await apiRequest(paths.entities.athletePlanningProfileByAthlete(e, a), {
    method: "GET",
    cache: "no-store",
  });
  const data = adaptBackendSuccess(raw);
  return parseCoachAthletePlanningProfile(data);
}
