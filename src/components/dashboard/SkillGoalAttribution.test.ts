import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  normalizeSkillPrimaryGoalName,
  SkillGoalAttributionText,
} from "@/components/dashboard/SkillGoalAttribution";

describe("SkillGoalAttributionText", () => {
  it("renders the primary goal name for skill drills", () => {
    const markup = renderToStaticMarkup(
      createElement(SkillGoalAttributionText, {
        primaryGoalName: "Improve first serve consistency",
      }),
    );

    expect(markup).toContain("Goal:");
    expect(markup).toContain("Improve first serve consistency");
  });

  it("hides the goal line when no primary goal name is present", () => {
    expect(
      renderToStaticMarkup(
        createElement(SkillGoalAttributionText, { primaryGoalName: null }),
      ),
    ).toBe("");
    expect(normalizeSkillPrimaryGoalName("   ")).toBeNull();
  });
});
