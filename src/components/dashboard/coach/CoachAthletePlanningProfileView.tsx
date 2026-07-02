"use client";

import {
  COACH_WORKFLOW_OUTER_CARD_CLASS,
  DASHBOARD_PAGE_CONTENT_CLASS,
} from "@/components/dashboard/shared/dashboardOuterCardStyles";
import { DashboardStatusNotice } from "@/components/dashboard/shared/DashboardStatusNotice";
import { useCoachPageReady } from "@/components/dashboard/coach/CoachPageReadyContext";
import { SkillGoalAttributionText } from "@/components/dashboard/SkillGoalAttribution";
import { DASHBOARD_DETAIL_LABEL_CLASS } from "@/components/dashboard/shared/dashboardTypography";
import { PageHeader } from "@/components/layout/PageHeader";
import { GoalDisplayBlock } from "@/components/goals/GoalDisplayBlock";
import { CoachAthleteLevelValidationModal } from "@/components/dashboard/coach/CoachAthleteLevelValidationModal";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Loader2,
  LockKeyhole,
} from "lucide-react";
import { fetchMyAcademyCoaches } from "@/lib/api/academyMeCoaches";
import {
  createPhaseAwareGoal,
  createGoal,
  fetchGoalLibrary,
  createSeasonCycle,
  createSeasonCyclePhase,
  fetchGoalsForAthlete,
  fetchSeasonCyclePhases,
  fetchSeasonCyclesForEntity,
  updateSeasonCyclePhase,
  type GoalLibraryAthleteLevel,
  type GoalLibraryCategory,
  type GoalLibraryItem,
  type GoalPriority,
  type GoalSummary,
  type SeasonCycleSummary,
  type SeasonPhaseSummary,
} from "@/lib/api/coachAthleteGoalsSeasonSetup";
import {
  fetchCoachAthletePlanningProfile,
  type CoachAthletePlanningProfileView as CoachAthletePlanningProfileData,
} from "@/lib/api/coachAthletePlanningProfile";
import { fetchCoachAthleteLevelValidation } from "@/lib/api/coachAthleteLevelValidation";
import {
  fetchCoachAssignedAthletes,
  fetchCoachMeDashboard,
  type CoachAssignedAthleteRow,
} from "@/lib/api/coachMe";
import {
  fetchCoachAthleteUpstreamPlanningContext,
  isUpstreamPlanningContextLocked,
  fetchDomainPlanSummary,
  fetchLatestCoachAthleteDomainDraft,
  fetchPersistedTrainingPlanActiveDetail,
  fetchPersistedTrainingPlanVersions,
  fetchCoachAthleteTrainingPlanCompleteness,
  fetchCoachAthleteTrainingPlanReadiness,
  fetchCoachAthleteTrainingPlanWorkloadAssessment,
  fetchCoachAthleteTrainingPlanWorkloadAssessmentLatest,
  headApprove,
  lockCoachAthletePlanningContext,
  persistDraftResultFromLatestDomainDraft,
  release,
  requestRevision,
  reviseCoachAthleteSandCTrainingPlan,
  reviseCoachAthleteSkillsTrainingPlan,
  reviseNutritionPlan,
  submitReview,
  type CoachAthleteTrainingPlanCompleteness,
  type CoachAthleteTrainingPlanGenerationJob,
  type CoachAthleteGeneratedDraftItem,
  type CoachAthleteLatestDomainDraft,
  type CoachPersistedTrainingPlanActiveDetail,
  type CoachPersistedTrainingPlanVersion,
  type DomainPlanSummary,
  type DomainPlanSummaryItem,
  type GovernedTrainingPlanWorkflowAction,
  type CoachAthleteTrainingPlanPersistDraftResult,
  type CoachAthleteTrainingPlanReadiness,
  type TrainingPlanGenerationDomain,
  type TrainingPlanReviseResult,
  type CoachAthleteTrainingPlanWorkloadAssessment,
  type CoachAthleteUpstreamPlanningContext,
} from "@/lib/api/coachAthletePlanningReadiness";
import { getTrainingPlanWorkspace } from "@/lib/api/trainingPlanWorkspace";
import { isNormalizedApiError } from "@/lib/apiClient";
import {
  deriveWorkflowStatusFromWorkspaceDomain,
  parseWorkspaceCurrentDomain,
  parseWorkspaceInitialTab,
  resolveLegacyPlanningContextLocked,
  resolvePlanningContextLocked,
  resolveEffectiveDownstreamPlanningContextLocked,
  resolveLegacyAssistantCreateButtonDisabled,
  resolveWorkflowModeFromWorkspace,
  workspaceAssignedGenerationDomains,
  workspaceAllowedActionsSet,
  workspaceDirectReleaseAllowed,
  workspaceHasSubmittedDomainPlans,
  workspaceHeadCoachCanCreateSkillsPlan,
  workspaceHeadCoachOwnsPlanningContext,
  workspaceHeadCoachOwnsSkillsForAthlete,
  workspaceResolvableGenerationDomains,
  workspaceResolveReleaseMode,
  workspaceShowsDomainSubmitReview,
} from "@/lib/trainingPlanWorkspaceView";
import {
  deriveTrainingPlanWorkspaceTabStates,
  type TrainingPlanWorkspaceTabPrimaryAction,
} from "@/lib/trainingPlanWorkspaceTabs";
import { runTrainingPlanGenerationJob } from "@/lib/coachTrainingPlanGenerationJobs";
import {
  formatDateOnly,
  formatDateRange,
  formatDateWithWeekday,
  formatPlanningProfileDateDisplay,
} from "@/lib/dateTime";
import {
  formatEnumeratedLabel,
  formatPersonNameForDisplay,
  toTitleCaseInput,
} from "@/lib/textFormat";
import {
  canCoachValidateLevel,
  currentCoachHasSkillsFunction,
  currentCoachIsHeadCoach,
  derivePrimaryCoachPlanDomain,
  normalizeCoachFunctionValue,
} from "@/lib/coachAuthority";
import {
  LOCKED_CONTEXT_MISSING_GENERATION_DETAILS_MESSAGE,
  planningProfileHrefForAthlete,
  PLAN_GENERATION_NOT_ASSIGNED_MESSAGE,
  canHeadCoachCreateSkillsPlan,
  canShowAssistantDomainSubmitReview,
  hasAssistantGovernedDetailVersionMismatch,
  isAssistantDomainGeneratePlanDisabled,
  isAssistantGovernedDetailAlignedWithVisibleDraft,
  isCreatePlanBlockedByPlanningContextLock,
  shouldSkipAssistantDomainReadinessGate,
  shouldUseLockedDownstreamGenerationContext,
  shouldUseWorkflow1SpecialistCreateGate,
  isGeneratePlanDisabledForDomain,
  isPlanGenerationBlockedByOwnership,
  headCoachOwnsAssignedDomainGeneration,
  mergePlanGenerationOwnershipForDomain,
  PLANNING_CONTEXT_REQUIRED_BUTTON_LABEL,
  resolveWorkflow1SpecialistCreateDisabled,
  type AssistantGovernedPlanContext,
  type AssistantVisibleDomainDraftIds,
  type PlanGenerationOwnershipFlags,
} from "@/lib/coachTrainingPlanActions";
import { cn } from "@/lib/utils";
import type { TrainingPlanLevelValidationView } from "@/types/trainingPlanLevelValidation";
import type {
  TrainingPlanWorkspace,
  TrainingPlanWorkspaceAssignmentDomainContext,
  TrainingPlanWorkspaceAssignmentPlanningContext,
  TrainingPlanWorkspaceAssignmentReleaseMode,
} from "@/types/trainingPlanWorkspace";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type MutableRefObject,
  type FormEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type DisplayableValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>
  | null
  | undefined;
type PlanningSummaryGoal = {
  goalId?: string | null;
  goalName?: string | null;
  name?: string | null;
  description?: string | null;
  successCriteria?: string | null;
};
type PlanningReadinessSources = {
  levelValidation: TrainingPlanLevelValidationView | null;
  readiness: CoachAthleteTrainingPlanReadiness | null;
  completeness: CoachAthleteTrainingPlanCompleteness | null;
};
export type GoalsSeasonSetupState = {
  seasons: SeasonCycleSummary[];
  phasesBySeasonCycleId: Record<string, SeasonPhaseSummary[]>;
  goals: GoalSummary[];
  coachFunctions: string[];
  hasHeadCoachConfigured: boolean;
  academyCoachRole: string;
  trainingPlanReleaseMode: string;
};
type SeasonPhaseType = "OFF_SEASON" | "PRE_SEASON" | "IN_SEASON";
type PhaseEditorState = {
  isEditing: boolean;
  startDate: string;
  endDate: string;
  loading: boolean;
  error: string | null;
  success: string | null;
};
type GoalCreationMode = "CUSTOM" | "LIBRARY";

const GENERATION_DOMAIN_ORDER: TrainingPlanGenerationDomain[] = [
  "SKILLS",
  "NUTRITION",
  "S_AND_C",
];
const AI_GENERATION_VALIDATION_ERROR_MESSAGE =
  "Plan generation completed, but the AI output did not match the required system format. Please try again after the generator is updated.";
const ASSIGNMENT_CONTEXT_MISSING_LEGACY_FALLBACK_WARNING =
  "[TrainingPlanWorkspace] assignmentContext missing; using legacy fallback";

type TrainingPlanPersistenceContext = {
  seasonCycleId: string;
  startDate: string;
  endDate: string;
  goalIds?: string[];
};

function objectRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function collectObjectRecords(value: unknown): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const seen = new Set<Record<string, unknown>>();

  function visit(node: unknown): void {
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    const record = objectRecord(node);
    if (!record || seen.has(record)) return;
    seen.add(record);
    out.push(record);

    for (const child of Object.values(record)) {
      if (Array.isArray(child)) {
        for (const item of child) visit(item);
      } else {
        visit(child);
      }
    }
  }

  visit(value);
  return out;
}

function readStringFromRecords(
  records: Record<string, unknown>[],
  keys: string[],
): string | null {
  for (const key of keys) {
    for (const record of records) {
      const value = record[key];
      if (typeof value !== "string") continue;
      const trimmed = value.trim();
      if (trimmed !== "") return trimmed;
    }
  }
  return null;
}

function readStringListFromRecords(
  records: Record<string, unknown>[],
  keys: string[],
): string[] {
  for (const key of keys) {
    for (const record of records) {
      const value = record[key];
      if (!Array.isArray(value)) continue;
      return value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item !== "");
    }
  }
  return [];
}

export function readGoalIdsFromSnapshot(snapshot: unknown): string[] {
  const records = collectObjectRecords(snapshot);
  const goalIds = readStringListFromRecords(records, [
    "goalIds",
    "selectedGoalIds",
    "lockedGoalIds",
    "trainingGoalIds",
  ]);
  if (goalIds.length > 0) return goalIds;

  return records
    .map((record) => readStringFromRecords([record], ["goalId", "trainingGoalId", "id"]))
    .filter((goalId): goalId is string => goalId !== null);
}

function readArrayLengthFromRecords(records: Record<string, unknown>[], keys: string[]): number {
  for (const key of keys) {
    for (const record of records) {
      const value = record[key];
      if (Array.isArray(value)) return value.length;
    }
  }
  return 0;
}

export function readWorkspaceSnapshotGoalCount(snapshot: unknown): number {
  if (Array.isArray(snapshot)) return snapshot.length;
  const records = collectObjectRecords(snapshot);
  const nestedGoalCount = readArrayLengthFromRecords(records, ["goals", "selectedGoals"]);
  if (nestedGoalCount > 0) return nestedGoalCount;
  return readGoalIdsFromSnapshot(snapshot).length;
}

export function readLockedWorkspaceGoalIds(input: {
  selectedGoalsSnapshot: unknown;
  athletePlanningContextSnapshot: unknown;
  goalIds?: string[];
  lockedGoalIds?: string[];
  fallbackGoalIds?: string[];
}): string[] {
  const fromSelectedSnapshot = readGoalIdsFromSnapshot(input.selectedGoalsSnapshot);
  const fromAthleteSnapshot = readGoalIdsFromSnapshot(input.athletePlanningContextSnapshot);
  const candidates = [
    fromSelectedSnapshot,
    fromAthleteSnapshot,
    input.goalIds ?? [],
    input.lockedGoalIds ?? [],
    input.fallbackGoalIds ?? [],
  ];
  return (
    candidates.find((goalIds) =>
      goalIds.some((goalId) => typeof goalId === "string" && goalId.trim() !== ""),
    ) ?? []
  ).filter((goalId) => typeof goalId === "string" && goalId.trim() !== "");
}

export function resolveLockedPlanningContextDisplayFields(input: {
  workspacePlanningContext: TrainingPlanWorkspace["planningContext"] | null;
  upstreamPlanningContext: CoachAthleteUpstreamPlanningContext | null;
  seasons: SeasonCycleSummary[];
  phasesBySeasonCycleId?: Record<string, SeasonPhaseSummary[]>;
  selectedSeason: SeasonCycleSummary | null;
  activePhaseForSelectedSeason: SeasonPhaseSummary | null;
  lockedPlanningContextSeasonPhase: string | null;
  setupGoals?: GoalSummary[];
  selectedActiveGoals?: GoalSummary[];
}): {
  seasonName: string | null;
  currentPhase: string | null;
  selectedGoalsSummary: string | null;
  selectedGoalCount: number;
  planStartDate: string | null;
  planEndDate: string | null;
  durationDays: number | null;
  insideCurrentPhase: boolean | null;
  datesConfirmed: boolean;
  seasonGoalsComplete: boolean;
  planDatesComplete: boolean;
} {
  const workspacePlanningContext = input.workspacePlanningContext;
  const workspaceSnapshotRecords = collectObjectRecords(
    workspacePlanningContext?.athletePlanningContextSnapshot,
  );
  const selectedGoalsSnapshotRecords = collectObjectRecords(
    workspacePlanningContext?.selectedGoalsSnapshot,
  );
  const snapshotRecords = [...selectedGoalsSnapshotRecords, ...workspaceSnapshotRecords];
  const snapshotSeasonName = readStringFromRecords(snapshotRecords, [
    "seasonName",
    "seasonCycleName",
    "selectedSeasonName",
  ]);
  const snapshotPhase = readStringFromRecords(snapshotRecords, [
    "currentPhase",
    "phase",
    "phaseCode",
    "phaseName",
  ]);
  const lockedSeasonCycleId = trimmedNonEmpty(
    workspacePlanningContext?.selectedSeasonCycleId,
    workspacePlanningContext?.seasonCycleId,
    workspacePlanningContext?.selectedSeasonId,
    workspacePlanningContext?.seasonId,
    readStringFromRecords(snapshotRecords, [
      "selectedSeasonCycleId",
      "seasonCycleId",
      "selectedSeasonId",
      "seasonId",
    ]),
    input.upstreamPlanningContext?.planningContext.seasonCycleId,
    input.upstreamPlanningContext?.seasonCycleId,
    input.upstreamPlanningContext?.planningContext.season?.seasonCycleId,
    input.upstreamPlanningContext?.season?.seasonCycleId,
  );
  const lockedSeason =
    lockedSeasonCycleId !== null
      ? input.seasons.find((season) => season.seasonCycleId === lockedSeasonCycleId) ?? null
      : null;
  const currentPhase = trimmedNonEmpty(
    workspacePlanningContext?.phase,
    snapshotPhase,
    input.upstreamPlanningContext?.planningContext.phase,
    input.lockedPlanningContextSeasonPhase,
    input.upstreamPlanningContext?.season?.phaseCode,
    input.upstreamPlanningContext?.season?.phaseName,
    input.upstreamPlanningContext?.phase,
    input.activePhaseForSelectedSeason?.phase,
    input.activePhaseForSelectedSeason?.phaseName,
  );
  const planStartDate = trimmedNonEmpty(
    workspacePlanningContext?.planStartDate,
    workspacePlanningContext?.startDate,
    readStringFromRecords(snapshotRecords, ["planStartDate", "startDate", "trainingPlanStartDate"]),
    input.upstreamPlanningContext?.planWindow?.startDate,
    input.upstreamPlanningContext?.startDate,
  );
  const planEndDate = trimmedNonEmpty(
    workspacePlanningContext?.planEndDate,
    workspacePlanningContext?.endDate,
    readStringFromRecords(snapshotRecords, ["planEndDate", "endDate", "trainingPlanEndDate"]),
    input.upstreamPlanningContext?.planWindow?.endDate,
    input.upstreamPlanningContext?.endDate,
  );
  const selectedGoalLabels = readGoalLabelsFromSnapshot(
    workspacePlanningContext?.selectedGoalsSnapshot,
  );
  const athleteSnapshotGoalLabels = readGoalLabelsFromSnapshot(
    workspacePlanningContext?.athletePlanningContextSnapshot,
  );
  const upstreamGoalLabels =
    input.upstreamPlanningContext?.goals
      .map((goal) => goal.goalName ?? goal.name ?? goal.goalId)
      .filter((goal): goal is string => typeof goal === "string" && goal.trim() !== "") ?? [];
  const lockedGoalIds = readLockedWorkspaceGoalIds({
    selectedGoalsSnapshot: workspacePlanningContext?.selectedGoalsSnapshot,
    athletePlanningContextSnapshot: workspacePlanningContext?.athletePlanningContextSnapshot,
    goalIds: workspacePlanningContext?.goalIds,
    lockedGoalIds: workspacePlanningContext?.lockedGoalIds,
    fallbackGoalIds:
      input.upstreamPlanningContext?.planningContext.lockedGoalIds ??
      input.upstreamPlanningContext?.planningContext.goalIds ??
      input.upstreamPlanningContext?.goalIds ??
      [],
  });
  const setupGoalLabels = lockedGoalIds
    .map((goalId) => input.setupGoals?.find((goal) => goal.goalId === goalId))
    .filter((goal): goal is GoalSummary => goal !== undefined)
    .map((goal) => goal.goalName ?? goal.goalId)
    .filter((goal) => goal.trim() !== "");
  const fallbackSelectedGoalLabels =
    input.selectedActiveGoals
      ?.map((goal) => goal.goalName ?? goal.goalId)
      .filter((goal) => goal.trim() !== "") ?? [];
  const selectedGoalDisplayLabels = firstNonEmptyStringList([
    selectedGoalLabels,
    athleteSnapshotGoalLabels,
    upstreamGoalLabels,
    setupGoalLabels,
    fallbackSelectedGoalLabels,
  ]);
  const phasesForLockedSeason =
    lockedSeasonCycleId !== null
      ? (input.phasesBySeasonCycleId?.[lockedSeasonCycleId] ?? lockedSeason?.phases ?? [])
      : [];
  const currentPhaseRecord =
    currentPhase !== null
      ? phasesForLockedSeason.find(
          (phase) => phase.phase === currentPhase || phase.phaseId === currentPhase,
        ) ?? null
      : null;
  const insideCurrentPhase =
    planStartDate !== null && planEndDate !== null && currentPhaseRecord !== null
      ? isPlanWindowInsidePhase(currentPhaseRecord, planStartDate, planEndDate)
      : null;
  const resolvedDurationDays =
    typeof workspacePlanningContext?.durationDays === "number" &&
    Number.isFinite(workspacePlanningContext.durationDays)
      ? workspacePlanningContext.durationDays
      : calculateInclusiveDurationDays(planStartDate, planEndDate);
  const seasonName = lockedSeason?.name ?? snapshotSeasonName ?? input.selectedSeason?.name ?? null;
  const selectedGoalCount =
    selectedGoalDisplayLabels.length > 0 ? selectedGoalDisplayLabels.length : lockedGoalIds.length;
  const locked =
    workspacePlanningContext?.locked === true ||
    input.upstreamPlanningContext?.planningContextLocked === true ||
    input.upstreamPlanningContext?.upstreamPlanningContextLocked === true;
  const datesConfirmed =
    locked && planStartDate !== null && planEndDate !== null;

  return {
    seasonName,
    currentPhase,
    selectedGoalsSummary:
      selectedGoalDisplayLabels.length > 0 ? selectedGoalDisplayLabels.join(", ") : null,
    selectedGoalCount,
    planStartDate,
    planEndDate,
    durationDays: resolvedDurationDays,
    insideCurrentPhase,
    datesConfirmed,
    seasonGoalsComplete:
      locked && seasonName !== null && currentPhase !== null && selectedGoalCount > 0,
    planDatesComplete: datesConfirmed,
  };
}

function readGoalLabelsFromSnapshot(snapshot: unknown): string[] {
  const records = Array.isArray(snapshot)
    ? snapshot.map((item) => objectRecord(item)).filter((item): item is Record<string, unknown> => item !== null)
    : collectObjectRecords(snapshot);
  return records
    .map((record) =>
      readStringFromRecords([record], ["goalName", "name", "title", "goalId", "trainingGoalId", "id"]),
    )
    .filter((value): value is string => value !== null)
    .filter((value, index, values) => values.indexOf(value) === index);
}

function firstNonEmptyStringList(lists: string[][]): string[] {
  return lists.find((list) => list.some((item) => item.trim() !== "")) ?? [];
}

function calculateInclusiveDurationDays(startDate: string | null, endDate: string | null): number | null {
  if (startDate === null || endDate === null) return null;
  const start = new Date(`${dateOnly(startDate)}T00:00:00.000Z`);
  const end = new Date(`${dateOnly(endDate)}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diffDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return diffDays > 0 ? diffDays : null;
}

function extractPersistenceContextFromSnapshot(
  snapshot: unknown,
): TrainingPlanPersistenceContext | null {
  const records = collectObjectRecords(snapshot);
  const seasonCycleId = readStringFromRecords(records, [
    "seasonCycleId",
    "selectedSeasonCycleId",
    "seasonId",
  ]);
  const startDate = readStringFromRecords(records, [
    "startDate",
    "planStartDate",
    "trainingPlanStartDate",
  ]);
  const endDate = readStringFromRecords(records, [
    "endDate",
    "planEndDate",
    "trainingPlanEndDate",
  ]);
  if (!seasonCycleId || !startDate || !endDate) return null;

  const goalIds = readStringListFromRecords(records, [
    "goalIds",
    "selectedGoalIds",
    "trainingGoalIds",
  ]);
  return {
    seasonCycleId,
    startDate,
    endDate,
    ...(goalIds.length > 0 ? { goalIds } : {}),
  };
}

function readGenerationValidationArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const directKeys = [
    "error",
    "errors",
    "validationErrors",
    "issues",
    "violations",
    "details",
  ];

  for (const key of directKeys) {
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate;
  }

  const nestedError = record.error;
  if (nestedError && typeof nestedError === "object" && !Array.isArray(nestedError)) {
    for (const key of directKeys) {
      const candidate = (nestedError as Record<string, unknown>)[key];
      if (Array.isArray(candidate)) return candidate;
    }
  }

  return null;
}

function isAiGenerationValidationError(e: unknown): boolean {
  if (!isNormalizedApiError(e)) return false;

  const validationArray = readGenerationValidationArray(e.details);
  if (validationArray && validationArray.length > 0) return true;

  const message = e.message.trim();
  return (
    (message.startsWith("[") && message.endsWith("]")) ||
    message.includes('[{"') ||
    message.includes('"validationErrors"') ||
    message.includes('"issues"')
  );
}

function isPersistDraftRequestTimedOut(e: unknown): boolean {
  return isClientRequestTimedOut(e);
}

export function isClientRequestTimedOut(e: unknown): boolean {
  return (
    isNormalizedApiError(e) &&
    e.status === 0 &&
    e.message.trim().toLowerCase() === "request timed out"
  );
}

function formatApiError(e: unknown, fallback: string): string {
  if (isNormalizedApiError(e)) {
    if (e.details && typeof e.details === "object" && !Array.isArray(e.details)) {
      const details = e.details as Record<string, unknown>;
      if (typeof details.error === "string" && details.error.trim() !== "") {
        return details.error.trim();
      }
    }
    if (e.status === 403) {
      const server = e.message.trim();
      return server !== ""
        ? `Access denied. ${server}`
        : "Access denied. You don't have permission to perform this action.";
    }
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

function displayValue(
  value: DisplayableValue,
): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) {
    const items = value
      .map((item) => String(item).trim())
      .filter((item) => item !== "");
    return items.length > 0 ? items.join(", ") : "—";
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "—";
  const text = value.trim();
  return text === "" ? "—" : text;
}

/** Session / slot titles and draft item labels (food, exercise names). */
function displayLabelTitleCase(value: DisplayableValue): string {
  const base = displayValue(value);
  if (base === "—") return base;
  return toTitleCaseInput(base);
}

function hasRenderableValue(value: DisplayableValue): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return Number.isFinite(value);
  return true;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className={cn(DASHBOARD_DETAIL_LABEL_CLASS, "sm:w-56 sm:shrink-0")}>
        {label}
      </dt>
      <dd className="min-w-0 text-sm text-textPrimary">{value}</dd>
    </div>
  );
}

function readPlanningGoalTitle(goal: PlanningSummaryGoal): string | null {
  return (
    goal.goalName?.trim() ??
    goal.name?.trim() ??
    goal.description?.trim() ??
    null
  );
}

function resolveDisplayedPlanningGoals(
  upstream: CoachAthleteUpstreamPlanningContext | null,
): PlanningSummaryGoal[] {
  const planningContext = upstream?.planningContext ?? null;
  const goals =
    planningContext?.goals && planningContext.goals.length > 0
      ? planningContext.goals
      : upstream?.goals ?? [];
  const selectedGoalIds =
    planningContext?.lockedGoalIds && planningContext.lockedGoalIds.length > 0
      ? planningContext.lockedGoalIds
      : planningContext?.goalIds && planningContext.goalIds.length > 0
        ? planningContext.goalIds
        : upstream?.goalIds ?? [];

  if (goals.length === 0 || selectedGoalIds.length === 0) return goals;

  const selectedGoalIdSet = new Set(selectedGoalIds);
  const selectedGoals = goals.filter(
    (goal) => goal.goalId !== null && goal.goalId !== undefined && selectedGoalIdSet.has(goal.goalId),
  );
  return selectedGoals.length > 0 ? selectedGoals : goals;
}

function renderDetailListValue(items: string[]): ReactNode {
  if (items.length === 0) return "—";
  if (items.length === 1) return items[0];

  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function renderPlanningGoalSummaryRows({
  goals,
  planningGoalLabel,
}: {
  goals: PlanningSummaryGoal[];
  planningGoalLabel: string;
}) {
  const hasMultipleGoals = goals.length > 1;
  const goalTitles = goals
    .map((goal) => readPlanningGoalTitle(goal))
    .filter((value): value is string => value !== null && value !== "");
  const successCriteria = goals
    .map((goal) => {
      const criteria = goal.successCriteria?.trim() ?? "";
      if (criteria === "") return null;
      const title = readPlanningGoalTitle(goal);
      return hasMultipleGoals && title !== null ? `${title}: ${criteria}` : criteria;
    })
    .filter((value): value is string => value !== null && value !== "");

  return (
    <>
      <DetailRow
        label={hasMultipleGoals ? "Selected Goals" : planningGoalLabel}
        value={renderDetailListValue(goalTitles)}
      />
      <DetailRow label="Success Criteria" value={renderDetailListValue(successCriteria)} />
    </>
  );
}

function renderRevisionSummary(
  draft: CoachAthleteLatestDomainDraft | null,
): ReactElement | null {
  if (!draft?.revision) return null;

  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <h5 className="text-sm font-normal text-textPrimary">Revision Summary</h5>
      {hasRenderableValue(draft.revision.feedback) ? (
        <div className="space-y-1 text-sm text-textPrimary">
          <div className="font-medium">Coach Feedback:</div>
          <div className="whitespace-pre-wrap text-textSecondary">
            {displayValue(draft.revision.feedback)}
          </div>
        </div>
      ) : null}
      {draft.revision.changeSummary.length > 0 ? (
        <div className="space-y-1 text-sm text-textPrimary">
          <div className="font-medium">Changes Applied:</div>
          <ul className="list-disc space-y-1 pl-5 text-textSecondary">
            {draft.revision.changeSummary.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function toFieldLabel(field: string): string {
  const overrides: Record<string, string> = {
    hemoglobin: "Hemoglobin (g/dL)",
    vitaminD: "Vitamin D - 25-OH D (ng/mL)",
    vitaminB12: "Vitamin B12 (pg/mL)",
    ferritin: "Ferritin (ng/mL)",
    crp: "CRP - C-Reactive Protein (mg/L)",
    fastingBloodGlucoseFBS: "Fasting Blood Glucose (FBS)",
    postprandialBloodGlucosePPBS: "Postprandial Blood Glucose (PPBS)",
    bodyFatPercent: "Body Fat Percentage (%)",
    skeletalLeanMassKg: "Skeletal Muscle Mass (kg)",
    skeletalFatMassKg: "Body Fat Mass (kg)",
    visceralFatLevel: "Visceral Fat Level",
    visceralFatArea: "Visceral Fat Area",
    bmrKcalDay: "Basal Metabolic Rate (kcal/day)",
    muscleMassKg: "Muscle Mass (kg)",
  };
  if (overrides[field]) return overrides[field];
  return field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

type GuidedWorkflowStepKey =
  | "context-app"
  | "level-validation"
  | "workload"
  | "season-goals"
  | "plan-dates"
  | "generate";

type ContextBuilderStepKey = Exclude<GuidedWorkflowStepKey, "generate">;
type ContextBuilderDrawerStepKey = ContextBuilderStepKey;
const CONTEXT_BUILDER_DRAWER_ANIMATION_MS = 220;
const DOMAIN_REVIEW_DRAWER_ANIMATION_MS = 220;

const PLANNING_CONTEXT_BLOCKER_SUPPRESSED = new Set(["PLANNING_CONTEXT_LOCK_MISSING"]);

function normalizePlanningContextBlockerCode(blocker: string): string {
  return blocker.trim().toUpperCase().replace(/\s+/g, "_");
}

export function humanizePlanningContextBlockerCode(blocker: string): string | null {
  const normalized = normalizePlanningContextBlockerCode(blocker);
  if (PLANNING_CONTEXT_BLOCKER_SUPPRESSED.has(normalized)) return null;

  const labels: Record<string, string> = {
    LEVEL_VALIDATION_NOT_CONFIRMED: "Confirm athlete level",
    NO_WORKLOAD_CONTEXT: "Complete workload assessment",
    NO_PLAN_WINDOW: "Confirm plan dates",
    NO_SEASON_CONTEXT: "Select season and goals",
    NO_SEASON: "Select season and goals",
    NO_GOALS_SELECTED: "Select season and goals",
    NO_ACTIVE_GOALS: "Select season and goals",
    NO_GOALS: "Select season and goals",
    MISSING_SEASON: "Select season and goals",
    MISSING_GOALS: "Select season and goals",
    APP_NOT_COMPLETE: "Complete APP context",
    APP_INCOMPLETE: "Complete APP context",
    APP_CONTEXT_INCOMPLETE: "Complete APP context",
    MISSING_APP_CONTEXT: "Complete APP context",
    READINESS_NOT_COMPLETE: "Complete APP readiness",
  };

  if (labels[normalized]) return labels[normalized];

  if (/^[A-Z][A-Z0-9_]+$/.test(normalized)) return null;

  return blocker.trim();
}

export type CoachFacingPlanningContextPendingStepsInput = {
  upstreamBlockers: string[];
  appStepComplete: boolean;
  levelStepComplete: boolean;
  workloadComplete: boolean;
  seasonGoalsComplete: boolean;
  planDatesStepComplete: boolean;
};

export function resolveCoachFacingPlanningContextPendingSteps(
  input: CoachFacingPlanningContextPendingStepsInput,
): string[] {
  const satisfiedByStep: Record<string, (value: CoachFacingPlanningContextPendingStepsInput) => boolean> =
    {
      LEVEL_VALIDATION_NOT_CONFIRMED: (value) => value.levelStepComplete,
      NO_WORKLOAD_CONTEXT: (value) => value.workloadComplete,
      NO_PLAN_WINDOW: (value) => value.planDatesStepComplete,
      NO_SEASON_CONTEXT: (value) => value.seasonGoalsComplete,
      NO_SEASON: (value) => value.seasonGoalsComplete,
      NO_GOALS_SELECTED: (value) => value.seasonGoalsComplete,
      NO_ACTIVE_GOALS: (value) => value.seasonGoalsComplete,
      NO_GOALS: (value) => value.seasonGoalsComplete,
      MISSING_SEASON: (value) => value.seasonGoalsComplete,
      MISSING_GOALS: (value) => value.seasonGoalsComplete,
      APP_NOT_COMPLETE: (value) => value.appStepComplete,
      APP_INCOMPLETE: (value) => value.appStepComplete,
      APP_CONTEXT_INCOMPLETE: (value) => value.appStepComplete,
      MISSING_APP_CONTEXT: (value) => value.appStepComplete,
      READINESS_NOT_COMPLETE: (value) => value.appStepComplete,
    };

  const pending = new Set<string>();
  for (const blocker of input.upstreamBlockers) {
    const normalized = normalizePlanningContextBlockerCode(blocker);
    if (satisfiedByStep[normalized]?.(input)) continue;
    const human = humanizePlanningContextBlockerCode(blocker);
    if (human) pending.add(human);
  }
  return Array.from(pending);
}

export function contextBuilderNextRequiredLabel(input: {
  appStepComplete: boolean;
  levelStepComplete: boolean;
  workloadComplete: boolean;
  seasonPhaseReady: boolean;
  goalsSelected: boolean;
  planDatesStepComplete: boolean;
  planningContextLocked: boolean;
}): string {
  if (!input.appStepComplete) return "Complete APP context";
  if (!input.levelStepComplete) return "Confirm athlete level";
  if (!input.workloadComplete) return "Complete workload assessment";
  if (!input.seasonPhaseReady || !input.goalsSelected) return "Select season and goals";
  if (!input.planDatesStepComplete) return "Confirm plan dates";
  if (input.planningContextLocked) return "Open Domain Plans Integration";
  return "Lock & Share Context with Coaches";
}

export function resolveContextBuilderPendingBeforeLock(
  input: CoachFacingPlanningContextPendingStepsInput,
): string[] {
  const fromBlockers = resolveCoachFacingPlanningContextPendingSteps(input);
  if (fromBlockers.length > 0) return fromBlockers;

  const localPending: string[] = [];
  if (!input.appStepComplete) localPending.push("Complete APP context");
  if (!input.levelStepComplete) localPending.push("Confirm athlete level");
  if (!input.workloadComplete) localPending.push("Complete workload assessment");
  if (!input.seasonGoalsComplete) localPending.push("Select season and goals");
  if (!input.planDatesStepComplete) localPending.push("Confirm plan dates");
  return localPending;
}

export function contextBuilderLedgerActionLabel(input: {
  step: ContextBuilderStepKey;
  complete: boolean;
  locked: boolean;
}): string {
  if (input.locked) return "Locked";
  if (input.step === "context-app") return "View APP Context";
  if (input.complete) {
    if (input.step === "level-validation") return "Edit Validation";
    if (input.step === "workload") return "Edit Workload";
    if (input.step === "season-goals") return "Edit Season & Goals";
    return "Edit Plan Dates";
  }
  if (input.step === "level-validation") return "Validate Level";
  if (input.step === "workload") return "Set Workload";
  if (input.step === "season-goals") return "Set Season & Goals";
  return "Set Plan Dates";
}

const WORKFLOW_RAIL_LABELS: Record<GuidedWorkflowStepKey, string> = {
  "context-app": "Context / APP",
  "level-validation": "Level Validation",
  workload: "Workload Assessment",
  "season-goals": "Season & Goals",
  "plan-dates": "Plan Dates",
  generate: "Generate Plan",
};

const WORKFLOW_TAB_LABELS: Record<GuidedWorkflowStepKey, string> = {
  "context-app": "Context / APP",
  "level-validation": "Level Validation",
  workload: "Workload",
  "season-goals": "Season & Goals",
  "plan-dates": "Plan Dates",
  generate: "Generate",
};

export type GovernedPlanContext = {
  planId: string;
  versionId: string;
  generationDomain: TrainingPlanGenerationDomain;
};

export type DomainReviewRevisionContextSource = "domain_review_drawer";

export type DomainReviewRevisionContext = {
  athleteId: string;
  domain: TrainingPlanGenerationDomain;
  selectedPlanId: string | null;
  selectedVersionId: string | null;
  planStatus: string | null;
  workflowStatus: AssistantDomainWorkflowStatus | null;
  currentFreeTextRevisionInstruction: string;
  source: DomainReviewRevisionContextSource;
  selectedDay: number | null;
  selectedDate: string | null;
};

export function buildDomainReviewRevisionContext(input: {
  athleteId: string;
  domain: TrainingPlanGenerationDomain;
  selectedPlanId?: string | null;
  selectedVersionId?: string | null;
  planStatus?: string | null;
  workflowStatus?: AssistantDomainWorkflowStatus | null;
  currentFreeTextRevisionInstruction: string;
  source?: DomainReviewRevisionContextSource;
  selectedDay?: number | null;
  selectedDate?: string | null;
}): DomainReviewRevisionContext {
  const normalizeOptionalString = (value: string | null | undefined): string | null => {
    const trimmed = value?.trim() ?? "";
    return trimmed === "" ? null : trimmed;
  };

  return {
    athleteId: input.athleteId.trim(),
    domain: input.domain,
    selectedPlanId: normalizeOptionalString(input.selectedPlanId),
    selectedVersionId: normalizeOptionalString(input.selectedVersionId),
    planStatus: normalizeOptionalString(input.planStatus),
    workflowStatus: input.workflowStatus ?? null,
    currentFreeTextRevisionInstruction: input.currentFreeTextRevisionInstruction.trim(),
    source: input.source ?? "domain_review_drawer",
    selectedDay: input.selectedDay ?? null,
    selectedDate: normalizeOptionalString(input.selectedDate),
  };
}

type HeadCoachDomainPlanState = {
  loading: boolean;
  error: string | null;
  latestDraft: CoachAthleteLatestDomainDraft | null;
  activeDetail: CoachPersistedTrainingPlanActiveDetail | null;
  summaryStatus: string | null;
  summaryPlanId: string | null;
  summaryVersionId: string | null;
};

type DomainReviewSurfaceModel = {
  domain: TrainingPlanGenerationDomain;
  domainLabel: string;
  state: HeadCoachDomainPlanState;
  assignmentDomainContext: TrainingPlanWorkspaceAssignmentDomainContext | null | undefined;
  assignedCoachLabel: string;
  workflowStatus: AssistantDomainWorkflowStatus;
  statusLabel: string;
  planStatusLabel: string;
  nextActionLabel: string;
  availableActionLabels: string[];
  allowedActions: Set<GovernedTrainingPlanWorkflowAction>;
  activeDetail: CoachPersistedTrainingPlanActiveDetail | null;
  planId: string;
  versionId: string;
  versionNumber: number | null;
  trainingDays: number | null;
  isCurrentReviewPlan: boolean;
  showWorkflow2DraftPendingNotice: boolean;
  canShowGenerateAction: boolean;
  canShowViewPlan: boolean;
  canShowSubmitForReview: boolean;
  canShowReviseAction: boolean;
  canShowApproveAction: boolean;
  canShowRequestRevisionAction: boolean;
  canShowReleaseAction: boolean;
  actionContext: GovernedPlanContext | null;
  viewPlanContext: WorkspaceDomainViewPlanContext | null;
};

function createEmptyHeadCoachDomainPlanStates(): Record<
  TrainingPlanGenerationDomain,
  HeadCoachDomainPlanState
> {
  return {
    SKILLS: {
      loading: false,
      error: null,
      latestDraft: null,
      activeDetail: null,
      summaryStatus: null,
      summaryPlanId: null,
      summaryVersionId: null,
    },
    NUTRITION: {
      loading: false,
      error: null,
      latestDraft: null,
      activeDetail: null,
      summaryStatus: null,
      summaryPlanId: null,
      summaryVersionId: null,
    },
    S_AND_C: {
      loading: false,
      error: null,
      latestDraft: null,
      activeDetail: null,
      summaryStatus: null,
      summaryPlanId: null,
      summaryVersionId: null,
    },
  };
}

export function reviewReviseStepLabelForPrimaryAction(
  action: TrainingPlanWorkspaceTabPrimaryAction,
): string | null {
  if (action === "REVIEW_DOMAIN_PLANS") return "Review Plans";
  if (action === "REVISE_OR_SUBMIT_OWN_DOMAIN_PLAN") return "Revise / Submit Plan";
  if (action === "VIEW_REVIEW_STATUS") return "Review Status";
  return null;
}

export function resolveReviewReviseStepLabelFromWorkspace(input: {
  workspace: TrainingPlanWorkspace | null;
  fallbackLabel: string | null;
}): string | null {
  if (input.workspace?.assignmentContext === undefined) {
    return input.fallbackLabel;
  }
  return reviewReviseStepLabelForPrimaryAction(
    deriveTrainingPlanWorkspaceTabStates(input.workspace).tabs.REVIEW_REVISE.primaryAction,
  );
}

export function shouldUseWorkflow1HeadCoachReviewActionPanel(input: {
  shell: TrainingPlanPageShell;
  workflowShape: string | null | undefined;
}): boolean {
  return input.shell === "head_coach_review" && input.workflowShape === "HEAD_COACH_REVIEWER";
}

export function resolveWorkflowReviewResetScopeDomain(input: {
  shell: TrainingPlanPageShell;
  workflowShape: string | null | undefined;
  currentCoachGenerationDomain: TrainingPlanGenerationDomain | null;
}): TrainingPlanGenerationDomain | null {
  if (
    shouldUseWorkflow1HeadCoachReviewActionPanel({
      shell: input.shell,
      workflowShape: input.workflowShape,
    })
  ) {
    return null;
  }
  return input.currentCoachGenerationDomain;
}

export function shouldShowSubmittedPlanLoading(input: {
  loading: boolean;
  hasActiveDetail: boolean;
  workflow1HeadCoachReviewActionPanelMode: boolean;
}): boolean {
  return (
    input.loading &&
    !(input.workflow1HeadCoachReviewActionPanelMode && input.hasActiveDetail)
  );
}

export function resolveHeadCoachReviewActiveDetailAfterRefresh(input: {
  refreshedActiveDetail: CoachPersistedTrainingPlanActiveDetail | null;
  previousActiveDetail: CoachPersistedTrainingPlanActiveDetail | null;
  summaryPlanId: string | null;
  preservePreviousDetail: boolean;
}): CoachPersistedTrainingPlanActiveDetail | null {
  if (input.refreshedActiveDetail !== null) {
    if (
      shouldKeepPreviousDomainReviewDetail({
        previousDetail: input.previousActiveDetail,
        refreshedDetail: input.refreshedActiveDetail,
      })
    ) {
      return input.previousActiveDetail;
    }
    return input.refreshedActiveDetail;
  }
  if (input.preservePreviousDetail) return input.previousActiveDetail;
  return (
    input.summaryPlanId !== null &&
    input.previousActiveDetail?.plan.id?.trim() === input.summaryPlanId
      ? input.previousActiveDetail
      : null
  );
}

export function shouldKeepPreviousDomainReviewDetail(input: {
  previousDetail: CoachPersistedTrainingPlanActiveDetail | null;
  refreshedDetail: CoachPersistedTrainingPlanActiveDetail | null;
}): boolean {
  const previous = input.previousDetail;
  const refreshed = input.refreshedDetail;
  if (previous === null || refreshed === null) return false;
  if (previous.plan.id.trim() !== refreshed.plan.id.trim()) return false;
  const previousVersionNumber = previous.version.versionNumber;
  const refreshedVersionNumber = refreshed.version.versionNumber;
  return (
    typeof previousVersionNumber === "number" &&
    typeof refreshedVersionNumber === "number" &&
    previousVersionNumber > refreshedVersionNumber
  );
}

export type DomainReviewSurfaceIdentity = {
  planId: string;
  versionId: string;
  versionNumber: number | null;
  source: "workspace_summary" | "state_summary" | "active_detail" | "none";
};

export function resolveDomainReviewSurfaceIdentity(input: {
  workspacePlanId: string | null | undefined;
  workspaceVersionId: string | null | undefined;
  workspaceVersionNumber: number | null | undefined;
  stateSummaryPlanId: string | null | undefined;
  stateSummaryVersionId: string | null | undefined;
  activeDetailPlanId: string | null | undefined;
  activeDetailVersionId: string | null | undefined;
  activeDetailVersionNumber: number | null | undefined;
}): DomainReviewSurfaceIdentity {
  const workspacePlanId = input.workspacePlanId?.trim() ?? "";
  const workspaceVersionId = input.workspaceVersionId?.trim() ?? "";
  const stateSummaryPlanId = input.stateSummaryPlanId?.trim() ?? "";
  const stateSummaryVersionId = input.stateSummaryVersionId?.trim() ?? "";
  const activeDetailPlanId = input.activeDetailPlanId?.trim() ?? "";
  const activeDetailVersionId = input.activeDetailVersionId?.trim() ?? "";
  const activeDetailVersionNumber = input.activeDetailVersionNumber ?? null;
  const workspaceVersionNumber = input.workspaceVersionNumber ?? null;
  const activeDetailIsNewerWorkspaceVersion =
    typeof activeDetailVersionNumber === "number" &&
    typeof workspaceVersionNumber === "number" &&
    activeDetailVersionNumber > workspaceVersionNumber;
  const activeDetailMatchesStateSummary =
    stateSummaryVersionId !== "" && stateSummaryVersionId === activeDetailVersionId;
  const shouldUseActiveDetail =
    activeDetailPlanId !== "" &&
    activeDetailVersionId !== "" &&
    (workspacePlanId === "" ||
      workspacePlanId === activeDetailPlanId ||
      stateSummaryPlanId === activeDetailPlanId) &&
    (workspaceVersionId === "" ||
      activeDetailVersionId === workspaceVersionId ||
      activeDetailMatchesStateSummary ||
      activeDetailIsNewerWorkspaceVersion);

  if (shouldUseActiveDetail) {
    return {
      planId: activeDetailPlanId,
      versionId: activeDetailVersionId,
      versionNumber: activeDetailVersionNumber,
      source: "active_detail",
    };
  }
  if (workspacePlanId !== "" || workspaceVersionId !== "") {
    return {
      planId: workspacePlanId,
      versionId: workspaceVersionId,
      versionNumber: workspaceVersionNumber,
      source: "workspace_summary",
    };
  }
  if (stateSummaryPlanId !== "" || stateSummaryVersionId !== "") {
    return {
      planId: stateSummaryPlanId,
      versionId: stateSummaryVersionId,
      versionNumber: null,
      source: "state_summary",
    };
  }
  return {
    planId: activeDetailPlanId,
    versionId: activeDetailVersionId,
    versionNumber: activeDetailVersionNumber,
    source: activeDetailPlanId !== "" || activeDetailVersionId !== "" ? "active_detail" : "none",
  };
}

export function domainReviewScheduleDescription(
  workflowStatus: AssistantDomainWorkflowStatus,
): string {
  if (workflowStatus === "draft_generated" || workflowStatus === "revision_requested") {
    return "Review the generated draft by day and session.";
  }
  return "Review the submitted plan by day and session.";
}

export function countDomainReviewTrainingDays(
  detail: CoachPersistedTrainingPlanActiveDetail | null,
): number | null {
  return detail?.days.filter((day) => day.sessions.length > 0).length ?? null;
}

function workflowStepLabel(
  key: GuidedWorkflowStepKey,
  headCoachReviewMode: boolean,
  kind: "rail" | "tab",
  reviewReviseStepLabel?: string | null,
): string {
  if (key === "generate" && reviewReviseStepLabel !== null && reviewReviseStepLabel !== undefined) {
    return reviewReviseStepLabel;
  }
  if (key === "generate" && headCoachReviewMode) {
    return kind === "rail" ? "Review Plans" : "Review Plans";
  }
  return kind === "rail" ? WORKFLOW_RAIL_LABELS[key] : WORKFLOW_TAB_LABELS[key];
}

function trainingPlanDomainLabel(domain: TrainingPlanGenerationDomain): string {
  if (domain === "SKILLS") return "Skills Plan";
  if (domain === "NUTRITION") return "Nutrition Plan";
  return "Strength & Conditioning Plan";
}

function assistantRoleLabel(domain: TrainingPlanGenerationDomain | null): string {
  if (domain === "SKILLS") return "Skills Coach";
  if (domain === "NUTRITION") return "Nutrition Coach";
  if (domain === "S_AND_C") return "Strength & Conditioning Coach";
  return "Assistant Coach";
}

function assistantDomainPlanTitle(domain: TrainingPlanGenerationDomain | null): string {
  if (domain === "SKILLS") return "My Skills Plan";
  if (domain === "NUTRITION") return "My Nutrition Plan";
  if (domain === "S_AND_C") return "My Strength & Conditioning Plan";
  return "My Domain Plan";
}

function assistantCreatePlanLabel(domain: TrainingPlanGenerationDomain | null): string {
  if (domain === "SKILLS") return "Create Skills Plan";
  if (domain === "NUTRITION") return "Create Nutrition Plan";
  if (domain === "S_AND_C") return "Create S&C Plan";
  return "Create Plan";
}

function assistantViewPlanLabel(domain: TrainingPlanGenerationDomain | null): string {
  if (domain === "SKILLS") return "View Plan";
  if (domain === "NUTRITION") return "View Plan";
  if (domain === "S_AND_C") return "View Plan";
  return "View Plan";
}

function formatMinutesAsHoursMinutes(totalMinutes: number | null): string {
  if (typeof totalMinutes !== "number" || !Number.isFinite(totalMinutes) || totalMinutes < 0) {
    return "Not available";
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function readSessionDurationMinutes(session: CoachPersistedTrainingPlanActiveDetail["days"][number]["sessions"][number]): number | null {
  return typeof session.plannedDurationMinutes === "number" &&
    Number.isFinite(session.plannedDurationMinutes)
    ? session.plannedDurationMinutes
    : null;
}

function readDraftSessionDurationMinutes(
  session: CoachAthleteLatestDomainDraft["days"][number]["sessions"][number],
): number | null {
  return typeof session.plannedDurationMinutes === "number" &&
    Number.isFinite(session.plannedDurationMinutes)
    ? session.plannedDurationMinutes
    : null;
}

function reviewPlanButtonLabel(domain: TrainingPlanGenerationDomain): string {
  if (domain === "SKILLS") return "Review Skills Plan";
  if (domain === "NUTRITION") return "Review Nutrition Plan";
  return "Review S&C Plan";
}

function domainPlanReviewTitle(domain: TrainingPlanGenerationDomain): string {
  if (domain === "SKILLS") return "Skills Plan Review";
  if (domain === "NUTRITION") return "Nutrition Plan Review";
  return "Strength & Conditioning Plan Review";
}

function openDomainPlanReviewLabel(domain: TrainingPlanGenerationDomain): string {
  if (domain === "SKILLS") return "Open Skills Plan Review";
  if (domain === "NUTRITION") return "Open Nutrition Plan Review";
  return "Open S&C Plan Review";
}

function viewDomainInPlanViewerLabel(domain: TrainingPlanGenerationDomain): string {
  if (domain === "SKILLS") return "View Skills in Plan Viewer";
  if (domain === "NUTRITION") return "View Nutrition in Plan Viewer";
  return "View S&C in Plan Viewer";
}

function normalizeHeadCoachDomainWorkflowStatus(
  status: string | null | undefined,
): AssistantDomainWorkflowStatus | null {
  const normalizedStatus = status?.trim().toUpperCase() ?? "";
  if (normalizedStatus === "ACTIVE" || normalizedStatus === "RELEASED") return "released";
  if (normalizedStatus === "HEAD_COACH_APPROVED") return "approved";
  if (normalizedStatus === "REVISION_REQUESTED") return "revision_requested";
  if (
    normalizedStatus === "ASSISTANT_COACH_APPROVED" ||
    normalizedStatus === "SUBMITTED_FOR_REVIEW" ||
    normalizedStatus === "PENDING_HEAD_COACH_REVIEW"
  ) {
    return "submitted_for_review";
  }
  if (normalizedStatus === "AI_GENERATED" || normalizedStatus === "DRAFT") {
    return "draft_generated";
  }
  return null;
}

function headCoachDomainStatusLabel(kind: AssistantDomainWorkflowStatus): string {
  if (kind === "released") return "Domain Released to Athlete";
  if (kind === "approved") return "Head Coach Approved";
  if (kind === "revision_requested") return "Revision Requested";
  if (kind === "submitted_for_review") return "Submitted for Review";
  if (kind === "draft_generated") return "Draft Created";
  return "Not Created";
}

function resolveHeadCoachDomainSummaryVersionId(input: {
  versionId: string | null;
  selectedVersionId?: string | null;
  latestVersionId?: string | null;
  approvedVersionId?: string | null;
  activeVersionId?: string | null;
}): string | null {
  return (
    input.selectedVersionId?.trim() ??
    input.versionId?.trim() ??
    input.latestVersionId?.trim() ??
    input.approvedVersionId?.trim() ??
    input.activeVersionId?.trim() ??
    null
  ) || null;
}

export function resolveHeadCoachReviewSummarySource(input: {
  workspace: TrainingPlanWorkspace | null;
  domain: TrainingPlanGenerationDomain;
  legacySummary: DomainPlanSummaryItem;
}): {
  planId: string | null;
  versionId: string | null;
  status: string | null;
  hasWorkspaceIds: boolean;
} {
  const workspaceSummary = input.workspace?.domains[input.domain]?.summary ?? null;
  const workspacePlanId = workspaceSummary?.trainingPlanId?.trim() ?? "";
  const workspaceVersionId =
    workspaceSummary !== null ? resolveHeadCoachDomainSummaryVersionId(workspaceSummary) : null;
  const legacyPlanId = input.legacySummary.trainingPlanId?.trim() ?? "";
  const legacyVersionId = resolveHeadCoachDomainSummaryVersionId(input.legacySummary);
  return {
    planId: workspacePlanId !== "" ? workspacePlanId : legacyPlanId !== "" ? legacyPlanId : null,
    versionId:
      workspaceVersionId !== null && workspaceVersionId !== ""
        ? workspaceVersionId
        : legacyVersionId !== null && legacyVersionId !== ""
          ? legacyVersionId
          : null,
    status:
      (workspaceSummary?.status?.trim() ?? "") !== ""
        ? (workspaceSummary?.status?.trim() ?? null)
        : input.legacySummary.status?.trim() || null,
    hasWorkspaceIds: workspacePlanId !== "" && (workspaceVersionId ?? "") !== "",
  };
}

export function shouldShowHeadCoachReviewEmptyState(input: {
  activeDetail: CoachPersistedTrainingPlanActiveDetail | null;
  workspacePlanId: string | null;
  workspaceVersionId: string | null;
  isLoading: boolean;
  loadError: string | null;
}): boolean {
  if (input.isLoading || input.loadError !== null || input.activeDetail !== null) {
    return false;
  }
  return (
    (input.workspacePlanId?.trim() ?? "") === "" &&
    (input.workspaceVersionId?.trim() ?? "") === ""
  );
}

function resolveHeadCoachDomainSummaryStatus(input: {
  summaryStatus: string | null;
  activeDetail: CoachPersistedTrainingPlanActiveDetail | null;
  versions: CoachPersistedTrainingPlanVersion[];
  summaryVersionId: string | null;
}): string | null {
  const summaryStatus = input.summaryStatus?.trim() ?? "";
  if (summaryStatus !== "") return summaryStatus;

  const detailStatus =
    input.activeDetail?.version.status?.trim() ?? input.activeDetail?.plan.status?.trim() ?? "";
  if (detailStatus !== "") return detailStatus;

  const matchingVersion =
    (input.summaryVersionId
      ? input.versions.find((version) => version.id === input.summaryVersionId)
      : null) ??
    input.versions.find((version) => version.isActiveVersion === true) ??
    input.versions.find((version) => version.isApproved === true) ??
    input.versions[0] ??
    null;

  const versionStatus = matchingVersion?.status?.trim() ?? "";
  return versionStatus !== "" ? versionStatus : null;
}

export function deriveHeadCoachDomainWorkflowStatus(input: {
  summaryStatus: string | null;
  summaryPlanId: string | null;
  summaryVersionId: string | null;
  activeDetail: CoachPersistedTrainingPlanActiveDetail | null;
  latestDraft?: CoachAthleteLatestDomainDraft | null;
}): AssistantDomainWorkflowStatus {
  const fromDetail = deriveAssistantDomainWorkflowStatus({
    latestDraft: input.latestDraft ?? null,
    activeDetail: input.activeDetail,
  });
  if (fromDetail !== "not_created") return fromDetail;

  const fromSummary = normalizeHeadCoachDomainWorkflowStatus(input.summaryStatus);
  if (fromSummary !== null) return fromSummary;

  const hasPersistedReviewablePlan =
    (input.summaryPlanId?.trim() ?? "") !== "" && (input.summaryVersionId?.trim() ?? "") !== "";
  if (hasPersistedReviewablePlan) return "draft_generated";

  return "not_created";
}

type AssistantDomainWorkflowStatus =
  | "not_created"
  | "draft_generated"
  | "submitted_for_review"
  | "revision_requested"
  | "approved"
  | "released";

export function assistantWorkflowStatusLabelForKind(
  kind: AssistantDomainWorkflowStatus,
): string {
  if (kind === "draft_generated") return "Draft Generated";
  if (kind === "submitted_for_review") return "Submitted for Review";
  if (kind === "revision_requested") return "Revision Requested";
  if (kind === "approved") return "Approved by Head Coach";
  if (kind === "released") return "Domain Released to Athlete";
  return "Not Created";
}

export function domainIntegrationOwnerLabel(
  domain: TrainingPlanGenerationDomain,
  assignmentDomainContext: TrainingPlanWorkspaceAssignmentDomainContext | null | undefined,
): string {
  return domainIntegrationAssignedCoachLabel(domain, assignmentDomainContext);
}

function assignedDomainCoachFallbackLabel(domain: TrainingPlanGenerationDomain): string {
  if (domain === "SKILLS") return "Assigned Skills Coach";
  if (domain === "NUTRITION") return "Assigned Nutrition Coach";
  return "Assigned S&C Coach";
}

export function domainIntegrationAssignedCoachLabel(
  domain: TrainingPlanGenerationDomain,
  assignmentDomainContext: TrainingPlanWorkspaceAssignmentDomainContext | null | undefined,
): string {
  if (assignmentDomainContext === null || assignmentDomainContext === undefined) {
    return "Unassigned";
  }
  const assignedCoachName =
    assignmentDomainContext.assignedCoachDisplayName ??
    assignmentDomainContext.assignedCoachName ??
    assignmentDomainContext.ownerDisplayName ??
    assignmentDomainContext.ownerName ??
    null;
  if (assignedCoachName !== null) {
    return assignedCoachName;
  }
  if (assignmentDomainContext.ownerType === "HEAD_COACH_SELF") {
    return "Head Coach";
  }
  if (assignmentDomainContext.ownerType === "ASSIGNED_DOMAIN_COACH") {
    return assignedDomainCoachFallbackLabel(domain);
  }
  return "Unassigned";
}

function domainIntegrationStatusTone(kind: AssistantDomainWorkflowStatus): string {
  if (kind === "released" || kind === "approved") {
    return "border-green-200 bg-green-50 text-green-700";
  }
  if (kind === "submitted_for_review" || kind === "revision_requested") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (kind === "draft_generated") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }
  return "border-slate-200 bg-slate-50 text-textSecondary";
}

export function domainIntegrationNextActionLabel(input: {
  workflowStatus: AssistantDomainWorkflowStatus;
  assignmentDomainContext: TrainingPlanWorkspaceAssignmentDomainContext | null | undefined;
  planningContextLocked: boolean;
  loading: boolean;
  hasError: boolean;
  canGenerate: boolean;
  canSubmitForReview: boolean;
  canViewPlan: boolean;
  canReview: boolean;
  canRelease: boolean;
  isCurrentReviewPlan: boolean;
}): string {
  if (input.loading) return "Loading the latest plan state.";
  if (input.hasError) return "Resolve the status warning, then refresh this track.";

  if (input.workflowStatus === "not_created") {
    if (input.canGenerate) return "Ready to generate this domain plan.";
    if (!input.planningContextLocked) {
      return "Waiting for planning context to be locked.";
    }
    if (input.assignmentDomainContext?.ownerType === "NONE") {
      return "No domain owner is assigned.";
    }
    return "Waiting for the assigned coach to generate a plan.";
  }

  if (input.workflowStatus === "draft_generated") {
    if (input.canReview) return "Review the generated draft and approve or revise.";
    if (input.canSubmitForReview) return "Ready to submit for review.";
    return "Waiting for the assigned coach to submit for review.";
  }

  if (input.workflowStatus === "submitted_for_review") {
    if (input.canReview) return "Open review to approve or request changes.";
    if (input.canViewPlan) return "Ready for Head Coach review.";
    return "Waiting for review access.";
  }

  if (input.workflowStatus === "revision_requested") {
    if (input.assignmentDomainContext?.ownedByCurrentUser === true) {
      return "Revision requested; revise and resubmit.";
    }
    return "Waiting for the assigned coach to revise and resubmit.";
  }

  if (input.workflowStatus === "approved") {
    return input.canRelease
      ? "Approved and ready to release."
      : "Approved; waiting for release.";
  }

  return "This domain is released to the athlete.";
}

export type DomainIntegrationAvailableAction =
  | "GENERATE"
  | "VIEW_OR_REVIEW_PLAN"
  | "SUBMIT_FOR_REVIEW"
  | "HEAD_COACH_REVIEW"
  | "RELEASE_DOMAIN"
  | "REVISE_INSTRUCTIONS";

export function domainIntegrationAvailableActionLabels(input: {
  canGenerate: boolean;
  canViewPlan: boolean;
  canSubmitForReview: boolean;
  canReview: boolean;
  canRelease: boolean;
  canRevise: boolean;
}): string[] {
  const actions: string[] = [];
  if (input.canGenerate) actions.push("Generate domain plan");
  if (input.canViewPlan) actions.push("View / review domain plan");
  if (input.canSubmitForReview) actions.push("Submit for Head Coach review");
  if (input.canReview) actions.push("Approve or request changes");
  if (input.canRelease) actions.push("Release this plan to athlete");
  if (input.canRevise) actions.push("Revise instructions");
  return actions;
}

export type DomainReviewDrawerWorkflowActions = {
  canShowViewPlan: boolean;
  canShowSubmitForReview: boolean;
  canShowReviseAction: boolean;
  canShowApproveAction: boolean;
  canShowRequestRevisionAction: boolean;
  canShowReleaseAction: boolean;
  hasAuthorizedWorkflowAction: boolean;
};

export function resolveDomainReviewDrawerWorkflowActions(input: {
  workflowStatus: AssistantDomainWorkflowStatus;
  canShowViewPlan: boolean;
  canShowSubmitForReview: boolean;
  canShowReviseAction: boolean;
  canShowApproveAction: boolean;
  canShowRequestRevisionAction: boolean;
  canShowReleaseAction: boolean;
  hasViewPlanContext: boolean;
}): DomainReviewDrawerWorkflowActions {
  const stateAllowsOwnerDraftAction =
    input.workflowStatus === "draft_generated" ||
    input.workflowStatus === "revision_requested";
  const actions = {
    canShowViewPlan:
      input.workflowStatus === "released" &&
      input.canShowViewPlan &&
      input.hasViewPlanContext,
    canShowSubmitForReview: stateAllowsOwnerDraftAction && input.canShowSubmitForReview,
    canShowReviseAction: stateAllowsOwnerDraftAction && input.canShowReviseAction,
    canShowApproveAction:
      (input.workflowStatus === "submitted_for_review" ||
        (stateAllowsOwnerDraftAction && !input.canShowSubmitForReview)) &&
      input.canShowApproveAction,
    canShowRequestRevisionAction:
      input.workflowStatus === "submitted_for_review" &&
      input.canShowRequestRevisionAction,
    canShowReleaseAction: input.workflowStatus === "approved" && input.canShowReleaseAction,
  };
  return {
    ...actions,
    hasAuthorizedWorkflowAction: Object.values(actions).some(Boolean),
  };
}

export function deriveAssistantDomainWorkflowStatus(input: {
  latestDraft: CoachAthleteLatestDomainDraft | null;
  activeDetail: CoachPersistedTrainingPlanActiveDetail | null;
}): AssistantDomainWorkflowStatus {
  const allowedActions = new Set(input.activeDetail?.allowedActions ?? []);
  const hasPlanVersion =
    (input.activeDetail?.plan.id?.trim() ?? input.latestDraft?.trainingPlanId?.trim() ?? "") !== "" &&
    (input.activeDetail?.version.id?.trim() ??
      input.latestDraft?.trainingPlanVersionId?.trim() ??
      "") !== "";
  const normalizedStatus = (
    input.activeDetail?.version.status ??
    input.activeDetail?.plan.status ??
    input.latestDraft?.status ??
    ""
  )
    .trim()
    .toUpperCase();

  if (normalizedStatus === "ACTIVE") return "released";
  if (normalizedStatus === "HEAD_COACH_APPROVED") return "approved";
  if (normalizedStatus === "REVISION_REQUESTED") return "revision_requested";
  if (
    normalizedStatus === "ASSISTANT_COACH_APPROVED" ||
    allowedActions.has("HEAD_APPROVE") ||
    allowedActions.has("REQUEST_REVISION")
  ) {
    return "submitted_for_review";
  }
  if (
    ((normalizedStatus === "AI_GENERATED" || normalizedStatus === "DRAFT") && hasPlanVersion) ||
    hasPlanVersion
  ) {
    return "draft_generated";
  }
  return "not_created";
}

export function shouldShowGeneratedPlanSyncingNotice(input: {
  generateResultMatchesCurrentDomain: boolean;
  currentDomainHasPersistedIds: boolean;
}): boolean {
  return input.generateResultMatchesCurrentDomain && !input.currentDomainHasPersistedIds;
}

export function canShowDomainReviseAction(input: {
  workflowStatus: AssistantDomainWorkflowStatus;
  reviseIds: DomainRevisePlanIds | null;
  requesterOwnsDomain: boolean;
}): boolean {
  if (!input.requesterOwnsDomain) return false;
  if (input.reviseIds === null) return false;
  return (
    input.workflowStatus === "draft_generated" ||
    input.workflowStatus === "revision_requested"
  );
}

export type DomainReviseAvailability = {
  domain: TrainingPlanGenerationDomain;
  planId: string | null;
  versionId: string | null;
  baseVersionId: string | null;
  requesterCanRevise: boolean;
  baseVersionAvailable: boolean;
  mutationEnabled: boolean;
  placeholderVisible: boolean;
  reason:
    | "ready_existing_editable_version"
    | "future_base_version_ready"
    | "missing_plan_id"
    | "missing_version_id"
    | "missing_base_version"
    | "not_authorized"
    | "unsupported_workflow_status";
};

export function resolveDomainReviseAvailability(input: {
  domain: TrainingPlanGenerationDomain;
  workflowStatus: AssistantDomainWorkflowStatus;
  planId: string | null | undefined;
  versionId: string | null | undefined;
  baseVersionId?: string | null | undefined;
  assignmentDomainContext:
    | TrainingPlanWorkspaceAssignmentDomainContext
    | null
    | undefined;
  legacyRequesterOwnsDomain: boolean;
}): DomainReviseAvailability {
  const assignmentDomainContext = input.assignmentDomainContext;
  const requesterCanRevise =
    assignmentDomainContext === null || assignmentDomainContext === undefined
      ? input.legacyRequesterOwnsDomain
      : assignmentDomainContext.ownedByCurrentUser &&
        assignmentDomainContext.canRevise &&
        assignmentDomainContext.ownerType !== "NONE";
  const planId = input.planId?.trim() || null;
  const versionId = input.versionId?.trim() || null;
  const baseVersionId = input.baseVersionId?.trim() || null;
  const baseVersionAvailable =
    input.workflowStatus === "approved" || input.workflowStatus === "released"
      ? baseVersionId !== null || versionId !== null
      : false;

  if (!requesterCanRevise) {
    return {
      domain: input.domain,
      planId,
      versionId,
      baseVersionId,
      requesterCanRevise,
      baseVersionAvailable,
      mutationEnabled: false,
      placeholderVisible: false,
      reason: "not_authorized",
    };
  }
  if (planId === null) {
    return {
      domain: input.domain,
      planId,
      versionId,
      baseVersionId,
      requesterCanRevise,
      baseVersionAvailable,
      mutationEnabled: false,
      placeholderVisible: false,
      reason: "missing_plan_id",
    };
  }
  if (versionId === null) {
    return {
      domain: input.domain,
      planId,
      versionId,
      baseVersionId,
      requesterCanRevise,
      baseVersionAvailable,
      mutationEnabled: false,
      placeholderVisible: false,
      reason: "missing_version_id",
    };
  }
  if (
    input.workflowStatus === "draft_generated" ||
    input.workflowStatus === "revision_requested"
  ) {
    return {
      domain: input.domain,
      planId,
      versionId,
      baseVersionId,
      requesterCanRevise,
      baseVersionAvailable,
      mutationEnabled: true,
      placeholderVisible: true,
      reason: "ready_existing_editable_version",
    };
  }
  if (input.workflowStatus === "approved" || input.workflowStatus === "released") {
    if (!baseVersionAvailable) {
      return {
        domain: input.domain,
        planId,
        versionId,
        baseVersionId,
        requesterCanRevise,
        baseVersionAvailable,
        mutationEnabled: false,
        placeholderVisible: true,
        reason: "missing_base_version",
      };
    }
    return {
      domain: input.domain,
      planId,
      versionId,
      baseVersionId: baseVersionId ?? versionId,
      requesterCanRevise,
      baseVersionAvailable,
      mutationEnabled: false,
      placeholderVisible: true,
      reason: "future_base_version_ready",
    };
  }

  return {
    domain: input.domain,
    planId,
    versionId,
    baseVersionId,
    requesterCanRevise,
    baseVersionAvailable,
    mutationEnabled: false,
    placeholderVisible: false,
    reason: "unsupported_workflow_status",
  };
}

export type Workflow2SubmittedDomainSkillsSlotProjection = {
  workflowStatus: AssistantDomainWorkflowStatus;
  planId: string;
  versionId: string;
};

/** Workflow 2 only: merge HC-owned Skills draft/detail into the Submitted Domain Plans slot. */
export function resolveWorkflow2SubmittedDomainSkillsSlotProjection(input: {
  summaryStatus: string | null;
  summaryPlanId: string | null;
  summaryVersionId: string | null;
  summaryActiveDetail: CoachPersistedTrainingPlanActiveDetail | null;
  ownedLatestDraft: CoachAthleteLatestDomainDraft | null;
  ownedActiveDetail: CoachPersistedTrainingPlanActiveDetail | null;
}): Workflow2SubmittedDomainSkillsSlotProjection {
  const fromSummaryOnly = deriveHeadCoachDomainWorkflowStatus({
    summaryStatus: input.summaryStatus,
    summaryPlanId: input.summaryPlanId,
    summaryVersionId: input.summaryVersionId,
    activeDetail: input.summaryActiveDetail,
  });
  if (fromSummaryOnly !== "not_created") {
    const planId =
      input.summaryPlanId?.trim() ??
      input.summaryActiveDetail?.plan.id?.trim() ??
      "";
    const versionId =
      input.summaryVersionId?.trim() ??
      input.summaryActiveDetail?.version.id?.trim() ??
      "";
    return {
      workflowStatus: fromSummaryOnly,
      planId,
      versionId,
    };
  }

  const activeDetail = input.summaryActiveDetail ?? input.ownedActiveDetail;
  const latestDraft = input.ownedLatestDraft;
  const resolvedPlanId =
    input.summaryPlanId?.trim() ??
    activeDetail?.plan.id?.trim() ??
    latestDraft?.trainingPlanId?.trim() ??
    null;
  const resolvedVersionId =
    input.summaryVersionId?.trim() ??
    activeDetail?.version.id?.trim() ??
    latestDraft?.trainingPlanVersionId?.trim() ??
    null;

  return {
    workflowStatus: deriveHeadCoachDomainWorkflowStatus({
      summaryStatus: input.summaryStatus,
      summaryPlanId: resolvedPlanId,
      summaryVersionId: resolvedVersionId,
      activeDetail,
      latestDraft,
    }),
    planId: resolvedPlanId ?? "",
    versionId: resolvedVersionId ?? "",
  };
}

/** Workflow 2 submit-review refresh: summary status is enough; skip slow versions read. */
export function shouldSkipPersistedVersionsFetchWhenSummaryStatusPresent(
  summaryStatus: string | null | undefined,
): boolean {
  return (summaryStatus?.trim() ?? "") !== "";
}

export function shouldClearWorkflow2SkillsSubmitSlotError(input: {
  workflowStatus: AssistantDomainWorkflowStatus;
  slotError: string | null;
}): boolean {
  if (input.slotError === null) return false;
  return input.workflowStatus === "submitted_for_review";
}

export function workflow2SkillsSubmitReviewReconciled(
  workflowStatus: AssistantDomainWorkflowStatus,
): boolean {
  return (
    workflowStatus === "submitted_for_review" ||
    workflowStatus === "approved" ||
    workflowStatus === "released"
  );
}

export type Step6GenerationLifecyclePhase =
  | "pre_generation"
  | "generating"
  | "generated_draft";

export function resolveStep6GenerationLifecyclePhase(input: {
  generationInProgress: boolean;
  hasExistingDomainPlan: boolean;
  persistedDetailLoaded: boolean;
  latestDraftLoaded: boolean;
  generateSuccessLoaded: boolean;
}): Step6GenerationLifecyclePhase {
  if (input.generationInProgress) return "generating";
  if (
    input.hasExistingDomainPlan ||
    input.persistedDetailLoaded ||
    input.latestDraftLoaded ||
    input.generateSuccessLoaded
  ) {
    return "generated_draft";
  }
  return "pre_generation";
}

export function shouldShowStep6PreGenerationReadiness(input: {
  isDownstreamDomainCoach: boolean;
  lifecyclePhase: Step6GenerationLifecyclePhase;
}): boolean {
  return !input.isDownstreamDomainCoach && input.lifecyclePhase === "pre_generation";
}

/** Ordered workflow steps for rail / tabs only */
const WORKFLOW_STEP_SEQUENCE_LIST: GuidedWorkflowStepKey[] = [
  "context-app",
  "level-validation",
  "workload",
  "season-goals",
  "plan-dates",
  "generate",
];
const CONTEXT_BUILDER_STEP_SEQUENCE_LIST: ContextBuilderStepKey[] = [
  "context-app",
  "level-validation",
  "workload",
  "season-goals",
  "plan-dates",
];
type GuidedWorkflowStepStatus = "completed" | "active" | "available" | "locked";

/** Props for tab strip / rail derived from readiness + tab selection */
type GuidedWorkflowUiStep = {
  key: GuidedWorkflowStepKey;
  title: string;
  summary: string;
  status: GuidedWorkflowStepStatus;
  /** Backend-derived completion only (see workflowStepCompleteForTick); never tied to selection */
  markCompleteTick: boolean;
};

function guidedWorkflowRailSubtitle(status: GuidedWorkflowStepStatus): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "active":
      return "Active state";
    case "available":
      return "Ready";
    default:
      return "Locked";
  }
}

/** All progress connectors use neutral grey; completion is conveyed by ticks on steps. */
function railGapSegmentClass(sideHidden: boolean): string {
  const base = "h-[3px] flex-1 rounded-full bg-slate-200";
  return sideHidden ? `${base} pointer-events-none opacity-0` : base;
}

const TRAINING_PLAN_WORKSPACE_DOMAINS: TrainingPlanGenerationDomain[] = [
  "SKILLS",
  "NUTRITION",
  "S_AND_C",
];

export type TrainingPlanWorkspaceVisualMode =
  | "context-builder"
  | "domain-integration"
  | "plan-viewer";

export type TrainingPlanWorkspaceLifecycleStepState =
  | "completed"
  | "active"
  | "available"
  | "locked";

export type TrainingPlanWorkspaceLifecycleStep = {
  key: TrainingPlanWorkspaceVisualMode;
  title: string;
  description: string;
  state: TrainingPlanWorkspaceLifecycleStepState;
};

export function resolveTrainingPlanWorkspaceDomainIntegrationComplete(
  workspace: TrainingPlanWorkspace | null,
): boolean {
  if (workspace === null) return false;

  const assignedDomains =
    workspace.assignmentContext !== undefined
      ? TRAINING_PLAN_WORKSPACE_DOMAINS.filter(
          (domain) => workspace.assignmentContext?.domains[domain].ownerType !== "NONE",
        )
      : TRAINING_PLAN_WORKSPACE_DOMAINS.filter((domain) => {
          const entry = workspace.domains[domain];
          return (
            entry.canOpen ||
            entry.submittedForReview ||
            entry.allowedActions.length > 0 ||
            (entry.summary.trainingPlanId?.trim() ?? "") !== "" ||
            (entry.summary.status?.trim() ?? "") !== ""
          );
        });

  return (
    assignedDomains.length > 0 &&
    assignedDomains.every(
      (domain) => deriveWorkflowStatusFromWorkspaceDomain(workspace.domains[domain]) === "released",
    )
  );
}

export function resolveTrainingPlanWorkspaceHasReleasedDomain(
  workspace: TrainingPlanWorkspace | null,
): boolean {
  if (workspace === null) return false;

  return TRAINING_PLAN_WORKSPACE_DOMAINS.some(
    (domain) => deriveWorkflowStatusFromWorkspaceDomain(workspace.domains[domain]) === "released",
  );
}

export function resolveTrainingPlanWorkspaceLifecycleSteps(input: {
  activeMode: TrainingPlanWorkspaceVisualMode;
  contextComplete: boolean;
  domainAvailable: boolean;
  planViewerAvailable: boolean;
  domainIntegrationComplete: boolean;
}): TrainingPlanWorkspaceLifecycleStep[] {
  return [
    {
      key: "context-builder",
      title: "Context Builder",
      description: "Validate athlete context and lock the planning inputs.",
      state:
        input.activeMode === "context-builder"
          ? "active"
          : input.contextComplete
            ? "completed"
            : "available",
    },
    {
      key: "domain-integration",
      title: "Domain Plans Integration",
      description: "Coordinate domain plans and governance actions.",
      state: !input.domainAvailable
        ? "locked"
        : input.domainIntegrationComplete
          ? "completed"
          : input.activeMode === "domain-integration"
            ? "active"
            : "available",
    },
    {
      key: "plan-viewer",
      title: "Plan Viewer",
      description: "Review selected, active, or released domain plan details.",
      state:
        input.activeMode === "plan-viewer"
          ? "active"
          : input.planViewerAvailable
            ? "available"
            : "locked",
    },
  ];
}

export function shouldShowReleasedPlanViewerCanvas(input: {
  selectedWorkflowTab: GuidedWorkflowStepKey;
  selectedDomain: TrainingPlanGenerationDomain | null;
  releasedPlanViewerIntentPresent: boolean;
  requestedPlanIdPresent: boolean;
  releasedWorkflowStatus: AssistantDomainWorkflowStatus | null;
}): boolean {
  if (input.selectedWorkflowTab !== "generate") return false;
  if (input.selectedDomain === null) return false;
  if (input.releasedPlanViewerIntentPresent) return true;
  return input.requestedPlanIdPresent && input.releasedWorkflowStatus === "released";
}

function workspaceLifecycleStateLabel(
  state: TrainingPlanWorkspaceLifecycleStepState,
): string {
  if (state === "completed") return "Complete";
  if (state === "active") return "Active";
  if (state === "available") return "Available";
  return "Locked";
}

function workspaceLifecycleStepClass(
  state: TrainingPlanWorkspaceLifecycleStepState,
): string {
  if (state === "completed") return "border-green-300 bg-green-50 text-green-700";
  if (state === "active") return "border-primary bg-primary text-white";
  if (state === "available") return "border-slate-300 bg-white text-textPrimary";
  return "border-slate-200 bg-slate-100 text-textMuted";
}

function TrainingPlanWorkspaceLifecycleHeader({
  steps,
}: {
  steps: TrainingPlanWorkspaceLifecycleStep[];
}) {
  return (
    <nav
      aria-label="Training plan workspace lifecycle"
      className="border-y border-border/70 py-3"
    >
      <ol className="grid gap-y-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.key}
            className="min-w-0"
          >
            <div className="flex items-center">
              <div
                className={cn(
                  "hidden h-px flex-1 md:block",
                  index === 0 ? "bg-transparent" : "bg-border",
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs",
                  workspaceLifecycleStepClass(step.state),
                )}
              >
                {step.state === "completed" ? "✓" : index + 1}
              </span>
              <div
                className={cn(
                  "hidden h-px flex-1 md:block",
                  index === steps.length - 1 ? "bg-transparent" : "bg-border",
                )}
                aria-hidden="true"
              />
            </div>
            <div className="mt-2 space-y-0.5 px-2 text-center">
              <div className="text-xs uppercase tracking-wide text-textMuted">
                Phase {index + 1}
              </div>
              <div className="text-sm font-medium text-textPrimary">{step.title}</div>
              <div className="text-xs text-textSecondary">
                {workspaceLifecycleStateLabel(step.state)}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function workspaceModeShellModeLabel(mode: TrainingPlanWorkspaceVisualMode): string {
  if (mode === "context-builder") return "Context Builder";
  if (mode === "domain-integration") return "Domain Plans Integration";
  return "Plan Viewer";
}

function TrainingPlanWorkspaceModeShell({
  mode,
  header,
  summary,
  primary,
  secondary,
  activity,
}: {
  mode: TrainingPlanWorkspaceVisualMode;
  header: ReactNode;
  summary?: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  activity?: ReactNode;
}) {
  const hasSecondary = secondary !== null && secondary !== undefined;
  const isContextBuilder = mode === "context-builder";
  const usesSeparatorShell = isContextBuilder || mode === "domain-integration";
  const usesPlainSummary = mode === "plan-viewer";
  return (
    <section
      className={cn(
        "space-y-4",
        usesSeparatorShell
          ? "border-t border-border/70 pt-4"
          : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5",
      )}
      data-workspace-mode={mode}
    >
      <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">{header}</div>
        <span className="w-fit shrink-0 border-l border-border pl-3 text-xs text-textSecondary">
          {workspaceModeShellModeLabel(mode)}
        </span>
      </div>
      {summary !== null && summary !== undefined ? (
        <div
          className={
            usesPlainSummary
              ? ""
              : usesSeparatorShell
                ? "border-y border-border/70 py-3"
                : "rounded-lg border border-slate-200 bg-slate-50 p-3"
          }
        >
          {summary}
        </div>
      ) : null}
      <div className={hasSecondary ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]" : ""}>
        <div className="min-w-0">{primary}</div>
        {hasSecondary ? <aside className="min-w-0">{secondary}</aside> : null}
      </div>
      {activity !== null && activity !== undefined ? (
        <div className={usesSeparatorShell ? "border-y border-border/70 py-3" : "rounded-lg border border-slate-200 bg-slate-50 p-3"}>
          {activity}
        </div>
      ) : null}
    </section>
  );
}

function TrainingPlanWorkflowProgressRail({
  steps,
  headCoachReviewMode,
  reviewReviseStepLabel,
}: {
  steps: GuidedWorkflowUiStep[];
  headCoachReviewMode: boolean;
  reviewReviseStepLabel?: string | null;
}) {
  const nodeForStep = (step: GuidedWorkflowUiStep) => {
    if (step.markCompleteTick) {
      const emphasize = step.status === "active";
      return (
        <div
          className={
            emphasize
              ? "relative z-[1] flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-primary bg-card shadow-md ring-[3px] ring-primaryLight/80"
              : "relative z-[1] flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-300/90 bg-slate-100 shadow-sm"
          }
        >
          <Check className="h-5 w-5 text-primary" strokeWidth={2.8} aria-hidden="true" />
        </div>
      );
    }
    if (step.status === "active") {
      return (
        <div className="relative z-[1] flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-primary bg-card shadow-md ring-[3px] ring-primaryLight/80">
          <span className="h-4 w-4 rounded-full bg-primary shadow-sm" aria-hidden="true" />
        </div>
      );
    }
    if (step.status === "available") {
      return (
        <div className="relative z-[1] flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-300/90 bg-card shadow-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" aria-hidden="true" />
        </div>
      );
    }
    return (
      <div className="relative z-[1] flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-400">
        <LockKeyhole className="h-5 w-5" aria-hidden="true" />
      </div>
    );
  };

  return (
    <nav
      aria-label="Training plan workflow progress"
      className="rounded-xl border border-border bg-card px-3 py-5 sm:px-6 sm:py-6"
    >
      <ol className="flex w-full">
        {steps.map((step, index) => {
          const railLine = workflowStepLabel(
            step.key,
            headCoachReviewMode,
            "rail",
            reviewReviseStepLabel,
          );
          const displayTitle = `Step ${index + 1}: ${railLine}`;
          const subtitle = step.markCompleteTick
            ? "Completed"
            : guidedWorkflowRailSubtitle(step.status);
          const lineLeftHidden = index === 0;
          const lineRightHidden = index >= steps.length - 1;

          return (
            <li key={step.key} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="mb-3 flex w-full items-center">
                <div className={railGapSegmentClass(lineLeftHidden)} aria-hidden="true" />
                <div className="shrink-0 px-1 sm:px-2">{nodeForStep(step)}</div>
                <div className={railGapSegmentClass(lineRightHidden)} aria-hidden="true" />
              </div>
              <div className="max-w-[13rem] px-0.5 text-center md:max-w-[14rem]">
                <div
                  className={`text-sm font-normal ${
                    step.status === "active" ? "text-primary" : "text-textPrimary"
                  }`}
                >
                  {displayTitle}
                </div>
                <div
                  className={`mt-1 flex flex-wrap items-center justify-center gap-1 text-xs ${
                    step.status === "active"
                      ? "font-normal text-primary"
                      : "text-textMuted"
                  }`}
                >
                  <span>{subtitle}</span>
                  {step.status === "locked" ? (
                    <LockKeyhole className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function workflowStripTabHeading(
  step: GuidedWorkflowUiStep,
  index: number,
  headCoachReviewMode: boolean,
  reviewReviseStepLabel?: string | null,
): ReactElement {
  const baseTitle = workflowStepLabel(
    step.key,
    headCoachReviewMode,
    "tab",
    reviewReviseStepLabel,
  );
  const prefix = `Step ${index + 1}: ${baseTitle}`;
  if (step.status === "locked") {
    return (
      <span className="relative flex w-full min-w-0 items-center justify-center pr-5 sm:pr-5 md:pr-6">
        <span className="block min-w-0 truncate">{prefix}</span>
        <LockKeyhole
          className="pointer-events-none absolute right-0 top-1/2 h-3 w-3 shrink-0 -translate-y-1/2 text-slate-400 sm:h-3.5 sm:w-3.5"
          aria-hidden
        />
      </span>
    );
  }
  if (step.markCompleteTick) {
    return (
      <span className="relative flex w-full min-w-0 items-center justify-center pr-5 sm:pr-5 md:pr-6">
        <span className="block min-w-0 truncate">{prefix}</span>
        <Check
          className="pointer-events-none absolute right-0 top-1/2 h-3 w-3 shrink-0 -translate-y-1/2 text-primary sm:h-3.5 sm:w-3.5"
          strokeWidth={2.8}
          aria-hidden
        />
      </span>
    );
  }
  return (
    <span className="flex w-full min-w-0 items-center justify-center">
      <span className="block min-w-0 truncate">{prefix}</span>
    </span>
  );
}

function WorkflowConnectedTabStrip({
  selectedTab,
  steps,
  onSelect,
  headCoachReviewMode,
  reviewReviseStepLabel,
}: {
  selectedTab: GuidedWorkflowStepKey;
  steps: GuidedWorkflowUiStep[];
  onSelect: (tab: GuidedWorkflowStepKey) => void;
  headCoachReviewMode: boolean;
  reviewReviseStepLabel?: string | null;
}) {
  /** Equal 1/N width columns: shrinkable text + icons must not widen the flex row */
  const baseTab =
    "box-border relative flex min-h-[2.5rem] min-w-0 flex-1 basis-0 flex-col justify-center px-1 py-2 text-center text-[10px] font-normal leading-snug outline-none [-webkit-tap-highlight-color:transparent] sm:min-h-[2.6rem] sm:px-2 sm:text-[11px] md:px-2.5 md:text-xs lg:px-3";

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden border-t border-border/70 bg-card">
      <div
        role="tablist"
        aria-label="Training plan workflow tabs"
        className="flex w-full min-w-0 max-w-full flex-nowrap divide-x divide-border/80 rounded-none bg-card"
      >
        {steps.map((step, index) => {
          const disabled = step.status === "locked";
          const selected = step.key === selectedTab;
          const completedRowStyle = step.markCompleteTick && !selected;

          /** Non-active tabs keep a 4px transparent bottom band so row height matches the active tab */
          const inactiveBottomBand = "border-b-[4px] border-b-transparent";

          let stateClass = "";
          if (disabled) {
            stateClass = [
              "cursor-default border border-transparent bg-slate-100 text-slate-500 opacity-[0.66]",
              "shadow-none ring-0",
              inactiveBottomBand,
            ].join(" ");
          } else if (selected) {
            stateClass = [
              "z-[3] cursor-pointer bg-white font-normal text-textPrimary",
              "border border-primary border-b-[4px] border-b-primary",
              "shadow-none ring-0",
            ].join(" ");
          } else if (completedRowStyle) {
            stateClass = [
              "cursor-pointer border border-transparent bg-slate-50 text-textSecondary",
              "enabled:hover:bg-slate-100/90",
              "shadow-none ring-0",
              inactiveBottomBand,
            ].join(" ");
          } else {
            stateClass = [
              "cursor-pointer border border-transparent bg-white text-textPrimary",
              "enabled:hover:bg-slate-50",
              "shadow-none ring-0",
              inactiveBottomBand,
            ].join(" ");
          }

          const heading = workflowStripTabHeading(
            step,
            index,
            headCoachReviewMode,
            reviewReviseStepLabel,
          );

          return (
            <button
              key={step.key}
              type="button"
              role="tab"
              aria-selected={selected}
              disabled={disabled}
              onClick={() => onSelect(step.key)}
              className={`${baseTab} ${stateClass} transition-[background-color,color,opacity,border-color] duration-150 focus-visible:z-[4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-0 disabled:pointer-events-none`}
            >
              {heading}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WorkflowGeminiPlanSetupPanel({
  currentCoachGenerationDomain,
  durationDays,
  setDurationDays,
  currentPlanDurationDays,
  planStartDate,
  setPlanStartDate,
  planEndDate,
  currentPhaseDetected,
  planWindowInsideCurrentPhase,
  planDatesProceedEnabled,
  planDatesConfirmedForCurrentAthlete,
  planSeasonBoundsUi,
  onConfirmPlanDates,
}: {
  currentCoachGenerationDomain: TrainingPlanGenerationDomain;
  durationDays: 7 | 15 | 30;
  setDurationDays: (value: 7 | 15 | 30) => void;
  currentPlanDurationDays: number;
  planStartDate: string;
  setPlanStartDate: (value: string) => void;
  planEndDate: string;
  currentPhaseDetected: boolean;
  planWindowInsideCurrentPhase: boolean;
  planDatesProceedEnabled: boolean;
  planDatesConfirmedForCurrentAthlete: boolean;
  planSeasonBoundsUi: "idle" | "invalid" | "valid";
  onConfirmPlanDates: () => void;
}) {
  const durationLocked =
    currentCoachGenerationDomain === "S_AND_C" ||
    currentCoachGenerationDomain === "NUTRITION";

  return (
    <section className="space-y-4">
      <div className="space-y-3">
        {planSeasonBoundsUi === "invalid" ? (
          <DashboardStatusNotice type="error" compact>
            Plan dates must be within the selected season.
          </DashboardStatusNotice>
        ) : planSeasonBoundsUi === "valid" ? (
          <DashboardStatusNotice type="success" compact>
            Plan dates are within the selected season.
          </DashboardStatusNotice>
        ) : null}

        {!currentPhaseDetected ? (
          <DashboardStatusNotice type="warning" compact>
            Current phase must be detected from season phase dates before the plan window can be
            validated.
          </DashboardStatusNotice>
        ) : !planWindowInsideCurrentPhase ? (
          <DashboardStatusNotice type="error" compact>
            Selected plan window crosses the current season phase. Choose a shorter duration or
            adjust phase dates.
          </DashboardStatusNotice>
        ) : (
          <DashboardStatusNotice type="info" compact>
            Plan window fits inside the detected current phase.
          </DashboardStatusNotice>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-sm font-normal text-textPrimary">Plan Duration</div>
        <div
          role="radiogroup"
          aria-label="Plan duration days"
          className="flex flex-wrap gap-2"
        >
          {([
            [7 as const, "7 days"],
            [15 as const, "15 days"],
            [30 as const, "30 days"],
          ] as const            ).map(([days, label]) => {
            const selected = durationLocked
              ? currentPlanDurationDays === days
              : durationDays === days;
            const durationOptionDisabled = durationLocked || days !== 7;
            return (
              <button
                key={days}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={durationOptionDisabled}
                onClick={() => {
                  if (!durationOptionDisabled) {
                    setDurationDays(days);
                  }
                }}
                className={`inline-flex min-w-[6rem] flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition ${
                  durationOptionDisabled
                    ? "cursor-not-allowed opacity-45"
                    : "cursor-pointer"
                } ${selected ? "border-primary bg-primaryLight text-primaryDark shadow-sm" : "border-border bg-bg text-textPrimary hover:bg-card hover:shadow-sm"}`}
              >
                <CalendarDays className="h-4 w-4 shrink-0 opacity-75" aria-hidden />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs leading-relaxed text-textMuted">
          Currently only 7-day plans are supported.
        </p>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-normal text-textPrimary">Start Date</div>
        <div className="relative rounded-lg border border-border bg-bg">
          <CalendarDays
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-textMuted"
            aria-hidden
          />
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-textMuted opacity-70"
            aria-hidden
          />
          <input
            type="date"
            aria-label="Plan start date"
            className="w-full cursor-pointer rounded-lg border-0 bg-transparent py-3 pl-11 pr-12 text-sm text-textPrimary caret-current focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            value={planStartDate}
            onChange={(event) => setPlanStartDate(event.target.value)}
          />
        </div>
        <dl className="space-y-2 border-border border-dashed border-t pt-4 text-xs text-textSecondary">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
            <dt className="font-medium text-textMuted">Computed end date</dt>
            <dd className="text-sm font-medium text-textPrimary">
              {formatDateOnly(planEndDate, "—")}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex justify-end border-t border-border/60 pt-4">
        <Button
          type="button"
          variant="primary"
          disabled={!planDatesProceedEnabled || planDatesConfirmedForCurrentAthlete}
          onClick={() => onConfirmPlanDates()}
        >
          {planDatesConfirmedForCurrentAthlete ? "Plan Dates Confirmed" : "Confirm Plan Dates"}
        </Button>
      </div>
    </section>
  );
}

function WorkflowCompactSummaryStrip({
  title,
  values,
}: {
  title: string;
  values: Array<{ label: string; value: string }>;
}) {
  return (
    <section className="border-y border-border/70 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100">
            <Check className="h-4 w-4 text-primary" strokeWidth={2.6} aria-hidden="true" />
          </span>
          <h3 className="text-sm font-normal text-textPrimary">{title}</h3>
        </div>
        <dl className="grid gap-2 text-xs text-textSecondary sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center lg:gap-4">
          {values.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <dt className="font-medium text-textMuted">{item.label}:</dt>
              <dd className="text-textPrimary">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function WorkflowLockedCard({
  title,
  message,
  actionLabel,
}: {
  title: string;
  message: string;
  actionLabel?: string;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center gap-2">
        <LockKeyhole className="h-4 w-4 text-slate-400" aria-hidden="true" />
        <h3 className="text-sm font-normal text-slate-500">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
      {actionLabel ? (
        <div className="mt-3">
          <Button type="button" variant="secondary" disabled>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

/** Explicit tab progression control — navigation only; does not alter step completion rules. */
function WorkflowTabNextButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="flex justify-end border-t border-border/60 pt-4">
      <Button type="button" variant="primary" onClick={onClick}>
        {label}
      </Button>
    </div>
  );
}

/** Inline status (replaces green Alert success) — orange/neutral workflow only. */
function WorkflowNeutralNotice({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-lg border border-border bg-bg px-4 py-3 text-sm text-textPrimary"
      role="status"
    >
      {children}
    </div>
  );
}

function normalizeTrainingPlanGenerationDomain(
  value: string | null | undefined,
): TrainingPlanGenerationDomain | null {
  const normalized = value?.trim().toUpperCase() ?? "";
  if (
    normalized === "SKILLS" ||
    normalized === "NUTRITION" ||
    normalized === "S_AND_C"
  ) {
    return normalized;
  }
  return null;
}

export type TrainingPlanWorkflowMode =
  | "loading"
  | "head_coach_planning"
  | "head_coach_review"
  | "head_coach_function_aware"
  | "skills_coach_planning"
  | "specialist_domain"
;

type TrainingPlanBootstrapLoadState = "idle" | "loading" | "loaded" | "error";

export type TrainingPlanPageShell =
  | "loading"
  | "head_coach_review"
  | "head_coach_function_aware"
  | "head_coach_planning"
  | "skills_coach_planning"
  | "specialist_domain";

export type TrainingPlanPageBootstrapModel = {
  ready: boolean;
  shell: TrainingPlanPageShell;
  workflowMode: TrainingPlanWorkflowMode;
  waitingFor:
    | "identity"
    | "assignment"
    | "workflow_mode"
    | "planning_context"
    | "submitted_domain_plans"
    | null;
};

export type PlanningContextShellOwner =
  | "head_coach"
  | "skills_coach"
  | "waiting_role";

export type TrainingPlanResolvedReleaseMode =
  | "head_coach_review"
  | "direct_release";

export type TrainingPlanShellOwnershipResolution = {
  planningContextShellOwner: PlanningContextShellOwner;
  releaseMode: TrainingPlanResolvedReleaseMode;
};

export function resolveNoHeadCoachDirectReleaseLockedPlanningContext(
  context: CoachAthleteUpstreamPlanningContext | null | undefined,
): boolean {
  if (isUpstreamPlanningContextLocked(context)) return true;
  if (!context) return false;
  const startDate = context.planWindow?.startDate ?? context.startDate ?? null;
  const endDate = context.planWindow?.endDate ?? context.endDate ?? null;
  return startDate !== null && endDate !== null && context.blockers.length === 0;
}

export function buildCoachWorkflowResetScopeKey(input: {
  athleteId: string;
  entityId: string;
  coachUserId: string;
  activeRole: string | null | undefined;
  domain: TrainingPlanGenerationDomain | null;
  workflowMode: TrainingPlanWorkflowMode;
}): string {
  const athlete = input.athleteId.trim();
  const entity = input.entityId.trim();
  const coachUserId = input.coachUserId.trim();
  const activeRole =
    typeof input.activeRole === "string" && input.activeRole.trim() !== ""
      ? input.activeRole.trim().toUpperCase()
      : "NO_ROLE";
  const domain = input.domain ?? "NONE";
  const workflowMode = input.workflowMode;
  return `${athlete}|${entity}|${coachUserId}|${activeRole}|${domain}|${workflowMode}`;
}

export function resolveWorkflowResetScopeMode(input: {
  workspace: TrainingPlanWorkspace | null;
  isHeadCoachPlanningContextOwner: boolean;
  planningContextLocked: boolean;
  workflowMode: TrainingPlanWorkflowMode;
}): TrainingPlanWorkflowMode {
  if (input.workspace !== null) {
    const workspaceMode = resolveWorkflowModeFromWorkspace(input.workspace);
    if (workspaceMode !== null) return workspaceMode;
  }
  if (
    input.workspace !== null &&
    input.isHeadCoachPlanningContextOwner &&
    input.planningContextLocked
  ) {
    return "head_coach_review";
  }
  return input.workflowMode;
}

export function workflow2AHeadCoachStep6Intro(
  shell: TrainingPlanPageShell,
): string {
  if (shell === "head_coach_function_aware") {
    return "Create the Skills plan you own, then review submitted Nutrition and S&C plans when they arrive.";
  }
  return "Head Coach mode focuses on locking planning context and reviewing submitted domain plans.";
}

export function headCoachSubmittedReviewDomains(input: {
  shell: TrainingPlanPageShell;
  headCoachOwnsSkills: boolean;
  workspace?: TrainingPlanWorkspace | null;
}): TrainingPlanGenerationDomain[] {
  const assignmentDomains = input.workspace?.assignmentContext?.domains;
  if (assignmentDomains !== undefined) {
    return GENERATION_DOMAIN_ORDER.filter((domain) => {
      if (domain === "SKILLS" && input.headCoachOwnsSkills) return false;
      return assignmentDomains[domain].canApprove === true;
    });
  }
  if (input.shell === "head_coach_function_aware" && input.headCoachOwnsSkills) {
    return GENERATION_DOMAIN_ORDER.filter((domain) => domain !== "SKILLS");
  }
  return GENERATION_DOMAIN_ORDER;
}

export function resolveHeadCoachSubmittedReviewCardDomains(input: {
  shell: TrainingPlanPageShell;
  headCoachOwnsSkills: boolean;
  workspace: TrainingPlanWorkspace | null;
}): TrainingPlanGenerationDomain[] {
  const assignmentContext = input.workspace?.assignmentContext;
  if (assignmentContext !== undefined) {
    if (!assignmentContext.hasHeadCoach || assignmentContext.releaseMode !== "HEAD_COACH_APPROVAL") {
      return [];
    }
    const assignmentSkillsContext = assignmentContext.domains.SKILLS;
    const headCoachOwnsSkills =
      assignmentSkillsContext.ownerType === "HEAD_COACH_SELF" &&
      assignmentSkillsContext.ownedByCurrentUser === true;
    if (
      input.shell === "head_coach_review" ||
      !headCoachOwnsSkills
    ) {
      return GENERATION_DOMAIN_ORDER.filter((domain) => {
        if (domain === "SKILLS" && headCoachOwnsSkills) return false;
        const assignmentDomain = assignmentContext.domains[domain];
        return (
          assignmentDomain.ownerType !== "NONE" ||
          assignmentDomain.canApprove === true ||
          assignmentDomain.canRequestRevision === true
        );
      });
    }
    const reviewDomains = new Set<TrainingPlanGenerationDomain>();
    for (const domain of ["NUTRITION", "S_AND_C"] as const) {
      const assignmentDomain = assignmentContext.domains[domain];
      if (
        assignmentDomain.ownerType !== "NONE" ||
        assignmentDomain.canApprove === true ||
        assignmentDomain.canRequestRevision === true
      ) {
        reviewDomains.add(domain);
        continue;
      }
      const summary = input.workspace.domains[domain].summary;
      const planId = summary.trainingPlanId?.trim() ?? "";
      const versionId = resolveHeadCoachDomainSummaryVersionId(summary);
      if (planId !== "" && (versionId ?? "") !== "") {
        reviewDomains.add(domain);
      }
    }
    return GENERATION_DOMAIN_ORDER.filter((domain) => reviewDomains.has(domain));
  }
  return headCoachSubmittedReviewDomains(input);
}

export function resolveHeadCoachOwnedSkillsGrouping(input: {
  workspace: TrainingPlanWorkspace | null;
  legacyHeadCoachOwnsSkills: boolean;
}): boolean {
  const assignmentSkillsContext = input.workspace?.assignmentContext?.domains.SKILLS;
  if (assignmentSkillsContext !== undefined) {
    return (
      assignmentSkillsContext.ownerType === "HEAD_COACH_SELF" &&
      assignmentSkillsContext.ownedByCurrentUser === true
    );
  }
  return input.legacyHeadCoachOwnsSkills;
}

function trainingPlanRenderedShellBranchName(shell: TrainingPlanPageShell): string {
  if (shell === "head_coach_function_aware") {
    return "function-aware domain owner";
  }
  if (shell === "head_coach_review") {
    return "pure head coach review";
  }
  if (shell === "head_coach_planning") {
    return "head coach planning";
  }
  if (shell === "skills_coach_planning") {
    return "skills coach planning";
  }
  if (shell === "specialist_domain") {
    return "specialist domain";
  }
  return "loading";
}

function logTrainingPlanWorkspaceShellDiagnostic(input: {
  label: string;
  workspace: TrainingPlanWorkspace | null;
  selectedShell?: TrainingPlanPageShell | TrainingPlanWorkflowMode | null;
  renderedBranch?: string;
}) {
  if (process.env.NODE_ENV === "production") return;
  const workspace = input.workspace;
  const skills = workspace?.domains.SKILLS;
  console.info("[TrainingPlanWorkspace shell diagnostic]", {
    label: input.label,
    workflowShape: workspace?.workflowShape ?? null,
    shell: workspace?.shell ?? null,
    currentDomain: workspace?.currentDomain ?? null,
    initialTab: workspace?.initialTab ?? null,
    requesterIsHeadCoach:
      workspace?.ownershipFlags.requesterIsHeadCoach ?? null,
    requesterOwnsCurrentDomain:
      workspace?.ownershipFlags.requesterOwnsCurrentDomain ?? null,
    requesterOwnsSkillsForThisAthlete:
      workspace?.ownershipFlags.requesterOwnsSkillsForThisAthlete ?? null,
    skillsCanOpen: skills?.canOpen ?? null,
    skillsTrainingPlanId: skills?.summary.trainingPlanId ?? null,
    skillsVersionId: skills?.summary.versionId ?? null,
    selectedShell: input.selectedShell ?? null,
    renderedShellBranchName: input.renderedBranch ?? null,
  });
}

function logTrainingPlanGenerationBlockerDiagnostic(input: {
  workspacePlanningContext: TrainingPlanWorkspace["planningContext"] | null;
  localSelectedGoalCount: number;
  blockerReason: string | null;
}) {
  if (process.env.NODE_ENV === "production") return;
  const context = input.workspacePlanningContext;
  console.info("[TrainingPlanWorkspace generation blocker diagnostic]", {
    planningContextLocked: context?.locked ?? null,
    selectedGoalsSnapshotLength: readWorkspaceSnapshotGoalCount(
      context?.selectedGoalsSnapshot,
    ),
    athletePlanningContextSnapshotGoalsLength: readWorkspaceSnapshotGoalCount(
      context?.athletePlanningContextSnapshot,
    ),
    localSelectedGoalsLength: input.localSelectedGoalCount,
    blockerReasonSelected: input.blockerReason,
  });
}

function logTrainingPlanViewPlanDiagnostic(input: {
  clickedDomain: TrainingPlanGenerationDomain;
  workspace: TrainingPlanWorkspace | null;
  context: WorkspaceDomainViewPlanContext | null;
  fetchUrl?: string;
  resultStatus?: string | number | null;
  responseBodyShape?: Record<string, unknown>;
  stateUpdated?: string | null;
  rendererBranch?: string | null;
  error?: unknown;
}) {
  if (process.env.NODE_ENV === "production") return;
  const summary = input.workspace?.domains[input.clickedDomain]?.summary ?? null;
  console.info("[TrainingPlanWorkspace view plan diagnostic]", {
    clickedDomain: input.clickedDomain,
    workspaceShell: input.workspace?.shell ?? null,
    workspaceCurrentDomain: input.workspace?.currentDomain ?? null,
    summaryTrainingPlanId: summary?.trainingPlanId ?? null,
    summaryVersionId: summary?.versionId ?? null,
    selectedTrainingPlanId: input.context?.planId ?? null,
    selectedVersionId: input.context?.versionId ?? null,
    sourceObjectUsedByHandler: input.context?.source ?? null,
    status: input.context?.status ?? null,
    fetchUrl: input.fetchUrl ?? null,
    resultStatus: input.resultStatus ?? null,
    responseBodyShape: input.responseBodyShape ?? null,
    stateUpdated: input.stateUpdated ?? null,
    rendererBranch: input.rendererBranch ?? null,
    error: input.error ?? null,
  });
}

export function domainDraftLoadErrorMessage(domain: TrainingPlanGenerationDomain): string {
  if (domain === "SKILLS") return "Unable to load Skills plan. Please retry.";
  if (domain === "NUTRITION") return "Unable to load Nutrition plan. Please retry.";
  return "Unable to load S&C plan. Please retry.";
}

export function errorForRenderedDomain(input: {
  error: string | null;
  errorDomain: TrainingPlanGenerationDomain | null;
  renderedDomain: TrainingPlanGenerationDomain | null;
}): string | null {
  if (input.error === null) return null;
  if (input.errorDomain === null || input.renderedDomain === null) return null;
  return input.errorDomain === input.renderedDomain ? input.error : null;
}

function logTrainingPlanDomainDetailDiagnostic(input: {
  currentDomain: TrainingPlanGenerationDomain | null;
  clickedDomain?: TrainingPlanGenerationDomain | null;
  workspace: TrainingPlanWorkspace | null;
  renderedPlanDomain: TrainingPlanGenerationDomain | null;
  requestedDetailDomain: TrainingPlanGenerationDomain | null;
  trainingPlanId: string | null;
  versionId: string | null;
  loadStatus: string;
  loadError: string | null;
  rendererBranch: string;
}) {
  if (process.env.NODE_ENV === "production") return;
  console.info("[TrainingPlanWorkspace domain detail diagnostic]", {
    currentDomain: input.currentDomain,
    clickedDomain: input.clickedDomain ?? null,
    workspaceCurrentDomain: input.workspace?.currentDomain ?? null,
    renderedPlanDomain: input.renderedPlanDomain,
    requestedDetailDomain: input.requestedDetailDomain,
    trainingPlanId: input.trainingPlanId,
    versionId: input.versionId,
    loadStatus: input.loadStatus,
    loadError: input.loadError,
    rendererBranch: input.rendererBranch,
    summaryStatus: {
      SKILLS: input.workspace?.domains.SKILLS.summary.status ?? null,
      NUTRITION: input.workspace?.domains.NUTRITION.summary.status ?? null,
      STRENGTH_CONDITIONING: input.workspace?.domains.S_AND_C.summary.status ?? null,
    },
  });
}

function logTrainingPlanGenerationAutoLoadDiagnostic(input: {
  generatedDomain: TrainingPlanGenerationDomain;
  generationResponsePlanId: string | null;
  generationResponseVersionId: string | null;
  workspaceRefreshStatus: string;
  workspaceSummaryStatus: string | null;
  workspaceSummaryPlanId: string | null;
  workspaceSummaryVersionId: string | null;
  selectedDetailDomain: TrainingPlanGenerationDomain | null;
  detailFetchUrl: string | null;
  detailFetchStatus: string | number | null;
  rendererBranch: string;
  noPlanCreatedReason?: string | null;
}) {
  if (process.env.NODE_ENV === "production") return;
  console.info("[TrainingPlanWorkspace generation auto-load diagnostic]", input);
}

function logTrainingPlanActionVisibilityDiagnostic(input: {
  renderedDomain: TrainingPlanGenerationDomain | null;
  currentDomain: TrainingPlanGenerationDomain | null;
  workspace: TrainingPlanWorkspace | null;
  versionNumber: number | null;
  allowedActions: string[];
  persistedDetailStatus: string | null;
  isEditableDraft: boolean;
  canRevise: boolean;
  hiddenReason: string | null;
}) {
  if (process.env.NODE_ENV === "production") return;
  const summary =
    input.renderedDomain !== null
      ? input.workspace?.domains[input.renderedDomain]?.summary
      : null;
  console.info("[TrainingPlanWorkspace action visibility diagnostic]", {
    renderedDomain: input.renderedDomain,
    currentDomain: input.currentDomain,
    requesterOwnershipFlags: input.workspace?.ownershipFlags ?? null,
    workspaceShell: input.workspace?.shell ?? null,
    domainSummaryStatus: summary?.status ?? null,
    trainingPlanId: summary?.trainingPlanId ?? null,
    versionId: summary?.versionId ?? null,
    versionNumber: input.versionNumber,
    allowedActions: input.allowedActions,
    persistedDetailStatus: input.persistedDetailStatus,
    isEditableDraft: input.isEditableDraft,
    canRevise: input.canRevise,
    hiddenReason: input.hiddenReason,
  });
}

export function shouldBlockWorkflowRenderForWorkspace(input: {
  workspaceLoading: boolean;
  workspaceRefreshing: boolean;
  workspace: TrainingPlanWorkspace | null;
  isHeadCoachPlanningContextOwner: boolean;
  planningContextLocked: boolean;
  hasRenderableWorkflowFallback: boolean;
}): boolean {
  if (!input.workspaceLoading || input.workspaceRefreshing || input.workspace !== null) {
    return false;
  }
  if (input.isHeadCoachPlanningContextOwner && input.planningContextLocked) {
    return true;
  }
  return !input.hasRenderableWorkflowFallback;
}

export function resolvePlanningContextAuthority(input: {
  assignmentPlanningContext:
    | TrainingPlanWorkspaceAssignmentPlanningContext
    | null
    | undefined;
  legacyAuthority: boolean;
}): {
  canShowPlanningContextControls: boolean;
  canLockPlanningContext: boolean;
} {
  const assignmentPlanningContext = input.assignmentPlanningContext;
  if (assignmentPlanningContext === null || assignmentPlanningContext === undefined) {
    return {
      canShowPlanningContextControls: input.legacyAuthority,
      canLockPlanningContext: input.legacyAuthority,
    };
  }

  const hasPlanningOwner = assignmentPlanningContext.ownerType !== "NONE";
  return {
    canShowPlanningContextControls:
      hasPlanningOwner &&
      (assignmentPlanningContext.canCreate ||
        assignmentPlanningContext.canLock ||
        assignmentPlanningContext.canManage),
    canLockPlanningContext: hasPlanningOwner && assignmentPlanningContext.canLock,
  };
}

export function resolveDomainGeneratePermission(input: {
  assignmentDomainContext:
    | TrainingPlanWorkspaceAssignmentDomainContext
    | null
    | undefined;
  legacyOwnershipFlags: PlanGenerationOwnershipFlags;
}): {
  canShowGenerate: boolean;
  ownershipFlags: PlanGenerationOwnershipFlags;
} {
  const assignmentDomainContext = input.assignmentDomainContext;
  if (assignmentDomainContext === null || assignmentDomainContext === undefined) {
    return {
      canShowGenerate: !isPlanGenerationBlockedByOwnership(input.legacyOwnershipFlags),
      ownershipFlags: input.legacyOwnershipFlags,
    };
  }

  const canGenerate =
    assignmentDomainContext.ownerType !== "NONE" &&
    assignmentDomainContext.ownedByCurrentUser &&
    assignmentDomainContext.canGenerate;

  return {
    canShowGenerate: canGenerate,
    ownershipFlags: {
      canGeneratePlan: canGenerate,
      canGenerateCurrentDomainPlan: canGenerate,
    },
  };
}

export function resolveDomainViewPlanVisible(input: {
  assignmentDomainContext:
    | TrainingPlanWorkspaceAssignmentDomainContext
    | null
    | undefined;
  legacyCanOpen: boolean;
  planId: string | null | undefined;
  versionId: string | null | undefined;
}): boolean {
  const hasPlanIds =
    (input.planId?.trim() ?? "") !== "" &&
    (input.versionId?.trim() ?? "") !== "";
  if (!hasPlanIds) return false;
  const assignmentDomainContext = input.assignmentDomainContext;
  if (assignmentDomainContext === null || assignmentDomainContext === undefined) {
    return input.legacyCanOpen;
  }
  return assignmentDomainContext.canOpen === true;
}

export function resolveDomainRevisePlanVisible(input: {
  domain?: TrainingPlanGenerationDomain;
  assignmentDomainContext:
    | TrainingPlanWorkspaceAssignmentDomainContext
    | null
    | undefined;
  legacyRequesterOwnsDomain: boolean;
  workflowStatus: AssistantDomainWorkflowStatus;
  reviseIds: DomainRevisePlanIds | null;
}): boolean {
  const assignmentDomainContext = input.assignmentDomainContext;

  return resolveDomainReviseAvailability({
    domain: input.domain ?? "SKILLS",
    workflowStatus: input.workflowStatus,
    planId: input.reviseIds?.trainingPlanId,
    versionId: input.reviseIds?.versionId,
    assignmentDomainContext,
    legacyRequesterOwnsDomain: input.legacyRequesterOwnsDomain,
  }).mutationEnabled;
}

export function resolveDomainSubmitForReviewVisible(input: {
  assignmentDomainContext:
    | TrainingPlanWorkspaceAssignmentDomainContext
    | null
    | undefined;
  legacyCanSubmitForReview: boolean;
  workflowStatus: AssistantDomainWorkflowStatus;
  planId: string | null | undefined;
  versionId: string | null | undefined;
}): boolean {
  const hasPlanIds =
    (input.planId?.trim() ?? "") !== "" &&
    (input.versionId?.trim() ?? "") !== "";
  if (!hasPlanIds) return false;

  const stateAllowsSubmit =
    input.workflowStatus === "draft_generated" ||
    input.workflowStatus === "revision_requested";
  if (!stateAllowsSubmit) return false;

  const assignmentDomainContext = input.assignmentDomainContext;
  if (assignmentDomainContext === null || assignmentDomainContext === undefined) {
    return input.legacyCanSubmitForReview;
  }

  return (
    assignmentDomainContext.ownedByCurrentUser &&
    assignmentDomainContext.canSubmitForReview
  );
}

export function resolveWorkspaceDomainSubmitForReviewVisible(
  workspace: TrainingPlanWorkspace,
  domain: TrainingPlanGenerationDomain | null,
): boolean {
  if (domain === null) return false;
  const entry = workspace.domains[domain];
  return resolveDomainSubmitForReviewVisible({
    assignmentDomainContext: workspace.assignmentContext?.domains[domain],
    legacyCanSubmitForReview: workspaceShowsDomainSubmitReview(workspace, domain),
    workflowStatus: deriveWorkflowStatusFromWorkspaceDomain(entry),
    planId: entry.summary.trainingPlanId,
    versionId: entry.summary.versionId,
  });
}

export function resolveDomainHeadCoachReviewActionVisible(input: {
  assignmentDomainContext:
    | TrainingPlanWorkspaceAssignmentDomainContext
    | null
    | undefined;
  reviewAction?: Extract<
    GovernedTrainingPlanWorkflowAction,
    "HEAD_APPROVE" | "REQUEST_REVISION"
  >;
  legacyCanShowReviewAction: boolean;
  planId: string | null | undefined;
  versionId: string | null | undefined;
}): boolean {
  const hasPlanIds =
    (input.planId?.trim() ?? "") !== "" &&
    (input.versionId?.trim() ?? "") !== "";
  if (!hasPlanIds) return false;

  const assignmentDomainContext = input.assignmentDomainContext;
  if (assignmentDomainContext === null || assignmentDomainContext === undefined) {
    return input.legacyCanShowReviewAction;
  }

  const assignmentCanReview =
    input.reviewAction === "REQUEST_REVISION"
      ? assignmentDomainContext.canRequestRevision === true
      : assignmentDomainContext.canApprove;

  return assignmentCanReview && input.legacyCanShowReviewAction;
}

export function resolveHeadCoachOwnedSkillsDraftApproveVisible(input: {
  domain: TrainingPlanGenerationDomain;
  workflowStatus: AssistantDomainWorkflowStatus;
  headCoachFunctionAwareMode: boolean;
  headCoachOwnedSkillsGrouping: boolean;
  assignmentDomainContext:
    | TrainingPlanWorkspaceAssignmentDomainContext
    | null
    | undefined;
  planId: string | null | undefined;
  versionId: string | null | undefined;
}): boolean {
  const hasPlanIds =
    (input.planId?.trim() ?? "") !== "" &&
    (input.versionId?.trim() ?? "") !== "";
  if (!hasPlanIds) return false;
  if (
    input.domain !== "SKILLS" ||
    !input.headCoachFunctionAwareMode ||
    !input.headCoachOwnedSkillsGrouping
  ) {
    return false;
  }
  if (
    input.workflowStatus !== "draft_generated" &&
    input.workflowStatus !== "revision_requested"
  ) {
    return false;
  }

  const assignmentDomainContext = input.assignmentDomainContext;
  return (
    assignmentDomainContext?.ownerType === "HEAD_COACH_SELF" &&
    assignmentDomainContext.ownedByCurrentUser === true &&
    assignmentDomainContext.canApprove === true
  );
}

export function resolveDirectReleaseSkillsOwnerApproveVisible(input: {
  assignmentReleaseMode:
    | TrainingPlanWorkspaceAssignmentReleaseMode
    | null
    | undefined;
  assignmentDomainContext:
    | TrainingPlanWorkspaceAssignmentDomainContext
    | null
    | undefined;
  domain: TrainingPlanGenerationDomain;
  legacyCanApprove: boolean;
  planId: string | null | undefined;
  versionId: string | null | undefined;
}): boolean {
  const hasPlanIds =
    (input.planId?.trim() ?? "") !== "" &&
    (input.versionId?.trim() ?? "") !== "";
  if (!hasPlanIds || !input.legacyCanApprove || input.domain !== "SKILLS") return false;

  const assignmentDomainContext = input.assignmentDomainContext;
  if (
    input.assignmentReleaseMode !== "DIRECT_DOMAIN_RELEASE" ||
    assignmentDomainContext === null ||
    assignmentDomainContext === undefined
  ) {
    return false;
  }

  return (
    assignmentDomainContext.releaseMode === "DIRECT_DOMAIN_RELEASE" &&
    assignmentDomainContext.ownerType === "ASSIGNED_DOMAIN_COACH" &&
    assignmentDomainContext.ownedByCurrentUser === true &&
    assignmentDomainContext.canApprove === true
  );
}

export function resolveDomainReleaseVisible(input: {
  assignmentReleaseMode:
    | TrainingPlanWorkspaceAssignmentReleaseMode
    | null
    | undefined;
  assignmentDomainContext:
    | TrainingPlanWorkspaceAssignmentDomainContext
    | null
    | undefined;
  requiredReleaseMode?:
    | TrainingPlanWorkspaceAssignmentReleaseMode
    | null
    | undefined;
  legacyCanRelease: boolean;
  planId: string | null | undefined;
  versionId: string | null | undefined;
}): boolean {
  const hasPlanIds =
    (input.planId?.trim() ?? "") !== "" &&
    (input.versionId?.trim() ?? "") !== "";
  if (!hasPlanIds) return false;

  const assignmentDomainContext = input.assignmentDomainContext;
  if (
    input.assignmentReleaseMode === null ||
    input.assignmentReleaseMode === undefined ||
    assignmentDomainContext === null ||
    assignmentDomainContext === undefined
  ) {
    return input.legacyCanRelease;
  }

  const releaseModeMatches =
    input.requiredReleaseMode !== null && input.requiredReleaseMode !== undefined
      ? input.assignmentReleaseMode === input.requiredReleaseMode &&
        assignmentDomainContext.releaseMode === input.requiredReleaseMode
      : input.assignmentReleaseMode === assignmentDomainContext.releaseMode;

  return releaseModeMatches && assignmentDomainContext.canRelease && input.legacyCanRelease;
}

export function shouldUseSpecialistTrainingPlanWorkspace(input: {
  isHeadCoachPlanningContextOwner: boolean;
  currentCoachGenerationDomain: TrainingPlanGenerationDomain | null;
  isCoachSetupLoaded?: boolean;
}): boolean {
  if (input.isHeadCoachPlanningContextOwner) return false;
  if (input.currentCoachGenerationDomain !== null) return true;
  return input.isCoachSetupLoaded === true;
}

export function resolveWorkspaceTrainingPlanShellOwnership(
  workspace: TrainingPlanWorkspace,
): TrainingPlanShellOwnershipResolution {
  const releaseMode = workspaceResolveReleaseMode(workspace);
  const assignmentContext = workspace.assignmentContext;

  if (assignmentContext !== undefined) {
    if (workspaceHeadCoachOwnsPlanningContext(workspace)) {
      return {
        planningContextShellOwner: "head_coach",
        releaseMode,
      };
    }
    if (
      releaseMode === "direct_release" &&
      assignmentContext.hasHeadCoach === false &&
      assignmentContext.planningContext.ownerType === "SKILLS_FALLBACK"
    ) {
      return {
        planningContextShellOwner: "skills_coach",
        releaseMode,
      };
    }
    return {
      planningContextShellOwner: "waiting_role",
      releaseMode,
    };
  }

  const flags = workspace.ownershipFlags;
  if (flags.headCoachOwnsPlanningContext) {
    return {
      planningContextShellOwner: "head_coach",
      releaseMode,
    };
  }
  if (
    releaseMode === "direct_release" &&
    flags.requesterOwnsCurrentDomain &&
    parseWorkspaceCurrentDomain(workspace.currentDomain) === "SKILLS"
  ) {
    return {
      planningContextShellOwner: "skills_coach",
      releaseMode,
    };
  }
  if (releaseMode === "direct_release" && workspaceDirectReleaseAllowed(workspace)) {
    return {
      planningContextShellOwner: "waiting_role",
      releaseMode,
    };
  }
  return {
    planningContextShellOwner: "waiting_role",
    releaseMode,
  };
}

function resolveTrainingPlanReleaseMode(input: {
  hasHeadCoachConfigured: boolean;
  trainingPlanReleaseMode: string | null | undefined;
}): TrainingPlanResolvedReleaseMode {
  const normalized =
    input.trainingPlanReleaseMode
      ?.trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_") ?? "";
  if (normalized.includes("DIRECT")) return "direct_release";
  if (normalized.includes("HEAD_COACH") || normalized.includes("HEAD_COACH_RELEASE")) {
    return "head_coach_review";
  }
  return input.hasHeadCoachConfigured ? "head_coach_review" : "direct_release";
}

export function resolveTrainingPlanShellOwnership(input: {
  isCoachSetupLoaded: boolean;
  coachUserId: string;
  athleteId: string;
  entityId: string;
  hasHeadCoachConfigured: boolean;
  trainingPlanReleaseMode: string | null | undefined;
  headCoachOwnsPlanningContext: boolean;
  skillsCoachOwnsPlanningContext: boolean;
  academyCoachRole: string | null | undefined;
  /** Generation domains from the authenticated coach's assigned functions only. */
  coachAssignedGenerationDomains: ReadonlyArray<TrainingPlanGenerationDomain>;
}): TrainingPlanShellOwnershipResolution {
  const releaseMode = resolveTrainingPlanReleaseMode({
    hasHeadCoachConfigured: input.hasHeadCoachConfigured,
    trainingPlanReleaseMode: input.trainingPlanReleaseMode,
  });
  if (
    !input.isCoachSetupLoaded ||
    input.coachUserId.trim() === "" ||
    input.athleteId.trim() === "" ||
    input.entityId.trim() === ""
  ) {
    return { planningContextShellOwner: "waiting_role", releaseMode };
  }

  if (releaseMode === "head_coach_review") {
    return {
      planningContextShellOwner:
        input.headCoachOwnsPlanningContext && currentCoachIsHeadCoach(input.academyCoachRole)
          ? "head_coach"
          : "waiting_role",
      releaseMode,
    };
  }

  return {
    planningContextShellOwner: input.skillsCoachOwnsPlanningContext &&
      input.coachAssignedGenerationDomains.includes("SKILLS")
      ? "skills_coach"
      : "waiting_role",
    releaseMode,
  };
}

/**
 * Single source of truth for which Training Plan workflow shell to render.
 * Uses authenticated coach assignment/config plus current planning context — never generic
 * workflow tab state or stale persisted shell state.
 */
export function resolveTrainingPlanWorkflowMode(input: {
  isCoachSetupLoaded: boolean;
  coachUserId: string;
  athleteId: string;
  entityId: string;
  academyCoachRole: string | null | undefined;
  hasHeadCoachConfigured: boolean;
  trainingPlanReleaseMode?: string | null | undefined;
  /** Generation domains from the authenticated coach's assigned functions only. */
  coachAssignedGenerationDomains: ReadonlyArray<TrainingPlanGenerationDomain>;
  isPlanningContextResolved: boolean;
  areHeadCoachDomainPlansResolved: boolean;
  planningContextLocked: boolean;
  hasSubmittedDomainPlans: boolean;
  /** When HC has generation functions, true only if assignment allows HC to generate at least one assigned domain. */
  headCoachOwnsAssignedDomainGeneration?: boolean;
}): TrainingPlanWorkflowMode {
  if (!input.isCoachSetupLoaded) return "loading";
  if (
    input.coachUserId.trim() === "" ||
    input.athleteId.trim() === "" ||
    input.entityId.trim() === ""
  ) {
    return "loading";
  }

  const releaseMode = resolveTrainingPlanReleaseMode({
    hasHeadCoachConfigured: input.hasHeadCoachConfigured,
    trainingPlanReleaseMode: input.trainingPlanReleaseMode,
  });
  const shellOwnership = resolveTrainingPlanShellOwnership({
    isCoachSetupLoaded: input.isCoachSetupLoaded,
    coachUserId: input.coachUserId,
    athleteId: input.athleteId,
    entityId: input.entityId,
    hasHeadCoachConfigured: input.hasHeadCoachConfigured,
    trainingPlanReleaseMode: input.trainingPlanReleaseMode,
    headCoachOwnsPlanningContext:
      releaseMode === "head_coach_review" && input.hasHeadCoachConfigured,
    skillsCoachOwnsPlanningContext:
      releaseMode === "direct_release" && !input.hasHeadCoachConfigured,
    academyCoachRole: input.academyCoachRole,
    coachAssignedGenerationDomains: input.coachAssignedGenerationDomains,
  });

  if (shellOwnership.planningContextShellOwner === "waiting_role") {
    return "specialist_domain";
  }
  if (shellOwnership.planningContextShellOwner === "skills_coach") {
    if (!input.isPlanningContextResolved) return "loading";
    return "skills_coach_planning";
  }
  if (
    input.coachAssignedGenerationDomains.length > 0 &&
    input.headCoachOwnsAssignedDomainGeneration === true
  ) {
    return "head_coach_function_aware";
  }
  if (!input.isPlanningContextResolved || !input.areHeadCoachDomainPlansResolved) {
    return "loading";
  }
  if (input.planningContextLocked || input.hasSubmittedDomainPlans) {
    return "head_coach_review";
  }
  return "head_coach_planning";
}

export function resolveInitialTrainingPlanWorkflowTab(input: {
  workflowMode: TrainingPlanWorkflowMode;
  requestedPlanId: string | null;
  urlPlanCandidate: string | null;
  planningContextLocked: boolean;
  hasSubmittedDomainPlans: boolean;
  appStepComplete: boolean;
  levelStepComplete: boolean;
  workloadComplete: boolean;
  seasonGoalsGateComplete: boolean;
  planDatesStepComplete: boolean;
  isDownstreamDomainCoach: boolean;
}): GuidedWorkflowStepKey {
  if (input.requestedPlanId !== null || input.urlPlanCandidate !== null) {
    return "generate";
  }
  if (
    (input.workflowMode === "head_coach_review" ||
      input.workflowMode === "head_coach_function_aware" ||
      input.workflowMode === "skills_coach_planning") &&
    (input.planningContextLocked || input.hasSubmittedDomainPlans)
  ) {
    return "generate";
  }
  if (input.isDownstreamDomainCoach && input.appStepComplete && input.levelStepComplete) {
    return "generate";
  }
  if (input.planDatesStepComplete) return "plan-dates";
  if (input.seasonGoalsGateComplete) return "season-goals";
  if (input.workloadComplete) return "workload";
  if (input.levelStepComplete) return "level-validation";
  return "context-app";
}

export function resolveSkillsOwnedDirectReleaseCurrentStep(input: {
  workflowMode: TrainingPlanWorkflowMode;
  requestedPlanId: string | null;
  urlPlanCandidate: string | null;
  planningContextLocked: boolean;
  skillsPlanExists: boolean;
  contextHasPlanWindow: boolean;
}): GuidedWorkflowStepKey | null {
  if (input.workflowMode !== "skills_coach_planning") return null;
  if (input.requestedPlanId !== null || input.urlPlanCandidate !== null) {
    return "generate";
  }
  if (input.planningContextLocked && !input.skillsPlanExists) {
    return "generate";
  }
  if (input.contextHasPlanWindow && !input.skillsPlanExists) {
    return "generate";
  }
  return null;
}

function isTerminalBootstrapLoadState(state: TrainingPlanBootstrapLoadState): boolean {
  return state === "loaded" || state === "error";
}

export function resolveTrainingPlanPageBootstrapModel(input: {
  identityReady: boolean;
  assignmentReady: boolean;
  workflowMode: TrainingPlanWorkflowMode;
  planningContextRequired: boolean;
  planningContextLoadState: TrainingPlanBootstrapLoadState;
  submittedDomainPlansRequired: boolean;
  submittedDomainPlansLoadState: TrainingPlanBootstrapLoadState;
}): TrainingPlanPageBootstrapModel {
  if (!input.identityReady) {
    return {
      ready: false,
      shell: "loading",
      workflowMode: "loading",
      waitingFor: "identity",
    };
  }
  if (!input.assignmentReady) {
    return {
      ready: false,
      shell: "loading",
      workflowMode: "loading",
      waitingFor: "assignment",
    };
  }
  if (input.workflowMode === "loading") {
    return {
      ready: false,
      shell: "loading",
      workflowMode: "loading",
      waitingFor: "workflow_mode",
    };
  }
  if (
    input.planningContextRequired &&
    !isTerminalBootstrapLoadState(input.planningContextLoadState)
  ) {
    return {
      ready: false,
      shell: "loading",
      workflowMode: input.workflowMode,
      waitingFor: "planning_context",
    };
  }
  if (
    input.submittedDomainPlansRequired &&
    !isTerminalBootstrapLoadState(input.submittedDomainPlansLoadState)
  ) {
    return {
      ready: false,
      shell: "loading",
      workflowMode: input.workflowMode,
      waitingFor: "submitted_domain_plans",
    };
  }
  return {
    ready: true,
    shell: input.workflowMode,
    workflowMode: input.workflowMode,
    waitingFor: null,
  };
}

type GovernedPlanActionButtonLabelOpts = {
  /**
   * Use Case #1: Head Coach owns SKILLS generation — SUBMIT_REVIEW advances readiness,
   * not submission "to Head Coach".
   */
  headCoachSkillsSubmitReview?: boolean;
  /** Assistant coaches: distinguish first submit vs resubmit after revision. */
  submitReviewIsResubmit?: boolean;
};

function governedPlanActionButtonLabel(
  action: GovernedTrainingPlanWorkflowAction,
  opts?: GovernedPlanActionButtonLabelOpts,
): string {
  if (action === "SUBMIT_REVIEW") {
    if (opts?.headCoachSkillsSubmitReview) {
      return "Mark Skills Plan Ready";
    }
    return opts?.submitReviewIsResubmit
      ? "Resubmit for Head Coach Review"
      : "Submit for Head Coach Review";
  }
  if (action === "HEAD_APPROVE") return "Approve";
  if (action === "REQUEST_REVISION") return "Request Revision";
  return "Release Plan to Athlete";
}

export function canShowHeadCoachReviewReleaseAction(input: {
  allowedActions: ReadonlySet<GovernedTrainingPlanWorkflowAction>;
  status: string | null;
}): boolean {
  return (
    input.allowedActions.has("RELEASE") &&
    (input.status?.trim().toUpperCase() ?? "") === "HEAD_COACH_APPROVED"
  );
}

function governedPlanActionSuccessMessage(
  action: GovernedTrainingPlanWorkflowAction,
): string {
  if (action === "SUBMIT_REVIEW") return "Plan submitted for Head Coach review.";
  if (action === "HEAD_APPROVE") return "Plan approved.";
  if (action === "REQUEST_REVISION") return "Revision requested.";
  return "Domain plan released to athlete.";
}

export function shouldShowSelectedDomainInspectorActionSuccess(
  message: string | null,
): boolean {
  return message !== null && message !== governedPlanActionSuccessMessage("RELEASE");
}

function governedPlanActionErrorFallback(
  action: GovernedTrainingPlanWorkflowAction,
): string {
  if (action === "SUBMIT_REVIEW") {
    return "Unable to submit the training plan for review.";
  }
  if (action === "HEAD_APPROVE") {
    return "Unable to approve the training plan.";
  }
  if (action === "REQUEST_REVISION") {
    return "Unable to request revision for the training plan.";
  }
  return "Unable to release the training plan to the athlete.";
}

function isMissingPlanningProfileError(e: unknown): boolean {
  if (!isNormalizedApiError(e)) return false;
  const msg = e.message.trim().toLowerCase();
  return e.status === 404 || msg.includes("planning profile not found");
}

function isNotFoundError(e: unknown): boolean {
  return isNormalizedApiError(e) && e.status === 404;
}

function isForbiddenError(e: unknown): boolean {
  return isNormalizedApiError(e) && e.status === 403;
}

function formatMissingRequiredFields(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "None";
}

function normalizeReadinessStatus(value: string | null): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return normalized === "" ? null : normalized;
}

function canRunWorkloadAssessment(input: {
  appCompleteness: string | null;
  validationStatus: string | null;
  planningEligibility: string | null;
}): boolean {
  return (
    input.appCompleteness === "COMPLETE" &&
    input.validationStatus === "CONFIRMED" &&
    input.planningEligibility === "ELIGIBLE_FOR_WORKLOAD_ASSESSMENT"
  );
}

export function resolveContextAppStepCompleteForNavigation(input: {
  appCompleteness: string | null;
  planningEligibility: string | null;
  missingRequiredFields: string[];
  backendBlockers: string[];
  skillsOwnedDirectRelease: boolean;
}): boolean {
  if (input.appCompleteness === "COMPLETE") return true;
  if (!input.skillsOwnedDirectRelease) return false;
  return (
    input.planningEligibility === "PENDING_LEVEL_VALIDATION" &&
    input.missingRequiredFields.length === 0 &&
    input.backendBlockers.length === 0
  );
}

function readinessAllowsPlanGeneration(input: {
  readinessStatus: string | null;
  isReady: boolean | null;
  canGenerate: boolean | null;
  blockers: string[];
}): boolean {
  if (input.canGenerate !== null) return input.canGenerate;
  if (input.isReady !== null) return input.isReady;
  const readinessStatus = normalizeReadinessStatus(input.readinessStatus);
  return (
    (readinessStatus === "COMPLETE" ||
      readinessStatus === "READY" ||
      readinessStatus === "CAN_GENERATE") &&
    input.blockers.length === 0
  );
}

function formatBackendReadinessBlockers(blockers: string[]): string | null {
  if (blockers.length === 0) return null;
  const coachFacingBlockers = coachFacingPlanningContextBlockers(blockers);
  if (coachFacingBlockers.length === 0) {
    return "Complete required planning context before generating.";
  }
  return `Complete planning context: ${coachFacingBlockers.join(", ")}`;
}

function coachFacingPlanningContextBlockers(blockers: string[]): string[] {
  return blockers
    .map((blocker) => humanizePlanningContextBlockerCode(blocker))
    .filter((blocker): blocker is string => blocker !== null);
}

function hasWorkloadAssessmentResult(
  workloadAssessment: CoachAthleteTrainingPlanWorkloadAssessment | null,
): boolean {
  if (!workloadAssessment) return false;
  return (
    workloadAssessment.workloadClassification !== null ||
    workloadAssessment.assessmentStatus !== null ||
    workloadAssessment.readinessLevel !== null ||
    workloadAssessment.workloadFlags !== null ||
    workloadAssessment.restrictionSummary !== null ||
    workloadAssessment.explanation !== null ||
    Object.keys(workloadAssessment.additionalDetails).length > 0
  );
}

type WorkloadReadinessGate = {
  appCompleteness: string | null;
  validationStatus: string | null;
  planningEligibility: string | null;
};

function workloadAssessmentEligibilityGateFromSources(input: {
  profile: CoachAthletePlanningProfileData | null;
  levelValidation: TrainingPlanLevelValidationView | null;
  readiness: CoachAthleteTrainingPlanReadiness | null;
  completeness: CoachAthleteTrainingPlanCompleteness | null;
}): WorkloadReadinessGate {
  return {
    appCompleteness:
      input.profile?.completenessStatus ??
      input.readiness?.appCompleteness ??
      input.completeness?.completenessStatus ??
      null,
    validationStatus: deriveSharedValidationStatus({
      levelValidationStatus: input.levelValidation?.validationStatus ?? null,
      readinessValidationStatus: input.readiness?.validationStatus ?? null,
      profileValidatedLevel: input.profile?.validatedLevel ?? null,
    }),
    planningEligibility:
      input.readiness?.planningEligibilityStatus ??
      input.profile?.planningEligibilityStatus ??
      null,
  };
}

function TrainingPlanWorkloadAssessmentStep({
  showValidateLevel,
  readinessLoading,
  workloadAssessmentLoading,
  workloadAssessmentError,
  workloadAssessmentResult,
  workloadComplete,
  showWorkloadCompletionState,
  readinessGate,
  onRunWorkloadAssessment,
}: {
  showValidateLevel: boolean;
  readinessLoading: boolean;
  workloadAssessmentLoading: boolean;
  workloadAssessmentError: string | null;
  workloadAssessmentResult: CoachAthleteTrainingPlanWorkloadAssessment | null;
  workloadComplete: boolean;
  showWorkloadCompletionState: boolean;
  readinessGate: WorkloadReadinessGate;
  onRunWorkloadAssessment: () => void;
}) {
  const transientCompletionVisible =
    workloadComplete && showWorkloadCompletionState && workloadAssessmentResult !== null;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-normal text-textPrimary">Step 3 — Workload Assessment</h3>
        <p className="text-sm text-textSecondary">
          Review the workload assessment before Season & Goals and Plan Dates.
        </p>
      </div>

      {workloadAssessmentLoading ? (
        <DashboardStatusNotice
          type="loading"
          icon={<Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />}
          compact
        >
          Running workload assessment...
        </DashboardStatusNotice>
      ) : null}

      {transientCompletionVisible ? (
        <DashboardStatusNotice
          type="success"
          title="Workload Assessment Complete"
          icon={<Check className="h-4 w-4 text-emerald-600" aria-hidden />}
        >
          <div className="space-y-1">
            <p className="text-xs font-normal uppercase tracking-wide text-emerald-800/90">
              Training Load Status
            </p>
            <p className="text-base font-normal text-emerald-950">
              {displayValue(workloadAssessmentResult.workloadClassification?.status)}
            </p>
          </div>
        </DashboardStatusNotice>
      ) : null}

      {!transientCompletionVisible &&
      workloadAssessmentLoading === false &&
      !workloadAssessmentResult &&
      showValidateLevel ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <div className="space-y-2">
            <p className="text-sm font-normal text-primary">
              Next Action: Run Workload Assessment
            </p>
            <Button
              type="button"
              variant="primary"
              disabled={
                readinessLoading ||
                workloadAssessmentLoading ||
                !canRunWorkloadAssessment(readinessGate)
              }
              onClick={onRunWorkloadAssessment}
            >
              Run Workload Assessment
            </Button>
          </div>
        </div>
      ) : null}

      {workloadAssessmentError ? (
        <DashboardStatusNotice type="error">{workloadAssessmentError}</DashboardStatusNotice>
      ) : null}

      {workloadAssessmentResult &&
      !(workloadComplete && showWorkloadCompletionState) ? (
        <div className="space-y-3 border-y border-border/70 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h4 className="text-sm font-normal text-textPrimary">Workload Assessment Result</h4>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-textSecondary">
              {workloadAssessmentResult.workloadClassification?.status
                ? displayValue(workloadAssessmentResult.workloadClassification.status)
                : "Pending"}
            </span>
          </div>
          {hasWorkloadAssessmentResult(workloadAssessmentResult) ? (
            <>
              <div className="space-y-3 border-t border-border/70 pt-3">
                <h5 className="text-sm font-normal text-textPrimary">Training Load Classification</h5>
                {workloadAssessmentResult.workloadClassification ? (
                  <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <DetailRow
                      label="Current Weekly Training Hours"
                      value={displayValue(
                        workloadAssessmentResult.workloadClassification.weeklyTrainingHours,
                      )}
                    />
                    <DetailRow
                      label="Recommended Range"
                      value={formatWeeklyRange(
                        workloadAssessmentResult.workloadClassification.recommendedMinHours,
                        workloadAssessmentResult.workloadClassification.recommendedMaxHours,
                      )}
                    />
                    <DetailRow
                      label="Training Load Status"
                      value={displayValue(
                        workloadAssessmentResult.workloadClassification.status,
                      )}
                    />
                    <DetailRow
                      label="Sport"
                      value={displayValue(
                        workloadAssessmentResult.workloadClassification.sportCode,
                      )}
                    />
                    <DetailRow
                      label="Age Band"
                      value={displayValue(workloadAssessmentResult.workloadClassification.ageBand)}
                    />
                  </dl>
                ) : (
                  <div className="text-sm text-textSecondary">
                    No sport-specific workload rule is available yet.
                  </div>
                )}
              </div>
            </>
          ) : workloadAssessmentResult.rawPayloadText ? (
            <div className="space-y-2">
              <div className="text-sm text-textSecondary">
                No recognized workload assessment fields were found. Showing raw response instead.
              </div>
              <pre className="overflow-x-auto rounded-md bg-slate-100 p-3 text-xs text-textPrimary">
                {workloadAssessmentResult.rawPayloadText}
              </pre>
            </div>
          ) : (
            <div className="text-sm text-textSecondary">
              Workload assessment completed, but no displayable result was returned.
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function formatWeeklyRange(
  minHours: number | null,
  maxHours: number | null,
): string {
  if (minHours === null && maxHours === null) return "—";
  if (minHours !== null && maxHours !== null) {
    return `${minHours} - ${maxHours} hrs/week`;
  }
  if (minHours !== null) return `${minHours}+ hrs/week`;
  return `Up to ${maxHours} hrs/week`;
}

function deriveLockedPlanningContextCardFields(input: {
  upstream: CoachAthleteUpstreamPlanningContext | null;
  workloadAssessment: CoachAthleteTrainingPlanWorkloadAssessment | null;
  profileValidatedLevel: string | null;
  readinessValidatedLevel: string | null;
}): {
  validatedLevel: string | null;
  weeklyWorkload: string | null;
  weeklyTrainingHours: number | null;
  seasonPhase: string | null;
} {
  const context = input.upstream?.planningContext;
  const planningContextWorkload = context?.workload ?? null;
  const topLevelWorkload = input.upstream?.workload ?? null;
  const contextWorkload = planningContextWorkload ?? topLevelWorkload;
  const workloadClassification = input.workloadAssessment?.workloadClassification ?? null;

  const validatedLevel =
    context?.validatedLevel ??
    contextWorkload?.validatedLevel ??
    input.upstream?.workloadSummary.validatedLevel ??
    input.readinessValidatedLevel ??
    input.profileValidatedLevel ??
    workloadClassification?.validatedLevel ??
    null;

  const weeklyWorkload =
    planningContextWorkload?.recommendedRange?.label ??
    topLevelWorkload?.recommendedRange?.label ??
    contextWorkload?.summary ??
    topLevelWorkload?.summary ??
    formatWeeklyRange(
      workloadClassification?.recommendedMinHours ?? null,
      workloadClassification?.recommendedMaxHours ?? null,
    ) ??
    formatWeeklyRange(
      contextWorkload?.recommendedMinHours ??
        input.upstream?.workloadSummary.recommendedMinHours ??
        null,
      contextWorkload?.recommendedMaxHours ??
        input.upstream?.workloadSummary.recommendedMaxHours ??
        null,
    ) ??
    contextWorkload?.trainingLoadStatus ??
    topLevelWorkload?.trainingLoadStatus ??
    input.upstream?.workloadSummary.status ??
    null;

  return {
    validatedLevel,
    weeklyWorkload,
    weeklyTrainingHours:
      contextWorkload?.weeklyTrainingHours ??
      workloadClassification?.weeklyTrainingHours ??
      input.upstream?.workloadSummary.weeklyTrainingHours ??
      null,
    seasonPhase:
      input.upstream?.season?.phaseName ??
      input.upstream?.season?.phaseCode ??
      context?.season?.phaseName ??
      context?.season?.phaseCode ??
      input.upstream?.phase ??
      null,
  };
}

function formatDateInputValue(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysToDateString(dateString: string, daysToAdd: number): string {
  const base = new Date(`${dateString}T00:00:00.000Z`);
  if (Number.isNaN(base.getTime())) return "";
  base.setUTCDate(base.getUTCDate() + daysToAdd);
  return formatDateInputValue(base);
}

function formatSportLabel(sportCode: string): string {
  return sportCode
    .toLowerCase()
    .split(/[_\s]+/)
    .filter((part) => part !== "")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function coachFacingGoalTitle(goal: {
  goalName?: string | null;
  competitionEventId?: string | null;
}): string {
  const goalName = goal.goalName?.trim();
  if (goalName) return goalName;
  const competitionLabel = goal.competitionEventId?.trim();
  if (competitionLabel) return competitionLabel;
  return "Unnamed goal";
}

export function formatSeasonOptionLabel(season: SeasonCycleSummary): string {
  if (season.name) return season.name;
  if (season.year !== null && season.sport) {
    return `${season.year} ${formatSportLabel(season.sport)} Season`;
  }
  return season.id;
}

export function resolveSetupStateAfterSeasonCreate(
  current: GoalsSeasonSetupState,
  createdSeason: SeasonCycleSummary,
): GoalsSeasonSetupState {
  const createdPhases = createdSeason.phases ?? [];
  const hasExistingSeason = current.seasons.some(
    (season) => season.seasonCycleId === createdSeason.seasonCycleId,
  );
  return {
    ...current,
    seasons: hasExistingSeason
      ? current.seasons.map((season) =>
          season.seasonCycleId === createdSeason.seasonCycleId
            ? { ...createdSeason, phases: createdPhases }
            : season,
        )
      : [...current.seasons, { ...createdSeason, phases: createdPhases }],
    phasesBySeasonCycleId: {
      ...current.phasesBySeasonCycleId,
      [createdSeason.seasonCycleId]: createdPhases,
    },
  };
}

function dateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

function toUtcDateTimeString(value: string): string {
  return `${value}T00:00:00.000Z`;
}

function yearStartDateInput(year: number): string {
  return `${year}-01-01`;
}

function yearEndDateInput(year: number): string {
  return `${year}-12-31`;
}

function slugifyCompetitionId(name: string, date: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const datePart = date.trim().replace(/[^0-9]/g, "");
  return [slug, datePart].filter((part) => part !== "").join("-");
}

function phaseSortValue(phase: string | null): number {
  if (phase === "OFF_SEASON") return 0;
  if (phase === "PRE_SEASON") return 1;
  if (phase === "IN_SEASON") return 2;
  return 99;
}

function detectCurrentPhase(
  phases: SeasonPhaseSummary[],
  today: string,
): SeasonPhaseSummary | null {
  return (
    [...phases]
      .sort((left, right) => phaseSortValue(left.phase) - phaseSortValue(right.phase))
      .find((phase) => {
        if (!phase.startDate || !phase.endDate) return false;
        const start = dateOnly(phase.startDate);
        const end = dateOnly(phase.endDate);
        if (!start || !end) return false;
        return start <= today && today <= end;
      }) ?? null
  );
}

export function resolveCompetitionSeasonPhaseForDate(input: {
  phases: SeasonPhaseSummary[];
  competitionDate: string;
}): SeasonPhaseSummary | null {
  const competitionDate = input.competitionDate.trim();
  if (competitionDate === "") return null;
  const matchingPhases = input.phases.filter((phase) => {
    if (!phase.phaseId || !phase.startDate || !phase.endDate) return false;
    const start = dateOnly(phase.startDate);
    const end = dateOnly(phase.endDate);
    return start !== null && end !== null && competitionDate >= start && competitionDate <= end;
  });
  return (
    matchingPhases.sort((left, right) => {
      if (left.phase === "IN_SEASON" && right.phase !== "IN_SEASON") return -1;
      if (right.phase === "IN_SEASON" && left.phase !== "IN_SEASON") return 1;
      return phaseSortValue(left.phase) - phaseSortValue(right.phase);
    })[0] ?? null
  );
}

function goalMatchesCurrentPhase(
  goal: GoalSummary,
  currentPhase: SeasonPhaseSummary | null,
): boolean {
  if (!currentPhase) return false;
  if (goal.seasonPhaseId && currentPhase.phaseId) {
    return goal.seasonPhaseId === currentPhase.phaseId;
  }
  if (!currentPhase.startDate || !currentPhase.endDate) return true;
  const targetDate = goal.targetDate?.slice(0, 10) ?? null;
  if (!targetDate) return true;
  const phaseStart = dateOnly(currentPhase.startDate);
  const phaseEnd = dateOnly(currentPhase.endDate);
  if (!phaseStart || !phaseEnd) return true;
  return phaseStart <= targetDate && targetDate <= phaseEnd;
}

function validatePhaseDraft(
  phase: SeasonPhaseType,
  draft: { startDate: string; endDate: string },
  existingPhases: SeasonPhaseSummary[],
  season: SeasonCycleSummary | null,
): string | null {
  if (draft.startDate === "" || draft.endDate === "") {
    return "Start date and end date are required.";
  }
  if (draft.startDate >= draft.endDate) {
    return "Phase start date must be before end date.";
  }
  const seasonStart = dateOnly(season?.startDate);
  const seasonEnd = dateOnly(season?.endDate);
  if (
    seasonStart &&
    seasonEnd &&
    (draft.startDate < seasonStart || draft.endDate > seasonEnd)
  ) {
    return "Phase dates must fall within the season start and end dates.";
  }

  const byType = Object.fromEntries(
    existingPhases
      .filter((item) => item.phase)
      .map((item) => [item.phase as SeasonPhaseType, item]),
  ) as Partial<Record<SeasonPhaseType, SeasonPhaseSummary>>;

  if (phase === "PRE_SEASON" && !byType.OFF_SEASON) {
    return "Create Off-season first.";
  }
  if (phase === "IN_SEASON" && !byType.PRE_SEASON) {
    return "Create Pre-season first.";
  }
  if (byType[phase]) {
    return "This phase already exists.";
  }

  const previousPhase =
    phase === "PRE_SEASON"
      ? byType.OFF_SEASON
      : phase === "IN_SEASON"
        ? byType.PRE_SEASON
        : null;
  const previousPhaseEnd = dateOnly(previousPhase?.endDate);
  if (previousPhaseEnd && draft.startDate <= previousPhaseEnd) {
    return "Phase dates must be sequential and cannot overlap.";
  }
  for (const existing of existingPhases) {
    if (!existing.startDate || !existing.endDate) continue;
    const existingStart = dateOnly(existing.startDate);
    const existingEnd = dateOnly(existing.endDate);
    if (!existingStart || !existingEnd) continue;
    const overlaps =
      draft.startDate <= existingEnd && existingStart <= draft.endDate;
    if (overlaps) {
      return "Phase dates cannot overlap existing phases.";
    }
  }
  return null;
}

function validatePhaseUpdateDraft(
  phase: SeasonPhaseType,
  phaseId: string,
  draft: { startDate: string; endDate: string },
  existingPhases: SeasonPhaseSummary[],
  season: SeasonCycleSummary | null,
): string | null {
  if (draft.startDate === "" || draft.endDate === "") {
    return "Start date and end date are required.";
  }
  if (draft.startDate >= draft.endDate) {
    return "Phase start date must be before end date.";
  }
  const seasonStart = dateOnly(season?.startDate);
  const seasonEnd = dateOnly(season?.endDate);
  if (
    seasonStart &&
    seasonEnd &&
    (draft.startDate < seasonStart || draft.endDate > seasonEnd)
  ) {
    return "Phase dates must fall within the season start and end dates.";
  }

  const siblings = existingPhases.filter((item) => (item.phaseId ?? "") !== phaseId);
  const byType = Object.fromEntries(
    siblings
      .filter((item) => item.phase)
      .map((item) => [item.phase as SeasonPhaseType, item]),
  ) as Partial<Record<SeasonPhaseType, SeasonPhaseSummary>>;

  const previousPhase =
    phase === "PRE_SEASON"
      ? byType.OFF_SEASON
      : phase === "IN_SEASON"
        ? byType.PRE_SEASON
        : null;
  const nextPhase =
    phase === "OFF_SEASON"
      ? byType.PRE_SEASON
      : phase === "PRE_SEASON"
        ? byType.IN_SEASON
        : null;
  const previousPhaseEnd = dateOnly(previousPhase?.endDate);
  const nextPhaseStart = dateOnly(nextPhase?.startDate);
  if (previousPhaseEnd && draft.startDate <= previousPhaseEnd) {
    return "Phase dates must be sequential and cannot overlap.";
  }
  if (nextPhaseStart && draft.endDate >= nextPhaseStart) {
    return "Phase dates must be sequential and cannot overlap.";
  }
  for (const sibling of siblings) {
    const siblingStart = dateOnly(sibling.startDate);
    const siblingEnd = dateOnly(sibling.endDate);
    if (!siblingStart || !siblingEnd) continue;
    const overlaps = draft.startDate <= siblingEnd && siblingStart <= draft.endDate;
    if (overlaps) {
      return "Phase dates cannot overlap existing phases.";
    }
  }
  return null;
}

function isPlanWindowInsidePhase(
  currentPhase: SeasonPhaseSummary | null,
  startDate: string,
  endDate: string,
): boolean {
  if (!currentPhase?.startDate || !currentPhase.endDate) return false;
  if (startDate === "" || endDate === "") return false;
  const phaseStart = dateOnly(currentPhase.startDate);
  const phaseEnd = dateOnly(currentPhase.endDate);
  if (!phaseStart || !phaseEnd) return false;
  return phaseStart <= startDate && endDate <= phaseEnd;
}

function readSafeGenerationJobError(job: CoachAthleteTrainingPlanGenerationJob): string {
  return (
    job.errorMessage?.trim()
    || "Could not generate training plan draft. Please try again shortly."
  );
}

export function renderGenerationJobButtonLabel(
  domain: TrainingPlanGenerationDomain,
  job: Pick<CoachAthleteTrainingPlanGenerationJob, "domain" | "status"> | null,
): string {
  if (!job || job.domain !== domain) return generationButtonLabel(domain);
  if (job.status === "COMPLETED") return "Draft ready";
  if (job.status === "FAILED") return generationButtonLabel(domain);
  return "Generating plan...";
}

function renderGenerationJobProgress(job: CoachAthleteTrainingPlanGenerationJob | null) {
  if (!isGenerationJobInProgress(job)) return null;
  const progressPercent = Math.max(0, Math.min(100, job.progressPercent ?? 0));
  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3 text-sm text-textPrimary">
        <span className="font-medium">{job.progressStage?.trim() || "Generating plan"}</span>
        <span>{progressPercent}%</span>
      </div>
      <div
        aria-label="Training plan generation progress"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={progressPercent}
        className="h-2 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-slate-900 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="text-sm text-textSecondary">
        {job.progressMessage?.trim() || "Training plan generation is in progress."}
      </div>
    </div>
  );
}

export function isGenerationJobInProgress(
  job: Pick<CoachAthleteTrainingPlanGenerationJob, "status"> | null,
): boolean {
  return job?.status === "QUEUED" || job?.status === "RUNNING";
}

export function shouldShowGeneratedDraftEmptyState(input: {
  draftMissing: boolean;
  generationInProgress: boolean;
}): boolean {
  return input.draftMissing && !input.generationInProgress;
}

export function shouldShowDomainButtonProgress(input: {
  domain: TrainingPlanGenerationDomain;
  currentDomain: TrainingPlanGenerationDomain | null;
  generationInProgress: boolean;
}): boolean {
  return !(input.generationInProgress && input.domain === input.currentDomain);
}

function coachFunctionToGenerationDomain(
  value: string,
): TrainingPlanGenerationDomain | null {
  const normalized = normalizeCoachFunctionValue(value);
  if (normalized === "SKILLS" || normalized === "SKILLS_COACH") return "SKILLS";
  if (normalized === "NUTRITION" || normalized === "NUTRITION_COACH") {
    return "NUTRITION";
  }
  if (
    normalized === "S_AND_C" ||
    normalized === "STRENGTH_AND_CONDITIONING" ||
    normalized === "S_AND_C_COACH" ||
    normalized === "STRENGTH_AND_CONDITIONING_COACH"
  ) {
    return "S_AND_C";
  }
  return null;
}

function deriveGenerationDomains(
  functions: string[],
): TrainingPlanGenerationDomain[] {
  const domains = new Set<TrainingPlanGenerationDomain>();
  for (const value of functions) {
    const domain = coachFunctionToGenerationDomain(value);
    if (domain) domains.add(domain);
  }
  return GENERATION_DOMAIN_ORDER.filter((domain) => domains.has(domain));
}

function resolveCoachGenerationFunctions(input: {
  currentCoachUserId: string;
  academyCoachFunctions: string[];
  dashboardFunctions: string[];
}): string[] {
  if (
    input.currentCoachUserId !== "" &&
    deriveGenerationDomains(input.academyCoachFunctions).length > 0
  ) {
    return input.academyCoachFunctions;
  }
  if (deriveGenerationDomains(input.dashboardFunctions).length > 0) {
    return input.dashboardFunctions;
  }
  return input.academyCoachFunctions.length > 0
    ? input.academyCoachFunctions
    : input.dashboardFunctions;
}

function generationButtonLabel(domain: TrainingPlanGenerationDomain): string {
  if (domain === "SKILLS") return "Create Skills Plan";
  if (domain === "NUTRITION") return "Create Nutrition Plan";
  return "Create S&C Plan";
}

function persistedPlanReviseButtonLabel(
  domain: TrainingPlanGenerationDomain | string | null | undefined,
): string {
  const normalized = typeof domain === "string" ? domain.trim().toUpperCase() : domain;
  if (normalized === "NUTRITION") return "Revise Nutrition Plan";
  if (normalized === "S_AND_C") return "Revise S&C Plan";
  return "Revise Skills Plan";
}

function generationDraftTitle(domain: TrainingPlanGenerationDomain): string {
  if (domain === "NUTRITION") return "Latest Generated Nutrition Draft";
  if (domain === "S_AND_C") return "Latest Generated S&C Draft";
  return "Latest Generated Skills Draft";
}

function generationDraftEmptyState(domain: TrainingPlanGenerationDomain): string {
  if (domain === "NUTRITION") return "No Nutrition draft generated yet.";
  if (domain === "S_AND_C") return "No S&C draft generated yet.";
  return "No generated skills draft found yet.";
}

function generationDurationDaysForDomain(
  domain: TrainingPlanGenerationDomain,
  selectedDurationDays: 7 | 15 | 30,
): 7 {
  void domain;
  void selectedDurationDays;
  return 7;
}

function planWindowWithinSelectedSeasonBounds(
  season: SeasonCycleSummary | null,
  planStart: string,
  planEnd: string,
): boolean {
  if (!season || planStart.trim() === "" || planEnd.trim() === "") {
    return false;
  }
  const seasonStart = dateOnly(season.startDate) ?? "";
  const seasonEnd = dateOnly(season.endDate) ?? "";
  if (seasonStart === "" || seasonEnd === "") {
    return false;
  }
  return planStart >= seasonStart && planEnd <= seasonEnd;
}

function trimmedNonEmpty(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    const t = typeof value === "string" ? value.trim() : "";
    if (t !== "") return t;
  }
  return null;
}

/**
 * Derives locked season id, plan window, and sport the same way the assistant domain workspace
 * summary hydrates nested/fallback upstream fields (planWindow, planningContext, season/workload).
 */
function deriveAssistantLockedUpstreamFields(input: {
  upstream: CoachAthleteUpstreamPlanningContext | null;
  profile: CoachAthletePlanningProfileData | null;
  assistantSportFallback: string | null;
}): {
  lockedSeasonCycleId: string | null;
  lockedPlanWindowStart: string | null;
  lockedPlanWindowEnd: string | null;
  lockedSportCode: string | null;
} {
  const upstream = input.upstream;
  if (!upstream) {
    return {
      lockedSeasonCycleId: null,
      lockedPlanWindowStart: null,
      lockedPlanWindowEnd: null,
      lockedSportCode: null,
    };
  }
  const pc = upstream.planningContext ?? null;

  const lockedPlanWindowStart = trimmedNonEmpty(
    upstream.planWindow?.startDate,
    pc?.startDate,
    upstream.startDate,
  );
  const lockedPlanWindowEnd = trimmedNonEmpty(
    upstream.planWindow?.endDate,
    pc?.endDate,
    upstream.endDate,
  );

  const planningSeason = pc?.season ?? null;
  const upstreamSeason = upstream.season ?? null;
  const contextSeason = planningSeason ?? upstreamSeason;

  const lockedSeasonCycleId = trimmedNonEmpty(
    upstream.seasonCycleId,
    pc?.seasonCycleId,
    contextSeason?.seasonCycleId,
  );

  const planningWorkload = pc?.workload ?? null;
  const topWorkload = upstream.workload ?? null;
  const contextWorkload = planningWorkload ?? topWorkload;

  /** Matches `renderAssistantDomainWorkspace` workloadSportRaw precedence, plus explicit profile sportCode. */
  const lockedSportCode = trimmedNonEmpty(
    contextWorkload?.sport,
    contextSeason?.sport,
    contextWorkload?.sportCode,
    input.profile?.sportCode,
    input.profile?.primarySport,
    input.profile?.sportContext?.primarySport,
    input.assistantSportFallback,
  );

  return {
    lockedSeasonCycleId,
    lockedPlanWindowStart,
    lockedPlanWindowEnd,
    lockedSportCode,
  };
}

export function resolveGeneratePlanLocalError(input: {
  entityId: string;
  athleteId: string;
  generationDomain: TrainingPlanGenerationDomain | null;
  selectedSeasonCycleId: string | null;
  selectedGoalCount: number;
  sportCode: string | null;
  selectedSeason: SeasonCycleSummary | null;
  currentPhase: SeasonPhaseSummary | null;
  planStartDate: string;
  planEndDate: string;
  canUseLockedPlanningContextForGeneration?: boolean;
  lockedSeasonCycleId?: string | null;
  lockedPlanWindowStart?: string | null;
  lockedPlanWindowEnd?: string | null;
}): string | null {
  if (input.entityId.trim() === "" || input.athleteId.trim() === "") {
    return "Athlete route not available.";
  }
  if (input.generationDomain === null) {
    return "Plan generation domain is unavailable for this coach.";
  }
  if ((input.sportCode ?? "").trim() === "") {
    return "Sport code is missing for this athlete. Complete the Athlete Planning Profile before generation.";
  }
  if (input.canUseLockedPlanningContextForGeneration === true) {
    const lockedSeasonCycleId = input.lockedSeasonCycleId?.trim() ?? "";
    const lockedPlanWindowStart = input.lockedPlanWindowStart?.trim() ?? "";
    const lockedPlanWindowEnd = input.lockedPlanWindowEnd?.trim() ?? "";
    if (
      lockedSeasonCycleId === "" ||
      lockedPlanWindowStart === "" ||
      lockedPlanWindowEnd === ""
    ) {
      return LOCKED_CONTEXT_MISSING_GENERATION_DETAILS_MESSAGE;
    }
    if (input.selectedGoalCount === 0) {
      return "Select at least one active goal before generating a plan.";
    }
    return null;
  }
  if (input.selectedSeasonCycleId == null || input.selectedSeason === null) {
    return "Select a season before generating a plan.";
  }
  if (input.selectedGoalCount === 0) {
    return "Select at least one active goal before generating a plan.";
  }
  if (input.planStartDate.trim() === "" || input.planEndDate.trim() === "") {
    return "Plan start and end dates are required before generating a plan.";
  }
  if (input.currentPhase === null) {
    return "Training plan dates require an active season phase.";
  }
  if (!isPlanWindowInsidePhase(input.currentPhase, input.planStartDate, input.planEndDate)) {
    return "Selected plan window crosses the current season phase. Choose a shorter duration or adjust phase dates.";
  }
  if (
    !planWindowWithinSelectedSeasonBounds(
      input.selectedSeason,
      input.planStartDate,
      input.planEndDate,
    )
  ) {
    return "Plan dates must be within the selected season.";
  }
  return null;
}

export function canGenerateFromLockedPlanningContextForDomain(input: {
  domain: TrainingPlanGenerationDomain | null;
  effectiveDownstreamPlanningContextLocked: boolean;
  ownershipFlags: PlanGenerationOwnershipFlags;
  lockedSeasonCycleId: string | null | undefined;
  lockedPlanWindowStart: string | null | undefined;
  lockedPlanWindowEnd: string | null | undefined;
  lockedSportCode: string | null | undefined;
}): boolean {
  if (input.domain === null) return false;
  if (!input.effectiveDownstreamPlanningContextLocked) return false;
  if (isPlanGenerationBlockedByOwnership(input.ownershipFlags)) return false;
  if ((input.lockedSeasonCycleId ?? "").trim() === "") return false;
  if ((input.lockedPlanWindowStart ?? "").trim() === "") return false;
  if ((input.lockedPlanWindowEnd ?? "").trim() === "") return false;
  if ((input.lockedSportCode ?? "").trim() === "") return false;
  return true;
}

export function resolveAssistantDomainSubmitActionVisible(input: {
  workspace: TrainingPlanWorkspace | null;
  currentDomain: TrainingPlanGenerationDomain | null;
  discoveryLoading: boolean;
  governedDetailRefreshing: boolean;
  hasHeadCoachConfigured: boolean;
  allowedActionsHasSubmitReview: boolean;
  governedContext: AssistantGovernedPlanContext | null;
  latestDraft: AssistantVisibleDomainDraftIds;
}): boolean {
  if (input.workspace !== null) {
    return resolveWorkspaceDomainSubmitForReviewVisible(input.workspace, input.currentDomain);
  }
  return canShowAssistantDomainSubmitReview({
    discoveryLoading: input.discoveryLoading,
    governedDetailRefreshing: input.governedDetailRefreshing,
    hasHeadCoachConfigured: input.hasHeadCoachConfigured,
    allowedActionsHasSubmitReview: input.allowedActionsHasSubmitReview,
    governedContext: input.governedContext,
    latestDraft: input.latestDraft,
    currentDomain: input.currentDomain,
  });
}

export function resolveSubmitReviewPlanVersionIds(input: {
  workspace: TrainingPlanWorkspace | null;
  domain: TrainingPlanGenerationDomain;
  fallbackPlanId: string;
  fallbackVersionId: string;
}): { planId: string; versionId: string } {
  const summary = input.workspace?.domains[input.domain]?.summary ?? null;
  const workspacePlanId = summary?.trainingPlanId?.trim() ?? "";
  const workspaceVersionId = summary?.versionId?.trim() ?? "";
  return {
    planId: workspacePlanId !== "" ? workspacePlanId : input.fallbackPlanId,
    versionId: workspaceVersionId !== "" ? workspaceVersionId : input.fallbackVersionId,
  };
}

export type WorkflowActionContext = AssistantGovernedPlanContext & {
  versionNumber: number | null;
  status: string | null;
  allowedActions: string[];
  source: string;
};

function resolveWorkspaceSummaryActionVersionId(
  summary: TrainingPlanWorkspace["domains"]["SKILLS"]["summary"],
): string {
  return (
    summary.versionId?.trim() ??
    summary.activeVersionId?.trim() ??
    summary.approvedVersionId?.trim() ??
    summary.latestVersionId?.trim() ??
    ""
  );
}

export function isHeadCoachSkillsOwnerWorkflow(workspace: TrainingPlanWorkspace | null): boolean {
  if (workspace === null) return false;
  const assignmentSkillsContext = workspace.assignmentContext?.domains.SKILLS;
  if (assignmentSkillsContext !== undefined) {
    return (
      assignmentSkillsContext.ownerType === "HEAD_COACH_SELF" &&
      assignmentSkillsContext.ownedByCurrentUser === true
    );
  }
  if (workspace.workflowShape === "HEAD_COACH_SKILLS_OWNER") return true;
  return (
    workspace.shell === "HEAD_COACH_FUNCTION_AWARE" &&
    parseWorkspaceCurrentDomain(workspace.currentDomain) === "SKILLS" &&
    workspace.ownershipFlags.requesterOwnsSkillsForThisAthlete === true
  );
}

export function resolveWorkflowActionContext(input: {
  workspace: TrainingPlanWorkspace | null;
  legacyContext: AssistantGovernedPlanContext | null;
  legacyAllowedActions: Iterable<string>;
  currentDomain: TrainingPlanGenerationDomain | null;
}): WorkflowActionContext | null {
  const workspace = input.workspace;
  if (isHeadCoachSkillsOwnerWorkflow(workspace) && workspace !== null) {
    const skills = workspace.domains.SKILLS;
    const summary = skills.summary;
    const planId = summary.trainingPlanId?.trim() ?? "";
    const versionId = resolveWorkspaceSummaryActionVersionId(summary);
    if (planId === "" || versionId === "") return null;
    return {
      planId,
      versionId,
      generationDomain: summary.generationDomain ?? "SKILLS",
      versionNumber: summary.versionNumber,
      status: summary.status?.trim() || null,
      allowedActions: Array.isArray(skills.allowedActions) ? skills.allowedActions : [],
      source: "workspace.domains.SKILLS.summary",
    };
  }

  const legacyContext = input.legacyContext;
  if (legacyContext === null) return null;
  const workspaceDomain =
    input.workspace !== null && input.currentDomain !== null
      ? input.workspace.domains[input.currentDomain]
      : null;
  return {
    ...legacyContext,
    versionNumber: workspaceDomain?.summary.versionNumber ?? null,
    status: workspaceDomain?.summary.status?.trim() || null,
    allowedActions: Array.from(input.legacyAllowedActions),
    source: "legacy governed detail",
  };
}

export function resolveHeadCoachReviewActionContext(input: {
  workspace: TrainingPlanWorkspace | null;
  domain: TrainingPlanGenerationDomain;
  fallbackPlanId?: string | null;
  fallbackVersionId?: string | null;
}): GovernedPlanContext | null {
  const summary = input.workspace?.domains[input.domain]?.summary ?? null;
  const workspacePlanId = summary?.trainingPlanId?.trim() ?? "";
  const workspaceVersionId =
    summary !== null ? resolveHeadCoachDomainSummaryVersionId(summary) : null;
  const planId =
    workspacePlanId !== ""
      ? workspacePlanId
      : input.fallbackPlanId?.trim() ?? "";
  const versionId =
    workspaceVersionId !== null && workspaceVersionId !== ""
      ? workspaceVersionId
      : input.fallbackVersionId?.trim() ?? "";

  if (planId === "" || versionId === "") return null;

  return {
    planId,
    versionId,
    generationDomain: input.domain,
  };
}

export type WorkspaceDomainViewPlanContext = {
  planId: string;
  versionId: string;
  status: string | null;
  source: string;
};

export function resolveWorkspaceDomainViewPlanContext(input: {
  workspace: TrainingPlanWorkspace | null;
  domain: TrainingPlanGenerationDomain;
  fallbackPlanId?: string | null;
  fallbackVersionId?: string | null;
  fallbackStatus?: string | null;
  fallbackSource?: string;
  preferCompleteFallback?: boolean;
}): WorkspaceDomainViewPlanContext | null {
  const summary = input.workspace?.domains[input.domain]?.summary ?? null;
  const workspacePlanId = summary?.trainingPlanId?.trim() ?? "";
  const workspaceVersionId = summary?.versionId?.trim() ?? "";
  const fallbackPlanId = input.fallbackPlanId?.trim() ?? "";
  const fallbackVersionId = input.fallbackVersionId?.trim() ?? "";
  if (input.preferCompleteFallback === true && fallbackPlanId !== "" && fallbackVersionId !== "") {
    return {
      planId: fallbackPlanId,
      versionId: fallbackVersionId,
      status: input.fallbackStatus?.trim() || null,
      source: input.fallbackSource ?? "legacy fallback",
    };
  }
  if (workspacePlanId !== "") {
    return {
      planId: workspacePlanId,
      versionId: workspaceVersionId,
      status: summary?.status?.trim() || null,
      source: `workspace.domains.${input.domain}.summary`,
    };
  }

  if (fallbackPlanId === "") return null;
  return {
    planId: fallbackPlanId,
    versionId: fallbackVersionId,
    status: input.fallbackStatus?.trim() || null,
    source: input.fallbackSource ?? "legacy fallback",
  };
}

export type DomainRevisePlanIds = {
  trainingPlanId: string;
  versionId: string;
};

export function resolveDomainRevisePlanIds(input: {
  domain: TrainingPlanGenerationDomain;
  workspace: TrainingPlanWorkspace | null;
  persistedDetailDomain: TrainingPlanGenerationDomain | null;
  persistedPlanId: string | null | undefined;
  persistedVersionId: string | null | undefined;
  latestDraftDomain: TrainingPlanGenerationDomain | null;
  latestDraftPlanId: string | null | undefined;
  latestDraftVersionId: string | null | undefined;
}): DomainRevisePlanIds | null {
  const workspaceSummary = input.workspace?.domains[input.domain]?.summary ?? null;
  const workspacePlanId = workspaceSummary?.trainingPlanId?.trim() ?? "";
  const workspaceVersionId = workspaceSummary?.versionId?.trim() ?? "";
  if (workspacePlanId !== "" && workspaceVersionId !== "") {
    return { trainingPlanId: workspacePlanId, versionId: workspaceVersionId };
  }

  const persistedPlanId = input.persistedPlanId?.trim() ?? "";
  const persistedVersionId = input.persistedVersionId?.trim() ?? "";
  if (
    input.persistedDetailDomain === input.domain &&
    persistedPlanId !== "" &&
    persistedVersionId !== ""
  ) {
    return { trainingPlanId: persistedPlanId, versionId: persistedVersionId };
  }

  const latestDraftPlanId = input.latestDraftPlanId?.trim() ?? "";
  const latestDraftVersionId = input.latestDraftVersionId?.trim() ?? "";
  if (
    input.latestDraftDomain === input.domain &&
    latestDraftPlanId !== "" &&
    latestDraftVersionId !== ""
  ) {
    return { trainingPlanId: latestDraftPlanId, versionId: latestDraftVersionId };
  }

  return null;
}

export function shouldRenderWorkspaceDomainPlanContent(input: {
  shell: TrainingPlanPageShell;
  clickedDomain: TrainingPlanGenerationDomain;
  detailDomain: TrainingPlanGenerationDomain | null;
  hasDetail: boolean;
}): boolean {
  return (
    input.shell === "head_coach_function_aware" &&
    input.hasDetail &&
    input.detailDomain === input.clickedDomain
  );
}

export function shouldRenderPersistedDetailForDomain(input: {
  detailDomain: TrainingPlanGenerationDomain | null;
  renderedDomain: TrainingPlanGenerationDomain | null;
  hasDetail: boolean;
}): boolean {
  return (
    input.hasDetail &&
    input.detailDomain !== null &&
    input.renderedDomain !== null &&
    input.detailDomain === input.renderedDomain
  );
}

function draftSessionTitleLabel(domain: TrainingPlanGenerationDomain | null | undefined): string {
  return domain === "NUTRITION" ? "Meal Slot" : "Title";
}

function draftItemLabel(domain: TrainingPlanGenerationDomain | null | undefined): string {
  return domain === "NUTRITION" ? "Meal / Food Item" : "Label";
}

type NutritionMealItem = Pick<
  CoachAthleteGeneratedDraftItem,
  | "nutritionCatalogItemId"
  | "label"
  | "serving"
  | "quantity"
  | "unit"
  | "calories"
  | "protein"
  | "carbs"
  | "fat"
  | "timing"
  | "notes"
>;

function formatNutritionCaloriesDisplay(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${Math.round(value)} kcal`;
}

function formatNutritionGramsDisplay(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)} g`;
}

function sumNutritionMetric(
  items: NutritionMealItem[],
  key: "calories" | "protein" | "carbs" | "fat",
): number | null {
  let total = 0;
  let hasNumericValue = false;
  for (const item of items) {
    const value = item[key];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    total += value;
    hasNumericValue = true;
  }
  return hasNumericValue ? total : null;
}

function renderNutritionMacroTotals(
  label: string,
  items: NutritionMealItem[],
): ReactElement | null {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="text-sm font-medium text-textPrimary">{label}</div>
      <dl className="space-y-1">
        <DetailRow
          label="Calories"
          value={formatNutritionCaloriesDisplay(sumNutritionMetric(items, "calories"))}
        />
        <DetailRow
          label="Protein"
          value={formatNutritionGramsDisplay(sumNutritionMetric(items, "protein"))}
        />
        <DetailRow
          label="Carbs"
          value={formatNutritionGramsDisplay(sumNutritionMetric(items, "carbs"))}
        />
        <DetailRow
          label="Fat"
          value={formatNutritionGramsDisplay(sumNutritionMetric(items, "fat"))}
        />
      </dl>
    </div>
  );
}

function renderNutritionMealItems(items: NutritionMealItem[]): ReactElement | null {
  if (items.length === 0) {
    return (
      <div className="text-sm text-textSecondary">No meal items returned for this meal.</div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, itemOffset) => {
        const servingDisplay = item.serving ?? (
          item.quantity !== null || hasRenderableValue(item.unit)
            ? `${displayValue(item.quantity)} ${displayValue(item.unit)}`.trim()
            : null
        );
        return (
          <div
            key={`${item.nutritionCatalogItemId ?? item.label ?? "nutrition-item"}-${itemOffset}`}
            className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-3"
          >
            <dl className="space-y-1">
              <DetailRow label="Meal / Food Item" value={displayLabelTitleCase(item.label)} />
              <DetailRow label="Serving" value={displayValue(servingDisplay)} />
              <DetailRow
                label="Calories"
                value={formatNutritionCaloriesDisplay(item.calories)}
              />
              <DetailRow label="Protein" value={formatNutritionGramsDisplay(item.protein)} />
              <DetailRow label="Carbs" value={formatNutritionGramsDisplay(item.carbs)} />
              <DetailRow label="Fat" value={formatNutritionGramsDisplay(item.fat)} />
              {hasRenderableValue(item.timing) ? (
                <DetailRow label="Timing" value={displayValue(item.timing)} />
              ) : null}
              {hasRenderableValue(item.notes) ? (
                <DetailRow label="Notes" value={displayValue(item.notes)} />
              ) : null}
            </dl>
            <div className="text-xs text-textMuted">
              Nutrition Catalog Item ID: {displayValue(item.nutritionCatalogItemId)}
            </div>
          </div>
        );
      })}
      {renderNutritionMacroTotals("Meal Total", items)}
    </div>
  );
}

function goalGenerationDomain(goal: GoalSummary): TrainingPlanGenerationDomain | null {
  return goal.domain ?? "SKILLS";
}

function goalMatchesCoachGenerationDomain(
  goal: GoalSummary,
  domain: TrainingPlanGenerationDomain,
): boolean {
  return goalGenerationDomain(goal) === domain;
}

function currentPhaseGoalSectionTitle(): string {
  return "Goals for Current Phase";
}

function currentPhaseGoalNameLabel(domain: TrainingPlanGenerationDomain): string {
  if (domain === "NUTRITION") return "Nutrition Goal Name";
  if (domain === "S_AND_C") return "S&C Goal Name";
  return "Skill Goal Name";
}

function currentPhaseGoalRequirementLabel(): string {
  return "Select at least one active goal to guide training for this phase.";
}

function currentPhaseGoalEmptyState(domain: TrainingPlanGenerationDomain): string {
  if (domain === "NUTRITION") {
    return "No active Nutrition goals found for this phase.";
  }
  if (domain === "S_AND_C") {
    return "No active S&C goals found for this phase.";
  }
  return "No active Skills goals found for this phase.";
}

function goalLibraryLevelValue(value: string | null): GoalLibraryAthleteLevel | null {
  return value === "BEGINNER" ||
    value === "INTERMEDIATE" ||
    value === "ADVANCED" ||
    value === "ELITE"
    ? value
    : null;
}

function goalLibraryDomainValue(
  goal: GoalLibraryItem,
): TrainingPlanGenerationDomain | null {
  const domain = goal.domain ?? goal.defaultDomain ?? null;
  return domain === "SKILLS" || domain === "S_AND_C" || domain === "NUTRITION" ? domain : null;
}

function workloadTrainerScopeMatches(
  ref: MutableRefObject<{ athlete: string; entity: string }>,
  scope: { athlete: string; entity: string },
): boolean {
  const current = ref.current;
  return current.athlete === scope.athlete && current.entity === scope.entity;
}

function persistedSessionStructureLabel(key: string): string {
  return toTitleCaseInput(key.replace(/_/g, " "));
}

function deriveSharedValidationStatus(input: {
  levelValidationStatus: string | null;
  readinessValidationStatus: string | null;
  profileValidatedLevel: string | null;
}): string | null {
  return (
    input.levelValidationStatus ??
    input.readinessValidationStatus ??
    (input.profileValidatedLevel ? "CONFIRMED" : null)
  );
}

export function CoachAthletePlanningProfileView({
  athleteId,
}: {
  athleteId: string;
}) {
  const { markPageReady } = useCoachPageReady();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessContext, accessGateReady } = useAuth();
  const entityId = useMemo(
    () => accessContext?.academy.trainingEntityId?.trim() ?? "",
    [accessContext],
  );
  const currentCoachUserId = accessContext?.user.userId?.trim() ?? "";
  const currentActiveRole = accessContext?.activeRole?.trim() ?? "";
  const athleteIdTrimmed = athleteId.trim();
  /** URL candidate only — use `requestedPlanId` after athlete-scoped verification. */
  const urlPlanCandidate = useMemo(() => {
    const value =
      searchParams.get("planId")?.trim() ??
      searchParams.get("skillsPlanId")?.trim() ??
      "";
    return value !== "" ? value : null;
  }, [searchParams]);

  const [workflowRequestedPlanId, setWorkflowRequestedPlanId] = useState<
    string | null
  >(null);
  const [releasedPlanViewerIntent, setReleasedPlanViewerIntent] = useState<{
    domain: TrainingPlanGenerationDomain;
    planId: string;
  } | null>(null);
  const [releasedPlanViewerVisibleDetail, setReleasedPlanViewerVisibleDetail] = useState<{
    domain: TrainingPlanGenerationDomain;
    detail: CoachPersistedTrainingPlanActiveDetail;
  } | null>(null);
  const requestedPlanId = workflowRequestedPlanId;
  const requestedPlanIdDep = requestedPlanId ?? null;
  const urlPlanCandidateDep = urlPlanCandidate ?? null;

  const workflowTrainerScopeRef = useRef({
    athlete: athleteIdTrimmed,
    entity: entityId,
  });
  /**
   * Tracks the last URL plan id seen by `syncPersistedPlanFromUrl` so clearing persisted state
   * only happens when the user removes `planId` / `skillsPlanId` from the URL, not on every
   * render with no query param (which would wipe draft-hydrated active/detail).
   */
  const prevUrlPlanForPersistedSyncRef = useRef<string | null | undefined>(undefined);
  /** Suppress repeated internal active/detail fetches after a failure until the plan/domain key changes or Step 6 is left. */
  const workflowStep6FetchFailedForKeyRef = useRef<string | null>(null);
  const headCoachReviewDetailFetchKeyRef = useRef<string | null>(null);
  const step6WorkflowFetchGenRef = useRef(0);
  const coachDomainStateResetRef = useRef<string | null>(null);

  useEffect(() => {
    workflowTrainerScopeRef.current = {
      athlete: athleteIdTrimmed,
      entity: entityId,
    };
  }, [athleteIdTrimmed, entityId]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingPlanningProfile, setMissingPlanningProfile] = useState(false);
  const [profile, setProfile] = useState<CoachAthletePlanningProfileData | null>(
    null,
  );
  const [athleteIdentity, setAthleteIdentity] = useState<{
    displayName: string | null;
    email: string | null;
  }>({
    displayName: null,
    email: null,
  });
  const [assignedAthletePlanOwnership, setAssignedAthletePlanOwnership] = useState<
    Pick<
      CoachAssignedAthleteRow,
      | "assignedFunctions"
      | "canGeneratePlan"
      | "canGenerateCurrentDomainPlan"
      | "currentGenerationDomain"
    > | null
  >(null);
  const [readinessLoading, setReadinessLoading] = useState(true);
  const [readinessError, setReadinessError] = useState<string | null>(null);
  const [readinessSources, setReadinessSources] = useState<PlanningReadinessSources>({
    levelValidation: null,
    readiness: null,
    completeness: null,
  });
  const [levelValidationModalOpen, setLevelValidationModalOpen] = useState(false);
  const [contextBuilderDrawerStep, setContextBuilderDrawerStep] =
    useState<ContextBuilderDrawerStepKey | null>(null);
  const [contextBuilderDrawerClosing, setContextBuilderDrawerClosing] = useState(false);
  const contextBuilderDrawerCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [workloadAssessmentLoading, setWorkloadAssessmentLoading] = useState(false);
  const [workloadAssessmentError, setWorkloadAssessmentError] = useState<string | null>(
    null,
  );
  const [workloadAssessmentResult, setWorkloadAssessmentResult] =
    useState<CoachAthleteTrainingPlanWorkloadAssessment | null>(null);
  const [workloadAssessmentCapturedForAthleteId, setWorkloadAssessmentCapturedForAthleteId] =
    useState<string | null>(null);
  /** Set after a successful Run Workload Assessment for this session; required for Step 3 completion. */
  const [workloadAssessmentExplicitlyRunForAthleteId, setWorkloadAssessmentExplicitlyRunForAthleteId] =
    useState<string | null>(null);
  /** Brief UX hold after workload success — tab advance waits until cleared. */
  const [showWorkloadCompletionState, setShowWorkloadCompletionState] = useState(false);
  /**
   * Sport code for training-plan generation: prefer parsed planning profile, then readiness echo,
   * then workload classification (same athlete) when APP field names differ from backend.
   */
  const athleteSportCode = useMemo(() => {
    const fromProfile =
      profile?.sportCode?.trim()
      || profile?.primarySport?.trim()
      || profile?.sportContext?.primarySport?.trim()
      || null;
    if (fromProfile) return fromProfile;
    const fromReadiness = readinessSources.readiness?.sportCode?.trim() ?? null;
    if (fromReadiness) return fromReadiness;
    return (
      workloadAssessmentResult?.workloadClassification?.sportCode?.trim() ?? null
    );
  }, [
    profile?.primarySport,
    profile?.sportCode,
    profile?.sportContext?.primarySport,
    readinessSources.readiness?.sportCode,
    workloadAssessmentResult?.workloadClassification?.sportCode,
  ]);

  const workloadCompletionHoldTimeoutRef = useRef<number | null>(null);
  const workloadAssessmentRequestGenRef = useRef(0);
  /** Tracks athlete/entity scope so readiness refetches for season changes do not wipe workload state. */
  const readinessLoadScopeRef = useRef("");
  const latestSkillsDraftRequestGenRef = useRef(0);
  const generatePlanJobRequestGenRef = useRef<
    Partial<Record<TrainingPlanGenerationDomain, number>>
  >({});
  const [generatePlanJobsByDomain, setGeneratePlanJobsByDomain] = useState<
    Partial<Record<TrainingPlanGenerationDomain, CoachAthleteTrainingPlanGenerationJob | null>>
  >({});
  const [generatePlanError, setGeneratePlanError] = useState<string | null>(null);
  const [generatePlanSuccess, setGeneratePlanSuccess] =
    useState<CoachAthleteTrainingPlanPersistDraftResult | null>(null);
  const [generatePlanSuccessDomain, setGeneratePlanSuccessDomain] =
    useState<TrainingPlanGenerationDomain | null>(null);
  /** Shown when persist-draft timed out client-side but latest-draft refresh confirmed the save. */
  const [generatePlanRecoveryMessage, setGeneratePlanRecoveryMessage] = useState<string | null>(
    null,
  );
  const [latestSkillsDraft, setLatestSkillsDraft] =
    useState<CoachAthleteLatestDomainDraft | null>(null);
  const [latestDraftDomain, setLatestDraftDomain] =
    useState<TrainingPlanGenerationDomain | null>(null);
  const [latestSkillsDraftRequestState, setLatestSkillsDraftRequestState] = useState<
    "idle" | "loading" | "success" | "missing" | "error"
  >("idle");
  const [latestSkillsDraftMissing, setLatestSkillsDraftMissing] = useState(false);
  const [latestSkillsDraftError, setLatestSkillsDraftError] = useState<string | null>(null);
  const [latestSkillsDraftErrorDomain, setLatestSkillsDraftErrorDomain] =
    useState<TrainingPlanGenerationDomain | null>(null);
  const [upstreamPlanningContext, setUpstreamPlanningContext] =
    useState<CoachAthleteUpstreamPlanningContext | null>(null);
  const [upstreamPlanningContextLoading, setUpstreamPlanningContextLoading] = useState(false);
  const [upstreamPlanningContextError, setUpstreamPlanningContextError] =
    useState<string | null>(null);
  const [workspace, setWorkspace] = useState<TrainingPlanWorkspace | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceRefreshing, setWorkspaceRefreshing] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const workspaceRefreshGenRef = useRef(0);
  const workspaceHasLoadedRef = useRef(false);
  const assignmentContextMissingWarningScopeRef = useRef<string | null>(null);
  const [planningContextBootstrapState, setPlanningContextBootstrapState] =
    useState<TrainingPlanBootstrapLoadState>("idle");

  /** Same nested/fallback derivation as assistant locked-context summary — used for local errors + persistence. */
  const assistantLockedUpstreamDerived = useMemo(
    () =>
      deriveAssistantLockedUpstreamFields({
        upstream: upstreamPlanningContext,
        profile,
        assistantSportFallback: athleteSportCode,
      }),
    [
      athleteSportCode,
      profile,
      upstreamPlanningContext,
    ],
  );

  const [cachedLockedPlanWindow, setCachedLockedPlanWindow] = useState<{
    startDate: string | null;
    endDate: string | null;
  } | null>(null);
  const [planningContextLockLoading, setPlanningContextLockLoading] = useState(false);
  const [planningContextLockError, setPlanningContextLockError] = useState<string | null>(null);
  const [planningContextLockSuccess, setPlanningContextLockSuccess] = useState<string | null>(
    null,
  );
  const [headCoachDomainPlanStates, setHeadCoachDomainPlanStates] = useState<
    Record<TrainingPlanGenerationDomain, HeadCoachDomainPlanState>
  >(createEmptyHeadCoachDomainPlanStates);
  const [submittedDomainPlansBootstrapState, setSubmittedDomainPlansBootstrapState] =
    useState<TrainingPlanBootstrapLoadState>("idle");
  const knownDomainPlanIdsRef = useRef<Record<TrainingPlanGenerationDomain, string>>({
    SKILLS: "",
    NUTRITION: "",
    S_AND_C: "",
  });
  /** Invalidates async domain-summary → active/detail hydration when athlete/domain changes. */
  const assistantDomainSummaryHydrationGenRef = useRef(0);
  const [assistantDomainSummaryHydrationPending, setAssistantDomainSummaryHydrationPending] =
    useState(false);
  const [persistedSkillsPlanLoading, setPersistedSkillsPlanLoading] = useState(false);
  const [persistedSkillsPlanError, setPersistedSkillsPlanError] = useState<string | null>(
    null,
  );
  const [persistedPlanErrorDomain, setPersistedPlanErrorDomain] =
    useState<TrainingPlanGenerationDomain | null>(null);
  const [persistedSkillsPlanDetail, setPersistedSkillsPlanDetail] =
    useState<CoachPersistedTrainingPlanActiveDetail | null>(null);
  const persistedPlanVersionIdDep = persistedSkillsPlanDetail?.version.id ?? null;
  /**
   * Active/detail may omit `generationDomain`; keep the verified request domain so governed actions
   * can still render and post back using the same backend contract.
   */
  const [persistedVerifiedDomain, setPersistedVerifiedDomain] =
    useState<TrainingPlanGenerationDomain | null>(null);
  /** Set only when Head Coach opens Submitted Domain Plans review — not URL persisted-plan sync. */
  const [headCoachSubmittedReviewDomain, setHeadCoachSubmittedReviewDomain] =
    useState<TrainingPlanGenerationDomain | null>(null);
  const [domainReviewDrawerOpen, setDomainReviewDrawerOpen] = useState(false);
  const [domainReviewDrawerDomain, setDomainReviewDrawerDomain] =
    useState<TrainingPlanGenerationDomain | null>(null);
  const [domainReviewDrawerClosing, setDomainReviewDrawerClosing] = useState(false);
  const domainReviewDrawerCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [step6WorkflowInternalLoading, setStep6WorkflowInternalLoading] = useState(false);
  const [step6WorkflowInternalError, setStep6WorkflowInternalError] = useState<string | null>(
    null,
  );
  const [governedPlanActionLoading, setGovernedPlanActionLoading] =
    useState<GovernedTrainingPlanWorkflowAction | null>(null);
  const [governedPlanActionError, setGovernedPlanActionError] = useState<string | null>(null);
  const [governedPlanActionSuccess, setGovernedPlanActionSuccess] =
    useState<string | null>(null);
  const [governedPlanActionSuccessFeedback, setGovernedPlanActionSuccessFeedback] =
    useState<string | null>(null);
  const [requestRevisionModalOpen, setRequestRevisionModalOpen] = useState(false);
  const [requestRevisionDrawerComposerOpen, setRequestRevisionDrawerComposerOpen] =
    useState(false);
  const [requestRevisionFeedback, setRequestRevisionFeedback] = useState("");
  const [requestRevisionActionContext, setRequestRevisionActionContext] =
    useState<GovernedPlanContext | null>(null);
  const [assistantRevisePanelDomain, setAssistantRevisePanelDomain] =
    useState<TrainingPlanGenerationDomain | null>(null);
  const [reviseSkillsFeedback, setReviseSkillsFeedback] = useState("");
  const [reviseSkillsLoading, setReviseSkillsLoading] = useState(false);
  const [reviseSkillsError, setReviseSkillsError] = useState<string | null>(null);
  const [reviseSkillsSuccess, setReviseSkillsSuccess] = useState<string | null>(null);
  const [reviseNutritionFeedback, setReviseNutritionFeedback] = useState("");
  const [reviseNutritionLoading, setReviseNutritionLoading] = useState(false);
  const [reviseNutritionError, setReviseNutritionError] = useState<string | null>(null);
  const [reviseNutritionSuccess, setReviseNutritionSuccess] = useState<string | null>(null);
  const [reviseSandCFeedback, setReviseSandCFeedback] = useState("");
  const [reviseSandCLoading, setReviseSandCLoading] = useState(false);
  const [reviseSandCError, setReviseSandCError] = useState<string | null>(null);
  const [reviseSandCSuccess, setReviseSandCSuccess] = useState<string | null>(null);
  const [assistantGovernedDetailRefreshing, setAssistantGovernedDetailRefreshing] =
    useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  const [seasonError, setSeasonError] = useState<string | null>(null);
  const [seasonSuccess, setSeasonSuccess] = useState<string | null>(null);
  const [phaseError, setPhaseError] = useState<string | null>(null);
  const [phaseSuccess, setPhaseSuccess] = useState<string | null>(null);
  const [competitionError, setCompetitionError] = useState<string | null>(null);
  const [competitionSuccess, setCompetitionSuccess] = useState<string | null>(null);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [goalSuccess, setGoalSuccess] = useState<string | null>(null);
  const [seasonCreateLoading, setSeasonCreateLoading] = useState(false);
  const [phaseCreateLoading, setPhaseCreateLoading] = useState<SeasonPhaseType | null>(
    null,
  );
  const [competitionCreateLoading, setCompetitionCreateLoading] = useState(false);
  const [goalCreateLoading, setGoalCreateLoading] = useState(false);
  const [setupState, setSetupState] = useState<GoalsSeasonSetupState>({
    seasons: [],
    phasesBySeasonCycleId: {},
    goals: [],
    coachFunctions: [],
    hasHeadCoachConfigured: false,
    academyCoachRole: "",
    trainingPlanReleaseMode: "",
  });
  const coachAssignedGenerationDomains = useMemo(
    () => deriveGenerationDomains(setupState.coachFunctions),
    [setupState.coachFunctions],
  );
  const isHeadCoachPlanningContextOwner = useMemo(
    () =>
      workspace
        ? workspaceHeadCoachOwnsPlanningContext(workspace)
        : setupState.hasHeadCoachConfigured &&
          currentCoachIsHeadCoach(setupState.academyCoachRole),
    [
      setupState.academyCoachRole,
      setupState.hasHeadCoachConfigured,
      workspace,
    ],
  );
  const trainingPlanShellReleaseMode = useMemo(
    () =>
      workspace
        ? workspaceResolveReleaseMode(workspace)
        : resolveTrainingPlanReleaseMode({
            hasHeadCoachConfigured: setupState.hasHeadCoachConfigured,
            trainingPlanReleaseMode: setupState.trainingPlanReleaseMode,
          }),
    [
      setupState.hasHeadCoachConfigured,
      setupState.trainingPlanReleaseMode,
      workspace,
    ],
  );
  const trainingPlanShellOwnership = useMemo(
    () => {
      if (workspace) {
        return resolveWorkspaceTrainingPlanShellOwnership(workspace);
      }
      return resolveTrainingPlanShellOwnership({
        isCoachSetupLoaded: !setupLoading,
        coachUserId: currentCoachUserId,
        athleteId: athleteIdTrimmed,
        entityId,
        hasHeadCoachConfigured: setupState.hasHeadCoachConfigured,
        trainingPlanReleaseMode: setupState.trainingPlanReleaseMode,
        headCoachOwnsPlanningContext:
          trainingPlanShellReleaseMode === "head_coach_review" &&
          setupState.hasHeadCoachConfigured,
        skillsCoachOwnsPlanningContext:
          trainingPlanShellReleaseMode === "direct_release" &&
          !setupState.hasHeadCoachConfigured,
        academyCoachRole: setupState.academyCoachRole,
        coachAssignedGenerationDomains,
      });
    },
    [
      athleteIdTrimmed,
      coachAssignedGenerationDomains,
      currentCoachUserId,
      entityId,
      setupLoading,
      setupState.academyCoachRole,
      setupState.hasHeadCoachConfigured,
      setupState.trainingPlanReleaseMode,
      trainingPlanShellReleaseMode,
      workspace,
    ],
  );
  const isPlanningContextShellOwner =
    trainingPlanShellOwnership.planningContextShellOwner === "head_coach" ||
    trainingPlanShellOwnership.planningContextShellOwner === "skills_coach";
  const allowedGenerationDomains = useMemo(() => {
    if (workspace?.assignmentContext !== undefined) {
      return workspaceAssignedGenerationDomains(workspace);
    }

    const mergeLegacyAssignedDomains = (): TrainingPlanGenerationDomain[] => {
      const fromCoach = coachAssignedGenerationDomains;
      if (isHeadCoachPlanningContextOwner) {
        return fromCoach;
      }
      const merged = new Set<TrainingPlanGenerationDomain>();
      for (const domain of fromCoach) {
        merged.add(domain);
      }
      for (const domain of deriveGenerationDomains(
        assignedAthletePlanOwnership?.assignedFunctions ?? [],
      )) {
        merged.add(domain);
      }
      const rowDomain = assignedAthletePlanOwnership?.currentGenerationDomain;
      if (rowDomain) merged.add(rowDomain);
      return GENERATION_DOMAIN_ORDER.filter((domain) => merged.has(domain));
    };

    const legacyDomains = mergeLegacyAssignedDomains();

    if (!isHeadCoachPlanningContextOwner) {
      return legacyDomains;
    }

    if (workspace) {
      const fromWorkspace = workspaceResolvableGenerationDomains(workspace);
      if (fromWorkspace.length > 0) {
        return fromWorkspace;
      }
      const currentDomain = parseWorkspaceCurrentDomain(workspace.currentDomain);
      if (currentDomain) {
        return [currentDomain];
      }
    }
    return legacyDomains;
  }, [
    assignedAthletePlanOwnership,
    coachAssignedGenerationDomains,
    isHeadCoachPlanningContextOwner,
    workspace,
  ]);
  const legacyPlanningContextAuthority = useMemo(
    () =>
      isPlanningContextShellOwner ||
      (trainingPlanShellOwnership.releaseMode === "direct_release" &&
        currentCoachHasSkillsFunction(setupState.coachFunctions)),
    [
      isPlanningContextShellOwner,
      setupState.coachFunctions,
      trainingPlanShellOwnership.releaseMode,
    ],
  );
  const planningContextAuthority = useMemo(
    () =>
      resolvePlanningContextAuthority({
        assignmentPlanningContext: workspace?.assignmentContext?.planningContext,
        legacyAuthority: legacyPlanningContextAuthority,
      }),
    [
      legacyPlanningContextAuthority,
      workspace?.assignmentContext?.planningContext,
    ],
  );
  const isPlanningContextAuthority =
    planningContextAuthority.canShowPlanningContextControls;
  const canLockPlanningContext =
    planningContextAuthority.canLockPlanningContext;
  const currentCoachGenerationDomain = useMemo((): TrainingPlanGenerationDomain | null => {
    if (!isHeadCoachPlanningContextOwner) {
      const rowDomain = assignedAthletePlanOwnership?.currentGenerationDomain;
      if (rowDomain && allowedGenerationDomains.includes(rowDomain)) {
        return rowDomain;
      }
      const fromAssignment = derivePrimaryCoachPlanDomain(
        assignedAthletePlanOwnership?.assignedFunctions ?? [],
      );
      if (
        fromAssignment !== null &&
        allowedGenerationDomains.includes(fromAssignment)
      ) {
        return fromAssignment;
      }
      return allowedGenerationDomains[0] ?? null;
    }

    const workspaceDomain = workspace
      ? parseWorkspaceCurrentDomain(workspace.currentDomain)
      : null;
    if (workspaceDomain) {
      return workspaceDomain;
    }
    if (coachAssignedGenerationDomains.length === 0) {
      return null;
    }
    const rowDomain = assignedAthletePlanOwnership?.currentGenerationDomain;
    if (rowDomain && allowedGenerationDomains.includes(rowDomain)) {
      return rowDomain;
    }
    const fromAssignment = derivePrimaryCoachPlanDomain(
      assignedAthletePlanOwnership?.assignedFunctions ?? [],
    );
    if (
      fromAssignment !== null &&
      allowedGenerationDomains.includes(fromAssignment)
    ) {
      return fromAssignment;
    }
    return allowedGenerationDomains[0] ?? null;
  }, [
    allowedGenerationDomains,
    assignedAthletePlanOwnership,
    coachAssignedGenerationDomains.length,
    isHeadCoachPlanningContextOwner,
    workspace,
  ]);
  const shouldSkipPlanningOwnerReadinessCalls =
    setupState.hasHeadCoachConfigured &&
    !isHeadCoachPlanningContextOwner &&
    currentCoachGenerationDomain !== null;
  const readinessGenerationDomain = useMemo<TrainingPlanGenerationDomain>(
    () => deriveGenerationDomains(setupState.coachFunctions)[0] ?? "SKILLS",
    [setupState.coachFunctions],
  );
  const [planGenerationOwnershipByDomain, setPlanGenerationOwnershipByDomain] = useState<
    Partial<Record<TrainingPlanGenerationDomain, PlanGenerationOwnershipFlags>>
  >({});
  const [planOwnershipLoading, setPlanOwnershipLoading] = useState(false);
  const [selectedSeasonCycleId, setSelectedSeasonCycleId] = useState<string | null>(null);
  const [seasonCreateFormExplicit, setSeasonCreateFormExplicit] = useState(false);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [durationDays, setDurationDays] = useState<7 | 15 | 30>(7);
  const [planStartDate, setPlanStartDate] = useState(() =>
    formatDateInputValue(new Date()),
  );
  const [planDatesConfirmedForCurrentAthlete, setPlanDatesConfirmedForCurrentAthlete] =
    useState(false);
  const [seasonYear, setSeasonYear] = useState(() => new Date().getUTCFullYear());
  const [seasonName, setSeasonName] = useState("");
  const [seasonNameEdited, setSeasonNameEdited] = useState(false);
  const [seasonStartDate, setSeasonStartDate] = useState(() =>
    yearStartDateInput(new Date().getUTCFullYear()),
  );
  const [seasonEndDate, setSeasonEndDate] = useState(() =>
    yearEndDateInput(new Date().getUTCFullYear()),
  );
  const [phaseDrafts, setPhaseDrafts] = useState<
    Record<SeasonPhaseType, { startDate: string; endDate: string }>
  >({
    OFF_SEASON: { startDate: "", endDate: "" },
    PRE_SEASON: { startDate: "", endDate: "" },
    IN_SEASON: { startDate: "", endDate: "" },
  });
  const [phaseEditorState, setPhaseEditorState] = useState<
    Record<SeasonPhaseType, PhaseEditorState>
  >({
    OFF_SEASON: {
      isEditing: false,
      startDate: "",
      endDate: "",
      loading: false,
      error: null,
      success: null,
    },
    PRE_SEASON: {
      isEditing: false,
      startDate: "",
      endDate: "",
      loading: false,
      error: null,
      success: null,
    },
    IN_SEASON: {
      isEditing: false,
      startDate: "",
      endDate: "",
      loading: false,
      error: null,
      success: null,
    },
  });
  const [competitionName, setCompetitionName] = useState("");
  const [competitionDate, setCompetitionDate] = useState("");
  const [competitionImportance, setCompetitionImportance] = useState<"LOW" | "MEDIUM" | "HIGH">(
    "MEDIUM",
  );
  const [goalCreationMode, setGoalCreationMode] = useState<GoalCreationMode>("CUSTOM");
  const [goalLibraryLoading, setGoalLibraryLoading] = useState(false);
  const [goalLibraryError, setGoalLibraryError] = useState<string | null>(null);
  const [goalLibraryCategories, setGoalLibraryCategories] = useState<GoalLibraryCategory[]>([]);
  const [selectedLibraryGoalIds, setSelectedLibraryGoalIds] = useState<string[]>([]);
  const [goalName, setGoalName] = useState("");
  const [goalSuccessCriteria, setGoalSuccessCriteria] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [goalPriority, setGoalPriority] = useState<GoalPriority>("MEDIUM");
  const [goalTargetValue, setGoalTargetValue] = useState("");

  useEffect(() => {
    if (!athleteSportCode) return;
    if (!seasonNameEdited) {
      setSeasonName(`${seasonYear} ${formatSportLabel(athleteSportCode)} Season`);
    }
  }, [athleteSportCode, seasonNameEdited, seasonYear]);

  useEffect(() => {
    if (seasonStartDate === "") return;
    const nextYear = Number(seasonStartDate.slice(0, 4));
    if (Number.isFinite(nextYear) && nextYear > 0) {
      setSeasonYear((current) => (current === nextYear ? current : nextYear));
    }
  }, [seasonStartDate]);

  useEffect(() => {
    if (durationDays !== 7) {
      setDurationDays(7);
    }
  }, [durationDays]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!accessGateReady) {
        setLoading(true);
        return;
      }
      if (entityId === "" || athleteIdTrimmed === "") {
        setProfile(null);
        setMissingPlanningProfile(false);
        setError("Missing training entity or athlete identifier.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setMissingPlanningProfile(false);
      try {
        const [data, assignedAthletes] = await Promise.all([
          fetchCoachAthletePlanningProfile(entityId, athleteIdTrimmed),
          fetchCoachAssignedAthletes().catch(() => []),
        ]);
        if (cancelled) return;
        setProfile(data);
        const matchedAthlete = assignedAthletes.find((row) => row.athleteId === athleteIdTrimmed);
        setAthleteIdentity({
          displayName:
            matchedAthlete && matchedAthlete.displayName.trim() !== ""
              ? matchedAthlete.displayName.trim()
              : null,
          email:
            matchedAthlete && matchedAthlete.email.trim() !== ""
              ? matchedAthlete.email.trim()
              : null,
        });
        setAssignedAthletePlanOwnership(
          matchedAthlete
            ? {
                assignedFunctions: matchedAthlete.assignedFunctions,
                canGeneratePlan: matchedAthlete.canGeneratePlan,
                canGenerateCurrentDomainPlan: matchedAthlete.canGenerateCurrentDomainPlan,
                currentGenerationDomain: matchedAthlete.currentGenerationDomain,
              }
            : null,
        );
      } catch (e) {
        if (cancelled) return;
        setProfile(null);
        setAthleteIdentity({ displayName: null, email: null });
        setAssignedAthletePlanOwnership(null);
        if (isMissingPlanningProfileError(e)) {
          setMissingPlanningProfile(true);
          setError(null);
          return;
        }
        setError(
          formatApiError(
            e,
            "Could not load athlete planning profile. Please try again shortly.",
          ),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessGateReady, athleteIdTrimmed, entityId]);

  const refreshTrainingPlanWorkspace = useCallback(async (
    options?: { background?: boolean },
  ): Promise<boolean> => {
    if (!accessGateReady) {
      return false;
    }

    if (entityId === "" || athleteIdTrimmed === "") {
      setWorkspace(null);
      setWorkspaceError(null);
      setWorkspaceLoading(false);
      setWorkspaceRefreshing(false);
      workspaceHasLoadedRef.current = false;
      return false;
    }

    const background = options?.background ?? workspaceHasLoadedRef.current;

    workspaceRefreshGenRef.current += 1;
    const requestGeneration = workspaceRefreshGenRef.current;

    if (background) {
      setWorkspaceRefreshing(true);
    } else {
      setWorkspaceLoading(true);
    }
    if (!background) {
      setWorkspaceError(null);
    }

    try {
      const data = await getTrainingPlanWorkspace(entityId, athleteIdTrimmed);
      if (workspaceRefreshGenRef.current !== requestGeneration) {
        return false;
      }
      setWorkspace(data);
      workspaceHasLoadedRef.current = true;
      setWorkspaceError(null);
      return true;
    } catch (e) {
      if (workspaceRefreshGenRef.current !== requestGeneration) {
        return false;
      }
      if (!background) {
        setWorkspace(null);
      }
      setWorkspaceError(
        formatApiError(
          e,
          "Could not load training plan workspace. Please try again shortly.",
        ),
      );
      return false;
    } finally {
      if (workspaceRefreshGenRef.current === requestGeneration) {
        if (background) {
          setWorkspaceRefreshing(false);
        } else {
          setWorkspaceLoading(false);
        }
      }
    }
  }, [accessGateReady, athleteIdTrimmed, entityId]);

  useEffect(() => {
    void refreshTrainingPlanWorkspace({ background: false });
    return () => {
      workspaceRefreshGenRef.current += 1;
      setWorkspaceLoading(false);
      setWorkspaceRefreshing(false);
    };
  }, [refreshTrainingPlanWorkspace]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (workspace === null || workspace.assignmentContext !== undefined) return;
    const warningScope = `${entityId}:${athleteIdTrimmed}`;
    if (assignmentContextMissingWarningScopeRef.current === warningScope) return;
    assignmentContextMissingWarningScopeRef.current = warningScope;
    console.warn(ASSIGNMENT_CONTEXT_MISSING_LEGACY_FALLBACK_WARNING);
  }, [athleteIdTrimmed, entityId, workspace]);

  useEffect(() => {
    let cancelled = false;

    async function loadReadiness() {
      if (!accessGateReady) {
        setReadinessLoading(true);
        return;
      }

      if (entityId === "" || athleteIdTrimmed === "") {
        readinessLoadScopeRef.current = "";
        workloadAssessmentRequestGenRef.current += 1;
        setReadinessSources({
          levelValidation: null,
          readiness: null,
          completeness: null,
        });
        setReadinessError(null);
        setWorkloadAssessmentResult(null);
        setWorkloadAssessmentCapturedForAthleteId(null);
        setWorkloadAssessmentExplicitlyRunForAthleteId(null);
        setShowWorkloadCompletionState(false);
        if (workloadCompletionHoldTimeoutRef.current !== null) {
          window.clearTimeout(workloadCompletionHoldTimeoutRef.current);
          workloadCompletionHoldTimeoutRef.current = null;
        }
        setWorkloadAssessmentError(null);
        setWorkloadAssessmentLoading(false);
        setGeneratePlanError(null);
        setGeneratePlanJobsByDomain({});
        setGeneratePlanSuccess(null);
        setGeneratePlanSuccessDomain(null);
        setGeneratePlanRecoveryMessage(null);
        setReadinessLoading(false);
        return;
      }

      if (shouldSkipPlanningOwnerReadinessCalls) {
        setReadinessLoading(true);
        setReadinessError(null);
        workloadAssessmentRequestGenRef.current += 1;
        setWorkloadAssessmentResult(null);
        setWorkloadAssessmentCapturedForAthleteId(null);
        setWorkloadAssessmentExplicitlyRunForAthleteId(null);
        setShowWorkloadCompletionState(false);
        if (workloadCompletionHoldTimeoutRef.current !== null) {
          window.clearTimeout(workloadCompletionHoldTimeoutRef.current);
          workloadCompletionHoldTimeoutRef.current = null;
        }
        setWorkloadAssessmentError(null);
        setWorkloadAssessmentLoading(false);

        const downstreamContextResults = await Promise.allSettled([
          fetchCoachAthleteLevelValidation(entityId, athleteIdTrimmed),
          fetchCoachAthleteTrainingPlanWorkloadAssessmentLatest(
            entityId,
            athleteIdTrimmed,
          ),
        ]);

        if (cancelled) return;

        const levelValidation =
          downstreamContextResults[0].status === "fulfilled"
            ? downstreamContextResults[0].value
            : null;
        const latestWorkload =
          downstreamContextResults[1].status === "fulfilled"
            ? downstreamContextResults[1].value
            : null;

        setReadinessSources({
          levelValidation,
          readiness: null,
          completeness: null,
        });
        if (latestWorkload?.workloadClassification) {
          setWorkloadAssessmentResult(latestWorkload);
          setWorkloadAssessmentCapturedForAthleteId(athleteIdTrimmed);
          setWorkloadAssessmentExplicitlyRunForAthleteId(athleteIdTrimmed);
        }
        setReadinessLoading(false);
        return;
      }

      const readinessScopeKey = `${entityId}|${athleteIdTrimmed}`;
      const readinessScopeChanged = readinessLoadScopeRef.current !== readinessScopeKey;

      setReadinessLoading(true);
      setReadinessError(null);
      if (readinessScopeChanged) {
        readinessLoadScopeRef.current = readinessScopeKey;
        workloadAssessmentRequestGenRef.current += 1;
        setWorkloadAssessmentResult(null);
        setWorkloadAssessmentCapturedForAthleteId(null);
        setWorkloadAssessmentExplicitlyRunForAthleteId(null);
        setShowWorkloadCompletionState(false);
        if (workloadCompletionHoldTimeoutRef.current !== null) {
          window.clearTimeout(workloadCompletionHoldTimeoutRef.current);
          workloadCompletionHoldTimeoutRef.current = null;
        }
        setWorkloadAssessmentError(null);
        setWorkloadAssessmentLoading(false);
        setGeneratePlanError(null);
        setGeneratePlanJobsByDomain({});
        setGeneratePlanSuccess(null);
        setGeneratePlanSuccessDomain(null);
        setGeneratePlanRecoveryMessage(null);
      }

      const results = await Promise.allSettled([
        fetchCoachAthleteLevelValidation(entityId, athleteIdTrimmed),
        fetchCoachAthleteTrainingPlanReadiness(entityId, athleteIdTrimmed, {
          generationDomain: readinessGenerationDomain,
          seasonCycleId: selectedSeasonCycleId,
          sportCode: athleteSportCode,
        }),
        fetchCoachAthleteTrainingPlanCompleteness(entityId, athleteIdTrimmed, {
          sportCode: athleteSportCode,
        }),
      ]);

      if (cancelled) return;

      const errors: string[] = [];
      const pushError = (reason: unknown, fallback: string) => {
        if (isNotFoundError(reason)) return;
        errors.push(formatApiError(reason, fallback));
      };

      const levelValidation =
        results[0].status === "fulfilled"
          ? results[0].value
          : ((() => {
              if (!isForbiddenError(results[0].reason)) {
                pushError(results[0].reason, "Could not load level validation details.");
              }
            })(),
            null);
      const readiness =
        results[1].status === "fulfilled"
          ? results[1].value
          : (pushError(results[1].reason, "Could not load planning readiness details."),
            null);
      const completeness =
        results[2].status === "fulfilled"
          ? results[2].value
          : (pushError(results[2].reason, "Could not load completeness details."),
            null);

      setReadinessSources({
        levelValidation,
        readiness,
        completeness,
      });
      setReadinessError(errors.length > 0 ? errors.join(" ") : null);
      setReadinessLoading(false);
    }

    void loadReadiness();

    return () => {
      cancelled = true;
    };
  }, [
    accessGateReady,
    athleteIdTrimmed,
    athleteSportCode,
    entityId,
    readinessGenerationDomain,
    selectedSeasonCycleId,
    shouldSkipPlanningOwnerReadinessCalls,
  ]);

  /** GET persisted workload snapshot only (`/latest`); run endpoint stays user-initiated. */
  useEffect(() => {
    if (!accessGateReady || entityId === "" || athleteIdTrimmed === "") return;
    if (shouldSkipPlanningOwnerReadinessCalls) return;
    if (readinessLoading) return;

    const gate = workloadAssessmentEligibilityGateFromSources({
      profile,
      levelValidation: readinessSources.levelValidation,
      readiness: readinessSources.readiness,
      completeness: readinessSources.completeness,
    });
    if (!canRunWorkloadAssessment(gate)) return;

    let cancelled = false;
    const hydrateGeneration = workloadAssessmentRequestGenRef.current;
    const scope = { athlete: athleteIdTrimmed, entity: entityId };

    void (async () => {
      try {
        const latest = await fetchCoachAthleteTrainingPlanWorkloadAssessmentLatest(
          entityId,
          athleteIdTrimmed,
        );
        if (
          cancelled ||
          workloadAssessmentRequestGenRef.current !== hydrateGeneration ||
          !workloadTrainerScopeMatches(workflowTrainerScopeRef, scope)
        ) {
          return;
        }
        if (latest === null) return;

        const payloadAthlete = latest.athleteId?.trim() ?? "";
        if (payloadAthlete !== "" && payloadAthlete !== scope.athlete) {
          setWorkloadAssessmentResult(null);
          setWorkloadAssessmentCapturedForAthleteId(null);
          setWorkloadAssessmentExplicitlyRunForAthleteId(null);
          setWorkloadAssessmentError(
            "Workload assessment is not scoped to this athlete. Cannot load persisted assessment.",
          );
          return;
        }
        if (latest.workloadClassification === null) return;

        setWorkloadAssessmentError(null);
        setWorkloadAssessmentResult(latest);
        setWorkloadAssessmentCapturedForAthleteId(scope.athlete);
        setWorkloadAssessmentExplicitlyRunForAthleteId(scope.athlete);
      } catch (e: unknown) {
        if (
          cancelled ||
          workloadAssessmentRequestGenRef.current !== hydrateGeneration ||
          !workloadTrainerScopeMatches(workflowTrainerScopeRef, scope)
        ) {
          return;
        }
        setWorkloadAssessmentError(
          formatApiError(
            e,
            "Could not load persisted workload assessment. Please try again shortly.",
          ),
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    accessGateReady,
    athleteIdTrimmed,
    entityId,
    readinessLoading,
    profile,
    readinessSources,
    shouldSkipPlanningOwnerReadinessCalls,
  ]);

  const refreshProfileAndReadinessAfterLevelValidation =
    useCallback(async () => {
      if (!accessGateReady || entityId === "" || athleteIdTrimmed === "") {
        return;
      }
      setReadinessLoading(true);
      setReadinessError(null);
      workloadAssessmentRequestGenRef.current += 1;
      setWorkloadAssessmentResult(null);
      setWorkloadAssessmentCapturedForAthleteId(null);
      setWorkloadAssessmentExplicitlyRunForAthleteId(null);
      setShowWorkloadCompletionState(false);
      if (workloadCompletionHoldTimeoutRef.current !== null) {
        window.clearTimeout(workloadCompletionHoldTimeoutRef.current);
        workloadCompletionHoldTimeoutRef.current = null;
      }
      setWorkloadAssessmentError(null);
      setWorkloadAssessmentLoading(false);
      setGeneratePlanError(null);
      setGeneratePlanJobsByDomain({});
      setGeneratePlanSuccess(null);
      setGeneratePlanSuccessDomain(null);
      setGeneratePlanRecoveryMessage(null);

      try {
        let latestCoachProfile: CoachAthletePlanningProfileData | null = null;
        try {
          latestCoachProfile = await fetchCoachAthletePlanningProfile(
            entityId,
            athleteIdTrimmed,
          );
          setProfile(latestCoachProfile);
        } catch (profErr) {
          if (!isMissingPlanningProfileError(profErr)) {
            setError(
              formatApiError(
                profErr,
                "Could not refresh athlete planning profile. Try again shortly.",
              ),
            );
          }
        }

        const errors: string[] = [];
        const pushError = (reason: unknown, fallback: string) => {
          if (isNotFoundError(reason)) return;
          errors.push(formatApiError(reason, fallback));
        };

        const trainingSportCode =
          latestCoachProfile?.sportCode?.trim()
          || latestCoachProfile?.primarySport?.trim()
          || latestCoachProfile?.sportContext?.primarySport?.trim()
          || profile?.sportCode?.trim()
          || profile?.primarySport?.trim()
          || profile?.sportContext?.primarySport?.trim()
          || undefined;

        const results = await Promise.allSettled([
          fetchCoachAthleteLevelValidation(entityId, athleteIdTrimmed),
          fetchCoachAthleteTrainingPlanReadiness(entityId, athleteIdTrimmed, {
            generationDomain: readinessGenerationDomain,
            seasonCycleId: selectedSeasonCycleId,
            sportCode: trainingSportCode,
          }),
          fetchCoachAthleteTrainingPlanCompleteness(entityId, athleteIdTrimmed, {
            sportCode: trainingSportCode,
          }),
        ]);

        const levelValidation =
          results[0].status === "fulfilled"
            ? results[0].value
            : ((() => {
                if (!isForbiddenError(results[0].reason)) {
                  pushError(
                    results[0].reason,
                    "Could not load level validation details.",
                  );
                }
              })(),
              null);
        const readiness =
          results[1].status === "fulfilled"
            ? results[1].value
            : (pushError(
                results[1].reason,
                "Could not load planning readiness details.",
              ),
              null);
        const completeness =
          results[2].status === "fulfilled"
            ? results[2].value
            : (pushError(
                results[2].reason,
                "Could not load completeness details.",
              ),
              null);

        setReadinessSources({
          levelValidation,
          readiness,
          completeness,
        });
        setReadinessError(errors.length > 0 ? errors.join(" ") : null);
      } finally {
        setReadinessLoading(false);
      }
    }, [
      accessGateReady,
      athleteIdTrimmed,
      entityId,
      profile?.primarySport,
      profile?.sportCode,
      profile?.sportContext?.primarySport,
      readinessGenerationDomain,
      selectedSeasonCycleId,
    ]);

  const readinessPanel = useMemo(() => {
    const { levelValidation, readiness, completeness } = readinessSources;

    const missingRequiredFields =
      completeness?.missingRequiredFields.length
        ? completeness.missingRequiredFields
        : readiness?.missingRequiredFields.length
          ? readiness.missingRequiredFields
          : profile?.missingRequiredFields ?? [];

    return {
      readinessStatus: readiness?.readinessStatus ?? null,
      appCompleteness:
        profile?.completenessStatus ??
        readiness?.appCompleteness ??
        completeness?.completenessStatus ??
        null,
      validationStatus: deriveSharedValidationStatus({
        levelValidationStatus: levelValidation?.validationStatus ?? null,
        readinessValidationStatus: readiness?.validationStatus ?? null,
        profileValidatedLevel: profile?.validatedLevel ?? null,
      }),
      validatedLevel:
        levelValidation?.validatedLevel ??
        profile?.validatedLevel ??
        readiness?.validatedLevel ??
        null,
      planningEligibility:
        readiness?.planningEligibilityStatus ??
        profile?.planningEligibilityStatus ??
        null,
      isReady: readiness?.isReady ?? null,
      canGenerate: readiness?.canGenerate ?? null,
      blockers: readiness?.blockers ?? [],
      missingRequiredFields,
      completenessStatus: completeness?.completenessStatus ?? null,
      completenessSummary: completeness?.summary ?? null,
    };
  }, [profile, readinessSources]);

  const lockedPlanningContextCardFields = useMemo(
    () =>
      deriveLockedPlanningContextCardFields({
        upstream: upstreamPlanningContext,
        workloadAssessment: workloadAssessmentResult,
        profileValidatedLevel: profile?.validatedLevel ?? null,
        readinessValidatedLevel: readinessPanel.validatedLevel,
      }),
    [
      profile?.validatedLevel,
      readinessPanel.validatedLevel,
      upstreamPlanningContext,
      workloadAssessmentResult,
    ],
  );

  const refreshGoalsSeasonSetup = useCallback(async () => {
    if (!accessGateReady) {
      setSetupLoading(true);
      setSeasonError(null);
      return;
    }
    if (entityId === "" || athleteIdTrimmed === "") {
      setSetupState({
        seasons: [],
        phasesBySeasonCycleId: {},
        goals: [],
        coachFunctions: [],
        hasHeadCoachConfigured: false,
        academyCoachRole: "",
      });
      setSelectedSeasonCycleId(null);
      setSelectedGoalIds([]);
      setSeasonError(null);
      setSetupLoading(false);
      return;
    }

    setSetupLoading(true);
    setSeasonError(null);

    try {
      const seasonsResponse = await fetchSeasonCyclesForEntity(entityId);
      const phasesBySeasonCycleId = Object.fromEntries(
        seasonsResponse.map((season) => [season.seasonCycleId, season.phases ?? []]),
      ) as Record<string, SeasonPhaseSummary[]>;
      const seasons = seasonsResponse.map((season) => ({
        ...season,
        phases: season.phases ?? [],
      }));
      const [goalsResult, dashboardResult, academyCoachesResult] = await Promise.allSettled([
        fetchGoalsForAthlete(athleteIdTrimmed),
        fetchCoachMeDashboard(),
        fetchMyAcademyCoaches(),
      ]);
      const goals = goalsResult.status === "fulfilled" ? goalsResult.value : [];
      const dashboardFunctions =
        dashboardResult.status === "fulfilled" ? dashboardResult.value.functions : [];
      const hasHeadCoachConfigured =
        dashboardResult.status === "fulfilled"
          ? dashboardResult.value.hasHeadCoachConfigured
          : false;
      const academyCoachRole =
        dashboardResult.status === "fulfilled" ? dashboardResult.value.academyCoachRole : "";
      const trainingPlanReleaseMode =
        dashboardResult.status === "fulfilled"
          ? dashboardResult.value.trainingPlanReleaseMode
          : "";
      const academyCoachFunctions =
        academyCoachesResult.status === "fulfilled"
          ? academyCoachesResult.value.coaches.find(
              (coach) => coach.coachUserId === currentCoachUserId,
            )?.functions ?? []
          : [];
      const coachFunctions = resolveCoachGenerationFunctions({
        currentCoachUserId,
        academyCoachFunctions,
        dashboardFunctions,
      });

      setSetupState({
        seasons,
        phasesBySeasonCycleId,
        goals,
        coachFunctions,
        hasHeadCoachConfigured,
        academyCoachRole,
        trainingPlanReleaseMode,
      });

      setSelectedSeasonCycleId((prev) => {
        if (prev == null) return null;
        return seasons.some((s) => s.seasonCycleId === prev) ? prev : null;
      });
      setSelectedGoalIds((prev) =>
        prev.filter((id) => goals.some((g) => g.goalId === id)),
      );

    } catch {
      setSeasonError("Failed to load seasons. Please try again.");
    } finally {
      setSetupLoading(false);
    }
  }, [accessGateReady, athleteIdTrimmed, currentCoachUserId, entityId]);

  useEffect(() => {
    void refreshGoalsSeasonSetup();
  }, [refreshGoalsSeasonSetup]);

  useEffect(() => {
    if (!accessGateReady || entityId === "" || athleteIdTrimmed === "") {
      setPlanGenerationOwnershipByDomain({});
      setPlanOwnershipLoading(false);
      return;
    }
    const domains = [...allowedGenerationDomains];
    if (domains.length === 0) {
      setPlanGenerationOwnershipByDomain({});
      setPlanOwnershipLoading(false);
      return;
    }

    let cancelled = false;
    setPlanOwnershipLoading(true);

    void (async () => {
      try {
        const settled = await Promise.all(
          domains.map(async (domain) => {
            try {
              const r = await fetchCoachAthleteTrainingPlanReadiness(
                entityId,
                athleteIdTrimmed,
                {
                  generationDomain: domain,
                  seasonCycleId: selectedSeasonCycleId,
                  sportCode: athleteSportCode,
                },
              );
              return {
                domain,
                flags: {
                  canGeneratePlan: r.canGeneratePlan,
                  canGenerateCurrentDomainPlan: r.canGenerateCurrentDomainPlan,
                } satisfies PlanGenerationOwnershipFlags,
              };
            } catch {
              return {
                domain,
                flags: {
                  canGeneratePlan: null,
                  canGenerateCurrentDomainPlan: null,
                } satisfies PlanGenerationOwnershipFlags,
              };
            }
          }),
        );
        if (cancelled) return;
        const next: Partial<
          Record<TrainingPlanGenerationDomain, PlanGenerationOwnershipFlags>
        > = {};
        for (const item of settled) {
          next[item.domain] = item.flags;
        }
        setPlanGenerationOwnershipByDomain(next);
      } finally {
        if (!cancelled) setPlanOwnershipLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    accessGateReady,
    allowedGenerationDomains,
    athleteIdTrimmed,
    athleteSportCode,
    entityId,
    selectedSeasonCycleId,
  ]);

  const selectedSeason = setupState.seasons.find(
    (season) => season.seasonCycleId === selectedSeasonCycleId,
  ) ?? null;
  useEffect(() => {
    if (!selectedSeason) {
      return;
    }
    const yearFromStartDate = Number(dateOnly(selectedSeason.startDate)?.slice(0, 4));
    const derivedYear =
      selectedSeason.year ??
      (Number.isFinite(yearFromStartDate)
        ? yearFromStartDate
        : new Date().getUTCFullYear());
    setSeasonName(selectedSeason.name ?? "");
    setSeasonNameEdited(false);
    setSeasonYear(derivedYear);
    setSeasonStartDate(dateOnly(selectedSeason.startDate) ?? "");
    setSeasonEndDate(dateOnly(selectedSeason.endDate) ?? "");
  }, [selectedSeason]);
  const hasEntitySeasons = setupState.seasons.length > 0;
  const hasSelectedSeasonForPlan =
    selectedSeasonCycleId !== null && selectedSeason !== null;
  const showSeasonCreateForm = !hasEntitySeasons || seasonCreateFormExplicit;
  const today = formatDateInputValue(new Date());
  const selectedSeasonPhases = selectedSeasonCycleId
    ? [...(setupState.phasesBySeasonCycleId[selectedSeasonCycleId] ?? [])].sort(
        (left, right) => phaseSortValue(left.phase) - phaseSortValue(right.phase),
      )
    : [];
  const phaseByType = Object.fromEntries(
    selectedSeasonPhases
      .filter((phase) => phase.phase)
      .map((phase) => [phase.phase as SeasonPhaseType, phase]),
  ) as Partial<Record<SeasonPhaseType, SeasonPhaseSummary>>;
  const activePhaseForSelectedSeason = detectCurrentPhase(selectedSeasonPhases, today);
  const goalLibraryLevel = useMemo(
    () => goalLibraryLevelValue(lockedPlanningContextCardFields.validatedLevel),
    [lockedPlanningContextCardFields.validatedLevel],
  );

  useEffect(() => {
    if (!accessGateReady || entityId === "" || athleteIdTrimmed === "") {
      setGoalLibraryCategories([]);
      setGoalLibraryError(null);
      setGoalLibraryLoading(false);
      setSelectedLibraryGoalIds([]);
      return;
    }

    if (!activePhaseForSelectedSeason?.phase || !goalLibraryLevel) {
      setGoalLibraryCategories([]);
      setGoalLibraryError(null);
      setGoalLibraryLoading(false);
      setSelectedLibraryGoalIds([]);
      return;
    }

    let cancelled = false;
    setGoalLibraryLoading(true);
    setGoalLibraryError(null);

    void (async () => {
      try {
        const library = await fetchGoalLibrary({
          sport: "GOLF",
          seasonPhase: activePhaseForSelectedSeason.phase,
          level: goalLibraryLevel,
        });
        if (cancelled) return;
        setGoalLibraryCategories(library.categories);
        setSelectedLibraryGoalIds((current) =>
          current.filter((id) =>
            library.categories.some((category) =>
              category.levels[goalLibraryLevel].some((goal) => goal.libraryGoalId === id),
            ),
          ),
        );
      } catch (e) {
        if (cancelled) return;
        setGoalLibraryCategories([]);
        setSelectedLibraryGoalIds([]);
        setGoalLibraryError(formatApiError(e, "Could not load Goal Library."));
      } finally {
        if (!cancelled) setGoalLibraryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    accessGateReady,
    activePhaseForSelectedSeason?.phase,
    athleteIdTrimmed,
    entityId,
    goalLibraryLevel,
  ]);

  const activeGoals = useMemo(
    () => setupState.goals.filter((goal) => goal.status === "ACTIVE"),
    [setupState.goals],
  );
  /**
   * Coaches with a Head Coach configured consume locked planning context read-only unless they are
   * the Head Coach. Without a Head Coach, keep the existing Nutrition/S&C read-only behavior.
   */
  const isDownstreamDomainCoach = useMemo(
    () => {
      if (
        setupState.hasHeadCoachConfigured &&
        !isHeadCoachPlanningContextOwner &&
        allowedGenerationDomains.length > 0
      ) {
        return true;
      }
      return (
        allowedGenerationDomains.length === 1 &&
        (allowedGenerationDomains[0] === "NUTRITION" ||
          allowedGenerationDomains[0] === "S_AND_C")
      );
    },
    [
      allowedGenerationDomains,
      isHeadCoachPlanningContextOwner,
      setupState.hasHeadCoachConfigured,
    ],
  );
  const upstreamContextLockedForDownstream =
    isUpstreamPlanningContextLocked(upstreamPlanningContext);
  const isNoHeadCoachDirectReleaseWorkflow = useMemo(
    () =>
      workspace
        ? workspaceResolveReleaseMode(workspace) === "direct_release" &&
          !workspace.ownershipFlags.hasHeadCoach
        : trainingPlanShellOwnership.releaseMode === "direct_release" &&
          !setupState.hasHeadCoachConfigured,
    [
      setupState.hasHeadCoachConfigured,
      trainingPlanShellOwnership.releaseMode,
      workspace,
    ],
  );
  const noHeadCoachDirectReleasePlanningContextLocked =
    isNoHeadCoachDirectReleaseWorkflow &&
    resolveNoHeadCoachDirectReleaseLockedPlanningContext(upstreamPlanningContext);
  const effectiveDownstreamPlanningContextLocked =
    resolveEffectiveDownstreamPlanningContextLocked({
      workspace,
      noHeadCoachDirectReleaseLocked:
        isNoHeadCoachDirectReleaseWorkflow &&
        isDownstreamDomainCoach &&
        noHeadCoachDirectReleasePlanningContextLocked,
      upstreamContextLockedForDownstream,
    });
  const identityBootstrapReady =
    accessGateReady &&
    currentCoachUserId.trim() !== "" &&
    entityId.trim() !== "" &&
    athleteIdTrimmed !== "";
  const assignmentBootstrapReady = identityBootstrapReady && !setupLoading;
  const planningContextRequiredForBootstrap =
    assignmentBootstrapReady &&
    (
      setupState.hasHeadCoachConfigured ||
      isDownstreamDomainCoach ||
      isPlanningContextAuthority
    );
  const submittedDomainPlansRequiredForBootstrap =
    assignmentBootstrapReady && isHeadCoachPlanningContextOwner;
  const clientHasSubmittedDomainPlans = useMemo(() => {
    if (!isHeadCoachPlanningContextOwner) return false;
    return GENERATION_DOMAIN_ORDER.some((domain) => {
      const state = headCoachDomainPlanStates[domain];
      return deriveHeadCoachDomainWorkflowStatus({
        summaryStatus: state.summaryStatus,
        summaryPlanId: state.summaryPlanId,
        summaryVersionId: state.summaryVersionId,
        activeDetail: state.activeDetail,
      }) === "submitted_for_review";
    });
  }, [headCoachDomainPlanStates, isHeadCoachPlanningContextOwner]);
  const hasSubmittedDomainPlans = useMemo(
    () =>
      workspace
        ? workspaceHasSubmittedDomainPlans(workspace)
        : clientHasSubmittedDomainPlans,
    [clientHasSubmittedDomainPlans, workspace],
  );
  const legacyPlanningContextLocked = useMemo(
    () =>
      resolveLegacyPlanningContextLocked({
        hasHeadCoachConfigured: setupState.hasHeadCoachConfigured,
        upstreamPlanningContextLocked:
          upstreamPlanningContext?.planningContextLocked === true,
        upstreamPlanningContextUpstreamLocked:
          upstreamPlanningContext?.upstreamPlanningContextLocked === true,
        clientHasSubmittedDomainPlans,
      }),
    [
      clientHasSubmittedDomainPlans,
      setupState.hasHeadCoachConfigured,
      upstreamPlanningContext?.planningContextLocked,
      upstreamPlanningContext?.upstreamPlanningContextLocked,
    ],
  );
  const planningContextLocked = useMemo(
    () =>
      resolvePlanningContextLocked({
        legacyLocked: legacyPlanningContextLocked,
        workspace,
      }),
    [legacyPlanningContextLocked, workspace],
  );
  const effectiveSkillsPlanningContextLocked =
    trainingPlanShellOwnership.planningContextShellOwner === "skills_coach" &&
    isNoHeadCoachDirectReleaseWorkflow
      ? noHeadCoachDirectReleasePlanningContextLocked
      : planningContextLocked;
  const skillsOwnedContextHasPlanWindow =
    trainingPlanShellOwnership.planningContextShellOwner === "skills_coach" &&
    isNoHeadCoachDirectReleaseWorkflow &&
    ((upstreamPlanningContext?.planWindow?.startDate ?? upstreamPlanningContext?.startDate ?? null) !== null) &&
    ((upstreamPlanningContext?.planWindow?.endDate ?? upstreamPlanningContext?.endDate ?? null) !== null);
  const planningContextResolved =
    workspace
      ? workspace.planningContext.resolved || workspace.planningContext.locked
      : !planningContextRequiredForBootstrap ||
        isTerminalBootstrapLoadState(planningContextBootstrapState);
  const headCoachDomainPlansResolved = useMemo(
    () =>
      workspace
        ? true
        : !isHeadCoachPlanningContextOwner ||
          isTerminalBootstrapLoadState(submittedDomainPlansBootstrapState),
    [
      isHeadCoachPlanningContextOwner,
      submittedDomainPlansBootstrapState,
      workspace,
    ],
  );
  const headCoachOwnsAssignedDomainGenerationForAthlete = useMemo(
    () =>
      workspace
        ? workspaceHeadCoachOwnsSkillsForAthlete(workspace)
        : headCoachOwnsAssignedDomainGeneration({
            coachAssignedGenerationDomains,
            assignedAthleteRow: assignedAthletePlanOwnership,
            readinessByDomain: planGenerationOwnershipByDomain,
          }),
    [
      assignedAthletePlanOwnership,
      coachAssignedGenerationDomains,
      planGenerationOwnershipByDomain,
      workspace,
    ],
  );
  const clientTrainingPlanWorkflowMode = useMemo(
    () =>
      resolveTrainingPlanWorkflowMode({
        isCoachSetupLoaded: !setupLoading,
        coachUserId: currentCoachUserId,
        athleteId: athleteIdTrimmed,
        entityId,
        academyCoachRole: setupState.academyCoachRole,
        hasHeadCoachConfigured: setupState.hasHeadCoachConfigured,
        trainingPlanReleaseMode: setupState.trainingPlanReleaseMode,
        coachAssignedGenerationDomains,
        isPlanningContextResolved: planningContextResolved,
        areHeadCoachDomainPlansResolved: headCoachDomainPlansResolved,
        planningContextLocked,
        hasSubmittedDomainPlans,
        headCoachOwnsAssignedDomainGeneration: isHeadCoachPlanningContextOwner
          ? headCoachOwnsAssignedDomainGenerationForAthlete
          : false,
      }),
    [
      athleteIdTrimmed,
      coachAssignedGenerationDomains,
      currentCoachUserId,
      entityId,
      hasSubmittedDomainPlans,
      headCoachDomainPlansResolved,
      headCoachOwnsAssignedDomainGenerationForAthlete,
      isHeadCoachPlanningContextOwner,
      planningContextLocked,
      planningContextResolved,
      setupLoading,
      setupState.academyCoachRole,
      setupState.hasHeadCoachConfigured,
      setupState.trainingPlanReleaseMode,
    ],
  );
  const trainingPlanWorkflowMode = useMemo(() => {
    if (workspace) {
      const fromWorkspace = resolveWorkflowModeFromWorkspace(workspace);
      logTrainingPlanWorkspaceShellDiagnostic({
        label: "before shell selection",
        workspace,
        selectedShell: fromWorkspace,
      });
      if (fromWorkspace) return fromWorkspace;
    }
    return clientTrainingPlanWorkflowMode;
  }, [clientTrainingPlanWorkflowMode, workspace]);
  const trainingPlanPageModel = resolveTrainingPlanPageBootstrapModel({
    identityReady: identityBootstrapReady,
    assignmentReady: assignmentBootstrapReady,
    workflowMode: trainingPlanWorkflowMode,
    planningContextRequired: planningContextRequiredForBootstrap,
    planningContextLoadState: planningContextBootstrapState,
    submittedDomainPlansRequired: submittedDomainPlansRequiredForBootstrap,
    submittedDomainPlansLoadState: submittedDomainPlansBootstrapState,
  });
  const hasRenderableWorkflowFallback = useMemo(
    () =>
      identityBootstrapReady &&
      assignmentBootstrapReady &&
      !setupLoading &&
      profile !== null,
    [
      assignmentBootstrapReady,
      identityBootstrapReady,
      profile,
      setupLoading,
    ],
  );
  const fallbackWorkflowShell = useMemo((): TrainingPlanPageShell | null => {
    if (!hasRenderableWorkflowFallback) return null;
    if (clientTrainingPlanWorkflowMode !== "loading") {
      return clientTrainingPlanWorkflowMode;
    }
    if (isHeadCoachPlanningContextOwner) {
      return planningContextLocked || hasSubmittedDomainPlans
        ? "head_coach_review"
        : "head_coach_planning";
    }
    if (allowedGenerationDomains.length > 0) {
      return "specialist_domain";
    }
    if (trainingPlanShellReleaseMode === "direct_release") {
      return "skills_coach_planning";
    }
    return null;
  }, [
    allowedGenerationDomains.length,
    clientTrainingPlanWorkflowMode,
    hasRenderableWorkflowFallback,
    hasSubmittedDomainPlans,
    isHeadCoachPlanningContextOwner,
    planningContextLocked,
    trainingPlanShellReleaseMode,
  ]);
  const trainingPlanShellModel = useMemo((): TrainingPlanPageBootstrapModel => {
    if (trainingPlanPageModel.ready) {
      return trainingPlanPageModel;
    }
    if (workspace) {
      const mode = trainingPlanWorkflowMode;
      if (mode !== "loading") {
        return {
          ready: true,
          shell: mode,
          workflowMode: mode,
          waitingFor: null,
        };
      }
    }
    if (fallbackWorkflowShell) {
      return {
        ready: true,
        shell: fallbackWorkflowShell,
        workflowMode: fallbackWorkflowShell,
        waitingFor: null,
      };
    }
    return trainingPlanPageModel;
  }, [
    fallbackWorkflowShell,
    trainingPlanPageModel,
    trainingPlanWorkflowMode,
    workspace,
  ]);
  useEffect(() => {
    if (!workspace) return;
    logTrainingPlanWorkspaceShellDiagnostic({
      label: "rendered Step 6 shell branch",
      workspace,
      selectedShell: trainingPlanShellModel.shell,
      renderedBranch: trainingPlanRenderedShellBranchName(trainingPlanShellModel.shell),
    });
  }, [trainingPlanShellModel.shell, workspace]);
  useEffect(() => {
    logTrainingPlanDomainDetailDiagnostic({
      currentDomain: currentCoachGenerationDomain,
      workspace,
      renderedPlanDomain: persistedVerifiedDomain,
      requestedDetailDomain: persistedVerifiedDomain,
      trainingPlanId: persistedSkillsPlanDetail?.plan.id?.trim() ?? null,
      versionId: persistedSkillsPlanDetail?.version.id?.trim() ?? null,
      loadStatus: persistedSkillsPlanLoading
        ? "loading"
        : persistedSkillsPlanDetail !== null
          ? "loaded"
          : persistedSkillsPlanError !== null
            ? "error"
            : "idle",
      loadError: persistedSkillsPlanError,
      rendererBranch: trainingPlanRenderedShellBranchName(trainingPlanShellModel.shell),
    });
  }, [
    currentCoachGenerationDomain,
    persistedSkillsPlanDetail,
    persistedSkillsPlanError,
    persistedSkillsPlanLoading,
    persistedVerifiedDomain,
    trainingPlanShellModel.shell,
    workspace,
  ]);
  const shouldShowBlockingWorkspaceLoading = useMemo(
    () =>
      shouldBlockWorkflowRenderForWorkspace({
        workspaceLoading,
        workspaceRefreshing,
        workspace,
        isHeadCoachPlanningContextOwner,
        planningContextLocked,
        hasRenderableWorkflowFallback,
      }),
    [
      hasRenderableWorkflowFallback,
      isHeadCoachPlanningContextOwner,
      planningContextLocked,
      workspace,
      workspaceLoading,
      workspaceRefreshing,
    ],
  );
  useEffect(() => {
    if (loading || !trainingPlanShellModel.ready) return;
    markPageReady();
  }, [loading, markPageReady, trainingPlanShellModel.ready]);
  const headCoachReviewMode =
    trainingPlanShellModel.shell === "head_coach_review" ||
    trainingPlanShellModel.shell === "head_coach_function_aware";
  const headCoachFunctionAwareMode =
    trainingPlanShellModel.shell === "head_coach_function_aware";
  const workflow1HeadCoachReviewActionPanelMode =
    shouldUseWorkflow1HeadCoachReviewActionPanel({
      shell: trainingPlanShellModel.shell,
      workflowShape: workspace?.workflowShape,
    });
  const reviewReviseStepLabel = useMemo(() => {
    return resolveReviewReviseStepLabelFromWorkspace({
      workspace,
      fallbackLabel: null,
    });
  }, [workspace]);
  const shouldResolveSpecialistDomainWorkspace =
    trainingPlanShellModel.shell === "specialist_domain";
  const shouldForceAssistantDomainWorkspace = shouldResolveSpecialistDomainWorkspace;
  const specialistDomainResolutionPending =
    shouldResolveSpecialistDomainWorkspace && currentCoachGenerationDomain === null;
  const assistantLockedPlanningContextError =
    shouldForceAssistantDomainWorkspace && upstreamPlanningContextError !== null
      ? "Unable to load locked planning context. Please retry."
      : null;
  /** Specialist/domain coaches always get the domain workspace shell; lock state gates create/actions inside. */
  const shouldRenderAssistantDomainWorkspace = shouldForceAssistantDomainWorkspace;
  const workflowViewSelectionLoading =
    shouldShowBlockingWorkspaceLoading ||
    (
      !trainingPlanShellModel.ready &&
      !workspace &&
      !hasRenderableWorkflowFallback
    ) ||
    (
      specialistDomainResolutionPending &&
      !workspace &&
      !hasRenderableWorkflowFallback
    ) ||
    (
      shouldResolveSpecialistDomainWorkspace &&
      !workspace &&
      !hasRenderableWorkflowFallback &&
      (
        upstreamPlanningContextLoading ||
        (upstreamPlanningContext === null && upstreamPlanningContextError === null)
      )
    );
  const effectiveCoachGenerationDomain =
    currentCoachGenerationDomain ?? readinessGenerationDomain;
  const persistedPlanQueryDomain = useMemo<TrainingPlanGenerationDomain | null>(() => {
    if (currentCoachGenerationDomain !== null) {
      return currentCoachGenerationDomain;
    }
    if (headCoachSubmittedReviewDomain !== null) {
      return headCoachSubmittedReviewDomain;
    }
    const persistedDomain = persistedSkillsPlanDetail?.generationDomain?.trim().toUpperCase();
    if (
      persistedDomain === "SKILLS" ||
      persistedDomain === "NUTRITION" ||
      persistedDomain === "S_AND_C"
    ) {
      return persistedDomain;
    }
    return allowedGenerationDomains[0] ?? null;
  }, [
    allowedGenerationDomains,
    currentCoachGenerationDomain,
    headCoachSubmittedReviewDomain,
    persistedSkillsPlanDetail?.generationDomain,
  ]);
  const visibleActiveGoals = useMemo(
    () => {
      if (selectedSeasonCycleId == null) {
        return [];
      }
      return activeGoals.filter(
        (goal) => goal.seasonCycleId === selectedSeasonCycleId,
      );
    },
    [activeGoals, selectedSeasonCycleId],
  );
  const domainVisibleActiveGoals = useMemo(
    () =>
      visibleActiveGoals.filter((goal) =>
        goalMatchesCoachGenerationDomain(goal, effectiveCoachGenerationDomain),
      ),
    [effectiveCoachGenerationDomain, visibleActiveGoals],
  );
  const currentPhaseActiveGoals = useMemo(
    () =>
      domainVisibleActiveGoals.filter((goal) =>
        goalMatchesCurrentPhase(goal, activePhaseForSelectedSeason),
      ),
    [activePhaseForSelectedSeason, domainVisibleActiveGoals],
  );
  const availableLibraryGoals = useMemo(
    () =>
      goalLibraryCategories.flatMap((category) => {
        const levelGoals = goalLibraryLevel ? category.levels[goalLibraryLevel] ?? [] : [];
        return levelGoals.filter((goal) => {
          const goalDomain = goalLibraryDomainValue(goal);
          return goalDomain === null || goalDomain === effectiveCoachGenerationDomain;
        });
      }),
    [effectiveCoachGenerationDomain, goalLibraryCategories, goalLibraryLevel],
  );
  const selectedLibraryGoals = useMemo(
    () =>
      availableLibraryGoals.filter((goal) => selectedLibraryGoalIds.includes(goal.libraryGoalId)),
    [availableLibraryGoals, selectedLibraryGoalIds],
  );
  const competitionGoals = useMemo(
    () => visibleActiveGoals.filter((goal) => goal.goalType === "COMPETITION"),
    [visibleActiveGoals],
  );
  const selectedActiveGoals = useMemo(
    () => currentPhaseActiveGoals.filter((goal) => selectedGoalIds.includes(goal.goalId)),
    [currentPhaseActiveGoals, selectedGoalIds],
  );

  const goalsReadyForGeneration = selectedActiveGoals.length > 0;

  useEffect(() => {
    setPhaseEditorState((current) => ({
      OFF_SEASON: {
        ...current.OFF_SEASON,
        isEditing: false,
        startDate: dateOnly(phaseByType.OFF_SEASON?.startDate) ?? "",
        endDate: dateOnly(phaseByType.OFF_SEASON?.endDate) ?? "",
        loading: false,
        error: null,
        success: current.OFF_SEASON.success,
      },
      PRE_SEASON: {
        ...current.PRE_SEASON,
        isEditing: false,
        startDate: dateOnly(phaseByType.PRE_SEASON?.startDate) ?? "",
        endDate: dateOnly(phaseByType.PRE_SEASON?.endDate) ?? "",
        loading: false,
        error: null,
        success: current.PRE_SEASON.success,
      },
      IN_SEASON: {
        ...current.IN_SEASON,
        isEditing: false,
        startDate: dateOnly(phaseByType.IN_SEASON?.startDate) ?? "",
        endDate: dateOnly(phaseByType.IN_SEASON?.endDate) ?? "",
        loading: false,
        error: null,
        success: current.IN_SEASON.success,
      },
    }));
  }, [phaseByType.IN_SEASON, phaseByType.OFF_SEASON, phaseByType.PRE_SEASON]);

  const seasonReady = selectedSeasonCycleId !== null && selectedSeason !== null;
  const currentPhaseDetected = activePhaseForSelectedSeason !== null;

  const appStepComplete = resolveContextAppStepCompleteForNavigation({
    appCompleteness: readinessPanel.appCompleteness,
    planningEligibility: readinessPanel.planningEligibility,
    missingRequiredFields: readinessPanel.missingRequiredFields,
    backendBlockers: readinessPanel.blockers,
    skillsOwnedDirectRelease: trainingPlanShellModel.shell === "skills_coach_planning",
  });
  const levelStepComplete = readinessPanel.validationStatus === "CONFIRMED";
  const workloadComplete =
    levelStepComplete === true
    && workloadAssessmentResult !== null
    && workloadAssessmentResult.workloadClassification !== null
    && athleteIdTrimmed !== ""
    && workloadAssessmentCapturedForAthleteId === athleteIdTrimmed
    && workloadAssessmentExplicitlyRunForAthleteId === athleteIdTrimmed;
  const currentPlanDurationDays = generationDurationDaysForDomain(
    effectiveCoachGenerationDomain,
    durationDays,
  );
  const planEndDate = useMemo(
    () => addDaysToDateString(planStartDate, currentPlanDurationDays - 1),
    [currentPlanDurationDays, planStartDate],
  );
  const planWindowInsideCurrentPhase = isPlanWindowInsidePhase(
    activePhaseForSelectedSeason,
    planStartDate,
    planEndDate,
  );
  const planDatesWithinSelectedSeason = useMemo(
    () => planWindowWithinSelectedSeasonBounds(selectedSeason, planStartDate, planEndDate),
    [planEndDate, planStartDate, selectedSeason],
  );
  const planSeasonBoundsUi = useMemo((): "idle" | "invalid" | "valid" => {
    if (!selectedSeason || planStartDate.trim() === "") {
      return "idle";
    }
    return planDatesWithinSelectedSeason ? "valid" : "invalid";
  }, [planDatesWithinSelectedSeason, planStartDate, selectedSeason]);
  const latestSupportedDraftDomain = useMemo(
    () =>
      allowedGenerationDomains.find(
        (domain) =>
          domain === "SKILLS" || domain === "S_AND_C" || domain === "NUTRITION",
      ) ?? null,
    [allowedGenerationDomains],
  );
  /**
   * Coach functions can be empty on first paint or omit mapped domains; `latestSupportedDraftDomain`
   * is then null and we must still call domain-drafts/latest using the same readiness fallback as
   * generation (`readinessGenerationDomain`), or domain-drafts never loads and no planId exists for
   * active/detail hydration.
   */
  const domainForLatestDomainDraft = useMemo(
    (): TrainingPlanGenerationDomain =>
      currentCoachGenerationDomain ?? latestSupportedDraftDomain ?? readinessGenerationDomain,
    [currentCoachGenerationDomain, latestSupportedDraftDomain, readinessGenerationDomain],
  );
  const persistedDetailDomain = useMemo(
    () =>
      normalizeTrainingPlanGenerationDomain(persistedSkillsPlanDetail?.generationDomain)
      ?? persistedVerifiedDomain,
    [persistedSkillsPlanDetail?.generationDomain, persistedVerifiedDomain],
  );
  const persistedDetailMatchesCurrentDomain =
    currentCoachGenerationDomain !== null &&
    persistedDetailDomain === currentCoachGenerationDomain;
  const latestDraftMatchesCurrentDomain =
    currentCoachGenerationDomain !== null &&
    latestDraftDomain === currentCoachGenerationDomain;
  const generateResultMatchesCurrentDomain =
    currentCoachGenerationDomain !== null &&
    generatePlanSuccessDomain === currentCoachGenerationDomain;
  const headCoachSkillsOwnerWorkflow = isHeadCoachSkillsOwnerWorkflow(workspace);
  /**
   * Step 6 Workflow Actions: after the workspace shell is resolved, Workflow 2A uses the
   * HC-owned Skills summary as action/status context. Legacy detail objects still render content.
   */
  const resolvedWorkflowPlanId = useMemo(() => {
    if (headCoachSkillsOwnerWorkflow) {
      return workspace?.domains.SKILLS.summary.trainingPlanId?.trim() ?? "";
    }
    if (currentCoachGenerationDomain === null) return "";
    const fromPersisted = persistedDetailMatchesCurrentDomain
      ? (persistedSkillsPlanDetail?.plan.id?.trim() ?? "")
      : "";
    if (fromPersisted !== "") return fromPersisted;
    const fromDraft = latestDraftMatchesCurrentDomain
      ? (latestSkillsDraft?.trainingPlanId?.trim() ?? "")
      : "";
    if (fromDraft !== "") return fromDraft;
    const fromGenerate = generateResultMatchesCurrentDomain
      ? (generatePlanSuccess?.trainingPlanId?.trim() ?? "")
      : "";
    if (fromGenerate !== "") return fromGenerate;
    if (isDownstreamDomainCoach) {
      return "";
    }
    return urlPlanCandidate?.trim() ?? "";
  }, [
    currentCoachGenerationDomain,
    generatePlanSuccess?.trainingPlanId,
    generateResultMatchesCurrentDomain,
    headCoachSkillsOwnerWorkflow,
    isDownstreamDomainCoach,
    latestDraftMatchesCurrentDomain,
    latestSkillsDraft?.trainingPlanId,
    persistedDetailMatchesCurrentDomain,
    persistedSkillsPlanDetail?.plan.id,
    urlPlanCandidate,
    workspace?.domains.SKILLS.summary.trainingPlanId,
  ]);
  /**
   * Step 6 Workflow Actions: domain for active/detail (detail field → verified request domain →
   * latest draft domain → domain used for domain-drafts/latest → readiness fallback).
   */
  const resolvedWorkflowGenerationDomain = useMemo((): TrainingPlanGenerationDomain => {
    if (headCoachSkillsOwnerWorkflow) {
      return normalizeTrainingPlanGenerationDomain(
        workspace?.domains.SKILLS.summary.generationDomain,
      ) ?? "SKILLS";
    }
    return (
      currentCoachGenerationDomain
      ?? persistedDetailDomain
      ?? normalizeTrainingPlanGenerationDomain(latestDraftDomain ?? undefined)
      ?? domainForLatestDomainDraft
      ?? readinessGenerationDomain
    );
  }, [
    currentCoachGenerationDomain,
    domainForLatestDomainDraft,
    headCoachSkillsOwnerWorkflow,
    latestDraftDomain,
    persistedDetailDomain,
    readinessGenerationDomain,
    workspace?.domains.SKILLS.summary.generationDomain,
  ]);
  const persistedSkillsPlanGoalNames = useMemo(
    () =>
      persistedSkillsPlanDetail?.plan.goals
        .map((goal) => goal.goalName?.trim() ?? "")
        .filter((goalName) => goalName !== "") ?? [],
    [persistedSkillsPlanDetail],
  );
  const persistedSkillsPlanHasSessions = useMemo(
    () =>
      persistedSkillsPlanDetail?.days.some((day) => day.sessions.length > 0) ?? false,
    [persistedSkillsPlanDetail],
  );
  const assistantAthleteDisplay = useMemo(() => {
    if (athleteIdentity.displayName && athleteIdentity.displayName !== "—") {
      return formatPersonNameForDisplay(athleteIdentity.displayName);
    }
    if (athleteIdentity.email && athleteIdentity.email !== "—") {
      return athleteIdentity.email;
    }
    return athleteIdTrimmed || "—";
  }, [athleteIdTrimmed, athleteIdentity.displayName, athleteIdentity.email]);
  const persistedPlanTotalDurationMinutes = useMemo(() => {
    if (!persistedSkillsPlanDetail) return null;
    let hasDuration = false;
    let total = 0;
    for (const day of persistedSkillsPlanDetail.days) {
      for (const session of day.sessions) {
        const minutes = readSessionDurationMinutes(session);
        if (minutes === null) continue;
        hasDuration = true;
        total += minutes;
      }
    }
    return hasDuration ? total : null;
  }, [persistedSkillsPlanDetail]);
  const draftPlanTotalDurationMinutes = useMemo(() => {
    if (!latestSkillsDraft) return null;
    let hasDuration = false;
    let total = 0;
    for (const day of latestSkillsDraft.days) {
      for (const session of day.sessions) {
        const minutes = readDraftSessionDurationMinutes(session);
        if (minutes === null) continue;
        hasDuration = true;
        total += minutes;
      }
    }
    return hasDuration ? total : null;
  }, [latestSkillsDraft]);
  const persistedTrainingDaysCount = useMemo(
    () => persistedSkillsPlanDetail?.days.filter((day) => day.sessions.length > 0).length ?? 0,
    [persistedSkillsPlanDetail],
  );
  const draftTrainingDaysCount = useMemo(
    () => latestSkillsDraft?.days.filter((day) => day.sessions.length > 0).length ?? 0,
    [latestSkillsDraft],
  );
  const activePlanTotalDurationMinutes =
    requestedPlanId !== null ? persistedPlanTotalDurationMinutes : draftPlanTotalDurationMinutes;
  const activePlanTrainingDaysCount =
    requestedPlanId !== null ? persistedTrainingDaysCount : draftTrainingDaysCount;
  const assistantPlanDiscoveryLoading = useMemo(() => {
    if (!shouldRenderAssistantDomainWorkspace) return false;
    if (upstreamPlanningContextLoading && !effectiveDownstreamPlanningContextLocked) {
      return true;
    }
    if (latestSkillsDraftRequestState === "idle" || latestSkillsDraftRequestState === "loading") {
      return true;
    }
    if (assistantDomainSummaryHydrationPending) return true;
    return false;
  }, [
    assistantDomainSummaryHydrationPending,
    effectiveDownstreamPlanningContextLocked,
    latestSkillsDraftRequestState,
    shouldRenderAssistantDomainWorkspace,
    upstreamPlanningContextLoading,
  ]);
  const persistedPlanDisplayDomain = useMemo(
    () =>
      persistedSkillsPlanDetail?.generationDomain
      ?? persistedVerifiedDomain
      ?? effectiveCoachGenerationDomain,
    [
      effectiveCoachGenerationDomain,
      persistedSkillsPlanDetail?.generationDomain,
      persistedVerifiedDomain,
    ],
  );
  const lockedUpstreamGoals = useMemo(
    () => {
      const contextGoals = resolveDisplayedPlanningGoals(upstreamPlanningContext);
      if (contextGoals.length > 0) return contextGoals;

      const planningContext = upstreamPlanningContext?.planningContext ?? null;
      const selectedGoalIds =
        planningContext?.lockedGoalIds && planningContext.lockedGoalIds.length > 0
          ? planningContext.lockedGoalIds
          : planningContext?.goalIds && planningContext.goalIds.length > 0
            ? planningContext.goalIds
            : upstreamPlanningContext?.goalIds ?? [];

      return selectedGoalIds
        .map((goalId) => setupState.goals.find((goal) => goal.goalId === goalId))
        .filter((goal): goal is GoalSummary => goal !== undefined);
    },
    [setupState.goals, upstreamPlanningContext],
  );
  const assistantDomainWorkflowStatus = useMemo(
    () => {
      if (assistantPlanDiscoveryLoading) return "not_created";
      if (headCoachSkillsOwnerWorkflow && workspace !== null) {
        const summary = workspace.domains.SKILLS.summary;
        const workspacePlanId = summary.trainingPlanId?.trim() ?? "";
        const workspaceVersionId = resolveWorkspaceSummaryActionVersionId(summary);
        if (workspacePlanId === "" || workspaceVersionId === "") {
          return "not_created";
        }
        return deriveWorkflowStatusFromWorkspaceDomain(workspace.domains.SKILLS);
      }
      if (workspace !== null && currentCoachGenerationDomain !== null) {
        const summary = workspace.domains[currentCoachGenerationDomain].summary;
        const workspacePlanId = summary.trainingPlanId?.trim() ?? "";
        const workspaceVersionId = summary.versionId?.trim() ?? "";
        if (workspacePlanId === "" || workspaceVersionId === "") {
          return "not_created";
        }
        return deriveWorkflowStatusFromWorkspaceDomain(workspace.domains[currentCoachGenerationDomain]);
      }
      return (
      deriveAssistantDomainWorkflowStatus({
        latestDraft: latestDraftMatchesCurrentDomain ? latestSkillsDraft : null,
        activeDetail: persistedDetailMatchesCurrentDomain ? persistedSkillsPlanDetail : null,
      })
      );
    },
    [
      assistantPlanDiscoveryLoading,
      currentCoachGenerationDomain,
      headCoachSkillsOwnerWorkflow,
      latestDraftMatchesCurrentDomain,
      latestSkillsDraft,
      persistedDetailMatchesCurrentDomain,
      persistedSkillsPlanDetail,
      workspace,
    ],
  );
  const hasExistingCurrentDomainPlan =
    assistantDomainWorkflowStatus !== "not_created";
  const persistedGovernedPlanDomain = useMemo<TrainingPlanGenerationDomain | null>(
    () => {
      if (headCoachSkillsOwnerWorkflow) return "SKILLS";
      if (currentCoachGenerationDomain !== null) {
        return persistedDetailMatchesCurrentDomain ? currentCoachGenerationDomain : null;
      }
      return persistedDetailDomain ?? persistedPlanQueryDomain;
    },
    [
      currentCoachGenerationDomain,
      headCoachSkillsOwnerWorkflow,
      persistedDetailDomain,
      persistedDetailMatchesCurrentDomain,
      persistedPlanQueryDomain,
    ],
  );
  const legacyPersistedGovernedPlanContext = useMemo<AssistantGovernedPlanContext | null>(() => {
    if (headCoachReviewMode && headCoachSubmittedReviewDomain !== null) {
      const domainState = headCoachDomainPlanStates[headCoachSubmittedReviewDomain];
      const activeDetail = domainState.activeDetail;
      const planId = activeDetail?.plan.id?.trim() ?? "";
      const versionId = activeDetail?.version.id?.trim() ?? "";
      if (entityId === "" || athleteIdTrimmed === "" || planId === "" || versionId === "") {
        return null;
      }
      return {
        planId,
        versionId,
        generationDomain: headCoachSubmittedReviewDomain,
      };
    }
    const planId = persistedSkillsPlanDetail?.plan.id?.trim() ?? "";
    const versionId = persistedSkillsPlanDetail?.version.id?.trim() ?? "";
    if (
      entityId === "" ||
      athleteIdTrimmed === "" ||
      planId === "" ||
      versionId === "" ||
      persistedGovernedPlanDomain === null
    ) {
      return null;
    }
    return {
      planId,
      versionId,
      generationDomain: persistedGovernedPlanDomain,
    };
  }, [
    athleteIdTrimmed,
    entityId,
    headCoachDomainPlanStates,
    headCoachReviewMode,
    persistedGovernedPlanDomain,
    headCoachSubmittedReviewDomain,
    persistedSkillsPlanDetail?.plan.id,
    persistedSkillsPlanDetail?.version.id,
  ]);
  const legacyPersistedGovernedAllowedActions = useMemo(() => {
    if (workspace && currentCoachGenerationDomain) {
      return workspaceAllowedActionsSet(workspace, currentCoachGenerationDomain);
    }
    return new Set(persistedSkillsPlanDetail?.allowedActions ?? []);
  }, [
    currentCoachGenerationDomain,
    persistedSkillsPlanDetail?.allowedActions,
    workspace,
  ]);
  const workflowActionContext = useMemo(
    () =>
      resolveWorkflowActionContext({
        workspace,
        legacyContext: legacyPersistedGovernedPlanContext,
        legacyAllowedActions: legacyPersistedGovernedAllowedActions,
        currentDomain: currentCoachGenerationDomain,
      }),
    [
      currentCoachGenerationDomain,
      legacyPersistedGovernedAllowedActions,
      legacyPersistedGovernedPlanContext,
      workspace,
    ],
  );
  const persistedGovernedPlanContext = workflowActionContext;
  const persistedGovernedAllowedActions = useMemo(
    () =>
      new Set<GovernedTrainingPlanWorkflowAction>(
        (workflowActionContext?.allowedActions as GovernedTrainingPlanWorkflowAction[] | undefined) ??
          [],
      ),
    [workflowActionContext],
  );
  const assistantVisibleDraftForSubmit = useMemo(
    () => (latestDraftMatchesCurrentDomain ? latestSkillsDraft : null),
    [latestDraftMatchesCurrentDomain, latestSkillsDraft],
  );
  const assistantDomainShowSubmitAction = useMemo(
    () =>
      resolveAssistantDomainSubmitActionVisible({
        workspace,
        currentDomain: currentCoachGenerationDomain,
        discoveryLoading: assistantPlanDiscoveryLoading,
        governedDetailRefreshing: assistantGovernedDetailRefreshing,
        hasHeadCoachConfigured: setupState.hasHeadCoachConfigured,
        allowedActionsHasSubmitReview: persistedGovernedAllowedActions.has("SUBMIT_REVIEW"),
        governedContext:
          shouldForceAssistantDomainWorkspace && !isHeadCoachPlanningContextOwner
            ? persistedGovernedPlanContext
            : null,
        latestDraft: assistantVisibleDraftForSubmit,
      }),
    [
      assistantGovernedDetailRefreshing,
      assistantPlanDiscoveryLoading,
      assistantVisibleDraftForSubmit,
      currentCoachGenerationDomain,
      isHeadCoachPlanningContextOwner,
      persistedGovernedAllowedActions,
      persistedGovernedPlanContext,
      setupState.hasHeadCoachConfigured,
      shouldForceAssistantDomainWorkspace,
      workspace,
    ],
  );
  const assistantDomainSubmitVersionMismatchNotice = useMemo(() => {
    if (!shouldForceAssistantDomainWorkspace || isHeadCoachPlanningContextOwner) {
      return false;
    }
    if (assistantPlanDiscoveryLoading || assistantGovernedDetailRefreshing) {
      return false;
    }
    return hasAssistantGovernedDetailVersionMismatch({
      allowedActionsHasSubmitReview: persistedGovernedAllowedActions.has("SUBMIT_REVIEW"),
      governedContext: persistedGovernedPlanContext,
      latestDraft: assistantVisibleDraftForSubmit,
      currentDomain: currentCoachGenerationDomain,
    });
  }, [
    assistantGovernedDetailRefreshing,
    assistantPlanDiscoveryLoading,
    assistantVisibleDraftForSubmit,
    currentCoachGenerationDomain,
    isHeadCoachPlanningContextOwner,
    persistedGovernedAllowedActions,
    persistedGovernedPlanContext,
    shouldForceAssistantDomainWorkspace,
  ]);
  /** Latest-domain-draft view without `planId` in URL, but active/detail matches the draft's plan id. */
  const draftAlignedForGovernedActions = useMemo(() => {
    if (requestedPlanId !== null) return false;
    if (!latestDraftMatchesCurrentDomain || !persistedDetailMatchesCurrentDomain) return false;
    const draftPlanId = latestSkillsDraft?.trainingPlanId?.trim() ?? "";
    const detailPlanId = persistedSkillsPlanDetail?.plan.id?.trim() ?? "";
    return draftPlanId !== "" && detailPlanId !== "" && draftPlanId === detailPlanId;
  }, [
    latestDraftMatchesCurrentDomain,
    latestSkillsDraft?.trainingPlanId,
    persistedDetailMatchesCurrentDomain,
    persistedSkillsPlanDetail?.plan.id,
    requestedPlanId,
  ]);
  const hasPersistedPlanForLatestDraftToDiscourageGenerate = useMemo(
    () => requestedPlanId === null && draftAlignedForGovernedActions,
    [draftAlignedForGovernedActions, requestedPlanId],
  );
  type AssistantNutritionItem = NutritionMealItem;
  const nutritionDraftItemsBySessionKey = useMemo(() => {
    const map = new Map<string, AssistantNutritionItem[]>();
    if (currentCoachGenerationDomain !== "NUTRITION" || !latestDraftMatchesCurrentDomain || !latestSkillsDraft) {
      return map;
    }
    for (const day of latestSkillsDraft.days) {
      const dayKey = day.date?.trim() ?? `day-${day.dayIndex ?? ""}`;
      for (const session of day.sessions) {
        map.set(`${dayKey}::${session.title?.trim() ?? ""}`, session.items);
      }
    }
    return map;
  }, [currentCoachGenerationDomain, latestDraftMatchesCurrentDomain, latestSkillsDraft]);
  const mergeNutritionItemsWithDraftFallback = useCallback(
    (persistedItems: AssistantNutritionItem[], draftItems: AssistantNutritionItem[]): AssistantNutritionItem[] => {
      if (currentCoachGenerationDomain !== "NUTRITION") return persistedItems;
      if (persistedItems.length === 0) return draftItems;
      if (draftItems.length === 0) return persistedItems;
      return persistedItems.map((item, index) => {
        const draftItem = draftItems[index];
        if (!draftItem) return item;
        return {
          ...item,
          nutritionCatalogItemId: item.nutritionCatalogItemId ?? draftItem.nutritionCatalogItemId,
          label: item.label ?? draftItem.label,
          serving: item.serving ?? draftItem.serving,
          quantity: item.quantity ?? draftItem.quantity,
          unit: item.unit ?? draftItem.unit,
          calories: item.calories ?? draftItem.calories,
          protein: item.protein ?? draftItem.protein,
          carbs: item.carbs ?? draftItem.carbs,
          fat: item.fat ?? draftItem.fat,
          timing: item.timing ?? draftItem.timing,
          notes: item.notes ?? draftItem.notes,
        };
      });
    },
    [currentCoachGenerationDomain],
  );
  const assistantNutritionRenderSource =
    currentCoachGenerationDomain !== "NUTRITION"
      ? null
      : requestedPlanId !== null && persistedDetailMatchesCurrentDomain
        ? "active/detail"
        : latestDraftMatchesCurrentDomain
          ? "latest-domain-draft"
          : "none";
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      process.env.NODE_ENV !== "development" ||
      currentCoachGenerationDomain !== "NUTRITION"
    ) {
      return;
    }
    const persistedFirstDay = persistedSkillsPlanDetail?.days[0] ?? null;
    const persistedFirstSession =
      requestedPlanId !== null && persistedDetailMatchesCurrentDomain
        ? persistedFirstDay?.sessions[0] ?? null
        : null;
    const persistedFirstItems =
      persistedFirstSession !== null
        ? mergeNutritionItemsWithDraftFallback(
            persistedFirstSession.sessionStructureSections.flatMap((section) => section.items),
            nutritionDraftItemsBySessionKey.get(
              `${persistedFirstDay?.date?.trim() ?? `day-${persistedFirstDay?.dayIndex ?? ""}`}::${persistedFirstSession.title?.trim() ?? ""}`,
            ) ?? [],
          )
        : [];
    const firstItem =
      assistantNutritionRenderSource === "active/detail"
        ? persistedFirstItems[0] ?? null
        : assistantNutritionRenderSource === "latest-domain-draft"
          ? latestSkillsDraft?.days[0]?.sessions[0]?.items[0] ?? null
          : null;
    console.log("nutrition render source", {
      source: assistantNutritionRenderSource,
      trainingPlanId:
        requestedPlanId !== null && persistedDetailMatchesCurrentDomain
          ? persistedSkillsPlanDetail?.plan.id ?? null
          : latestDraftMatchesCurrentDomain
            ? latestSkillsDraft?.trainingPlanId ?? null
            : null,
      versionId:
        requestedPlanId !== null && persistedDetailMatchesCurrentDomain
          ? persistedSkillsPlanDetail?.version.id ?? null
          : latestDraftMatchesCurrentDomain
            ? latestSkillsDraft?.trainingPlanVersionId ?? null
            : null,
      firstItem,
      calories: firstItem?.calories,
      protein: firstItem?.protein,
      carbs: firstItem?.carbs,
      fat: firstItem?.fat,
    });
  }, [
    assistantNutritionRenderSource,
    currentCoachGenerationDomain,
    latestDraftMatchesCurrentDomain,
    latestSkillsDraft,
    mergeNutritionItemsWithDraftFallback,
    nutritionDraftItemsBySessionKey,
    persistedDetailMatchesCurrentDomain,
    persistedSkillsPlanDetail,
    requestedPlanId,
  ]);
  const sortedLatestSkillsDraftDays = useMemo(
    () =>
      latestSkillsDraft
        ? [...latestSkillsDraft.days].sort(
            (left, right) =>
              (left.dayIndex ?? Number.MAX_SAFE_INTEGER) -
              (right.dayIndex ?? Number.MAX_SAFE_INTEGER),
          )
        : [],
    [latestSkillsDraft],
  );
  const shouldLoadLatestSkillsDraft = requestedPlanId === null;
  const latestDraftDisplayDomain = latestDraftDomain ?? domainForLatestDomainDraft;
  const hasRevisionSummary =
    Boolean(latestSkillsDraft?.revision?.feedback) ||
    Boolean(latestSkillsDraft?.revision?.changeSummary?.length);
  const isHeadCoachRevisionRequested = assistantDomainWorkflowStatus === "revision_requested";
  const skillsReviseIds = useMemo(() => {
    return resolveDomainRevisePlanIds({
      domain: "SKILLS",
      workspace,
      persistedDetailDomain,
      persistedPlanId: persistedSkillsPlanDetail?.plan?.id,
      persistedVersionId: persistedSkillsPlanDetail?.version?.id,
      latestDraftDomain: latestDraftDisplayDomain,
      latestDraftPlanId: latestSkillsDraft?.trainingPlanId,
      latestDraftVersionId: latestSkillsDraft?.trainingPlanVersionId,
    });
  }, [
    latestDraftDisplayDomain,
    latestSkillsDraft?.trainingPlanId,
    latestSkillsDraft?.trainingPlanVersionId,
    persistedDetailDomain,
    persistedSkillsPlanDetail?.plan?.id,
    persistedSkillsPlanDetail?.version?.id,
    workspace,
  ]);
  const nutritionReviseIds = useMemo(() => {
    return resolveDomainRevisePlanIds({
      domain: "NUTRITION",
      workspace,
      persistedDetailDomain,
      persistedPlanId: persistedSkillsPlanDetail?.plan?.id,
      persistedVersionId: persistedSkillsPlanDetail?.version?.id,
      latestDraftDomain: latestDraftDisplayDomain,
      latestDraftPlanId: latestSkillsDraft?.trainingPlanId,
      latestDraftVersionId: latestSkillsDraft?.trainingPlanVersionId,
    });
  }, [
    latestDraftDisplayDomain,
    latestSkillsDraft?.trainingPlanId,
    latestSkillsDraft?.trainingPlanVersionId,
    persistedDetailDomain,
    persistedSkillsPlanDetail?.plan?.id,
    persistedSkillsPlanDetail?.version?.id,
    workspace,
  ]);
  const sandCReviseIds = useMemo(() => {
    return resolveDomainRevisePlanIds({
      domain: "S_AND_C",
      workspace,
      persistedDetailDomain,
      persistedPlanId: persistedSkillsPlanDetail?.plan?.id,
      persistedVersionId: persistedSkillsPlanDetail?.version?.id,
      latestDraftDomain: latestDraftDisplayDomain,
      latestDraftPlanId: latestSkillsDraft?.trainingPlanId,
      latestDraftVersionId: latestSkillsDraft?.trainingPlanVersionId,
    });
  }, [
    latestDraftDisplayDomain,
    latestSkillsDraft?.trainingPlanId,
    latestSkillsDraft?.trainingPlanVersionId,
    persistedDetailDomain,
    persistedSkillsPlanDetail?.plan?.id,
    persistedSkillsPlanDetail?.version?.id,
    workspace,
  ]);
  const showValidateLevel = useMemo(
    () =>
      canCoachValidateLevel({
        hasHeadCoachConfigured: setupState.hasHeadCoachConfigured,
        academyCoachRole: setupState.academyCoachRole,
        functions: setupState.coachFunctions,
      }),
    [
      setupState.academyCoachRole,
      setupState.coachFunctions,
      setupState.hasHeadCoachConfigured,
    ],
  );

  const everyPlanWindowInsidePhaseForGeneration = useMemo(
    () => {
      const domainsForWindow =
        allowedGenerationDomains.length > 0
          ? allowedGenerationDomains
          : isHeadCoachPlanningContextOwner
            ? [effectiveCoachGenerationDomain]
            : [];
      return (
        domainsForWindow.length > 0 &&
        domainsForWindow.every((domain) =>
          isPlanWindowInsidePhase(
            activePhaseForSelectedSeason,
            planStartDate,
            addDaysToDateString(
              planStartDate,
              generationDurationDaysForDomain(domain, durationDays) - 1,
            ),
          ),
        )
      );
    },
    [
      activePhaseForSelectedSeason,
      allowedGenerationDomains,
      durationDays,
      effectiveCoachGenerationDomain,
      isHeadCoachPlanningContextOwner,
      planStartDate,
    ],
  );

  const selectedGoalIdsSignature = useMemo(
    () => [...selectedGoalIds].sort().join("\0"),
    [selectedGoalIds],
  );

  const generationReadinessFromApis = useMemo(
    () =>
      readinessAllowsPlanGeneration({
        readinessStatus: readinessPanel.readinessStatus,
        isReady: readinessPanel.isReady,
        canGenerate: readinessPanel.canGenerate,
        blockers: readinessPanel.blockers,
      }),
    [
      readinessPanel.blockers,
      readinessPanel.canGenerate,
      readinessPanel.isReady,
      readinessPanel.readinessStatus,
    ],
  );

  const requiresPlanningContextLockForGeneration =
    setupState.hasHeadCoachConfigured &&
    !isHeadCoachPlanningContextOwner &&
    allowedGenerationDomains.length > 0;
  const UPSTREAM_CONTEXT_NOT_LOCKED_MESSAGE =
    "Waiting for locked planning context.";

  const resolveOwnershipFlagsForDomain = useCallback(
    (domain: TrainingPlanGenerationDomain): PlanGenerationOwnershipFlags =>
      mergePlanGenerationOwnershipForDomain(
        domain,
        planGenerationOwnershipByDomain[domain],
        assignedAthletePlanOwnership,
      ),
    [assignedAthletePlanOwnership, planGenerationOwnershipByDomain],
  );
  const resolveGeneratePermissionForDomain = useCallback(
    (domain: TrainingPlanGenerationDomain) =>
      resolveDomainGeneratePermission({
        assignmentDomainContext: workspace?.assignmentContext?.domains[domain],
        legacyOwnershipFlags: resolveOwnershipFlagsForDomain(domain),
      }),
    [resolveOwnershipFlagsForDomain, workspace?.assignmentContext?.domains],
  );

  const generatePlanLocalErrorsByDomain = useMemo(() => {
    const ownershipErrorForDomain = (
      domain: TrainingPlanGenerationDomain,
    ): string | null => {
      if (planOwnershipLoading) {
        return "Loading plan generation permissions.";
      }
      return !resolveGeneratePermissionForDomain(domain).canShowGenerate
        ? PLAN_GENERATION_NOT_ASSIGNED_MESSAGE
        : null;
    };
    const usesLockedDownstreamContextForDomain = (
      domain: TrainingPlanGenerationDomain,
    ): boolean =>
      shouldUseLockedDownstreamGenerationContext({
        hasHeadCoachConfigured: setupState.hasHeadCoachConfigured,
        isHeadCoachPlanningContextOwner,
        domain,
        effectiveDownstreamPlanningContextLocked,
      });
    const workspacePlanningContext = workspace?.planningContext ?? null;
    const workspaceLockedPlanningContext = workspacePlanningContext?.locked === true;
    const lockedGoalIds = readLockedWorkspaceGoalIds({
      selectedGoalsSnapshot: workspacePlanningContext?.selectedGoalsSnapshot,
      athletePlanningContextSnapshot:
        workspacePlanningContext?.athletePlanningContextSnapshot,
      goalIds: workspacePlanningContext?.goalIds,
      lockedGoalIds: workspacePlanningContext?.lockedGoalIds,
      fallbackGoalIds:
        upstreamPlanningContext?.planningContext.lockedGoalIds ??
        upstreamPlanningContext?.planningContext.goalIds ??
        upstreamPlanningContext?.goalIds ??
        [],
    });
    const lockedGoalCount = lockedGoalIds.filter(
      (goalId) => typeof goalId === "string" && goalId.trim() !== "",
    ).length;
    const lockedSeasonCycleId = trimmedNonEmpty(
      workspacePlanningContext?.selectedSeasonCycleId,
      workspacePlanningContext?.seasonCycleId,
      workspacePlanningContext?.selectedSeasonId,
      workspacePlanningContext?.seasonId,
      assistantLockedUpstreamDerived.lockedSeasonCycleId,
    );
    const lockedPlanWindowStart = trimmedNonEmpty(
      workspacePlanningContext?.planStartDate,
      workspacePlanningContext?.startDate,
      assistantLockedUpstreamDerived.lockedPlanWindowStart,
    );
    const lockedPlanWindowEnd = trimmedNonEmpty(
      workspacePlanningContext?.planEndDate,
      workspacePlanningContext?.endDate,
      assistantLockedUpstreamDerived.lockedPlanWindowEnd,
    );
    const lockedSportCode = assistantLockedUpstreamDerived.lockedSportCode;

    if (requiresPlanningContextLockForGeneration) {
      return Object.fromEntries(
        allowedGenerationDomains.map((domain) => {
          const blocked = ownershipErrorForDomain(domain);
          if (blocked !== null) return [domain, blocked] as const;
          if (!effectiveDownstreamPlanningContextLocked) {
            if (upstreamPlanningContextLoading) {
              return [domain, "Loading upstream planning context."] as const;
            }
            if (upstreamPlanningContextError !== null) {
              return [domain, upstreamPlanningContextError] as const;
            }
          }
          if (
            isCreatePlanBlockedByPlanningContextLock({
              domain,
              hasHeadCoachConfigured: setupState.hasHeadCoachConfigured,
              isHeadCoachPlanningContextOwner,
              planningContextLocked,
              upstreamContextLockedForDownstream: effectiveDownstreamPlanningContextLocked,
            })
          ) {
            return [domain, UPSTREAM_CONTEXT_NOT_LOCKED_MESSAGE] as const;
          }
          return [domain, null] as const;
        }),
      ) as Partial<Record<TrainingPlanGenerationDomain, string | null>>;
    }
    if (isDownstreamDomainCoach && allowedGenerationDomains.length === 1) {
      const only = allowedGenerationDomains[0];
      const generationPermission = resolveGeneratePermissionForDomain(only);
      const ownershipFlags = generationPermission.ownershipFlags;
      const ownBlock = planOwnershipLoading
        ? "Loading plan generation permissions."
        : !generationPermission.canShowGenerate
          ? PLAN_GENERATION_NOT_ASSIGNED_MESSAGE
          : null;
      if (ownBlock !== null) {
        return { [only]: ownBlock } as Partial<
          Record<TrainingPlanGenerationDomain, string | null>
        >;
      }
      if (!effectiveDownstreamPlanningContextLocked && upstreamPlanningContextLoading) {
        return { [only]: "Loading upstream planning context." } as Partial<
          Record<TrainingPlanGenerationDomain, string | null>
        >;
      }
      if (!effectiveDownstreamPlanningContextLocked && upstreamPlanningContextError !== null) {
        return { [only]: upstreamPlanningContextError } as Partial<
          Record<TrainingPlanGenerationDomain, string | null>
        >;
      }
      if (
        isCreatePlanBlockedByPlanningContextLock({
          domain: only,
          hasHeadCoachConfigured: setupState.hasHeadCoachConfigured,
          isHeadCoachPlanningContextOwner,
          planningContextLocked,
          upstreamContextLockedForDownstream: effectiveDownstreamPlanningContextLocked,
        })
      ) {
        return { [only]: UPSTREAM_CONTEXT_NOT_LOCKED_MESSAGE } as Partial<
          Record<TrainingPlanGenerationDomain, string | null>
        >;
      }
      if (entityId.trim() === "" || athleteIdTrimmed.trim() === "") {
        return { [only]: "Athlete route not available." } as Partial<
          Record<TrainingPlanGenerationDomain, string | null>
        >;
      }
      const shouldUseLockedPlanningContextForGeneration =
        usesLockedDownstreamContextForDomain(only);
      const canUseLockedPlanningContextForGeneration =
        canGenerateFromLockedPlanningContextForDomain({
          domain: only,
          effectiveDownstreamPlanningContextLocked,
          ownershipFlags,
          lockedSeasonCycleId,
          lockedPlanWindowStart,
          lockedPlanWindowEnd,
          lockedSportCode,
        });
      if (shouldUseLockedPlanningContextForGeneration) {
        const effectiveDurationDays = generationDurationDaysForDomain(only, durationDays);
        const effectivePlanEndDate = addDaysToDateString(
          planStartDate,
          effectiveDurationDays - 1,
        );
        return {
          [only]: resolveGeneratePlanLocalError({
            entityId,
            athleteId: athleteIdTrimmed,
            generationDomain: only,
            selectedSeasonCycleId,
            selectedGoalCount: lockedGoalCount,
            sportCode: lockedSportCode,
            selectedSeason,
            currentPhase: activePhaseForSelectedSeason,
            planStartDate,
            planEndDate: effectivePlanEndDate,
            canUseLockedPlanningContextForGeneration:
              canUseLockedPlanningContextForGeneration ||
              shouldUseLockedPlanningContextForGeneration,
            lockedSeasonCycleId,
            lockedPlanWindowStart,
            lockedPlanWindowEnd,
          }),
        } as Partial<Record<TrainingPlanGenerationDomain, string | null>>;
      }
      return { [only]: null } as Partial<Record<TrainingPlanGenerationDomain, string | null>>;
    }
    return Object.fromEntries(
      allowedGenerationDomains.map((domain) => {
        const generationPermission = resolveGeneratePermissionForDomain(domain);
        const ownershipFlags = generationPermission.ownershipFlags;
        const ownBlock = planOwnershipLoading
          ? "Loading plan generation permissions."
          : !generationPermission.canShowGenerate
            ? PLAN_GENERATION_NOT_ASSIGNED_MESSAGE
            : null;
        if (ownBlock !== null) {
          return [domain, ownBlock] as const;
        }
        const canUseLockedPlanningContextForGeneration =
          canGenerateFromLockedPlanningContextForDomain({
            domain,
            effectiveDownstreamPlanningContextLocked:
              workspaceLockedPlanningContext || effectiveDownstreamPlanningContextLocked,
            ownershipFlags,
            lockedSeasonCycleId,
            lockedPlanWindowStart,
            lockedPlanWindowEnd,
            lockedSportCode,
          });
        const shouldUseLockedPlanningContextForGeneration =
          workspaceLockedPlanningContext || usesLockedDownstreamContextForDomain(domain);
        const effectiveDurationDays = generationDurationDaysForDomain(domain, durationDays);
        const effectivePlanEndDate = addDaysToDateString(
          planStartDate,
          effectiveDurationDays - 1,
        );
        const blockerReason = resolveGeneratePlanLocalError({
          entityId,
          athleteId: athleteIdTrimmed,
          generationDomain: domain,
          selectedSeasonCycleId,
          selectedGoalCount: shouldUseLockedPlanningContextForGeneration
            ? lockedGoalCount
            : selectedActiveGoals.length,
          sportCode: shouldUseLockedPlanningContextForGeneration
            ? lockedSportCode
            : athleteSportCode,
          selectedSeason,
          currentPhase: activePhaseForSelectedSeason,
          planStartDate,
          planEndDate: effectivePlanEndDate,
          canUseLockedPlanningContextForGeneration:
            canUseLockedPlanningContextForGeneration ||
            shouldUseLockedPlanningContextForGeneration,
          lockedSeasonCycleId,
          lockedPlanWindowStart,
          lockedPlanWindowEnd,
        });
        logTrainingPlanGenerationBlockerDiagnostic({
          workspacePlanningContext,
          localSelectedGoalCount: selectedActiveGoals.length,
          blockerReason,
        });
        return [
          domain,
          blockerReason,
        ] as const;
      }),
    ) as Partial<Record<TrainingPlanGenerationDomain, string | null>>;
  }, [
    activePhaseForSelectedSeason,
    allowedGenerationDomains,
    assistantLockedUpstreamDerived.lockedPlanWindowEnd,
    assistantLockedUpstreamDerived.lockedPlanWindowStart,
    assistantLockedUpstreamDerived.lockedSeasonCycleId,
    assistantLockedUpstreamDerived.lockedSportCode,
    athleteIdTrimmed,
    effectiveDownstreamPlanningContextLocked,
    athleteSportCode,
    durationDays,
    entityId,
    isDownstreamDomainCoach,
    isHeadCoachPlanningContextOwner,
    planOwnershipLoading,
    planningContextLocked,
    planStartDate,
    requiresPlanningContextLockForGeneration,
    resolveGeneratePermissionForDomain,
    setupState.hasHeadCoachConfigured,
    selectedActiveGoals.length,
    selectedSeason,
    selectedSeasonCycleId,
    upstreamPlanningContext?.goalIds,
    upstreamPlanningContext?.planningContext.goalIds,
    upstreamPlanningContext?.planningContext.lockedGoalIds,
    upstreamPlanningContextError,
    upstreamPlanningContextLoading,
    workspace?.planningContext,
  ]);

  const skipMainReadinessForAssistantCreateGate = useMemo(
    () =>
      shouldSkipAssistantDomainReadinessGate({
        hasHeadCoachConfigured: setupState.hasHeadCoachConfigured,
        isHeadCoachPlanningContextOwner,
        currentDomain: currentCoachGenerationDomain,
        isDownstreamDomainCoach,
        planningContextLocked,
        upstreamContextLockedForDownstream: effectiveDownstreamPlanningContextLocked,
      }),
    [
      currentCoachGenerationDomain,
      effectiveDownstreamPlanningContextLocked,
      isDownstreamDomainCoach,
      isHeadCoachPlanningContextOwner,
      planningContextLocked,
      setupState.hasHeadCoachConfigured,
    ],
  );

  const generatePlanActionDisabled = useMemo(() => {
    const domainJob =
      currentCoachGenerationDomain === null
        ? null
        : (generatePlanJobsByDomain[currentCoachGenerationDomain] ?? null);
    const generationJobRunning = isGenerationJobInProgress(domainJob);
    const domain = currentCoachGenerationDomain;
    const ownershipFlags =
      domain === null
        ? { canGeneratePlan: null, canGenerateCurrentDomainPlan: null }
        : resolveGeneratePermissionForDomain(domain).ownershipFlags;
    if (
      shouldUseWorkflow1SpecialistCreateGate({
        hasHeadCoachConfigured: setupState.hasHeadCoachConfigured,
        isHeadCoachPlanningContextOwner,
        domain,
        effectiveDownstreamPlanningContextLocked,
        ownershipFlags,
      })
    ) {
      return resolveWorkflow1SpecialistCreateDisabled({
        generationJobRunning,
        planOwnershipLoading,
      });
    }
    const baseBusy =
      readinessLoading ||
      upstreamPlanningContextLoading ||
      workloadAssessmentLoading ||
      generationJobRunning ||
      planOwnershipLoading;
    return isAssistantDomainGeneratePlanDisabled({
      domain,
      baseBusy,
      skipMainReadinessForGenerationGate: skipMainReadinessForAssistantCreateGate,
      generationReadinessFromApis,
      ownershipFlags,
      hasHeadCoachConfigured: setupState.hasHeadCoachConfigured,
      isHeadCoachPlanningContextOwner,
      planningContextLocked,
      upstreamContextLockedForDownstream: effectiveDownstreamPlanningContextLocked,
    });
  }, [
    currentCoachGenerationDomain,
    effectiveDownstreamPlanningContextLocked,
    generatePlanJobsByDomain,
    generationReadinessFromApis,
    isHeadCoachPlanningContextOwner,
    planOwnershipLoading,
    planningContextLocked,
    readinessLoading,
    resolveGeneratePermissionForDomain,
    setupState.hasHeadCoachConfigured,
    skipMainReadinessForAssistantCreateGate,
    upstreamPlanningContextLoading,
    workloadAssessmentLoading,
  ]);

  const isHeadCoachReviewerOnlyForDomain = useCallback(
    (domain: TrainingPlanGenerationDomain | null | undefined): boolean => {
      if (!isHeadCoachPlanningContextOwner) return false;
      if (domain === null || domain === undefined) return false;
      return isPlanGenerationBlockedByOwnership(
        resolveOwnershipFlagsForDomain(domain),
      );
    },
    [isHeadCoachPlanningContextOwner, resolveOwnershipFlagsForDomain],
  );

  const shouldHidePersistedGeneratorPanel = useMemo(() => {
    if (!isHeadCoachPlanningContextOwner) return false;

    const persistedGenerationDomain =
      normalizeTrainingPlanGenerationDomain(
        persistedSkillsPlanDetail?.generationDomain ?? undefined,
      )
      ?? normalizeTrainingPlanGenerationDomain(persistedPlanDisplayDomain ?? undefined);

    /** Submitted-domain review is open — review panel owns content; hide generator persisted panel. */
    if (headCoachSubmittedReviewDomain !== null) return true;

    if (persistedGenerationDomain === null) return false;

    return isHeadCoachReviewerOnlyForDomain(persistedGenerationDomain);
  }, [
    headCoachSubmittedReviewDomain,
    isHeadCoachPlanningContextOwner,
    isHeadCoachReviewerOnlyForDomain,
    persistedPlanDisplayDomain,
    persistedSkillsPlanDetail?.generationDomain,
  ]);

  const showHeadCoachDomainGeneratorCreateActions = useMemo(() => {
    if (!isHeadCoachPlanningContextOwner) return true;
    return allowedGenerationDomains.some(
      (domain) => resolveGeneratePermissionForDomain(domain).canShowGenerate,
    );
  }, [
    allowedGenerationDomains,
    isHeadCoachPlanningContextOwner,
    resolveGeneratePermissionForDomain,
  ]);

  const headCoachOwnedSkillsDraft = useMemo(
    () => (latestDraftDomain === "SKILLS" ? latestSkillsDraft : null),
    [latestDraftDomain, latestSkillsDraft],
  );
  const headCoachOwnedSkillsActiveDetail = useMemo(
    () => (persistedDetailDomain === "SKILLS" ? persistedSkillsPlanDetail : null),
    [persistedDetailDomain, persistedSkillsPlanDetail],
  );
  const headCoachSkillsWorkflowStatus = useMemo(
    () => {
      if (headCoachSkillsOwnerWorkflow && workspace !== null) {
        return deriveWorkflowStatusFromWorkspaceDomain(workspace.domains.SKILLS);
      }
      return deriveAssistantDomainWorkflowStatus({
        latestDraft: headCoachOwnedSkillsDraft,
        activeDetail: headCoachOwnedSkillsActiveDetail,
      });
    },
    [
      headCoachOwnedSkillsActiveDetail,
      headCoachOwnedSkillsDraft,
      headCoachSkillsOwnerWorkflow,
      workspace,
    ],
  );
  const headCoachOwnedSkillsGrouping = useMemo(
    () =>
      resolveHeadCoachOwnedSkillsGrouping({
        workspace,
        legacyHeadCoachOwnsSkills: headCoachOwnsAssignedDomainGenerationForAthlete,
      }),
    [headCoachOwnsAssignedDomainGenerationForAthlete, workspace],
  );
  const headCoachSkillsPlanExists = useMemo(() => {
    if (workspace !== null) {
      return deriveWorkflowStatusFromWorkspaceDomain(workspace.domains.SKILLS) !== "not_created";
    }
    return headCoachSkillsWorkflowStatus !== "not_created";
  }, [headCoachSkillsWorkflowStatus, workspace]);
  const shouldShowLatestDraftPlanViewer =
    shouldLoadLatestSkillsDraft &&
    !(headCoachSkillsOwnerWorkflow && headCoachSkillsPlanExists);
  const workspaceHeadCoachSkillsCanCreate = useMemo(
    () => {
      if (workspace === null) return false;
      if (workspace.assignmentContext !== undefined) {
        const skillsGeneratePermission = resolveDomainGeneratePermission({
          assignmentDomainContext: workspace.assignmentContext.domains.SKILLS,
          legacyOwnershipFlags: resolveOwnershipFlagsForDomain("SKILLS"),
        });
        return (
          skillsGeneratePermission.canShowGenerate &&
          workspace.planningContext.locked &&
          !headCoachSkillsPlanExists
        );
      }
      return workspaceHeadCoachCanCreateSkillsPlan(workspace, headCoachSkillsPlanExists);
    },
    [
      headCoachSkillsPlanExists,
      resolveOwnershipFlagsForDomain,
      workspace,
    ],
  );
  const headCoachSkillsFallbackPlanId = useMemo(() => {
    const fromDetail = headCoachOwnedSkillsActiveDetail?.plan.id?.trim() ?? "";
    if (fromDetail !== "") return fromDetail;
    return headCoachOwnedSkillsDraft?.trainingPlanId?.trim() ?? "";
  }, [headCoachOwnedSkillsActiveDetail?.plan.id, headCoachOwnedSkillsDraft?.trainingPlanId]);
  const headCoachSkillsFallbackVersionId =
    headCoachOwnedSkillsActiveDetail?.version.id?.trim() ??
    headCoachOwnedSkillsDraft?.trainingPlanVersionId?.trim() ??
    "";
  const headCoachSkillsViewPlanContext = useMemo(
    () => {
      const context = resolveWorkspaceDomainViewPlanContext({
        workspace,
        domain: "SKILLS",
        fallbackPlanId: headCoachSkillsFallbackPlanId,
        fallbackVersionId: headCoachSkillsFallbackVersionId,
        fallbackStatus: headCoachSkillsWorkflowStatus,
        fallbackSource:
          headCoachOwnedSkillsActiveDetail !== null
            ? "headCoachOwnedSkillsActiveDetail"
            : headCoachOwnedSkillsDraft !== null
              ? "headCoachOwnedSkillsDraft"
              : undefined,
      });
      if (
        !resolveDomainViewPlanVisible({
          assignmentDomainContext: workspace?.assignmentContext?.domains.SKILLS,
          legacyCanOpen: context !== null,
          planId: context?.planId,
          versionId: context?.versionId,
        })
      ) {
        return null;
      }
      return context;
    },
    [
      headCoachOwnedSkillsActiveDetail,
      headCoachOwnedSkillsDraft,
      headCoachSkillsFallbackPlanId,
      headCoachSkillsFallbackVersionId,
      headCoachSkillsWorkflowStatus,
      workspace,
    ],
  );
  const headCoachSkillsCreateVisible = useMemo(
    () => {
      if (workspace) {
        if (workspace.assignmentContext !== undefined) {
          return workspaceHeadCoachSkillsCanCreate;
        }
        return workspaceHeadCoachCanCreateSkillsPlan(workspace, headCoachSkillsPlanExists);
      }
      return canHeadCoachCreateSkillsPlan({
        isHeadCoachPlanningContextOwner,
        planningContextLocked,
        allowedGenerationDomains,
        skillsOwnershipFlags: resolveOwnershipFlagsForDomain("SKILLS"),
        skillsPlanExists: headCoachSkillsPlanExists,
      });
    },
    [
      allowedGenerationDomains,
      headCoachSkillsPlanExists,
      isHeadCoachPlanningContextOwner,
      planningContextLocked,
      resolveOwnershipFlagsForDomain,
      workspace,
      workspaceHeadCoachSkillsCanCreate,
    ],
  );

  const headCoachSkillsCreateDisabled = useMemo(() => {
    const skillsJob = generatePlanJobsByDomain.SKILLS ?? null;
    const baseBusy =
      readinessLoading ||
      upstreamPlanningContextLoading ||
      workloadAssessmentLoading ||
      isGenerationJobInProgress(skillsJob) ||
      planOwnershipLoading;
    if (workspaceHeadCoachSkillsCanCreate) {
      return baseBusy;
    }
    return isGeneratePlanDisabledForDomain({
      domain: "SKILLS",
      baseBusy,
      generationReadinessFromApis,
      ownershipFlags: resolveGeneratePermissionForDomain("SKILLS").ownershipFlags,
      hasHeadCoachConfigured: setupState.hasHeadCoachConfigured,
      isHeadCoachPlanningContextOwner,
      planningContextLocked,
      upstreamContextLockedForDownstream,
    });
  }, [
    generatePlanJobsByDomain,
    generationReadinessFromApis,
    isHeadCoachPlanningContextOwner,
    planOwnershipLoading,
    planningContextLocked,
    readinessLoading,
    resolveGeneratePermissionForDomain,
    resolveOwnershipFlagsForDomain,
    setupState.hasHeadCoachConfigured,
    upstreamContextLockedForDownstream,
    upstreamPlanningContextLoading,
    workspaceHeadCoachSkillsCanCreate,
    workloadAssessmentLoading,
  ]);
  const currentDomainGenerationJob = useMemo(
    () =>
      currentCoachGenerationDomain === null
        ? null
        : (generatePlanJobsByDomain[currentCoachGenerationDomain] ?? null),
    [currentCoachGenerationDomain, generatePlanJobsByDomain],
  );
  const step6GenerationInProgress = useMemo(
    () => isGenerationJobInProgress(currentDomainGenerationJob),
    [currentDomainGenerationJob],
  );
  const step6GenerationLifecyclePhase = useMemo(
    () =>
      resolveStep6GenerationLifecyclePhase({
        generationInProgress: step6GenerationInProgress,
        hasExistingDomainPlan: hasExistingCurrentDomainPlan,
        persistedDetailLoaded:
          persistedDetailMatchesCurrentDomain && persistedSkillsPlanDetail !== null,
        latestDraftLoaded:
          latestDraftMatchesCurrentDomain && latestSkillsDraft !== null,
        generateSuccessLoaded:
          generateResultMatchesCurrentDomain && generatePlanSuccess !== null,
      }),
    [
      generatePlanSuccess,
      generateResultMatchesCurrentDomain,
      hasExistingCurrentDomainPlan,
      latestDraftMatchesCurrentDomain,
      latestSkillsDraft,
      persistedDetailMatchesCurrentDomain,
      persistedSkillsPlanDetail,
      step6GenerationInProgress,
    ],
  );
  const step6ShowsPreGenerationReadiness = useMemo(
    () =>
      shouldShowStep6PreGenerationReadiness({
        isDownstreamDomainCoach,
        lifecyclePhase: step6GenerationLifecyclePhase,
      }),
    [isDownstreamDomainCoach, step6GenerationLifecyclePhase],
  );
  const step6ShowsGeneratedDraftSummary = useMemo(
    () =>
      !isDownstreamDomainCoach &&
      step6GenerationLifecyclePhase === "generated_draft",
    [isDownstreamDomainCoach, step6GenerationLifecyclePhase],
  );
  const step6ShowsGenerateCreateActions = useMemo(
    () => step6GenerationLifecyclePhase !== "generated_draft",
    [step6GenerationLifecyclePhase],
  );
  const step6GeneratedDraftWorkflowStatus = useMemo(
    () => {
      if (headCoachSkillsOwnerWorkflow) return assistantDomainWorkflowStatus;
      return deriveAssistantDomainWorkflowStatus({
        latestDraft: latestDraftMatchesCurrentDomain ? latestSkillsDraft : null,
        activeDetail: persistedDetailMatchesCurrentDomain ? persistedSkillsPlanDetail : null,
      });
    },
    [
      assistantDomainWorkflowStatus,
      headCoachSkillsOwnerWorkflow,
      latestDraftMatchesCurrentDomain,
      latestSkillsDraft,
      persistedDetailMatchesCurrentDomain,
      persistedSkillsPlanDetail,
    ],
  );

  const seasonGoalsGateComplete =
    workloadComplete
    && selectedSeasonCycleId !== null
    && selectedGoalIds.length > 0;
  const planDatesWindowComplete =
    planStartDate.trim() !== ""
    && everyPlanWindowInsidePhaseForGeneration
    && planDatesWithinSelectedSeason;
  const planDatesStepComplete =
    workloadComplete
    && seasonGoalsGateComplete
    && planDatesWindowComplete
    && planDatesConfirmedForCurrentAthlete;
  const headCoachLockedContextStepComplete =
    headCoachReviewMode === true && planningContextLocked === true;
  const skillsCoachLockedContextStepComplete =
    trainingPlanShellModel.shell === "skills_coach_planning" &&
    effectiveSkillsPlanningContextLocked === true;
  const planningContextSetCase =
    headCoachLockedContextStepComplete === true ||
    skillsCoachLockedContextStepComplete === true;
  const appStepCompleteDep = appStepComplete ? true : false;
  const levelStepCompleteDep = levelStepComplete ? true : false;
  const workloadCompleteDep = workloadComplete ? true : false;
  const seasonGoalsGateCompleteDep = seasonGoalsGateComplete ? true : false;
  const planDatesStepCompleteDep = planDatesStepComplete ? true : false;
  const planningContextSetCaseDep = planningContextSetCase ? true : false;
  const readinessLoadingDep = readinessLoading ? true : false;
  const workloadAssessmentLoadingDep = workloadAssessmentLoading ? true : false;

  /** Latest draft or hydrated active/detail already tied to a persisted plan (no URL planId required). */
  const hasLatestOrHydratedPersistedTrainingPlanId = useMemo(
    () =>
      (latestDraftMatchesCurrentDomain &&
        (latestSkillsDraft?.trainingPlanId?.trim() ?? "") !== "") ||
      (generateResultMatchesCurrentDomain &&
        (generatePlanSuccess?.trainingPlanId?.trim() ?? "") !== "") ||
      (persistedDetailMatchesCurrentDomain &&
        (persistedSkillsPlanDetail?.plan.id?.trim() ?? "") !== ""),
    [
      generatePlanSuccess?.trainingPlanId,
      generateResultMatchesCurrentDomain,
      latestDraftMatchesCurrentDomain,
      latestSkillsDraft?.trainingPlanId,
      persistedDetailMatchesCurrentDomain,
      persistedSkillsPlanDetail?.plan.id,
    ],
  );

  /**
   * Tab / rail: unlock Generate when viewing a persisted plan from URL, plan dates are confirmed,
   * or a generated plan already exists for this athlete (latest draft id and/or hydrated detail).
   * Downstream Nutrition/S&C coaches skip plan-dates gating: unlock Generate after APP + level so
   * they land on their domain panel (readiness still gates execution).
   */
  const generateTabPrecSatisfied =
    (isDownstreamDomainCoach &&
      (requestedPlanId !== null ||
        urlPlanCandidate !== null ||
        (appStepComplete && levelStepComplete))) ||
    (!isDownstreamDomainCoach &&
      (requestedPlanId !== null ||
        urlPlanCandidate !== null ||
        planningContextSetCase ||
        planDatesStepComplete ||
        (requestedPlanId === null &&
          urlPlanCandidate === null &&
          hasLatestOrHydratedPersistedTrainingPlanId)));

  /**
   * Tick marks: backend-derived only — not selection/UI. When a persisted plan URL is present,
   * steps 1–6 all show tick for consistency.
   */
  const workflowStepCompleteForTick = useMemo(
    () =>
      requestedPlanId !== null
        ? ({
            "context-app": true,
            "level-validation": true,
            workload: true,
            "season-goals": true,
            "plan-dates": true,
            generate: true,
          } satisfies Record<GuidedWorkflowStepKey, boolean>)
        : isDownstreamDomainCoach
          ? ({
              "context-app": appStepComplete,
              "level-validation": levelStepComplete,
              workload: true,
              "season-goals": true,
              "plan-dates": true,
              generate: false,
            } satisfies Record<GuidedWorkflowStepKey, boolean>)
          : ({
              "context-app": appStepComplete,
              "level-validation": levelStepComplete,
              workload: workloadComplete,
              "season-goals":
                seasonGoalsGateComplete ||
                headCoachLockedContextStepComplete ||
                skillsCoachLockedContextStepComplete,
              "plan-dates":
                planDatesStepComplete ||
                headCoachLockedContextStepComplete ||
                skillsCoachLockedContextStepComplete,
              generate: false,
            } satisfies Record<GuidedWorkflowStepKey, boolean>),
    [
      appStepComplete,
      headCoachLockedContextStepComplete,
      isDownstreamDomainCoach,
      levelStepComplete,
      planDatesStepComplete,
      requestedPlanId,
      seasonGoalsGateComplete,
      skillsCoachLockedContextStepComplete,
      workloadComplete,
    ],
  );

  const workflowPrecMap = useMemo(
    () =>
      (isDownstreamDomainCoach
        ? {
            "context-app": true,
            "level-validation": appStepComplete,
            workload: true,
            "season-goals": true,
            "plan-dates": true,
            generate: generateTabPrecSatisfied,
          }
        : {
            "context-app": true,
            "level-validation": appStepComplete,
            workload: levelStepComplete,
            "season-goals": workloadComplete,
            "plan-dates":
              seasonGoalsGateComplete ||
              headCoachLockedContextStepComplete ||
              skillsCoachLockedContextStepComplete,
            generate: generateTabPrecSatisfied,
          }) satisfies Record<GuidedWorkflowStepKey, boolean>,
    [
      appStepComplete,
      generateTabPrecSatisfied,
      headCoachLockedContextStepComplete,
      isDownstreamDomainCoach,
      levelStepComplete,
      seasonGoalsGateComplete,
      skillsCoachLockedContextStepComplete,
      workloadComplete,
    ],
  );

  const prevWorkflowCompletionRef = useRef<{
    app: boolean;
    level: boolean;
    workload: boolean;
    seasonGoals: boolean;
    planDates: boolean;
  } | null>(null);
  const workflowInitialTabResolvedRef = useRef(false);
  /**
   * One-time resume to Step 6 per athlete/entity/domain/plan id so we do not fight manual tab
   * selection, while still opening Generate after refresh/login once a plan exists.
   */
  const workflowResumeToGenerateConsumedRef = useRef<string | null>(null);
  /** One-time jump to Generate for downstream coaches after APP + level (per athlete/entity). */
  const downstreamWorkflowLandGenerateConsumedRef = useRef<string | null>(null);

  const [selectedWorkflowTab, setSelectedWorkflowTab] =
    useState<GuidedWorkflowStepKey>(() =>
      urlPlanCandidate !== null ? "generate" : "context-app",
    );
  const [showLockedContextBuilderView, setShowLockedContextBuilderView] = useState(false);
  const selectedWorkflowTabDep = selectedWorkflowTab;

  const clearContextBuilderDrawerCloseTimeout = useCallback(() => {
    if (contextBuilderDrawerCloseTimeoutRef.current === null) return;
    clearTimeout(contextBuilderDrawerCloseTimeoutRef.current);
    contextBuilderDrawerCloseTimeoutRef.current = null;
  }, []);

  const clearDomainReviewDrawerCloseTimeout = useCallback(() => {
    if (domainReviewDrawerCloseTimeoutRef.current === null) return;
    clearTimeout(domainReviewDrawerCloseTimeoutRef.current);
    domainReviewDrawerCloseTimeoutRef.current = null;
  }, []);

  const handleOpenDomainReviewDrawer = useCallback(
    (domain: TrainingPlanGenerationDomain) => {
      clearDomainReviewDrawerCloseTimeout();
      setDomainReviewDrawerClosing(false);
      setDomainReviewDrawerDomain(domain);
      setDomainReviewDrawerOpen(true);
    },
    [clearDomainReviewDrawerCloseTimeout],
  );

  const handleCloseDomainReviewDrawer = useCallback(() => {
    if (!domainReviewDrawerOpen || domainReviewDrawerClosing) return;
    clearDomainReviewDrawerCloseTimeout();
    setDomainReviewDrawerClosing(true);
    domainReviewDrawerCloseTimeoutRef.current = setTimeout(() => {
      setDomainReviewDrawerOpen(false);
      setDomainReviewDrawerDomain(null);
      setDomainReviewDrawerClosing(false);
      domainReviewDrawerCloseTimeoutRef.current = null;
    }, DOMAIN_REVIEW_DRAWER_ANIMATION_MS);
  }, [
    clearDomainReviewDrawerCloseTimeout,
    domainReviewDrawerClosing,
    domainReviewDrawerOpen,
  ]);

  const handleCloseContextBuilderDrawer = useCallback(() => {
    if (contextBuilderDrawerStep === null || contextBuilderDrawerClosing) return;
    clearContextBuilderDrawerCloseTimeout();
    setContextBuilderDrawerClosing(true);
    contextBuilderDrawerCloseTimeoutRef.current = setTimeout(() => {
      setContextBuilderDrawerStep(null);
      setContextBuilderDrawerClosing(false);
      contextBuilderDrawerCloseTimeoutRef.current = null;
    }, CONTEXT_BUILDER_DRAWER_ANIMATION_MS);
  }, [
    clearContextBuilderDrawerCloseTimeout,
    contextBuilderDrawerClosing,
    contextBuilderDrawerStep,
  ]);

  useEffect(() => {
    if (contextBuilderDrawerStep === null || isContextBuilderStep(selectedWorkflowTab)) return;
    clearContextBuilderDrawerCloseTimeout();
    setContextBuilderDrawerStep(null);
    setContextBuilderDrawerClosing(false);
  }, [clearContextBuilderDrawerCloseTimeout, contextBuilderDrawerStep, selectedWorkflowTab]);

  useEffect(() => {
    if (contextBuilderDrawerStep === null) return;
    function handleDrawerKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleCloseContextBuilderDrawer();
      }
    }
    document.addEventListener("keydown", handleDrawerKeyDown);
    return () => {
      document.removeEventListener("keydown", handleDrawerKeyDown);
    };
  }, [contextBuilderDrawerClosing, contextBuilderDrawerStep, handleCloseContextBuilderDrawer]);

  useEffect(() => {
    if (!domainReviewDrawerOpen) return;
    function handleDrawerKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleCloseDomainReviewDrawer();
      }
    }
    document.addEventListener("keydown", handleDrawerKeyDown);
    return () => {
      document.removeEventListener("keydown", handleDrawerKeyDown);
    };
  }, [domainReviewDrawerOpen, handleCloseDomainReviewDrawer]);

  useEffect(() => {
    if (selectedWorkflowTab === "generate") return;
    setShowLockedContextBuilderView(false);
  }, [selectedWorkflowTab]);

  useEffect(() => {
    if (!domainReviewDrawerOpen) return;
    if (selectedWorkflowTab === "generate" && headCoachReviewMode) return;
    clearDomainReviewDrawerCloseTimeout();
    setDomainReviewDrawerOpen(false);
    setDomainReviewDrawerDomain(null);
    setDomainReviewDrawerClosing(false);
  }, [
    clearDomainReviewDrawerCloseTimeout,
    domainReviewDrawerOpen,
    headCoachReviewMode,
    selectedWorkflowTab,
  ]);

  useEffect(() => {
    if (!headCoachReviewMode) return;
    if (!headCoachFunctionAwareMode) return;
    if (!headCoachSkillsCreateVisible) return;
    if (headCoachSubmittedReviewDomain !== null) return;
    setHeadCoachSubmittedReviewDomain("SKILLS");
  }, [
    headCoachFunctionAwareMode,
    headCoachReviewMode,
    headCoachSkillsCreateVisible,
    headCoachSubmittedReviewDomain,
  ]);

  useEffect(() => {
    return () => {
      clearContextBuilderDrawerCloseTimeout();
      clearDomainReviewDrawerCloseTimeout();
    };
  }, [clearContextBuilderDrawerCloseTimeout, clearDomainReviewDrawerCloseTimeout]);

  const step6WorkflowOrchestrationActive =
    accessGateReady &&
    selectedWorkflowTab === "generate" &&
    generateTabPrecSatisfied;

  const step6WorkflowStripModel = useMemo(() => {
    if (!step6WorkflowOrchestrationActive) {
      return { kind: "inactive" as const };
    }
    if (step6GenerationInProgress) {
      return { kind: "generating" as const };
    }
    const planId = resolvedWorkflowPlanId;
    const domain = resolvedWorkflowGenerationDomain;
    if (planId === "") {
      return { kind: "no_plan" as const };
    }
    if (
      headCoachSkillsOwnerWorkflow &&
      workflowActionContext !== null &&
      workflowActionContext.generationDomain === "SKILLS"
    ) {
      return workflowActionContext.allowedActions.length > 0
        ? { kind: "actions" as const }
        : { kind: "workspace_status" as const, context: workflowActionContext };
    }

    const urlDrivesThisPlan =
      !isDownstreamDomainCoach && urlPlanCandidate?.trim() === planId;
    if (urlDrivesThisPlan) {
      if (setupLoading && persistedPlanQueryDomain === null) {
        return { kind: "loading" as const };
      }
      if (!setupLoading && persistedPlanQueryDomain === null) {
        return {
          kind: "missing_domain" as const,
          message:
            "No coach generation domain (SKILLS, NUTRITION, or S_AND_C) is available yet. Add a generation function before loading workflow actions for this saved plan URL.",
        };
      }
      if (persistedSkillsPlanLoading) {
        return { kind: "loading" as const };
      }
      if (persistedSkillsPlanError) {
        return { kind: "error" as const, message: persistedSkillsPlanError };
      }
      const urlDetail = persistedSkillsPlanDetail;
      if (urlDetail?.plan.id?.trim() === planId) {
        const urlActions = new Set(urlDetail.allowedActions ?? []);
        if (urlActions.size > 0) {
          return { kind: "actions" as const };
        }
        return { kind: "empty" as const, detail: urlDetail };
      }
      return { kind: "loading" as const };
    }

    if (step6WorkflowInternalLoading) {
      return { kind: "loading" as const };
    }
    if (step6WorkflowInternalError) {
      return { kind: "error" as const, message: step6WorkflowInternalError };
    }

    const nonUrlDetail = persistedSkillsPlanDetail;
    const detailMatchesNonUrl =
      nonUrlDetail !== null &&
      nonUrlDetail.plan.id?.trim() === planId &&
      persistedVerifiedDomain === domain;
    if (detailMatchesNonUrl) {
      const nonUrlActions = new Set(nonUrlDetail.allowedActions ?? []);
      if (nonUrlActions.size > 0) {
        return { kind: "actions" as const };
      }
      return { kind: "empty" as const, detail: nonUrlDetail };
    }

    return { kind: "loading" as const };
  }, [
    persistedPlanQueryDomain,
    isDownstreamDomainCoach,
    persistedSkillsPlanDetail,
    persistedSkillsPlanError,
    persistedSkillsPlanLoading,
    persistedVerifiedDomain,
    resolvedWorkflowGenerationDomain,
    resolvedWorkflowPlanId,
    setupLoading,
    headCoachSkillsOwnerWorkflow,
    step6GenerationInProgress,
    step6WorkflowInternalError,
    step6WorkflowInternalLoading,
    step6WorkflowOrchestrationActive,
    urlPlanCandidate,
    workflowActionContext,
  ]);

  useEffect(() => {
    latestSkillsDraftRequestGenRef.current += 1;
    prevUrlPlanForPersistedSyncRef.current = undefined;
    coachDomainStateResetRef.current = null;
    step6WorkflowFetchGenRef.current += 1;
    assistantDomainSummaryHydrationGenRef.current += 1;
    setAssistantDomainSummaryHydrationPending(false);
    workflowStep6FetchFailedForKeyRef.current = null;
    setStep6WorkflowInternalError(null);
    setStep6WorkflowInternalLoading(false);
    setWorkflowRequestedPlanId(null);
    setReleasedPlanViewerIntent(null);
    setReleasedPlanViewerVisibleDetail(null);
    setPersistedSkillsPlanDetail(null);
    setPersistedVerifiedDomain(null);
    setHeadCoachSubmittedReviewDomain(null);
    setPersistedSkillsPlanError(null);
    setPersistedSkillsPlanLoading(false);
    setGovernedPlanActionLoading(null);
    setGovernedPlanActionError(null);
    setGovernedPlanActionSuccess(null);
    setAssistantGovernedDetailRefreshing(false);
    setLatestSkillsDraft(null);
    setLatestDraftDomain(null);
    setLatestSkillsDraftRequestState("idle");
    setLatestSkillsDraftMissing(false);
    setLatestSkillsDraftError(null);
    setUpstreamPlanningContext(null);
    setUpstreamPlanningContextLoading(false);
    setUpstreamPlanningContextError(null);
    workspaceRefreshGenRef.current += 1;
    setWorkspaceLoading(false);
    setWorkspaceRefreshing(false);
    workspaceHasLoadedRef.current = false;
    setWorkspace(null);
    setWorkspaceLoading(false);
    setWorkspaceError(null);
    setPlanningContextBootstrapState("idle");
    setCachedLockedPlanWindow(null);
    setPlanningContextLockLoading(false);
    setPlanningContextLockError(null);
    setPlanningContextLockSuccess(null);
    setHeadCoachDomainPlanStates(createEmptyHeadCoachDomainPlanStates());
    setSubmittedDomainPlansBootstrapState("idle");
    knownDomainPlanIdsRef.current = { SKILLS: "", NUTRITION: "", S_AND_C: "" };
    setSelectedSeasonCycleId(null);
    setSelectedGoalIds([]);
    setWorkloadAssessmentResult(null);
    setWorkloadAssessmentCapturedForAthleteId(null);
    setWorkloadAssessmentExplicitlyRunForAthleteId(null);
    setWorkloadAssessmentError(null);
    setShowWorkloadCompletionState(false);
    if (workloadCompletionHoldTimeoutRef.current !== null) {
      window.clearTimeout(workloadCompletionHoldTimeoutRef.current);
      workloadCompletionHoldTimeoutRef.current = null;
    }
    setPlanDatesConfirmedForCurrentAthlete(false);
    setSeasonCreateFormExplicit(false);
    setSelectedWorkflowTab("context-app");
    workflowInitialTabResolvedRef.current = false;
    prevWorkflowCompletionRef.current = null;
    workflowResumeToGenerateConsumedRef.current = null;
    downstreamWorkflowLandGenerateConsumedRef.current = null;
    setAssignedAthletePlanOwnership(null);
  }, [athleteIdTrimmed, entityId]);

  useEffect(() => {
    if (!trainingPlanShellModel.ready) return;
    const resetScopeWorkflowMode = resolveWorkflowResetScopeMode({
      workspace,
      isHeadCoachPlanningContextOwner,
      planningContextLocked,
      workflowMode: trainingPlanShellModel.workflowMode,
    });
    const scopedKey = buildCoachWorkflowResetScopeKey({
      athleteId: athleteIdTrimmed,
      entityId,
      coachUserId: currentCoachUserId,
      activeRole: currentActiveRole,
      domain: resolveWorkflowReviewResetScopeDomain({
        shell: trainingPlanShellModel.shell,
        workflowShape: workspace?.workflowShape,
        currentCoachGenerationDomain,
      }),
      workflowMode: resetScopeWorkflowMode,
    });
    if (coachDomainStateResetRef.current === null) {
      coachDomainStateResetRef.current = scopedKey;
      return;
    }
    if (coachDomainStateResetRef.current === scopedKey) return;

    coachDomainStateResetRef.current = scopedKey;
    latestSkillsDraftRequestGenRef.current += 1;
    assistantDomainSummaryHydrationGenRef.current += 1;
    setAssistantDomainSummaryHydrationPending(false);
    step6WorkflowFetchGenRef.current += 1;
    workflowStep6FetchFailedForKeyRef.current = null;
    setStep6WorkflowInternalError(null);
    setStep6WorkflowInternalLoading(false);
    setReleasedPlanViewerIntent(null);
    setReleasedPlanViewerVisibleDetail(null);
    setPersistedSkillsPlanDetail(null);
    setPersistedVerifiedDomain(null);
    setPersistedSkillsPlanError(null);
    setPersistedSkillsPlanLoading(false);
    setAssistantGovernedDetailRefreshing(false);
    setLatestSkillsDraft(null);
    setLatestDraftDomain(null);
    setLatestSkillsDraftRequestState("idle");
    setLatestSkillsDraftMissing(false);
    setLatestSkillsDraftError(null);
    setGeneratePlanSuccess(null);
    setGeneratePlanSuccessDomain(null);
    setGeneratePlanError(null);
    setGeneratePlanRecoveryMessage(null);
    setPlanningContextLockError(null);
    setPlanningContextLockSuccess(null);
    setHeadCoachDomainPlanStates(createEmptyHeadCoachDomainPlanStates());
    setSubmittedDomainPlansBootstrapState("idle");
    knownDomainPlanIdsRef.current = { SKILLS: "", NUTRITION: "", S_AND_C: "" };
    setHeadCoachSubmittedReviewDomain(null);
    setAssistantRevisePanelDomain(null);
    setRequestRevisionModalOpen(false);
    setRequestRevisionFeedback("");
    setSelectedWorkflowTab("context-app");
    workflowInitialTabResolvedRef.current = false;
    prevWorkflowCompletionRef.current = null;
    workflowResumeToGenerateConsumedRef.current = null;
    downstreamWorkflowLandGenerateConsumedRef.current = null;
  }, [
    athleteIdTrimmed,
    currentActiveRole,
    currentCoachGenerationDomain,
    currentCoachUserId,
    entityId,
    isHeadCoachPlanningContextOwner,
    planningContextLocked,
    trainingPlanShellModel.ready,
    trainingPlanShellModel.shell,
    trainingPlanShellModel.workflowMode,
    workspace,
  ]);

  useEffect(() => {
    let cancelled = false;
    if (
      !assignmentBootstrapReady ||
      entityId === "" ||
      athleteIdTrimmed === ""
    ) {
      setUpstreamPlanningContext(null);
      setUpstreamPlanningContextLoading(false);
      setUpstreamPlanningContextError(null);
      setCachedLockedPlanWindow(null);
      setPlanningContextBootstrapState("idle");
      return;
    }
    if (!planningContextRequiredForBootstrap) {
      setUpstreamPlanningContext(null);
      setUpstreamPlanningContextLoading(false);
      setUpstreamPlanningContextError(null);
      setCachedLockedPlanWindow(null);
      setPlanningContextBootstrapState("loaded");
      return;
    }

    setUpstreamPlanningContextLoading(true);
    setUpstreamPlanningContextError(null);
    setPlanningContextBootstrapState("loading");
    void (async () => {
      try {
        const context = await fetchCoachAthleteUpstreamPlanningContext(
          entityId,
          athleteIdTrimmed,
        );
        if (cancelled) return;
        setUpstreamPlanningContext(context);
        if (context.planningContextLocked === true) {
          const startDate =
            context.planWindow?.startDate ?? context.startDate ?? null;
          const endDate =
            context.planWindow?.endDate ?? context.endDate ?? null;
          if (startDate || endDate) {
            setCachedLockedPlanWindow({ startDate, endDate });
          }
        }
        setPlanningContextBootstrapState("loaded");
      } catch (e) {
        if (cancelled) return;
        setUpstreamPlanningContext(null);
        setUpstreamPlanningContextError(
          formatApiError(
            e,
            "Could not load upstream planning context. Please try again shortly.",
          ),
        );
        setPlanningContextBootstrapState("error");
      } finally {
        if (!cancelled) {
          setUpstreamPlanningContextLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    assignmentBootstrapReady,
    athleteIdTrimmed,
    entityId,
    planningContextRequiredForBootstrap,
  ]);

  useEffect(() => {
    if (trainingPlanShellModel.shell !== "skills_coach_planning") return;
    if (!skillsOwnedContextHasPlanWindow) return;
    const contextStart =
      upstreamPlanningContext?.planWindow?.startDate ??
      upstreamPlanningContext?.startDate ??
      null;
    const contextEnd =
      upstreamPlanningContext?.planWindow?.endDate ??
      upstreamPlanningContext?.endDate ??
      null;
    if (contextStart === null || contextEnd === null) return;
    if (contextStart !== planStartDate) {
      setPlanStartDate(contextStart);
    }
    setCachedLockedPlanWindow({ startDate: contextStart, endDate: contextEnd });
  }, [
    planStartDate,
    skillsOwnedContextHasPlanWindow,
    trainingPlanShellModel.shell,
    upstreamPlanningContext?.planWindow?.startDate,
    upstreamPlanningContext?.planWindow?.endDate,
    upstreamPlanningContext?.startDate,
    upstreamPlanningContext?.endDate,
  ]);

  useEffect(() => {
    if (
      !assignmentBootstrapReady ||
      entityId === "" ||
      athleteIdTrimmed === "" ||
      !isHeadCoachPlanningContextOwner
    ) {
      setHeadCoachDomainPlanStates(createEmptyHeadCoachDomainPlanStates());
      setSubmittedDomainPlansBootstrapState("idle");
      return;
    }
    if (!isTerminalBootstrapLoadState(planningContextBootstrapState)) {
      setSubmittedDomainPlansBootstrapState("idle");
      return;
    }

    let cancelled = false;
    setSubmittedDomainPlansBootstrapState("loading");
    setHeadCoachDomainPlanStates((prev) => ({
      SKILLS: { ...prev.SKILLS, loading: true, error: null },
      NUTRITION: { ...prev.NUTRITION, loading: true, error: null },
      S_AND_C: { ...prev.S_AND_C, loading: true, error: null },
    }));

    void (async () => {
      const nextStates = createEmptyHeadCoachDomainPlanStates();
      let domainSummary: DomainPlanSummary | null = null;

      try {
        domainSummary = await fetchDomainPlanSummary(entityId, athleteIdTrimmed);
      } catch (e) {
        const summaryError = formatApiError(e, "Could not load domain plan summary.");
        for (const domain of GENERATION_DOMAIN_ORDER) {
          nextStates[domain].error = summaryError;
        }
      }

      await Promise.all(
        GENERATION_DOMAIN_ORDER.map(async (domain) => {
          const legacySummary = domainSummary?.[domain] ?? {
            trainingPlanId: null,
            versionId: null,
            latestVersionId: null,
            approvedVersionId: null,
            activeVersionId: null,
            versionNumber: null,
            status: null,
            generationDomain: domain,
          };
          const summarySource = resolveHeadCoachReviewSummarySource({
            workspace,
            domain,
            legacySummary,
          });
          const summaryVersionId = summarySource.versionId;
          const summaryPlanId = summarySource.planId;
          let versions: CoachPersistedTrainingPlanVersion[] = [];

          nextStates[domain].summaryPlanId = summaryPlanId;
          nextStates[domain].summaryVersionId = summaryVersionId;

          if (summaryPlanId !== null && summaryPlanId !== "") {
            knownDomainPlanIdsRef.current[domain] = summaryPlanId;
            if (summaryVersionId !== null || (summarySource.status?.trim() ?? "") === "") {
              try {
                versions = await fetchPersistedTrainingPlanVersions(summaryPlanId);
              } catch (e) {
                if (nextStates[domain].error === null) {
                  nextStates[domain].error = formatApiError(
                    e,
                    `Could not load persisted versions for ${trainingPlanDomainLabel(domain)}.`,
                  );
                }
              }
            }
          }
          nextStates[domain].summaryStatus = resolveHeadCoachDomainSummaryStatus({
            summaryStatus: summarySource.status,
            activeDetail: null,
            versions,
            summaryVersionId,
          });
        }),
      );

      if (!cancelled) {
        setHeadCoachDomainPlanStates((prev) => ({
          SKILLS: {
            ...nextStates.SKILLS,
            latestDraft: nextStates.SKILLS.latestDraft ?? prev.SKILLS.latestDraft,
            activeDetail: resolveHeadCoachReviewActiveDetailAfterRefresh({
              refreshedActiveDetail: null,
              previousActiveDetail: prev.SKILLS.activeDetail,
              summaryPlanId: nextStates.SKILLS.summaryPlanId,
              preservePreviousDetail: true,
            }),
          },
          NUTRITION: {
            ...nextStates.NUTRITION,
            latestDraft: nextStates.NUTRITION.latestDraft ?? prev.NUTRITION.latestDraft,
            activeDetail: resolveHeadCoachReviewActiveDetailAfterRefresh({
              refreshedActiveDetail: null,
              previousActiveDetail: prev.NUTRITION.activeDetail,
              summaryPlanId: nextStates.NUTRITION.summaryPlanId,
              preservePreviousDetail: true,
            }),
          },
          S_AND_C: {
            ...nextStates.S_AND_C,
            latestDraft: nextStates.S_AND_C.latestDraft ?? prev.S_AND_C.latestDraft,
            activeDetail: resolveHeadCoachReviewActiveDetailAfterRefresh({
              refreshedActiveDetail: null,
              previousActiveDetail: prev.S_AND_C.activeDetail,
              summaryPlanId: nextStates.S_AND_C.summaryPlanId,
              preservePreviousDetail: true,
            }),
          },
        }));
        setSubmittedDomainPlansBootstrapState("loaded");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    assignmentBootstrapReady,
    athleteIdTrimmed,
    entityId,
    isHeadCoachPlanningContextOwner,
    planningContextBootstrapState,
    workspace,
  ]);

  useEffect(() => {
    setPlanDatesConfirmedForCurrentAthlete(false);
  }, [selectedSeasonCycleId, selectedGoalIdsSignature]);

  useEffect(() => {
    setGovernedPlanActionLoading(null);
    setGovernedPlanActionError(null);
    setGovernedPlanActionSuccess(null);
  }, [requestedPlanIdDep, persistedPlanVersionIdDep]);

  useEffect(() => {
    return () => {
      if (workloadCompletionHoldTimeoutRef.current !== null) {
        window.clearTimeout(workloadCompletionHoldTimeoutRef.current);
        workloadCompletionHoldTimeoutRef.current = null;
      }
    };
  }, []);

  /** Existing plan/context entry (`planId` or locked planning context) → Tab 6 (Generate). */
  useEffect(() => {
    if (!trainingPlanShellModel.ready) return;
    if (shouldResolveSpecialistDomainWorkspace) return;
    if (
      requestedPlanIdDep !== null ||
      urlPlanCandidateDep !== null ||
      planningContextSetCaseDep
    ) {
      setSelectedWorkflowTab("generate");
    }
  }, [
    planningContextSetCaseDep,
    requestedPlanIdDep,
    shouldResolveSpecialistDomainWorkspace,
    trainingPlanShellModel.ready,
    urlPlanCandidateDep,
  ]);

  const refreshPersistedPlanDetail = useCallback(
    async (
      planId: string,
      generationDomain: TrainingPlanGenerationDomain,
      options?: { updateWorkflowRequestedPlanId?: boolean },
    ): Promise<CoachPersistedTrainingPlanActiveDetail | null> => {
      const updateWorkflowRequestedPlanId = options?.updateWorkflowRequestedPlanId !== false;
      const detail = await fetchPersistedTrainingPlanActiveDetail(
        planId,
        generationDomain,
      );
      const owner = detail.plan.athleteId?.trim() ?? "";
      if (owner !== "" && owner !== athleteIdTrimmed) {
        setWorkflowRequestedPlanId(null);
        setReleasedPlanViewerIntent(null);
        setReleasedPlanViewerVisibleDetail(null);
        setPersistedSkillsPlanDetail(null);
        setPersistedSkillsPlanError(null);
        setPersistedPlanErrorDomain(null);
        router.replace(planningProfileHrefForAthlete(athleteIdTrimmed));
        return null;
      }
      if (updateWorkflowRequestedPlanId) {
        setWorkflowRequestedPlanId(planId);
      }
      setPersistedSkillsPlanDetail(detail);
      setPersistedVerifiedDomain(generationDomain);
      setPersistedSkillsPlanError(null);
      setPersistedPlanErrorDomain(null);
      setGeneratePlanError(null);
      return detail;
    },
    [athleteIdTrimmed, router],
  );

  const reconcileRevisedDomainPlanDetail = useCallback(
    async (
      domain: TrainingPlanGenerationDomain,
      result: TrainingPlanReviseResult,
      fallbackPlanId: string,
    ): Promise<CoachPersistedTrainingPlanActiveDetail | null> => {
      const resultPlanId = result.planId?.trim() ?? "";
      const planId = resultPlanId !== "" ? resultPlanId : fallbackPlanId.trim();
      let detail = result.detail;

      if (detail === null && planId !== "") {
        detail = await refreshPersistedPlanDetail(planId, domain, {
          updateWorkflowRequestedPlanId: requestedPlanId !== null,
        });
      } else if (detail !== null) {
        setPersistedSkillsPlanDetail(detail);
        setPersistedVerifiedDomain(domain);
        setPersistedSkillsPlanError(null);
        setPersistedPlanErrorDomain(null);
        setGeneratePlanError(null);
      }

      if (detail === null) return null;

      knownDomainPlanIdsRef.current[domain] = detail.plan.id.trim();
      setHeadCoachDomainPlanStates((prev) => ({
        ...prev,
        [domain]: {
          ...prev[domain],
          loading: false,
          error: null,
          activeDetail: detail,
          summaryStatus: detail.version.status ?? detail.plan.status ?? prev[domain].summaryStatus,
          summaryPlanId: detail.plan.id.trim(),
          summaryVersionId: detail.version.id.trim(),
        },
      }));

      return detail;
    },
    [refreshPersistedPlanDetail, requestedPlanId],
  );

  useEffect(() => {
    if (!accessGateReady) return;
    if (!headCoachSkillsOwnerWorkflow) return;
    if (selectedWorkflowTab !== "generate" || !generateTabPrecSatisfied) return;
    const context = headCoachSkillsViewPlanContext;
    if (context === null || context.planId.trim() === "") return;
    const currentPlanId = headCoachOwnedSkillsActiveDetail?.plan.id?.trim() ?? "";
    const currentVersionId = headCoachOwnedSkillsActiveDetail?.version.id?.trim() ?? "";
    const contextVersionId = context.versionId.trim();
    if (
      currentPlanId === context.planId.trim() &&
      (contextVersionId === "" || currentVersionId === contextVersionId)
    ) {
      return;
    }

    void (async () => {
      try {
        await refreshPersistedPlanDetail(context.planId, "SKILLS", {
          updateWorkflowRequestedPlanId: false,
        });
      } catch (e) {
        setPersistedSkillsPlanError(formatApiError(e, "Could not load Skills plan."));
        setPersistedPlanErrorDomain("SKILLS");
      }
    })();
  }, [
    accessGateReady,
    generateTabPrecSatisfied,
    headCoachOwnedSkillsActiveDetail?.plan.id,
    headCoachOwnedSkillsActiveDetail?.version.id,
    headCoachSkillsOwnerWorkflow,
    headCoachSkillsViewPlanContext,
    refreshPersistedPlanDetail,
    selectedWorkflowTab,
  ]);

  async function openReleasedDomainPlanViewer(
    domain: TrainingPlanGenerationDomain,
    context: WorkspaceDomainViewPlanContext | null,
  ) {
    if (headCoachReviewMode) {
      setHeadCoachSubmittedReviewDomain(domain);
    }
    logTrainingPlanViewPlanDiagnostic({
      clickedDomain: domain,
      workspace,
      context,
    });
    if (context === null || context.planId.trim() === "") {
      setPersistedSkillsPlanError(
        `Could not open ${trainingPlanDomainLabel(domain)} because no saved plan id is available.`,
      );
      setPersistedPlanErrorDomain(domain);
      return;
    }
    if (
      !resolveDomainViewPlanVisible({
        assignmentDomainContext: workspace?.assignmentContext?.domains[domain],
        legacyCanOpen: true,
        planId: context.planId,
        versionId: context.versionId,
      })
    ) {
      setPersistedSkillsPlanError(
        `Could not open ${trainingPlanDomainLabel(domain)} because plan access is unavailable.`,
      );
      setPersistedPlanErrorDomain(domain);
      return;
    }

    setShowLockedContextBuilderView(false);
    if (domainReviewDrawerOpen) {
      clearDomainReviewDrawerCloseTimeout();
      setDomainReviewDrawerOpen(false);
      setDomainReviewDrawerDomain(null);
      setDomainReviewDrawerClosing(false);
    }
    const fetchUrl = `/training-plan-management/${encodeURIComponent(
      context.planId,
    )}/active/detail?generationDomain=${encodeURIComponent(domain)}`;
    setReleasedPlanViewerIntent({ domain, planId: context.planId });
    setWorkflowRequestedPlanId(context.planId);
    setPersistedVerifiedDomain(domain);
    setPersistedSkillsPlanLoading(true);
    setPersistedSkillsPlanError(null);
    setPersistedPlanErrorDomain(null);
    try {
      const detail = await refreshPersistedPlanDetail(context.planId, domain, {
        updateWorkflowRequestedPlanId: true,
      });
      if (detail !== null) {
        setReleasedPlanViewerVisibleDetail({ domain, detail });
      }
      logTrainingPlanViewPlanDiagnostic({
        clickedDomain: domain,
        workspace,
        context,
        fetchUrl,
        resultStatus: detail === null ? "empty" : "ok",
        responseBodyShape:
          detail === null
            ? null
            : {
                hasPlan: detail.plan !== null,
                hasVersion: detail.version !== null,
                days: detail.days.length,
                sessions: detail.days.reduce((sum, day) => sum + day.sessions.length, 0),
                allowedActions: detail.allowedActions,
              },
        stateUpdated:
          detail === null
            ? null
            : "persistedSkillsPlanDetail, persistedVerifiedDomain, workflowRequestedPlanId",
        rendererBranch:
          trainingPlanShellModel.shell === "head_coach_function_aware" && domain === "SKILLS"
            ? "renderHeadCoachOwnedSkillsPlanPanel"
            : "persisted plan detail panel",
      });
      if (detail !== null) {
        router.replace(planningProfileHrefForAthlete(athleteIdTrimmed, context.planId));
      }
    } catch (e) {
      logTrainingPlanViewPlanDiagnostic({
        clickedDomain: domain,
        workspace,
        context,
        fetchUrl,
        resultStatus: isNormalizedApiError(e) ? e.status : "error",
        error: e,
      });
      setPersistedSkillsPlanError(
        formatApiError(e, `Could not open ${trainingPlanDomainLabel(domain)}.`),
      );
      setPersistedPlanErrorDomain(domain);
    } finally {
      setPersistedSkillsPlanLoading(false);
    }
  }

  function handleBackToDomainPlansIntegration() {
    setShowLockedContextBuilderView(false);
    setReleasedPlanViewerIntent(null);
    setReleasedPlanViewerVisibleDetail(null);
    setWorkflowRequestedPlanId(null);
    setPersistedSkillsPlanDetail(null);
    setPersistedVerifiedDomain(null);
    setPersistedSkillsPlanError(null);
    setPersistedPlanErrorDomain(null);
    router.replace(planningProfileHrefForAthlete(athleteIdTrimmed));
  }

  const refreshAssistantGovernedDetailFromLatestDraft = useCallback(
    async (
      generationDomain: TrainingPlanGenerationDomain,
      draft: Pick<
        CoachAthleteLatestDomainDraft,
        "trainingPlanId" | "trainingPlanVersionId"
      > | null,
    ) => {
      if (!shouldRenderAssistantDomainWorkspace) {
        return null;
      }
      const planId = draft?.trainingPlanId?.trim() ?? "";
      if (planId === "") {
        return null;
      }
      setAssistantGovernedDetailRefreshing(true);
      try {
        return await refreshPersistedPlanDetail(planId, generationDomain, {
          updateWorkflowRequestedPlanId: false,
        });
      } finally {
        setAssistantGovernedDetailRefreshing(false);
      }
    },
    [refreshPersistedPlanDetail, shouldRenderAssistantDomainWorkspace],
  );

  const refreshHeadCoachDomainPlanState = useCallback(
    async (domain: TrainingPlanGenerationDomain): Promise<void> => {
      if (!headCoachReviewMode || entityId === "" || athleteIdTrimmed === "") return;

      setHeadCoachDomainPlanStates((prev) => ({
        ...prev,
        [domain]: { ...prev[domain], loading: true, error: null },
      }));

      let activeDetail: CoachPersistedTrainingPlanActiveDetail | null = null;
      let summaryStatus: string | null = null;
      let summaryPlanId: string | null = null;
      let summaryVersionId: string | null = null;
      let error: string | null = null;

      try {
        const domainSummary = await fetchDomainPlanSummary(entityId, athleteIdTrimmed);
        const summarySource = resolveHeadCoachReviewSummarySource({
          workspace,
          domain,
          legacySummary: domainSummary[domain],
        });
        const resolvedSummaryVersionId = summarySource.versionId;
        summaryPlanId = summarySource.planId;
        let versions: CoachPersistedTrainingPlanVersion[] = [];
        summaryVersionId = resolvedSummaryVersionId;

        if (summaryPlanId !== null && summaryPlanId !== "") {
          knownDomainPlanIdsRef.current[domain] = summaryPlanId;
          try {
            activeDetail = await fetchPersistedTrainingPlanActiveDetail(summaryPlanId, domain);
          } catch (e) {
            if (!(isNormalizedApiError(e) && e.status === 404)) {
              error = formatApiError(e, `Could not load review details for ${trainingPlanDomainLabel(domain)}.`);
            }
          }
          if (resolvedSummaryVersionId !== null || (summarySource.status?.trim() ?? "") === "") {
            try {
              versions = await fetchPersistedTrainingPlanVersions(summaryPlanId);
            } catch (e) {
              if (error === null) {
                error = formatApiError(
                  e,
                  `Could not load persisted versions for ${trainingPlanDomainLabel(domain)}.`,
                );
              }
            }
          }
        }
        summaryStatus = resolveHeadCoachDomainSummaryStatus({
          summaryStatus: summarySource.status,
          activeDetail,
          versions,
          summaryVersionId: resolvedSummaryVersionId,
        });
      } catch (e) {
        error = formatApiError(e, `Could not refresh ${trainingPlanDomainLabel(domain)} status.`);
      }

      setHeadCoachDomainPlanStates((prev) => ({
        ...prev,
        [domain]: {
          loading: false,
          error,
          latestDraft: prev[domain].latestDraft,
          activeDetail: resolveHeadCoachReviewActiveDetailAfterRefresh({
            refreshedActiveDetail: activeDetail,
            previousActiveDetail: prev[domain].activeDetail,
            summaryPlanId,
            preservePreviousDetail:
              workflow1HeadCoachReviewActionPanelMode &&
              headCoachSubmittedReviewDomain === domain,
          }),
          summaryStatus,
          summaryPlanId,
          summaryVersionId,
        },
      }));
    },
    [
      athleteIdTrimmed,
      entityId,
      headCoachReviewMode,
      headCoachSubmittedReviewDomain,
      workflow1HeadCoachReviewActionPanelMode,
      workspace,
    ],
  );

  /** When a workflow step completes, auto-advance selection to the next tab (no Next buttons) */
  useEffect(() => {
    if (!trainingPlanShellModel.ready) return;
    if (isDownstreamDomainCoach) {
      prevWorkflowCompletionRef.current = {
        app: appStepCompleteDep,
        level: levelStepCompleteDep,
        workload: true,
        seasonGoals: true,
        planDates: true,
      };
      return;
    }

    const snapshot = {
      app: appStepCompleteDep,
      level: levelStepCompleteDep,
      workload: workloadCompleteDep,
      seasonGoals: seasonGoalsGateCompleteDep,
      planDates: planDatesStepCompleteDep,
    };

    if (
      requestedPlanIdDep !== null ||
      urlPlanCandidateDep !== null ||
      planningContextSetCaseDep
    ) {
      prevWorkflowCompletionRef.current = snapshot;
      return;
    }

    if (!workflowInitialTabResolvedRef.current) {
      prevWorkflowCompletionRef.current = snapshot;
      return;
    }

    const prev = prevWorkflowCompletionRef.current;
    if (prev !== null) {
      if (!prev.app && snapshot.app) {
        setSelectedWorkflowTab("level-validation");
      }
    }
    prevWorkflowCompletionRef.current = snapshot;
  }, [
    appStepCompleteDep,
    isDownstreamDomainCoach,
    levelStepCompleteDep,
    planningContextSetCaseDep,
    planDatesStepCompleteDep,
    requestedPlanIdDep,
    seasonGoalsGateCompleteDep,
    trainingPlanShellModel.ready,
    urlPlanCandidateDep,
    workloadCompleteDep,
  ]);

  /** Restore the current workflow tab from completed state once async readiness/workload data has loaded. */
  useEffect(() => {
    if (workflowInitialTabResolvedRef.current) return;
    if (!trainingPlanShellModel.ready) return;
    if (readinessLoadingDep || workloadAssessmentLoadingDep) return;
    const workflowMode = trainingPlanShellModel.workflowMode;
    const skillsOwnedResolvedTab = resolveSkillsOwnedDirectReleaseCurrentStep({
      workflowMode,
      requestedPlanId: requestedPlanIdDep,
      urlPlanCandidate: urlPlanCandidateDep,
      planningContextLocked: effectiveSkillsPlanningContextLocked,
      skillsPlanExists: hasLatestOrHydratedPersistedTrainingPlanId,
      contextHasPlanWindow: skillsOwnedContextHasPlanWindow,
    });
    const workspaceInitialTab = workspace
      ? parseWorkspaceInitialTab(workspace.initialTab)
      : null;
    const resolvedTab =
      workspaceInitialTab ??
      skillsOwnedResolvedTab ??
      resolveInitialTrainingPlanWorkflowTab({
        workflowMode,
        requestedPlanId: requestedPlanIdDep,
        urlPlanCandidate: urlPlanCandidateDep,
        planningContextLocked:
          trainingPlanShellModel.shell === "skills_coach_planning"
            ? effectiveSkillsPlanningContextLocked
            : planningContextLocked,
        hasSubmittedDomainPlans,
        appStepComplete: appStepCompleteDep,
        levelStepComplete: levelStepCompleteDep,
        workloadComplete: workloadCompleteDep,
        seasonGoalsGateComplete: seasonGoalsGateCompleteDep,
        planDatesStepComplete: planDatesStepCompleteDep,
        isDownstreamDomainCoach,
      });

    workflowInitialTabResolvedRef.current = true;
    if (resolvedTab !== selectedWorkflowTabDep) {
      setSelectedWorkflowTab(resolvedTab);
    }
  }, [
    appStepCompleteDep,
    hasSubmittedDomainPlans,
    hasLatestOrHydratedPersistedTrainingPlanId,
    isDownstreamDomainCoach,
    levelStepCompleteDep,
    planDatesStepCompleteDep,
    effectiveSkillsPlanningContextLocked,
    skillsOwnedContextHasPlanWindow,
    planningContextLocked,
    readinessLoadingDep,
    requestedPlanIdDep,
    seasonGoalsGateCompleteDep,
    selectedWorkflowTabDep,
    trainingPlanShellModel.shell,
    trainingPlanShellModel.ready,
    trainingPlanShellModel.workflowMode,
    urlPlanCandidateDep,
    workloadAssessmentLoadingDep,
    workloadCompleteDep,
    workspace,
  ]);

  /** Downstream Nutrition/S&C: open Generate after prerequisites without walking Steps 3–5. */
  useEffect(() => {
    if (!trainingPlanShellModel.ready) return;
    if (shouldResolveSpecialistDomainWorkspace) return;
    if (!accessGateReady || !isDownstreamDomainCoach) return;
    if (!appStepComplete || !levelStepComplete) return;
    const landKey = `${athleteIdTrimmed}|${entityId}`;
    if (downstreamWorkflowLandGenerateConsumedRef.current === landKey) return;
    downstreamWorkflowLandGenerateConsumedRef.current = landKey;
    setSelectedWorkflowTab("generate");
  }, [
    accessGateReady,
    appStepComplete,
    athleteIdTrimmed,
    entityId,
    isDownstreamDomainCoach,
    levelStepComplete,
    shouldResolveSpecialistDomainWorkspace,
    trainingPlanShellModel.ready,
  ]);

  /**
   * After refresh/login, auto-advance may land on Step 4 (Season & Goals) when gates were already
   * satisfied; once a draft plan id or hydrated persisted detail exists, jump once to Step 6.
   */
  useEffect(() => {
    if (!trainingPlanShellModel.ready) return;
    if (shouldResolveSpecialistDomainWorkspace) return;
    if (!accessGateReady) return;
    if (!generateTabPrecSatisfied) return;
    if (
      trainingPlanShellModel.shell === "head_coach_review" ||
      trainingPlanShellModel.shell === "head_coach_planning"
    ) {
      return;
    }
    if (requestedPlanId !== null || urlPlanCandidate !== null) {
      return;
    }
    const draftId = latestSkillsDraft?.trainingPlanId?.trim() ?? "";
    const persistResultId = generatePlanSuccess?.trainingPlanId?.trim() ?? "";
    const detailId = persistedSkillsPlanDetail?.plan.id?.trim() ?? "";
    if (draftId === "" && persistResultId === "" && detailId === "") return;

    const domainKey =
      (latestDraftDomain ?? domainForLatestDomainDraft ?? effectiveCoachGenerationDomain) ?? "NONE";
    const planKey =
      draftId !== "" ? draftId : persistResultId !== "" ? persistResultId : detailId;
    const resumeKey = `${athleteIdTrimmed}|${entityId}|${domainKey}|${planKey}`;
    if (workflowResumeToGenerateConsumedRef.current === resumeKey) return;

    workflowResumeToGenerateConsumedRef.current = resumeKey;
    setSelectedWorkflowTab("generate");
  }, [
    accessGateReady,
    athleteIdTrimmed,
    effectiveCoachGenerationDomain,
    entityId,
    generateTabPrecSatisfied,
    generatePlanSuccess?.trainingPlanId,
    latestDraftDomain,
    latestSkillsDraft?.trainingPlanId,
    domainForLatestDomainDraft,
    persistedSkillsPlanDetail?.plan.id,
    requestedPlanId,
    shouldResolveSpecialistDomainWorkspace,
    trainingPlanShellModel.shell,
    trainingPlanShellModel.ready,
    urlPlanCandidate,
  ]);

  const workflowStepperModel = useMemo(
    () =>
      WORKFLOW_STEP_SEQUENCE_LIST.map((key) => {
        const prec = workflowPrecMap[key];
        const stepDone = workflowStepCompleteForTick[key];
        let status: GuidedWorkflowStepStatus;
        if (!prec) {
          status = "locked";
        } else if (selectedWorkflowTab === key) {
          status = "active";
        } else if (stepDone) {
          status = "completed";
        } else {
          status = "available";
        }
        return {
          key,
          title: workflowStepLabel(key, headCoachReviewMode, "tab", reviewReviseStepLabel),
          summary: "",
          status,
          markCompleteTick: stepDone,
        };
      }) satisfies GuidedWorkflowUiStep[],
    [
      headCoachReviewMode,
      reviewReviseStepLabel,
      selectedWorkflowTab,
      workflowPrecMap,
      workflowStepCompleteForTick,
    ],
  );

  const workflowStepStatusByKey = useMemo(
    () =>
      Object.fromEntries(
        workflowStepperModel.map((step) => [step.key, step.status]),
      ) as Record<GuidedWorkflowStepKey, GuidedWorkflowStepStatus>,
    [workflowStepperModel],
  );

  const resolvePreLockContextBuilderTab = useCallback((): ContextBuilderStepKey => {
    const firstIncomplete: ContextBuilderStepKey =
      !appStepComplete
        ? "context-app"
        : !levelStepComplete
          ? "level-validation"
          : !workloadComplete
            ? "workload"
            : !seasonGoalsGateComplete
              ? "season-goals"
              : "plan-dates";

    if (workflowStepStatusByKey[firstIncomplete] !== "locked") {
      return firstIncomplete;
    }

    return (
      CONTEXT_BUILDER_STEP_SEQUENCE_LIST.find(
        (step) => workflowStepStatusByKey[step] !== "locked",
      ) ?? "context-app"
    );
  }, [
    appStepComplete,
    levelStepComplete,
    seasonGoalsGateComplete,
    workloadComplete,
    workflowStepStatusByKey,
  ]);

  useEffect(() => {
    if (!trainingPlanShellModel.ready) return;
    if (shouldResolveSpecialistDomainWorkspace) return;
    if (!isHeadCoachPlanningContextOwner || isDownstreamDomainCoach) return;
    if (
      trainingPlanShellModel.shell !== "head_coach_planning" &&
      trainingPlanShellModel.shell !== "head_coach_function_aware" &&
      trainingPlanShellModel.shell !== "head_coach_review"
    ) {
      return;
    }
    if (planningContextLocked) return;
    if (isContextBuilderStep(selectedWorkflowTab)) return;

    setSelectedWorkflowTab(resolvePreLockContextBuilderTab());
  }, [
    isDownstreamDomainCoach,
    isHeadCoachPlanningContextOwner,
    planningContextLocked,
    resolvePreLockContextBuilderTab,
    selectedWorkflowTab,
    shouldResolveSpecialistDomainWorkspace,
    trainingPlanShellModel.ready,
    trainingPlanShellModel.shell,
  ]);

  const loadWorkloadAssessment = useCallback(
    async (resetGenerationState: boolean): Promise<boolean> => {
      if (
        readinessLoading ||
        workloadAssessmentLoading ||
        entityId === "" ||
        athleteIdTrimmed === "" ||
        !canRunWorkloadAssessment({
          appCompleteness: readinessPanel.appCompleteness,
          validationStatus: readinessPanel.validationStatus,
          planningEligibility: readinessPanel.planningEligibility,
        })
      ) {
        return false;
      }

      if (workloadCompletionHoldTimeoutRef.current !== null) {
        window.clearTimeout(workloadCompletionHoldTimeoutRef.current);
        workloadCompletionHoldTimeoutRef.current = null;
      }
      setShowWorkloadCompletionState(false);

      setWorkloadAssessmentLoading(true);
      setWorkloadAssessmentError(null);
      if (resetGenerationState) {
        setGeneratePlanError(null);
        setGeneratePlanJobsByDomain({});
        setGeneratePlanSuccess(null);
        setGeneratePlanSuccessDomain(null);
        setGeneratePlanRecoveryMessage(null);
      }

      const requestScope = { athlete: athleteIdTrimmed, entity: entityId };
      workloadAssessmentRequestGenRef.current += 1;
      const requestGeneration = workloadAssessmentRequestGenRef.current;

      try {
        const result = await fetchCoachAthleteTrainingPlanWorkloadAssessment(
          entityId,
          athleteIdTrimmed,
        );
        if (
          workloadAssessmentRequestGenRef.current !== requestGeneration
          || !workloadTrainerScopeMatches(workflowTrainerScopeRef, requestScope)
        ) {
          return false;
        }
        const payloadAthlete = result.athleteId?.trim() ?? "";
        if (payloadAthlete !== "" && payloadAthlete !== requestScope.athlete) {
          setWorkloadAssessmentResult(null);
          setWorkloadAssessmentCapturedForAthleteId(null);
          setWorkloadAssessmentExplicitlyRunForAthleteId(null);
          setWorkloadAssessmentError(
            "Workload assessment is not scoped to this athlete. Run assessment again.",
          );
          return false;
        }
        setWorkloadAssessmentResult(result);
        setWorkloadAssessmentCapturedForAthleteId(requestScope.athlete);
        setWorkloadAssessmentExplicitlyRunForAthleteId(requestScope.athlete);
        return true;
      } catch (e) {
        if (
          workloadAssessmentRequestGenRef.current !== requestGeneration
          || !workloadTrainerScopeMatches(workflowTrainerScopeRef, requestScope)
        ) {
          return false;
        }
        setWorkloadAssessmentResult(null);
        setWorkloadAssessmentCapturedForAthleteId(null);
        setWorkloadAssessmentExplicitlyRunForAthleteId(null);
        setWorkloadAssessmentError(
          formatApiError(e, "Could not run workload assessment. Please try again shortly."),
        );
        return false;
      } finally {
        if (workloadAssessmentRequestGenRef.current === requestGeneration) {
          setWorkloadAssessmentLoading(false);
        }
      }
    },
    [
      athleteIdTrimmed,
      entityId,
      readinessLoading,
      readinessPanel.appCompleteness,
      readinessPanel.planningEligibility,
      readinessPanel.validationStatus,
      workloadAssessmentLoading,
    ],
  );

  const loadLatestSkillsDraft = useCallback(async (
    generationDomain: TrainingPlanGenerationDomain,
    retryOnNotFound = false,
  ) => {
    if (
      entityId === "" ||
      athleteIdTrimmed === "" ||
      (
        generationDomain !== "SKILLS" &&
        generationDomain !== "S_AND_C" &&
        generationDomain !== "NUTRITION"
      )
    ) {
      setLatestSkillsDraft(null);
      setLatestDraftDomain(null);
      setLatestSkillsDraftRequestState("idle");
      setLatestSkillsDraftMissing(false);
      setLatestSkillsDraftError(null);
      setLatestSkillsDraftErrorDomain(null);
      return;
    }

    const requestScope = { athlete: athleteIdTrimmed, entity: entityId };
    latestSkillsDraftRequestGenRef.current += 1;
    const requestGeneration = latestSkillsDraftRequestGenRef.current;
    setLatestSkillsDraftRequestState("loading");

    const retryDelaysMs = retryOnNotFound ? [0, 500, 1000] : [0];
    for (const [attemptIndex, retryDelayMs] of retryDelaysMs.entries()) {
      if (retryDelayMs > 0) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, retryDelayMs);
        });
      }
      if (
        latestSkillsDraftRequestGenRef.current !== requestGeneration
        || !workloadTrainerScopeMatches(workflowTrainerScopeRef, requestScope)
      ) {
        return;
      }
      try {
        const result = await fetchLatestCoachAthleteDomainDraft(
          entityId,
          athleteIdTrimmed,
          generationDomain,
        );
        if (
          latestSkillsDraftRequestGenRef.current !== requestGeneration
          || !workloadTrainerScopeMatches(workflowTrainerScopeRef, requestScope)
        ) {
          return;
        }
        setLatestSkillsDraft(result);
        setLatestDraftDomain(generationDomain);
        setLatestSkillsDraftRequestState("success");
        setLatestSkillsDraftMissing(false);
        setLatestSkillsDraftError(null);
        setLatestSkillsDraftErrorDomain(null);
        setGeneratePlanError(null);
        if (shouldRenderAssistantDomainWorkspace) {
          await refreshAssistantGovernedDetailFromLatestDraft(generationDomain, result);
        }
        return;
      } catch (e) {
        if (
          latestSkillsDraftRequestGenRef.current !== requestGeneration
          || !workloadTrainerScopeMatches(workflowTrainerScopeRef, requestScope)
        ) {
          return;
        }
        if (isNormalizedApiError(e) && e.status === 404) {
          if (attemptIndex < retryDelaysMs.length - 1) {
            continue;
          }
          setLatestSkillsDraft(null);
          setLatestDraftDomain(generationDomain);
          setLatestSkillsDraftRequestState("missing");
          setLatestSkillsDraftMissing(true);
          setLatestSkillsDraftError(null);
          setLatestSkillsDraftErrorDomain(null);
          return;
        }
        setLatestSkillsDraft(null);
        setLatestDraftDomain(generationDomain);
        setLatestSkillsDraftRequestState("error");
        setLatestSkillsDraftMissing(false);
        setLatestSkillsDraftError(domainDraftLoadErrorMessage(generationDomain));
        setLatestSkillsDraftErrorDomain(generationDomain);
        return;
      }
    }
  }, [
    athleteIdTrimmed,
    entityId,
    refreshAssistantGovernedDetailFromLatestDraft,
    shouldRenderAssistantDomainWorkspace,
  ]);

  const refreshWorkflow2HeadCoachSkillsDomainSlotAfterSubmit = useCallback(
    async (planId: string): Promise<boolean> => {
      if (!headCoachFunctionAwareMode || entityId === "" || athleteIdTrimmed === "") {
        return false;
      }

      setHeadCoachDomainPlanStates((prev) => ({
        ...prev,
        SKILLS: { ...prev.SKILLS, loading: true, error: null },
      }));

      let activeDetail: CoachPersistedTrainingPlanActiveDetail | null = null;
      let summaryStatus: string | null = null;
      let summaryPlanId: string | null = null;
      let summaryVersionId: string | null = null;
      let slotError: string | null = null;

      try {
        const domainSummary = await fetchDomainPlanSummary(entityId, athleteIdTrimmed);
        const summary = domainSummary.SKILLS;
        summaryPlanId = summary.trainingPlanId?.trim() ?? null;
        summaryVersionId = resolveHeadCoachDomainSummaryVersionId(summary);
        const rawSummaryStatus = summary.status?.trim() ?? null;

        if (summaryPlanId !== null && summaryPlanId !== "") {
          knownDomainPlanIdsRef.current.SKILLS = summaryPlanId;
          try {
            activeDetail = await fetchPersistedTrainingPlanActiveDetail(summaryPlanId, "SKILLS");
          } catch (detailError) {
            if (!(isNormalizedApiError(detailError) && detailError.status === 404)) {
              const detailTimedOut = isClientRequestTimedOut(detailError);
              if (
                !detailTimedOut ||
                !shouldSkipPersistedVersionsFetchWhenSummaryStatusPresent(rawSummaryStatus)
              ) {
                slotError = formatApiError(
                  detailError,
                  "Could not load review details for Skills Plan.",
                );
              }
            }
          }
        }

        summaryStatus = resolveHeadCoachDomainSummaryStatus({
          summaryStatus: summary.status,
          activeDetail,
          versions: [],
          summaryVersionId,
        });
      } catch (e) {
        slotError = formatApiError(e, "Could not refresh Skills Plan status.");
      }

      const workflowStatus = deriveHeadCoachDomainWorkflowStatus({
        summaryStatus,
        summaryPlanId,
        summaryVersionId,
        activeDetail,
      });

      if (shouldClearWorkflow2SkillsSubmitSlotError({ workflowStatus, slotError })) {
        slotError = null;
      }

      setHeadCoachDomainPlanStates((prev) => ({
        ...prev,
        SKILLS: {
          loading: false,
          error: slotError,
          latestDraft: prev.SKILLS.latestDraft,
          activeDetail,
          summaryStatus,
          summaryPlanId,
          summaryVersionId,
        },
      }));

      try {
        await refreshPersistedPlanDetail(planId, "SKILLS", {
          updateWorkflowRequestedPlanId: requestedPlanId !== null,
        });
      } catch {
        // Best effort: domain summary slot is the Workflow 2 source of truth after submit.
      }

      setStep6WorkflowInternalError(null);
      workflowStep6FetchFailedForKeyRef.current = null;
      void loadLatestSkillsDraft("SKILLS");

      return workflow2SkillsSubmitReviewReconciled(workflowStatus);
    },
    [
      athleteIdTrimmed,
      entityId,
      headCoachFunctionAwareMode,
      loadLatestSkillsDraft,
      refreshPersistedPlanDetail,
      requestedPlanId,
    ],
  );

  useEffect(() => {
    if (!accessGateReady) return;
    if (
      isHeadCoachPlanningContextOwner &&
      allowedGenerationDomains.includes("SKILLS") &&
      selectedWorkflowTab === "generate" &&
      generateTabPrecSatisfied
    ) {
      void loadLatestSkillsDraft("SKILLS");
    }
  }, [
    accessGateReady,
    allowedGenerationDomains,
    generateTabPrecSatisfied,
    isHeadCoachPlanningContextOwner,
    loadLatestSkillsDraft,
    selectedWorkflowTab,
  ]);

  useEffect(() => {
    if (!accessGateReady) return;
    if (shouldForceAssistantDomainWorkspace) {
      void loadLatestSkillsDraft(domainForLatestDomainDraft);
      return;
    }
    if (requestedPlanId !== null) {
      setLatestSkillsDraft(null);
      setLatestDraftDomain(null);
      setLatestSkillsDraftRequestState("idle");
      setLatestSkillsDraftMissing(false);
      setLatestSkillsDraftError(null);
      return;
    }
    void loadLatestSkillsDraft(domainForLatestDomainDraft);
  }, [
    accessGateReady,
    athleteIdTrimmed,
    domainForLatestDomainDraft,
    entityId,
    loadLatestSkillsDraft,
    requestedPlanId,
    shouldForceAssistantDomainWorkspace,
  ]);

  /**
   * Assistant/domain coaches intentionally skip URL-driven persisted/detail sync
   * (`syncPersistedPlanFromUrl`). Dashboard/list ACTIVE state comes from domain summary + detail,
   * while this workspace previously relied only on `latest-domain-draft` — which is absent once a
   * plan is released — producing a false "Not Created". Hydrate the same summary → active/detail
   * path for the coach's current generation domain (SKILLS / NUTRITION / S_AND_C).
   */
  useEffect(() => {
    if (!accessGateReady) return;
    if (!shouldRenderAssistantDomainWorkspace) {
      setAssistantDomainSummaryHydrationPending(false);
      return;
    }
    if (entityId === "" || athleteIdTrimmed === "") return;
    if (currentCoachGenerationDomain === null) return;

    assistantDomainSummaryHydrationGenRef.current += 1;
    const gen = assistantDomainSummaryHydrationGenRef.current;
    let cancelled = false;
    setAssistantDomainSummaryHydrationPending(true);

    void (async () => {
      try {
        const domains = await fetchDomainPlanSummary(entityId, athleteIdTrimmed);
        if (cancelled || assistantDomainSummaryHydrationGenRef.current !== gen) return;

        const summary = domains[currentCoachGenerationDomain];
        const planId = summary.trainingPlanId?.trim() ?? "";
        if (planId === "") {
          return;
        }

        knownDomainPlanIdsRef.current[currentCoachGenerationDomain] = planId;

        try {
          const detail = await fetchPersistedTrainingPlanActiveDetail(
            planId,
            currentCoachGenerationDomain,
          );
          if (cancelled || assistantDomainSummaryHydrationGenRef.current !== gen) return;

          const owner = detail.plan.athleteId?.trim() ?? "";
          if (owner !== "" && owner !== athleteIdTrimmed) return;

          setPersistedSkillsPlanDetail(detail);
          setPersistedVerifiedDomain(currentCoachGenerationDomain);
          setPersistedSkillsPlanError(null);
          setPersistedPlanErrorDomain(null);
        } catch (e) {
          if (cancelled || assistantDomainSummaryHydrationGenRef.current !== gen) return;
          if (!(isNormalizedApiError(e) && e.status === 404)) {
            setPersistedSkillsPlanError(
              formatApiError(
                e,
                `Could not load ${trainingPlanDomainLabel(currentCoachGenerationDomain)}.`,
              ),
            );
            setPersistedPlanErrorDomain(currentCoachGenerationDomain);
          }
        }
      } catch (e) {
        if (cancelled || assistantDomainSummaryHydrationGenRef.current !== gen) return;
        setPersistedSkillsPlanError(
          formatApiError(e, "Could not load domain plan summary for this athlete."),
        );
        setPersistedPlanErrorDomain(currentCoachGenerationDomain);
      } finally {
        if (!cancelled && assistantDomainSummaryHydrationGenRef.current === gen) {
          setAssistantDomainSummaryHydrationPending(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    accessGateReady,
    athleteIdTrimmed,
    currentCoachGenerationDomain,
    entityId,
    shouldRenderAssistantDomainWorkspace,
  ]);

  useEffect(() => {
    if (!accessGateReady) return;

    const prevUrlPlan = prevUrlPlanForPersistedSyncRef.current;
    prevUrlPlanForPersistedSyncRef.current = urlPlanCandidate;

    let cancelled = false;

    async function syncPersistedPlanFromUrl() {
      if (shouldForceAssistantDomainWorkspace) {
        setWorkflowRequestedPlanId(null);
        setPersistedSkillsPlanDetail(null);
        setPersistedVerifiedDomain(null);
        setPersistedSkillsPlanError(null);
        setPersistedSkillsPlanLoading(false);
        workflowStep6FetchFailedForKeyRef.current = null;
        return;
      }

      if (urlPlanCandidate === null) {
        if (prevUrlPlan !== undefined && prevUrlPlan !== null) {
          setWorkflowRequestedPlanId(null);
          setReleasedPlanViewerIntent(null);
          setReleasedPlanViewerVisibleDetail(null);
          setPersistedSkillsPlanDetail(null);
          setPersistedVerifiedDomain(null);
          setPersistedSkillsPlanError(null);
          workflowStep6FetchFailedForKeyRef.current = null;
        }
        setPersistedSkillsPlanLoading(false);
        return;
      }

      if (setupLoading) {
        setPersistedSkillsPlanLoading(true);
        setPersistedSkillsPlanError(null);
        return;
      }

      if (persistedPlanQueryDomain === null) {
        setWorkflowRequestedPlanId(null);
        setReleasedPlanViewerIntent(null);
        setReleasedPlanViewerVisibleDetail(null);
        setPersistedSkillsPlanDetail(null);
        setPersistedSkillsPlanError(
          "Unable to load the saved training plan because no coach generation domain is available yet.",
        );
        setPersistedSkillsPlanLoading(false);
        return;
      }

      setPersistedSkillsPlanLoading(true);
      setPersistedSkillsPlanError(null);
      try {
        const detail = await fetchPersistedTrainingPlanActiveDetail(
          urlPlanCandidate,
          persistedPlanQueryDomain,
        );
        if (cancelled) return;
        const owner = detail.plan.athleteId?.trim() ?? "";
        if (owner !== "" && owner !== athleteIdTrimmed) {
          setWorkflowRequestedPlanId(null);
          setReleasedPlanViewerIntent(null);
          setReleasedPlanViewerVisibleDetail(null);
          setPersistedSkillsPlanDetail(null);
          setPersistedVerifiedDomain(null);
          setPersistedSkillsPlanError(null);
          router.replace(planningProfileHrefForAthlete(athleteIdTrimmed));
          return;
        }
        setWorkflowRequestedPlanId(urlPlanCandidate);
        setPersistedSkillsPlanDetail(detail);
        if (!isHeadCoachPlanningContextOwner) {
          setPersistedVerifiedDomain(persistedPlanQueryDomain);
        }
      } catch (e) {
        if (cancelled) return;
        setWorkflowRequestedPlanId(null);
        setPersistedSkillsPlanDetail(null);
        setPersistedVerifiedDomain(null);
        setPersistedSkillsPlanError(
          formatApiError(e, "Unable to load persisted skills plan. Please try again."),
        );
      } finally {
        if (!cancelled) {
          setPersistedSkillsPlanLoading(false);
        }
      }
    }

    void syncPersistedPlanFromUrl();
    return () => {
      cancelled = true;
    };
  }, [
    accessGateReady,
    athleteIdTrimmed,
    isDownstreamDomainCoach,
    isHeadCoachPlanningContextOwner,
    persistedPlanQueryDomain,
    router,
    setupLoading,
    shouldForceAssistantDomainWorkspace,
    urlPlanCandidate,
  ]);

  /**
   * Step 6 Workflow Actions: when the strip is not URL-driven, load active/detail for the resolved
   * plan id + generation domain (same contract as `/training-plan-management/{planId}/active/detail`).
   */
  useEffect(() => {
    if (!step6WorkflowOrchestrationActive) {
      workflowStep6FetchFailedForKeyRef.current = null;
      setStep6WorkflowInternalError(null);
      setStep6WorkflowInternalLoading(false);
      return;
    }
    if (entityId === "" || athleteIdTrimmed === "") {
      return;
    }

    const planId = resolvedWorkflowPlanId;
    const domain = resolvedWorkflowGenerationDomain;
    if (planId === "") {
      workflowStep6FetchFailedForKeyRef.current = null;
      setStep6WorkflowInternalError(null);
      setStep6WorkflowInternalLoading(false);
      return;
    }

    const urlDrivesThisPlan =
      !isDownstreamDomainCoach && urlPlanCandidate?.trim() === planId;
    if (urlDrivesThisPlan) {
      workflowStep6FetchFailedForKeyRef.current = null;
      setStep6WorkflowInternalError(null);
      setStep6WorkflowInternalLoading(false);
      return;
    }

    const detailMatches =
      persistedDetailMatchesCurrentDomain &&
      persistedSkillsPlanDetail?.plan.id?.trim() === planId &&
      persistedVerifiedDomain === domain;
    if (detailMatches) {
      workflowStep6FetchFailedForKeyRef.current = null;
      setStep6WorkflowInternalError(null);
      setStep6WorkflowInternalLoading(false);
      return;
    }

    const key = `${planId}:${domain}`;
    if (workflowStep6FetchFailedForKeyRef.current === key) {
      setStep6WorkflowInternalLoading(false);
      setStep6WorkflowInternalError((current) =>
        current ??
        "Could not load saved plan permissions for workflow actions. Please try again.",
      );
      return;
    }

    let cancelled = false;
    step6WorkflowFetchGenRef.current += 1;
    const gen = step6WorkflowFetchGenRef.current;
    setStep6WorkflowInternalLoading(true);
    setStep6WorkflowInternalError(null);

    void (async () => {
      try {
        const detail = await refreshPersistedPlanDetail(planId, domain, {
          updateWorkflowRequestedPlanId: false,
        });
        if (cancelled || step6WorkflowFetchGenRef.current !== gen) return;
        if (detail === null) {
          workflowStep6FetchFailedForKeyRef.current = key;
          setStep6WorkflowInternalError(
            "Saved training plan does not belong to this athlete; workflow actions are unavailable.",
          );
          return;
        }
        workflowStep6FetchFailedForKeyRef.current = null;
      } catch (e) {
        if (cancelled || step6WorkflowFetchGenRef.current !== gen) return;
        workflowStep6FetchFailedForKeyRef.current = key;
        setStep6WorkflowInternalError(
          formatApiError(
            e,
            "Could not load saved plan permissions for workflow actions. Please try again.",
          ),
        );
      } finally {
        if (!cancelled && step6WorkflowFetchGenRef.current === gen) {
          setStep6WorkflowInternalLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    athleteIdTrimmed,
    entityId,
    isDownstreamDomainCoach,
    persistedDetailMatchesCurrentDomain,
    persistedSkillsPlanDetail?.plan.id,
    persistedVerifiedDomain,
    refreshPersistedPlanDetail,
    resolvedWorkflowGenerationDomain,
    resolvedWorkflowPlanId,
    step6WorkflowOrchestrationActive,
    urlPlanCandidate,
  ]);

  async function handleReviseSkillsPlan() {
    if (reviseSkillsLoading || entityId === "" || athleteIdTrimmed === "" || !skillsReviseIds) {
      return;
    }

    const coachFeedback = reviseSkillsFeedback.trim();
    if (coachFeedback === "") {
      setReviseSkillsError("Enter revision feedback first.");
      setReviseSkillsSuccess(null);
      return;
    }

    const trainingPlanIdForReload = skillsReviseIds.trainingPlanId.trim();

    setReviseSkillsLoading(true);
    setReviseSkillsError(null);
    setReviseSkillsSuccess(null);
    try {
      const reviseResult = await reviseCoachAthleteSkillsTrainingPlan(entityId, athleteIdTrimmed, {
        trainingPlanId: skillsReviseIds.trainingPlanId,
        versionId: skillsReviseIds.versionId,
        coachFeedback,
      });
      await reconcileRevisedDomainPlanDetail("SKILLS", reviseResult, trainingPlanIdForReload);
      await loadLatestSkillsDraft("SKILLS", true);
      setReviseSkillsFeedback("");
      setReviseSkillsSuccess("Revised skills plan version generated.");
      void refreshTrainingPlanWorkspace({ background: true });
    } catch (e) {
      console.error("Skills training plan revision failed", e);
      if (isAiGenerationValidationError(e)) {
        setReviseSkillsError(AI_GENERATION_VALIDATION_ERROR_MESSAGE);
      } else if (isNormalizedApiError(e)) {
        const message =
          e.message.trim() !== ""
            ? e.message.trim()
            : "Unable to revise plan. Please try again.";
        const errorCode = e.code?.trim();
        setReviseSkillsError(
          errorCode ? `Revision failed: ${message} (${errorCode})` : `Revision failed: ${message}`,
        );
      } else {
        const errorRecord =
          typeof e === "object" && e !== null ? (e as Record<string, unknown>) : null;
        const message =
          (typeof errorRecord?.message === "string" && errorRecord.message.trim() !== ""
            ? errorRecord.message.trim()
            : null) ?? "Unable to revise plan. Please try again.";
        const errorCode =
          (typeof errorRecord?.errorCode === "string" && errorRecord.errorCode.trim() !== ""
            ? errorRecord.errorCode.trim()
            : null) ??
          (typeof errorRecord?.code === "string" && errorRecord.code.trim() !== ""
            ? errorRecord.code.trim()
            : null);
        setReviseSkillsError(
          errorCode ? `Revision failed: ${message} (${errorCode})` : `Revision failed: ${message}`,
        );
      }
      setReviseSkillsSuccess(null);
    } finally {
      setReviseSkillsLoading(false);
    }
  }

  async function handlePersistedGovernedPlanAction(
    action: GovernedTrainingPlanWorkflowAction,
    actionContextOverride?: GovernedPlanContext | null,
  ) {
    const actionContext = actionContextOverride ?? persistedGovernedPlanContext;
    if (governedPlanActionLoading !== null || actionContext === null) {
      return;
    }
    if (action === "REQUEST_REVISION") {
      const useDrawerComposer =
        domainReviewDrawerOpen && domainReviewDrawerDomain === actionContext.generationDomain;
      setRequestRevisionDrawerComposerOpen(useDrawerComposer);
      setRequestRevisionModalOpen(!useDrawerComposer);
      setRequestRevisionActionContext(actionContext);
      setGovernedPlanActionError(null);
      setGovernedPlanActionSuccess(null);
      setGovernedPlanActionSuccessFeedback(null);
      return;
    }

    setGovernedPlanActionLoading(action);
    setGovernedPlanActionError(null);
    setGovernedPlanActionSuccess(null);
    setGovernedPlanActionSuccessFeedback(null);

    const actionDomain = actionContext.generationDomain;
    const updateWorkflowRequestedPlanIdAfterAction = requestedPlanId !== null;

    try {
      if (action === "SUBMIT_REVIEW") {
        const workspaceSubmitIds = resolveSubmitReviewPlanVersionIds({
          workspace,
          domain: actionDomain,
          fallbackPlanId: actionContext.planId,
          fallbackVersionId: actionContext.versionId,
        });
        let submitPlanId = workspaceSubmitIds.planId;
        let submitVersionId = workspaceSubmitIds.versionId;
        const workspaceProvidesSubmitState =
          workspace !== null &&
          resolveWorkspaceDomainSubmitForReviewVisible(workspace, actionDomain);
        if (
          shouldForceAssistantDomainWorkspace &&
          !isHeadCoachPlanningContextOwner &&
          !workspaceProvidesSubmitState
        ) {
          const visibleDraft = latestDraftMatchesCurrentDomain ? latestSkillsDraft : null;
          let submitContext = actionContext;
          if (
            !isAssistantGovernedDetailAlignedWithVisibleDraft({
              governedContext: submitContext,
              latestDraft: visibleDraft,
              currentDomain: currentCoachGenerationDomain,
            })
          ) {
            const detail = await refreshAssistantGovernedDetailFromLatestDraft(
              actionDomain,
              visibleDraft,
            );
            if (detail === null) {
              setGovernedPlanActionError(
                "Unable to refresh plan permissions before submit. Please try again.",
              );
              return;
            }
            submitContext = {
              planId: detail.plan.id.trim(),
              versionId: detail.version.id.trim(),
              generationDomain: actionDomain,
            };
            if (
              !isAssistantGovernedDetailAlignedWithVisibleDraft({
                governedContext: submitContext,
                latestDraft: visibleDraft,
                currentDomain: currentCoachGenerationDomain,
              })
            ) {
              setGovernedPlanActionError(
                "Submit is unavailable until the saved plan matches the latest draft version. Please wait for sync to finish.",
              );
              return;
            }
          }
          submitPlanId = submitContext.planId;
          submitVersionId = submitContext.versionId;
        }
        await submitReview(
          entityId,
          athleteIdTrimmed,
          submitPlanId,
          submitVersionId,
          actionDomain,
        );
      } else if (action === "HEAD_APPROVE") {
        await headApprove(
          entityId,
          athleteIdTrimmed,
          actionContext.planId,
          actionContext.versionId,
          actionDomain,
        );
      } else {
        await release(
          entityId,
          athleteIdTrimmed,
          actionContext.planId,
          actionContext.versionId,
          actionDomain,
        );
      }
      if (isHeadCoachPlanningContextOwner) {
        if (
          headCoachFunctionAwareMode &&
          actionDomain === "SKILLS" &&
          action === "SUBMIT_REVIEW"
        ) {
          await refreshWorkflow2HeadCoachSkillsDomainSlotAfterSubmit(
            actionContext.planId,
          );
        } else {
          await refreshHeadCoachDomainPlanState(actionDomain);
        }
      } else {
        await refreshPersistedPlanDetail(
          actionContext.planId,
          actionDomain,
          { updateWorkflowRequestedPlanId: updateWorkflowRequestedPlanIdAfterAction },
        );
      }
      if (isHeadCoachPlanningContextOwner) {
        if (!workflow1HeadCoachReviewActionPanelMode) {
          setSelectedWorkflowTab("generate");
        }
        setHeadCoachSubmittedReviewDomain(actionDomain);
      }
      setGovernedPlanActionSuccess(governedPlanActionSuccessMessage(action));
      void refreshTrainingPlanWorkspace({ background: true });
    } catch (e) {
      if (
        headCoachFunctionAwareMode &&
        action === "SUBMIT_REVIEW" &&
        actionDomain === "SKILLS" &&
        isClientRequestTimedOut(e)
      ) {
        const recovered = await refreshWorkflow2HeadCoachSkillsDomainSlotAfterSubmit(
          actionContext.planId,
        );
        if (recovered) {
          setGovernedPlanActionSuccess(governedPlanActionSuccessMessage(action));
          void refreshTrainingPlanWorkspace({ background: true });
          return;
        }
      }
      setGovernedPlanActionError(
        formatApiError(e, governedPlanActionErrorFallback(action)),
      );
    } finally {
      setGovernedPlanActionLoading(null);
    }
  }

  function handleCancelRequestRevision() {
    setRequestRevisionModalOpen(false);
    setRequestRevisionDrawerComposerOpen(false);
    setRequestRevisionActionContext(null);
    setRequestRevisionFeedback("");
    setGovernedPlanActionError(null);
  }

  async function handleRequestRevisionSubmit(
    event?: FormEvent<HTMLFormElement>,
    actionContextOverride?: GovernedPlanContext | null,
  ) {
    event?.preventDefault();
    const actionContext =
      actionContextOverride ?? requestRevisionActionContext ?? persistedGovernedPlanContext;
    if (governedPlanActionLoading !== null || actionContext === null) {
      return;
    }

    const actionDomain = actionContext.generationDomain;
    const reviewModel = resolveDomainReviewSurfaceModel(actionDomain);
    const revisionContext = buildDomainReviewRevisionContext({
      athleteId: athleteIdTrimmed,
      domain: actionDomain,
      selectedPlanId: actionContext.planId,
      selectedVersionId: actionContext.versionId,
      planStatus: reviewModel.planStatusLabel,
      workflowStatus: reviewModel.workflowStatus,
      currentFreeTextRevisionInstruction: requestRevisionFeedback,
    });
    const coachFeedback = revisionContext.currentFreeTextRevisionInstruction;
    if (coachFeedback === "") {
      setGovernedPlanActionError("Revision feedback is required.");
      setGovernedPlanActionSuccess(null);
      setGovernedPlanActionSuccessFeedback(null);
      return;
    }

    setGovernedPlanActionLoading("REQUEST_REVISION");
    setGovernedPlanActionError(null);
    setGovernedPlanActionSuccess(null);
    setGovernedPlanActionSuccessFeedback(null);

    const updateWorkflowRequestedPlanIdAfterAction = requestedPlanId !== null;

    try {
      await requestRevision(
        entityId,
        athleteIdTrimmed,
        actionContext.planId,
        actionContext.versionId,
        actionDomain,
        coachFeedback,
      );
      if (isHeadCoachPlanningContextOwner) {
        await refreshHeadCoachDomainPlanState(actionDomain);
      } else {
        await refreshPersistedPlanDetail(
          actionContext.planId,
          actionDomain,
          { updateWorkflowRequestedPlanId: updateWorkflowRequestedPlanIdAfterAction },
        );
      }
      setRequestRevisionFeedback("");
      setRequestRevisionModalOpen(false);
      setRequestRevisionDrawerComposerOpen(false);
      setRequestRevisionActionContext(null);
      const domainLabel = trainingPlanDomainLabel(actionDomain);
      setGovernedPlanActionSuccess(`Revision requested and sent back to ${domainLabel} Coach.`);
      void refreshTrainingPlanWorkspace({ background: true });
    } catch (e) {
      setGovernedPlanActionError(
        formatApiError(e, governedPlanActionErrorFallback("REQUEST_REVISION")),
      );
    } finally {
      setGovernedPlanActionLoading(null);
    }
  }

  async function handleLockPlanningContext() {
    if (
      planningContextLockLoading ||
      !canLockPlanningContext ||
      entityId === "" ||
      athleteIdTrimmed === ""
    ) {
      return;
    }
    if (!planDatesWindowComplete) {
      setPlanningContextLockError(
        "Plan start and end dates must be valid before locking planning context.",
      );
      setPlanningContextLockSuccess(null);
      return;
    }

    setPlanningContextLockLoading(true);
    setPlanningContextLockError(null);
    setPlanningContextLockSuccess(null);
    try {
      const lockedContext = await lockCoachAthletePlanningContext(entityId, athleteIdTrimmed, {
        planWindow: {
          startDate: planStartDate,
          endDate: planEndDate,
        },
      });
      const isSkillsOwnedPlanningShell =
        trainingPlanShellModel.shell === "skills_coach_planning";
      if (isSkillsOwnedPlanningShell && isUpstreamPlanningContextLocked(lockedContext)) {
        setUpstreamPlanningContext(lockedContext);
        setPlanningContextBootstrapState("loaded");
      }
      const refreshed = await fetchCoachAthleteUpstreamPlanningContext(
        entityId,
        athleteIdTrimmed,
      );
      const resolvedContext =
        isSkillsOwnedPlanningShell &&
        isUpstreamPlanningContextLocked(lockedContext) &&
        !isUpstreamPlanningContextLocked(refreshed)
          ? lockedContext
          : refreshed;
      setUpstreamPlanningContext(resolvedContext);
      setUpstreamPlanningContextError(null);
      setPlanningContextBootstrapState("loaded");
      if (isUpstreamPlanningContextLocked(resolvedContext)) {
        const lockedStartDate =
          resolvedContext.planWindow?.startDate ??
          resolvedContext.startDate ??
          planStartDate;
        const lockedEndDate =
          resolvedContext.planWindow?.endDate ??
          resolvedContext.endDate ??
          planEndDate;
        setCachedLockedPlanWindow({ startDate: lockedStartDate, endDate: lockedEndDate });
      } else if (!isSkillsOwnedPlanningShell) {
        setCachedLockedPlanWindow({ startDate: planStartDate, endDate: planEndDate });
      }
      if (!shouldSkipPlanningOwnerReadinessCalls) {
        const [levelValidation, readiness, completeness] = await Promise.all([
          fetchCoachAthleteLevelValidation(entityId, athleteIdTrimmed),
          fetchCoachAthleteTrainingPlanReadiness(entityId, athleteIdTrimmed, {
            generationDomain: readinessGenerationDomain,
            seasonCycleId: selectedSeasonCycleId,
            sportCode: athleteSportCode,
          }),
          fetchCoachAthleteTrainingPlanCompleteness(entityId, athleteIdTrimmed, {
            sportCode: athleteSportCode,
          }),
        ]);
        setReadinessSources({ levelValidation, readiness, completeness });
      }
      if (isUpstreamPlanningContextLocked(resolvedContext)) {
        setPlanningContextLockSuccess("Planning context locked and shared with coaches.");
        void refreshTrainingPlanWorkspace({ background: true });
      } else if (isSkillsOwnedPlanningShell) {
        setPlanningContextLockError(
          "Planning context lock was submitted, but the refreshed lock state is not ready yet. Please retry.",
        );
        setPlanningContextLockSuccess(null);
      } else {
        setPlanningContextLockSuccess("Planning context locked and shared with coaches.");
        void refreshTrainingPlanWorkspace({ background: true });
      }
    } catch (e) {
      setPlanningContextLockError(
        formatApiError(e, "Could not lock planning context. Please try again shortly."),
      );
      setPlanningContextLockSuccess(null);
    } finally {
      setPlanningContextLockLoading(false);
    }
  }

  function renderHeadCoachPlanningContextLockAction(options?: {
    shell?: "panel" | "flat";
    showHeading?: boolean;
    showBlockers?: boolean;
    showStatusDetails?: boolean;
    inlineNotices?: boolean;
  }) {
    if (!isPlanningContextAuthority) return null;
    const shell = options?.shell ?? "panel";
    const showHeading = options?.showHeading ?? true;
    const showBlockers = options?.showBlockers ?? true;
    const showStatusDetails = options?.showStatusDetails ?? true;
    const inlineNotices = options?.inlineNotices ?? false;
    const upstreamBlockers = upstreamPlanningContext?.blockers ?? [];
    const apiConfirmedLocked = upstreamPlanningContext?.planningContextLocked === true;
    const effectiveLocked = planningContextLocked;
    const lockedStartDate =
      upstreamPlanningContext?.planWindow?.startDate ??
      upstreamPlanningContext?.startDate ??
      null;
    const lockedEndDate =
      upstreamPlanningContext?.planWindow?.endDate ??
      upstreamPlanningContext?.endDate ??
      null;
    const contextRefreshFailed = upstreamPlanningContextError !== null && hasSubmittedDomainPlans;
    const fallbackStartFromPlans =
      headCoachDomainPlanStates.SKILLS.activeDetail?.version.startDate ??
      headCoachDomainPlanStates.NUTRITION.activeDetail?.version.startDate ??
      headCoachDomainPlanStates.S_AND_C.activeDetail?.version.startDate ??
      null;
    const fallbackEndFromPlans =
      headCoachDomainPlanStates.SKILLS.activeDetail?.version.endDate ??
      headCoachDomainPlanStates.NUTRITION.activeDetail?.version.endDate ??
      headCoachDomainPlanStates.S_AND_C.activeDetail?.version.endDate ??
      null;
    const displayStartDate =
      lockedStartDate ??
      (effectiveLocked
        ? cachedLockedPlanWindow?.startDate ?? fallbackStartFromPlans ?? planStartDate
        : planStartDate);
    const displayEndDate =
      lockedEndDate ??
      (effectiveLocked
        ? cachedLockedPlanWindow?.endDate ?? fallbackEndFromPlans ?? planEndDate
        : planEndDate);
    return (
      <div
        className={cn(
          "space-y-3",
          shell === "panel" ? "rounded-md border border-slate-200 bg-slate-50 p-3" : "",
        )}
      >
        {showHeading ? (
          <div className="space-y-1">
            <h4 className="text-sm font-normal text-textPrimary">
              {headCoachReviewMode
                ? "Head Coach Planning Context Lock"
                : "Planning Context Lock"}
            </h4>
            <p className="text-sm text-textSecondary">
              {headCoachReviewMode
                ? "Lock the confirmed plan window and share APP, level, workload, season, goal, and date context with assigned domain coaches."
                : "Lock the confirmed plan window so Nutrition and S&C coaches can generate their domain plans."}
            </p>
          </div>
        ) : null}
        {upstreamPlanningContextLoading ? (
          <DashboardStatusNotice type="loading" compact>
            Checking planning context lock...
          </DashboardStatusNotice>
        ) : null}
        {contextRefreshFailed ? (
          <DashboardStatusNotice type="warning" compact>
            Unable to refresh locked context. Showing last known locked context.
          </DashboardStatusNotice>
        ) : upstreamPlanningContextError && !effectiveLocked ? (
          <DashboardStatusNotice type="error" compact>
            {upstreamPlanningContextError}
          </DashboardStatusNotice>
        ) : null}
        {planningContextLockError ? (
          <DashboardStatusNotice type="error" compact>
            {planningContextLockError}
          </DashboardStatusNotice>
        ) : null}
        {planningContextLockSuccess ? (
          <DashboardStatusNotice type="success" compact>
            {planningContextLockSuccess}
          </DashboardStatusNotice>
        ) : null}
        {showStatusDetails ? (
          <dl className="space-y-1">
            <DetailRow
              label="Planning context locked"
              value={effectiveLocked ? "Yes" : "No"}
            />
            <DetailRow
              label="Plan window"
              value={formatDateRange(displayStartDate, displayEndDate)}
            />
          </dl>
        ) : null}
        {showBlockers && upstreamBlockers.length > 0 && !effectiveLocked ? (
          (() => {
            const coachFacingBlockers = upstreamBlockers
              .map((blocker) => humanizePlanningContextBlockerCode(blocker))
              .filter((blocker): blocker is string => blocker !== null);
            if (coachFacingBlockers.length === 0) return null;
            return inlineNotices ? (
              <DashboardStatusNotice
                type="blocker"
                title="Resolve blockers before locking context"
                items={coachFacingBlockers}
                compact
              />
            ) : (
              <DashboardStatusNotice
                type="blocker"
                title="Resolve blockers before locking context"
                items={coachFacingBlockers}
              />
            );
          })()
        ) : null}
        {!effectiveLocked ? (
          <Button
            type="button"
            variant="primary"
            loading={planningContextLockLoading}
            disabled={
              planningContextLockLoading ||
              upstreamPlanningContextLoading ||
              apiConfirmedLocked ||
              !canLockPlanningContext ||
              !planDatesWindowComplete
            }
            onClick={() => {
              void handleLockPlanningContext();
            }}
          >
            {headCoachReviewMode
              ? "Lock & Share Context with Coaches"
              : "Lock Planning Context"}
          </Button>
        ) : (
          <div className="text-sm font-medium text-green-700">
            Planning context is locked. Domain coaches can now generate and submit plans.
          </div>
        )}
      </div>
    );
  }

  function openHeadCoachDomainPlanReview(planContext: GovernedPlanContext) {
    const planId = planContext.planId.trim();
    const versionId = planContext.versionId.trim();
    const domain = planContext.generationDomain;
    if (planContext.planId.trim() !== "") {
      knownDomainPlanIdsRef.current[domain] = planId;
    }
    setHeadCoachSubmittedReviewDomain(domain);
    setGovernedPlanActionError(null);
    setGovernedPlanActionSuccess(null);

    const activeDetail = headCoachDomainPlanStates[domain].activeDetail;
    const activePlanId = activeDetail?.plan.id?.trim() ?? "";
    const activeVersionId = activeDetail?.version.id?.trim() ?? "";
    const detailMatchesSelectedPlan =
      activePlanId === planId && (versionId === "" || activeVersionId === versionId);
    if (detailMatchesSelectedPlan) return;

    const fetchKey = `${domain}:${planId}:${versionId}`;
    if (headCoachReviewDetailFetchKeyRef.current === fetchKey) return;
    headCoachReviewDetailFetchKeyRef.current = fetchKey;
    void refreshHeadCoachDomainPlanState(domain).finally(() => {
      if (headCoachReviewDetailFetchKeyRef.current === fetchKey) {
        headCoachReviewDetailFetchKeyRef.current = null;
      }
    });
  }

  function resolveDomainReviewSurfaceModel(
    domain: TrainingPlanGenerationDomain,
  ): DomainReviewSurfaceModel {
    const state = headCoachDomainPlanStates[domain];
    const assignmentDomainContext = workspace?.assignmentContext?.domains[domain];
    const workflow2SkillsSlotProjection =
      headCoachFunctionAwareMode && headCoachOwnedSkillsGrouping && domain === "SKILLS"
        ? resolveWorkflow2SubmittedDomainSkillsSlotProjection({
            summaryStatus: state.summaryStatus,
            summaryPlanId: state.summaryPlanId,
            summaryVersionId: state.summaryVersionId,
            summaryActiveDetail: state.activeDetail,
            ownedLatestDraft: headCoachOwnedSkillsDraft,
            ownedActiveDetail: headCoachOwnedSkillsActiveDetail,
          })
        : null;
    const workflowStatus =
      workspace
        ? deriveWorkflowStatusFromWorkspaceDomain(workspace.domains[domain])
        : workflow2SkillsSlotProjection?.workflowStatus ??
          deriveHeadCoachDomainWorkflowStatus({
            summaryStatus: state.summaryStatus,
            summaryPlanId: state.summaryPlanId,
            summaryVersionId: state.summaryVersionId,
            activeDetail: state.activeDetail,
          });
    const status = headCoachDomainStatusLabel(workflowStatus);
    const activeDetail = state.activeDetail;
    const workspaceDomainEntry = workspace?.domains[domain] ?? null;
    const workspacePlanId = workspaceDomainEntry?.summary.trainingPlanId?.trim() ?? "";
    const workspaceVersionId =
      workspaceDomainEntry !== null
        ? (resolveHeadCoachDomainSummaryVersionId(workspaceDomainEntry.summary) ?? "")
        : "";
    const surfaceIdentity = resolveDomainReviewSurfaceIdentity({
      workspacePlanId: workflow2SkillsSlotProjection?.planId ?? workspacePlanId,
      workspaceVersionId: workflow2SkillsSlotProjection?.versionId ?? workspaceVersionId,
      workspaceVersionNumber: workspaceDomainEntry?.summary.versionNumber,
      stateSummaryPlanId: state.summaryPlanId,
      stateSummaryVersionId: state.summaryVersionId,
      activeDetailPlanId: activeDetail?.plan.id,
      activeDetailVersionId: activeDetail?.version.id,
      activeDetailVersionNumber: activeDetail?.version.versionNumber,
    });
    const planId = surfaceIdentity.planId;
    const versionId = surfaceIdentity.versionId;
    const planContext: GovernedPlanContext | null =
      planId !== "" && versionId !== ""
        ? {
            planId,
            versionId,
            generationDomain: domain,
          }
        : null;
    const canShowViewPlan = resolveDomainViewPlanVisible({
      assignmentDomainContext,
      legacyCanOpen: planContext !== null,
      planId,
      versionId,
    });
    const isCurrentReviewPlan = headCoachSubmittedReviewDomain === domain;
    const isNotCreated = workflowStatus === "not_created";
    const showWorkflow2DraftPendingNotice =
      headCoachFunctionAwareMode &&
      headCoachOwnedSkillsGrouping &&
      domain === "SKILLS" &&
      workflowStatus === "draft_generated";
    const rawPlanStatus =
      [
        surfaceIdentity.source === "active_detail" ? activeDetail?.version.status : null,
        surfaceIdentity.source === "active_detail" ? activeDetail?.plan.status : null,
        workspaceDomainEntry?.summary.status,
        state.summaryStatus,
        activeDetail?.version.status,
        activeDetail?.plan.status,
      ].find((value) => (value?.trim() ?? "") !== "") ?? null;
    const planStatusLabel =
      rawPlanStatus !== null
        ? formatEnumeratedLabel(rawPlanStatus)
        : isNotCreated
          ? "No plan yet"
          : "Unavailable";
    const allowedActions =
      workspace !== null
        ? workspaceAllowedActionsSet(workspace, domain)
        : new Set<GovernedTrainingPlanWorkflowAction>();
    for (const action of activeDetail?.allowedActions ?? []) {
      allowedActions.add(action);
    }
    const isHeadCoachOwnedSkillsDomain =
      headCoachFunctionAwareMode && headCoachOwnedSkillsGrouping && domain === "SKILLS";
    const canShowSubmitForReview =
      !isHeadCoachOwnedSkillsDomain &&
      resolveDomainSubmitForReviewVisible({
        assignmentDomainContext,
        legacyCanSubmitForReview:
          workspace !== null
            ? workspaceShowsDomainSubmitReview(workspace, domain)
            : allowedActions.has("SUBMIT_REVIEW"),
        workflowStatus,
        planId,
        versionId,
      });
    const canShowHeadCoachOwnedSkillsDraftApproveAction =
      resolveHeadCoachOwnedSkillsDraftApproveVisible({
        domain,
        workflowStatus,
        headCoachFunctionAwareMode,
        headCoachOwnedSkillsGrouping,
        assignmentDomainContext,
        planId,
        versionId,
      });
    const canShowReviewAction =
      canShowHeadCoachOwnedSkillsDraftApproveAction ||
      resolveDomainHeadCoachReviewActionVisible({
        assignmentDomainContext,
        legacyCanShowReviewAction: allowedActions.has("HEAD_APPROVE"),
        planId,
        versionId,
      }) ||
      resolveDomainHeadCoachReviewActionVisible({
        assignmentDomainContext,
        reviewAction: "REQUEST_REVISION",
        legacyCanShowReviewAction: allowedActions.has("REQUEST_REVISION"),
        planId,
        versionId,
      });
    const canShowReleaseAction = resolveDomainReleaseVisible({
      assignmentReleaseMode: workspace?.assignmentContext?.releaseMode,
      assignmentDomainContext,
      requiredReleaseMode: "HEAD_COACH_APPROVAL",
      legacyCanRelease: allowedActions.has("RELEASE"),
      planId,
      versionId,
    });
    const reviseAvailability = resolveDomainReviseAvailability({
      domain,
      workflowStatus,
      planId,
      versionId,
      baseVersionId:
        workspaceDomainEntry?.summary.approvedVersionId ??
        workspaceDomainEntry?.summary.activeVersionId ??
        null,
      assignmentDomainContext,
      legacyRequesterOwnsDomain: !isHeadCoachReviewerOnlyForDomain(domain),
    });
    const generatePermission = resolveGeneratePermissionForDomain(domain);
    const assignedCoachLabel = domainIntegrationAssignedCoachLabel(domain, assignmentDomainContext);
    const nextActionLabel = domainIntegrationNextActionLabel({
      workflowStatus,
      assignmentDomainContext,
      planningContextLocked:
        workspace?.planningContext.locked ??
        upstreamPlanningContext?.planningContextLocked === true,
      loading: state.loading,
      hasError: state.error !== null,
      canGenerate: generatePermission.canShowGenerate,
      canSubmitForReview: canShowSubmitForReview,
      canViewPlan: canShowViewPlan,
      canReview: canShowReviewAction,
      canRelease: canShowReleaseAction,
      isCurrentReviewPlan,
    });
    const availableActionLabels = domainIntegrationAvailableActionLabels({
      canGenerate: generatePermission.canShowGenerate,
      canViewPlan: canShowViewPlan,
      canSubmitForReview: canShowSubmitForReview,
      canReview: canShowReviewAction,
      canRelease: canShowReleaseAction,
      canRevise: reviseAvailability.mutationEnabled,
    });
    const canShowApproveAction =
      resolveDomainHeadCoachReviewActionVisible({
        assignmentDomainContext,
        legacyCanShowReviewAction: allowedActions.has("HEAD_APPROVE"),
        planId,
        versionId,
      }) || canShowHeadCoachOwnedSkillsDraftApproveAction;
    const canShowRequestRevisionAction = resolveDomainHeadCoachReviewActionVisible({
      assignmentDomainContext,
      reviewAction: "REQUEST_REVISION",
      legacyCanShowReviewAction: allowedActions.has("REQUEST_REVISION"),
      planId,
      versionId,
    });
    const viewPlanContext = resolveWorkspaceDomainViewPlanContext({
      workspace,
      domain,
      fallbackPlanId: planId,
      fallbackVersionId: versionId,
      fallbackStatus: rawPlanStatus,
      fallbackSource: "domain review surface",
      preferCompleteFallback: true,
    });

    return {
      domain,
      domainLabel: trainingPlanDomainLabel(domain),
      state,
      assignmentDomainContext,
      assignedCoachLabel,
      workflowStatus,
      statusLabel: status,
      planStatusLabel,
      nextActionLabel,
      availableActionLabels,
      allowedActions,
      activeDetail,
      planId,
      versionId,
      versionNumber: surfaceIdentity.versionNumber,
      trainingDays: countDomainReviewTrainingDays(activeDetail),
      isCurrentReviewPlan,
      showWorkflow2DraftPendingNotice,
      canShowGenerateAction: generatePermission.canShowGenerate,
      canShowViewPlan,
      canShowSubmitForReview,
      canShowReviseAction: reviseAvailability.mutationEnabled,
      canShowApproveAction,
      canShowRequestRevisionAction,
      canShowReleaseAction,
      actionContext: planContext,
      viewPlanContext,
    };
  }

  function renderHeadCoachDomainPlanCard(domain: TrainingPlanGenerationDomain) {
    const reviewModel = resolveDomainReviewSurfaceModel(domain);
    const {
      state,
      domainLabel,
      assignedCoachLabel,
      planStatusLabel,
      workflowStatus,
      statusLabel,
      nextActionLabel,
      availableActionLabels,
      actionContext,
      canShowGenerateAction,
      canShowViewPlan,
      viewPlanContext,
      showWorkflow2DraftPendingNotice,
    } = reviewModel;
    const canOpenReleasedPlanViewer =
      workflowStatus === "released" && canShowViewPlan && viewPlanContext !== null;
    const canGenerateWorkflow2SkillsPlan =
      headCoachFunctionAwareMode &&
      domain === "SKILLS" &&
      workflowStatus === "not_created" &&
      canShowGenerateAction &&
      headCoachSkillsCreateVisible;
    const displayedAvailableActionLabels = canGenerateWorkflow2SkillsPlan
      ? ["Generate Skills Plan"]
      : availableActionLabels;
    const displayedNextActionLabel = canGenerateWorkflow2SkillsPlan
      ? "Ready to generate this domain"
      : nextActionLabel;

    return (
      <tr key={domain} className="border-t border-border/70 align-top first:border-t-0">
        <th scope="row" className="py-3 pr-3 text-left text-sm font-normal text-textPrimary">
          {domainLabel}
        </th>
        <td className="px-3 py-3 text-sm text-textPrimary">{assignedCoachLabel}</td>
        <td className="px-3 py-3 text-sm text-textPrimary">
          <div className="space-y-1">
            <div>{planStatusLabel}</div>
            {state.loading ? (
              <div className="text-xs text-textMuted">Loading plan status...</div>
            ) : null}
            {state.error ? (
              <div className="text-xs text-amber-700">{state.error}</div>
            ) : null}
            {!state.loading && !state.error && showWorkflow2DraftPendingNotice ? (
              <div className="text-xs text-textMuted">Draft generated; not yet submitted.</div>
            ) : null}
          </div>
        </td>
        <td className="px-3 py-3">
          <span
            className={cn(
              "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-xs",
              domainIntegrationStatusTone(workflowStatus),
            )}
          >
            {statusLabel}
          </span>
        </td>
        <td className="min-w-[12rem] px-3 py-3 text-sm text-textPrimary">
          {displayedNextActionLabel}
        </td>
        <td className="px-3 py-3 text-sm text-textPrimary">
          <div className="flex flex-col items-start gap-2">
            <span>
              {displayedAvailableActionLabels.length > 0
                ? displayedAvailableActionLabels.join(", ")
                : "No action available now"}
            </span>
            {canGenerateWorkflow2SkillsPlan ? (
              <>
                {generatePlanLocalErrorsByDomain.SKILLS ? (
                  <div className="text-xs text-amber-700">
                    {generatePlanLocalErrorsByDomain.SKILLS}
                  </div>
                ) : null}
                {renderGenerationJobProgress(generatePlanJobsByDomain.SKILLS ?? null)}
                <Button
                  type="button"
                  variant="secondary"
                  disabled={
                    headCoachSkillsCreateDisabled ||
                    (generatePlanLocalErrorsByDomain.SKILLS ?? null) !== null
                  }
                  onClick={() => {
                    setHeadCoachSubmittedReviewDomain("SKILLS");
                    void handleGenerateTrainingPlan("SKILLS");
                  }}
                >
                  {renderGenerationJobButtonLabel(
                    "SKILLS",
                    generatePlanJobsByDomain.SKILLS ?? null,
                  )}
                </Button>
              </>
            ) : canOpenReleasedPlanViewer ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void openReleasedDomainPlanViewer(domain, viewPlanContext);
                }}
              >
                {viewDomainInPlanViewerLabel(domain)}
              </Button>
            ) : actionContext !== null && canShowViewPlan ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  handleOpenDomainReviewDrawer(domain);
                  openHeadCoachDomainPlanReview(actionContext);
                }}
              >
                {reviewPlanButtonLabel(domain)}
              </Button>
            ) : null}
          </div>
        </td>
      </tr>
    );
  }

  function closeHeadCoachPlanReview() {
    setHeadCoachSubmittedReviewDomain(null);
    setGovernedPlanActionError(null);
    setGovernedPlanActionSuccess(null);
    setGovernedPlanActionSuccessFeedback(null);
    setRequestRevisionModalOpen(false);
    setRequestRevisionActionContext(null);
    setRequestRevisionFeedback("");
  }

  function renderWorkflow1HeadCoachReviewActionPanel() {
    return null;
  }

  function renderHeadCoachPlanReviewPanel() {
    if (!headCoachReviewMode || headCoachSubmittedReviewDomain === null) {
      return null;
    }

    const reviewDomain = headCoachSubmittedReviewDomain;
    const reviewModel = resolveDomainReviewSurfaceModel(reviewDomain);
    const { state, activeDetail } = reviewModel;
    const persistedTrainingDaysForDomain =
      persistedDetailDomain === reviewDomain
        ? persistedSkillsPlanDetail?.days.filter((day) => day.sessions.length > 0).length ?? null
        : null;
    const inspectorTrainingDays = reviewModel.trainingDays ?? persistedTrainingDaysForDomain;
    const canOpenReleasedPlanViewer =
      reviewModel.workflowStatus === "released" &&
      reviewModel.canShowViewPlan &&
      reviewModel.viewPlanContext !== null;
    const canGenerateWorkflow2SkillsPlan =
      headCoachFunctionAwareMode &&
      reviewDomain === "SKILLS" &&
      reviewModel.workflowStatus === "not_created" &&
      reviewModel.canShowGenerateAction &&
      headCoachSkillsCreateVisible;

    return (
      <section className="space-y-4 border-t border-border/70 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-base font-normal text-textPrimary">
              Selected Domain Current State
            </h4>
            <p className="text-sm text-textSecondary">
              Track the selected domain and continue review actions.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={closeHeadCoachPlanReview}
          >
            Clear selected domain
          </Button>
        </div>

        {shouldShowSubmittedPlanLoading({
          loading: state.loading,
          hasActiveDetail: activeDetail !== null,
          workflow1HeadCoachReviewActionPanelMode,
        }) ? (
          <div className="text-sm text-textSecondary">Loading submitted plan…</div>
        ) : null}

        {state.error ? (
          <Alert variant="danger">Unable to load submitted plan. {state.error}</Alert>
        ) : null}

        {governedPlanActionError && !workflow1HeadCoachReviewActionPanelMode ? (
          <Alert variant="danger">{governedPlanActionError}</Alert>
        ) : null}

        {shouldShowSelectedDomainInspectorActionSuccess(governedPlanActionSuccess) &&
        !workflow1HeadCoachReviewActionPanelMode ? (
          <Alert variant="success">{governedPlanActionSuccess}</Alert>
        ) : null}

        {!state.loading && !state.error ? (
          <>
            <dl className="grid gap-2 sm:grid-cols-2">
              <DetailRow label="Domain" value={reviewModel.domainLabel} />
              <DetailRow label="Assigned Coach" value={reviewModel.assignedCoachLabel} />
              <DetailRow label="Plan status" value={reviewModel.planStatusLabel} />
              <DetailRow label="Workflow status" value={reviewModel.statusLabel} />
              <DetailRow label="Next action" value={reviewModel.nextActionLabel} />
              <DetailRow label="Version" value={displayValue(reviewModel.versionNumber)} />
              {inspectorTrainingDays !== null ? (
                <DetailRow label="Training Days" value={displayValue(inspectorTrainingDays)} />
              ) : null}
            </dl>

            <div className="flex flex-wrap gap-2">
              {canGenerateWorkflow2SkillsPlan ? (
                <>
                  {generatePlanLocalErrorsByDomain.SKILLS ? (
                    <Alert variant="warning">{generatePlanLocalErrorsByDomain.SKILLS}</Alert>
                  ) : null}
                  {renderGenerationJobProgress(generatePlanJobsByDomain.SKILLS ?? null)}
                  <Button
                    type="button"
                    variant="primary"
                    disabled={
                      headCoachSkillsCreateDisabled ||
                      (generatePlanLocalErrorsByDomain.SKILLS ?? null) !== null
                    }
                    onClick={() => {
                      void handleGenerateTrainingPlan("SKILLS");
                    }}
                  >
                    {renderGenerationJobButtonLabel(
                      "SKILLS",
                      generatePlanJobsByDomain.SKILLS ?? null,
                    )}
                  </Button>
                </>
              ) : null}
              {canOpenReleasedPlanViewer ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    void openReleasedDomainPlanViewer(reviewDomain, reviewModel.viewPlanContext);
                  }}
                >
                  {viewDomainInPlanViewerLabel(reviewDomain)}
                </Button>
              ) : null}
              {reviewModel.actionContext !== null || reviewModel.activeDetail !== null ? (
                <Button
                  type="button"
                  variant={
                    canOpenReleasedPlanViewer || canGenerateWorkflow2SkillsPlan
                      ? "secondary"
                      : "primary"
                  }
                  onClick={() => handleOpenDomainReviewDrawer(reviewDomain)}
                >
                  {openDomainPlanReviewLabel(reviewDomain)}
                </Button>
              ) : null}
            </div>
          </>
        ) : shouldShowHeadCoachReviewEmptyState({
          activeDetail,
          workspacePlanId: reviewModel.planId || null,
          workspaceVersionId: reviewModel.versionId || null,
          isLoading: state.loading,
          loadError: state.error,
        }) ? (
          <div className="text-sm text-textSecondary">
            No submitted plan data available for this domain.
          </div>
        ) : null}
      </section>
    );
  }

  function formatDrawerWeekdayName(date: string | null | undefined): string | null {
    const value = date?.trim() ?? "";
    if (value === "") return null;
    const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: "UTC",
    }).format(parsed);
  }

  function renderDomainReviewDrawerFact(label: string, value: ReactNode) {
    return (
      <div className="min-w-0 space-y-0.5">
        <div className="text-xs uppercase tracking-wide text-textMuted">{label}</div>
        <div className="min-w-0 break-words text-sm text-textPrimary">{value}</div>
      </div>
    );
  }

  function renderDomainReviewDrawerStructureItem(
    item: CoachPersistedTrainingPlanActiveDetail["days"][number]["sessions"][number]["sessionStructureSections"][number]["items"][number],
    itemOffset: number,
    options: { showNutritionCalories?: boolean } = {},
  ) {
    const title = (item as { title?: DisplayableValue }).title;
    const instructions = (item as { instructions?: DisplayableValue }).instructions;
    const balls = (item as { balls?: DisplayableValue }).balls;
    const sets = (item as { sets?: DisplayableValue }).sets;
    const primaryText =
      hasRenderableValue(title)
        ? displayValue(title)
        : hasRenderableValue(item.label)
          ? displayLabelTitleCase(item.label)
          : hasRenderableValue(item.summary)
            ? displayValue(item.summary)
            : `Item ${itemOffset + 1}`;
    const measures = [
      options.showNutritionCalories && item.calories !== null
        ? formatNutritionCaloriesDisplay(item.calories)
        : null,
      hasRenderableValue(item.durationMinutes)
        ? formatMinutesAsHoursMinutes(Number(item.durationMinutes))
        : null,
      hasRenderableValue(item.reps) ? `${displayValue(item.reps)} reps` : null,
      hasRenderableValue(sets) ? `${displayValue(sets)} sets` : null,
      hasRenderableValue(balls) ? `${displayValue(balls)} balls` : null,
      hasRenderableValue(item.intensity) ? displayValue(item.intensity) : null,
    ].filter((value): value is string => value !== null && value.trim() !== "");

    return (
      <li key={`${item.label ?? item.summary ?? "item"}-${itemOffset}`} className="space-y-1">
        <div className="text-sm text-textPrimary">{primaryText}</div>
        {measures.length > 0 ? (
          <div className="text-xs text-textSecondary">{measures.join(" · ")}</div>
        ) : null}
        {hasRenderableValue(instructions) ? (
          <div className="text-sm text-textSecondary">{displayValue(instructions)}</div>
        ) : hasRenderableValue(item.summary) && primaryText !== displayValue(item.summary) ? (
          <div className="text-sm text-textSecondary">{displayValue(item.summary)}</div>
        ) : null}
        {hasRenderableValue(item.notes) ? (
          <div className="text-sm text-textSecondary">Notes: {displayValue(item.notes)}</div>
        ) : null}
        <SkillGoalAttributionText primaryGoalName={item.primaryGoalName} />
      </li>
    );
  }

  function renderDomainReviewDrawerSession(
    session: CoachPersistedTrainingPlanActiveDetail["days"][number]["sessions"][number],
    sessionOffset: number,
    options: { showNutritionCalories?: boolean } = {},
  ) {
    const sessionNotes = (session as { notes?: DisplayableValue }).notes;
    const sessionItems = session.sessionStructureSections.flatMap((section) => section.items);
    const sessionCalories = options.showNutritionCalories
      ? sumNutritionMetric(sessionItems, "calories")
      : null;
    const sessionHeading = hasRenderableValue(session.title)
      ? displayLabelTitleCase(session.title)
      : `Session ${sessionOffset + 1}`;
    const sessionDetails = [
      hasRenderableValue(session.objective) ? displayValue(session.objective) : null,
      hasRenderableValue(session.plannedDurationMinutes)
        ? formatMinutesAsHoursMinutes(readSessionDurationMinutes(session))
        : null,
      hasRenderableValue(session.intensity) ? displayValue(session.intensity) : null,
      sessionCalories !== null ? formatNutritionCaloriesDisplay(sessionCalories) : null,
    ].filter((value): value is string => value !== null && value.trim() !== "");

    return (
      <div key={session.id ?? `session-${sessionOffset}`} className="space-y-3 py-4">
        <div className="space-y-1">
          <h5 className="text-sm font-medium text-textPrimary">{sessionHeading}</h5>
          {sessionDetails.length > 0 ? (
            <div className="text-sm text-textSecondary">{sessionDetails.join(" · ")}</div>
          ) : null}
          {hasRenderableValue(session.description) ? (
            <div className="text-sm text-textSecondary">{displayValue(session.description)}</div>
          ) : null}
          {hasRenderableValue(sessionNotes) ? (
            <div className="text-sm text-textSecondary">Notes: {displayValue(sessionNotes)}</div>
          ) : null}
        </div>
        {session.sessionStructureSections.length > 0 ? (
          <div className="space-y-3">
            {session.sessionStructureSections.map((section, sectionOffset) => (
              <div key={`${section.key}-${sectionOffset}`} className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-textMuted">
                  {persistedSessionStructureLabel(section.key)}
                </div>
                {section.items.length > 0 ? (
                  <ul className="space-y-3 pl-4">
                    {section.items.map((item, itemOffset) =>
                      renderDomainReviewDrawerStructureItem(item, itemOffset, {
                        showNutritionCalories: options.showNutritionCalories,
                      }),
                    )}
                  </ul>
                ) : (
                  <div className="text-sm text-textSecondary">No content in this section.</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-textSecondary">No detailed session structure available.</div>
        )}
      </div>
    );
  }

  function resolveNutritionDayCalories(
    day: CoachPersistedTrainingPlanActiveDetail["days"][number],
  ): number | null {
    return sumNutritionMetric(
      day.sessions.flatMap((session) =>
        session.sessionStructureSections.flatMap((section) => section.items),
      ),
      "calories",
    );
  }

  function renderNutritionPlanCalorieSummary(
    days: CoachPersistedTrainingPlanActiveDetail["days"],
  ) {
    const dailyCalories = days
      .map(resolveNutritionDayCalories)
      .filter((value): value is number => value !== null);
    if (dailyCalories.length === 0) return null;

    const totalCalories = dailyCalories.reduce((sum, value) => sum + value, 0);
    const averageDailyCalories = totalCalories / dailyCalories.length;
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-textSecondary">
        <span>Total plan calories: {formatNutritionCaloriesDisplay(totalCalories)}</span>
        <span>
          Average daily calories: {formatNutritionCaloriesDisplay(averageDailyCalories)}
        </span>
      </div>
    );
  }

  function renderDomainPlanDaySchedule(
    detail: CoachPersistedTrainingPlanActiveDetail,
    domainLabel: string,
    description = "Review the submitted plan by day and session.",
    domain: TrainingPlanGenerationDomain | null = null,
  ) {
    const sortedDays = [...detail.days].sort((a, b) => {
      const aIndex = typeof a.dayIndex === "number" ? a.dayIndex : Number.MAX_SAFE_INTEGER;
      const bIndex = typeof b.dayIndex === "number" ? b.dayIndex : Number.MAX_SAFE_INTEGER;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return String(a.date ?? "").localeCompare(String(b.date ?? ""));
    });
    const hasSessions = sortedDays.some((day) => day.sessions.length > 0);
    const showNutritionCalories = domain === "NUTRITION";

    return (
      <section className="space-y-4 border-t border-border/70 pt-5">
        <div className="space-y-1">
          <h4 className="text-sm font-normal text-textPrimary">{domainLabel} Schedule</h4>
          <p className="text-sm text-textSecondary">{description}</p>
          {showNutritionCalories ? renderNutritionPlanCalorieSummary(sortedDays) : null}
        </div>
        {!hasSessions ? (
          <div className="text-sm text-textSecondary">No scheduled sessions are available.</div>
        ) : (
          <div className="divide-y divide-border/70">
            {sortedDays.map((day, dayOffset) => {
              const dayNumber = day.dayIndex ?? dayOffset + 1;
              const weekdayName = formatDrawerWeekdayName(day.date);
              const dayFocus = (day as { dayFocus?: DisplayableValue }).dayFocus;
              const dayCalories = showNutritionCalories
                ? resolveNutritionDayCalories(day)
                : null;
              return (
                <section key={day.id ?? `day-${dayOffset}`} className="space-y-3 py-5 first:pt-0">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h5 className="text-base font-medium text-textPrimary">Day {dayNumber}</h5>
                      {weekdayName ? (
                        <span className="text-sm text-textSecondary">{weekdayName}</span>
                      ) : null}
                      {day.date ? (
                        <span className="text-sm text-textSecondary">
                          {formatDateOnly(day.date)}
                        </span>
                      ) : null}
                    </div>
                    {hasRenderableValue(dayFocus) ? (
                      <div className="text-sm text-textSecondary">Focus: {displayValue(dayFocus)}</div>
                    ) : null}
                    {dayCalories !== null ? (
                      <div className="text-sm text-textSecondary">
                        Daily calories: {formatNutritionCaloriesDisplay(dayCalories)}
                      </div>
                    ) : null}
                    {hasRenderableValue(day.notes) ? (
                      <div className="text-sm text-textSecondary">Notes: {displayValue(day.notes)}</div>
                    ) : null}
                  </div>
                  {day.sessions.length === 0 ? (
                    <div className="text-sm text-textSecondary">No sessions scheduled.</div>
                  ) : (
                    <div className="divide-y divide-border/70">
                      {day.sessions.map((session, sessionOffset) =>
                        renderDomainReviewDrawerSession(session, sessionOffset, {
                          showNutritionCalories,
                        }),
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  function renderDomainReviewDrawer() {
    if (!domainReviewDrawerOpen || domainReviewDrawerDomain === null) return null;

    const reviewModel = resolveDomainReviewSurfaceModel(domainReviewDrawerDomain);
    const {
      domain: reviewDomain,
      domainLabel: reviewDomainLabel,
      state: domainState,
      assignedCoachLabel,
      workflowStatus,
      statusLabel,
      planStatusLabel,
      nextActionLabel,
      activeDetail,
      versionNumber,
      trainingDays,
      canShowViewPlan,
      canShowSubmitForReview,
      canShowReviseAction,
      canShowApproveAction,
      canShowRequestRevisionAction,
      canShowReleaseAction,
      actionContext,
      viewPlanContext,
    } = reviewModel;
    const drawerWorkflowActions = resolveDomainReviewDrawerWorkflowActions({
      workflowStatus,
      canShowViewPlan,
      canShowSubmitForReview,
      canShowReviseAction,
      canShowApproveAction,
      canShowRequestRevisionAction,
      canShowReleaseAction,
      hasViewPlanContext: viewPlanContext !== null,
    });
    const hasDrawerWorkflowActions = drawerWorkflowActions.hasAuthorizedWorkflowAction;
    const drawerRevisionComposerOpen =
      requestRevisionDrawerComposerOpen &&
      requestRevisionActionContext?.generationDomain === reviewDomain;
    const drawerReviseComposerOpen =
      drawerWorkflowActions.canShowReviseAction && assistantRevisePanelDomain === reviewDomain;
    const drawerReviseError =
      reviewDomain === "SKILLS"
        ? reviseSkillsError
        : reviewDomain === "NUTRITION"
          ? reviseNutritionError
          : reviseSandCError;
    const drawerReviseSuccess =
      reviewDomain === "SKILLS"
        ? reviseSkillsSuccess
        : reviewDomain === "NUTRITION"
          ? reviseNutritionSuccess
          : reviseSandCSuccess;
    const drawerReviseFeedback =
      reviewDomain === "SKILLS"
        ? reviseSkillsFeedback
        : reviewDomain === "NUTRITION"
          ? reviseNutritionFeedback
          : reviseSandCFeedback;
    const drawerReviseLoading =
      reviewDomain === "SKILLS"
        ? reviseSkillsLoading
        : reviewDomain === "NUTRITION"
          ? reviseNutritionLoading
          : reviseSandCLoading;
    const drawerReviseIds =
      reviewDomain === "SKILLS"
        ? skillsReviseIds
        : reviewDomain === "NUTRITION"
          ? nutritionReviseIds
          : sandCReviseIds;
    const handleDrawerReviseFeedbackChange = (nextValue: string) => {
      if (reviewDomain === "SKILLS") {
        setReviseSkillsFeedback(nextValue);
        setReviseSkillsError(null);
        setReviseSkillsSuccess(null);
      } else if (reviewDomain === "NUTRITION") {
        setReviseNutritionFeedback(nextValue);
        setReviseNutritionError(null);
        setReviseNutritionSuccess(null);
      } else {
        setReviseSandCFeedback(nextValue);
        setReviseSandCError(null);
        setReviseSandCSuccess(null);
      }
    };
    const handleDrawerReviseSubmit = () => {
      if (reviewDomain === "SKILLS") {
        void handleReviseSkillsPlan();
      } else if (reviewDomain === "NUTRITION") {
        void handleReviseNutritionPlan();
      } else {
        void handleReviseSandCPlan();
      }
    };
    const planWindowStart = activeDetail?.version.startDate ?? null;
    const planWindowEnd = activeDetail?.version.endDate ?? null;
    const planWindowLabel =
      planWindowStart !== null || planWindowEnd !== null
        ? formatDateRange(planWindowStart, planWindowEnd)
        : null;

    return (
      <div
        className="fixed inset-0 z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="domain-review-drawer-title"
      >
        <style>
          {`
            @keyframes domainReviewDrawerSlideIn {
              from { opacity: 0; transform: translateX(1.5rem); }
              to { opacity: 1; transform: translateX(0); }
            }
            @keyframes domainReviewDrawerSlideOut {
              from { opacity: 1; transform: translateX(0); }
              to { opacity: 0; transform: translateX(1.5rem); }
            }
            @keyframes domainReviewBackdropFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes domainReviewBackdropFadeOut {
              from { opacity: 1; }
              to { opacity: 0; }
            }
          `}
        </style>
        <button
          type="button"
          className={cn(
            "absolute inset-0 cursor-default bg-slate-950/25",
            domainReviewDrawerClosing
              ? "motion-safe:animate-[domainReviewBackdropFadeOut_220ms_ease-in_forwards]"
              : "motion-safe:animate-[domainReviewBackdropFadeIn_180ms_ease-out]",
          )}
          aria-label="Close Domain Review Drawer"
          onClick={handleCloseDomainReviewDrawer}
        />
        <aside
          className={cn(
            "absolute right-0 top-0 flex h-full w-full max-w-3xl flex-col border-l border-border bg-bg shadow-2xl",
            domainReviewDrawerClosing
              ? "motion-safe:animate-[domainReviewDrawerSlideOut_220ms_ease-in_forwards]"
              : "motion-safe:animate-[domainReviewDrawerSlideIn_220ms_ease-out]",
          )}
        >
          <header className="space-y-2 border-b border-border px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3
                  id="domain-review-drawer-title"
                  className="text-lg font-medium text-textPrimary"
                >
                  {domainPlanReviewTitle(reviewDomain)}
                </h3>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseDomainReviewDrawer}
              >
                Close
              </Button>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="space-y-5">
              <section className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-normal text-textPrimary">Current State</h4>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-xs",
                      domainIntegrationStatusTone(workflowStatus),
                    )}
                  >
                    {statusLabel}
                  </span>
                </div>
                <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {renderDomainReviewDrawerFact("Assigned Coach", assignedCoachLabel)}
                  {planWindowLabel !== null
                    ? renderDomainReviewDrawerFact("Plan Window", planWindowLabel)
                    : null}
                  {versionNumber !== null
                    ? renderDomainReviewDrawerFact("Version", displayValue(versionNumber))
                    : null}
                  {renderDomainReviewDrawerFact("Plan Status", planStatusLabel)}
                  {renderDomainReviewDrawerFact(
                    "Workflow Status",
                    assistantWorkflowStatusLabelForKind(workflowStatus),
                  )}
                  {renderDomainReviewDrawerFact("Current Step / Next Action", nextActionLabel)}
                  {trainingDays !== null
                    ? renderDomainReviewDrawerFact("Training Days", displayValue(trainingDays))
                    : null}
                </dl>
                {domainState.loading ? (
                  <DashboardStatusNotice type="loading" compact>
                    Loading submitted plan detail...
                  </DashboardStatusNotice>
                ) : null}
                {domainState.error ? (
                  <DashboardStatusNotice type="warning" compact>
                    Unable to load submitted plan detail. {domainState.error}
                  </DashboardStatusNotice>
                ) : null}
                {governedPlanActionError ? (
                  <Alert variant="danger">{governedPlanActionError}</Alert>
                ) : null}
                {governedPlanActionSuccess ? (
                  <WorkflowNeutralNotice>
                    <div className="space-y-2">
                      <div>{governedPlanActionSuccess}</div>
                      {governedPlanActionSuccessFeedback ? (
                        <div className="text-sm text-textSecondary">
                          Head Coach Notes: {governedPlanActionSuccessFeedback}
                        </div>
                      ) : null}
                    </div>
                  </WorkflowNeutralNotice>
                ) : null}
              </section>

              <section className="space-y-3 border-t border-border/70 pt-5">
                <div className="space-y-1">
                  <h4 className="text-sm font-normal text-textPrimary">Review Actions</h4>
                  <p className="text-sm text-textSecondary">
                    Continue authorized workflow actions for this domain.
                  </p>
                </div>
                {hasDrawerWorkflowActions ? (
                  <div className="flex flex-wrap gap-2">
                    {drawerWorkflowActions.canShowViewPlan && viewPlanContext !== null ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={persistedSkillsPlanLoading}
                        onClick={() => {
                          void openReleasedDomainPlanViewer(reviewDomain, viewPlanContext);
                        }}
                      >
                        View in Plan Viewer
                      </Button>
                    ) : null}
                    {drawerWorkflowActions.canShowSubmitForReview ? (
                      <Button
                        type="button"
                        variant="primary"
                        loading={governedPlanActionLoading === "SUBMIT_REVIEW"}
                        disabled={governedPlanActionLoading !== null || actionContext === null}
                        onClick={() =>
                          void handlePersistedGovernedPlanAction("SUBMIT_REVIEW", actionContext)
                        }
                      >
                        Submit for Review
                      </Button>
                    ) : null}
                    {drawerWorkflowActions.canShowReviseAction ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={drawerReviseLoading}
                        onClick={() => {
                          setAssistantRevisePanelDomain(reviewDomain);
                        }}
                      >
                        {drawerReviseLoading ? "Revising plan..." : "Revise Plan"}
                      </Button>
                    ) : null}
                    {drawerWorkflowActions.canShowApproveAction ? (
                      <Button
                        type="button"
                        variant="primary"
                        loading={governedPlanActionLoading === "HEAD_APPROVE"}
                        disabled={governedPlanActionLoading !== null || actionContext === null}
                        onClick={() =>
                          void handlePersistedGovernedPlanAction("HEAD_APPROVE", actionContext)
                        }
                      >
                        Approve Plan
                      </Button>
                    ) : null}
                    {drawerWorkflowActions.canShowRequestRevisionAction &&
                    !drawerRevisionComposerOpen ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={governedPlanActionLoading !== null || actionContext === null}
                        onClick={() =>
                          void handlePersistedGovernedPlanAction(
                            "REQUEST_REVISION",
                            actionContext,
                          )
                        }
                      >
                        Request Changes
                      </Button>
                    ) : null}
                    {drawerWorkflowActions.canShowReleaseAction ? (
                      <Button
                        type="button"
                        variant="primary"
                        loading={governedPlanActionLoading === "RELEASE"}
                        disabled={governedPlanActionLoading !== null || actionContext === null}
                        onClick={() =>
                          void handlePersistedGovernedPlanAction("RELEASE", actionContext)
                        }
                      >
                        Release Plan to Athlete
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-sm text-textSecondary">
                    No authorized workflow action is available for this domain right now.
                  </div>
                )}
              </section>

              {drawerReviseComposerOpen ? (
                <section className="space-y-3 border-t border-border/70 pt-5">
                  <div className="space-y-1">
                    <h4 className="text-sm font-normal text-textPrimary">
                      {persistedPlanReviseButtonLabel(reviewDomain)}
                    </h4>
                    <p className="text-sm text-textSecondary">
                      Update the generated draft before submitting it for review.
                    </p>
                  </div>
                  {drawerReviseError ? <Alert variant="danger">{drawerReviseError}</Alert> : null}
                  {drawerReviseSuccess ? (
                    <WorkflowNeutralNotice>{drawerReviseSuccess}</WorkflowNeutralNotice>
                  ) : null}
                  <label className="space-y-1 text-sm text-textPrimary">
                    <span className="font-medium">Coach Feedback</span>
                    <textarea
                      rows={4}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary caret-current placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                      value={drawerReviseFeedback}
                      onChange={(event) => handleDrawerReviseFeedbackChange(event.target.value)}
                      placeholder={`Describe what should change in the ${reviewDomainLabel.toLowerCase()}.`}
                      disabled={drawerReviseLoading}
                    />
                  </label>
                  <div className="flex flex-wrap justify-end gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={drawerReviseLoading}
                      onClick={() => {
                        setAssistantRevisePanelDomain(null);
                        handleDrawerReviseFeedbackChange("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      loading={drawerReviseLoading}
                      disabled={drawerReviseLoading || drawerReviseIds === null}
                      onClick={handleDrawerReviseSubmit}
                    >
                      Revise Plan
                    </Button>
                  </div>
                </section>
              ) : null}

              {drawerRevisionComposerOpen ? (
                <section className="space-y-3 border-t border-border/70 pt-5">
                  <div className="space-y-1">
                    <h4 className="text-sm font-normal text-textPrimary">Request Changes</h4>
                    <p className="text-sm text-textSecondary">
                      Tell the domain coach what needs to change.
                    </p>
                  </div>
                  <form
                    className="space-y-3"
                    onSubmit={(event) => void handleRequestRevisionSubmit(event, actionContext)}
                  >
                    <label className="space-y-1 text-sm text-textPrimary">
                      <span className="font-medium">Revision feedback</span>
                      <textarea
                        rows={5}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary caret-current placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                        value={requestRevisionFeedback}
                        onChange={(event) => setRequestRevisionFeedback(event.target.value)}
                        placeholder="Describe the required changes."
                        disabled={governedPlanActionLoading === "REQUEST_REVISION"}
                      />
                    </label>
                    <div className="flex flex-wrap justify-end gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={governedPlanActionLoading === "REQUEST_REVISION"}
                        onClick={handleCancelRequestRevision}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        loading={governedPlanActionLoading === "REQUEST_REVISION"}
                        disabled={
                          governedPlanActionLoading === "REQUEST_REVISION" ||
                          requestRevisionFeedback.trim() === ""
                        }
                      >
                        Submit Request Changes
                      </Button>
                    </div>
                  </form>
                </section>
              ) : null}

              {activeDetail !== null ? (
                renderDomainPlanDaySchedule(
                  activeDetail,
                  reviewDomainLabel,
                  domainReviewScheduleDescription(workflowStatus),
                  reviewDomain,
                )
              ) : !domainState.loading && domainState.error === null ? (
                <div className="text-sm text-textSecondary">
                  No submitted plan data available for this domain.
                </div>
              ) : null}
            </div>
          </div>
          <footer className="flex justify-end border-t border-border px-5 py-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseDomainReviewDrawer}
            >
              Close
            </Button>
          </footer>
        </aside>
      </div>
    );
  }

  function renderDomainPlansIntegrationSection() {
    if (!headCoachReviewMode) return null;
    const reviewDomains = GENERATION_DOMAIN_ORDER;
    return (
      <section className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-normal text-textPrimary">Domain Coordination Matrix</h4>
          <div className="overflow-x-auto border-y border-border/70">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="text-xs font-normal uppercase tracking-wide text-textMuted">
                  <th scope="col" className="py-2 pr-3 font-normal">Domain</th>
                  <th scope="col" className="px-3 py-2 font-normal">Assigned Coach</th>
                  <th scope="col" className="px-3 py-2 font-normal">Plan status</th>
                  <th scope="col" className="px-3 py-2 font-normal">Workflow status</th>
                  <th scope="col" className="px-3 py-2 font-normal">Next action</th>
                  <th scope="col" className="px-3 py-2 font-normal">Available action</th>
                </tr>
              </thead>
              <tbody>{reviewDomains.map(renderHeadCoachDomainPlanCard)}</tbody>
            </table>
          </div>
        </div>
        <section className="space-y-3 border-t border-border/70 pt-4">
          <div className="space-y-1">
            <h4 className="text-sm font-normal text-textPrimary">Selected Domain Inspector</h4>
            {headCoachSubmittedReviewDomain === null ? (
              <p className="text-sm text-textSecondary">
                Select a domain row to view ownership, plan state, and available actions.
              </p>
            ) : (
              <p className="text-sm text-textSecondary">
                Reviewing {trainingPlanDomainLabel(headCoachSubmittedReviewDomain)}.
              </p>
            )}
          </div>
          {headCoachSubmittedReviewDomain !== null ? (
            <>
              {renderWorkflow1HeadCoachReviewActionPanel()}
              {renderPlanViewerReviewPanel()}
            </>
          ) : null}
        </section>
      </section>
    );
  }

  /** Head Coach submitted-plan cards + inline review panel (shared by pure HC Step 6 and HC-with-domain Step 6). */
  function renderHeadCoachSubmittedDomainPlansSection() {
    if (!headCoachReviewMode) return null;
    return (
      <div className="space-y-4">{renderDomainPlansIntegrationSection()}</div>
    );
  }

  function renderPersistedSkillsPlanDetail(
    detail: CoachPersistedTrainingPlanActiveDetail,
    options: {
      title?: string;
      showRevisePanel?: boolean;
    } = {},
  ) {
    const goalNames =
      detail.plan.goals
        .map((goal) => goal.goalName?.trim() ?? "")
        .filter((goalName) => goalName !== "") ?? [];
    const hasSessions = detail.days.some((day) => day.sessions.length > 0);

    return (
      <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
        <h4 className="text-sm font-normal text-textPrimary">
          {options.title ?? "Persisted Skills Plan"}
        </h4>
        <dl className="space-y-1">
          <DetailRow label="Training Plan ID" value={displayValue(detail.plan.id)} />
          {hasRenderableValue(detail.plan.name) ? (
            <DetailRow label="Name" value={displayValue(detail.plan.name)} />
          ) : null}
          {hasRenderableValue(detail.plan.status) ? (
            <DetailRow label="Status" value={displayValue(detail.plan.status)} />
          ) : null}
          {hasRenderableValue(detail.generationDomain) ? (
            <DetailRow
              label="Generation Domain"
              value={displayValue(detail.generationDomain)}
            />
          ) : null}
          {hasRenderableValue(detail.version.versionNumber) ? (
            <DetailRow
              label="Selected Version Number"
              value={displayValue(detail.version.versionNumber)}
            />
          ) : null}
          {hasRenderableValue(detail.version.status) ? (
            <DetailRow
              label="Selected Version Status"
              value={displayValue(detail.version.status)}
            />
          ) : null}
          {hasRenderableValue(detail.version.id) ? (
            <DetailRow label="Selected Version ID" value={displayValue(detail.version.id)} />
          ) : null}
          {hasRenderableValue(detail.version.source) ? (
            <DetailRow
              label="Selected Version Source"
              value={displayValue(detail.version.source)}
            />
          ) : null}
          {detail.version.startDate || detail.version.endDate ? (
            <DetailRow
              label="Selected Version Window"
              value={formatDateRange(detail.version.startDate, detail.version.endDate)}
            />
          ) : null}
          {hasRenderableValue(detail.selectedVersionRule) ? (
            <DetailRow
              label="Selected Version Rule"
              value={displayValue(detail.selectedVersionRule)}
            />
          ) : null}
        </dl>
        {goalNames.length > 0 ? (
          <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
            <h5 className="text-sm font-normal text-textPrimary">Associated Goals</h5>
            <p className="text-sm text-textPrimary">{goalNames.join(", ")}</p>
          </div>
        ) : null}
        {!hasSessions ? (
          <div className="text-sm text-textSecondary">
            Persisted plan found, but no sessions available.
          </div>
        ) : (
          <div className="space-y-3">
            {detail.days.map((day, dayOffset) => (
              <div
                key={day.id}
                className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3"
              >
                <div className="text-sm font-normal text-textPrimary">
                  {hasRenderableValue(day.date)
                    ? `Day ${day.dayIndex ?? dayOffset + 1} — ${formatDateWithWeekday(String(day.date))}`
                    : `Day ${day.dayIndex ?? dayOffset + 1}`}
                </div>
                <dl className="space-y-1">
                  {hasRenderableValue(day.date) ? (
                    <DetailRow label="Date" value={formatDateWithWeekday(String(day.date))} />
                  ) : null}
                  {hasRenderableValue(day.weekNumber) ? (
                    <DetailRow label="Week Number" value={displayValue(day.weekNumber)} />
                  ) : null}
                  <DetailRow label="Rest Day" value={displayValue(day.isRestDay)} />
                  {hasRenderableValue(day.plannedLoadMinutes) ? (
                    <DetailRow
                      label="Planned Load Minutes"
                      value={displayValue(day.plannedLoadMinutes)}
                    />
                  ) : null}
                  {hasRenderableValue(day.notes) ? (
                    <DetailRow label="Notes" value={displayValue(day.notes)} />
                  ) : null}
                </dl>
                {day.sessions.length === 0 ? (
                  <div className="text-sm text-textSecondary">
                    No sessions scheduled for this day.
                  </div>
                ) : (
                  day.sessions.map((session) => {
                    const sessionNotes = (session as { notes?: unknown }).notes;
                    return (
                      <div
                        key={session.id}
                        className="space-y-2 rounded-md border border-slate-200 bg-white p-3"
                      >
                        <dl className="space-y-1">
                          <DetailRow
                            label="Session"
                            value={displayLabelTitleCase(session.title)}
                          />
                          {hasRenderableValue(session.description) ? (
                            <DetailRow
                              label="Description"
                              value={displayValue(session.description)}
                            />
                          ) : null}
                          {hasRenderableValue(session.sessionType) ? (
                            <DetailRow
                              label="Session Type"
                              value={displayValue(session.sessionType)}
                            />
                          ) : null}
                          {hasRenderableValue(session.sessionOrder) ? (
                            <DetailRow
                              label="Session Order"
                              value={displayValue(session.sessionOrder)}
                            />
                          ) : null}
                          {hasRenderableValue(session.plannedDurationMinutes) ? (
                            <DetailRow
                              label="Planned Duration Minutes"
                              value={displayValue(session.plannedDurationMinutes)}
                            />
                          ) : null}
                          {hasRenderableValue(session.objective) ? (
                            <DetailRow label="Objective" value={displayValue(session.objective)} />
                          ) : null}
                          {hasRenderableValue(session.intensity) ? (
                            <DetailRow label="Intensity" value={displayValue(session.intensity)} />
                          ) : null}
                          {hasRenderableValue(sessionNotes) ? (
                            <DetailRow label="Notes" value={displayValue(sessionNotes)} />
                          ) : null}
                        </dl>
                        {session.sessionStructureSections.length === 0 ? (
                          <div className="text-sm text-textSecondary">
                            No session structure content available.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {session.sessionStructureSections.map((section) => (
                              <div
                                key={`${session.id}-${section.key}`}
                                className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3"
                              >
                                <div className="text-sm font-medium text-textPrimary">
                                  Session Structure: {persistedSessionStructureLabel(section.key)}
                                </div>
                                {section.items.map((item, itemOffset) => {
                                  const title = (item as { title?: unknown }).title;
                                  const instructions = (item as { instructions?: unknown }).instructions;
                                  const balls = (item as { balls?: unknown }).balls;
                                  const sets = (item as { sets?: unknown }).sets;
                                  return (
                                    <div
                                      key={`${item.label ?? item.summary ?? "item"}-${itemOffset}`}
                                      className="space-y-1 rounded-md border border-slate-200 bg-white p-3"
                                    >
                                      <dl className="space-y-1">
                                        {hasRenderableValue(item.label) ? (
                                          <DetailRow
                                            label="Label"
                                            value={displayLabelTitleCase(item.label)}
                                          />
                                        ) : null}
                                        {hasRenderableValue(title) ? (
                                          <DetailRow label="Title" value={displayValue(title)} />
                                        ) : null}
                                        {hasRenderableValue(item.summary) ? (
                                          <DetailRow
                                            label="Summary"
                                            value={displayValue(item.summary)}
                                          />
                                        ) : null}
                                        {hasRenderableValue(instructions) ? (
                                          <DetailRow
                                            label="Instructions"
                                            value={displayValue(instructions)}
                                          />
                                        ) : null}
                                        {hasRenderableValue(item.reps) ? (
                                          <DetailRow label="Reps" value={displayValue(item.reps)} />
                                        ) : null}
                                        {hasRenderableValue(balls) ? (
                                          <DetailRow label="Balls" value={displayValue(balls)} />
                                        ) : null}
                                        {hasRenderableValue(sets) ? (
                                          <DetailRow label="Sets" value={displayValue(sets)} />
                                        ) : null}
                                        {hasRenderableValue(item.durationMinutes) ? (
                                          <DetailRow
                                            label="Duration Minutes"
                                            value={displayValue(item.durationMinutes)}
                                          />
                                        ) : null}
                                        {hasRenderableValue(item.intensity) ? (
                                          <DetailRow
                                            label="Intensity"
                                            value={displayValue(item.intensity)}
                                          />
                                        ) : null}
                                        {hasRenderableValue(item.notes) ? (
                                          <DetailRow label="Notes" value={displayValue(item.notes)} />
                                        ) : null}
                                      </dl>
                                      <SkillGoalAttributionText
                                        primaryGoalName={item.primaryGoalName}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        )}
        {options.showRevisePanel ? (
          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <h5 className="text-sm font-normal text-textPrimary">Revise Skills Plan</h5>
            {reviseSkillsError ? <Alert variant="danger">{reviseSkillsError}</Alert> : null}
            {reviseSkillsSuccess ? (
              <WorkflowNeutralNotice>{reviseSkillsSuccess}</WorkflowNeutralNotice>
            ) : null}
            <label className="space-y-1 text-sm text-textPrimary">
              <span className="font-medium">Coach Feedback</span>
              <textarea
                rows={4}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary caret-current placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                value={reviseSkillsFeedback}
                onChange={(event) => setReviseSkillsFeedback(event.target.value)}
                placeholder="Describe what should change in the skills plan."
              />
            </label>
            <Button
              type="button"
              variant="secondary"
              disabled={reviseSkillsLoading || !skillsReviseIds}
              onClick={() => {
                void handleReviseSkillsPlan();
              }}
            >
              {reviseSkillsLoading ? "Revising plan..." : "Revise Plan"}
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  function renderPlanViewerReviewPanel() {
    return renderHeadCoachPlanReviewPanel();
  }

  function renderPlanViewerPersistedPlanDetail(
    detail: CoachPersistedTrainingPlanActiveDetail,
    options: {
      title?: string;
      showRevisePanel?: boolean;
    } = {},
  ) {
    return renderPersistedSkillsPlanDetail(detail, options);
  }

  function renderPlanViewerWorkflowActions() {
    return renderStep6WorkflowActionsStrip();
  }

  function renderHeadCoachOwnedSkillsPlanPanel(
    options: { showWorkflowActions?: boolean } = {},
  ) {
    if (
      !headCoachOwnedSkillsGrouping ||
      !headCoachSkillsPlanExists ||
      isHeadCoachReviewerOnlyForDomain("SKILLS")
    ) {
      return null;
    }

    const skillsStatus =
      headCoachOwnedSkillsActiveDetail?.version.status ??
      headCoachOwnedSkillsActiveDetail?.plan.status ??
      headCoachOwnedSkillsDraft?.status ??
      workspace?.domains.SKILLS.summary.status ??
      null;
    const skillsVersionNumber =
      headCoachOwnedSkillsActiveDetail?.version.versionNumber ??
      headCoachOwnedSkillsDraft?.versionNumber ??
      workspace?.domains.SKILLS.summary.versionNumber ??
      null;
    const skillsTrainingDays =
      headCoachOwnedSkillsDraft !== null
        ? draftTrainingDaysCount
        : persistedDetailDomain === "SKILLS"
          ? persistedTrainingDaysCount
          : 0;
    const skillsWorkflowLabel = assistantWorkflowStatusLabelForKind(headCoachSkillsWorkflowStatus);
    const canReviseHeadCoachSkills =
      resolveDomainRevisePlanVisible({
        assignmentDomainContext: workspace?.assignmentContext?.domains.SKILLS,
        legacyRequesterOwnsDomain: !isHeadCoachReviewerOnlyForDomain("SKILLS"),
        workflowStatus: headCoachSkillsWorkflowStatus,
        reviseIds: skillsReviseIds,
      });
    const headCoachSkillsRevisePanelOpen = assistantRevisePanelDomain === "SKILLS";
    const visibleSkillsPlanDetail = shouldRenderWorkspaceDomainPlanContent({
      shell: trainingPlanShellModel.shell,
      clickedDomain: "SKILLS",
      detailDomain: persistedDetailDomain,
      hasDetail: persistedSkillsPlanDetail !== null,
    })
      ? persistedSkillsPlanDetail
      : null;
    const persistedSkillsErrorForSkillsPanel = errorForRenderedDomain({
      error: persistedSkillsPlanError,
      errorDomain: persistedPlanErrorDomain,
      renderedDomain: "SKILLS",
    });

    return (
      <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="space-y-1">
          <h4 className="text-sm font-normal text-textPrimary">Skills Plan</h4>
          <p className="text-sm text-textSecondary">Status: {skillsWorkflowLabel}</p>
        </div>
        <dl className="space-y-1">
          <DetailRow label="Status" value={displayValue(skillsStatus)} />
          <DetailRow
            label="Version"
            value={displayValue(
              skillsVersionNumber !== null && skillsVersionNumber !== undefined
                ? `v${skillsVersionNumber}`
                : null,
            )}
          />
          <DetailRow
            label="Training Days"
            value={displayValue(skillsTrainingDays > 0 ? skillsTrainingDays : null)}
          />
        </dl>
        {generatePlanError ? <Alert variant="danger">{generatePlanError}</Alert> : null}
        {persistedSkillsErrorForSkillsPanel ? (
          <Alert variant="danger">{persistedSkillsErrorForSkillsPanel}</Alert>
        ) : null}
        {reviseSkillsSuccess ? (
          <WorkflowNeutralNotice>{reviseSkillsSuccess}</WorkflowNeutralNotice>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {headCoachSkillsViewPlanContext !== null ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void openReleasedDomainPlanViewer("SKILLS", headCoachSkillsViewPlanContext);
              }}
            >
              {assistantViewPlanLabel("SKILLS")}
            </Button>
          ) : null}
          {canReviseHeadCoachSkills ? (
            <Button
              type="button"
              variant="secondary"
              disabled={reviseSkillsLoading}
              onClick={() => {
                setAssistantRevisePanelDomain("SKILLS");
              }}
            >
              {reviseSkillsLoading ? "Revising plan..." : "Revise Plan"}
            </Button>
          ) : null}
        </div>
        {visibleSkillsPlanDetail !== null
          ? renderPlanViewerPersistedPlanDetail(visibleSkillsPlanDetail)
          : null}
        {headCoachSkillsRevisePanelOpen ? (
          <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
            <h5 className="text-sm font-normal text-textPrimary">Revise Skills Plan</h5>
            {reviseSkillsError ? <Alert variant="danger">{reviseSkillsError}</Alert> : null}
            <label className="space-y-1 text-sm text-textPrimary">
              <span className="font-medium">Coach Feedback</span>
              <textarea
                rows={4}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary caret-current placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                value={reviseSkillsFeedback}
                onChange={(event) => {
                  setReviseSkillsFeedback(event.target.value);
                  setReviseSkillsError(null);
                  setReviseSkillsSuccess(null);
                }}
                placeholder="Describe what should change in the skills plan."
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={reviseSkillsLoading}
                onClick={() => {
                  setAssistantRevisePanelDomain(null);
                  setReviseSkillsFeedback("");
                  setReviseSkillsError(null);
                  setReviseSkillsSuccess(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={reviseSkillsLoading || !skillsReviseIds}
                onClick={() => {
                  void handleReviseSkillsPlan();
                }}
              >
                {reviseSkillsLoading ? "Revising plan..." : "Revise Plan"}
              </Button>
            </div>
          </div>
        ) : null}
        {options.showWorkflowActions === false ? null : renderPlanViewerWorkflowActions()}
      </div>
    );
  }

  function renderHeadCoachReviewWorkspace() {
    if (!headCoachReviewMode) return null;
    return (
      <div className="space-y-4">
        {renderLockedPlanningContextSummaryForDomainIntegration()}
        {generatePlanError ? <Alert variant="danger">{generatePlanError}</Alert> : null}
        {renderHeadCoachSubmittedDomainPlansSection()}
      </div>
    );
  }

  function renderDownstreamUpstreamPlanningReadOnlySection() {
    const locked = effectiveDownstreamPlanningContextLocked;
    const planningGoalLabel = setupState.hasHeadCoachConfigured
      ? "Head Coach Goal"
      : "Planning Goal";
    return (
      <section className="space-y-4 rounded-xl border border-border bg-bg/60 p-4 sm:p-5">
        <div className="space-y-1">
          <h3 className="text-base font-normal text-textPrimary">
            Locked Planning Context
          </h3>
          <p className="text-sm text-textSecondary">
            Review the locked planning context before creating, revising, or submitting your domain
            plan.
          </p>
        </div>
        {upstreamPlanningContextLoading ? (
          <div className="text-sm text-textSecondary">Loading upstream planning context…</div>
        ) : null}
        {upstreamPlanningContextError ? (
          <Alert variant="danger">{upstreamPlanningContextError}</Alert>
        ) : null}
        {!upstreamPlanningContextLoading &&
        !upstreamPlanningContextError &&
        setupState.hasHeadCoachConfigured &&
        !locked ? (
          <Alert variant="warning">{UPSTREAM_CONTEXT_NOT_LOCKED_MESSAGE}</Alert>
        ) : null}
        <dl className="space-y-2">
          <DetailRow label="Planning Context" value={locked ? "Locked" : "Not Locked"} />
          <DetailRow
            label="Plan Window"
            value={formatDateRange(
              upstreamPlanningContext?.planWindow?.startDate ??
                upstreamPlanningContext?.startDate ??
                null,
              upstreamPlanningContext?.planWindow?.endDate ??
                upstreamPlanningContext?.endDate ??
                null,
            )}
          />
          <DetailRow
            label="Validated Level"
            value={displayValue(lockedPlanningContextCardFields.validatedLevel)}
          />
          <DetailRow
            label="Weekly Workload"
            value={displayValue(lockedPlanningContextCardFields.weeklyWorkload)}
          />
          <DetailRow
            label="Current Weekly Training Hours"
            value={displayValue(lockedPlanningContextCardFields.weeklyTrainingHours)}
          />
          <DetailRow
            label="Season Phase"
            value={displayValue(lockedPlanningContextCardFields.seasonPhase)}
          />
          {renderPlanningGoalSummaryRows({
            goals: lockedUpstreamGoals,
            planningGoalLabel,
          })}
        </dl>
      </section>
    );
  }

  function renderAssistantDomainWorkspace() {
    if (!shouldForceAssistantDomainWorkspace || currentCoachGenerationDomain === null) {
      return null;
    }

    const workflowStatusLabel = assistantPlanDiscoveryLoading
      ? "Loading plan..."
      : assistantWorkflowStatusLabelForKind(assistantDomainWorkflowStatus);
    const context = upstreamPlanningContext?.planningContext;
    const planWindowStart = assistantLockedUpstreamDerived.lockedPlanWindowStart;
    const planWindowEnd = assistantLockedUpstreamDerived.lockedPlanWindowEnd;
    const planningContextWorkload = context?.workload ?? null;
    const topLevelWorkload = upstreamPlanningContext?.workload ?? null;
    const contextWorkload = planningContextWorkload ?? topLevelWorkload;
    const workloadClassification =
      workloadAssessmentResult?.workloadClassification ?? null;
    const planningContextSeason = context?.season ?? null;
    const topLevelSeason = upstreamPlanningContext?.season ?? null;
    const contextSeason = planningContextSeason ?? topLevelSeason;
    const contextGoals = resolveDisplayedPlanningGoals(upstreamPlanningContext);
    const weeklyTrainingHours = lockedPlanningContextCardFields.weeklyTrainingHours;
    const workloadRecommendedRange = lockedPlanningContextCardFields.weeklyWorkload;
    const workloadStatusRaw =
      contextWorkload?.trainingLoadStatus ??
      contextWorkload?.classificationStatus ??
      contextWorkload?.status ??
      workloadClassification?.status ??
      upstreamPlanningContext?.workloadSummary.status ??
      null;
    const workloadStatus =
      workloadStatusRaw !== null ? toTitleCaseInput(String(workloadStatusRaw).replace(/_/g, " ")) : null;
    const workloadSportRaw = assistantLockedUpstreamDerived.lockedSportCode;
    const workloadSport =
      typeof workloadSportRaw === "string" && workloadSportRaw.trim() !== ""
        ? formatSportLabel(workloadSportRaw)
        : null;
    const workloadAgeBand =
      (planningContextWorkload?.ageBand ?? topLevelWorkload?.ageBand) !== null &&
      (planningContextWorkload?.ageBand ?? topLevelWorkload?.ageBand) !== undefined
        ? toTitleCaseInput(
            String(planningContextWorkload?.ageBand ?? topLevelWorkload?.ageBand).replace(/_/g, " "),
          )
        : null;
    const workloadNote = contextWorkload?.restrictionSummary ?? null;
    const seasonPhase =
      lockedPlanningContextCardFields.seasonPhase ??
      contextSeason?.phaseName ??
      contextSeason?.phaseCode ??
      context?.phase ??
      upstreamPlanningContext?.phase ??
      null;
    const validatedLevel = lockedPlanningContextCardFields.validatedLevel;
    const currentDomainGeneratePermission =
      resolveGeneratePermissionForDomain(currentCoachGenerationDomain);
    const showCreateAction =
      !assistantPlanDiscoveryLoading &&
      assistantDomainWorkflowStatus === "not_created" &&
      currentDomainGeneratePermission.canShowGenerate;
    const workflow1LockedContextDomainCoachCanCreate =
      setupState.hasHeadCoachConfigured &&
      currentCoachGenerationDomain !== null &&
      effectiveDownstreamPlanningContextLocked &&
      !planOwnershipLoading &&
      currentDomainGeneratePermission.canShowGenerate &&
      currentDomainGenerationJob?.status !== "QUEUED" &&
      currentDomainGenerationJob?.status !== "RUNNING";
    const createPlanLocalError =
      workflow1LockedContextDomainCoachCanCreate
        ? null
        : (generatePlanLocalErrorsByDomain[currentCoachGenerationDomain] ?? null);
    const showReviseAction =
      !assistantPlanDiscoveryLoading && (
      assistantDomainWorkflowStatus === "draft_generated" ||
      assistantDomainWorkflowStatus === "revision_requested");
    const showSubmitAction = assistantDomainShowSubmitAction;
    const showDirectReleaseAction =
      !assistantPlanDiscoveryLoading &&
      persistedGovernedPlanContext !== null &&
      resolveDomainReleaseVisible({
        assignmentReleaseMode: workspace?.assignmentContext?.releaseMode,
        assignmentDomainContext:
          workspace?.assignmentContext?.domains[persistedGovernedPlanContext.generationDomain],
        requiredReleaseMode: "DIRECT_DOMAIN_RELEASE",
        legacyCanRelease:
          !setupState.hasHeadCoachConfigured &&
          persistedGovernedAllowedActions.has("RELEASE"),
        planId: persistedGovernedPlanContext.planId,
        versionId: persistedGovernedPlanContext.versionId,
      });
    const canReviseSkills =
      currentCoachGenerationDomain === "SKILLS" &&
      resolveDomainRevisePlanVisible({
        assignmentDomainContext: workspace?.assignmentContext?.domains.SKILLS,
        legacyRequesterOwnsDomain: true,
        workflowStatus: assistantDomainWorkflowStatus,
        reviseIds: skillsReviseIds,
      });
    const canReviseNutrition =
      currentCoachGenerationDomain === "NUTRITION" &&
      resolveDomainRevisePlanVisible({
        assignmentDomainContext: workspace?.assignmentContext?.domains.NUTRITION,
        legacyRequesterOwnsDomain: true,
        workflowStatus: assistantDomainWorkflowStatus,
        reviseIds: nutritionReviseIds,
      });
    const canReviseSandC =
      currentCoachGenerationDomain === "S_AND_C" &&
      resolveDomainRevisePlanVisible({
        assignmentDomainContext: workspace?.assignmentContext?.domains.S_AND_C,
        legacyRequesterOwnsDomain: true,
        workflowStatus: assistantDomainWorkflowStatus,
        reviseIds: sandCReviseIds,
      });
    const canReviseCurrentDomain = canReviseSkills || canReviseNutrition || canReviseSandC;
    const currentDomainReviseIds =
      currentCoachGenerationDomain === "SKILLS"
        ? skillsReviseIds
        : currentCoachGenerationDomain === "NUTRITION"
          ? nutritionReviseIds
          : currentCoachGenerationDomain === "S_AND_C"
            ? sandCReviseIds
            : null;
    logTrainingPlanActionVisibilityDiagnostic({
      renderedDomain: currentCoachGenerationDomain,
      currentDomain: currentCoachGenerationDomain,
      workspace,
      versionNumber:
        persistedDetailMatchesCurrentDomain
          ? persistedSkillsPlanDetail?.version.versionNumber ?? null
          : latestDraftMatchesCurrentDomain
            ? latestSkillsDraft?.versionNumber ?? null
            : null,
      allowedActions:
        currentCoachGenerationDomain !== null
          ? workspace?.domains[currentCoachGenerationDomain]?.allowedActions ?? []
          : [],
      persistedDetailStatus:
        persistedDetailMatchesCurrentDomain
          ? persistedSkillsPlanDetail?.version.status ??
            persistedSkillsPlanDetail?.plan.status ??
            null
          : null,
      isEditableDraft:
        assistantDomainWorkflowStatus === "draft_generated" ||
        assistantDomainWorkflowStatus === "revision_requested",
      canRevise: canReviseCurrentDomain,
      hiddenReason: canReviseCurrentDomain
        ? null
        : currentDomainReviseIds === null
          ? "missing revise plan/version ids"
          : !showReviseAction
            ? `workflow status ${assistantDomainWorkflowStatus} is not editable`
            : null,
    });
    const assistantRevisePanelOpen =
      canReviseCurrentDomain && assistantRevisePanelDomain === currentCoachGenerationDomain;

    const assistantReviseError =
      currentCoachGenerationDomain === "SKILLS"
        ? reviseSkillsError
        : currentCoachGenerationDomain === "NUTRITION"
          ? reviseNutritionError
          : reviseSandCError;
    const assistantReviseSuccess =
      currentCoachGenerationDomain === "SKILLS"
        ? reviseSkillsSuccess
        : currentCoachGenerationDomain === "NUTRITION"
          ? reviseNutritionSuccess
          : reviseSandCSuccess;
    const assistantReviseFeedback =
      currentCoachGenerationDomain === "SKILLS"
        ? reviseSkillsFeedback
        : currentCoachGenerationDomain === "NUTRITION"
          ? reviseNutritionFeedback
          : reviseSandCFeedback;
    const assistantReviseLoading =
      currentCoachGenerationDomain === "SKILLS"
        ? reviseSkillsLoading
        : currentCoachGenerationDomain === "NUTRITION"
          ? reviseNutritionLoading
          : reviseSandCLoading;
    const currentWorkspaceSummary =
      workspace?.domains[currentCoachGenerationDomain]?.summary ?? null;
    const currentWorkspacePlanId = currentWorkspaceSummary?.trainingPlanId?.trim() ?? "";
    const currentWorkspaceVersionId = currentWorkspaceSummary?.versionId?.trim() ?? "";
    const currentDomainHasPersistedIds =
      currentWorkspacePlanId !== "" &&
      currentWorkspaceVersionId !== "";
    const generatedDomainAwaitingWorkspaceIds = shouldShowGeneratedPlanSyncingNotice({
      generateResultMatchesCurrentDomain,
      currentDomainHasPersistedIds,
    });
    const assistantPlanTrainingPlanId =
      currentWorkspacePlanId !== ""
        ? currentWorkspacePlanId
        : requestedPlanId !== null && persistedDetailMatchesCurrentDomain
        ? persistedSkillsPlanDetail?.plan.id ?? null
        : latestDraftMatchesCurrentDomain
          ? latestSkillsDraft?.trainingPlanId ?? null
          : null;
    const assistantPlanVersionId =
      currentWorkspaceVersionId !== ""
        ? currentWorkspaceVersionId
        : requestedPlanId !== null && persistedDetailMatchesCurrentDomain
        ? persistedSkillsPlanDetail?.version.id ?? null
        : latestDraftMatchesCurrentDomain
          ? latestSkillsDraft?.trainingPlanVersionId ?? null
          : null;
    const canViewPlan = resolveDomainViewPlanVisible({
      assignmentDomainContext: workspace?.assignmentContext?.domains[currentCoachGenerationDomain],
      legacyCanOpen: resolvedWorkflowPlanId.trim() !== "",
      planId: resolvedWorkflowPlanId,
      versionId: assistantPlanVersionId,
    });
    const assistantPlanVersionLabel =
      requestedPlanId !== null && persistedDetailMatchesCurrentDomain
        ? persistedSkillsPlanDetail?.version.versionNumber ?? null
        : latestDraftMatchesCurrentDomain
          ? latestSkillsDraft?.versionNumber ?? null
          : null;
    const persistedPlanErrorForCurrentDomain = errorForRenderedDomain({
      error: persistedSkillsPlanError,
      errorDomain: persistedPlanErrorDomain,
      renderedDomain: currentCoachGenerationDomain,
    });
    const latestDraftErrorForCurrentDomain = errorForRenderedDomain({
      error: latestSkillsDraftError,
      errorDomain: latestSkillsDraftErrorDomain,
      renderedDomain: currentCoachGenerationDomain,
    });
    const renderAssistantNutritionTotals = (
      label: string,
      items: AssistantNutritionItem[],
    ): ReactElement | null =>
      currentCoachGenerationDomain !== "NUTRITION"
        ? null
        : renderNutritionMacroTotals(label, items);

    const assistantNutritionWeeklyItems: AssistantNutritionItem[] =
      currentCoachGenerationDomain !== "NUTRITION"
        ? []
        : requestedPlanId !== null && persistedDetailMatchesCurrentDomain
          ? (
              persistedSkillsPlanDetail?.days.flatMap((day) => {
                const dayKey = day.date?.trim() ?? `day-${day.dayIndex ?? ""}`;
                return day.sessions.flatMap((session) =>
                  mergeNutritionItemsWithDraftFallback(
                    session.sessionStructureSections.flatMap((section) => section.items),
                    nutritionDraftItemsBySessionKey.get(
                      `${dayKey}::${session.title?.trim() ?? ""}`,
                    ) ?? [],
                  ),
                );
              }) ?? []
            )
          : latestDraftMatchesCurrentDomain
            ? (
                latestSkillsDraft?.days.flatMap((day) =>
                  day.sessions.flatMap((session) => session.items),
                ) ?? []
              )
            : [];

    const renderAssistantNutritionItems = (items: AssistantNutritionItem[]): ReactElement | null =>
      currentCoachGenerationDomain !== "NUTRITION" ? null : renderNutritionMealItems(items);
    const resolveAssistantSandCItems = (
      primaryItems: CoachAthleteGeneratedDraftItem[],
      fallbackItems: CoachAthleteGeneratedDraftItem[] = [],
    ): CoachAthleteGeneratedDraftItem[] =>
      primaryItems.length > 0 ? primaryItems : fallbackItems;
    const resolveAssistantSkillsItems = (
      primaryItems: CoachAthleteGeneratedDraftItem[],
      fallbackItems: CoachAthleteGeneratedDraftItem[] = [],
    ): CoachAthleteGeneratedDraftItem[] =>
      primaryItems.length > 0 ? primaryItems : fallbackItems;
    const renderAssistantSkillsItems = (items: CoachAthleteGeneratedDraftItem[]) => {
      if (currentCoachGenerationDomain !== "SKILLS") return null;
      if (items.length === 0) {
        return (
          <div className="text-sm text-textSecondary">
            No drills returned for this session.
          </div>
        );
      }

      return (
        <div className="space-y-2">
          {items.map((item, itemOffset) => (
            <div
              key={`${item.label ?? item.summary ?? "drill"}-${itemOffset}`}
              className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-3"
            >
              <dl className="space-y-1">
                <DetailRow
                  label="Drill / Skill"
                  value={displayLabelTitleCase(item.label) || displayValue(item.label)}
                />
                {hasRenderableValue(item.itemType) ? (
                  <DetailRow label="Skill Code" value={displayValue(item.itemType)} />
                ) : null}
                {hasRenderableValue(item.summary) ? (
                  <DetailRow label="Summary" value={displayValue(item.summary)} />
                ) : null}
                {hasRenderableValue(item.reps) ? (
                  <DetailRow label="Reps" value={displayValue(item.reps)} />
                ) : null}
                {hasRenderableValue(item.durationMinutes) ? (
                  <DetailRow
                    label="Duration"
                    value={formatMinutesAsHoursMinutes(item.durationMinutes)}
                  />
                ) : null}
                {hasRenderableValue(item.notes) ? (
                  <DetailRow label="Notes" value={displayValue(item.notes)} />
                ) : null}
              </dl>
              <SkillGoalAttributionText primaryGoalName={item.primaryGoalName} />
            </div>
          ))}
        </div>
      );
    };
    const renderAssistantSandCItems = (items: CoachAthleteGeneratedDraftItem[]) => {
      if (currentCoachGenerationDomain !== "S_AND_C") return null;
      if (items.length === 0) {
        return (
          <div className="text-sm text-textSecondary">
            No exercises returned for this session.
          </div>
        );
      }

      return (
        <div className="space-y-2">
          {items.map((item, itemOffset) => (
            <div
              key={`${item.exerciseCatalogItemId ?? item.label ?? item.summary ?? "exercise"}-${itemOffset}`}
              className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-3"
            >
              <dl className="space-y-1">
                <DetailRow
                  label="Exercise"
                  value={displayLabelTitleCase(item.label) || displayValue(item.label)}
                />
                {hasRenderableValue(item.exerciseCatalogItemId) ? (
                  <DetailRow
                    label="Exercise Catalog Item ID"
                    value={displayValue(item.exerciseCatalogItemId)}
                  />
                ) : null}
                {hasRenderableValue(item.sets) ? (
                  <DetailRow label="Sets" value={displayValue(item.sets)} />
                ) : null}
                {hasRenderableValue(item.reps) ? (
                  <DetailRow label="Reps" value={displayValue(item.reps)} />
                ) : null}
                {hasRenderableValue(item.durationMinutes) ? (
                  <DetailRow
                    label="Duration"
                    value={formatMinutesAsHoursMinutes(item.durationMinutes)}
                  />
                ) : null}
                {hasRenderableValue(item.intensity) ? (
                  <DetailRow label="Intensity" value={displayValue(item.intensity)} />
                ) : null}
                {hasRenderableValue(item.notes) ? (
                  <DetailRow label="Notes" value={displayValue(item.notes)} />
                ) : null}
              </dl>
            </div>
          ))}
        </div>
      );
    };

    return (
      <Card accent={false} className={COACH_WORKFLOW_OUTER_CARD_CLASS}>
        <div className="space-y-2 border-b border-border bg-card px-4 py-5 sm:px-6 sm:py-6">
          <div className="space-y-1">
            <h2 className="text-xl font-normal text-textPrimary">Training Plan</h2>
            <p className="text-sm text-textSecondary">
              Locked planning context for your assigned domain.
            </p>
          </div>
          <dl className="grid gap-2 sm:grid-cols-2">
            <DetailRow label="Athlete" value={assistantAthleteDisplay} />
            <DetailRow label="Your Role" value={assistantRoleLabel(currentCoachGenerationDomain)} />
            <DetailRow
              label="Planning Context"
              value={
                upstreamPlanningContextLoading
                  ? "Loading locked planning context..."
                  : assistantLockedPlanningContextError
                    ? assistantLockedPlanningContextError
                    : effectiveDownstreamPlanningContextLocked
                      ? "Locked"
                      : "Waiting for locked planning context."
              }
            />
            <DetailRow label="Plan Window" value={formatDateRange(planWindowStart, planWindowEnd)} />
          </dl>
        </div>

        <div className="space-y-6 bg-card px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10">
          <section className="space-y-4 rounded-xl border border-border bg-bg/60 p-4 sm:p-5">
            <div className="space-y-1">
              <h3 className="text-base font-normal text-textPrimary">Context Summary</h3>
              <p className="text-sm text-textSecondary">
                Read-only planning inputs from the locked planning context for your domain plan.
              </p>
            </div>
            {upstreamPlanningContextLoading ? (
              <div className="text-sm text-textSecondary">Loading locked planning context…</div>
            ) : assistantLockedPlanningContextError ? (
              <Alert variant="danger">{assistantLockedPlanningContextError}</Alert>
            ) : !effectiveDownstreamPlanningContextLocked ? (
              <Alert variant="warning">Waiting for locked planning context.</Alert>
            ) : (
              <dl className="space-y-2">
                <DetailRow label="Sport" value={displayValue(workloadSport)} />
                <DetailRow label="Validated Level" value={displayValue(validatedLevel)} />
                <DetailRow label="Plan Window" value={formatDateRange(planWindowStart, planWindowEnd)} />
                <DetailRow label="Current Weekly Training Hours" value={displayValue(weeklyTrainingHours)} />
                <DetailRow
                  label="Recommended Range"
                  value={displayValue(workloadRecommendedRange)}
                />
                <DetailRow
                  label="Training Load Status"
                  value={displayValue(workloadStatus)}
                />
                <DetailRow label="Age Band" value={displayValue(workloadAgeBand)} />
                {workloadNote ? (
                  <DetailRow label="Workload Note" value={displayValue(workloadNote)} />
                ) : null}
                <DetailRow label="Season Phase" value={displayValue(seasonPhase)} />
                {renderPlanningGoalSummaryRows({
                  goals: contextGoals,
                  planningGoalLabel: setupState.hasHeadCoachConfigured
                    ? "Head Coach Goal"
                    : "Planning Goal",
                })}
              </dl>
            )}
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-bg/60 p-4 sm:p-5">
            <div className="space-y-1">
              <h3 className="text-base font-normal text-textPrimary">
                {assistantDomainPlanTitle(currentCoachGenerationDomain)}
              </h3>
              <p className="text-sm text-textSecondary">Status: {workflowStatusLabel}</p>
              <p className="text-xs text-textMuted">
                Training Plan ID: {displayValue(assistantPlanTrainingPlanId)} · Version ID:{" "}
                {displayValue(assistantPlanVersionId)} · Version:{" "}
                {displayValue(
                  assistantPlanVersionLabel !== null && assistantPlanVersionLabel !== undefined
                    ? `v${assistantPlanVersionLabel}`
                    : null,
                )}
              </p>
              {assistantNutritionWeeklyItems.length > 0
                ? renderAssistantNutritionTotals("Weekly Total", assistantNutritionWeeklyItems)
                : null}
            </div>

            {generatePlanError ? <Alert variant="danger">{generatePlanError}</Alert> : null}
            {!assistantPlanDiscoveryLoading && persistedPlanErrorForCurrentDomain ? (
              <Alert variant="danger">{persistedPlanErrorForCurrentDomain}</Alert>
            ) : null}
            {!assistantPlanDiscoveryLoading && latestDraftErrorForCurrentDomain ? (
              <Alert variant="danger">{latestDraftErrorForCurrentDomain}</Alert>
            ) : null}
            {governedPlanActionError ? <Alert variant="danger">{governedPlanActionError}</Alert> : null}
            {governedPlanActionSuccess ? (
              <WorkflowNeutralNotice>
                <div className="space-y-1">
                  <div>{governedPlanActionSuccess}</div>
                  {governedPlanActionSuccessFeedback ? (
                    <div className="text-sm text-textSecondary">
                      Head Coach Notes: {governedPlanActionSuccessFeedback}
                    </div>
                  ) : null}
                </div>
              </WorkflowNeutralNotice>
            ) : null}

            {assistantPlanDiscoveryLoading ? (
              <div className="text-sm text-textSecondary">Loading plan...</div>
            ) : null}

            {renderGenerationJobProgress(currentDomainGenerationJob)}

            <div className="flex flex-wrap gap-2">
              {showCreateAction ? (
                <Button
                  type="button"
                  variant="primary"
                  disabled={
                    workflow1LockedContextDomainCoachCanCreate
                      ? false
                      : resolveLegacyAssistantCreateButtonDisabled({
                          generatePlanActionDisabled,
                          localError: createPlanLocalError,
                        })
                  }
                  onClick={() => {
                    void handleGenerateTrainingPlan(currentCoachGenerationDomain);
                  }}
                >
                  {createPlanLocalError === UPSTREAM_CONTEXT_NOT_LOCKED_MESSAGE
                    && currentDomainGenerationJob === null
                      ? PLANNING_CONTEXT_REQUIRED_BUTTON_LABEL
                      : renderGenerationJobButtonLabel(
                          currentCoachGenerationDomain,
                          currentDomainGenerationJob,
                        )}
                </Button>
              ) : null}

              {canViewPlan ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={false}
                  onClick={() => {
                    const planIdToOpen = resolvedWorkflowPlanId.trim();
                    if (!canViewPlan || planIdToOpen === "") return;
                    void refreshPersistedPlanDetail(planIdToOpen, currentCoachGenerationDomain, {
                      updateWorkflowRequestedPlanId: true,
                    });
                    router.replace(planningProfileHrefForAthlete(athleteIdTrimmed, planIdToOpen));
                  }}
                >
                  {assistantViewPlanLabel(currentCoachGenerationDomain)}
                </Button>
              ) : null}

              {canReviseCurrentDomain ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={assistantReviseLoading}
                  onClick={() => {
                    setAssistantRevisePanelDomain(currentCoachGenerationDomain);
                  }}
                >
                  {assistantReviseLoading ? "Revising plan..." : "Revise Plan"}
                </Button>
              ) : null}

              {assistantDomainSubmitVersionMismatchNotice ? (
                <p className="w-full text-sm text-textSecondary">
                  Plan permissions are syncing to the latest draft version. Submit will be
                  available when refresh completes.
                </p>
              ) : null}

              {showSubmitAction ? (
                <Button
                  type="button"
                  variant="secondary"
                  loading={
                    governedPlanActionLoading === "SUBMIT_REVIEW" ||
                    assistantGovernedDetailRefreshing
                  }
                  disabled={
                    governedPlanActionLoading !== null || assistantGovernedDetailRefreshing
                  }
                  onClick={() => void handlePersistedGovernedPlanAction("SUBMIT_REVIEW")}
                >
                  {assistantDomainWorkflowStatus === "revision_requested"
                    ? "Resubmit for Head Coach Review"
                    : "Submit for Head Coach Review"}
                </Button>
              ) : null}
            </div>

            {assistantRevisePanelOpen ? (
              <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <h4 className="text-sm font-normal text-textPrimary">
                  {persistedPlanReviseButtonLabel(currentCoachGenerationDomain)}
                </h4>
                {assistantReviseError ? <Alert variant="danger">{assistantReviseError}</Alert> : null}
                {assistantReviseSuccess ? (
                  <WorkflowNeutralNotice>{assistantReviseSuccess}</WorkflowNeutralNotice>
                ) : null}
                <label className="space-y-1 text-sm text-textPrimary">
                  <span className="font-medium">Coach Feedback</span>
                  <textarea
                    rows={4}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary caret-current placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                    value={assistantReviseFeedback}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (currentCoachGenerationDomain === "SKILLS") {
                        setReviseSkillsFeedback(nextValue);
                        setReviseSkillsError(null);
                        setReviseSkillsSuccess(null);
                      } else if (currentCoachGenerationDomain === "NUTRITION") {
                        setReviseNutritionFeedback(nextValue);
                        setReviseNutritionError(null);
                        setReviseNutritionSuccess(null);
                      } else {
                        setReviseSandCFeedback(nextValue);
                        setReviseSandCError(null);
                        setReviseSandCSuccess(null);
                      }
                    }}
                    placeholder={
                      currentCoachGenerationDomain === "SKILLS"
                        ? "Describe what should change in the skills plan."
                        : currentCoachGenerationDomain === "NUTRITION"
                          ? "Describe what should change in the nutrition plan."
                          : "Describe what should change in the S&C plan."
                    }
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={assistantReviseLoading}
                    onClick={() => {
                      setAssistantRevisePanelDomain(null);
                      if (currentCoachGenerationDomain === "SKILLS") {
                        setReviseSkillsFeedback("");
                        setReviseSkillsError(null);
                        setReviseSkillsSuccess(null);
                      } else if (currentCoachGenerationDomain === "NUTRITION") {
                        setReviseNutritionFeedback("");
                        setReviseNutritionError(null);
                        setReviseNutritionSuccess(null);
                      } else {
                        setReviseSandCFeedback("");
                        setReviseSandCError(null);
                        setReviseSandCSuccess(null);
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={assistantReviseLoading}
                    onClick={() => {
                      if (currentCoachGenerationDomain === "SKILLS") {
                        void handleReviseSkillsPlan();
                      } else if (currentCoachGenerationDomain === "NUTRITION") {
                        void handleReviseNutritionPlan();
                      } else {
                        void handleReviseSandCPlan();
                      }
                    }}
                  >
                    {assistantReviseLoading ? "Revising plan..." : "Revise Plan"}
                  </Button>
                </div>
              </div>
            ) : null}

            {!assistantPlanDiscoveryLoading &&
            requestedPlanId !== null &&
            canViewPlan &&
            persistedDetailMatchesCurrentDomain &&
            persistedSkillsPlanDetail ? (
              <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
                <h4 className="text-sm font-normal text-textPrimary">
                  {trainingPlanDomainLabel(currentCoachGenerationDomain)}
                </h4>
                <dl className="space-y-1">
                  <DetailRow label="Status" value={displayValue(persistedSkillsPlanDetail.version.status ?? persistedSkillsPlanDetail.plan.status)} />
                  <DetailRow
                    label="Plan Window"
                    value={formatDateRange(
                      persistedSkillsPlanDetail.version.startDate,
                      persistedSkillsPlanDetail.version.endDate,
                    )}
                  />
                  <DetailRow
                    label="Total Planned Duration"
                    value={formatMinutesAsHoursMinutes(activePlanTotalDurationMinutes)}
                  />
                  <DetailRow
                    label="Training Days"
                    value={displayValue(activePlanTrainingDaysCount > 0 ? activePlanTrainingDaysCount : null)}
                  />
                </dl>
                {persistedSkillsPlanHasSessions ? (
                  <div className="space-y-3">
                    {persistedSkillsPlanDetail.days.map((day, dayOffset) => (
                      <div
                        key={day.id}
                        className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="text-sm font-normal text-textPrimary">
                          {hasRenderableValue(day.date)
                            ? `Day ${day.dayIndex ?? dayOffset + 1} — ${formatDateWithWeekday(String(day.date))}`
                            : `Day ${day.dayIndex ?? dayOffset + 1}`}
                        </div>
                        {(() => {
                          const dayKey = day.date?.trim() ?? `day-${day.dayIndex ?? dayOffset + 1}`;
                          const mergedDayNutritionItems = day.sessions.flatMap((session) =>
                            mergeNutritionItemsWithDraftFallback(
                              session.sessionStructureSections.flatMap((section) => section.items),
                              nutritionDraftItemsBySessionKey.get(
                                `${dayKey}::${session.title?.trim() ?? ""}`,
                              ) ?? [],
                            ),
                          );
                          return renderAssistantNutritionTotals("Day Total", mergedDayNutritionItems);
                        })()}
                        {day.sessions.map((session, sessionOffset) => (
                          <div
                            key={`${session.id}-${sessionOffset}`}
                            className="space-y-2 rounded-md border border-slate-200 bg-white p-3"
                          >
                            {(() => {
                              const dayKey = day.date?.trim() ?? `day-${day.dayIndex ?? dayOffset + 1}`;
                              const mergedNutritionItems = mergeNutritionItemsWithDraftFallback(
                                session.sessionStructureSections.flatMap((section) => section.items),
                                nutritionDraftItemsBySessionKey.get(
                                  `${dayKey}::${session.title?.trim() ?? ""}`,
                                ) ?? [],
                              );
                              const sandCItems = resolveAssistantSandCItems(
                                [],
                                session.sessionStructureSections.find(
                                  (section) => section.key.trim().toLowerCase() === "exercise",
                                )?.items ?? [],
                              );
                              const skillsItems = resolveAssistantSkillsItems(
                                [],
                                session.sessionStructureSections.find(
                                  (section) => section.key.trim().toLowerCase() === "skill",
                                )?.items ?? [],
                              );
                              return (
                                <>
                            <dl className="space-y-1">
                              {hasRenderableValue(session.title) ? (
                                <DetailRow label="Title" value={displayLabelTitleCase(session.title)} />
                              ) : null}
                              {hasRenderableValue(session.objective) ? (
                                <DetailRow label="Objective" value={displayValue(session.objective)} />
                              ) : null}
                              <DetailRow
                                label="Duration"
                                value={formatMinutesAsHoursMinutes(readSessionDurationMinutes(session))}
                              />
                              {hasRenderableValue(session.intensity) ? (
                                <DetailRow label="Intensity" value={displayValue(session.intensity)} />
                              ) : null}
                            </dl>
                            {renderAssistantNutritionItems(mergedNutritionItems)}
                            {renderAssistantSandCItems(sandCItems)}
                            {renderAssistantSkillsItems(skillsItems)}
                                </>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-textSecondary">Persisted plan found, but no sessions available.</div>
                )}
              </div>
            ) : !assistantPlanDiscoveryLoading && generatedDomainAwaitingWorkspaceIds ? (
              <WorkflowNeutralNotice>
                Generated plan is syncing to the training plan workspace. Plan content will load
                when the saved plan and version IDs are available.
              </WorkflowNeutralNotice>
            ) : !assistantPlanDiscoveryLoading && latestSkillsDraft ? (
              <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
                <h4 className="text-sm font-normal text-textPrimary">
                  {generationDraftTitle(currentCoachGenerationDomain)}
                </h4>
                <dl className="space-y-1">
                  <DetailRow label="Status" value={displayValue(latestSkillsDraft.status)} />
                  <DetailRow label="Version Number" value={displayValue(latestSkillsDraft.versionNumber)} />
                  <DetailRow
                    label="Total Planned Duration"
                    value={formatMinutesAsHoursMinutes(activePlanTotalDurationMinutes)}
                  />
                  <DetailRow
                    label="Training Days"
                    value={displayValue(activePlanTrainingDaysCount > 0 ? activePlanTrainingDaysCount : null)}
                  />
                </dl>
                {sortedLatestSkillsDraftDays.length > 0 ? (
                  <div className="space-y-3">
                    {sortedLatestSkillsDraftDays.map((day, dayOffset) => (
                      <div
                        key={`${day.dayIndex ?? dayOffset}-${day.date ?? "day"}`}
                        className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="text-sm font-normal text-textPrimary">
                          {hasRenderableValue(day.date)
                            ? `Day ${day.dayIndex ?? dayOffset + 1} — ${formatDateWithWeekday(String(day.date))}`
                            : `Day ${day.dayIndex ?? dayOffset + 1}`}
                        </div>
                        {renderAssistantNutritionTotals(
                          "Day Total",
                          day.sessions.flatMap((session) => session.items),
                        )}
                        {day.sessions.map((session, sessionOffset) => (
                          <div
                            key={`${session.sessionIndex ?? sessionOffset}-${session.title ?? "session"}`}
                            className="space-y-2 rounded-md border border-slate-200 bg-white p-3"
                          >
                            <dl className="space-y-1">
                              {hasRenderableValue(session.title) ? (
                                <DetailRow
                                  label={draftSessionTitleLabel(currentCoachGenerationDomain)}
                                  value={displayLabelTitleCase(session.title)}
                                />
                              ) : null}
                              {hasRenderableValue(session.objective) ? (
                                <DetailRow label="Objective" value={displayValue(session.objective)} />
                              ) : null}
                              <DetailRow
                                label="Duration"
                                value={formatMinutesAsHoursMinutes(
                                  readDraftSessionDurationMinutes(session),
                                )}
                              />
                            </dl>
                            {renderAssistantNutritionItems(session.items)}
                            {renderAssistantSandCItems(
                              resolveAssistantSandCItems(session.items),
                            )}
                            {renderAssistantSkillsItems(
                              resolveAssistantSkillsItems(session.items),
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : !assistantPlanDiscoveryLoading ? (
              <div className="text-sm text-textSecondary">No plan created yet for this domain.</div>
            ) : null}
          </section>

          {showDirectReleaseAction ? (
            <section className="space-y-4 rounded-xl border border-border bg-bg/60 p-4 sm:p-5">
              <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <h3 className="text-base font-normal text-textPrimary">Workflow Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    loading={governedPlanActionLoading === "RELEASE"}
                    disabled={governedPlanActionLoading !== null}
                    onClick={() => void handlePersistedGovernedPlanAction("RELEASE")}
                  >
                    {governedPlanActionButtonLabel("RELEASE")}
                  </Button>
                </div>
              </div>
            </section>
          ) : null}

          {isHeadCoachRevisionRequested ? (
            <section className="space-y-4 rounded-xl border border-border bg-bg/60 p-4 sm:p-5">
              <div className="space-y-1">
                <h3 className="text-base font-normal text-textPrimary">Head Coach Feedback</h3>
                <p className="text-sm text-textSecondary">
                  Review feedback from the Head Coach for this domain plan.
                </p>
              </div>
              {!hasRevisionSummary ? (
                <div className="text-sm text-textSecondary">No feedback yet.</div>
              ) : (
                <div className="space-y-3">
                  {renderRevisionSummary(latestSkillsDraft)}
                </div>
              )}
            </section>
          ) : null}
        </div>
      </Card>
    );
  }

  function renderStep6WorkflowActionsStrip() {
    const model = step6WorkflowStripModel;
    const domainLabel = resolvedWorkflowGenerationDomain;

    if (model.kind === "inactive") {
      return (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <h5 className="text-sm font-normal text-textPrimary">Workflow Actions</h5>
          <p className="text-sm text-textSecondary">Preparing workflow…</p>
        </div>
      );
    }

    if (model.kind === "no_plan") {
      return (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <h5 className="text-sm font-normal text-textPrimary">Workflow Actions</h5>
          <p className="text-sm text-textSecondary">
            {isDownstreamDomainCoach
              ? generationDraftEmptyState(resolvedWorkflowGenerationDomain)
              : "No training plan id is available yet for workflow actions. Generate a plan, load a draft with a saved plan id, or open a saved plan from the URL, then return to this step."}
          </p>
        </div>
      );
    }

    if (model.kind === "generating") {
      return (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <h5 className="text-sm font-normal text-textPrimary">Workflow Actions</h5>
          <p className="text-sm text-textSecondary">
            Workflow actions will become available after plan generation finishes and the latest
            workspace state refreshes.
          </p>
        </div>
      );
    }

    if (model.kind === "loading") {
      return (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <h5 className="text-sm font-normal text-textPrimary">Workflow Actions</h5>
          <p className="text-sm text-textSecondary">Loading saved plan permissions…</p>
        </div>
      );
    }

    if (model.kind === "missing_domain") {
      return (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <h5 className="text-sm font-normal text-textPrimary">Workflow Actions</h5>
          <Alert variant="warning">{model.message}</Alert>
        </div>
      );
    }

    if (model.kind === "error") {
      return (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <h5 className="text-sm font-normal text-textPrimary">Workflow Actions</h5>
          <Alert variant="danger">{model.message}</Alert>
        </div>
      );
    }

    if (model.kind === "empty") {
      const d = model.detail;
      const allowedActionsSummary = d.allowedActions?.join(", ") ?? "";
      return (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <h5 className="text-sm font-normal text-textPrimary">Workflow Actions</h5>
          <WorkflowNeutralNotice>
            <div className="space-y-1">
              <div className="text-sm text-textSecondary">
                Backend active/detail returned no governed actions for this plan and version.
              </div>
              <div className="text-sm text-textSecondary">
                Plan id: {displayValue(d.plan.id)} · Generation domain: {displayValue(domainLabel)}
              </div>
              <div className="text-sm text-textSecondary">
                Version id: {displayValue(d.version.id)}
              </div>
              <div className="text-sm text-textSecondary">
                Allowed actions:{" "}
                {allowedActionsSummary !== "" ? allowedActionsSummary : "None returned"}
              </div>
              {hasRenderableValue(d.version.status) ? (
                <div className="text-sm text-textSecondary">
                  Selected version status: {displayValue(d.version.status)}
                </div>
              ) : null}
            </div>
          </WorkflowNeutralNotice>
        </div>
      );
    }

    if (model.kind === "workspace_status") {
      return (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <h5 className="text-sm font-normal text-textPrimary">Workflow Actions</h5>
          <WorkflowNeutralNotice>
            <div className="space-y-1">
              <div className="text-sm text-textSecondary">
                Skills Plan status: {assistantWorkflowStatusLabelForKind(assistantDomainWorkflowStatus)}
              </div>
              <div className="text-sm text-textSecondary">
                No workflow action is currently required for Skills.
              </div>
            </div>
          </WorkflowNeutralNotice>
        </div>
      );
    }

    if (persistedGovernedPlanContext === null || persistedGovernedAllowedActions.size === 0) {
      return (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <h5 className="text-sm font-normal text-textPrimary">Workflow Actions</h5>
          <WorkflowNeutralNotice>
            <div className="text-sm text-textSecondary">
              The backend reported actions, but plan context is incomplete (missing version or
              domain). Refresh the page or reopen the saved plan.
            </div>
          </WorkflowNeutralNotice>
        </div>
      );
    }

    const step6ActionDomain = persistedGovernedPlanContext.generationDomain;
    const step6ActionAssignmentDomainContext =
      workspace?.assignmentContext?.domains[step6ActionDomain];
    const step6HeadCoachOwnedSkillsDraftApproveAction =
      resolveHeadCoachOwnedSkillsDraftApproveVisible({
        domain: step6ActionDomain,
        workflowStatus: assistantDomainWorkflowStatus,
        headCoachFunctionAwareMode,
        headCoachOwnedSkillsGrouping,
        assignmentDomainContext: step6ActionAssignmentDomainContext,
        planId: persistedGovernedPlanContext.planId,
        versionId: persistedGovernedPlanContext.versionId,
      });
    const canShowStep6SubmitReviewAction =
      !step6HeadCoachOwnedSkillsDraftApproveAction &&
      resolveDomainSubmitForReviewVisible({
        assignmentDomainContext: step6ActionAssignmentDomainContext,
        legacyCanSubmitForReview: persistedGovernedAllowedActions.has("SUBMIT_REVIEW"),
        workflowStatus: assistantDomainWorkflowStatus,
        planId: persistedGovernedPlanContext.planId,
        versionId: persistedGovernedPlanContext.versionId,
      });
    const canShowDirectReleaseSkillsOwnerApproveAction =
      resolveDirectReleaseSkillsOwnerApproveVisible({
        assignmentReleaseMode: workspace?.assignmentContext?.releaseMode,
        assignmentDomainContext: step6ActionAssignmentDomainContext,
        domain: step6ActionDomain,
        legacyCanApprove: persistedGovernedAllowedActions.has("HEAD_APPROVE"),
        planId: persistedGovernedPlanContext.planId,
        versionId: persistedGovernedPlanContext.versionId,
      });
    const canShowStep6HeadApproveAction =
      canShowDirectReleaseSkillsOwnerApproveAction ||
      step6HeadCoachOwnedSkillsDraftApproveAction ||
      resolveDomainHeadCoachReviewActionVisible({
        assignmentDomainContext: step6ActionAssignmentDomainContext,
        legacyCanShowReviewAction: persistedGovernedAllowedActions.has("HEAD_APPROVE"),
        planId: persistedGovernedPlanContext.planId,
        versionId: persistedGovernedPlanContext.versionId,
      });
    const canShowStep6RequestRevisionAction =
      !canShowDirectReleaseSkillsOwnerApproveAction &&
      resolveDomainHeadCoachReviewActionVisible({
        assignmentDomainContext: step6ActionAssignmentDomainContext,
        reviewAction: "REQUEST_REVISION",
        legacyCanShowReviewAction: persistedGovernedAllowedActions.has("REQUEST_REVISION"),
        planId: persistedGovernedPlanContext.planId,
        versionId: persistedGovernedPlanContext.versionId,
      });
    const canShowStep6ReleaseAction = resolveDomainReleaseVisible({
      assignmentReleaseMode: workspace?.assignmentContext?.releaseMode,
      assignmentDomainContext:
        step6ActionAssignmentDomainContext,
      legacyCanRelease: persistedGovernedAllowedActions.has("RELEASE"),
      planId: persistedGovernedPlanContext.planId,
      versionId: persistedGovernedPlanContext.versionId,
    });

    return (
      <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <h5 className="text-sm font-normal text-textPrimary">Workflow Actions</h5>
        <div className="flex flex-wrap gap-2">
          {canShowStep6SubmitReviewAction ? (
            <Button
              type="button"
              variant="secondary"
              loading={governedPlanActionLoading === "SUBMIT_REVIEW"}
              disabled={governedPlanActionLoading !== null}
              onClick={() => void handlePersistedGovernedPlanAction("SUBMIT_REVIEW")}
            >
              {governedPlanActionButtonLabel("SUBMIT_REVIEW", {
                headCoachSkillsSubmitReview:
                  isHeadCoachPlanningContextOwner &&
                  resolvedWorkflowGenerationDomain === "SKILLS",
                submitReviewIsResubmit:
                  assistantDomainWorkflowStatus === "revision_requested",
              })}
            </Button>
          ) : null}
          {canShowStep6HeadApproveAction ? (
            <Button
              type="button"
              variant="secondary"
              loading={governedPlanActionLoading === "HEAD_APPROVE"}
              disabled={governedPlanActionLoading !== null}
              onClick={() => void handlePersistedGovernedPlanAction("HEAD_APPROVE")}
            >
              {governedPlanActionButtonLabel("HEAD_APPROVE")}
            </Button>
          ) : null}
          {canShowStep6RequestRevisionAction ? (
            <Button
              type="button"
              variant="secondary"
              disabled={governedPlanActionLoading !== null}
              onClick={() => void handlePersistedGovernedPlanAction("REQUEST_REVISION")}
            >
              {governedPlanActionButtonLabel("REQUEST_REVISION")}
            </Button>
          ) : null}
          {canShowStep6ReleaseAction ? (
            <Button
              type="button"
              variant="secondary"
              loading={governedPlanActionLoading === "RELEASE"}
              disabled={governedPlanActionLoading !== null}
              onClick={() => void handlePersistedGovernedPlanAction("RELEASE")}
            >
              {governedPlanActionButtonLabel("RELEASE")}
            </Button>
          ) : null}
        </div>
        {governedPlanActionError &&
        !requestRevisionModalOpen &&
        !requestRevisionDrawerComposerOpen ? (
          <Alert variant="danger">{governedPlanActionError}</Alert>
        ) : null}
        {governedPlanActionSuccess ? (
          <WorkflowNeutralNotice>
            <div className="space-y-2">
              <div>{governedPlanActionSuccess}</div>
              {governedPlanActionSuccessFeedback ? (
                <div className="text-sm text-textSecondary">
                  Head Coach Notes: {governedPlanActionSuccessFeedback}
                </div>
              ) : null}
            </div>
          </WorkflowNeutralNotice>
        ) : null}
      </div>
    );
  }

  function renderLockedPlanningContextSummaryForDomainIntegration() {
    if (!isPlanningContextAuthority || isDownstreamDomainCoach) return null;
    const locked =
      workspace?.planningContext.locked ??
      upstreamPlanningContext?.planningContextLocked ??
      planningContextLocked;
    const contextStartDate =
      workspace?.planningContext.planStartDate ??
      workspace?.planningContext.startDate ??
      upstreamPlanningContext?.planWindow?.startDate ??
      upstreamPlanningContext?.startDate ??
      cachedLockedPlanWindow?.startDate ??
      planStartDate;
    const contextEndDate =
      workspace?.planningContext.planEndDate ??
      workspace?.planningContext.endDate ??
      upstreamPlanningContext?.planWindow?.endDate ??
      upstreamPlanningContext?.endDate ??
      cachedLockedPlanWindow?.endDate ??
      planEndDate;
    const selectedGoalsSummary =
      lockedUpstreamGoals.length > 0
        ? lockedUpstreamGoals
            .map((goal) => goal.goalName ?? goal.goalId)
            .filter((value) => value.trim() !== "")
            .join(", ")
        : selectedActiveGoals.length > 0
          ? selectedActiveGoals
              .map((goal) => goal.goalName ?? goal.goalId)
              .filter((value) => value.trim() !== "")
              .join(", ")
          : null;
    const lockedContextDisplayFields = resolveLockedPlanningContextDisplayFields({
      workspacePlanningContext: workspace?.planningContext ?? null,
      upstreamPlanningContext,
      seasons: setupState.seasons,
      selectedSeason,
      activePhaseForSelectedSeason,
      lockedPlanningContextSeasonPhase: lockedPlanningContextCardFields.seasonPhase,
    });
    return (
      <DashboardStatusNotice
        type={locked ? "success" : "warning"}
        compact
      >
        <div className="space-y-2">
          <div>
            {locked
              ? "Context locked and shared. Domain coaches can now generate and submit plans."
              : "Context not locked. Lock and share context before domain generation starts."}
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <DetailRow
              label="Plan window"
              value={formatDateRange(contextStartDate, contextEndDate)}
            />
            <DetailRow
              label="Season"
              value={displayValue(lockedContextDisplayFields.seasonName)}
            />
            <DetailRow
              label="Current phase"
              value={displayValue(lockedContextDisplayFields.currentPhase)}
            />
            <DetailRow label="Selected goals" value={selectedGoalsSummary ?? "None"} />
            <DetailRow
              label="Readiness"
              value={locked ? "Ready / context locked and shared" : "Not locked"}
            />
          </dl>
        </div>
      </DashboardStatusNotice>
    );
  }

  function renderStep6DomainIntegrationContent() {
    return (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <h4 className="text-sm font-normal text-textPrimary">
                            Domain Integration
                          </h4>
                          <p className="text-sm text-textSecondary">
                            Confirm planning context, readiness, blockers, and generation status.
                          </p>
                        </div>
                      {renderLockedPlanningContextSummaryForDomainIntegration()}
                      {isDownstreamDomainCoach &&
                      !upstreamPlanningContextLoading &&
                      !upstreamPlanningContextError &&
                      !effectiveDownstreamPlanningContextLocked ? (
                        <Alert variant="warning">{UPSTREAM_CONTEXT_NOT_LOCKED_MESSAGE}</Alert>
                      ) : null}
                      {isDownstreamDomainCoach ? (
                        renderDownstreamUpstreamPlanningReadOnlySection()
                      ) : step6ShowsPreGenerationReadiness ? (
                        <dl className="space-y-2">
                          <DetailRow
                            label="Readiness status"
                            value={displayValue(readinessPanel.readinessStatus)}
                          />
                          <DetailRow
                            label="Generation allowed"
                            value={generationReadinessFromApis ? "Yes" : "No"}
                          />
                          <DetailRow
                            label="APP complete"
                            value={readinessPanel.appCompleteness === "COMPLETE" ? "Yes" : "No"}
                          />
                          <DetailRow
                            label="Level validation confirmed"
                            value={readinessPanel.validationStatus === "CONFIRMED" ? "Yes" : "No"}
                          />
                          <DetailRow
                            label="Workload assessment complete"
                            value={workloadComplete ? "Yes" : "Pending — not ready"}
                          />
                          <DetailRow
                            label="Season selected"
                            value={seasonReady ? "Yes" : "Pending — not ready"}
                          />
                          <DetailRow
                            label="Current phase detected"
                            value={currentPhaseDetected ? "Yes" : "No"}
                          />
                          <DetailRow
                            label="Plan window inside current phase"
                            value={planWindowInsideCurrentPhase ? "Yes" : "No"}
                          />
                          <DetailRow
                            label="At least one ACTIVE goal selected"
                            value={goalsReadyForGeneration ? "Yes" : "Pending — not ready"}
                          />
                        </dl>
                      ) : step6ShowsGeneratedDraftSummary ? (
                        <WorkflowNeutralNotice>
                          <div className="space-y-1 text-sm">
                            <div className="font-medium text-textPrimary">
                              Plan status:{" "}
                              {assistantWorkflowStatusLabelForKind(step6GeneratedDraftWorkflowStatus)}
                            </div>
                            <p className="text-textSecondary">
                              A generated plan is available for this athlete. Review the plan
                              details below.
                            </p>
                          </div>
                        </WorkflowNeutralNotice>
                      ) : null}
                      {step6ShowsPreGenerationReadiness &&
                      readinessPanel.blockers.length > 0 ? (
                        (() => {
                          const coachFacingBlockers =
                            coachFacingPlanningContextBlockers(readinessPanel.blockers);
                          return (
                            <DashboardStatusNotice
                              type="blocker"
                              title="Complete planning context before generating"
                              items={
                                coachFacingBlockers.length > 0
                                  ? coachFacingBlockers
                                  : ["Complete required planning context"]
                              }
                              compact
                            />
                          );
                        })()
                      ) : null}
                      {generatePlanError ? <Alert variant="danger">{generatePlanError}</Alert> : null}
                      {(trainingPlanShellModel.shell !== "skills_coach_planning" ||
                        step6GenerationLifecyclePhase === "generating") &&
                      currentDomainGenerationJob !== null
                        ? renderGenerationJobProgress(currentDomainGenerationJob)
                        : null}
                      {generatePlanRecoveryMessage ? (
                        <WorkflowNeutralNotice>
                          <div className="text-sm font-medium text-textPrimary">
                            {generatePlanRecoveryMessage}
                          </div>
                        </WorkflowNeutralNotice>
                      ) : null}
                      {generatePlanSuccess ? (
                        <WorkflowNeutralNotice>
                          <div className="space-y-2">
                            <div className="font-medium">Training plan draft generated successfully.</div>
                            <dl className="space-y-1">
                              <DetailRow
                                label="Training Plan ID"
                                value={displayValue(generatePlanSuccess.trainingPlanId)}
                              />
                              <DetailRow
                                label="Training Plan Version ID"
                                value={displayValue(generatePlanSuccess.trainingPlanVersionId)}
                              />
                              <DetailRow
                                label="Version Number"
                                value={displayValue(generatePlanSuccess.versionNumber)}
                              />
                              <DetailRow
                                label="Status"
                                value={displayValue(generatePlanSuccess.status)}
                              />
                              <DetailRow
                                label="Days Created"
                                value={displayValue(generatePlanSuccess.daysCreated)}
                              />
                              <DetailRow
                                label="Sessions Created"
                                value={displayValue(generatePlanSuccess.sessionsCreated)}
                              />
                              <DetailRow
                                label="Items Persisted"
                                value={displayValue(generatePlanSuccess.itemsPersisted)}
                              />
                            </dl>
                          </div>
                        </WorkflowNeutralNotice>
                      ) : null}
                      </div>

    );
  }

  function renderAssistantDomainDraftActions() {
    if (!isDownstreamDomainCoach) return null;
    const workflowStatusLabel = assistantWorkflowStatusLabelForKind(assistantDomainWorkflowStatus);
    const canShowAssistantDraftSubmitAction =
      persistedGovernedPlanContext !== null &&
      resolveDomainSubmitForReviewVisible({
        assignmentDomainContext:
          workspace?.assignmentContext?.domains[persistedGovernedPlanContext.generationDomain],
        legacyCanSubmitForReview: persistedGovernedAllowedActions.has("SUBMIT_REVIEW"),
        workflowStatus: assistantDomainWorkflowStatus,
        planId: persistedGovernedPlanContext.planId,
        versionId: persistedGovernedPlanContext.versionId,
      });

    return (
      <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <h5 className="text-sm font-normal text-textPrimary">Plan Workspace</h5>
        <p className="text-sm text-textSecondary">Status: {workflowStatusLabel}</p>
        <div className="flex flex-wrap gap-2">
          {assistantDomainWorkflowStatus !== "not_created" && requestedPlanId !== null ? (
            <Button type="button" variant="secondary" disabled>
              View Skills Plan
            </Button>
          ) : null}
          {(assistantDomainWorkflowStatus === "draft_generated" ||
            assistantDomainWorkflowStatus === "revision_requested") &&
          skillsReviseIds ? (
            <Button
              type="button"
              variant="secondary"
              disabled={reviseSkillsLoading}
              onClick={() => {
                void handleReviseSkillsPlan();
              }}
            >
              {reviseSkillsLoading ? "Revising plan..." : "Revise Skills Plan"}
            </Button>
          ) : null}
          {canShowAssistantDraftSubmitAction ? (
            <Button
              type="button"
              variant="secondary"
              loading={governedPlanActionLoading === "SUBMIT_REVIEW"}
              disabled={governedPlanActionLoading !== null}
              onClick={() => void handlePersistedGovernedPlanAction("SUBMIT_REVIEW")}
            >
              {assistantDomainWorkflowStatus === "revision_requested"
                ? "Resubmit for Head Coach Review"
                : "Submit for Head Coach Review"}
            </Button>
          ) : null}
        </div>
        {hasRevisionSummary ? renderRevisionSummary(latestSkillsDraft) : null}
      </div>
    );
  }

  async function handleReviseNutritionPlan() {
    if (
      reviseNutritionLoading ||
      entityId === "" ||
      athleteIdTrimmed === "" ||
      !nutritionReviseIds
    ) {
      return;
    }

    const coachFeedback = reviseNutritionFeedback.trim();
    if (coachFeedback === "") {
      setReviseNutritionError("Enter revision feedback first.");
      setReviseNutritionSuccess(null);
      return;
    }

    const trainingPlanIdForReload = nutritionReviseIds.trainingPlanId.trim();

    setReviseNutritionLoading(true);
    setReviseNutritionError(null);
    setReviseNutritionSuccess(null);
    try {
      const reviseResult = await reviseNutritionPlan(entityId, athleteIdTrimmed, {
        trainingPlanId: nutritionReviseIds.trainingPlanId,
        versionId: nutritionReviseIds.versionId,
        coachFeedback,
      });
      await reconcileRevisedDomainPlanDetail("NUTRITION", reviseResult, trainingPlanIdForReload);
      await loadLatestSkillsDraft("NUTRITION", true);
      setReviseNutritionFeedback("");
      setReviseNutritionSuccess("Revised nutrition plan version generated.");
      void refreshTrainingPlanWorkspace({ background: true });
    } catch (e) {
      console.error("Nutrition training plan revision failed", e);
      if (isAiGenerationValidationError(e)) {
        setReviseNutritionError(AI_GENERATION_VALIDATION_ERROR_MESSAGE);
      } else if (isNormalizedApiError(e)) {
        const message =
          e.message.trim() !== ""
            ? e.message.trim()
            : "Unable to revise plan. Please try again.";
        const errorCode = e.code?.trim();
        setReviseNutritionError(
          errorCode ? `Revision failed: ${message} (${errorCode})` : `Revision failed: ${message}`,
        );
      } else {
        const errorRecord =
          typeof e === "object" && e !== null ? (e as Record<string, unknown>) : null;
        const message =
          (typeof errorRecord?.message === "string" && errorRecord.message.trim() !== ""
            ? errorRecord.message.trim()
            : null) ?? "Unable to revise plan. Please try again.";
        const errorCode =
          (typeof errorRecord?.errorCode === "string" && errorRecord.errorCode.trim() !== ""
            ? errorRecord.errorCode.trim()
            : null) ??
          (typeof errorRecord?.code === "string" && errorRecord.code.trim() !== ""
            ? errorRecord.code.trim()
            : null);
        setReviseNutritionError(
          errorCode ? `Revision failed: ${message} (${errorCode})` : `Revision failed: ${message}`,
        );
      }
      setReviseNutritionSuccess(null);
    } finally {
      setReviseNutritionLoading(false);
    }
  }

  async function handleReviseSandCPlan() {
    if (
      reviseSandCLoading ||
      entityId === "" ||
      athleteIdTrimmed === "" ||
      !sandCReviseIds
    ) {
      return;
    }

    const coachFeedback = reviseSandCFeedback.trim();
    if (coachFeedback === "") {
      setReviseSandCError("Enter revision feedback first.");
      setReviseSandCSuccess(null);
      return;
    }

    const trainingPlanIdForReload = sandCReviseIds.trainingPlanId.trim();

    setReviseSandCLoading(true);
    setReviseSandCError(null);
    setReviseSandCSuccess(null);
    try {
      const reviseResult = await reviseCoachAthleteSandCTrainingPlan(entityId, athleteIdTrimmed, {
        trainingPlanId: sandCReviseIds.trainingPlanId,
        versionId: sandCReviseIds.versionId,
        coachFeedback,
      });
      await reconcileRevisedDomainPlanDetail("S_AND_C", reviseResult, trainingPlanIdForReload);
      await loadLatestSkillsDraft("S_AND_C", true);
      setReviseSandCFeedback("");
      setReviseSandCSuccess("Revised S&C plan version generated.");
      void refreshTrainingPlanWorkspace({ background: true });
    } catch (e) {
      console.error("S&C training plan revision failed", e);
      const errorRecord =
        typeof e === "object" && e !== null ? (e as Record<string, unknown>) : null;
      const message =
        (typeof errorRecord?.message === "string" && errorRecord.message.trim() !== ""
          ? errorRecord.message.trim()
          : null) ?? "Unable to revise plan. Please try again.";
      const errorCode =
        (typeof errorRecord?.errorCode === "string" && errorRecord.errorCode.trim() !== ""
          ? errorRecord.errorCode.trim()
          : null) ??
        (typeof errorRecord?.code === "string" && errorRecord.code.trim() !== ""
          ? errorRecord.code.trim()
          : null);
      setReviseSandCError(
        errorCode
          ? `Revision failed: ${message} (${errorCode})`
          : `Revision failed: ${message}`,
      );
      setReviseSandCSuccess(null);
    } finally {
      setReviseSandCLoading(false);
    }
  }

  function beginExplicitSeasonCreateForm() {
    setSeasonCreateFormExplicit(true);
    setSelectedSeasonCycleId(null);
    setSelectedGoalIds([]);
    setSeasonError(null);
    setSeasonSuccess(null);
    setSeasonNameEdited(false);
    const defaultYear = new Date().getUTCFullYear();
    setSeasonYear(defaultYear);
    setSeasonStartDate(yearStartDateInput(defaultYear));
    setSeasonEndDate(yearEndDateInput(defaultYear));
    setSeasonName(
      athleteSportCode
        ? `${defaultYear} ${formatSportLabel(athleteSportCode)} Season`
        : "",
    );
  }

  async function refreshSelectedSeasonPhases(seasonCycleId: string) {
    const refreshedPhases = await fetchSeasonCyclePhases(seasonCycleId);
    setSetupState((current) => ({
      ...current,
      phasesBySeasonCycleId: {
        ...current.phasesBySeasonCycleId,
        [seasonCycleId]: refreshedPhases,
      },
      seasons: current.seasons.map((season) =>
        season.seasonCycleId === seasonCycleId
          ? { ...season, phases: refreshedPhases }
          : season,
      ),
    }));
  }

  async function handleCreateMvpSeason() {
    if (!athleteSportCode) {
      setSeasonError(
        "Sport code is missing for this athlete. Complete the Athlete Planning Profile before generation.",
      );
      setSeasonSuccess(null);
      return;
    }
    if (entityId === "") return;
    if (seasonName.trim() === "" || seasonStartDate === "" || seasonEndDate === "") {
      setSeasonError("Season name, start date, and end date are required.");
      setSeasonSuccess(null);
      return;
    }
    if (seasonStartDate >= seasonEndDate) {
      setSeasonError("Season start date must be before end date.");
      setSeasonSuccess(null);
      return;
    }

    const payload = {
      entityId,
      sport: athleteSportCode,
      year: seasonYear,
      name: seasonName.trim(),
      startDate: toUtcDateTimeString(seasonStartDate),
      endDate: toUtcDateTimeString(seasonEndDate),
    };

    setSeasonCreateLoading(true);
    setSeasonError(null);
    setSeasonSuccess(null);

    try {
      const season = await createSeasonCycle(payload);
      setSetupState((current) => resolveSetupStateAfterSeasonCreate(current, season));
      setSelectedSeasonCycleId(season.seasonCycleId);
      await refreshGoalsSeasonSetup();
      setSetupState((current) => resolveSetupStateAfterSeasonCreate(current, season));
      setSelectedSeasonCycleId(season.seasonCycleId);
      setSeasonCreateFormExplicit(false);
      setSeasonName(season.name ?? payload.name);
      setSeasonNameEdited(false);
      setSeasonSuccess("Season created and selected.");
    } catch (e) {
      setSeasonError(formatApiError(e, "Failed to create season. Please try again."));
    } finally {
      setSeasonCreateLoading(false);
    }
  }

  async function handleCreatePhase(phase: SeasonPhaseType) {
    if (selectedSeasonCycleId == null) {
      setPhaseError("Create or select a season first.");
      setPhaseSuccess(null);
      return;
    }
    const validation = validatePhaseDraft(
      phase,
      phaseDrafts[phase],
      selectedSeasonPhases,
      selectedSeason,
    );
    if (validation) {
      setPhaseError(validation);
      setPhaseSuccess(null);
      return;
    }
    setPhaseCreateLoading(phase);
    setPhaseError(null);
    setPhaseSuccess(null);
    try {
      await createSeasonCyclePhase({
        seasonCycleId: selectedSeasonCycleId,
        phase,
        startDate: toUtcDateTimeString(phaseDrafts[phase].startDate),
        endDate: toUtcDateTimeString(phaseDrafts[phase].endDate),
      });
      await refreshGoalsSeasonSetup();
      setPhaseSuccess(`${toFieldLabel(phase)} created successfully.`);
    } catch (e) {
      setPhaseError(formatApiError(e, "Could not create season phase."));
    } finally {
      setPhaseCreateLoading(null);
    }
  }

  function handleEditPhase(phase: SeasonPhaseType) {
    const existing = phaseByType[phase] ?? null;
    if (!existing) return;
    setPhaseEditorState((current) => ({
      ...current,
      [phase]: {
        ...current[phase],
        isEditing: true,
        startDate: dateOnly(existing.startDate) ?? "",
        endDate: dateOnly(existing.endDate) ?? "",
        error: null,
        success: null,
      },
    }));
  }

  function handleCancelPhaseEdit(phase: SeasonPhaseType) {
    const existing = phaseByType[phase] ?? null;
    setPhaseEditorState((current) => ({
      ...current,
      [phase]: {
        ...current[phase],
        isEditing: false,
        startDate: dateOnly(existing?.startDate) ?? "",
        endDate: dateOnly(existing?.endDate) ?? "",
        error: null,
        success: null,
      },
    }));
  }

  async function handleSavePhaseChanges(phase: SeasonPhaseType) {
    const existing = phaseByType[phase] ?? null;
    if (!existing?.phaseId) {
      setPhaseEditorState((current) => ({
        ...current,
        [phase]: {
          ...current[phase],
          error: "Phase ID is required to update this phase.",
          success: null,
        },
      }));
      return;
    }
    const draft = phaseEditorState[phase];
    const validation = validatePhaseUpdateDraft(
      phase,
      existing.phaseId,
      { startDate: draft.startDate, endDate: draft.endDate },
      selectedSeasonPhases,
      selectedSeason,
    );
    if (validation) {
      setPhaseEditorState((current) => ({
        ...current,
        [phase]: {
          ...current[phase],
          error: validation,
          success: null,
        },
      }));
      return;
    }

    const payload: { startDate?: string; endDate?: string } = {};
    if (draft.startDate !== (dateOnly(existing.startDate) ?? "")) {
      payload.startDate = toUtcDateTimeString(draft.startDate);
    }
    if (draft.endDate !== (dateOnly(existing.endDate) ?? "")) {
      payload.endDate = toUtcDateTimeString(draft.endDate);
    }
    if (Object.keys(payload).length === 0) {
      setPhaseEditorState((current) => ({
        ...current,
        [phase]: {
          ...current[phase],
          error: "No phase changes to save.",
          success: null,
        },
      }));
      return;
    }

    setPhaseEditorState((current) => ({
      ...current,
      [phase]: {
        ...current[phase],
        loading: true,
        error: null,
        success: null,
      },
    }));
    const refreshSeasonCycleId = existing.seasonCycleId ?? selectedSeasonCycleId;
    if (refreshSeasonCycleId == null) {
      setPhaseEditorState((current) => ({
        ...current,
        [phase]: {
          ...current[phase],
          loading: false,
          error: "Season cycle id is unavailable.",
          success: null,
        },
      }));
      return;
    }
    try {
      await updateSeasonCyclePhase(existing.phaseId, payload);
      await refreshSelectedSeasonPhases(refreshSeasonCycleId);
      setPhaseEditorState((current) => ({
        ...current,
        [phase]: {
          ...current[phase],
          isEditing: false,
          loading: false,
          error: null,
          success: "Phase updated successfully.",
        },
      }));
    } catch (e) {
      setPhaseEditorState((current) => ({
        ...current,
        [phase]: {
          ...current[phase],
          loading: false,
          error: formatApiError(e, "Could not update season phase."),
          success: null,
        },
      }));
    }
  }

  async function handleCreateCompetitionGoal() {
    const coachUserId = currentCoachUserId;
    if (coachUserId === "") {
      setCompetitionError("Authenticated coach user ID is required to create goals.");
      setCompetitionSuccess(null);
      return;
    }
    if (selectedSeasonCycleId == null) {
      setCompetitionError("Select or create a season before adding a competition goal.");
      setCompetitionSuccess(null);
      return;
    }
    if (competitionName.trim() === "" || competitionDate.trim() === "") {
      setCompetitionError("Competition name and competition date are required.");
      setCompetitionSuccess(null);
      return;
    }
    const competitionSeasonPhase = resolveCompetitionSeasonPhaseForDate({
      phases: selectedSeasonPhases,
      competitionDate,
    });
    if (competitionSeasonPhase?.phaseId == null) {
      setCompetitionError("Competition date must fall within a created season phase.");
      setCompetitionSuccess(null);
      return;
    }
    const competitionEventId = slugifyCompetitionId(competitionName, competitionDate);
    if (competitionEventId === "") {
      setCompetitionError("Competition event ID could not be generated.");
      setCompetitionSuccess(null);
      return;
    }
    setCompetitionCreateLoading(true);
    setCompetitionError(null);
    setCompetitionSuccess(null);
    try {
      await createGoal({
        athleteId: athleteIdTrimmed,
        entityId,
        seasonCycleId: selectedSeasonCycleId,
        seasonPhaseId: competitionSeasonPhase.phaseId,
        createdByCoachId: coachUserId,
        goalType: "COMPETITION",
        goalCategory: "TRAINING",
        competitionEventId,
        startDate: `${dateOnly(competitionSeasonPhase.startDate) ?? competitionDate}T00:00:00.000Z`,
        targetDate: `${competitionDate}T00:00:00.000Z`,
      });
      await refreshGoalsSeasonSetup();
      setCompetitionSuccess(`Competition goal created (${competitionImportance}).`);
    } catch (e) {
      setCompetitionError(formatApiError(e, "Could not create competition goal."));
    } finally {
      setCompetitionCreateLoading(false);
    }
  }

  async function handleCreateCurrentPhaseGoal() {
    const coachUserId = currentCoachUserId;
    if (coachUserId === "") {
      setGoalError("Authenticated coach user ID is required to create goals.");
      setGoalSuccess(null);
      return;
    }
    if (!activePhaseForSelectedSeason?.phaseId) {
      setGoalError("A current phase must be detected before creating a goal.");
      setGoalSuccess(null);
      return;
    }
    if (selectedSeasonCycleId == null) {
      setGoalError("Select or create a season before creating a goal.");
      setGoalSuccess(null);
      return;
    }
    if (goalCreationMode === "CUSTOM" && goalName.trim() === "") {
      setGoalError("Skill goal name is required.");
      setGoalSuccess(null);
      return;
    }
    if (goalCreationMode === "LIBRARY" && selectedLibraryGoals.length === 0) {
      setGoalError("Select at least one Goal Library item.");
      setGoalSuccess(null);
      return;
    }
    if (
      goalTargetDate.trim() !== "" &&
      activePhaseForSelectedSeason.startDate &&
      activePhaseForSelectedSeason.endDate &&
      (() => {
        const phaseStart = dateOnly(activePhaseForSelectedSeason.startDate);
        const phaseEnd = dateOnly(activePhaseForSelectedSeason.endDate);
        return phaseStart && phaseEnd
          ? goalTargetDate < phaseStart || goalTargetDate > phaseEnd
          : false;
      })()
    ) {
      setGoalError("Goal target date must fall inside the detected current phase.");
      setGoalSuccess(null);
      return;
    }
    let parsedTargetValue: number | undefined;
    if (goalTargetValue.trim() !== "") {
      const numeric = Number(goalTargetValue);
      if (!Number.isFinite(numeric)) {
        setGoalError("Target value must be a valid number.");
        setGoalSuccess(null);
        return;
      }
      parsedTargetValue = numeric;
    }

    setGoalCreateLoading(true);
    setGoalError(null);
    setGoalSuccess(null);

    try {
      if (goalCreationMode === "LIBRARY") {
        for (const goal of selectedLibraryGoals) {
          await createPhaseAwareGoal({
            athleteId: athleteIdTrimmed,
            entityId,
            seasonCycleId: selectedSeasonCycleId,
            seasonPhaseId: activePhaseForSelectedSeason.phaseId,
            goalType: goal.goalType,
            domain: goalLibraryDomainValue(goal) ?? effectiveCoachGenerationDomain,
            goalName: goal.goalName,
            successCriteria:
              goal.successCriteria.length > 0 ? goal.successCriteria.join("\n") : undefined,
            goalCategory: goal.goalCategory,
            createdByCoachId: coachUserId,
            priority: goalPriority,
            ...(parsedTargetValue !== undefined ? { targetValue: parsedTargetValue } : {}),
            ...(goalTargetDate.trim() !== ""
              ? { targetDate: `${goalTargetDate}T00:00:00.000Z` }
              : {}),
            goalSourceType: "LIBRARY",
            libraryGoalId: goal.libraryGoalId,
            categoryKey: goal.categoryKey,
            taxonomyAreaKey: goal.taxonomyAreaKey,
            athleteLevelSnapshot: goal.athleteLevel,
            librarySnapshotJson: {
              goalName: goal.goalName,
              categoryLabel: goal.categoryLabel,
              successCriteria: goal.successCriteria,
              metricsToWatch: goal.metricsToWatch,
              capabilityCodes: goal.capabilityCodes,
              recommendedDomains: goal.recommendedDomains,
              seasonPhases: goal.seasonPhases,
            },
          });
        }
      } else {
        await createPhaseAwareGoal({
          athleteId: athleteIdTrimmed,
          entityId,
          seasonCycleId: selectedSeasonCycleId,
          seasonPhaseId: activePhaseForSelectedSeason.phaseId,
          goalType: "PERFORMANCE",
          domain: effectiveCoachGenerationDomain,
          goalName,
          successCriteria: goalSuccessCriteria,
          goalCategory: "TRAINING",
          createdByCoachId: coachUserId,
          priority: goalPriority,
          ...(parsedTargetValue !== undefined ? { targetValue: parsedTargetValue } : {}),
          ...(goalTargetDate.trim() !== ""
            ? { targetDate: `${goalTargetDate}T00:00:00.000Z` }
            : {}),
          goalSourceType: "CUSTOM",
        });
      }
      await refreshGoalsSeasonSetup();
      setGoalSuccess(
        goalCreationMode === "LIBRARY"
          ? `${selectedLibraryGoals.length} Goal Library goal${selectedLibraryGoals.length === 1 ? "" : "s"} created successfully.`
          : "Skill goal created successfully.",
      );
      setGoalName("");
      setGoalSuccessCriteria("");
      setGoalTargetDate("");
      setGoalTargetValue("");
      setGoalPriority("MEDIUM");
      setSelectedLibraryGoalIds([]);
    } catch (e) {
      setGoalError(formatApiError(e, "Could not create goal."));
    } finally {
      setGoalCreateLoading(false);
    }
  }

  async function handleRunWorkloadAssessment() {
    if (
      readinessLoading ||
      workloadAssessmentLoading ||
      entityId === "" ||
      athleteIdTrimmed === "" ||
      !canRunWorkloadAssessment(readinessPanel)
    ) {
      return;
    }
    const ok = await loadWorkloadAssessment(true);
    if (!ok) return;
    setShowWorkloadCompletionState(true);
    if (workloadCompletionHoldTimeoutRef.current !== null) {
      window.clearTimeout(workloadCompletionHoldTimeoutRef.current);
    }
    workloadCompletionHoldTimeoutRef.current = window.setTimeout(() => {
      workloadCompletionHoldTimeoutRef.current = null;
      setShowWorkloadCompletionState(false);
    }, 1500);
  }

  async function handleGenerateTrainingPlan(domain: TrainingPlanGenerationDomain) {
    const usesLockedDownstreamContext = shouldUseLockedDownstreamGenerationContext({
      hasHeadCoachConfigured: setupState.hasHeadCoachConfigured,
      isHeadCoachPlanningContextOwner,
      domain,
      effectiveDownstreamPlanningContextLocked,
    });
    const workspacePlanningContext = workspace?.planningContext ?? null;
    const workspaceLockedPlanningContext = workspacePlanningContext?.locked === true;
    const lockedGenerationSeasonCycleId = trimmedNonEmpty(
      workspacePlanningContext?.selectedSeasonCycleId,
      workspacePlanningContext?.seasonCycleId,
      workspacePlanningContext?.selectedSeasonId,
      workspacePlanningContext?.seasonId,
      assistantLockedUpstreamDerived.lockedSeasonCycleId,
    );
    const lockedGenerationPlanStartDate = trimmedNonEmpty(
      workspacePlanningContext?.planStartDate,
      workspacePlanningContext?.startDate,
      assistantLockedUpstreamDerived.lockedPlanWindowStart,
    );
    const lockedGenerationPlanEndDate = trimmedNonEmpty(
      workspacePlanningContext?.planEndDate,
      workspacePlanningContext?.endDate,
      assistantLockedUpstreamDerived.lockedPlanWindowEnd,
    );
    const lockedGenerationSportCode = assistantLockedUpstreamDerived.lockedSportCode;
    const lockedGoalIds = readLockedWorkspaceGoalIds({
      selectedGoalsSnapshot: workspacePlanningContext?.selectedGoalsSnapshot,
      athletePlanningContextSnapshot:
        workspacePlanningContext?.athletePlanningContextSnapshot,
      goalIds: workspacePlanningContext?.goalIds,
      lockedGoalIds: workspacePlanningContext?.lockedGoalIds,
      fallbackGoalIds:
        upstreamPlanningContext?.planningContext.lockedGoalIds ??
        upstreamPlanningContext?.planningContext.goalIds ??
        upstreamPlanningContext?.goalIds ??
        [],
    });
    const normalizedLockedGoalIds = lockedGoalIds.filter(
      (goalId): goalId is string => typeof goalId === "string" && goalId.trim() !== "",
    );
    const handlerGeneratePermission = resolveGeneratePermissionForDomain(domain);
    const handlerOwnershipFlags = handlerGeneratePermission.ownershipFlags;
    const lockedContextExpectedForDomain =
      domain !== null &&
      (workspaceLockedPlanningContext || effectiveDownstreamPlanningContextLocked) &&
      !planOwnershipLoading &&
      handlerGeneratePermission.canShowGenerate;
    const lockedContextDetailsComplete =
      canGenerateFromLockedPlanningContextForDomain({
        domain,
        effectiveDownstreamPlanningContextLocked:
          workspaceLockedPlanningContext || effectiveDownstreamPlanningContextLocked,
        ownershipFlags: handlerOwnershipFlags,
        lockedSeasonCycleId: lockedGenerationSeasonCycleId,
        lockedPlanWindowStart: lockedGenerationPlanStartDate,
        lockedPlanWindowEnd: lockedGenerationPlanEndDate,
        lockedSportCode: lockedGenerationSportCode,
      }) && normalizedLockedGoalIds.length > 0;
    const canGenerateFromLockedPlanningContext = lockedContextDetailsComplete;
    const workspaceDurationDays = workspacePlanningContext?.durationDays ?? null;
    const effectiveDurationDays =
      canGenerateFromLockedPlanningContext &&
      (workspaceDurationDays === 7 || workspaceDurationDays === 15 || workspaceDurationDays === 30)
        ? workspaceDurationDays
        : generationDurationDaysForDomain(domain, durationDays);
    const effectivePlanEndDate = addDaysToDateString(
      planStartDate,
      effectiveDurationDays - 1,
    );
    const isSkillsOwnedLockedContext =
      trainingPlanShellModel.shell === "skills_coach_planning" &&
      effectiveSkillsPlanningContextLocked;
    const lockedContextOwnershipError = planOwnershipLoading
      ? "Loading plan generation permissions."
      : !handlerGeneratePermission.canShowGenerate
        ? PLAN_GENERATION_NOT_ASSIGNED_MESSAGE
        : null;
    let localGenerationError: string | null = null;
    if (lockedContextOwnershipError !== null) {
      localGenerationError = lockedContextOwnershipError;
    } else if (canGenerateFromLockedPlanningContext) {
      localGenerationError = null;
    } else if (lockedContextExpectedForDomain) {
      localGenerationError = LOCKED_CONTEXT_MISSING_GENERATION_DETAILS_MESSAGE;
    } else if (isDownstreamDomainCoach) {
      localGenerationError = generatePlanLocalErrorsByDomain[domain] ?? null;
    } else if (isSkillsOwnedLockedContext) {
      localGenerationError = null;
    } else {
      localGenerationError = resolveGeneratePlanLocalError({
        entityId,
        athleteId: athleteIdTrimmed,
        generationDomain: domain,
        selectedSeasonCycleId,
        selectedGoalCount: selectedActiveGoals.length,
        sportCode: athleteSportCode,
        selectedSeason,
        currentPhase: activePhaseForSelectedSeason,
        planStartDate,
        planEndDate: effectivePlanEndDate,
      });
    }
    const readinessBlockedMessage = formatBackendReadinessBlockers(readinessPanel.blockers);
    if (
      readinessLoading ||
      workloadAssessmentLoading ||
      entityId === "" ||
      athleteIdTrimmed === ""
    ) {
      return;
    }
    const currentJob = generatePlanJobsByDomain[domain] ?? null;
    if (isGenerationJobInProgress(currentJob)) {
      return;
    }

    if (!isDownstreamDomainCoach && !usesLockedDownstreamContext && !generationReadinessFromApis) {
      setGeneratePlanError(
        readinessBlockedMessage ??
          "Training plan generation is blocked until backend readiness is complete.",
      );
      setGeneratePlanSuccess(null);
      setGeneratePlanSuccessDomain(null);
      setGeneratePlanRecoveryMessage(null);
      return;
    }

    if (localGenerationError) {
      setGeneratePlanError(localGenerationError);
      setGeneratePlanSuccess(null);
      setGeneratePlanSuccessDomain(null);
      setGeneratePlanRecoveryMessage(null);
      return;
    }

    const seasonCycleId = canGenerateFromLockedPlanningContext
      ? lockedGenerationSeasonCycleId
      : selectedSeasonCycleId;
    const goalIds = canGenerateFromLockedPlanningContext
      ? normalizedLockedGoalIds
      : selectedActiveGoals.map((goal) => goal.goalId);
    const normalizedSportCode = (
      isDownstreamDomainCoach || canGenerateFromLockedPlanningContext
        ? lockedGenerationSportCode
        : athleteSportCode
    )
      ?.trim() ?? "";

    if (normalizedSportCode === "") {
      setGeneratePlanError("Sport code is required for generation.");
      setGeneratePlanSuccess(null);
      setGeneratePlanSuccessDomain(null);
      setGeneratePlanRecoveryMessage(null);
      return;
    }

    setGeneratePlanError(null);
    setGeneratePlanSuccess(null);
    setGeneratePlanSuccessDomain(null);
    setGeneratePlanRecoveryMessage(null);
    generatePlanJobRequestGenRef.current[domain] =
      (generatePlanJobRequestGenRef.current[domain] ?? 0) + 1;
    const requestGeneration = generatePlanJobRequestGenRef.current[domain] ?? 0;
    try {
      const result = await runTrainingPlanGenerationJob({
        entityId,
        athleteId: athleteIdTrimmed,
        sportCode: normalizedSportCode,
        durationDays: effectiveDurationDays,
        generationDomain: domain,
        seasonCycleId,
        planStartDate: canGenerateFromLockedPlanningContext
          ? lockedGenerationPlanStartDate
          : planStartDate,
        planEndDate: canGenerateFromLockedPlanningContext
          ? lockedGenerationPlanEndDate
          : effectivePlanEndDate,
        goalIds,
        onUpdate: (job) => {
          if (
            generatePlanJobRequestGenRef.current[domain] !== requestGeneration ||
            !workloadTrainerScopeMatches(workflowTrainerScopeRef, {
              athlete: athleteIdTrimmed,
              entity: entityId,
            })
          ) {
            return;
          }
          setGeneratePlanJobsByDomain((current) => ({
            ...current,
            [domain]: job,
          }));
        },
      });
      if (
        generatePlanJobRequestGenRef.current[domain] !== requestGeneration ||
        !workloadTrainerScopeMatches(workflowTrainerScopeRef, {
          athlete: athleteIdTrimmed,
          entity: entityId,
        })
      ) {
        return;
      }
      if (result.terminalStatus === "FAILED") {
        setGeneratePlanError(result.errorMessage || readSafeGenerationJobError(result.latestJob));
        return;
      }
      await loadLatestSkillsDraft(domain, true);
      const latestDomainDraft = await fetchLatestCoachAthleteDomainDraft(
        entityId,
        athleteIdTrimmed,
        domain,
      );
      const persistedGenerateResult = persistDraftResultFromLatestDomainDraft(latestDomainDraft);
      setGeneratePlanSuccess(persistedGenerateResult);
      setGeneratePlanSuccessDomain(domain);
      let generatedPlanId = persistedGenerateResult.trainingPlanId?.trim() ?? "";
      let generatedVersionId = persistedGenerateResult.trainingPlanVersionId?.trim() ?? "";
      let refreshedWorkspace: TrainingPlanWorkspace | null = null;
      let workspaceRefreshStatus = "not_started";
      try {
        workspaceRefreshStatus = "started";
        refreshedWorkspace = await getTrainingPlanWorkspace(entityId, athleteIdTrimmed);
        setWorkspace(refreshedWorkspace);
        workspaceHasLoadedRef.current = true;
        setWorkspaceError(null);
        workspaceRefreshStatus = "completed";
      } catch (e) {
        workspaceRefreshStatus = "failed";
        setWorkspaceError(
          formatApiError(
            e,
            "Could not refresh generated training plan workspace. Please retry.",
          ),
        );
      }
      const workspaceSummary = refreshedWorkspace?.domains[domain]?.summary ?? null;
      const workspacePlanId = workspaceSummary?.trainingPlanId?.trim() ?? "";
      const workspaceVersionId = workspaceSummary?.versionId?.trim() ?? "";
      if (generatedPlanId === "" && workspacePlanId !== "") {
        generatedPlanId = workspacePlanId;
      }
      if (generatedVersionId === "" && workspaceVersionId !== "") {
        generatedVersionId = workspaceVersionId;
      }
      const detailFetchUrl =
        generatedPlanId !== ""
          ? `/training-plan-management/${encodeURIComponent(generatedPlanId)}/active/detail?generationDomain=${encodeURIComponent(domain)}`
          : null;
      let detailFetchStatus: string | number | null = null;
      if (generatedPlanId !== "") {
        try {
          await refreshPersistedPlanDetail(generatedPlanId, domain, {
            updateWorkflowRequestedPlanId: true,
          });
          detailFetchStatus = "ok";
        } catch (e) {
          detailFetchStatus = isNormalizedApiError(e) ? e.status : "error";
          setPersistedSkillsPlanError(
            formatApiError(e, `Could not load ${trainingPlanDomainLabel(domain)}.`),
          );
          setPersistedPlanErrorDomain(domain);
        }
      } else {
        detailFetchStatus = "missing_plan_id";
      }
      logTrainingPlanGenerationAutoLoadDiagnostic({
        generatedDomain: domain,
        generationResponsePlanId: persistedGenerateResult.trainingPlanId?.trim() || null,
        generationResponseVersionId:
          persistedGenerateResult.trainingPlanVersionId?.trim() || null,
        workspaceRefreshStatus,
        workspaceSummaryStatus: workspaceSummary?.status ?? null,
        workspaceSummaryPlanId: workspacePlanId || null,
        workspaceSummaryVersionId: workspaceVersionId || null,
        selectedDetailDomain: generatedPlanId !== "" ? domain : null,
        detailFetchUrl,
        detailFetchStatus,
        rendererBranch:
          trainingPlanShellModel.shell === "head_coach_function_aware"
            ? "head_coach_function_aware"
            : "assistant_domain_workspace",
        noPlanCreatedReason:
          generatedPlanId === "" ? "generated result and workspace summary missing plan id" : null,
      });
      if (generatedPlanId !== "") {
        setGeneratePlanSuccess({
          ...persistedGenerateResult,
          trainingPlanId: generatedPlanId,
          trainingPlanVersionId: generatedVersionId || persistedGenerateResult.trainingPlanVersionId,
        });
      } else {
        setGeneratePlanRecoveryMessage(
          "Generation completed. Refreshing the saved plan summary before showing the draft.",
        );
      }
      if (refreshedWorkspace === null) {
        void refreshTrainingPlanWorkspace({ background: true });
      }
    } catch (e) {
      setGeneratePlanSuccess(null);
      setGeneratePlanSuccessDomain(null);
      if (
        isNormalizedApiError(e) &&
        e.code === "UNAUTHORIZED_DOMAIN_FOR_COACH_FUNCTION"
      ) {
        setGeneratePlanError("Coach is not authorized to generate this plan domain.");
        return;
      }
      if (isAiGenerationValidationError(e)) {
        console.error("Training plan generation validation error", e);
        setGeneratePlanError(AI_GENERATION_VALIDATION_ERROR_MESSAGE);
        return;
      }
      setGeneratePlanError(
        formatApiError(e, "Could not generate training plan draft. Please try again shortly."),
      );
    } finally {
      if (generatePlanJobRequestGenRef.current[domain] === requestGeneration) {
        setGeneratePlanJobsByDomain((current) => {
          const next = { ...current };
          const job = next[domain] ?? null;
          if (job?.status === "FAILED" || job?.status === "COMPLETED") {
            next[domain] = job;
          }
          return next;
        });
      }
    }
  }

  function renderLevelValidationStepContent() {
    return (
                !workflowPrecMap["level-validation"] ? (
                  <WorkflowLockedCard
                    title="Step 2 — Level Validation"
                    message="Finish APP completeness (required fields and eligibility) before Level Validation."
                  />
                ) : (
                  <section className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-normal text-textPrimary">
                        Step 2 — Level Validation
                      </h3>
                      <p className="text-sm text-textSecondary">
                        Confirm validated level metadata before proceeding to workload assessment.
                      </p>
                    </div>
                    {readinessLoading ? (
                      <DashboardStatusNotice type="loading" compact>
                        Loading readiness details...
                      </DashboardStatusNotice>
                    ) : (
                      <div className="space-y-3">
                        {readinessError ? (
                          <DashboardStatusNotice type="warning" compact>
                            {readinessError}
                          </DashboardStatusNotice>
                        ) : null}
                        <dl className="divide-y divide-border/70 border-y border-border/70">
                          <div className="py-3">
                            <dt className="text-xs font-medium uppercase tracking-wide text-textMuted">
                              Level Validation Status
                            </dt>
                            <dd className="mt-1 break-words text-sm text-textPrimary">
                              {displayValue(readinessPanel.validationStatus)}
                            </dd>
                          </div>
                          <div className="py-3">
                            <dt className="text-xs font-medium uppercase tracking-wide text-textMuted">
                              Validated Level
                            </dt>
                            <dd className="mt-1 break-words text-sm text-textPrimary">
                              {displayValue(readinessPanel.validatedLevel)}
                            </dd>
                          </div>
                        </dl>
                        {showValidateLevel ? (
                          <div className="pt-1">
                            {levelStepComplete ? (
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setSelectedWorkflowTab("workload")}
                              >
                                Continue to Workload Assessment
                              </Button>
                            ) : (
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={missingPlanningProfile}
                              onClick={() => setLevelValidationModalOpen(true)}
                            >
                              Continue to Level Validation
                            </Button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}
                    {levelStepComplete ? (
                      <WorkflowTabNextButton
                        label="Next → Workload Assessment"
                        onClick={() => handleAdvanceContextBuilderStep("workload")}
                      />
                    ) : null}
                  </section>
                )

    );
  }

  function renderWorkloadAssessmentStepContent() {
    return (
                isDownstreamDomainCoach ? (
                  <div className="space-y-3">
                    <h3 className="text-base font-normal text-textPrimary">
                      Step 3 — Workload Assessment
                    </h3>
                    {renderDownstreamUpstreamPlanningReadOnlySection()}
                  </div>
                ) : !workflowPrecMap.workload ? (
                  <WorkflowLockedCard
                    title="Step 3 — Workload Assessment"
                    message="Confirm level validation before running workload assessment."
                  />
                ) : (
                  <>
                    {workloadComplete && !showWorkloadCompletionState ? (
                      <WorkflowCompactSummaryStrip
                        title="Step 3 — Workload Assessment"
                        values={[
                          {
                            label: "Current Weekly Training Hours",
                            value: displayValue(
                              workloadAssessmentResult?.workloadClassification?.weeklyTrainingHours,
                            ),
                          },
                          {
                            label: "Recommended Range",
                            value: formatWeeklyRange(
                              workloadAssessmentResult?.workloadClassification?.recommendedMinHours ??
                                null,
                              workloadAssessmentResult?.workloadClassification?.recommendedMaxHours ??
                                null,
                            ),
                          },
                          {
                            label: "Training Load Status",
                            value: displayValue(
                              workloadAssessmentResult?.workloadClassification?.status,
                            ),
                          },
                          {
                            label: "Sport",
                            value: displayValue(workloadAssessmentResult?.workloadClassification?.sportCode),
                          },
                          {
                            label: "Age Band",
                            value: displayValue(workloadAssessmentResult?.workloadClassification?.ageBand),
                          },
                        ]}
                      />
                    ) : (
                      <TrainingPlanWorkloadAssessmentStep
                        showValidateLevel={showValidateLevel}
                        readinessLoading={readinessLoading}
                        workloadAssessmentLoading={workloadAssessmentLoading}
                        workloadAssessmentError={workloadAssessmentError}
                        workloadAssessmentResult={workloadAssessmentResult}
                        workloadComplete={workloadComplete}
                        showWorkloadCompletionState={showWorkloadCompletionState}
                        readinessGate={{
                          appCompleteness: readinessPanel.appCompleteness,
                          validationStatus: readinessPanel.validationStatus,
                          planningEligibility: readinessPanel.planningEligibility,
                        }}
                        onRunWorkloadAssessment={() => {
                          void handleRunWorkloadAssessment();
                        }}
                      />
                    )}
                    {workloadComplete ? (
                      <WorkflowTabNextButton
                        label="Next → Goals"
                        onClick={() => handleAdvanceContextBuilderStep("season-goals")}
                      />
                    ) : null}
                  </>
                )

    );
  }

  function renderSeasonGoalsStepContent() {
    return (
                isDownstreamDomainCoach ? (
                  <div className="space-y-3">
                    <h3 className="text-base font-normal text-textPrimary">Step 4 — Season & Goals</h3>
                    {renderDownstreamUpstreamPlanningReadOnlySection()}
                  </div>
                ) : !workflowPrecMap["season-goals"] ? (
                  <WorkflowLockedCard
                    title="Step 4 — Season & Goals"
                    message="Finish workload assessment before configuring season, phases, competition, and goals."
                  />
                ) : setupLoading ? (
                  <DashboardStatusNotice type="loading" compact>
                    Loading goals and season setup...
                  </DashboardStatusNotice>
                ) : (
                  <section className="space-y-5">
                    <div className="space-y-5">
                <section className="space-y-3 border-t border-border/70 pt-4 first:border-t-0 first:pt-0">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-textPrimary">
                      Setting Season
                    </h3>
                    <p className="text-sm text-textSecondary">
                      Create or select a season to define the training timeline.
                    </p>
                  </div>
                  {seasonError ? (
                    <DashboardStatusNotice type="error" compact>
                      {seasonError}
                    </DashboardStatusNotice>
                  ) : null}
                  {seasonSuccess ? (
                    <DashboardStatusNotice type="success" compact>
                      {seasonSuccess}
                    </DashboardStatusNotice>
                  ) : null}

                  {hasEntitySeasons ? (
                    <label className="block space-y-1 text-sm text-textPrimary">
                      <span className="font-medium">Selected Season</span>
                      <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary"
                        value={selectedSeasonCycleId ?? ""}
                        onChange={(event) => {
                          const nextId = event.target.value;
                          if (nextId === "") {
                            setSelectedSeasonCycleId(null);
                            setSelectedGoalIds([]);
                            setSeasonCreateFormExplicit(false);
                            return;
                          }
                          setSeasonCreateFormExplicit(false);
                          setSelectedSeasonCycleId(nextId);
                          setSelectedGoalIds([]);
                        }}
                      >
                        <option value="">Select season</option>
                        {setupState.seasons.map((season) => (
                          <option key={season.seasonCycleId} value={season.seasonCycleId}>
                            {formatSeasonOptionLabel(season)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  {hasSelectedSeasonForPlan ? (
                    <>
                      <p className="text-sm text-textSecondary">
                        Season selected for this plan. To choose a different season, use the season
                        dropdown.
                      </p>
                      <dl className="space-y-2">
                        <DetailRow
                          label="Status"
                          value={
                            seasonReady
                              ? "Ready"
                              : "Pending — not ready"
                          }
                        />
                      </dl>
                      {selectedSeason ? (
                        <div className="border-y border-border/70 py-3">
                          <dl className="space-y-2">
                            <DetailRow
                              label="Season Name"
                              value={displayValue(selectedSeason.name)}
                            />
                            <DetailRow
                              label="Sport"
                              value={displayValue(selectedSeason.sport)}
                            />
                            <DetailRow
                              label="Year"
                              value={displayValue(selectedSeason.year)}
                            />
                            <DetailRow
                              label="Season Dates"
                              value={formatDateRange(selectedSeason.startDate, selectedSeason.endDate)}
                            />
                          </dl>
                        </div>
                      ) : null}
                    </>
                  ) : showSeasonCreateForm ? (
                    <>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-1 text-sm text-textPrimary">
                          <span className="font-medium">Season Name</span>
                          <input
                            type="text"
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary"
                            value={seasonName}
                            onChange={(event) => {
                              setSeasonNameEdited(true);
                              setSeasonName(event.target.value);
                            }}
                          />
                        </label>
                        <label className="space-y-1 text-sm text-textPrimary">
                          <span className="font-medium">Year</span>
                          <input
                            type="number"
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary"
                            value={seasonYear}
                            onChange={(event) =>
                              setSeasonYear(Number(event.target.value) || seasonYear)
                            }
                          />
                        </label>
                        <label className="space-y-1 text-sm text-textPrimary">
                          <span className="font-medium">Sport</span>
                          <input
                            type="text"
                            className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-textPrimary"
                            value={athleteSportCode ?? ""}
                            readOnly
                          />
                        </label>
                        <label className="space-y-1 text-sm text-textPrimary">
                          <span className="font-medium">Season Start Date</span>
                          <input
                            type="date"
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary"
                            value={seasonStartDate}
                            onChange={(event) => setSeasonStartDate(event.target.value)}
                          />
                        </label>
                        <label className="space-y-1 text-sm text-textPrimary">
                          <span className="font-medium">Season End Date</span>
                          <input
                            type="date"
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary"
                            value={seasonEndDate}
                            onChange={(event) => setSeasonEndDate(event.target.value)}
                          />
                        </label>
                      </div>
                      <dl className="space-y-2">
                        <DetailRow
                          label="Status"
                          value={
                            seasonReady
                              ? "Ready"
                              : "Pending — not ready"
                          }
                        />
                      </dl>
                      {!hasEntitySeasons ? (
                        <DashboardStatusNotice type="empty" compact>
                          No seasons found for this entity. Create one to continue.
                        </DashboardStatusNotice>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          disabled={
                            seasonCreateLoading ||
                            !athleteSportCode ||
                            entityId === ""
                          }
                          onClick={() => {
                            void handleCreateMvpSeason();
                          }}
                        >
                          {seasonCreateLoading ? "Creating Season..." : "Create Season"}
                        </Button>
                        {hasEntitySeasons && seasonCreateFormExplicit ? (
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={seasonCreateLoading}
                            onClick={() => {
                              setSeasonCreateFormExplicit(false);
                              setSeasonError(null);
                              setSeasonSuccess(null);
                            }}
                          >
                            Cancel
                          </Button>
                        ) : null}
                      </div>
                    </>
                  ) : hasEntitySeasons ? (
                    <div className="space-y-2">
                      <p className="text-sm text-textSecondary">
                        Select a season from the dropdown, or add a new entity season if you need one.
                      </p>
                      <button
                        type="button"
                        className="text-left text-sm font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
                        onClick={() => beginExplicitSeasonCreateForm()}
                      >
                        Need a new season?
                      </button>
                    </div>
                  ) : null}
                </section>

                <section className="space-y-3 border-t border-border/70 pt-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-textPrimary">
                      Setting Season Phase
                    </h3>
                    <p className="text-sm text-textSecondary">
                      Break the season into phases and confirm the current phase for today&apos;s date.
                    </p>
                  </div>
                  {phaseError ? (
                    <DashboardStatusNotice type="error" compact>
                      {phaseError}
                    </DashboardStatusNotice>
                  ) : null}
                  {phaseSuccess ? (
                    <DashboardStatusNotice type="success" compact>
                      {phaseSuccess}
                    </DashboardStatusNotice>
                  ) : null}
                  <dl className="space-y-2">
                    <DetailRow
                      label="Selected Season Range"
                      value={
                        selectedSeason
                          ? formatDateRange(selectedSeason.startDate, selectedSeason.endDate)
                          : "Select a season first"
                      }
                    />
                    <DetailRow
                      label="Detected Current Phase"
                      value={
                        selectedSeasonCycleId == null
                          ? "Pending — not ready"
                          : activePhaseForSelectedSeason
                          ? `${displayValue(activePhaseForSelectedSeason.phase)} (${formatDateRange(activePhaseForSelectedSeason.startDate, activePhaseForSelectedSeason.endDate)})`
                          : "Pending — not ready"
                      }
                    />
                  </dl>
                  <div className="grid gap-3 md:grid-cols-3">
                    {(["OFF_SEASON", "PRE_SEASON", "IN_SEASON"] as SeasonPhaseType[]).map(
                      (phase) => {
                        const existing = phaseByType[phase] ?? null;
                        const editor = phaseEditorState[phase];
                        const isEditing = existing !== null && editor.isEditing;
                        const startValue =
                          existing !== null
                            ? isEditing
                              ? editor.startDate
                              : (dateOnly(existing.startDate) ?? "")
                            : phaseDrafts[phase].startDate;
                        const endValue =
                          existing !== null
                            ? isEditing
                              ? editor.endDate
                              : (dateOnly(existing.endDate) ?? "")
                            : phaseDrafts[phase].endDate;
                        return (
                          <div
                            key={phase}
                            className="space-y-2 border-l border-border/70 pl-3"
                          >
                            <div className="font-medium text-textPrimary">
                              {toFieldLabel(phase)}
                            </div>
                            {existing ? (
                              <div className="text-xs text-textMuted">Created</div>
                            ) : null}
                            <label className="space-y-1 text-sm text-textPrimary">
                              <span>Start</span>
                              <input
                                type="date"
                                readOnly={existing !== null && !isEditing}
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary disabled:bg-slate-100"
                                value={startValue}
                                onChange={(event) => {
                                  if (existing !== null) {
                                    setPhaseEditorState((current) => ({
                                      ...current,
                                      [phase]: {
                                        ...current[phase],
                                        startDate: event.target.value,
                                      },
                                    }));
                                    return;
                                  }
                                  setPhaseDrafts((current) => ({
                                    ...current,
                                    [phase]: {
                                      ...current[phase],
                                      startDate: event.target.value,
                                    },
                                  }));
                                }}
                              />
                            </label>
                            <label className="space-y-1 text-sm text-textPrimary">
                              <span>End</span>
                              <input
                                type="date"
                                readOnly={existing !== null && !isEditing}
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary disabled:bg-slate-100"
                                value={endValue}
                                onChange={(event) => {
                                  if (existing !== null) {
                                    setPhaseEditorState((current) => ({
                                      ...current,
                                      [phase]: {
                                        ...current[phase],
                                        endDate: event.target.value,
                                      },
                                    }));
                                    return;
                                  }
                                  setPhaseDrafts((current) => ({
                                    ...current,
                                    [phase]: {
                                      ...current[phase],
                                      endDate: event.target.value,
                                    },
                                  }));
                                }}
                              />
                            </label>
                            {editor.error ? (
                              <DashboardStatusNotice type="error" compact>
                                {editor.error}
                              </DashboardStatusNotice>
                            ) : null}
                            {editor.success ? (
                              <DashboardStatusNotice type="success" compact>
                                {editor.success}
                              </DashboardStatusNotice>
                            ) : null}
                            {existing ? (
                              isEditing ? (
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    variant="primary"
                                    disabled={editor.loading}
                                    onClick={() => {
                                      void handleSavePhaseChanges(phase);
                                    }}
                                  >
                                    {editor.loading ? "Saving Changes..." : "Save Changes"}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    disabled={editor.loading}
                                    onClick={() => handleCancelPhaseEdit(phase)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={() => handleEditPhase(phase)}
                                >
                                  Edit
                                </Button>
                              )
                            ) : (
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={selectedSeasonCycleId == null || phaseCreateLoading === phase}
                                onClick={() => {
                                  void handleCreatePhase(phase);
                                }}
                              >
                                {phaseCreateLoading === phase
                                  ? "Saving..."
                                  : `Create ${toFieldLabel(phase)}`}
                              </Button>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                </section>

                <section className="space-y-3 border-t border-border/70 pt-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-textPrimary">Creation of Goals</h3>
                    <p className="text-sm text-textSecondary">
                      Add competition or custom goals, or choose from the goal library for this
                      phase.
                    </p>
                  </div>

                {phaseByType.IN_SEASON ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-sm font-normal text-textPrimary">
                        Competition schedule
                      </h4>
                      <p className="text-sm text-textSecondary">
                        Competition goals become available once In-season exists.
                      </p>
                    </div>
                    <>
                      {competitionError ? (
                        <DashboardStatusNotice type="error" compact>
                          {competitionError}
                        </DashboardStatusNotice>
                      ) : null}
                      {competitionSuccess ? (
                        <DashboardStatusNotice type="success" compact>
                          {competitionSuccess}
                        </DashboardStatusNotice>
                      ) : null}
                      {activePhaseForSelectedSeason?.phase === "IN_SEASON" ? (
                        <DashboardStatusNotice type="warning" compact>
                          Current phase is In-season. Competition goals are recommended.
                        </DashboardStatusNotice>
                      ) : null}
                      <div className="grid gap-3 md:grid-cols-3">
                        <label className="space-y-1 text-sm text-textPrimary md:col-span-2">
                          <span className="font-medium">Competition name</span>
                          <input
                            type="text"
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary"
                            value={competitionName}
                            onChange={(event) => setCompetitionName(event.target.value)}
                          />
                        </label>
                        <label className="space-y-1 text-sm text-textPrimary">
                          <span className="font-medium">Competition date</span>
                          <input
                            type="date"
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary"
                            value={competitionDate}
                            onChange={(event) => setCompetitionDate(event.target.value)}
                          />
                        </label>
                        <label className="space-y-1 text-sm text-textPrimary">
                          <span className="font-medium">Importance</span>
                          <select
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary"
                            value={competitionImportance}
                            onChange={(event) =>
                              setCompetitionImportance(
                                event.target.value as "LOW" | "MEDIUM" | "HIGH",
                              )
                            }
                          >
                            <option value="LOW">LOW</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HIGH">HIGH</option>
                          </select>
                        </label>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={
                          competitionCreateLoading ||
                          selectedSeasonCycleId == null ||
                          currentCoachUserId === ""
                        }
                        onClick={() => {
                          void handleCreateCompetitionGoal();
                        }}
                      >
                        {competitionCreateLoading ? "Adding Competition Goal..." : "Add Competition Goal"}
                      </Button>
                      <div className="space-y-2 border-y border-border/70 py-3">
                        {competitionGoals.length > 0 ? (
                          competitionGoals.map((goal) => (
                            <div key={goal.goalId} className="border-t border-border/70 pt-3 first:border-t-0 first:pt-0">
                              <GoalDisplayBlock
                                title={coachFacingGoalTitle(goal)}
                                status={goal.status}
                                targetDate={goal.targetDate}
                              />
                            </div>
                          ))
                        ) : (
                          <DashboardStatusNotice type="empty" compact>
                            No competition goals found for this season.
                          </DashboardStatusNotice>
                        )}
                      </div>
                    </>
                  </div>
                ) : null}

                  <div className="space-y-1 border-t border-border/70 pt-3">
                    <h4 className="text-sm font-normal text-textPrimary">
                      {currentPhaseGoalSectionTitle()}
                    </h4>
                    <p className="text-sm text-textSecondary">
                      {currentPhaseGoalRequirementLabel()}
                    </p>
                  </div>
                  {goalError ? (
                    <DashboardStatusNotice type="error" compact>
                      {goalError}
                    </DashboardStatusNotice>
                  ) : null}
                  {goalSuccess ? (
                    <DashboardStatusNotice type="success" compact>
                      {goalSuccess}
                    </DashboardStatusNotice>
                  ) : null}
                  {currentCoachUserId === "" ? (
                    <DashboardStatusNotice type="warning" compact>
                      Authenticated coach user ID is required to create goals.
                    </DashboardStatusNotice>
                  ) : null}
                  {activePhaseForSelectedSeason ? (
                    <DetailRow
                      label="Detected Current Phase"
                      value={displayValue(activePhaseForSelectedSeason.phase)}
                    />
                  ) : null}
                  <div className="space-y-3 border-y border-border/70 py-3">
                    <p className="text-sm font-medium text-textPrimary">Goal creation mode</p>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm text-textPrimary">
                        <input
                          type="radio"
                          name="goal-creation-mode"
                          checked={goalCreationMode === "CUSTOM"}
                          onChange={() => setGoalCreationMode("CUSTOM")}
                        />
                        <span>Custom goal</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-textPrimary">
                        <input
                          type="radio"
                          name="goal-creation-mode"
                          checked={goalCreationMode === "LIBRARY"}
                          onChange={() => setGoalCreationMode("LIBRARY")}
                        />
                        <span>Choose from Goal Library</span>
                      </label>
                    </div>
                  </div>

                  {goalCreationMode === "LIBRARY" ? (
                    <div className="space-y-3 border-y border-border/70 py-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-textPrimary">Goal Library</p>
                        <p className="text-sm text-textSecondary">
                          Choose one or more phase-appropriate goals for the athlete&apos;s validated
                          level.
                        </p>
                      </div>
                      <DetailRow
                        label="Validated Level"
                        value={displayValue(goalLibraryLevel)}
                      />
                      {goalLibraryLoading ? (
                        <DashboardStatusNotice type="loading" compact>
                          Loading Goal Library...
                        </DashboardStatusNotice>
                      ) : null}
                      {goalLibraryError ? (
                        <DashboardStatusNotice type="warning" compact>
                          {goalLibraryError}
                        </DashboardStatusNotice>
                      ) : null}
                      {!goalLibraryLoading && !goalLibraryError && goalLibraryLevel === null ? (
                        <DashboardStatusNotice type="empty" compact>
                          Validate athlete level to load Goal Library options.
                        </DashboardStatusNotice>
                      ) : null}
                      {!goalLibraryLoading &&
                      !goalLibraryError &&
                      goalLibraryLevel !== null &&
                      goalLibraryCategories.length === 0 ? (
                        <DashboardStatusNotice type="empty" compact>
                          No Goal Library categories matched this athlete context.
                        </DashboardStatusNotice>
                      ) : null}
                      {!goalLibraryLoading && !goalLibraryError
                        ? goalLibraryCategories.map((category) => {
                            const categoryGoals = goalLibraryLevel
                              ? (category.levels[goalLibraryLevel] ?? []).filter((goal) => {
                                  const goalDomain = goalLibraryDomainValue(goal);
                                  return (
                                    goalDomain === null ||
                                    goalDomain === effectiveCoachGenerationDomain
                                  );
                                })
                              : [];
                            if (categoryGoals.length === 0) return null;
                            return (
                              <div
                                key={category.categoryKey}
                                className="space-y-2 border-t border-border/70 pt-3 first:border-t-0 first:pt-0"
                              >
                                <p className="text-sm font-normal text-textPrimary">
                                  {category.categoryLabel}
                                </p>
                                <div className="space-y-2">
                                  {categoryGoals.map((goal) => (
                                    <label
                                      key={goal.libraryGoalId}
                                      className="flex items-start gap-2 text-sm text-textPrimary"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedLibraryGoalIds.includes(goal.libraryGoalId)}
                                        onChange={(event) => {
                                          setSelectedLibraryGoalIds((current) =>
                                            event.target.checked
                                              ? [...current, goal.libraryGoalId]
                                              : current.filter((id) => id !== goal.libraryGoalId),
                                          );
                                        }}
                                      />
                                      <div className="space-y-1">
                                        <p className="font-medium text-textPrimary">{goal.goalName}</p>
                                        {goal.successCriteria.length > 0 ? (
                                          <p className="text-textSecondary">
                                            {goal.successCriteria.join(" ")}
                                          </p>
                                        ) : null}
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })
                        : null}
                    </div>
                  ) : null}

                  <div className="grid gap-3 md:grid-cols-2">
                    {goalCreationMode === "CUSTOM" ? (
                      <label className="space-y-1 text-sm text-textPrimary">
                        <span className="font-medium">
                          {currentPhaseGoalNameLabel(effectiveCoachGenerationDomain)}
                        </span>
                        <input
                          type="text"
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary"
                          value={goalName}
                          onChange={(event) => setGoalName(event.target.value)}
                        />
                      </label>
                    ) : null}
                    <label className="space-y-1 text-sm text-textPrimary">
                      <span className="font-medium">Priority</span>
                      <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary"
                        value={goalPriority}
                        onChange={(event) =>
                          setGoalPriority(event.target.value as GoalPriority)
                        }
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                      </select>
                    </label>
                    {goalCreationMode === "CUSTOM" ? (
                      <label className="space-y-1 text-sm text-textPrimary">
                        <span className="font-medium">Success Criteria / Measurement</span>
                        <textarea
                          rows={3}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary caret-current placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                          value={goalSuccessCriteria}
                          onChange={(event) => setGoalSuccessCriteria(event.target.value)}
                        />
                      </label>
                    ) : null}
                    <label className="space-y-1 text-sm text-textPrimary">
                      <span className="font-medium">Numeric Target Value (Optional)</span>
                      <input
                        type="number"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary"
                        value={goalTargetValue}
                        onChange={(event) => setGoalTargetValue(event.target.value)}
                      />
                    </label>
                    <label className="space-y-1 text-sm text-textPrimary">
                      <span className="font-medium">Target Date</span>
                      <input
                        type="date"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary"
                        value={goalTargetDate}
                        onChange={(event) => setGoalTargetDate(event.target.value)}
                      />
                    </label>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={
                      goalCreateLoading ||
                      selectedSeasonCycleId == null ||
                      currentCoachUserId === "" ||
                      !activePhaseForSelectedSeason?.phaseId ||
                      (goalCreationMode === "LIBRARY" &&
                        (goalLibraryLoading ||
                          goalLibraryLevel === null ||
                          selectedLibraryGoalIds.length === 0))
                    }
                    onClick={() => {
                      void handleCreateCurrentPhaseGoal();
                    }}
                  >
                    {goalCreateLoading ? "Creating Goal..." : "Create Goal"}
                  </Button>
                </section>

                <section className="space-y-3 border-t border-border/70 pt-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-textPrimary">Setting / Selecting Goals</h3>
                    <p className="text-sm text-textSecondary">
                      Choose the active goals that should shape this training plan.
                    </p>
                  </div>
                  <div className="space-y-2 border-y border-border/70 py-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-textPrimary">
                        Select at least one active goal to continue to Plan Dates.
                      </p>
                      {selectedGoalIds.length === 0 ? (
                        <p className="text-sm text-textSecondary">Waiting for goal selection.</p>
                      ) : (
                        <p className="text-sm font-medium text-primary">
                          {selectedActiveGoals.length} goal
                          {selectedActiveGoals.length === 1 ? "" : "s"} selected. Use Next to
                          continue to Plan Dates.
                        </p>
                      )}
                    </div>
                    {selectedActiveGoals.length > 0 ? (
                      <dl className="space-y-2 border-b border-border/70 pb-3">
                        <DetailRow
                          label="Selected goals"
                          value={selectedActiveGoals
                            .map((goal) => coachFacingGoalTitle(goal))
                            .join(", ")}
                        />
                      </dl>
                    ) : null}
                    {currentPhaseActiveGoals.length > 0 ? (
                      currentPhaseActiveGoals.map((goal) => (
                        <label
                          key={goal.goalId}
                          className="flex items-start gap-2 text-sm text-textPrimary"
                        >
                          <GoalDisplayBlock
                            title={coachFacingGoalTitle(goal)}
                            status={goal.status}
                            priority={goal.priority}
                            successCriteria={goal.successCriteria}
                            targetDate={goal.targetDate}
                            domain={goal.domain}
                            showDomain
                            secondaryLabel={
                              goal.competitionEventId
                                ? "Competition"
                                : goal.goalType === "LIBRARY"
                                  ? "Library"
                                  : "Coach-created"
                            }
                            control={
                              <input
                                type="checkbox"
                                checked={selectedGoalIds.includes(goal.goalId)}
                                onChange={(event) => {
                                  setSelectedGoalIds((current) =>
                                    event.target.checked
                                      ? [...current, goal.goalId]
                                      : current.filter((id) => id !== goal.goalId),
                                  );
                                }}
                              />
                            }
                          />
                        </label>
                      ))
                    ) : (
                      <div className="text-sm text-textSecondary">
                        {currentPhaseGoalEmptyState(effectiveCoachGenerationDomain)}
                      </div>
                    )}
                  </div>
                </section>
                    {seasonGoalsGateComplete || headCoachLockedContextStepComplete ? (
                      <WorkflowTabNextButton
                        label="Next → Plan Dates"
                        onClick={() => handleAdvanceContextBuilderStep("plan-dates")}
                      />
                    ) : null}
                    </div>
                  </section>
                )

    );
  }

  function renderPlanDatesStepContent() {
    return (
              isDownstreamDomainCoach ? (
                <div className="space-y-3">
                  <h3 className="text-base font-normal text-textPrimary">Step 5 — Plan Dates</h3>
                  {renderDownstreamUpstreamPlanningReadOnlySection()}
                </div>
              ) : !workflowPrecMap["plan-dates"] ? (
                <WorkflowLockedCard
                  title="Step 5 — Plan Dates"
                  message="Season, current phase, and at least one active goal must be ready before configuring plan dates."
                />
              ) : (
                <section className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-normal text-textPrimary">Step 5 — Plan Dates</h3>
                  </div>
                  <WorkflowGeminiPlanSetupPanel
                  currentCoachGenerationDomain={effectiveCoachGenerationDomain}
                  durationDays={durationDays}
                  setDurationDays={setDurationDays}
                  currentPlanDurationDays={currentPlanDurationDays}
                  planStartDate={planStartDate}
                  setPlanStartDate={setPlanStartDate}
                  planEndDate={planEndDate}
                  currentPhaseDetected={currentPhaseDetected}
                  planWindowInsideCurrentPhase={planWindowInsideCurrentPhase}
                  planSeasonBoundsUi={planSeasonBoundsUi}
                  planDatesProceedEnabled={planDatesWindowComplete}
                  planDatesConfirmedForCurrentAthlete={planDatesConfirmedForCurrentAthlete}
                  onConfirmPlanDates={() => setPlanDatesConfirmedForCurrentAthlete(true)}
                />
                  {planDatesStepComplete && !headCoachLockedContextStepComplete ? (
                    <DashboardStatusNotice
                      type="success"
                      title="Plan dates confirmed."
                      nextStep="Close this window to return to Context Builder, then select Lock & Share Context with Coaches."
                      action={
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleCloseContextBuilderDrawer}
                        >
                          Close
                        </Button>
                      }
                    />
                  ) : headCoachLockedContextStepComplete ? (
                    <DashboardStatusNotice
                      type="success"
                      title="Planning context is locked."
                      nextStep="Close this drawer to continue to Domain Plans Integration."
                      action={
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleCloseContextBuilderDrawer}
                        >
                          Close
                        </Button>
                      }
                    />
                  ) : null}
                </section>
              )

    );
  }

  function appDrawerGroupRows(
    group: Record<string, DisplayableValue> | null | undefined,
    preferredOrder: string[] = [],
  ): Array<{ label: string; value: ReactNode }> {
    if (!group || typeof group !== "object" || Array.isArray(group)) return [];
    const rows: Array<{ label: string; value: ReactNode }> = [];
    const seen = new Set<string>();

    for (const key of preferredOrder) {
      if (!Object.prototype.hasOwnProperty.call(group, key)) continue;
      const value = group[key];
      if (!hasRenderableValue(value)) continue;
      rows.push({ label: toFieldLabel(key), value: displayValue(value) });
      seen.add(key);
    }

    for (const [key, value] of Object.entries(group)) {
      if (seen.has(key) || !hasRenderableValue(value)) continue;
      rows.push({ label: toFieldLabel(key), value: displayValue(value) });
    }

    return rows;
  }

  function renderAppDrawerSection(
    title: string,
    rows: Array<{ label: string; value: ReactNode }>,
    description?: string,
  ) {
    if (rows.length === 0) return null;
    return (
      <div className="space-y-3 border-t border-border/70 pt-4 first:border-t-0 first:pt-0">
        <div className="space-y-1">
          <h3 className="text-base font-normal text-textPrimary">{title}</h3>
          {description ? <p className="text-sm text-textSecondary">{description}</p> : null}
        </div>
        <dl className="divide-y divide-border/70 border-y border-border/70">
          {rows.map((row) => (
            <div key={row.label} className="py-3">
              <DetailRow label={row.label} value={row.value} />
            </div>
          ))}
        </dl>
      </div>
    );
  }

  function renderContextAppDrawerContent() {
    const readinessRows = [
      { label: "Readiness Status", value: displayValue(readinessPanel.readinessStatus) },
      { label: "APP Completeness", value: displayValue(readinessPanel.appCompleteness) },
      { label: "Planning Eligibility", value: displayValue(readinessPanel.planningEligibility) },
      {
        label: "Backend Can Generate",
        value:
          readinessPanel.canGenerate === null
            ? displayValue(readinessPanel.canGenerate)
            : readinessPanel.canGenerate
              ? "Yes"
              : "No",
      },
      {
        label: "Backend Is Ready",
        value:
          readinessPanel.isReady === null
            ? displayValue(readinessPanel.isReady)
            : readinessPanel.isReady
              ? "Yes"
              : "No",
      },
      {
        label: "Pending Actions",
        value:
          coachFacingPlanningContextBlockers(readinessPanel.blockers).join(", ") ||
          "None",
      },
      {
        label: "Missing Required Fields",
        value: formatMissingRequiredFields(readinessPanel.missingRequiredFields),
      },
      ...(readinessPanel.completenessSummary
        ? [{ label: "Completeness Summary", value: displayValue(readinessPanel.completenessSummary) }]
        : []),
    ];
    const workloadAgeBand =
      workloadAssessmentResult?.workloadClassification?.ageBand ?? null;
    const profileRows = profile
      ? [
          {
            label: "Date of Birth",
            value: formatPlanningProfileDateDisplay(profile.dateOfBirth),
          },
          { label: "Age", value: displayValue(profile.derivedAge) },
          { label: "Sex", value: displayValue(profile.sex) },
          { label: "Primary Sport", value: displayValue(profile.primarySport) },
          { label: "Discipline / Event", value: displayValue(profile.disciplineOrEvent) },
          { label: "Self-Reported Level", value: displayValue(profile.selfReportedLevel) },
          { label: "Validated Level", value: displayValue(profile.validatedLevel) },
          { label: "Category / Age Band", value: displayValue(workloadAgeBand) },
          { label: "Training Age Years", value: displayValue(profile.trainingAgeYears) },
          {
            label: "Weekly Training Exposure Hours",
            value: displayValue(profile.currentWeeklyTrainingExposureHours),
          },
          {
            label: "Weekly Availability",
            value: `${displayValue(profile.weeklyAvailabilityDays)} days / ${displayValue(
              profile.weeklyAvailabilityHours,
            )} hours`,
          },
        ]
      : [];
    const bodyRows = profile
      ? [
          { label: "Height", value: displayValue(profile.heightCm) },
          { label: "Weight", value: displayValue(profile.weightKg) },
          { label: "BMI", value: displayValue(profile.derivedBmi) },
          ...appDrawerGroupRows(profile.bodyCompositionParameters, [
            "bodyFatPercent",
            "skeletalLeanMassKg",
            "skeletalFatMassKg",
            "visceralFatLevel",
            "visceralFatArea",
            "bmrKcalDay",
            "muscleMassKg",
          ]),
        ].filter((row) => row.value !== "—")
      : [];
    const bloodRows = profile
      ? appDrawerGroupRows(profile.bloodReportParameters, [
          "hemoglobin",
          "vitaminD",
          "vitaminB12",
          "ferritin",
          "crp",
          "fastingBloodGlucoseFBS",
          "postprandialBloodGlucosePPBS",
        ])
      : [];
    const comparisonRows = profile
      ? [
          { label: "Stage", value: displayValue(profile.stage) },
          { label: "Revision", value: displayValue(profile.revision) },
          { label: "Freshness Status", value: displayValue(profile.freshnessStatus) },
          { label: "Last Confirmed At", value: formatPlanningProfileDateDisplay(profile.lastConfirmedAt) },
          { label: "Updated At", value: formatPlanningProfileDateDisplay(profile.updatedAt) },
          {
            label: "Workload Status",
            value: displayValue(workloadAssessmentResult?.workloadClassification?.status ?? null),
          },
          {
            label: "Recommended Workload Range",
            value: displayValue(lockedPlanningContextCardFields.weeklyWorkload),
          },
          {
            label: "Validated-Level Comparison",
            value: displayValue(readinessPanel.validationStatus),
          },
          ...appDrawerGroupRows(profile.bloodReportComparisons),
          ...appDrawerGroupRows(profile.bodyCompositionComparisons),
        ].filter((row) => row.value !== "—")
      : [];
    const youthSafetyApplies =
      (typeof profile?.derivedAge === "number" && profile.derivedAge < 18) ||
      (typeof workloadAgeBand === "string" && /youth|junior|u\d+/i.test(workloadAgeBand));
    const safetyRows = profile
      ? [
          { label: "Diet Type", value: displayValue(profile.dietType) },
          { label: "Regional Cuisine Preference", value: displayValue(profile.regionalCuisinePreference) },
          { label: "Allergies / Intolerances", value: displayValue(profile.allergiesOrIntolerances) },
          { label: "Uses Wearable", value: displayValue(profile.wearableStatus) },
          { label: "Wearable Provider", value: displayValue(profile.wearableProvider) },
          { label: "Device Model", value: displayValue(profile.deviceModel) },
          { label: "Last Sync At", value: formatPlanningProfileDateDisplay(profile.lastSyncAt) },
          { label: "Avg Resting Heart Rate", value: displayValue(profile.avgRestingHeartRate) },
          { label: "Avg Sleep Duration", value: displayValue(profile.avgSleepDurationHours) },
          { label: "Avg Daily Activity Volume", value: displayValue(profile.avgDailyActivityVolume) },
          { label: "Recent Activity Days Count", value: displayValue(profile.recentActivityDaysCount) },
          { label: "Wearable Data Quality", value: displayValue(profile.wearableDataQuality) },
          ...(youthSafetyApplies
            ? [
                {
                  label: "Youth Safety Context",
                  value: "Apply workload and recovery constraints for youth/category context.",
                },
              ]
            : []),
        ].filter((row) => row.value !== "—")
      : [];

    return (
      <div className="space-y-5">
        {readinessLoading ? (
          <DashboardStatusNotice type="loading" compact>
            Loading readiness details...
          </DashboardStatusNotice>
        ) : (
          <>
            {readinessError ? (
              <DashboardStatusNotice type="warning" compact>
                {readinessError}
              </DashboardStatusNotice>
            ) : null}
            {renderAppDrawerSection("APP Readiness", readinessRows)}
          </>
        )}
        {renderAppDrawerSection("Athlete Profile", profileRows)}
        {renderAppDrawerSection("Body Composition", bodyRows)}
        {renderAppDrawerSection("Blood Report / Health Markers", bloodRows)}
        {renderAppDrawerSection("Comparison / Assessment Parameters", comparisonRows)}
        {renderAppDrawerSection("Injury / Safety / Constraints", safetyRows)}
      </div>
    );
  }

  function renderContextBuilderDrawerStepContent(step: ContextBuilderDrawerStepKey) {
    if (step === "context-app") return renderContextAppDrawerContent();
    if (step === "level-validation") return renderLevelValidationStepContent();
    if (step === "workload") return renderWorkloadAssessmentStepContent();
    if (step === "season-goals") return renderSeasonGoalsStepContent();
    return renderPlanDatesStepContent();
  }

  function isContextBuilderStep(step: GuidedWorkflowStepKey): step is ContextBuilderStepKey {
    return step !== "generate";
  }

  function contextBuilderStatusLabel(input: {
    complete: boolean;
    active: boolean;
    workflowStatus?: GuidedWorkflowStepStatus;
  }): string {
    if (input.complete) return "Completed";
    if (input.active) return "Active";
    if (input.workflowStatus === "locked") return "Locked";
    return "Pending";
  }

  function contextBuilderStepComplete(step: ContextBuilderStepKey): boolean {
    if (step === "context-app") return appStepComplete;
    if (step === "level-validation") return levelStepComplete;
    if (step === "workload") return workloadComplete;
    if (step === "season-goals") return seasonGoalsGateComplete;
    return planDatesStepComplete;
  }

  function lockedReadOnlyContextBuilderStepComplete(
    step: ContextBuilderStepKey,
    displayFields: ReturnType<typeof resolveLockedPlanningContextDisplayFields>,
  ): boolean {
    if (step === "season-goals") return displayFields.seasonGoalsComplete;
    if (step === "plan-dates") return displayFields.planDatesComplete;
    return contextBuilderStepComplete(step) || planningContextLocked || headCoachLockedContextStepComplete;
  }

  function contextBuilderStepPurpose(step: ContextBuilderStepKey): string {
    if (step === "context-app") return "Confirm the athlete profile is complete and eligible for planning.";
    if (step === "level-validation") return "Confirm the validated level that planning should use.";
    if (step === "workload") return "Check the workload range before dates and goals are finalized.";
    if (step === "season-goals") return "Select the season, current phase, and active goals.";
    return "Set and confirm the training plan window before locking context.";
  }

  function contextBuilderMissingRequirement(step: ContextBuilderStepKey): string | null {
    if (contextBuilderStepComplete(step)) return null;
    if (workflowStepStatusByKey[step] === "locked") return "Complete the previous setup section first.";
    if (step === "context-app") {
      if (readinessPanel.missingRequiredFields.length > 0) {
        return `Missing APP fields: ${formatMissingRequiredFields(
          readinessPanel.missingRequiredFields,
        )}`;
      }
      if (readinessError) return readinessError;
      return "Confirm APP completeness and planning eligibility.";
    }
    if (step === "level-validation") return "Confirm the athlete's validated level.";
    if (step === "workload") return "Run workload assessment.";
    if (step === "season-goals") {
      if (selectedSeasonCycleId === null) return "Select or create a season.";
      if (!currentPhaseDetected) return "Create or detect the current season phase.";
      if (!goalsReadyForGeneration) return "Select at least one active goal.";
      return "Finish season and goal setup.";
    }
    if (!planWindowInsideCurrentPhase) return "Choose a plan window inside the current phase.";
    if (!planDatesConfirmedForCurrentAthlete) return "Confirm plan dates.";
    return "Lock planning context when ready.";
  }

  function handleOpenContextBuilderDrawer(step: ContextBuilderDrawerStepKey) {
    if (workflowStepStatusByKey[step] === "locked") return;
    clearContextBuilderDrawerCloseTimeout();
    setContextBuilderDrawerClosing(false);
    setSelectedWorkflowTab(step);
    setContextBuilderDrawerStep(step);
  }

  function handleAdvanceContextBuilderStep(step: ContextBuilderStepKey) {
    setSelectedWorkflowTab(step);
    if (contextBuilderDrawerStep !== null) {
      clearContextBuilderDrawerCloseTimeout();
      setContextBuilderDrawerClosing(false);
      setContextBuilderDrawerStep(step);
    }
  }

  function contextBuilderStepPillTone(input: {
    complete: boolean;
    active: boolean;
    locked: boolean;
  }): string {
    if (input.complete) return "border-green-200 bg-green-50 text-green-700";
    if (input.active) return "border-primary/30 bg-primaryLight/40 text-primary";
    if (input.locked) return "border-slate-200 bg-slate-100 text-slate-500";
    return "border-slate-200 bg-bg text-textSecondary";
  }

  function contextBuilderProgressStepLabel(step: ContextBuilderStepKey): string {
    if (step === "context-app") return "APP Context";
    if (step === "workload") return "Workload";
    return WORKFLOW_RAIL_LABELS[step];
  }

  function renderContextBuilderProgressSteps() {
    return renderContextBuilderProgressStepsWithOptions({});
  }

  function renderContextBuilderProgressStepsWithOptions(options: {
    lockedReadOnlyDisplayFields?: ReturnType<typeof resolveLockedPlanningContextDisplayFields> | null;
  }) {
    const lockedReadOnlyDisplayFields = options.lockedReadOnlyDisplayFields ?? null;
    const progressSteps: Array<{
      key: ContextBuilderStepKey | "final-review";
      title: string;
      complete: boolean;
      active: boolean;
      locked: boolean;
    }> = [
      ...CONTEXT_BUILDER_STEP_SEQUENCE_LIST.map((step) => ({
        key: step,
        title: contextBuilderProgressStepLabel(step),
        complete: lockedReadOnlyDisplayFields
          ? lockedReadOnlyContextBuilderStepComplete(step, lockedReadOnlyDisplayFields)
          : contextBuilderStepComplete(step),
        active: selectedWorkflowTab === step,
        locked: workflowStepStatusByKey[step] === "locked",
      })),
      {
        key: "final-review",
        title: "Final Review",
        complete: headCoachLockedContextStepComplete,
        active: selectedWorkflowTab === "plan-dates" && planDatesStepComplete,
        locked: !planDatesStepComplete && !headCoachLockedContextStepComplete,
      },
    ];

    return (
      <ol className="grid gap-y-4 border-y border-border/70 py-3 sm:grid-cols-2 lg:grid-cols-6">
        {progressSteps.map((step, index) => {
          const stateLabel = contextBuilderStatusLabel({
            complete: step.complete,
            active: step.active,
            workflowStatus: step.locked ? "locked" : undefined,
          });
          return (
            <li
              key={step.key}
              className={cn(
                "relative flex min-w-0 flex-col gap-2 px-2 text-sm lg:px-3",
                step.locked ? "text-slate-500" : "text-textPrimary",
              )}
            >
              <div className="flex items-center">
                <div
                  className={cn(
                    "hidden h-px flex-1 lg:block",
                    index === 0
                      ? "bg-transparent"
                      : step.locked
                        ? "bg-slate-200"
                        : "bg-primary/30",
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs",
                    contextBuilderStepPillTone(step),
                  )}
                >
                  {step.complete ? "✓" : index + 1}
                </span>
                <div
                  className={cn(
                    "hidden h-px flex-1 lg:block",
                    index === progressSteps.length - 1
                      ? "bg-transparent"
                      : progressSteps[index + 1]?.locked
                        ? "bg-slate-200"
                        : "bg-primary/30",
                  )}
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-1 text-center">
                <div className="whitespace-normal text-sm font-medium leading-snug">
                  {step.title}
                </div>
                <div className="text-[11px] uppercase tracking-wide text-textMuted">
                  {stateLabel}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  function renderContextBuilderSummaryRow(label: string, value: ReactNode) {
    return (
      <div className="flex items-start justify-between gap-3 text-sm">
        <span className="text-textMuted">{label}</span>
        <span className="min-w-0 text-right text-textPrimary">{value}</span>
      </div>
    );
  }

  function renderContextBuilderFactTrail(facts: Array<{ label: string; value: ReactNode }>) {
    if (facts.length === 0) {
      return <span className="text-sm text-textSecondary">No captured facts yet.</span>;
    }
    return (
      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {facts.map((fact) => (
          <div key={fact.label} className="flex min-w-0 gap-1.5">
            <dt className="shrink-0 text-textMuted">{fact.label}:</dt>
            <dd className="min-w-0 break-words text-textPrimary">{fact.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  function renderContextBuilderLedgerRow(input: {
    step: ContextBuilderStepKey;
    title: string;
    facts: Array<{ label: string; value: ReactNode }>;
    readOnly?: boolean;
    completeOverride?: boolean;
  }) {
    const complete = input.completeOverride ?? contextBuilderStepComplete(input.step);
    const active = selectedWorkflowTab === input.step;
    const locked = workflowStepStatusByKey[input.step] === "locked";
    const readOnly = input.readOnly === true;
    const stateLabel = contextBuilderStatusLabel({
      complete,
      active,
      workflowStatus: locked ? "locked" : undefined,
    });
    const missingRequirement = contextBuilderMissingRequirement(input.step);
    const actionDisabled = input.step !== "context-app" && locked;
    const actionLabel = contextBuilderLedgerActionLabel({
      step: input.step,
      complete,
      locked,
    });

    return (
      <div
        className={cn(
          "grid gap-3 px-0 py-4 md:grid-cols-[minmax(10rem,0.8fr)_minmax(0,1.4fr)_auto] md:items-center",
          readOnly ? "md:grid-cols-[minmax(10rem,0.8fr)_minmax(0,1.4fr)]" : "",
          locked ? "text-slate-500 opacity-75" : "",
        )}
      >
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-textPrimary">{input.title}</h3>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs",
                contextBuilderStepPillTone({ complete, active, locked }),
              )}
            >
              {stateLabel}
            </span>
          </div>
          <p className="text-xs text-textSecondary">{contextBuilderStepPurpose(input.step)}</p>
        </div>
        <div className="min-w-0">
          {locked && !readOnly ? (
            <span className="text-sm text-textSecondary">
              Locked until previous step is complete.
            </span>
          ) : (
            renderContextBuilderFactTrail(input.facts)
          )}
        </div>
        {readOnly ? null : (
          <div className="flex md:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={actionDisabled}
              onClick={() => {
                if (input.step === "context-app") {
                  handleOpenContextBuilderDrawer("context-app");
                  return;
                }
                handleOpenContextBuilderDrawer(input.step);
              }}
            >
              {actionLabel}
            </Button>
          </div>
        )}
        {!readOnly && !locked && missingRequirement ? (
          <div className="text-xs text-textSecondary md:col-span-3">
            Next: {missingRequirement}
          </div>
        ) : null}
      </div>
    );
  }

  function renderContextBuilderStatusLedger(
    options: {
      readOnly?: boolean;
      lockedReadOnlyDisplayFields?: ReturnType<typeof resolveLockedPlanningContextDisplayFields> | null;
    } = {},
  ) {
    const readOnly = options.readOnly === true;
    const workloadClassification = workloadAssessmentResult?.workloadClassification ?? null;
    const lockedReadOnlyDisplayFields = options.lockedReadOnlyDisplayFields ??
      (readOnly
      ? resolveLockedPlanningContextDisplayFields({
          workspacePlanningContext: workspace?.planningContext ?? null,
          upstreamPlanningContext,
          seasons: setupState.seasons,
          phasesBySeasonCycleId: setupState.phasesBySeasonCycleId,
          selectedSeason,
          activePhaseForSelectedSeason,
          lockedPlanningContextSeasonPhase: lockedPlanningContextCardFields.seasonPhase,
          setupGoals: setupState.goals,
          selectedActiveGoals,
        })
      : null);
    const selectedGoalsSummary =
      lockedReadOnlyDisplayFields?.selectedGoalsSummary ??
      (selectedActiveGoals.length > 0
        ? selectedActiveGoals
            .map((goal) => goal.goalName ?? goal.goalId)
            .filter((value) => value.trim() !== "")
            .join(", ")
        : null);
    const planDurationLabel =
      typeof lockedReadOnlyDisplayFields?.durationDays === "number"
        ? `${lockedReadOnlyDisplayFields.durationDays} days`
        : typeof durationDays === "number" && Number.isFinite(durationDays)
        ? `${durationDays} days`
        : null;
    const seasonName = lockedReadOnlyDisplayFields?.seasonName ?? selectedSeason?.name ?? null;
    const currentPhase =
      lockedReadOnlyDisplayFields?.currentPhase ??
      activePhaseForSelectedSeason?.phase ??
      activePhaseForSelectedSeason?.phaseName ??
      null;
    const planWindowStartDate = lockedReadOnlyDisplayFields?.planStartDate ?? planStartDate;
    const planWindowEndDate = lockedReadOnlyDisplayFields?.planEndDate ?? planEndDate;
    const planWindowInsidePhaseLabel =
      lockedReadOnlyDisplayFields?.insideCurrentPhase === null ||
      lockedReadOnlyDisplayFields?.insideCurrentPhase === undefined
        ? displayValue(null)
        : lockedReadOnlyDisplayFields.insideCurrentPhase
          ? "Yes"
          : "No";
    const datesConfirmedLabel = lockedReadOnlyDisplayFields
      ? lockedReadOnlyDisplayFields.datesConfirmed
        ? "Yes"
        : "No"
      : planDatesConfirmedForCurrentAthlete
        ? "Yes"
        : "No";

    return (
      <section className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-base font-medium text-textPrimary">Planning Context Inputs</h3>
        </div>
        <div className="divide-y divide-border/70 border-y border-border/70">
          {renderContextBuilderLedgerRow({
          step: "context-app",
          title: "APP Context",
          readOnly,
          facts: [
            { label: "APP status", value: displayValue(readinessPanel.appCompleteness) },
            { label: "Eligibility", value: displayValue(readinessPanel.planningEligibility) },
            {
              label: "Age / BMI",
              value: `${displayValue(profile?.derivedAge)} / ${displayValue(profile?.derivedBmi)}`,
            },
            {
              label: "Missing fields",
              value:
                readinessPanel.missingRequiredFields.length > 0
                  ? formatMissingRequiredFields(readinessPanel.missingRequiredFields)
                  : "None",
            },
          ],
        })}
          {renderContextBuilderLedgerRow({
          step: "level-validation",
          title: "Level Validation",
          readOnly,
          facts: [
            { label: "Validated level", value: displayValue(readinessPanel.validatedLevel) },
            { label: "Validation status", value: displayValue(readinessPanel.validationStatus) },
            { label: "Self-reported level", value: displayValue(profile?.selfReportedLevel) },
          ],
        })}
          {renderContextBuilderLedgerRow({
          step: "workload",
          title: "Workload Assessment",
          readOnly,
          facts: [
            { label: "Workload status", value: displayValue(workloadClassification?.status) },
            {
              label: "Weekly hours",
              value: displayValue(workloadClassification?.weeklyTrainingHours),
            },
            {
              label: "Recommended range",
              value: displayValue(lockedPlanningContextCardFields.weeklyWorkload),
            },
            { label: "Age band", value: displayValue(workloadClassification?.ageBand) },
          ],
        })}
          {renderContextBuilderLedgerRow({
          step: "season-goals",
          title: "Season & Goals",
          readOnly,
          completeOverride: lockedReadOnlyDisplayFields?.seasonGoalsComplete,
          facts: [
            { label: "Season", value: displayValue(seasonName) },
            {
              label: "Current phase",
              value: displayValue(currentPhase),
            },
            { label: "Selected goals", value: selectedGoalsSummary ?? "None" },
            { label: "Safety adaptation", value: displayValue(goalLibraryLevel) },
          ],
        })}
          {renderContextBuilderLedgerRow({
          step: "plan-dates",
          title: "Plan Dates",
          readOnly,
          completeOverride: lockedReadOnlyDisplayFields?.planDatesComplete,
          facts: [
            { label: "Duration", value: displayValue(planDurationLabel) },
            { label: "Plan window", value: formatDateRange(planWindowStartDate, planWindowEndDate) },
            { label: "Inside current phase", value: planWindowInsidePhaseLabel },
            { label: "Dates confirmed", value: datesConfirmedLabel },
          ],
        })}
        </div>
      </section>
    );
  }

  function renderContextBuilderSafetyNotice() {
    const age = profile?.derivedAge ?? null;
    const ageBand = workloadAssessmentResult?.workloadClassification?.ageBand ?? null;
    const youthSafetyApplies =
      (typeof age === "number" && age < 18) ||
      (typeof ageBand === "string" && /youth|junior|u\d+/i.test(ageBand));
    if (!youthSafetyApplies) return null;
    return (
      <DashboardStatusNotice type="warning" compact>
        Youth athlete safety context is available. Keep workload and recovery constraints in the
        locked planning context.
      </DashboardStatusNotice>
    );
  }

  function renderContextBuilderReadinessRail() {
    const seasonPhaseReady = activePhaseForSelectedSeason !== null;
    const goalsSelected = selectedGoalIds.length > 0;
    const readyToShare =
      appStepComplete &&
      levelStepComplete &&
      workloadComplete &&
      seasonPhaseReady &&
      goalsSelected &&
      planDatesStepComplete;
    const progressItems = [
      { label: "APP", complete: appStepComplete },
      { label: "Level", complete: levelStepComplete },
      { label: "Workload", complete: workloadComplete },
      { label: "Season", complete: seasonPhaseReady && goalsSelected },
      { label: "Dates", complete: planDatesStepComplete },
      { label: "Lock", complete: planningContextLocked },
    ];
    const progressReadyCount = progressItems.filter((item) => item.complete).length;
    const nextRequired = contextBuilderNextRequiredLabel({
      appStepComplete,
      levelStepComplete,
      workloadComplete,
      seasonPhaseReady,
      goalsSelected,
      planDatesStepComplete,
      planningContextLocked,
    });
    const pendingBeforeLock = resolveContextBuilderPendingBeforeLock({
      upstreamBlockers: upstreamPlanningContext?.blockers ?? [],
      appStepComplete,
      levelStepComplete,
      workloadComplete,
      seasonGoalsComplete: seasonPhaseReady && goalsSelected,
      planDatesStepComplete,
    });
    return (
      <aside className="space-y-4 border-t border-border/70 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
        <div className="space-y-1">
          <h3 className="text-base font-medium text-textPrimary">Context Builder Status</h3>
        </div>
        <div className="space-y-2 border-y border-border/70 py-3">
          {renderContextBuilderSummaryRow(
            "Progress",
            `${progressReadyCount} / ${progressItems.length} ready`,
          )}
          {renderContextBuilderSummaryRow("Ready to share", readyToShare ? "Yes" : "No")}
          {renderContextBuilderSummaryRow("Next required", nextRequired)}
        </div>
        {!planningContextLocked && pendingBeforeLock.length > 0 ? (
          <DashboardStatusNotice
            type="blocker"
            title="Pending before lock"
            items={pendingBeforeLock}
            compact
          />
        ) : null}
        {renderContextBuilderSafetyNotice()}
        {renderHeadCoachPlanningContextLockAction({
          shell: "flat",
          showHeading: false,
          showBlockers: false,
          showStatusDetails: false,
          inlineNotices: true,
        })}
      </aside>
    );
  }

  function renderContextStepDrawer() {
    if (contextBuilderDrawerStep === null) return null;
    const step = contextBuilderDrawerStep;
    const drawerTitle = contextBuilderProgressStepLabel(step);
    const drawerDescription = contextBuilderStepPurpose(step);
    return (
      <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="context-step-drawer-title">
        <style>
          {`
            @keyframes contextBuilderDrawerSlideIn {
              from { opacity: 0; transform: translateX(1.5rem); }
              to { opacity: 1; transform: translateX(0); }
            }
            @keyframes contextBuilderDrawerSlideOut {
              from { opacity: 1; transform: translateX(0); }
              to { opacity: 0; transform: translateX(1.5rem); }
            }
            @keyframes contextBuilderBackdropFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes contextBuilderBackdropFadeOut {
              from { opacity: 1; }
              to { opacity: 0; }
            }
          `}
        </style>
        <button
          type="button"
          className={cn(
            "absolute inset-0 cursor-default bg-slate-950/25",
            contextBuilderDrawerClosing
              ? "motion-safe:animate-[contextBuilderBackdropFadeOut_220ms_ease-in_forwards]"
              : "motion-safe:animate-[contextBuilderBackdropFadeIn_180ms_ease-out]",
          )}
          aria-label="Close Context Builder drawer"
          onClick={handleCloseContextBuilderDrawer}
        />
        <aside
          className={cn(
            "absolute right-0 top-0 flex h-full w-full max-w-3xl flex-col border-l border-border bg-bg shadow-2xl",
            contextBuilderDrawerClosing
              ? "motion-safe:animate-[contextBuilderDrawerSlideOut_220ms_ease-in_forwards]"
              : "motion-safe:animate-[contextBuilderDrawerSlideIn_220ms_ease-out]",
          )}
        >
          <header className="space-y-2 border-b border-border px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 id="context-step-drawer-title" className="text-lg font-medium text-textPrimary">
                  {drawerTitle}
                </h3>
                <p className="text-sm text-textSecondary">{drawerDescription}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseContextBuilderDrawer}
              >
                Close
              </Button>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="space-y-5 [&_section]:rounded-none [&_section]:border-0 [&_section]:bg-transparent [&_section]:p-0 [&_section]:shadow-none">
              {renderContextBuilderDrawerStepContent(step)}
            </div>
          </div>
          <footer className="flex justify-end border-t border-border px-5 py-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseContextBuilderDrawer}
            >
              Cancel
            </Button>
          </footer>
        </aside>
      </div>
    );
  }

  function resolveReleasedPlanViewerDomain(): TrainingPlanGenerationDomain | null {
    return (
      releasedPlanViewerIntent?.domain ??
      (requestedPlanId !== null
        ? persistedDetailDomain ?? persistedVerifiedDomain ?? headCoachSubmittedReviewDomain
        : null)
    );
  }

  function resolveReleasedPlanViewerWorkflowStatus(
    domain: TrainingPlanGenerationDomain | null,
  ): AssistantDomainWorkflowStatus | null {
    if (domain === null) return null;
    return workspace !== null
      ? deriveWorkflowStatusFromWorkspaceDomain(workspace.domains[domain])
      : deriveHeadCoachDomainWorkflowStatus({
          summaryStatus: headCoachDomainPlanStates[domain].summaryStatus,
          summaryPlanId: headCoachDomainPlanStates[domain].summaryPlanId,
          summaryVersionId: headCoachDomainPlanStates[domain].summaryVersionId,
          activeDetail: headCoachDomainPlanStates[domain].activeDetail,
        });
  }

  function shouldRenderReleasedPlanViewerCanvas(): boolean {
    const domain = resolveReleasedPlanViewerDomain();
    return shouldShowReleasedPlanViewerCanvas({
      selectedWorkflowTab,
      selectedDomain: domain,
      releasedPlanViewerIntentPresent: releasedPlanViewerIntent !== null,
      requestedPlanIdPresent: requestedPlanId !== null,
      releasedWorkflowStatus: resolveReleasedPlanViewerWorkflowStatus(domain),
    });
  }

  function resolveTrainingPlanWorkspaceVisualMode(): TrainingPlanWorkspaceVisualMode {
    if (shouldShowLockedContextBuilderView()) return "context-builder";
    if (isContextBuilderStep(selectedWorkflowTab)) return "context-builder";
    if (shouldRenderReleasedPlanViewerCanvas()) return "plan-viewer";
    return "domain-integration";
  }

  function resolveTrainingPlanWorkspaceLifecycleHeaderSteps(): TrainingPlanWorkspaceLifecycleStep[] {
    const activeMode = resolveTrainingPlanWorkspaceVisualMode();
    const contextComplete = planningContextLocked || headCoachLockedContextStepComplete;
    const domainAvailable = workflowPrecMap.generate;
    const hasReleasedDomainPlan = resolveTrainingPlanWorkspaceHasReleasedDomain(workspace);
    const planViewerAvailable =
      domainAvailable &&
      (shouldRenderReleasedPlanViewerCanvas() || hasReleasedDomainPlan);

    return resolveTrainingPlanWorkspaceLifecycleSteps({
      activeMode,
      contextComplete,
      domainAvailable,
      planViewerAvailable,
      domainIntegrationComplete:
        resolveTrainingPlanWorkspaceDomainIntegrationComplete(workspace),
    });
  }

  function shouldShowLockedContextBuilderView(): boolean {
    if (!showLockedContextBuilderView) return false;
    return (
      planningContextLocked ||
      headCoachLockedContextStepComplete ||
      workspace?.planningContext.locked === true ||
      upstreamPlanningContext?.planningContextLocked === true
    );
  }

  function renderContextBuilderWorkspace() {
    if (!isContextBuilderStep(selectedWorkflowTab)) return null;
    const contextBuilderComplete = planDatesStepComplete || headCoachLockedContextStepComplete;

    return (
      <TrainingPlanWorkspaceModeShell
        mode="context-builder"
        header={
          <>
            <h2 className="text-lg font-normal text-textPrimary">Context Builder</h2>
            <p className="max-w-3xl text-sm text-textSecondary">
              Build the athlete&apos;s planning context in one guided setup before domain plans
              are generated, reviewed, or released.
            </p>
          </>
        }
        primary={
      <section className="space-y-5">
        {headCoachLockedContextStepComplete ? (
          <DashboardStatusNotice type="success" title="Context is locked and ready for domain plans." />
        ) : contextBuilderComplete ? (
          <DashboardStatusNotice
            type="success"
            title="Context setup is complete."
            nextStep="Lock Planning Context"
          />
        ) : null}

        {renderContextBuilderProgressSteps()}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="min-w-0">{renderContextBuilderStatusLedger()}</div>
          <div className="min-w-0">{renderContextBuilderReadinessRail()}</div>
        </div>
        {renderContextStepDrawer()}
      </section>
        }
      />
    );
  }

  function renderLockedContextBuilderBackView() {
    const lockedReadOnlyDisplayFields = resolveLockedPlanningContextDisplayFields({
      workspacePlanningContext: workspace?.planningContext ?? null,
      upstreamPlanningContext,
      seasons: setupState.seasons,
      phasesBySeasonCycleId: setupState.phasesBySeasonCycleId,
      selectedSeason,
      activePhaseForSelectedSeason,
      lockedPlanningContextSeasonPhase: lockedPlanningContextCardFields.seasonPhase,
      setupGoals: setupState.goals,
      selectedActiveGoals,
    });
    return (
      <TrainingPlanWorkspaceModeShell
        mode="context-builder"
        header={
          <>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-normal text-textPrimary">Locked Context Builder</h2>
              <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700">
                Read-only
              </span>
            </div>
            <p className="max-w-3xl text-sm text-textSecondary">
              Planning context is locked. Domain plans are generated from this snapshot.
            </p>
          </>
        }
        primary={
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <DashboardStatusNotice type="success" compact className="min-w-[16rem] flex-1">
                Planning context is locked. Domain plans are generated from this snapshot.
              </DashboardStatusNotice>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowLockedContextBuilderView(false)}
              >
                Back to Domain Plans Integration
              </Button>
            </div>
            {renderContextBuilderProgressStepsWithOptions({ lockedReadOnlyDisplayFields })}
            {renderContextBuilderStatusLedger({ readOnly: true, lockedReadOnlyDisplayFields })}
            {renderContextBuilderSafetyNotice()}
          </section>
        }
      />
    );
  }

  function resolvePlanViewerSelectedDomain(): TrainingPlanGenerationDomain | null {
    if (headCoachSubmittedReviewDomain !== null) return headCoachSubmittedReviewDomain;
    return (
      normalizeTrainingPlanGenerationDomain(persistedPlanDisplayDomain ?? undefined) ??
      normalizeTrainingPlanGenerationDomain(persistedDetailDomain ?? undefined) ??
      normalizeTrainingPlanGenerationDomain(persistedVerifiedDomain ?? undefined) ??
      normalizeTrainingPlanGenerationDomain(latestDraftDisplayDomain ?? undefined) ??
      currentCoachGenerationDomain ??
      resolvedWorkflowGenerationDomain ??
      null
    );
  }

  function resolvePlanViewerSelectedDomainLabel(): string {
    const domain = resolvePlanViewerSelectedDomain();
    return domain !== null ? trainingPlanDomainLabel(domain) : "No domain selected";
  }

  function resolvePlanViewerStatusLabel(): string {
    if (headCoachSubmittedReviewDomain !== null) {
      const reviewDomain = headCoachSubmittedReviewDomain;
      const state = headCoachDomainPlanStates[reviewDomain];
      const workflowStatus =
        workspace !== null
          ? deriveWorkflowStatusFromWorkspaceDomain(workspace.domains[reviewDomain])
          : deriveHeadCoachDomainWorkflowStatus({
              summaryStatus: state.summaryStatus,
              summaryPlanId: state.summaryPlanId,
              summaryVersionId: state.summaryVersionId,
              activeDetail: state.activeDetail,
            });
      return assistantWorkflowStatusLabelForKind(workflowStatus);
    }

    if (assistantPlanDiscoveryLoading || persistedSkillsPlanLoading) {
      return "Loading plan";
    }

    const selectedDomain = resolvePlanViewerSelectedDomain();
    if (selectedDomain !== null && workspace !== null) {
      return assistantWorkflowStatusLabelForKind(
        deriveWorkflowStatusFromWorkspaceDomain(workspace.domains[selectedDomain]),
      );
    }

    const persistedStatus =
      persistedSkillsPlanDetail?.version.status ?? persistedSkillsPlanDetail?.plan.status ?? null;
    if (hasRenderableValue(persistedStatus)) {
      return formatEnumeratedLabel(persistedStatus);
    }

    if (latestSkillsDraft !== null) {
      return assistantWorkflowStatusLabelForKind(step6GeneratedDraftWorkflowStatus);
    }

    if (generatePlanSuccess !== null && hasRenderableValue(generatePlanSuccess.status)) {
      return formatEnumeratedLabel(generatePlanSuccess.status);
    }

    return assistantWorkflowStatusLabelForKind(assistantDomainWorkflowStatus);
  }

  function renderPlanViewerFact(label: string, value: ReactNode) {
    return (
      <div className="flex min-w-0 flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <dt className="text-xs uppercase tracking-wide text-textMuted">{label}</dt>
        <dd className="min-w-0 break-words text-sm text-textPrimary sm:text-right">{value}</dd>
      </div>
    );
  }

  function renderPlanViewerContent(children: ReactNode) {
    const selectedDomain = resolvePlanViewerSelectedDomain();
    const reviewModel =
      selectedDomain !== null ? resolveDomainReviewSurfaceModel(selectedDomain) : null;
    const selectedDomainLabel =
      reviewModel?.domainLabel ?? resolvePlanViewerSelectedDomainLabel();
    const planStatusLabel =
      reviewModel?.planStatusLabel ?? resolvePlanViewerStatusLabel();
    const workflowStatusLabel =
      reviewModel?.statusLabel ?? resolvePlanViewerStatusLabel();
    const visibleReleasedDetail =
      releasedPlanViewerIntent !== null &&
      releasedPlanViewerVisibleDetail?.domain === releasedPlanViewerIntent.domain
        ? releasedPlanViewerVisibleDetail.detail
        : persistedSkillsPlanDetail;
    const planWindowStart = visibleReleasedDetail?.version.startDate ?? null;
    const planWindowEnd = visibleReleasedDetail?.version.endDate ?? null;
    const planWindowLabel =
      planWindowStart !== null || planWindowEnd !== null
        ? formatDateRange(planWindowStart, planWindowEnd)
        : null;
    const versionNumber =
      visibleReleasedDetail?.version.versionNumber ?? reviewModel?.versionNumber ?? null;
    const currentPlanPeriodLabel =
      planWindowLabel !== null
        ? `Current released window: ${planWindowLabel}${
            versionNumber !== null ? ` · Version ${displayValue(versionNumber)}` : ""
          }`
        : "Current released window unavailable";
    const canOpenLockedContextBuilderView =
      planningContextLocked ||
      headCoachLockedContextStepComplete ||
      workspace?.planningContext.locked === true ||
      upstreamPlanningContext?.planningContextLocked === true;

    return (
      <TrainingPlanWorkspaceModeShell
        mode="plan-viewer"
        header={
          <>
            <h2 className="text-lg font-normal text-textPrimary">Plan Viewer</h2>
            <p className="text-sm text-textSecondary">
              View released domain plans by week, day, and domain.
            </p>
          </>
        }
        summary={
          <section className="space-y-4 border-y border-border/70 py-4">
            <div className="space-y-1">
              <div className="text-sm text-textPrimary">{currentPlanPeriodLabel}</div>
              <div className="text-sm text-textSecondary">
                Only the current released window is available here.
              </div>
            </div>
            <dl className="divide-y divide-border/70 border-t border-border/70">
              {renderPlanViewerFact("Selected domain", selectedDomainLabel)}
              {renderPlanViewerFact("Plan status", planStatusLabel)}
              {renderPlanViewerFact("Workflow status", workflowStatusLabel)}
              {renderPlanViewerFact("Plan window", displayValue(planWindowLabel))}
              {renderPlanViewerFact("Version", displayValue(versionNumber))}
            </dl>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleBackToDomainPlansIntegration}
              >
                Back to Domain Plans Integration
              </Button>
              {canOpenLockedContextBuilderView ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowLockedContextBuilderView(true)}
                >
                  View Context
                </Button>
              ) : null}
            </div>
          </section>
        }
        primary={<div className="space-y-3">{children}</div>}
      />
    );
  }


  function renderPlanViewerEmptyState(domain: TrainingPlanGenerationDomain) {
    return (
      <div className="text-sm text-textSecondary">
        {generationDraftEmptyState(domain)}
      </div>
    );
  }

  function renderPlanViewerPersistedDetailSection() {
    return (
      <>
                  {requestedPlanId !== null && !shouldHidePersistedGeneratorPanel ? (
                        isDownstreamDomainCoach && persistedPlanDisplayDomain === "SKILLS" ? (
                          <WorkflowNeutralNotice>
                            <div className="text-sm text-textSecondary">
                              Viewing the saved Skills plan for this athlete.
                            </div>
                          </WorkflowNeutralNotice>
                        ) : errorForRenderedDomain({
                            error: persistedSkillsPlanError,
                            errorDomain: persistedPlanErrorDomain,
                            renderedDomain: persistedPlanDisplayDomain,
                          }) ? (
                          <Alert variant="danger">
                            {errorForRenderedDomain({
                              error: persistedSkillsPlanError,
                              errorDomain: persistedPlanErrorDomain,
                              renderedDomain: persistedPlanDisplayDomain,
                            })}
                          </Alert>
                        ) : persistedSkillsPlanLoading ? (
                          <div className="text-sm text-textSecondary">
                            Loading persisted Skills plan…
                          </div>
                        ) : shouldRenderPersistedDetailForDomain({
                            detailDomain: persistedDetailDomain,
                            renderedDomain: persistedPlanDisplayDomain,
                            hasDetail: persistedSkillsPlanDetail !== null,
                          }) && !shouldHidePersistedGeneratorPanel && persistedSkillsPlanDetail ? (
                          <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
                        <h4 className="text-sm font-normal text-textPrimary">
                          Persisted Skills Plan
                        </h4>
                        <dl className="space-y-1">
                          <DetailRow
                            label="Training Plan ID"
                            value={displayValue(persistedSkillsPlanDetail.plan.id)}
                          />
                          {hasRenderableValue(persistedSkillsPlanDetail.plan.name) ? (
                            <DetailRow
                              label="Name"
                              value={displayValue(persistedSkillsPlanDetail.plan.name)}
                            />
                          ) : null}
                          {hasRenderableValue(persistedSkillsPlanDetail.plan.status) ? (
                            <DetailRow
                              label="Status"
                              value={displayValue(persistedSkillsPlanDetail.plan.status)}
                            />
                          ) : null}
                          {hasRenderableValue(persistedSkillsPlanDetail.generationDomain) ? (
                            <DetailRow
                              label="Generation Domain"
                              value={displayValue(persistedSkillsPlanDetail.generationDomain)}
                            />
                          ) : null}
                          {hasRenderableValue(persistedSkillsPlanDetail.version.versionNumber) ? (
                            <DetailRow
                              label="Selected Version Number"
                              value={displayValue(
                                persistedSkillsPlanDetail.version.versionNumber,
                              )}
                            />
                          ) : null}
                          {hasRenderableValue(persistedSkillsPlanDetail.version.status) ? (
                            <DetailRow
                              label="Selected Version Status"
                              value={displayValue(persistedSkillsPlanDetail.version.status)}
                            />
                          ) : null}
                          {hasRenderableValue(persistedSkillsPlanDetail.version.id) ? (
                            <DetailRow
                              label="Selected Version ID"
                              value={displayValue(persistedSkillsPlanDetail.version.id)}
                            />
                          ) : null}
                          {hasRenderableValue(persistedSkillsPlanDetail.version.source) ? (
                            <DetailRow
                              label="Selected Version Source"
                              value={displayValue(persistedSkillsPlanDetail.version.source)}
                            />
                          ) : null}
                          {persistedSkillsPlanDetail.version.startDate ||
                          persistedSkillsPlanDetail.version.endDate ? (
                            <DetailRow
                              label="Selected Version Window"
                              value={formatDateRange(
                                persistedSkillsPlanDetail.version.startDate,
                                persistedSkillsPlanDetail.version.endDate,
                              )}
                            />
                          ) : null}
                          {hasRenderableValue(
                            persistedSkillsPlanDetail.selectedVersionRule,
                          ) ? (
                            <DetailRow
                              label="Selected Version Rule"
                              value={displayValue(
                                persistedSkillsPlanDetail.selectedVersionRule,
                              )}
                            />
                          ) : null}
                        </dl>
                        {persistedSkillsPlanGoalNames.length > 0 ? (
                          <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                            <h5 className="text-sm font-normal text-textPrimary">
                              Associated Goals
                            </h5>
                            <p className="text-sm text-textPrimary">
                              {persistedSkillsPlanGoalNames.join(", ")}
                            </p>
                          </div>
                        ) : null}
                        {!persistedSkillsPlanHasSessions ? (
                          <div className="text-sm text-textSecondary">
                            Persisted plan found, but no sessions available.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {persistedSkillsPlanDetail.days.map((day, dayOffset) => (
                              <div
                                key={day.id}
                                className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3"
                              >
                                <div className="text-sm font-normal text-textPrimary">
                                  {hasRenderableValue(day.date)
                                    ? `Day ${day.dayIndex ?? dayOffset + 1} — ${formatDateWithWeekday(String(day.date))}`
                                    : `Day ${day.dayIndex ?? dayOffset + 1}`}
                                </div>
                                <dl className="space-y-1">
                                  {hasRenderableValue(day.date) ? (
                                    <DetailRow
                                      label="Date"
                                      value={formatDateWithWeekday(String(day.date))}
                                    />
                                  ) : null}
                                  {hasRenderableValue(day.weekNumber) ? (
                                    <DetailRow
                                      label="Week Number"
                                      value={displayValue(day.weekNumber)}
                                    />
                                  ) : null}
                                  <DetailRow
                                    label="Rest Day"
                                    value={displayValue(day.isRestDay)}
                                  />
                                  {hasRenderableValue(day.plannedLoadMinutes) ? (
                                    <DetailRow
                                      label="Planned Load Minutes"
                                      value={displayValue(day.plannedLoadMinutes)}
                                    />
                                  ) : null}
                                  {hasRenderableValue(day.notes) ? (
                                    <DetailRow
                                      label="Notes"
                                      value={displayValue(day.notes)}
                                    />
                                  ) : null}
                                </dl>
                                {day.sessions.length === 0 ? (
                                  <div className="text-sm text-textSecondary">
                                    No sessions scheduled for this day.
                                  </div>
                                ) : (
                                  day.sessions.map((session) => (
                                    <div
                                      key={session.id}
                                      className="space-y-2 rounded-md border border-slate-200 bg-white p-3"
                                    >
                                      <dl className="space-y-1">
                                        <DetailRow
                                          label="Session"
                                          value={displayLabelTitleCase(session.title)}
                                        />
                                        {hasRenderableValue(session.description) ? (
                                          <DetailRow
                                            label="Description"
                                            value={displayValue(session.description)}
                                          />
                                        ) : null}
                                        {hasRenderableValue(session.sessionType) ? (
                                          <DetailRow
                                            label="Session Type"
                                            value={displayValue(session.sessionType)}
                                          />
                                        ) : null}
                                        {hasRenderableValue(session.sessionOrder) ? (
                                          <DetailRow
                                            label="Session Order"
                                            value={displayValue(session.sessionOrder)}
                                          />
                                        ) : null}
                                        {hasRenderableValue(session.plannedDurationMinutes) ? (
                                          <DetailRow
                                            label="Planned Duration Minutes"
                                            value={displayValue(session.plannedDurationMinutes)}
                                          />
                                        ) : null}
                                        {hasRenderableValue(session.objective) ? (
                                          <DetailRow
                                            label="Objective"
                                            value={displayValue(session.objective)}
                                          />
                                        ) : null}
                                        {hasRenderableValue(session.intensity) ? (
                                          <DetailRow
                                            label="Intensity"
                                            value={displayValue(session.intensity)}
                                          />
                                        ) : null}
                                      </dl>
                                      {session.sessionStructureSections.length === 0 ? (
                                        <div className="text-sm text-textSecondary">
                                          No session structure content available.
                                        </div>
                                      ) : (
                                        <div className="space-y-3">
                                          {session.sessionStructureSections.map((section) => (
                                            <div
                                              key={`${session.id}-${section.key}`}
                                              className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3"
                                            >
                                              <div className="text-sm font-medium text-textPrimary">
                                                Session Structure:{" "}
                                                {persistedSessionStructureLabel(section.key)}
                                              </div>
                                              {section.items.map((item, itemOffset) => (
                                                <div
                                                  key={`${item.label ?? item.summary ?? "item"}-${itemOffset}`}
                                                  className="space-y-1 rounded-md border border-slate-200 bg-white p-3"
                                                >
                                                  <dl className="space-y-1">
                                                    {hasRenderableValue(item.label) ? (
                                                      <DetailRow
                                                        label="Label"
                                                        value={displayLabelTitleCase(item.label)}
                                                      />
                                                    ) : null}
                                                    {hasRenderableValue(item.summary) ? (
                                                      <DetailRow
                                                        label="Summary"
                                                        value={displayValue(item.summary)}
                                                      />
                                                    ) : null}
                                                    {hasRenderableValue(item.reps) ? (
                                                      <DetailRow
                                                        label="Reps"
                                                        value={displayValue(item.reps)}
                                                      />
                                                    ) : null}
                                                    {hasRenderableValue(item.durationMinutes) ? (
                                                      <DetailRow
                                                        label="Duration Minutes"
                                                        value={displayValue(item.durationMinutes)}
                                                      />
                                                    ) : null}
                                                    {hasRenderableValue(item.intensity) ? (
                                                      <DetailRow
                                                        label="Intensity"
                                                        value={displayValue(item.intensity)}
                                                      />
                                                    ) : null}
                                                    {hasRenderableValue(item.notes) ? (
                                                      <DetailRow
                                                        label="Notes"
                                                        value={displayValue(item.notes)}
                                                      />
                                                    ) : null}
                                                  </dl>
                                                  <SkillGoalAttributionText
                                                    primaryGoalName={item.primaryGoalName}
                                                  />
                                                </div>
                                              ))}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {persistedPlanDisplayDomain === "SKILLS" && !isDownstreamDomainCoach ? (
                          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                            <h5 className="text-sm font-normal text-textPrimary">
                              Revise Skills Plan
                            </h5>
                            {reviseSkillsError ? (
                              <Alert variant="danger">{reviseSkillsError}</Alert>
                            ) : null}
                            {reviseSkillsSuccess ? (
                              <WorkflowNeutralNotice>{reviseSkillsSuccess}</WorkflowNeutralNotice>
                            ) : null}
                            <label className="space-y-1 text-sm text-textPrimary">
                              <span className="font-medium">Coach Feedback</span>
                              <textarea
                                rows={4}
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary caret-current placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                                value={reviseSkillsFeedback}
                                onChange={(event) => setReviseSkillsFeedback(event.target.value)}
                                placeholder="Describe what should change in the skills plan."
                              />
                            </label>
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={reviseSkillsLoading || !skillsReviseIds}
                              onClick={() => {
                                void handleReviseSkillsPlan();
                              }}
                            >
                              {reviseSkillsLoading ? "Revising plan..." : "Revise Plan"}
                            </Button>
                          </div>
                        ) : persistedPlanDisplayDomain === "NUTRITION" ? (
                          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                            <h5 className="text-sm font-normal text-textPrimary">
                              Revise Nutrition Plan
                            </h5>
                            {reviseNutritionError ? (
                              <Alert variant="danger">{reviseNutritionError}</Alert>
                            ) : null}
                            {reviseNutritionSuccess ? (
                              <WorkflowNeutralNotice>{reviseNutritionSuccess}</WorkflowNeutralNotice>
                            ) : null}
                            <label className="space-y-1 text-sm text-textPrimary">
                              <span className="font-medium">Coach Feedback</span>
                              <textarea
                                rows={4}
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary caret-current placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                                value={reviseNutritionFeedback}
                                onChange={(event) => setReviseNutritionFeedback(event.target.value)}
                                placeholder="Describe what should change in the nutrition plan."
                              />
                            </label>
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={reviseNutritionLoading || !nutritionReviseIds}
                              onClick={() => {
                                void handleReviseNutritionPlan();
                              }}
                            >
                              {reviseNutritionLoading ? "Revising plan..." : "Revise Plan"}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ) : null
                  ) : null}
      </>
    );
  }

  function renderPlanViewerLatestDraftDetail() {
    return (
      <>
                  {shouldShowLatestDraftPlanViewer &&
                  !isHeadCoachReviewerOnlyForDomain(
                    latestDraftDisplayDomain ?? effectiveCoachGenerationDomain,
                  ) ? (
                    errorForRenderedDomain({
                      error: latestSkillsDraftError,
                      errorDomain: latestSkillsDraftErrorDomain,
                      renderedDomain: latestDraftDisplayDomain ?? effectiveCoachGenerationDomain,
                    }) ? (
                      <Alert variant="danger">
                        {errorForRenderedDomain({
                          error: latestSkillsDraftError,
                          errorDomain: latestSkillsDraftErrorDomain,
                          renderedDomain: latestDraftDisplayDomain ?? effectiveCoachGenerationDomain,
                        })}
                      </Alert>
                    ) : shouldShowGeneratedDraftEmptyState({
                        draftMissing: latestSkillsDraftMissing,
                        generationInProgress: step6GenerationInProgress,
                      }) ? (
                      renderPlanViewerEmptyState(latestDraftDisplayDomain ?? "SKILLS")
                    ) : latestSkillsDraft ? (
                      <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
                        <h4 className="text-sm font-normal text-textPrimary">
                          {generationDraftTitle(latestDraftDisplayDomain ?? "SKILLS")}
                        </h4>
                        <dl className="space-y-1">
                          {hasRenderableValue(latestSkillsDraft.trainingPlanId) ? (
                            <DetailRow
                              label="Training Plan ID"
                              value={displayValue(latestSkillsDraft.trainingPlanId)}
                            />
                          ) : null}
                          {hasRenderableValue(latestSkillsDraft.trainingPlanVersionId) ? (
                            <DetailRow
                              label="Version ID"
                              value={displayValue(latestSkillsDraft.trainingPlanVersionId)}
                            />
                          ) : null}
                          {hasRenderableValue(latestSkillsDraft.versionNumber) ? (
                            <DetailRow
                              label="Version Number"
                              value={displayValue(latestSkillsDraft.versionNumber)}
                            />
                          ) : null}
                          {hasRenderableValue(latestSkillsDraft.status) ? (
                            <DetailRow
                              label="Status"
                              value={displayValue(latestSkillsDraft.status)}
                            />
                          ) : null}
                          {hasRenderableValue(latestSkillsDraft.source) ? (
                            <DetailRow
                              label="Source"
                              value={displayValue(latestSkillsDraft.source)}
                            />
                          ) : null}
                          {hasRenderableValue(latestSkillsDraft.durationDays) ? (
                            <DetailRow
                              label="Duration Days"
                              value={displayValue(latestSkillsDraft.durationDays)}
                            />
                          ) : null}
                          {hasRenderableValue(latestSkillsDraft.daysCreated) ? (
                            <DetailRow
                              label="Days Created"
                              value={displayValue(latestSkillsDraft.daysCreated)}
                            />
                          ) : null}
                          {hasRenderableValue(latestSkillsDraft.sessionsCreated) ? (
                            <DetailRow
                              label="Sessions Created"
                              value={displayValue(latestSkillsDraft.sessionsCreated)}
                            />
                          ) : null}
                          {hasRenderableValue(latestSkillsDraft.itemsPersisted) ? (
                            <DetailRow
                              label="Items Persisted"
                              value={displayValue(latestSkillsDraft.itemsPersisted)}
                            />
                          ) : null}
                        </dl>
                        {hasRevisionSummary ? renderRevisionSummary(latestSkillsDraft) : null}
                        <div className="space-y-3">
                          {sortedLatestSkillsDraftDays.map((day, dayOffset) => (
                            <div
                              key={`${day.dayIndex ?? dayOffset}-${day.date ?? "day"}`}
                              className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3"
                            >
                              <div className="text-sm font-normal text-textPrimary">
                                {hasRenderableValue(day.date)
                                  ? `Day ${day.dayIndex ?? dayOffset + 1} — ${formatDateWithWeekday(String(day.date))}`
                                  : `Day ${day.dayIndex ?? dayOffset + 1}`}
                              </div>
                              <dl className="space-y-1">
                                {hasRenderableValue(day.date) ? (
                                  <DetailRow
                                    label="Date"
                                    value={formatDateWithWeekday(String(day.date))}
                                  />
                                ) : null}
                                {hasRenderableValue(day.dayFocus) ? (
                                  <DetailRow
                                    label="Day Focus"
                                    value={displayValue(day.dayFocus)}
                                  />
                                ) : null}
                                {hasRenderableValue(day.notes) ? (
                                  <DetailRow label="Notes" value={displayValue(day.notes)} />
                                ) : null}
                              </dl>
                              {latestDraftDisplayDomain === "NUTRITION"
                                ? renderNutritionMacroTotals(
                                    "Day Total",
                                    day.sessions.flatMap((session) => session.items),
                                  )
                                : null}
                              {day.sessions.map((session, sessionOffset) => (
                                <div
                                  key={`${session.sessionIndex ?? sessionOffset}-${session.title ?? "session"}`}
                                  className="space-y-2 rounded-md border border-slate-200 bg-white p-3"
                                >
                                  <dl className="space-y-1">
                                    {hasRenderableValue(session.title) ? (
                                      <DetailRow
                                        label={draftSessionTitleLabel(latestDraftDisplayDomain)}
                                        value={displayLabelTitleCase(session.title)}
                                      />
                                    ) : null}
                                    {hasRenderableValue(session.objective) ? (
                                      <DetailRow
                                        label="Objective"
                                        value={displayValue(session.objective)}
                                      />
                                    ) : null}
                                    {hasRenderableValue(session.plannedDurationMinutes) ? (
                                      <DetailRow
                                        label="Planned Duration Minutes"
                                        value={displayValue(session.plannedDurationMinutes)}
                                      />
                                    ) : null}
                                    {hasRenderableValue(session.intensity) ? (
                                      <DetailRow
                                        label="Intensity"
                                        value={displayValue(session.intensity)}
                                      />
                                    ) : null}
                                  </dl>
                                  {latestDraftDisplayDomain === "NUTRITION"
                                    ? renderNutritionMealItems(session.items)
                                    : session.items.map((item, itemOffset) => (
                                        <div
                                          key={`${item.label ?? item.summary ?? "item"}-${itemOffset}`}
                                          className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-3"
                                        >
                                          <dl className="space-y-1">
                                            {hasRenderableValue(item.label) ? (
                                              <DetailRow
                                                label={draftItemLabel(latestDraftDisplayDomain)}
                                                value={displayLabelTitleCase(item.label)}
                                              />
                                            ) : null}
                                            {hasRenderableValue(item.summary) ? (
                                              <DetailRow
                                                label="Summary"
                                                value={displayValue(item.summary)}
                                              />
                                            ) : null}
                                            {hasRenderableValue(item.sets) ? (
                                              <DetailRow
                                                label="Sets"
                                                value={displayValue(item.sets)}
                                              />
                                            ) : null}
                                            {hasRenderableValue(item.durationMinutes) ? (
                                              <DetailRow
                                                label="Duration Minutes"
                                                value={displayValue(item.durationMinutes)}
                                              />
                                            ) : null}
                                            {hasRenderableValue(item.reps) ? (
                                              <DetailRow
                                                label="Reps"
                                                value={displayValue(item.reps)}
                                              />
                                            ) : null}
                                            {hasRenderableValue(item.intensity) ? (
                                              <DetailRow
                                                label="Intensity"
                                                value={displayValue(item.intensity)}
                                              />
                                            ) : null}
                                            {hasRenderableValue(item.notes) ? (
                                              <DetailRow
                                                label="Notes"
                                                value={displayValue(item.notes)}
                                              />
                                            ) : null}
                                          </dl>
                                          <SkillGoalAttributionText
                                            primaryGoalName={item.primaryGoalName}
                                          />
                                        </div>
                                      ))}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                        {latestDraftDisplayDomain === "SKILLS" && !isDownstreamDomainCoach ? (
                          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                            <h5 className="text-sm font-normal text-textPrimary">
                              Revise Skills Plan
                            </h5>
                            {reviseSkillsError ? (
                              <Alert variant="danger">{reviseSkillsError}</Alert>
                            ) : null}
                            {reviseSkillsSuccess ? (
                              <WorkflowNeutralNotice>{reviseSkillsSuccess}</WorkflowNeutralNotice>
                            ) : null}
                            <label className="space-y-1 text-sm text-textPrimary">
                              <span className="font-medium">Coach Feedback</span>
                              <textarea
                                rows={4}
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary caret-current placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                                value={reviseSkillsFeedback}
                                onChange={(event) => setReviseSkillsFeedback(event.target.value)}
                                placeholder="Describe what should change in the skills plan."
                              />
                            </label>
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={reviseSkillsLoading || !skillsReviseIds}
                              onClick={() => {
                                void handleReviseSkillsPlan();
                              }}
                            >
                              {reviseSkillsLoading ? "Revising plan..." : "Revise Plan"}
                            </Button>
                          </div>
                        ) : latestDraftDisplayDomain === "NUTRITION" ? (
                          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                            <h5 className="text-sm font-normal text-textPrimary">
                              Revise Nutrition Plan
                            </h5>
                            {reviseNutritionError ? (
                              <Alert variant="danger">{reviseNutritionError}</Alert>
                            ) : null}
                            {reviseNutritionSuccess ? (
                              <WorkflowNeutralNotice>{reviseNutritionSuccess}</WorkflowNeutralNotice>
                            ) : null}
                            <label className="space-y-1 text-sm text-textPrimary">
                              <span className="font-medium">Coach Feedback</span>
                              <textarea
                                rows={4}
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary caret-current placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                                value={reviseNutritionFeedback}
                                onChange={(event) => setReviseNutritionFeedback(event.target.value)}
                                placeholder="Describe what should change in the nutrition plan."
                              />
                            </label>
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={reviseNutritionLoading || !nutritionReviseIds}
                              onClick={() => {
                                void handleReviseNutritionPlan();
                              }}
                            >
                              {reviseNutritionLoading ? "Revising plan..." : "Revise Plan"}
                            </Button>
                          </div>
                        ) : latestDraftDisplayDomain === "S_AND_C" ? (
                          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                            <h5 className="text-sm font-normal text-textPrimary">
                              Revise S&amp;C Plan
                            </h5>
                            {reviseSandCError ? (
                              <Alert variant="danger">{reviseSandCError}</Alert>
                            ) : null}
                            {reviseSandCSuccess ? (
                              <WorkflowNeutralNotice>{reviseSandCSuccess}</WorkflowNeutralNotice>
                            ) : null}
                            <label className="space-y-1 text-sm text-textPrimary">
                              <span className="font-medium">Coach Feedback</span>
                              <textarea
                                rows={4}
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary caret-current placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                                value={reviseSandCFeedback}
                                onChange={(event) => setReviseSandCFeedback(event.target.value)}
                                placeholder="Describe what should change in the S&C plan."
                              />
                            </label>
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={
                                reviseSandCLoading ||
                                !sandCReviseIds
                              }
                              onClick={() => {
                                void handleReviseSandCPlan();
                              }}
                            >
                              {reviseSandCLoading ? "Revising plan..." : "Revise Plan"}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ) : null
                  ) : null}
      </>
    );
  }

  function renderPlanViewerSelectedDomainContent() {
    const planViewerRequestedPlanId = releasedPlanViewerIntent?.planId ?? requestedPlanId;
    const visibleReleasedDetail =
      releasedPlanViewerIntent !== null &&
      releasedPlanViewerVisibleDetail?.domain === releasedPlanViewerIntent.domain
        ? releasedPlanViewerVisibleDetail.detail
        : persistedSkillsPlanDetail !== null &&
            (releasedPlanViewerIntent === null ||
              persistedDetailDomain === releasedPlanViewerIntent.domain)
          ? persistedSkillsPlanDetail
          : null;
    if (planViewerRequestedPlanId !== null && visibleReleasedDetail !== null) {
      const selectedDomain = resolvePlanViewerSelectedDomain();
      return renderDomainPlanDaySchedule(
        visibleReleasedDetail,
        resolvePlanViewerSelectedDomainLabel(),
        "View the released plan by day and session.",
        selectedDomain,
      );
    }
    if (planViewerRequestedPlanId !== null) {
      const selectedDomain = resolvePlanViewerSelectedDomain();
      const renderedDomain =
        normalizeTrainingPlanGenerationDomain(persistedPlanDisplayDomain ?? undefined) ??
        selectedDomain;
      const persistedError =
        renderedDomain !== null
          ? errorForRenderedDomain({
              error: persistedSkillsPlanError,
              errorDomain: persistedPlanErrorDomain,
              renderedDomain,
            })
          : persistedSkillsPlanError;
      if (persistedError) {
        return <Alert variant="danger">{persistedError}</Alert>;
      }
      return (
        <div className="text-sm text-textSecondary">
          Loading released {resolvePlanViewerSelectedDomainLabel()} plan...
        </div>
      );
    }

    return (
      <>
                        {headCoachSkillsOwnerWorkflow
                          ? renderHeadCoachOwnedSkillsPlanPanel({ showWorkflowActions: false })
                          : null}
        {renderPlanViewerPersistedDetailSection()}
        {renderPlanViewerLatestDraftDetail()}
      </>
    );
  }

  function renderPlanViewerLowerContent() {
    return renderPlanViewerSelectedDomainContent();
  }

  function renderDomainPlansIntegrationWorkspace() {
    if (selectedWorkflowTab !== "generate") return null;
    const canOpenLockedContextBuilderView =
      planningContextLocked ||
      headCoachLockedContextStepComplete ||
      workspace?.planningContext.locked === true ||
      upstreamPlanningContext?.planningContextLocked === true;
    if (shouldShowLockedContextBuilderView()) {
      return renderLockedContextBuilderBackView();
    }
    if (shouldRenderReleasedPlanViewerCanvas()) {
      return renderPlanViewerContent(renderPlanViewerLowerContent());
    }
    return (
              !workflowPrecMap.generate ? (
                <TrainingPlanWorkspaceModeShell
                  mode="domain-integration"
                  header={
                    <>
                      <h2 className="text-lg font-normal text-textPrimary">
                        Domain Plans Integration
                      </h2>
                      <p className="text-sm text-textSecondary">
                        Coordinate Skills, Nutrition, and S&amp;C from locked context through
                        domain-level generation, review, and release.
                      </p>
                    </>
                  }
                  primary={
                    <WorkflowLockedCard
                      title="Domain Plans Integration"
                      message={
                        isDownstreamDomainCoach
                          ? "Finish Context / APP and Level Validation before opening your domain plan panel."
                          : headCoachReviewMode
                            ? "Confirm plan dates in Step 5, then lock and review submitted domain plans here."
                            : "Confirm plan dates in Step 5 (with a valid window inside the current phase), or open an existing saved plan."
                      }
                    />
                  }
                />
              ) : (
                <TrainingPlanWorkspaceModeShell
                  mode="domain-integration"
                  header={
                    <>
                      <h2 className="text-lg font-normal text-textPrimary">
                        Domain Plans Integration
                      </h2>
                      <p className="text-sm text-textSecondary">
                        Coordinate Skills, Nutrition, and S&amp;C plans from the locked planning
                        context through generation, submission, review, and release.
                      </p>
                    </>
                  }
                  primary={
                    <div className="space-y-3">
                  {canOpenLockedContextBuilderView ? (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowLockedContextBuilderView(true)}
                      >
                        View Context
                      </Button>
                    </div>
                  ) : null}
                  {headCoachReviewMode ? (
                    <section className="space-y-3">
                      <div className="space-y-1">
                        <h4 className="text-sm font-normal text-textPrimary">
                          Domain Plans Coordination
                        </h4>
                        <p className="text-sm text-textSecondary">
                          Coordinate domain plan status, ownership, and available actions.
                        </p>
                      </div>
                      {renderHeadCoachReviewWorkspace()}
                    </section>
                  ) : (
                    <>
                      {renderStep6DomainIntegrationContent()}
                      {renderPlanViewerContent(renderPlanViewerLowerContent())}
                      <section className="space-y-3 border-t border-border/70 pt-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-normal text-textPrimary">
                            Domain Actions
                          </h4>
                          <p className="text-sm text-textSecondary">
                            Generate assigned domain plans and continue available workflow actions.
                          </p>
                        </div>
                  {requestedPlanId !== null ? (
                    persistedPlanDisplayDomain === "S_AND_C" ? (
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" disabled>
                          {persistedPlanReviseButtonLabel(persistedPlanDisplayDomain)}
                        </Button>
                      </div>
                    ) : null
                  ) : trainingPlanShellModel.shell === "head_coach_planning" ? (
                    <div className="text-sm text-textSecondary">
                      Head Coach planning context can be shared without assigning a generation
                      function to the Head Coach.
                    </div>
                  ) : allowedGenerationDomains.length === 0 ? (
                    <div className="text-sm text-textSecondary">
                      You do not currently have a generation function assigned.
                    </div>
                  ) : isDownstreamDomainCoach &&
                    !effectiveDownstreamPlanningContextLocked ? (
                    <div className="text-sm text-textSecondary">
                      {UPSTREAM_CONTEXT_NOT_LOCKED_MESSAGE}
                    </div>
                  ) : isDownstreamDomainCoach && hasExistingCurrentDomainPlan ? (
                    renderAssistantDomainDraftActions()
                  ) : trainingPlanShellModel.shell === "skills_coach_planning" &&
                    !step6ShowsGenerateCreateActions ? null : !showHeadCoachDomainGeneratorCreateActions ? null : (
                    <div className="space-y-2">
                      {hasPersistedPlanForLatestDraftToDiscourageGenerate ? (
                        <WorkflowNeutralNotice>
                          <div className="text-sm text-textSecondary">
                            A saved plan is already linked to this draft. Prefer workflow actions or
                            revise unless you intentionally need another generation pass for this
                            domain.
                          </div>
                        </WorkflowNeutralNotice>
                      ) : null}
                      {allowedGenerationDomains
                        .filter(
                          (domain) =>
                            resolveGeneratePermissionForDomain(domain).canShowGenerate &&
                            !(
                              headCoachSkillsOwnerWorkflow &&
                              domain === "SKILLS" &&
                              headCoachSkillsPlanExists
                            ),
                        )
                        .map((domain) => {
                        const domainJob = generatePlanJobsByDomain[domain] ?? null;
                        const domainGenerationInProgress = isGenerationJobInProgress(domainJob);
                        return (
                          <div key={domain} className="space-y-2">
                            {shouldShowDomainButtonProgress({
                              domain,
                              currentDomain: currentCoachGenerationDomain,
                              generationInProgress: step6GenerationInProgress,
                            })
                              ? renderGenerationJobProgress(domainJob)
                              : null}
                            <Button
                              type="button"
                              variant="primary"
                              disabled={
                                generatePlanActionDisabled ||
                                domainGenerationInProgress ||
                                (generatePlanLocalErrorsByDomain[domain] ?? null) !== null
                              }
                              onClick={() => {
                                void handleGenerateTrainingPlan(domain);
                              }}
                            >
                              {renderGenerationJobButtonLabel(domain, domainJob)}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {trainingPlanShellModel.shell !== "head_coach_planning" &&
                  !isHeadCoachReviewerOnlyForDomain(resolvedWorkflowGenerationDomain)
                    ? renderPlanViewerWorkflowActions()
                    : null}
                      </section>
                  {headCoachReviewMode
                    ? (
                      <section className="space-y-3 border-t border-border/70 pt-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-normal text-textPrimary">
                            Domain Plans Coordination
                          </h4>
                          <p className="text-sm text-textSecondary">
                            Coordinate domain plan status, ownership, and available actions.
                          </p>
                        </div>
                        {renderHeadCoachSubmittedDomainPlansSection()}
                      </section>
                    )
                    : null}
                  </>
                  )}
                    </div>
                  }
                />
              )

    );
  }

  const trainingPlanPageHeader = (
    <PageHeader
      title="Training Plan"
      subtitle="Build context, coordinate domain plans, and review athlete plans"
    />
  );

  if (loading) {
    return (
      <div className={cn(DASHBOARD_PAGE_CONTENT_CLASS, "space-y-4")}>
        {trainingPlanPageHeader}
        <div className="flex min-h-[30vh] items-center justify-center text-sm text-textSecondary">
          Loading athlete planning profile…
        </div>
      </div>
    );
  }

  return (
    <div className={cn(DASHBOARD_PAGE_CONTENT_CLASS, "space-y-4")}>
      {trainingPlanPageHeader}

      {error ? <Alert variant="danger">{error}</Alert> : null}
      {missingPlanningProfile ? (
        <Alert variant="warning">
          Planning Profile Pending. The athlete must complete APP before training
          plan validation.
        </Alert>
      ) : null}

      {!error && !missingPlanningProfile && !profile ? (
        <Alert variant="warning">No planning profile data available.</Alert>
      ) : null}


      {profile ? (
        <>
          {workflowViewSelectionLoading ? (
            <Card accent={false} className={COACH_WORKFLOW_OUTER_CARD_CLASS}>
              <div className="flex min-h-[20vh] items-center justify-center px-4 py-10 text-sm text-textSecondary sm:px-6">
                Loading training plan workspace...
              </div>
            </Card>
          ) : trainingPlanShellModel.shell === "specialist_domain" ? (
            renderAssistantDomainWorkspace()
          ) : trainingPlanShellModel.shell === "head_coach_review" ||
            trainingPlanShellModel.shell === "head_coach_function_aware" ||
            trainingPlanShellModel.shell === "head_coach_planning" ||
            trainingPlanShellModel.shell === "skills_coach_planning" ? (
          <Card accent={false} className={COACH_WORKFLOW_OUTER_CARD_CLASS}>
            {!isContextBuilderStep(selectedWorkflowTab) && selectedWorkflowTab !== "generate" ? (
              <>
                <div className="space-y-4 border-border bg-card px-4 py-5 sm:px-6 sm:py-6">
                  <TrainingPlanWorkflowProgressRail
                    steps={[...workflowStepperModel]}
                    headCoachReviewMode={headCoachReviewMode}
                    reviewReviseStepLabel={reviewReviseStepLabel}
                  />
                </div>
                <div className="w-full min-w-0 max-w-full overflow-hidden px-4 sm:px-6">
                  <WorkflowConnectedTabStrip
                    selectedTab={selectedWorkflowTab}
                    steps={[...workflowStepperModel]}
                    headCoachReviewMode={headCoachReviewMode}
                    reviewReviseStepLabel={reviewReviseStepLabel}
                    onSelect={(tab) => {
                      if (workflowStepStatusByKey[tab] === "locked") return;
                      setSelectedWorkflowTab(tab);
                    }}
                  />
                </div>
              </>
            ) : null}
            <div className="space-y-6 bg-card px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 md:px-10 md:py-10">
              <TrainingPlanWorkspaceLifecycleHeader
                steps={resolveTrainingPlanWorkspaceLifecycleHeaderSteps()}
              />
              {renderContextBuilderWorkspace()}

              {renderDomainPlansIntegrationWorkspace()}
            </div>
          </Card>
          ) : (
            <Card accent={false} className={COACH_WORKFLOW_OUTER_CARD_CLASS}>
              <div className="flex min-h-[20vh] items-center justify-center px-4 py-10 text-sm text-textSecondary sm:px-6">
                Loading training plan workspace...
              </div>
            </Card>
          )}

          <CoachAthleteLevelValidationModal
            open={levelValidationModalOpen}
            onClose={() => setLevelValidationModalOpen(false)}
            entityId={entityId}
            athleteId={athleteIdTrimmed}
            selfReportedLevelLabel={formatEnumeratedLabel(
              profile.selfReportedLevel,
            )}
            levelValidationSnapshot={readinessSources.levelValidation}
            onAfterSaveConfirmed={refreshProfileAndReadinessAfterLevelValidation}
          />
          {renderDomainReviewDrawer()}
          {requestRevisionModalOpen &&
          (!workflow1HeadCoachReviewActionPanelMode || domainReviewDrawerOpen) ? (
            <Modal
              className="w-full max-w-lg overflow-hidden rounded-2xl bg-card p-0 shadow-lg"
              aria-labelledby="request-revision-modal-title"
            >
              <form
                className="flex flex-col gap-4 px-6 py-6 sm:px-7 sm:py-7"
                onSubmit={(event) => void handleRequestRevisionSubmit(event)}
              >
                <div className="space-y-1">
                  <h2
                    id="request-revision-modal-title"
                    className="text-lg font-normal text-textPrimary"
                  >
                    Request Revision
                  </h2>
                  <p className="text-sm text-textSecondary">
                    Explain what the coach should change before resubmitting.
                  </p>
                </div>

                {governedPlanActionError ? (
                  <Alert variant="danger">{governedPlanActionError}</Alert>
                ) : null}

                <label className="space-y-1 text-sm text-textPrimary">
                  <span className="font-medium">Revision feedback</span>
                  <textarea
                    rows={5}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary caret-current placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                    value={requestRevisionFeedback}
                    onChange={(event) => setRequestRevisionFeedback(event.target.value)}
                    placeholder="Describe the required changes."
                    disabled={governedPlanActionLoading === "REQUEST_REVISION"}
                  />
                </label>

                <div className="flex flex-wrap justify-end gap-3 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={governedPlanActionLoading === "REQUEST_REVISION"}
                    onClick={handleCancelRequestRevision}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={governedPlanActionLoading === "REQUEST_REVISION"}
                    disabled={
                      governedPlanActionLoading === "REQUEST_REVISION" ||
                      requestRevisionFeedback.trim() === ""
                    }
                  >
                    Request Revision
                  </Button>
                </div>
              </form>
            </Modal>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
