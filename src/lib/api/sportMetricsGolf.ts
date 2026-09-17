"use client";

import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest } from "@/lib/apiClient";

const SPORT_METRICS_GOLF_TIMEOUT_MS = 240_000;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readNullableString(value: unknown): string | null {
  const text = readString(value);
  return text !== "" ? text : null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.reduce<string[]>((acc, item) => {
    const text = readString(item);
    if (text !== "") acc.push(text);
    return acc;
  }, []);
}

function readUnknownArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function pickString(
  record: Record<string, unknown> | null,
  keys: string[],
): string | null {
  if (!record) return null;
  for (const key of keys) {
    const text = readNullableString(record[key]);
    if (text !== null) return text;
  }
  return null;
}

function pickStringArray(
  record: Record<string, unknown>,
  keys: string[],
): string[] {
  for (const key of keys) {
    const values = readStringArray(record[key]);
    if (values.length > 0) return values;
  }
  return [];
}

function pickUnknownArray(
  record: Record<string, unknown>,
  keys: string[],
): unknown[] {
  for (const key of keys) {
    const values = readUnknownArray(record[key]);
    if (values.length > 0) return values;
  }
  return [];
}

export type SportMetricSkillLink = {
  skillCode: string | null;
  skillArea: string | null;
  sportCapability: string | null;
  skillCategory: string | null;
  drillName: string | null;
};

export type SportMetricResultData = {
  attempts: number | null;
  successes: number | null;
  successRate: number | null;
  qualityRating: number | null;
  distanceBand: string | null;
  targetRadius: string | null;
  context: string | null;
  missesLeft: number | null;
  missesRight: number | null;
  missesShort: number | null;
  missesLong: number | null;
  notes: string | null;
};

export type SportMetricEvidenceItem = {
  id: string | null;
  label: string;
  value: string | null;
  unit: string | null;
  environment: string | null;
  source: string | null;
  notes: string | null;
  occurredAt: string | null;
  status: string | null;
  skillLink: SportMetricSkillLink | null;
  result: SportMetricResultData | null;
  raw: unknown;
};

export type SportMetricGoalPrimaryMetric = {
  key: string | null;
  unit: string | null;
  direction: string | null;
};

export type SportMetricGoalSnapshot = {
  goalName: string | null;
  successCriteria: string | null;
  targetValue: number | null;
  primaryMetric: SportMetricGoalPrimaryMetric | null;
  taxonomyAreaKey: string | null;
};

export type SportMetricGoalWeeklyActual = {
  metricKey: string | null;
  unit: string | null;
  direction: string | null;
  value: number;
  attempts: number | null;
  successes: number | null;
  total: number | null;
  recordCount: number | null;
};

export type SportMetricGoalTargetComparison = {
  targetValue: number | null;
  actualValue: number | null;
  direction: string | null;
  targetMet: boolean;
};

export type SportMetricGoalHistoryObservation = {
  planStartDate: string | null;
  planEndDate: string | null;
  actual: number | null;
  targetValue: number | null;
  targetComparison: SportMetricGoalTargetComparison | null;
};

export type SportMetricExerciseLinkedGoal = {
  id: string | null;
  goalName: string | null;
};

export type SportMetricExerciseHistoryObservation = {
  planStartDate: string | null;
  planEndDate: string | null;
  actual: number | null;
};

export type SportMetricExerciseTrend = {
  exerciseId: string | null;
  skillCode: string | null;
  exerciseName: string | null;
  taxonomyAreaKey: string | null;
  goalId: string | null;
  linkedGoal: SportMetricExerciseLinkedGoal | null;
  metricKey: string | null;
  metricName: string | null;
  unit: string | null;
  direction: string | null;
  exerciseType: string | null;
  currentActual: number | null;
  previousActual: number | null;
  trendScore: number | null;
  trendDirection: string | null;
  history: SportMetricExerciseHistoryObservation[];
};

export type SportMetricTaxonomyHistoryObservation = {
  planStartDate: string | null;
  planEndDate: string | null;
  YTrend: number | null;
  ZTrend: number | null;
  normalizedScore: number | null;
  scoreOutOf100: number | null;
  direction: string | null;
};

export type SportMetricTaxonomyScore = {
  taxonomyAreaKey: string | null;
  YTrend: number | null;
  ZTrend: number | null;
  normalizedScore: number | null;
  scoreOutOf100: number | null;
  direction: string | null;
  history: SportMetricTaxonomyHistoryObservation[];
  multiWeekNormalizedScore: number | null;
  multiWeekScoreOutOf100: number | null;
  multiWeekDirection: string | null;
  rank: number | null;
};

export type SportMetricGoalEvidenceGroup = {
  goalId: string | null;
  goalTitle: string;
  goalStatus: string | null;
  successCriteria: string | null;
  evidenceStatus: string | null;
  evidence: SportMetricEvidenceItem[];
  goal: SportMetricGoalSnapshot;
  weeklyActual: SportMetricGoalWeeklyActual | null;
  targetComparison: SportMetricGoalTargetComparison | null;
  history: SportMetricGoalHistoryObservation[];
  raw: unknown;
};

export type SportMetricCoachPracticeRating = {
  taxonomyAreaKey: string | null;
  rating: number | null;
  coachRatingNormalized: number | null;
  coachRatingScoreOutOf100: number | null;
  planStartDate: string | null;
  planEndDate: string | null;
};

export type SportMetricsGolfWeeklySummary = {
  sport: string;
  weekStartDate: string;
  weekEndDate: string;
  status: string;
  trainingPlanVersionId: string | null;
  seasonCycleId: string | null;
  seasonYear: number | null;
  contextFields: string[];
  prescribedSkillsCount: number | null;
  goalEvidence: SportMetricGoalEvidenceGroup[];
  unlinkedEvidence: SportMetricEvidenceItem[];
  exerciseTrends: SportMetricExerciseTrend[];
  taxonomyScores: SportMetricTaxonomyScore[];
  strongestTaxonomy: SportMetricTaxonomyScore | null;
  weakestTaxonomy: SportMetricTaxonomyScore | null;
  coachPracticeRatings: SportMetricCoachPracticeRating[];
  practiceNormalizedScore: number | null;
  practiceScoreOutOf100: number | null;
  coachPracticeNormalized: number | null;
  coachPracticeScoreOutOf100: number | null;
  practiceSideNormalized: number | null;
  practiceSideScoreOutOf100: number | null;
  competitionPerformance: number | null;
  overallGolferPerformance: number | null;
  overallGolferPerformanceHistory: SportMetricOverallGolferPerformanceHistoryPoint[];
  raw: unknown;
};

