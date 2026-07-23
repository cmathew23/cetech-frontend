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
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import("@/components/dashboard/athlete/AthleteWeeklyAdherenceContext")
    >();
    return {
      ...actual,
      useAthleteWeeklyAdherence: () => contextState.current,
    };
  },
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
      {
        id: "snapshot-c",
        weekStart: "2026-07-20",
        weekEnd: "2026-07-26",
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

function optionValues(select: ReactElement | null): string[] {
  const values: string[] = [];
  const visit = (node: ReactNode) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!isValidElement(node)) return;
    const props = node.props as { value?: string; children?: ReactNode };
    if (node.type === "option" && props.value) values.push(props.value);
    visit(props.children);
  };
  visit((select?.props as { children?: ReactNode } | undefined)?.children);
  return values;
}

describe("AthleteWeeklyAdherenceSection snapshot selectors", () => {
  beforeEach(() => {
    contextState.current = state();
  });

  it("uses user-facing labels and formatted week ranges", () => {
    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup).toContain("Earlier week");
    expect(markup).toContain("Later week");
    expect(markup).not.toContain(">Snapshot A<");
    expect(markup).not.toContain(">Snapshot B<");
    expect(markup).toContain('value="snapshot-a"');
    expect(markup).toContain('value="snapshot-b"');
    expect(markup).toContain("06/07/2026 – 12/07/2026");
    expect(markup).not.toContain(">snapshot-a<");
    expect(markup).toContain("grid gap-4 sm:grid-cols-2");
    expect(markup).not.toContain("Comparison summary");
    expect(markup).not.toContain("Delta");
  });

  it("starts with both week selections empty", () => {
    const tree = AthleteWeeklyAdherenceSection();
    const earlier = findSelect(tree, "weekly-adherence-snapshot-a");
    const later = findSelect(tree, "weekly-adherence-snapshot-b");

    expect((earlier?.props as { value?: string }).value).toBe("");
    expect((later?.props as { value?: string }).value).toBe("");
    expect(renderToStaticMarkup(tree)).toContain("Select an earlier week");
    expect(renderToStaticMarkup(tree)).toContain("Select a later week");
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

  it("filters Later week options to weeks after Earlier week", () => {
    contextState.current = {
      ...state(),
      selectedSnapshotAId: "snapshot-b",
    };

    const later = findSelect(
      AthleteWeeklyAdherenceSection(),
      "weekly-adherence-snapshot-b",
    );

    expect(optionValues(later)).toEqual(["snapshot-c"]);
  });

  it("filters Earlier week options to weeks before Later week", () => {
    contextState.current = {
      ...state(),
      selectedSnapshotBId: "snapshot-b",
    };

    const earlier = findSelect(
      AthleteWeeklyAdherenceSection(),
      "weekly-adherence-snapshot-a",
    );

    expect(optionValues(earlier)).toEqual(["snapshot-a"]);
  });

  it("shows snapshot loading and empty-history states distinctly", () => {
    contextState.current = {
      ...state(),
      snapshotsLoading: true,
    };
    const loadingMarkup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );
    contextState.current = {
      ...state(),
      availableSnapshots: [state().availableSnapshots[0]!],
    };
    const emptyMarkup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(loadingMarkup).toContain("Loading historical weeks…");
    expect(loadingMarkup).toContain('disabled=""');
    expect(emptyMarkup).toContain("No historical weeks available.");
    expect(emptyMarkup).not.toContain("Snapshot loading failed");
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

    expect(failedMarkup).toContain(
      "Snapshot loading failed: Could not load snapshot history.",
    );
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

    expect(markup).toContain("Earlier week");
    expect(markup).toContain("Later week");
    expect(markup).toContain("Current summary failed.");
  });

  it("shows comparison loading and error feedback without rendering data", () => {
    contextState.current = {
      ...state(),
      comparisonLoading: true,
      comparisonError: "Comparison request failed.",
      comparisonData: {
        athleteId: "comparison-result-must-not-render",
      } as AthleteWeeklyAdherenceState["comparisonData"],
    };

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup).toContain("Loading comparison…");
    expect(markup).toContain("Comparison request failed.");
    expect(markup).not.toContain("comparison-result-must-not-render");
    expect(markup).not.toContain("Comparison summary");
  });
});
