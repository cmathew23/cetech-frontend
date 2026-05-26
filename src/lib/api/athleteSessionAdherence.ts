import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest } from "@/lib/apiClient";

const PLANNED_SESSION_ADHERENCE_TIMEOUT_MS = 120_000;

export type SessionAdherenceOutcome = "COMPLETED" | "PARTIAL" | "SKIPPED";

export type SessionAdherenceEventType = "RECORDED" | "UPDATED" | "VERIFIED";

/** Event types athletes may submit via POST (excludes VERIFIED and REPLACED). */
export type AthleteSessionAdherenceRecordEventType = "RECORDED" | "UPDATED";

export type NutritionAdherenceItemInput = {
  plannedItemOrder: number;
  consumedPortionFactor: number;
};

export type NutritionAdherenceEventItem = {
  id?: string;
  athleteSessionAdherenceEventId?: string;
  plannedItemOrder: number;
  nutritionCatalogItemId?: string | null;
  label?: string | null;
  serving?: string | null;
  timing?: string | null;
  consumedPortionFactor: number;
  plannedCaloriesKcal?: number | null;
  plannedProteinG?: number | null;
  plannedCarbohydrateG?: number | null;
  plannedFatG?: number | null;
  plannedFiberG?: number | null;
  plannedCalciumMg?: number | null;
  plannedMagnesiumMg?: number | null;
  plannedPotassiumMg?: number | null;
  plannedSodiumMg?: number | null;
  consumedCaloriesKcal?: number | null;
  consumedProteinG?: number | null;
  consumedCarbohydrateG?: number | null;
  consumedFatG?: number | null;
  consumedFiberG?: number | null;
  consumedCalciumMg?: number | null;
  consumedMagnesiumMg?: number | null;
  consumedPotassiumMg?: number | null;
  consumedSodiumMg?: number | null;
};

export type RecordNutritionSessionAdherenceInput = {
  eventType?: AthleteSessionAdherenceRecordEventType;
  notes?: string;
  items: NutritionAdherenceItemInput[];
  /** ISO-8601 timestamp; omitted values default to `new Date().toISOString()` on POST. */
  occurredAt?: string | null;
};

export type AthleteSessionAdherenceEvent = {
  id: string;
  plannedSessionId: string;
  eventType: SessionAdherenceEventType | null;
  adherenceOutcome: SessionAdherenceOutcome | null;
  completionPercent: number | null;
  actualDurationMinutes: number | null;
  athleteNotes: string | null;
  occurredAt: string | null;
  recordedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  items?: NutritionAdherenceEventItem[];
  raw: unknown;
};

export type RecordSessionAdherenceInput = {
  eventType: AthleteSessionAdherenceRecordEventType;
  adherenceOutcome: SessionAdherenceOutcome;
  completionPercent?: number | null;
  actualDurationMinutes?: number | null;
  athleteNotes?: string | null;
  /** ISO-8601 timestamp; omitted values default to `new Date().toISOString()` on POST. */
  occurredAt?: string | null;
};

const SESSION_ADHERENCE_OUTCOMES = new Set<SessionAdherenceOutcome>([
  "COMPLETED",
  "PARTIAL",
  "SKIPPED",
]);

