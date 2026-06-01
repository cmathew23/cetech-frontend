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
  raw: unknown;
};

export type SportMetricGoalEvidenceGroup = {
  goalId: string | null;
  goalTitle: string;
  goalStatus: string | null;
  successCriteria: string | null;
  evidenceStatus: string | null;
  evidence: SportMetricEvidenceItem[];
  raw: unknown;
};

export type SportMetricsGolfWeeklySummary = {
  sport: string;
  weekStartDate: string;
  weekEndDate: string;
  status: string;
  trainingPlanVersionId: string | null;
  contextFields: string[];
  goalEvidence: SportMetricGoalEvidenceGroup[];
  unlinkedEvidence: SportMetricEvidenceItem[];
  raw: unknown;
};

function parseEvidenceItem(raw: unknown): SportMetricEvidenceItem | null {
  const record = asRecord(raw);
  if (!record) return null;

  const label =
    pickString(record, ["label", "metricLabel", "evidenceLabel", "title", "name"]) ??
    "Result";

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

function parseGoalEvidenceGroup(raw: unknown): SportMetricGoalEvidenceGroup | null {
  const record = asRecord(raw);
  if (!record) return null;

  const goal = asRecord(record.goal);
  const goalTitle =
    pickString(record, ["goalTitle", "title", "goalName", "name"]) ??
    pickString(goal, ["title", "goalTitle", "name", "label"]) ??
    "Goal";

  const evidence = parseEvidenceItemList(record);

  return {
    goalId: pickString(record, ["goalId", "id"]),
    goalTitle,
    goalStatus: pickString(record, ["goalStatus", "status"]),
    successCriteria:
      pickString(record, ["successCriteria", "criteria", "target"]) ??
      pickString(goal, ["successCriteria", "criteria", "target"]),
    evidenceStatus: pickString(record, ["evidenceStatus", "summaryStatus"]),
    evidence,
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
    "unlinkedEvidence" in direct
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

  return {
    sport,
    weekStartDate,
    weekEndDate,
    status,
    trainingPlanVersionId: pickString(record, ["trainingPlanVersionId", "versionId"]),
    contextFields: pickStringArray(record, ["contextFields", "visibleContextFields"]),
    goalEvidence,
    unlinkedEvidence,
    raw: payload,
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
