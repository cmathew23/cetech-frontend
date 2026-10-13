"use client";

import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest } from "@/lib/apiClient";

const SPORT_METRICS_BASKETBALL_TIMEOUT_MS = 240_000;

export type BasketballMeasurementEntryMode = "INDIVIDUAL" | "CUMULATIVE";

export type PostBasketballSportMetricRecordPayload = {
  trainingPlanVersionId: string;
  plannedSessionId: string;
  skillCode: string;
  occurredAt: string;
  metricType: "DRILL_RESULT";
  entryMode: BasketballMeasurementEntryMode;
  valueJson: Record<string, unknown>;
  goalId?: string;
  plannedSkillItemOrder?: number;
  notes?: string;
};

function assertJsonObject(
  value: unknown,
  fieldName: string,
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw {
      message: `${fieldName} must be a JSON object.`,
      status: 400,
      code: "SPORT_METRICS_BASKETBALL_RECORD_INVALID",
    };
  }
}

function measurementResultValueJson(valueJson: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(valueJson)) {
    if (key === "entryMode" || key === "notes") continue;
    fields[key] = value;
  }
  const nested = fields.result;
  if (
    Object.keys(fields).length === 1 &&
    nested &&
    typeof nested === "object" &&
    !Array.isArray(nested)
  ) {
    return { result: nested };
  }
  return { result: fields };
}

export function buildBasketballSportMetricRecordRequestBody(
  payload: PostBasketballSportMetricRecordPayload,
): Record<string, unknown> {
  const trainingPlanVersionId = payload.trainingPlanVersionId.trim();
  const plannedSessionId = payload.plannedSessionId.trim();
  const skillCode = payload.skillCode.trim();
  const occurredAt = payload.occurredAt.trim();
  const goalId = payload.goalId?.trim() ?? "";
  const notes = payload.notes?.trim() ?? "";

  if (
    trainingPlanVersionId === "" ||
    plannedSessionId === "" ||
    skillCode === "" ||
    occurredAt === ""
  ) {
    throw {
      message: "Training plan version, planned session, skill code, and occurred at are required.",
      status: 400,
      code: "SPORT_METRICS_BASKETBALL_RECORD_INVALID",
    };
  }

  if (payload.metricType !== "DRILL_RESULT") {
    throw {
      message: "metricType must be DRILL_RESULT.",
      status: 400,
      code: "SPORT_METRICS_BASKETBALL_RECORD_INVALID",
    };
  }

  if (payload.entryMode !== "INDIVIDUAL" && payload.entryMode !== "CUMULATIVE") {
    throw {
      message: "entryMode must be INDIVIDUAL or CUMULATIVE.",
      status: 400,
      code: "SPORT_METRICS_BASKETBALL_RECORD_INVALID",
    };
  }

  assertJsonObject(payload.valueJson, "valueJson");

  const requestBody: Record<string, unknown> = {
    trainingPlanVersionId,
    plannedSessionId,
    skillCode,
    occurredAt,
    metricType: "DRILL_RESULT",
    entryMode: payload.entryMode,
    valueJson: measurementResultValueJson(payload.valueJson),
  };

  if (goalId !== "") requestBody.goalId = goalId;
  if (notes !== "") requestBody.notes = notes;
  if (
    payload.plannedSkillItemOrder !== undefined &&
    Number.isInteger(payload.plannedSkillItemOrder) &&
    payload.plannedSkillItemOrder >= 1
  ) {
    requestBody.plannedSkillItemOrder = payload.plannedSkillItemOrder;
  }

  return requestBody;
}

export async function postBasketballSportMetricRecord(
  entityId: string,
  athleteId: string,
  payload: PostBasketballSportMetricRecordPayload,
): Promise<unknown> {
  const resolvedEntityId = entityId.trim();
  const resolvedAthleteId = athleteId.trim();

  if (resolvedEntityId === "" || resolvedAthleteId === "") {
    throw {
      message: "Entity and athlete identifiers are required.",
      status: 400,
      code: "SPORT_METRICS_BASKETBALL_IDS_REQUIRED",
    };
  }

  return apiRequest(
    paths.entities.athleteSportMetricsBasketballRecords(
      resolvedEntityId,
      resolvedAthleteId,
    ),
    {
      method: "POST",
      body: JSON.stringify(buildBasketballSportMetricRecordRequestBody(payload)),
      timeoutMs: SPORT_METRICS_BASKETBALL_TIMEOUT_MS,
    },
  );
}