const SESSION_ADHERENCE_EVENT_TYPES = new Set<SessionAdherenceEventType>([
  "RECORDED",
  "UPDATED",
  "VERIFIED",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function readNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function readNullableString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function readPlannedItemOrder(value: unknown): number | null {
  const n = readNumber(value);
  if (n === null || !Number.isInteger(n) || n < 1) return null;
  return n;
}

function readConsumedPortionFactor(value: unknown): number | null {
  const n = readNumber(value);
  if (n === null || n < 0) return null;
  return n;
}

function parseNutritionAdherenceEventItem(value: unknown): NutritionAdherenceEventItem | null {
  const record = asRecord(value);
  if (!record) return null;

  const plannedItemOrder = readPlannedItemOrder(record.plannedItemOrder);
  const consumedPortionFactor = readConsumedPortionFactor(record.consumedPortionFactor);
  if (plannedItemOrder === null || consumedPortionFactor === null) return null;

  const item: NutritionAdherenceEventItem = {
    plannedItemOrder,
    consumedPortionFactor,
  };

  const id = readString(record.id);
  if (id) item.id = id;

  const athleteSessionAdherenceEventId = readString(record.athleteSessionAdherenceEventId);
  if (athleteSessionAdherenceEventId) {
    item.athleteSessionAdherenceEventId = athleteSessionAdherenceEventId;
  }

  const nutritionCatalogItemId = readNullableString(record.nutritionCatalogItemId);
  if (nutritionCatalogItemId !== undefined) {
    item.nutritionCatalogItemId = nutritionCatalogItemId;
  }

  const label = readNullableString(record.label);
  if (label !== undefined) item.label = label;

  const serving = readNullableString(record.serving);
  if (serving !== undefined) item.serving = serving;

  const timing = readNullableString(record.timing);
  if (timing !== undefined) item.timing = timing;

  const nutrientKeys = [
    "plannedCaloriesKcal",
    "plannedProteinG",
    "plannedCarbohydrateG",
    "plannedFatG",
    "plannedFiberG",
    "plannedCalciumMg",
    "plannedMagnesiumMg",
    "plannedPotassiumMg",
    "plannedSodiumMg",
    "consumedCaloriesKcal",
    "consumedProteinG",
    "consumedCarbohydrateG",
    "consumedFatG",
    "consumedFiberG",
    "consumedCalciumMg",
    "consumedMagnesiumMg",
    "consumedPotassiumMg",
    "consumedSodiumMg",
  ] as const;

  for (const key of nutrientKeys) {
    if (!(key in record)) continue;
    const nutrientValue = record[key];
    if (nutrientValue === null) {
      item[key] = null;
      continue;
    }
    const parsed = readNumber(nutrientValue);
    if (parsed !== null) {
      item[key] = parsed;
    }
  }

  return item;
}

function parseNutritionAdherenceEventItems(
  value: unknown,
): NutritionAdherenceEventItem[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) return undefined;

  const items = value
    .map((entry) => parseNutritionAdherenceEventItem(entry))
    .filter((item): item is NutritionAdherenceEventItem => item !== null);

  return items;
}

function readSessionAdherenceOutcome(value: unknown): SessionAdherenceOutcome | null {
  const raw = readString(value);
  if (!raw || !SESSION_ADHERENCE_OUTCOMES.has(raw as SessionAdherenceOutcome)) {
    return null;
  }
  return raw as SessionAdherenceOutcome;
}

function readSessionAdherenceEventType(value: unknown): SessionAdherenceEventType | null {
  const raw = readString(value);
  if (!raw || !SESSION_ADHERENCE_EVENT_TYPES.has(raw as SessionAdherenceEventType)) {
    return null;
  }
  return raw as SessionAdherenceEventType;
}

function assertPlannedSessionId(plannedSessionId: string): string {
  const id = plannedSessionId.trim();
  if (id === "") {
    throw {
      message: "plannedSessionId is required",
      status: 400,
      code: "PLANNED_SESSION_ID_REQUIRED",
    };
  }
  return id;
}

function assertRecordSessionAdherenceInput(
  input: RecordSessionAdherenceInput,
): RecordSessionAdherenceInput {
  if (input.eventType !== "RECORDED" && input.eventType !== "UPDATED") {
    throw {
      message: "eventType must be RECORDED or UPDATED",
      status: 400,
      code: "INVALID_ADHERENCE_EVENT_TYPE",
    };
  }
  if (!SESSION_ADHERENCE_OUTCOMES.has(input.adherenceOutcome)) {
    throw {
      message: "adherenceOutcome must be COMPLETED, PARTIAL, or SKIPPED",
      status: 400,
      code: "INVALID_ADHERENCE_OUTCOME",
    };
  }
  if (
    input.completionPercent !== undefined &&
    input.completionPercent !== null &&
    (!Number.isFinite(input.completionPercent) ||
      input.completionPercent < 0 ||
      input.completionPercent > 100)
  ) {
    throw {
      message: "completionPercent must be a number between 0 and 100",
      status: 400,
      code: "INVALID_COMPLETION_PERCENT",
    };
  }
  if (
    input.actualDurationMinutes !== undefined &&
    input.actualDurationMinutes !== null &&
    (!Number.isFinite(input.actualDurationMinutes) || input.actualDurationMinutes < 0)
  ) {
    throw {
      message: "actualDurationMinutes must be a non-negative number",
      status: 400,
      code: "INVALID_ACTUAL_DURATION_MINUTES",
    };
  }
  if (input.occurredAt !== undefined && input.occurredAt !== null) {
    const occurredAt = input.occurredAt.trim();
    if (occurredAt === "") {
      throw {
        message: "occurredAt must be a non-empty ISO-8601 timestamp",
        status: 400,
        code: "INVALID_OCCURRED_AT",
      };
    }
  }
  return input;
}

function resolveOccurredAt(input: { occurredAt?: string | null }): string {
  const provided = input.occurredAt?.trim();
  if (provided) return provided;
  return new Date().toISOString();
}

export function parseAthleteSessionAdherenceEvent(
  value: unknown,
  fallbackPlannedSessionId?: string,
): AthleteSessionAdherenceEvent | null {
  const record = asRecord(value);
  if (!record) return null;

  const id = readString(record.id);
  const plannedSessionId =
    readString(record.plannedSessionId) ?? fallbackPlannedSessionId ?? null;
  if (!id || !plannedSessionId) return null;

  const items = parseNutritionAdherenceEventItems(record.items);

  return {
    id,
    plannedSessionId,
    eventType: readSessionAdherenceEventType(record.eventType),
    adherenceOutcome: readSessionAdherenceOutcome(record.adherenceOutcome),
    completionPercent: readNumber(record.completionPercent),
    actualDurationMinutes: readNumber(record.actualDurationMinutes),
    athleteNotes:
      readString(record.athleteNotes) ??
      readString(record.note) ??
      readString(record.notes),
    occurredAt: readString(record.occurredAt),
    recordedAt:
      readString(record.recordedAt) ??
      readString(record.submittedAt) ??
      readString(record.loggedAt),
    createdAt: readString(record.createdAt),
    updatedAt: readString(record.updatedAt),
    ...(items !== undefined ? { items } : {}),
    raw: value,
  };
}

export function parsePlannedSessionAdherenceEventsPayload(
  raw: unknown,
  plannedSessionId?: string,
): AthleteSessionAdherenceEvent[] {
  const sessionId = plannedSessionId?.trim() ?? "";

  if (Array.isArray(raw)) {
    return raw
      .map((entry) =>
        parseAthleteSessionAdherenceEvent(
          entry,
          sessionId === "" ? undefined : sessionId,
        ),
      )
      .filter((event): event is AthleteSessionAdherenceEvent => event !== null);
  }

  const adapted = adaptBackendSuccess(raw);
  if (Array.isArray(adapted)) {
    return parsePlannedSessionAdherenceEventsPayload(adapted, plannedSessionId);
  }

  return [];
}

function tryParseAdherenceEventCandidate(
  candidate: unknown,
  fallbackPlannedSessionId?: string,
): AthleteSessionAdherenceEvent | null {
  return parseAthleteSessionAdherenceEvent(candidate, fallbackPlannedSessionId);
}

/**
 * POST /training-sessions/planned-sessions/:plannedSessionId/adherence-events
 * Accepts event-only payloads and wrapped shapes including `{ event, projection }`.
 */
export function parseRecordPlannedSessionAdherenceEventPayload(
  raw: unknown,
  fallbackPlannedSessionId?: string,
): AthleteSessionAdherenceEvent | null {
  const sessionId =
    fallbackPlannedSessionId?.trim() === ""
      ? undefined
      : fallbackPlannedSessionId?.trim();

  const direct = tryParseAdherenceEventCandidate(raw, sessionId);
  if (direct) return direct;

  const adapted = adaptBackendSuccess(raw);
  const fromAdapted = tryParseAdherenceEventCandidate(adapted, sessionId);
  if (fromAdapted) return fromAdapted;

  const record = asRecord(adapted) ?? asRecord(raw);
  if (!record) return null;

  for (const key of ["event", "adherenceEvent"] as const) {
    const nested = tryParseAdherenceEventCandidate(record[key], sessionId);
    if (nested) return nested;
  }

  const data = asRecord(record.data);
  if (!data) return null;

  const fromData = tryParseAdherenceEventCandidate(data, sessionId);
  if (fromData) return fromData;

  for (const key of ["event", "adherenceEvent"] as const) {
    const nested = tryParseAdherenceEventCandidate(data[key], sessionId);
    if (nested) return nested;
  }

  return null;
}

export function buildRecordSessionAdherenceRequestBody(
  input: RecordSessionAdherenceInput,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    eventType: input.eventType,
    adherenceOutcome: input.adherenceOutcome,
    occurredAt: resolveOccurredAt(input),
  };

  if (
    input.completionPercent !== undefined &&
    input.completionPercent !== null
  ) {
    body.completionPercent = input.completionPercent;
  }

  if (
    input.actualDurationMinutes !== undefined &&
    input.actualDurationMinutes !== null
  ) {
    body.actualDurationMinutes = input.actualDurationMinutes;
  }

  if (input.athleteNotes !== undefined && input.athleteNotes !== null) {
    const athleteNotes = input.athleteNotes.trim();
    if (athleteNotes !== "") {
      body.athleteNotes = athleteNotes;
    }
  }

  return body;
}

