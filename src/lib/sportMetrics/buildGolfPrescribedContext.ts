export type GolfSportMetricLogMode =
  | "PRACTICE_FACILITY"
  | "SIMULATOR"
  | "ACTUAL_ROUND";

export type GolfSportMetricLogEnums = {
  metricType: "DRILL_RESULT" | "ROUND_RESULT";
  environment: string;
  source: string;
};

export function mapGolfSportMetricLogMode(
  mode: GolfSportMetricLogMode,
): GolfSportMetricLogEnums {
  switch (mode) {
    case "PRACTICE_FACILITY":
      return {
        metricType: "DRILL_RESULT",
        environment: "PRACTICE_FACILITY",
        source: "ATHLETE_MANUAL",
      };
    case "SIMULATOR":
      return {
        metricType: "DRILL_RESULT",
        environment: "SIMULATOR",
        source: "SIMULATOR_MANUAL",
      };
    case "ACTUAL_ROUND":
      return {
        metricType: "ROUND_RESULT",
        environment: "ON_COURSE",
        source: "ATHLETE_MANUAL",
      };
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export type BuildGolfPrescribedContextInput = {
  drill: Record<string, unknown>;
  itemIndex: number;
  plannedSessionId: string;
  trainingPlanVersionId: string;
  sectionKey: string;
  sessionTitle: string | null;
  dayDate: string | null;
};

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function pickString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const text = readString(record[key]);
    if (text !== null) return text;
  }
  return null;
}

function pickNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = readNumber(record[key]);
    if (value !== null) return value;
  }
  return null;
}

export function resolveGolfDrillOrder(
  drill: Record<string, unknown>,
  itemIndex: number,
): number | undefined {
  const order = pickNumber(drill, ["order", "itemOrder", "orderIndex", "index"]);
  if (order !== null && Number.isInteger(order) && order >= 1) {
    return order;
  }
  if (itemIndex >= 0) return itemIndex + 1;
  return undefined;
}

function omitUndefined(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export function buildGolfPrescribedContext(
  input: BuildGolfPrescribedContextInput,
): Record<string, unknown> {
  const drill = input.drill;
  const label =
    pickString(drill, ["label", "name", "title"]) ??
    pickString(drill, ["summary"]);
  const summary = pickString(drill, ["summary", "description", "objective"]);
  const skillCode = pickString(drill, ["skillCode", "itemType"]);
  const order = resolveGolfDrillOrder(drill, input.itemIndex);
  const reps = pickString(drill, ["reps"]);
  const durationMinutes = pickNumber(drill, ["durationMinutes"]);
  const notes = pickString(drill, ["notes"]);
  const goalId = pickString(drill, ["goalId"]);
  const trainingSessionId = pickString(drill, ["trainingSessionId"]);

  const skillArea = pickString(drill, ["skillArea", "golfTaxonomy", "taxonomy"]);
  const sportCapability = pickString(drill, ["sportCapability", "capability"]);
  const skillCategory = pickString(drill, ["skillCategory", "category"]);

  return omitUndefined({
    ...(label ? { label } : {}),
    ...(summary ? { summary } : {}),
    ...(skillCode ? { skillCode } : {}),
    ...(skillArea ? { skillArea } : {}),
    ...(sportCapability ? { sportCapability } : {}),
    ...(skillCategory ? { skillCategory } : {}),
    ...(order !== undefined ? { order } : {}),
    ...(reps ? { reps } : {}),
    ...(durationMinutes !== null ? { durationMinutes } : {}),
    ...(notes ? { notes } : {}),
    plannedSessionId: input.plannedSessionId.trim(),
    trainingPlanVersionId: input.trainingPlanVersionId.trim(),
    sectionKey: input.sectionKey.trim(),
    ...(input.sessionTitle ? { sessionTitle: input.sessionTitle.trim() } : {}),
    ...(input.dayDate ? { dayDate: input.dayDate.trim() } : {}),
    ...(goalId ? { goalId } : {}),
    ...(trainingSessionId ? { trainingSessionId } : {}),
  });
}

export type GolfSportMetricDrillFormValues = {
  attempts: string;
  successes: string;
  distanceBand: string;
  missPattern: string;
  provider: string;
  carryDistance: string;
  ballSpeed: string;
  clubSpeed: string;
  offlineDispersion: string;
  notes: string;
};

export type GolfDrillV2FormValues = {
  context: string;
  attempts: string;
  successes: string;
  qualityRating: string;
  distanceBand: string;
  targetRadius: string;
  missesLeft: string;
  missesRight: string;
  missesShort: string;
  missesLong: string;
  notes: string;
};

export type GolfSportMetricRoundFormValues = {
  holesPlayed: string;
  score: string;
  par: string;
  putts: string;
  fairwaysHit: string;
  fairwaysPossible: string;
  greensInRegulation: string;
  girPossible: string;
  penalties: string;
  notes: string;
};

function parseNonNegativeInt(raw: string, label: string): number | { error: string } {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { error: `${label} is required.` };
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
    return { error: `${label} must be a non-negative whole number.` };
  }
  return parsed;
}

