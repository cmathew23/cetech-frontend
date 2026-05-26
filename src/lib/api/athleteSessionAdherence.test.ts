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
  buildRecordNutritionSessionAdherenceRequestBody,
  buildRecordSessionAdherenceRequestBody,
  fetchPlannedSessionAdherenceEvents,
  parsePlannedSessionAdherenceEventsPayload,
  parseRecordPlannedSessionAdherenceEventPayload,
  recordNutritionPlannedSessionAdherenceEvent,
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
    expect(events[0]?.items).toBeUndefined();
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

  it("parses POST response with event and projection", () => {
    const parsed = parseRecordPlannedSessionAdherenceEventPayload(
      {
        event: {
          id: "event-4",
          plannedSessionId: "session-4",
          eventType: "RECORDED",
          adherenceOutcome: "COMPLETED",
          completionPercent: 100,
          occurredAt: "2026-05-19T09:00:00.000Z",
        },
        projection: {
          id: "session-4",
          title: "Skills session",
        },
      },
      "session-4",
    );

    expect(parsed).toMatchObject({
      id: "event-4",
      plannedSessionId: "session-4",
      eventType: "RECORDED",
      adherenceOutcome: "COMPLETED",
      completionPercent: 100,
    });
    expect(parsed?.raw).toEqual(
      expect.objectContaining({
        id: "event-4",
        plannedSessionId: "session-4",
      }),
    );
  });

  it("recordPlannedSessionAdherenceEvent parses POST { event, projection }", async () => {
    apiRequestMock.mockResolvedValue({
      event: {
        id: "event-5",
        plannedSessionId: "session-5",
        eventType: "UPDATED",
        adherenceOutcome: "PARTIAL",
        completionPercent: 50,
        athleteNotes: "Half done",
        occurredAt: "2026-05-19T10:30:00.000Z",
      },
      projection: { id: "session-5" },
    });

    const result = await recordPlannedSessionAdherenceEvent("session-5", {
      eventType: "UPDATED",
      adherenceOutcome: "PARTIAL",
      completionPercent: 50,
      athleteNotes: "Half done",
    });

    expect(result).toMatchObject({
      id: "event-5",
      plannedSessionId: "session-5",
      eventType: "UPDATED",
      adherenceOutcome: "PARTIAL",
      completionPercent: 50,
      athleteNotes: "Half done",
    });
    expect(parsePostBody()).toMatchObject({
      eventType: "UPDATED",
      adherenceOutcome: "PARTIAL",
      completionPercent: 50,
      athleteNotes: "Half done",
      occurredAt: "2026-05-19T12:00:00.000Z",
    });
  });

  it("throws when POST response has no parseable event", async () => {
    apiRequestMock.mockResolvedValue({
      projection: { id: "session-x" },
    });

    await expect(
      recordPlannedSessionAdherenceEvent("session-x", {
        eventType: "RECORDED",
        adherenceOutcome: "COMPLETED",
      }),
    ).rejects.toMatchObject({
      message: "Invalid adherence event response",
      code: "INVALID_ADHERENCE_EVENT_RESPONSE",
    });
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

  it("parses nutrition GET events with items[] and nullable nutrient fields", () => {
    const events = parsePlannedSessionAdherenceEventsPayload(
      [
        {
          id: "nutrition-event-1",
          plannedSessionId: "nutrition-session-1",
          eventType: "RECORDED",
          notes: "Post-workout meal",
          items: [
            {
              id: "item-1",
              athleteSessionAdherenceEventId: "nutrition-event-1",
              plannedItemOrder: 1,
              nutritionCatalogItemId: "catalog-1",
              label: "Chicken breast",
              serving: "6 oz",
              timing: "post",
              consumedPortionFactor: 1,
              plannedCaloriesKcal: 280,
              plannedProteinG: 52,
              plannedCarbohydrateG: null,
              plannedFatG: 6,
              consumedCaloriesKcal: 280,
              consumedProteinG: 52,
              consumedCarbohydrateG: null,
              consumedFatG: 6,
            },
            {
              plannedItemOrder: 2,
              consumedPortionFactor: 0.5,
              plannedMagnesiumMg: null,
              consumedMagnesiumMg: null,
            },
          ],
        },
      ],
      "nutrition-session-1",
    );

    expect(events).toHaveLength(1);
    expect(events[0]?.athleteNotes).toBe("Post-workout meal");
    expect(events[0]?.items).toHaveLength(2);
    expect(events[0]?.items?.[0]).toMatchObject({
      id: "item-1",
      athleteSessionAdherenceEventId: "nutrition-event-1",
      plannedItemOrder: 1,
      nutritionCatalogItemId: "catalog-1",
      label: "Chicken breast",
      serving: "6 oz",
      timing: "post",
      consumedPortionFactor: 1,
      plannedCaloriesKcal: 280,
      plannedProteinG: 52,
      plannedCarbohydrateG: null,
      plannedFatG: 6,
      consumedCaloriesKcal: 280,
      consumedProteinG: 52,
      consumedCarbohydrateG: null,
      consumedFatG: 6,
    });
    expect(events[0]?.items?.[1]).toMatchObject({
      plannedItemOrder: 2,
      consumedPortionFactor: 0.5,
      plannedMagnesiumMg: null,
      consumedMagnesiumMg: null,
    });
    expect(events[0]?.items?.[1]?.plannedMagnesiumMg).toBeNull();
    expect(events[0]?.items?.[1]?.consumedMagnesiumMg).toBeNull();
    expect(events[0]?.items?.[1]?.plannedCaloriesKcal).toBeUndefined();
  });

  it("posts nutrition adherence with items[] and notes only", async () => {
    apiRequestMock.mockResolvedValue({
      id: "nutrition-event-2",
      plannedSessionId: "nutrition-session-2",
      eventType: "RECORDED",
      notes: "Ate most of it",
      items: [
        { plannedItemOrder: 1, consumedPortionFactor: 1 },
        { plannedItemOrder: 2, consumedPortionFactor: 0.5 },
      ],
    });

    const result = await recordNutritionPlannedSessionAdherenceEvent(
      "nutrition-session-2",
      {
        notes: "  Ate most of it  ",
        items: [
          { plannedItemOrder: 1, consumedPortionFactor: 1 },
          { plannedItemOrder: 2, consumedPortionFactor: 0.5 },
        ],
      },
    );

    const body = parsePostBody();
    expect(body).toEqual({
      eventType: "RECORDED",
      notes: "Ate most of it",
      items: [
        { plannedItemOrder: 1, consumedPortionFactor: 1 },
        { plannedItemOrder: 2, consumedPortionFactor: 0.5 },
      ],
    });
    expect(body).not.toHaveProperty("adherenceOutcome");
    expect(body).not.toHaveProperty("completionPercent");
    expect(body).not.toHaveProperty("actualDurationMinutes");
    expect(body).not.toHaveProperty("athleteNotes");
    expect(body).not.toHaveProperty("occurredAt");
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/training-sessions/planned-sessions/nutrition-session-2/adherence-events",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toMatchObject({
      id: "nutrition-event-2",
      plannedSessionId: "nutrition-session-2",
      eventType: "RECORDED",
      athleteNotes: "Ate most of it",
    });
    expect(result.items).toHaveLength(2);
  });

  it("buildRecordNutritionSessionAdherenceRequestBody defaults eventType to RECORDED", () => {
    const body = buildRecordNutritionSessionAdherenceRequestBody({
      items: [{ plannedItemOrder: 1, consumedPortionFactor: 0 }],
    });

    expect(body).toEqual({
      eventType: "RECORDED",
      items: [{ plannedItemOrder: 1, consumedPortionFactor: 0 }],
    });
    expect(body).not.toHaveProperty("adherenceOutcome");
    expect(body).not.toHaveProperty("completionPercent");
    expect(body).not.toHaveProperty("actualDurationMinutes");
    expect(body).not.toHaveProperty("athleteNotes");
    expect(body).not.toHaveProperty("occurredAt");
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
