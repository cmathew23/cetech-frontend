import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import {
  apiRequest,
  isNormalizedApiError,
  type NormalizedApiError,
} from "@/lib/apiClient";

type AnyRecord = Record<string, unknown>;

export const PLANNING_PROFILE_GROUP_ORDER = [
  "athleteContext",
  "sportContext",
  "sportPerformance",
  "trainingExposure",
  "healthStatus",
  "nutritionContext",
  "wearables",
  "derivedPlanningInputs",
  "bloodReportParameters",
  "bodyCompositionParameters",
] as const;

export type PlanningProfileGroupName =
  (typeof PLANNING_PROFILE_GROUP_ORDER)[number];

export type PlanningAllergiesIntolerances = {
  selected: string[];
  othersText: string | null;
  noFoodAllergies: boolean;
};

export type PlanningAllergiesIntolerancesForm = {
  selected: string[];
  othersText: string;
  noFoodAllergies: boolean;
};

export type PlanningScalar =
  | string
  | number
  | boolean
  | string[]
  | PlanningAllergiesIntolerances
  | null;
export type PlanningScalarRecord = Record<string, PlanningScalar>;
export type PlanningFormValue = string | string[] | PlanningAllergiesIntolerancesForm;
export type PlanningFormRecord = Record<string, PlanningFormValue>;
export type PlanningFieldType = "string" | "number" | "boolean" | "allergies";

export type PlanningProfileGroupedRecord = {
  [K in PlanningProfileGroupName]: PlanningScalarRecord;
};

export type PlanningProfileFormState = {
  [K in PlanningProfileGroupName]: PlanningFormRecord;
};

export type PlanningProfileRecord = PlanningProfileGroupedRecord & {
  validatedLevel: string | null;
  planningEligibilityStatus: string | null;
  planningInputCompleteness: string | null;
  updatedAt: string | null;
  missingRequiredFields: string[];
};

export type PlanningProfileBootstrapResult =
  | { kind: "found"; record: PlanningProfileRecord }
  | { kind: "not_found" }
  | { kind: "empty_record" };

export type PlanningFieldErrors = Record<string, string>;

const FIELD_TYPE_HINTS: Partial<
  Record<PlanningProfileGroupName, Record<string, PlanningFieldType>>
> = {
  athleteContext: {
    dateOfBirth: "string",
    sex: "string",
  },
  sportContext: {
    primarySport: "string",
    disciplineOrEvent: "string",
    selfReportedLevel: "string",
    validatedLevel: "string",
  },
  sportPerformance: {
    highestCompetitionLevelReachedPast12Months: "string",
    highestRankingAchievedAtThatLevelPast12Months: "number",
  },
  trainingExposure: {
    trainingAgeYears: "number",
    currentWeeklyTrainingExposureHours: "number",
    weeklyAvailabilityDays: "number",
    weeklyAvailabilityHours: "number",
  },
  healthStatus: {
    heightCm: "number",
    weightKg: "number",
    injuryStatus: "string",
    injuryArea: "string",
    injuryNotes: "string",
  },
  nutritionContext: {
    dietType: "string",
    regionalCuisinePreference: "string",
    allergiesIntolerances: "allergies",
  },
  bloodReportParameters: {
    hemoglobin: "number",
    vitaminD: "number",
    vitaminB12: "number",
    ferritin: "number",
    crp: "number",
    fastingBloodGlucoseFBS: "number",
    postprandialBloodGlucosePPBS: "number",
  },
  bodyCompositionParameters: {
    bodyFatPercent: "number",
    skeletalLeanMassKg: "number",
    skeletalFatMassKg: "number",
    visceralFatLevel: "number",
    bmrKcalDay: "number",
    muscleMassKg: "number",
  },
};

const LEGACY_ALLERGIES_FIELD = "allergiesOrIntolerances";
const ALLERGIES_FIELD = "allergiesIntolerances";
const ALLERGIES_OTHERS_OPTION = "Others";
const LEGACY_HIGHEST_LEVEL_REACHED_FIELD = "highestLevelReached";
const LEGACY_RANKING_LEVEL_FIELD = "rankingLevel";
const SPORT_PERFORMANCE_LEVEL_FIELD =
  "highestCompetitionLevelReachedPast12Months";
const SPORT_PERFORMANCE_RANKING_FIELD =
  "highestRankingAchievedAtThatLevelPast12Months";
const FASTING_BLOOD_GLUCOSE_FIELD = "fastingBloodGlucoseFBS";
const POSTPRANDIAL_BLOOD_GLUCOSE_FIELD = "postprandialBloodGlucosePPBS";
const INJURY_AREA_FIELD = "injuryArea";
const INJURY_NOTES_FIELD = "injuryNotes";
const HIDDEN_FIELDS = new Set([
  "selfReportedLevel",
  LEGACY_ALLERGIES_FIELD,
  LEGACY_HIGHEST_LEVEL_REACHED_FIELD,
  LEGACY_RANKING_LEVEL_FIELD,
]);
const LOCKED_FIELDS = new Set(["primarySport", "validatedLevel"]);
const REGIONAL_CUISINE_FIELD = "regionalCuisinePreference";
const ALLOWED_SEX_VALUES = new Set(["MALE", "FEMALE"]);
const ALLOWED_SPORT_COMPETITION_LEVEL_VALUES = new Set([
  "DISTRICT",
  "STATE",
  "NATIONAL",
  "INTERNATIONAL",
]);
const ALLOWED_INJURY_STATUS_VALUES = new Set(["HEALTHY", "INJURED", "IN_REHAB"]);
const ALLOWED_ALLERGIES_IN_TOLERANCES_VALUES = new Set([
  "Celery",
  "Cereals containing gluten",
  "Crustaceans",
  "Eggs",
  "Fish",
  "Lupin",
  "Milk",
  "Molluscs",
  "Mustard",
  "Nuts",
  "Peanuts",
  "Sesame seeds",
  "Soya",
  "Sulphites",
  "Lactose Intolerant",
  "Gluten Intolerant",
  "FODMAP Sensitivity",
  "Histamine Intolerance",
  "Fructose Intolerance",
  ALLERGIES_OTHERS_OPTION,
]);

