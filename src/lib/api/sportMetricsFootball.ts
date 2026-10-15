"use client";

import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest } from "@/lib/apiClient";
import {
  buildBasketballSportMetricRecordRequestBody,
  parseSportMetricsBasketballWeeklySummaryHistoryPayload,
  parseSportMetricsBasketballWeeklySummaryPayload,
  type BasketballCompetitionAssessment,
  type BasketballWeeklyHistoryItem,
  type BasketballWeeklySummary,
  type PostBasketballSportMetricRecordPayload,
} from "@/lib/api/sportMetricsBasketball";

const SPORT_METRICS_FOOTBALL_TIMEOUT_MS = 240_000;

export type PostFootballSportMetricRecordPayload = PostBasketballSportMetricRecordPayload;

export async function postFootballSportMetricRecord(
  entityId: string,
  athleteId: string,
  payload: PostFootballSportMetricRecordPayload,
): Promise<unknown> {
  const resolvedEntityId = entityId.trim();
  const resolvedAthleteId = athleteId.trim();

  if (resolvedEntityId === "" || resolvedAthleteId === "") {
    throw {
      message: "Entity and athlete identifiers are required.",
      status: 400,
      code: "SPORT_METRICS_FOOTBALL_IDS_REQUIRED",
    };
  }

  return apiRequest(
    paths.entities.athleteSportMetricsFootballRecords(
      resolvedEntityId,
      resolvedAthleteId,
    ),
    {
      method: "POST",
      body: JSON.stringify(buildBasketballSportMetricRecordRequestBody(payload)),
      timeoutMs: SPORT_METRICS_FOOTBALL_TIMEOUT_MS,
    },
  );
}

export type PostFootballCoachPracticeRatingPayload = {
  trainingPlanVersionId: string;
  taxonomyAreaKey: string;
  rating: number;
};

export function buildFootballCoachPracticeRatingRequestBody(
  payload: PostFootballCoachPracticeRatingPayload,
): PostFootballCoachPracticeRatingPayload {
  const trainingPlanVersionId = payload.trainingPlanVersionId.trim();
  const taxonomyAreaKey = payload.taxonomyAreaKey.trim();
  const rating = payload.rating;

  if (trainingPlanVersionId === "" || taxonomyAreaKey === "") {
    throw {
      message: "Training plan version and taxonomyAreaKey are required.",
      status: 400,
      code: "SPORT_METRICS_FOOTBALL_COACH_PRACTICE_RATING_INVALID",
    };
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw {
      message: "rating must be an integer from 1 to 5.",
      status: 400,
      code: "SPORT_METRICS_FOOTBALL_COACH_PRACTICE_RATING_INVALID",
    };
  }

  return { trainingPlanVersionId, taxonomyAreaKey, rating };
}

export async function postFootballCoachPracticeRating(
  entityId: string,
  athleteId: string,
  payload: PostFootballCoachPracticeRatingPayload,
): Promise<unknown> {
  const resolvedEntityId = entityId.trim();
  const resolvedAthleteId = athleteId.trim();
  if (resolvedEntityId === "" || resolvedAthleteId === "") {
    throw {
      message: "Entity and athlete identifiers are required.",
      status: 400,
      code: "SPORT_METRICS_FOOTBALL_IDS_REQUIRED",
    };
  }

  return apiRequest(
    paths.entities.athleteSportMetricsFootballCoachPracticeRatings(
      resolvedEntityId,
      resolvedAthleteId,
    ),
    {
      method: "POST",
      body: JSON.stringify(buildFootballCoachPracticeRatingRequestBody(payload)),
      timeoutMs: SPORT_METRICS_FOOTBALL_TIMEOUT_MS,
    },
  );
}

function requireFootballScope(entityId: string, athleteId: string) {
  const resolvedEntityId = entityId.trim();
  const resolvedAthleteId = athleteId.trim();
  if (resolvedEntityId === "" || resolvedAthleteId === "") {
    throw {
      message: "Entity and athlete identifiers are required.",
      status: 400,
      code: "SPORT_METRICS_FOOTBALL_IDS_REQUIRED",
    };
  }
  return { entityId: resolvedEntityId, athleteId: resolvedAthleteId };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function readNullableFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function parseFiniteScoreMap(value: unknown): Record<string, number> | null {
  const record = asRecord(value);
  if (!record) return null;
  const scores: Record<string, number> = {};
  for (const [key, score] of Object.entries(record)) {
    const parsed = readNullableFiniteNumber(score);
    if (parsed !== null) scores[key] = parsed;
  }
  if (Object.keys(scores).length === 0) return null;
  return scores;
}

function parseFootballCompetitionAssessment(
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
    competitionPerformance: readNullableFiniteNumber(record.competitionPerformance),
    submittedAt: readNullableString(record.submittedAt),
  };
}

