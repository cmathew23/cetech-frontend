import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/athlete/peakflow-swing",
  useRouter: () => ({ push() {}, replace() {}, refresh() {} }),
  useSearchParams: () => new URLSearchParams(),
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

const { AnalysisResults } = await import("./PeakFlowSwingPageContent");

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

function renderResults(props: { bodyAnalysis?: object | null; clubAnalysis?: object | null; initialTab?: string }) {
  return renderToStaticMarkup(
    createElement(AnalysisResults, { onReset() {}, ...props }),
  );
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
    expect(body).toContain('postVideo("/analyze/body", file)');
    expect(body).toContain("data.analysis");
    expect(body).not.toContain("/analyze/club");
    expect(body).not.toContain("handleAnalyzeClub");
  });

  it("posts the Club file to /analyze/club/upload", () => {
    const club = source.slice(source.indexOf("async function handleAnalyzeClub"));
    expect(club).toContain('postVideo("/analyze/club/upload", file)');
    expect(club).not.toContain('pmiUrl("/analyze/club")');
    expect(source).not.toContain("analysis_id");
    expect(source).toContain('form.append("video", file)');
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
