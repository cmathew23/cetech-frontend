import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { designSystem } from "@/config/design-system";

const planningProfileSource = readFileSync(
  new URL(
    "../components/dashboard/coach/CoachAthletePlanningProfileView.tsx",
    import.meta.url,
  ),
  "utf8",
);

const coachDashboardSource = readFileSync(
  new URL(
    "../components/dashboard/coach/CoachDashboardView.tsx",
    import.meta.url,
  ),
  "utf8",
);

describe("global responsive design tokens", () => {
  it("keeps page shells shrinkable without page-level overflow", () => {
    expect(designSystem.layout.page).toContain("min-w-0");
    expect(designSystem.layout.page).toContain("max-w-full");
    expect(designSystem.layout.rootBody).toContain("min-w-0");
    expect(designSystem.layout.main).toContain("min-w-0");
  });

  it("constrains modals to the viewport with scrollable overflow", () => {
    expect(designSystem.modal.backdrop).toContain("overflow-y-auto");
    expect(designSystem.modal.backdrop).toContain("p-3");
    expect(designSystem.modal.panel).toContain("min-w-0");
    expect(designSystem.modal.panel).toContain("w-full");
  });

  it("wraps table cell text instead of forcing unreadable shrink", () => {
    expect(designSystem.table.container).toContain("overflow-x-auto");
    expect(designSystem.table.cell.body).toContain("break-words");
  });
});

describe("training plan overlay responsive layout classes", () => {
  it("makes domain review drawers full-viewport on mobile while keeping desktop max-width", () => {
    expect(planningProfileSource).toContain("domain-review-drawer--workspace-scoped");
    expect(planningProfileSource).toContain("max-md:inset-0");
    expect(planningProfileSource).toContain("max-md:max-h-[100dvh]");
    expect(planningProfileSource).toContain("max-w-3xl");
  });

  it("keeps Context Builder drawers workspace-scoped and full-width on mobile", () => {
    expect(planningProfileSource).toContain("max-md:max-w-full max-md:rounded-none");
    expect(planningProfileSource).toMatch(
      /function resolveContextBuilderDrawerLayoutClasses[\s\S]*?rootClassName: "absolute inset-0 z-50"/,
    );
  });
});

describe("tablet-with-sidebar content grids", () => {
  it("delays coach dashboard 3-column cards until xl so lg sidebar leaves readable width", () => {
    expect(coachDashboardSource).toContain(
      "grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3",
    );
    expect(coachDashboardSource).not.toContain("sm:grid-cols-3");
    expect(coachDashboardSource).not.toContain("lg:grid-cols-3");
    expect(coachDashboardSource).toContain("md:col-span-2 xl:col-span-1");
  });

  it("stacks planning-context DetailRow summaries until xl", () => {
    expect(planningProfileSource).toContain(
      "grid min-w-0 gap-2 text-sm xl:grid-cols-2",
    );
    expect(planningProfileSource).not.toContain(
      "grid gap-2 text-sm sm:grid-cols-2",
    );
    expect(planningProfileSource).not.toContain("grid gap-2 sm:grid-cols-2");
  });
});
