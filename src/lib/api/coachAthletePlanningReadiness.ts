import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import {
  apiRequest,
  isNormalizedApiError,
  type NormalizedApiError,
} from "@/lib/apiClient";
import type { GenerationDomain } from "@/lib/coachAuthority";

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

function readScalarText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return String(value);
  return null;
}

function serializeExactValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  try {
    const text = JSON.stringify(value);
    return typeof text === "string" && text.trim() !== "" ? text : null;
  } catch {
    return null;
  }
}

function readBlockerListKey(records: AnyRecord[], keys: string[]): string[] {
  for (const key of keys) {
    for (const record of records) {
      const value = record[key];
      if (!Array.isArray(value)) continue;
      const items = value
        .map((item) => {
          const scalar = readScalarText(item);
          if (scalar) return scalar;
          const nestedRecords = collectRecords(item);
          return readStringKey(nestedRecords, [
            "message",
            "reason",
            "description",
            "detail",
            "blocker",
            "label",
            "name",
            "code",
          ]) ?? serializeExactValue(item);
        })
        .filter((item): item is string => typeof item === "string" && item.trim() !== "")
        .filter((item, index, arr) => arr.indexOf(item) === index);
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
  isReady: boolean | null;
  canGenerate: boolean | null;
  blockers: string[];
  missingRequiredFields: string[];
};

export type CoachAthleteTrainingPlanWorkloadAssessment = {
  /** Optional; parsed when API includes athlete scoping */
  athleteId: string | null;
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

export type TrainingPlanGenerationDomain = GenerationDomain;
export type TrainingPlanStatus =
  | "AI_GENERATED"
  | "ASSISTANT_COACH_APPROVED"
  | "HEAD_COACH_APPROVED"
  | "ACTIVE";

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
  order: number | null;
  itemType: string | null;
  exerciseCatalogItemId: string | null;
  label: string | null;
  summary: string | null;
  sets: string | null;
  durationMinutes: number | null;
  reps: string | null;
  intensity: string | null;
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
  estimatedDailyCalories: number | null;
  targetCalorieMin: number | null;
  targetCalorieMax: number | null;
  calorieAdequacyStatus: string | null;
  estimatedCarbohydrateGrams: number | null;
  targetCarbohydrateMinGrams: number | null;
  targetCarbohydrateMaxGrams: number | null;
  estimatedProteinGrams: number | null;
  targetProteinMinGrams: number | null;
  targetProteinMaxGrams: number | null;
  estimatedFatGrams: number | null;
  targetFatMinGrams: number | null;
  targetFatMaxGrams: number | null;
  estimatedFiberGrams: number | null;
  targetFiberMinGrams: number | null;
  targetFiberMaxGrams: number | null;
  macroAdequacyStatus: string | null;
  sessions: CoachAthleteGeneratedDraftSession[];
};

export type CoachAthleteLatestDomainDraftRevision = {
  feedback: string | null;
  changeSummary: string[];
};

export type CoachAthleteLatestDomainDraft = {
  trainingPlanId: string | null;
  trainingPlanVersionId: string | null;
  versionNumber: number | null;
  status: string | null;
  source: string | null;
  revision: CoachAthleteLatestDomainDraftRevision | null;
  durationDays: number | null;
  daysCreated: number | null;
  sessionsCreated: number | null;
  itemsPersisted: number | null;
  days: CoachAthleteGeneratedDraftDay[];
  raw: unknown;
};

export type CoachPersistedTrainingPlanGoal = {
  goalId: string | null;
  goalName: string | null;
  goalType: string | null;
  goalCategory: string | null;
};

export type CoachPersistedTrainingPlan = {
  id: string;
  athleteId: string | null;
  entityId: string | null;
  seasonCycleId: string | null;
  name: string | null;
  description: string | null;
  status: string | null;
  planSource: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  goals: CoachPersistedTrainingPlanGoal[];
  raw: unknown;
};

export type CoachPersistedTrainingPlanVersion = {
  id: string;
  trainingPlanId: string;
  versionNumber: number | null;
  startDate: string | null;
  endDate: string | null;
  source: string | null;
  status: string | null;
  isActiveVersion: boolean | null;
  isApproved: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  raw: unknown;
};

export type GovernedTrainingPlanWorkflowAction =
  | "SUBMIT_REVIEW"
  | "HEAD_APPROVE"
  | "REQUEST_REVISION"
  | "RELEASE";

export type WeeklyJournalDomainStatus = "RELEASED" | "NOT_RELEASED";

export type CoachPersistedTrainingPlanDetailSection = {
  key: string;
  items: CoachAthleteGeneratedDraftItem[];
  raw: unknown;
};

export type CoachPersistedTrainingPlanDetailSession = {
  id: string;
  trainingDayId: string | null;
  title: string | null;
  description: string | null;
  plannedStartTime: string | null;
  plannedEndTime: string | null;
  plannedDurationMinutes: number | null;
  sessionOrder: number | null;
  sessionType: string | null;
  assignedCoachId: string | null;
  objective: string | null;
  intensity: string | null;
  sessionStructureSections: CoachPersistedTrainingPlanDetailSection[];
  sessionStructureRaw: unknown;
};

export type CoachPersistedTrainingPlanDetailDay = {
  id: string;
  date: string | null;
  dayIndex: number | null;
  weekNumber: number | null;
  isRestDay: boolean | null;
  plannedLoadMinutes: number | null;
  notes: string | null;
  trainingPlanVersionId: string | null;
  sessions: CoachPersistedTrainingPlanDetailSession[];
};

export type CoachPersistedTrainingPlanActiveDetail = {
  selectedVersionRule: string | null;
  generationDomain: string | null;
  allowedActions: GovernedTrainingPlanWorkflowAction[];
  plan: CoachPersistedTrainingPlan;
  version: CoachPersistedTrainingPlanVersion;
  days: CoachPersistedTrainingPlanDetailDay[];
  raw: unknown;
};

export type AthleteWeeklyPlanJournalDomainEntry = {
  status: WeeklyJournalDomainStatus;
  planId: string | null;
  versionId: string | null;
};

export type AthleteWeeklyPlanJournalDay = {
  date: string;
  dayNumber: number;
  skills: unknown[];
  nutrition: unknown[];
  sandc: unknown[];
};

export type AthleteWeeklyPlanJournal = {
  athleteId: string;
  entityId: string;
  weekStartDate: string;
  weekEndDate: string;
  domains: Record<TrainingPlanGenerationDomain, AthleteWeeklyPlanJournalDomainEntry>;
  days: AthleteWeeklyPlanJournalDay[];
  raw: unknown;
};

export type TrainingPlanRevisePayload = {
  trainingPlanId: string;
  versionId: string;
  coachFeedback: string;
};

export type TrainingPlanRequestRevisionResult = {
  coachFeedback: string | null;
  warnings: string[];
  authority: unknown;
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
    order: readNumberKey([record], ["order", "itemOrder", "orderIndex", "index"]),
    itemType: readStringKey([record], ["itemType"]),
    exerciseCatalogItemId: readStringKey([record], ["exerciseCatalogItemId"]),
    label: readStringKey([record], ["label", "name", "title"]),
    summary: readStringKey([record], ["summary", "description", "objective"]),
    sets: readStringLike(record.sets),
    durationMinutes: readNumberKey([record], ["durationMinutes"]),
    reps: readStringLike(record.reps),
    intensity: readStringKey([record], ["intensity"]),
    notes: readStringKey([record], ["notes"]),
  };
  return (
    item.order !== null ||
    item.itemType ||
    item.exerciseCatalogItemId ||
    item.label ||
    item.summary ||
    item.sets ||
    item.durationMinutes !== null ||
    item.reps ||
    item.intensity ||
    item.notes
  )
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
    .filter((item): item is CoachAthleteGeneratedDraftItem => item !== null)
    .sort(
      (left, right) =>
        (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER),
    );
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
    estimatedDailyCalories: readNumberKey([record], ["estimatedDailyCalories"]),
    targetCalorieMin: readNumberKey([record], ["targetCalorieMin"]),
    targetCalorieMax: readNumberKey([record], ["targetCalorieMax"]),
    calorieAdequacyStatus: readStringKey([record], ["calorieAdequacyStatus"]),
    estimatedCarbohydrateGrams: readNumberKey([record], ["estimatedCarbohydrateGrams"]),
    targetCarbohydrateMinGrams: readNumberKey([record], ["targetCarbohydrateMinGrams"]),
    targetCarbohydrateMaxGrams: readNumberKey([record], ["targetCarbohydrateMaxGrams"]),
    estimatedProteinGrams: readNumberKey([record], ["estimatedProteinGrams"]),
    targetProteinMinGrams: readNumberKey([record], ["targetProteinMinGrams"]),
    targetProteinMaxGrams: readNumberKey([record], ["targetProteinMaxGrams"]),
    estimatedFatGrams: readNumberKey([record], ["estimatedFatGrams"]),
    targetFatMinGrams: readNumberKey([record], ["targetFatMinGrams"]),
    targetFatMaxGrams: readNumberKey([record], ["targetFatMaxGrams"]),
    estimatedFiberGrams: readNumberKey([record], ["estimatedFiberGrams"]),
    targetFiberMinGrams: readNumberKey([record], ["targetFiberMinGrams"]),
    targetFiberMaxGrams: readNumberKey([record], ["targetFiberMaxGrams"]),
    macroAdequacyStatus: readStringKey([record], ["macroAdequacyStatus"]),
    sessions,
  };
  return (
    day.dayIndex !== null ||
    day.date ||
    day.dayFocus ||
    day.notes ||
    day.estimatedDailyCalories !== null ||
    day.targetCalorieMin !== null ||
    day.targetCalorieMax !== null ||
    day.calorieAdequacyStatus ||
    day.estimatedCarbohydrateGrams !== null ||
    day.targetCarbohydrateMinGrams !== null ||
    day.targetCarbohydrateMaxGrams !== null ||
    day.estimatedProteinGrams !== null ||
    day.targetProteinMinGrams !== null ||
    day.targetProteinMaxGrams !== null ||
    day.estimatedFatGrams !== null ||
    day.targetFatMinGrams !== null ||
    day.targetFatMaxGrams !== null ||
    day.estimatedFiberGrams !== null ||
    day.targetFiberMinGrams !== null ||
    day.targetFiberMaxGrams !== null ||
    day.macroAdequacyStatus ||
    day.sessions.length > 0
  )
    ? day
    : null;
}

