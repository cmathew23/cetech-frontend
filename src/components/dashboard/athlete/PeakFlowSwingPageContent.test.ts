import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formatTaxonomyAreaLabel } from "@/components/dashboard/athlete/athleteSportsMetricsPresentation";
import { API_BASE } from "@/config/endpoints";
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
  CloseUnsavedAnalysisDialog,
  PeakFlowSwingPageContent,
  SavedAnalysesSection,
  buildPeakFlowSavePayload,
  clearPeakFlowSwingDraft,
  fetchPeakFlowSavedAnalyses,
  fetchPeakFlowSavedAnalysis,
  formatSavedAnalysisTimestamp,
  openedAnalysisView,
  savedAnalysisTaxonomyLabel,
  peakFlowAnalysesListUrl,
  peakFlowAnalysisDetailUrl,
  peakFlowSwingStateFromDraft,
  PEAKFLOW_BODY_DRAFT_KEY,
  PEAKFLOW_CLUB_DRAFT_KEY,
  postPeakFlowSaveAnalysis,
  postPeakFlowShareAnalysis,
  readPeakFlowSwingDrafts,
  readSavedAnalysesList,
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
  bodyPlaybackUrl?: string | null;
  clubPlaybackUrl?: string | null;
  readOnly?: boolean;
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
    expect(html).not.toContain("Peak Clubhead Speed");
    expect(html).not.toContain("1.2345");
    expect(html).not.toContain("frame-widths/s");
    expect(html).not.toContain("2D Clubhead Path Deviation");
    expect(html).not.toContain("2.50");
    expect(html).not.toContain("% of frame width");
    expect(html).not.toContain("Body Movement Modeling");
    expect(html).not.toContain("Spine Tilt");
  });

  it("hides club numbers in the read-only results view used by coaches and reopened analyses", () => {
    const html = renderResults({ bodyAnalysis: null, clubAnalysis, readOnly: true });
    expect(html).toContain("/renders/club_swingtrace.mp4");
    expect(html).toContain("Clubhead Path");
    expect(html).not.toContain("Peak Clubhead Speed");
    expect(html).not.toContain("1.2345");
    expect(html).not.toContain("2D Clubhead Path Deviation");
    expect(html).not.toContain("2.50");
    expect(html).not.toContain("Save Club Analysis");
    expect(html).not.toContain("Spine Tilt");
  });

  it("renders both tabs and each stored result view", () => {
    const bodyHtml = renderResults({ bodyAnalysis, clubAnalysis, initialTab: "body" });
    expect(bodyHtml).toContain("Body Movement Modeling");
    expect(bodyHtml).toContain("2D Club Tracking");
    expect(bodyHtml).toContain("/renders/body.mp4");
    expect(bodyHtml).toContain("12.3°");
    expect(bodyHtml).not.toContain("/renders/club_swingtrace.mp4");

    const clubHtml = renderResults({ bodyAnalysis, clubAnalysis, initialTab: "club" });
    expect(clubHtml).toContain("Body Movement Modeling");
    expect(clubHtml).toContain("2D Club Tracking");
    expect(clubHtml).toContain("/renders/club_swingtrace.mp4");
    expect(clubHtml).toContain("Clubhead Path");
    expect(clubHtml).not.toContain("1.2345");
    expect(clubHtml).not.toContain("2.50");
    expect(clubHtml).not.toContain("Peak Clubhead Speed");
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
    expect(source.slice(
      source.indexOf("async function postVideo"),
      source.indexOf("export function SavedAnalysesSection"),
    )).not.toContain("JSON.stringify");
    expect(functionSource("handleAnalyzeBody", "handleAnalyzeClub")).not.toContain("JSON.stringify");
    expect(source).toContain('form.append("video", file)');
    expect(source).toContain('form.append("athleteId", athleteProfileId)');
    expect(source).toContain('form.append("taxonomyAreaKey", selectedTaxonomyAreaKey)');
    expect(source).toContain("planningIds.ids?.athleteProfileId");
    expect(source).toContain('selectedTaxonomyAreaKey === ""');
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
    expect(source).toContain("Analyze 2D Club Tracking");
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
    expect(html).toContain("Analyze 2D Club Tracking");
    expect(html).toContain("Golf Taxonomy");
    expect(html.split("tee_shots_driving").length - 1).toBe(2);
    expect(html.split("course_management_decision_making").length - 1).toBe(2);
    expect(html).not.toContain("user-should-not-be-used");
    const selectMarkup = (id: string) => {
      const start = html.indexOf(`id="${id}"`);
      return html.slice(start, html.indexOf("</select>", start));
    };
    const optionTags = (markup: string) => [...markup.matchAll(/<option\b[^>]*>/g)].map((match) => match[0]);
    const bodyOptions = optionTags(selectMarkup("body-taxonomy-area-key"));
    const clubOptions = optionTags(selectMarkup("club-taxonomy-area-key"));
    expect(bodyOptions.every((option) => !option.includes("disabled"))).toBe(true);
    expect(bodyOptions[0]).toContain('value=""');
    expect(bodyOptions[0]).toContain("selected");
    expect(bodyOptions).toHaveLength(clubOptions.length + 1);
    expect(clubOptions.some((option) => option.includes('value=""'))).toBe(false);
    const drivingOption = clubOptions.find((option) => option.includes('value="tee_shots_driving"'));
    expect(drivingOption).toContain("selected");
    expect(drivingOption).not.toContain("disabled");
    expect(clubOptions.filter((option) => option !== drivingOption).every((option) => option.includes("disabled"))).toBe(true);
    expect(source).toContain('teeShotOnly ? "tee_shots_driving" : taxonomyAreaKey');
    expect(source).toContain('setTaxonomyAreaKey("tee_shots_driving")');
    expect(source).toContain('event.target.value = "tee_shots_driving"');
    const analyzeButtons = html.match(/<button[^>]*>Analyze (?:Body Movement|2D Club Tracking)<\/button>/g) ?? [];
    expect(analyzeButtons).toHaveLength(2);
    for (const button of analyzeButtons) {
      expect(button).toContain("disabled");
    }
  });
});

