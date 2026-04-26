import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest, type NormalizedApiError } from "@/lib/apiClient";

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as AnyRecord;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function extractList(value: unknown, keys: string[]): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  if (!record) return [];
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

export type SeasonCycleSummary = {
  id: string;
  seasonCycleId: string;
  entityId: string | null;
  sport: string | null;
  year: number | null;
  name: string | null;
  startDate: string | null;
  endDate: string | null;
  phases: SeasonPhaseSummary[];
};

export type SeasonPhaseSummary = {
  phaseId: string | null;
  seasonCycleId: string | null;
  phase: string | null;
  startDate: string | null;
  endDate: string | null;
};

export type GoalSummary = {
  goalId: string;
  athleteId: string | null;
  entityId: string | null;
  seasonCycleId: string | null;
  status: string | null;
  goalType: string | null;
  competitionEventId: string | null;
  startDate: string | null;
  targetDate: string | null;
};

function parseSeasonCycle(value: unknown): SeasonCycleSummary | null {
  const record = asRecord(value);
  if (!record) return null;
  const seasonCycleId =
    readString(record.seasonCycleId) ?? readString(record.id) ?? null;
  if (!seasonCycleId) return null;
  return {
    id: seasonCycleId,
    seasonCycleId,
    entityId: readString(record.entityId),
    sport: readString(record.sport),
    year: readNumber(record.year),
    name: readString(record.name),
    startDate: readString(record.startDate),
    endDate: readString(record.endDate),
    phases: extractList(record, ["phases"])
      .map(parseSeasonPhase)
      .filter((item): item is SeasonPhaseSummary => item !== null),
  };
}

function parseSeasonPhase(value: unknown): SeasonPhaseSummary | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    phaseId: readString(record.phaseId) ?? readString(record.id),
    seasonCycleId: readString(record.seasonCycleId),
    phase: readString(record.phase),
    startDate: readString(record.startDate),
    endDate: readString(record.endDate),
  };
}

function parseGoal(value: unknown): GoalSummary | null {
  const record = asRecord(value);
  if (!record) return null;
  const goalId = readString(record.goalId) ?? readString(record.id) ?? null;
  if (!goalId) return null;
  return {
    goalId,
    athleteId: readString(record.athleteId),
    entityId: readString(record.entityId),
    seasonCycleId: readString(record.seasonCycleId),
    status: readString(record.status),
    goalType: readString(record.goalType),
    competitionEventId: readString(record.competitionEventId),
    startDate: readString(record.startDate),
    targetDate: readString(record.targetDate),
  };
}

function requireNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (trimmed === "") {
    throw {
      message: `${field} is required`,
      status: 400,
      code: "REQUIRED_FIELD_MISSING",
    } satisfies NormalizedApiError;
  }
  return trimmed;
}

export async function fetchSeasonCyclesForEntity(
  entityId: string,
): Promise<SeasonCycleSummary[]> {
  const id = requireNonEmpty(entityId, "entityId");
  const raw = await apiRequest(paths.seasonCycles.byEntity(id), {
    method: "GET",
    cache: "no-store",
  });
  const data = Array.isArray(raw) ? raw : adaptBackendSuccess(raw);
  return extractList(data, ["seasonCycles", "items"])
    .map(parseSeasonCycle)
    .filter((item): item is SeasonCycleSummary => item !== null);
}

export async function createSeasonCycle(input: {
  entityId: string;
  sport: string;
  year: number;
  name: string;
  startDate: string;
  endDate: string;
}): Promise<SeasonCycleSummary> {
  const raw = await apiRequest(paths.seasonCycles.root, {
    method: "POST",
    body: JSON.stringify({
      entityId: requireNonEmpty(input.entityId, "entityId"),
      sport: requireNonEmpty(input.sport, "sport"),
      year: input.year,
      name: requireNonEmpty(input.name, "name"),
      startDate: requireNonEmpty(input.startDate, "startDate"),
      endDate: requireNonEmpty(input.endDate, "endDate"),
    }),
  });
  const parsed = parseSeasonCycle(adaptBackendSuccess(raw));
  if (!parsed) {
    throw {
      message: "Season cycle was created, but the response did not include an ID.",
      status: 500,
      code: "SEASON_CYCLE_CREATE_INVALID",
    } satisfies NormalizedApiError;
  }
  return parsed;
}