function asRecord(value: unknown): AnyRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as AnyRecord;
}

function fieldErrorKey(group: PlanningProfileGroupName, field: string): string {
  return `${group}.${field}`;
}

function readScalar(value: unknown): PlanningScalar | undefined {
  if (value === null) return null;
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item !== "");
  }
  return undefined;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

function hasDuplicates(values: string[]): boolean {
  return new Set(values).size !== values.length;
}

function normalizeUniqueStrings(values: string[]): string[] {
  return values.filter((item, index, arr) => arr.indexOf(item) === index);
}

function emptyAllergiesFormValue(): PlanningAllergiesIntolerancesForm {
  return {
    selected: [],
    othersText: "",
    noFoodAllergies: false,
  };
}

function normalizeAllergiesRecord(
  value: PlanningAllergiesIntolerances,
): PlanningAllergiesIntolerances {
  const selected = normalizeUniqueStrings(
    value.selected.map((item) => item.trim()).filter((item) => item !== ""),
  );
  const othersTextRaw = value.othersText?.trim() ?? "";
  if (value.noFoodAllergies) {
    return {
      selected: [],
      othersText: null,
      noFoodAllergies: true,
    };
  }
  const hasOthers = selected.includes(ALLERGIES_OTHERS_OPTION);
  return {
    selected,
    othersText: hasOthers && othersTextRaw !== "" ? othersTextRaw : null,
    noFoodAllergies: false,
  };
}

function readAllergiesRecord(
  value: unknown,
): PlanningAllergiesIntolerances | undefined {
  const source = asRecord(value);
  if (!source) return undefined;
  const selected = readStringList(source.selected);
  const othersText = readString(source.othersText);
  const noFoodAllergies = readBoolean(source.noFoodAllergies);
  return normalizeAllergiesRecord({
    selected,
    othersText,
    noFoodAllergies,
  });
}

function toAllergiesFormValue(
  value: PlanningAllergiesIntolerances | undefined,
): PlanningAllergiesIntolerancesForm {
  if (!value) return emptyAllergiesFormValue();
  return {
    selected: [...value.selected],
    othersText: value.othersText ?? "",
    noFoodAllergies: value.noFoodAllergies,
  };
}

function normalizeAllergiesFormValue(
  value: PlanningFormValue,
  fieldLabel: string,
): PlanningAllergiesIntolerancesForm {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw {
      message: `${fieldLabel} has an invalid form value`,
      status: 400,
      code: "INVALID_FIELD_VALUE",
    } satisfies NormalizedApiError;
  }
  const raw = value as Partial<PlanningAllergiesIntolerancesForm>;
  const selectedRaw = Array.isArray(raw.selected)
    ? raw.selected.filter((item): item is string => typeof item === "string")
    : [];
  if (hasDuplicates(selectedRaw)) {
    throw {
      message: `${fieldLabel} cannot contain duplicate selections`,
      status: 400,
      code: "INVALID_FIELD_VALUE",
    } satisfies NormalizedApiError;
  }
  const selected = normalizeUniqueStrings(
    selectedRaw.map((item) => item.trim()).filter((item) => item !== ""),
  );
  const othersText = typeof raw.othersText === "string" ? raw.othersText.trim() : "";
  const noFoodAllergies = raw.noFoodAllergies === true;
  if (noFoodAllergies) {
    return {
      selected: [],
      othersText: "",
      noFoodAllergies: true,
    };
  }
  const hasOthers = selected.includes(ALLERGIES_OTHERS_OPTION);
  if (hasOthers && othersText === "") {
    throw {
      message: `${fieldLabel}: Others (please specify) is required`,
      status: 400,
      code: "FIELD_REQUIRED",
    } satisfies NormalizedApiError;
  }
  return {
    selected,
    othersText: hasOthers ? othersText : "",
    noFoodAllergies: false,
  };
}

function emptyGroupedRecord(): PlanningProfileGroupedRecord {
  return {
    athleteContext: {},
    sportContext: {},
    sportPerformance: {},
    trainingExposure: {},
    healthStatus: {},
    nutritionContext: {},
    wearables: {},
    derivedPlanningInputs: {},
    bloodReportParameters: {},
    bodyCompositionParameters: {},
  };
}

function emptyFormState(): PlanningProfileFormState {
  return {
    athleteContext: {},
    sportContext: {},
    sportPerformance: {},
    trainingExposure: {},
    healthStatus: {},
    nutritionContext: {},
    wearables: {},
    derivedPlanningInputs: {},
    bloodReportParameters: {},
    bodyCompositionParameters: {},
  };
}