const athleteId = "18f84b0f-f34e-4eb9-adb4-18ba3bc7e426";

describe("PeakFlow Swing save analysis", () => {
  it("shows a separate save button only for the result that is present", () => {
    peakflowGate.sportCode = "GOLF";
    peakflowGate.ready = true;
    const page = renderToStaticMarkup(createElement(PeakFlowSwingPageContent));
    expect(page).not.toContain("Save Body Analysis");
    expect(page).not.toContain("Save Club Analysis");
    expect(page).not.toContain("Save Analysis");

    const bodyHtml = renderResults({ bodyAnalysis, clubAnalysis: null });
    expect(saveButton(bodyHtml, "Save Body Analysis")).not.toContain("disabled");
    expect(bodyHtml.match(/Save Body Analysis/g)).toHaveLength(1);
    expect(bodyHtml).not.toContain("Save Club Analysis");
    expect(saveButton(bodyHtml, "Save Analysis")).toBe("");

    const clubHtml = renderResults({ bodyAnalysis: null, clubAnalysis });
    expect(saveButton(clubHtml, "Save Club Analysis")).not.toContain("disabled");
    expect(clubHtml.match(/Save Club Analysis/g)).toHaveLength(1);
    expect(clubHtml).not.toContain("Save Body Analysis");
  });

  it("keeps Body and Club save actions on their own stored results", () => {
    const bodySave = source.slice(
      source.indexOf("async function handleSaveBody"),
      source.indexOf("async function handleSaveClub"),
    );
    expect(bodySave).toContain('analysisType: "BODY"');
    expect(bodySave).toContain("result: bodyAnalysis");
    expect(bodySave).toContain("resultVideoUrl: bodyAnalysis?.overlay_video_url");
    expect(bodySave).toContain("setBodySaveState");
    expect(bodySave).not.toContain("setClubSaveState");
    expect(bodySave).not.toContain("clubAnalysis");
    expect(bodySave).not.toContain('"CLUB"');

    const clubSave = source.slice(
      source.indexOf("async function handleSaveClub"),
      source.indexOf("const frames"),
    );
    expect(clubSave).toContain('analysisType: "CLUB"');
    expect(clubSave).toContain("result: clubAnalysis");
    expect(clubSave).toContain("resultVideoUrl: clubAnalysis?.swingtrace_video_url");
    expect(clubSave).toContain("setClubSaveState");
    expect(clubSave).not.toContain("setBodySaveState");
    expect(clubSave).not.toContain("bodyAnalysis");
    expect(clubSave).not.toContain('"BODY"');

    const savedBody = renderResults({
      bodyAnalysis,
      clubAnalysis,
      initialTab: "body",
      initialBodySaveStatus: "saved",
      initialClubSaveStatus: "idle",
    });
    expect(saveButton(savedBody, "Saved ✓")).toContain("disabled");
    expect(savedBody).not.toContain("Save Club Analysis");
    expect(savedBody).toContain("/renders/body.mp4");
    expect(savedBody).not.toContain("/renders/club_swingtrace.mp4");

    const failedClub = renderResults({
      bodyAnalysis,
      clubAnalysis,
      initialTab: "club",
      initialBodySaveStatus: "saved",
      initialClubSaveStatus: "failed",
    });
    expect(saveButton(failedClub, "Save failed — Retry")).not.toContain("disabled");
    expect(failedClub).not.toContain("Saved ✓");
    expect(failedClub).toContain("/renders/club_swingtrace.mp4");
    expect(failedClub).not.toContain("/renders/body.mp4");
  });

  it("sends the frozen Body result, taxonomy, and overlay video URL", async () => {
    const payload = buildPeakFlowSavePayload({
      athleteId,
      entityId: "entity-1",
      taxonomyAreaKey: "putting",
      analysisType: "BODY",
      result: bodyAnalysis,
      resultVideoUrl: bodyAnalysis.overlay_video_url,
    });
    expect(payload).toEqual({
      athleteId,
      entityId: "entity-1",
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
    expect(String(fetchMock.mock.calls[0][0])).toBe(`${API_BASE}/analyses/save`);
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
      entityId: "entity-1",
      taxonomyAreaKey: "wedge_play",
      analysisType: "CLUB",
      result: clubAnalysis,
      resultVideoUrl: clubAnalysis.swingtrace_video_url,
    });
    expect(payload).toEqual({
      athleteId,
      entityId: "entity-1",
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

  it("shows Save failed — Retry and leaves the button enabled for retry", () => {
    const html = renderResults({
      bodyAnalysis: null,
      clubAnalysis,
      initialClubSaveStatus: "failed",
    });
    const button = saveButton(html, "Save failed — Retry");
    expect(button).not.toContain("disabled");
    expect(html).toContain("/renders/club_swingtrace.mp4");
    expect(html).not.toContain("1.2345");
  });
});

describe("PeakFlow Swing tab video switching", () => {
  it("only changes the displayed result and reloads that stored video", () => {
    const player = source.slice(
      source.indexOf("function Player"),
      source.indexOf("function AnalyzedVideo"),
    );
    expect(player).toContain("setPlaying(false)");
    expect(player).toContain("setPlaybackError(null)");
    expect(player).toContain("video.src = src");
    expect(player).toContain("video.load()");
    expect(player).toContain("code === 1");
    expect(player).not.toContain("setBodyAnalysis");
    expect(player).not.toContain("setClubAnalysis");
    expect(player).not.toContain("postVideo");
    expect(player).not.toContain("postPeakFlowSaveAnalysis");
    expect(source).not.toContain("key={src}");

    const results = source.slice(
      source.indexOf("export function AnalysisResults"),
      source.indexOf("function VideoUpload"),
    );
    expect(results).toContain("onClick={() => setTab(item.id)}");
    expect(results).toContain("bodyAnalysis?.overlay_video_url");
    expect(results).toContain("clubAnalysis?.swingtrace_video_url");
    expect(results).not.toContain("setBodyAnalysis");
    expect(results).not.toContain("setClubAnalysis");
    expect(results).not.toContain("clearPeakFlowSwingDraft");
    expect(results).not.toContain("writePeakFlowSwingDraft");
    expect(results).not.toContain("postVideo");

    const actionRow = results.slice(
      results.indexOf("New Analysis"),
      results.indexOf('aria-label="Analysis views"'),
    );
    expect(actionRow).toContain("New Analysis");
    expect(actionRow).not.toContain("Share with Skills Coach");
    expect(source).not.toContain("Share with Skills Coach");
    expect(source).not.toContain("PMI_INTERNAL_TOKEN");
    expect(actionRow).not.toContain("handleSaveBody");
    expect(actionRow).not.toContain("handleSaveClub");
    expect(actionRow).not.toContain("saveAnalysisButtonLabel");

    const bodyHtml = renderResults({ bodyAnalysis, clubAnalysis, initialTab: "body" });
    expect(bodyHtml).toContain("/renders/body.mp4");
    expect(bodyHtml).not.toContain("/renders/club_swingtrace.mp4");
    expect(bodyHtml).toContain("Save Body Analysis");
    const clubHtml = renderResults({ bodyAnalysis, clubAnalysis, initialTab: "club" });
    expect(clubHtml).toContain("/renders/club_swingtrace.mp4");
    expect(clubHtml).not.toContain("/renders/body.mp4");
    expect(clubHtml).toContain("Save Club Analysis");
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
    expect(html).not.toContain("1.2345");
    expect(html).not.toContain("Peak Clubhead Speed");
    expect(saveButton(html, "Save failed — Retry")).not.toContain("disabled");
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
    expect(html).toContain("2D Club Tracking");
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

const savedBodyId = "3a43f299-075c-4bb8-986c-f0248a9b16cc";
const savedClubId = "a26a3e26-b3a8-4a92-aa72-c887b5e74e19";
const savedCreatedAt = "2026-10-30T08:03:56.407Z";
const bodyPlaybackUrl = "https://signed.example/body-playback";
const clubPlaybackUrl = "https://signed.example/club-playback";

const savedBodySummary = {
  id: savedBodyId,
  athleteId,
  taxonomyAreaKey: "tee_shots_driving",
  analysisType: "BODY",
  createdAt: savedCreatedAt,
};

const savedClubSummary = {
  id: savedClubId,
  athleteId,
  taxonomyAreaKey: "wedge_play",
  analysisType: "CLUB",
  createdAt: "2026-10-30T08:35:00.031Z",
};

describe("PeakFlow Swing saved analyses", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("formats a UTC createdAt in the local timezone", () => {
    const createdAt = "2026-10-31T12:31:00.000Z";
    const date = new Date(createdAt);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const hours24 = date.getHours();
    const hours12 = hours24 % 12 || 12;
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const suffix = hours24 >= 12 ? "PM" : "AM";
    const formatted = formatSavedAnalysisTimestamp(createdAt);
    expect(formatted).toBe(
      `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${hours12}:${minutes} ${suffix}`,
    );
    expect(formatSavedAnalysisTimestamp("2026-10-31T12:31:00.000000")).toBe(formatted);
    expect(formatSavedAnalysisTimestamp("2026-10-31T12:31:00")).toBe(formatted);
  });

  it("does not list saved analyses before an AthleteProfile id exists", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchPeakFlowSavedAnalyses("")).rejects.toThrow("Saved analyses could not be loaded.");
    expect(fetchMock).not.toHaveBeenCalled();

    const historyEffect = source.slice(
      source.indexOf('if (!allowed || athleteProfileId === "") return;'),
      source.indexOf("function refreshSavedAnalyses"),
    );
    expect(historyEffect).toContain("fetchPeakFlowSavedAnalyses(athleteProfileId)");
    expect(historyEffect).toContain('athleteProfileId === ""');
    expect(historyEffect).not.toContain("userId");
    expect(historyEffect).not.toContain("trainingEntityId");
    expect(historyEffect).not.toContain("setBodyAnalysis");
    expect(historyEffect).not.toContain("setClubAnalysis");
    expect(historyEffect).not.toContain("postVideo");
    expect(historyEffect).not.toContain("postPeakFlowSaveAnalysis");
    expect(historyEffect).not.toContain("fetchPeakFlowSavedAnalysis(");
  });

  it("lists saved analyses with the AthleteProfile id", async () => {
    expect(peakFlowAnalysesListUrl(athleteId)).toBe(`${API_BASE}/analyses?athleteId=${athleteId}`);
    expect(peakFlowAnalysesListUrl(athleteId)).not.toContain("entityId=");
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ analyses: [savedBodySummary, savedClubSummary] }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const analyses = await fetchPeakFlowSavedAnalyses(athleteId);
    expect(String(fetchMock.mock.calls[0][0])).toBe(`${API_BASE}/analyses?athleteId=${athleteId}`);
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("entityId=");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "GET" });
    expect(analyses).toEqual([
      { ...savedBodySummary, entityId: null, shared: false, sharedAt: null, coachViewingStatus: [] },
      { ...savedClubSummary, entityId: null, shared: false, sharedAt: null, coachViewingStatus: [] },
    ]);
    expect(readSavedAnalysesList({ analyses: [] })).toEqual([]);
  });

  it("shows athlete-facing saved analysis rows, the empty state, and a history error", () => {
    const bodyRow = renderToStaticMarkup(createElement(SavedAnalysesSection, {
      analyses: [savedBodySummary],
      onRetry() {},
      onOpen() {},
    }));
    expect(bodyRow).toContain("Saved Analyses");
    expect(bodyRow).toContain("Open a previous analysis to review the saved video and metrics.");
    expect(bodyRow).toContain("Body Movement");
    expect(bodyRow).toContain("Saved ✓");
    expect(savedAnalysisTaxonomyLabel("tee_shots_driving")).toBe("Tee Shots / Driving");
    expect(bodyRow).toContain("Tee Shots / Driving");
    expect(formatTaxonomyAreaLabel("tee_shots_driving")).toBe("Tee Shots Driving");
    expect(bodyRow).not.toContain("Tee Shots Driving");
    expect(bodyRow).toContain(formatSavedAnalysisTimestamp(savedCreatedAt));
    expect(formatSavedAnalysisTimestamp(savedCreatedAt)).toMatch(/Oct 2026/);
    expect(formatSavedAnalysisTimestamp(savedCreatedAt)).not.toBe(savedCreatedAt);
    expect(bodyRow).toContain("Open");
    expect(bodyRow).not.toContain(savedBodyId);
    expect(bodyRow).not.toContain(athleteId);
    expect(bodyRow).not.toContain("tee_shots_driving");
    expect(bodyRow).not.toContain(savedCreatedAt);
    expect(bodyRow).not.toContain("playbackUrl");

    const clubRow = renderToStaticMarkup(createElement(SavedAnalysesSection, {
      analyses: [savedClubSummary],
      onRetry() {},
      onOpen() {},
    }));
    expect(clubRow).toContain("2D Club Tracking");
    expect(clubRow).toContain(savedAnalysisTaxonomyLabel("wedge_play"));
    expect(clubRow).not.toContain("wedge_play");
    expect(clubRow).not.toContain(savedClubId);

    const empty = renderToStaticMarkup(createElement(SavedAnalysesSection, {
      analyses: [],
      onRetry() {},
      onOpen() {},
    }));
    expect(empty).toContain("No saved analyses yet.");
    expect(empty).toContain("Saved Body Movement and 2D Club Tracking analyses will appear here.");

    const failed = renderToStaticMarkup(createElement(SavedAnalysesSection, {
      error: true,
      analyses: [savedBodySummary],
      onRetry() {},
      onOpen() {},
    }));
    expect(failed).toContain("Saved analyses could not be loaded.");
    expect(saveButton(failed, "Retry")).not.toContain("disabled");
    expect(failed).not.toContain("Analyze Body Movement");
    expect(failed).not.toContain(savedBodyId);

    const page = renderToStaticMarkup(createElement(PeakFlowSwingPageContent));
    expect(page.indexOf("Analyze 2D Club Tracking")).toBeLessThan(page.indexOf("Saved Analyses"));
    expect(page).toContain("Analyze Body Movement");
    expect(page).toContain("Analyze 2D Club Tracking");
  });

  it("opens a saved Body analysis from the detail route into the existing Body view", async () => {
    const storedResult = {
      frames: bodyAnalysis.frames,
      metrics_summary: bodyAnalysis.metrics_summary,
    };
    const detail = {
      ...savedBodySummary,
      result: storedResult,
      playbackUrl: bodyPlaybackUrl,
    };
    expect(peakFlowAnalysisDetailUrl(savedBodyId, athleteId)).toBe(
      `${API_BASE}/analyses/${savedBodyId}?athleteId=${athleteId}`,
    );
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => detail,
    }));
    vi.stubGlobal("fetch", fetchMock);
    const opened = await fetchPeakFlowSavedAnalysis(savedBodyId, athleteId);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      `${API_BASE}/analyses/${savedBodyId}?athleteId=${athleteId}`,
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "GET" });
    const view = openedAnalysisView(opened);
    expect(view.tab).toBe("body");
    expect(view.result).toBe(storedResult);
    expect(view.playbackUrl).toBe(bodyPlaybackUrl);
    expect(storedResult).not.toHaveProperty("playbackUrl");
    expect(view.save.record).not.toHaveProperty("playbackUrl");
    expect(view.save.record).not.toHaveProperty("result");
    expect(view.save.status).toBe("saved");

    const html = renderResults({
      bodyAnalysis: view.result,
      clubAnalysis,
      initialTab: "body",
      bodyPlaybackUrl: view.playbackUrl,
      initialBodySaveStatus: "saved",
    });
    expect(html).toContain(bodyPlaybackUrl);
    expect(html).toContain("12.3°");
    expect(html).toContain("Body Movement Modeling");
    expect(html).not.toContain("/renders/club_swingtrace.mp4");
    expect(html).not.toContain("1.2345");

    const openFn = source.slice(
      source.indexOf("async function handleOpenSavedAnalysis"),
      source.indexOf("if (!allowed) return null"),
    );
    const bodyBranch = openFn.slice(
      openFn.indexOf('if (view.tab === "body")'),
      openFn.indexOf('} else if (view.tab === "club")'),
    );
    expect(bodyBranch).toContain("setBodyAnalysis(view.result)");
    expect(bodyBranch).toContain("setBodyPlaybackUrl(view.playbackUrl)");
    expect(bodyBranch).toContain("clearPeakFlowSwingDraft(PEAKFLOW_BODY_DRAFT_KEY)");
    expect(bodyBranch).not.toContain("writePeakFlowSwingDraft");
    expect(openFn).toContain("setResultsView");
    expect(openFn).toContain("tab: view.tab");
    expect(bodyBranch).not.toContain("setClubAnalysis");
    expect(bodyBranch).not.toContain("setClubPlaybackUrl");
    expect(openFn).not.toContain("postVideo");
    expect(openFn).not.toContain("postPeakFlowSaveAnalysis");
    expect(openFn).not.toContain("/analyze/");
    expect(openFn).not.toContain("/analyses/save");
  });

  it("opens a saved Club analysis from the detail route into the existing Club view", async () => {
    const storedResult = clubAnalysis;
    const detail = {
      ...savedClubSummary,
      result: storedResult,
      playbackUrl: clubPlaybackUrl,
    };
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => detail,
    }));
    vi.stubGlobal("fetch", fetchMock);
    const opened = await fetchPeakFlowSavedAnalysis(savedClubId, athleteId);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      `${API_BASE}/analyses/${savedClubId}?athleteId=${athleteId}`,
    );
    const view = openedAnalysisView(opened);
    expect(view.tab).toBe("club");
    expect(view.result).toBe(storedResult);
    expect(view.playbackUrl).toBe(clubPlaybackUrl);
    expect(view.save.record).not.toHaveProperty("playbackUrl");

    const html = renderResults({
      bodyAnalysis,
      clubAnalysis: view.result,
      initialTab: "club",
      clubPlaybackUrl: view.playbackUrl,
    });
    expect(html).toContain(clubPlaybackUrl);
    expect(html).not.toContain("1.2345");
    expect(html).not.toContain("Peak Clubhead Speed");
    expect(html).not.toContain("2D Clubhead Path Deviation");
    expect(html).toContain("2D Club Tracking");
    expect(html).not.toContain("/renders/body.mp4");
    expect(html).not.toContain("12.3°");

    const openFn = source.slice(
      source.indexOf("async function handleOpenSavedAnalysis"),
      source.indexOf("if (!allowed) return null"),
    );
    const clubBranch = openFn.slice(openFn.indexOf('} else if (view.tab === "club")'));
    expect(clubBranch).toContain("setClubAnalysis(view.result)");
    expect(clubBranch).toContain("setClubPlaybackUrl(view.playbackUrl)");
    expect(clubBranch).toContain("clearPeakFlowSwingDraft(PEAKFLOW_CLUB_DRAFT_KEY)");
    expect(clubBranch).not.toContain("writePeakFlowSwingDraft");
    expect(clubBranch).not.toContain("setBodyAnalysis");
    expect(clubBranch).not.toContain("setBodyPlaybackUrl");
    expect(openFn).not.toContain("postVideo");
    expect(openFn).not.toContain("postPeakFlowSaveAnalysis");
  });

  it("keeps a failed open from replacing the current result and refreshes history only after save", () => {
    const openFn = source.slice(
      source.indexOf("async function handleOpenSavedAnalysis"),
      source.indexOf("if (!allowed) return null"),
    );
    const openCatch = openFn.slice(openFn.lastIndexOf("} catch {"));
    expect(openCatch).toContain("setOpenAnalysisErrorId(item.id)");
    expect(openCatch).not.toContain("setBodyAnalysis");
    expect(openCatch).not.toContain("setClubAnalysis");
    expect(openCatch).not.toContain("setBodyPlaybackUrl");
    expect(openCatch).not.toContain("setClubPlaybackUrl");
    expect(openCatch).not.toContain("setBodyTaxonomyAreaKey");
    expect(openCatch).not.toContain("setClubTaxonomyAreaKey");
    expect(openCatch).not.toContain("setBodySave");
    expect(openCatch).not.toContain("setClubSave");

    const failedRow = renderToStaticMarkup(createElement(SavedAnalysesSection, {
      analyses: [savedBodySummary],
      openAnalysisErrorId: savedBodyId,
      onRetry() {},
      onOpen() {},
    }));
    expect(failedRow).toContain("Saved analysis could not be opened.");
    expect(saveButton(failedRow, "Open")).not.toContain("disabled");

    const saveBody = source.slice(
      source.indexOf("async function handleSaveBody"),
      source.indexOf("async function handleSaveClub"),
    );
    const saveClub = source.slice(
      source.indexOf("async function handleSaveClub"),
      source.indexOf("const frames"),
    );
    expect(saveBody).toContain("onAnalysisSaved?.()");
    expect(saveClub).toContain("onAnalysisSaved?.()");
    expect(source).toContain("onAnalysisSaved={refreshSavedAnalyses}");
    const refresh = source.slice(
      source.indexOf("function refreshSavedAnalyses"),
      source.indexOf("function persistBodySave"),
    );
    expect(refresh).toContain("setSavedAnalysesReload");
    expect(refresh).not.toContain("fetchPeakFlowSavedAnalysis");
    expect(refresh).not.toContain("postVideo");
    expect(refresh).not.toContain("/analyses/save");
    expect(refresh).not.toContain("/analyze/");
  });

  it("does not persist an opened saved analysis or its signed playback URL", () => {
    installSessionStorage();
    const historicalBody = {
      ...bodyAnalysis,
      overlay_video_url: "/renders/body.mp4",
    };
    writePeakFlowSwingDraft(PEAKFLOW_BODY_DRAFT_KEY, {
      result: historicalBody,
      taxonomyAreaKey: "tee_shots_driving",
      save: { status: "saved", record: savedBodySummary },
    });
    clearPeakFlowSwingDraft(PEAKFLOW_BODY_DRAFT_KEY);
    expect(readPeakFlowSwingDrafts().body).toBeNull();
    expect(sessionStorage.getItem(PEAKFLOW_BODY_DRAFT_KEY) ?? "").not.toContain(bodyPlaybackUrl);
    expect(sessionStorage.getItem(PEAKFLOW_BODY_DRAFT_KEY) ?? "").not.toContain("/renders/body.mp4");

    const html = renderToStaticMarkup(createElement(PeakFlowSwingPageContent));
    expect(html).not.toContain("/renders/body.mp4");
    expect(html).not.toContain(bodyPlaybackUrl);

    const historicalClub = {
      ...clubAnalysis,
      swingtrace_video_url: "/renders/club_swingtrace.mp4",
    };
    writePeakFlowSwingDraft(PEAKFLOW_CLUB_DRAFT_KEY, {
      result: historicalClub,
      taxonomyAreaKey: "wedge_play",
      save: { status: "saved", record: savedClubSummary },
    });
    clearPeakFlowSwingDraft(PEAKFLOW_CLUB_DRAFT_KEY);
    const clubHtml = renderToStaticMarkup(createElement(PeakFlowSwingPageContent));
    expect(clubHtml).not.toContain("/renders/club_swingtrace.mp4");
    expect(clubHtml).not.toContain(clubPlaybackUrl);
    expect(readPeakFlowSwingDrafts().club).toBeNull();
  });
});