export async function updateSeasonCycle(
  seasonCycleId: string,
  input: {
    name?: string;
    year?: number;
    startDate?: string;
    endDate?: string;
  },
): Promise<SeasonCycleSummary> {
  const body: Record<string, unknown> = {};
  if (typeof input.name === "string" && input.name.trim() !== "") {
    body.name = input.name.trim();
  }
  if (typeof input.year === "number" && Number.isFinite(input.year)) {
    body.year = input.year;
  }
  if (typeof input.startDate === "string" && input.startDate.trim() !== "") {
    body.startDate = input.startDate.trim();
  }
  if (typeof input.endDate === "string" && input.endDate.trim() !== "") {
    body.endDate = input.endDate.trim();
  }
  if (Object.keys(body).length === 0) {
    throw {
      message: "At least one season field must be changed.",
      status: 400,
      code: "SEASON_CYCLE_UPDATE_EMPTY",
    } satisfies NormalizedApiError;
  }

  const raw = await apiRequest(paths.seasonCycles.byId(requireNonEmpty(seasonCycleId, "seasonCycleId")), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const parsed = parseSeasonCycle(adaptBackendSuccess(raw));
  if (!parsed) {
    throw {
      message: "Season cycle was updated, but the response did not include an ID.",
      status: 500,
      code: "SEASON_CYCLE_UPDATE_INVALID",
    } satisfies NormalizedApiError;
  }
  return parsed;
}

export async function createSeasonCyclePhase(input: {
  seasonCycleId: string;
  phase: "OFF_SEASON" | "PRE_SEASON" | "IN_SEASON";
  startDate: string;
  endDate: string;
}): Promise<SeasonPhaseSummary> {
  const raw = await apiRequest(paths.seasonCycles.phase, {
    method: "POST",
    body: JSON.stringify({
      seasonCycleId: requireNonEmpty(input.seasonCycleId, "seasonCycleId"),
      phase: input.phase,
      startDate: requireNonEmpty(input.startDate, "startDate"),
      endDate: requireNonEmpty(input.endDate, "endDate"),
    }),
  });
  const parsed = parseSeasonPhase(adaptBackendSuccess(raw));
  if (!parsed) {
    throw {
      message: "Season phase was created, but the response did not include phase details.",
      status: 500,
      code: "SEASON_PHASE_CREATE_INVALID",
    } satisfies NormalizedApiError;
  }
  return parsed;
}

export async function updateSeasonCyclePhase(
  phaseId: string,
  input: {
    startDate?: string;
    endDate?: string;
  },
): Promise<SeasonPhaseSummary> {
  const body: Record<string, unknown> = {};
  if (typeof input.startDate === "string" && input.startDate.trim() !== "") {
    body.startDate = input.startDate.trim();
  }
  if (typeof input.endDate === "string" && input.endDate.trim() !== "") {
    body.endDate = input.endDate.trim();
  }
  if (Object.keys(body).length === 0) {
    throw {
      message: "At least one phase field must be changed.",
      status: 400,
      code: "SEASON_PHASE_UPDATE_EMPTY",
    } satisfies NormalizedApiError;
  }

  const raw = await apiRequest(paths.seasonCycles.phaseById(requireNonEmpty(phaseId, "phaseId")), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const parsed = parseSeasonPhase(adaptBackendSuccess(raw));
  if (!parsed) {
    throw {
      message: "Season phase was updated, but the response did not include phase details.",
      status: 500,
      code: "SEASON_PHASE_UPDATE_INVALID",
    } satisfies NormalizedApiError;
  }
  return parsed;
}

export async function fetchSeasonCyclePhases(
  seasonCycleId: string,
): Promise<SeasonPhaseSummary[]> {
  const id = requireNonEmpty(seasonCycleId, "seasonCycleId");
  const raw = await apiRequest(paths.seasonCycles.phases(id), {
    method: "GET",
    cache: "no-store",
  });
  const data = adaptBackendSuccess(raw);
  return extractList(data, ["phases", "items"])
    .map(parseSeasonPhase)
    .filter((item): item is SeasonPhaseSummary => item !== null);
}

export async function fetchGoalsForAthlete(athleteId: string): Promise<GoalSummary[]> {
  const id = requireNonEmpty(athleteId, "athleteId");
  const raw = await apiRequest(paths.goals.byAthlete(id), {
    method: "GET",
    cache: "no-store",
  });
  const data = adaptBackendSuccess(raw);
  return extractList(data, ["goals", "items"])
    .map(parseGoal)
    .filter((item): item is GoalSummary => item !== null);
}

export async function createGoal(input: {
  athleteId: string;
  entityId: string;
  seasonCycleId: string;
  createdByCoachId: string;
  goalType: "PERFORMANCE" | "COMPETITION";
  competitionEventId?: string;
  metricId?: string;
  baselineValue?: number;
  targetValue?: number;
  startDate: string;
  targetDate?: string;
}): Promise<GoalSummary> {
  const body: Record<string, unknown> = {
    athleteId: requireNonEmpty(input.athleteId, "athleteId"),
    entityId: requireNonEmpty(input.entityId, "entityId"),
    seasonCycleId: requireNonEmpty(input.seasonCycleId, "seasonCycleId"),
    createdByCoachId: requireNonEmpty(input.createdByCoachId, "createdByCoachId"),
    goalType: input.goalType,
    startDate: requireNonEmpty(input.startDate, "startDate"),
  };
  if (input.goalType === "COMPETITION") {
    body.competitionEventId = requireNonEmpty(
      input.competitionEventId ?? "",
      "competitionEventId",
    );
  }
  if (input.goalType === "PERFORMANCE") {
    body.metricId = requireNonEmpty(input.metricId ?? "", "metricId");
  }
  if (typeof input.baselineValue === "number") body.baselineValue = input.baselineValue;
  if (typeof input.targetValue === "number") body.targetValue = input.targetValue;
  if (typeof input.targetDate === "string" && input.targetDate.trim() !== "") {
    body.targetDate = input.targetDate.trim();
  }

  const raw = await apiRequest(paths.goals.root, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const parsed = parseGoal(adaptBackendSuccess(raw));
  if (!parsed) {
    throw {
      message: "Goal was created, but the response did not include a goal ID.",
      status: 500,
      code: "GOAL_CREATE_INVALID",
    } satisfies NormalizedApiError;
  }
  return parsed;
}
