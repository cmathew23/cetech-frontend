import {
  GolfSportsMetricsComparisonContainerContent,
  runGolfSportsMetricsComparisonLoad,
  type GolfSportsMetricsComparisonContainerState,
} from "@/components/dashboard/GolfSportsMetricsComparisonContainer";
import type {
  SportMetricsGolfComparisonData,
  SportMetricsGolfComparisonResponse,
} from "@/lib/api/sportMetricsGolf";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock(
  "@/components/dashboard/GolfSportsMetricsComparison",
  async () => {
    const { createElement } = await import("react");
    return {
      GolfSportsMetricsComparison: ({
        comparison,
      }: {
        comparison: SportMetricsGolfComparisonData;
      }) =>
        createElement(
          "pre",
          { "data-comparison": "rendered" },
          JSON.stringify(comparison),
        ),
    };
  },
);

vi.mock("@/components/ui/Alert", async () => {
  const { createElement } = await import("react");
  return {
    Alert: ({ children }: { children: ReactNode }) =>
      createElement("div", { role: "alert" }, children),
  };
});

function comparisonData(
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
    categories: [
      {
        sport: "GOLF",
        taxonomyAreaKey: "short_game",
        status: "COMPARABLE",
        drillMixChanged: true,
        earlier: {
          attempts: 0,
          successes: null,
          targetHits: 0,
          successRate: null,
        },
        later: {
          attempts: 10,
          successes: 7,
          targetHits: null,
          successRate: 70,
        },
        delta: {
          attempts: 10,
          successes: null,
          targetHits: null,
          successRate: null,
        },
        drills: [
          {
            sport: "GOLF",
            taxonomyAreaKey: "short_game",
            skillCode: "GOLF_CHIP_001",
            earlierSkillName: "Earlier Chipping",
            laterSkillName: "Later Chipping",
            taxonomyMismatch: true,
            status: "COMPARABLE",
            earlier: {
              attempts: 0,
              successes: null,
              targetHits: 0,
              successRate: null,
            },
            later: {
              attempts: 10,
              successes: 7,
              targetHits: null,
              successRate: 70,
            },
            delta: {
              attempts: 10,
              successes: null,
              targetHits: null,
              successRate: null,
            },
          },
        ],
      },
    ],
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
    ...overrides,
  };
}

function response(
  data: SportMetricsGolfComparisonData,
): SportMetricsGolfComparisonResponse {
  return {
    success: true,
    message: "Sport metric comparison fetched successfully",
    data,
  };
}

function renderState(state: GolfSportsMetricsComparisonContainerState): string {
  return renderToStaticMarkup(
    createElement(GolfSportsMetricsComparisonContainerContent, { state }),
  );
}