describe("PeakFlow Swing sharing", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows independent Shared and coach Viewed status for each saved analysis", () => {
    const sharedBody = {
      ...savedBodySummary,
      shared: true,
      sharedAt: "2026-10-31T12:31:00.000Z",
      coachViewingStatus: [
        {
          coachId: "head-coach",
          displayName: "Alex Head",
          recipientRoles: ["HEAD_COACH"],
          viewed: false,
          viewedAt: null,
        },
        {
          coachId: "skills-coach",
          displayName: "Sam Skills",
          recipientRoles: ["SKILLS_COACH"],
          viewed: true,
          viewedAt: "2026-10-31T13:00:00.000Z",
        },
      ],
    };
    const unsharedClub = {
      ...savedClubSummary,
      shared: false,
      sharedAt: null,
      coachViewingStatus: [
        {
          coachId: "head-coach",
          displayName: "Alex Head",
          recipientRoles: ["HEAD_COACH"],
          viewed: true,
          viewedAt: "2026-10-31T13:05:00.000Z",
        },
        {
          coachId: "skills-coach",
          displayName: "Sam Skills",
          recipientRoles: ["SKILLS_COACH"],
          viewed: false,
          viewedAt: null,
        },
      ],
    };

    const html = renderToStaticMarkup(createElement(SavedAnalysesSection, {
      analyses: [sharedBody, unsharedClub],
      showSharing: true,
      onRetry() {},
      onOpen() {},
      onShare() {},
    }));
    expect(html.match(/>Shared</g)).toHaveLength(1);
    expect(html.match(/>Not Shared</g)).toHaveLength(1);
    expect(html).toContain("Alex Head · Head Coach · Not Viewed");
    expect(html).toContain("Sam Skills · Skills Coach · Viewed");
    expect(html).toContain("Alex Head · Head Coach · Viewed");
    expect(html).toContain("Sam Skills · Skills Coach · Not Viewed");
    expect(html).toContain("Share Analysis");
    expect(html).toContain("Open");
    const buttons = [...html.matchAll(/<button[^>]*>Share Analysis<\/button>/g)].map((match) => match[0]);
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toContain("disabled");
    expect(buttons[1]).not.toContain("disabled");

    const coachOnly = renderToStaticMarkup(createElement(SavedAnalysesSection, {
      analyses: [sharedBody],
      showSharing: false,
      onRetry() {},
      onOpen() {},
    }));
    expect(coachOnly).not.toContain("Share Analysis");
    expect(coachOnly).toContain("Open");
    expect(coachOnly).toContain("Sam Skills · Skills Coach · Viewed");
    expect(coachOnly).toContain("Alex Head · Head Coach · Not Viewed");
  });

  it("opens a saved analysis in the existing viewer without save actions", () => {
    const html = renderResults({
      bodyAnalysis,
      clubAnalysis: null,
      readOnly: true,
      bodyPlaybackUrl,
      initialBodySaveStatus: "saved",
    });
    expect(html).toContain(bodyPlaybackUrl);
    expect(html).toContain("12.3°");
    expect(html).not.toContain("Save Body Analysis");
    expect(html).not.toContain("New Analysis");
    expect(html).not.toContain("Share Analysis");
  });

  it("shares with an empty body and retries once with the authoritative entity id", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          message: "entityId is required to share this legacy analysis",
          errorCode: "ENTITY_CONTEXT_REQUIRED",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: savedBodyId, shared: true }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await postPeakFlowShareAnalysis(savedBodyId, "entity-1");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toBe(`${API_BASE}/analyses/${savedBodyId}/share`);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toEqual({});
    expect(JSON.parse(String(fetchMock.mock.calls[1][1].body))).toEqual({ entityId: "entity-1" });

    const shareFn = source.slice(
      source.indexOf("async function handleShareSavedAnalysis"),
      source.indexOf("if (!allowed) return null"),
    );
    expect(shareFn).toContain("postPeakFlowShareAnalysis(item.id, entityId)");
    expect(shareFn).toContain("refreshSavedAnalyses()");
    expect(shareFn).not.toContain("trainingEntityId");
  });

  it("does not invent an entity when legacy share context is missing", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 409,
      json: async () => ({
        message: "entityId is required to share this legacy analysis",
        errorCode: "ENTITY_CONTEXT_REQUIRED",
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(postPeakFlowShareAnalysis(savedBodyId, "  ")).rejects.toThrow(
      "entityId is required to share this legacy analysis",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toEqual({});
  });
});

