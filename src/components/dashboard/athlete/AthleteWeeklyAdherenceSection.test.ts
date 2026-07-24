import {
  AthleteWeeklyAdherenceSection,
  reconcileWeeklyComparisonControlSelection,
  weeklyComparisonCategoryOptions,
} from "@/components/dashboard/athlete/AthleteWeeklyAdherenceSection";
import type { AthleteWeeklyAdherenceState } from "@/components/dashboard/athlete/AthleteWeeklyAdherenceContext";
import {
  parseWeeklyAdherenceComparisonPayload,
  type WeeklyAdherenceComparisonData,
} from "@/lib/api/weeklyAdherence";
import { createElement, type ReactNode } from "react";
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

vi.mock("@/components/ui/Badge", async () => {
  const { createElement } = await import("react");
  return {
    Badge: ({ children }: { children: ReactNode }) =>
      createElement("span", null, children),
  };
});

vi.mock("@/components/dashboard/WeeklyAdherenceCards", async () => {
  const { createElement } = await import("react");
  return {
    buildWeeklyAdherenceMetricTiles: () => [{}],
    WeeklyAdherenceCards: () =>
      createElement("div", null, "Current weekly adherence cards"),
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

function comparisonData({
  status = "COMPARABLE",
  delta = 11.75,
}: {
  status?: "COMPARABLE" | "NOT_COMPARABLE";
  delta?: number | null;
} = {}): WeeklyAdherenceComparisonData {
  const weeklySummary = (weekStart: string, weekEnd: string, percent: number) => ({
    athleteId: "athlete-1",
    weekStart,
    weekEnd,
    domains: {},
    overall: {
      plannedSessions: 4,
      loggedSessions: 4,
      adherencePercent: percent,
      plannedItems: 10,
      completedItems: 8,
    },
    visibleDomains: [],
  });
  return {
    athleteId: "athlete-1",
    visibleDomains: [],
    snapshotA: {
      planningContextSnapshotId: "snapshot-secret-a",
      planStartDate: "2026-07-06",
      planEndDate: "2026-07-12",
      weeklyAdherenceSummary: weeklySummary(
        "2026-07-06",
        "2026-07-12",
        60.5,
      ),
      domainBreakdowns: {},
    },
    snapshotB: {
      planningContextSnapshotId: "snapshot-secret-b",
      planStartDate: "2026-07-13",
      planEndDate: "2026-07-19",
      weeklyAdherenceSummary: weeklySummary(
        "2026-07-13",
        "2026-07-19",
        72.25,
      ),
      domainBreakdowns: {},
    },
    domains: {},
    overall: {
      comparisonStatus: status,
      delta:
        delta === null
          ? null
          : {
              adherencePercent: delta,
              completedItems: 0,
              plannedItems: 0,
              partialItems: 0,
              missedItems: 0,
            },
    },
  };
}

function addDomainComparison(
  data: WeeklyAdherenceComparisonData,
  domain: "SKILL" | "NUTRITION" | "STRENGTH_CONDITIONING",
  {
    earlier,
    later,
    delta,
    status = "COMPARABLE",
  }: {
    earlier: number;
    later: number;
    delta: number | null;
    status?: "COMPARABLE" | "NOT_COMPARABLE";
  },
) {
  const weekly = (adherencePercent: number, laterWeek: boolean) => ({
    plannedSessions: 4,
    loggedSessions: 4,
    totalPrescribedItems: 8,
    loggedItems: 8,
    completedItems: 6,
    partialItems: 1,
    skippedItems: 1,
    unloggedItems: 0,
    completionCredit: 6.5,
    adherencePercent,
    context: {},
    plannedMinutes: laterWeek ? 135 : 120,
    actualMinutes: laterWeek ? 130 : 100,
    fullItems: laterWeek ? 6 : 5,
    halfItems: laterWeek ? 1 : 2,
    missedItems: 1,
    plannedCalories: laterWeek ? 15_000 : 14_000,
    actualCalories: laterWeek ? 14_500 : 13_000,
  });
  data.snapshotA.domainBreakdowns[domain] = {
    availability: "COMPLETE",
    weekly: weekly(earlier, false),
    daily: [],
  };
  data.snapshotB.domainBreakdowns[domain] = {
    availability: "COMPLETE",
    weekly: weekly(later, true),
    daily: [],
  };
  data.domains[domain] = {
    comparisonStatus: status,
    delta:
      delta === null
        ? null
        : {
            adherencePercent: delta,
            plannedSessions: 0,
            loggedSessions: 0,
            completedItems: 0,
            partialItems: 0,
            skippedItems: 0,
            unloggedItems: 0,
            completionCredit: domain === "NUTRITION" ? 16 : 0,
            ...(domain === "NUTRITION"
              ? {
                  fullItems: 2,
                  halfItems: 0,
                  missedItems: -1,
                  plannedCalories: 350,
                  actualCalories: -125,
                }
              : {
                  totalPrescribedItems: 8,
                  plannedMinutes: 58,
                  actualMinutes: -20,
                }),
            actualDurationMinutes: 0,
          },
    daily: [],
  };
}

function addDailyComparisons(
  data: WeeklyAdherenceComparisonData,
  domain: "SKILL" | "NUTRITION" | "STRENGTH_CONDITIONING",
) {
  const summary = (dayIndex: number, week: "A" | "B") => ({
    date: `2026-07-${String(dayIndex + (week === "A" ? 5 : 12)).padStart(2, "0")}`,
    plannedSessions: dayIndex,
    loggedSessions: dayIndex + 10,
    totalPrescribedItems: dayIndex + 20,
    loggedItems: dayIndex + 30,
    completedItems: dayIndex + 40,
    partialItems: dayIndex + 50,
    skippedItems: dayIndex + 60,
    unloggedItems: dayIndex + 70,
    completionCredit: dayIndex + 80,
    adherencePercent: dayIndex + (week === "A" ? 0.1 : 0.2),
    sessions:
      domain === "NUTRITION"
        ? ([{ nutritionDetail: "must-not-render" }] as never[])
        : [],
  });
  data.domains[domain]!.daily = Array.from({ length: 7 }, (_, offset) => {
    const dayIndex = offset + 1;
    return {
      dayIndex,
      date: `2026-07-${String(dayIndex + 5).padStart(2, "0")}`,
      snapshotA: summary(dayIndex, "A"),
      snapshotB: dayIndex === 1 ? null : summary(dayIndex, "B"),
      comparisonStatus:
        dayIndex === 1 ? ("NOT_COMPARABLE" as const) : ("COMPARABLE" as const),
      delta:
        dayIndex === 1
          ? null
          : {
              plannedSessions: -1,
              loggedSessions: 2,
              totalPrescribedItems: 3,
              completedItems: 4,
              partialItems: -5,
              skippedItems: 6,
              unloggedItems: -7,
              completionCredit: 8.5,
              adherencePercent: dayIndex === 2 ? -12.5 : 9.5,
            },
    };
  });
}

function renderedSelect(markup: string, id: string): string {
  return (
    markup.match(
      new RegExp(`<select id="${id}"[^>]*>([\\s\\S]*?)</select>`),
    )?.[1] ?? ""
  );
}

function renderedOptionValues(selectMarkup: string): string[] {
  return Array.from(selectMarkup.matchAll(/<option value="([^"]+)"/g), (match) =>
    match[1]!,
  );
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
    expect(markup).toContain("xl:grid-cols-4");
    expect(markup).not.toContain("lg:grid-cols-4");
    expect(markup).toContain(
      '<label for="weekly-adherence-snapshot-a"',
    );
    expect(markup).toContain(
      '<label for="weekly-adherence-snapshot-b"',
    );
    expect(markup).toContain('<label for="weekly-adherence-category"');
    expect(markup).toContain('<label for="weekly-adherence-parameter"');
    expect(markup).not.toContain("Comparison summary");
    expect(markup).not.toContain("Delta");
  });

  it("starts with both week selections empty", () => {
    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );
    const earlier = renderedSelect(markup, "weekly-adherence-snapshot-a");
    const later = renderedSelect(markup, "weekly-adherence-snapshot-b");

    expect(earlier).toContain('<option value="" selected="">');
    expect(later).toContain('<option value="" selected="">');
    expect(markup).toContain("Select an earlier week");
    expect(markup).toContain("Select a later week");
  });

  it("renders each selector from its comparison state", () => {
    contextState.current = {
      ...state(),
      selectedSnapshotAId: "snapshot-a",
      selectedSnapshotBId: "snapshot-b",
    };

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );
    const earlier = renderedSelect(markup, "weekly-adherence-snapshot-a");
    const later = renderedSelect(markup, "weekly-adherence-snapshot-b");

    expect(earlier).toContain('<option value="snapshot-a" selected="">');
    expect(later).toContain('<option value="snapshot-b" selected="">');
  });

  it("filters Later week options to weeks after Earlier week", () => {
    contextState.current = {
      ...state(),
      selectedSnapshotAId: "snapshot-b",
    };

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );
    const later = renderedSelect(markup, "weekly-adherence-snapshot-b");

    expect(renderedOptionValues(later)).toEqual(["snapshot-c"]);
  });

  it("filters Earlier week options to weeks before Later week", () => {
    contextState.current = {
      ...state(),
      selectedSnapshotBId: "snapshot-b",
    };

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );
    const earlier = renderedSelect(markup, "weekly-adherence-snapshot-a");

    expect(renderedOptionValues(earlier)).toEqual(["snapshot-a"]);
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

describe("AthleteWeeklyAdherenceSection comparison controls", () => {
  beforeEach(() => {
    contextState.current = {
      ...state(),
      selectedSnapshotAId: "snapshot-a",
      selectedSnapshotBId: "snapshot-b",
      comparisonData: comparisonData(),
    };
  });

  it("renders Category and Parameter with Overall adherence defaults", () => {
    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );
    const category = renderedSelect(markup, "weekly-adherence-category");
    const parameter = renderedSelect(markup, "weekly-adherence-parameter");

    expect(markup.indexOf("Earlier week")).toBeLessThan(
      markup.indexOf("Later week"),
    );
    expect(markup.indexOf("Later week")).toBeLessThan(
      markup.indexOf("Category"),
    );
    expect(markup.indexOf("Category")).toBeLessThan(markup.indexOf("Parameter"));
    expect(category).toContain('<option value="OVERALL" selected="">Overall');
    expect(parameter).toContain(
      '<option value="OVERALL_ADHERENCE" selected="">Overall adherence',
    );
  });

  it("shows only domains authorized by the comparison response", () => {
    const data = comparisonData();
    addDomainComparison(data, "SKILL", {
      earlier: 50,
      later: 60,
      delta: 10,
    });
    addDomainComparison(data, "NUTRITION", {
      earlier: 70,
      later: 72,
      delta: 2,
    });
    addDomainComparison(data, "STRENGTH_CONDITIONING", {
      earlier: 80,
      later: 75,
      delta: -5,
    });
    Object.assign(data.domains, {
      HIDDEN_DOMAIN: {
        comparisonStatus: "COMPARABLE",
        delta: null,
      },
    });
    contextState.current = {
      ...contextState.current!,
      comparisonData: data,
    };

    expect(data.visibleDomains).toEqual([]);
    expect(weeklyComparisonCategoryOptions(data)).toEqual([
      "OVERALL",
      "SKILL",
      "NUTRITION",
      "STRENGTH_CONDITIONING",
    ]);

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );
    const category = renderedSelect(markup, "weekly-adherence-category");
    expect(category).toContain(">Skills<");
    expect(category).toContain(">Nutrition<");
    expect(category).toContain(">S&amp;C<");
    expect(category).not.toContain("HIDDEN_DOMAIN");
  });

  it("updates Category from the exact parsed loaded response shape", () => {
    const fixture = comparisonData();
    fixture.visibleDomains = [];
    addDomainComparison(fixture, "SKILL", {
      earlier: 50,
      later: 50,
      delta: null,
      status: "NOT_COMPARABLE",
    });
    addDomainComparison(fixture, "NUTRITION", {
      earlier: 50,
      later: 50,
      delta: null,
      status: "NOT_COMPARABLE",
    });
    addDomainComparison(fixture, "STRENGTH_CONDITIONING", {
      earlier: 50,
      later: 50,
      delta: null,
      status: "NOT_COMPARABLE",
    });
    const parsed = parseWeeklyAdherenceComparisonPayload({
      message: "Weekly adherence comparison fetched successfully",
      data: fixture,
    });
    contextState.current = {
      ...contextState.current!,
      comparisonData: parsed.data,
    };

    expect(Object.keys(parsed.data.domains)).toEqual([
      "SKILL",
      "NUTRITION",
      "STRENGTH_CONDITIONING",
    ]);
    expect(weeklyComparisonCategoryOptions(parsed.data)).toEqual([
      "OVERALL",
      "SKILL",
      "NUTRITION",
      "STRENGTH_CONDITIONING",
    ]);

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );
    expect(
      renderedSelect(markup, "weekly-adherence-category"),
    ).toContain(">Skills<");
    expect(
      renderedSelect(markup, "weekly-adherence-category"),
    ).toContain(">Nutrition<");
    expect(
      renderedSelect(markup, "weekly-adherence-category"),
    ).toContain(">S&amp;C<");
  });

  it("shows Overall only before comparison data loads", () => {
    contextState.current = {
      ...state(),
      comparisonData: null,
    };

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );
    expect(
      renderedOptionValues(
        renderedSelect(markup, "weekly-adherence-category"),
      ),
    ).toEqual(["OVERALL"]);
  });

  it("omits domain categories when their parsed result is absent", () => {
    const data = comparisonData();

    expect(weeklyComparisonCategoryOptions(data)).toEqual(["OVERALL"]);
    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );
    const category = renderedSelect(markup, "weekly-adherence-category");
    expect(category).not.toContain(">Skills<");
    expect(category).not.toContain(">Nutrition<");
    expect(category).not.toContain(">S&amp;C<");
  });

  it.each([
    ["SKILL", "SKILLS_ADHERENCE", "Skills adherence", "Skills"],
    [
      "NUTRITION",
      "NUTRITION_ADHERENCE",
      "Nutrition adherence",
      "Nutrition",
    ],
    [
      "STRENGTH_CONDITIONING",
      "S_AND_C_ADHERENCE",
      "S&amp;C adherence",
      "S&amp;C",
    ],
  ] as const)(
    "auto-selects and hides a single backend-returned %s category",
    (domain, parameter, parameterLabel, categoryLabel) => {
      const data = comparisonData();
      data.overall = null;
      addDomainComparison(data, domain, {
        earlier: 60,
        later: 70,
        delta: 10,
      });
      contextState.current = {
        ...contextState.current!,
        comparisonData: data,
      };

      const markup = renderToStaticMarkup(
        createElement(AthleteWeeklyAdherenceSection),
      );

      expect(markup).not.toContain('id="weekly-adherence-category"');
      expect(
        renderedSelect(markup, "weekly-adherence-parameter"),
      ).toContain(
        `<option value="${parameter}" selected="">${parameterLabel}`,
      );
      expect(markup).toContain(`${categoryLabel} — ${parameterLabel}`);
    },
  );

  it("resets unavailable categories and stale parameters safely", () => {
    expect(
      reconcileWeeklyComparisonControlSelection(
        ["NUTRITION"],
        "SKILL",
        "SKILLS_ADHERENCE",
      ),
    ).toEqual(["NUTRITION", "NUTRITION_ADHERENCE"]);
    expect(
      reconcileWeeklyComparisonControlSelection(
        ["OVERALL", "SKILL"],
        "SKILL",
        "OVERALL_ADHERENCE",
      ),
    ).toEqual(["SKILL", "SKILLS_ADHERENCE"]);
  });

  it("keeps category and parameter controls local to the loaded result", () => {
    renderToStaticMarkup(createElement(AthleteWeeklyAdherenceSection));

    expect(contextState.current?.setSelectedSnapshotAId).not.toHaveBeenCalled();
    expect(contextState.current?.setSelectedSnapshotBId).not.toHaveBeenCalled();
  });

  it.each([
    [
      "SKILL",
      "Skills — Skills adherence",
      "SKILLS_ADHERENCE",
      "Skills adherence",
      51,
      63,
      12,
    ],
    [
      "NUTRITION",
      "Nutrition — Nutrition adherence",
      "NUTRITION_ADHERENCE",
      "Nutrition adherence",
      64,
      70,
      6,
    ],
    [
      "STRENGTH_CONDITIONING",
      "S&amp;C — S&amp;C adherence",
      "S_AND_C_ADHERENCE",
      "S&amp;C adherence",
      75,
      72,
      -3,
    ],
  ] as const)(
    "renders the selected %s backend adherence result",
    (
      domain,
      heading,
      parameterValue,
      parameterLabel,
      earlier,
      later,
      delta,
    ) => {
      const data = comparisonData();
      data.overall = null;
      addDomainComparison(data, domain, { earlier, later, delta });
      contextState.current = {
        ...contextState.current!,
        comparisonData: data,
      };

      const markup = renderToStaticMarkup(
        createElement(AthleteWeeklyAdherenceSection),
      );

      expect(markup).toContain(heading);
      expect(
        renderedSelect(markup, "weekly-adherence-parameter"),
      ).toContain(
        `<option value="${parameterValue}" selected="">${parameterLabel}`,
      );
      expect(markup).toContain(`${earlier}%`);
      expect(markup).toContain(`${later}%`);
      expect(markup).toContain(`${delta > 0 ? "+" : ""}${delta}%`);
    },
  );

  it("renders Not available instead of null values", () => {
    const data = comparisonData({ delta: null });
    data.snapshotA.weeklyAdherenceSummary.overall = null;
    data.snapshotB.weeklyAdherenceSummary.overall = null;
    contextState.current = {
      ...contextState.current!,
      comparisonData: data,
    };

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup.match(/Not available/g)).toHaveLength(3);
    expect(markup).not.toContain(">null<");
    expect(markup).not.toContain(">undefined<");
  });
});

