import {
  buildPlanningProfileDefaults,
  buildPlanningProfileFormState,
  createPlanningProfileMe,
  fetchPlanningProfileMe,
  flattenPlanningProfileRecord,
  formatDateOfBirthForUi,
  patchPlanningProfileMe,
  type PlanningProfileBootstrapResult,
  type PlanningProfileRecord,
  type PlanningProfileFormState,
} from "@/lib/api/planning-profile";

export type AthletePlanningProfileRecord = {
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
  lastConfirmedAt: string | null;
};

export type AthletePlanningProfileBootstrapResult =
  | { kind: "found"; record: AthletePlanningProfileRecord }
  | Exclude<PlanningProfileBootstrapResult, { kind: "found"; record: unknown }>;

export type AthletePlanningProfileCreateInput = {
  athleteContext?: PlanningProfileFormState["athleteContext"];
  sportContext?: PlanningProfileFormState["sportContext"];
  sportPerformance?: PlanningProfileFormState["sportPerformance"];
  trainingExposure?: PlanningProfileFormState["trainingExposure"];
  healthStatus?: PlanningProfileFormState["healthStatus"];
  nutritionContext?: PlanningProfileFormState["nutritionContext"];
  bloodReportParameters?: PlanningProfileFormState["bloodReportParameters"];
  bodyCompositionParameters?: PlanningProfileFormState["bodyCompositionParameters"];
};

export type AthletePlanningProfilePatchInput = Partial<{
  athleteContext: PlanningProfileFormState["athleteContext"];
  sportContext: PlanningProfileFormState["sportContext"];
  sportPerformance: PlanningProfileFormState["sportPerformance"];
  trainingExposure: PlanningProfileFormState["trainingExposure"];
  healthStatus: PlanningProfileFormState["healthStatus"];
  nutritionContext: PlanningProfileFormState["nutritionContext"];
  bloodReportParameters: PlanningProfileFormState["bloodReportParameters"];
  bodyCompositionParameters: PlanningProfileFormState["bodyCompositionParameters"];
}>;