function parseLatestDomainDraftRevision(
  value: unknown,
): CoachAthleteLatestDomainDraftRevision | null {
  const record = asRecord(value);
  if (!record) return null;
  const revision: CoachAthleteLatestDomainDraftRevision = {
    feedback: readStringKey([record], ["feedback", "coachFeedback"]),
    changeSummary: readStringListKey([record], ["changeSummary"]),
  };
  return revision.feedback || revision.changeSummary.length > 0 ? revision : null;
}

function parseLatestDomainDraftPayload(data: unknown): CoachAthleteLatestDomainDraft {
  const records = collectRecords(data);
  const days = readFirstArray(records, ["days"])
    .map(parseGeneratedDraftDay)
    .filter((day): day is CoachAthleteGeneratedDraftDay => day !== null)
    .sort((left, right) => (left.dayIndex ?? Number.MAX_SAFE_INTEGER) - (right.dayIndex ?? Number.MAX_SAFE_INTEGER));
  const revision =
    records
      .map((record) => parseLatestDomainDraftRevision(record.revision))
      .find((value) => value !== null) ?? null;

  return {
    trainingPlanId: readStringKey(records, ["trainingPlanId"]),
    trainingPlanVersionId: readStringKey(records, [
      "trainingPlanVersionId",
      "versionId",
    ]),
    versionNumber: readNumberKey(records, ["versionNumber"]),
    status: readStringKey(records, ["status"]),
    source: readStringKey(records, ["source"]),
    revision,
    durationDays: readNumberKey(records, ["durationDays"]),
    daysCreated: readNumberKey(records, ["daysCreated"]),
    sessionsCreated: readNumberKey(records, ["sessionsCreated"]),
    itemsPersisted: readNumberKey(records, ["itemsPersisted"]),
    days,
    raw: data,
  };
}

