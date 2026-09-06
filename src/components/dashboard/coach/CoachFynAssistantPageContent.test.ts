import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("./CoachFynAssistantPageContent.tsx", import.meta.url),
  "utf8",
);

describe("CoachFynAssistantPageContent free-form chat contract", () => {
  it("removes guided prompts and submits composer messages without promptKey", () => {
    expect(source).not.toContain("FynPromptButtonBar");
    expect(source).not.toContain("activePromptKey");
    expect(source).not.toContain("promptKey,");
    expect(source).toContain("onSubmit={sendMessage}");
    expect(source).toMatch(
      /queryFynAssistant\(\{\s*entityId: requestedEntityId,\s*athleteId: requestedAthleteId,\s*message: trimmedMessage,/,
    );
  });

  it("enables the composer only after athlete selection and disables it while loading", () => {
    expect(source).toMatch(/\{selectedAthlete \? \([\s\S]*?<FynComposer/);
    expect(source).toContain("disabled={submitting}");
    expect(source).toContain("Select an athlete to start using Fyn Assistant.");
  });

  it("preserves athlete-scoped history and stale-selection guards", () => {
    expect(source).toContain("setMessages([])");
    expect(source).toContain(
      "[entityId, selectedAthleteId]",
    );
    expect(source.match(/fetchFynAssistantHistory\(\{/g)).toHaveLength(2);
    expect(source).toContain("athleteId: requestedAthleteId");
    expect(source).toContain("latestSelectedAthleteIdRef.current === requestedAthleteId");
    expect(source).toContain("fynHistoryContainsSubmittedTurn(history.messages, trimmedMessage)");
    expect(source).toContain("setMessages(history.messages)");
    expect(source).toContain("appendFynAssistantQueryAnswer(current, response)");
  });

  it("shows the one-question status message next to the composer", () => {
    expect(source).toContain('<Alert variant="info" role="status">');
    expect(source).toContain(
      "Fyn processes one question at a time. Please wait for a response before sending your next question.",
    );
  });
});
