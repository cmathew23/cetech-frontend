import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest, type NormalizedApiError } from "@/lib/apiClient";

type AnyRecord = Record<string, unknown>;
const TRAINING_PLAN_EXECUTE_TIMEOUT_MS = 120_000;
type WorkloadAssessmentValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>;

function asRecord(value: unknown): AnyRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as AnyRecord;
}

function collectRecords(value: unknown): AnyRecord[] {
  const out: AnyRecord[] = [];
  const seen = new Set<AnyRecord>();

  function visit(node: unknown): void {
    const record = asRecord(node);
    if (!record || seen.has(record)) return;
    seen.add(record);
    out.push(record);

    for (const child of Object.values(record)) {
      if (Array.isArray(child)) {
        for (const item of child) visit(item);
      } else {
        visit(child);
      }
    }
  }

  visit(value);
  return out;
}

function readStringKey(records: AnyRecord[], keys: string[]): string | null {
  for (const key of keys) {
    for (const record of records) {
      const value = record[key];
      if (typeof value !== "string") continue;
      const trimmed = value.trim();
      if (trimmed !== "") return trimmed;
    }
  }
  return null;
}

function readNumberKey(records: AnyRecord[], keys: string[]): number | null {
  for (const key of keys) {
    for (const record of records) {
      const value = record[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
    }
  }
  return null;
}

function readBooleanKey(records: AnyRecord[], keys: string[]): boolean | null {
  for (const key of keys) {
    for (const record of records) {
      const value = record[key];
      if (typeof value === "boolean") {
        return value;
      }
    }
  }
  return null;
}

function readStringListKey(records: AnyRecord[], keys: string[]): string[] {
  for (const key of keys) {
    for (const record of records) {
      const value = record[key];
      if (!Array.isArray(value)) continue;
      const items = value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item !== "");
      return items;
    }
  }
  return [];
}

function readDetailValue(value: unknown): WorkloadAssessmentValue | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (!Array.isArray(value)) return undefined;

  const items = value
    .filter((item): item is string | number | boolean => (
      typeof item === "string" || typeof item === "number" || typeof item === "boolean"
    ))
    .map((item) => (typeof item === "string" ? item.trim() : item))
    .filter((item) => item !== "");

  return items.length > 0 ? items : undefined;
}

function assertIds(entityId: string, athleteId: string): {
  entityId: string;
  athleteId: string;
} {
  const e = entityId.trim();
  const a = athleteId.trim();
  if (e === "" || a === "") {
    throw {
      message: "entity id and athlete id are required",
      status: 400,
      code: "ENTITY_OR_ATHLETE_ID_REQUIRED",
    } satisfies NormalizedApiError;
  }
  return { entityId: e, athleteId: a };
}

export type CoachAthleteTrainingPlanReadiness = {
  readinessStatus: string | null;
  planningEligibilityStatus: string | null;
  validatedLevel: string | null;
  validationStatus: string | null;
  appCompleteness: string | null;
  missingRequiredFields: string[];
};

export type CoachAthleteTrainingPlanWorkloadAssessment = {
  workloadClassification: {
    sportCode: string | null;
    ageBand: string | null;
    validatedLevel: string | null;
    weeklyTrainingHours: number | null;
    recommendedMinHours: number | null;
    recommendedMaxHours: number | null;
    status: string | null;
    reason: string | null;
    recommendation: string | null;
  } | null;
  assessmentStatus: string | null;
  readinessLevel: string | null;
  workloadFlags: WorkloadAssessmentValue | null;
  restrictionSummary: string | null;
  explanation: string | null;
  additionalDetails: Record<string, WorkloadAssessmentValue>;
  rawPayloadText: string | null;
};

function safeJsonPreview(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  try {
    const text = JSON.stringify(value, null, 2);
    return typeof text === "string" && text.trim() !== "" ? text : null;
  } catch {
    return null;
  }
}

export type CoachAthleteTrainingPlanCompleteness = {
  completenessStatus: string | null;
  summary: string | null;
  missingRequiredFields: string[];
};