function assertPlanId(planId: string): string {
  const trimmed = planId.trim();
  if (trimmed === "") {
    throw {
      message: "training plan id is required",
      status: 400,
      code: "TRAINING_PLAN_ID_REQUIRED",
    } satisfies NormalizedApiError;
  }
  return trimmed;
}

function assertGenerationDomain(
  generationDomain: string,
): TrainingPlanGenerationDomain {
  const normalized = generationDomain.trim().toUpperCase();
  if (
    normalized === "SKILLS" ||
    normalized === "NUTRITION" ||
    normalized === "S_AND_C"
  ) {
    return normalized;
  }
  throw {
    message:
      "generationDomain is required for coach training plan detail requests",
    status: 400,
    code: "TRAINING_PLAN_GENERATION_DOMAIN_REQUIRED",
  } satisfies NormalizedApiError;
}

function assertVersionId(versionId: string): string {
  const trimmed = versionId.trim();
  if (trimmed === "") {
    throw {
      message: "training plan version id is required",
      status: 400,
      code: "TRAINING_PLAN_VERSION_ID_REQUIRED",
    } satisfies NormalizedApiError;
  }
  return trimmed;
}

function normalizeGovernedTrainingPlanWorkflowAction(
  value: string,
): GovernedTrainingPlanWorkflowAction | null {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (normalized === "SUBMIT_REVIEW" || normalized === "SUBMIT_FOR_REVIEW") {
    return "SUBMIT_REVIEW";
  }
  if (normalized === "HEAD_APPROVE") {
    return "HEAD_APPROVE";
  }
  if (normalized === "REQUEST_REVISION" || normalized === "REQUEST_REVIEW_REVISION") {
    return "REQUEST_REVISION";
  }
  if (normalized === "RELEASE" || normalized === "RELEASE_TO_ATHLETE") {
    return "RELEASE";
  }
  return null;
}