function extractGroup(records: Array<AnyRecord | null>, key: PlanningProfileGroupName): PlanningScalarRecord {
  for (const record of records) {
    const group = asRecord(record?.[key]);
    if (!group) continue;
    const out: PlanningScalarRecord = {};
    for (const [field, value] of Object.entries(group)) {
      if (key === "nutritionContext" && field === ALLERGIES_FIELD) {
        const allergies = readAllergiesRecord(value);
        if (allergies) {
          out[field] = allergies;
        }
        continue;
      }
      const scalar = readScalar(value);
      if (scalar !== undefined) {
        out[field] = scalar;
      }
    }
    return out;
  }
  return {};
}

function hasMeaningfulScalar(value: PlanningScalar | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    const allergies = normalizeAllergiesRecord(value);
    return (
      allergies.noFoodAllergies
      || allergies.selected.length > 0
      || allergies.othersText !== null
    );
  }
  return true;
}

function isEmptyPlanningRecord(record: PlanningProfileRecord): boolean {
  for (const groupName of PLANNING_PROFILE_GROUP_ORDER) {
    if (
      Object.values(record[groupName]).some((value) => hasMeaningfulScalar(value))
    ) {
      return false;
    }
  }
  return (
    !hasMeaningfulScalar(record.validatedLevel) &&
    !hasMeaningfulScalar(record.planningEligibilityStatus) &&
    !hasMeaningfulScalar(record.planningInputCompleteness) &&
    !hasMeaningfulScalar(record.updatedAt) &&
    record.missingRequiredFields.length === 0
  );
}

function inferFieldType(
  group: PlanningProfileGroupName,
  field: string,
  record?: PlanningProfileRecord | null,
): PlanningFieldType {
  if (group === "nutritionContext" && field === ALLERGIES_FIELD) {
    return "allergies";
  }
  const hinted = FIELD_TYPE_HINTS[group]?.[field];
  if (hinted) return hinted;
  const value = record?.[group]?.[field];
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "string";
}

function isInjuryDetailField(
  group: PlanningProfileGroupName,
  field: string,
): boolean {
  return (
    group === "healthStatus" &&
    (field === INJURY_AREA_FIELD || field === INJURY_NOTES_FIELD)
  );
}

function isSportPerformanceLevelField(
  group: PlanningProfileGroupName,
  field: string,
): boolean {
  return group === "sportPerformance" && field === SPORT_PERFORMANCE_LEVEL_FIELD;
}

function isSportPerformanceRankingField(
  group: PlanningProfileGroupName,
  field: string,
): boolean {
  return (
    group === "sportPerformance" && field === SPORT_PERFORMANCE_RANKING_FIELD
  );
}

function isBloodGlucoseField(
  group: PlanningProfileGroupName,
  field: string,
): boolean {
  return (
    group === "bloodReportParameters" &&
    (field === FASTING_BLOOD_GLUCOSE_FIELD ||
      field === POSTPRANDIAL_BLOOD_GLUCOSE_FIELD)
  );
}

function scalarToFormValue(
  group: PlanningProfileGroupName,
  field: string,
  value: PlanningScalar | undefined,
): PlanningFormValue {
  if (field === "dateOfBirth" && typeof value === "string") {
    return formatDateOfBirthForUi(value);
  }
  if (
    group === "nutritionContext" &&
    field === REGIONAL_CUISINE_FIELD &&
    Array.isArray(value)
  ) {
    return [...value];
  }
  if (group === "nutritionContext" && field === ALLERGIES_FIELD) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      "selected" in value
    ) {
      return toAllergiesFormValue(value as PlanningAllergiesIntolerances);
    }
    return emptyAllergiesFormValue();
  }
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function valueAsString(value: PlanningFormValue, fieldLabel: string): string {
  if (Array.isArray(value)) {
    throw {
      message: `${fieldLabel} has an invalid form value`,
      status: 400,
      code: "INVALID_FIELD_VALUE",
    } satisfies NormalizedApiError;
  }
  return value;
}

function normalizeStringList(value: PlanningFormValue): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => item.trim())
    .filter((item, index, arr) => item !== "" && arr.indexOf(item) === index);
}

function trimOrUndefined(value: PlanningFormValue, fieldLabel: string): string | undefined {
  const trimmed = valueAsString(value, fieldLabel).trim();
  return trimmed === "" ? undefined : trimmed;
}

function trimWhenPresent(value: PlanningFormValue, fieldLabel: string): string {
  return valueAsString(value, fieldLabel).trim();
}

function numberOrUndefined(
  value: PlanningFormValue,
  fieldLabel: string,
): number | undefined {
  const trimmed = valueAsString(value, fieldLabel).trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    throw {
      message: `${fieldLabel} must be a valid number`,
      status: 400,
      code: "INVALID_NUMERIC_FIELD",
    } satisfies NormalizedApiError;
  }
  return parsed;
}

function numberWhenPresent(value: PlanningFormValue, fieldLabel: string): number {
  const trimmed = valueAsString(value, fieldLabel).trim();
  if (trimmed === "") {
    throw {
      message: `${fieldLabel} must be a valid number`,
      status: 400,
      code: "INVALID_NUMERIC_FIELD",
    } satisfies NormalizedApiError;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    throw {
      message: `${fieldLabel} must be a valid number`,
      status: 400,
      code: "INVALID_NUMERIC_FIELD",
    } satisfies NormalizedApiError;
  }
  return parsed;
}

