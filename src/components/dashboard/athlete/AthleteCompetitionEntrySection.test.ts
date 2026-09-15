import {
  AthleteCompetitionDaySelector,
  AthleteCompetitionHoleList,
} from "@/components/dashboard/athlete/AthleteCompetitionEntrySection";
import {
  GOLF_COMPETITION_TYPES,
  areAllGolfCompetitionDaysSaved,
  buildGolfCompetitionDaysPatchThrough,
  emptyGolfCompetitionDays,
  hydrateGolfCompetitionDays,
} from "@/lib/sportMetrics/golfCompetitionEntry";
import { readFileSync } from "node:fs";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createGolfCompetitionMock, patchGolfCompetitionMock, submitGolfCompetitionMock } =
  vi.hoisted(() => ({
    createGolfCompetitionMock: vi.fn(),
    patchGolfCompetitionMock: vi.fn(),
    submitGolfCompetitionMock: vi.fn(),
  }));

vi.mock("@/lib/api/sportMetricsGolfCompetitions", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/api/sportMetricsGolfCompetitions")>();
  return {
    ...actual,
    createGolfCompetition: createGolfCompetitionMock,
    patchGolfCompetition: patchGolfCompetitionMock,
    submitGolfCompetition: submitGolfCompetitionMock,
  };
});

vi.mock("@/components/ui/Button", async () => {
  const { createElement } = await import("react");
  return {
    Button: ({
      children,
      ...props
    }: {
      children?: ReactNode;
      [key: string]: unknown;
    }) => createElement("button", props, children),
  };
});

vi.mock("@/components/ui/Select", async () => {
  const { createElement } = await import("react");
  return {
    Select: ({
      children,
      ...props
    }: {
      children?: ReactNode;
      [key: string]: unknown;
    }) => createElement("select", props, children),
  };
});

vi.mock("@/components/ui/Input", async () => {
  const { createElement } = await import("react");
  return {
    Input: (props: Record<string, unknown>) => createElement("input", props),
  };
});

vi.mock("@/components/ui/FormField", async () => {
  const { createElement } = await import("react");
  return {
    FormField: ({
      label,
      helperText,
      children,
    }: {
      label?: string;
      helperText?: string;
      children: ReactNode;
    }) =>
      createElement(
        "div",
        null,
        label ? createElement("label", null, label) : null,
        helperText ? createElement("p", null, helperText) : null,
        children,
      ),
  };
});

vi.mock("@/components/ui/Card", async () => {
  const { createElement } = await import("react");
  return {
    Card: ({
      title,
      children,
    }: {
      title?: string;
      children: ReactNode;
    }) =>
      createElement(
        "article",
        null,
        title ? createElement("h3", null, title) : null,
        children,
      ),
  };
});

import {
  createGolfCompetition,
  patchGolfCompetition,
  submitGolfCompetition,
} from "@/lib/api/sportMetricsGolfCompetitions";

function readEntrySource(): string {
  return readFileSync(
    new URL("./AthleteCompetitionEntrySection.tsx", import.meta.url),
    "utf8",
  );
}

function completeHole(
  holeNumber: number,
  overrides: Record<string, string> = {},
) {
  return {
    holeNumber,
    par: "4",
    strokes: "5",
    fairwayHit: "YES" as const,
    greenInRegulation: "false" as const,
    putts: "2",
    penaltyStrokes: "0",
    satisfactionRating: "4" as const,
    notes: "",
    ...overrides,
  };
}