export type SportMetricOverallGolferPerformanceHistoryPoint = {
  weekStartDate: string | null;
  weekEndDate: string | null;
  practiceScoreOutOf100: number | null;
  competitionPerformance: number | null;
  overallGolferPerformance: number | null;
};

export type SportMetricsGolfComparisonStatus =
  | "COMPARABLE"
  | "NOT_COMPARABLE"
  | "ONLY_IN_EARLIER"
  | "ONLY_IN_LATER";

export type SportMetricsGolfComparisonSnapshot = {
  trainingPlanId: string;
  trainingPlanVersionId: string;
  weekStartDate: string;
  weekEndDate: string;
};

export type SportMetricsGolfComparisonMetric = {
  attempts: number | null;
  successes: number | null;
  targetHits: number | null;
  successRate: number | null;
};

export type SportMetricsGolfComparisonDelta =
  SportMetricsGolfComparisonMetric;

export type SportMetricsGolfComparisonDrill = {
  sport: "GOLF";
  taxonomyAreaKey: string;
  skillCode: string;
  earlierSkillName: string | null;
  laterSkillName: string | null;
  taxonomyMismatch: boolean;
  status: SportMetricsGolfComparisonStatus;
  earlier: SportMetricsGolfComparisonMetric | null;
  later: SportMetricsGolfComparisonMetric | null;
  delta: SportMetricsGolfComparisonDelta;
};

export type SportMetricsGolfComparisonCategory = {
  sport: "GOLF";
  taxonomyAreaKey: string;
  status: SportMetricsGolfComparisonStatus;
  drillMixChanged: boolean;
  earlier: SportMetricsGolfComparisonMetric | null;
  later: SportMetricsGolfComparisonMetric | null;
  delta: SportMetricsGolfComparisonDelta;
  drills: SportMetricsGolfComparisonDrill[];
};

export type SportMetricsGolfTaxonomyMismatch = {
  skillCode: string;
  earlierTaxonomyAreaKeys: string[];
  laterTaxonomyAreaKeys: string[];
};

export type SportMetricsGolfUnclassifiableCounts = {
  earlier: number;
  later: number;
};

export type SportMetricsGolfComparisonData = {
  sport: "GOLF";
  earlier: SportMetricsGolfComparisonSnapshot;
  later: SportMetricsGolfComparisonSnapshot;
  categories: SportMetricsGolfComparisonCategory[];
  taxonomyMismatches: SportMetricsGolfTaxonomyMismatch[];
  unclassifiableCounts: SportMetricsGolfUnclassifiableCounts;
};

export type SportMetricsGolfComparisonResponse = {
  success: true;
  message: "Sport metric comparison fetched successfully";
  data: SportMetricsGolfComparisonData;
};

export type SportMetricsGolfComparisonRequest = {
  earlierTrainingPlanVersionId: string;
  laterTrainingPlanVersionId: string;
};

export type FetchSportMetricsGolfComparisonParams =
  SportMetricsGolfComparisonRequest & {
    entityId: string;
    athleteId: string;
  };

function readFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function parseSkillLink(raw: unknown): SportMetricSkillLink | null {
  const record = asRecord(raw);
  if (!record) return null;
  const skillCode = pickString(record, ["skillCode", "code"]);
  const skillArea = pickString(record, ["skillArea", "golfTaxonomy", "taxonomy"]);
  const sportCapability = pickString(record, ["sportCapability", "capability"]);
  const skillCategory = pickString(record, ["skillCategory", "category"]);
  const drillName = pickString(record, ["drillName", "name", "label"]);
  if (!skillCode && !skillArea && !sportCapability && !skillCategory && !drillName) {
    return null;
  }
  return { skillCode, skillArea, sportCapability, skillCategory, drillName };
}

function parseResultData(raw: unknown): SportMetricResultData | null {
  const record = asRecord(raw);
  if (!record) return null;
  const attempts = readFiniteNumber(record.attempts);
  const successes = readFiniteNumber(record.successes ?? record.targetHits);
  const successRate = readFiniteNumber(record.successRate);
  const qualityRating = readFiniteNumber(record.qualityRating);
  const distanceBand = pickString(record, ["distanceBand"]);
  const targetRadius = pickString(record, ["targetRadius"]);
  const context = pickString(record, ["context", "location"]);
  const missesLeft = readFiniteNumber(record.missesLeft);
  const missesRight = readFiniteNumber(record.missesRight);
  const missesShort = readFiniteNumber(record.missesShort);
  const missesLong = readFiniteNumber(record.missesLong);
  const notes = pickString(record, ["notes"]);
  if (
    attempts === null && successes === null && successRate === null &&
    qualityRating === null && !distanceBand && !context
  ) {
    return null;
  }
  return {
    attempts, successes, successRate, qualityRating,
    distanceBand, targetRadius, context,
    missesLeft, missesRight, missesShort, missesLong,
    notes,
  };
}

function parseEvidenceItem(raw: unknown): SportMetricEvidenceItem | null {
  const record = asRecord(raw);
  if (!record) return null;

  const label =
    pickString(record, ["label", "metricLabel", "evidenceLabel", "title", "name"]) ??
    "Result";

  const skillLink = parseSkillLink(record.skillLink);
  const resultObj = asRecord(record.result) ?? asRecord(record.valueJson);
  const result = parseResultData(resultObj);

  return {
    id: pickString(record, ["id", "recordId", "metricRecordId"]),
    label,
    value: pickString(record, ["valueLabel", "displayValue", "value", "metricValue"]),
    unit: pickString(record, ["unit", "metricUnit"]),
    environment: pickString(record, ["environment"]),
    source: pickString(record, ["source"]),
    notes: pickString(record, ["notes", "comment", "coachNote", "athleteNote"]),
    occurredAt: pickString(record, ["occurredAt", "recordedAt", "createdAt"]),
    status: pickString(record, ["status"]),
    skillLink,
    result,
    raw,
  };
}

const EVIDENCE_ITEM_CONTAINER_KEYS = [
  "records",
  "evidence",
  "evidenceItems",
  "items",
] as const;

function parseEvidenceItemList(raw: unknown): SportMetricEvidenceItem[] {
  if (Array.isArray(raw)) {
    return raw
      .map(parseEvidenceItem)
      .filter((item): item is SportMetricEvidenceItem => item !== null);
  }

  const record = asRecord(raw);
  if (!record) return [];

  for (const key of EVIDENCE_ITEM_CONTAINER_KEYS) {
    const nested = readUnknownArray(record[key]);
    if (nested.length > 0) {
      return nested
        .map(parseEvidenceItem)
        .filter((item): item is SportMetricEvidenceItem => item !== null);
    }
  }

  const single = parseEvidenceItem(raw);
  return single ? [single] : [];
}

