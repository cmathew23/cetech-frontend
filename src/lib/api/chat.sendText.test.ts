import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

import { sendChatTextMessage } from "@/lib/api/chat";

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
});