describe("GolfSportsMetricsComparisonContainer", () => {
  it("loads a successful API response and passes its parsed DTO through", async () => {
    const data = comparisonData();
    const states: GolfSportsMetricsComparisonContainerState[] = [];
    const fetchComparison = vi.fn().mockResolvedValue(response(data));

    await runGolfSportsMetricsComparisonLoad({
      fetchComparison,
      isCurrent: () => true,
      setState: (state) => states.push(state),
    });

    expect(fetchComparison).toHaveBeenCalledTimes(1);
    expect(states).toEqual([
      { phase: "loading" },
      { phase: "loaded", comparison: data },
    ]);
  });

  it("renders loading state", () => {
    const html = renderState({ phase: "loading" });

    expect(html).toContain("Loading Golf Sports Metrics comparison…");
  });

  it("renders an API error", async () => {
    const states: GolfSportsMetricsComparisonContainerState[] = [];

    await runGolfSportsMetricsComparisonLoad({
      fetchComparison: vi.fn().mockRejectedValue({
        message: "Training plan version not found",
        status: 404,
        code: "NOT_FOUND",
      }),
      isCurrent: () => true,
      setState: (state) => states.push(state),
    });

    expect(states.at(-1)).toEqual({
      phase: "error",
      message: "Training plan version not found",
    });
    expect(renderState(states.at(-1)!)).toContain(
      "Training plan version not found",
    );
  });

  it("keeps non-zero unclassifiable counts when categories are empty", async () => {
    const states: GolfSportsMetricsComparisonContainerState[] = [];
    const data = comparisonData({
      categories: [],
      taxonomyMismatches: [],
      unclassifiableCounts: { earlier: 2, later: 1 },
    });

    await runGolfSportsMetricsComparisonLoad({
      fetchComparison: vi.fn().mockResolvedValue(response(data)),
      isCurrent: () => true,
      setState: (state) => states.push(state),
    });

    expect(states.at(-1)).toEqual({ phase: "loaded", comparison: data });
    expect(renderState(states.at(-1)!)).toContain(
      '&quot;unclassifiableCounts&quot;:{&quot;earlier&quot;:2,&quot;later&quot;:1}',
    );
  });

  it("keeps taxonomy mismatches when categories are empty", async () => {
    const states: GolfSportsMetricsComparisonContainerState[] = [];
    const data = comparisonData({
      categories: [],
      taxonomyMismatches: [
        {
          skillCode: "GOLF_CHIP_001",
          earlierTaxonomyAreaKeys: ["short_game"],
          laterTaxonomyAreaKeys: ["chipping"],
        },
      ],
      unclassifiableCounts: { earlier: 0, later: 0 },
    });

    await runGolfSportsMetricsComparisonLoad({
      fetchComparison: vi.fn().mockResolvedValue(response(data)),
      isCurrent: () => true,
      setState: (state) => states.push(state),
    });

    expect(states.at(-1)).toEqual({ phase: "loaded", comparison: data });
    expect(renderState(states.at(-1)!)).toContain(
      '&quot;taxonomyMismatches&quot;:[{&quot;skillCode&quot;:&quot;GOLF_CHIP_001&quot;',
    );
  });

  it("keeps both top-level detail objects when categories are empty", async () => {
    const states: GolfSportsMetricsComparisonContainerState[] = [];
    const data = comparisonData({ categories: [] });

    await runGolfSportsMetricsComparisonLoad({
      fetchComparison: vi.fn().mockResolvedValue(response(data)),
      isCurrent: () => true,
      setState: (state) => states.push(state),
    });

    expect(states.at(-1)).toEqual({ phase: "loaded", comparison: data });
    const html = renderState(states.at(-1)!);
    expect(html).toContain('&quot;taxonomyMismatches&quot;:[');
    expect(html).toContain(
      '&quot;unclassifiableCounts&quot;:{&quot;earlier&quot;:2,&quot;later&quot;:1}',
    );
  });

  it("renders only the existing empty state for a completely empty comparison", async () => {
    const states: GolfSportsMetricsComparisonContainerState[] = [];

    await runGolfSportsMetricsComparisonLoad({
      fetchComparison: vi.fn().mockResolvedValue(
        response(
          comparisonData({
            categories: [],
            taxonomyMismatches: [],
            unclassifiableCounts: { earlier: 0, later: 0 },
          }),
        ),
      ),
      isCurrent: () => true,
      setState: (state) => states.push(state),
    });

    expect(states.at(-1)).toEqual({ phase: "empty" });
    const html = renderState(states.at(-1)!);
    expect(html).toContain(
      "No Golf Sports Metrics comparison categories returned.",
    );
    expect(html).not.toContain("data-comparison");
  });

  it("surfaces parser failures as errors", async () => {
    const states: GolfSportsMetricsComparisonContainerState[] = [];

    await runGolfSportsMetricsComparisonLoad({
      fetchComparison: vi
        .fn()
        .mockRejectedValue(
          new Error("SPORT Metrics Golf comparison response is invalid."),
        ),
      isCurrent: () => true,
      setState: (state) => states.push(state),
    });

    expect(states.at(-1)).toEqual({
      phase: "error",
      message: "SPORT Metrics Golf comparison response is invalid.",
    });
  });

  it("passes null metrics, taxonomy mismatches, and unclassifiable counts unchanged", () => {
    const data = comparisonData();
    const html = renderState({ phase: "loaded", comparison: data });

    expect(html).toContain('data-comparison="rendered"');
    expect(html).toContain(
      '&quot;earlier&quot;:{&quot;attempts&quot;:0,&quot;successes&quot;:null',
    );
    expect(html).toContain('&quot;taxonomyMismatch&quot;:true');
    expect(html).toContain('&quot;skillCode&quot;:&quot;GOLF_CHIP_001&quot;');
    expect(html).toContain(
      '&quot;unclassifiableCounts&quot;:{&quot;earlier&quot;:2,&quot;later&quot;:1}',
    );
  });
});
