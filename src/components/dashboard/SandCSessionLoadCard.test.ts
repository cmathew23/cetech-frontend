import { SandCSessionLoadCard } from "@/components/dashboard/SandCSessionLoadCard";
import { coachCanViewSandCSessionLoad } from "@/components/dashboard/SandCSessionLoadSection";
import { SANDC_SESSION_LOAD_HISTORY_EMPTY_MESSAGE } from "@/lib/api/sessionLoadHistory";
import { readFileSync } from "node:fs";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/Select", async () => {
  const { createElement } = await import("react");
  return {
    Select: (props: Record<string, unknown>) => createElement("select", props),
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
    }) => createElement("label", { htmlFor: id }, label, children),
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

describe("SandCSessionLoadCard", () => {
  it("shows AU for numeric load, 0 AU for zero, and — for missing", () => {
    const withLoad = renderToStaticMarkup(
      createElement(SandCSessionLoadCard, { averageSessionLoad: 245 }),
    );
    const zero = renderToStaticMarkup(
      createElement(SandCSessionLoadCard, { averageSessionLoad: 0 }),
    );
    const missing = renderToStaticMarkup(
      createElement(SandCSessionLoadCard, { averageSessionLoad: null }),
    );

    expect(withLoad).toContain("Average Weekly Session Load");
    expect(withLoad).toContain("245 AU");
    expect(zero).toContain("0 AU");
    expect(missing).toContain("—");
    expect(missing).not.toContain("0 AU");
    expect(withLoad).toContain("Avg Session Time: —");
    expect(withLoad).toContain("Avg Session RPE: —");
    expect(withLoad).not.toContain("completion");
  });

  it("shows backend avg session time and RPE without frontend calculation", () => {
    const html = renderToStaticMarkup(
      createElement(SandCSessionLoadCard, {
        averageSessionLoad: 275,
        averageSessionDurationMinutes: 55,
        averageSessionRpe: 5,
      }),
    );
    const missing = renderToStaticMarkup(
      createElement(SandCSessionLoadCard, {
        averageSessionLoad: 275,
        averageSessionDurationMinutes: null,
        averageSessionRpe: null,
      }),
    );
    const zero = renderToStaticMarkup(
      createElement(SandCSessionLoadCard, {
        averageSessionLoad: 0,
        averageSessionDurationMinutes: 0,
        averageSessionRpe: 0,
      }),
    );

    expect(html).toContain("275 AU");
    expect(html).toContain("Avg Session Time: 55 min");
    expect(html).toContain("Avg Session RPE: 5.0 / 10");
    expect(missing).toContain("Avg Session Time: —");
    expect(missing).toContain("Avg Session RPE: —");
    expect(zero).toContain("Avg Session Time: 0 min");
    expect(zero).toContain("Avg Session RPE: 0.0 / 10");
    expect(html).not.toContain("Avg Session Time: 55 min vs");
    expect(html.indexOf("275 AU")).toBeLessThan(html.indexOf("Avg Session Time"));
    expect(html.indexOf("Avg Session Time")).toBeLessThan(
      html.indexOf("Historical Comparison"),
    );
  });

  it("shows the historical empty state when history is []", () => {
    const html = renderToStaticMarkup(
      createElement(SandCSessionLoadCard, {
        averageSessionLoad: 245,
        historyWeeks: [],
      }),
    );
    expect(html).toContain("Historical Comparison");
    expect(html).toContain(
      SANDC_SESSION_LOAD_HISTORY_EMPTY_MESSAGE.replaceAll("&", "&amp;"),
    );
  });

  it("does not treat a history 404 as the empty-history state", () => {
    const html = renderToStaticMarkup(
      createElement(SandCSessionLoadCard, {
        averageSessionLoad: 245,
        historyWeeks: [],
        historyError: "Route not found",
      }),
    );
    expect(html).toContain("Route not found");
    expect(html).not.toContain(
      SANDC_SESSION_LOAD_HISTORY_EMPTY_MESSAGE.replaceAll("&", "&amp;"),
    );
  });

  it("compares current vs selected historical week and shows difference", () => {
    const html = renderToStaticMarkup(
      createElement(SandCSessionLoadCard, {
        averageSessionLoad: 245,
        weekStart: "2026-09-14",
        weekEnd: "2026-09-20",
        historyWeeks: [
          {
            weekStart: "2026-08-31",
            weekEnd: "2026-09-06",
            averageSessionLoad: 210,
          },
          {
            weekStart: "2026-09-07",
            weekEnd: "2026-09-13",
            averageSessionLoad: 200,
          },
        ],
      }),
    );

    expect(html).toContain("Current Week Average Session Load");
    expect(html).toContain("Historical Week Average Session Load");
    expect(html).toContain("Difference");
    expect(html).toContain("245 AU");
    expect(html).toContain("200 AU");
    expect(html).toContain("↑ 45 AU");
    expect(html).toContain("Historical week");
    expect(html).not.toContain("text-green");
    expect(html).not.toContain("text-red");
    expect(html).not.toContain("Historical Week Avg Session Time");
    expect(html).not.toContain("Historical Week Avg Session RPE");
  });

  it("shows — for a missing historical value instead of inventing load", () => {
    const html = renderToStaticMarkup(
      createElement(SandCSessionLoadCard, {
        averageSessionLoad: 245,
        historyWeeks: [
          {
            weekStart: "2026-08-31",
            weekEnd: "2026-09-06",
            averageSessionLoad: null,
          },
        ],
      }),
    );
    expect(html).toMatch(/Historical Week Average Session Load[\s\S]*—/);
    expect(html).toMatch(/Difference[\s\S]*—/);
  });
});

