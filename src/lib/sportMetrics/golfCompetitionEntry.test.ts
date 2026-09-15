import {
  areAllGolfCompetitionDaysSaved,
  buildGolfCompetitionDaysPatchThrough,
  emptyGolfCompetitionDays,
  hydrateGolfCompetitionDays,
  isGolfCompetitionDayReadyToSave,
  mergeGolfCompetitionDaysAfterSave,
  savedGolfCompetitionDayNumbersFromPersisted,
  type GolfCompetitionDayForm,
  type GolfCompetitionHoleForm,
} from "@/lib/sportMetrics/golfCompetitionEntry";
import { describe, expect, it } from "vitest";

function completeHole(
  holeNumber: number,
  overrides: Partial<GolfCompetitionHoleForm> = {},
): GolfCompetitionHoleForm {
  return {
    holeNumber,
    par: "4",
    strokes: "5",
    fairwayHit: "YES",
    greenInRegulation: "false",
    putts: "2",
    penaltyStrokes: "0",
    satisfactionRating: "4",
    notes: "",
    ...overrides,
  };
}

function completeDay(
  day: GolfCompetitionDayForm,
  date: string,
  note: string,
): GolfCompetitionDayForm {
  return {
    ...day,
    date,
    holes: day.holes.map((hole) =>
      completeHole(hole.holeNumber, {
        notes: `${note} hole ${hole.holeNumber}`,
      }),
    ),
  };
}

describe("multi-day golf competition PATCH progression", () => {
  it("1-day Save Draft PATCHes only Day 1 with holes", () => {
    const days = emptyGolfCompetitionDays(1, 18);
    days[0] = completeDay(days[0]!, "2026-09-12", "Day 1");

    const payload = buildGolfCompetitionDaysPatchThrough(days, 1);
    expect(payload).toHaveLength(1);
    expect(payload[0]?.dayNumber).toBe(1);
    expect(payload[0]?.date).toBe("2026-09-12");
    expect(payload[0]?.holeResults).toHaveLength(18);
    expect(areAllGolfCompetitionDaysSaved(1, [])).toBe(false);
    expect(areAllGolfCompetitionDaysSaved(1, [1])).toBe(true);
  });

  it("2-day Day 2 save preserves Day 1 and does not enable submit until both are saved", () => {
    const days = emptyGolfCompetitionDays(2, 9);
    days[0] = completeDay(days[0]!, "2026-09-12", "Day 1");
    days[1] = completeDay(days[1]!, "2026-09-13", "Day 2");

    const day1Save = buildGolfCompetitionDaysPatchThrough(days, 1);
    expect(day1Save.map((day) => day.dayNumber)).toEqual([1]);
    expect(day1Save[0]?.holeResults).toHaveLength(9);
    expect(areAllGolfCompetitionDaysSaved(2, [1])).toBe(false);

    const day2Save = buildGolfCompetitionDaysPatchThrough(days, 2);
    expect(day2Save.map((day) => day.dayNumber)).toEqual([1, 2]);
    expect(day2Save[0]?.date).toBe("2026-09-12");
    expect(day2Save[1]?.date).toBe("2026-09-13");
    expect(day2Save[0]?.holeResults?.[0]).toMatchObject({ notes: "Day 1 hole 1" });
    expect(day2Save[1]?.holeResults?.[0]).toMatchObject({ notes: "Day 2 hole 1" });
    expect(areAllGolfCompetitionDaysSaved(2, [1, 2])).toBe(true);
  });

  it("3-day final save sends Day1 + Day2 + Day3 and submit stays unavailable until all 3 are saved", () => {
    const days = emptyGolfCompetitionDays(3, 9);
    days[0] = completeDay(days[0]!, "2026-09-12", "Day 1");
    days[1] = completeDay(days[1]!, "2026-09-13", "Day 2");
    days[2] = completeDay(days[2]!, "2026-09-14", "Day 3");

    expect(buildGolfCompetitionDaysPatchThrough(days, 1).map((day) => day.dayNumber)).toEqual([
      1,
    ]);
    expect(buildGolfCompetitionDaysPatchThrough(days, 2).map((day) => day.dayNumber)).toEqual([
      1, 2,
    ]);
    const finalSave = buildGolfCompetitionDaysPatchThrough(days, 3);
    expect(finalSave.map((day) => day.dayNumber)).toEqual([1, 2, 3]);
    expect(finalSave[2]?.holeResults).toHaveLength(9);
    expect(areAllGolfCompetitionDaysSaved(3, [1, 2])).toBe(false);
    expect(areAllGolfCompetitionDaysSaved(3, [1, 2, 3])).toBe(true);
  });

  it("does not mark a failed/incomplete day as saved", () => {
    const days = emptyGolfCompetitionDays(1, 9);
    expect(isGolfCompetitionDayReadyToSave(days[0]!, 9)).toBe(false);
    expect(areAllGolfCompetitionDaysSaved(1, [])).toBe(false);
    expect(
      savedGolfCompetitionDayNumbersFromPersisted(
        [{ dayNumber: 1, date: "2026-09-12", holeResults: [] }],
        9,
      ),
    ).toEqual([]);
  });

  it("keeps local holes when the PATCH response omits them", () => {
    const local = emptyGolfCompetitionDays(2, 9);
    local[0] = completeDay(local[0]!, "2026-09-12", "Day 1");
    const fromServer = hydrateGolfCompetitionDays({
      numberOfDays: 2,
      format: 9,
      days: [],
    });
    const merged = mergeGolfCompetitionDaysAfterSave(local, fromServer);
    expect(merged[0]?.date).toBe("2026-09-12");
    expect(merged[0]?.holes[0]?.par).toBe("4");
  });
});