function rankingIntegerOrUndefined(
  value: PlanningFormValue,
  fieldLabel: string,
): number | undefined {
  const trimmed = valueAsString(value, fieldLabel).trim();
  if (trimmed === "") return undefined;
  if (!/^\d+$/.test(trimmed)) {
    throw {
      message: `${fieldLabel} must be a positive integer`,
      status: 400,
      code: "INVALID_NUMERIC_FIELD",
    } satisfies NormalizedApiError;
  }
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw {
      message: `${fieldLabel} must be a positive integer`,
      status: 400,
      code: "INVALID_NUMERIC_FIELD",
    } satisfies NormalizedApiError;
  }
  return parsed;
}

function rankingIntegerOrNull(
  value: PlanningFormValue,
  fieldLabel: string,
): number | null {
  const parsed = rankingIntegerOrUndefined(value, fieldLabel);
  return parsed === undefined ? null : parsed;
}

function nonNegativeNumberOrUndefined(
  value: PlanningFormValue,
  fieldLabel: string,
): number | undefined {
  const userLabel =
    fieldLabel === FASTING_BLOOD_GLUCOSE_FIELD
      ? "Fasting Blood Glucose (FBS)"
      : fieldLabel === POSTPRANDIAL_BLOOD_GLUCOSE_FIELD
        ? "Postprandial Blood Glucose (PPBS)"
        : fieldLabel;
  const trimmed = valueAsString(value, fieldLabel).trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw {
      message: `${userLabel} must be a number greater than or equal to 0`,
      status: 400,
      code: "INVALID_NUMERIC_FIELD",
    } satisfies NormalizedApiError;
  }
  return parsed;
}

function nonNegativeNumberOrNull(
  value: PlanningFormValue,
  fieldLabel: string,
): number | null {
  const parsed = nonNegativeNumberOrUndefined(value, fieldLabel);
  return parsed === undefined ? null : parsed;
}

function booleanWhenPresent(value: PlanningFormValue, fieldLabel: string): boolean {
  return valueAsString(value, fieldLabel).trim().toLowerCase() === "true";
}

function convertAllergiesValue(
  value: PlanningFormValue,
  fieldLabel: string,
  includeWhenEmpty: boolean,
): PlanningAllergiesIntolerances | undefined {
  const normalized = normalizeAllergiesFormValue(value, fieldLabel);
  if (normalized.noFoodAllergies) {
    return {
      selected: [],
      othersText: null,
      noFoodAllergies: true,
    };
  }
  const selected = normalizeUniqueStrings(normalized.selected);
  const hasOthers = selected.includes(ALLERGIES_OTHERS_OPTION);
  const othersText = hasOthers ? normalized.othersText.trim() : "";
  const payload: PlanningAllergiesIntolerances = {
    selected,
    othersText: othersText === "" ? null : othersText,
    noFoodAllergies: false,
  };
  if (!includeWhenEmpty && payload.selected.length === 0 && !payload.othersText) {
    return undefined;
  }
  return payload;
}

function formValuesEqual(a: PlanningFormValue | undefined, b: PlanningFormValue | undefined): boolean {
  const left = a ?? "";
  const right = b ?? "";
  if (
    typeof left === "object" &&
    !Array.isArray(left) &&
    typeof right === "object" &&
    !Array.isArray(right)
  ) {
    const leftAllergies = normalizeAllergiesFormValue(left, ALLERGIES_FIELD);
    const rightAllergies = normalizeAllergiesFormValue(right, ALLERGIES_FIELD);
    if (leftAllergies.noFoodAllergies !== rightAllergies.noFoodAllergies) {
      return false;
    }
    if (leftAllergies.othersText !== rightAllergies.othersText) return false;
    if (leftAllergies.selected.length !== rightAllergies.selected.length) {
      return false;
    }
    return leftAllergies.selected.every(
      (item, idx) => item === rightAllergies.selected[idx],
    );
  }
  if (
    (typeof left === "object" && !Array.isArray(left))
    || (typeof right === "object" && !Array.isArray(right))
  ) {
    return false;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    if (left.length !== right.length) return false;
    return left.every((item, idx) => item === right[idx]);
  }
  return left === right;
}

function convertCreateValue(
  group: PlanningProfileGroupName,
  field: string,
  value: PlanningFormValue,
  type: PlanningFieldType,
): PlanningScalar | undefined {
  if (type === "allergies") {
    return convertAllergiesValue(value, field, false);
  }
  if (group === "nutritionContext" && field === REGIONAL_CUISINE_FIELD) {
    const selected = normalizeStringList(value);
    return selected.length > 0 ? selected : undefined;
  }
  if (field === "dateOfBirth") {
    const trimmed = trimOrUndefined(value, field);
    return trimmed ? toIsoFromUiDob(trimmed) : undefined;
  }
  if (isBloodGlucoseField(group, field)) {
    return nonNegativeNumberOrUndefined(value, field);
  }
  if (isSportPerformanceRankingField(group, field)) {
    return rankingIntegerOrUndefined(value, field);
  }
  if (type === "number") return numberOrUndefined(value, field);
  if (type === "boolean") {
    const trimmed = valueAsString(value, field).trim();
    return trimmed === "" ? undefined : booleanWhenPresent(trimmed, field);
  }
  if (isSportPerformanceLevelField(group, field)) {
    const trimmed = trimWhenPresent(value, field);
    return trimmed === "" ? undefined : trimmed;
  }
  if (isInjuryDetailField(group, field)) {
    const trimmed = trimWhenPresent(value, field);
    return trimmed === "" ? null : trimmed;
  }
  const trimmed = trimOrUndefined(value, field);
  return trimmed;
}

