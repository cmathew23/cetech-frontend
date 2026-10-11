"use client";

import { paths } from "@/config/endpoints";
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
