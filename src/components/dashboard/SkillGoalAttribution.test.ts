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

  it("renders success criterion and numeric target value when present on the skill item", () => {
    const markup = renderToStaticMarkup(
      createElement(SkillGoalAttributionText, {
        primaryGoalName: "Improve first serve consistency",
        successCriteria: "Hit 7 of 10 serves into target zone",
        targetValue: 7,
      }),
    );

    expect(markup).toContain("Goal:");
    expect(markup).toContain("Improve first serve consistency");
    expect(markup).toContain("Success criterion:");
    expect(markup).toContain("Hit 7 of 10 serves into target zone");
    expect(markup).toContain("Target value:");
    expect(markup).toContain("7");
    expect(markup).toContain("font-medium text-primary");
    expect(markup).toContain("text-textPrimary");
    expect(markup).toContain("mb-2");
    expect(markup).not.toContain("text-textSecondary");
  });

  it("omits target value when it is absent", () => {
    const markup = renderToStaticMarkup(
      createElement(SkillGoalAttributionText, {
        primaryGoalName: "Improve first serve consistency",
        successCriteria: ["Hit 7 of 10 serves into target zone"],
      }),
    );

    expect(markup).toContain("Success criterion:");
    expect(markup).not.toContain("Target value:");
  });
});
