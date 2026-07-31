import {
  createElement,
  type ButtonHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/Modal", async () => {
  const React = await import("react");
  return {
    Modal({ children }: { children: ReactNode }) {
      return React.createElement("div", null, children);
    },
  };
});

vi.mock("@/components/ui/Button", async () => {
  const React = await import("react");
  return {
    Button(
      props: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string },
    ) {
      return React.createElement("button", props, props.children);
    },
  };
});

vi.mock("@/components/ui/FormField", async () => {
  const React = await import("react");
  return {
    FormField({
      children,
      id,
      label,
    }: {
      children: ReactNode;
      id: string;
      label: string;
    }) {
      return React.createElement(
        "div",
        null,
        React.createElement("label", { htmlFor: id }, label),
        children,
      );
    },
  };
});

vi.mock("@/components/ui/Select", async () => {
  const React = await import("react");
  return {
    Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
      return React.createElement("select", props);
    },
  };
});

import { CoachAthleteLevelValidationModal } from "@/components/dashboard/coach/CoachAthleteLevelValidationModal";
import type { TrainingPlanLevelValidationView } from "@/types/trainingPlanLevelValidation";

function levelValidationSnapshot(
  allowedLevels: string[],
): TrainingPlanLevelValidationView {
  return {
    age: null,
    ageBand: null,
    highestCompetitionLevelReachedPast12Months: null,
    highestRankingAchievedAtThatLevelPast12Months: null,
    baseSuggestedLevel: null,
    rankingOverrideApplied: null,
    finalSuggestedLevel: null,
    validatedLevel: null,
    validationStatus: null,
    reasons: [],
    allowedLevels,
  };
}

function renderModalHtml(
  levelValidationSnapshotValue: TrainingPlanLevelValidationView | null,
): string {
  return renderToStaticMarkup(
    createElement(CoachAthleteLevelValidationModal, {
      open: true,
      onClose: vi.fn(),
      entityId: "entity-1",
      athleteId: "athlete-1",
      athleteDisplayName: "Jane Doe",
      selfReportedLevelLabel: "Intermediate",
      levelValidationSnapshot: levelValidationSnapshotValue,
      onAfterSaveConfirmed: vi.fn(),
    }),
  );
}

function optionValues(html: string): string[] {
  const matches = [...html.matchAll(/<option[^>]*value="([^"]*)"[^>]*>/g)];
  return matches.map((match) => match[1]).filter((value) => value !== "");
}

describe("CoachAthleteLevelValidationModal", () => {
  it("renders the loaded athlete name instead of the athlete UUID", () => {
    const athleteId = "eb51a048-33c6-48d4-8945-92839e75dbc3";
    const html = renderToStaticMarkup(
      createElement(CoachAthleteLevelValidationModal, {
        open: true,
        onClose: vi.fn(),
        entityId: "entity-1",
        athleteId,
        athleteDisplayName: "JANE DOE",
        selfReportedLevelLabel: "Intermediate",
        levelValidationSnapshot: null,
        onAfterSaveConfirmed: vi.fn(),
      }),
    );

    expect(html).toContain("Jane Doe");
    expect(html).not.toContain(athleteId);
  });

  it.each([
    {
      allowedLevels: ["BEGINNER", "INTERMEDIATE"],
      expectedOptions: ["BEGINNER", "INTERMEDIATE"],
    },
    {
      allowedLevels: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
      expectedOptions: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
    },
    {
      allowedLevels: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ELITE"],
      expectedOptions: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ELITE"],
    },
  ])(
    "renders dropdown options from allowedLevels in backend order: $expectedOptions",
    ({ allowedLevels, expectedOptions }) => {
      const html = renderModalHtml(levelValidationSnapshot(allowedLevels));
      expect(optionValues(html)).toEqual(expectedOptions);
    },
  );

  it("disables the dropdown when allowedLevels is empty", () => {
    const html = renderModalHtml(levelValidationSnapshot([]));
    expect(html).toMatch(/<select[^>]*disabled(?:=""|="disabled"|)[^>]*>/);
    expect(optionValues(html)).toEqual([]);
  });
});