function convertPatchValue(
  group: PlanningProfileGroupName,
  field: string,
  value: PlanningFormValue,
  type: PlanningFieldType,
): PlanningScalar {
  if (type === "allergies") {
    return convertAllergiesValue(value, field, true) ?? {
      selected: [],
      othersText: null,
      noFoodAllergies: false,
    };
  }
  if (group === "nutritionContext" && field === REGIONAL_CUISINE_FIELD) {
    return normalizeStringList(value);
  }
  if (field === "dateOfBirth") {
    return toIsoFromUiDob(valueAsString(value, field));
  }
  if (isBloodGlucoseField(group, field)) {
    return nonNegativeNumberOrNull(value, field);
  }
  if (isSportPerformanceRankingField(group, field)) {
    return rankingIntegerOrNull(value, field);
  }
  if (type === "number") return numberWhenPresent(value, field);
  if (type === "boolean") return booleanWhenPresent(value, field);
  if (isSportPerformanceLevelField(group, field)) {
    const trimmed = trimWhenPresent(value, field);
    return trimmed === "" ? null : trimmed;
  }
  if (isInjuryDetailField(group, field)) {
    const trimmed = trimWhenPresent(value, field);
    return trimmed === "" ? null : trimmed;
  }
  if (group === "sportContext" && field === "disciplineOrEvent") {
    const trimmed = trimWhenPresent(value, field);
    return trimmed === "" ? null : trimmed;
  }
  return trimWhenPresent(value, field);
}

export function parsePlanningProfileRecord(data: unknown): PlanningProfileRecord {
  const root = asRecord(data);
  const nestedData = asRecord(root?.data);
  const profile = asRecord(root?.profile) ?? asRecord(nestedData?.profile);
  const status = asRecord(root?.status) ?? asRecord(nestedData?.status);
  const derived = asRecord(root?.derivedPlanningInputs)
    ?? asRecord(nestedData?.derivedPlanningInputs)
    ?? asRecord(profile?.derivedPlanningInputs)
    ?? asRecord(status?.derivedPlanningInputs);

  const sources = [root, nestedData, profile, status];
  const grouped = emptyGroupedRecord();
  for (const groupName of PLANNING_PROFILE_GROUP_ORDER) {
    grouped[groupName] = extractGroup(sources, groupName);
  }

  const validatedLevel =
    readString(derived?.validatedLevel)
    ?? readString(root?.validatedLevel)
    ?? readString(status?.validatedLevel)
    ?? readString(grouped.sportContext.validatedLevel);
  const planningEligibilityStatus =
    readString(derived?.planningEligibilityStatus)
    ?? readString(root?.planningEligibilityStatus)
    ?? readString(status?.planningEligibilityStatus);
  const planningInputCompleteness =
    readString(derived?.planningInputCompleteness)
    ?? readString(root?.planningInputCompleteness)
    ?? readString(status?.planningInputCompleteness)
    ?? readString(root?.completenessStatus)
    ?? readString(status?.completenessStatus);
  const updatedAt =
    readString(root?.updatedAt)
    ?? readString(nestedData?.updatedAt)
    ?? readString(profile?.updatedAt)
    ?? readString(status?.updatedAt);
  const missingRequiredFields =
    readStringList(derived?.missingRequiredFields)
    .concat(readStringList(root?.missingRequiredFields))
    .filter((value, index, arr) => arr.indexOf(value) === index);

  if (validatedLevel && grouped.sportContext.validatedLevel === undefined) {
    grouped.sportContext.validatedLevel = validatedLevel;
  }
  if (
    planningEligibilityStatus &&
    grouped.derivedPlanningInputs.planningEligibilityStatus === undefined
  ) {
    grouped.derivedPlanningInputs.planningEligibilityStatus =
      planningEligibilityStatus;
  }
  if (
    planningInputCompleteness &&
    grouped.derivedPlanningInputs.planningInputCompleteness === undefined
  ) {
    grouped.derivedPlanningInputs.planningInputCompleteness =
      planningInputCompleteness;
  }

  return {
    ...grouped,
    validatedLevel,
    planningEligibilityStatus,
    planningInputCompleteness,
    updatedAt,
    missingRequiredFields,
  };
}

export function formatDateOfBirthForUi(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const yyyy = String(d.getUTCFullYear());
  return `${yyyy}-${mm}-${dd}`;
}

export function toIsoFromUiDob(value: string): string {
  const raw = value.trim();
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  const legacyDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  const m = isoDate ?? legacyDate;
  if (!m) {
    throw {
      message: "dateOfBirth must be in yyyy-mm-dd format",
      status: 400,
      code: "DOB_INVALID_FORMAT",
    } satisfies NormalizedApiError;
  }
  const year = isoDate ? Number(m[1]) : Number(m[3]);
  const month = Number(m[2]);
  const day = isoDate ? Number(m[3]) : Number(m[1]);
  const utc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    throw {
      message: "dateOfBirth is not a valid calendar date",
      status: 400,
      code: "DOB_INVALID_DATE",
    } satisfies NormalizedApiError;
  }
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0,
    0,
    0,
    0,
  );
  if (utc.getTime() > todayUtc) {
    throw {
      message: "dateOfBirth cannot be in the future",
      status: 400,
      code: "DOB_INVALID_DATE",
    } satisfies NormalizedApiError;
  }
  return utc.toISOString();
}

