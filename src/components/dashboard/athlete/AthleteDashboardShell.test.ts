import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readRelative(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("athlete Sports Metrics legacy isolation", () => {
  it("keeps the athlete dashboard route wired to AthleteDashboardShell", () => {
    const page = readFileSync(
      new URL("../../../app/athlete/dashboard/page.tsx", import.meta.url),
      "utf8",
    );
    expect(page).toContain(
      'import { AthleteDashboardShell } from "@/components/dashboard/athlete/AthleteDashboardShell"',
    );
    expect(page).toContain("return <AthleteDashboardShell />");
  });

  it("renders Weekly Goal Performance without mounting legacy Sports Metrics UI", () => {
    const source = readRelative("./AthleteDashboardShell.tsx");
    const activeImport = source
      .split("\n")
      .find((line) =>
        line.startsWith(
          'import { SportMetricsSection } from "@/components/dashboard/SportMetricsSection"',
        ),
      );

    expect(activeImport).toBeUndefined();
    expect(source).not.toContain(
      'return <p className="text-sm font-medium text-textPrimary">Sports Metrics</p>',
    );
    expect(source).toContain("<AthleteWeeklyGoalPerformanceSection");
    expect(source).toContain("<AthleteCompetitionEntrySection");
    expect(source).toContain("<AthleteCompetitionPerformanceSection");
    expect(source).not.toContain("fetchSportMetricsGolfWeeklySummary");
    expect(source).not.toContain("fetchSportMetricsGolfComparison");
    expect(source).not.toContain("GolfSportsMetricsComparison");
    expect(source).not.toContain("SportMetricsEvidenceCards");
    expect(source).toContain("<AthleteSportMetricsWithPlanVersion");
    expect(source).not.toContain("allowCoachPracticeRating");
  });

  it("does not execute the commented legacy SportMetricsSection path", () => {
    const source = readRelative("./AthleteDashboardShell.tsx");
    const uncommentedMount = source
      .split("\n")
      .filter((line) => line.includes("<SportMetricsSection"))
      .filter((line) => !line.trimStart().startsWith("//"));

    expect(uncommentedMount).toEqual([]);
    expect(source).toContain("//   <SportMetricsSection");
  });

  it("leaves unrelated athlete dashboard sections in place", () => {
    const source = readRelative("./AthleteDashboardShell.tsx");
    expect(source).toContain("<AthleteWeeklyAdherenceSection />");
    expect(source).toContain("<AthleteTodayPlanCard />");
    expect(source).toContain("<AthleteWearableSummaryWithPlanWindow");
    expect(source).toContain("<WearableSummarySection");
  });

  it("leaves shared coach SportMetricsSection mounts unchanged", () => {
    const overview = readFileSync(
      new URL("../coach/CoachWeeklyAdherenceOverview.tsx", import.meta.url),
      "utf8",
    );
    const performance = readFileSync(
      new URL("../coach/CoachAthletePerformancePageContent.tsx", import.meta.url),
      "utf8",
    );
    const section = readFileSync(
      new URL("../SportMetricsSection.tsx", import.meta.url),
      "utf8",
    );

    expect(performance).toContain("<SportMetricsSection");
    expect(performance).toContain("allowCoachPracticeRating");
    expect(overview).toContain("<SportMetricsSection");
    expect(section).toContain("fetchSportMetricsGolfWeeklySummary");
    expect(section).toContain("<GolfSportsMetricsComparisonControls");
  });
});