function parseGoalGroupEvidenceList(
  record: Record<string, unknown>,
): SportMetricEvidenceItem[] {
  for (const key of EVIDENCE_ITEM_CONTAINER_KEYS) {
    const nested = readUnknownArray(record[key]);
    if (nested.length > 0) {
      return nested
        .map(parseEvidenceItem)
        .filter((item): item is SportMetricEvidenceItem => item !== null);
    }
  }
  return [];
}

function parsePrimaryMetric(raw: unknown): SportMetricGoalPrimaryMetric | null {
  const record = asRecord(raw);
  if (!record) return null;
  const key = pickString(record, ["key"]);
  const unit = pickString(record, ["unit"]);
  const direction = pickString(record, ["direction"]);
  if (!key && !unit && !direction) return null;
  return { key, unit, direction };
}

function parseGoalSnapshot(raw: unknown): SportMetricGoalSnapshot {
  const record = asRecord(raw);
  return {
    goalName: pickString(record, ["goalName"]),
    successCriteria: pickString(record, ["successCriteria"]),
    targetValue: record ? readFiniteNumber(record.targetValue) : null,
    primaryMetric: parsePrimaryMetric(record?.primaryMetric),
    taxonomyAreaKey: pickString(record, ["taxonomyAreaKey"]),
  };
}

function parseWeeklyActual(raw: unknown): SportMetricGoalWeeklyActual | null {
  if (raw === undefined || raw === null) return null;
  const record = asRecord(raw);
  if (!record || !("value" in record)) return null;
  const value = readFiniteNumber(record.value);
  if (value === null) return null;
  return {
    metricKey: pickString(record, ["metricKey"]),
    unit: pickString(record, ["unit"]),
    direction: pickString(record, ["direction"]),
    value,
    attempts: readFiniteNumber(record.attempts),
    successes: readFiniteNumber(record.successes),
    total: readFiniteNumber(record.total),
    recordCount: readFiniteNumber(record.recordCount),
  };
}

function parseTargetComparison(
  raw: unknown,
): SportMetricGoalTargetComparison | null {
  if (raw === undefined || raw === null) return null;
  const record = asRecord(raw);
  if (!record || typeof record.targetMet !== "boolean") return null;
  return {
    targetValue: readFiniteNumber(record.targetValue),
    actualValue: readFiniteNumber(record.actualValue),
    direction: pickString(record, ["direction"]),
    targetMet: record.targetMet,
  };
}

function mapRecordArray<T>(
  raw: unknown,
  parseItem: (value: unknown) => T | null,
): T[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(parseItem).filter((item): item is T => item !== null);
}

function parseGoalHistoryObservation(
  raw: unknown,
): SportMetricGoalHistoryObservation | null {
  const record = asRecord(raw);
  if (!record) return null;
  return {
    planStartDate: pickString(record, ["planStartDate"]),
    planEndDate: pickString(record, ["planEndDate"]),
    actual: readFiniteNumber(record.actual),
    targetValue: readFiniteNumber(record.targetValue),
    targetComparison: parseTargetComparison(record.targetComparison),
  };
}

function parseExerciseLinkedGoal(
  raw: unknown,
): SportMetricExerciseLinkedGoal | null {
  if (raw === undefined || raw === null) return null;
  const record = asRecord(raw);
  if (!record) return null;
  return {
    id: pickString(record, ["id"]),
    goalName: pickString(record, ["goalName"]),
  };
}

function parseExerciseHistoryObservation(
  raw: unknown,
): SportMetricExerciseHistoryObservation | null {
  const record = asRecord(raw);
  if (!record) return null;
  return {
    planStartDate: pickString(record, ["planStartDate"]),
    planEndDate: pickString(record, ["planEndDate"]),
    actual: readFiniteNumber(record.actual),
  };
}

function parseExerciseTrend(raw: unknown): SportMetricExerciseTrend | null {
  const record = asRecord(raw);
  if (!record) return null;
  return {
    exerciseId: pickString(record, ["exerciseId"]),
    skillCode: pickString(record, ["skillCode"]),
    exerciseName: pickString(record, ["exerciseName"]),
    taxonomyAreaKey: pickString(record, ["taxonomyAreaKey"]),
    goalId: pickString(record, ["goalId"]),
    linkedGoal: parseExerciseLinkedGoal(record.linkedGoal),
    metricKey: pickString(record, ["metricKey"]),
    metricName: pickString(record, ["metricName"]),
    unit: pickString(record, ["unit"]),
    direction: pickString(record, ["direction"]),
    exerciseType: pickString(record, ["exerciseType"]),
    currentActual: readFiniteNumber(record.currentActual),
    previousActual: readFiniteNumber(record.previousActual),
    trendScore: readFiniteNumber(record.trendScore),
    trendDirection: pickString(record, ["trendDirection"]),
    history: mapRecordArray(record.history, parseExerciseHistoryObservation),
  };
}

function parseTaxonomyHistoryObservation(
  raw: unknown,
): SportMetricTaxonomyHistoryObservation | null {
  const record = asRecord(raw);
  if (!record) return null;
  return {
    planStartDate: pickString(record, ["planStartDate"]),
    planEndDate: pickString(record, ["planEndDate"]),
    YTrend: readFiniteNumber(record.YTrend),
    ZTrend: readFiniteNumber(record.ZTrend),
    normalizedScore: readFiniteNumber(record.normalizedScore),
    scoreOutOf100: readFiniteNumber(record.scoreOutOf100),
    direction: pickString(record, ["direction"]),
  };
}

function parseTaxonomyScore(raw: unknown): SportMetricTaxonomyScore | null {
  if (raw === undefined || raw === null) return null;
  const record = asRecord(raw);
  if (!record) return null;
  return {
    taxonomyAreaKey: pickString(record, ["taxonomyAreaKey"]),
    YTrend: readFiniteNumber(record.YTrend),
    ZTrend: readFiniteNumber(record.ZTrend),
    normalizedScore: readFiniteNumber(record.normalizedScore),
    scoreOutOf100: readFiniteNumber(record.scoreOutOf100),
    direction: pickString(record, ["direction"]),
    history: mapRecordArray(record.history, parseTaxonomyHistoryObservation),
    multiWeekNormalizedScore: readFiniteNumber(record.multiWeekNormalizedScore),
    multiWeekScoreOutOf100: readFiniteNumber(record.multiWeekScoreOutOf100),
    multiWeekDirection: pickString(record, ["multiWeekDirection"]),
    rank: "rank" in record ? readFiniteNumber(record.rank) : null,
  };
}

