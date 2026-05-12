"use client";

import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { GoalDisplayBlock } from "@/components/goals/GoalDisplayBlock";
import { CoachAthleteLevelValidationModal } from "@/components/dashboard/coach/CoachAthleteLevelValidationModal";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
  createSeasonCycle,
  createSeasonCyclePhase,
  fetchGoalsForAthlete,
  fetchSeasonCyclePhases,
  fetchSeasonCyclesForEntity,
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
  fetchCoachAthleteUpstreamPlanningContext,
  fetchLatestCoachAthleteDomainDraft,
  fetchPersistedTrainingPlanActiveDetail,
  fetchCoachAthleteTrainingPlanCompleteness,
  fetchCoachAthleteTrainingPlanReadiness,
  fetchCoachAthleteTrainingPlanWorkloadAssessment,
  fetchCoachAthleteTrainingPlanWorkloadAssessmentLatest,
  headApproveTrainingPlanVersion,
  persistCoachAthleteTrainingPlanDraft,
  persistDraftResultFromLatestDomainDraft,
  requestTrainingPlanRevision,
  releaseTrainingPlanVersionToAthlete,
  reviseCoachAthleteSandCTrainingPlan,
  reviseCoachAthleteSkillsTrainingPlan,
  reviseNutritionPlan,
  submitTrainingPlanVersionForReview,
  type CoachAthleteTrainingPlanCompleteness,
  type CoachAthleteTrainingPlanExecuteResult,
  type CoachAthleteLatestDomainDraft,
  type CoachPersistedTrainingPlanActiveDetail,
  type GovernedTrainingPlanWorkflowAction,
  type CoachAthleteTrainingPlanPersistDraftResult,
  type CoachAthleteTrainingPlanReadiness,
  type TrainingPlanGenerationDomain,
  type CoachAthleteTrainingPlanWorkloadAssessment,
  type CoachAthleteUpstreamPlanningContext,
} from "@/lib/api/coachAthletePlanningReadiness";
import { isNormalizedApiError } from "@/lib/apiClient";
import {
  formatDateOnly,
  formatDateRange,
  formatDateWithWeekday,
  formatPlanningProfileDateDisplay,
} from "@/lib/dateTime";
import { formatEnumeratedLabel, toTitleCaseInput } from "@/lib/textFormat";
import {
  canCoachValidateLevel,
  currentCoachHasSkillsFunction,
  currentCoachIsHeadCoach,
  normalizeCoachFunctionValue,
} from "@/lib/coachAuthority";
import { planningProfileHrefForAthlete } from "@/lib/coachTrainingPlanActions";
import type { TrainingPlanLevelValidationView } from "@/types/trainingPlanLevelValidation";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type MutableRefObject,
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

