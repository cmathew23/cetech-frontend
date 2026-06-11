"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { postGolfSportMetricRecord } from "@/lib/api/sportMetricsGolf";
import { isNormalizedApiError } from "@/lib/apiClient";
import {
  buildGolfPrescribedContext,
  defaultOccurredAtForJournalDay,
  mapGolfSportMetricLogMode,
  resolveGolfDrillOrder,
  validateGolfDrillV2Form,
  validateGolfRoundSportMetricForm,
  type GolfDrillV2FormValues,
  type GolfSportMetricLogMode,
  type GolfSportMetricRoundFormValues,
} from "@/lib/sportMetrics/buildGolfPrescribedContext";
import { formatDateOnly } from "@/lib/dateTime";
import { useCallback, useEffect, useMemo, useState } from "react";

export type SportMetricsDrillLogContext = {
  entityId: string;
  athleteId: string;
  trainingPlanVersionId: string;
  plannedSessionId: string;
  dayDate: string;
  sessionTitle: string;
  sectionKey: string;
  drill: Record<string, unknown>;
  itemIndex: number;
};

export type LoggedDrillResultSummary = {
  attempts: number | null;
  successes: number | null;
  successRate: number | null;
  qualityRating: number | null;
  context: string | null;
  missesLeft: number | null;
  missesRight: number | null;
  missesShort: number | null;
  missesLong: number | null;
};

export type LogSportResultModalProps = {
  open: boolean;
  context: SportMetricsDrillLogContext | null;
  weekStartDate: string;
  weekEndDate: string;
  onClose: () => void;
  onSuccess: (drillKey: string, summary: LoggedDrillResultSummary) => void;
};

const MODE_OPTIONS: Array<{ value: GolfSportMetricLogMode; label: string }> = [
  { value: "PRACTICE_FACILITY", label: "Skills Training — Practice Facility" },
  { value: "SIMULATOR", label: "Skills Training — Simulator" },
  { value: "ACTUAL_ROUND", label: "Actual Round — On Course" },
];

const EMPTY_DRILL_FORM: GolfDrillV2FormValues = {
  context: "",
  attempts: "",
  successes: "",
  qualityRating: "",
  distanceBand: "",
  targetRadius: "",
  missesLeft: "",
  missesRight: "",
  missesShort: "",
  missesLong: "",
  notes: "",
};

const EMPTY_ROUND_FORM: GolfSportMetricRoundFormValues = {
  holesPlayed: "",
  score: "",
  par: "",
  putts: "",
  fairwaysHit: "",
  fairwaysPossible: "",
  greensInRegulation: "",
  girPossible: "",
  penalties: "",
  notes: "",
};

function readStringField(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function pickStringFromDrill(drill: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const text = readStringField(drill[key]);
    if (text !== null) return text;
  }
  return null;
}

function resolveSkillCategory(drill: Record<string, unknown>): string | null {
  return pickStringFromDrill(drill, ["skillCategory", "category"]);
}