export function parseFootballCompetitionAssessmentPayload(
  payload: unknown,
): BasketballCompetitionAssessment {
  const record = asRecord(adaptBackendSuccess(payload));
  const assessment = parseFootballCompetitionAssessment(record?.footballCompetitionAssessment);
  if (!assessment) {
    throw {
      message: "Football competition assessment response was invalid.",
      status: 500,
      code: "SPORT_METRICS_FOOTBALL_COMPETITION_ASSESSMENT_INVALID",
      details: payload,
    };
  }
  return assessment;
}

export function parseFootballCompetitionAssessmentListPayload(
  payload: unknown,
): BasketballCompetitionAssessment[] {
  const record = asRecord(adaptBackendSuccess(payload));
  const list = record?.footballCompetitionAssessments;
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) => {
    const assessment = parseFootballCompetitionAssessment(item);
    return assessment ? [assessment] : [];
  });
}

export async function fetchSportMetricsFootballWeeklySummary(params: {
  entityId: string;
  athleteId: string;
  trainingPlanVersionId: string;
}): Promise<BasketballWeeklySummary> {
  const scope = requireFootballScope(params.entityId, params.athleteId);
  const trainingPlanVersionId = params.trainingPlanVersionId.trim();
  if (trainingPlanVersionId === "") {
    throw {
      message: "Training plan version is required.",
      status: 400,
      code: "SPORT_METRICS_FOOTBALL_WEEKLY_SUMMARY_INVALID",
    };
  }
  const raw = await apiRequest(
    paths.entities.athleteSportMetricsFootballWeeklySummary(
      scope.entityId,
      scope.athleteId,
      { trainingPlanVersionId },
    ),
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: SPORT_METRICS_FOOTBALL_TIMEOUT_MS,
    },
  );
  return parseSportMetricsBasketballWeeklySummaryPayload(raw);
}

export async function fetchSportMetricsFootballWeeklySummaryHistory(params: {
  entityId: string;
  athleteId: string;
}): Promise<BasketballWeeklyHistoryItem[]> {
  const scope = requireFootballScope(params.entityId, params.athleteId);
  const raw = await apiRequest(
    paths.entities.athleteSportMetricsFootballWeeklySummaryHistory(
      scope.entityId,
      scope.athleteId,
    ),
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: SPORT_METRICS_FOOTBALL_TIMEOUT_MS,
    },
  );
  return parseSportMetricsBasketballWeeklySummaryHistoryPayload(raw);
}

export async function fetchFootballCompetitionAssessments(params: {
  entityId: string;
  athleteId: string;
  seasonCycleId: string;
}): Promise<BasketballCompetitionAssessment[]> {
  const scope = requireFootballScope(params.entityId, params.athleteId);
  const seasonCycleId = params.seasonCycleId.trim();
  const raw = await apiRequest(
    paths.entities.athleteSportMetricsFootballCompetitionAssessments(
      scope.entityId,
      scope.athleteId,
      { seasonCycleId },
    ),
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: SPORT_METRICS_FOOTBALL_TIMEOUT_MS,
    },
  );
  return parseFootballCompetitionAssessmentListPayload(raw);
}

export async function fetchFootballCompetitionAssessment(params: {
  entityId: string;
  athleteId: string;
  assessmentId: string;
}): Promise<BasketballCompetitionAssessment> {
  const scope = requireFootballScope(params.entityId, params.athleteId);
  const resolvedAssessmentId = params.assessmentId.trim();
  if (resolvedAssessmentId === "") {
    throw {
      message: "Competition assessment is required.",
      status: 400,
      code: "SPORT_METRICS_FOOTBALL_COMPETITION_ASSESSMENT_INVALID",
    };
  }
  const raw = await apiRequest(
    paths.entities.athleteSportMetricsFootballCompetitionAssessment(
      scope.entityId,
      scope.athleteId,
      resolvedAssessmentId,
    ),
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: SPORT_METRICS_FOOTBALL_TIMEOUT_MS,
    },
  );
  return parseFootballCompetitionAssessmentPayload(raw);
}