function parseGovernedTrainingPlanWorkflowActions(
  data: unknown,
): GovernedTrainingPlanWorkflowAction[] {
  const out = new Set<GovernedTrainingPlanWorkflowAction>();
  const records = collectRecords(data);

  function addAction(value: string): void {
    const normalized = normalizeGovernedTrainingPlanWorkflowAction(value);
    if (normalized) out.add(normalized);
  }

  for (const record of records) {
    for (const key of ["allowedActions", "availableActions", "actions"]) {
      const value = record[key];
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === "string") addAction(item);
        }
        continue;
      }
      const nested = asRecord(value);
      if (!nested) continue;
      for (const [nestedKey, nestedValue] of Object.entries(nested)) {
        if (nestedValue === true) addAction(nestedKey);
      }
    }

    if (record.canSubmitReview === true || record.submitReviewAllowed === true) {
      out.add("SUBMIT_REVIEW");
    }
    if (record.canHeadApprove === true || record.headApproveAllowed === true) {
      out.add("HEAD_APPROVE");
    }
    if (
      record.canRequestRevision === true ||
      record.requestRevisionAllowed === true ||
      record.canHeadCoachRequestRevision === true
    ) {
      out.add("REQUEST_REVISION");
    }
    if (
      record.canRelease === true ||
      record.releaseAllowed === true ||
      record.canReleaseToAthlete === true
    ) {
      out.add("RELEASE");
    }
  }

  return Array.from(out);
}

function parsePersistedTrainingPlanGoal(value: unknown): CoachPersistedTrainingPlanGoal | null {
  const record = asRecord(value);
  if (!record) return null;
  const goalRecord = asRecord(record.goal);
  return {
    goalId:
      readStringKey([record], ["goalId"]) ||
      readStringKey(goalRecord ? [goalRecord] : [], ["id"]),
    goalName:
      readStringKey(goalRecord ? [goalRecord] : [], ["goalName", "name"]) ||
      null,
    goalType: readStringKey(goalRecord ? [goalRecord] : [], ["goalType"]) || null,
    goalCategory:
      readStringKey(goalRecord ? [goalRecord] : [], ["goalCategory"]) || null,
  };
}

function parsePersistedTrainingPlanPayload(
  data: unknown,
  fallbackPlanId?: string,
): CoachPersistedTrainingPlan {
  const record = asRecord(data) ?? {};
  const id =
    readStringKey([record], ["id", "planId", "trainingPlanId"]) ||
    (fallbackPlanId?.trim() || null);
  if (!id) {
    throw {
      message: "Persisted training plan payload missing id",
      status: 500,
      code: "TRAINING_PLAN_PAYLOAD_INVALID",
      details: data,
    } satisfies NormalizedApiError;
  }
  const goals = Array.isArray(record.goals)
    ? record.goals
        .map(parsePersistedTrainingPlanGoal)
        .filter((goal): goal is CoachPersistedTrainingPlanGoal => goal !== null)
    : [];
  return {
    id,
    athleteId: readStringKey([record], ["athleteId"]),
    entityId: readStringKey([record], ["entityId"]),
    seasonCycleId: readStringKey([record], ["seasonCycleId"]),
    name: readStringKey([record], ["name"]),
    description: readStringKey([record], ["description"]),
    status: readStringKey([record], ["status"]),
    planSource: readStringKey([record], ["planSource", "source"]),
    createdAt: readStringKey([record], ["createdAt"]),
    updatedAt: readStringKey([record], ["updatedAt"]),
    goals,
    raw: data,
  };
}

function parsePersistedTrainingPlanVersion(
  value: unknown,
  fallbackPlanId?: string,
): CoachPersistedTrainingPlanVersion | null {
  const record = asRecord(value);
  if (!record) return null;
  const id = readStringKey([record], ["id", "versionId"]);
  const trainingPlanId =
    readStringKey([record], ["trainingPlanId", "planId"]) ||
    (fallbackPlanId?.trim() || null);
  if (!id || !trainingPlanId) return null;
  return {
    id,
    trainingPlanId,
    versionNumber: readNumberKey([record], ["versionNumber"]),
    startDate: readStringKey([record], ["startDate"]),
    endDate: readStringKey([record], ["endDate"]),
    source: readStringKey([record], ["source"]),
    status: readStringKey([record], ["status"]),
    isActiveVersion: readBooleanKey([record], ["isActiveVersion"]),
    isApproved: readBooleanKey([record], ["isApproved"]),
    createdAt: readStringKey([record], ["createdAt"]),
    updatedAt: readStringKey([record], ["updatedAt"]),
    raw: value,
  };
}

function parsePersistedTrainingPlanVersionsPayload(
  data: unknown,
): CoachPersistedTrainingPlanVersion[] {
  if (!Array.isArray(data)) return [];
  return data.reduce<CoachPersistedTrainingPlanVersion[]>((acc, item) => {
    const parsed = parsePersistedTrainingPlanVersion(item);
    if (parsed !== null) acc.push(parsed);
    return acc;
  }, []);
}

