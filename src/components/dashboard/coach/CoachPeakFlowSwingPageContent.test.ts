import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/coach/peakflow-swing",
  useRouter: () => ({ replace() {} }),
}));

vi.mock("@/components/dashboard/coach/useCoachSportCode", () => ({
  useCoachSportCode: () => ({ sportCode: "GOLF", ready: true }),
}));

vi.mock("@/lib/api/coachMe", () => ({
  fetchCoachPeakFlowAssignmentScope: vi.fn(),
}));

const source = readFileSync(
  new URL("./CoachPeakFlowSwingPageContent.tsx", import.meta.url),
  "utf8",
);

describe("Coach PeakFlow Swing", () => {
  it("renders the athlete selector and read-only saved analyses", async () => {
    const { CoachPeakFlowSwingPageContent } = await import("./CoachPeakFlowSwingPageContent");
    const html = renderToStaticMarkup(createElement(CoachPeakFlowSwingPageContent));
    expect(html).toContain("PeakFlow Swing");
    expect(html).toContain("Athlete");
    expect(html).toContain("coach-peakflow-athlete");
    expect(html).toContain("Saved Analyses");
    expect(html).toContain("Open a previous analysis to review the saved video and metrics.");
    expect(html).not.toContain("Share Analysis");
    expect(html).not.toContain("Analyze Body Movement");
    expect(html).not.toContain("New Analysis");
  });

  it("is a read-only golf view over shared CETECH analyses", () => {
    expect(source).toContain("fetchCoachPeakFlowAssignmentScope");
    expect(source).toContain("scope.trainingEntityId");
    expect(source).toContain("scope.athletes");
    expect(source).toContain("fetchPeakFlowSavedAnalyses(selectedAthleteId, trainingEntityId)");
    expect(source).toContain("row.shared === true");
    expect(source).toContain('row.analysisType === "BODY"');
    expect(source).toContain('row.analysisType === "CLUB"');
    expect(source).toContain("fetchPeakFlowSavedAnalysis(item.id, selectedAthleteId)");
    expect(source).toContain("setBodyAnalysis(view.result)");
    expect(source).toContain("setBodyPlaybackUrl(view.playbackUrl)");
    expect(source).toContain("setClubAnalysis(view.result)");
    expect(source).toContain("setClubPlaybackUrl(view.playbackUrl)");
    expect(source).toContain("readOnly");
    expect(source).toContain("showSharing={false}");
    expect(source).toContain('router.replace("/coach/dashboard")');
    expect(source).not.toContain("postPeakFlowSaveAnalysis");
    expect(source).not.toContain("postPeakFlowShareAnalysis");
    expect(source).not.toContain("postVideo");
    expect(source).not.toContain("/analyze/");
    expect(source).not.toContain("PMI_INTERNAL_TOKEN");
    expect(source).not.toContain("athlete.sport");
    expect(source).not.toContain("row.sport");
  });
});