describe("AthleteWeeklyAdherenceSection overall comparison", () => {
  beforeEach(() => {
    contextState.current = {
      ...state(),
      selectedSnapshotAId: "snapshot-a",
      selectedSnapshotBId: "snapshot-b",
      comparisonData: comparisonData(),
    };
  });

  it("does not render before both weeks are selected", () => {
    contextState.current = {
      ...contextState.current!,
      selectedSnapshotAId: "",
    };

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );
    contextState.current = {
      ...contextState.current!,
      selectedSnapshotAId: "snapshot-b",
      selectedSnapshotBId: "snapshot-b",
    };
    const invalidMarkup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup).not.toContain("Weekly Comparison");
    expect(invalidMarkup).not.toContain("Weekly Comparison");
  });

  it("does not render while loading or when comparison has an error", () => {
    contextState.current = {
      ...contextState.current!,
      comparisonLoading: true,
    };
    const loadingMarkup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );
    contextState.current = {
      ...contextState.current!,
      comparisonLoading: false,
      comparisonError: "Comparison failed.",
    };
    const errorMarkup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(loadingMarkup).not.toContain("Weekly Comparison");
    expect(errorMarkup).not.toContain("Weekly Comparison");
  });

  it("renders comparable week ranges, adherence values, and positive delta", () => {
    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup).toContain("Weekly Comparison");
    expect(markup).toContain("06/07/2026 – 12/07/2026");
    expect(markup).toContain("13/07/2026 – 19/07/2026");
    expect(markup).toContain("60.5%");
    expect(markup).toContain("72.3%");
    expect(markup).toContain("Improved");
    expect(markup).toContain("+11.8%");
  });

  it("renders Declined for a negative backend delta", () => {
    contextState.current = {
      ...contextState.current!,
      comparisonData: comparisonData({ delta: -4.5 }),
    };

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup).toContain("Declined");
    expect(markup).toContain("-4.5%");
  });

  it("renders No change for a zero backend delta", () => {
    contextState.current = {
      ...contextState.current!,
      comparisonData: comparisonData({ delta: 0 }),
    };

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup).toContain("No change");
    expect(markup).toContain("0%");
  });

  it("renders a neutral unavailable state for a null delta", () => {
    contextState.current = {
      ...contextState.current!,
      comparisonData: comparisonData({ delta: null }),
    };

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup).toContain("Comparison unavailable");
    expect(markup).not.toContain("Improved");
    expect(markup).not.toContain("Declined");
  });

  it("renders a neutral message for NOT_COMPARABLE", () => {
    contextState.current = {
      ...contextState.current!,
      comparisonData: comparisonData({
        status: "NOT_COMPARABLE",
        delta: null,
      }),
    };

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup).toContain("Comparison unavailable");
    expect(markup).not.toContain("NOT_COMPARABLE");
    expect(markup).not.toContain("Improved");
    expect(markup).not.toContain("Declined");
  });

  it("renders a visible neutral summary when a valid response has no overall", () => {
    const data = comparisonData();
    data.overall = null;
    contextState.current = {
      ...contextState.current!,
      comparisonData: data,
    };

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup).toContain("Weekly Comparison");
    expect(markup).toContain("Comparison unavailable");
  });

  it("does not expose snapshot IDs or detailed comparison data", () => {
    const data = comparisonData();
    data.domains.NUTRITION = {
      comparisonStatus: "COMPARABLE",
      delta: null,
      daily: [],
    };
    Object.assign(data, {
      dailyMarker: "daily-comparison-secret",
      sessionMarker: "session-comparison-secret",
      nutritionMarker: "nutrition-comparison-secret",
    });
    contextState.current = {
      ...contextState.current!,
      comparisonData: data,
    };

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup).not.toContain("snapshot-secret");
    expect(markup).not.toContain("COMPARABLE");
    expect(markup).not.toContain("daily-comparison-secret");
    expect(markup).not.toContain("session-comparison-secret");
    expect(markup).not.toContain("nutrition-comparison-secret");
    expect(markup).toContain("Current weekly adherence cards");
  });
});