function renderRevisionSummary(
  draft: CoachAthleteLatestDomainDraft | null,
): ReactElement | null {
  if (!draft?.revision) return null;

  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <h5 className="text-sm font-semibold text-textPrimary">Revision Summary</h5>
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
    <DashboardCardShell accent={false} title={title}>
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

type GuidedWorkflowStepKey =
  | "context-app"
  | "level-validation"
  | "workload"
  | "season-goals"
  | "plan-dates"
  | "generate";

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

/** Ordered workflow steps for rail / tabs only */
const WORKFLOW_STEP_SEQUENCE_LIST: GuidedWorkflowStepKey[] = [
  "context-app",
  "level-validation",
  "workload",
  "season-goals",
  "plan-dates",
  "generate",
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

function TrainingPlanWorkflowProgressRail({
  steps,
}: {
  steps: GuidedWorkflowUiStep[];
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
          const railLine = WORKFLOW_RAIL_LABELS[step.key] ?? step.title;
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
                  className={`text-sm font-semibold ${
                    step.status === "active" ? "text-primary" : "text-textPrimary"
                  }`}
                >
                  {displayTitle}
                </div>
                <div
                  className={`mt-1 flex flex-wrap items-center justify-center gap-1 text-xs ${
                    step.status === "active"
                      ? "font-semibold text-primary"
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

function workflowStripTabHeading(step: GuidedWorkflowUiStep, index: number): ReactElement {
  const baseTitle = WORKFLOW_TAB_LABELS[step.key] ?? step.title;
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
}: {
  selectedTab: GuidedWorkflowStepKey;
  steps: GuidedWorkflowUiStep[];
  onSelect: (tab: GuidedWorkflowStepKey) => void;
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
              "z-[3] cursor-pointer bg-white font-semibold text-textPrimary",
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
              "cursor-pointer border border-primary/40 bg-white text-textPrimary",
              "enabled:hover:bg-primaryLight/35",
              "shadow-none ring-0",
              inactiveBottomBand,
            ].join(" ");
          }

          const heading = workflowStripTabHeading(step, index);

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
  onProceedToGenerate,
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
  onProceedToGenerate: () => void;
}) {
  const durationLocked =
    currentCoachGenerationDomain === "S_AND_C" ||
    currentCoachGenerationDomain === "NUTRITION";

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        {planSeasonBoundsUi === "invalid" ? (
          <Alert variant="danger">Plan dates must be within the selected season.</Alert>
        ) : planSeasonBoundsUi === "valid" ? (
          <WorkflowNeutralNotice>
            Plan dates are within the selected season.
          </WorkflowNeutralNotice>
        ) : null}

        {!currentPhaseDetected ? (
          <Alert variant="warning">
            Current phase must be detected from season phase dates before the plan window can be
            validated.
          </Alert>
        ) : !planWindowInsideCurrentPhase ? (
          <Alert variant="danger">
            Selected plan window crosses the current season phase. Choose a shorter duration or
            adjust phase dates.
          </Alert>
        ) : (
          <WorkflowNeutralNotice>
            Plan window fits inside the detected current phase.
          </WorkflowNeutralNotice>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-4 text-sm font-semibold text-textPrimary">Plan Duration</div>
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
          <p className="mt-3 text-xs leading-relaxed text-textMuted">
            Currently only 7-day plans are supported.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-4 text-sm font-semibold text-textPrimary">Start Date</div>
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
          <dl className="mt-5 space-y-2 border-border border-dashed border-t pt-5 text-xs text-textSecondary">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
              <dt className="font-medium text-textMuted">Computed end date</dt>
              <dd className="text-sm font-medium text-textPrimary">
                {formatDateOnly(planEndDate, "—")}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="space-y-5 border-border border-t pt-8">
        <p className="text-center text-sm font-semibold text-primary">
          Next: confirm plan dates, then open Generate Plan (or go there directly).
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="secondary"
            className="min-w-[14rem] px-8 py-3 text-base font-semibold shadow-sm"
            disabled={!planDatesProceedEnabled || planDatesConfirmedForCurrentAthlete}
            onClick={() => onConfirmPlanDates()}
          >
            {planDatesConfirmedForCurrentAthlete ? "Plan Dates Confirmed" : "Confirm Plan Dates"}
          </Button>
          <Button
            type="button"
            variant="primary"
            className="min-w-[14rem] px-8 py-3 text-base font-semibold shadow-sm"
            disabled={!planDatesProceedEnabled}
            onClick={() => onProceedToGenerate()}
          >
            Proceed to Generate
          </Button>
        </div>
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
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100">
            <Check className="h-4 w-4 text-primary" strokeWidth={2.6} aria-hidden="true" />
          </span>
          <h3 className="text-sm font-semibold text-textPrimary">{title}</h3>
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
        <h3 className="text-sm font-semibold text-slate-500">{title}</h3>
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

function governedPlanActionButtonLabel(
  action: GovernedTrainingPlanWorkflowAction,
): string {
  if (action === "SUBMIT_REVIEW") return "Submit Review";
  if (action === "HEAD_APPROVE") return "Approve Plan";
  if (action === "REQUEST_REVISION") return "Request Revision";
  return "Release to Athlete";
}

function governedPlanActionSuccessMessage(
  action: GovernedTrainingPlanWorkflowAction,
): string {
  if (action === "SUBMIT_REVIEW") return "Training plan submitted for review.";
  if (action === "HEAD_APPROVE") return "Training plan approved.";
  if (action === "REQUEST_REVISION") return "Revision requested successfully.";
  return "Training plan released to athlete.";
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

function hasReadinessContent(input: {
  readinessStatus: string | null;
  appCompleteness: string | null;
  validationStatus: string | null;
  validatedLevel: string | null;
  planningEligibility: string | null;
  isReady: boolean | null;
  canGenerate: boolean | null;
  blockers: string[];
  missingRequiredFields: string[];
  completenessStatus: string | null;
  completenessSummary: string | null;
}): boolean {
  return (
    input.readinessStatus !== null ||
    input.appCompleteness !== null ||
    input.validationStatus !== null ||
    input.validatedLevel !== null ||
    input.planningEligibility !== null ||
    input.isReady !== null ||
    input.canGenerate !== null ||
    input.blockers.length > 0 ||
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
  return `Backend readiness blockers: ${blockers.join(", ")}`;
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
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-textPrimary">Step 3 — Workload Assessment</h3>
        <p className="text-sm text-textSecondary">
          Review the workload assessment before Season & Goals and Plan Dates.
        </p>
      </div>

      {workloadAssessmentLoading ? (
        <div
          className="flex flex-wrap items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 py-3 text-sm font-medium text-textPrimary"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" aria-hidden />
          Running workload assessment...
        </div>
      ) : null}

      {transientCompletionVisible ? (
        <div
          className="space-y-3 rounded-md border border-emerald-200/90 bg-emerald-50 px-4 py-4 text-textPrimary"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-emerald-900">
            <Check className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
            Workload Assessment Complete
          </div>
          <div className="space-y-1 border-t border-emerald-200/80 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/90">
              Training Load Status
            </p>
            <p className="text-base font-semibold text-emerald-950">
              {displayValue(workloadAssessmentResult.workloadClassification?.status)}
            </p>
          </div>
        </div>
      ) : null}

      {!transientCompletionVisible &&
      workloadAssessmentLoading === false &&
      !workloadAssessmentResult &&
      showValidateLevel ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-primary">
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
        <Alert variant="danger">{workloadAssessmentError}</Alert>
      ) : null}

      {workloadAssessmentResult &&
      !(workloadComplete && showWorkloadCompletionState) ? (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h4 className="text-sm font-semibold text-textPrimary">Workload Assessment Result</h4>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-textSecondary">
              {workloadAssessmentResult.workloadClassification?.status
                ? displayValue(workloadAssessmentResult.workloadClassification.status)
                : "Pending"}
            </span>
          </div>
          {hasWorkloadAssessmentResult(workloadAssessmentResult) ? (
            <>
              <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
                <h5 className="text-sm font-semibold text-textPrimary">Training Load Classification</h5>
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

function executionBlockedMessage(result: CoachAthleteTrainingPlanExecuteResult): string | null {
  if (result.executionDecision?.executed !== false) return null;
  const missingRequirements = result.completenessDecision?.missingRequirements ?? [];
  const hasGoals = missingRequirements.includes("goalsDefined");
  const hasSeason = missingRequirements.includes("seasonDefined");

  if (hasGoals && hasSeason) {
    return "Training plan cannot be generated until Goals and Season are configured.";
  }
  if (hasGoals) {
    return "Training plan cannot be generated until Goals are configured.";
  }
  if (hasSeason) {
    return "Training plan cannot be generated until Season is configured.";
  }
  return (
    result.executionDecision.reason?.trim() ||
    (missingRequirements.length > 0
      ? `Training plan generation was blocked: ${missingRequirements.join(", ")}`
      : "Training plan generation was blocked.")
  );
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

function resolveGeneratePlanLocalError(input: {
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

function draftSessionTitleLabel(domain: TrainingPlanGenerationDomain | null | undefined): string {
  return domain === "NUTRITION" ? "Meal Slot" : "Title";
}

function draftItemLabel(domain: TrainingPlanGenerationDomain | null | undefined): string {
  return domain === "NUTRITION" ? "Meal / Food Item" : "Label";
}

function nutritionStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "BELOW_TARGET":
      return "Below target";
    case "WITHIN_TARGET":
      return "Within target";
    case "ABOVE_TARGET":
      return "Above target";
    case "PARTIAL":
      return "Partial data";
    case "UNKNOWN":
      return "Unknown";
    default: {
      const s = status?.trim();
      return s ? toTitleCaseInput(s) : "Unavailable";
    }
  }
}

function formatCalories(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Unavailable";
  return `${String(value)} kcal`;
}

function formatGramValue(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Unavailable";
  return `${String(value)} g`;
}

function formatCalorieRange(min: number | null | undefined, max: number | null | undefined): string {
  if (
    typeof min !== "number" ||
    !Number.isFinite(min) ||
    typeof max !== "number" ||
    !Number.isFinite(max)
  ) {
    return "Unavailable";
  }
  return `${String(min)}-${String(max)} kcal`;
}

function formatGramRange(min: number | null | undefined, max: number | null | undefined): string {
  if (
    typeof min !== "number" ||
    !Number.isFinite(min) ||
    typeof max !== "number" ||
    !Number.isFinite(max)
  ) {
    return "Unavailable";
  }
  return `${String(min)}-${String(max)} g`;
}

function formatMacroSummaryLine(
  estimated: number | null | undefined,
  min: number | null | undefined,
  max: number | null | undefined,
): string {
  return `${formatGramValue(estimated)} / ${formatGramRange(min, max)}`;
}

function renderNutritionDaySummary(
  day: CoachAthleteLatestDomainDraft["days"][number],
): ReactElement | null {
  const hasEstimate = typeof day.estimatedDailyCalories === "number";
  const hasTargetRange =
    typeof day.targetCalorieMin === "number" && typeof day.targetCalorieMax === "number";
  const calorieStatusLabel = nutritionStatusLabel(day.calorieAdequacyStatus);
  const macroStatusLabel = nutritionStatusLabel(day.macroAdequacyStatus);
  const hasMacroData =
    day.estimatedCarbohydrateGrams !== null ||
    day.targetCarbohydrateMinGrams !== null ||
    day.targetCarbohydrateMaxGrams !== null ||
    day.estimatedProteinGrams !== null ||
    day.targetProteinMinGrams !== null ||
    day.targetProteinMaxGrams !== null ||
    day.estimatedFatGrams !== null ||
    day.targetFatMinGrams !== null ||
    day.targetFatMaxGrams !== null ||
    day.estimatedFiberGrams !== null ||
    day.targetFiberMinGrams !== null ||
    day.targetFiberMaxGrams !== null ||
    macroStatusLabel !== "Unavailable";

  if (
    !hasEstimate &&
    !hasTargetRange &&
    calorieStatusLabel === "Unavailable" &&
    !hasMacroData
  ) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1 rounded-md border border-slate-200 bg-white p-3">
        <div className="text-sm font-medium text-textPrimary">Daily Calorie Adequacy</div>
        <div className="text-sm text-textSecondary">
          {`Target calories: ${formatCalorieRange(day.targetCalorieMin, day.targetCalorieMax)}`}
        </div>
        <div className="text-sm text-textSecondary">
          {`Plan estimate: ${formatCalories(day.estimatedDailyCalories)}`}
        </div>
        <div className="text-sm text-textSecondary">{`Status: ${calorieStatusLabel}`}</div>
        {calorieStatusLabel === "Unknown" ? (
          <div className="text-sm text-textSecondary">
            Calorie target unavailable — missing athlete metrics.
          </div>
        ) : null}
      </div>
      {hasMacroData ? (
        <div className="space-y-1 rounded-md border border-slate-200 bg-white p-3">
          <div className="text-sm font-medium text-textPrimary">Daily Macro Summary</div>
          <div className="text-sm text-textSecondary">
            {`Carbs: ${formatMacroSummaryLine(
              day.estimatedCarbohydrateGrams,
              day.targetCarbohydrateMinGrams,
              day.targetCarbohydrateMaxGrams,
            )}`}
          </div>
          <div className="text-sm text-textSecondary">
            {`Protein: ${formatMacroSummaryLine(
              day.estimatedProteinGrams,
              day.targetProteinMinGrams,
              day.targetProteinMaxGrams,
            )}`}
          </div>
          <div className="text-sm text-textSecondary">
            {`Fat: ${formatMacroSummaryLine(
              day.estimatedFatGrams,
              day.targetFatMinGrams,
              day.targetFatMaxGrams,
            )}`}
          </div>
          <div className="text-sm text-textSecondary">
            {`Fiber: ${formatMacroSummaryLine(
              day.estimatedFiberGrams,
              day.targetFiberMinGrams,
              day.targetFiberMaxGrams,
            )}`}
          </div>
          <div className="text-sm text-textSecondary">{`Status: ${macroStatusLabel}`}</div>
        </div>
      ) : null}
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessContext, accessGateReady } = useAuth();
  const entityId = useMemo(
    () => accessContext?.academy.trainingEntityId?.trim() ?? "",
    [accessContext],
  );
  const currentCoachUserId = accessContext?.user.userId?.trim() ?? "";
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
  const requestedPlanId = workflowRequestedPlanId;

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
  const [readinessLoading, setReadinessLoading] = useState(true);
  const [readinessError, setReadinessError] = useState<string | null>(null);
  const [readinessSources, setReadinessSources] = useState<PlanningReadinessSources>({
    levelValidation: null,
    readiness: null,
    completeness: null,
  });
  const [levelValidationModalOpen, setLevelValidationModalOpen] = useState(false);
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
  const latestSkillsDraftRequestGenRef = useRef(0);
  const [generatePlanLoading, setGeneratePlanLoading] = useState(false);
  const [generatePlanPhase, setGeneratePlanPhase] = useState<
    "idle" | "executing" | "persisting"
  >("idle");
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
  const [latestSkillsDraftMissing, setLatestSkillsDraftMissing] = useState(false);
  const [latestSkillsDraftError, setLatestSkillsDraftError] = useState<string | null>(null);
  const [upstreamPlanningContext, setUpstreamPlanningContext] =
    useState<CoachAthleteUpstreamPlanningContext | null>(null);
  const [upstreamPlanningContextLoading, setUpstreamPlanningContextLoading] = useState(false);
  const [upstreamPlanningContextError, setUpstreamPlanningContextError] =
    useState<string | null>(null);
  const [persistedSkillsPlanLoading, setPersistedSkillsPlanLoading] = useState(false);
  const [persistedSkillsPlanError, setPersistedSkillsPlanError] = useState<string | null>(
    null,
  );
  const [persistedSkillsPlanDetail, setPersistedSkillsPlanDetail] =
    useState<CoachPersistedTrainingPlanActiveDetail | null>(null);
  /**
   * Active/detail may omit `generationDomain`; keep the verified request domain so governed actions
   * can still render and post back using the same backend contract.
   */
  const [persistedVerifiedDomain, setPersistedVerifiedDomain] =
    useState<TrainingPlanGenerationDomain | null>(null);
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
  const [showRequestRevisionForm, setShowRequestRevisionForm] = useState(false);
  const [requestRevisionFeedback, setRequestRevisionFeedback] = useState("");
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
  });
  const readinessGenerationDomain = useMemo<TrainingPlanGenerationDomain>(
    () => deriveGenerationDomains(setupState.coachFunctions)[0] ?? "SKILLS",
    [setupState.coachFunctions],
  );
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
        setGeneratePlanLoading(false);
        setGeneratePlanPhase("idle");
        setGeneratePlanSuccess(null);
        setGeneratePlanSuccessDomain(null);
        setGeneratePlanRecoveryMessage(null);
        setReadinessLoading(false);
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
      setGeneratePlanLoading(false);
      setGeneratePlanPhase("idle");
      setGeneratePlanSuccess(null);
      setGeneratePlanSuccessDomain(null);
      setGeneratePlanRecoveryMessage(null);

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
  ]);

  /** GET persisted workload snapshot only (`/latest`); run endpoint stays user-initiated. */
  useEffect(() => {
    if (!accessGateReady || entityId === "" || athleteIdTrimmed === "") return;
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
  ]);

  const refreshProfileAndReadinessAfterLevelValidation =
    useCallback(async () => {
      const planIdAtInvocation = requestedPlanId;
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
      setGeneratePlanLoading(false);
      setGeneratePlanPhase("idle");
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
        if (planIdAtInvocation === null) {
          setSelectedWorkflowTab("workload");
        }
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
      requestedPlanId,
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
  const activeGoals = useMemo(
    () => setupState.goals.filter((goal) => goal.status === "ACTIVE"),
    [setupState.goals],
  );
  const allowedGenerationDomains = useMemo(
    () => deriveGenerationDomains(setupState.coachFunctions),
    [setupState.coachFunctions],
  );
  /**
   * Single-domain Nutrition or S&C coaches consume upstream planning read-only; they do not own
   * workload / season / plan-dates steps.
   */
  const isDownstreamDomainCoach = useMemo(
    () =>
      allowedGenerationDomains.length === 1 &&
      (allowedGenerationDomains[0] === "NUTRITION" ||
        allowedGenerationDomains[0] === "S_AND_C"),
    [allowedGenerationDomains],
  );
  /**
   * Planning owner: Head Coach when the academy head-coach gate is on; otherwise any coach with a
   * Skills function. Downstream-only coaches are never owners.
   */
  const isPlanningOwnerCoach = useMemo(() => {
    if (isDownstreamDomainCoach) return false;
    if (setupState.hasHeadCoachConfigured) {
      return (
        currentCoachIsHeadCoach(setupState.academyCoachRole) ||
        currentCoachHasSkillsFunction(setupState.coachFunctions)
      );
    }
    return currentCoachHasSkillsFunction(setupState.coachFunctions);
  }, [
    isDownstreamDomainCoach,
    setupState.academyCoachRole,
    setupState.coachFunctions,
    setupState.hasHeadCoachConfigured,
  ]);
  /** Primary assigned generation domain for this coach; null means no mapped generation function. */
  const currentCoachGenerationDomain = useMemo(
    (): TrainingPlanGenerationDomain | null => allowedGenerationDomains[0] ?? null,
    [allowedGenerationDomains],
  );
  const effectiveCoachGenerationDomain =
    currentCoachGenerationDomain ?? readinessGenerationDomain;
  const persistedPlanQueryDomain = useMemo<TrainingPlanGenerationDomain | null>(() => {
    if (currentCoachGenerationDomain !== null) {
      return currentCoachGenerationDomain;
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

  const appStepComplete = readinessPanel.appCompleteness === "COMPLETE";
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
  /**
   * Step 6 Workflow Actions: plan id resolution order (persisted detail → latest draft →
   * generate result → URL query), with each source constrained to the current coach domain.
   */
  const resolvedWorkflowPlanId = useMemo(() => {
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
    if (isDownstreamDomainCoach) return "";
    return urlPlanCandidate?.trim() ?? "";
  }, [
    currentCoachGenerationDomain,
    generatePlanSuccess?.trainingPlanId,
    generateResultMatchesCurrentDomain,
    isDownstreamDomainCoach,
    latestDraftMatchesCurrentDomain,
    latestSkillsDraft?.trainingPlanId,
    persistedDetailMatchesCurrentDomain,
    persistedSkillsPlanDetail?.plan.id,
    urlPlanCandidate,
  ]);
  /**
   * Step 6 Workflow Actions: domain for active/detail (detail field → verified request domain →
   * latest draft domain → domain used for domain-drafts/latest → readiness fallback).
   */
  const resolvedWorkflowGenerationDomain = useMemo((): TrainingPlanGenerationDomain => {
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
    latestDraftDomain,
    persistedDetailDomain,
    readinessGenerationDomain,
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
  const persistedGovernedPlanDomain = useMemo<TrainingPlanGenerationDomain | null>(
    () => {
      if (currentCoachGenerationDomain !== null) {
        return persistedDetailMatchesCurrentDomain ? currentCoachGenerationDomain : null;
      }
      return persistedDetailDomain ?? persistedPlanQueryDomain;
    },
    [
      currentCoachGenerationDomain,
      persistedDetailDomain,
      persistedDetailMatchesCurrentDomain,
      persistedPlanQueryDomain,
    ],
  );
  const persistedGovernedPlanContext = useMemo(() => {
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
    persistedGovernedPlanDomain,
    persistedSkillsPlanDetail?.plan.id,
    persistedSkillsPlanDetail?.version.id,
  ]);
  const persistedGovernedAllowedActions = useMemo(
    () => new Set(persistedSkillsPlanDetail?.allowedActions ?? []),
    [persistedSkillsPlanDetail?.allowedActions],
  );
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
  const skillsReviseIds = useMemo(() => {
    const persistedPlanIdRaw = persistedSkillsPlanDetail?.plan?.id ?? null;
    const persistedPlanId =
      typeof persistedPlanIdRaw === "string"
        ? persistedPlanIdRaw.trim()
        : persistedPlanIdRaw !== null && persistedPlanIdRaw !== undefined
          ? String(persistedPlanIdRaw).trim()
          : "";
    const persistedVersionIdRaw = persistedSkillsPlanDetail?.version?.id ?? null;
    const persistedVersionId =
      typeof persistedVersionIdRaw === "string"
        ? persistedVersionIdRaw.trim()
        : persistedVersionIdRaw !== null && persistedVersionIdRaw !== undefined
          ? String(persistedVersionIdRaw).trim()
          : "";
    const isViewingPersistedSkills =
      requestedPlanId !== null &&
      persistedPlanDisplayDomain === "SKILLS" &&
      persistedPlanId !== "" &&
      requestedPlanId.trim() === persistedPlanId;

    if (isViewingPersistedSkills && persistedVersionId !== "") {
      return {
        trainingPlanId: persistedPlanId,
        versionId: persistedVersionId,
      };
    }

    const draftPlanId = latestSkillsDraft?.trainingPlanId?.trim() ?? "";
    const draftVersionId = latestSkillsDraft?.trainingPlanVersionId?.trim() ?? "";
    if (draftPlanId !== "" && draftVersionId !== "") {
      return { trainingPlanId: draftPlanId, versionId: draftVersionId };
    }

    if (
      persistedPlanDisplayDomain === "SKILLS" &&
      persistedPlanId !== "" &&
      persistedVersionId !== ""
    ) {
      return { trainingPlanId: persistedPlanId, versionId: persistedVersionId };
    }

    return null;
  }, [
    latestSkillsDraft?.trainingPlanId,
    latestSkillsDraft?.trainingPlanVersionId,
    persistedPlanDisplayDomain,
    persistedSkillsPlanDetail?.plan?.id,
    persistedSkillsPlanDetail?.version?.id,
    requestedPlanId,
  ]);
  const nutritionReviseIds = useMemo(() => {
    const persistedPlanIdRaw = persistedSkillsPlanDetail?.plan?.id ?? null;
    const persistedPlanId =
      typeof persistedPlanIdRaw === "string"
        ? persistedPlanIdRaw.trim()
        : persistedPlanIdRaw !== null && persistedPlanIdRaw !== undefined
          ? String(persistedPlanIdRaw).trim()
          : "";
    const persistedVersionIdRaw = persistedSkillsPlanDetail?.version?.id ?? null;
    const persistedVersionId =
      typeof persistedVersionIdRaw === "string"
        ? persistedVersionIdRaw.trim()
        : persistedVersionIdRaw !== null && persistedVersionIdRaw !== undefined
          ? String(persistedVersionIdRaw).trim()
          : "";
    const isViewingPersistedNutrition =
      requestedPlanId !== null &&
      persistedPlanDisplayDomain === "NUTRITION" &&
      persistedPlanId !== "" &&
      requestedPlanId.trim() === persistedPlanId;

    if (isViewingPersistedNutrition && persistedVersionId !== "") {
      return {
        trainingPlanId: persistedPlanId,
        versionId: persistedVersionId,
      };
    }

    const draftPlanId = latestSkillsDraft?.trainingPlanId?.trim() ?? "";
    const draftVersionId = latestSkillsDraft?.trainingPlanVersionId?.trim() ?? "";
    if (
      latestDraftDisplayDomain === "NUTRITION" &&
      draftPlanId !== "" &&
      draftVersionId !== ""
    ) {
      return { trainingPlanId: draftPlanId, versionId: draftVersionId };
    }

    if (
      persistedPlanDisplayDomain === "NUTRITION" &&
      persistedPlanId !== "" &&
      persistedVersionId !== ""
    ) {
      return { trainingPlanId: persistedPlanId, versionId: persistedVersionId };
    }

    return null;
  }, [
    latestDraftDisplayDomain,
    latestSkillsDraft?.trainingPlanId,
    latestSkillsDraft?.trainingPlanVersionId,
    persistedPlanDisplayDomain,
    persistedSkillsPlanDetail?.plan?.id,
    persistedSkillsPlanDetail?.version?.id,
    requestedPlanId,
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
    () =>
      allowedGenerationDomains.length > 0 &&
      allowedGenerationDomains.every((domain) =>
        isPlanWindowInsidePhase(
          activePhaseForSelectedSeason,
          planStartDate,
          addDaysToDateString(
            planStartDate,
            generationDurationDaysForDomain(domain, durationDays) - 1,
          ),
        ),
      ),
    [
      activePhaseForSelectedSeason,
      allowedGenerationDomains,
      durationDays,
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

  const UPSTREAM_CONTEXT_NOT_LOCKED_MESSAGE =
    "Upstream planning context is not locked yet. Please ask the Skills Coach / planning owner to complete planning setup.";

  const generatePlanLocalErrorsByDomain = useMemo(() => {
    if (isDownstreamDomainCoach && allowedGenerationDomains.length === 1) {
      const only = allowedGenerationDomains[0];
      if (upstreamPlanningContextLoading) {
        return { [only]: "Loading upstream planning context." } as Partial<
          Record<TrainingPlanGenerationDomain, string | null>
        >;
      }
      if (upstreamPlanningContextError !== null) {
        return { [only]: upstreamPlanningContextError } as Partial<
          Record<TrainingPlanGenerationDomain, string | null>
        >;
      }
      if (upstreamPlanningContext?.upstreamPlanningContextLocked !== true) {
        return { [only]: UPSTREAM_CONTEXT_NOT_LOCKED_MESSAGE } as Partial<
          Record<TrainingPlanGenerationDomain, string | null>
        >;
      }
      if (
        !upstreamPlanningContext.seasonCycleId ||
        !upstreamPlanningContext.startDate ||
        !upstreamPlanningContext.endDate
      ) {
        return {
          [only]:
            "Upstream planning context is locked but missing season/date context. Please ask the planning owner to refresh planning setup.",
        } as Partial<Record<TrainingPlanGenerationDomain, string | null>>;
      }
      if (entityId.trim() === "" || athleteIdTrimmed.trim() === "") {
        return { [only]: "Athlete route not available." } as Partial<
          Record<TrainingPlanGenerationDomain, string | null>
        >;
      }
      if ((athleteSportCode ?? "").trim() === "") {
        return {
          [only]:
            "Sport code is missing for this athlete. The planning owner must complete the Athlete Planning Profile before you can generate.",
        } as Partial<Record<TrainingPlanGenerationDomain, string | null>>;
      }
      return { [only]: null } as Partial<Record<TrainingPlanGenerationDomain, string | null>>;
    }
    return Object.fromEntries(
      allowedGenerationDomains.map((domain) => {
        const effectiveDurationDays = generationDurationDaysForDomain(domain, durationDays);
        const effectivePlanEndDate = addDaysToDateString(
          planStartDate,
          effectiveDurationDays - 1,
        );
        return [
          domain,
          resolveGeneratePlanLocalError({
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
          }),
        ];
      }),
    ) as Partial<Record<TrainingPlanGenerationDomain, string | null>>;
  }, [
    activePhaseForSelectedSeason,
    allowedGenerationDomains,
    athleteIdTrimmed,
    athleteSportCode,
    durationDays,
    entityId,
    isDownstreamDomainCoach,
    planStartDate,
    selectedActiveGoals.length,
    selectedSeason,
    selectedSeasonCycleId,
    upstreamPlanningContext,
    upstreamPlanningContextError,
    upstreamPlanningContextLoading,
  ]);

  const generatePlanActionDisabled = useMemo(
    () =>
      readinessLoading ||
      upstreamPlanningContextLoading ||
      workloadAssessmentLoading ||
      generatePlanLoading ||
      (isDownstreamDomainCoach
        ? upstreamPlanningContext?.upstreamPlanningContextLocked !== true
        : !generationReadinessFromApis),
    [
      generatePlanLoading,
      generationReadinessFromApis,
      isDownstreamDomainCoach,
      readinessLoading,
      upstreamPlanningContext?.upstreamPlanningContextLocked,
      upstreamPlanningContextLoading,
      workloadAssessmentLoading,
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
              "season-goals": seasonGoalsGateComplete,
              "plan-dates": planDatesStepComplete,
              generate: false,
            } satisfies Record<GuidedWorkflowStepKey, boolean>),
    [
      appStepComplete,
      isDownstreamDomainCoach,
      levelStepComplete,
      planDatesStepComplete,
      requestedPlanId,
      seasonGoalsGateComplete,
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
            "plan-dates": seasonGoalsGateComplete,
            generate: generateTabPrecSatisfied,
          }) satisfies Record<GuidedWorkflowStepKey, boolean>,
    [
      appStepComplete,
      generateTabPrecSatisfied,
      isDownstreamDomainCoach,
      levelStepComplete,
      seasonGoalsGateComplete,
      workloadComplete,
    ],
  );

  const prevWorkflowCompletionRef = useRef<{
    app: boolean;
    level: boolean;
    workload: boolean;
    workloadReadyForTabAdvance: boolean;
    seasonGoals: boolean;
    planDates: boolean;
  } | null>(null);
  /**
   * One-time resume to Step 6 per athlete/entity/domain/plan id so we do not fight manual tab
   * selection, while still opening Generate after refresh/login once a plan exists.
   */
  const workflowResumeToGenerateConsumedRef = useRef<string | null>(null);
  /** One-time jump to Generate for downstream coaches after APP + level (per athlete/entity). */
  const downstreamWorkflowLandGenerateConsumedRef = useRef<string | null>(null);

  const [selectedWorkflowTab, setSelectedWorkflowTab] =
    useState<GuidedWorkflowStepKey>("context-app");

  const step6WorkflowOrchestrationActive =
    accessGateReady &&
    selectedWorkflowTab === "generate" &&
    generateTabPrecSatisfied;

  const step6WorkflowStripModel = useMemo(() => {
    if (!step6WorkflowOrchestrationActive) {
      return { kind: "inactive" as const };
    }
    const planId = resolvedWorkflowPlanId;
    const domain = resolvedWorkflowGenerationDomain;
    if (planId === "") {
      return { kind: "no_plan" as const };
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
    step6WorkflowInternalError,
    step6WorkflowInternalLoading,
    step6WorkflowOrchestrationActive,
    urlPlanCandidate,
  ]);

  useEffect(() => {
    latestSkillsDraftRequestGenRef.current += 1;
    prevUrlPlanForPersistedSyncRef.current = undefined;
    coachDomainStateResetRef.current = null;
    step6WorkflowFetchGenRef.current += 1;
    workflowStep6FetchFailedForKeyRef.current = null;
    setStep6WorkflowInternalError(null);
    setStep6WorkflowInternalLoading(false);
    setWorkflowRequestedPlanId(null);
    setPersistedSkillsPlanDetail(null);
    setPersistedVerifiedDomain(null);
    setPersistedSkillsPlanError(null);
    setPersistedSkillsPlanLoading(false);
    setGovernedPlanActionLoading(null);
    setGovernedPlanActionError(null);
    setGovernedPlanActionSuccess(null);
    setLatestSkillsDraft(null);
    setLatestDraftDomain(null);
    setLatestSkillsDraftMissing(false);
    setLatestSkillsDraftError(null);
    setUpstreamPlanningContext(null);
    setUpstreamPlanningContextLoading(false);
    setUpstreamPlanningContextError(null);
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
    prevWorkflowCompletionRef.current = null;
    workflowResumeToGenerateConsumedRef.current = null;
    downstreamWorkflowLandGenerateConsumedRef.current = null;
  }, [athleteIdTrimmed, entityId]);

  useEffect(() => {
    const domainKey = currentCoachGenerationDomain ?? "NONE";
    const scopedKey = `${athleteIdTrimmed}|${entityId}|${domainKey}`;
    if (coachDomainStateResetRef.current === null) {
      coachDomainStateResetRef.current = scopedKey;
      return;
    }
    if (coachDomainStateResetRef.current === scopedKey) return;

    coachDomainStateResetRef.current = scopedKey;
    latestSkillsDraftRequestGenRef.current += 1;
    step6WorkflowFetchGenRef.current += 1;
    workflowStep6FetchFailedForKeyRef.current = null;
    setStep6WorkflowInternalError(null);
    setStep6WorkflowInternalLoading(false);
    setPersistedSkillsPlanDetail(null);
    setPersistedVerifiedDomain(null);
    setPersistedSkillsPlanError(null);
    setPersistedSkillsPlanLoading(false);
    setLatestSkillsDraft(null);
    setLatestDraftDomain(null);
    setLatestSkillsDraftMissing(false);
    setLatestSkillsDraftError(null);
    setGeneratePlanSuccess(null);
    setGeneratePlanSuccessDomain(null);
    setGeneratePlanError(null);
    setGeneratePlanRecoveryMessage(null);
  }, [athleteIdTrimmed, currentCoachGenerationDomain, entityId]);

  useEffect(() => {
    let cancelled = false;
    if (!accessGateReady || !isDownstreamDomainCoach || entityId === "" || athleteIdTrimmed === "") {
      setUpstreamPlanningContext(null);
      setUpstreamPlanningContextLoading(false);
      setUpstreamPlanningContextError(null);
      return;
    }

    setUpstreamPlanningContextLoading(true);
    setUpstreamPlanningContextError(null);
    void (async () => {
      try {
        const context = await fetchCoachAthleteUpstreamPlanningContext(
          entityId,
          athleteIdTrimmed,
        );
        if (cancelled) return;
        setUpstreamPlanningContext(context);
      } catch (e) {
        if (cancelled) return;
        setUpstreamPlanningContext(null);
        setUpstreamPlanningContextError(
          formatApiError(
            e,
            "Could not load upstream planning context. Please try again shortly.",
          ),
        );
      } finally {
        if (!cancelled) {
          setUpstreamPlanningContextLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessGateReady, athleteIdTrimmed, entityId, isDownstreamDomainCoach]);

  useEffect(() => {
    setPlanDatesConfirmedForCurrentAthlete(false);
  }, [selectedSeasonCycleId, selectedGoalIdsSignature]);

  useEffect(() => {
    setGovernedPlanActionLoading(null);
    setGovernedPlanActionError(null);
    setGovernedPlanActionSuccess(null);
  }, [requestedPlanId, persistedSkillsPlanDetail?.version.id]);

  useEffect(() => {
    return () => {
      if (workloadCompletionHoldTimeoutRef.current !== null) {
        window.clearTimeout(workloadCompletionHoldTimeoutRef.current);
        workloadCompletionHoldTimeoutRef.current = null;
      }
    };
  }, []);

  /** Persisted plan in URL → Generate step */
  useEffect(() => {
    if (requestedPlanId !== null) {
      setSelectedWorkflowTab("generate");
    }
  }, [requestedPlanId]);

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
        setPersistedSkillsPlanDetail(null);
        setPersistedSkillsPlanError(null);
        router.replace(planningProfileHrefForAthlete(athleteIdTrimmed));
        return null;
      }
      if (updateWorkflowRequestedPlanId) {
        setWorkflowRequestedPlanId(planId);
      }
      setPersistedSkillsPlanDetail(detail);
      setPersistedVerifiedDomain(generationDomain);
      setPersistedSkillsPlanError(null);
      return detail;
    },
    [athleteIdTrimmed, router],
  );

  /** When a workflow step completes, auto-advance selection to the next tab (no Next buttons) */
  useEffect(() => {
    if (isDownstreamDomainCoach) {
      prevWorkflowCompletionRef.current = {
        app: appStepComplete,
        level: levelStepComplete,
        workload: true,
        workloadReadyForTabAdvance: true,
        seasonGoals: true,
        planDates: true,
      };
      return;
    }

    const workloadReadyForTabAdvance =
      requestedPlanId !== null ? true : workloadComplete && !showWorkloadCompletionState;

    const snapshot = {
      app: appStepComplete,
      level: levelStepComplete,
      workload: workloadComplete,
      workloadReadyForTabAdvance,
      seasonGoals: seasonGoalsGateComplete,
      planDates: planDatesStepComplete,
    };

    if (requestedPlanId !== null) {
      prevWorkflowCompletionRef.current = snapshot;
      return;
    }

    const prev = prevWorkflowCompletionRef.current;
    if (prev !== null) {
      if (!prev.seasonGoals && snapshot.seasonGoals) {
        setSelectedWorkflowTab("plan-dates");
      } else if (
        !prev.workloadReadyForTabAdvance &&
        snapshot.workloadReadyForTabAdvance
      ) {
        setSelectedWorkflowTab("season-goals");
      } else if (!prev.level && snapshot.level) {
        setSelectedWorkflowTab("workload");
      } else if (!prev.app && snapshot.app) {
        setSelectedWorkflowTab("level-validation");
      }
    }
    prevWorkflowCompletionRef.current = snapshot;
  }, [
    requestedPlanId,
    appStepComplete,
    isDownstreamDomainCoach,
    levelStepComplete,
    workloadComplete,
    showWorkloadCompletionState,
    seasonGoalsGateComplete,
    planDatesStepComplete,
  ]);

  /** Downstream Nutrition/S&C: open Generate after prerequisites without walking Steps 3–5. */
  useEffect(() => {
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
  ]);

  /**
   * After refresh/login, auto-advance may land on Step 4 (Season & Goals) when gates were already
   * satisfied; once a draft plan id or hydrated persisted detail exists, jump once to Step 6.
   */
  useEffect(() => {
    if (!accessGateReady) return;
    if (!generateTabPrecSatisfied) return;
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
          title: WORKFLOW_TAB_LABELS[key],
          summary: "",
          status,
          markCompleteTick: stepDone,
        };
      }) satisfies GuidedWorkflowUiStep[],
    [selectedWorkflowTab, workflowPrecMap, workflowStepCompleteForTick],
  );

  const workflowStepStatusByKey = useMemo(
    () =>
      Object.fromEntries(
        workflowStepperModel.map((step) => [step.key, step.status]),
      ) as Record<GuidedWorkflowStepKey, GuidedWorkflowStepStatus>,
    [workflowStepperModel],
  );

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
        setGeneratePlanPhase("idle");
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
      setLatestSkillsDraftMissing(false);
      setLatestSkillsDraftError(null);
      return;
    }

    const requestScope = { athlete: athleteIdTrimmed, entity: entityId };
    latestSkillsDraftRequestGenRef.current += 1;
    const requestGeneration = latestSkillsDraftRequestGenRef.current;

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
        setLatestSkillsDraftMissing(false);
        setLatestSkillsDraftError(null);
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
          setLatestSkillsDraftMissing(true);
          setLatestSkillsDraftError(null);
          return;
        }
        setLatestSkillsDraft(null);
        setLatestDraftDomain(generationDomain);
        setLatestSkillsDraftMissing(false);
        setLatestSkillsDraftError("Unable to load draft. Please try again.");
        return;
      }
    }
  }, [athleteIdTrimmed, entityId]);

  useEffect(() => {
    if (!accessGateReady) return;
    if (requestedPlanId !== null) {
      setLatestSkillsDraft(null);
      setLatestDraftDomain(null);
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
  ]);

  useEffect(() => {
    if (!accessGateReady) return;

    const prevUrlPlan = prevUrlPlanForPersistedSyncRef.current;
    prevUrlPlanForPersistedSyncRef.current = urlPlanCandidate;

    let cancelled = false;

    async function syncPersistedPlanFromUrl() {
      if (urlPlanCandidate === null) {
        if (prevUrlPlan !== undefined && prevUrlPlan !== null) {
          setWorkflowRequestedPlanId(null);
          setPersistedSkillsPlanDetail(null);
          setPersistedVerifiedDomain(null);
          setPersistedSkillsPlanError(null);
          workflowStep6FetchFailedForKeyRef.current = null;
        }
        setPersistedSkillsPlanLoading(false);
        return;
      }

      if (isDownstreamDomainCoach) {
        setWorkflowRequestedPlanId(null);
        setPersistedSkillsPlanLoading(false);
        setPersistedSkillsPlanError(null);
        return;
      }

      if (setupLoading) {
        setPersistedSkillsPlanLoading(true);
        setPersistedSkillsPlanError(null);
        return;
      }

      if (persistedPlanQueryDomain === null) {
        setWorkflowRequestedPlanId(null);
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
          setPersistedSkillsPlanDetail(null);
          setPersistedVerifiedDomain(null);
          setPersistedSkillsPlanError(null);
          router.replace(planningProfileHrefForAthlete(athleteIdTrimmed));
          return;
        }
        setWorkflowRequestedPlanId(urlPlanCandidate);
        setPersistedSkillsPlanDetail(detail);
        setPersistedVerifiedDomain(persistedPlanQueryDomain);
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
    persistedPlanQueryDomain,
    router,
    setupLoading,
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
      await reviseCoachAthleteSkillsTrainingPlan(entityId, athleteIdTrimmed, {
        trainingPlanId: skillsReviseIds.trainingPlanId,
        versionId: skillsReviseIds.versionId,
        coachFeedback,
      });
      await loadLatestSkillsDraft("SKILLS", true);
      const shouldRefreshSavedPlanDetail =
        trainingPlanIdForReload !== "" &&
        ((requestedPlanId !== null && requestedPlanId.trim() === trainingPlanIdForReload) ||
          persistedSkillsPlanDetail?.plan.id?.trim() === trainingPlanIdForReload);
      if (shouldRefreshSavedPlanDetail) {
        try {
          const detail = await refreshPersistedPlanDetail(
            trainingPlanIdForReload,
            "SKILLS",
            { updateWorkflowRequestedPlanId: requestedPlanId !== null },
          );
          if (detail === null) return;
        } catch (refreshError) {
          setPersistedSkillsPlanError(
            formatApiError(refreshError, "Unable to refresh saved plan. Please try again."),
          );
        }
      }
      setReviseSkillsFeedback("");
      setReviseSkillsSuccess("Revised skills plan version generated.");
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
  ) {
    if (governedPlanActionLoading !== null || persistedGovernedPlanContext === null) {
      return;
    }

    const revisionFeedback = requestRevisionFeedback.trim();
    if (action === "REQUEST_REVISION" && revisionFeedback === "") {
      setGovernedPlanActionError("Enter Head Coach notes before requesting revision.");
      setGovernedPlanActionSuccess(null);
      setGovernedPlanActionSuccessFeedback(null);
      return;
    }

    setGovernedPlanActionLoading(action);
    setGovernedPlanActionError(null);
    setGovernedPlanActionSuccess(null);
    setGovernedPlanActionSuccessFeedback(null);

    const updateWorkflowRequestedPlanIdAfterAction = requestedPlanId !== null;

    try {
      if (action === "SUBMIT_REVIEW") {
        await submitTrainingPlanVersionForReview(
          entityId,
          athleteIdTrimmed,
          persistedGovernedPlanContext.planId,
          persistedGovernedPlanContext.versionId,
          persistedGovernedPlanContext.generationDomain,
        );
      } else if (action === "HEAD_APPROVE") {
        await headApproveTrainingPlanVersion(
          entityId,
          athleteIdTrimmed,
          persistedGovernedPlanContext.planId,
          persistedGovernedPlanContext.versionId,
          persistedGovernedPlanContext.generationDomain,
        );
      } else if (action === "REQUEST_REVISION") {
        const result = await requestTrainingPlanRevision(
          entityId,
          athleteIdTrimmed,
          persistedGovernedPlanContext.planId,
          persistedGovernedPlanContext.versionId,
          persistedGovernedPlanContext.generationDomain,
          revisionFeedback,
        );
        setRequestRevisionFeedback("");
        setShowRequestRevisionForm(false);
        setGovernedPlanActionSuccessFeedback(result.coachFeedback);
      } else {
        await releaseTrainingPlanVersionToAthlete(
          entityId,
          athleteIdTrimmed,
          persistedGovernedPlanContext.planId,
          persistedGovernedPlanContext.versionId,
          persistedGovernedPlanContext.generationDomain,
        );
      }
      if (action === "REQUEST_REVISION") {
        await loadLatestSkillsDraft(persistedGovernedPlanContext.generationDomain, true);
        await refreshProfileAndReadinessAfterLevelValidation();
      }
      await refreshPersistedPlanDetail(
        persistedGovernedPlanContext.planId,
        persistedGovernedPlanContext.generationDomain,
        { updateWorkflowRequestedPlanId: updateWorkflowRequestedPlanIdAfterAction },
      );
      setGovernedPlanActionSuccess(governedPlanActionSuccessMessage(action));
    } catch (e) {
      setGovernedPlanActionError(
        formatApiError(e, governedPlanActionErrorFallback(action)),
      );
    } finally {
      setGovernedPlanActionLoading(null);
    }
  }

  function renderDownstreamUpstreamPlanningReadOnlySection() {
    const seasonLabel =
      selectedSeason !== null ? formatSeasonOptionLabel(selectedSeason) : "—";
    const locked = upstreamPlanningContext?.upstreamPlanningContextLocked === true;
    return (
      <section className="space-y-4 rounded-xl border border-border bg-bg/60 p-4 sm:p-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-textPrimary">
            Upstream planning context (read-only)
          </h3>
          <p className="text-sm text-textSecondary">
            Workload assessment, season and goals, and plan dates are owned by the Skills Coach or
            Head Coach. Review what is available for this athlete; use Generate for your assigned
            domain only.
          </p>
        </div>
        {upstreamPlanningContextLoading ? (
          <div className="text-sm text-textSecondary">Loading upstream planning context…</div>
        ) : null}
        {upstreamPlanningContextError ? (
          <Alert variant="danger">{upstreamPlanningContextError}</Alert>
        ) : null}
        {!upstreamPlanningContextLoading && !upstreamPlanningContextError && !locked ? (
          <Alert variant="warning">{UPSTREAM_CONTEXT_NOT_LOCKED_MESSAGE}</Alert>
        ) : null}
        <dl className="space-y-2">
          <DetailRow
            label="Your primary generation domain"
            value={displayValue(currentCoachGenerationDomain)}
          />
          <DetailRow
            label="Planning owner (Skills / Head Coach per academy gate)"
            value={isPlanningOwnerCoach ? "Yes" : "No"}
          />
          <DetailRow
            label="Downstream domain coach (read-only upstream)"
            value={isDownstreamDomainCoach ? "Yes" : "No"}
          />
          <DetailRow
            label="Upstream planning context locked"
            value={locked ? "Yes" : "No"}
          />
          <DetailRow label="APP completeness" value={displayValue(readinessPanel.appCompleteness)} />
          <DetailRow
            label="Level validation"
            value={displayValue(readinessPanel.validationStatus)}
          />
          <DetailRow
            label="Planning eligibility"
            value={displayValue(readinessPanel.planningEligibility)}
          />
          <DetailRow label="Readiness status" value={displayValue(readinessPanel.readinessStatus)} />
          <DetailRow
            label="Workload assessment (owner)"
            value={locked ? "Locked upstream" : "Not locked"}
          />
          <DetailRow
            label="Workload — weekly hours"
            value={displayValue(
              upstreamPlanningContext?.workloadSummary.weeklyTrainingHours,
            )}
          />
          <DetailRow
            label="Workload — load status"
            value={displayValue(upstreamPlanningContext?.workloadSummary.status)}
          />
          <DetailRow
            label="Season Cycle ID"
            value={displayValue(upstreamPlanningContext?.seasonCycleId ?? seasonLabel)}
          />
          <DetailRow
            label="Detected current phase"
            value={displayValue(upstreamPlanningContext?.phase)}
          />
          <DetailRow
            label="Locked Goal IDs"
            value={displayValue(upstreamPlanningContext?.goalIds ?? [])}
          />
          <DetailRow label="Plan start (owner)" value={displayValue(upstreamPlanningContext?.startDate)} />
          <DetailRow label="Plan end (owner)" value={displayValue(upstreamPlanningContext?.endDate)} />
        </dl>
      </section>
    );
  }

  function renderStep6WorkflowActionsStrip() {
    const model = step6WorkflowStripModel;
    const domainLabel = resolvedWorkflowGenerationDomain;

    if (model.kind === "inactive") {
      return (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <h5 className="text-sm font-semibold text-textPrimary">Workflow Actions</h5>
          <p className="text-sm text-textSecondary">Preparing workflow…</p>
        </div>
      );
    }

    if (model.kind === "no_plan") {
      return (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <h5 className="text-sm font-semibold text-textPrimary">Workflow Actions</h5>
          <p className="text-sm text-textSecondary">
            {isDownstreamDomainCoach
              ? generationDraftEmptyState(resolvedWorkflowGenerationDomain)
              : "No training plan id is available yet for workflow actions. Generate a plan, load a draft with a saved plan id, or open a saved plan from the URL, then return to this step."}
          </p>
        </div>
      );
    }

    if (model.kind === "loading") {
      return (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <h5 className="text-sm font-semibold text-textPrimary">Workflow Actions</h5>
          <p className="text-sm text-textSecondary">Loading saved plan permissions…</p>
        </div>
      );
    }

    if (model.kind === "missing_domain") {
      return (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <h5 className="text-sm font-semibold text-textPrimary">Workflow Actions</h5>
          <Alert variant="warning">{model.message}</Alert>
        </div>
      );
    }

    if (model.kind === "error") {
      return (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <h5 className="text-sm font-semibold text-textPrimary">Workflow Actions</h5>
          <Alert variant="danger">{model.message}</Alert>
        </div>
      );
    }

    if (model.kind === "empty") {
      const d = model.detail;
      const allowedActionsSummary = d.allowedActions?.join(", ") ?? "";
      return (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <h5 className="text-sm font-semibold text-textPrimary">Workflow Actions</h5>
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

    if (persistedGovernedPlanContext === null || persistedGovernedAllowedActions.size === 0) {
      return (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <h5 className="text-sm font-semibold text-textPrimary">Workflow Actions</h5>
          <WorkflowNeutralNotice>
            <div className="text-sm text-textSecondary">
              The backend reported actions, but plan context is incomplete (missing version or
              domain). Refresh the page or reopen the saved plan.
            </div>
          </WorkflowNeutralNotice>
        </div>
      );
    }

    return (
      <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <h5 className="text-sm font-semibold text-textPrimary">Workflow Actions</h5>
        <div className="flex flex-wrap gap-2">
          {persistedGovernedAllowedActions.has("SUBMIT_REVIEW") ? (
            <Button
              type="button"
              variant="secondary"
              loading={governedPlanActionLoading === "SUBMIT_REVIEW"}
              disabled={governedPlanActionLoading !== null}
              onClick={() => void handlePersistedGovernedPlanAction("SUBMIT_REVIEW")}
            >
              {governedPlanActionButtonLabel("SUBMIT_REVIEW")}
            </Button>
          ) : null}
          {persistedGovernedAllowedActions.has("HEAD_APPROVE") ? (
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
          {persistedGovernedAllowedActions.has("REQUEST_REVISION") ? (
            <Button
              type="button"
              variant="secondary"
              disabled={governedPlanActionLoading !== null}
              onClick={() => {
                setShowRequestRevisionForm((current) => !current);
                setGovernedPlanActionError(null);
                setGovernedPlanActionSuccess(null);
                setGovernedPlanActionSuccessFeedback(null);
              }}
            >
              {governedPlanActionButtonLabel("REQUEST_REVISION")}
            </Button>
          ) : null}
          {persistedGovernedAllowedActions.has("RELEASE") ? (
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
        {persistedGovernedAllowedActions.has("REQUEST_REVISION") && showRequestRevisionForm ? (
          <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
            <h6 className="text-sm font-semibold text-textPrimary">Request Revision</h6>
            <label className="space-y-1 text-sm text-textPrimary">
              <span className="font-medium">Head Coach Notes</span>
              <textarea
                rows={4}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary caret-current placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                value={requestRevisionFeedback}
                onChange={(event) => setRequestRevisionFeedback(event.target.value)}
                placeholder="Describe what should change before this plan can be approved."
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                loading={governedPlanActionLoading === "REQUEST_REVISION"}
                disabled={governedPlanActionLoading !== null}
                onClick={() => {
                  void handlePersistedGovernedPlanAction("REQUEST_REVISION");
                }}
              >
                Send Request Revision
              </Button>
              <Button
                type="button"
                variant="neutral"
                disabled={governedPlanActionLoading !== null}
                onClick={() => {
                  setShowRequestRevisionForm(false);
                  setRequestRevisionFeedback("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
        {governedPlanActionError ? <Alert variant="danger">{governedPlanActionError}</Alert> : null}
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
      await reviseNutritionPlan(entityId, athleteIdTrimmed, {
        trainingPlanId: nutritionReviseIds.trainingPlanId,
        versionId: nutritionReviseIds.versionId,
        coachFeedback,
      });
      await loadLatestSkillsDraft("NUTRITION", true);
      const shouldRefreshSavedPlanDetail =
        trainingPlanIdForReload !== "" &&
        ((requestedPlanId !== null && requestedPlanId.trim() === trainingPlanIdForReload) ||
          persistedSkillsPlanDetail?.plan.id?.trim() === trainingPlanIdForReload);
      if (shouldRefreshSavedPlanDetail) {
        try {
          const detail = await refreshPersistedPlanDetail(
            trainingPlanIdForReload,
            "NUTRITION",
            { updateWorkflowRequestedPlanId: requestedPlanId !== null },
          );
          if (detail === null) return;
        } catch (refreshError) {
          setPersistedSkillsPlanError(
            formatApiError(refreshError, "Unable to refresh saved plan. Please try again."),
          );
        }
      }
      setReviseNutritionFeedback("");
      setReviseNutritionSuccess("Revised nutrition plan version generated.");
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
      !latestSkillsDraft?.trainingPlanId ||
      !latestSkillsDraft.trainingPlanVersionId
    ) {
      return;
    }

    const coachFeedback = reviseSandCFeedback.trim();
    if (coachFeedback === "") {
      setReviseSandCError("Enter revision feedback first.");
      setReviseSandCSuccess(null);
      return;
    }

    setReviseSandCLoading(true);
    setReviseSandCError(null);
    setReviseSandCSuccess(null);
    try {
      await reviseCoachAthleteSandCTrainingPlan(entityId, athleteIdTrimmed, {
        trainingPlanId: latestSkillsDraft.trainingPlanId,
        versionId: latestSkillsDraft.trainingPlanVersionId,
        coachFeedback,
      });
      await loadLatestSkillsDraft("S_AND_C", true);
      setReviseSandCFeedback("");
      setReviseSandCSuccess("Revised S&C plan version generated.");
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
      await refreshGoalsSeasonSetup();
      setSelectedSeasonCycleId(season.seasonCycleId);
      setSeasonCreateFormExplicit(false);
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
    if (selectedSeasonCycleId == null) {
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
    const effectiveDurationDays = generationDurationDaysForDomain(domain, durationDays);
    const effectivePlanEndDate = addDaysToDateString(
      planStartDate,
      effectiveDurationDays - 1,
    );
    const localGenerationError = isDownstreamDomainCoach
      ? (generatePlanLocalErrorsByDomain[domain] ?? null)
      : resolveGeneratePlanLocalError({
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
    const readinessBlockedMessage = formatBackendReadinessBlockers(readinessPanel.blockers);
    if (
      readinessLoading ||
      workloadAssessmentLoading ||
      generatePlanLoading ||
      entityId === "" ||
      athleteIdTrimmed === ""
    ) {
      return;
    }

    if (!isDownstreamDomainCoach && !generationReadinessFromApis) {
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

    const seasonCycleId = selectedSeasonCycleId;
    const goalIds = selectedActiveGoals.map((goal) => goal.goalId);
    const normalizedSportCode = athleteSportCode!.trim();

    setGeneratePlanLoading(true);
    setGeneratePlanPhase("executing");
    setGeneratePlanError(null);
    setGeneratePlanSuccess(null);
    setGeneratePlanSuccessDomain(null);
    setGeneratePlanRecoveryMessage(null);

    let persistPhaseEntered = false;
    try {
      const executeResult = await executeCoachAthleteTrainingPlan(
        entityId,
        athleteIdTrimmed,
        {
          sportCode: normalizedSportCode,
          durationDays: effectiveDurationDays,
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
        executeResult.generationContextSnapshot === undefined
      ) {
        setGeneratePlanError(
          "Training plan generation did not return a draft payload.",
        );
        return;
      }

      setGeneratePlanPhase("persisting");
      persistPhaseEntered = true;
      const persistenceContext: TrainingPlanPersistenceContext | null =
        isDownstreamDomainCoach
          ? upstreamPlanningContext?.upstreamPlanningContextLocked === true &&
            upstreamPlanningContext.seasonCycleId &&
            upstreamPlanningContext.startDate &&
            upstreamPlanningContext.endDate
            ? {
                seasonCycleId: upstreamPlanningContext.seasonCycleId,
                startDate: upstreamPlanningContext.startDate,
                endDate: upstreamPlanningContext.endDate,
                ...(upstreamPlanningContext.goalIds.length > 0
                  ? { goalIds: upstreamPlanningContext.goalIds }
                  : {}),
              }
            : extractPersistenceContextFromSnapshot(executeResult.generationContextSnapshot)
          : {
              seasonCycleId: seasonCycleId!,
              startDate: planStartDate,
              endDate: effectivePlanEndDate,
              goalIds,
            };
      if (persistenceContext === null) {
        setGeneratePlanError(
          "Upstream planning context is not available in the generation snapshot. Please ask the Skills Coach / planning owner to complete planning setup.",
        );
        return;
      }
      const persistResult = await persistCoachAthleteTrainingPlanDraft(
        entityId,
        athleteIdTrimmed,
        {
          generatedPlannerCandidate: executeResult.generatedPlannerCandidate,
          generationContextSnapshot: executeResult.generationContextSnapshot,
          persistenceContext,
        },
      );
      setGeneratePlanSuccess(persistResult);
      setGeneratePlanSuccessDomain(domain);
      if (
        domain === "SKILLS" ||
        domain === "S_AND_C" ||
        domain === "NUTRITION"
      ) {
        await loadLatestSkillsDraft(domain, true);
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
      if (persistPhaseEntered && isPersistDraftRequestTimedOut(e)) {
        try {
          const recovered = await fetchLatestCoachAthleteDomainDraft(
            entityId,
            athleteIdTrimmed,
            domain,
          );
          const planId = recovered.trainingPlanId?.trim() ?? "";
          const versionId = recovered.trainingPlanVersionId?.trim() ?? "";
          if (planId !== "" && versionId !== "") {
            setGeneratePlanSuccess(persistDraftResultFromLatestDomainDraft(recovered));
            setGeneratePlanSuccessDomain(domain);
            setGeneratePlanRecoveryMessage("Draft saved. Refresh completed.");
            setGeneratePlanError(null);
            if (
              domain === "SKILLS" ||
              domain === "S_AND_C" ||
              domain === "NUTRITION"
            ) {
              await loadLatestSkillsDraft(domain, true);
            }
            return;
          }
        } catch {
          /* fall through to generic error */
        }
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
      <PageHeader
        title="Training Plan"
        subtitle="Step-based plan creation workflow"
      />

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
          <Card accent={false} className="overflow-hidden border-border !p-0 shadow-md">
            <div className="space-y-4 border-border bg-card px-4 py-5 sm:px-6 sm:py-6">
              <TrainingPlanWorkflowProgressRail steps={[...workflowStepperModel]} />
            </div>
            <div className="w-full min-w-0 max-w-full overflow-hidden px-4 sm:px-6">
              <WorkflowConnectedTabStrip
                selectedTab={selectedWorkflowTab}
                steps={[...workflowStepperModel]}
                onSelect={(tab) => {
                  if (workflowStepStatusByKey[tab] === "locked") return;
                  setSelectedWorkflowTab(tab);
                }}
              />
            </div>
            <div className="space-y-6 bg-card px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 md:px-10 md:py-10">
              {selectedWorkflowTab === "context-app" ? (
                <section className="space-y-4 rounded-xl border border-border bg-bg/60 p-4 sm:p-5">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-textPrimary">
                      Step 1 — Context / APP
                    </h3>
                    <p className="text-sm text-textSecondary">
                      Athlete planning profile (APP) completeness, eligibility, and required fields from
                      the backend.
                    </p>
                  </div>

                  {readinessLoading ? (
                    <div className="text-sm text-textSecondary">Loading readiness details…</div>
                  ) : (
                    <div className="space-y-3">
                      {readinessError ? <Alert variant="warning">{readinessError}</Alert> : null}
                      {hasReadinessContent(readinessPanel) ? (
                        <dl className="space-y-2">
                          <DetailRow
                            label="Readiness Status"
                            value={displayValue(readinessPanel.readinessStatus)}
                          />
                          <DetailRow
                            label="APP Completeness"
                            value={displayValue(readinessPanel.appCompleteness)}
                          />
                          <DetailRow
                            label="Planning Eligibility"
                            value={displayValue(readinessPanel.planningEligibility)}
                          />
                          <DetailRow
                            label="Backend Can Generate"
                            value={
                              readinessPanel.canGenerate === null
                                ? displayValue(readinessPanel.canGenerate)
                                : readinessPanel.canGenerate
                                  ? "Yes"
                                  : "No"
                            }
                          />
                          <DetailRow
                            label="Backend Is Ready"
                            value={
                              readinessPanel.isReady === null
                                ? displayValue(readinessPanel.isReady)
                                : readinessPanel.isReady
                                  ? "Yes"
                                  : "No"
                            }
                          />
                          <DetailRow
                            label="Backend Blockers"
                            value={formatMissingRequiredFields(readinessPanel.blockers)}
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
                      ) : (
                        <div className="text-sm text-textSecondary">
                          No readiness details available.
                        </div>
                      )}
                    </div>
                  )}
                </section>
              ) : null}

              {selectedWorkflowTab === "level-validation" ? (
                !workflowPrecMap["level-validation"] ? (
                  <WorkflowLockedCard
                    title="Step 2 — Level Validation"
                    message="Finish APP completeness (required fields and eligibility) before Level Validation."
                  />
                ) : (
                  <section className="space-y-4 rounded-xl border border-border bg-bg/60 p-4 sm:p-5">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-textPrimary">
                        Step 2 — Level Validation
                      </h3>
                      <p className="text-sm text-textSecondary">
                        Confirm validated level metadata before proceeding to workload assessment.
                      </p>
                    </div>
                    {readinessLoading ? (
                      <div className="text-sm text-textSecondary">Loading readiness details…</div>
                    ) : (
                      <div className="space-y-3">
                        {readinessError ? <Alert variant="warning">{readinessError}</Alert> : null}
                        <dl className="space-y-2">
                          <DetailRow
                            label="Level Validation Status"
                            value={displayValue(readinessPanel.validationStatus)}
                          />
                          <DetailRow
                            label="Validated Level"
                            value={displayValue(readinessPanel.validatedLevel)}
                          />
                        </dl>
                        {showValidateLevel ? (
                          <div className="pt-1">
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={missingPlanningProfile}
                              onClick={() => setLevelValidationModalOpen(true)}
                            >
                              Continue to Level Validation
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </section>
                )
              ) : null}

              {selectedWorkflowTab === "season-goals" ? (
                isDownstreamDomainCoach ? (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-textPrimary">Step 4 — Season & Goals</h3>
                    {renderDownstreamUpstreamPlanningReadOnlySection()}
                  </div>
                ) : !workflowPrecMap["season-goals"] ? (
                  <WorkflowLockedCard
                    title="Step 4 — Season & Goals"
                    message="Finish workload assessment before configuring season, phases, competition, and goals."
                  />
                ) : setupLoading ? (
                  <div className="text-sm text-textSecondary">
                    Loading goals and season setup…
                  </div>
                ) : (
                  <section className="space-y-5 rounded-xl border border-border bg-bg/60 p-4 sm:p-5">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-textPrimary">
                        Step 4 — Season & Goals
                      </h3>
                      <p className="text-sm text-textSecondary">
                        Set up the athlete&apos;s season and goals for planning. This helps the
                        system structure training phases and generate the right plan.
                      </p>
                    </div>
                    <div className="space-y-5">
                <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-textPrimary">
                      Season
                    </h3>
                    <p className="text-sm text-textSecondary">
                      Create or select a season to define the training timeline.
                    </p>
                  </div>
                  {seasonError ? <Alert variant="danger">{seasonError}</Alert> : null}
                  {seasonSuccess ? <WorkflowNeutralNotice>{seasonSuccess}</WorkflowNeutralNotice> : null}

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
                        <DetailRow
                          label="Selected Season Cycle ID"
                          value={displayValue(selectedSeasonCycleId || null)}
                        />
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
                              value={formatPlanningProfileDateDisplay(selectedSeason.startDate)}
                            />
                            <DetailRow
                              label="Selected Season End Date"
                              value={formatPlanningProfileDateDisplay(selectedSeason.endDate)}
                            />
                          </dl>
                          <div className="pt-2 text-xs text-textMuted">
                            Season Cycle ID: {selectedSeason.id}
                          </div>
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
                        <div className="text-sm text-textSecondary">
                          No seasons found for this entity. Create one to continue.
                        </div>
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

                <section className="space-y-3 rounded-lg border border-slate-200 p-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-textPrimary">
                      Season Phases
                    </h3>
                    <p className="text-sm text-textSecondary">
                      Break the season into phases, such as Off-season, Pre-season, and In-season.
                      The system automatically detects the current phase based on today&apos;s date.
                    </p>
                  </div>
                  {phaseError ? <Alert variant="danger">{phaseError}</Alert> : null}
                  {phaseSuccess ? <WorkflowNeutralNotice>{phaseSuccess}</WorkflowNeutralNotice> : null}
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
                              <WorkflowNeutralNotice>{editor.success}</WorkflowNeutralNotice>
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

                {phaseByType.IN_SEASON ? (
                  <section className="space-y-3 rounded-lg border border-slate-200 p-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-textPrimary">
                        Competition schedule
                      </h3>
                      <p className="text-sm text-textSecondary">
                        Competition goals become available once In-season exists.
                      </p>
                    </div>
                    <>
                      {competitionError ? <Alert variant="danger">{competitionError}</Alert> : null}
                      {competitionSuccess ? (
                        <WorkflowNeutralNotice>{competitionSuccess}</WorkflowNeutralNotice>
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
                          selectedSeasonCycleId == null ||
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
                            <div key={goal.goalId} className="rounded-md border border-slate-200 bg-white p-3">
                              <GoalDisplayBlock
                                title={goal.competitionEventId ?? goal.goalId}
                                status={goal.status}
                                targetDate={goal.targetDate}
                              />
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
                      {currentPhaseGoalSectionTitle()}
                    </h3>
                    <p className="text-sm text-textSecondary">
                      {currentPhaseGoalRequirementLabel()}
                    </p>
                  </div>
                  {goalError ? <Alert variant="danger">{goalError}</Alert> : null}
                  {goalSuccess ? <WorkflowNeutralNotice>{goalSuccess}</WorkflowNeutralNotice> : null}
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
                        {currentPhaseGoalNameLabel(effectiveCoachGenerationDomain)}
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
                      selectedSeasonCycleId == null ||
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
                    <div className="space-y-1 border-b border-slate-200 pb-3">
                      <p className="text-sm font-medium text-textPrimary">
                        Select at least one active goal to continue to Plan Dates.
                      </p>
                      {selectedGoalIds.length === 0 ? (
                        <p className="text-sm text-textSecondary">Waiting for goal selection.</p>
                      ) : (
                        <p className="text-sm font-medium text-primary">
                          Goal selected. Moving to Plan Dates.
                        </p>
                      )}
                    </div>
                    {currentPhaseActiveGoals.length > 0 ? (
                      currentPhaseActiveGoals.map((goal) => (
                        <label
                          key={goal.goalId}
                          className="flex items-start gap-2 text-sm text-textPrimary"
                        >
                          <GoalDisplayBlock
                            title={goal.goalName ?? goal.goalId}
                            status={goal.status}
                            priority={goal.priority}
                            successCriteria={goal.successCriteria}
                            targetDate={goal.targetDate}
                            domain={goal.domain}
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
                    </div>
                  </section>
                )
              ) : null}

              {selectedWorkflowTab === "workload" ? (
                isDownstreamDomainCoach ? (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-textPrimary">
                      Step 3 — Workload Assessment
                    </h3>
                    {renderDownstreamUpstreamPlanningReadOnlySection()}
                  </div>
                ) : !workflowPrecMap.workload ? (
                  <WorkflowLockedCard
                    title="Step 3 — Workload Assessment"
                    message="Confirm level validation before running workload assessment."
                  />
                ) : workloadComplete && !showWorkloadCompletionState ? (
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
                )
              ) : null}

            {selectedWorkflowTab === "plan-dates" ? (
              isDownstreamDomainCoach ? (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-textPrimary">Step 5 — Plan Dates</h3>
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
                    <h3 className="text-base font-semibold text-textPrimary">Step 5 — Plan Dates</h3>
                    <p className="text-sm text-textSecondary">
                      7-day duration, plan start date, and computed window. Confirm when prerequisites
                      are satisfied, then proceed to generate.
                    </p>
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
                  onProceedToGenerate={() => {
                    setPlanDatesConfirmedForCurrentAthlete(true);
                    setSelectedWorkflowTab("generate");
                  }}
                />
                </section>
              )
            ) : null}

            {selectedWorkflowTab === "generate" ? (
              !workflowPrecMap.generate ? (
                <WorkflowLockedCard
                  title="Step 6 — Generate Plan"
                  message={
                    isDownstreamDomainCoach
                      ? "Finish Context / APP and Level Validation before opening your domain plan panel."
                      : "Confirm plan dates in Step 5 (with a valid window inside the current phase), or open an existing saved plan."
                  }
                />
              ) : (
                <section className="space-y-3 rounded-lg border border-slate-200 p-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-textPrimary">
                      Step 6 — Generate Plan
                    </h3>
                    <p className="text-sm text-textSecondary">
                      Generation follows the backend readiness contract. Any backend blockers are
                      shown here before execution.
                    </p>
                  </div>
                  {isDownstreamDomainCoach &&
                  !upstreamPlanningContextLoading &&
                  !upstreamPlanningContextError &&
                  upstreamPlanningContext?.upstreamPlanningContextLocked !== true ? (
                    <Alert variant="warning">{UPSTREAM_CONTEXT_NOT_LOCKED_MESSAGE}</Alert>
                  ) : null}
                  {isDownstreamDomainCoach ? (
                    renderDownstreamUpstreamPlanningReadOnlySection()
                  ) : (
                  <dl className="space-y-2">
                    <DetailRow
                      label="Backend readiness status"
                      value={displayValue(readinessPanel.readinessStatus)}
                    />
                    <DetailRow
                      label="Backend allows generation"
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
                      value={
                        workloadComplete
                          ? "Yes"
                          : "Pending — not ready"
                      }
                    />
                    <DetailRow
                      label="Season selected"
                      value={
                        seasonReady
                          ? "Yes"
                          : "Pending — not ready"
                      }
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
                      value={
                        goalsReadyForGeneration
                          ? "Yes"
                          : "Pending — not ready"
                      }
                    />
                  </dl>
                  )}
                  {readinessPanel.blockers.length > 0 ? (
                    <Alert variant="warning">
                      <div className="space-y-2">
                        <div className="font-medium">Backend blockers</div>
                        <ul className="list-inside list-disc space-y-1">
                          {readinessPanel.blockers.map((blocker) => (
                            <li key={blocker} className="whitespace-pre-wrap break-words">
                              {blocker}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Alert>
                  ) : null}
                  {generatePlanError ? <Alert variant="danger">{generatePlanError}</Alert> : null}
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
                  {requestedPlanId !== null ? (
                    isDownstreamDomainCoach && persistedPlanDisplayDomain === "SKILLS" ? (
                      <WorkflowNeutralNotice>
                        <div className="text-sm text-textSecondary">
                          This link opens a Skills plan. Use a saved plan for your assigned domain
                          (Nutrition or S&amp;C), or ask the planning owner for the correct link.
                        </div>
                      </WorkflowNeutralNotice>
                    ) : persistedSkillsPlanError ? (
                      <Alert variant="danger">{persistedSkillsPlanError}</Alert>
                    ) : persistedSkillsPlanLoading ? (
                      <div className="text-sm text-textSecondary">
                        Loading persisted Skills plan…
                      </div>
                    ) : persistedSkillsPlanDetail ? (
                      <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
                        <h4 className="text-sm font-semibold text-textPrimary">
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
                            <h5 className="text-sm font-semibold text-textPrimary">
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
                                <div className="text-sm font-semibold text-textPrimary">
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
                            <h5 className="text-sm font-semibold text-textPrimary">
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
                            <h5 className="text-sm font-semibold text-textPrimary">
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
                  {shouldLoadLatestSkillsDraft ? (
                    latestSkillsDraftError ? (
                      <Alert variant="danger">{latestSkillsDraftError}</Alert>
                    ) : latestSkillsDraftMissing ? (
                      <div className="text-sm text-textSecondary">
                        {generationDraftEmptyState(latestDraftDisplayDomain ?? "SKILLS")}
                      </div>
                    ) : latestSkillsDraft ? (
                      <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
                        <h4 className="text-sm font-semibold text-textPrimary">
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
                              <div className="text-sm font-semibold text-textPrimary">
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
                                ? renderNutritionDaySummary(day)
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
                                  {session.items.map((item, itemOffset) => (
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
                                          latestDraftDisplayDomain === "SKILLS" ? (
                                          <DetailRow
                                            label="Summary"
                                            value={displayValue(item.summary)}
                                          />
                                          ) : null
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
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                        {latestDraftDisplayDomain === "SKILLS" && !isDownstreamDomainCoach ? (
                          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                            <h5 className="text-sm font-semibold text-textPrimary">
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
                            <h5 className="text-sm font-semibold text-textPrimary">
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
                            <h5 className="text-sm font-semibold text-textPrimary">
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
                                !latestSkillsDraft.trainingPlanId ||
                                !latestSkillsDraft.trainingPlanVersionId
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
                  {requestedPlanId !== null ? (
                    persistedPlanDisplayDomain === "S_AND_C" ? (
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" disabled>
                          {persistedPlanReviseButtonLabel(persistedPlanDisplayDomain)}
                        </Button>
                      </div>
                    ) : null
                  ) : allowedGenerationDomains.length === 0 ? (
                    <div className="text-sm text-textSecondary">
                      You do not currently have a generation function assigned.
                    </div>
                  ) : isDownstreamDomainCoach &&
                    upstreamPlanningContext?.upstreamPlanningContextLocked !== true ? (
                    <div className="text-sm text-textSecondary">
                      Domain generation is unavailable until upstream planning context is locked.
                    </div>
                  ) : (
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
                      <div className="flex flex-wrap gap-2">
                        {allowedGenerationDomains.map((domain) => (
                          <Button
                            key={domain}
                            type="button"
                            variant="primary"
                            disabled={
                              generatePlanActionDisabled ||
                              (generatePlanLocalErrorsByDomain[domain] ?? null) !== null
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
                    </div>
                  )}
                  {renderStep6WorkflowActionsStrip()}
              </section>
              )
            ) : null}
            </div>
          </Card>

          <DashboardCardShell accent={false} title="Planning Status">
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
                value={formatPlanningProfileDateDisplay(profile.lastConfirmedAt)}
              />
              <DetailRow label="Updated At" value={formatPlanningProfileDateDisplay(profile.updatedAt)} />
            </dl>
          </DashboardCardShell>

          <DashboardCardShell accent={false} title="Derived Values">
            <dl className="space-y-2">
              <DetailRow label="Derived Age" value={displayValue(profile.derivedAge)} />
              <DetailRow label="Derived BMI" value={displayValue(profile.derivedBmi)} />
            </dl>
          </DashboardCardShell>

          <DashboardCardShell accent={false} title="Athlete Planning Fields">
            <dl className="space-y-2">
              <DetailRow label="Date of Birth" value={formatPlanningProfileDateDisplay(profile.dateOfBirth)} />
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
              <DetailRow label="Last Sync At" value={formatPlanningProfileDateDisplay(profile.lastSyncAt)} />
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
        </>
      ) : null}
    </div>
  );
}
