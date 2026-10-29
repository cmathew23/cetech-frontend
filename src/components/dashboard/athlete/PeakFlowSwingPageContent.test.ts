import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { pmiUrl } from "@/config/pmiBackend";

const peakflowGate = vi.hoisted(() => ({
  sportCode: "GOLF" as string | null,
  ready: true,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/athlete/peakflow-swing",
  useRouter: () => ({ push() {}, replace() {}, refresh() {} }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/dashboard/athlete/useAthleteSportCode", () => ({
  useAthleteSportCode: () => ({
    sportCode: peakflowGate.sportCode,
    ready: peakflowGate.ready,
  }),
}));

vi.mock("@/components/dashboard/athlete/useAthleteInvitationGate", () => ({
  useAthleteInvitationGate: () => ({
    accessContext: {
      user: { userId: "user-should-not-be-used", roles: ["ATHLETE"] },
      activeRole: "ATHLETE",
      academy: {
        hasMembership: true,
        membershipStatus: "ACTIVE",
        trainingEntityId: "entity-1",
        trainingEntityName: "Academy",
      },
      invitation: { hasPendingInvitation: false, pendingInvitationCount: 0 },
      access: {
        canAccessDashboard: true,
        dashboardType: "ATHLETE",
        reasonCode: "READY",
      },
      coachSummary: { assignedAthleteCount: 0 },
      athleteProfile: {
        athleteProfileId: "18f84b0f-f34e-4eb9-adb4-18ba3bc7e426",
        trainingEntityId: "entity-1",
        trainingEntityName: "Academy",
        membershipId: "membership-1",
        membershipStatus: "ACTIVE",
      },
      assignedCoaches: [],
    },
    accessGateReady: true,
    invitationAccessLocked: false,
    isGateReady: true,
    pendingCount: 0,
  }),
}));

vi.mock("@/components/ui/Button", async () => {
  const React = await import("react");
  return {
    Button({ children, ...props }: { children?: React.ReactNode }) {
      return React.createElement("button", props, children);
    },
  };
});

const source = readFileSync(
  new URL("./PeakFlowSwingPageContent.jsx", import.meta.url),
  "utf8",
);

function functionSource(name: string, nextName: string) {
  const start = source.indexOf(`async function ${name}`);
  const end = source.indexOf(`async function ${nextName}`);
  return source.slice(start, end);
}

const {
  AnalysisResults,
  PeakFlowSwingPageContent,
  buildPeakFlowSavePayload,
  clearPeakFlowSwingDraft,
  peakFlowSwingStateFromDraft,
  PEAKFLOW_BODY_DRAFT_KEY,
  PEAKFLOW_CLUB_DRAFT_KEY,
  postPeakFlowSaveAnalysis,
  readPeakFlowSwingDrafts,
  writePeakFlowSwingDraft,
} = await import("./PeakFlowSwingPageContent");

const bodyAnalysis = {
  overlay_video_url: "/renders/body.mp4",
  frames: [
    {
      phase: "Address / Setup",
      metrics: {
        spine_tilt_3d: 12.3,
        left_knee_angle: 150.1,
        right_knee_angle: 148.2,
        left_elbow_angle: 170.4,
        right_elbow_angle: 169.5,
      },
    },
    {
      phase: "Top of Backswing",
      metrics: { x_factor_3d: 40.2, shoulder_rot_3d: -80.1, hip_rot_3d: -40.4 },
    },
    { phase: "Impact", metrics: { spine_tilt_3d: 18.6 } },
    { phase: "Finish", metrics: { hip_rot_3d: 90.2 } },
  ],
  metrics_summary: { head_movement_pct: 3.25, finish_pelvic_rotation_deg: 55.4 },
};

const clubAnalysis = {
  swingtrace_video_url: "/renders/club_swingtrace.mp4",
  swingtrace_club_metrics: {
    available: true,
    peak_normalized_speed_per_s: 1.2345,
    path_deviation_pct_frame_width: 2.5,
  },
};

function renderResults(props: {
  bodyAnalysis?: object | null;
  clubAnalysis?: object | null;
  initialTab?: string;
  athleteProfileId?: string;
  bodyTaxonomyAreaKey?: string;
  clubTaxonomyAreaKey?: string;
  initialBodySaveStatus?: string;
  initialClubSaveStatus?: string;
}) {
  return renderToStaticMarkup(
    createElement(AnalysisResults, { onReset() {}, ...props }),
  );
}

function saveButton(html: string, label: string) {
  const match = html.match(new RegExp(`<button[^>]*>${label}<\\/button>`));
  return match?.[0] ?? "";
}

describe("PeakFlow Swing result rendering", () => {
  it("renders the Body video and metrics when only Body succeeded", () => {
    const html = renderResults({ bodyAnalysis, clubAnalysis: null });
    expect(html).toContain("/renders/body.mp4");
    expect(html).toContain("Address");
    expect(html).toContain("12.3°");
    expect(html).toContain("Top of Backswing");
    expect(html).toContain("40.2°");
    expect(html).toContain("Impact");
    expect(html).toContain("Head Movement");
    expect(html).toContain("3.25%");
    expect(html).toContain("Finish");
    expect(html).toContain("55.4°");
    expect(html).not.toContain("Body Movement Modeling");
    expect(html).not.toContain("Clubhead Path");
  });

  it("renders the Club video and metrics when only Club succeeded", () => {
    const html = renderResults({ bodyAnalysis: null, clubAnalysis });
    expect(html).toContain("/renders/club_swingtrace.mp4");
    expect(html).toContain("Clubhead Path");
    expect(html).toContain("Peak Clubhead Speed");
    expect(html).toContain("1.2345");
    expect(html).toContain("frame-widths/s");
    expect(html).toContain("2D Clubhead Path Deviation");
    expect(html).toContain("2.50");
    expect(html).toContain("% of frame width");
    expect(html).not.toContain("Body Movement Modeling");
    expect(html).not.toContain("Spine Tilt");
  });

  it("renders both tabs and each stored result view", () => {
    const bodyHtml = renderResults({ bodyAnalysis, clubAnalysis, initialTab: "body" });
    expect(bodyHtml).toContain("Body Movement Modeling");
    expect(bodyHtml).toContain("Club Tracking");
    expect(bodyHtml).toContain("/renders/body.mp4");
    expect(bodyHtml).toContain("12.3°");
    expect(bodyHtml).not.toContain("/renders/club_swingtrace.mp4");

    const clubHtml = renderResults({ bodyAnalysis, clubAnalysis, initialTab: "club" });
    expect(clubHtml).toContain("Body Movement Modeling");
    expect(clubHtml).toContain("Club Tracking");
    expect(clubHtml).toContain("/renders/club_swingtrace.mp4");
    expect(clubHtml).toContain("1.2345");
    expect(clubHtml).toContain("2.50");
    expect(clubHtml).not.toContain("/renders/body.mp4");
  });
});

describe("PeakFlow Swing independent uploads", () => {
  it("posts the Body file to /analyze/body and does not start Club", () => {
    const body = functionSource("handleAnalyzeBody", "handleAnalyzeClub");
    expect(body).toContain(
      'postVideo("/analyze/body", file, athleteProfileId, selectedTaxonomyAreaKey)',
    );
    expect(body).toContain("data.analysis");
    expect(body).not.toContain("/analyze/club");
    expect(body).not.toContain("handleAnalyzeClub");
  });

  it("posts the Club file to /analyze/club/upload", () => {
    const club = source.slice(source.indexOf("async function handleAnalyzeClub"));
    expect(club).toContain(
      'postVideo("/analyze/club/upload", file, athleteProfileId, selectedTaxonomyAreaKey)',
    );
    expect(club).not.toContain('pmiUrl("/analyze/club")');
    expect(source).not.toContain("analysis_id");
    expect(functionSource("postVideo", "postPeakFlowSaveAnalysis")).not.toContain("JSON.stringify");
    expect(functionSource("handleAnalyzeBody", "handleAnalyzeClub")).not.toContain("JSON.stringify");
    expect(source).toContain('form.append("video", file)');
    expect(source).toContain('form.append("athleteId", athleteProfileId)');
    expect(source).toContain('form.append("taxonomyAreaKey", selectedTaxonomyAreaKey)');
    expect(source).toContain("planningIds.ids?.athleteProfileId");
    expect(source).toContain('taxonomyAreaKey === ""');
  });

  it("shows a Body result without a Club result, and a Club result without a Body result", () => {
    expect(source).toContain("bodyAnalysis || clubAnalysis");
    expect(source).toContain("hasBody && hasClub ? tab : hasBody ? \"body\" : \"club\"");
    expect(source).toContain("bodyAnalysis?.overlay_video_url");
    expect(source).toContain("clubAnalysis?.swingtrace_video_url");
    expect(source).toContain("clubAnalysis?.swingtrace_club_metrics");
  });

  it("keeps the two upload cards and their view copy", () => {
    expect(source).toContain("Analyze Body Movement");
    expect(source).toContain("Analyze Club Tracking");
    expect(source).toContain("✓ Back / Down-the-Line View");
    expect(source).toContain("✓ Side / Face-On View");
    expect(source).toContain("REQUIRED VIEW: Back / Down-the-Line View");
    expect(source).not.toContain('pmiUrl("/analyze/club")');
  });
});

describe("PeakFlow Swing golf access and taxonomy", () => {
  it("does not render the page for a non-Golf athlete", () => {
    for (const sportCode of ["TENNIS", "CRICKET", "", null]) {
      peakflowGate.sportCode = sportCode;
      peakflowGate.ready = true;
      const html = renderToStaticMarkup(createElement(PeakFlowSwingPageContent));
      expect(html).toBe("");
    }
    expect(source).toContain('router.replace("/athlete/dashboard")');
    expect(source).toContain("if (!allowed) return null");
    peakflowGate.sportCode = "GOLF";
  });

  it("renders the page for a Golf athlete with a required taxonomy on each card", () => {
    peakflowGate.sportCode = "GOLF";
    peakflowGate.ready = true;
    const html = renderToStaticMarkup(createElement(PeakFlowSwingPageContent));
    expect(html).toContain("PeakFlow Swing");
    expect(html).toContain("Analyze Body Movement");
    expect(html).toContain("Analyze Club Tracking");
    expect(html).toContain("Golf Taxonomy");
    expect(html.split("tee_shots_driving").length - 1).toBe(2);
    expect(html.split("course_management_decision_making").length - 1).toBe(2);
    expect(html).not.toContain("user-should-not-be-used");
    const analyzeButtons = html.match(/<button[^>]*>Analyze (?:Body Movement|Club Tracking)<\/button>/g) ?? [];
    expect(analyzeButtons).toHaveLength(2);
    for (const button of analyzeButtons) {
      expect(button).toContain("disabled");
    }
  });
});

const athleteId = "18f84b0f-f34e-4eb9-adb4-18ba3bc7e426";

describe("PeakFlow Swing save analysis", () => {
  it("shows Save Analysis only when a result is present", () => {
    peakflowGate.sportCode = "GOLF";
    peakflowGate.ready = true;
    const page = renderToStaticMarkup(createElement(PeakFlowSwingPageContent));
    expect(page).not.toContain("Save Analysis");

    const html = renderResults({ bodyAnalysis, clubAnalysis: null });
    expect(saveButton(html, "Save Analysis")).not.toContain("disabled");
    expect(html.match(/Save Analysis/g)).toHaveLength(1);
  });

  it("sends the frozen Body result, taxonomy, and overlay video URL", async () => {
    const payload = buildPeakFlowSavePayload({
      athleteId,
      taxonomyAreaKey: "putting",
      analysisType: "BODY",
      result: bodyAnalysis,
      resultVideoUrl: bodyAnalysis.overlay_video_url,
    });
    expect(payload).toEqual({
      athleteId,
      taxonomyAreaKey: "putting",
      analysisType: "BODY",
      result: bodyAnalysis,
      resultVideoUrl: "/renders/body.mp4",
    });
    expect(source).toContain("setBodyTaxonomyAreaKey(selectedTaxonomyAreaKey)");
    expect(source).toContain("taxonomyAreaKey: bodyTaxonomyAreaKey");
    expect(source).toContain("analysisType: \"BODY\"");
    expect(source).toContain("result: bodyAnalysis");
    expect(source).toContain("resultVideoUrl: bodyAnalysis?.overlay_video_url");

    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        id: "saved-body",
        athleteId,
        taxonomyAreaKey: "putting",
        analysisType: "BODY",
        createdAt: "2026-10-29T00:00:00.000Z",
        videoStorageKey: "videos/body.mp4",
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const saved = await postPeakFlowSaveAnalysis(payload);
    expect(String(fetchMock.mock.calls[0][0])).toBe(pmiUrl("/analyses/save"));
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toEqual(payload);
    expect(saved).toMatchObject({ id: "saved-body", analysisType: "BODY" });
    vi.unstubAllGlobals();
  });

  it("sends the frozen Club response, taxonomy, and swingtrace video URL", async () => {
    const payload = buildPeakFlowSavePayload({
      athleteId,
      taxonomyAreaKey: "wedge_play",
      analysisType: "CLUB",
      result: clubAnalysis,
      resultVideoUrl: clubAnalysis.swingtrace_video_url,
    });
    expect(payload).toEqual({
      athleteId,
      taxonomyAreaKey: "wedge_play",
      analysisType: "CLUB",
      result: clubAnalysis,
      resultVideoUrl: "/renders/club_swingtrace.mp4",
    });
    expect(source).toContain("setClubTaxonomyAreaKey(selectedTaxonomyAreaKey)");
    expect(source).toContain("taxonomyAreaKey: clubTaxonomyAreaKey");
    expect(source).toContain("analysisType: \"CLUB\"");
    expect(source).toContain("result: clubAnalysis");
    expect(source).toContain("resultVideoUrl: clubAnalysis?.swingtrace_video_url");

    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        id: "saved-club",
        athleteId,
        taxonomyAreaKey: "wedge_play",
        analysisType: "CLUB",
        createdAt: "2026-10-29T00:00:00.000Z",
        videoStorageKey: "videos/club.mp4",
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    await postPeakFlowSaveAnalysis(payload);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toEqual(payload);
    vi.unstubAllGlobals();
  });

  it("shows Saved ✓ and disables the button after success", () => {
    const html = renderResults({
      bodyAnalysis,
      clubAnalysis: null,
      initialBodySaveStatus: "saved",
    });
    const button = saveButton(html, "Saved ✓");
    expect(button).toContain("disabled");
    expect(html).toContain("12.3°");
  });

  it("shows Save failed and leaves the button enabled for retry", () => {
    const html = renderResults({
      bodyAnalysis: null,
      clubAnalysis,
      initialClubSaveStatus: "failed",
    });
    const button = saveButton(html, "Save failed");
    expect(button).not.toContain("disabled");
    expect(html).toContain("1.2345");
  });
});

const savedBodyRecord = {
  id: "saved-body",
  athleteId,
  taxonomyAreaKey: "putting",
  analysisType: "BODY",
  createdAt: "2026-10-29T00:00:00.000Z",
  videoStorageKey: "videos/body.mp4",
};

function installSessionStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem(key: string) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
  });
}

