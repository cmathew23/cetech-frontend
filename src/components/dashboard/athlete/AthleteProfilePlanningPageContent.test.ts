import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ALLERGY_INTOLERANCE_CHOICES_DISABLED,
  ALLERGY_OPTIONS,
  INTOLERANCE_OPTIONS,
  SPECIAL_SELECTABLE_OPTIONS,
  VISIBLE_DIET_TYPE_OPTIONS,
  VISIBLE_REGIONAL_CUISINE_OPTIONS,
} from "@/components/dashboard/athlete/AthleteProfilePlanningPageContent";

const source = readFileSync(
  new URL("./AthleteProfilePlanningPageContent.tsx", import.meta.url),
  "utf8",
);

describe("APP Diet Type and Regional Cuisine MVP options", () => {
  it("exposes only Omnivore and Vegetarian diet types", () => {
    expect(
      VISIBLE_DIET_TYPE_OPTIONS.filter((option) => option.value !== "").map(
        (option) => option.label,
      ),
    ).toEqual(["Omnivore", "Vegetarian"]);
    expect(
      VISIBLE_DIET_TYPE_OPTIONS.filter((option) => option.value !== "").map(
        (option) => option.value,
      ),
    ).toEqual(["OMNIVORE", "VEGETARIAN"]);
  });

  it("does not display other diet type choices", () => {
    const labels = VISIBLE_DIET_TYPE_OPTIONS.map((option) => option.label);
    const values = VISIBLE_DIET_TYPE_OPTIONS.map((option) => option.value);

    expect(labels).not.toContain("Vegan");
    expect(labels).not.toContain("Pescatarian");
    expect(labels).not.toContain("Halal");
    expect(labels).not.toContain("Kosher");
    expect(labels).not.toContain("Gluten-free");
    expect(labels).not.toContain("Dairy-free");
    expect(labels).not.toContain("Other");
    expect(values).not.toContain("VEGAN");
    expect(values).not.toContain("PESCATARIAN");
    expect(values).not.toContain("HALAL");
    expect(values).not.toContain("KOSHER");
    expect(values).not.toContain("GLUTEN_FREE");
    expect(values).not.toContain("DAIRY_FREE");
    expect(values).not.toContain("OTHER");
  });

  it("displays only Indian as the regional cuisine preference", () => {
    expect(
      VISIBLE_REGIONAL_CUISINE_OPTIONS.map((option) => option.label),
    ).toEqual(["Indian"]);
    expect(
      VISIBLE_REGIONAL_CUISINE_OPTIONS.map((option) => option.value),
    ).toEqual(["INDIAN"]);
  });

  it("does not display other regional cuisine choices", () => {
    const labels = VISIBLE_REGIONAL_CUISINE_OPTIONS.map(
      (option) => option.label,
    );

    expect(labels).not.toContain("North Indian");
    expect(labels).not.toContain("South Indian");
    expect(labels).not.toContain("West Indian");
    expect(labels).not.toContain("East Indian");
    expect(labels).not.toContain("Continental");
    expect(labels).not.toContain("Asian");
    expect(labels).not.toContain("Mediterranean");
    expect(labels).not.toContain("Middle Eastern");
    expect(labels).not.toContain("Latin American");
    expect(labels).not.toContain("Open to all");
  });
});

describe("APP Allergies / Intolerances MVP disable", () => {
  it("renders existing allergy and intolerance options while keeping the data intact", () => {
    expect([...ALLERGY_OPTIONS]).toEqual([
      "Celery",
      "Cereals containing gluten",
      "Crustaceans",
      "Eggs",
      "Fish",
      "Lupin",
      "Milk",
      "Molluscs",
      "Mustard",
      "Nuts",
      "Peanuts",
      "Sesame seeds",
      "Soya",
      "Sulphites",
    ]);
    expect([...INTOLERANCE_OPTIONS]).toEqual([
      "Lactose Intolerant",
      "Gluten Intolerant",
      "FODMAP Sensitivity",
      "Histamine Intolerance",
      "Fructose Intolerance",
    ]);
    expect([...SPECIAL_SELECTABLE_OPTIONS]).toEqual(["Others"]);
    expect(source).toContain("{ALLERGY_OPTIONS.map((option) => (");
    expect(source).toContain("{INTOLERANCE_OPTIONS.map((option) => (");
    expect(source).toContain("{SPECIAL_SELECTABLE_OPTIONS.map((option) => (");
  });

  it("keeps allergy, intolerance, and Others controls disabled and non-selectable", () => {
    expect(ALLERGY_INTOLERANCE_CHOICES_DISABLED).toBe(true);
    expect(source).toContain("|| ALLERGY_INTOLERANCE_CHOICES_DISABLED");
  });

  it("keeps I do not have food allergies enabled", () => {
    expect(source).toContain("<span>{NO_FOOD_ALLERGIES_OPTION}</span>");
    expect(source).toMatch(
      /checked=\{allergiesValue\.noFoodAllergies\}\s+disabled=\{readOnly\}\s+onChange=\{toggleNoFoodAllergies\}/,
    );
  });
});
