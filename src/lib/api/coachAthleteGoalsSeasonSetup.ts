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
  seasonPhaseId: string | null;
  domain: "SKILLS" | "S_AND_C" | "NUTRITION" | null;
  status: string | null;
  goalType: string | null;
  goalName: string | null;
  successCriteria: string | null;
  goalCategory: string | null;
  priority: string | null;
  competitionEventId: string | null;
  targetValue: number | null;
  startDate: string | null;
  targetDate: string | null;
};

export type GoalPriority = "LOW" | "MEDIUM" | "HIGH";
export type GoalLibraryAthleteLevel =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "ELITE";
export type GoalLibraryDomain = "SKILLS" | "S_AND_C" | "NUTRITION";
export type GoalSourceType = "CUSTOM" | "LIBRARY";

export type GoalLibraryItem = {
  libraryGoalId: string;
  goalName: string;
  goalType: string;
  goalCategory: string;
  domain?: GoalLibraryDomain | null;
  defaultDomain?: GoalLibraryDomain | null;
  categoryKey: string;
  categoryLabel: string;
  taxonomyAreaKey: string;
  athleteLevel: GoalLibraryAthleteLevel;
  seasonPhases: string[];
  successCriteria: string[];
  metricsToWatch: string[];
  capabilityCodes: string[];
  recommendedDomains?: GoalLibraryDomain[];
};

export type GoalLibraryCategory = {
  categoryKey: string;
  categoryLabel: string;
  levels: Record<GoalLibraryAthleteLevel, GoalLibraryItem[]>;
};

export type GoalLibraryResponse = {
  sportCode: string;
  providerKey: string;
  version: string;
  categories: GoalLibraryCategory[];
};

export type GoalLibrarySnapshot = {
  goalName: string;
  categoryLabel: string;
  successCriteria: string[];
  metricsToWatch: string[];
  capabilityCodes: string[];
  recommendedDomains?: GoalLibraryDomain[];
  seasonPhases: string[];
};

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.reduce<string[]>((acc, item) => {
    const parsed = readString(item);
    if (parsed) acc.push(parsed);
    return acc;
  }, []);
}

function readGoalLibraryDomain(
  value: unknown,
): GoalLibraryDomain | null {
  const parsed = readString(value);
  return parsed === "SKILLS" || parsed === "S_AND_C" || parsed === "NUTRITION"
    ? parsed
    : null;
}

function readGoalLibraryDomainList(value: unknown): GoalLibraryDomain[] {
  if (!Array.isArray(value)) return [];
  return value.reduce<GoalLibraryDomain[]>((acc, item) => {
    const parsed = readGoalLibraryDomain(item);
    if (parsed) acc.push(parsed);
    return acc;
  }, []);
}

function readGoalLibraryAthleteLevel(
  value: unknown,
): GoalLibraryAthleteLevel | null {
  const parsed = readString(value);
  return parsed === "BEGINNER" ||
    parsed === "INTERMEDIATE" ||
    parsed === "ADVANCED" ||
    parsed === "ELITE"
    ? parsed
    : null;
}

function emptyGoalLibraryLevels(): Record<GoalLibraryAthleteLevel, GoalLibraryItem[]> {
  return {
    BEGINNER: [],
    INTERMEDIATE: [],
    ADVANCED: [],
    ELITE: [],
  };
}

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
  const domain = readString(record.domain);
  return {
    goalId,
    athleteId: readString(record.athleteId),
    entityId: readString(record.entityId),
    seasonCycleId: readString(record.seasonCycleId),
    seasonPhaseId: readString(record.seasonPhaseId),
    domain:
      domain === "SKILLS" || domain === "S_AND_C" || domain === "NUTRITION"
        ? domain
        : null,
    status: readString(record.status),
    goalType: readString(record.goalType),
    goalName: readString(record.goalName),
    successCriteria: readString(record.successCriteria),
    goalCategory: readString(record.goalCategory),
    priority: readString(record.priority),
    competitionEventId: readString(record.competitionEventId),
    targetValue: readNumber(record.targetValue),
    startDate: readString(record.startDate),
    targetDate: readString(record.targetDate),
  };
}

function parseGoalLibraryItem(value: unknown): GoalLibraryItem | null {
  const record = asRecord(value);
  if (!record) return null;
  const libraryGoalId = readString(record.libraryGoalId);
  const goalName = readString(record.goalName);
  const goalType = readString(record.goalType);
  const goalCategory = readString(record.goalCategory);
  const categoryKey = readString(record.categoryKey);
  const categoryLabel = readString(record.categoryLabel);
  const taxonomyAreaKey = readString(record.taxonomyAreaKey);
  const athleteLevel = readGoalLibraryAthleteLevel(record.athleteLevel);
  if (
    !libraryGoalId ||
    !goalName ||
    !goalType ||
    !goalCategory ||
    !categoryKey ||
    !categoryLabel ||
    !taxonomyAreaKey ||
    !athleteLevel
  ) {
    return null;
  }

  return {
    libraryGoalId,
    goalName,
    goalType,
    goalCategory,
    domain: readGoalLibraryDomain(record.domain),
    defaultDomain: readGoalLibraryDomain(record.defaultDomain),
    categoryKey,
    categoryLabel,
    taxonomyAreaKey,
    athleteLevel,
    seasonPhases: readStringArray(record.seasonPhases),
    successCriteria: readStringArray(record.successCriteria),
    metricsToWatch: readStringArray(record.metricsToWatch),
    capabilityCodes: readStringArray(record.capabilityCodes),
    recommendedDomains: readGoalLibraryDomainList(record.recommendedDomains),
  };
}

