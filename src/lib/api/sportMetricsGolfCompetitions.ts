"use client";

import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest } from "@/lib/apiClient";

const SPORT_METRICS_GOLF_TIMEOUT_MS = 240_000;

export type GolfCompetitionType =
  | "LOCAL"
  | "INVITATIONAL"
  | "RANKING"
  | "CHAMPIONSHIP"
  | "NATIONAL"
  | "INTERNATIONAL";

export type GolfCompetitionFormat = 9 | 18;

export type GolfCompetitionStatus = "DRAFT" | "SUBMITTED";

export type GolfCompetitionSeasonPhase = "PRE_SEASON" | "IN_SEASON";

export type GolfCompetitionFairwayHit = "YES" | "NO" | "NA";

export type GolfCompetitionSatisfactionRating = 1 | 2 | 3 | 4 | 5;

export type GolfCompetitionHoleOutcome =
  | "ALBATROSS_OR_BETTER"
  | "EAGLE"
  | "BIRDIE"
  | "PAR"
  | "BOGEY"
  | "DOUBLE_BOGEY"
  | "TRIPLE_OR_WORSE";

export type GolfCompetitionHoleInput = {
  holeNumber: number;
  par: number;
  strokes: number;
  fairwayHit: GolfCompetitionFairwayHit;
  greenInRegulation: boolean;
  putts: number;
  penaltyStrokes: number;
  satisfactionRating: GolfCompetitionSatisfactionRating;
  notes?: string | null;
};

export type GolfCompetitionDayInput = {
  dayNumber: number;
  date: string;
  weatherConditions?: string | null;
  wind?: string | null;
  courseConditions?: string | null;
  dayNotes?: string | null;
  holeResults?: GolfCompetitionHoleInput[];
};

export type CreateGolfCompetitionPayload = {
  name: string;
  type: GolfCompetitionType;
  format: GolfCompetitionFormat;
  venue: string;
  startDate: string;
  numberOfDays: number;
  competitionNotes?: string | null;
};

export type PatchGolfCompetitionPayload = {
  name?: string;
  type?: GolfCompetitionType;
  format?: GolfCompetitionFormat;
  venue?: string;
  startDate?: string;
  numberOfDays?: number;
  competitionNotes?: string | null;
  days?: GolfCompetitionDayInput[];
};

export type PostGolfCoachCompetitionAssessmentPayload = {
  rating: GolfCompetitionSatisfactionRating;
  notes?: string | null;
};

export type GolfCompetitionParPerformance = {
  holesPlayed: number;
  totalPar: number | null;
  totalStrokes: number | null;
  scoreToPar: number | null;
};

export type GolfCompetitionHoleSummary = {
  holesPlayed: number;
  totalPar: number | null;
  totalStrokes: number | null;
  scoreToPar: number | null;
  albatrossOrBetter: number;
  eagles: number;
  birdies: number;
  pars: number;
  bogeys: number;
  doubleBogeys: number;
  tripleOrWorse: number;
  fairwaysHitPercent: number | null;
  girPercent: number | null;
  totalPutts: number | null;
  puttsPerHole: number | null;
  totalPenaltyStrokes: number | null;
  par3: GolfCompetitionParPerformance;
  par4: GolfCompetitionParPerformance;
  par5: GolfCompetitionParPerformance;
  averageHoleSatisfaction: number | null;
};