export type BasketballPrimaryMetric = {
  key: string | null;
  unit: string | null;
  direction: string | null;
};

export type BasketballGoalSnapshot = {
  goalName: string | null;
  taxonomyAreaKey: string | null;
  targetValue: number | null;
  primaryMetric: BasketballPrimaryMetric | null;
};

export type BasketballWeeklyActual = {
  metricKey: string | null;
  unit: string | null;
  direction: string | null;
  value: number | null;
  attempts: number | null;
  successes: number | null;
  total: number | null;
  recordCount: number | null;
};

export type BasketballTargetComparison = {
  targetValue: number | null;
  actualValue: number | null;
  direction: string | null;
  targetMet: boolean | null;
};

export type BasketballGoalEvidence = {
  goalId: string | null;
  goal: BasketballGoalSnapshot;
  weeklyActual: BasketballWeeklyActual | null;
  targetComparison: BasketballTargetComparison | null;
  status: string | null;
};

export type BasketballExercisePerformance = {
  exerciseId: string | null;
  skillCode: string | null;
  exerciseName: string | null;
  taxonomyAreaKey: string | null;
  goalId: string | null;
  metricKey: string | null;
  metricName: string | null;
  unit: string | null;
  direction: string | null;
  currentActual: number | null;
  previousActual: number | null;
  trendScore: number | null;
  trendDirection: string | null;
};

export type BasketballTaxonomyScore = {
  taxonomyAreaKey: string | null;
  normalizedScore: number | null;
  scoreOutOf100: number | null;
  direction: string | null;
};

export type BasketballCompetitionTaxonomyScore = {
  taxonomyAreaKey: string | null;
  taxonomyCompetitionScore: number | null;
};

export type BasketballCoachPracticeRating = {
  taxonomyAreaKey: string | null;
  rating: number | null;
  coachRatingNormalized: number | null;
  coachRatingScoreOutOf100: number | null;
  planStartDate: string | null;
  planEndDate: string | null;
};

export type BasketballWeeklySummary = {
  sport: string | null;
  trainingPlanId: string | null;
  trainingPlanVersionId: string | null;
  seasonCycleId: string | null;
  seasonYear: number | null;
  weekStartDate: string | null;
  weekEndDate: string | null;
  visibility: string | null;
  goalEvidence: BasketballGoalEvidence[];
  exerciseTrends: BasketballExercisePerformance[];
  taxonomyScores: BasketballTaxonomyScore[];
  coachPracticeRatings: BasketballCoachPracticeRating[];
  practiceNormalizedScore: number | null;
  practiceScoreOutOf100: number | null;
  coachPracticeNormalized: number | null;
  coachPracticeScoreOutOf100: number | null;
  practiceSideNormalized: number | null;
  practiceSideScoreOutOf100: number | null;
  competitionPerformance: number | null;
  competitionTaxonomyScores: BasketballCompetitionTaxonomyScore[];
  overallPerformance: number | null;
};

export type BasketballWeeklyHistoryItem = {
  id: string | null;
  athleteId: string | null;
  weekStart: string | null;
  weekEnd: string | null;
  trainingPlanId: string | null;
  trainingPlanVersionId: string | null;
  seasonCycleId: string | null;
  performance: BasketballWeeklySummary | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function readNullableFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function readReturnedNumber(value: unknown): number | null {
  const numeric = readNullableFiniteNumber(value);
  if (numeric !== null) return numeric;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function readNullableBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function mapRecords<T>(value: unknown, parse: (item: unknown) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = parse(item);
    return parsed === null ? [] : [parsed];
  });
}

function parsePrimaryMetric(value: unknown): BasketballPrimaryMetric | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    key: readNullableString(record.key),
    unit: readNullableString(record.unit),
    direction: readNullableString(record.direction),
  };
}