export function buildPlanningProfileFormState(
  record: PlanningProfileRecord | null,
  defaults?: Partial<PlanningProfileFormState>,
): PlanningProfileFormState {
  const next = emptyFormState();
  for (const groupName of PLANNING_PROFILE_GROUP_ORDER) {
    const group = record?.[groupName] ?? {};
    const out: PlanningFormRecord = {};
    for (const [field, value] of Object.entries(group)) {
      out[field] = scalarToFormValue(groupName, field, value);
    }
    if (groupName === "sportPerformance") {
      const level =
        typeof out[SPORT_PERFORMANCE_LEVEL_FIELD] === "string"
          ? out[SPORT_PERFORMANCE_LEVEL_FIELD].trim()
          : "";
      if (level === "") {
        out[SPORT_PERFORMANCE_RANKING_FIELD] = "";
      }
    }
    if (groupName === "healthStatus") {
      const injuryStatus =
        typeof out.injuryStatus === "string" ? out.injuryStatus.trim() : "";
      if (injuryStatus === "HEALTHY") {
        out.injuryArea = "";
        out.injuryNotes = "";
      }
    }
    next[groupName] = { ...(defaults?.[groupName] ?? {}), ...out };
  }
  return next;
}

export function buildPlanningProfileDefaults(input: {
  primarySport?: string;
}): PlanningProfileFormState {
  const next = emptyFormState();
  next.nutritionContext[ALLERGIES_FIELD] = emptyAllergiesFormValue();
  const primarySport = input.primarySport?.trim() ?? "";
  if (primarySport !== "") {
    next.sportContext.primarySport = primarySport;
  }
  return next;
}

export function shouldRenderField(
  group: PlanningProfileGroupName,
  field: string,
): boolean {
  if (group === "wearables" || group === "derivedPlanningInputs") return false;
  return !HIDDEN_FIELDS.has(field);
}

export function isEditableField(
  group: PlanningProfileGroupName,
  field: string,
): boolean {
  if (group === "wearables" || group === "derivedPlanningInputs") return false;
  if (group === "sportContext" && LOCKED_FIELDS.has(field)) return false;
  if (HIDDEN_FIELDS.has(field)) return false;
  return true;
}

export function getPlanningFieldType(
  group: PlanningProfileGroupName,
  field: string,
  record?: PlanningProfileRecord | null,
): PlanningFieldType {
  return inferFieldType(group, field, record);
}

export function buildPlanningProfileCreateBody(
  draft: PlanningProfileFormState,
  record?: PlanningProfileRecord | null,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const groupName of PLANNING_PROFILE_GROUP_ORDER) {
    if (groupName === "wearables" || groupName === "derivedPlanningInputs") continue;
    const groupBody: Record<string, PlanningScalar> = {};
    if (groupName === "sportPerformance") {
      const rawLevel = draft[groupName][SPORT_PERFORMANCE_LEVEL_FIELD] ?? "";
      const rawRanking = draft[groupName][SPORT_PERFORMANCE_RANKING_FIELD] ?? "";
      const levelTrimmed = valueAsString(
        rawLevel,
        SPORT_PERFORMANCE_LEVEL_FIELD,
      ).trim();
      const rankingTrimmed = valueAsString(
        rawRanking,
        SPORT_PERFORMANCE_RANKING_FIELD,
      ).trim();
      if (levelTrimmed === "" && rankingTrimmed !== "") {
        throw {
          message:
            "highestRankingAchievedAtThatLevelPast12Months requires highestCompetitionLevelReachedPast12Months",
          status: 400,
          code: "INVALID_FIELD_VALUE",
        } satisfies NormalizedApiError;
      }
    }
    for (const [field, value] of Object.entries(draft[groupName])) {
      if (!isEditableField(groupName, field)) continue;
      const type = inferFieldType(groupName, field, record);
      const converted = convertCreateValue(groupName, field, value, type);
      if (converted !== undefined) {
        groupBody[field] = converted;
      }
    }
    if (Object.keys(groupBody).length > 0) {
      body[groupName] = groupBody;
    }
  }
  return body;
}

export function buildPlanningProfilePatchBody(
  baseline: PlanningProfileFormState,
  draft: PlanningProfileFormState,
  record?: PlanningProfileRecord | null,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const groupName of PLANNING_PROFILE_GROUP_ORDER) {
    if (groupName === "wearables" || groupName === "derivedPlanningInputs") continue;
    const groupBody: Record<string, PlanningScalar> = {};
    if (groupName === "sportPerformance") {
      const rawLevel = draft[groupName][SPORT_PERFORMANCE_LEVEL_FIELD] ?? "";
      const rawRanking = draft[groupName][SPORT_PERFORMANCE_RANKING_FIELD] ?? "";
      const levelTrimmed = valueAsString(
        rawLevel,
        SPORT_PERFORMANCE_LEVEL_FIELD,
      ).trim();
      const rankingTrimmed = valueAsString(
        rawRanking,
        SPORT_PERFORMANCE_RANKING_FIELD,
      ).trim();
      if (levelTrimmed === "" && rankingTrimmed !== "") {
        throw {
          message:
            "highestRankingAchievedAtThatLevelPast12Months requires highestCompetitionLevelReachedPast12Months",
          status: 400,
          code: "INVALID_FIELD_VALUE",
        } satisfies NormalizedApiError;
      }
    }
    const keys = new Set([
      ...Object.keys(baseline[groupName]),
      ...Object.keys(draft[groupName]),
    ]);
    for (const field of keys) {
      if (!isEditableField(groupName, field)) continue;
      const previous = baseline[groupName][field];
      const next = draft[groupName][field];
      if (formValuesEqual(previous, next)) continue;
      const type = inferFieldType(groupName, field, record);
      groupBody[field] = convertPatchValue(groupName, field, next, type);
    }
    if (Object.keys(groupBody).length > 0) {
      body[groupName] = groupBody;
    }
  }
  return body;
}