function assertRecordNutritionSessionAdherenceInput(
  input: RecordNutritionSessionAdherenceInput,
): RecordNutritionSessionAdherenceInput {
  const eventType = input.eventType ?? "RECORDED";
  if (eventType !== "RECORDED" && eventType !== "UPDATED") {
    throw {
      message: "eventType must be RECORDED or UPDATED",
      status: 400,
      code: "INVALID_ADHERENCE_EVENT_TYPE",
    };
  }
  if (!Array.isArray(input.items)) {
    throw {
      message: "items must be an array",
      status: 400,
      code: "INVALID_NUTRITION_ADHERENCE_ITEMS",
    };
  }
  for (const item of input.items) {
    const plannedItemOrder = readPlannedItemOrder(item.plannedItemOrder);
    const consumedPortionFactor = readConsumedPortionFactor(item.consumedPortionFactor);
    if (plannedItemOrder === null || consumedPortionFactor === null) {
      throw {
        message:
          "each item must include a positive integer plannedItemOrder and a non-negative consumedPortionFactor",
        status: 400,
        code: "INVALID_NUTRITION_ADHERENCE_ITEM",
      };
    }
  }
  if (input.occurredAt !== undefined && input.occurredAt !== null) {
    const occurredAt = input.occurredAt.trim();
    if (occurredAt === "") {
      throw {
        message: "occurredAt must be a non-empty ISO-8601 timestamp",
        status: 400,
        code: "INVALID_OCCURRED_AT",
      };
    }
  }
  return { ...input, eventType };
}

