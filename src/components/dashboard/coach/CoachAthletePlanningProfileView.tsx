"use client";

import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyAcademyCoaches } from "@/lib/api/academyMeCoaches";
import {
  createPhaseAwareGoal,
  createGoal,
  createSeasonCycle,
  createSeasonCyclePhase,
  fetchGoalsForAthlete,
  fetchSeasonCyclePhases,
  fetchSeasonCyclesForEntity,
  updateSeasonCycle,
  updateSeasonCyclePhase,
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
import { fetchCoachMeDashboard } from "@/lib/api/coachMe";
import {
  executeCoachAthleteTrainingPlan,
  fetchLatestCoachAthleteDomainDraft,
  fetchCoachAthleteTrainingPlanCompleteness,
  fetchCoachAthleteTrainingPlanReadiness,
  fetchCoachAthleteTrainingPlanWorkloadAssessment,
  persistCoachAthleteTrainingPlanDraft,
  reviseCoachAthleteTrainingPlan,
  type CoachAthleteTrainingPlanCompleteness,
  type CoachAthleteTrainingPlanExecuteResult,
  type CoachAthleteLatestDomainDraft,
  type CoachAthleteTrainingPlanPersistDraftResult,
  type CoachAthleteTrainingPlanReadiness,
  type TrainingPlanGenerationDomain,
  type CoachAthleteTrainingPlanWorkloadAssessment,
} from "@/lib/api/coachAthletePlanningReadiness";
import { isNormalizedApiError } from "@/lib/apiClient";
import { canCoachValidateLevel, normalizeCoachFunctionValue } from "@/lib/coachAuthority";
import type { TrainingPlanLevelValidationView } from "@/types/trainingPlanLevelValidation";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type DisplayableValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>
  | null
  | undefined;
type DetailGroup = Record<string, DisplayableValue>;
type PlanningReadinessSources = {
  levelValidation: TrainingPlanLevelValidationView | null;
  readiness: CoachAthleteTrainingPlanReadiness | null;
  completeness: CoachAthleteTrainingPlanCompleteness | null;
};
type GoalsSeasonSetupState = {
  seasons: SeasonCycleSummary[];
  phasesBySeasonCycleId: Record<string, SeasonPhaseSummary[]>;
  goals: GoalSummary[];
  coachFunctions: string[];
  hasHeadCoachConfigured: boolean;
  academyCoachRole: string;
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

const GENERATION_DOMAIN_ORDER: TrainingPlanGenerationDomain[] = [
  "SKILLS",
  "NUTRITION",
  "S_AND_C",
];
const AI_GENERATION_VALIDATION_ERROR_MESSAGE =
  "Plan generation completed, but the AI output did not match the required system format. Please try again after the generator is updated.";

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

function displayDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function hasRenderableValue(value: DisplayableValue): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return Number.isFinite(value);
  return true;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="text-xs font-medium text-textMuted sm:w-56 sm:shrink-0">
        {label}
      </dt>
      <dd className="min-w-0 text-sm text-textPrimary">{value}</dd>
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

function orderedGroupEntries(
  group: DetailGroup | null | undefined,
  preferredOrder: string[] = [],
) {
  if (!group || typeof group !== "object" || Array.isArray(group)) {
    return [] as Array<[string, DisplayableValue]>;
  }

  const seen = new Set<string>();
  const entries: Array<[string, DisplayableValue]> = [];

  for (const key of preferredOrder) {
    if (!Object.prototype.hasOwnProperty.call(group, key)) continue;
    entries.push([key, group[key]]);
    seen.add(key);
  }

  for (const [key, value] of Object.entries(group)) {
    if (seen.has(key)) continue;
    entries.push([key, value]);
  }

  return entries;
}

function DetailGroupCard({
  title,
  group,
  preferredOrder,
}: {
  title: string;
  group: DetailGroup | null | undefined;
  preferredOrder?: string[];
}) {
  const entries = orderedGroupEntries(group, preferredOrder);

  return (
    <DashboardCardShell title={title}>
      {entries.length > 0 ? (
        <dl className="space-y-2">
          {entries.map(([field, value]) => (
            <DetailRow key={field} label={toFieldLabel(field)} value={displayValue(value)} />
          ))}
        </dl>
      ) : (
        <div className="text-sm text-textSecondary">—</div>
      )}
    </DashboardCardShell>
  );
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

function hasReadinessContent(input: {
  appCompleteness: string | null;
  validationStatus: string | null;
  validatedLevel: string | null;
  planningEligibility: string | null;
  missingRequiredFields: string[];
  completenessStatus: string | null;
  completenessSummary: string | null;
}): boolean {
  return (
    input.appCompleteness !== null ||
    input.validationStatus !== null ||
    input.validatedLevel !== null ||
    input.planningEligibility !== null ||
    input.missingRequiredFields.length > 0 ||
    input.completenessStatus !== null ||
    input.completenessSummary !== null
  );
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

function hasDataQualityWarnings(
  workloadAssessment: CoachAthleteTrainingPlanWorkloadAssessment,
  freshnessStatus: string | null,
): boolean {
  return (
    workloadAssessment.assessmentStatus !== null ||
    workloadAssessment.readinessLevel !== null ||
    workloadAssessment.workloadFlags !== null ||
    workloadAssessment.restrictionSummary !== null ||
    workloadAssessment.explanation !== null ||
    freshnessStatus !== null ||
    Object.keys(workloadAssessment.additionalDetails).length > 0
  );
}

function dataQualitySummary(
  workloadAssessment: CoachAthleteTrainingPlanWorkloadAssessment,
  freshnessStatus: string | null,
): string {
  if (
    freshnessStatus &&
    freshnessStatus.trim() !== "" &&
    freshnessStatus.trim().toUpperCase() !== "FRESH"
  ) {
    return "Some inputs may be outdated";
  }
  if (hasDataQualityWarnings(workloadAssessment, freshnessStatus)) {
    return "Data review recommended";
  }
  return "No data quality warnings";
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

function formatSeasonOptionLabel(season: SeasonCycleSummary): string {
  if (season.year !== null && season.sport) {
    return `${season.year} ${formatSportLabel(season.sport)} Season`;
  }
  if (season.name) return season.name;
  return season.id;
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

function canGenerateTrainingPlan(input: {
  appCompleteness: string | null;
  validationStatus: string | null;
  planningEligibility: string | null;
  workloadClassificationExists: boolean;
}): boolean {
  return (
    input.appCompleteness === "COMPLETE" &&
    input.validationStatus === "CONFIRMED" &&
    input.planningEligibility === "ELIGIBLE_FOR_WORKLOAD_ASSESSMENT" &&
    input.workloadClassificationExists
  );
}

function executionBlockedMessage(result: CoachAthleteTrainingPlanExecuteResult): string | null {
  if (result.executionDecision?.executed !== false) return null;
  const missingRequirements = result.completenessDecision?.missingRequirements ?? [];
  const hasGoals = missingRequirements.includes("goalsDefined");
  const hasSeason = missingRequirements.includes("seasonDefined");
  const hasUpstream = missingRequirements.includes("upstreamGenerationDecisionPassed");

  if (hasGoals && hasSeason) {
    return "Training plan cannot be generated until Goals and Season are configured.";
  }
  if (hasGoals) {
    return "Training plan cannot be generated until Goals are configured.";
  }
  if (hasSeason) {
    return "Training plan cannot be generated until Season is configured.";
  }
  if (hasUpstream) {
    return "Training plan cannot be generated until planning readiness is complete.";
  }

  return result.executionDecision.reason?.trim() || "Training plan generation was blocked.";
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
  if (domain === "SKILLS") return "Generate Skills Plan";
  if (domain === "NUTRITION") return "Generate Nutrition Plan";
  return "Generate S&C Plan";
}

function currentPhaseGoalSectionTitle(domain: TrainingPlanGenerationDomain): string {
  if (domain === "NUTRITION") return "Current Phase Nutrition Goals";
  if (domain === "S_AND_C") return "Current Phase S&C Goals";
  return "Current Phase Skills Goals";
}

function currentPhaseGoalNameLabel(domain: TrainingPlanGenerationDomain): string {
  if (domain === "NUTRITION") return "Nutrition Goal Name";
  if (domain === "S_AND_C") return "S&C Goal Name";
  return "Skill Goal Name";
}

function currentPhaseGoalRequirementLabel(domain: TrainingPlanGenerationDomain): string {
  if (domain === "NUTRITION") {
    return "At least one ACTIVE nutrition goal is required for generation.";
  }
  if (domain === "S_AND_C") {
    return "At least one ACTIVE S&C goal is required for generation.";
  }
  return "At least one ACTIVE skill goal is required for generation.";
}

function currentPhaseGoalEmptyState(domain: TrainingPlanGenerationDomain): string {
  if (domain === "NUTRITION") {
    return "No ACTIVE nutrition goals found for the detected current phase.";
  }
  if (domain === "S_AND_C") {
    return "No ACTIVE S&C goals found for the detected current phase.";
  }
  return "No ACTIVE skill goals found for the detected current phase.";
}

function sameStringArray(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
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
  const router = useRouter();
  const { accessContext, accessGateReady } = useAuth();
  const entityId = useMemo(
    () => accessContext?.academy.trainingEntityId?.trim() ?? "",
    [accessContext],
  );
  const currentCoachUserId = accessContext?.user.userId?.trim() ?? "";
  const athleteIdTrimmed = athleteId.trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingPlanningProfile, setMissingPlanningProfile] = useState(false);
  const [profile, setProfile] = useState<CoachAthletePlanningProfileData | null>(
    null,
  );
  const sportCode = profile?.sportContext?.primarySport?.trim() ?? null;
  const [readinessLoading, setReadinessLoading] = useState(true);
  const [readinessError, setReadinessError] = useState<string | null>(null);
  const [readinessSources, setReadinessSources] = useState<PlanningReadinessSources>({
    levelValidation: null,
    readiness: null,
    completeness: null,
  });
  const [workloadAssessmentLoading, setWorkloadAssessmentLoading] = useState(false);
  const [workloadAssessmentError, setWorkloadAssessmentError] = useState<string | null>(
    null,
  );
  const [workloadAssessmentResult, setWorkloadAssessmentResult] =
    useState<CoachAthleteTrainingPlanWorkloadAssessment | null>(null);
  const workloadAssessmentAutoLoadKeyRef = useRef("");
  const [generatePlanLoading, setGeneratePlanLoading] = useState(false);
  const [generatePlanPhase, setGeneratePlanPhase] = useState<
    "idle" | "executing" | "persisting"
  >("idle");
  const [generatePlanError, setGeneratePlanError] = useState<string | null>(null);
  const [generatePlanSuccess, setGeneratePlanSuccess] =
    useState<CoachAthleteTrainingPlanPersistDraftResult | null>(null);
  const [latestSkillsDraft, setLatestSkillsDraft] =
    useState<CoachAthleteLatestDomainDraft | null>(null);
  const [latestSkillsDraftMissing, setLatestSkillsDraftMissing] = useState(false);
  const [latestSkillsDraftError, setLatestSkillsDraftError] = useState<string | null>(null);
  const [reviseSkillsFeedback, setReviseSkillsFeedback] = useState("");
  const [reviseSkillsLoading, setReviseSkillsLoading] = useState(false);
  const [reviseSkillsError, setReviseSkillsError] = useState<string | null>(null);
  const [reviseSkillsSuccess, setReviseSkillsSuccess] = useState<string | null>(null);
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
  const [seasonSaveLoading, setSeasonSaveLoading] = useState(false);
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
  });
  const [selectedSeasonCycleId, setSelectedSeasonCycleId] = useState("");
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [durationDays, setDurationDays] = useState<7 | 15 | 30>(30);
  const [planStartDate, setPlanStartDate] = useState(() =>
    formatDateInputValue(new Date()),
  );
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
  const [goalName, setGoalName] = useState("");
  const [goalSuccessCriteria, setGoalSuccessCriteria] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [goalPriority, setGoalPriority] = useState<GoalPriority>("MEDIUM");
  const [goalTargetValue, setGoalTargetValue] = useState("");

  useEffect(() => {
    if (!sportCode) return;
    if (!seasonNameEdited) {
      setSeasonName(`${seasonYear} ${formatSportLabel(sportCode)} Season`);
    }
  }, [seasonNameEdited, seasonYear, sportCode]);

  useEffect(() => {
    if (seasonStartDate === "") return;
    const nextYear = Number(seasonStartDate.slice(0, 4));
    if (Number.isFinite(nextYear) && nextYear > 0) {
      setSeasonYear((current) => (current === nextYear ? current : nextYear));
    }
  }, [seasonStartDate]);

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
        const data = await fetchCoachAthletePlanningProfile(entityId, athleteIdTrimmed);
        if (cancelled) return;
        setProfile(data);
      } catch (e) {
        if (cancelled) return;
        setProfile(null);
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

  useEffect(() => {
    let cancelled = false;

    async function loadReadiness() {
      if (!accessGateReady) {
        setReadinessLoading(true);
        return;
      }

      if (entityId === "" || athleteIdTrimmed === "") {
        setReadinessSources({
          levelValidation: null,
          readiness: null,
          completeness: null,
        });
        setReadinessError(null);
        setWorkloadAssessmentResult(null);
        setWorkloadAssessmentError(null);
        setWorkloadAssessmentLoading(false);
        setGeneratePlanError(null);
        setGeneratePlanLoading(false);
        setGeneratePlanPhase("idle");
        setGeneratePlanSuccess(null);
        setReadinessLoading(false);
        return;
      }

      setReadinessLoading(true);
      setReadinessError(null);
      setWorkloadAssessmentResult(null);
      setWorkloadAssessmentError(null);
      setWorkloadAssessmentLoading(false);
      setGeneratePlanError(null);
      setGeneratePlanLoading(false);
      setGeneratePlanPhase("idle");
      setGeneratePlanSuccess(null);

      const results = await Promise.allSettled([
        fetchCoachAthleteLevelValidation(entityId, athleteIdTrimmed),
        fetchCoachAthleteTrainingPlanReadiness(entityId, athleteIdTrimmed),
        fetchCoachAthleteTrainingPlanCompleteness(entityId, athleteIdTrimmed),
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
  }, [accessGateReady, athleteIdTrimmed, entityId]);

  const readinessPanel = useMemo(() => {
    const { levelValidation, readiness, completeness } = readinessSources;

    const missingRequiredFields =
      completeness?.missingRequiredFields.length
        ? completeness.missingRequiredFields
        : readiness?.missingRequiredFields.length
          ? readiness.missingRequiredFields
          : profile?.missingRequiredFields ?? [];

    return {
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
      missingRequiredFields,
      completenessStatus: completeness?.completenessStatus ?? null,
      completenessSummary: completeness?.summary ?? null,
    };
  }, [profile, readinessSources]);

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
      setSelectedSeasonCycleId("");
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
      });

      const today = formatDateInputValue(new Date());
      const activeSeason =
        seasons.find((season) =>
          (phasesBySeasonCycleId[season.seasonCycleId] ?? []).some((phase) => {
            if (!phase.startDate || !phase.endDate) return false;
            const phaseStart = dateOnly(phase.startDate);
            const phaseEnd = dateOnly(phase.endDate);
            if (!phaseStart || !phaseEnd) return false;
            return phaseStart <= today && today <= phaseEnd;
          }),
        ) ?? seasons[0];
      const nextSeasonCycleId = activeSeason?.seasonCycleId ?? "";
      setSelectedSeasonCycleId((current) =>
        current && seasons.some((season) => season.seasonCycleId === current)
          ? current
          : nextSeasonCycleId,
      );
      setSelectedGoalIds((current) => {
        const activeGoals = goals.filter((goal) => goal.status === "ACTIVE");
        const existing = current.filter((goalId) =>
          activeGoals.some((goal) => goal.goalId === goalId),
        );
        if (existing.length > 0) return existing;
        const matchingGoalIds = activeGoals
          .filter((goal) =>
            nextSeasonCycleId === "" ? true : goal.seasonCycleId === nextSeasonCycleId,
          )
          .map((goal) => goal.goalId);
        return matchingGoalIds;
      });
    } catch {
      setSeasonError("Failed to load seasons. Please try again.");
    } finally {
      setSetupLoading(false);
    }
  }, [accessGateReady, athleteIdTrimmed, currentCoachUserId, entityId]);

  useEffect(() => {
    void refreshGoalsSeasonSetup();
  }, [refreshGoalsSeasonSetup]);

  const selectedSeason = setupState.seasons.find(
    (season) => season.seasonCycleId === selectedSeasonCycleId,
  ) ?? null;
  const isSeasonEditMode = Boolean(selectedSeason?.id);
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
  const activeGoals = useMemo(
    () => setupState.goals.filter((goal) => goal.status === "ACTIVE"),
    [setupState.goals],
  );
  const visibleActiveGoals = useMemo(
    () =>
      activeGoals.filter((goal) =>
        selectedSeasonCycleId === "" ? true : goal.seasonCycleId === selectedSeasonCycleId,
      ),
    [activeGoals, selectedSeasonCycleId],
  );
  const currentPhaseActiveGoals = useMemo(
    () =>
      visibleActiveGoals.filter((goal) =>
        goalMatchesCurrentPhase(goal, activePhaseForSelectedSeason),
      ),
    [activePhaseForSelectedSeason, visibleActiveGoals],
  );
  const currentPhaseActiveGoalIds = useMemo(
    () => currentPhaseActiveGoals.map((goal) => goal.goalId),
    [currentPhaseActiveGoals],
  );
  const competitionGoals = useMemo(
    () => visibleActiveGoals.filter((goal) => goal.goalType === "COMPETITION"),
    [visibleActiveGoals],
  );
  const selectedActiveGoals = useMemo(
    () => currentPhaseActiveGoals.filter((goal) => selectedGoalIds.includes(goal.goalId)),
    [currentPhaseActiveGoals, selectedGoalIds],
  );
  const planEndDate = useMemo(
    () => addDaysToDateString(planStartDate, durationDays - 1),
    [durationDays, planStartDate],
  );
  const planWindowInsideCurrentPhase = isPlanWindowInsidePhase(
    activePhaseForSelectedSeason,
    planStartDate,
    planEndDate,
  );

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

  useEffect(() => {
    setSelectedGoalIds((current) => {
      const kept = current.filter((goalId) => currentPhaseActiveGoalIds.includes(goalId));
      const next = kept.length > 0 ? kept : currentPhaseActiveGoalIds;
      return sameStringArray(current, next) ? current : next;
    });
  }, [currentPhaseActiveGoalIds]);

  const seasonReady = selectedSeason !== null;
  const currentPhaseDetected = activePhaseForSelectedSeason !== null;
  const goalsReady = selectedActiveGoals.length > 0;
  const workloadComplete = workloadAssessmentResult?.workloadClassification !== null;
  const allowedGenerationDomains = useMemo(
    () => deriveGenerationDomains(setupState.coachFunctions),
    [setupState.coachFunctions],
  );
  const currentCoachGenerationDomain = allowedGenerationDomains[0] ?? "SKILLS";
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
  const shouldLoadLatestSkillsDraft = allowedGenerationDomains.includes("SKILLS");
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

  const loadWorkloadAssessment = useCallback(
    async (resetGenerationState: boolean) => {
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
        return;
      }

      setWorkloadAssessmentLoading(true);
      setWorkloadAssessmentError(null);
      if (resetGenerationState) {
        setGeneratePlanError(null);
        setGeneratePlanPhase("idle");
        setGeneratePlanSuccess(null);
      }

      try {
        const result = await fetchCoachAthleteTrainingPlanWorkloadAssessment(
          entityId,
          athleteIdTrimmed,
        );
        setWorkloadAssessmentResult(result);
      } catch (e) {
        setWorkloadAssessmentResult(null);
        setWorkloadAssessmentError(
          formatApiError(e, "Could not run workload assessment. Please try again shortly."),
        );
      } finally {
        setWorkloadAssessmentLoading(false);
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

  const loadLatestSkillsDraft = useCallback(async (retryOnNotFound = false) => {
    if (entityId === "" || athleteIdTrimmed === "" || !shouldLoadLatestSkillsDraft) {
      setLatestSkillsDraft(null);
      setLatestSkillsDraftMissing(false);
      setLatestSkillsDraftError(null);
      return;
    }

    const retryDelaysMs = retryOnNotFound ? [0, 500, 1000] : [0];
    for (const [attemptIndex, retryDelayMs] of retryDelaysMs.entries()) {
      if (retryDelayMs > 0) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, retryDelayMs);
        });
      }
      try {
        const result = await fetchLatestCoachAthleteDomainDraft(
          entityId,
          athleteIdTrimmed,
          "SKILLS",
        );
        setLatestSkillsDraft(result);
        setLatestSkillsDraftMissing(false);
        setLatestSkillsDraftError(null);
        return;
      } catch (e) {
        if (isNormalizedApiError(e) && e.status === 404) {
          if (attemptIndex < retryDelaysMs.length - 1) {
            continue;
          }
          setLatestSkillsDraft(null);
          setLatestSkillsDraftMissing(true);
          setLatestSkillsDraftError(null);
          return;
        }
        setLatestSkillsDraft(null);
        setLatestSkillsDraftMissing(false);
        setLatestSkillsDraftError("Unable to load draft. Please try again.");
        return;
      }
    }
  }, [athleteIdTrimmed, entityId, shouldLoadLatestSkillsDraft]);

  useEffect(() => {
    if (
      readinessLoading ||
      entityId === "" ||
      athleteIdTrimmed === "" ||
      !canRunWorkloadAssessment({
        appCompleteness: readinessPanel.appCompleteness,
        validationStatus: readinessPanel.validationStatus,
        planningEligibility: readinessPanel.planningEligibility,
      })
    ) {
      workloadAssessmentAutoLoadKeyRef.current = "";
      return;
    }

    const nextKey = [
      entityId,
      athleteIdTrimmed,
      readinessPanel.appCompleteness ?? "",
      readinessPanel.validationStatus ?? "",
      readinessPanel.planningEligibility ?? "",
    ].join("|");

    if (workloadAssessmentAutoLoadKeyRef.current === nextKey) {
      return;
    }

    workloadAssessmentAutoLoadKeyRef.current = nextKey;
    void loadWorkloadAssessment(false);
  }, [
    athleteIdTrimmed,
    entityId,
    loadWorkloadAssessment,
    readinessLoading,
    readinessPanel.appCompleteness,
    readinessPanel.planningEligibility,
    readinessPanel.validationStatus,
  ]);

  useEffect(() => {
    if (!accessGateReady) return;
    void loadLatestSkillsDraft();
  }, [accessGateReady, loadLatestSkillsDraft]);

  async function handleReviseSkillsPlan() {
    if (
      reviseSkillsLoading ||
      entityId === "" ||
      athleteIdTrimmed === "" ||
      !latestSkillsDraft?.trainingPlanId ||
      !latestSkillsDraft.trainingPlanVersionId
    ) {
      return;
    }

    const feedback = reviseSkillsFeedback.trim();
    if (feedback === "") {
      setReviseSkillsError("Enter revision feedback first.");
      setReviseSkillsSuccess(null);
      return;
    }

    setReviseSkillsLoading(true);
    setReviseSkillsError(null);
    setReviseSkillsSuccess(null);
    try {
      await reviseCoachAthleteTrainingPlan(entityId, athleteIdTrimmed, {
        trainingPlanId: latestSkillsDraft.trainingPlanId,
        trainingPlanVersionId: latestSkillsDraft.trainingPlanVersionId,
        generationDomain: "SKILLS",
        feedback,
      });
      await loadLatestSkillsDraft(true);
      setReviseSkillsFeedback("");
      setReviseSkillsSuccess("Revised skills plan version generated.");
    } catch (e) {
      if (isAiGenerationValidationError(e)) {
        console.error("Training plan revision validation error", e);
        setReviseSkillsError(AI_GENERATION_VALIDATION_ERROR_MESSAGE);
      } else {
        setReviseSkillsError("Unable to revise plan. Please try again.");
      }
      setReviseSkillsSuccess(null);
    } finally {
      setReviseSkillsLoading(false);
    }
  }

  function handleStartCreateSeason() {
    const defaultYear = new Date().getUTCFullYear();
    setSelectedSeasonCycleId("");
    setSeasonError(null);
    setSeasonSuccess(null);
    setSeasonNameEdited(false);
    setSeasonYear(defaultYear);
    setSeasonStartDate(yearStartDateInput(defaultYear));
    setSeasonEndDate(yearEndDateInput(defaultYear));
    setSeasonName(
      sportCode ? `${defaultYear} ${formatSportLabel(sportCode)} Season` : "",
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
    if (!sportCode) {
      setSeasonError("Sport information is missing for this athlete.");
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
      sport: sportCode,
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
      await refreshGoalsSeasonSetup();
      setSelectedSeasonCycleId(season.seasonCycleId);
      setSeasonSuccess("Season created and selected.");
    } catch (e) {
      setSeasonError(formatApiError(e, "Failed to create season. Please try again."));
    } finally {
      setSeasonCreateLoading(false);
    }
  }

  async function handleSaveSeasonChanges() {
    if (!selectedSeason) {
      setSeasonError("Select a season before saving changes.");
      setSeasonSuccess(null);
      return;
    }
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

    const payload: {
      name?: string;
      year?: number;
      startDate?: string;
      endDate?: string;
    } = {};
    if (seasonName.trim() !== (selectedSeason.name ?? "").trim()) {
      payload.name = seasonName.trim();
    }
    if (seasonYear !== (selectedSeason.year ?? null)) {
      payload.year = seasonYear;
    }
    if (seasonStartDate !== (dateOnly(selectedSeason.startDate) ?? "")) {
      payload.startDate = toUtcDateTimeString(seasonStartDate);
    }
    if (seasonEndDate !== (dateOnly(selectedSeason.endDate) ?? "")) {
      payload.endDate = toUtcDateTimeString(seasonEndDate);
    }
    if (Object.keys(payload).length === 0) {
      setSeasonError("No season changes to save.");
      setSeasonSuccess(null);
      return;
    }

    setSeasonSaveLoading(true);
    setSeasonError(null);
    setSeasonSuccess(null);
    try {
      await updateSeasonCycle(selectedSeason.seasonCycleId, payload);
      await refreshGoalsSeasonSetup();
      setSelectedSeasonCycleId(selectedSeason.seasonCycleId);
      setSeasonSuccess("Season updated successfully.");
    } catch (e) {
      setSeasonError(formatApiError(e, "Failed to update season. Please try again."));
    } finally {
      setSeasonSaveLoading(false);
    }
  }

  async function handleCreatePhase(phase: SeasonPhaseType) {
    if (selectedSeasonCycleId === "") {
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
    try {
      await updateSeasonCyclePhase(existing.phaseId, payload);
      await refreshSelectedSeasonPhases(existing.seasonCycleId ?? selectedSeasonCycleId);
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
    if (selectedSeasonCycleId === "") {
      setCompetitionError("Select or create a season before adding a competition goal.");
      setCompetitionSuccess(null);
      return;
    }
    if (competitionName.trim() === "" || competitionDate.trim() === "") {
      setCompetitionError("Competition name and competition date are required.");
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
        createdByCoachId: coachUserId,
        goalType: "COMPETITION",
        competitionEventId,
        startDate: `${phaseByType.IN_SEASON?.startDate ?? today}T00:00:00.000Z`,
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
    if (selectedSeasonCycleId === "") {
      setGoalError("Select or create a season before creating a goal.");
      setGoalSuccess(null);
      return;
    }
    if (goalName.trim() === "") {
      setGoalError("Skill goal name is required.");
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
      await createPhaseAwareGoal({
        athleteId: athleteIdTrimmed,
        entityId,
        seasonCycleId: selectedSeasonCycleId,
        seasonPhaseId: activePhaseForSelectedSeason.phaseId,
        goalName,
        successCriteria: goalSuccessCriteria,
        goalCategory: "TRAINING",
        createdByCoachId: coachUserId,
        priority: goalPriority,
        ...(parsedTargetValue !== undefined ? { targetValue: parsedTargetValue } : {}),
        ...(goalTargetDate.trim() !== ""
          ? { targetDate: `${goalTargetDate}T00:00:00.000Z` }
          : {}),
      });
      await refreshGoalsSeasonSetup();
      setGoalSuccess("Skill goal created successfully.");
      setGoalName("");
      setGoalSuccessCriteria("");
      setGoalTargetDate("");
      setGoalTargetValue("");
      setGoalPriority("MEDIUM");
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
    await loadWorkloadAssessment(true);
  }

  async function handleGenerateTrainingPlan(domain: TrainingPlanGenerationDomain) {
    if (
      readinessLoading ||
      workloadAssessmentLoading ||
      generatePlanLoading ||
      entityId === "" ||
      athleteIdTrimmed === "" ||
      !canGenerateTrainingPlan({
        appCompleteness: readinessPanel.appCompleteness,
        validationStatus: readinessPanel.validationStatus,
        planningEligibility: readinessPanel.planningEligibility,
        workloadClassificationExists:
          workloadAssessmentResult?.workloadClassification !== null,
      }) ||
      selectedSeasonCycleId === "" ||
      selectedActiveGoals.length === 0 ||
      planStartDate === "" ||
      planEndDate === ""
    ) {
      return;
    }

    if (!sportCode) {
      setGeneratePlanError(
        "Sport information is missing for this athlete. Please update Athlete Profile.",
      );
      setGeneratePlanSuccess(null);
      return;
    }
    if (!activePhaseForSelectedSeason) {
      setGeneratePlanError(
        "Training plan draft cannot be saved until Season and Goals are configured.",
      );
      setGeneratePlanSuccess(null);
      return;
    }
    if (!planWindowInsideCurrentPhase) {
      setGeneratePlanError(
        "Selected plan window crosses the current season phase. Choose a shorter duration or adjust phase dates.",
      );
      setGeneratePlanSuccess(null);
      return;
    }

    setGeneratePlanLoading(true);
    setGeneratePlanPhase("executing");
    setGeneratePlanError(null);
    setGeneratePlanSuccess(null);

    try {
      const executeResult = await executeCoachAthleteTrainingPlan(
        entityId,
        athleteIdTrimmed,
        {
          sportCode,
          durationDays,
          generationDomain: domain,
        },
      );
      const blockedMessage = executionBlockedMessage(executeResult);
      if (blockedMessage) {
        setGeneratePlanError(blockedMessage);
        return;
      }
      if (
        executeResult.generatedPlannerCandidate === null ||
        executeResult.generatedPlannerCandidate === undefined ||
        executeResult.generationContextSnapshot === null ||
        executeResult.generationContextSnapshot === undefined ||
        selectedSeasonCycleId === "" ||
        selectedActiveGoals.length === 0 ||
        planStartDate === "" ||
        planEndDate === ""
      ) {
        setGeneratePlanError(
          "Training plan draft cannot be saved until Season and Goals are configured.",
        );
        return;
      }

      setGeneratePlanPhase("persisting");
      const persistResult = await persistCoachAthleteTrainingPlanDraft(
        entityId,
        athleteIdTrimmed,
        {
          generatedPlannerCandidate: executeResult.generatedPlannerCandidate,
          generationContextSnapshot: executeResult.generationContextSnapshot,
          persistenceContext: {
            seasonCycleId: selectedSeasonCycleId,
            startDate: planStartDate,
            endDate: planEndDate,
            goalIds: selectedActiveGoals.map((goal) => goal.goalId),
          },
        },
      );
      setGeneratePlanSuccess(persistResult);
      if (domain === "SKILLS") {
        await loadLatestSkillsDraft(true);
      }
    } catch (e) {
      setGeneratePlanSuccess(null);
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
      setGeneratePlanLoading(false);
      setGeneratePlanPhase("idle");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-textSecondary">
        Loading athlete planning profile…
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">
            Athlete Planning Profile
          </h1>
          <p className="text-sm text-textSecondary">
            Read-only planning profile for assigned athlete.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showValidateLevel ? (
            <Button
              type="button"
              variant="secondary"
              disabled={missingPlanningProfile}
              onClick={() =>
                router.push(
                  `/coach/athletes/${encodeURIComponent(athleteIdTrimmed)}/level-validation`,
                )
              }
            >
              Continue to Level Validation
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/coach/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </header>

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
          <Card className="space-y-4 border border-slate-200 bg-slate-50 p-4 shadow-sm md:p-5">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-textPrimary">
                Planning Readiness Panel
              </h2>
              <p className="text-sm text-textSecondary">
                Coach workflow readiness before training plan generation.
              </p>
            </div>

            {readinessLoading ? (
              <div className="text-sm text-textSecondary">Loading readiness details…</div>
            ) : (
              <div className="space-y-3">
                {readinessError ? <Alert variant="warning">{readinessError}</Alert> : null}
                {hasReadinessContent(readinessPanel) ? (
                  <>
                    <dl className="space-y-2">
                      <DetailRow
                        label="APP Completeness"
                        value={displayValue(readinessPanel.appCompleteness)}
                      />
                      <DetailRow
                        label="Level Validation Status"
                        value={displayValue(readinessPanel.validationStatus)}
                      />
                      <DetailRow
                        label="Validated Level"
                        value={displayValue(readinessPanel.validatedLevel)}
                      />
                      <DetailRow
                        label="Planning Eligibility"
                        value={displayValue(readinessPanel.planningEligibility)}
                      />
                      <DetailRow
                        label="Missing Required Fields"
                        value={formatMissingRequiredFields(
                          readinessPanel.missingRequiredFields,
                        )}
                      />
                      {readinessPanel.completenessSummary ? (
                        <DetailRow
                          label="Completeness Summary"
                          value={displayValue(readinessPanel.completenessSummary)}
                        />
                      ) : null}
                    </dl>

                    {showValidateLevel ? (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                          type="button"
                          variant="primary"
                          disabled={
                            readinessLoading ||
                            workloadAssessmentLoading ||
                            !canRunWorkloadAssessment(readinessPanel)
                          }
                          onClick={() => {
                            void handleRunWorkloadAssessment();
                          }}
                        >
                          {workloadAssessmentLoading
                            ? "Running Workload Assessment..."
                            : "Run Workload Assessment"}
                        </Button>
                      </div>
                    ) : null}

                    {workloadAssessmentError ? (
                      <Alert variant="danger">{workloadAssessmentError}</Alert>
                    ) : null}

                    {workloadAssessmentResult ? (
                      <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
                        <h3 className="text-sm font-semibold text-textPrimary">
                          Workload Assessment Result
                        </h3>
                        {hasWorkloadAssessmentResult(workloadAssessmentResult) ? (
                          <>
                            <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                              <h4 className="text-sm font-semibold text-textPrimary">
                                Training Load Classification
                              </h4>
                              {workloadAssessmentResult.workloadClassification ? (
                                <dl className="space-y-2">
                                  <DetailRow
                                    label="Training Load Status"
                                    value={displayValue(
                                      workloadAssessmentResult.workloadClassification.status,
                                    )}
                                  />
                                  <DetailRow
                                    label="Current Weekly Training Hours"
                                    value={displayValue(
                                      workloadAssessmentResult.workloadClassification
                                        .weeklyTrainingHours,
                                    )}
                                  />
                                  <DetailRow
                                    label="Recommended Weekly Range"
                                    value={formatWeeklyRange(
                                      workloadAssessmentResult.workloadClassification
                                        .recommendedMinHours,
                                      workloadAssessmentResult.workloadClassification
                                        .recommendedMaxHours,
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
                                    value={displayValue(
                                      workloadAssessmentResult.workloadClassification.ageBand,
                                    )}
                                  />
                                  <DetailRow
                                    label="Validated Level"
                                    value={displayValue(
                                      workloadAssessmentResult.workloadClassification
                                        .validatedLevel,
                                    )}
                                  />
                                  <DetailRow
                                    label="Reason"
                                    value={displayValue(
                                      workloadAssessmentResult.workloadClassification.reason,
                                    )}
                                  />
                                  <DetailRow
                                    label="Recommendation"
                                    value={displayValue(
                                      workloadAssessmentResult.workloadClassification
                                        .recommendation,
                                    )}
                                  />
                                </dl>
                              ) : (
                                <div className="text-sm text-textSecondary">
                                  No sport-specific workload rule is available yet.
                                </div>
                              )}
                            </div>

                            {hasDataQualityWarnings(
                              workloadAssessmentResult,
                              profile?.freshnessStatus ?? null,
                            ) ? (
                              <details className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
                                <summary className="cursor-pointer text-sm font-medium text-textPrimary">
                                  Data Quality & Warnings
                                </summary>
                                <div className="mt-3 space-y-3">
                                  <div className="text-sm text-textSecondary">
                                    Warning: {dataQualitySummary(
                                      workloadAssessmentResult,
                                      profile?.freshnessStatus ?? null,
                                    )}
                                  </div>
                                  <dl className="space-y-2">
                                    {workloadAssessmentResult.assessmentStatus ? (
                                      <DetailRow
                                        label="Assessment Status"
                                        value={displayValue(
                                          workloadAssessmentResult.assessmentStatus,
                                        )}
                                      />
                                    ) : null}
                                    {workloadAssessmentResult.readinessLevel ? (
                                      <DetailRow
                                        label="Readiness Level"
                                        value={displayValue(
                                          workloadAssessmentResult.readinessLevel,
                                        )}
                                      />
                                    ) : null}
                                    {workloadAssessmentResult.workloadFlags !== null ? (
                                      <DetailRow
                                        label="Workload Flags"
                                        value={displayValue(
                                          workloadAssessmentResult.workloadFlags,
                                        )}
                                      />
                                    ) : null}
                                    {workloadAssessmentResult.restrictionSummary ? (
                                      <DetailRow
                                        label="Restriction Summary"
                                        value={displayValue(
                                          workloadAssessmentResult.restrictionSummary,
                                        )}
                                      />
                                    ) : null}
                                    {workloadAssessmentResult.explanation ? (
                                      <DetailRow
                                        label="Explanation"
                                        value={displayValue(
                                          workloadAssessmentResult.explanation,
                                        )}
                                      />
                                    ) : null}
                                    {profile?.freshnessStatus ? (
                                      <DetailRow
                                        label="Freshness Status"
                                        value={displayValue(profile.freshnessStatus)}
                                      />
                                    ) : null}
                                  </dl>

                                  {Object.keys(workloadAssessmentResult.additionalDetails)
                                    .length > 0 ? (
                                    <dl className="space-y-2 border-t border-slate-200 pt-3">
                                      {orderedGroupEntries(
                                        workloadAssessmentResult.additionalDetails,
                                      ).map(([field, value]) => (
                                        <DetailRow
                                          key={field}
                                          label={toFieldLabel(field)}
                                          value={displayValue(value)}
                                        />
                                      ))}
                                    </dl>
                                  ) : null}
                                </div>
                              </details>
                            ) : null}
                          </>
                        ) : workloadAssessmentResult.rawPayloadText ? (
                          <div className="space-y-2">
                            <div className="text-sm text-textSecondary">
                              No recognized workload assessment fields were found. Showing
                              raw response instead.
                            </div>
                            <pre className="overflow-x-auto rounded-md bg-slate-100 p-3 text-xs text-textPrimary">
                              {workloadAssessmentResult.rawPayloadText}
                            </pre>
                          </div>
                        ) : (
                          <div className="text-sm text-textSecondary">
                            Workload assessment completed, but no displayable result was
                            returned.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="text-sm text-textSecondary">
                    No readiness details available.
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="space-y-4 border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-textPrimary">
                Season to Plan Workflow
              </h2>
              <p className="text-sm text-textSecondary">
                Ordered coach workflow for season setup, goals, and plan generation.
              </p>
            </div>

            {setupLoading ? (
              <div className="text-sm text-textSecondary">Loading goals and season setup…</div>
            ) : (
              <div className="space-y-5">
                <section className="space-y-3 rounded-lg border border-slate-200 p-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-textPrimary">
                      Step 1 - Season Calendar
                    </h3>
                    <p className="text-sm text-textSecondary">
                      Create or select a season cycle before phases, goals, and plan generation.
                    </p>
                    <div className="text-sm font-medium text-textPrimary">
                      {isSeasonEditMode ? "Editing Season" : "Create New Season"}
                    </div>
                    {isSeasonEditMode ? (
                      <div className="text-sm text-textSecondary">
                        {selectedSeason?.name ?? "Selected season"} | Season Cycle ID:{" "}
                        {selectedSeason?.id ?? "—"}
                      </div>
                    ) : null}
                  </div>
                  {seasonError ? <Alert variant="danger">{seasonError}</Alert> : null}
                  {seasonSuccess ? <Alert variant="success">{seasonSuccess}</Alert> : null}
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
                      <span className="font-medium">Selected Season</span>
                      <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary"
                        disabled={setupState.seasons.length === 0}
                        value={selectedSeasonCycleId}
                        onChange={(event) => {
                          if (event.target.value === "") {
                            handleStartCreateSeason();
                            return;
                          }
                          setSelectedSeasonCycleId(event.target.value);
                        }}
                      >
                        <option value="">
                          {setupState.seasons.length === 0 ? "No seasons found" : "Select season"}
                        </option>
                        {setupState.seasons.map((season) => (
                          <option key={season.id} value={season.id}>
                            {formatSeasonOptionLabel(season)}
                          </option>
                        ))}
                      </select>
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
                        value={sportCode ?? ""}
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
                      value={seasonReady ? "Ready" : "Needs setup"}
                    />
                    {isSeasonEditMode ? (
                      <DetailRow
                        label="Selected Season Cycle ID"
                        value={displayValue(selectedSeasonCycleId || null)}
                      />
                    ) : null}
                  </dl>
                  {selectedSeason ? (
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <dl className="space-y-2">
                        <DetailRow
                          label="Selected Season Name"
                          value={displayValue(selectedSeason.name)}
                        />
                        <DetailRow
                          label="Selected Season Sport"
                          value={displayValue(selectedSeason.sport)}
                        />
                        <DetailRow
                          label="Selected Season Year"
                          value={displayValue(selectedSeason.year)}
                        />
                        <DetailRow
                          label="Selected Season Start Date"
                          value={displayDate(selectedSeason.startDate)}
                        />
                        <DetailRow
                          label="Selected Season End Date"
                          value={displayDate(selectedSeason.endDate)}
                        />
                      </dl>
                      <div className="pt-2 text-xs text-textMuted">
                        Season Cycle ID: {selectedSeason.id}
                      </div>
                    </div>
                  ) : null}
                  {setupState.seasons.length === 0 ? (
                    <div className="text-sm text-textSecondary">
                      No seasons found. Create one to continue.
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {isSeasonEditMode ? (
                      <>
                        <Button
                          type="button"
                          variant="primary"
                          disabled={
                            seasonSaveLoading ||
                            !selectedSeason ||
                            seasonCreateLoading ||
                            entityId === ""
                          }
                          onClick={() => {
                            void handleSaveSeasonChanges();
                          }}
                        >
                          {seasonSaveLoading
                            ? "Saving Season Changes..."
                            : "Save Season Changes"}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={seasonCreateLoading || seasonSaveLoading}
                          onClick={handleStartCreateSeason}
                        >
                          Create New Season
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        disabled={
                          seasonCreateLoading || seasonSaveLoading || !sportCode || entityId === ""
                        }
                        onClick={() => {
                          void handleCreateMvpSeason();
                        }}
                      >
                        {seasonCreateLoading ? "Creating Season..." : "Create Season"}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={setupLoading || seasonCreateLoading || seasonSaveLoading}
                      onClick={() => {
                        void refreshGoalsSeasonSetup();
                      }}
                    >
                      Refresh
                    </Button>
                  </div>
                </section>

                <section className="space-y-3 rounded-lg border border-slate-200 p-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-textPrimary">
                      Step 2 - Season Phases
                    </h3>
                    <p className="text-sm text-textSecondary">
                      Define sequential phases. The system detects the current phase from today&apos;s
                      date.
                    </p>
                  </div>
                  {phaseError ? <Alert variant="danger">{phaseError}</Alert> : null}
                  {phaseSuccess ? <Alert variant="success">{phaseSuccess}</Alert> : null}
                  <dl className="space-y-2">
                    <DetailRow
                      label="Selected Season Range"
                      value={
                        selectedSeason
                          ? `${displayDate(selectedSeason.startDate)} to ${displayDate(selectedSeason.endDate)}`
                          : "Select a season first"
                      }
                    />
                    <DetailRow
                      label="Detected Current Phase"
                      value={
                        activePhaseForSelectedSeason
                          ? `${displayValue(activePhaseForSelectedSeason.phase)} (${displayValue(activePhaseForSelectedSeason.startDate)} to ${displayValue(activePhaseForSelectedSeason.endDate)})`
                          : "Needs setup"
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
                            className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3"
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
                            {editor.error ? <Alert variant="danger">{editor.error}</Alert> : null}
                            {editor.success ? (
                              <Alert variant="success">{editor.success}</Alert>
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
                                disabled={selectedSeasonCycleId === "" || phaseCreateLoading === phase}
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

                {phaseByType.IN_SEASON ? (
                  <section className="space-y-3 rounded-lg border border-slate-200 p-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-textPrimary">
                        Step 3 - Competition Schedule
                      </h3>
                      <p className="text-sm text-textSecondary">
                        Competition goals become available once In-season exists.
                      </p>
                    </div>
                    <>
                      {competitionError ? <Alert variant="danger">{competitionError}</Alert> : null}
                      {competitionSuccess ? (
                        <Alert variant="success">{competitionSuccess}</Alert>
                      ) : null}
                      {activePhaseForSelectedSeason?.phase === "IN_SEASON" ? (
                        <Alert variant="warning">
                          Current phase is In-season. Competition goals are recommended.
                        </Alert>
                      ) : null}
                      <div className="grid gap-3 md:grid-cols-3">
                        <label className="space-y-1 text-sm text-textPrimary md:col-span-2">
                          <span className="font-medium">Competition name / event id text</span>
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
                          selectedSeasonCycleId === "" ||
                          currentCoachUserId === ""
                        }
                        onClick={() => {
                          void handleCreateCompetitionGoal();
                        }}
                      >
                        {competitionCreateLoading ? "Adding Competition Goal..." : "Add Competition Goal"}
                      </Button>
                      <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                        {competitionGoals.length > 0 ? (
                          competitionGoals.map((goal) => (
                            <div key={goal.goalId} className="text-sm text-textPrimary">
                              {goal.competitionEventId ?? goal.goalId} | {displayValue(goal.targetDate)} |{" "}
                              {displayValue(goal.status)}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-textSecondary">
                            No competition goals found for this season.
                          </div>
                        )}
                      </div>
                    </>
                  </section>
                ) : null}

                <section className="space-y-3 rounded-lg border border-slate-200 p-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-textPrimary">
                      {currentPhaseGoalSectionTitle(currentCoachGenerationDomain)}
                    </h3>
                    <p className="text-sm text-textSecondary">
                      {currentPhaseGoalRequirementLabel(currentCoachGenerationDomain)}
                    </p>
                  </div>
                  {goalError ? <Alert variant="danger">{goalError}</Alert> : null}
                  {goalSuccess ? <Alert variant="success">{goalSuccess}</Alert> : null}
                  {currentCoachUserId === "" ? (
                    <Alert variant="warning">
                      Authenticated coach user ID is required to create goals.
                    </Alert>
                  ) : null}
                  {activePhaseForSelectedSeason ? (
                    <DetailRow
                      label="Detected Current Phase"
                      value={displayValue(activePhaseForSelectedSeason.phase)}
                    />
                  ) : null}
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="space-y-1 text-sm text-textPrimary">
                      <span className="font-medium">
                        {currentPhaseGoalNameLabel(currentCoachGenerationDomain)}
                      </span>
                      <input
                        type="text"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary"
                        value={goalName}
                        onChange={(event) => setGoalName(event.target.value)}
                      />
                    </label>
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
                    <label className="space-y-1 text-sm text-textPrimary">
                      <span className="font-medium">Success Criteria / Measurement</span>
                      <textarea
                        rows={3}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary caret-current placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                        value={goalSuccessCriteria}
                        onChange={(event) => setGoalSuccessCriteria(event.target.value)}
                      />
                    </label>
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
                      selectedSeasonCycleId === "" ||
                      currentCoachUserId === "" ||
                      !activePhaseForSelectedSeason?.phaseId
                    }
                    onClick={() => {
                      void handleCreateCurrentPhaseGoal();
                    }}
                  >
                    {goalCreateLoading ? "Creating Goal..." : "Create Goal"}
                  </Button>
                  <DetailRow
                    label="Selected Goal IDs"
                    value={displayValue(selectedActiveGoals.map((goal) => goal.goalId))}
                  />
                  <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                    {currentPhaseActiveGoals.length > 0 ? (
                      currentPhaseActiveGoals.map((goal) => (
                        <label
                          key={goal.goalId}
                          className="flex items-start gap-2 text-sm text-textPrimary"
                        >
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
                          <span>
                            {displayValue(goal.goalName ?? goal.goalId)} |{" "}
                            {displayValue(goal.status)} | {displayValue(goal.priority)}
                            {goal.successCriteria ? ` | ${displayValue(goal.successCriteria)}` : ""}
                            {goal.targetDate ? ` | ${displayValue(goal.targetDate)}` : ""}
                          </span>
                        </label>
                      ))
                    ) : (
                      <div className="text-sm text-textSecondary">
                        {currentPhaseGoalEmptyState(currentCoachGenerationDomain)}
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-3 rounded-lg border border-slate-200 p-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-textPrimary">
                      Step 5 - Plan Window
                    </h3>
                    <p className="text-sm text-textSecondary">
                      The selected plan window must stay inside the detected current phase.
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="space-y-1 text-sm text-textPrimary">
                      <span className="font-medium">Duration</span>
                      <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary"
                        value={String(durationDays)}
                        onChange={(event) =>
                          setDurationDays(Number(event.target.value) as 7 | 15 | 30)
                        }
                      >
                        <option value="7">7 days</option>
                        <option value="15">15 days</option>
                        <option value="30">30 days</option>
                      </select>
                    </label>
                    <label className="space-y-1 text-sm text-textPrimary">
                      <span className="font-medium">Plan Start Date</span>
                      <input
                        type="date"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary"
                        value={planStartDate}
                        onChange={(event) => setPlanStartDate(event.target.value)}
                      />
                    </label>
                    <div className="space-y-1 text-sm text-textPrimary">
                      <span className="font-medium">Computed End Date</span>
                      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                        {displayValue(planEndDate || null)}
                      </div>
                    </div>
                  </div>
                  {!currentPhaseDetected ? (
                    <Alert variant="warning">
                      Current phase must be detected from season phase dates before the plan window
                      can be validated.
                    </Alert>
                  ) : !planWindowInsideCurrentPhase ? (
                    <Alert variant="danger">
                      Selected plan window crosses the current season phase. Choose a shorter
                      duration or adjust phase dates.
                    </Alert>
                  ) : (
                    <Alert variant="success">Plan window fits inside the detected current phase.</Alert>
                  )}
                </section>

                <section className="space-y-3 rounded-lg border border-slate-200 p-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-textPrimary">
                      Step 6 - Ready to Generate
                    </h3>
                    <p className="text-sm text-textSecondary">
                      Generate stays locked until readiness, season, current phase, goals, and plan
                      window all pass.
                    </p>
                  </div>
                  <dl className="space-y-2">
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
                      value={workloadComplete ? "Yes" : "No"}
                    />
                    <DetailRow label="Season selected" value={seasonReady ? "Yes" : "No"} />
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
                      value={goalsReady ? "Yes" : "No"}
                    />
                  </dl>
                  {generatePlanError ? <Alert variant="danger">{generatePlanError}</Alert> : null}
                  {generatePlanSuccess ? (
                    <Alert variant="success">
                      <div className="space-y-2">
                        <div>Training plan draft generated successfully.</div>
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
                    </Alert>
                  ) : null}
                  {shouldLoadLatestSkillsDraft ? (
                    latestSkillsDraftError ? (
                      <Alert variant="danger">{latestSkillsDraftError}</Alert>
                    ) : latestSkillsDraftMissing ? (
                      <div className="text-sm text-textSecondary">
                        No generated skills draft found yet.
                      </div>
                    ) : latestSkillsDraft ? (
                      <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
                        <h4 className="text-sm font-semibold text-textPrimary">
                          Latest Generated Skills Draft
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
                        {latestSkillsDraft.revision ? (
                          <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                            <h5 className="text-sm font-semibold text-textPrimary">
                              Revision Summary
                            </h5>
                            {hasRenderableValue(latestSkillsDraft.revision.feedback) ? (
                              <div className="space-y-1 text-sm text-textPrimary">
                                <div className="font-medium">Coach Feedback:</div>
                                <div className="whitespace-pre-wrap text-textSecondary">
                                  {displayValue(latestSkillsDraft.revision.feedback)}
                                </div>
                              </div>
                            ) : null}
                            {latestSkillsDraft.revision.changeSummary.length > 0 ? (
                              <div className="space-y-1 text-sm text-textPrimary">
                                <div className="font-medium">Changes Applied:</div>
                                <ul className="list-disc space-y-1 pl-5 text-textSecondary">
                                  {latestSkillsDraft.revision.changeSummary.map((item, index) => (
                                    <li key={`${item}-${index}`}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        <div className="space-y-3">
                          {sortedLatestSkillsDraftDays.map((day, dayOffset) => (
                            <div
                              key={`${day.dayIndex ?? dayOffset}-${day.date ?? "day"}`}
                              className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3"
                            >
                              <div className="text-sm font-semibold text-textPrimary">
                                {`Day ${day.dayIndex ?? dayOffset + 1}`}
                              </div>
                              <dl className="space-y-1">
                                {hasRenderableValue(day.date) ? (
                                  <DetailRow label="Date" value={displayValue(day.date)} />
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
                              {day.sessions.map((session, sessionOffset) => (
                                <div
                                  key={`${session.sessionIndex ?? sessionOffset}-${session.title ?? "session"}`}
                                  className="space-y-2 rounded-md border border-slate-200 bg-white p-3"
                                >
                                  <dl className="space-y-1">
                                    {hasRenderableValue(session.title) ? (
                                      <DetailRow
                                        label="Title"
                                        value={displayValue(session.title)}
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
                                  {session.items.map((item, itemOffset) => (
                                    <div
                                      key={`${item.label ?? item.summary ?? "item"}-${itemOffset}`}
                                      className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-3"
                                    >
                                      <dl className="space-y-1">
                                        {hasRenderableValue(item.label) ? (
                                          <DetailRow
                                            label="Label"
                                            value={displayValue(item.label)}
                                          />
                                        ) : null}
                                        {hasRenderableValue(item.summary) ? (
                                          <DetailRow
                                            label="Summary"
                                            value={displayValue(item.summary)}
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
                                        {hasRenderableValue(item.notes) ? (
                                          <DetailRow
                                            label="Notes"
                                            value={displayValue(item.notes)}
                                          />
                                        ) : null}
                                      </dl>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                          <h5 className="text-sm font-semibold text-textPrimary">
                            Revise Skills Plan
                          </h5>
                          {reviseSkillsError ? (
                            <Alert variant="danger">{reviseSkillsError}</Alert>
                          ) : null}
                          {reviseSkillsSuccess ? (
                            <Alert variant="success">{reviseSkillsSuccess}</Alert>
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
                            disabled={
                              reviseSkillsLoading ||
                              !latestSkillsDraft.trainingPlanId ||
                              !latestSkillsDraft.trainingPlanVersionId
                            }
                            onClick={() => {
                              void handleReviseSkillsPlan();
                            }}
                          >
                            {reviseSkillsLoading ? "Revising plan..." : "Revise Plan"}
                          </Button>
                        </div>
                      </div>
                    ) : null
                  ) : null}
                  {allowedGenerationDomains.length === 0 ? (
                    <div className="text-sm text-textSecondary">
                      You do not currently have a generation function assigned.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {allowedGenerationDomains.map((domain) => (
                        <Button
                          key={domain}
                          type="button"
                          variant="primary"
                          disabled={
                            readinessLoading ||
                            workloadAssessmentLoading ||
                            generatePlanLoading ||
                            !seasonReady ||
                            !goalsReady ||
                            !currentPhaseDetected ||
                            !planWindowInsideCurrentPhase ||
                            !canGenerateTrainingPlan({
                              appCompleteness: readinessPanel.appCompleteness,
                              validationStatus: readinessPanel.validationStatus,
                              planningEligibility: readinessPanel.planningEligibility,
                              workloadClassificationExists: workloadComplete,
                            })
                          }
                          onClick={() => {
                            void handleGenerateTrainingPlan(domain);
                          }}
                        >
                          {generatePlanLoading
                            ? generatePlanPhase === "persisting"
                              ? "Saving draft..."
                              : "Generating plan..."
                            : generationButtonLabel(domain)}
                        </Button>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </Card>

          <DashboardCardShell title="Planning Status">
            <dl className="space-y-2">
              <DetailRow
                label="Completeness Status"
                value={displayValue(profile.completenessStatus)}
              />
              <DetailRow
                label="Freshness Status"
                value={displayValue(profile.freshnessStatus)}
              />
              <DetailRow
                label="Planning Eligibility"
                value={displayValue(profile.planningEligibilityStatus)}
              />
              <DetailRow label="Stage" value={displayValue(profile.stage)} />
              <DetailRow label="Revision" value={displayValue(profile.revision)} />
              <DetailRow
                label="Last Confirmed At"
                value={displayDate(profile.lastConfirmedAt)}
              />
              <DetailRow label="Updated At" value={displayDate(profile.updatedAt)} />
            </dl>
          </DashboardCardShell>

          <DashboardCardShell title="Derived Values">
            <dl className="space-y-2">
              <DetailRow label="Derived Age" value={displayValue(profile.derivedAge)} />
              <DetailRow label="Derived BMI" value={displayValue(profile.derivedBmi)} />
            </dl>
          </DashboardCardShell>

          <DashboardCardShell title="Athlete Planning Fields">
            <dl className="space-y-2">
              <DetailRow label="Date of Birth" value={displayDate(profile.dateOfBirth)} />
              <DetailRow label="Sex" value={displayValue(profile.sex)} />
              <DetailRow label="Primary Sport" value={displayValue(profile.primarySport)} />
              <DetailRow
                label="Discipline / Event"
                value={displayValue(profile.disciplineOrEvent)}
              />
              <DetailRow
                label="Self-Reported Level"
                value={displayValue(profile.selfReportedLevel)}
              />
              <DetailRow
                label="Validated Level"
                value={displayValue(profile.validatedLevel)}
              />
              <DetailRow
                label="Training Age Years"
                value={displayValue(profile.trainingAgeYears)}
              />
              <DetailRow
                label="Weekly Training Exposure Hours"
                value={displayValue(profile.currentWeeklyTrainingExposureHours)}
              />
              <DetailRow
                label="Weekly Availability Days"
                value={displayValue(profile.weeklyAvailabilityDays)}
              />
              <DetailRow
                label="Weekly Availability Hours"
                value={displayValue(profile.weeklyAvailabilityHours)}
              />
              <DetailRow label="Diet Type" value={displayValue(profile.dietType)} />
              <DetailRow
                label="Regional Cuisine Preference"
                value={displayValue(profile.regionalCuisinePreference)}
              />
              <DetailRow
                label="Allergies / Intolerances"
                value={displayValue(profile.allergiesOrIntolerances)}
              />
              <DetailRow label="Height (cm)" value={displayValue(profile.heightCm)} />
              <DetailRow label="Weight (kg)" value={displayValue(profile.weightKg)} />
              <DetailRow
                label="Uses Wearable"
                value={displayValue(profile.wearableStatus)}
              />
              <DetailRow
                label="Wearable Provider"
                value={displayValue(profile.wearableProvider)}
              />
              <DetailRow label="Device Model" value={displayValue(profile.deviceModel)} />
              <DetailRow label="Last Sync At" value={displayDate(profile.lastSyncAt)} />
              <DetailRow
                label="Avg Resting Heart Rate"
                value={displayValue(profile.avgRestingHeartRate)}
              />
              <DetailRow
                label="Avg Sleep Duration (hours)"
                value={displayValue(profile.avgSleepDurationHours)}
              />
              <DetailRow
                label="Avg Daily Activity Volume"
                value={displayValue(profile.avgDailyActivityVolume)}
              />
              <DetailRow
                label="Recent Activity Days Count"
                value={displayValue(profile.recentActivityDaysCount)}
              />
              <DetailRow
                label="Wearable Data Quality"
                value={displayValue(profile.wearableDataQuality)}
              />
            </dl>
          </DashboardCardShell>

          <DetailGroupCard
            title="Blood Report Parameters"
            group={profile.bloodReportParameters}
            preferredOrder={[
              "hemoglobin",
              "vitaminD",
              "vitaminB12",
              "ferritin",
              "crp",
              "fastingBloodGlucoseFBS",
              "postprandialBloodGlucosePPBS",
            ]}
          />

          <DetailGroupCard
            title="Body Composition Parameters"
            group={profile.bodyCompositionParameters}
            preferredOrder={[
              "bodyFatPercent",
              "skeletalLeanMassKg",
              "skeletalFatMassKg",
              "visceralFatLevel",
              "visceralFatArea",
              "bmrKcalDay",
              "muscleMassKg",
            ]}
          />

          <DetailGroupCard
            title="Blood Report Comparisons"
            group={profile.bloodReportComparisons}
          />

          <DetailGroupCard
            title="Body Composition Comparisons"
            group={profile.bodyCompositionComparisons}
          />
        </>
      ) : null}
    </div>
  );
}