function parseOverallGolferPerformanceHistoryPoint(
  raw: unknown,
): SportMetricOverallGolferPerformanceHistoryPoint | null {
  const record = asRecord(raw);
  if (!record) return null;
  return {
    weekStartDate: pickString(record, [
      "weekStartDate",
      "planStartDate",
      "weekStart",
    ]),
    weekEndDate: pickString(record, ["weekEndDate", "planEndDate", "weekEnd"]),
    practiceScoreOutOf100:
      readFiniteNumber(record.practiceScoreOutOf100) ??
      readFiniteNumber(record.practicePerformance),
    competitionPerformance: readFiniteNumber(record.competitionPerformance),
    overallGolferPerformance: readFiniteNumber(record.overallGolferPerformance),
  };
}

function parseCoachPracticeRating(
  raw: unknown,
): SportMetricCoachPracticeRating | null {
  const record = asRecord(raw);
  if (!record) return null;
  return {
    taxonomyAreaKey: pickString(record, ["taxonomyAreaKey"]),
    rating: readFiniteNumber(record.rating),
    coachRatingNormalized: readFiniteNumber(record.coachRatingNormalized),
    coachRatingScoreOutOf100: readFiniteNumber(record.coachRatingScoreOutOf100),
    planStartDate: pickString(record, ["planStartDate"]),
    planEndDate: pickString(record, ["planEndDate"]),
  };
}

function parseGoalEvidenceGroup(raw: unknown): SportMetricGoalEvidenceGroup | null {
  const record = asRecord(raw);
  if (!record) return null;

  const goal = parseGoalSnapshot(record.goal);
  const nestedGoal = asRecord(record.goal);
  const goalTitle =
    goal.goalName ??
    pickString(record, ["goalTitle", "title", "goalName", "name"]) ??
    pickString(nestedGoal, ["title", "goalTitle", "name", "label"]) ??
    "Goal";

  const evidence = parseGoalGroupEvidenceList(record);

  return {
    goalId: pickString(record, ["goalId", "id"]),
    goalTitle,
    goalStatus: pickString(record, ["goalStatus", "status"]),
    successCriteria:
      goal.successCriteria ??
      pickString(record, ["successCriteria", "criteria", "target"]) ??
      pickString(nestedGoal, ["successCriteria", "criteria", "target"]),
    evidenceStatus: pickString(record, ["evidenceStatus", "summaryStatus"]),
    evidence,
    goal,
    weeklyActual: parseWeeklyActual(record.weeklyActual),
    targetComparison: parseTargetComparison(record.targetComparison),
    history: mapRecordArray(record.history, parseGoalHistoryObservation),
    raw,
  };
}

function parseUnlinkedEvidenceFromSummary(
  record: Record<string, unknown>,
): SportMetricEvidenceItem[] {
  const candidates = [
    record.unlinkedEvidence,
    record.ungroupedEvidence,
    record.otherEvidence,
  ];

  for (const candidate of candidates) {
    const items = parseEvidenceItemList(candidate);
    if (items.length > 0) return items;
  }

  return [];
}

function unwrapSportMetricsGolfWeeklySummaryPayload(
  payload: unknown,
): Record<string, unknown> {
  const unwrapped = adaptBackendSuccess(payload);
  const direct = asRecord(unwrapped);
  if (!direct) {
    throw {
      message: "SPORT Metrics weekly summary response must be a JSON object.",
      status: 500,
      code: "SPORT_METRICS_GOLF_WEEKLY_SUMMARY_INVALID",
      details: payload,
    };
  }

  if (
    "sport" in direct ||
    "weekStartDate" in direct ||
    "goalEvidence" in direct ||
    "unlinkedEvidence" in direct ||
    "exerciseTrends" in direct ||
    "taxonomyScores" in direct ||
    "coachPracticeRatings" in direct
  ) {
    return direct;
  }

  const nested = asRecord(direct.summary) ?? asRecord(direct.weeklySummary);
  if (nested) return nested;

  return direct;
}

export function parseSportMetricsGolfWeeklySummaryPayload(
  payload: unknown,
): SportMetricsGolfWeeklySummary {
  const record = unwrapSportMetricsGolfWeeklySummaryPayload(payload);

  const sport =
    pickString(record, ["sport", "sportCode", "sportName"]) ?? "GOLF";
  const weekStartDate =
    pickString(record, ["weekStartDate", "weekStart"]) ?? "";
  const weekEndDate =
    pickString(record, ["weekEndDate", "weekEnd"]) ?? "";
  const status =
    pickString(record, ["status", "summaryStatus"]) ?? "NO_DATA_LOGGED";

  const goalEvidence = pickUnknownArray(record, [
    "goalEvidence",
    "goalGroups",
    "goals",
  ])
    .map(parseGoalEvidenceGroup)
    .filter((group): group is SportMetricGoalEvidenceGroup => group !== null);

  const unlinkedEvidence = parseUnlinkedEvidenceFromSummary(record);

  const prescribedSkillsCount =
    readFiniteNumber(record.prescribedSkillsCount) ??
    readFiniteNumber(record.skillsPrescribedCount) ??
    readFiniteNumber(record.plannedSkillsCount) ??
    readFiniteNumber(record.prescribedSkillCount);

  return {
    sport,
    weekStartDate,
    weekEndDate,
    status,
    trainingPlanVersionId: pickString(record, ["trainingPlanVersionId", "versionId"]),
    seasonCycleId: pickString(record, ["seasonCycleId"]),
    seasonYear: readFiniteNumber(record.seasonYear),
    contextFields: pickStringArray(record, ["contextFields", "visibleContextFields"]),
    prescribedSkillsCount,
    goalEvidence,
    unlinkedEvidence,
    exerciseTrends: mapRecordArray(record.exerciseTrends, parseExerciseTrend),
    taxonomyScores: mapRecordArray(record.taxonomyScores, parseTaxonomyScore),
    strongestTaxonomy: parseTaxonomyScore(record.strongestTaxonomy),
    weakestTaxonomy: parseTaxonomyScore(record.weakestTaxonomy),
    coachPracticeRatings: mapRecordArray(
      record.coachPracticeRatings,
      parseCoachPracticeRating,
    ),
    practiceNormalizedScore: readFiniteNumber(record.practiceNormalizedScore),
    practiceScoreOutOf100: readFiniteNumber(record.practiceScoreOutOf100),
    coachPracticeNormalized: readFiniteNumber(record.coachPracticeNormalized),
    coachPracticeScoreOutOf100: readFiniteNumber(record.coachPracticeScoreOutOf100),
    practiceSideNormalized: readFiniteNumber(record.practiceSideNormalized),
    practiceSideScoreOutOf100: readFiniteNumber(record.practiceSideScoreOutOf100),
    competitionPerformance: readFiniteNumber(record.competitionPerformance),
    overallGolferPerformance: readFiniteNumber(record.overallGolferPerformance),
    overallGolferPerformanceHistory: mapRecordArray(
      record.overallGolferPerformanceHistory,
      parseOverallGolferPerformanceHistoryPoint,
    ),
    raw: payload,
  };
}

