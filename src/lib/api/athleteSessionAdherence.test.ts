import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
  isNormalizedApiError: () => false,
}));

import { paths } from "@/config/endpoints";
import {
  buildRecordSessionAdherenceRequestBody,
  fetchPlannedSessionAdherenceEvents,
  parsePlannedSessionAdherenceEventsPayload,
  recordPlannedSessionAdherenceEvent,
} from "@/lib/api/athleteSessionAdherence";

function parsePostBody(callIndex = 0): Record<string, unknown> {
  const call = apiRequestMock.mock.calls[callIndex];
  const options = call?.[1] as { body?: string } | undefined;
  return JSON.parse(options?.body ?? "{}") as Record<string, unknown>;
}

describe("athleteSessionAdherence API", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-19T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds the planned-session adherence events path", () => {
    expect(
      paths.trainingSessions.plannedSessionAdherenceEvents("session/abc"),
    ).toBe(
      "/training-sessions/planned-sessions/session%2Fabc/adherence-events",
    );
  });

  it("parses a raw GET array payload with athleteNotes and completionPercent", () => {
    const events = parsePlannedSessionAdherenceEventsPayload(
      [
        {
          id: "event-1",
          plannedSessionId: "session-1",
          eventType: "RECORDED",
          adherenceOutcome: "COMPLETED",
          completionPercent: 100,
          actualDurationMinutes: 45,
          athleteNotes: "Felt good",
          occurredAt: "2026-05-19T10:00:00.000Z",
        },
      ],
      "session-1",
    );

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: "event-1",
      plannedSessionId: "session-1",
      eventType: "RECORDED",
      adherenceOutcome: "COMPLETED",
      completionPercent: 100,
      actualDurationMinutes: 45,
      athleteNotes: "Felt good",
      occurredAt: "2026-05-19T10:00:00.000Z",
    });
  });

  it("fetches adherence events from the planned-session endpoint", async () => {
    apiRequestMock.mockResolvedValue([
      {
        id: "event-1",
        plannedSessionId: "session-1",
        eventType: "VERIFIED",
        adherenceOutcome: "PARTIAL",
        actualDurationMinutes: 30,
      },
    ]);

    const result = await fetchPlannedSessionAdherenceEvents("session-1");

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/training-sessions/planned-sessions/session-1/adherence-events",
      {
        method: "GET",
        cache: "no-store",
        timeoutMs: 120_000,
      },
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.eventType).toBe("VERIFIED");
    expect(result[0]?.adherenceOutcome).toBe("PARTIAL");
  });

  it("posts athleteNotes and occurredAt, not note or generationDomain", async () => {
    apiRequestMock.mockResolvedValue({
      id: "event-2",
      plannedSessionId: "session-2",
      eventType: "RECORDED",
      adherenceOutcome: "SKIPPED",
      athleteNotes: "Travel day",
      occurredAt: "2026-05-19T08:30:00.000Z",
    });

    const result = await recordPlannedSessionAdherenceEvent("session-2", {
      eventType: "RECORDED",
      adherenceOutcome: "SKIPPED",
      athleteNotes: "Travel day",
      occurredAt: "2026-05-19T08:30:00.000Z",
    });

    const body = parsePostBody();
    expect(body).toEqual({
      eventType: "RECORDED",
      adherenceOutcome: "SKIPPED",
      athleteNotes: "Travel day",
      occurredAt: "2026-05-19T08:30:00.000Z",
    });
    expect(body).not.toHaveProperty("note");
    expect(body).not.toHaveProperty("generationDomain");
    expect(body).not.toHaveProperty("trainingDayId");
    expect(body).not.toHaveProperty("trainingPlanVersionId");
    expect(result).toMatchObject({
      id: "event-2",
      plannedSessionId: "session-2",
      eventType: "RECORDED",
      adherenceOutcome: "SKIPPED",
      athleteNotes: "Travel day",
      occurredAt: "2026-05-19T08:30:00.000Z",
    });
  });

  it("defaults occurredAt when omitted from input", async () => {
    apiRequestMock.mockResolvedValue({
      id: "event-2b",
      plannedSessionId: "session-2b",
      eventType: "RECORDED",
      adherenceOutcome: "COMPLETED",
      occurredAt: "2026-05-19T12:00:00.000Z",
    });

    await recordPlannedSessionAdherenceEvent("session-2b", {
      eventType: "RECORDED",
      adherenceOutcome: "COMPLETED",
    });

    expect(parsePostBody()).toMatchObject({
      eventType: "RECORDED",
      adherenceOutcome: "COMPLETED",
      occurredAt: "2026-05-19T12:00:00.000Z",
    });
    expect(parsePostBody()).not.toHaveProperty("note");
  });

  it("posts completionPercent and actualDurationMinutes", async () => {
    apiRequestMock.mockResolvedValue({
      id: "event-3",
      plannedSessionId: "session-3",
      eventType: "UPDATED",
      adherenceOutcome: "PARTIAL",
      completionPercent: 75,
      actualDurationMinutes: 52,
      occurredAt: "2026-05-19T11:00:00.000Z",
    });

    await recordPlannedSessionAdherenceEvent("session-3", {
      eventType: "UPDATED",
      adherenceOutcome: "PARTIAL",
      completionPercent: 75,
      actualDurationMinutes: 52,
      occurredAt: "2026-05-19T11:00:00.000Z",
    });

    expect(parsePostBody()).toEqual({
      eventType: "UPDATED",
      adherenceOutcome: "PARTIAL",
      completionPercent: 75,
      actualDurationMinutes: 52,
      occurredAt: "2026-05-19T11:00:00.000Z",
    });
  });

  it("buildRecordSessionAdherenceRequestBody never includes forbidden POST keys", () => {
    const body = buildRecordSessionAdherenceRequestBody({
      eventType: "RECORDED",
      adherenceOutcome: "COMPLETED",
      athleteNotes: "Done",
      completionPercent: 100,
      actualDurationMinutes: 60,
    });

    expect(body).toMatchObject({
      eventType: "RECORDED",
      adherenceOutcome: "COMPLETED",
      athleteNotes: "Done",
      completionPercent: 100,
      actualDurationMinutes: 60,
      occurredAt: "2026-05-19T12:00:00.000Z",
    });
    expect(body).not.toHaveProperty("note");
    expect(body).not.toHaveProperty("generationDomain");
    expect(body).not.toHaveProperty("trainingDayId");
    expect(body).not.toHaveProperty("trainingPlanVersionId");
  });
});