function parseGoalLibraryCategory(value: unknown): GoalLibraryCategory | null {
  const record = asRecord(value);
  if (!record) return null;
  const categoryKey = readString(record.categoryKey);
  const categoryLabel = readString(record.categoryLabel);
  const levelsRecord = asRecord(record.levels);
  if (!categoryKey || !categoryLabel || !levelsRecord) return null;

  const levels = emptyGoalLibraryLevels();
  for (const levelKey of Object.keys(levels) as GoalLibraryAthleteLevel[]) {
    const items = Array.isArray(levelsRecord[levelKey]) ? levelsRecord[levelKey] : [];
    levels[levelKey] = items
      .map(parseGoalLibraryItem)
      .filter((item): item is GoalLibraryItem => item !== null);
  }

  return {
    categoryKey,
    categoryLabel,
    levels,
  };
}

function parseGoalLibraryResponse(value: unknown): GoalLibraryResponse {
  const data = adaptBackendSuccess(value);
  const record = asRecord(data);
  if (!record) {
    throw {
      message: "Goal library response must be an object.",
      status: 500,
      code: "GOAL_LIBRARY_INVALID",
    } satisfies NormalizedApiError;
  }

  const categories = extractList(record, ["categories"])
    .map(parseGoalLibraryCategory)
    .filter((item): item is GoalLibraryCategory => item !== null);

  return {
    sportCode: readString(record.sportCode) ?? "",
    providerKey: readString(record.providerKey) ?? "",
    version: readString(record.version) ?? "",
    categories,
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

export async function fetchGoalLibrary(input: {
  sport: string;
  seasonPhase?: string | null;
  level?: GoalLibraryAthleteLevel | null;
  categoryKey?: string | null;
}): Promise<GoalLibraryResponse> {
  const sport = requireNonEmpty(input.sport, "sport");
  const raw = await apiRequest(
    paths.goalLibrary({
      sport,
      seasonPhase: input.seasonPhase ?? null,
      level: input.level ?? null,
      categoryKey: input.categoryKey ?? null,
    }),
    {
      method: "GET",
      cache: "no-store",
    },
  );
  return parseGoalLibraryResponse(raw);
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

export async function createPhaseAwareGoal(input: {
  athleteId: string;
  entityId: string;
  seasonCycleId: string;
  seasonPhaseId: string;
  goalType: string;
  domain: "SKILLS" | "S_AND_C" | "NUTRITION";
  goalName: string;
  successCriteria?: string;
  goalCategory: string;
  createdByCoachId: string;
  priority?: GoalPriority;
  targetValue?: number;
  targetDate?: string;
  goalSourceType?: GoalSourceType;
  libraryGoalId?: string;
  categoryKey?: string;
  taxonomyAreaKey?: string;
  athleteLevelSnapshot?: GoalLibraryAthleteLevel;
  librarySnapshotJson?: GoalLibrarySnapshot;
}): Promise<GoalSummary> {
  const body: Record<string, unknown> = {
    athleteId: requireNonEmpty(input.athleteId, "athleteId"),
    entityId: requireNonEmpty(input.entityId, "entityId"),
    seasonCycleId: requireNonEmpty(input.seasonCycleId, "seasonCycleId"),
    seasonPhaseId: requireNonEmpty(input.seasonPhaseId, "seasonPhaseId"),
    goalType: input.goalType,
    domain: input.domain,
    goalName: requireNonEmpty(input.goalName, "goalName"),
    goalCategory: input.goalCategory,
    createdByCoachId: requireNonEmpty(input.createdByCoachId, "createdByCoachId"),
  };
  if (typeof input.successCriteria === "string" && input.successCriteria.trim() !== "") {
    body.successCriteria = input.successCriteria.trim();
  }
  if (typeof input.priority === "string" && input.priority.trim() !== "") {
    body.priority = input.priority.trim();
  }
  if (typeof input.targetValue === "number" && Number.isFinite(input.targetValue)) {
    body.targetValue = input.targetValue;
  }
  if (typeof input.targetDate === "string" && input.targetDate.trim() !== "") {
    body.targetDate = input.targetDate.trim();
  }
  if (typeof input.goalSourceType === "string" && input.goalSourceType.trim() !== "") {
    body.goalSourceType = input.goalSourceType.trim();
  }
  if (typeof input.libraryGoalId === "string" && input.libraryGoalId.trim() !== "") {
    body.libraryGoalId = input.libraryGoalId.trim();
  }
  if (typeof input.categoryKey === "string" && input.categoryKey.trim() !== "") {
    body.categoryKey = input.categoryKey.trim();
  }
  if (typeof input.taxonomyAreaKey === "string" && input.taxonomyAreaKey.trim() !== "") {
    body.taxonomyAreaKey = input.taxonomyAreaKey.trim();
  }
  if (
    typeof input.athleteLevelSnapshot === "string" &&
    input.athleteLevelSnapshot.trim() !== ""
  ) {
    body.athleteLevelSnapshot = input.athleteLevelSnapshot.trim();
  }
  if (input.librarySnapshotJson) {
    body.librarySnapshotJson = input.librarySnapshotJson;
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
