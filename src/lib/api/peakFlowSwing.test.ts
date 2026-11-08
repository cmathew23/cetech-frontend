import { afterEach, describe, expect, it, vi } from "vitest";
import { API_BASE } from "@/config/endpoints";
import {
  fetchPeakFlowSavedAnalysesRequest,
  fetchPeakFlowSavedAnalysisRequest,
  peakFlowAnalysesListUrl,
  postPeakFlowSaveAnalysis,
} from "@/lib/api/peakFlowSwing";

const athleteId = "18f84b0f-f34e-4eb9-adb4-18ba3bc7e426";
const entityId = "entity-1";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe("CETECH PeakFlow Swing persistence", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves five independent BODY and CLUB analyses on the CETECH route", async () => {
    const saved: unknown[] = [];
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const payload = JSON.parse(String(init.body));
      const record = {
        id: `saved-${saved.length + 1}`,
        ...payload,
        createdAt: "2026-11-08T00:00:00.000Z",
        shared: false,
        sharedAt: null,
      };
      saved.push(record);
      return jsonResponse(record);
    });
    vi.stubGlobal("fetch", fetchMock);

    const payloads = [0, 1, 2, 3, 4].map((index) => ({
      athleteId,
      entityId,
      taxonomyAreaKey: index % 2 === 0 ? "tee_shots_driving" : "putting",
      analysisType: index % 2 === 0 ? "BODY" as const : "CLUB" as const,
      result: { index },
      resultVideoUrl: index % 2 === 0 ? "/renders/body.mp4" : "/renders/club_swingtrace.mp4",
    }));

    for (const payload of payloads) {
      await postPeakFlowSaveAnalysis(payload);
    }

    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(saved).toHaveLength(5);
    expect(new Set(saved.map((record) => (record as { id: string }).id)).size).toBe(5);
    for (const [index, call] of fetchMock.mock.calls.entries()) {
      expect(String(call[0])).toBe(`${API_BASE}/analyses/save`);
      expect(JSON.parse(String(call[1].body))).toEqual(payloads[index]);
      expect(String(call[0])).not.toContain("pmi");
    }
    expect(payloads.filter((payload) => payload.analysisType === "BODY")).toHaveLength(3);
    expect(payloads.filter((payload) => payload.analysisType === "CLUB")).toHaveLength(2);
  });

  it("lists a coach athlete with the assigned entity and opens without recording a separate view call", async () => {
    expect(peakFlowAnalysesListUrl(athleteId, entityId)).toBe(
      `${API_BASE}/analyses?athleteId=${athleteId}&entityId=${entityId}`,
    );
    const shared = [
      {
        id: "body-shared",
        athleteId,
        entityId,
        taxonomyAreaKey: "tee_shots_driving",
        analysisType: "BODY",
        createdAt: "2026-11-08T00:00:00.000Z",
        shared: true,
        sharedAt: "2026-11-08T01:00:00.000Z",
      },
    ];
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("/analyses?")) return jsonResponse({ analyses: shared });
      return jsonResponse({
        ...shared[0],
        result: { metrics_summary: { head_movement_pct: 3.25 } },
        playbackUrl: "https://signed.example/body.mp4",
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchPeakFlowSavedAnalysesRequest(athleteId, entityId);
    await fetchPeakFlowSavedAnalysisRequest("body-shared", athleteId);

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      `${API_BASE}/analyses?athleteId=${athleteId}&entityId=${entityId}`,
    );
    expect(String(fetchMock.mock.calls[1][0])).toBe(
      `${API_BASE}/analyses/body-shared?athleteId=${athleteId}`,
    );
    expect(fetchMock.mock.calls.map((call) => String(call[0])).join(" ")).not.toContain("/view");
  });
});