function parsePersistedTrainingPlanDetailSection(
  key: string,
  value: unknown,
): CoachPersistedTrainingPlanDetailSection | null {
  const record = asRecord(value);
  if (!record) return null;
  const items = Array.isArray(record.items)
    ? record.items
        .map(parseGeneratedDraftItem)
        .filter((item): item is CoachAthleteGeneratedDraftItem => item !== null)
    : [];
  if (items.length === 0) return null;
  return { key, items, raw: value };
}

function parsePersistedTrainingPlanDetailSession(
  value: unknown,
): CoachPersistedTrainingPlanDetailSession | null {
  const record = asRecord(value);
  if (!record) return null;
  const id = readStringKey([record], ["id"]);
  if (!id) return null;
  const sessionStructure = asRecord(record.sessionStructure);
  const candidateMetadata = asRecord(sessionStructure?.candidateMetadata);
  const sessionStructureSections = sessionStructure
    ? Object.entries(sessionStructure)
        .filter(([key]) => key !== "candidateMetadata")
        .map(([key, nextValue]) => parsePersistedTrainingPlanDetailSection(key, nextValue))
        .filter((section): section is CoachPersistedTrainingPlanDetailSection => section !== null)
    : [];
  return {
    id,
    trainingDayId: readStringKey([record], ["trainingDayId"]),
    title: readStringKey([record], ["name", "title"]),
    description: readStringKey([record], ["description"]),
    plannedStartTime: readStringKey([record], ["plannedStartTime"]),
    plannedEndTime: readStringKey([record], ["plannedEndTime"]),
    plannedDurationMinutes: readNumberKey([record], ["plannedDurationMinutes"]),
    sessionOrder: readNumberKey([record], ["sessionOrder", "order"]),
    sessionType: readStringKey([record], ["sessionType"]),
    assignedCoachId: readStringKey([record], ["assignedCoachId"]),
    objective: readStringKey(candidateMetadata ? [candidateMetadata] : [], ["objective"]),
    intensity: readStringKey(candidateMetadata ? [candidateMetadata] : [], ["intensity"]),
    sessionStructureSections,
    sessionStructureRaw: record.sessionStructure,
  };
}

function parsePersistedTrainingPlanDetailDay(
  value: unknown,
): CoachPersistedTrainingPlanDetailDay | null {
  const record = asRecord(value);
  if (!record) return null;
  const id = readStringKey([record], ["id"]);
  if (!id) return null;
  const sessions = Array.isArray(record.sessions)
    ? record.sessions
        .map(parsePersistedTrainingPlanDetailSession)
        .filter((session): session is CoachPersistedTrainingPlanDetailSession => session !== null)
    : [];
  return {
    id,
    date: readStringKey([record], ["date"]),
    dayIndex: readNumberKey([record], ["dayIndex"]),
    weekNumber: readNumberKey([record], ["weekNumber"]),
    isRestDay: readBooleanKey([record], ["isRestDay"]),
    plannedLoadMinutes: readNumberKey([record], ["plannedLoadMinutes"]),
    notes: readStringKey([record], ["notes"]),
    trainingPlanVersionId: readStringKey([record], ["trainingPlanVersionId"]),
    sessions,
  };
}

function parsePersistedTrainingPlanActiveDetailPayload(
  data: unknown,
  fallbackPlanId?: string,
): CoachPersistedTrainingPlanActiveDetail {
  const root = asRecord(data) ?? {};
  const nested = asRecord(root.data);
  const record = nested ?? root;
  const plan = parsePersistedTrainingPlanPayload(record.plan, fallbackPlanId);
  const version = parsePersistedTrainingPlanVersion(record.version, plan.id);
  if (version === null) {
    throw {
      message: "Persisted training plan detail payload missing version",
      status: 500,
      code: "TRAINING_PLAN_DETAIL_PAYLOAD_INVALID",
      details: data,
    } satisfies NormalizedApiError;
  }
  return {
    selectedVersionRule: readStringKey([record], ["selectedVersionRule"]),
    generationDomain: readStringKey([record], ["generationDomain"]),
    allowedActions: parseGovernedTrainingPlanWorkflowActions(data),
    plan,
    version: {
      ...version,
      status: version.status ?? plan.status,
    },
    days: Array.isArray(record.days)
      ? record.days
          .map(parsePersistedTrainingPlanDetailDay)
          .filter((day): day is CoachPersistedTrainingPlanDetailDay => day !== null)
      : [],
    raw: data,
  };
}

function normalizeWeeklyJournalDomainStatus(
  value: unknown,
): WeeklyJournalDomainStatus {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";
  return normalized === "RELEASED" ? "RELEASED" : "NOT_RELEASED";
}