describe("PeakFlow Swing close analysis", () => {
  function closeSource(name: string, nextName: string) {
    return source.slice(source.indexOf(`function ${name}`), source.indexOf(`function ${nextName}`));
  }

  const clearBody = closeSource("clearBodyAnalysisState", "clearClubAnalysisState");
  const clearClub = closeSource("clearClubAnalysisState", "requestCloseBody");
  const closeBody = closeSource("requestCloseBody", "requestCloseClub");
  const closeClub = closeSource("requestCloseClub", "keepAnalysis");
  const keep = closeSource("keepAnalysis", "closeWithoutSaving");
  const discard = closeSource("closeWithoutSaving", "handleReset");

  it("shows a close action beside each result save action", () => {
    const savedBody = renderResults({
      bodyAnalysis,
      clubAnalysis: null,
      initialBodySaveStatus: "saved",
    });
    expect(saveButton(savedBody, "Close Body Analysis")).not.toBe("");
    expect(saveButton(savedBody, "Saved ✓")).toContain("disabled");
    expect(savedBody).not.toContain("Close unsaved analysis?");
    expect(savedBody).not.toContain("Close Club Analysis");

    const savedClub = renderResults({
      bodyAnalysis: null,
      clubAnalysis,
      initialClubSaveStatus: "saved",
    });
    expect(saveButton(savedClub, "Close Club Analysis")).not.toBe("");
    expect(saveButton(savedClub, "Saved ✓")).toContain("disabled");
    expect(savedClub).not.toContain("Close Body Analysis");

    const actionRow = source.slice(
      source.indexOf("New Analysis"),
      source.indexOf('aria-label="Analysis views"'),
    );
    expect(actionRow).not.toContain("Close Body Analysis");
    expect(actionRow).not.toContain("Close Club Analysis");
  });

  it("closes a saved or opened analysis immediately and warns when it is unsaved or save failed", () => {
    expect(closeBody).toContain('bodySave.status === "saved"');
    expect(closeBody).toContain("clearBodyAnalysisState()");
    expect(closeBody).toContain('setPendingClose("body")');
    expect(closeClub).toContain('clubSave.status === "saved"');
    expect(closeClub).toContain("clearClubAnalysisState()");
    expect(closeClub).toContain('setPendingClose("club")');
    expect(source).toContain('save: {\n      status: "saved",');

    const unsavedBody = renderResults({ bodyAnalysis, clubAnalysis: null });
    expect(saveButton(unsavedBody, "Close Body Analysis")).not.toBe("");
    expect(saveButton(unsavedBody, "Save Body Analysis")).not.toContain("disabled");

    const failedBody = renderResults({
      bodyAnalysis,
      clubAnalysis: null,
      initialBodySaveStatus: "failed",
    });
    expect(saveButton(failedBody, "Save failed — Retry")).not.toContain("disabled");
    expect(saveButton(failedBody, "Close Body Analysis")).not.toBe("");

    const failedClub = renderResults({
      bodyAnalysis: null,
      clubAnalysis,
      initialClubSaveStatus: "failed",
    });
    expect(saveButton(failedClub, "Save failed — Retry")).not.toContain("disabled");
    expect(saveButton(failedClub, "Close Club Analysis")).not.toBe("");

    const dialog = renderToStaticMarkup(createElement(CloseUnsavedAnalysisDialog, {
      onKeep() {},
      onDiscard() {},
    }));
    expect(dialog).toContain("Close unsaved analysis?");
    expect(dialog).toContain("This analysis has not been saved. Closing it will discard the current video and metrics.");
    expect(saveButton(dialog, "Keep Analysis")).not.toBe("");
    expect(saveButton(dialog, "Close Without Saving")).not.toBe("");
  });

  it("keeps or discards only the targeted analysis and leaves history and the other side alone", () => {
    expect(keep).toBe("function keepAnalysis() {\n    setPendingClose(null);\n  }\n\n  ");
    expect(keep).not.toContain("clearBodyAnalysisState");
    expect(keep).not.toContain("clearClubAnalysisState");
    expect(keep).not.toContain("fetch");

    expect(discard).toContain('pendingClose === "body"');
    expect(discard).toContain("clearBodyAnalysisState()");
    expect(discard).toContain('pendingClose === "club"');
    expect(discard).toContain("clearClubAnalysisState()");
    expect(discard).toContain("setPendingClose(null)");

    expect(clearBody).toContain("setBodyAnalysis(null)");
    expect(clearBody).toContain("setBodyPlaybackUrl(null)");
    expect(clearBody).toContain('setBodyTaxonomyAreaKey("")');
    expect(clearBody).toContain("setBodySave(EMPTY_SAVE)");
    expect(clearBody).toContain('setBodyPhase("idle")');
    expect(clearBody).toContain("clearPeakFlowSwingDraft(PEAKFLOW_BODY_DRAFT_KEY)");
    expect(clearBody).not.toContain("setClubAnalysis");
    expect(clearBody).not.toContain("setClubPlaybackUrl");
    expect(clearBody).not.toContain("setClubTaxonomyAreaKey");
    expect(clearBody).not.toContain("setClubSave");
    expect(clearBody).not.toContain("PEAKFLOW_CLUB_DRAFT_KEY");
    expect(clearBody).not.toContain("setSavedAnalyses");
    expect(clearBody).not.toContain("fetch");
    expect(clearBody).not.toContain("postVideo");
    expect(clearBody).not.toContain("postPeakFlowSaveAnalysis");

    expect(clearClub).toContain("setClubAnalysis(null)");
    expect(clearClub).toContain("setClubPlaybackUrl(null)");
    expect(clearClub).toContain('setClubTaxonomyAreaKey("")');
    expect(clearClub).toContain("setClubSave(EMPTY_SAVE)");
    expect(clearClub).toContain('setClubPhase("idle")');
    expect(clearClub).toContain("clearPeakFlowSwingDraft(PEAKFLOW_CLUB_DRAFT_KEY)");
    expect(clearClub).not.toContain("setBodyAnalysis");
    expect(clearClub).not.toContain("setBodyPlaybackUrl");
    expect(clearClub).not.toContain("setBodyTaxonomyAreaKey");
    expect(clearClub).not.toContain("setBodySave");
    expect(clearClub).not.toContain("PEAKFLOW_BODY_DRAFT_KEY");
    expect(clearClub).not.toContain("setSavedAnalyses");
    expect(clearClub).not.toContain("fetch");
    expect(clearClub).not.toContain("postVideo");
    expect(clearClub).not.toContain("postPeakFlowSaveAnalysis");

    for (const block of [clearBody, clearClub, closeBody, closeClub, keep, discard]) {
      expect(block).not.toContain("DELETE");
      expect(block).not.toContain("PATCH");
      expect(block).not.toContain("fetchPeakFlowSavedAnalyses");
      expect(block).not.toContain("fetchPeakFlowSavedAnalysis");
    }

    expect(source).toContain("onCloseBody={requestCloseBody}");
    expect(source).toContain("onCloseClub={requestCloseClub}");
    for (const block of [clearBody, clearClub, closeBody, closeClub, keep, discard]) {
      expect(block).not.toContain("handleReset");
    }
  });
});
