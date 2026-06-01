import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isSafeWearableAuthorizationUrl,
  openWearableAuthorizationInNewTab,
} from "@/lib/api/wearableConnections";

describe("wearable connect navigation helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts https authorization URLs only", () => {
    expect(isSafeWearableAuthorizationUrl("https://oauth.example/connect")).toBe(
      true,
    );
    expect(isSafeWearableAuthorizationUrl("http://localhost:3000/oauth")).toBe(
      true,
    );
    expect(isSafeWearableAuthorizationUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeWearableAuthorizationUrl("")).toBe(false);
  });

  it("opens safe authorization URLs in a new tab", () => {
    const openMock = vi.fn(() => ({ closed: false }));
    vi.stubGlobal("window", { open: openMock });

    const url = "https://provider.example/oauth/start";
    expect(openWearableAuthorizationInNewTab(url)).toBe(true);
    expect(openMock).toHaveBeenCalledWith(url, "_blank", "noopener,noreferrer");
  });

  it("does not open unsafe URLs", () => {
    const openMock = vi.fn();
    vi.stubGlobal("window", { open: openMock });

    expect(openWearableAuthorizationInNewTab("javascript:void(0)")).toBe(false);
    expect(openMock).not.toHaveBeenCalled();
  });
});