function invalidComparisonPayload(): never {
  throw new Error("SPORT Metrics Golf comparison response is invalid.");
}

function requireComparisonRecord(value: unknown): Record<string, unknown> {
  return asRecord(value) ?? invalidComparisonPayload();
}

function requireComparisonString(value: unknown): string {
  if (typeof value !== "string") return invalidComparisonPayload();
  return value;
}

function requireComparisonNullableString(value: unknown): string | null {
  if (value === null) return null;
  return requireComparisonString(value);
}

function requireComparisonBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") return invalidComparisonPayload();
  return value;
}

function requireComparisonNullableNumber(value: unknown): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return invalidComparisonPayload();
  }
  return value;
}

function requireComparisonNullableInteger(value: unknown): number | null {
  const parsed = requireComparisonNullableNumber(value);
  if (parsed !== null && !Number.isInteger(parsed)) {
    return invalidComparisonPayload();
  }
  return parsed;
}

function requireComparisonInteger(value: unknown): number {
  const parsed = requireComparisonNullableInteger(value);
  return parsed ?? invalidComparisonPayload();
}

function requireComparisonArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) return invalidComparisonPayload();
  return value;
}

function parseComparisonSport(value: unknown): "GOLF" {
  if (value !== "GOLF") return invalidComparisonPayload();
  return value;
}

function parseSportMetricsGolfComparisonStatus(
  value: unknown,
): SportMetricsGolfComparisonStatus {
  if (
    value === "COMPARABLE" ||
    value === "NOT_COMPARABLE" ||
    value === "ONLY_IN_EARLIER" ||
    value === "ONLY_IN_LATER"
  ) {
    return value;
  }
  return invalidComparisonPayload();
}

function parseSportMetricsGolfComparisonSnapshot(
  value: unknown,
): SportMetricsGolfComparisonSnapshot {
  const record = requireComparisonRecord(value);
  return {
    trainingPlanId: requireComparisonString(record.trainingPlanId),
    trainingPlanVersionId: requireComparisonString(
      record.trainingPlanVersionId,
    ),
    weekStartDate: requireComparisonString(record.weekStartDate),
    weekEndDate: requireComparisonString(record.weekEndDate),
  };
}

function parseSportMetricsGolfComparisonMetric(
  value: unknown,
): SportMetricsGolfComparisonMetric {
  const record = requireComparisonRecord(value);
  return {
    attempts: requireComparisonNullableInteger(record.attempts),
    successes: requireComparisonNullableInteger(record.successes),
    targetHits: requireComparisonNullableInteger(record.targetHits),
    successRate: requireComparisonNullableNumber(record.successRate),
  };
}

function parseNullableSportMetricsGolfComparisonMetric(
  value: unknown,
): SportMetricsGolfComparisonMetric | null {
  return value === null ? null : parseSportMetricsGolfComparisonMetric(value);
}

function parseSportMetricsGolfComparisonDrill(
  value: unknown,
): SportMetricsGolfComparisonDrill {
  const record = requireComparisonRecord(value);
  return {
    sport: parseComparisonSport(record.sport),
    taxonomyAreaKey: requireComparisonString(record.taxonomyAreaKey),
    skillCode: requireComparisonString(record.skillCode),
    earlierSkillName: requireComparisonNullableString(
      record.earlierSkillName,
    ),
    laterSkillName: requireComparisonNullableString(record.laterSkillName),
    taxonomyMismatch: requireComparisonBoolean(record.taxonomyMismatch),
    status: parseSportMetricsGolfComparisonStatus(record.status),
    earlier: parseNullableSportMetricsGolfComparisonMetric(record.earlier),
    later: parseNullableSportMetricsGolfComparisonMetric(record.later),
    delta: parseSportMetricsGolfComparisonMetric(record.delta),
  };
}

function parseSportMetricsGolfComparisonCategory(
  value: unknown,
): SportMetricsGolfComparisonCategory {
  const record = requireComparisonRecord(value);
  return {
    sport: parseComparisonSport(record.sport),
    taxonomyAreaKey: requireComparisonString(record.taxonomyAreaKey),
    status: parseSportMetricsGolfComparisonStatus(record.status),
    drillMixChanged: requireComparisonBoolean(record.drillMixChanged),
    earlier: parseNullableSportMetricsGolfComparisonMetric(record.earlier),
    later: parseNullableSportMetricsGolfComparisonMetric(record.later),
    delta: parseSportMetricsGolfComparisonMetric(record.delta),
    drills: requireComparisonArray(record.drills).map(
      parseSportMetricsGolfComparisonDrill,
    ),
  };
}

function parseSportMetricsGolfTaxonomyMismatch(
  value: unknown,
): SportMetricsGolfTaxonomyMismatch {
  const record = requireComparisonRecord(value);
  return {
    skillCode: requireComparisonString(record.skillCode),
    earlierTaxonomyAreaKeys: requireComparisonArray(
      record.earlierTaxonomyAreaKeys,
    ).map(requireComparisonString),
    laterTaxonomyAreaKeys: requireComparisonArray(
      record.laterTaxonomyAreaKeys,
    ).map(requireComparisonString),
  };
}

export function parseSportMetricsGolfComparisonPayload(
  payload: unknown,
): SportMetricsGolfComparisonResponse {
  const envelope = requireComparisonRecord(payload);
  if (envelope.success === false) {
    adaptBackendSuccess(payload);
  }
  if (
    envelope.success !== true ||
    envelope.message !== "Sport metric comparison fetched successfully"
  ) {
    return invalidComparisonPayload();
  }

  const data = requireComparisonRecord(envelope.data);
  const unclassifiableCounts = requireComparisonRecord(
    data.unclassifiableCounts,
  );

  return {
    success: true,
    message: "Sport metric comparison fetched successfully",
    data: {
      sport: parseComparisonSport(data.sport),
      earlier: parseSportMetricsGolfComparisonSnapshot(data.earlier),
      later: parseSportMetricsGolfComparisonSnapshot(data.later),
      categories: requireComparisonArray(data.categories).map(
        parseSportMetricsGolfComparisonCategory,
      ),
      taxonomyMismatches: requireComparisonArray(data.taxonomyMismatches).map(
        parseSportMetricsGolfTaxonomyMismatch,
      ),
      unclassifiableCounts: {
        earlier: requireComparisonInteger(unclassifiableCounts.earlier),
        later: requireComparisonInteger(unclassifiableCounts.later),
      },
    },
  };
}

export function hasSportMetricsGolfEvidence(
  summary: SportMetricsGolfWeeklySummary | null | undefined,
): boolean {
  if (!summary) return false;
  if (summary.goalEvidence.some((group) => group.evidence.length > 0)) return true;
  return summary.unlinkedEvidence.length > 0;
}