function parseGoalSnapshot(value: unknown): BasketballGoalSnapshot {
  const record = asRecord(value);
  return {
    goalName: readNullableString(record?.goalName),
    taxonomyAreaKey: readNullableString(record?.taxonomyAreaKey),
    targetValue: readNullableFiniteNumber(record?.targetValue),
    primaryMetric: parsePrimaryMetric(record?.primaryMetric),
  };
}

function parseWeeklyActual(value: unknown): BasketballWeeklyActual | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    metricKey: readNullableString(record.metricKey),
    unit: readNullableString(record.unit),
    direction: readNullableString(record.direction),
    value: readNullableFiniteNumber(record.value),
    attempts: readNullableFiniteNumber(record.attempts),
    successes: readNullableFiniteNumber(record.successes),
    total: readNullableFiniteNumber(record.total),
    recordCount: readNullableFiniteNumber(record.recordCount),
  };
}

function parseTargetComparison(value: unknown): BasketballTargetComparison | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    targetValue: readNullableFiniteNumber(record.targetValue),
    actualValue: readNullableFiniteNumber(record.actualValue),
    direction: readNullableString(record.direction),
    targetMet: readNullableBoolean(record.targetMet),
  };
}

function parseGoalEvidence(value: unknown): BasketballGoalEvidence | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    goalId: readNullableString(record.goalId),
    goal: parseGoalSnapshot(record.goal),
    weeklyActual: parseWeeklyActual(record.weeklyActual),
    targetComparison: parseTargetComparison(record.targetComparison),
    status: readNullableString(record.status),
  };
}

function parseExercisePerformance(value: unknown): BasketballExercisePerformance | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    exerciseId: readNullableString(record.exerciseId),
    skillCode: readNullableString(record.skillCode),
    exerciseName: readNullableString(record.exerciseName),
    taxonomyAreaKey: readNullableString(record.taxonomyAreaKey),
    goalId: readNullableString(record.goalId),
    metricKey: readNullableString(record.metricKey),
    metricName: readNullableString(record.metricName),
    unit: readNullableString(record.unit),
    direction: readNullableString(record.direction),
    currentActual: readNullableFiniteNumber(record.currentActual),
    previousActual: readNullableFiniteNumber(record.previousActual),
    trendScore: readNullableFiniteNumber(record.trendScore),
    trendDirection: readNullableString(record.trendDirection),
  };
}

function parseTaxonomyScore(value: unknown): BasketballTaxonomyScore | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    taxonomyAreaKey: readNullableString(record.taxonomyAreaKey),
    normalizedScore: readNullableFiniteNumber(record.normalizedScore),
    scoreOutOf100: readNullableFiniteNumber(record.scoreOutOf100),
    direction: readNullableString(record.direction),
  };
}

function parseCoachPracticeRating(
  value: unknown,
): BasketballCoachPracticeRating | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    taxonomyAreaKey: readNullableString(record.taxonomyAreaKey),
    rating: readNullableFiniteNumber(record.rating),
    coachRatingNormalized: readNullableFiniteNumber(record.coachRatingNormalized),
    coachRatingScoreOutOf100: readNullableFiniteNumber(record.coachRatingScoreOutOf100),
    planStartDate: readNullableString(record.planStartDate),
    planEndDate: readNullableString(record.planEndDate),
  };
}

function parseCompetitionTaxonomyScore(
  value: unknown,
): BasketballCompetitionTaxonomyScore | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    taxonomyAreaKey: readNullableString(record.taxonomyAreaKey),
    taxonomyCompetitionScore: readNullableFiniteNumber(record.taxonomyCompetitionScore),
  };
}

function unwrapBasketballWeeklySummary(payload: unknown): Record<string, unknown> {
  const unwrapped = adaptBackendSuccess(payload);
  const record = asRecord(unwrapped);
  if (!record) {
    throw {
      message: "Basketball weekly summary response must be a JSON object.",
      status: 500,
      code: "SPORT_METRICS_BASKETBALL_WEEKLY_SUMMARY_INVALID",
      details: payload,
    };
  }
  return record;
}