describe("AthleteWeeklyAdherenceSection weekly breakdown", () => {
  beforeEach(() => {
    contextState.current = {
      ...state(),
      selectedSnapshotAId: "snapshot-a",
      selectedSnapshotBId: "snapshot-b",
      comparisonData: comparisonData(),
    };
  });

  it("does not add a weekly breakdown for Overall", () => {
    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup).toContain("Overall — Overall adherence");
    expect(markup).not.toContain("Overall Weekly Breakdown");
    expect(markup).not.toContain("Weekly breakdown unavailable");
    expect(markup).not.toContain("Daily Comparison");
  });

  it.each([
    [
      "SKILL",
      "Skills Weekly Breakdown",
      ["Prescribed drills", "Completed drills", "Planned minutes", "Actual minutes"],
      ["120", "100", "135", "130"],
      ["+8", "—", "+58 min", "-20 min"],
    ],
    [
      "NUTRITION",
      "Nutrition Weekly Breakdown",
      [
        "Weighted meal credit",
        "Full meals",
        "Half meals",
        "Missed meals",
        "Planned calories",
        "Consumed calories",
      ],
      ["14000", "13000", "15000", "14500"],
      ["+16", "+2", "—", "-1", "+350 kcal", "-125 kcal"],
    ],
    [
      "STRENGTH_CONDITIONING",
      "S&amp;C Weekly Breakdown",
      [
        "Prescribed exercises",
        "Completed exercises",
        "Planned minutes",
        "Actual minutes",
      ],
      ["120", "100", "135", "130"],
      ["+8", "—", "+58 min", "-20 min"],
    ],
  ] as const)(
    "renders only the selected %s weekly backend fields",
    (domain, heading, labels, values, deltaValues) => {
      const data = comparisonData();
      data.overall = null;
      addDomainComparison(data, domain, {
        earlier: 60,
        later: 70,
        delta: 10,
      });
      contextState.current = {
        ...contextState.current!,
        comparisonData: data,
      };

      const markup = renderToStaticMarkup(
        createElement(AthleteWeeklyAdherenceSection),
      );

      expect(markup).toContain(heading);
      for (const label of labels) expect(markup).toContain(label);
      for (const value of values) expect(markup).toContain(`>${value}<`);
      for (const value of deltaValues) expect(markup).toContain(`>${value}<`);
      expect(markup).toContain(">Change<");
      expect(markup).toContain("Current weekly adherence cards");
      expect(contextState.current?.setSelectedSnapshotAId).not.toHaveBeenCalled();
      expect(contextState.current?.setSelectedSnapshotBId).not.toHaveBeenCalled();
    },
  );

  it("renders neutral copy when the selected weekly breakdown is absent", () => {
    const data = comparisonData();
    data.overall = null;
    addDomainComparison(data, "SKILL", {
      earlier: 60,
      later: 70,
      delta: 10,
    });
    delete data.snapshotA.domainBreakdowns.SKILL;
    delete data.snapshotB.domainBreakdowns.SKILL;
    contextState.current = {
      ...contextState.current!,
      comparisonData: data,
    };

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup).toContain("Skills Weekly Breakdown");
    expect(markup).toContain("Weekly breakdown unavailable");
    expect(markup).not.toContain("Prescribed drills");
  });

  it("renders Not available for missing nullable weekly fields", () => {
    const data = comparisonData();
    data.overall = null;
    addDomainComparison(data, "STRENGTH_CONDITIONING", {
      earlier: 60,
      later: 70,
      delta: 10,
    });
    delete data.snapshotA.domainBreakdowns.STRENGTH_CONDITIONING?.weekly
      .plannedMinutes;
    delete data.snapshotA.domainBreakdowns.STRENGTH_CONDITIONING?.weekly
      .actualMinutes;
    contextState.current = {
      ...contextState.current!,
      comparisonData: data,
    };

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup.match(/Not available/g)).toHaveLength(2);
    expect(markup).not.toContain(">null<");
    expect(markup).not.toContain(">undefined<");
  });

  it("renders Not available when the backend domain delta is null", () => {
    const data = comparisonData();
    data.overall = null;
    addDomainComparison(data, "SKILL", {
      earlier: 60,
      later: 70,
      delta: null,
      status: "NOT_COMPARABLE",
    });
    contextState.current = {
      ...contextState.current!,
      comparisonData: data,
    };

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup.match(/Not available/g)).toHaveLength(4);
    expect(markup).not.toContain(">+8<");
    expect(markup).not.toContain(">—<");
  });

});