export type TrainingPlanGenerationDomain = "SKILLS" | "NUTRITION" | "S_AND_C";

export type CoachAthleteTrainingPlanExecuteResult = {
  executionDecision: {
    executed: boolean | null;
    reason: string | null;
  } | null;
  completenessDecision: {
    canGenerate: boolean | null;
    missingRequirements: string[];
  } | null;
  generatedPlannerCandidate: unknown;
  generationContextSnapshot: unknown;
  raw: unknown;
};

export type CoachAthleteTrainingPlanPersistDraftResult = {
  trainingPlanId: string | null;
  trainingPlanVersionId: string | null;
  versionNumber: number | null;
  status: string | null;
  daysCreated: number | null;
  sessionsCreated: number | null;
  itemsPersisted: number | null;
  raw: unknown;
};

export type CoachAthleteGeneratedDraftItem = {
  label: string | null;
  summary: string | null;
  durationMinutes: number | null;
  reps: string | null;
  notes: string | null;
};

export type CoachAthleteGeneratedDraftSession = {
  sessionIndex: number | null;
  title: string | null;
  objective: string | null;
  plannedDurationMinutes: number | null;
  intensity: string | null;
  items: CoachAthleteGeneratedDraftItem[];
};

export type CoachAthleteGeneratedDraftDay = {
  dayIndex: number | null;
  date: string | null;
  dayFocus: string | null;
  notes: string | null;
  sessions: CoachAthleteGeneratedDraftSession[];
};

export type CoachAthleteLatestDomainDraft = {
  trainingPlanId: string | null;
  trainingPlanVersionId: string | null;
  versionNumber: number | null;
  status: string | null;
  durationDays: number | null;
  daysCreated: number | null;
  sessionsCreated: number | null;
  itemsPersisted: number | null;
  days: CoachAthleteGeneratedDraftDay[];
  raw: unknown;
};

function readStringLike(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return typeof value === "boolean" ? String(value) : null;
}

function readFirstArray(records: AnyRecord[], keys: string[]): unknown[] {
  for (const key of keys) {
    for (const record of records) {
      const value = record[key];
      if (Array.isArray(value)) return value;
    }
  }
  return [];
}

function parseGeneratedDraftItem(value: unknown): CoachAthleteGeneratedDraftItem | null {
  const record = asRecord(value);
  if (!record) return null;
  const item: CoachAthleteGeneratedDraftItem = {
    label: readStringKey([record], ["label", "name", "title"]),
    summary: readStringKey([record], ["summary", "description", "objective"]),
    durationMinutes: readNumberKey([record], ["durationMinutes"]),
    reps: readStringLike(record.reps),
    notes: readStringKey([record], ["notes"]),
  };
  return item.label || item.summary || item.durationMinutes !== null || item.reps || item.notes
    ? item
    : null;
}

function parseGeneratedDraftSession(
  value: unknown,
): CoachAthleteGeneratedDraftSession | null {
  const record = asRecord(value);
  if (!record) return null;
  const items = readFirstArray([record], ["items"])
    .map(parseGeneratedDraftItem)
    .filter((item): item is CoachAthleteGeneratedDraftItem => item !== null);
  const session: CoachAthleteGeneratedDraftSession = {
    sessionIndex: readNumberKey([record], ["sessionIndex", "index"]),
    title: readStringKey([record], ["title", "label", "name"]),
    objective: readStringKey([record], ["objective", "summary", "description"]),
    plannedDurationMinutes: readNumberKey([record], ["plannedDurationMinutes", "durationMinutes"]),
    intensity: readStringKey([record], ["intensity"]),
    items,
  };
  return (
    session.sessionIndex !== null ||
    session.title ||
    session.objective ||
    session.plannedDurationMinutes !== null ||
    session.intensity ||
    session.items.length > 0
  )
    ? session
    : null;
}