export function parseSportMetricsBasketballWeeklySummaryPayload(
  payload: unknown,
): BasketballWeeklySummary {
  const record = unwrapBasketballWeeklySummary(payload);
  return {
    sport: readNullableString(record.sport),
    trainingPlanId: readNullableString(record.trainingPlanId),
    trainingPlanVersionId: readNullableString(record.trainingPlanVersionId),
    seasonCycleId: readNullableString(record.seasonCycleId),
    seasonYear: readNullableFiniteNumber(record.seasonYear),
    weekStartDate: readNullableString(record.weekStartDate),
    weekEndDate: readNullableString(record.weekEndDate),
    visibility: readNullableString(record.visibility),
    goalEvidence: mapRecords(record.goalEvidence, parseGoalEvidence),
    exerciseTrends: mapRecords(record.exerciseTrends, parseExercisePerformance),
    taxonomyScores: mapRecords(record.taxonomyScores, parseTaxonomyScore),
    coachPracticeRatings: mapRecords(record.coachPracticeRatings, parseCoachPracticeRating),
    practiceNormalizedScore: readNullableFiniteNumber(record.practiceNormalizedScore),
    practiceScoreOutOf100: readNullableFiniteNumber(record.practiceScoreOutOf100),
    coachPracticeNormalized: readNullableFiniteNumber(record.coachPracticeNormalized),
    coachPracticeScoreOutOf100: readNullableFiniteNumber(record.coachPracticeScoreOutOf100),
    practiceSideNormalized: readNullableFiniteNumber(record.practiceSideNormalized),
    practiceSideScoreOutOf100: readNullableFiniteNumber(record.practiceSideScoreOutOf100),
    competitionPerformance: readNullableFiniteNumber(record.competitionPerformance),
    competitionTaxonomyScores: mapRecords(
      record.competitionTaxonomyScores,
      parseCompetitionTaxonomyScore,
    ),
    overallPerformance: readNullableFiniteNumber(record.overallPerformance),
  };
}

export async function fetchSportMetricsBasketballWeeklySummary(params: {
  entityId: string;
  athleteId: string;
  trainingPlanVersionId: string;
}): Promise<BasketballWeeklySummary> {
  const entityId = params.entityId.trim();
  const athleteId = params.athleteId.trim();
  const trainingPlanVersionId = params.trainingPlanVersionId.trim();

  if (entityId === "" || athleteId === "" || trainingPlanVersionId === "") {
    throw {
      message: "Entity, athlete, and training plan version identifiers are required.",
      status: 400,
      code: "SPORT_METRICS_BASKETBALL_IDS_REQUIRED",
    };
  }

  const raw = await apiRequest(
    paths.entities.athleteSportMetricsBasketballWeeklySummary(entityId, athleteId, {
      trainingPlanVersionId,
    }),
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: SPORT_METRICS_BASKETBALL_TIMEOUT_MS,
    },
  );

  return parseSportMetricsBasketballWeeklySummaryPayload(raw);
}

function parseHistoryList(payload: unknown): unknown[] {
  const adapted = adaptBackendSuccess(payload);
  return Array.isArray(adapted) ? adapted : [];
}

export function parseSportMetricsBasketballWeeklySummaryHistoryPayload(
  payload: unknown,
): BasketballWeeklyHistoryItem[] {
  return parseHistoryList(payload).flatMap((value) => {
    const record = asRecord(value);
    if (!record) return [];
    const performanceRecord = asRecord(record.performance);
    return [
      {
        id: readNullableString(record.id),
        athleteId: readNullableString(record.athleteId),
        weekStart: readNullableString(record.weekStart),
        weekEnd: readNullableString(record.weekEnd),
        trainingPlanId: readNullableString(record.trainingPlanId),
        trainingPlanVersionId: readNullableString(record.trainingPlanVersionId),
        seasonCycleId: readNullableString(record.seasonCycleId),
        performance: performanceRecord
          ? parseSportMetricsBasketballWeeklySummaryPayload({
              ...performanceRecord,
              trainingPlanId: record.trainingPlanId,
              trainingPlanVersionId: record.trainingPlanVersionId,
              seasonCycleId: record.seasonCycleId,
              weekStartDate: record.weekStart,
              weekEndDate: record.weekEnd,
            })
          : null,
      },
    ];
  });
}

