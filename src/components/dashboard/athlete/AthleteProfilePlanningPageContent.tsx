"use client";

import { Badge } from "@/components/ui/Badge";
import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import { fetchAthleteMeProfile } from "@/lib/api/athleteMe";
import {
  buildPlanningProfileDefaults,
  buildPlanningProfileFormState,
  buildPlanningProfilePatchBody,
  collectPlanningProfileValidationErrors,
  createPlanningProfileMe,
  fetchPlanningProfileMe,
  getPlanningFieldType,
  isEditableField,
  patchPlanningProfileMe,
  shouldRenderField,
  validatePlanningProfileDraft,
  type PlanningAllergiesIntolerancesForm,
  type PlanningFormValue,
  type PlanningFormRecord,
  type PlanningProfileFormState,
  type PlanningProfileGroupName,
  type PlanningProfileRecord,
} from "@/lib/api/planning-profile";
import { isNormalizedApiError } from "@/lib/apiClient";
import { useCallback, useEffect, useMemo, useState } from "react";

type ViewState =
  | { phase: "loading" }
  | {
      phase: "ready";
      mode: "create" | "existing";
      record: PlanningProfileRecord | null;
    }
  | { phase: "error"; message: string };

type AthleteProfileDefaults = { primarySport: string };

type AthleteProfileDefaultsDiagnostic =
  | { kind: "ok" }
  | { kind: "missing_fields"; missing: Array<"sport"> }
  | { kind: "fetch_error"; message: string };

const DIET_TYPE_OPTIONS = [
  { value: "", label: "Select diet type" },
  { value: "OMNIVORE", label: "Omnivore" },
  { value: "VEGETARIAN", label: "Vegetarian" },
  { value: "VEGAN", label: "Vegan" },
  { value: "PESCATARIAN", label: "Pescatarian" },
  { value: "HALAL", label: "Halal" },
  { value: "KOSHER", label: "Kosher" },
  { value: "GLUTEN_FREE", label: "Gluten-free" },
  { value: "DAIRY_FREE", label: "Dairy-free" },
  { value: "OTHER", label: "Other" },
] as const;