function parseOptionalNonNegativeInt(
  raw: string,
  label: string,
): number | undefined | { error: string } {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
    return { error: `${label} must be a non-negative whole number.` };
  }
  return parsed;
}

function parseOptionalNonNegativeNumber(
  raw: string,
  label: string,
): number | undefined | { error: string } {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { error: `${label} must be a non-negative number.` };
  }
  return parsed;
}

function parseOptionalString(raw: string): string | undefined {
  const trimmed = raw.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function validateGolfDrillSportMetricForm(
  values: GolfSportMetricDrillFormValues,
): { ok: true; valueJson: Record<string, unknown> } | { ok: false; error: string } {
  const attempts = parseNonNegativeInt(values.attempts, "Attempts");
  if (typeof attempts === "object" && "error" in attempts) {
    return { ok: false, error: attempts.error };
  }

  const successes = parseNonNegativeInt(values.successes, "Successes");
  if (typeof successes === "object" && "error" in successes) {
    return { ok: false, error: successes.error };
  }

  if (successes > attempts) {
    return { ok: false, error: "Successes cannot exceed attempts." };
  }

  const valueJson: Record<string, unknown> = {
    attempts,
    successes,
  };

  const distanceBand = parseOptionalString(values.distanceBand);
  if (distanceBand) valueJson.distanceBand = distanceBand;

  const missPattern = parseOptionalString(values.missPattern);
  if (missPattern) valueJson.missPattern = missPattern;

  const provider = parseOptionalString(values.provider);
  if (provider) valueJson.provider = { key: provider };

  const carryDistance = parseOptionalNonNegativeNumber(
    values.carryDistance,
    "Carry distance",
  );
  if (typeof carryDistance === "object" && carryDistance && "error" in carryDistance) {
    return { ok: false, error: carryDistance.error };
  }
  if (carryDistance !== undefined) valueJson.carryDistance = carryDistance;

  const ballSpeed = parseOptionalNonNegativeNumber(values.ballSpeed, "Ball speed");
  if (typeof ballSpeed === "object" && ballSpeed && "error" in ballSpeed) {
    return { ok: false, error: ballSpeed.error };
  }
  if (ballSpeed !== undefined) valueJson.ballSpeed = ballSpeed;

  const clubSpeed = parseOptionalNonNegativeNumber(values.clubSpeed, "Club speed");
  if (typeof clubSpeed === "object" && clubSpeed && "error" in clubSpeed) {
    return { ok: false, error: clubSpeed.error };
  }
  if (clubSpeed !== undefined) valueJson.clubSpeed = clubSpeed;

  const offlineDispersion = parseOptionalNonNegativeNumber(
    values.offlineDispersion,
    "Offline dispersion",
  );
  if (
    typeof offlineDispersion === "object" &&
    offlineDispersion &&
    "error" in offlineDispersion
  ) {
    return { ok: false, error: offlineDispersion.error };
  }
  if (offlineDispersion !== undefined) {
    valueJson.offlineDispersion = offlineDispersion;
  }

  const notes = parseOptionalString(values.notes);
  if (notes) valueJson.notes = notes;

  return { ok: true, valueJson };
}

export function validateGolfRoundSportMetricForm(
  values: GolfSportMetricRoundFormValues,
): { ok: true; valueJson: Record<string, unknown> } | { ok: false; error: string } {
  const holesPlayed = parseNonNegativeInt(values.holesPlayed, "Holes played");
  if (typeof holesPlayed === "object" && "error" in holesPlayed) {
    return { ok: false, error: holesPlayed.error };
  }

  const score = parseNonNegativeInt(values.score, "Score");
  if (typeof score === "object" && "error" in score) {
    return { ok: false, error: score.error };
  }

  const par = parseNonNegativeInt(values.par, "Par");
  if (typeof par === "object" && "error" in par) {
    return { ok: false, error: par.error };
  }

  const valueJson: Record<string, unknown> = {
    holesPlayed,
    score,
    par,
  };

  const putts = parseOptionalNonNegativeInt(values.putts, "Putts");
  if (typeof putts === "object" && putts && "error" in putts) {
    return { ok: false, error: putts.error };
  }
  if (putts !== undefined) valueJson.putts = putts;

  const fairwaysHit = parseOptionalNonNegativeInt(values.fairwaysHit, "Fairways hit");
  if (typeof fairwaysHit === "object" && fairwaysHit && "error" in fairwaysHit) {
    return { ok: false, error: fairwaysHit.error };
  }
  if (fairwaysHit !== undefined) valueJson.fairwaysHit = fairwaysHit;

  const fairwaysPossible = parseOptionalNonNegativeInt(
    values.fairwaysPossible,
    "Fairways possible",
  );
  if (
    typeof fairwaysPossible === "object" &&
    fairwaysPossible &&
    "error" in fairwaysPossible
  ) {
    return { ok: false, error: fairwaysPossible.error };
  }
  if (fairwaysPossible !== undefined) valueJson.fairwaysPossible = fairwaysPossible;

  const greensInRegulation = parseOptionalNonNegativeInt(
    values.greensInRegulation,
    "Greens in regulation",
  );
  if (
    typeof greensInRegulation === "object" &&
    greensInRegulation &&
    "error" in greensInRegulation
  ) {
    return { ok: false, error: greensInRegulation.error };
  }
  if (greensInRegulation !== undefined) {
    valueJson.greensInRegulation = greensInRegulation;
  }

  const girPossible = parseOptionalNonNegativeInt(values.girPossible, "GIR possible");
  if (typeof girPossible === "object" && girPossible && "error" in girPossible) {
    return { ok: false, error: girPossible.error };
  }
  if (girPossible !== undefined) valueJson.girPossible = girPossible;

  const penalties = parseOptionalNonNegativeInt(values.penalties, "Penalties");
  if (typeof penalties === "object" && penalties && "error" in penalties) {
    return { ok: false, error: penalties.error };
  }
  if (penalties !== undefined) valueJson.penalties = penalties;

  const notes = parseOptionalString(values.notes);
  if (notes) valueJson.notes = notes;

  return { ok: true, valueJson };
}

export function validateGolfDrillV2Form(
  values: GolfDrillV2FormValues,
): { ok: true; valueJson: Record<string, unknown> } | { ok: false; error: string } {
  const attempts = parseNonNegativeInt(values.attempts, "Attempts");
  if (typeof attempts === "object" && "error" in attempts) {
    return { ok: false, error: attempts.error };
  }

  const successes = parseNonNegativeInt(values.successes, "Successes");
  if (typeof successes === "object" && "error" in successes) {
    return { ok: false, error: successes.error };
  }

  if (successes > attempts) {
    return { ok: false, error: "Successes cannot exceed attempts." };
  }

  const valueJson: Record<string, unknown> = { attempts, successes };

  const qualityRating = parseOptionalNonNegativeInt(values.qualityRating, "Quality rating");
  if (typeof qualityRating === "object" && qualityRating && "error" in qualityRating) {
    return { ok: false, error: qualityRating.error };
  }
  if (qualityRating !== undefined) {
    if (qualityRating < 1 || qualityRating > 5) {
      return { ok: false, error: "Quality rating must be between 1 and 5." };
    }
    valueJson.qualityRating = qualityRating;
  }

  const context = parseOptionalString(values.context);
  if (context) valueJson.context = context;

  const distanceBand = parseOptionalString(values.distanceBand);
  if (distanceBand) valueJson.distanceBand = distanceBand;

  const targetRadius = parseOptionalString(values.targetRadius);
  if (targetRadius) valueJson.targetRadius = targetRadius;

  const missesLeft = parseOptionalNonNegativeInt(values.missesLeft, "Misses left");
  if (typeof missesLeft === "object" && missesLeft && "error" in missesLeft) {
    return { ok: false, error: missesLeft.error };
  }
  if (missesLeft !== undefined) valueJson.missesLeft = missesLeft;

  const missesRight = parseOptionalNonNegativeInt(values.missesRight, "Misses right");
  if (typeof missesRight === "object" && missesRight && "error" in missesRight) {
    return { ok: false, error: missesRight.error };
  }
  if (missesRight !== undefined) valueJson.missesRight = missesRight;

  const missesShort = parseOptionalNonNegativeInt(values.missesShort, "Misses short");
  if (typeof missesShort === "object" && missesShort && "error" in missesShort) {
    return { ok: false, error: missesShort.error };
  }
  if (missesShort !== undefined) valueJson.missesShort = missesShort;

  const missesLong = parseOptionalNonNegativeInt(values.missesLong, "Misses long");
  if (typeof missesLong === "object" && missesLong && "error" in missesLong) {
    return { ok: false, error: missesLong.error };
  }
  if (missesLong !== undefined) valueJson.missesLong = missesLong;

  const notes = parseOptionalString(values.notes);
  if (notes) valueJson.notes = notes;

  return { ok: true, valueJson };
}

export function defaultOccurredAtForJournalDay(dayDate: string): string {
  const trimmed = dayDate.trim();
  if (trimmed === "") return new Date().toISOString();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const local = new Date(year, month, day, 12, 0, 0, 0);
    if (!Number.isNaN(local.getTime())) return local.toISOString();
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  return new Date().toISOString();
}