describe("SandCSessionLoad dashboard visibility", () => {
  it("is visible to Head Coach and S&C Coach, not Skills or Nutrition", () => {
    expect(
      coachCanViewSandCSessionLoad({ academyCoachRole: "HEAD_COACH" }),
    ).toBe(true);
    expect(
      coachCanViewSandCSessionLoad({ functions: ["S_AND_C"] }),
    ).toBe(true);
    expect(
      coachCanViewSandCSessionLoad({
        functions: ["STRENGTH_AND_CONDITIONING_COACH"],
      }),
    ).toBe(true);
    expect(coachCanViewSandCSessionLoad({ functions: ["SKILLS"] })).toBe(false);
    expect(coachCanViewSandCSessionLoad({ functions: ["NUTRITION"] })).toBe(
      false,
    );
  });

  it("mounts on the athlete dashboard after Weekly Adherence", () => {
    const shell = readFileSync(
      new URL("./athlete/AthleteDashboardShell.tsx", import.meta.url),
      "utf8",
    );
    expect(shell).toContain("<AthleteWeeklyAdherenceSection />");
    expect(shell).toContain("<AthleteSandCSessionLoadWithPlanWindow");
    expect(shell.indexOf("<AthleteWeeklyAdherenceSection")).toBeLessThan(
      shell.indexOf("<AthleteSandCSessionLoadWithPlanWindow"),
    );
    expect(shell.indexOf("<AthleteSandCSessionLoadWithPlanWindow")).toBeLessThan(
      shell.indexOf("<AthleteTodayPlanCard"),
    );
  });

  it("mounts on Head Coach and S&C Coach athlete performance views only", () => {
    const performance = readFileSync(
      new URL("./coach/CoachAthletePerformancePageContent.tsx", import.meta.url),
      "utf8",
    );
    expect(performance).toContain("<SandCSessionLoadSection");
    expect(performance).toContain("coachCanViewSandCSessionLoad");
    expect(performance).toContain("showSandCSessionLoad");
    expect(performance.indexOf("<WeeklyTrainingLoadCard")).toBeLessThan(
      performance.indexOf("<SandCSessionLoadSection"),
    );
  });

  it("passes backend S&C time and RPE through the shared dashboard card", () => {
    const section = readFileSync(
      new URL("./SandCSessionLoadSection.tsx", import.meta.url),
      "utf8",
    );
    expect(section).toContain(
      "readStrengthConditioningAverageSessionDurationMinutes",
    );
    expect(section).toContain("readStrengthConditioningAverageSessionRpe");
    expect(section).toContain(
      "averageSessionDurationMinutes={averageSessionDurationMinutes}",
    );
    expect(section).toContain("averageSessionRpe={averageSessionRpe}");
    expect(section).not.toContain("WORKFLOW_");
    expect(section).not.toContain("WF1");
  });
});