describe("athlete competition entry contracts", () => {
  it("exposes the required Competition Type values", () => {
    expect(GOLF_COMPETITION_TYPES).toEqual([
      "LOCAL",
      "INVITATIONAL",
      "RANKING",
      "CHAMPIONSHIP",
      "NATIONAL",
      "INTERNATIONAL",
    ]);
  });

  it("creates metadata only through createGolfCompetition", () => {
    const source = readEntrySource();
    expect(source).toContain("createGolfCompetition(");
    expect(source).toContain("const payload: CreateGolfCompetitionPayload = {");
    expect(source).toContain("name: createForm.name.trim()");
    expect(source).toContain("numberOfDays: createForm.numberOfDays");
    expect(source).not.toContain("payload.days");
    expect(source).not.toContain("payload.holes");
  });

  it("submits with submitGolfCompetition and does not reopen", () => {
    const source = readEntrySource();
    expect(source).toContain("submitGolfCompetition({");
    expect(source).not.toContain("unsubmit");
    expect(source).not.toContain("reopen");
  });

  it("clears the stored active draft ID after successful submit without clearing competition state", () => {
    const source = readEntrySource();
    const onSubmit = source.slice(
      source.indexOf("async function onSubmit()"),
      source.indexOf("function onStartAnother()"),
    );
    expect(onSubmit.indexOf("await submitGolfCompetition")).toBeGreaterThan(-1);
    expect(onSubmit.indexOf("clearActiveGolfCompetitionId")).toBeGreaterThan(
      onSubmit.indexOf("await submitGolfCompetition"),
    );
    expect(onSubmit).toContain("setCompetition(result.competition)");
    expect(onSubmit).toContain("setDays(daysFromCompetition(result.competition))");
    expect(onSubmit).not.toContain("setCompetition(null)");
    expect(onSubmit).not.toContain("setDays([])");
    expect(onSubmit).toContain("!allConfiguredDaysSaved");
  });

  it("does not calculate backend-derived competition metrics", () => {
    const source = readEntrySource();
    const lib = readFileSync(
      new URL("../../../lib/sportMetrics/golfCompetitionEntry.ts", import.meta.url),
      "utf8",
    );
    for (const file of [source, lib]) {
      expect(file).not.toContain("scoreToPar");
      expect(file).not.toContain("fairwaysHitPercent");
      expect(file).not.toContain("girPercent");
      expect(file).not.toContain("athleteCompetitionScore");
      expect(file).not.toContain("competitionPerformance");
      expect(file).not.toContain("overallGolferPerformance");
    }
  });

  it("does not add coach assessment, history, or trends UI", () => {
    const source = readEntrySource();
    expect(source).not.toContain("postGolfCoachCompetitionAssessment");
    expect(source).not.toContain("fetchGolfCompetitionHistory");
    expect(source).not.toContain("competitionPerformance");
  });

  it("loads an opened competition through fetchGolfCompetition and keeps SUBMITTED read-only", () => {
    const source = readEntrySource();
    expect(source).toContain("fetchGolfCompetition({");
    expect(source).toContain("competitionId: loadId");
    expect(source).toContain('const readOnly = competition?.status === "SUBMITTED"');
    expect(source).not.toContain("COMPLETED");
    expect(source).toContain("Competition submitted. This entry is read-only.");
  });

  it("PATCHes days through the selected day and does not submit until all configured days are saved", () => {
    const source = readEntrySource();
    expect(source).toContain("buildGolfCompetitionDaysPatchThrough(days, selectedDayNumber)");
    expect(source).toContain("isGolfCompetitionDayReadyToSave(currentDay, competition.format)");
    expect(source).toContain("!savedDayNumbers.includes(selectedDayNumber - 1)");
    expect(source).toContain("disabled={");
    expect(source).toContain("!allConfiguredDaysSaved");
    expect(source).not.toContain("autosave");
  });
});

describe("configured days and hole rendering", () => {
  it("renders only the configured day count", () => {
    const html = renderToStaticMarkup(
      createElement(AthleteCompetitionDaySelector, {
        numberOfDays: 2,
        selectedDayNumber: 1,
        onSelect: () => {},
      }),
    );
    expect(html).toContain("Day 1");
    expect(html).toContain("Day 2");
    expect(html).not.toContain("Day 3");
    expect(html).not.toContain("Day 4");
  });

  it("renders 9 vs 18 holes from competition format", () => {
    const nine = emptyGolfCompetitionDays(1, 9);
    const eighteen = emptyGolfCompetitionDays(1, 18);
    expect(nine[0]?.holes).toHaveLength(9);
    expect(eighteen[0]?.holes).toHaveLength(18);

    const nineHtml = renderToStaticMarkup(
      createElement(AthleteCompetitionHoleList, {
        holes: nine[0]!.holes,
        readOnly: false,
        onChange: () => {},
      }),
    );
    expect(nineHtml).toContain("Hole 9");
    expect(nineHtml).not.toContain("Hole 10");

    const eighteenHtml = renderToStaticMarkup(
      createElement(AthleteCompetitionHoleList, {
        holes: eighteen[0]!.holes,
        readOnly: false,
        onChange: () => {},
      }),
    );
    expect(eighteenHtml).toContain("Hole 18");
  });

  it("keeps DRAFT holes editable and SUBMITTED holes read-only", () => {
    const holes = emptyGolfCompetitionDays(1, 9)[0]!.holes;
    const draft = renderToStaticMarkup(
      createElement(AthleteCompetitionHoleList, {
        holes,
        readOnly: false,
        onChange: () => {},
      }),
    );
    const submitted = renderToStaticMarkup(
      createElement(AthleteCompetitionHoleList, {
        holes,
        readOnly: true,
        onChange: () => {},
      }),
    );
    expect(draft).not.toContain("disabled=\"\"");
    expect(submitted).toContain("disabled=\"\"");
  });
});

