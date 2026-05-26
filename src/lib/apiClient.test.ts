import { describe, expect, it } from "vitest";
import { extractMessageFromPayload } from "@/lib/apiClient";

const FALLBACK = "API request failed";

describe("extractMessageFromPayload", () => {
  it("extracts payload.message", () => {
    expect(
      extractMessageFromPayload({ message: "  Plan not found  " }, FALLBACK),
    ).toBe("Plan not found");
  });

  it("extracts payload.error.message when error is an object", () => {
    expect(
      extractMessageFromPayload(
        { error: { message: "Invalid session id" } },
        FALLBACK,
      ),
    ).toBe("Invalid session id");
  });

  it("extracts payload.error when it is a string", () => {
    expect(
      extractMessageFromPayload({ error: "Adherence not allowed" }, FALLBACK),
    ).toBe("Adherence not allowed");
  });

  it("prefers payload.message over payload.error string", () => {
    expect(
      extractMessageFromPayload(
        { message: "Top-level message", error: "Nested error string" },
        FALLBACK,
      ),
    ).toBe("Top-level message");
  });

  it('falls back to "API request failed" when no message exists', () => {
    expect(extractMessageFromPayload(null, FALLBACK)).toBe(FALLBACK);
    expect(extractMessageFromPayload({}, FALLBACK)).toBe(FALLBACK);
    expect(extractMessageFromPayload({ error: {} }, FALLBACK)).toBe(FALLBACK);
    expect(extractMessageFromPayload({ error: "   " }, FALLBACK)).toBe(FALLBACK);
  });
});