function parseGeneratedDraftDay(value: unknown): CoachAthleteGeneratedDraftDay | null {
  const record = asRecord(value);
  if (!record) return null;
  const sessions = readFirstArray([record], ["sessions"])
    .map(parseGeneratedDraftSession)
    .filter((session): session is CoachAthleteGeneratedDraftSession => session !== null)
    .sort((left, right) => (left.sessionIndex ?? Number.MAX_SAFE_INTEGER) - (right.sessionIndex ?? Number.MAX_SAFE_INTEGER));
  const day: CoachAthleteGeneratedDraftDay = {
    dayIndex: readNumberKey([record], ["dayIndex", "dayNumber", "index"]),
    date: readStringKey([record], ["date", "dayDate"]),
    dayFocus: readStringKey([record], ["dayFocus"]),
    notes: readStringKey([record], ["notes"]),
    sessions,
  };
  return (
    day.dayIndex !== null ||
    day.date ||
    day.dayFocus ||
    day.notes ||
    day.sessions.length > 0
  )
    ? day
    : null;
}

function parseLatestDomainDraftPayload(data: unknown): CoachAthleteLatestDomainDraft {
  const records = collectRecords(data);
  const days = readFirstArray(records, ["days"])
    .map(parseGeneratedDraftDay)
    .filter((day): day is CoachAthleteGeneratedDraftDay => day !== null)
    .sort((left, right) => (left.dayIndex ?? Number.MAX_SAFE_INTEGER) - (right.dayIndex ?? Number.MAX_SAFE_INTEGER));

  return {
    trainingPlanId: readStringKey(records, ["trainingPlanId"]),
    trainingPlanVersionId: readStringKey(records, [
      "trainingPlanVersionId",
      "versionId",
    ]),
    versionNumber: readNumberKey(records, ["versionNumber"]),
    status: readStringKey(records, ["status"]),
    durationDays: readNumberKey(records, ["durationDays"]),
    daysCreated: readNumberKey(records, ["daysCreated"]),
    sessionsCreated: readNumberKey(records, ["sessionsCreated"]),
    itemsPersisted: readNumberKey(records, ["itemsPersisted"]),
    days,
    raw: data,
  };
}

function parseReadinessPayload(data: unknown): CoachAthleteTrainingPlanReadiness {
  const records = collectRecords(data);
  return {
    readinessStatus: readStringKey(records, ["readinessStatus", "status", "state"]),
    planningEligibilityStatus: readStringKey(records, [
      "planningEligibilityStatus",
      "planningEligibility",
      "eligibilityStatus",
    ]),
    validatedLevel: readStringKey(records, ["validatedLevel"]),
    validationStatus: readStringKey(records, ["validationStatus"]),
    appCompleteness: readStringKey(records, [
      "appCompleteness",
      "planningInputCompleteness",
      "completenessStatus",
    ]),
    missingRequiredFields: readStringListKey(records, ["missingRequiredFields"]),
  };
}