export function formatSportMetricsStatusLabel(status: string): string {
  const upper = status.trim().toUpperCase();
  switch (upper) {
    case "NO_DATA_LOGGED":
      return "No Results Logged";
    case "EVIDENCE_LOGGED":
      return "Results Logged";
    case "NEEDS_COACH_REVIEW":
      return "Needs Coach Review";
    case "TARGET_MET":
      return "Target Met";
    case "TARGET_NOT_MET":
      return "Target Not Met";
    default:
      return status.trim() !== "" ? status.trim() : "No Results Logged";
  }
}

export function sportMetricsStatusVariant(
  status: string,
): "neutral" | "warning" | "accent" | "success" {
  const upper = status.trim().toUpperCase();
  if (upper === "NO_DATA_LOGGED" || upper === "") return "neutral";
  if (upper === "EVIDENCE_LOGGED" || upper === "NEEDS_COACH_REVIEW") return "warning";
  if (upper === "TARGET_MET") return "success";
  return "accent";
}

export async function fetchSportMetricsGolfWeeklySummary(params: {
  entityId: string;
  athleteId: string;
  trainingPlanVersionId: string;
}): Promise<SportMetricsGolfWeeklySummary> {
  const entityId = params.entityId.trim();
  const athleteId = params.athleteId.trim();
  const trainingPlanVersionId = params.trainingPlanVersionId.trim();

  if (entityId === "" || athleteId === "" || trainingPlanVersionId === "") {
    throw {
      message: "Entity, athlete, and training plan version identifiers are required.",
      status: 400,
      code: "SPORT_METRICS_GOLF_IDS_REQUIRED",
    };
  }

  const raw = await apiRequest(
    paths.entities.athleteSportMetricsGolfWeeklySummary(entityId, athleteId, {
      trainingPlanVersionId,
    }),
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: SPORT_METRICS_GOLF_TIMEOUT_MS,
    },
  );

  return parseSportMetricsGolfWeeklySummaryPayload(raw);
}

export const SKILLS_GOLF_HISTORY_EMPTY_MESSAGE =
  "Historical comparison will appear after the first completed Skills week.";

function parseHistoryWeekList(payload: unknown): unknown[] {
  const adapted = adaptBackendSuccess(payload);
  if (Array.isArray(adapted)) return adapted;

  const record = asRecord(adapted);
  if (!record) return [];

  if (Array.isArray(record.weeks)) return record.weeks;
  if (Array.isArray(record.history)) return record.history;
  if (Array.isArray(record.summaries)) return record.summaries;
  if (Array.isArray(record.data)) return record.data;

  const nested = asRecord(record.data);
  if (!nested) return [];
  if (Array.isArray(nested.weeks)) return nested.weeks;
  if (Array.isArray(nested.history)) return nested.history;
  if (Array.isArray(nested.summaries)) return nested.summaries;
  return [];
}

function projectionRecordOrSelf(
  value: unknown,
): Record<string, unknown> | null {
  if (Array.isArray(value)) return null;
  return asRecord(value);
}

function flattenGolfHistoryWeekRecord(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const weeklyGoal = projectionRecordOrSelf(record.weeklyGoalPerformance);
  const exercise = projectionRecordOrSelf(record.exercisePerformance);
  const taxonomy = projectionRecordOrSelf(record.taxonomyPerformance);
  const practice = projectionRecordOrSelf(record.practicePerformance);
  const competition = projectionRecordOrSelf(record.competitionPerformance);
  const overall =
    projectionRecordOrSelf(record.overallGolfPerformance) ??
    projectionRecordOrSelf(record.overallGolferPerformance);

  const goalEvidence =
    pickUnknownArray(record, ["goalEvidence", "goalGroups", "goals"]).length > 0
      ? record.goalEvidence ?? record.goalGroups ?? record.goals
      : Array.isArray(record.weeklyGoalPerformance)
        ? record.weeklyGoalPerformance
        : weeklyGoal
          ? weeklyGoal.goalEvidence ??
            weeklyGoal.goalGroups ??
            weeklyGoal.goals
          : record.weeklyGoalPerformance;

  const exerciseTrends =
    pickUnknownArray(record, ["exerciseTrends"]).length > 0
      ? record.exerciseTrends
      : Array.isArray(record.exercisePerformance)
        ? record.exercisePerformance
        : exercise
          ? exercise.exerciseTrends ?? exercise.exercises
          : record.exercisePerformance;

  const taxonomyScores =
    pickUnknownArray(record, ["taxonomyScores"]).length > 0
      ? record.taxonomyScores
      : Array.isArray(record.taxonomyPerformance)
        ? record.taxonomyPerformance
        : taxonomy
          ? taxonomy.taxonomyScores ?? taxonomy.scores
          : record.taxonomyPerformance;

  const resolvedPracticeScore =
    readFiniteNumber(record.practiceScoreOutOf100) ??
    (practice
      ? readFiniteNumber(practice.practiceScoreOutOf100) ??
        readFiniteNumber(practice.scoreOutOf100)
      : null) ??
    readFiniteNumber(record.practicePerformance);

  const resolvedCoachPracticeScore =
    readFiniteNumber(record.coachPracticeScoreOutOf100) ??
    (practice
      ? readFiniteNumber(practice.coachPracticeScoreOutOf100)
      : null);

  const resolvedCompetitionPerformance =
    readFiniteNumber(record.competitionPerformance) ??
    (competition
      ? readFiniteNumber(competition.competitionPerformance) ??
        readFiniteNumber(competition.scoreOutOf100)
      : null);

  const resolvedOverallPerformance =
    readFiniteNumber(record.overallGolferPerformance) ??
    readFiniteNumber(record.overallGolfPerformance) ??
    (overall
      ? readFiniteNumber(overall.overallGolferPerformance) ??
        readFiniteNumber(overall.overallGolfPerformance)
      : null);

  return {
    ...record,
    goalEvidence,
    exerciseTrends,
    taxonomyScores,
    practiceScoreOutOf100: resolvedPracticeScore,
    coachPracticeScoreOutOf100: resolvedCoachPracticeScore,
    competitionPerformance: resolvedCompetitionPerformance,
    overallGolferPerformance: resolvedOverallPerformance,
  };
}

