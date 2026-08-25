import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { queryFynAssistant } from "@/lib/api/fynAssistant";
import { apiRequest } from "@/lib/apiClient";

function hangUntilAbort(
  _url: unknown,
  init?: { signal?: AbortSignal },
): Promise<Response> {
  return new Promise((_resolve, reject) => {
    const signal = init?.signal;
    if (!signal) return;

    const abort = () => {
      const err = new Error("Aborted");
      err.name = "AbortError";
      reject(err);
    };

    if (signal.aborted) {
      abort();
      return;
    }

    signal.addEventListener("abort", abort, { once: true });
  });
}

describe("Fyn query client timeout", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("leaves the global API default timeout unchanged", () => {
    const apiClientSource = readFileSync(
      new URL("../apiClient.ts", import.meta.url),
      "utf8",
    );
    expect(apiClientSource).toContain("const DEFAULT_TIMEOUT_MS = 10_000");
  });

  it("aborts a default apiRequest at 10s with Request timed out", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(hangUntilAbort));

    const pending = apiRequest("/health");
    vi.advanceTimersByTime(10_000);

    await expect(pending).rejects.toMatchObject({
      message: "Request timed out",
      status: 0,
    });
  });

  it("keeps Fyn query pending past 60s and times out at 120s", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(hangUntilAbort));

    const pending = queryFynAssistant({
      entityId: "entity-1",
      athleteId: "athlete-1",
      message: "explain today's nutrition plan",
    });

    let settled = false;
    void pending.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );

    vi.advanceTimersByTime(60_000);
    expect(settled).toBe(false);

    vi.advanceTimersByTime(59_999);
    expect(settled).toBe(false);

    vi.advanceTimersByTime(1);
    await expect(pending).rejects.toMatchObject({
      message: "Request timed out",
      status: 0,
    });
  });
});