export type CreateFootballCompetitionAssessmentPayload = {
  seasonCycleId: string;
  competitionName: string;
  competitionDate: string;
  taxonomyRatings: Record<string, number>;
};

export function buildFootballCompetitionAssessmentCreateBody(
  payload: CreateFootballCompetitionAssessmentPayload,
): CreateFootballCompetitionAssessmentPayload {
  const seasonCycleId = payload.seasonCycleId.trim();
  const competitionName = payload.competitionName.trim();
  const competitionDate = payload.competitionDate.trim();
  if (seasonCycleId === "" || competitionName === "" || competitionDate === "") {
    throw {
      message: "Season cycle, competition name, and competition date are required.",
      status: 400,
      code: "SPORT_METRICS_FOOTBALL_COMPETITION_ASSESSMENT_INVALID",
    };
  }

  const taxonomyRatings: Record<string, number> = {};
  for (const [key, rating] of Object.entries(payload.taxonomyRatings)) {
    const taxonomy = key.trim();
    if (taxonomy === "" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw {
        message: "Taxonomy ratings must be integers from 1 to 5.",
        status: 400,
        code: "SPORT_METRICS_FOOTBALL_COMPETITION_ASSESSMENT_INVALID",
      };
    }
    taxonomyRatings[taxonomy] = rating;
  }
  if (Object.keys(taxonomyRatings).length === 0) {
    throw {
      message: "Taxonomy ratings are required.",
      status: 400,
      code: "SPORT_METRICS_FOOTBALL_COMPETITION_ASSESSMENT_INVALID",
    };
  }

  return { seasonCycleId, competitionName, competitionDate, taxonomyRatings };
}

export async function createFootballCompetitionAssessment(
  entityId: string,
  athleteId: string,
  payload: CreateFootballCompetitionAssessmentPayload,
): Promise<BasketballCompetitionAssessment> {
  const scope = requireFootballScope(entityId, athleteId);
  const raw = await apiRequest(
    paths.entities.athleteSportMetricsFootballCompetitionAssessments(
      scope.entityId,
      scope.athleteId,
    ),
    {
      method: "POST",
      body: JSON.stringify(buildFootballCompetitionAssessmentCreateBody(payload)),
      timeoutMs: SPORT_METRICS_FOOTBALL_TIMEOUT_MS,
    },
  );
  return parseFootballCompetitionAssessmentPayload(raw);
}

export async function updateFootballCompetitionAssessment(params: {
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
  const scope = requireFootballScope(params.entityId, params.athleteId);
  const assessmentId = params.assessmentId.trim();
  if (assessmentId === "") {
    throw {
      message: "Competition assessment is required.",
      status: 400,
      code: "SPORT_METRICS_FOOTBALL_COMPETITION_ASSESSMENT_INVALID",
    };
  }

  await apiRequest(
    paths.entities.athleteSportMetricsFootballCompetitionAssessment(
      scope.entityId,
      scope.athleteId,
      assessmentId,
    ),
    {
      method: "PATCH",
      body: JSON.stringify(params.payload),
      timeoutMs: SPORT_METRICS_FOOTBALL_TIMEOUT_MS,
    },
  );
  return fetchFootballCompetitionAssessment({
    entityId: scope.entityId,
    athleteId: scope.athleteId,
    assessmentId,
  });
}

export async function submitFootballCompetitionAssessment(params: {
  entityId: string;
  athleteId: string;
  assessmentId: string;
}): Promise<BasketballCompetitionAssessment> {
  const scope = requireFootballScope(params.entityId, params.athleteId);
  const assessmentId = params.assessmentId.trim();
  if (assessmentId === "") {
    throw {
      message: "Competition assessment is required.",
      status: 400,
      code: "SPORT_METRICS_FOOTBALL_COMPETITION_ASSESSMENT_INVALID",
    };
  }

  const raw = await apiRequest(
    paths.entities.athleteSportMetricsFootballCompetitionAssessmentSubmit(
      scope.entityId,
      scope.athleteId,
      assessmentId,
    ),
    {
      method: "POST",
      body: "{}",
      timeoutMs: SPORT_METRICS_FOOTBALL_TIMEOUT_MS,
    },
  );
  return parseFootballCompetitionAssessmentPayload(raw);
}
