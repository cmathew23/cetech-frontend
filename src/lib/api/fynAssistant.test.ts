import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

import { queryFynAssistant } from "@/lib/api/fynAssistant";

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