function parseGolfHistoryWeek(
  value: unknown,
): SportMetricsGolfWeeklySummary | null {
  const adapted = adaptBackendSuccess(value);
  const record =
    asRecord(adapted) ??
    asRecord(asRecord(adapted)?.data) ??
    asRecord(value);
  if (!record) return null;
  try {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload(
      flattenGolfHistoryWeekRecord(record),
    );
    if (parsed.weekStartDate === "" || parsed.weekEndDate === "") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function parseSportMetricsGolfWeeklySummaryHistoryPayload(
  payload: unknown,
): SportMetricsGolfWeeklySummary[] {
  return parseHistoryWeekList(payload).reduce<SportMetricsGolfWeeklySummary[]>(
    (weeks, value) => {
      const parsed = parseGolfHistoryWeek(value);
      if (parsed) weeks.push(parsed);
      return weeks;
    },
    [],
  );
}

export async function fetchSportMetricsGolfWeeklySummaryHistory(params: {
  entityId: string;
  athleteId: string;
}): Promise<SportMetricsGolfWeeklySummary[]> {
  const entityId = params.entityId.trim();
  const athleteId = params.athleteId.trim();

  if (entityId === "" || athleteId === "") {
    throw {
      message: "Entity and athlete identifiers are required.",
      status: 400,
      code: "SPORT_METRICS_GOLF_IDS_REQUIRED",
    };
  }

  const raw = await apiRequest(
    paths.entities.athleteSportMetricsGolfWeeklySummaryHistory(
      entityId,
      athleteId,
    ),
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: SPORT_METRICS_GOLF_TIMEOUT_MS,
    },
  );
  return parseSportMetricsGolfWeeklySummaryHistoryPayload(raw);
}

export function golfHistoryWeekKey(
  week: Pick<SportMetricsGolfWeeklySummary, "weekStartDate" | "weekEndDate">,
): string {
  return `${week.weekStartDate}|${week.weekEndDate}`;
}

function normalizeGolfUnit(unit: string | null | undefined): string {
  const raw = unit?.trim() ?? "";
  if (raw === "") return "";
  const upper = raw.toUpperCase();
  if (upper === "PERCENTAGE" || upper === "PERCENT" || upper === "PCT" || upper === "%") {
    return "%";
  }
  return upper;
}

export function golfHistoryUnitsCompatible(
  currentUnit: string | null | undefined,
  historicalUnit: string | null | undefined,
): boolean {
  return normalizeGolfUnit(currentUnit) === normalizeGolfUnit(historicalUnit);
}

export function findMatchingHistoricalGoal(
  current: SportMetricGoalEvidenceGroup,
  historicalGoals: SportMetricGoalEvidenceGroup[],
): SportMetricGoalEvidenceGroup | null {
  const goalId = current.goalId?.trim() ?? "";
  if (goalId !== "") {
    return (
      historicalGoals.find((goal) => (goal.goalId?.trim() ?? "") === goalId) ??
      null
    );
  }
  const name =
    current.goal.goalName?.trim() || current.goalTitle.trim();
  if (name === "") return null;
  return (
    historicalGoals.find((goal) => {
      const historicalName =
        goal.goal.goalName?.trim() || goal.goalTitle.trim();
      return historicalName === name;
    }) ?? null
  );
}

export function findMatchingHistoricalExercise(
  current: SportMetricExerciseTrend,
  historicalExercises: SportMetricExerciseTrend[],
): SportMetricExerciseTrend | null {
  const exerciseId = current.exerciseId?.trim() ?? "";
  if (exerciseId !== "") {
    return (
      historicalExercises.find(
        (item) => (item.exerciseId?.trim() ?? "") === exerciseId,
      ) ?? null
    );
  }
  const skillCode = current.skillCode?.trim() ?? "";
  const name = current.exerciseName?.trim() ?? "";
  if (skillCode !== "" && name !== "") {
    return (
      historicalExercises.find(
        (item) =>
          (item.skillCode?.trim() ?? "") === skillCode &&
          (item.exerciseName?.trim() ?? "") === name,
      ) ?? null
    );
  }
  if (name !== "") {
    const matches = historicalExercises.filter(
      (item) => (item.exerciseName?.trim() ?? "") === name,
    );
    return matches.length === 1 ? (matches[0] ?? null) : null;
  }
  return null;
}

export function findMatchingHistoricalTaxonomy(
  current: SportMetricTaxonomyScore,
  historicalScores: SportMetricTaxonomyScore[],
): SportMetricTaxonomyScore | null {
  const key = current.taxonomyAreaKey?.trim() ?? "";
  if (key === "") return null;
  return (
    historicalScores.find(
      (item) => (item.taxonomyAreaKey?.trim() ?? "") === key,
    ) ?? null
  );
}

function roundGolfHistoryAmount(value: number): number {
  const rounded =
    (Math.round(Math.abs(value) * 10) / 10) * (value < 0 ? -1 : 1);
  return Object.is(rounded, -0) ? 0 : rounded;
}

function formatGolfHistoryAmount(value: number, unit: string | null): string {
  const amount = Math.abs(roundGolfHistoryAmount(value));
  if (unit === "points") {
    const display = Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
    return `${display} points`;
  }
  if (unit === null || unit.trim() === "") {
    const display = Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
    return display;
  }
  const upper = unit.trim().toUpperCase();
  if (upper === "%" || upper === "PERCENTAGE" || upper === "PERCENT" || upper === "PCT") {
    const display = Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
    return `${display}%`;
  }
  const display = Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
  return `${display} ${unit.trim()}`;
}

export function formatGolfHistoryAbsoluteLabel(
  value: number | null,
  unit: string | null,
): string {
  if (value === null) return "—";
  return formatGolfHistoryAmount(value, unit);
}

export function formatGolfHistoryDifferenceLabel(
  current: number | null,
  historical: number | null,
  unit: string | null,
): string {
  if (current === null || historical === null) return "—";
  const raw = current - historical;
  const amount = roundGolfHistoryAmount(raw);
  if (amount === 0) return `→ ${formatGolfHistoryAmount(0, unit)}`;
  const arrow = raw > 0 ? "↑" : "↓";
  return `${arrow} ${formatGolfHistoryAmount(raw, unit)}`;
}

export function releasedPlanTaxonomyAreaKeys(
  summary: SportMetricsGolfWeeklySummary,
): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const group of summary.goalEvidence) {
    const key = group.goal.taxonomyAreaKey?.trim() ?? "";
    if (key === "" || seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
  }
  return keys;
}

export type PostGolfCoachPracticeRatingPayload = {
  trainingPlanVersionId: string;
  taxonomyAreaKey: string;
  rating: number;
};

export function buildGolfCoachPracticeRatingRequestBody(
  payload: PostGolfCoachPracticeRatingPayload,
): PostGolfCoachPracticeRatingPayload {
  const trainingPlanVersionId = payload.trainingPlanVersionId.trim();
  const taxonomyAreaKey = payload.taxonomyAreaKey.trim();
  const rating = payload.rating;

  if (trainingPlanVersionId === "" || taxonomyAreaKey === "") {
    throw {
      message: "Training plan version and taxonomyAreaKey are required.",
      status: 400,
      code: "SPORT_METRICS_GOLF_COACH_PRACTICE_RATING_INVALID",
    };
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw {
      message: "rating must be an integer from 1 to 5.",
      status: 400,
      code: "SPORT_METRICS_GOLF_COACH_PRACTICE_RATING_INVALID",
    };
  }

  return { trainingPlanVersionId, taxonomyAreaKey, rating };
}

