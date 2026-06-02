import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FYN_LOADING_MESSAGE_ID, FynChatThread } from "@/components/fyn/FynChatThread";

describe("FynChatThread", () => {
  it("shows Fyn as the assistant label", () => {
    render(
      <FynChatThread
        messages={[
          {
            id: "a1",
            role: "assistant",
            text: "Hello from Fyn.",
          },
        ]}
        emptyState="Empty"
      />,
    );
    expect(screen.getByText("Fyn")).toBeInTheDocument();
    expect(screen.queryByText("Fyn Assistant")).not.toBeInTheDocument();
  });

  it("renders loading message with animated dots", () => {
    render(
      <FynChatThread
        messages={[
          {
            id: FYN_LOADING_MESSAGE_ID,
            role: "loading",
            text: "Fyn is checking your latest training data...",
          },
        ]}
        emptyState="Empty"
      />,
    );
    expect(screen.getByText(/Fyn is checking your latest training data/)).toBeInTheDocument();
  });
});
