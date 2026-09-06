import { normalizeDateOnlyKey } from "@/lib/dateTime";
import type {
  GolfCompetitionDayInput,
  GolfCompetitionFairwayHit,
  GolfCompetitionFormat,
  GolfCompetitionHoleInput,
  GolfCompetitionSatisfactionRating,
  GolfCompetitionType,
} from "@/lib/api/sportMetricsGolfCompetitions";

export const GOLF_COMPETITION_TYPES: GolfCompetitionType[] = [
  "LOCAL",
  "INVITATIONAL",
  "RANKING",
  "CHAMPIONSHIP",
  "NATIONAL",
  "INTERNATIONAL",
];

export const GOLF_COMPETITION_FORMATS: GolfCompetitionFormat[] = [9, 18];

export const GOLF_COMPETITION_DAY_COUNTS = [1, 2, 3, 4] as const;

export const GOLF_COMPETITION_FAIRWAY_OPTIONS: Array<{
  value: GolfCompetitionFairwayHit;
  label: string;
}> = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
  { value: "NA", label: "N/A" },
];

export const GOLF_COMPETITION_SATISFACTION_OPTIONS: Array<{
  value: GolfCompetitionSatisfactionRating;
  label: string;
}> = [
  { value: 1, label: "1 — Very dissatisfied" },
  { value: 2, label: "2 — Dissatisfied" },
  { value: 3, label: "3 — Okay" },
  { value: 4, label: "4 — Satisfied" },
  { value: 5, label: "5 — Very satisfied" },
];

export type GolfCompetitionHoleForm = {
  holeNumber: number;
  par: string;
  strokes: string;
  fairwayHit: GolfCompetitionFairwayHit | "";
  greenInRegulation: "" | "true" | "false";
  putts: string;
  penaltyStrokes: string;
  satisfactionRating: "" | "1" | "2" | "3" | "4" | "5";
  notes: string;
};

export type GolfCompetitionDayForm = {
  dayNumber: number;
  date: string;
  weatherConditions: string;
  wind: string;
  courseConditions: string;
  dayNotes: string;
  holes: GolfCompetitionHoleForm[];
};

function storageKey(entityId: string, athleteId: string): string {
  return `peakflow.golfCompetitionDraftId.${entityId}.${athleteId}`;
}

export function readActiveGolfCompetitionId(
  entityId: string,
  athleteId: string,
): string | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(storageKey(entityId, athleteId));
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}

export function writeActiveGolfCompetitionId(
  entityId: string,
  athleteId: string,
  competitionId: string,
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(entityId, athleteId), competitionId);
}

export function clearActiveGolfCompetitionId(
  entityId: string,
  athleteId: string,
): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(entityId, athleteId));
}

export function emptyGolfCompetitionHoleForm(
  holeNumber: number,
): GolfCompetitionHoleForm {
  return {
    holeNumber,
    par: "",
    strokes: "",
    fairwayHit: "",
    greenInRegulation: "",
    putts: "",
    penaltyStrokes: "",
    satisfactionRating: "",
    notes: "",
  };
}

export function emptyGolfCompetitionDays(
  numberOfDays: number,
  format: GolfCompetitionFormat,
): GolfCompetitionDayForm[] {
  const dayCount = GOLF_COMPETITION_DAY_COUNTS.includes(
    numberOfDays as (typeof GOLF_COMPETITION_DAY_COUNTS)[number],
  )
    ? numberOfDays
    : 1;
  const holeCount = format === 9 ? 9 : 18;
  return Array.from({ length: dayCount }, (_, index) => ({
    dayNumber: index + 1,
    date: "",
    weatherConditions: "",
    wind: "",
    courseConditions: "",
    dayNotes: "",
    holes: Array.from({ length: holeCount }, (__, holeIndex) =>
      emptyGolfCompetitionHoleForm(holeIndex + 1),
    ),
  }));
}

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseInteger(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  return parsed;
}

