import { GolfSportsMetricsComparison } from "@/components/dashboard/GolfSportsMetricsComparison";
import type {
  SportMetricsGolfComparisonCategory,
  SportMetricsGolfComparisonData,
  SportMetricsGolfComparisonDrill,
  SportMetricsGolfComparisonMetric,
  SportMetricsGolfComparisonStatus,
} from "@/lib/api/sportMetricsGolf";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/Card", async () => {
  const { createElement } = await import("react");
  return {
    Card: ({
      title,
      subtitle,
      actions,
      children,
    }: {
      title?: string;
      subtitle?: string;
      actions?: ReactNode;
      children: ReactNode;
    }) =>
      createElement(
        "article",
        null,
        title ? createElement("h3", null, title) : null,
        subtitle ? createElement("p", null, subtitle) : null,
        actions,
        children,
      ),
  };
});

vi.mock("@/components/ui/Alert", async () => {
  const { createElement } = await import("react");
  return {
    Alert: ({
      children,
      variant,
    }: {
      children: ReactNode;
      variant?: string;
    }) => createElement("div", { "data-alert-variant": variant }, children),
  };
});

vi.mock("@/components/ui/StatusBadge", async () => {
  const { createElement } = await import("react");
  return {
    StatusBadge: ({
      children,
      className,
    }: {
      children: ReactNode;
      className?: string;
    }) => createElement("span", { className }, children),
  };
});

function metric(
  overrides: Partial<SportMetricsGolfComparisonMetric> = {},
): SportMetricsGolfComparisonMetric {
  return {
    attempts: 10,
    successes: 7,
    targetHits: 5,
    successRate: 70,
    ...overrides,
  };
}

function drill(
  status: SportMetricsGolfComparisonStatus,
  overrides: Partial<SportMetricsGolfComparisonDrill> = {},
): SportMetricsGolfComparisonDrill {
  return {
    sport: "GOLF",
    taxonomyAreaKey: "distance_control",
    skillCode: "GOLF_WEDGE_001",
    earlierSkillName: "Earlier Wedge",
    laterSkillName: "Later Wedge",
    taxonomyMismatch: false,
    status,
    earlier: metric(),
    later: metric({ successes: 8, successRate: 80 }),
    delta: metric({
      attempts: 0,
      successes: 1,
      targetHits: 0,
      successRate: 10,
    }),
    ...overrides,
  };
}

function category(
  status: SportMetricsGolfComparisonStatus,
  overrides: Partial<SportMetricsGolfComparisonCategory> = {},
): SportMetricsGolfComparisonCategory {
  return {
    sport: "GOLF",
    taxonomyAreaKey: "distance_control",
    status,
    drillMixChanged: false,
    earlier: metric(),
    later: metric({ successes: 8, successRate: 80 }),
    delta: metric({
      attempts: 0,
      successes: 1,
      targetHits: 0,
      successRate: 10,
    }),
    drills: [drill(status)],
    ...overrides,
  };
}

function comparison(
  overrides: Partial<SportMetricsGolfComparisonData> = {},
): SportMetricsGolfComparisonData {
  return {
    sport: "GOLF",
    earlier: {
      trainingPlanId: "plan-earlier",
      trainingPlanVersionId: "version-earlier",
      weekStartDate: "2026-05-25",
      weekEndDate: "2026-05-31",
    },
    later: {
      trainingPlanId: "plan-later",
      trainingPlanVersionId: "version-later",
      weekStartDate: "2026-06-01",
      weekEndDate: "2026-06-07",
    },
    categories: [category("COMPARABLE")],
    taxonomyMismatches: [],
    unclassifiableCounts: {
      earlier: 0,
      later: 0,
    },
    ...overrides,
  };
}

function render(data: SportMetricsGolfComparisonData): string {
  return renderToStaticMarkup(
    createElement(GolfSportsMetricsComparison, { comparison: data }),
  );
}