function toLegacyRecord(groupedRecord: PlanningProfileRecord): AthletePlanningProfileRecord {
  const flat = flattenPlanningProfileRecord(groupedRecord);
  return {
    dateOfBirth: typeof flat.dateOfBirth === "string" ? flat.dateOfBirth : null,
    sex: typeof flat.sex === "string" ? flat.sex : null,
    primarySport:
      typeof flat.primarySport === "string" ? flat.primarySport : null,
    disciplineOrEvent:
      typeof flat.disciplineOrEvent === "string" ? flat.disciplineOrEvent : null,
    selfReportedLevel:
      typeof flat.selfReportedLevel === "string" ? flat.selfReportedLevel : null,
    validatedLevel:
      typeof groupedRecord.validatedLevel === "string"
        ? groupedRecord.validatedLevel
        : null,
    trainingAgeYears:
      typeof flat.trainingAgeYears === "number" ? flat.trainingAgeYears : null,
    currentWeeklyTrainingExposureHours:
      typeof flat.currentWeeklyTrainingExposureHours === "number"
        ? flat.currentWeeklyTrainingExposureHours
        : null,
    weeklyAvailabilityDays:
      typeof flat.weeklyAvailabilityDays === "number"
        ? flat.weeklyAvailabilityDays
        : null,
    weeklyAvailabilityHours:
      typeof flat.weeklyAvailabilityHours === "number"
        ? flat.weeklyAvailabilityHours
        : null,
    dietType: typeof flat.dietType === "string" ? flat.dietType : null,
    regionalCuisinePreference:
      typeof flat.regionalCuisinePreference === "string"
        ? flat.regionalCuisinePreference
        : Array.isArray(flat.regionalCuisinePreference)
          ? flat.regionalCuisinePreference
              .filter((item): item is string => typeof item === "string")
              .join(", ")
        : null,
    allergiesOrIntolerances:
      typeof flat.allergiesOrIntolerances === "string"
        ? flat.allergiesOrIntolerances
        : flat.allergiesIntolerances
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
        : null,
    heightCm: typeof flat.heightCm === "number" ? flat.heightCm : null,
    weightKg: typeof flat.weightKg === "number" ? flat.weightKg : null,
    hasWearable:
      typeof flat.hasWearable === "boolean" ? flat.hasWearable : null,
    wearableProvider:
      typeof flat.wearableProvider === "string" ? flat.wearableProvider : null,
    deviceModel:
      typeof flat.deviceModel === "string" ? flat.deviceModel : null,
    lastSyncAt: typeof flat.lastSyncAt === "string" ? flat.lastSyncAt : null,
    avgRestingHeartRate:
      typeof flat.avgRestingHeartRate === "number"
        ? flat.avgRestingHeartRate
        : null,
    avgSleepDurationHours:
      typeof flat.avgSleepDurationHours === "number"
        ? flat.avgSleepDurationHours
        : null,
    avgDailyActivityVolume:
      typeof flat.avgDailyActivityVolume === "number"
        ? flat.avgDailyActivityVolume
        : null,
    recentActivityDaysCount:
      typeof flat.recentActivityDaysCount === "number"
        ? flat.recentActivityDaysCount
        : null,
    wearableDataQuality:
      typeof flat.wearableDataQuality === "string" ? flat.wearableDataQuality : null,
    derivedAge:
      typeof flat.derivedAge === "number" ? flat.derivedAge : null,
    derivedBmi:
      typeof flat.derivedBmi === "number" ? flat.derivedBmi : null,
    completenessStatus:
      typeof flat.planningInputCompleteness === "string"
        ? flat.planningInputCompleteness
        : typeof flat.completenessStatus === "string"
          ? flat.completenessStatus
          : null,
    freshnessStatus:
      typeof flat.freshnessStatus === "string" ? flat.freshnessStatus : null,
    planningEligibilityStatus:
      typeof groupedRecord.planningEligibilityStatus === "string"
        ? groupedRecord.planningEligibilityStatus
        : null,
    stage: typeof flat.stage === "string" ? flat.stage : null,
    lastConfirmedAt:
      typeof flat.lastConfirmedAt === "string" ? flat.lastConfirmedAt : null,
  };
}

function toGroupedDraft(
  input: AthletePlanningProfileCreateInput | AthletePlanningProfilePatchInput,
): PlanningProfileFormState {
  return {
    ...buildPlanningProfileDefaults({}),
    athleteContext: { ...(input.athleteContext ?? {}) },
    sportContext: { ...(input.sportContext ?? {}) },
    sportPerformance: { ...(input.sportPerformance ?? {}) },
    trainingExposure: { ...(input.trainingExposure ?? {}) },
    healthStatus: { ...(input.healthStatus ?? {}) },
    nutritionContext: { ...(input.nutritionContext ?? {}) },
    wearables: {},
    derivedPlanningInputs: {},
    bloodReportParameters: { ...(input.bloodReportParameters ?? {}) },
    bodyCompositionParameters: { ...(input.bodyCompositionParameters ?? {}) },
  };
}

export async function fetchAthletePlanningProfileMe(
  entityId: string,
): Promise<AthletePlanningProfileBootstrapResult> {
  const result = await fetchPlanningProfileMe(entityId);
  if (result.kind !== "found") return result;
  return { kind: "found", record: toLegacyRecord(result.record) };
}

export async function createAthletePlanningProfileMe(
  entityId: string,
  input: AthletePlanningProfileCreateInput,
): Promise<AthletePlanningProfileRecord> {
  const next = await createPlanningProfileMe(entityId, toGroupedDraft(input));
  return toLegacyRecord(next);
}

export async function patchAthletePlanningProfileMe(
  entityId: string,
  input: AthletePlanningProfilePatchInput,
): Promise<AthletePlanningProfileRecord> {
  const draft = toGroupedDraft(input);
  const baseline = buildPlanningProfileFormState(null);
  const next = await patchPlanningProfileMe(entityId, baseline, draft);
  return toLegacyRecord(next);
}

export { formatDateOfBirthForUi };