export function validatePlanningProfileDraft(
  draft: PlanningProfileFormState,
  record?: PlanningProfileRecord | null,
): string | null {
  const errors = collectPlanningProfileValidationErrors(draft);
  const firstError = Object.values(errors)[0];
  if (firstError) return firstError;
  try {
    buildPlanningProfileCreateBody(draft, record);
    return null;
  } catch (e) {
    if (isNormalizedApiError(e)) return e.message;
    if (e instanceof Error) return e.message;
    return "Could not validate the planning profile fields.";
  }
}

export function collectPlanningProfileValidationErrors(
  draft: PlanningProfileFormState,
): PlanningFieldErrors {
  const errors: PlanningFieldErrors = {};

  function readValue(
    group: PlanningProfileGroupName,
    field: string,
  ): string {
    const raw = draft[group][field];
    return typeof raw === "string" ? raw.trim() : "";
  }

  function validateNumber(
    group: PlanningProfileGroupName,
    field: string,
    options: {
      min?: number;
      max?: number;
      integer?: boolean;
      positive?: boolean;
      allowEmpty?: boolean;
      message: string;
    },
  ) {
    const value = readValue(group, field);
    if (value === "") {
      if (options.allowEmpty ?? true) return;
      errors[fieldErrorKey(group, field)] = options.message;
      return;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      errors[fieldErrorKey(group, field)] = options.message;
      return;
    }
    if (options.integer && !Number.isInteger(parsed)) {
      errors[fieldErrorKey(group, field)] = options.message;
      return;
    }
    if (options.positive && parsed <= 0) {
      errors[fieldErrorKey(group, field)] = options.message;
      return;
    }
    if (options.min !== undefined && parsed < options.min) {
      errors[fieldErrorKey(group, field)] = options.message;
      return;
    }
    if (options.max !== undefined && parsed > options.max) {
      errors[fieldErrorKey(group, field)] = options.message;
      return;
    }
  }

  const dob = readValue("athleteContext", "dateOfBirth");
  if (dob !== "") {
    try {
      toIsoFromUiDob(dob);
    } catch {
      errors[fieldErrorKey("athleteContext", "dateOfBirth")] =
        "Date of Birth must be a valid past date.";
    }
  }

  const sex = readValue("athleteContext", "sex");
  if (sex !== "" && !ALLOWED_SEX_VALUES.has(sex)) {
    errors[fieldErrorKey("athleteContext", "sex")] =
      "Gender must be Male or Female.";
  }

  validateNumber("healthStatus", "heightCm", {
    positive: true,
    message: "Height must be greater than 0.",
  });
  validateNumber("healthStatus", "weightKg", {
    positive: true,
    message: "Weight must be greater than 0.",
  });

  validateNumber("trainingExposure", "trainingAgeYears", {
    min: 0,
    message: "Years of training must be greater than or equal to 0.",
  });
  validateNumber("trainingExposure", "currentWeeklyTrainingExposureHours", {
    min: 0,
    max: 168,
    message: "Weekly training hours must be between 0 and 168.",
  });
  validateNumber("trainingExposure", "weeklyAvailabilityDays", {
    min: 0,
    max: 7,
    integer: true,
    message: "Weekly availability days must be an integer between 0 and 7.",
  });
  validateNumber("trainingExposure", "weeklyAvailabilityHours", {
    min: 0,
    max: 168,
    message: "Weekly availability hours must be between 0 and 168.",
  });

  const competitionLevel = readValue(
    "sportPerformance",
    SPORT_PERFORMANCE_LEVEL_FIELD,
  );
  if (
    competitionLevel !== "" &&
    !ALLOWED_SPORT_COMPETITION_LEVEL_VALUES.has(competitionLevel)
  ) {
    errors[fieldErrorKey("sportPerformance", SPORT_PERFORMANCE_LEVEL_FIELD)] =
      "Competition level must be District, State, National, or International.";
  }
  const ranking = readValue("sportPerformance", SPORT_PERFORMANCE_RANKING_FIELD);
  if (ranking !== "" && competitionLevel === "") {
    errors[fieldErrorKey("sportPerformance", SPORT_PERFORMANCE_RANKING_FIELD)] =
      "Select competition level before entering ranking.";
  } else if (ranking !== "") {
    validateNumber("sportPerformance", SPORT_PERFORMANCE_RANKING_FIELD, {
      integer: true,
      positive: true,
      allowEmpty: false,
      message: "Ranking must be a positive integer.",
    });
  }

  const injuryStatus = readValue("healthStatus", "injuryStatus");
  if (injuryStatus !== "" && !ALLOWED_INJURY_STATUS_VALUES.has(injuryStatus)) {
    errors[fieldErrorKey("healthStatus", "injuryStatus")] =
      "Injury status is invalid.";
  }
  if (injuryStatus === "HEALTHY") {
    const injuryArea = readValue("healthStatus", "injuryArea");
    const injuryNotes = readValue("healthStatus", "injuryNotes");
    if (injuryArea !== "" || injuryNotes !== "") {
      errors[fieldErrorKey("healthStatus", "injuryStatus")] =
        "Injury area/notes must be cleared when status is Healthy.";
    }
  }

  const allergiesValue = draft.nutritionContext[ALLERGIES_FIELD];
  if (
    allergiesValue &&
    typeof allergiesValue === "object" &&
    !Array.isArray(allergiesValue)
  ) {
    const allergiesRecord = allergiesValue as Partial<PlanningAllergiesIntolerancesForm>;
    const selected = Array.isArray(allergiesRecord.selected)
      ? allergiesRecord.selected.filter((item): item is string => typeof item === "string")
      : [];
    const noFoodAllergies = allergiesRecord.noFoodAllergies === true;
    const othersText =
      typeof allergiesRecord.othersText === "string"
        ? allergiesRecord.othersText.trim()
        : "";

    if (
      selected.some((item) => !ALLOWED_ALLERGIES_IN_TOLERANCES_VALUES.has(item))
    ) {
      errors[fieldErrorKey("nutritionContext", ALLERGIES_FIELD)] =
        "Allergies / Intolerances has unsupported selections.";
    } else if (
      noFoodAllergies &&
      (selected.length > 0 || othersText !== "")
    ) {
      errors[fieldErrorKey("nutritionContext", ALLERGIES_FIELD)] =
        "No food allergies cannot be combined with other selections.";
    } else if (selected.includes(ALLERGIES_OTHERS_OPTION) && othersText === "") {
      errors[fieldErrorKey("nutritionContext", ALLERGIES_FIELD)] =
        "Others requires additional text.";
    }
  }

  for (const [field] of Object.entries(draft.bloodReportParameters)) {
    validateNumber("bloodReportParameters", field, {
      min: 0,
      message: "Value must be greater than or equal to 0.",
    });
  }

  for (const [field] of Object.entries(draft.bodyCompositionParameters)) {
    validateNumber("bodyCompositionParameters", field, {
      min: 0,
      message: "Value must be greater than or equal to 0.",
    });
  }

  return errors;
}