describe("AthleteWeeklyAdherenceSection daily comparison", () => {
  beforeEach(() => {
    contextState.current = {
      ...state(),
      selectedSnapshotAId: "snapshot-a",
      selectedSnapshotBId: "snapshot-b",
      comparisonData: comparisonData(),
    };
  });

  it.each([
    ["SKILL", "Skills"],
    ["NUTRITION", "Nutrition"],
    ["STRENGTH_CONDITIONING", "S&amp;C"],
  ] as const)(
    "renders seven ordered expandable backend days for %s",
    (domain, categoryLabel) => {
      const data = comparisonData();
      data.overall = null;
      addDomainComparison(data, domain, {
        earlier: 60,
        later: 70,
        delta: 10,
      });
      addDailyComparisons(data, domain);
      data.domains[domain]!.daily[1]!.snapshotA!.adherencePercent = 81.26;
      contextState.current = {
        ...contextState.current!,
        comparisonData: data,
      };

      const markup = renderToStaticMarkup(
        createElement(AthleteWeeklyAdherenceSection),
      );

      expect(markup).toContain(`${categoryLabel} Weekly Breakdown`);
      expect(markup).toContain("Daily Comparison");
      expect(markup.match(/<details/g)).toHaveLength(7);
      expect(markup.match(/<summary/g)).toHaveLength(7);
      expect(markup).toContain("focus-visible:ring-2");
      expect(markup).toContain("sm:grid-cols-4");
      expect(markup).toContain("sm:grid-cols-3");
      expect(markup).toContain("sm:hidden");
      expect(markup.indexOf("Day 1")).toBeLessThan(markup.indexOf("Day 2"));
      expect(markup.indexOf("Day 2")).toBeLessThan(markup.indexOf("Day 7"));
      expect(markup).toContain("Earlier week");
      expect(markup).toContain("Later week");
      expect(markup).toContain("Status");
      expect(markup).toContain("Comparison unavailable");
      expect(markup).toContain("Comparable");
      expect(markup).not.toContain("NOT_COMPARABLE");
      expect(markup).not.toContain(">COMPARABLE<");
      expect(markup).toContain("81.3%");
      expect(markup).toContain("-12.5%");
      expect(markup).toContain("Not available");
      for (const label of [
        "Planned sessions",
        "Logged sessions",
        "Total prescribed items",
        "Completed items",
        "Partial items",
        "Skipped items",
        "Unlogged items",
        "Completion credit",
        "Adherence percent",
      ]) {
        expect(markup).toContain(label);
      }
      expect(markup).not.toContain("must-not-render");
      expect(markup).not.toContain("Planned nutrients");
      expect(markup).not.toContain("Consumed nutrients");
      expect(markup).not.toContain("Variance");
      expect(contextState.current?.setSelectedSnapshotAId).not.toHaveBeenCalled();
      expect(contextState.current?.setSelectedSnapshotBId).not.toHaveBeenCalled();
    },
  );

  it("does not render Daily Comparison for Overall", () => {
    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup).toContain("Overall — Overall adherence");
    expect(markup).not.toContain("Daily Comparison");
  });

  it("renders a clear empty state when daily breakdown is missing", () => {
    const data = comparisonData();
    data.overall = null;
    addDomainComparison(data, "SKILL", {
      earlier: 60,
      later: 70,
      delta: 10,
    });
    contextState.current = {
      ...contextState.current!,
      comparisonData: data,
    };

    const markup = renderToStaticMarkup(
      createElement(AthleteWeeklyAdherenceSection),
    );

    expect(markup).toContain("Daily Comparison");
    expect(markup).toContain("Daily breakdown unavailable");
    expect(markup).not.toContain("<details");
  });
});
