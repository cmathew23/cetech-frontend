import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  dashboardSectionIcon,
  DashboardSectionHeading,
} from "./dashboardSectionIcons";

const SECTION_TITLES = [
  "Weekly Adherence",
  "Weekly Training Load",
  "Today's Plan",
  "Weekly Goal Performance",
  "Exercise Performance",
  "Taxonomy Performance",
  "Practice Performance",
  "Competition Performance",
  "Overall Golf Performance",
  "Nutrition Performance",
  "Wearable Summary",
] as const;

const EXPECTED_ICONS: Record<(typeof SECTION_TITLES)[number], string> = {
  "Weekly Adherence": "CalendarCheck",
  "Weekly Training Load": "Dumbbell",
  "Today's Plan": "ClipboardClock",
  "Weekly Goal Performance": "Target",
  "Exercise Performance": "PersonStanding",
  "Taxonomy Performance": "Pyramid",
  "Practice Performance": "Flag",
  "Competition Performance": "Trophy",
  "Overall Golf Performance": "ChartColumnIncreasing",
  "Nutrition Performance": "ForkKnife",
  "Wearable Summary": "Watch",
};

describe("dashboardSectionIcons", () => {
  it("maps each dashboard section title to the intended Lucide icon", () => {
    const source = readFileSync(
      new URL("./dashboardSectionIcons.tsx", import.meta.url),
      "utf8",
    );

    for (const title of SECTION_TITLES) {
      const Icon = dashboardSectionIcon(title);
      expect(Icon, title).toBeTruthy();
      expect(source).toContain(`"${title}": ${EXPECTED_ICONS[title]}`);
    }

    expect(dashboardSectionIcon("Today’s Plan")).toBe(
      dashboardSectionIcon("Today's Plan"),
    );
    expect(dashboardSectionIcon("Coach Practice Rating")).toBeNull();
    expect(dashboardSectionIcon("Weekly Plan Journal")).toBeNull();
  });

  it("renders the icon immediately left of the heading without changing other titles", () => {
    const withIcon = renderToStaticMarkup(
      createElement(DashboardSectionHeading, { title: "Weekly Adherence" }),
    );
    const withoutIcon = renderToStaticMarkup(
      createElement(DashboardSectionHeading, { title: "Pending Invitation" }),
    );

    expect(withIcon).toContain("<svg");
    expect(withIcon.indexOf("<svg")).toBeLessThan(
      withIcon.indexOf("Weekly Adherence"),
    );
    expect(withIcon).toContain('aria-hidden="true"');
    expect(withIcon).toContain(
      "h-5 w-5 shrink-0 text-primary md:h-[22px] md:w-[22px] lg:h-6 lg:w-6",
    );
    expect(withIcon).toContain('width="24"');
    expect(withIcon).toContain('height="24"');
    expect(withoutIcon).toBe("<h3>Pending Invitation</h3>");
    expect(withoutIcon).not.toContain("<svg");
  });

  it("Card headings pick up section icons from the shared mapping", () => {
    const cardSource = readFileSync(
      new URL("../../ui/Card.jsx", import.meta.url),
      "utf8",
    );

    expect(cardSource).toContain("DashboardSectionHeading");
    expect(cardSource).toContain("title={title}");
  });
});
