import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest, type NormalizedApiError } from "@/lib/apiClient";
import type { GenerationDomain } from "@/lib/coachAuthority";
import type {
  TrainingPlanWorkspace,
  TrainingPlanWorkspaceAssignmentContext,
  TrainingPlanWorkspaceAssignmentDomainContext,
  TrainingPlanWorkspaceAssignmentDomainOwnerType,
  TrainingPlanWorkspaceAssignmentPlanningContext,
  TrainingPlanWorkspaceAssignmentReleaseMode,
  TrainingPlanWorkspacePlanningContextOwnerType,
  TrainingPlanWorkspaceDomain,
  TrainingPlanWorkspaceOwnershipFlags,
  TrainingPlanWorkspacePlanningContext,
  TrainingPlanWorkspaceSummary,
} from "@/types/trainingPlanWorkspace";

const TRAINING_PLAN_WORKSPACE_TIMEOUT_MS = 60_000;

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

function readBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

function assertIds(entityId: string, athleteId: string): {
  entityId: string;
  athleteId: string;
} {
  const e = entityId.trim();
  const a = athleteId.trim();
  if (e === "" || a === "") {
    throw {
      message: "entity id and athlete id are required",
      status: 400,
      code: "ENTITY_OR_ATHLETE_ID_REQUIRED",
    } satisfies NormalizedApiError;
  }
  return { entityId: e, athleteId: a };
}

function parseGenerationDomain(
  value: unknown,
  fallback: GenerationDomain,
): GenerationDomain {
  const normalized = readString(value)?.toUpperCase();
  if (
    normalized === "SKILLS" ||
    normalized === "NUTRITION" ||
    normalized === "S_AND_C"
  ) {
    return normalized;
  }
  return fallback;
}

function emptyWorkspaceSummary(
  generationDomain: GenerationDomain,
): TrainingPlanWorkspaceSummary {
  return {
    trainingPlanId: null,
    versionId: null,
    generationDomain,
    status: null,
    versionNumber: null,
  };
}

function emptyWorkspaceDomain(
  generationDomain: GenerationDomain,
): TrainingPlanWorkspaceDomain {
  return {
    summary: emptyWorkspaceSummary(generationDomain),
    reviewAccess: null,
    releaseMode: null,
    submittedForReview: false,
    canOpen: false,
    allowedActions: [],
  };
}

function parseWorkspaceSummary(
  value: unknown,
  fallbackDomain: GenerationDomain,
): TrainingPlanWorkspaceSummary {
  const record = asRecord(value) ?? {};
  const generationDomain = parseGenerationDomain(
    record.generationDomain,
    fallbackDomain,
  );
  return {
    trainingPlanId: readString(record.trainingPlanId ?? record.planId),
    versionId: readString(record.versionId ?? record.currentVersionId),
    generationDomain,
    status: readString(record.status),
    versionNumber: readNumber(record.versionNumber),
    latestVersionId: readString(record.latestVersionId),
    approvedVersionId: readString(record.approvedVersionId),
    activeVersionId: readString(record.activeVersionId),
  };
}

function parseWorkspaceDomain(
  value: unknown,
  fallbackDomain: GenerationDomain,
): TrainingPlanWorkspaceDomain {
  const record = asRecord(value) ?? {};
  const summaryRecord = asRecord(record.summary) ?? record;
  return {
    summary: parseWorkspaceSummary(summaryRecord, fallbackDomain),
    reviewAccess: readString(record.reviewAccess),
    releaseMode: readString(record.releaseMode),
    submittedForReview: readBoolean(record.submittedForReview),
    canOpen: readBoolean(record.canOpen),
    allowedActions: readStringList(record.allowedActions),
  };
}

function parseAssignmentReleaseMode(
  value: unknown,
): TrainingPlanWorkspaceAssignmentReleaseMode | null {
  const normalized = readString(value)?.toUpperCase();
  if (
    normalized === "HEAD_COACH_APPROVAL" ||
    normalized === "DIRECT_DOMAIN_RELEASE"
  ) {
    return normalized;
  }
  return null;
}

