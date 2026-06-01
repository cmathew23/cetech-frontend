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
  validateGolfDrillSportMetricForm,
  validateGolfRoundSportMetricForm,
  type GolfSportMetricDrillFormValues,
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

export type LogSportResultModalProps = {
  open: boolean;
  context: SportMetricsDrillLogContext | null;
  weekStartDate: string;
  weekEndDate: string;
  onClose: () => void;
  onSuccess: (drillKey: string) => void;
};

const MODE_OPTIONS: Array<{ value: GolfSportMetricLogMode; label: string }> = [
  { value: "PRACTICE_FACILITY", label: "Skills Training — Practice Facility" },
  { value: "SIMULATOR", label: "Skills Training — Simulator" },
  { value: "ACTUAL_ROUND", label: "Actual Round — On Course" },
];

const EMPTY_DRILL_FORM: GolfSportMetricDrillFormValues = {
  attempts: "",
  successes: "",
  distanceBand: "",
  missPattern: "",
  provider: "",
  carryDistance: "",
  ballSpeed: "",
  clubSpeed: "",
  offlineDispersion: "",
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
  const [drillForm, setDrillForm] = useState<GolfSportMetricDrillFormValues>(EMPTY_DRILL_FORM);
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
    (field: keyof GolfSportMetricDrillFormValues) =>
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
        : validateGolfDrillSportMetricForm(drillForm);

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

    setSubmitting(true);
    setError(null);

    try {
      await postGolfSportMetricRecord(context.entityId, context.athleteId, {
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
      });

      const drillKey = buildSportMetricsDrillKey(context);
      onSuccess(drillKey);
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
              {mode === "PRACTICE_FACILITY" ? (
                <>
                  <FormTextField
                    id="sport-drill-distance"
                    label="Distance band (optional)"
                    value={drillForm.distanceBand}
                    onChange={handleDrillField("distanceBand")}
                  />
                  <FormTextField
                    id="sport-drill-miss"
                    label="Miss pattern (optional)"
                    value={drillForm.missPattern}
                    onChange={handleDrillField("missPattern")}
                  />
                </>
              ) : (
                <>
                  <FormTextField
                    id="sport-drill-provider"
                    label="Provider (optional)"
                    value={drillForm.provider}
                    onChange={handleDrillField("provider")}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormNumberField
                      id="sport-drill-carry"
                      label="Carry distance (optional)"
                      value={drillForm.carryDistance}
                      onChange={handleDrillField("carryDistance")}
                    />
                    <FormNumberField
                      id="sport-drill-ball-speed"
                      label="Ball speed (optional)"
                      value={drillForm.ballSpeed}
                      onChange={handleDrillField("ballSpeed")}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormNumberField
                      id="sport-drill-club-speed"
                      label="Club speed (optional)"
                      value={drillForm.clubSpeed}
                      onChange={handleDrillField("clubSpeed")}
                    />
                    <FormNumberField
                      id="sport-drill-offline"
                      label="Offline dispersion (optional)"
                      value={drillForm.offlineDispersion}
                      onChange={handleDrillField("offlineDispersion")}
                    />
                  </div>
                </>
              )}
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
