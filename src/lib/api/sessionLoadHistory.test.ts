import { paths } from "@/config/endpoints";
import {
  fetchSandCSessionLoadHistory,
  formatAverageSessionLoadAu,
  formatAverageSessionLoadDifference,
  parseSandCSessionLoadHistoryPayload,
} from "@/lib/api/sessionLoadHistory";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

describe("sessionLoadHistory API", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("builds the session-load history path", () => {
    expect(
      paths.entities.athleteStrengthConditioningSessionLoadHistory(
        "entity-1",
        "athlete-1",
      ),
    ).toBe(
      "/entities/entity-1/athletes/athlete-1/strength-conditioning/session-load/history",
    );
  });

  it("parses an empty history array", () => {
    expect(parseSandCSessionLoadHistoryPayload([])).toEqual([]);
    expect(parseSandCSessionLoadHistoryPayload({ data: [] })).toEqual([]);
    expect(parseSandCSessionLoadHistoryPayload({ data: { weeks: [] } })).toEqual(
      [],
    );
  });

  it("parses historical weeks including nested context load", () => {
    const weeks = parseSandCSessionLoadHistoryPayload({
      data: {
        weeks: [
          {
            weekStart: "2026-08-31",
            weekEnd: "2026-09-06",
            averageSessionLoad: 210,
          },
          {
            weekStartDate: "2026-09-07",
            weekEndDate: "2026-09-13",
            context: { averageSessionLoad: 0 },
          },
          {
            weekStart: "2026-09-14",
            weekEnd: "2026-09-20",
            domains: {
              STRENGTH_CONDITIONING: {
                context: { averageSessionLoad: 245 },
              },
            },
          },
        ],
      },
    });

    expect(weeks).toHaveLength(3);
    expect(weeks[0]?.averageSessionLoad).toBe(210);
    expect(weeks[1]?.averageSessionLoad).toBe(0);
    expect(weeks[2]?.averageSessionLoad).toBe(245);
  });

  it("formats AU, null, and zero", () => {
    expect(formatAverageSessionLoadAu(245)).toBe("245 AU");
    expect(formatAverageSessionLoadAu(0)).toBe("0 AU");
    expect(formatAverageSessionLoadAu(null)).toBe("—");
  });

  it("formats difference as current minus historical with numeric arrows", () => {
    expect(formatAverageSessionLoadDifference(245, 210)).toBe("↑ 35 AU");
    expect(formatAverageSessionLoadDifference(200, 245)).toBe("↓ 45 AU");
    expect(formatAverageSessionLoadDifference(245, 245)).toBe("→ 0 AU");
    expect(formatAverageSessionLoadDifference(null, 210)).toBe("—");
    expect(formatAverageSessionLoadDifference(245, null)).toBe("—");
  });

  it("fetches history from the session-load endpoint", async () => {
    apiRequestMock.mockResolvedValue({ data: [] });
    const weeks = await fetchSandCSessionLoadHistory({
      entityId: "entity-1",
      athleteId: "athlete-1",
    });
    expect(weeks).toEqual([]);
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/strength-conditioning/session-load/history",
      {
        method: "GET",
        cache: "no-store",
        timeoutMs: 240_000,
      },
    );
  });
});