function parsePlanningContextOwnerType(
  value: unknown,
): TrainingPlanWorkspacePlanningContextOwnerType {
  const normalized = readString(value)?.toUpperCase();
  if (
    normalized === "HEAD_COACH" ||
    normalized === "SKILLS_FALLBACK" ||
    normalized === "NONE"
  ) {
    return normalized;
  }
  return "NONE";
}

function parseAssignmentDomainOwnerType(
  value: unknown,
): TrainingPlanWorkspaceAssignmentDomainOwnerType {
  const normalized = readString(value)?.toUpperCase();
  if (
    normalized === "ASSIGNED_DOMAIN_COACH" ||
    normalized === "HEAD_COACH_SELF" ||
    normalized === "NONE"
  ) {
    return normalized;
  }
  return "NONE";
}

function parseAssignmentPlanningContext(
  value: unknown,
): TrainingPlanWorkspaceAssignmentPlanningContext {
  const record = asRecord(value) ?? {};
  const blockers = readStringList(record.blockers);
  const parsed: TrainingPlanWorkspaceAssignmentPlanningContext = {
    ownerType: parsePlanningContextOwnerType(record.ownerType),
    ownerUserId: readString(record.ownerUserId),
    ownerCoachProfileId: readString(record.ownerCoachProfileId),
    canRead: readBoolean(record.canRead),
    canCreate: readBoolean(record.canCreate),
    canLock: readBoolean(record.canLock),
    canManage: readBoolean(record.canManage),
  };
  if (blockers.length > 0 || "blockers" in record) {
    parsed.blockers = blockers;
  }
  return parsed;
}

function parseAssignmentDomainContext(
  value: unknown,
): TrainingPlanWorkspaceAssignmentDomainContext {
  const record = asRecord(value) ?? {};
  const blockers = readStringList(record.blockers);
  const parsed: TrainingPlanWorkspaceAssignmentDomainContext = {
    ownerType: parseAssignmentDomainOwnerType(record.ownerType),
    ownerUserId: readString(record.ownerUserId),
    ownerCoachProfileId: readString(record.ownerCoachProfileId),
    ownedByCurrentUser: readBoolean(record.ownedByCurrentUser),
    canOpen: readBoolean(record.canOpen),
    canGenerate: readBoolean(record.canGenerate),
    canRevise: readBoolean(record.canRevise),
    canSubmitForReview: readBoolean(record.canSubmitForReview),
    canApprove: readBoolean(record.canApprove),
    canRelease: readBoolean(record.canRelease),
    releaseMode: parseAssignmentReleaseMode(record.releaseMode) ?? "HEAD_COACH_APPROVAL",
  };
  if (blockers.length > 0 || "blockers" in record) {
    parsed.blockers = blockers;
  }
  return parsed;
}

function parseAssignmentContext(
  value: unknown,
): TrainingPlanWorkspaceAssignmentContext | undefined {
  const record = asRecord(value);
  if (record === null) return undefined;
  const domainsRecord = asRecord(record.domains) ?? {};
  return {
    hasHeadCoach: readBoolean(record.hasHeadCoach),
    releaseMode: parseAssignmentReleaseMode(record.releaseMode) ?? "HEAD_COACH_APPROVAL",
    planningContext: parseAssignmentPlanningContext(record.planningContext),
    domains: {
      SKILLS: parseAssignmentDomainContext(domainsRecord.SKILLS),
      NUTRITION: parseAssignmentDomainContext(domainsRecord.NUTRITION),
      S_AND_C: parseAssignmentDomainContext(domainsRecord.S_AND_C),
    },
  };
}

function parsePlanningContext(value: unknown): TrainingPlanWorkspacePlanningContext {
  const record = asRecord(value) ?? {};
  return {
    locked: readBoolean(record.locked) || readBoolean(record.planningContextLocked),
    resolved: readBoolean(record.resolved),
    lockId: readString(record.lockId),
    snapshotId: readString(record.snapshotId),
    seasonCycleId: readString(record.seasonCycleId),
    selectedSeasonCycleId: readString(record.selectedSeasonCycleId),
    seasonId: readString(record.seasonId),
    selectedSeasonId: readString(record.selectedSeasonId),
    phase: readString(record.phase),
    startDate: readString(record.startDate),
    endDate: readString(record.endDate),
    planStartDate: readString(record.planStartDate),
    planEndDate: readString(record.planEndDate),
    durationDays: readNumber(record.durationDays),
    goalIds: readStringList(record.goalIds),
    lockedGoalIds: readStringList(record.lockedGoalIds),
    selectedGoalsSnapshot: record.selectedGoalsSnapshot,
    athletePlanningContextSnapshot: record.athletePlanningContextSnapshot,
  };
}