export async function fetchSportMetricsBasketballWeeklySummaryHistory(params: {
  entityId: string;
  athleteId: string;
}): Promise<BasketballWeeklyHistoryItem[]> {
  const entityId = params.entityId.trim();
  const athleteId = params.athleteId.trim();
  if (entityId === "" || athleteId === "") {
    throw {
      message: "Entity and athlete identifiers are required.",
      status: 400,
      code: "SPORT_METRICS_BASKETBALL_IDS_REQUIRED",
    };
  }

  const raw = await apiRequest(
    paths.entities.athleteSportMetricsBasketballWeeklySummaryHistory(
      entityId,
      athleteId,
    ),
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: SPORT_METRICS_BASKETBALL_TIMEOUT_MS,
    },
  );
  return parseSportMetricsBasketballWeeklySummaryHistoryPayload(raw);
}

export type PostBasketballCoachPracticeRatingPayload = {
  trainingPlanVersionId: string;
  taxonomyAreaKey: string;
  rating: number;
};

export function buildBasketballCoachPracticeRatingRequestBody(
  payload: PostBasketballCoachPracticeRatingPayload,
): PostBasketballCoachPracticeRatingPayload {
  const trainingPlanVersionId = payload.trainingPlanVersionId.trim();
  const taxonomyAreaKey = payload.taxonomyAreaKey.trim();
  const rating = payload.rating;

  if (trainingPlanVersionId === "" || taxonomyAreaKey === "") {
    throw {
      message: "Training plan version and taxonomyAreaKey are required.",
      status: 400,
      code: "SPORT_METRICS_BASKETBALL_COACH_PRACTICE_RATING_INVALID",
    };
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw {
      message: "rating must be an integer from 1 to 5.",
      status: 400,
      code: "SPORT_METRICS_BASKETBALL_COACH_PRACTICE_RATING_INVALID",
    };
  }

  return { trainingPlanVersionId, taxonomyAreaKey, rating };
}

export async function postBasketballCoachPracticeRating(
  entityId: string,
  athleteId: string,
  payload: PostBasketballCoachPracticeRatingPayload,
): Promise<unknown> {
  const resolvedEntityId = entityId.trim();
  const resolvedAthleteId = athleteId.trim();
  if (resolvedEntityId === "" || resolvedAthleteId === "") {
    throw {
      message: "Entity and athlete identifiers are required.",
      status: 400,
      code: "SPORT_METRICS_BASKETBALL_IDS_REQUIRED",
    };
  }

  const requestBody = buildBasketballCoachPracticeRatingRequestBody(payload);
  return apiRequest(
    paths.entities.athleteSportMetricsBasketballCoachPracticeRatings(
      resolvedEntityId,
      resolvedAthleteId,
    ),
    {
      method: "POST",
      body: JSON.stringify(requestBody),
      timeoutMs: SPORT_METRICS_BASKETBALL_TIMEOUT_MS,
    },
  );
}

export type BasketballCompetitionAssessment = {
  id: string;
  competitionName: string;
  competitionDate: string | null;
  status: string | null;
  seasonCycleId: string | null;
  taxonomyRatings: Record<string, number>;
  normalizedTaxonomyScores: Record<string, number> | null;
  competitionPerformance: number | null;
  submittedAt: string | null;
};

export type CreateBasketballCompetitionAssessmentPayload = {
  seasonCycleId: string;
  competitionName: string;
  competitionDate: string;
  taxonomyRatings: Record<string, number>;
};

function parseFiniteScoreMap(value: unknown): Record<string, number> | null {
  const record = asRecord(value);
  if (!record) return null;
  const scores: Record<string, number> = {};
  for (const [key, score] of Object.entries(record)) {
    const parsed = readReturnedNumber(score);
    if (parsed !== null) scores[key] = parsed;
  }
  if (Object.keys(scores).length === 0) return null;
  return scores;
}