function parseWorkloadAssessmentPayload(
  data: unknown,
): CoachAthleteTrainingPlanWorkloadAssessment {
  const records = collectRecords(data);
  const workloadClassificationRecord = records
    .map((record) => asRecord(record.workloadClassification))
    .find((record) => record !== null) ?? null;
  const knownKeys = new Set([
    "workloadClassification",
    "sportCode",
    "ageBand",
    "validatedLevel",
    "weeklyTrainingHours",
    "recommendedMinHours",
    "recommendedMaxHours",
    "assessmentStatus",
    "status",
    "reason",
    "recommendation",
    "readinessLevel",
    "workloadFlags",
    "restrictionSummary",
    "explanation",
    "data",
    "success",
  ]);
  const additionalDetails: Record<string, WorkloadAssessmentValue> = {};

  for (const record of records) {
    for (const [key, value] of Object.entries(record)) {
      if (knownKeys.has(key) || key in additionalDetails) continue;
      const detailValue = readDetailValue(value);
      if (detailValue !== undefined) {
        additionalDetails[key] = detailValue;
      }
    }
  }

  return {
    workloadClassification: workloadClassificationRecord
      ? {
          sportCode: readStringKey([workloadClassificationRecord], ["sportCode"]),
          ageBand: readStringKey([workloadClassificationRecord], ["ageBand"]),
          validatedLevel: readStringKey([workloadClassificationRecord], ["validatedLevel"]),
          weeklyTrainingHours:
            typeof workloadClassificationRecord.weeklyTrainingHours === "number" &&
            Number.isFinite(workloadClassificationRecord.weeklyTrainingHours)
              ? workloadClassificationRecord.weeklyTrainingHours
              : null,
          recommendedMinHours:
            typeof workloadClassificationRecord.recommendedMinHours === "number" &&
            Number.isFinite(workloadClassificationRecord.recommendedMinHours)
              ? workloadClassificationRecord.recommendedMinHours
              : null,
          recommendedMaxHours:
            typeof workloadClassificationRecord.recommendedMaxHours === "number" &&
            Number.isFinite(workloadClassificationRecord.recommendedMaxHours)
              ? workloadClassificationRecord.recommendedMaxHours
              : null,
          status: readStringKey([workloadClassificationRecord], ["status"]),
          reason: readStringKey([workloadClassificationRecord], ["reason"]),
          recommendation: readStringKey([workloadClassificationRecord], ["recommendation"]),
        }
      : null,
    assessmentStatus: readStringKey(records, ["assessmentStatus"]),
    readinessLevel: readStringKey(records, ["readinessLevel"]),
    workloadFlags:
      records
        .map((record) => readDetailValue(record.workloadFlags))
        .find((value) => value !== undefined) ?? null,
    restrictionSummary: readStringKey(records, ["restrictionSummary"]),
    explanation: readStringKey(records, ["explanation"]),
    additionalDetails,
    rawPayloadText: safeJsonPreview(data),
  };
}

function parseCompletenessPayload(data: unknown): CoachAthleteTrainingPlanCompleteness {
  const records = collectRecords(data);
  return {
    completenessStatus: readStringKey(records, [
      "completenessStatus",
      "planningInputCompleteness",
      "appCompleteness",
      "status",
      "state",
    ]),
    summary: readStringKey(records, ["summary", "message", "description"]),
    missingRequiredFields: readStringListKey(records, ["missingRequiredFields"]),
  };
}

function parseExecutePayload(data: unknown): CoachAthleteTrainingPlanExecuteResult {
  const records = collectRecords(data);
  const executionDecisionRecord = records
    .map((record) => asRecord(record.executionDecision))
    .find((record) => record !== null) ?? null;
  const completenessDecisionRecord = records
    .map((record) => asRecord(record.completenessDecision))
    .find((record) => record !== null) ?? null;
  const generatedPlannerCandidate =
    records.find((record) => "generatedPlannerCandidate" in record)
      ?.generatedPlannerCandidate ?? null;
  const generationContextSnapshot =
    records.find((record) => "generationContextSnapshot" in record)
      ?.generationContextSnapshot ?? null;

  return {
    executionDecision: executionDecisionRecord
      ? {
          executed: readBooleanKey([executionDecisionRecord], ["executed"]),
          reason: readStringKey([executionDecisionRecord], ["reason"]),
        }
      : null,
    completenessDecision: completenessDecisionRecord
      ? {
          canGenerate: readBooleanKey([completenessDecisionRecord], ["canGenerate"]),
          missingRequirements: readStringListKey(
            [completenessDecisionRecord],
            ["missingRequirements"],
          ),
        }
      : null,
    generatedPlannerCandidate,
    generationContextSnapshot,
    raw: data,
  };
}

function parsePersistDraftPayload(data: unknown): CoachAthleteTrainingPlanPersistDraftResult {
  const records = collectRecords(data);
  return {
    trainingPlanId: readStringKey(records, ["trainingPlanId"]),
    trainingPlanVersionId: readStringKey(records, ["trainingPlanVersionId"]),
    versionNumber: readNumberKey(records, ["versionNumber"]),
    status: readStringKey(records, ["status"]),
    daysCreated: readNumberKey(records, ["daysCreated"]),
    sessionsCreated: readNumberKey(records, ["sessionsCreated"]),
    itemsPersisted: readNumberKey(records, ["itemsPersisted"]),
    raw: data,
  };
}