export function buildRecordNutritionSessionAdherenceRequestBody(
  input: RecordNutritionSessionAdherenceInput,
): Record<string, unknown> {
  const validated = assertRecordNutritionSessionAdherenceInput(input);
  const body: Record<string, unknown> = {
    eventType: validated.eventType ?? "RECORDED",
    occurredAt: resolveOccurredAt(validated),
    items: validated.items.map((item) => ({
      plannedItemOrder: item.plannedItemOrder,
      consumedPortionFactor: item.consumedPortionFactor,
    })),
  };

  if (validated.notes !== undefined && validated.notes !== null) {
    const notes = validated.notes.trim();
    if (notes !== "") {
      body.notes = notes;
    }
  }

  return body;
}

/**
 * GET /training-sessions/planned-sessions/:plannedSessionId/adherence-events
 * Response is a raw JSON array (not wrapped in `{ data }`).
 */
export async function fetchPlannedSessionAdherenceEvents(
  plannedSessionId: string,
): Promise<AthleteSessionAdherenceEvent[]> {
  const id = assertPlannedSessionId(plannedSessionId);
  const raw = await apiRequest<unknown>(
    paths.trainingSessions.plannedSessionAdherenceEvents(id),
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: PLANNED_SESSION_ADHERENCE_TIMEOUT_MS,
    },
  );
  return parsePlannedSessionAdherenceEventsPayload(raw, id);
}

/**
 * POST /training-sessions/planned-sessions/:plannedSessionId/adherence-events
 * Athletes submit RECORDED or UPDATED only (not VERIFIED or REPLACED).
 */
export async function recordPlannedSessionAdherenceEvent(
  plannedSessionId: string,
  input: RecordSessionAdherenceInput,
): Promise<AthleteSessionAdherenceEvent> {
  const id = assertPlannedSessionId(plannedSessionId);
  const validated = assertRecordSessionAdherenceInput(input);
  const raw = await apiRequest<unknown>(
    paths.trainingSessions.plannedSessionAdherenceEvents(id),
    {
      method: "POST",
      body: JSON.stringify(buildRecordSessionAdherenceRequestBody(validated)),
    },
  );

  const parsed = parseRecordPlannedSessionAdherenceEventPayload(raw, id);
  if (parsed) return parsed;

  throw {
    message: "Invalid adherence event response",
    status: 500,
    code: "INVALID_ADHERENCE_EVENT_RESPONSE",
  };
}

/**
 * POST /training-sessions/planned-sessions/:plannedSessionId/adherence-events
 * Nutrition sessions: eventType, optional notes, and items[] only.
 */
export async function recordNutritionPlannedSessionAdherenceEvent(
  plannedSessionId: string,
  input: RecordNutritionSessionAdherenceInput,
): Promise<AthleteSessionAdherenceEvent> {
  const id = assertPlannedSessionId(plannedSessionId);
  const validated = assertRecordNutritionSessionAdherenceInput(input);
  const raw = await apiRequest<unknown>(
    paths.trainingSessions.plannedSessionAdherenceEvents(id),
    {
      method: "POST",
      body: JSON.stringify(buildRecordNutritionSessionAdherenceRequestBody(validated)),
    },
  );

  const parsed = parseRecordPlannedSessionAdherenceEventPayload(raw, id);
  if (parsed) return parsed;

  throw {
    message: "Invalid adherence event response",
    status: 500,
    code: "INVALID_ADHERENCE_EVENT_RESPONSE",
  };
}
