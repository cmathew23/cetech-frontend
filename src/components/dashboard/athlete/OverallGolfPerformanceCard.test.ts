import {
  OverallGolfPerformanceCard,
  resolveOverallGolfPerformanceDisplay,
} from "@/components/dashboard/athlete/OverallGolfPerformanceCard";
import { parseSportMetricsGolfWeeklySummaryPayload } from "@/lib/api/sportMetricsGolf";
import { readFileSync } from "node:fs";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/Card", async () => {
  const { createElement } = await import("react");
  return {
    Card: ({
      title,
      children,
    }: {
      title?: string;
      children: ReactNode;
    }) =>
      createElement(
        "article",
        null,
        title ? createElement("h3", null, title) : null,
        children,
      ),
  };
});

function summaryFrom(data: Record<string, unknown>) {
  return parseSportMetricsGolfWeeklySummaryPayload({
    success: true,
    data,
  });
}

describe("resolveOverallGolfPerformanceDisplay", () => {
  it("uses coachPracticeScoreOutOf100 when practiceScoreOutOf100 is null", () => {
    const values = resolveOverallGolfPerformanceDisplay(
      summaryFrom({
        practiceScoreOutOf100: null,
        coachPracticeScoreOutOf100: 50,
        competitionPerformance: null,
        overallGolferPerformance: null,
      }),
    );
    expect(values.practiceValue).toBe("50");
  });

  it("reuses the Practice Performance backend score and keeps null competition/overall visible", () => {
    const values = resolveOverallGolfPerformanceDisplay(
      summaryFrom({
        practiceScoreOutOf100: 50,
        competitionPerformance: null,
        overallGolferPerformance: null,
        overallGolferPerformanceHistory: [],
      }),
    );
    expect(values.practiceValue).toBe("50");
    expect(values.competitionValue).toBe("Not available yet");
    expect(values.overallValue).toBe("Not available yet");
    expect(values.trendMessage).toContain("comparable week");
  });

  it("displays backend Competition Performance and Overall Golfer Performance", () => {
    const values = resolveOverallGolfPerformanceDisplay(
      summaryFrom({
        practiceScoreOutOf100: 50,
        competitionPerformance: 58.3,
        overallGolferPerformance: 77.25,
        overallGolferPerformanceHistory: [
          {
            weekStartDate: "2026-08-31",
            weekEndDate: "2026-09-06",
            practiceScoreOutOf100: 48,
            competitionPerformance: 55,
            overallGolferPerformance: 70,
          },
          {
            weekStartDate: "2026-09-07",
            weekEndDate: "2026-09-13",
            practiceScoreOutOf100: 50,
            competitionPerformance: 58.3,
            overallGolferPerformance: 77.25,
          },
        ],
      }),
    );
    expect(values.practiceValue).toBe("50");
    expect(values.competitionValue).toBe("58.3");
    expect(values.overallValue).toBe("77.3");
    expect(values.trendPoints).toEqual([
      { label: "31/08/2026 – 06/09/2026", value: "70" },
      { label: "07/09/2026 – 13/09/2026", value: "77.3" },
    ]);
    expect(values.trendMessage).toBeNull();
  });

  it("keeps Overall Golfer Performance visible when only that backend value is missing", () => {
    const values = resolveOverallGolfPerformanceDisplay(
      summaryFrom({
        practiceScoreOutOf100: 50,
        competitionPerformance: 58.3,
        overallGolferPerformance: null,
        overallGolferPerformanceHistory: [],
      }),
    );
    expect(values.practiceValue).toBe("50");
    expect(values.competitionValue).toBe("58.3");
    expect(values.overallValue).toBe("Not available yet");
  });

  it("shows a baseline Overall trend when only one historical Overall value exists", () => {
    const values = resolveOverallGolfPerformanceDisplay(
      summaryFrom({
        practiceScoreOutOf100: 50,
        competitionPerformance: null,
        overallGolferPerformance: 50,
        overallGolferPerformanceHistory: [
          {
            weekStartDate: "2026-09-07",
            weekEndDate: "2026-09-13",
            overallGolferPerformance: 50,
          },
        ],
      }),
    );
    expect(values.overallValue).toBe("50");
    expect(values.overallCaption).toBe("BASELINE WEEK");
    expect(values.trendPoints).toEqual([
      { label: "07/09/2026 – 13/09/2026", value: "50" },
    ]);
    expect(values.trendMessage).toContain("comparable week");
  });
});

describe("OverallGolfPerformanceCard", () => {
  it("renders Practice, Competition, and Overall backend values", () => {
    const html = renderToStaticMarkup(
      createElement(OverallGolfPerformanceCard, {
        summary: summaryFrom({
          practiceScoreOutOf100: 50,
          competitionPerformance: 58.3,
          overallGolferPerformance: 77.25,
          overallGolferPerformanceHistory: [],
        }),
      }),
    );
    expect(html).toContain("Overall Golf Performance");
    expect(html).toContain("Practice Performance");
    expect(html).toContain(">50<");
    expect(html).not.toContain("50 / 100");
    expect(html).toContain("Competition Performance");
    expect(html).toContain("58.3");
    expect(html).toContain("Overall Golfer Performance");
    expect(html).toContain("77.3");
    expect(html).toContain("Your trend will appear after another comparable week.");
  });

  it("stays visible when Competition and Overall are unavailable", () => {
    const html = renderToStaticMarkup(
      createElement(OverallGolfPerformanceCard, {
        summary: summaryFrom({
          practiceScoreOutOf100: 50,
          competitionPerformance: null,
          overallGolferPerformance: null,
        }),
      }),
    );
    expect(html).toContain("Overall Golf Performance");
    expect(html).toContain(">50<");
    expect(html).toContain("Not available yet");
  });

  it("does not introduce frontend Overall score calculation", () => {
    const source = readFileSync(
      new URL("./OverallGolfPerformanceCard.tsx", import.meta.url),
      "utf8",
    );
    expect(source).not.toContain("0.70 *");
    expect(source).not.toContain("0.45 *");
    expect(source).not.toContain("0.55 *");
    expect(source).not.toContain("practiceScore +");
    expect(source).not.toContain("competitionPerformance +");
    expect(source).not.toContain("/ 2");
    expect(source).toContain("summary?.overallGolferPerformance");
    expect(source).toContain("overallGolferPerformanceHistory");
  });
});

describe("Overall Golf Performance dashboard mounts", () => {
  it("renders the card above Wearables on the athlete dashboard", () => {
    const shell = readFileSync(
      new URL("./AthleteDashboardShell.tsx", import.meta.url),
      "utf8",
    );
    expect(shell).toContain("<OverallGolfPerformanceSection");
    expect(shell.indexOf("<OverallGolfPerformanceSection")).toBeLessThan(
      shell.indexOf("<AthleteWearableSummaryWithPlanWindow"),
    );
  });

  it("renders the card above Wearables on Head Coach and Skills Coach Athlete Performance", () => {
    const page = readFileSync(
      new URL("../coach/CoachAthletePerformancePageContent.tsx", import.meta.url),
      "utf8",
    );
    expect(page).toContain("<OverallGolfPerformanceSection");
    expect(page.indexOf("<OverallGolfPerformanceSection")).toBeLessThan(
      page.indexOf("<WearableSummarySection"),
    );
  });
});
