import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

import {
  fetchFynAssistantHistory,
  getFynPromptLabel,
  mapFynHistoryToChatMessages,
  queryFynAssistant,
  type FynAssistantHistoryItem,
} from "@/lib/api/fynAssistant";

const sampleHistoryItem: FynAssistantHistoryItem = {
  id: "audit-1",
  createdAt: "2026-06-01T10:00:00.000Z",
  promptKey: "EXPLAIN_TODAYS_PLAN",
  userMessage: null,
  assistantMessage: "Today focuses on short game.",
  fallbackUsed: false,
  warnings: ["No wearable data."],
  usedSources: {
    plan: true,
    adherence: true,
    sportMetrics: false,
    wearables: false,
  },
};

describe("queryFynAssistant", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("posts to the fyn endpoint with a JSON string body", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        answer: "Today is focused on short game.",
        warnings: ["No wearable data available."],
        usedSources: {
          plan: true,
          adherence: true,
          sportMetrics: false,
          wearables: false,
        },
      },
    });

    const result = await queryFynAssistant({
      entityId: "entity-1",
      athleteId: "athlete-1",
      promptKey: "EXPLAIN_TODAYS_PLAN",
      message: "Keep it brief",
      trainingPlanVersionId: "version-1",
    });

    expect(result.answer).toBe("Today is focused on short game.");
    expect(result.warnings).toEqual(["No wearable data available."]);

    const [path, options] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];

    expect(path).toBe(
      "/entities/entity-1/athletes/athlete-1/fyn-assistant/query",
    );
    expect(options.method).toBe("POST");
    expect(typeof options.body).toBe("string");

    const body = JSON.parse(options.body as string) as Record<string, unknown>;
    expect(body).toEqual({
      promptKey: "EXPLAIN_TODAYS_PLAN",
      message: "Keep it brief",
      trainingPlanVersionId: "version-1",
    });
  });

  it("omits empty optional fields", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        answer: "Weekly summary.",
        warnings: [],
        usedSources: {
          plan: true,
          adherence: false,
          sportMetrics: false,
          wearables: false,
        },
      },
    });

    await queryFynAssistant({
      entityId: "entity-1",
      athleteId: "athlete-1",
      promptKey: "SUMMARIZE_MY_WEEK",
      message: "   ",
      trainingPlanVersionId: "   ",
    });

    const [, options] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    const body = JSON.parse(options.body as string) as Record<string, unknown>;

    expect(body).toEqual({
      promptKey: "SUMMARIZE_MY_WEEK",
    });
  });
});

describe("getFynPromptLabel", () => {
  it("maps athlete prompt keys to readable labels", () => {
    expect(getFynPromptLabel("SUMMARIZE_MY_WEEK", "athlete")).toBe("Summarize my week");
  });

  it("maps coach prompt keys to readable labels", () => {
    expect(getFynPromptLabel("COACHING_TALKING_POINTS", "coach")).toBe(
      "Give coaching talking points",
    );
  });

  it("falls back for unknown prompt keys", () => {
    expect(getFynPromptLabel("CUSTOM_PROMPT_KEY", "athlete")).toBe("CUSTOM PROMPT KEY");
  });
});

describe("mapFynHistoryToChatMessages", () => {
  it("maps one backend item into two chat messages", () => {
    const messages = mapFynHistoryToChatMessages([sampleHistoryItem], "athlete");

    expect(messages).toHaveLength(2);
    expect(messages[0]).toEqual({
      id: "audit-1-user",
      role: "user",
      text: "Explain today’s plan",
      createdAt: "2026-06-01T10:00:00.000Z",
    });
    expect(messages[1]).toEqual({
      id: "audit-1-assistant",
      role: "assistant",
      text: "Today focuses on short game.",
      createdAt: "2026-06-01T10:00:00.000Z",
      warnings: ["No wearable data."],
      usedSources: {
        plan: true,
        adherence: true,
        sportMetrics: false,
        wearables: false,
      },
    });
  });

  it("uses custom userMessage as user bubble text", () => {
    const messages = mapFynHistoryToChatMessages(
      [{ ...sampleHistoryItem, userMessage: "Keep it brief" }],
      "athlete",
    );

    expect(messages[0]?.text).toBe("Keep it brief");
  });

  it("returns empty array for empty items", () => {
    expect(mapFynHistoryToChatMessages([], "coach")).toEqual([]);
  });
});

describe("fetchFynAssistantHistory", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("calls the history endpoint with the requested athlete id", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        windowHours: 72,
        items: [sampleHistoryItem],
      },
    });

    const result = await fetchFynAssistantHistory({
      entityId: "entity-1",
      athleteId: "athlete-1",
      role: "athlete",
    });

    const [path, options] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];

    expect(path).toBe(
      "/entities/entity-1/athletes/athlete-1/fyn-assistant/history",
    );
    expect(options.method).toBe("GET");
    expect(result.windowHours).toBe(72);
    expect(result.items).toHaveLength(1);
    expect(result.messages).toHaveLength(2);
  });

  it("uses the provided athlete id for each history GET request", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        windowHours: 72,
        items: [],
      },
    });

    await fetchFynAssistantHistory({
      entityId: "entity-1",
      athleteId: "athlete-501",
      role: "coach",
    });
    await fetchFynAssistantHistory({
      entityId: "entity-1",
      athleteId: "athlete-502",
      role: "coach",
    });

    const firstPath = apiRequestMock.mock.calls[0]?.[0];
    const secondPath = apiRequestMock.mock.calls[1]?.[0];

    expect(firstPath).toBe(
      "/entities/entity-1/athletes/athlete-501/fyn-assistant/history",
    );
    expect(secondPath).toBe(
      "/entities/entity-1/athletes/athlete-502/fyn-assistant/history",
    );
  });

  it("defaults usedSources safely when missing or partial", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        windowHours: 72,
        items: [
          {
            id: "audit-2",
            createdAt: "2026-06-01T11:00:00.000Z",
            promptKey: "SUMMARIZE_ATHLETE",
            userMessage: null,
            assistantMessage: "Athlete summary.",
            fallbackUsed: false,
            warnings: [],
          },
        ],
      },
    });

    const result = await fetchFynAssistantHistory({
      entityId: "entity-1",
      athleteId: "athlete-1",
      role: "coach",
    });

    expect(result.messages[1]?.usedSources).toEqual({
      plan: false,
      adherence: false,
      sportMetrics: false,
      wearables: false,
    });
    expect(result.messages[0]?.text).toBe("Summarize athlete");
  });

  it("throws normalized error for invalid payload", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        items: [],
      },
    });

    await expect(
      fetchFynAssistantHistory({
        entityId: "entity-1",
        athleteId: "athlete-1",
        role: "athlete",
      }),
    ).rejects.toMatchObject({
      code: "FYN_ASSISTANT_HISTORY_INVALID_RESPONSE",
    });
  });
});
