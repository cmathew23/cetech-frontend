import { AthleteWeeklyAdherenceSection } from "@/components/dashboard/athlete/AthleteWeeklyAdherenceSection";
import { Select } from "@/components/ui/Select";
import type { AthleteWeeklyAdherenceState } from "@/components/dashboard/athlete/AthleteWeeklyAdherenceContext";
import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const contextState = vi.hoisted(() => ({
  current: null as AthleteWeeklyAdherenceState | null,
}));

vi.mock(
  "@/components/dashboard/athlete/AthleteWeeklyAdherenceContext",
  () => ({
    useAthleteWeeklyAdherence: () => contextState.current,
  }),
);

vi.mock("@/components/ui/Select", async () => {
  const { createElement } = await import("react");
  return {
    Select: (props: Record<string, unknown>) => createElement("select", props),
  };
});

vi.mock("@/components/ui/Card", async () => {
  const { createElement } = await import("react");
  return {
    Card: ({ children }: { children: ReactNode }) =>
      createElement("section", null, children),
  };
});

vi.mock("@/components/ui/Alert", async () => {
  const { createElement } = await import("react");
  return {
    Alert: ({ children }: { children: ReactNode }) =>
      createElement("div", { role: "alert" }, children),
  };
});

vi.mock("@/components/ui/Button", async () => {
  const { createElement } = await import("react");
  return {
    Button: ({ children }: { children: ReactNode }) =>
      createElement("button", null, children),
  };
});

function state(): AthleteWeeklyAdherenceState {
  return {
    phase: "loaded",
    nutritionKpi: { status: "empty" },
    summary: {
      athleteId: "athlete-1",
      weekStart: "2026-07-13",
      weekEnd: "2026-07-19",
      domains: {},
      overall: null,
      visibleDomains: [],
    },
    error: null,
    weekStart: "2026-07-13",
    weekEnd: "2026-07-19",
    trainingPlanVersionId: "version-1",
    reload: vi.fn(),
    comparisonData: null,
    comparisonLoading: false,
    comparisonError: null,
    selectedSnapshotAId: "",
    selectedSnapshotBId: "",
    availableSnapshots: [
      {
        id: "snapshot-a",
        weekStart: "2026-07-06",
        weekEnd: "2026-07-12",
      },
      {
        id: "snapshot-b",
        weekStart: "2026-07-13",
        weekEnd: "2026-07-19",
      },
    ],
    snapshotsLoading: false,
    snapshotsError: null,
    setSelectedSnapshotAId: vi.fn(),
    setSelectedSnapshotBId: vi.fn(),
  };
}

function findSelect(node: ReactNode, id: string): ReactElement | null {
  if (!isValidElement(node)) return null;
  const props = node.props as Record<string, unknown>;
  if (node.type === Select && props.id === id) return node;
  const children = (node.props as { children?: ReactNode }).children;
  if (Array.isArray(children)) {
    for (const child of children) {
      const match = findSelect(child, id);
      if (match) return match;
    }
    return null;
  }
  return findSelect(children, id);
}

describe("AthleteWeeklyAdherenceSection snapshot selectors", () => {
  beforeEach(() => {
    contextState.current = state();
  });

  it("populates only Snapshot A and Snapshot B selectors", () => {
    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup).toContain("Snapshot A");
    expect(markup).toContain("Snapshot B");
    expect(markup).toContain('value="snapshot-a"');
    expect(markup).toContain('value="snapshot-b"');
    expect(markup).toContain("06/07/2026 – 12/07/2026");
    expect(markup).not.toContain("Comparison summary");
    expect(markup).not.toContain("Delta");
  });

  it("wires each selector to its comparison state setter", () => {
    const tree = AthleteWeeklyAdherenceSection();
    const snapshotA = findSelect(tree, "weekly-adherence-snapshot-a");
    const snapshotB = findSelect(tree, "weekly-adherence-snapshot-b");
    const snapshotAProps = snapshotA?.props as {
      onChange: (event: { target: { value: string } }) => void;
    };
    const snapshotBProps = snapshotB?.props as {
      onChange: (event: { target: { value: string } }) => void;
    };

    snapshotAProps.onChange({
      target: { value: "snapshot-a" },
    });
    snapshotBProps.onChange({
      target: { value: "snapshot-b" },
    });

    expect(contextState.current?.setSelectedSnapshotAId).toHaveBeenCalledWith(
      "snapshot-a",
    );
    expect(contextState.current?.setSelectedSnapshotBId).toHaveBeenCalledWith(
      "snapshot-b",
    );
  });

  it("disables the matching option and uses the existing field error pattern", () => {
    contextState.current = {
      ...state(),
      selectedSnapshotAId: "snapshot-a",
      selectedSnapshotBId: "snapshot-a",
    };

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup).toContain("Snapshot B must be different from Snapshot A.");
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('value="snapshot-a" disabled=""');
  });

  it("distinguishes snapshot loading failure from empty history", () => {
    contextState.current = {
      ...state(),
      availableSnapshots: [],
      snapshotsError: "Could not load snapshot history.",
    };

    const failedMarkup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );
    contextState.current = {
      ...state(),
      availableSnapshots: [],
    };
    const emptyMarkup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(failedMarkup).toContain("Could not load snapshot history.");
    expect(emptyMarkup).not.toContain("Could not load snapshot history.");
  });

  it("keeps selectors available when the current summary fails", () => {
    contextState.current = {
      ...state(),
      phase: "error",
      summary: null,
      error: "Current summary failed.",
    };

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup).toContain("Snapshot A");
    expect(markup).toContain("Snapshot B");
    expect(markup).toContain("Current summary failed.");
  });
});
