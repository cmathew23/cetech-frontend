import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest, type NormalizedApiError } from "@/lib/apiClient";
import type { AthleteLevelValue } from "@/lib/athlete-levels";

type DetailValue = string | number | boolean | Array<string | number | boolean> | null;
type DetailGroup = Record<string, DetailValue>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

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

function readAthleteLevel(value: unknown): AthleteLevelValue | null {
  return readString(value) as AthleteLevelValue | null;
}

function readJoinedList(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const items = value
    .filter((item): item is string | number | boolean => (
      typeof item === "string" || typeof item === "number" || typeof item === "boolean"
    ))
    .map((item) => String(item).trim())
    .filter((item) => item !== "");
  return items.length > 0 ? items.join(", ") : null;
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

function readAllergiesDisplay(value: unknown): string | null {
  const allergies = asRecord(value);
  if (allergies?.noFoodAllergies === true) {
    return "No food allergies";
  }
  return null;
}

function readDetailValue(value: unknown): DetailValue | undefined {
  const text = readString(value);
  if (text !== null) return text;
  const numberValue = readNumber(value);
  if (numberValue !== null) return numberValue;
  const booleanValue = readBoolean(value);
  if (booleanValue !== null) return booleanValue;
  if (!Array.isArray(value)) return undefined;

  const items = value
    .filter((item): item is string | number | boolean => (
      typeof item === "string" || typeof item === "number" || typeof item === "boolean"
    ))
    .map((item) => (typeof item === "string" ? item.trim() : item))
    .filter((item) => item !== "");
  return items;
}

function readDetailGroup(value: unknown): DetailGroup {
  const group = asRecord(value);
  if (!group) return {};

  const out: DetailGroup = {};
  for (const [key, item] of Object.entries(group)) {
    const detailValue = readDetailValue(item);
    if (detailValue !== undefined) {
      out[key] = detailValue;
    }
  }
  return out;
}

export type CoachAthletePlanningProfileView = {
  sportContext: {
    primarySport: string | null;
  };
  dateOfBirth: string | null;
  sex: string | null;
  primarySport: string | null;
  disciplineOrEvent: string | null;
  highestCompetitionLevelReachedPast12Months: string | null;
  highestRankingAchievedAtThatLevelPast12Months: number | null;
  selfReportedLevel: AthleteLevelValue | null;
  validatedLevel: AthleteLevelValue | null;
  trainingAgeYears: number | null;
  currentWeeklyTrainingExposureHours: number | null;
  weeklyAvailabilityDays: number | null;
  weeklyAvailabilityHours: number | null;
  dietType: string | null;
  regionalCuisinePreference: string | null;
  allergiesOrIntolerances: string | null;
  heightCm: number | null;
  weightKg: number | null;
  wearableStatus: string | null;
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
  missingRequiredFields: string[];
  bloodReportParameters: DetailGroup;
  bodyCompositionParameters: DetailGroup;
  bloodReportComparisons: DetailGroup;
  bodyCompositionComparisons: DetailGroup;
};

function parseCoachAthletePlanningProfile(
  data: unknown,
): CoachAthletePlanningProfileView {
  const root = asRecord(data);
  const nestedData = asRecord(root?.data);
  const profile = asRecord(root?.profile) ?? asRecord(nestedData?.profile);
  const status = asRecord(root?.status) ?? asRecord(nestedData?.status);
  const p = nestedData ?? root ?? {};
  const athleteContext = asRecord(p.athleteContext) ?? {};
  const sportContext = asRecord(p.sportContext) ?? {};
  const sportPerformance = asRecord(p.sportPerformance) ?? {};
  const trainingExposure = asRecord(p.trainingExposure) ?? {};
  const nutritionContext = asRecord(p.nutritionContext) ?? {};
  const wearables = asRecord(p.wearables) ?? {};
  const derivedPlanningInputs = asRecord(p.derivedPlanningInputs) ?? {};
  const selfReportedLevel =
    readAthleteLevel(p.selfReportedLevel)
    ?? readAthleteLevel(root?.selfReportedLevel)
    ?? readAthleteLevel(nestedData?.selfReportedLevel)
    ?? readAthleteLevel(profile?.selfReportedLevel)
    ?? readAthleteLevel(status?.selfReportedLevel);
  const validatedLevel =
    readAthleteLevel(p.validatedLevel)
    ?? readAthleteLevel(root?.validatedLevel)
    ?? readAthleteLevel(nestedData?.validatedLevel)
    ?? readAthleteLevel(profile?.validatedLevel)
    ?? readAthleteLevel(status?.validatedLevel);
  const missingRequiredFields = [
    ...readStringList(p.missingRequiredFields),
    ...readStringList(derivedPlanningInputs.missingRequiredFields),
    ...readStringList(root?.missingRequiredFields),
  ].filter((value, index, arr) => arr.indexOf(value) === index);

  return {
    sportContext: {
      primarySport: readString(sportContext.primarySport),
    },
    dateOfBirth: readString(athleteContext.dateOfBirth),
    sex: readString(athleteContext.sex),
    primarySport: readString(sportContext.primarySport),
    disciplineOrEvent: readString(sportContext.disciplineOrEvent),
    highestCompetitionLevelReachedPast12Months: readString(
      sportPerformance.highestCompetitionLevelReachedPast12Months,
    ),
    highestRankingAchievedAtThatLevelPast12Months: readNumber(
      sportPerformance.highestRankingAchievedAtThatLevelPast12Months,
    ),
    selfReportedLevel,
    validatedLevel,
    trainingAgeYears: readNumber(trainingExposure.yearsOfTraining),
    currentWeeklyTrainingExposureHours: readNumber(
      trainingExposure.weeklyTrainingHours,
    ),
    weeklyAvailabilityDays: readNumber(trainingExposure.weeklyAvailabilityDays),
    weeklyAvailabilityHours: readNumber(trainingExposure.weeklyAvailabilityHours),
    dietType: readString(nutritionContext.dietType),
    regionalCuisinePreference: readJoinedList(
      nutritionContext.regionalCuisinePreference,
    ),
    allergiesOrIntolerances:
      readAllergiesDisplay(nutritionContext.allergiesIntolerances)
      ?? readJoinedList(nutritionContext.allergiesOrIntolerances),
    heightCm: readNumber(athleteContext.heightCm),
    weightKg: readNumber(athleteContext.weightKg),
    wearableStatus: readString(wearables.wearableStatus),
    wearableProvider: null,
    deviceModel: null,
    lastSyncAt: null,
    avgRestingHeartRate: null,
    avgSleepDurationHours: null,
    avgDailyActivityVolume: null,
    recentActivityDaysCount: null,
    wearableDataQuality: null,
    derivedAge: readNumber(athleteContext.age),
    derivedBmi: readNumber(athleteContext.derivedBmi),
    completenessStatus: readString(p.completenessStatus),
    freshnessStatus: readString(p.freshnessStatus),
    planningEligibilityStatus: readString(
      derivedPlanningInputs.planningEligibilityStatus,
    ),
    stage: readString(p.stage),
    revision: readNumber(p.revision),
    lastConfirmedAt: readString(p.lastConfirmedAt),
    updatedAt: readString(p.updatedAt),
    missingRequiredFields,
    bloodReportParameters: readDetailGroup(p.bloodReportParameters),
    bodyCompositionParameters: readDetailGroup(p.bodyCompositionParameters),
    bloodReportComparisons: readDetailGroup(p.bloodReportComparisons),
    bodyCompositionComparisons: readDetailGroup(p.bodyCompositionComparisons),
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
