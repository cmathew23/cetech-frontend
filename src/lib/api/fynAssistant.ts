"use client";

import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest } from "@/lib/apiClient";

const FYN_ASSISTANT_TIMEOUT_MS = 60_000;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.reduce<string[]>((acc, item) => {
    const text = readString(item);
    if (text !== "") acc.push(text);
    return acc;
  }, []);
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

export type FynUsedSources = {
  plan: boolean;
  adherence: boolean;
  sportMetrics: boolean;
  wearables: boolean;
};

export type FynAssistantResponse = {
  answer: string;
  warnings: string[];
  usedSources: FynUsedSources;
};

export type FynAssistantPromptKey =
  | "EXPLAIN_TODAYS_PLAN"
  | "SUMMARIZE_MY_WEEK"
  | "WHAT_HAVE_I_MISSED"
  | "EXPLAIN_GOLF_METRICS"
  | "SUMMARIZE_ATHLETE"
  | "SHOW_MISSING_LOGS"
  | "SUMMARIZE_GOLF_METRICS"
  | "COACHING_TALKING_POINTS";

export type QueryFynAssistantInput = {
  entityId: string;
  athleteId: string;
  promptKey: FynAssistantPromptKey;
  message?: string;
  trainingPlanVersionId?: string | null;
};

function parseFynAssistantResponse(payload: unknown): FynAssistantResponse {
  const data = adaptBackendSuccess(payload);
  const record = asRecord(data);
  if (!record) {
    throw {
      message: "Fyn Assistant response must be a JSON object.",
      status: 500,
      code: "FYN_ASSISTANT_INVALID_RESPONSE",
      details: payload,
    };
  }

  const usedSourcesRecord = asRecord(record.usedSources);

  return {
    answer: readString(record.answer),
    warnings: readStringArray(record.warnings),
    usedSources: {
      plan: readBoolean(usedSourcesRecord?.plan),
      adherence: readBoolean(usedSourcesRecord?.adherence),
      sportMetrics: readBoolean(usedSourcesRecord?.sportMetrics),
      wearables: readBoolean(usedSourcesRecord?.wearables),
    },
  };
}

export async function queryFynAssistant(
  input: QueryFynAssistantInput,
): Promise<FynAssistantResponse> {
  const entityId = input.entityId.trim();
  const athleteId = input.athleteId.trim();
  const promptKey = input.promptKey.trim();
  const message = input.message?.trim() ?? "";
  const trainingPlanVersionId = input.trainingPlanVersionId?.trim() ?? "";

  if (entityId === "" || athleteId === "" || promptKey === "") {
    throw {
      message: "Entity, athlete, and prompt key are required.",
      status: 400,
      code: "FYN_ASSISTANT_INPUT_REQUIRED",
    };
  }

  const body: {
    promptKey: FynAssistantPromptKey;
    message?: string;
    trainingPlanVersionId?: string;
  } = {
    promptKey: promptKey as FynAssistantPromptKey,
  };

  if (message !== "") body.message = message;
  if (trainingPlanVersionId !== "") {
    body.trainingPlanVersionId = trainingPlanVersionId;
  }

  const response = await apiRequest(
    paths.entities.athleteFynAssistantQuery(entityId, athleteId),
    {
      method: "POST",
      body: JSON.stringify(body),
      timeoutMs: FYN_ASSISTANT_TIMEOUT_MS,
    },
  );

  return parseFynAssistantResponse(response);
}
