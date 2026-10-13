import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

import { parseChatMessageHistory, sendChatTextMessage } from "@/lib/api/chat";

describe("sendChatTextMessage", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("POSTs a TEXT message and no extra metadata", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        id: "message-1",
        conversationId: "conversation-1",
        content: "Please enter the measurement.",
        messageType: "TEXT",
      },
    });

    await sendChatTextMessage("conversation-1", "Please enter the measurement.");

    const [path, options] = apiRequestMock.mock.calls[0] as [
      string,
      { method?: string; body?: string },
    ];
    expect(path).toBe("/api/chat/conversations/conversation-1/messages");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body ?? "")).toEqual({
      messageType: "TEXT",
      content: "Please enter the measurement.",
    });
  });

  it("reads the conversation coachName returned with message history", () => {
    const history = parseChatMessageHistory({
      coachName: "Greg Michaels",
      messages: [
        {
          id: "message-1",
          conversationId: "conversation-1",
          content: "Please enter the Basketball measurement for Strong-Hand Stationary Control Dribble.",
          createdAt: "2026-10-13T12:20:00.000Z",
        },
      ],
    });

    expect(history.coachName).toBe("Greg Michaels");
    expect(history.messages[0]?.createdAt).toBe("2026-10-13T12:20:00.000Z");
  });
});
