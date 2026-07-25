import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./FynComposer.tsx", import.meta.url), "utf8");

describe("FynComposer submission contract", () => {
  it("submits trimmed free-form text without a prompt dependency", () => {
    expect(source).toContain("const trimmed = message.trim()");
    expect(source).toContain("await onSubmit(trimmed)");
    expect(source).not.toContain("promptKey");
  });

  it("disables Send only for empty text or the parent loading state", () => {
    expect(source).toContain('if (trimmed === "" || disabled) return');
    expect(source).toContain(
      'type="submit" disabled={disabled || message.trim() === ""}',
    );
  });
});
