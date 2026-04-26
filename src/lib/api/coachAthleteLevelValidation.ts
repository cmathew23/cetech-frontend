import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest, type NormalizedApiError } from "@/lib/apiClient";
import type { TrainingPlanLevelValidationView } from "@/types/trainingPlanLevelValidation";

type AnyRecord = Record<string, unknown>;

const SPORT_PERFORMANCE_LEVEL_FIELD =
  "highestCompetitionLevelReachedPast12Months";
const SPORT_PERFORMANCE_RANKING_FIELD =
  "highestRankingAchievedAtThatLevelPast12Months";

function asRecord(value: unknown): AnyRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as AnyRecord;
}

function readStringFrom(records: Array<AnyRecord | null>, key: string): string | null {
  for (const record of records) {
    if (!record) continue;
    const value = record[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    }
  }
  return null;
}

function readNumberFrom(records: Array<AnyRecord | null>, key: string): number | null {
  for (const record of records) {
    if (!record) continue;
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

function readBooleanFrom(records: Array<AnyRecord | null>, key: string): boolean | null {
  for (const record of records) {
    if (!record) continue;
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
  }
  return null;
}

function readStringListFrom(records: Array<AnyRecord | null>, key: string): string[] {
  for (const record of records) {
    if (!record) continue;
    const value = record[key];
    if (!Array.isArray(value)) continue;
    const out: string[] = [];
    for (const item of value) {
      if (typeof item === "string" && item.trim() !== "") {
        out.push(item.trim());
      }
    }
    return out;
  }
  return [];
}

function readNestedRecordFrom(
  records: Array<AnyRecord | null>,
  key: string,
): AnyRecord | null {
  for (const record of records) {
    const nested = asRecord(record?.[key]);
    if (nested) return nested;
  }
  return null;
}

function collectNestedRecordsByKey(value: unknown, key: string): AnyRecord[] {
  const out: AnyRecord[] = [];
  const seen = new Set<AnyRecord>();

  function visit(node: unknown): void {
    const record = asRecord(node);
    if (!record || seen.has(record)) return;
    seen.add(record);

    const nested = asRecord(record[key]);
    if (nested && !seen.has(nested)) {
      out.push(nested);
    }

    for (const child of Object.values(record)) {
      if (Array.isArray(child)) {
        for (const item of child) visit(item);
        continue;
      }
      visit(child);
    }
  }

  visit(value);
  return out;
}

function parseLevelValidationPayload(data: unknown): TrainingPlanLevelValidationView {
  const root = asRecord(data);
  const nestedData = asRecord(root?.data);
  const suggestion = asRecord(root?.suggestion) ?? asRecord(nestedData?.suggestion);

  const sources = [root, nestedData, suggestion];
  const sportPerformanceSources = [
    ...collectNestedRecordsByKey(root, "sportPerformance"),
    ...collectNestedRecordsByKey(nestedData, "sportPerformance"),
    ...collectNestedRecordsByKey(suggestion, "sportPerformance"),
  ];

  return {
    age: readNumberFrom(sources, "age"),
    ageBand: readStringFrom(sources, "ageBand"),
    highestCompetitionLevelReachedPast12Months: readStringFrom(
      sportPerformanceSources,
      SPORT_PERFORMANCE_LEVEL_FIELD,
    ),
    highestRankingAchievedAtThatLevelPast12Months: readNumberFrom(
      sportPerformanceSources,
      SPORT_PERFORMANCE_RANKING_FIELD,
    ),
    baseSuggestedLevel: readStringFrom(sources, "baseSuggestedLevel"),
    rankingOverrideApplied: readBooleanFrom(sources, "rankingOverrideApplied"),
    finalSuggestedLevel: readStringFrom(sources, "finalSuggestedLevel"),
    validatedLevel: readStringFrom(sources, "validatedLevel"),
    validationStatus: readStringFrom(sources, "validationStatus"),
    reasons: readStringListFrom(sources, "reasons"),
  };
}

export async function fetchCoachAthleteLevelValidation(
  entityId: string,
  athleteId: string,
): Promise<TrainingPlanLevelValidationView> {
  const e = entityId.trim();
  const a = athleteId.trim();
  if (e === "" || a === "") {
    throw {
      message: "entity id and athlete id are required",
      status: 400,
      code: "ENTITY_OR_ATHLETE_ID_REQUIRED",
    } satisfies NormalizedApiError;
  }

  const raw = await apiRequest(paths.entities.athleteTrainingPlanLevelValidation(e, a), {
    method: "GET",
    cache: "no-store",
  });
  const data = adaptBackendSuccess(raw);
  return parseLevelValidationPayload(data);
}

export async function postCoachAthleteLevelValidation(
  entityId: string,
  athleteId: string,
  body: { validatedLevel: string },
): Promise<void> {
  const e = entityId.trim();
  const a = athleteId.trim();
  const level = body.validatedLevel.trim();
  if (e === "" || a === "" || level === "") {
    throw {
      message: "entity id, athlete id, and validated level are required",
      status: 400,
      code: "LEVEL_VALIDATION_INPUT_REQUIRED",
    } satisfies NormalizedApiError;
  }

  const raw = await apiRequest(paths.entities.athleteTrainingPlanLevelValidation(e, a), {
    method: "POST",
    body: JSON.stringify({ validatedLevel: level }),
  });
  adaptBackendSuccess(raw);
}