describe("GolfSportsMetricsComparison", () => {
  it("renders week metadata and a comparable category with backend metrics and delta", () => {
    const html = render(comparison());

    expect(html).toContain("Golf Sports Metrics Comparison");
    expect(html).not.toContain("plan-earlier");
    expect(html).not.toContain("version-earlier");
    expect(html).toContain("25/05/2026");
    expect(html).toContain("31/05/2026");
    expect(html).not.toContain("plan-later");
    expect(html).not.toContain("version-later");
    expect(html).toContain("01/06/2026");
    expect(html).toContain("07/06/2026");
    expect(html).toContain("Distance Control");
    expect(html).not.toContain("Taxonomy area key");
    expect(html).not.toContain("Skill code");
    expect(html).toContain("Comparable");
    expect(html).not.toContain("COMPARABLE");
    expect(html).not.toContain("2026-05-25");
    expect(html).not.toContain("2026-06-01");
    expect(html).toContain("25/05/2026 – 31/05/2026");
    expect(html).toContain("01/06/2026 – 07/06/2026");
    expect(html).toContain("Difference");
    expect(html).not.toContain("Backend delta");
    expect(html).not.toContain("Earlier metrics");
    expect(html).not.toContain("Later metrics");
    expect(html).toContain("80%");
    expect(html).toContain("10%");
    expect(html).not.toContain("bg-zinc-200 text-zinc-900");
    expect(html).not.toContain("Drill mix changed");
    expect(html).not.toContain("Classification changed between weeks");
  });

  it("renders friendly one-sided statuses and differing drill names", () => {
    const html = render(
      comparison({
        categories: [
          category("ONLY_IN_EARLIER", {
            taxonomyAreaKey: "short_game",
            later: null,
            drills: [
              drill("ONLY_IN_EARLIER", {
                taxonomyAreaKey: "short_game",
                skillCode: "GOLF_CHIP_001",
                earlierSkillName: "Earlier Chipping",
                laterSkillName: null,
                later: null,
              }),
            ],
          }),
          category("ONLY_IN_LATER", {
            taxonomyAreaKey: "chipping",
            earlier: null,
            drills: [
              drill("ONLY_IN_LATER", {
                taxonomyAreaKey: "chipping",
                skillCode: "GOLF_CHIP_002",
                earlierSkillName: null,
                laterSkillName: "Later Chipping",
                earlier: null,
              }),
            ],
          }),
        ],
      }),
    );

    expect(html).toContain("Only in earlier week");
    expect(html).toContain("Added in later week");
    expect(html).not.toContain("ONLY_IN_EARLIER");
    expect(html).not.toContain("ONLY_IN_LATER");
    expect(html).toContain("Earlier Chipping");
    expect(html).toContain("Later Chipping");
    expect(html).not.toContain("Earlier name");
    expect(html).not.toContain("Later name");
    expect(html).toContain("Not present this week");
  });

  it("renders a friendly non-comparable status and preserves null and zero metrics", () => {
    const zeroAndNull = metric({
      attempts: 0,
      successes: null,
      targetHits: 0,
      successRate: null,
    });
    const html = render(
      comparison({
        categories: [
          category("NOT_COMPARABLE", {
            earlier: zeroAndNull,
            later: zeroAndNull,
            delta: zeroAndNull,
            drills: [
              drill("NOT_COMPARABLE", {
                earlier: zeroAndNull,
                later: zeroAndNull,
                delta: zeroAndNull,
              }),
            ],
          }),
        ],
      }),
    );

    expect(html).toContain("Not comparable");
    expect(html).not.toContain("NOT_COMPARABLE");
    expect(html).toMatch(/Attempts<\/dt><dd[^>]*>0<\/dd>/);
    expect(html).toMatch(/Target hits<\/dt><dd[^>]*>0<\/dd>/);
    expect(html).toMatch(/Successes<\/dt><dd[^>]*>Unavailable<\/dd>/);
    expect(html).toMatch(/Success rate<\/dt><dd[^>]*>Unavailable<\/dd>/);
    expect(html).toMatch(/Difference[\s\S]*Successes<\/dt><dd[^>]*>—<\/dd>/);
    expect(html).toMatch(/Difference[\s\S]*Attempts<\/dt><dd[^>]*>0<\/dd>/);
    expect(html).not.toContain("0%");
  });

  it("shows drill-mix and classification warnings only when true", () => {
    const html = render(
      comparison({
        categories: [
          category("COMPARABLE", {
            drillMixChanged: true,
            drills: [
              drill("COMPARABLE", {
                taxonomyMismatch: true,
                skillCode: "GOLF_CHIP_001",
              }),
            ],
          }),
        ],
        taxonomyMismatches: [
          {
            skillCode: "GOLF_CHIP_001",
            earlierTaxonomyAreaKeys: ["short_game", "putting"],
            laterTaxonomyAreaKeys: ["chipping"],
          },
        ],
      }),
    );

    expect(html).toContain("Drill mix changed");
    expect(html).not.toContain(">true<");
    expect(html).not.toContain(">false<");
    expect(html).toContain("Classification changed between weeks");
    expect(html).toContain('data-alert-variant="warning"');
    expect(html).toContain("Classification changes");
    expect(html).not.toContain("Skill code");
    expect(html).not.toContain("GOLF_CHIP_001");
    expect(html).toContain("Short Game");
    expect(html).toContain("Putting");
    expect(html).toContain("Chipping");
  });

  it("hides empty mismatch and zero unclassifiable sections", () => {
    const html = render(
      comparison({
        categories: [],
        taxonomyMismatches: [],
      }),
    );

    expect(html).toContain("Categories");
    expect(html).not.toContain("Classification changes");
    expect(html).not.toContain(
      "Some records could not be included in the comparison",
    );
  });

  it("keeps the empty-category message with top-level backend details", () => {
    const html = render(
      comparison({
        categories: [],
        taxonomyMismatches: [
          {
            skillCode: "GOLF_CHIP_001",
            earlierTaxonomyAreaKeys: ["short_game"],
            laterTaxonomyAreaKeys: ["chipping"],
          },
        ],
        unclassifiableCounts: {
          earlier: 2,
          later: 1,
        },
      }),
    );

    expect(html).toContain(
      "No Golf Sports Metrics comparison categories returned.",
    );
    expect(html).toContain("Classification changes");
    expect(html).not.toContain("GOLF_CHIP_001");
    expect(html).toMatch(/Earlier count<\/dt><dd[^>]*>2<\/dd>/);
    expect(html).toMatch(/Later count<\/dt><dd[^>]*>1<\/dd>/);
  });

  it("renders non-zero backend unclassifiable counts including a valid zero", () => {
    const html = render(
      comparison({
        unclassifiableCounts: {
          earlier: 0,
          later: 3,
        },
      }),
    );

    expect(html).toContain(
      "Some records could not be included in the comparison",
    );
    expect(html).toMatch(/Earlier count<\/dt><dd[^>]*>0<\/dd>/);
    expect(html).toMatch(/Later count<\/dt><dd[^>]*>3<\/dd>/);
  });

  it("uses the fallback drill name and hides matching name metadata", () => {
    const unnamedHtml = render(
      comparison({
        categories: [
          category("COMPARABLE", {
            drills: [
              drill("COMPARABLE", {
                earlierSkillName: null,
                laterSkillName: null,
              }),
            ],
          }),
        ],
      }),
    );
    const matchingHtml = render(
      comparison({
        categories: [
          category("COMPARABLE", {
            drills: [
              drill("COMPARABLE", {
                earlierSkillName: "Wedge Control",
                laterSkillName: "Wedge Control",
              }),
            ],
          }),
        ],
      }),
    );

    expect(unnamedHtml).toContain("Unnamed drill");
    expect(unnamedHtml).not.toContain("Earlier name");
    expect(unnamedHtml).not.toContain("Later name");
    expect(matchingHtml).toContain("Wedge Control");
    expect(matchingHtml).not.toContain("Earlier name");
    expect(matchingHtml).not.toContain("Later name");
  });
});