function parseWeeklyJournalDomainEntry(value: unknown): AthleteWeeklyPlanJournalDomainEntry {
  const record = asRecord(value) ?? {};
  return {
    status: normalizeWeeklyJournalDomainStatus(record.status),
    planId: readStringLike(record.planId),
    versionId: readStringLike(record.versionId),
  };
}

function parseWeeklyJournalDay(value: unknown): AthleteWeeklyPlanJournalDay | null {
  const record = asRecord(value);
  if (!record) return null;
  const date = readStringLike(record.date);
  const dayNumber = readNumberKey([record], ["dayNumber"]);
  if (date === null || dayNumber === null) return null;
  return {
    date,
    dayNumber,
    skills: Array.isArray(record.skills) ? record.skills : [],
    nutrition: Array.isArray(record.nutrition) ? record.nutrition : [],
    sandc: Array.isArray(record.sandc) ? record.sandc : [],
  };
}

function parseAthleteWeeklyPlanJournalPayload(data: unknown): AthleteWeeklyPlanJournal {
  const root = asRecord(data) ?? {};
  const record = asRecord(root.data) ?? root;
  const domainsRecord = asRecord(record.domains) ?? {};
  return {
    athleteId: readStringLike(record.athleteId) ?? "",
    entityId: readStringLike(record.entityId) ?? "",
    weekStartDate: readStringLike(record.weekStartDate) ?? "",
    weekEndDate: readStringLike(record.weekEndDate) ?? "",
    domains: {
      SKILLS: parseWeeklyJournalDomainEntry(domainsRecord.SKILLS),
      NUTRITION: parseWeeklyJournalDomainEntry(domainsRecord.NUTRITION),
      S_AND_C: parseWeeklyJournalDomainEntry(domainsRecord.S_AND_C),
    },
    days: Array.isArray(record.days)
      ? record.days
          .map(parseWeeklyJournalDay)
          .filter((day): day is AthleteWeeklyPlanJournalDay => day !== null)
      : [],
    raw: data,
  };
}

function parseTrainingPlanRequestRevisionPayload(
  data: unknown,
): TrainingPlanRequestRevisionResult {
  const records = collectRecords(data);
  const requestRevisionRecord = records
    .map((record) => asRecord(record.requestRevision))
    .find((record) => record !== null) ?? null;
  return {
    coachFeedback: requestRevisionRecord
      ? readStringKey([requestRevisionRecord], ["coachFeedback", "feedback"])
      : null,
    warnings: readStringListKey(records, ["warnings"]),
    authority:
      records.find((record) => "authority" in record)?.authority ??
      asRecord(data)?.authority ??
      null,
    raw: data,
  };
}

function assertRevisePayload(
  payload: TrainingPlanRevisePayload,
  code: string,
): TrainingPlanRevisePayload {
  const trainingPlanId = payload.trainingPlanId.trim();
  const versionId = payload.versionId.trim();
  const coachFeedback = payload.coachFeedback.trim();
  if (trainingPlanId === "" || versionId === "" || coachFeedback === "") {
    throw {
      message: "trainingPlanId, versionId, and coachFeedback are required",
      status: 400,
      code,
    } satisfies NormalizedApiError;
  }
  return { trainingPlanId, versionId, coachFeedback };
}

