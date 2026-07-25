import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("./AthleteFynAssistantPageContent.tsx", import.meta.url),
  "utf8",
);

describe("AthleteFynAssistantPageContent free-form chat contract", () => {
  it("removes guided prompts and submits composer messages without promptKey", () => {
    expect(source).not.toContain("FynPromptButtonBar");
    expect(source).not.toContain("activePromptKey");
    expect(source).not.toContain("promptKey,");
    expect(source).toContain("onSubmit={sendMessage}");
    expect(source).toMatch(
      /queryFynAssistant\(\{\s*entityId,\s*athleteId,\s*message: trimmedMessage,/,
    );
  });

  it("keeps composer availability tied to readiness and loading", () => {
    expect(source).toContain(
      'disabled={submitting || planningIds.phase !== "ready"}',
    );
  });

  it("preserves history loading and post-send refresh", () => {
    expect(source.match(/fetchFynAssistantHistory\(\{/g)).toHaveLength(2);
    expect(source).toContain('role: "athlete"');
    expect(source).toContain("setMessages(history.messages)");
    expect(source).toContain("warnings: response.warnings");
    expect(source).toContain("usedSources: response.usedSources");
  });
});