export async function fetchCoachAthleteTrainingPlanReadiness(
  entityId: string,
  athleteId: string,
): Promise<CoachAthleteTrainingPlanReadiness> {
  const ids = assertIds(entityId, athleteId);
  const raw = await apiRequest(
    paths.entities.athleteTrainingPlanReadiness(ids.entityId, ids.athleteId),
    {
      method: "GET",
      cache: "no-store",
    },
  );
  return parseReadinessPayload(adaptBackendSuccess(raw));
}

export async function fetchCoachAthleteTrainingPlanWorkloadAssessment(
  entityId: string,
  athleteId: string,
): Promise<CoachAthleteTrainingPlanWorkloadAssessment> {
  const ids = assertIds(entityId, athleteId);
  const raw = await apiRequest(
    paths.entities.athleteTrainingPlanWorkloadAssessment(
      ids.entityId,
      ids.athleteId,
    ),
    {
      method: "GET",
      cache: "no-store",
    },
  );
  return parseWorkloadAssessmentPayload(adaptBackendSuccess(raw));
}

export async function fetchCoachAthleteTrainingPlanCompleteness(
  entityId: string,
  athleteId: string,
): Promise<CoachAthleteTrainingPlanCompleteness> {
  const ids = assertIds(entityId, athleteId);
  const raw = await apiRequest(
    paths.entities.athleteTrainingPlanCompleteness(ids.entityId, ids.athleteId),
    {
      method: "GET",
      cache: "no-store",
    },
  );
  return parseCompletenessPayload(adaptBackendSuccess(raw));
}

export async function executeCoachAthleteTrainingPlan(
  entityId: string,
  athleteId: string,
  payload: {
    sportCode: string;
    durationDays: 7 | 15 | 30;
    generationDomain: TrainingPlanGenerationDomain;
  },
): Promise<CoachAthleteTrainingPlanExecuteResult> {
  const ids = assertIds(entityId, athleteId);
  const sportCode = payload.sportCode.trim();
  const generationDomain = payload.generationDomain;
  if (sportCode === "") {
    throw {
      message: "sportCode is required",
      status: 400,
      code: "SPORT_CODE_REQUIRED",
    } satisfies NormalizedApiError;
  }
  const raw = await apiRequest(
    paths.entities.athleteTrainingPlanExecute(ids.entityId, ids.athleteId),
    {
      method: "POST",
      timeoutMs: TRAINING_PLAN_EXECUTE_TIMEOUT_MS,
      body: JSON.stringify({
        sportCode,
        durationDays: payload.durationDays,
        generationDomain,
      }),
    },
  );
  return parseExecutePayload(adaptBackendSuccess(raw));
}

export async function persistCoachAthleteTrainingPlanDraft(
  entityId: string,
  athleteId: string,
  payload: {
    generatedPlannerCandidate: unknown;
    generationContextSnapshot: unknown;
    persistenceContext: {
      seasonCycleId: string;
      startDate: string;
      endDate: string;
      goalIds?: string[];
    };
  },
): Promise<CoachAthleteTrainingPlanPersistDraftResult> {
  const ids = assertIds(entityId, athleteId);
  const raw = await apiRequest(
    paths.entities.athleteTrainingPlanPersistDraft(ids.entityId, ids.athleteId),
    {
      method: "POST",
      body: JSON.stringify({
        generatedPlannerCandidate: payload.generatedPlannerCandidate,
        generationContextSnapshot: payload.generationContextSnapshot,
        persistenceContext: payload.persistenceContext,
      }),
    },
  );
  return parsePersistDraftPayload(adaptBackendSuccess(raw));
}

export async function fetchLatestCoachAthleteDomainDraft(
  entityId: string,
  athleteId: string,
  generationDomain: TrainingPlanGenerationDomain,
): Promise<CoachAthleteLatestDomainDraft> {
  const ids = assertIds(entityId, athleteId);
  const raw = await apiRequest(
    paths.entities.athleteTrainingPlanLatestDomainDraft(
      ids.entityId,
      ids.athleteId,
      generationDomain,
    ),
    {
      method: "GET",
      cache: "no-store",
    },
  );
  return parseLatestDomainDraftPayload(adaptBackendSuccess(raw));
}