describe("PeakFlow Swing session drafts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("restores a Body result, its frozen taxonomy, and its save state after remount", () => {
    installSessionStorage();
    writePeakFlowSwingDraft(PEAKFLOW_BODY_DRAFT_KEY, {
      result: bodyAnalysis,
      taxonomyAreaKey: "putting",
      save: { status: "saved", record: savedBodyRecord },
    });

    const first = renderToStaticMarkup(createElement(PeakFlowSwingPageContent));
    const second = renderToStaticMarkup(createElement(PeakFlowSwingPageContent));
    for (const html of [first, second]) {
      expect(html).toContain("/renders/body.mp4");
      expect(html).toContain("12.3°");
      expect(html).toContain("Saved ✓");
      expect(html).not.toContain("Clubhead Path");
    }
    const restored = peakFlowSwingStateFromDraft(readPeakFlowSwingDrafts().body);
    expect(restored.taxonomyAreaKey).toBe("putting");
    expect(restored.result).toEqual(bodyAnalysis);
    expect(restored.save).toEqual({ status: "saved", record: savedBodyRecord });
  });

  it("restores a Club result, its frozen taxonomy, and its save state after remount", () => {
    installSessionStorage();
    writePeakFlowSwingDraft(PEAKFLOW_CLUB_DRAFT_KEY, {
      result: clubAnalysis,
      taxonomyAreaKey: "wedge_play",
      save: { status: "failed", record: null },
    });

    const html = renderToStaticMarkup(createElement(PeakFlowSwingPageContent));
    expect(html).toContain("/renders/club_swingtrace.mp4");
    expect(html).toContain("1.2345");
    expect(saveButton(html, "Save failed")).not.toContain("disabled");
    const restored = peakFlowSwingStateFromDraft(readPeakFlowSwingDrafts().club);
    expect(restored.taxonomyAreaKey).toBe("wedge_play");
    expect(restored.result).toEqual(clubAnalysis);
    expect(restored.save.status).toBe("failed");
  });

  it("restores Body and Club together without mixing save state", () => {
    installSessionStorage();
    writePeakFlowSwingDraft(PEAKFLOW_BODY_DRAFT_KEY, {
      result: bodyAnalysis,
      taxonomyAreaKey: "putting",
      save: { status: "saved", record: savedBodyRecord },
    });
    writePeakFlowSwingDraft(PEAKFLOW_CLUB_DRAFT_KEY, {
      result: clubAnalysis,
      taxonomyAreaKey: "chipping",
      save: { status: "failed", record: null },
    });

    const html = renderToStaticMarkup(createElement(PeakFlowSwingPageContent));
    expect(html).toContain("Body Movement Modeling");
    expect(html).toContain("Club Tracking");
    expect(html).toContain("/renders/body.mp4");
    expect(html).toContain("12.3°");
    expect(html).toContain("Saved ✓");
    expect(html).not.toContain("Save failed");

    const drafts = readPeakFlowSwingDrafts();
    expect(peakFlowSwingStateFromDraft(drafts.body).taxonomyAreaKey).toBe("putting");
    expect(peakFlowSwingStateFromDraft(drafts.body).save.status).toBe("saved");
    expect(peakFlowSwingStateFromDraft(drafts.club).taxonomyAreaKey).toBe("chipping");
    expect(peakFlowSwingStateFromDraft(drafts.club).save.status).toBe("failed");
    expect(drafts.club.result).toEqual(clubAnalysis);

    clearPeakFlowSwingDraft(PEAKFLOW_BODY_DRAFT_KEY);
    expect(readPeakFlowSwingDrafts().body).toBeNull();
    expect(readPeakFlowSwingDrafts().club.result).toEqual(clubAnalysis);
  });

  it("does not call analysis or save APIs while restoring", () => {
    installSessionStorage();
    writePeakFlowSwingDraft(PEAKFLOW_BODY_DRAFT_KEY, {
      result: bodyAnalysis,
      taxonomyAreaKey: "putting",
      save: { status: "idle", record: null },
    });
    writePeakFlowSwingDraft(PEAKFLOW_CLUB_DRAFT_KEY, {
      result: clubAnalysis,
      taxonomyAreaKey: "chipping",
      save: { status: "idle", record: null },
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderToStaticMarkup(createElement(PeakFlowSwingPageContent));
    expect(fetchMock).not.toHaveBeenCalled();

    const restoreEffect = source.slice(
      source.indexOf("const restored = readPeakFlowSwingDrafts()"),
      source.indexOf("function persistBodySave"),
    );
    expect(restoreEffect).not.toContain("postVideo");
    expect(restoreEffect).not.toContain("postPeakFlowSaveAnalysis");
    expect(restoreEffect).not.toContain("/analyze/");
    expect(restoreEffect).not.toContain("/analyses/save");
  });
});