export async function postGolfCoachPracticeRating(
  entityId: string,
  athleteId: string,
  payload: PostGolfCoachPracticeRatingPayload,
): Promise<unknown> {
  const resolvedEntityId = entityId.trim();
  const resolvedAthleteId = athleteId.trim();
  if (resolvedEntityId === "" || resolvedAthleteId === "") {
    throw {
      message: "Entity and athlete identifiers are required.",
      status: 400,
      code: "SPORT_METRICS_GOLF_IDS_REQUIRED",
    };
  }

  const requestBody = buildGolfCoachPracticeRatingRequestBody(payload);
  return apiRequest(
    paths.entities.athleteSportMetricsGolfCoachPracticeRatings(
      resolvedEntityId,
      resolvedAthleteId,
    ),
    {
      method: "POST",
      body: JSON.stringify(requestBody),
      timeoutMs: SPORT_METRICS_GOLF_TIMEOUT_MS,
    },
  );
}

export async function submitGolfCoachPracticeRatingThenRefetch(params: {
  postRating: () => Promise<unknown>;
  refetchWeeklySummary: () => Promise<SportMetricsGolfWeeklySummary>;
}): Promise<SportMetricsGolfWeeklySummary> {
  await params.postRating();
  return params.refetchWeeklySummary();
}

export async function fetchSportMetricsGolfComparison(
  params: FetchSportMetricsGolfComparisonParams,
): Promise<SportMetricsGolfComparisonResponse> {
  const raw = await apiRequest(
    paths.entities.athleteSportMetricsGolfComparison(
      params.entityId.trim(),
      params.athleteId.trim(),
      {
        earlierTrainingPlanVersionId:
          params.earlierTrainingPlanVersionId.trim(),
        laterTrainingPlanVersionId:
          params.laterTrainingPlanVersionId.trim(),
      },
    ),
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: SPORT_METRICS_GOLF_TIMEOUT_MS,
    },
  );

  return parseSportMetricsGolfComparisonPayload(raw);
}

export type PostGolfSportMetricRecordPayload = {
  trainingPlanVersionId: string;
  plannedSessionId: string;
  occurredAt: string;
  metricType: "DRILL_RESULT" | "ROUND_RESULT";
  environment: string;
  source: string;
  prescribedContextJson: Record<string, unknown>;
  valueJson: Record<string, unknown>;
  goalId?: string;
  trainingSessionId?: string;
  plannedSkillItemOrder?: number;
};

function assertPostGolfSportMetricRecordPayload(
  payload: PostGolfSportMetricRecordPayload,
): PostGolfSportMetricRecordPayload {
  const trainingPlanVersionId = payload.trainingPlanVersionId.trim();
  const plannedSessionId = payload.plannedSessionId.trim();
  const occurredAt = payload.occurredAt.trim();
  const metricType = payload.metricType;
  const environment = payload.environment.trim();
  const source = payload.source.trim();

  if (
    trainingPlanVersionId === "" ||
    plannedSessionId === "" ||
    occurredAt === "" ||
    environment === "" ||
    source === ""
  ) {
    throw {
      message:
        "Training plan version, planned session, occurred at, environment, and source are required.",
      status: 400,
      code: "SPORT_METRICS_GOLF_RECORD_INVALID",
    };
  }

  if (metricType !== "DRILL_RESULT" && metricType !== "ROUND_RESULT") {
    throw {
      message: "metricType must be DRILL_RESULT or ROUND_RESULT.",
      status: 400,
      code: "SPORT_METRICS_GOLF_RECORD_INVALID",
    };
  }

  return {
    ...payload,
    trainingPlanVersionId,
    plannedSessionId,
    occurredAt,
    environment,
    source,
  };
}

function assertJsonObjectField(
  value: unknown,
  fieldName: string,
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw {
      message: `${fieldName} must be a JSON object.`,
      status: 400,
      code: "SPORT_METRICS_GOLF_RECORD_INVALID",
    };
  }
}

export function buildGolfSportMetricRecordRequestBody(
  payload: PostGolfSportMetricRecordPayload,
): Record<string, unknown> {
  const body = assertPostGolfSportMetricRecordPayload(payload);
  assertJsonObjectField(body.prescribedContextJson, "prescribedContextJson");
  assertJsonObjectField(body.valueJson, "valueJson");

  const requestBody: Record<string, unknown> = {
    trainingPlanVersionId: body.trainingPlanVersionId,
    plannedSessionId: body.plannedSessionId,
    occurredAt: body.occurredAt,
    metricType: body.metricType,
    environment: body.environment,
    source: body.source,
    prescribedContextJson: body.prescribedContextJson,
    valueJson: body.valueJson,
  };

  const goalId = body.goalId?.trim();
  if (goalId) requestBody.goalId = goalId;

  const trainingSessionId = body.trainingSessionId?.trim();
  if (trainingSessionId) requestBody.trainingSessionId = trainingSessionId;

  if (
    body.plannedSkillItemOrder !== undefined &&
    Number.isInteger(body.plannedSkillItemOrder) &&
    body.plannedSkillItemOrder >= 1
  ) {
    requestBody.plannedSkillItemOrder = body.plannedSkillItemOrder;
  }

  const entryMode = body.valueJson.entryMode;
  if (entryMode === "INDIVIDUAL" || entryMode === "CUMULATIVE") {
    const { entryMode: _entryMode, ...measurementValueJson } = body.valueJson;
    requestBody.entryMode = entryMode;
    requestBody.valueJson = measurementValueJson;
  }

  return requestBody;
}

export async function postGolfSportMetricRecord(
  entityId: string,
  athleteId: string,
  payload: PostGolfSportMetricRecordPayload,
): Promise<unknown> {
  const resolvedEntityId = entityId.trim();
  const resolvedAthleteId = athleteId.trim();

  if (resolvedEntityId === "" || resolvedAthleteId === "") {
    throw {
      message: "Entity and athlete identifiers are required.",
      status: 400,
      code: "SPORT_METRICS_GOLF_IDS_REQUIRED",
    };
  }

  const requestBody = buildGolfSportMetricRecordRequestBody(payload);

  return apiRequest(
    paths.entities.athleteSportMetricsGolfRecords(resolvedEntityId, resolvedAthleteId),
    {
      method: "POST",
      body: JSON.stringify(requestBody),
      timeoutMs: SPORT_METRICS_GOLF_TIMEOUT_MS,
    },
  );
}
