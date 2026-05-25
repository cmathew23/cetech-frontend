import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest } from "@/lib/apiClient";

export type SessionAdherenceOutcome = "COMPLETED" | "PARTIAL" | "SKIPPED";

export type SessionAdherenceEventType = "RECORDED" | "UPDATED" | "VERIFIED";

/** Event types athletes may submit via POST (excludes VERIFIED and REPLACED). */
export type AthleteSessionAdherenceRecordEventType = "RECORDED" | "UPDATED";

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

function resolveOccurredAt(input: RecordSessionAdherenceInput): string {
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

  return {
    id,
    plannedSessionId,
    eventType: readSessionAdherenceEventType(record.eventType),
    adherenceOutcome: readSessionAdherenceOutcome(record.adherenceOutcome),
    completionPercent: readNumber(record.completionPercent),
    actualDurationMinutes: readNumber(record.actualDurationMinutes),
    athleteNotes:
      readString(record.athleteNotes) ?? readString(record.note),
    occurredAt: readString(record.occurredAt),
    recordedAt:
      readString(record.recordedAt) ??
      readString(record.submittedAt) ??
      readString(record.loggedAt),
    createdAt: readString(record.createdAt),
    updatedAt: readString(record.updatedAt),
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

  const adapted = adaptBackendSuccess(raw);
  const parsed = parseAthleteSessionAdherenceEvent(adapted, id);
  if (parsed) return parsed;

  throw {
    message: "Invalid adherence event response",
    status: 500,
    code: "INVALID_ADHERENCE_EVENT_RESPONSE",
  };
}
