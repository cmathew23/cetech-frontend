import { describe, expect, it } from "vitest";
import {
  VISIBLE_DIET_TYPE_OPTIONS,
  VISIBLE_REGIONAL_CUISINE_OPTIONS,
} from "@/components/dashboard/athlete/AthleteProfilePlanningPageContent";

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
