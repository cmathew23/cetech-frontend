"use client";

import { paths } from "@/config/endpoints";
import { apiRequest } from "@/lib/apiClient";
import {
  buildBasketballSportMetricRecordRequestBody,
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
