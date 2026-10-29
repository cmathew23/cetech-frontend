import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const sidebarSport = vi.hoisted(() => ({ sportCode: "TENNIS" as string | null }));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children?: ReactNode;
    href: string;
  }) => createElement("a", { ...props, href }, children),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/athlete/dashboard",
  useRouter: () => ({ push() {}, replace() {}, refresh() {} }),
}));

vi.mock("@/components/dashboard/athlete/AthletePageReadyContext", () => ({
  useAthletePageReady: () => ({ isPageReady: true, markPageReady() {} }),
}));

vi.mock("@/components/dashboard/athlete/useAthleteInvitationGate", () => ({
  useAthleteInvitationGate: () => ({
    invitationAccessLocked: false,
    pendingCount: 0,
    isGateReady: true,
    accessContext: null,
    accessGateReady: true,
  }),
}));

vi.mock("@/components/dashboard/athlete/useAthleteSportCode", () => ({
  useAthleteSportCode: () => ({ sportCode: sidebarSport.sportCode, ready: true }),
}));

const { AthleteSidebar } = await import("./AthleteSidebar");

function renderSidebar() {
  return renderToStaticMarkup(createElement(AthleteSidebar));
}

describe("PeakFlow Swing sidebar visibility", () => {
  it("hides PeakFlow Swing for a non-Golf athlete", () => {
    sidebarSport.sportCode = "TENNIS";
    const html = renderSidebar();
    expect(html).not.toContain("PeakFlow Swing");
    expect(html).not.toContain("/athlete/peakflow-swing");
    expect(html).toContain("Dashboard");
    expect(html).toContain("/athlete/weekly-plan");
  });

  it("shows PeakFlow Swing for a Golf athlete", () => {
    sidebarSport.sportCode = "GOLF";
    const html = renderSidebar();
    expect(html).toContain("PeakFlow Swing");
    expect(html).toContain('href="/athlete/peakflow-swing"');
  });
});
