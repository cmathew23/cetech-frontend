import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DATE_DISPLAY_UNAVAILABLE,
  formatDateOnly,
  formatDateOrDateTime,
  formatDateRange,
  formatDateTime,
  formatDateWithWeekday,
  formatPlanningProfileDateDisplay,
  getLocalWeekday,
  parseTimestampMsForSort,
} from "@/lib/dateTime";

describe("formatDateOnly", () => {
  it("formats plain ISO date as DD/MM/YYYY", () => {
    expect(formatDateOnly("2026-02-16")).toBe("16/02/2026");
    expect(formatDateOnly("2026-04-30")).toBe("30/04/2026");
  });

  it("includes no time segment for timestamps", () => {
    expect(formatDateOnly("2026-02-16T05:30:00.000Z")).not.toContain(",");
    expect(formatDateOnly("2026-02-16T05:30:00.000Z")).toMatch(
      /^\d{2}\/\d{2}\/\d{4}$/,
    );
  });

  it("returns fallback for null, empty, or invalid input", () => {
    expect(formatDateOnly(null)).toBe(DATE_DISPLAY_UNAVAILABLE);
    expect(formatDateOnly(undefined)).toBe(DATE_DISPLAY_UNAVAILABLE);
    expect(formatDateOnly("")).toBe(DATE_DISPLAY_UNAVAILABLE);
    expect(formatDateOnly("bad")).toBe(DATE_DISPLAY_UNAVAILABLE);
  });
});

describe("formatDateRange", () => {
  it("joins two dates with ' to '", () => {
    expect(formatDateRange("2026-02-16", "2026-06-30")).toBe(
      "16/02/2026 to 30/06/2026",
    );
  });
});

describe("formatDateOrDateTime", () => {
  it("uses date-only for YYYY-MM-DD", () => {
    expect(formatDateOrDateTime("2026-02-16")).toBe("16/02/2026");
  });

  it("uses date-time for ISO instant strings", () => {
    const prevTz = process.env.TZ;
    process.env.TZ = "America/New_York";
    try {
      const out = formatDateOrDateTime("2026-04-30T17:30:00.000Z");
      expect(out).toMatch(/^30\/04\/2026,/);
      expect(out.toLowerCase()).toContain("pm");
    } finally {
      process.env.TZ = prevTz;
    }
  });
});

describe("parseTimestampMsForSort", () => {
  it("returns NaN for empty or placeholder", () => {
    expect(Number.isNaN(parseTimestampMsForSort(""))).toBe(true);
    expect(Number.isNaN(parseTimestampMsForSort("—"))).toBe(true);
  });

  it("orders newer timestamps larger than older", () => {
    expect(
      parseTimestampMsForSort("2026-04-30T12:00:00.000Z") >
        parseTimestampMsForSort("2026-04-29T12:00:00.000Z"),
    ).toBe(true);
  });
});

describe("formatPlanningProfileDateDisplay", () => {
  it("never includes a time component for API timestamps", () => {
    expect(formatPlanningProfileDateDisplay("2026-02-16T05:30:00.000Z")).not.toContain(
      ",",
    );
    expect(formatPlanningProfileDateDisplay("2026-02-16T05:30:00.000Z")).toMatch(
      /^\d{2}\/\d{2}\/\d{4}$/,
    );
  });

  it("uses empty fallback for missing values", () => {
    expect(formatPlanningProfileDateDisplay(null)).toBe(DATE_DISPLAY_UNAVAILABLE);
    expect(formatPlanningProfileDateDisplay(null, "—")).toBe("—");
  });
});

describe("formatDateTime", () => {
  const prevTz = process.env.TZ;

  beforeEach(() => {
    process.env.TZ = "America/New_York";
  });

  afterEach(() => {
    process.env.TZ = prevTz;
  });

  it("formats Zulu timestamp as local DD/MM/YYYY and time", () => {
    const out = formatDateTime("2026-04-30T17:30:00.000Z");
    expect(out).toMatch(/^30\/04\/2026,/);
    expect(out.toLowerCase()).toContain("pm");
  });
});

describe("formatDateWithWeekday and getLocalWeekday", () => {
  it("includes weekday name and DD/MM/YYYY", () => {
    expect(formatDateWithWeekday("2026-04-30")).toContain("Thursday");
    expect(formatDateWithWeekday("2026-04-30")).toContain("30/04/2026");
    expect(getLocalWeekday("2026-04-30")).toBe("Thursday");
  });

  it("returns fallback for invalid input", () => {
    expect(getLocalWeekday(null)).toBe(DATE_DISPLAY_UNAVAILABLE);
    expect(formatDateWithWeekday("")).toBe(DATE_DISPLAY_UNAVAILABLE);
  });
});