export async function fetchPlanningProfileMe(
  entityId: string,
): Promise<PlanningProfileBootstrapResult> {
  const id = entityId.trim();
  if (id === "") {
    throw {
      message: "entity id is required",
      status: 400,
      code: "ENTITY_ID_REQUIRED",
    } satisfies NormalizedApiError;
  }

  try {
    const raw = await apiRequest(paths.entities.athletePlanningProfileMe(id), {
      method: "GET",
      cache: "no-store",
    });
    const data = adaptBackendSuccess(raw);
    const record = parsePlanningProfileRecord(data);
    if (isEmptyPlanningRecord(record)) {
      return { kind: "empty_record" };
    }
    return { kind: "found", record };
  } catch (e) {
    if (isNormalizedApiError(e) && e.status === 404) {
      return { kind: "not_found" };
    }
    throw e;
  }
}

export async function createPlanningProfileMe(
  entityId: string,
  draft: PlanningProfileFormState,
  record?: PlanningProfileRecord | null,
): Promise<PlanningProfileRecord> {
  const id = entityId.trim();
  if (id === "") {
    throw {
      message: "entity id is required",
      status: 400,
      code: "ENTITY_ID_REQUIRED",
    } satisfies NormalizedApiError;
  }

  const raw = await apiRequest(paths.entities.athletePlanningProfileMe(id), {
    method: "POST",
    body: JSON.stringify(buildPlanningProfileCreateBody(draft, record)),
  });
  return parsePlanningProfileRecord(adaptBackendSuccess(raw));
}

export async function patchPlanningProfileMe(
  entityId: string,
  baseline: PlanningProfileFormState,
  draft: PlanningProfileFormState,
  record?: PlanningProfileRecord | null,
): Promise<PlanningProfileRecord> {
  const id = entityId.trim();
  if (id === "") {
    throw {
      message: "entity id is required",
      status: 400,
      code: "ENTITY_ID_REQUIRED",
    } satisfies NormalizedApiError;
  }

  const body = buildPlanningProfilePatchBody(baseline, draft, record);
  if (Object.keys(body).length === 0) {
    throw {
      message: "No changes to save",
      status: 400,
      code: "PATCH_EMPTY_PAYLOAD",
    } satisfies NormalizedApiError;
  }

  const raw = await apiRequest(paths.entities.athletePlanningProfileMe(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return parsePlanningProfileRecord(adaptBackendSuccess(raw));
}

export function flattenPlanningProfileRecord(
  record: PlanningProfileRecord,
): PlanningScalarRecord {
  return {
    ...record.athleteContext,
    ...record.sportContext,
    ...record.sportPerformance,
    ...record.trainingExposure,
    ...record.healthStatus,
    ...record.nutritionContext,
    ...record.wearables,
    ...record.derivedPlanningInputs,
    ...record.bloodReportParameters,
    ...record.bodyCompositionParameters,
    validatedLevel: record.validatedLevel,
    planningEligibilityStatus: record.planningEligibilityStatus,
    planningInputCompleteness: record.planningInputCompleteness,
    updatedAt: record.updatedAt,
  };
}