const SEX_OPTIONS = [
  { value: "", label: "Select gender" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
] as const;

const REGIONAL_CUISINE_OPTIONS = [
  "North Indian",
  "South Indian",
  "West Indian",
  "East Indian",
  "Continental",
  "Asian",
  "Mediterranean",
  "Middle Eastern",
  "Latin American",
  "Open to all",
] as const;

const ALLERGY_OPTIONS = [
  "Celery",
  "Cereals containing gluten",
  "Crustaceans",
  "Eggs",
  "Fish",
  "Lupin",
  "Milk",
  "Molluscs",
  "Mustard",
  "Nuts",
  "Peanuts",
  "Sesame seeds",
  "Soya",
  "Sulphites",
] as const;

const INTOLERANCE_OPTIONS = [
  "Lactose Intolerant",
  "Gluten Intolerant",
  "FODMAP Sensitivity",
  "Histamine Intolerance",
  "Fructose Intolerance",
] as const;

const SPECIAL_SELECTABLE_OPTIONS = [
  "Others",
] as const;

const NO_FOOD_ALLERGIES_OPTION = "I do not have food allergies";
const SPORT_PERFORMANCE_LEVEL_FIELD =
  "highestCompetitionLevelReachedPast12Months";
const SPORT_PERFORMANCE_RANKING_FIELD =
  "highestRankingAchievedAtThatLevelPast12Months";
const FASTING_BLOOD_GLUCOSE_FIELD = "fastingBloodGlucoseFBS";
const POSTPRANDIAL_BLOOD_GLUCOSE_FIELD = "postprandialBloodGlucosePPBS";
const SPORT_PERFORMANCE_LEVEL_OPTIONS = [
  {
    value: "",
    label: "Select competition level",
  },
  { value: "DISTRICT", label: "District" },
  { value: "STATE", label: "State" },
  { value: "NATIONAL", label: "National" },
  { value: "INTERNATIONAL", label: "International" },
] as const;
const HEALTHY_INJURY_STATUS = "HEALTHY";
const INJURED_INJURY_STATUS = "INJURED";
const IN_REHAB_INJURY_STATUS = "IN_REHAB";
const INJURY_STATUS_OPTIONS = [
  { value: "", label: "Select injury status" },
  { value: HEALTHY_INJURY_STATUS, label: "Healthy" },
  { value: INJURED_INJURY_STATUS, label: "Injured" },
  { value: IN_REHAB_INJURY_STATUS, label: "In Rehab" },
] as const;
const ALLERGIES_SELECTABLE_OPTIONS = [
  ...ALLERGY_OPTIONS,
  ...INTOLERANCE_OPTIONS,
  ...SPECIAL_SELECTABLE_OPTIONS,
] as const;

const SECTION_ORDER: Array<{
  key: PlanningProfileGroupName;
  title: string;
  description?: string;
}> = [
  { key: "athleteContext", title: "Athlete Context" },
  { key: "sportContext", title: "Sport Context" },
  { key: "sportPerformance", title: "Sport Performance" },
  { key: "trainingExposure", title: "Training Exposure" },
  { key: "healthStatus", title: "Health Status" },
  { key: "nutritionContext", title: "Nutrition Context" },
  { key: "wearables", title: "Wearables" },
  {
    key: "derivedPlanningInputs",
    title: "Derived Planning Inputs",
    description: "Read-only backend output",
  },
  {
    key: "bloodReportParameters",
    title: "Blood Report Parameters",
    description: "Advanced (Optional)",
  },
  {
    key: "bodyCompositionParameters",
    title: "Body Composition Parameters",
    description: "Advanced (Optional)",
  },
] as const;

const KNOWN_FIELD_ORDER: Partial<Record<PlanningProfileGroupName, string[]>> = {
  athleteContext: ["dateOfBirth", "sex"],
  sportContext: ["primarySport", "disciplineOrEvent", "validatedLevel"],
  sportPerformance: [
    SPORT_PERFORMANCE_LEVEL_FIELD,
    SPORT_PERFORMANCE_RANKING_FIELD,
  ],
  trainingExposure: [
    "trainingAgeYears",
    "currentWeeklyTrainingExposureHours",
    "weeklyAvailabilityDays",
    "weeklyAvailabilityHours",
  ],
  healthStatus: ["heightCm", "weightKg", "injuryStatus", "injuryArea", "injuryNotes"],
  nutritionContext: [
    "dietType",
    "regionalCuisinePreference",
    "allergiesIntolerances",
  ],
  bloodReportParameters: [
    "hemoglobin",
    "vitaminD",
    "vitaminB12",
    "ferritin",
    "crp",
    FASTING_BLOOD_GLUCOSE_FIELD,
    POSTPRANDIAL_BLOOD_GLUCOSE_FIELD,
  ],
  bodyCompositionParameters: [
    "bodyFatPercent",
    "skeletalLeanMassKg",
    "skeletalFatMassKg",
    "visceralFatLevel",
    "bmrKcalDay",
    "muscleMassKg",
  ],
};

function formatApiError(e: unknown, fallback: string): string {
  if (isNormalizedApiError(e)) {
    if (e.status === 403) {
      const server = e.message.trim();
      if (server !== "") return `Access denied. ${server}`;
      return "Access denied. You don't have permission to perform this action.";
    }
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

function displayText(
  value: string | number | boolean | string[] | null | undefined,
): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  const text = String(value).trim();
  return text === "" ? "—" : text;
}

function displayDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function todayDateInputMax(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toFieldLabel(field: string): string {
  const overrides: Record<string, string> = {
    dateOfBirth: "Date of Birth",
    sex: "Gender",
    primarySport: "Primary Sport",
    disciplineOrEvent: "Discipline / Event",
    trainingAgeYears: "How many years of training have you done so far?",
    currentWeeklyTrainingExposureHours:
      "How many hours do you usually train per week?",
    highestCompetitionLevelReachedPast12Months:
      "Highest Competition Level Reached in the Past 12 Months",
    highestRankingAchievedAtThatLevelPast12Months:
      "Highest Ranking Achieved at That Level in the Past 12 Months",
    injuryStatus: "Injury Status",
    injuryArea: "Injury Area",
    injuryNotes: "Injury Notes",
    hemoglobin: "Hemoglobin (g/dL)",
    vitaminD: "Vitamin D — 25-OH D (ng/mL)",
    vitaminB12: "Vitamin B12 (pg/mL)",
    ferritin: "Ferritin (ng/mL)",
    crp: "CRP — C-Reactive Protein (mg/L)",
    fastingBloodGlucoseFBS: "Fasting Blood Glucose (FBS)",
    postprandialBloodGlucosePPBS: "Postprandial Blood Glucose (PPBS)",
    bodyFatPercent: "Body Fat Percentage (%)",
    skeletalLeanMassKg: "Skeletal Muscle Mass (kg)",
    skeletalFatMassKg: "Body Fat Mass (kg)",
    visceralFatLevel: "Visceral Fat Level",
    bmrKcalDay: "Basal Metabolic Rate (kcal/day)",
    muscleMassKg: "Muscle Mass (kg)",
    weeklyAvailabilityDays:
      "How many days are you generally available to train in a week?",
    weeklyAvailabilityHours:
      "How many hours in a week are you generally available for training?",
    dietType: "Diet Type",
    regionalCuisinePreference: "Regional Cuisine Preference",
    allergiesIntolerances: "Allergies / Intolerances",
    heightCm: "Height (cm)",
    weightKg: "Weight (kg)",
    validatedLevel: "Validated Level",
    planningEligibilityStatus: "Planning Eligibility",
    planningInputCompleteness: "Planning Input Completeness",
    missingRequiredFields: "Missing Required Fields",
    derivedAge: "Derived Age",
    derivedBmi: "Derived BMI",
    lastConfirmedAt: "Last Confirmed At",
    lastSyncAt: "Last Sync At",
    freshnessStatus: "Freshness Status",
    stage: "Stage",
  };
  if (overrides[field]) return overrides[field];
  return field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());
}

function statusBadgeVariant(
  value: string | null,
): "success" | "warning" | "danger" {
  const normalized = value?.trim().toUpperCase() ?? "";
  if (normalized.includes("INELIGIBLE") || normalized.includes("DENIED")) {
    return "danger";
  }
  if (
    normalized.includes("ELIGIBLE") ||
    normalized === "COMPLETE" ||
    normalized === "READY"
  ) {
    return "success";
  }
  if (
    normalized.includes("INCOMPLETE") ||
    normalized.includes("PENDING") ||
    normalized.includes("MISSING")
  ) {
    return "warning";
  }
  return normalized === "" ? "warning" : "danger";
}

function displayFieldValue(
  field: string,
  value: string | number | boolean | string[] | null | undefined,
): string {
  if (
    field === "dateOfBirth" ||
    field === "lastConfirmedAt" ||
    field === "lastSyncAt" ||
    field === "updatedAt" ||
    field === "confirmedAt"
  ) {
    return displayDate(typeof value === "string" ? value : null);
  }
  return displayText(value);
}

function orderedFieldNames(
  group: PlanningProfileGroupName,
  values: PlanningFormRecord,
  record: PlanningProfileRecord | null,
): string[] {
  const keys = new Set([
    ...Object.keys(values),
    ...Object.keys(record?.[group] ?? {}),
  ]);
  if (group === "sportContext") {
    keys.add("primarySport");
    keys.add("validatedLevel");
  }
  const preferred = KNOWN_FIELD_ORDER[group] ?? [];
  /** Always show known Stage 1 / optional Stage 2 fields — not only keys already present (empty create draft had almost no keys). */
  const ordered = preferred.filter((field) => shouldRenderField(group, field));
  const extras = [...keys]
    .filter((field) => !preferred.includes(field))
    .filter((field) => shouldRenderField(group, field))
    .sort((a, b) => a.localeCompare(b));
  return [...ordered, ...extras];
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

export function AthleteProfilePlanningPageContent() {
  const { accessContext, accessGateReady } = useAuth();
  const [state, setState] = useState<ViewState>({ phase: "loading" });
  const [draft, setDraft] = useState<PlanningProfileFormState>(
    buildPlanningProfileDefaults({}),
  );
  const [baseline, setBaseline] = useState<PlanningProfileFormState | null>(null);
  const [athleteProfileDefaults, setAthleteProfileDefaults] =
    useState<AthleteProfileDefaults>({
      primarySport: "",
    });
  const [athleteProfileDefaultsDiagnostic, setAthleteProfileDefaultsDiagnostic] =
    useState<AthleteProfileDefaultsDiagnostic>({ kind: "ok" });
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const entityId = useMemo(
    () => accessContext?.academy.trainingEntityId?.trim() ?? "",
    [accessContext],
  );
  const validationErrors = useMemo(
    () => collectPlanningProfileValidationErrors(draft),
    [draft],
  );

  const load = useCallback(async () => {
    if (!accessGateReady) {
      setState({ phase: "loading" });
      return;
    }

    setState({ phase: "loading" });
    setSaveError(null);
    setSaveSuccess(null);
    setShowValidationErrors(false);

    let defaults: AthleteProfileDefaults = {
      primarySport: "",
    };
    let defaultsDiagnostic: AthleteProfileDefaultsDiagnostic = { kind: "ok" };
    try {
      const profile = await fetchAthleteMeProfile();
      defaults = {
        primarySport: profile.sport,
      };
      const missing: Array<"sport"> = [];
      if (profile.sport.trim() === "") missing.push("sport");
      if (missing.length > 0) {
        defaultsDiagnostic = { kind: "missing_fields", missing };
      }
    } catch (e) {
      defaultsDiagnostic = {
        kind: "fetch_error",
        message: formatApiError(
          e,
          "Could not load athlete profile defaults for primary sport.",
        ),
      };
    }
    setAthleteProfileDefaults(defaults);
    setAthleteProfileDefaultsDiagnostic(defaultsDiagnostic);

    if (entityId === "") {
      setState({
        phase: "error",
        message:
          "No active training entity is available for this athlete. Resolve membership/onboarding first.",
      });
      return;
    }

    try {
      const result = await fetchPlanningProfileMe(entityId);
      if (result.kind === "found") {
        const loadedDraft = buildPlanningProfileFormState(
          result.record,
          buildPlanningProfileDefaults(defaults),
        );
        setState({ phase: "ready", mode: "existing", record: result.record });
        setDraft(loadedDraft);
        setBaseline(loadedDraft);
        setIsEditingExisting(false);
        return;
      }
      const defaultsDraft = buildPlanningProfileDefaults(defaults);
      setState({ phase: "ready", mode: "create", record: null });
      setDraft(defaultsDraft);
      setBaseline(null);
      setIsEditingExisting(true);
    } catch (e) {
      setState({
        phase: "error",
        message: formatApiError(
          e,
          "Could not load Athlete Profile Planning data. Try again shortly.",
        ),
      });
    }
  }, [accessGateReady, entityId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.phase === "loading") {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-textSecondary">
        Loading athlete profile planning…
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="space-y-4">
        <Alert variant="danger">{state.message}</Alert>
        <Button type="button" variant="secondary" onClick={() => void load()}>
          Try again
        </Button>
      </div>
    );
  }

  const mode = state.mode;
  const record = state.record;
  const lastUpdatedText = record?.updatedAt ? displayDate(record.updatedAt) : null;

  const createMode = mode === "create";
  const canEditFields = createMode || isEditingExisting;
  const formDisabled = saveBusy || !canEditFields;

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!createMode || entityId === "") return;
    setShowValidationErrors(true);
    const hasFieldErrors = Object.keys(validationErrors).length > 0;
    if (hasFieldErrors) {
      setSaveError("Please fix the highlighted fields.");
      setSaveSuccess(null);
      return;
    }
    const validationError = validatePlanningProfileDraft(draft, record);
    if (validationError) {
      setSaveError(validationError);
      setSaveSuccess(null);
      return;
    }
    setSaveBusy(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const created = await createPlanningProfileMe(entityId, draft, record);
      const createdDraft = buildPlanningProfileFormState(
        created,
        buildPlanningProfileDefaults(athleteProfileDefaults),
      );
      setState({ phase: "ready", mode: "existing", record: created });
      setDraft(createdDraft);
      setBaseline(createdDraft);
      setIsEditingExisting(false);
      setShowValidationErrors(false);
      setSaveSuccess("Athlete profile planning saved.");
    } catch (e2) {
      setSaveError(
        formatApiError(e2, "Could not save Athlete Profile Planning data."),
      );
    } finally {
      setSaveBusy(false);
    }
  }

  async function handlePatchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (createMode || entityId === "") return;
    setShowValidationErrors(true);
    const hasFieldErrors = Object.keys(validationErrors).length > 0;
    if (hasFieldErrors) {
      setSaveError("Please fix the highlighted fields.");
      setSaveSuccess(null);
      return;
    }
    if (!baseline) {
      setSaveError("Baseline profile data is missing. Reload and try again.");
      setSaveSuccess(null);
      return;
    }

    let patchBody: Record<string, unknown>;
    try {
      patchBody = buildPlanningProfilePatchBody(baseline, draft, record);
    } catch (e2) {
      setSaveError(
        formatApiError(e2, "Could not validate Athlete Profile Planning data."),
      );
      setSaveSuccess(null);
      return;
    }

    if (Object.keys(patchBody).length === 0) {
      setSaveError(null);
      setSaveSuccess("No changes to save");
      return;
    }

    setSaveBusy(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const updated = await patchPlanningProfileMe(entityId, baseline, draft, record);
      const updatedDraft = buildPlanningProfileFormState(
        updated,
        buildPlanningProfileDefaults(athleteProfileDefaults),
      );
      setState({ phase: "ready", mode: "existing", record: updated });
      setDraft(updatedDraft);
      setBaseline(updatedDraft);
      setIsEditingExisting(false);
      setShowValidationErrors(false);
      setSaveSuccess("Athlete profile planning updated.");
    } catch (e2) {
      setSaveError(
        formatApiError(e2, "Could not update Athlete Profile Planning data."),
      );
    } finally {
      setSaveBusy(false);
    }
  }

  function updateField(
    group: PlanningProfileGroupName,
    field: string,
    value: PlanningFormValue,
  ) {
    setDraft((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: value,
      },
    }));
  }

  function renderEditableField(
    group: PlanningProfileGroupName,
    field: string,
    value: PlanningFormValue,
  ) {
    const type = getPlanningFieldType(group, field, record);
    const label = toFieldLabel(field);
    const readOnly = !isEditableField(group, field) || formDisabled;
    const fieldError = showValidationErrors
      ? validationErrors[`${group}.${field}`]
      : undefined;
    if (group === "nutritionContext" && field === "regionalCuisinePreference") {
      const selectedValues = Array.isArray(value) ? value : [];
      const selectedSet = new Set(selectedValues);
      const selectedSummary = REGIONAL_CUISINE_OPTIONS.filter((option) =>
        selectedSet.has(option),
      );

      function toggleCuisine(option: string) {
        if (readOnly) return;
        const next = new Set(selectedSet);
        if (next.has(option)) next.delete(option);
        else next.add(option);
        const ordered = REGIONAL_CUISINE_OPTIONS.filter((item) => next.has(item));
        updateField(group, field, ordered);
      }

      return (
        <FormField key={`${group}-${field}`} id={`${group}-${field}`} label={label} error={fieldError}>
          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="flex flex-wrap gap-2">
              {REGIONAL_CUISINE_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="inline-flex w-full min-w-0 cursor-pointer items-start gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-sm text-textPrimary sm:w-auto"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={selectedSet.has(option)}
                    disabled={readOnly}
                    onChange={() => toggleCuisine(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
          <p className="text-xs text-textSecondary">
            {selectedSummary.length > 0
              ? `Selected: ${selectedSummary.join(", ")}`
              : "No selection yet. Leave empty if no preference."}
          </p>
        </FormField>
      );
    }
    if (group === "nutritionContext" && field === "allergiesIntolerances") {
      const rawAllergiesValue =
        value && typeof value === "object" && !Array.isArray(value)
          ? (value as Partial<PlanningAllergiesIntolerancesForm>)
          : null;
      const allergiesValue: PlanningAllergiesIntolerancesForm =
        rawAllergiesValue
          ? {
              selected: Array.isArray(rawAllergiesValue.selected)
                ? rawAllergiesValue.selected.filter(
                    (item): item is string => typeof item === "string",
                  )
                : [],
              othersText:
                typeof rawAllergiesValue.othersText === "string"
                  ? rawAllergiesValue.othersText
                  : "",
              noFoodAllergies: rawAllergiesValue.noFoodAllergies === true,
            }
          : { selected: [], othersText: "", noFoodAllergies: false };
      const selectedSet = new Set(allergiesValue.selected);
      const hasOthers = selectedSet.has("Others");
      const othersText = hasOthers ? allergiesValue.othersText : "";

      function updateAllergies(next: PlanningAllergiesIntolerancesForm) {
        updateField(group, field, next);
      }

      function toggleAllergyOption(option: string) {
        if (readOnly || allergiesValue.noFoodAllergies) return;
        const nextSet = new Set(selectedSet);
        if (nextSet.has(option)) nextSet.delete(option);
        else nextSet.add(option);
        const orderedSelection = ALLERGIES_SELECTABLE_OPTIONS.filter((item) =>
          nextSet.has(item),
        );
        updateAllergies({
          selected: orderedSelection,
          othersText: nextSet.has("Others") ? allergiesValue.othersText : "",
          noFoodAllergies: false,
        });
      }

      function toggleNoFoodAllergies() {
        if (readOnly) return;
        if (allergiesValue.noFoodAllergies) {
          updateAllergies({
            selected: [],
            othersText: "",
            noFoodAllergies: false,
          });
          return;
        }
        updateAllergies({
          selected: [],
          othersText: "",
          noFoodAllergies: true,
        });
      }

      return (
        <FormField key={`${group}-${field}`} id={`${group}-${field}`} label={label} error={fieldError}>
          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-textSecondary">
                  Allergies
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALLERGY_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="inline-flex w-full min-w-0 cursor-pointer items-start gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-sm text-textPrimary sm:w-auto"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={selectedSet.has(option)}
                        disabled={readOnly || allergiesValue.noFoodAllergies}
                        onChange={() => toggleAllergyOption(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-textSecondary">
                  Intolerances
                </p>
                <div className="flex flex-wrap gap-2">
                  {INTOLERANCE_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="inline-flex w-full min-w-0 cursor-pointer items-start gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-sm text-textPrimary sm:w-auto"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={selectedSet.has(option)}
                        disabled={readOnly || allergiesValue.noFoodAllergies}
                        onChange={() => toggleAllergyOption(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-textSecondary">
                  Special
                </p>
                <div className="flex flex-wrap gap-2">
                  {SPECIAL_SELECTABLE_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="inline-flex w-full min-w-0 cursor-pointer items-start gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-sm text-textPrimary sm:w-auto"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={selectedSet.has(option)}
                        disabled={readOnly || allergiesValue.noFoodAllergies}
                        onChange={() => toggleAllergyOption(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                  <label className="inline-flex w-full min-w-0 cursor-pointer items-start gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-sm text-textPrimary sm:w-auto">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={allergiesValue.noFoodAllergies}
                      disabled={readOnly}
                      onChange={toggleNoFoodAllergies}
                    />
                    <span>{NO_FOOD_ALLERGIES_OPTION}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          {hasOthers ? (
            <div className="space-y-1">
              <Input
                id={`${group}-${field}-others`}
                value={othersText}
                disabled={readOnly || allergiesValue.noFoodAllergies}
                placeholder="Others (please specify)"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateAllergies({
                    selected: [...allergiesValue.selected],
                    othersText: e.target.value,
                    noFoodAllergies: false,
                  })
                }
              />
            </div>
          ) : null}
          {allergiesValue.noFoodAllergies ? (
            <p className="text-xs text-textSecondary">
              Other options are disabled while &quot;{NO_FOOD_ALLERGIES_OPTION}&quot; is
              selected.
            </p>
          ) : null}
        </FormField>
      );
    }

    if (group === "athleteContext" && field === "sex") {
      return (
        <FormField key={`${group}-${field}`} id={`${group}-${field}`} label={label} error={fieldError}>
          <Select
            id={`${group}-${field}`}
            value={typeof value === "string" ? value : ""}
            disabled={readOnly}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              updateField(group, field, e.target.value)
            }
          >
            {SEX_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormField>
      );
    }

    if (group === "sportPerformance" && field === SPORT_PERFORMANCE_LEVEL_FIELD) {
      return (
        <FormField key={`${group}-${field}`} id={`${group}-${field}`} label={label} error={fieldError}>
          <Select
            id={`${group}-${field}`}
            value={typeof value === "string" ? value : ""}
            disabled={readOnly}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const nextLevel = e.target.value;
              updateField(group, field, nextLevel);
              if (nextLevel === "") {
                updateField(group, SPORT_PERFORMANCE_RANKING_FIELD, "");
              }
            }}
          >
            {SPORT_PERFORMANCE_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
      );
    }

    if (group === "sportPerformance" && field === SPORT_PERFORMANCE_RANKING_FIELD) {
      const levelValue =
        typeof draft.sportPerformance[SPORT_PERFORMANCE_LEVEL_FIELD] === "string"
          ? draft.sportPerformance[SPORT_PERFORMANCE_LEVEL_FIELD]
          : "";
      const hasLevel = levelValue.trim() !== "";
      return (
        <FormField key={`${group}-${field}`} id={`${group}-${field}`} label={label} error={fieldError}>
          <Input
            id={`${group}-${field}`}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={hasLevel && typeof value === "string" ? value : ""}
            disabled={readOnly || !hasLevel}
            placeholder={hasLevel ? undefined : "Select competition level first"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateField(group, field, e.target.value)
            }
          />
        </FormField>
      );
    }

    if (group === "healthStatus" && field === "injuryStatus") {
      return (
        <FormField key={`${group}-${field}`} id={`${group}-${field}`} label={label} error={fieldError}>
          <Select
            id={`${group}-${field}`}
            value={typeof value === "string" ? value : ""}
            disabled={readOnly}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const nextStatus = e.target.value;
              updateField(group, field, nextStatus);
              if (nextStatus === HEALTHY_INJURY_STATUS) {
                updateField(group, "injuryArea", "");
                updateField(group, "injuryNotes", "");
              }
            }}
          >
            {INJURY_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
      );
    }

    if (group === "healthStatus" && (field === "injuryArea" || field === "injuryNotes")) {
      const injuryStatusValue =
        typeof draft.healthStatus.injuryStatus === "string"
          ? draft.healthStatus.injuryStatus
          : "";
      const showInjuryDetails =
        injuryStatusValue === INJURED_INJURY_STATUS ||
        injuryStatusValue === IN_REHAB_INJURY_STATUS;
      if (!showInjuryDetails) return null;
      if (field === "injuryNotes") {
        return (
          <FormField key={`${group}-${field}`} id={`${group}-${field}`} label={label}>
            <textarea
              id={`${group}-${field}`}
              value={typeof value === "string" ? value : ""}
              rows={4}
              readOnly={!isEditableField(group, field)}
              disabled={readOnly}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-textPrimary caret-current placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                updateField(group, field, e.target.value)
              }
            />
          </FormField>
        );
      }
      return (
        <FormField key={`${group}-${field}`} id={`${group}-${field}`} label={label} error={fieldError}>
          <Input
            id={`${group}-${field}`}
            value={typeof value === "string" ? value : ""}
            readOnly={!isEditableField(group, field)}
            disabled={readOnly}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateField(group, field, e.target.value)
            }
          />
        </FormField>
      );
    }

    if (
      group === "bloodReportParameters" &&
      (field === FASTING_BLOOD_GLUCOSE_FIELD ||
        field === POSTPRANDIAL_BLOOD_GLUCOSE_FIELD)
    ) {
      return (
        <FormField
          key={`${group}-${field}`}
          id={`${group}-${field}`}
          label={label}
          helperText="Unit: mg/dL"
          error={fieldError}
        >
          <Input
            id={`${group}-${field}`}
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={typeof value === "string" ? value : ""}
            readOnly={!isEditableField(group, field)}
            disabled={readOnly}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateField(group, field, e.target.value)
            }
          />
        </FormField>
      );
    }

    const scalarValue = typeof value === "string" ? value : "";
    if (field === "dateOfBirth") {
      return (
        <FormField key={`${group}-${field}`} id={`${group}-${field}`} label={label} error={fieldError}>
          <Input
            id={`${group}-${field}`}
            type="date"
            max={todayDateInputMax()}
            value={scalarValue}
            readOnly={!isEditableField(group, field)}
            disabled={readOnly}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateField(group, field, e.target.value)
            }
          />
        </FormField>
      );
    }
    if (field === "dietType") {
      return (
        <FormField key={`${group}-${field}`} id={`${group}-${field}`} label={label} error={fieldError}>
          <Select
            id={`${group}-${field}`}
            value={scalarValue}
            disabled={readOnly}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              updateField(group, field, e.target.value)
            }
          >
            {DIET_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormField>
      );
    }
    if (type === "boolean") {
      return (
        <FormField key={`${group}-${field}`} id={`${group}-${field}`} label={label}>
          <Select
            id={`${group}-${field}`}
            value={scalarValue}
            disabled={readOnly}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              updateField(group, field, e.target.value)
            }
          >
            <option value="">Select option</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
        </FormField>
      );
    }
    return (
      <FormField key={`${group}-${field}`} id={`${group}-${field}`} label={label} error={fieldError}>
        <Input
          id={`${group}-${field}`}
          value={scalarValue}
          readOnly={!isEditableField(group, field)}
          disabled={readOnly}
          inputMode={type === "number" ? "decimal" : undefined}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateField(group, field, e.target.value)
          }
        />
      </FormField>
    );
  }

  function renderGroupCard(group: PlanningProfileGroupName) {
    const section = SECTION_ORDER.find((item) => item.key === group);
    const values = draft[group];

    if (group === "wearables") {
      return (
        <DashboardCardShell
          key={group}
          title={section?.title ?? "Wearables"}
        >
          <div className="space-y-3">
            {section?.description ? (
              <p className="text-sm text-textSecondary">{section.description}</p>
            ) : null}
            <div className="rounded-md border border-border bg-surface p-3">
              <p className="text-sm text-textPrimary">Wearable Status: No</p>
            </div>
          </div>
        </DashboardCardShell>
      );
    }

    if (group === "derivedPlanningInputs") {
      const derivedFields = Object.keys(record?.derivedPlanningInputs ?? {}).filter(
        (field) =>
          ![
            "planningEligibilityStatus",
            "planningInputCompleteness",
            "missingRequiredFields",
            "validatedLevel",
          ].includes(field),
      );
      return (
        <DashboardCardShell
          key={group}
          title={section?.title ?? "Derived Planning Inputs"}
        >
          <div className="space-y-4">
            {section?.description ? (
              <p className="text-sm text-textSecondary">{section.description}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-textPrimary">
                Planning Eligibility:
              </span>
              <Badge variant={statusBadgeVariant(record?.planningEligibilityStatus ?? null)}>
                {displayText(record?.planningEligibilityStatus)}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-textPrimary">
                Planning Input Completeness:
              </span>
              <Badge variant={statusBadgeVariant(record?.planningInputCompleteness ?? null)}>
                {displayText(record?.planningInputCompleteness)}
              </Badge>
            </div>
            {record?.missingRequiredFields.length ? (
              <Alert variant="warning">
                <div className="space-y-2">
                  <p className="font-medium">Missing required fields</p>
                  <ul className="list-inside list-disc space-y-1">
                    {record.missingRequiredFields.map((field) => (
                      <li key={field}>{toFieldLabel(field)}</li>
                    ))}
                  </ul>
                </div>
              </Alert>
            ) : null}
            {derivedFields.length > 0 ? (
              <dl className="space-y-2">
                {derivedFields.map((field) => (
                  <DetailRow
                    key={`${group}-${field}`}
                    label={toFieldLabel(field)}
                    value={displayFieldValue(field, record?.[group][field])}
                  />
                ))}
              </dl>
            ) : (
              <p className="text-sm text-textSecondary">
                No additional derived planning inputs returned by the backend.
              </p>
            )}
          </div>
        </DashboardCardShell>
      );
    }

    const fields = orderedFieldNames(group, values, record);
    return (
      <DashboardCardShell
        key={group}
        title={section?.title ?? group}
      >
        <div className="space-y-3">
          {section?.description ? (
            <p className="text-sm text-textSecondary">{section.description}</p>
          ) : null}
          {fields.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {fields.map((field) => {
                if (group === "sportContext" && field === "validatedLevel") {
                  return (
                    <div
                      key={`${group}-${field}`}
                      className="rounded-md border border-border bg-surface p-3"
                    >
                      <p className="text-xs font-medium text-textMuted">
                        {toFieldLabel(field)}
                      </p>
                      <p className="text-sm text-textPrimary">
                        {displayText(record?.validatedLevel)}
                      </p>
                    </div>
                  );
                }
                return renderEditableField(group, field, values[field] ?? "");
              })}
            </div>
          ) : (
            <p className="text-sm text-textSecondary">
              {group === "bloodReportParameters" || group === "bodyCompositionParameters"
                ? "No advanced optional fields returned by the backend yet."
                : "No fields available in this section yet."}
            </p>
          )}
        </div>
      </DashboardCardShell>
    );
  }

  function handleStartEditing() {
    if (createMode) return;
    setSaveError(null);
    setSaveSuccess(null);
    setShowValidationErrors(false);
    setIsEditingExisting(true);
  }

  function handleCancelEditing() {
    if (createMode) return;
    if (baseline) {
      setDraft(baseline);
    }
    setSaveError(null);
    setSaveSuccess(null);
    setShowValidationErrors(false);
    setIsEditingExisting(false);
  }

  return (
    <div className="space-y-4">
      <DashboardCardShell title="Planning Profile Form">
        {lastUpdatedText ? (
          <p className="text-xs text-textSecondary">Last updated: {lastUpdatedText}</p>
        ) : null}
        {createMode ? (
          <Alert variant="warning">
            No profile exists yet. Complete the grouped APP inputs and save to create
            your Athlete Profile Planning record.
          </Alert>
        ) : null}
        {athleteProfileDefaultsDiagnostic.kind === "missing_fields" ? (
          <Alert variant="warning">
            Athlete profile defaults loaded, but missing{" "}
            {athleteProfileDefaultsDiagnostic.missing.join(" and ")} from
            `GET /athletes/me`. Primary Sport could not be fully auto-filled.
          </Alert>
        ) : null}
        {athleteProfileDefaultsDiagnostic.kind === "fetch_error" ? (
          <Alert variant="warning">
            Could not load athlete profile defaults from `GET /athletes/me`:{" "}
            {athleteProfileDefaultsDiagnostic.message}
          </Alert>
        ) : null}
        {saveSuccess ? (
          <Alert variant="success" role="status">
            {saveSuccess}
          </Alert>
        ) : null}
        {saveError ? <Alert variant="danger">{saveError}</Alert> : null}
        <form
          className="grid grid-cols-1 gap-3 md:grid-cols-2"
          onSubmit={(e) =>
            void (createMode ? handleCreateSubmit(e) : handlePatchSubmit(e))
          }
        >
          <div className="md:col-span-2 space-y-4">
            {SECTION_ORDER.map((section) => renderGroupCard(section.key))}
          </div>

          <div className="md:col-span-2 flex items-center gap-2 pt-1">
            {createMode ? (
              <Button
                type="submit"
                variant="primary"
                loading={saveBusy}
                disabled={saveBusy}
              >
                Save Profile
              </Button>
            ) : isEditingExisting ? (
              <>
                <Button
                  type="submit"
                  variant="primary"
                  loading={saveBusy}
                  disabled={saveBusy}
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="neutral"
                  disabled={saveBusy}
                  onClick={handleCancelEditing}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="secondary"
                disabled={saveBusy}
                onClick={handleStartEditing}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </form>
      </DashboardCardShell>
    </div>
  );
}