function parseBasketballCompetitionAssessment(
  value: unknown,
): BasketballCompetitionAssessment | null {
  const record = asRecord(value);
  const id = readNullableString(record?.id);
  if (!record || !id) return null;
  return {
    id,
    competitionName: readNullableString(record.competitionName) ?? "",
    competitionDate: readNullableString(record.competitionDate),
    status: readNullableString(record.status),
    seasonCycleId: readNullableString(record.seasonCycleId),
    taxonomyRatings: parseFiniteScoreMap(record.taxonomyRatings) ?? {},
    normalizedTaxonomyScores: parseFiniteScoreMap(record.normalizedTaxonomyScores),
    competitionPerformance: readReturnedNumber(record.competitionPerformance),
    submittedAt: readNullableString(record.submittedAt),
  };
}

function unwrapBasketballCompetitionData(payload: unknown): Record<string, unknown> {
  const record = asRecord(adaptBackendSuccess(payload));
  if (!record) {
    throw {
      message: "Basketball competition assessment response must be a JSON object.",
      status: 500,
      code: "SPORT_METRICS_BASKETBALL_COMPETITION_INVALID",
      details: payload,
    };
  }
  return record;
}

export function parseBasketballCompetitionAssessmentPayload(
  payload: unknown,
): BasketballCompetitionAssessment {
  const assessment = parseBasketballCompetitionAssessment(
    unwrapBasketballCompetitionData(payload).basketballCompetitionAssessment,
  );
  if (!assessment) {
    throw {
      message: "Basketball competition assessment response is missing an assessment.",
      status: 500,
      code: "SPORT_METRICS_BASKETBALL_COMPETITION_INVALID",
      details: payload,
    };
  }
  return assessment;
}

export function parseBasketballCompetitionAssessmentListPayload(
  payload: unknown,
): BasketballCompetitionAssessment[] {
  return mapRecords(
    unwrapBasketballCompetitionData(payload).basketballCompetitionAssessments,
    parseBasketballCompetitionAssessment,
  );
}

function requireBasketballScope(entityId: string, athleteId: string) {
  const resolvedEntityId = entityId.trim();
  const resolvedAthleteId = athleteId.trim();
  if (resolvedEntityId === "" || resolvedAthleteId === "") {
    throw {
      message: "Entity and athlete identifiers are required.",
      status: 400,
      code: "SPORT_METRICS_BASKETBALL_IDS_REQUIRED",
    };
  }
  return { entityId: resolvedEntityId, athleteId: resolvedAthleteId };
}

export function buildBasketballCompetitionAssessmentCreateBody(
  payload: CreateBasketballCompetitionAssessmentPayload,
): CreateBasketballCompetitionAssessmentPayload {
  const seasonCycleId = payload.seasonCycleId.trim();
  const competitionName = payload.competitionName.trim();
  const competitionDate = payload.competitionDate.trim();
  if (seasonCycleId === "" || competitionName === "" || competitionDate === "") {
    throw {
      message: "Season cycle, competition name, and competition date are required.",
      status: 400,
      code: "SPORT_METRICS_BASKETBALL_COMPETITION_INVALID",
    };
  }

  const taxonomyRatings: Record<string, number> = {};
  for (const [key, rating] of Object.entries(payload.taxonomyRatings)) {
    const taxonomy = key.trim();
    if (taxonomy === "" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw {
        message: "Taxonomy ratings must be integers from 1 to 5.",
        status: 400,
        code: "SPORT_METRICS_BASKETBALL_COMPETITION_INVALID",
      };
    }
    taxonomyRatings[taxonomy] = rating;
  }
  if (Object.keys(taxonomyRatings).length === 0) {
    throw {
      message: "Taxonomy ratings are required.",
      status: 400,
      code: "SPORT_METRICS_BASKETBALL_COMPETITION_INVALID",
    };
  }

  return { seasonCycleId, competitionName, competitionDate, taxonomyRatings };
}

export async function fetchBasketballCompetitionAssessments(params: {
  entityId: string;
  athleteId: string;
  seasonCycleId: string;
}): Promise<BasketballCompetitionAssessment[]> {
  const scope = requireBasketballScope(params.entityId, params.athleteId);
  const seasonCycleId = params.seasonCycleId.trim();
  if (seasonCycleId === "") {
    throw {
      message: "seasonCycleId is required.",
      status: 400,
      code: "SPORT_METRICS_BASKETBALL_IDS_REQUIRED",
    };
  }

  const raw = await apiRequest(
    paths.entities.athleteSportMetricsBasketballCompetitionAssessments(
      scope.entityId,
      scope.athleteId,
      { seasonCycleId },
    ),
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: SPORT_METRICS_BASKETBALL_TIMEOUT_MS,
    },
  );
  return parseBasketballCompetitionAssessmentListPayload(raw);
}

