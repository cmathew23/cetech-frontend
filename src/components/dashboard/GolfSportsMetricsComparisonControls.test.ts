import {
  fetchGolfSkillsPlanVersionOptions,
  GolfSportsMetricsComparisonControlsContent,
  isValidGolfPlanVersionPair,
} from "@/components/dashboard/GolfSportsMetricsComparisonControls";
import type { CoachTrainingPlanDomainHistoryRow } from "@/lib/api/coachAthletePlanningReadiness";
import { readFileSync } from "node:fs";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchDomainHistoryMock } = vi.hoisted(() => ({
  fetchDomainHistoryMock: vi.fn(),
}));

vi.mock("@/lib/api/coachAthletePlanningReadiness", () => ({
  fetchCoachTrainingPlanDomainHistory: fetchDomainHistoryMock,
}));

vi.mock(
  "@/components/dashboard/GolfSportsMetricsComparisonContainer",
  async () => {
    const { createElement } = await import("react");
    return {
      GolfSportsMetricsComparisonContainer: (props: Record<string, string>) =>
        createElement(
          "div",
          { "data-comparison-container": "mounted" },
          JSON.stringify(props),
        ),
    };
  },
);

vi.mock("@/components/ui/Card", async () => {
  const { createElement } = await import("react");
  return {
    Card: ({
      title,
      subtitle,
      children,
    }: {
      title?: string;
      subtitle?: string;
      children: ReactNode;
    }) =>
      createElement(
        "section",
        null,
        title ? createElement("h2", null, title) : null,
        subtitle ? createElement("p", null, subtitle) : null,
        children,
      ),
  };
});

vi.mock("@/components/ui/FormField", async () => {
  const { createElement } = await import("react");
  return {
    FormField: ({
      id,
      label,
      children,
    }: {
      id: string;
      label: string;
      children: ReactNode;
    }) =>
      createElement(
        "div",
        null,
        createElement("label", { htmlFor: id }, label),
        children,
      ),
  };
});

vi.mock("@/components/ui/Select", async () => {
  const { createElement } = await import("react");
  return {
    Select: (props: Record<string, unknown>) => createElement("select", props),
  };
});

vi.mock("@/components/ui/Alert", async () => {
  const { createElement } = await import("react");
  return {
    Alert: ({ children }: { children: ReactNode }) =>
      createElement("div", { role: "alert" }, children),
  };
});

function version(
  versionId: string | null,
  weekStartDate: string | null,
  weekEndDate: string | null,
  versionNumber: number,
): CoachTrainingPlanDomainHistoryRow {
  return {
    planId: `plan-${versionNumber}`,
    domainPlanId: `domain-plan-${versionNumber}`,
    versionId,
    versionNumber,
    domain: "SKILLS",
    weekStartDate,
    weekEndDate,
    status: "RELEASED",
    releasedAt: null,
    releasedBy: null,
    viewOnly: true,
    raw: {},
  };
}

function renderControls({
  versions,
  earlier = "",
  later = "",
  loading = false,
  error = null,
}: {
  versions: CoachTrainingPlanDomainHistoryRow[];
  earlier?: string;
  later?: string;
  loading?: boolean;
  error?: string | null;
}): string {
  return renderToStaticMarkup(
    createElement(GolfSportsMetricsComparisonControlsContent, {
      entityId: "entity-1",
      athleteId: "athlete-1",
      versions,
      loading,
      error,
      earlierTrainingPlanVersionId: earlier,
      laterTrainingPlanVersionId: later,
      onEarlierChange: vi.fn(),
      onLaterChange: vi.fn(),
    }),
  );
}

describe("GolfSportsMetricsComparisonControls", () => {
  beforeEach(() => {
    fetchDomainHistoryMock.mockReset();
  });

  it("uses the existing Skills domain-history API", async () => {
    const rows = [
      version("version-1", "2026-05-25", "2026-05-31", 1),
      version("version-2", "2026-06-01", "2026-06-07", 2),
    ];
    fetchDomainHistoryMock.mockResolvedValue(rows);

    await expect(
      fetchGolfSkillsPlanVersionOptions("entity-1", "athlete-1"),
    ).resolves.toBe(rows);
    expect(fetchDomainHistoryMock).toHaveBeenCalledWith(
      "entity-1",
      "athlete-1",
      "SKILLS",
    );
  });

  it("accepts only distinct chronological non-overlapping pairs when dates exist", () => {
    const earlier = version(
      "version-1",
      "2026-05-25",
      "2026-05-31",
      1,
    );
    const later = version("version-2", "2026-06-01", "2026-06-07", 2);
    const overlap = version(
      "version-3",
      "2026-05-31",
      "2026-06-06",
      3,
    );

    expect(isValidGolfPlanVersionPair(earlier, later)).toBe(true);
    expect(isValidGolfPlanVersionPair(later, earlier)).toBe(false);
    expect(isValidGolfPlanVersionPair(earlier, overlap)).toBe(false);
    expect(isValidGolfPlanVersionPair(earlier, earlier)).toBe(false);
  });

  it("preserves API order and mounts one container for a valid pair", () => {
    const rows = [
      version("version-2", "2026-06-01", "2026-06-07", 2),
      version("version-1", "2026-05-25", "2026-05-31", 1),
    ];
    const html = renderControls({
      versions: rows,
      earlier: "version-1",
      later: "version-2",
    });

    expect(html.indexOf("01/06/2026 – 07/06/2026")).toBeLessThan(
      html.indexOf("25/05/2026 – 31/05/2026"),
    );
    expect(html).toContain('data-comparison-container="mounted"');
    expect(html).toContain('&quot;entityId&quot;:&quot;entity-1&quot;');
    expect(html).toContain('&quot;athleteId&quot;:&quot;athlete-1&quot;');
    expect(html).toContain(
      '&quot;earlierTrainingPlanVersionId&quot;:&quot;version-1&quot;',
    );
    expect(html).toContain(
      '&quot;laterTrainingPlanVersionId&quot;:&quot;version-2&quot;',
    );
    expect(html.match(/data-comparison-container/g)).toHaveLength(1);
  });

  it("does not mount the comparison for an invalid pair", () => {
    const html = renderControls({
      versions: [
        version("version-1", "2026-05-25", "2026-05-31", 1),
        version("version-2", "2026-05-31", "2026-06-06", 2),
      ],
      earlier: "version-1",
      later: "version-2",
    });

    expect(html).not.toContain("data-comparison-container");
  });

  it("renders version loading, error, and insufficient-history states", () => {
    expect(renderControls({ versions: [], loading: true })).toContain(
      "Loading Skills plan versions…",
    );
    expect(
      renderControls({ versions: [], error: "History unavailable" }),
    ).toContain("History unavailable");
    expect(
      renderControls({
        versions: [
          version("version-1", "2026-05-25", "2026-05-31", 1),
        ],
      }),
    ).toContain(
      "At least two Skills plan versions are required for comparison.",
    );
  });

  it("mounts comparison controls once inside the existing Sport Metrics section", () => {
    const source = readFileSync(
      new URL("./SportMetricsSection.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain(
      'import { GolfSportsMetricsComparisonControls } from "@/components/dashboard/GolfSportsMetricsComparisonControls"',
    );
    expect(source.match(/<GolfSportsMetricsComparisonControls/g)).toHaveLength(
      1,
    );
    expect(source).toContain("<SportMetricsWeeklySummary");
    expect(source).toContain("hideWeeklyEvidenceCard");
  });
});