function readFiniteNumberFromJson(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function readStringFromJson(value: unknown): string | null {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  return null;
}

function extractSuccessRateFromResponse(response: unknown): number | null {
  if (!response || typeof response !== "object") return null;
  const rec = response as Record<string, unknown>;
  const candidates = [
    rec.result,
    (rec.data as Record<string, unknown> | undefined)?.result,
    rec.data,
    rec,
  ];
  for (const source of candidates) {
    if (source && typeof source === "object") {
      const rate = readFiniteNumberFromJson(
        (source as Record<string, unknown>).successRate,
      );
      if (rate !== null) return rate;
    }
  }
  return null;
}

export function buildLoggedDrillSummary(
  valueJson: Record<string, unknown>,
  backendResponse: unknown,
): LoggedDrillResultSummary {
  const attempts = readFiniteNumberFromJson(valueJson.attempts);
  const successes = readFiniteNumberFromJson(
    valueJson.successes ?? valueJson.targetHits,
  );

  let successRate = extractSuccessRateFromResponse(backendResponse);
  if (successRate === null && attempts !== null && attempts > 0 && successes !== null) {
    successRate = Math.round((successes / attempts) * 1000) / 10;
  }

  return {
    attempts,
    successes,
    successRate,
    qualityRating: readFiniteNumberFromJson(valueJson.qualityRating),
    context: readStringFromJson(valueJson.context),
    missesLeft: readFiniteNumberFromJson(valueJson.missesLeft),
    missesRight: readFiniteNumberFromJson(valueJson.missesRight),
    missesShort: readFiniteNumberFromJson(valueJson.missesShort),
    missesLong: readFiniteNumberFromJson(valueJson.missesLong),
  };
}

function DrillClassificationDisplay({ drill }: { drill: Record<string, unknown> }) {
  const skillCode = pickStringFromDrill(drill, ["skillCode", "itemType"]);
  const skillArea = pickStringFromDrill(drill, ["skillArea", "golfTaxonomy", "taxonomy"]);
  const sportCapability = pickStringFromDrill(drill, ["sportCapability", "capability"]);
  const skillCategory = resolveSkillCategory(drill);

  const fields: Array<{ label: string; value: string }> = [];
  if (skillCode) fields.push({ label: "Skill Code", value: skillCode });
  if (skillArea) fields.push({ label: "Skill Area", value: skillArea });
  if (sportCapability) fields.push({ label: "Sport Capability", value: sportCapability });
  if (skillCategory) fields.push({ label: "Category", value: skillCategory });

  if (fields.length === 0) return null;

  return (
    <div className="rounded-md border border-slate-200/80 bg-slate-50/60 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-textSecondary">
        Planned Drill Classification
      </p>
      <dl className="mt-1 space-y-0.5">
        {fields.map((field) => (
          <div
            key={field.label}
            className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-2 text-xs"
          >
            <dt className="text-textSecondary">{field.label}</dt>
            <dd className="text-textPrimary">{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function drillLabelFromContext(context: SportMetricsDrillLogContext): string {
  const label =
    (typeof context.drill.label === "string" && context.drill.label.trim()) ||
    (typeof context.drill.name === "string" && context.drill.name.trim()) ||
    (typeof context.drill.title === "string" && context.drill.title.trim()) ||
    "";
  return label !== "" ? label : "Prescribed drill";
}

export function buildSportMetricsDrillKey(context: SportMetricsDrillLogContext): string {
  const order =
    typeof context.drill.order === "number"
      ? context.drill.order
      : context.itemIndex + 1;
  return `${context.plannedSessionId}::${context.sectionKey}::${order}::${context.itemIndex}`;
}

export function LogSportResultModal({
  open,
  context,
  weekStartDate,
  weekEndDate,
  onClose,
  onSuccess,
}: LogSportResultModalProps) {
  const [mode, setMode] = useState<GolfSportMetricLogMode>("PRACTICE_FACILITY");
  const [drillForm, setDrillForm] = useState<GolfDrillV2FormValues>(EMPTY_DRILL_FORM);
  const [roundForm, setRoundForm] = useState<GolfSportMetricRoundFormValues>(EMPTY_ROUND_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    setMode("PRACTICE_FACILITY");
    setDrillForm(EMPTY_DRILL_FORM);
    setRoundForm(EMPTY_ROUND_FORM);
    setSubmitting(false);
    setError(null);
  }, [open, context]);

  const occurredAt = useMemo(() => {
    if (!context) return new Date().toISOString();
    return defaultOccurredAtForJournalDay(context.dayDate);
  }, [context]);

  const occurredAtLabel = useMemo(() => {
    if (!context?.dayDate) return null;
    return formatDateOnly(context.dayDate);
  }, [context?.dayDate]);

  const handleDrillField =
    (field: keyof GolfDrillV2FormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDrillForm((current) => ({ ...current, [field]: event.target.value }));
      setError(null);
    };

  const handleRoundField =
    (field: keyof GolfSportMetricRoundFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setRoundForm((current) => ({ ...current, [field]: event.target.value }));
      setError(null);
    };

  const handleSubmit = useCallback(async () => {
    if (!context || submitting) return;

    const enums = mapGolfSportMetricLogMode(mode);
    const valueResult =
      mode === "ACTUAL_ROUND"
        ? validateGolfRoundSportMetricForm(roundForm)
        : validateGolfDrillV2Form(drillForm);

    if (!valueResult.ok) {
      setError(valueResult.error);
      return;
    }

    const prescribedContextJson = buildGolfPrescribedContext({
      drill: context.drill,
      itemIndex: context.itemIndex,
      plannedSessionId: context.plannedSessionId,
      trainingPlanVersionId: context.trainingPlanVersionId,
      sectionKey: context.sectionKey,
      sessionTitle: context.sessionTitle,
      dayDate: context.dayDate,
    });

    const goalId =
      typeof context.drill.goalId === "string" ? context.drill.goalId.trim() : "";
    const trainingSessionId =
      typeof context.drill.trainingSessionId === "string"
        ? context.drill.trainingSessionId.trim()
        : "";
    const plannedSkillItemOrder = resolveGolfDrillOrder(context.drill, context.itemIndex);

    setSubmitting(true);
    setError(null);

    try {
      const response = await postGolfSportMetricRecord(context.entityId, context.athleteId, {
        trainingPlanVersionId: context.trainingPlanVersionId,
        plannedSessionId: context.plannedSessionId,
        occurredAt,
        metricType: enums.metricType,
        environment: enums.environment,
        source: enums.source,
        prescribedContextJson,
        valueJson: valueResult.valueJson,
        ...(goalId ? { goalId } : {}),
        ...(trainingSessionId ? { trainingSessionId } : {}),
        ...(plannedSkillItemOrder !== undefined ? { plannedSkillItemOrder } : {}),
      });

      const summary = buildLoggedDrillSummary(valueResult.valueJson, response);
      const drillKey = buildSportMetricsDrillKey(context);
      onSuccess(drillKey, summary);
      onClose();
    } catch (submitError) {
      setError(
        isNormalizedApiError(submitError)
          ? submitError.message
          : "Could not log sport result. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    context,
    drillForm,
    mode,
    occurredAt,
    onClose,
    onSuccess,
    roundForm,
    submitting,
  ]);

  if (!open || !context) return null;

  const drillTitle = drillLabelFromContext(context);
  const isRound = mode === "ACTUAL_ROUND";

  return (
    <Modal
      className="w-full max-w-lg overflow-hidden rounded-2xl bg-card p-0 shadow-lg"
      aria-labelledby="log-sport-result-title"
    >
      <div className="flex max-h-[min(90vh,720px)] flex-col">
        <div className="border-b border-slate-200/80 px-5 py-4">
          <h2
            id="log-sport-result-title"
            className="text-lg font-semibold text-textPrimary"
          >
            Log Sport Result
          </h2>
          <p className="mt-1 text-sm text-textSecondary">{drillTitle}</p>
          <p className="text-xs text-textSecondary">
            {context.sessionTitle}
            {occurredAtLabel ? ` · ${occurredAtLabel}` : null}
          </p>
          <p className="mt-1 text-xs text-textSecondary">
            Plan week {formatDateOnly(weekStartDate)} – {formatDateOnly(weekEndDate)}
          </p>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold text-textPrimary">Where</legend>
            {MODE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-2 text-sm text-textPrimary"
              >
                <input
                  type="radio"
                  name="sport-metric-log-mode"
                  value={option.value}
                  checked={mode === option.value}
                  onChange={() => {
                    setMode(option.value);
                    setError(null);
                  }}
                  className="mt-0.5 h-3.5 w-3.5 border-slate-300 text-primary focus:ring-primary/30"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>

          {isRound ? (
            <div className="space-y-3">
              <FormNumberField
                id="sport-round-holes"
                label="Holes played"
                required
                value={roundForm.holesPlayed}
                onChange={handleRoundField("holesPlayed")}
              />
              <FormNumberField
                id="sport-round-score"
                label="Score"
                required
                value={roundForm.score}
                onChange={handleRoundField("score")}
              />
              <FormNumberField
                id="sport-round-par"
                label="Par"
                required
                value={roundForm.par}
                onChange={handleRoundField("par")}
              />
              <FormNumberField
                id="sport-round-putts"
                label="Putts"
                value={roundForm.putts}
                onChange={handleRoundField("putts")}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <FormNumberField
                  id="sport-round-fairways-hit"
                  label="Fairways hit"
                  value={roundForm.fairwaysHit}
                  onChange={handleRoundField("fairwaysHit")}
                />
                <FormNumberField
                  id="sport-round-fairways-possible"
                  label="Fairways possible"
                  value={roundForm.fairwaysPossible}
                  onChange={handleRoundField("fairwaysPossible")}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormNumberField
                  id="sport-round-gir"
                  label="Greens in regulation"
                  value={roundForm.greensInRegulation}
                  onChange={handleRoundField("greensInRegulation")}
                />
                <FormNumberField
                  id="sport-round-gir-possible"
                  label="GIR possible"
                  value={roundForm.girPossible}
                  onChange={handleRoundField("girPossible")}
                />
              </div>
              <FormNumberField
                id="sport-round-penalties"
                label="Penalties"
                value={roundForm.penalties}
                onChange={handleRoundField("penalties")}
              />
              <FormNotesField
                id="sport-round-notes"
                value={roundForm.notes}
                onChange={handleRoundField("notes")}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <DrillClassificationDisplay drill={context.drill} />
              <FormTextField
                id="sport-drill-context"
                label="Context / Location (optional)"
                value={drillForm.context}
                onChange={handleDrillField("context")}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <FormNumberField
                  id="sport-drill-attempts"
                  label="Attempts"
                  required
                  value={drillForm.attempts}
                  onChange={handleDrillField("attempts")}
                />
                <FormNumberField
                  id="sport-drill-successes"
                  label="Successes"
                  required
                  value={drillForm.successes}
                  onChange={handleDrillField("successes")}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormNumberField
                  id="sport-drill-quality"
                  label="Quality rating (1–5, optional)"
                  value={drillForm.qualityRating}
                  onChange={handleDrillField("qualityRating")}
                />
                <FormTextField
                  id="sport-drill-distance"
                  label="Distance band (optional)"
                  value={drillForm.distanceBand}
                  onChange={handleDrillField("distanceBand")}
                />
              </div>
              <FormTextField
                id="sport-drill-target-radius"
                label="Target radius (optional)"
                value={drillForm.targetRadius}
                onChange={handleDrillField("targetRadius")}
              />
              <fieldset className="space-y-2">
                <legend className="text-xs font-semibold text-textPrimary">
                  Miss breakdown (optional)
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormNumberField
                    id="sport-drill-misses-left"
                    label="Misses left"
                    value={drillForm.missesLeft}
                    onChange={handleDrillField("missesLeft")}
                  />
                  <FormNumberField
                    id="sport-drill-misses-right"
                    label="Misses right"
                    value={drillForm.missesRight}
                    onChange={handleDrillField("missesRight")}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormNumberField
                    id="sport-drill-misses-short"
                    label="Misses short"
                    value={drillForm.missesShort}
                    onChange={handleDrillField("missesShort")}
                  />
                  <FormNumberField
                    id="sport-drill-misses-long"
                    label="Misses long"
                    value={drillForm.missesLong}
                    onChange={handleDrillField("missesLong")}
                  />
                </div>
              </fieldset>
              <FormNotesField
                id="sport-drill-notes"
                value={drillForm.notes}
                onChange={handleDrillField("notes")}
              />
            </div>
          )}

          {error ? <Alert variant="danger">{error}</Alert> : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200/80 px-5 py-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleSubmit()}
            disabled={submitting}
          >
            {submitting ? "Saving…" : "Save sport result"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function FormNumberField({
  id,
  label,
  value,
  onChange,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-textSecondary">
        {label}
        {required ? " *" : null}
      </label>
      <Input
        id={id}
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
}

function FormTextField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-textSecondary">
        {label}
      </label>
      <Input id={id} type="text" value={value} onChange={onChange} />
    </div>
  );
}

function FormNotesField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-textSecondary">
        Notes (optional)
      </label>
      <textarea
        id={id}
        rows={2}
        value={value}
        onChange={onChange}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
      />
    </div>
  );
}