function parseOwnershipFlags(value: unknown): TrainingPlanWorkspaceOwnershipFlags {
  const record = asRecord(value) ?? {};
  const flags: TrainingPlanWorkspaceOwnershipFlags = {
    hasHeadCoach: readBoolean(record.hasHeadCoach),
    requesterIsHeadCoach: readBoolean(record.requesterIsHeadCoach),
    requesterHasSkillsFunction: readBoolean(record.requesterHasSkillsFunction),
    requesterOwnsCurrentDomain: readBoolean(record.requesterOwnsCurrentDomain),
    headCoachOwnsPlanningContext: readBoolean(record.headCoachOwnsPlanningContext),
    directReleaseAllowed: readBoolean(record.directReleaseAllowed),
  };
  if ("requesterOwnsSkillsForThisAthlete" in record) {
    flags.requesterOwnsSkillsForThisAthlete = readBoolean(
      record.requesterOwnsSkillsForThisAthlete,
    );
  }
  if ("requesterOwnsNutritionForThisAthlete" in record) {
    flags.requesterOwnsNutritionForThisAthlete = readBoolean(
      record.requesterOwnsNutritionForThisAthlete,
    );
  }
  if ("requesterOwnsStrengthForThisAthlete" in record) {
    flags.requesterOwnsStrengthForThisAthlete = readBoolean(
      record.requesterOwnsStrengthForThisAthlete,
    );
  }
  return flags;
}

export function parseTrainingPlanWorkspacePayload(data: unknown): TrainingPlanWorkspace {
  const root = asRecord(data) ?? {};
  const nested = asRecord(root.data) ?? root;
  const domainsRecord = asRecord(nested.domains) ?? {};
  const assignmentContext = parseAssignmentContext(nested.assignmentContext);

  const workspace: TrainingPlanWorkspace = {
    entityId: readString(nested.entityId) ?? "",
    athleteId: readString(nested.athleteId) ?? "",
    workflowShape: readString(nested.workflowShape) ?? "",
    shell: readString(nested.shell) ?? "",
    workflowMode: readString(nested.workflowMode) ?? "",
    currentDomain: readString(nested.currentDomain),
    initialTab: readString(nested.initialTab),
    planningContext: parsePlanningContext(nested.planningContext),
    ownershipFlags: parseOwnershipFlags(nested.ownershipFlags),
    blockers: readStringList(nested.blockers),
    domains: {
      SKILLS: domainsRecord.SKILLS
        ? parseWorkspaceDomain(domainsRecord.SKILLS, "SKILLS")
        : emptyWorkspaceDomain("SKILLS"),
      NUTRITION: domainsRecord.NUTRITION
        ? parseWorkspaceDomain(domainsRecord.NUTRITION, "NUTRITION")
        : emptyWorkspaceDomain("NUTRITION"),
      S_AND_C: domainsRecord.S_AND_C
        ? parseWorkspaceDomain(domainsRecord.S_AND_C, "S_AND_C")
        : emptyWorkspaceDomain("S_AND_C"),
    },
  };
  if (assignmentContext !== undefined) {
    workspace.assignmentContext = assignmentContext;
  }
  return workspace;
}

export async function getTrainingPlanWorkspace(
  entityId: string,
  athleteId: string,
): Promise<TrainingPlanWorkspace> {
  const ids = assertIds(entityId, athleteId);
  const raw = await apiRequest(
    paths.entities.athleteTrainingPlanWorkspace(ids.entityId, ids.athleteId),
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: TRAINING_PLAN_WORKSPACE_TIMEOUT_MS,
    },
  );
  return parseTrainingPlanWorkspacePayload(adaptBackendSuccess(raw));
}