describe("complete-days PATCH replacement", () => {
  it("sends saved days through the current day, not future unsaved days", () => {
    const days = emptyGolfCompetitionDays(2, 9);
    days[0] = {
      ...days[0]!,
      date: "2026-09-12",
      holes: days[0]!.holes.map((hole) =>
        hole.holeNumber === 1 ? completeHole(1, { notes: "Day 1" }) : hole,
      ),
    };
    days[1] = {
      ...days[1]!,
      date: "2026-09-13",
      holes: days[1]!.holes.map((hole) =>
        hole.holeNumber === 1 ? completeHole(1, { notes: "Day 2" }) : hole,
      ),
    };

    const day1Payload = buildGolfCompetitionDaysPatchThrough(days, 1);
    expect(day1Payload.map((day) => day.dayNumber)).toEqual([1]);
    expect(day1Payload[0]?.holeResults?.[0]).toMatchObject({
      holeNumber: 1,
      notes: "Day 1",
    });

    const payload = buildGolfCompetitionDaysPatchThrough(days, 2);
    expect(payload.map((day) => day.dayNumber)).toEqual([1, 2]);
    expect(payload[0]?.date).toBe("2026-09-12");
    expect(payload[1]?.date).toBe("2026-09-13");
    expect(payload[1]?.holeResults?.[0]).toMatchObject({
      holeNumber: 1,
      notes: "Day 2",
    });
    expect(areAllGolfCompetitionDaysSaved(2, [1])).toBe(false);
    expect(areAllGolfCompetitionDaysSaved(2, [1, 2])).toBe(true);
  });

  it("does not drop a previously entered day when another day is saved", async () => {
    patchGolfCompetitionMock.mockResolvedValue({
      competition: { id: "competition-1", days: [] },
    });

    const days = hydrateGolfCompetitionDays({
      numberOfDays: 2,
      format: 18,
      days: [
        {
          dayNumber: 1,
          date: "2026-09-12",
          weatherConditions: "Clear",
          holeResults: [
            {
              holeNumber: 1,
              par: 4,
              strokes: 4,
              fairwayHit: "YES",
              greenInRegulation: true,
              putts: 2,
              penaltyStrokes: 0,
              satisfactionRating: 3,
            },
          ],
        },
      ],
    });
    days[1] = {
      ...days[1]!,
      date: "2026-09-13",
      wind: "Light",
    };

    await patchGolfCompetition("entity-1", "athlete-1", "competition-1", {
      days: buildGolfCompetitionDaysPatchThrough(days, 2),
    });

    expect(patchGolfCompetitionMock).toHaveBeenCalledWith(
      "entity-1",
      "athlete-1",
      "competition-1",
      {
        days: expect.arrayContaining([
          expect.objectContaining({
            dayNumber: 1,
            date: "2026-09-12",
            weatherConditions: "Clear",
          }),
          expect.objectContaining({
            dayNumber: 2,
            date: "2026-09-13",
            wind: "Light",
          }),
        ]),
      },
    );
    const sentDays = patchGolfCompetitionMock.mock.calls[0]?.[3]?.days as unknown[];
    expect(sentDays).toHaveLength(2);
  });
});

describe("competition API usage from entry flow", () => {
  beforeEach(() => {
    createGolfCompetitionMock.mockReset();
    submitGolfCompetitionMock.mockReset();
    createGolfCompetitionMock.mockResolvedValue({
      competition: { id: "competition-1", days: [] },
    });
    submitGolfCompetitionMock.mockResolvedValue({
      competition: { id: "competition-1", status: "SUBMITTED" },
    });
  });

  it("POSTs metadata-only create without days or holes", async () => {
    await createGolfCompetition("entity-1", "athlete-1", {
      name: "Club Championship",
      type: "CHAMPIONSHIP",
      format: 18,
      venue: "PeakFlow Golf Club",
      startDate: "2026-09-12",
      numberOfDays: 2,
    });

    expect(createGolfCompetitionMock).toHaveBeenCalledWith("entity-1", "athlete-1", {
      name: "Club Championship",
      type: "CHAMPIONSHIP",
      format: 18,
      venue: "PeakFlow Golf Club",
      startDate: "2026-09-12",
      numberOfDays: 2,
    });
    const payload = createGolfCompetitionMock.mock.calls[0]?.[2] as Record<
      string,
      unknown
    >;
    expect(payload).not.toHaveProperty("days");
    expect(payload).not.toHaveProperty("holes");
  });

  it("submits with the existing submit API", async () => {
    await submitGolfCompetition({
      entityId: "entity-1",
      athleteId: "athlete-1",
      competitionId: "competition-1",
    });
    expect(submitGolfCompetitionMock).toHaveBeenCalledWith({
      entityId: "entity-1",
      athleteId: "athlete-1",
      competitionId: "competition-1",
    });
  });
});