export async function fetchBasketballCompetitionAssessment(params: {
  entityId: string;
  athleteId: string;
  assessmentId: string;
}): Promise<BasketballCompetitionAssessment> {
  const scope = requireBasketballScope(params.entityId, params.athleteId);
  const assessmentId = params.assessmentId.trim();
  if (assessmentId === "") {
    throw {
      message: "Assessment id is required.",
      status: 400,
      code: "SPORT_METRICS_BASKETBALL_IDS_REQUIRED",
    };
  }

  const raw = await apiRequest(
    paths.entities.athleteSportMetricsBasketballCompetitionAssessment(
      scope.entityId,
      scope.athleteId,
      assessmentId,
    ),
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: SPORT_METRICS_BASKETBALL_TIMEOUT_MS,
    },
  );
  return parseBasketballCompetitionAssessmentPayload(raw);
}

export async function createBasketballCompetitionAssessment(
  entityId: string,
  athleteId: string,
  payload: CreateBasketballCompetitionAssessmentPayload,
): Promise<BasketballCompetitionAssessment> {
  const scope = requireBasketballScope(entityId, athleteId);
  const raw = await apiRequest(
    paths.entities.athleteSportMetricsBasketballCompetitionAssessments(
      scope.entityId,
      scope.athleteId,
    ),
    {
      method: "POST",
      body: JSON.stringify(buildBasketballCompetitionAssessmentCreateBody(payload)),
      timeoutMs: SPORT_METRICS_BASKETBALL_TIMEOUT_MS,
    },
  );
  return parseBasketballCompetitionAssessmentPayload(raw);
}

export async function updateBasketballCompetitionAssessment(params: {
  entityId: string;
  athleteId: string;
  assessmentId: string;
  payload: {
    competitionName?: string;
    competitionDate?: string;
    taxonomyRatings?: Record<string, number>;
    notes?: string | null;
  };
}): Promise<BasketballCompetitionAssessment> {
  const scope = requireBasketballScope(params.entityId, params.athleteId);
  const assessmentId = params.assessmentId.trim();
  if (assessmentId === "") {
    throw {
      message: "Assessment id is required.",
      status: 400,
      code: "SPORT_METRICS_BASKETBALL_IDS_REQUIRED",
    };
  }

  await apiRequest(
    paths.entities.athleteSportMetricsBasketballCompetitionAssessment(
      scope.entityId,
      scope.athleteId,
      assessmentId,
    ),
    {
      method: "PATCH",
      body: JSON.stringify(params.payload),
      timeoutMs: SPORT_METRICS_BASKETBALL_TIMEOUT_MS,
    },
  );
  return fetchBasketballCompetitionAssessment({
    entityId: scope.entityId,
    athleteId: scope.athleteId,
    assessmentId,
  });
}

export async function submitBasketballCompetitionAssessment(params: {
  entityId: string;
  athleteId: string;
  assessmentId: string;
}): Promise<BasketballCompetitionAssessment> {
  const scope = requireBasketballScope(params.entityId, params.athleteId);
  const assessmentId = params.assessmentId.trim();
  if (assessmentId === "") {
    throw {
      message: "Assessment id is required.",
      status: 400,
      code: "SPORT_METRICS_BASKETBALL_IDS_REQUIRED",
    };
  }

  const raw = await apiRequest(
    paths.entities.athleteSportMetricsBasketballCompetitionAssessmentSubmit(
      scope.entityId,
      scope.athleteId,
      assessmentId,
    ),
    {
      method: "POST",
      body: "{}",
      timeoutMs: SPORT_METRICS_BASKETBALL_TIMEOUT_MS,
    },
  );
  return parseBasketballCompetitionAssessmentPayload(raw);
}