export type GolfCompetitionHoleResult = {
  id: string;
  competitionDayId: string;
  holeNumber: number;
  par: number;
  strokes: number;
  fairwayHit: GolfCompetitionFairwayHit;
  greenInRegulation: boolean;
  putts: number;
  penaltyStrokes: number;
  satisfactionRating: GolfCompetitionSatisfactionRating;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GolfCompetitionHoleRead = GolfCompetitionHoleResult & {
  scoreToPar: number | null;
  outcome: GolfCompetitionHoleOutcome | null;
};

export type GolfCompetitionDay = {
  id: string;
  competitionId: string;
  dayNumber: number;
  date: string;
  weatherConditions: string | null;
  wind: string | null;
  courseConditions: string | null;
  dayNotes: string | null;
  createdAt: string;
  updatedAt: string;
  holeResults: GolfCompetitionHoleResult[];
};

export type GolfCompetitionDayRead = Omit<GolfCompetitionDay, "holeResults"> & {
  holeResults: GolfCompetitionHoleRead[];
  daySummary: GolfCompetitionHoleSummary;
};

export type GolfCoachCompetitionAssessment = {
  id: string;
  competitionId: string;
  coachProfileId: string;
  createdByUserId: string;
  rating: GolfCompetitionSatisfactionRating;
  notes: string | null;
  coachCompetitionScore: number;
  createdAt: string;
  updatedAt: string;
};

export type GolfOverallGolferPerformanceCheckpoint = {
  id: string;
  entityId: string;
  athleteProfileId: string;
  seasonCycleId: string;
  competitionId: string;
  practicePerformance: number;
  competitionPerformance: number;
  overallGolferPerformance: number;
  checkpointAt: string;
};

export type GolfCompetitionRecord = {
  id: string;
  entityId: string;
  athleteProfileId: string;
  createdByUserId: string;
  trainingPlanId: string;
  trainingPlanVersionId: string;
  planningContextSnapshotId: string;
  seasonPhase: GolfCompetitionSeasonPhase;
  name: string;
  type: GolfCompetitionType;
  format: GolfCompetitionFormat;
  venue: string;
  startDate: string;
  numberOfDays: number;
  competitionNotes: string | null;
  status: GolfCompetitionStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  days: GolfCompetitionDay[];
};

export type GolfCompetitionDetail = Omit<GolfCompetitionRecord, "days"> & {
  days: GolfCompetitionDayRead[];
  competitionSummary: GolfCompetitionHoleSummary;
  athleteAverageSatisfaction: number | null;
  athleteCompetitionScore: number | null;
  coachCompetitionAssessment: GolfCoachCompetitionAssessment | null;
  coachCompetitionScore: number | null;
  competitionPerformance: number | null;
  overallGolferPerformanceCheckpoint: GolfOverallGolferPerformanceCheckpoint | null;
};

export type GolfCompetitionHistoryPoint = {
  id: string;
  name: string;
  type: GolfCompetitionType;
  format: GolfCompetitionFormat;
  venue: string;
  startDate: string;
  numberOfDays: number;
  seasonPhase: GolfCompetitionSeasonPhase;
  seasonCycleId: string;
  seasonYear: number;
  status: GolfCompetitionStatus;
  competitionSummary: GolfCompetitionHoleSummary;
  athleteAverageSatisfaction: number | null;
  athleteCompetitionScore: number | null;
  coachCompetitionAssessment: GolfCoachCompetitionAssessment | null;
  coachCompetitionScore: number | null;
  competitionPerformance: number | null;
  overallGolferPerformanceCheckpoint: GolfOverallGolferPerformanceCheckpoint | null;
};

export type GolfCompetitionEnvelopeData = {
  competition: GolfCompetitionRecord;
};

export type GolfCompetitionDetailEnvelopeData = {
  competition: GolfCompetitionDetail;
};

export type GolfCompetitionListItem = {
  id: string;
  name: string;
  type: GolfCompetitionType;
  format: GolfCompetitionFormat;
  venue: string;
  startDate: string;
  numberOfDays: number;
  seasonPhase: GolfCompetitionSeasonPhase;
  seasonCycleId: string;
  seasonYear: number;
  status: GolfCompetitionStatus;
};

export type GolfCompetitionListData = {
  seasonCycleId: string;
  seasonYear: number;
  competitions: GolfCompetitionListItem[];
};

export type GolfCompetitionHistoryData = {
  seasonCycleId: string;
  seasonYear: number;
  competitions: GolfCompetitionHistoryPoint[];
};

export type GolfCoachCompetitionAssessmentEnvelopeData = {
  coachCompetitionAssessment: GolfCoachCompetitionAssessment;
};

function requireScopeIds(entityId: string, athleteId: string) {
  const resolvedEntityId = entityId.trim();
  const resolvedAthleteId = athleteId.trim();
  if (resolvedEntityId === "" || resolvedAthleteId === "") {
    throw {
      message: "Entity and athlete identifiers are required.",
      status: 400,
      code: "SPORT_METRICS_GOLF_IDS_REQUIRED",
    };
  }
  return { entityId: resolvedEntityId, athleteId: resolvedAthleteId };
}

function golfCompetitionRequest<T>(path: string, options: RequestInit): Promise<T> {
  return apiRequest(path, {
    ...options,
    timeoutMs: SPORT_METRICS_GOLF_TIMEOUT_MS,
  }).then((raw) => adaptBackendSuccess(raw) as T);
}

export async function createGolfCompetition(
  entityId: string,
  athleteId: string,
  payload: CreateGolfCompetitionPayload,
): Promise<GolfCompetitionEnvelopeData> {
  const scope = requireScopeIds(entityId, athleteId);
  const requestBody: CreateGolfCompetitionPayload = {
    name: payload.name,
    type: payload.type,
    format: payload.format,
    venue: payload.venue,
    startDate: payload.startDate,
    numberOfDays: payload.numberOfDays,
  };
  if (payload.competitionNotes !== undefined) {
    requestBody.competitionNotes = payload.competitionNotes;
  }

  return golfCompetitionRequest(
    paths.entities.athleteSportMetricsGolfCompetitions(scope.entityId, scope.athleteId),
    {
      method: "POST",
      body: JSON.stringify(requestBody),
    },
  );
}

export async function fetchGolfCompetition(params: {
  entityId: string;
  athleteId: string;
  competitionId: string;
}): Promise<GolfCompetitionDetailEnvelopeData> {
  const scope = requireScopeIds(params.entityId, params.athleteId);
  return golfCompetitionRequest(
    paths.entities.athleteSportMetricsGolfCompetition(
      scope.entityId,
      scope.athleteId,
      params.competitionId.trim(),
    ),
    {
      method: "GET",
      cache: "no-store",
    },
  );
}

export async function patchGolfCompetition(
  entityId: string,
  athleteId: string,
  competitionId: string,
  payload: PatchGolfCompetitionPayload,
): Promise<GolfCompetitionEnvelopeData> {
  const scope = requireScopeIds(entityId, athleteId);
  const requestBody: Record<string, unknown> = {};
  const keys: (keyof PatchGolfCompetitionPayload)[] = [
    "name",
    "type",
    "format",
    "venue",
    "startDate",
    "numberOfDays",
    "competitionNotes",
    "days",
  ];
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      requestBody[key] = payload[key];
    }
  }

  return golfCompetitionRequest(
    paths.entities.athleteSportMetricsGolfCompetition(
      scope.entityId,
      scope.athleteId,
      competitionId.trim(),
    ),
    {
      method: "PATCH",
      body: JSON.stringify(requestBody),
    },
  );
}

