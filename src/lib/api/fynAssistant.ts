"use client";

import type { FynChatMessage } from "@/components/fyn/FynChatThread";
import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest } from "@/lib/apiClient";

const FYN_ASSISTANT_TIMEOUT_MS = 60_000;

const ATHLETE_FYN_PROMPT_LABELS: Record<string, string> = {
  EXPLAIN_TODAYS_PLAN: "Explain today’s plan",
  SUMMARIZE_MY_WEEK: "Summarize my week",
  WHAT_HAVE_I_MISSED: "What have I missed?",
  EXPLAIN_GOLF_METRICS: "Explain my Golf Metrics",
};

const COACH_FYN_PROMPT_LABELS: Record<string, string> = {
  SUMMARIZE_ATHLETE: "Summarize athlete",
  SHOW_MISSING_LOGS: "Show missing logs",
  SUMMARIZE_GOLF_METRICS: "Summarize Golf Metrics",
  COACHING_TALKING_POINTS: "Give coaching talking points",
};

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

function readNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = readString(value);
  return text === "" ? null : text;
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

export type FynHistoryRole = "athlete" | "coach";

export type FynAssistantHistoryItem = {
  id: string;
  createdAt: string;
  promptKey: string;
  userMessage: string | null;
  assistantMessage: string;
  fallbackUsed: boolean;
  warnings: string[];
  usedSources: FynUsedSources;
};

export type FynAssistantHistoryResult = {
  windowHours: number;
  items: FynAssistantHistoryItem[];
  messages: FynChatMessage[];
};

export type QueryFynAssistantInput = {
  entityId: string;
  athleteId: string;
  promptKey: FynAssistantPromptKey;
  message?: string;
  trainingPlanVersionId?: string | null;
};

export type FetchFynAssistantHistoryInput = {
  entityId: string;
  athleteId: string;
  role: FynHistoryRole;
};

function parseUsedSources(value: unknown): FynUsedSources {
  const usedSourcesRecord = asRecord(value);
  return {
    plan: readBoolean(usedSourcesRecord?.plan),
    adherence: readBoolean(usedSourcesRecord?.adherence),
    sportMetrics: readBoolean(usedSourcesRecord?.sportMetrics),
    wearables: readBoolean(usedSourcesRecord?.wearables),
  };
}

export function getFynPromptLabel(
  promptKey: string,
  role: FynHistoryRole,
): string {
  const key = promptKey.trim();
  if (key === "") return "";

  const labels = role === "coach" ? COACH_FYN_PROMPT_LABELS : ATHLETE_FYN_PROMPT_LABELS;
  return labels[key] ?? key.replaceAll("_", " ");
}

export function mapFynHistoryToChatMessages(
  items: FynAssistantHistoryItem[],
  role: FynHistoryRole,
): FynChatMessage[] {
  return items.flatMap((item) => {
    const userText =
      item.userMessage !== null && item.userMessage !== ""
        ? item.userMessage
        : getFynPromptLabel(item.promptKey, role);

    return [
      {
        id: `${item.id}-user`,
        role: "user",
        text: userText,
      },
      {
        id: `${item.id}-assistant`,
        role: "assistant",
        text: item.assistantMessage,
        warnings: item.warnings,
        usedSources: item.usedSources,
      },
    ];
  });
}

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

  return {
    answer: readString(record.answer),
    warnings: readStringArray(record.warnings),
    usedSources: parseUsedSources(record.usedSources),
  };
}

function parseFynAssistantHistoryItem(value: unknown): FynAssistantHistoryItem | null {
  const record = asRecord(value);
  if (!record) return null;

  const id = readString(record.id);
  const promptKey = readString(record.promptKey);
  const assistantMessage = readString(record.assistantMessage);

  if (id === "" || promptKey === "" || assistantMessage === "") {
    return null;
  }

  return {
    id,
    createdAt: readString(record.createdAt),
    promptKey,
    userMessage: readNullableString(record.userMessage),
    assistantMessage,
    fallbackUsed: readBoolean(record.fallbackUsed),
    warnings: readStringArray(record.warnings),
    usedSources: parseUsedSources(record.usedSources),
  };
}

function parseFynAssistantHistoryResponse(payload: unknown): {
  windowHours: number;
  items: FynAssistantHistoryItem[];
} {
  const data = adaptBackendSuccess(payload);
  const record = asRecord(data);
  if (!record) {
    throw {
      message: "Fyn Assistant history response must be a JSON object.",
      status: 500,
      code: "FYN_ASSISTANT_HISTORY_INVALID_RESPONSE",
      details: payload,
    };
  }

  const windowHours =
    typeof record.windowHours === "number" && Number.isFinite(record.windowHours)
      ? record.windowHours
      : NaN;

  if (!Number.isFinite(windowHours)) {
    throw {
      message: "Fyn Assistant history response must include windowHours.",
      status: 500,
      code: "FYN_ASSISTANT_HISTORY_INVALID_RESPONSE",
      details: payload,
    };
  }

  if (!Array.isArray(record.items)) {
    throw {
      message: "Fyn Assistant history response must include items.",
      status: 500,
      code: "FYN_ASSISTANT_HISTORY_INVALID_RESPONSE",
      details: payload,
    };
  }

  const items = record.items.reduce<FynAssistantHistoryItem[]>((acc, entry) => {
    const parsed = parseFynAssistantHistoryItem(entry);
    if (parsed) acc.push(parsed);
    return acc;
  }, []);

  return { windowHours, items };
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

export async function fetchFynAssistantHistory(
  input: FetchFynAssistantHistoryInput,
): Promise<FynAssistantHistoryResult> {
  const entityId = input.entityId.trim();
  const athleteId = input.athleteId.trim();

  if (entityId === "" || athleteId === "") {
    throw {
      message: "Entity and athlete are required.",
      status: 400,
      code: "FYN_ASSISTANT_HISTORY_INPUT_REQUIRED",
    };
  }

  const response = await apiRequest(
    paths.entities.athleteFynAssistantHistory(entityId, athleteId),
    {
      method: "GET",
      timeoutMs: FYN_ASSISTANT_TIMEOUT_MS,
    },
  );

  const { windowHours, items } = parseFynAssistantHistoryResponse(response);

  return {
    windowHours,
    items,
    messages: mapFynHistoryToChatMessages(items, input.role),
  };
}
