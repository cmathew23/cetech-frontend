import {
  formatAthleteMetricValue,
  formatDisplayUnit,
} from "@/components/dashboard/athlete/athleteSportsMetricsPresentation";
import { describe, expect, it } from "vitest";

describe("formatDisplayUnit", () => {
  it("maps backend Exercise Performance unit enums to athlete-friendly labels", () => {
    expect(formatDisplayUnit("MILES_PER_HOUR")).toBe("mph");
    expect(formatDisplayUnit("FEET")).toBe("ft");
    expect(formatDisplayUnit("PERCENTAGE")).toBe("%");
    expect(formatDisplayUnit("INCHES")).toBe("in");
    expect(formatDisplayUnit("YARDS")).toBe("yd");
    expect(formatDisplayUnit("PERCENT")).toBe("%");
    expect(formatDisplayUnit("PCT")).toBe("%");
    expect(formatDisplayUnit("FT")).toBe("ft");
    expect(formatDisplayUnit("MPH")).toBe("mph");
  });

  it("keeps already-friendly unit labels", () => {
    expect(formatDisplayUnit("mph")).toBe("mph");
    expect(formatDisplayUnit("ft")).toBe("ft");
    expect(formatDisplayUnit("%")).toBe("%");
    expect(formatDisplayUnit("in")).toBe("in");
    expect(formatDisplayUnit("yd")).toBe("yd");
  });

  it("does not invent labels for unsupported units", () => {
    expect(formatDisplayUnit("COUNT")).toBe("COUNT");
    expect(formatDisplayUnit(null)).toBe("");
    expect(formatDisplayUnit("")).toBe("");
  });
});

describe("formatAthleteMetricValue", () => {
  it("formats numbers to at most one decimal and keeps whole numbers whole", () => {
    expect(formatAthleteMetricValue(95.88, "MILES_PER_HOUR")).toBe("95.9 mph");
    expect(formatAthleteMetricValue(2.32, "FEET")).toBe("2.3 ft");
    expect(formatAthleteMetricValue(8.2, "ft")).toBe("8.2 ft");
    expect(formatAthleteMetricValue(100, "PERCENTAGE")).toBe("100%");
    expect(formatAthleteMetricValue(75, "%")).toBe("75%");
    expect(formatAthleteMetricValue(70, null)).toBe("70");
  });
});