export async function submitGolfCompetition(params: {
  entityId: string;
  athleteId: string;
  competitionId: string;
}): Promise<GolfCompetitionEnvelopeData> {
  const scope = requireScopeIds(params.entityId, params.athleteId);
  return golfCompetitionRequest(
    paths.entities.athleteSportMetricsGolfCompetitionSubmit(
      scope.entityId,
      scope.athleteId,
      params.competitionId.trim(),
    ),
    { method: "POST" },
  );
}

export async function fetchGolfCompetitions(params: {
  entityId: string;
  athleteId: string;
  seasonCycleId: string;
}): Promise<GolfCompetitionListData> {
  const scope = requireScopeIds(params.entityId, params.athleteId);
  const seasonCycleId = params.seasonCycleId.trim();
  if (seasonCycleId === "") {
    throw {
      message: "seasonCycleId is required.",
      status: 400,
      code: "SPORT_METRICS_GOLF_IDS_REQUIRED",
    };
  }

  return golfCompetitionRequest(
    paths.entities.athleteSportMetricsGolfCompetitions(
      scope.entityId,
      scope.athleteId,
      { seasonCycleId },
    ),
    {
      method: "GET",
      cache: "no-store",
    },
  );
}

export async function fetchGolfCompetitionHistory(params: {
  entityId: string;
  athleteId: string;
  seasonCycleId: string;
}): Promise<GolfCompetitionHistoryData> {
  const scope = requireScopeIds(params.entityId, params.athleteId);
  const seasonCycleId = params.seasonCycleId.trim();
  if (seasonCycleId === "") {
    throw {
      message: "seasonCycleId is required.",
      status: 400,
      code: "SPORT_METRICS_GOLF_IDS_REQUIRED",
    };
  }

  return golfCompetitionRequest(
    paths.entities.athleteSportMetricsGolfCompetitionHistory(
      scope.entityId,
      scope.athleteId,
      { seasonCycleId },
    ),
    {
      method: "GET",
      cache: "no-store",
    },
  );
}

export async function postGolfCoachCompetitionAssessment(
  entityId: string,
  athleteId: string,
  competitionId: string,
  payload: PostGolfCoachCompetitionAssessmentPayload,
): Promise<GolfCoachCompetitionAssessmentEnvelopeData> {
  const scope = requireScopeIds(entityId, athleteId);
  const requestBody: PostGolfCoachCompetitionAssessmentPayload = {
    rating: payload.rating,
  };
  if (payload.notes !== undefined) {
    requestBody.notes = payload.notes;
  }

  return golfCompetitionRequest(
    paths.entities.athleteSportMetricsGolfCompetitionCoachAssessments(
      scope.entityId,
      scope.athleteId,
      competitionId.trim(),
    ),
    {
      method: "POST",
      body: JSON.stringify(requestBody),
    },
  );
}