function holeInputFromForm(
  hole: GolfCompetitionHoleForm,
): GolfCompetitionHoleInput | null {
  const par = parseInteger(hole.par);
  const strokes = parseInteger(hole.strokes);
  const putts = parseInteger(hole.putts);
  const penaltyStrokes = parseInteger(hole.penaltyStrokes);
  if (
    par === null ||
    strokes === null ||
    putts === null ||
    penaltyStrokes === null ||
    hole.fairwayHit === "" ||
    hole.greenInRegulation === "" ||
    hole.satisfactionRating === ""
  ) {
    return null;
  }

  const input: GolfCompetitionHoleInput = {
    holeNumber: hole.holeNumber,
    par,
    strokes,
    fairwayHit: hole.fairwayHit,
    greenInRegulation: hole.greenInRegulation === "true",
    putts,
    penaltyStrokes,
    satisfactionRating: Number(hole.satisfactionRating) as GolfCompetitionSatisfactionRating,
  };
  if (hole.notes.trim() !== "") {
    input.notes = hole.notes.trim();
  }
  return input;
}

export function buildGolfCompetitionDaysPatch(
  days: GolfCompetitionDayForm[],
): GolfCompetitionDayInput[] {
  return days.map((day) => {
    const payload: GolfCompetitionDayInput = {
      dayNumber: day.dayNumber,
      date: day.date.trim(),
      weatherConditions: optionalText(day.weatherConditions),
      wind: optionalText(day.wind),
      courseConditions: optionalText(day.courseConditions),
      dayNotes: optionalText(day.dayNotes),
      holeResults: day.holes
        .map(holeInputFromForm)
        .filter((hole): hole is GolfCompetitionHoleInput => hole !== null),
    };
    return payload;
  });
}

type PersistedHole = {
  holeNumber: number;
  par: number;
  strokes: number;
  fairwayHit: GolfCompetitionFairwayHit;
  greenInRegulation: boolean;
  putts: number;
  penaltyStrokes: number;
  satisfactionRating: number;
  notes?: string | null;
};

type PersistedDay = {
  dayNumber: number;
  date: string;
  weatherConditions?: string | null;
  wind?: string | null;
  courseConditions?: string | null;
  dayNotes?: string | null;
  holeResults?: PersistedHole[];
};

export function hydrateGolfCompetitionDays(params: {
  numberOfDays: number;
  format: GolfCompetitionFormat;
  days: PersistedDay[] | undefined;
}): GolfCompetitionDayForm[] {
  const next = emptyGolfCompetitionDays(params.numberOfDays, params.format);
  const persisted = params.days ?? [];
  for (const formDay of next) {
    const saved = persisted.find((day) => day.dayNumber === formDay.dayNumber);
    if (!saved) continue;
    formDay.date = normalizeDateOnlyKey(saved.date) ?? "";
    formDay.weatherConditions = saved.weatherConditions ?? "";
    formDay.wind = saved.wind ?? "";
    formDay.courseConditions = saved.courseConditions ?? "";
    formDay.dayNotes = saved.dayNotes ?? "";
    for (const hole of formDay.holes) {
      const savedHole = saved.holeResults?.find(
        (item) => item.holeNumber === hole.holeNumber,
      );
      if (!savedHole) continue;
      hole.par = String(savedHole.par);
      hole.strokes = String(savedHole.strokes);
      hole.fairwayHit = savedHole.fairwayHit;
      hole.greenInRegulation = savedHole.greenInRegulation ? "true" : "false";
      hole.putts = String(savedHole.putts);
      hole.penaltyStrokes = String(savedHole.penaltyStrokes);
      hole.satisfactionRating = String(
        savedHole.satisfactionRating,
      ) as GolfCompetitionHoleForm["satisfactionRating"];
      hole.notes = savedHole.notes ?? "";
    }
  }
  return next;
}
