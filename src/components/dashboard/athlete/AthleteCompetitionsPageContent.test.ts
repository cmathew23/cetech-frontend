import { AthleteSeasonCompetitionCards } from "@/components/dashboard/athlete/AthleteCompetitionsPageContent";
import type { GolfCompetitionListItem } from "@/lib/api/sportMetricsGolfCompetitions";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

function listItem(
  overrides: Partial<GolfCompetitionListItem>,
): GolfCompetitionListItem {
  return {
    id: "competition-1",
    name: "Club Championship",
    type: "CHAMPIONSHIP",
    format: 18,
    venue: "PeakFlow Golf Club",
    startDate: "2026-09-12",
    numberOfDays: 2,
    seasonPhase: "IN_SEASON",
    seasonCycleId: "season-2026",
    seasonYear: 2026,
    status: "DRAFT",
    ...overrides,
  };
}

describe("athlete Competitions page list", () => {
  it("wires the existing entry workflow and list GET with weekly-summary seasonCycleId", () => {
    const page = readFileSync(
      new URL("../../../app/athlete/competitions/page.tsx", import.meta.url),
      "utf8",
    );
    expect(page).toContain("<AthleteCompetitionsPageContent />");

    const content = readFileSync(
      new URL("./AthleteCompetitionsPageContent.tsx", import.meta.url),
      "utf8",
    );
    expect(content).toContain("<AthleteCompetitionEntrySection");
    expect(content).toContain("fetchGolfCompetitions({");
    expect(content).toContain("fetchSportMetricsGolfWeeklySummary({");
    expect(content).toContain("summary.seasonCycleId");
    expect(content).toContain("seasonCycleId: nextSeasonCycleId");
    expect(content).not.toContain("fetchGolfCompetitionHistory");
    expect(content).not.toContain("COMPLETED");
    expect(content).not.toContain("seasonCycleId: competition.startDate");
    expect(content).not.toContain("<AthleteCompetitionPerformanceSection");
    expect(content).toContain("No competitions recorded for this season.");
    expect(content).toContain("+ Add Competition");
  });

  it("renders DRAFT and SUBMITTED cards from backend list fields only", () => {
    const html = renderToStaticMarkup(
      createElement(AthleteSeasonCompetitionCards, {
        competitions: [
          listItem({ id: "draft-1", name: "Open Qualifier", status: "DRAFT" }),
          listItem({
            id: "submitted-1",
            name: "Club Championship",
            status: "SUBMITTED",
            format: 9,
            type: "LOCAL",
            venue: "City Links",
            startDate: "2026-08-01",
          }),
        ],
        onSelect: () => {},
      }),
    );

    expect(html).toContain("Open Qualifier");
    expect(html).toContain("DRAFT");
    expect(html).toContain("Club Championship");
    expect(html).toContain("SUBMITTED");
    expect(html).toContain("18 holes");
    expect(html).toContain("9 holes");
    expect(html).toContain("Championship");
    expect(html).toContain("Local");
    expect(html).toContain("City Links");
    expect(html).not.toContain("COMPLETED");
    expect(html).not.toContain("placing");
    expect(html).not.toContain("competitionPerformance");
  });
});