export function parseReadinessPayload(data: unknown): CoachAthleteTrainingPlanReadiness {
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
    isReady: readBooleanKey(records, ["isReady", "ready"]),
    canGenerate: readBooleanKey(records, ["canGenerate"]),
    blockers: readBlockerListKey(records, ["blockers"]),
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
    "athleteId",
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
    athleteId: readStringKey(records, ["athleteId"]),
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
  options?: {
    generationDomain?: TrainingPlanGenerationDomain;
    seasonCycleId?: string | null;
  },
): Promise<CoachAthleteTrainingPlanReadiness> {
  const ids = assertIds(entityId, athleteId);
  const seasonCycleId = options?.seasonCycleId?.trim() || null;
  const raw = await apiRequest(
    paths.entities.athleteTrainingPlanReadiness(ids.entityId, ids.athleteId, {
      generationDomain: options?.generationDomain,
      seasonCycleId,
    }),
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

/**
 * Persisted workload assessment snapshot (does not compute a new assessment).
 * 404 ⇒ no persisted run yet (`null`).
 */
export async function fetchCoachAthleteTrainingPlanWorkloadAssessmentLatest(
  entityId: string,
  athleteId: string,
): Promise<CoachAthleteTrainingPlanWorkloadAssessment | null> {
  const ids = assertIds(entityId, athleteId);
  try {
    const raw = await apiRequest(
      paths.entities.athleteTrainingPlanWorkloadAssessmentLatest(
        ids.entityId,
        ids.athleteId,
      ),
      {
        method: "GET",
        cache: "no-store",
      },
    );
    return parseWorkloadAssessmentPayload(adaptBackendSuccess(raw));
  } catch (e: unknown) {
    if (isNormalizedApiError(e) && e.status === 404) {
      return null;
    }
    throw e;
  }
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

export async function fetchLatestDomainDraft(
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
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.debug("[latest-domain-draft raw]", raw);
  }
  return parseLatestDomainDraftPayload(raw);
}

export async function fetchLatestCoachAthleteDomainDraft(
  entityId: string,
  athleteId: string,
  generationDomain: TrainingPlanGenerationDomain,
): Promise<CoachAthleteLatestDomainDraft> {
  return fetchLatestDomainDraft(entityId, athleteId, generationDomain);
}

export async function fetchPersistedTrainingPlanById(
  planId: string,
): Promise<CoachPersistedTrainingPlan> {
  const id = assertPlanId(planId);
  const raw = await apiRequest(paths.trainingPlans.byId(id), {
    method: "GET",
    cache: "no-store",
  });
  return parsePersistedTrainingPlanPayload(adaptBackendSuccess(raw));
}

export async function fetchPersistedTrainingPlanVersions(
  planId: string,
): Promise<CoachPersistedTrainingPlanVersion[]> {
  const id = assertPlanId(planId);
  const raw = await apiRequest(paths.trainingPlanManagement.versions(id), {
    method: "GET",
    cache: "no-store",
  });
  return parsePersistedTrainingPlanVersionsPayload(adaptBackendSuccess(raw));
}

export async function fetchPersistedTrainingPlanActiveDetail(
  planId: string,
  generationDomain?: TrainingPlanGenerationDomain,
): Promise<CoachPersistedTrainingPlanActiveDetail> {
  const id = assertPlanId(planId);
  const raw = await apiRequest(paths.trainingPlanManagement.activeDetail(id, generationDomain), {
    method: "GET",
    cache: "no-store",
  });
  if (typeof window !== "undefined") {
    console.debug("persistedActiveDetailRaw", raw);
  }
  const normalized = parsePersistedTrainingPlanActiveDetailPayload(raw, id);
  if (typeof window !== "undefined") {
    console.debug("normalizedPersistedPlan", normalized);
  }
  return normalized;
}

export async function submitTrainingPlanReview(
  entityId: string,
  athleteId: string,
  planId: string,
  versionId: string,
  generationDomain: TrainingPlanGenerationDomain,
): Promise<void> {
  const ids = assertIds(entityId, athleteId);
  const trainingPlanId = assertPlanId(planId);
  const trainingPlanVersionId = assertVersionId(versionId);
  const domain = assertGenerationDomain(generationDomain);
  const raw = await apiRequest(
    paths.entities.athleteTrainingPlanSubmitReview(
      ids.entityId,
      ids.athleteId,
      trainingPlanId,
      trainingPlanVersionId,
    ),
    {
      method: "POST",
      body: JSON.stringify({ generationDomain: domain }),
    },
  );
  adaptBackendSuccess(raw);
}

export async function submitTrainingPlanVersionForReview(
  entityId: string,
  athleteId: string,
  planId: string,
  versionId: string,
  generationDomain: TrainingPlanGenerationDomain,
): Promise<void> {
  await submitTrainingPlanReview(entityId, athleteId, planId, versionId, generationDomain);
}

export async function headApproveTrainingPlan(
  entityId: string,
  athleteId: string,
  planId: string,
  versionId: string,
  generationDomain: TrainingPlanGenerationDomain,
): Promise<void> {
  const ids = assertIds(entityId, athleteId);
  const trainingPlanId = assertPlanId(planId);
  const trainingPlanVersionId = assertVersionId(versionId);
  const domain = assertGenerationDomain(generationDomain);
  const raw = await apiRequest(
    paths.entities.athleteTrainingPlanHeadApprove(
      ids.entityId,
      ids.athleteId,
      trainingPlanId,
      trainingPlanVersionId,
    ),
    {
      method: "POST",
      body: JSON.stringify({ generationDomain: domain }),
    },
  );
  adaptBackendSuccess(raw);
}

export async function headApproveTrainingPlanVersion(
  entityId: string,
  athleteId: string,
  planId: string,
  versionId: string,
  generationDomain: TrainingPlanGenerationDomain,
): Promise<void> {
  await headApproveTrainingPlan(entityId, athleteId, planId, versionId, generationDomain);
}

export async function requestTrainingPlanRevision(
  entityId: string,
  athleteId: string,
  planId: string,
  versionId: string,
  generationDomain: TrainingPlanGenerationDomain,
  coachFeedback: string,
): Promise<TrainingPlanRequestRevisionResult> {
  const ids = assertIds(entityId, athleteId);
  const trainingPlanId = assertPlanId(planId);
  const trainingPlanVersionId = assertVersionId(versionId);
  const domain = assertGenerationDomain(generationDomain);
  const feedback = coachFeedback.trim();
  if (feedback === "") {
    throw {
      message: "coachFeedback is required",
      status: 400,
      code: "TRAINING_PLAN_REQUEST_REVISION_FEEDBACK_REQUIRED",
    } satisfies NormalizedApiError;
  }
  const raw = await apiRequest(
    paths.entities.athleteTrainingPlanRequestRevision(
      ids.entityId,
      ids.athleteId,
      trainingPlanId,
      trainingPlanVersionId,
    ),
    {
      method: "POST",
      body: JSON.stringify({
        generationDomain: domain,
        coachFeedback: feedback,
      }),
    },
  );
  return parseTrainingPlanRequestRevisionPayload(adaptBackendSuccess(raw));
}

export async function releaseTrainingPlanToAthlete(
  entityId: string,
  athleteId: string,
  planId: string,
  versionId: string,
  generationDomain: TrainingPlanGenerationDomain,
): Promise<void> {
  const ids = assertIds(entityId, athleteId);
  const trainingPlanId = assertPlanId(planId);
  const trainingPlanVersionId = assertVersionId(versionId);
  const domain = assertGenerationDomain(generationDomain);
  const raw = await apiRequest(
    paths.entities.athleteTrainingPlanRelease(
      ids.entityId,
      ids.athleteId,
      trainingPlanId,
      trainingPlanVersionId,
    ),
    {
      method: "POST",
      body: JSON.stringify({ generationDomain: domain }),
    },
  );
  adaptBackendSuccess(raw);
}

export async function releaseTrainingPlanVersionToAthlete(
  entityId: string,
  athleteId: string,
  planId: string,
  versionId: string,
  generationDomain: TrainingPlanGenerationDomain,
): Promise<void> {
  await releaseTrainingPlanToAthlete(entityId, athleteId, planId, versionId, generationDomain);
}

export async function reviseSkillsPlan(
  entityId: string,
  athleteId: string,
  payload: TrainingPlanRevisePayload,
): Promise<void> {
  const ids = assertIds(entityId, athleteId);
  const normalizedPayload = assertRevisePayload(
    payload,
    "TRAINING_PLAN_SKILLS_REVISE_INPUT_REQUIRED",
  );
  const raw = await apiRequest(
    paths.entities.athleteTrainingPlanSkillsRevise(ids.entityId, ids.athleteId),
    {
      method: "POST",
      timeoutMs: TRAINING_PLAN_EXECUTE_TIMEOUT_MS,
      body: JSON.stringify(normalizedPayload),
    },
  );
  void raw;
}

export async function reviseCoachAthleteSkillsTrainingPlan(
  entityId: string,
  athleteId: string,
  payload: TrainingPlanRevisePayload,
): Promise<void> {
  await reviseSkillsPlan(entityId, athleteId, payload);
}

export async function reviseNutritionPlan(
  entityId: string,
  athleteId: string,
  payload: TrainingPlanRevisePayload,
): Promise<void> {
  const ids = assertIds(entityId, athleteId);
  const normalizedPayload = assertRevisePayload(
    payload,
    "TRAINING_PLAN_NUTRITION_REVISE_INPUT_REQUIRED",
  );
  const raw = await apiRequest(
    paths.entities.athleteTrainingPlanNutritionRevise(ids.entityId, ids.athleteId),
    {
      method: "POST",
      timeoutMs: TRAINING_PLAN_EXECUTE_TIMEOUT_MS,
      body: JSON.stringify(normalizedPayload),
    },
  );
  void raw;
}

export async function reviseSandcPlan(
  entityId: string,
  athleteId: string,
  payload: TrainingPlanRevisePayload,
): Promise<void> {
  const ids = assertIds(entityId, athleteId);
  const normalizedPayload = assertRevisePayload(
    payload,
    "TRAINING_PLAN_SANDC_REVISE_INPUT_REQUIRED",
  );
  const raw = await apiRequest(
    paths.entities.athleteTrainingPlanSandcRevise(ids.entityId, ids.athleteId),
    {
      method: "POST",
      timeoutMs: TRAINING_PLAN_EXECUTE_TIMEOUT_MS,
      body: JSON.stringify(normalizedPayload),
    },
  );
  void raw;
}

export async function reviseCoachAthleteSandCTrainingPlan(
  entityId: string,
  athleteId: string,
  payload: TrainingPlanRevisePayload,
): Promise<void> {
  await reviseSandcPlan(entityId, athleteId, payload);
}

export async function fetchAthleteWeeklyPlanJournal(
  entityId: string,
  athleteId: string,
): Promise<AthleteWeeklyPlanJournal> {
  const ids = assertIds(entityId, athleteId);
  const raw = await apiRequest(
    paths.entities.athleteWeeklyPlanJournal(ids.entityId, ids.athleteId),
    {
      method: "GET",
      cache: "no-store",
    },
  );
  return parseAthleteWeeklyPlanJournalPayload(raw);
}
