"use client";

import { ATHLETE_DASHBOARD_CARD_TITLE_CLASS } from "@/components/dashboard/athlete/athleteDashboardTypography";
import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  createGolfCompetition,
  fetchGolfCompetition,
  patchGolfCompetition,
  submitGolfCompetition,
  type CreateGolfCompetitionPayload,
  type GolfCompetitionDetail,
  type GolfCompetitionFormat,
  type GolfCompetitionRecord,
  type GolfCompetitionType,
} from "@/lib/api/sportMetricsGolfCompetitions";
import { isNormalizedApiError } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import {
  GOLF_COMPETITION_DAY_COUNTS,
  GOLF_COMPETITION_FAIRWAY_OPTIONS,
  GOLF_COMPETITION_FORMATS,
  GOLF_COMPETITION_SATISFACTION_OPTIONS,
  GOLF_COMPETITION_TYPES,
  areAllGolfCompetitionDaysSaved,
  buildGolfCompetitionDaysPatchThrough,
  clearActiveGolfCompetitionId,
  hydrateGolfCompetitionDays,
  isGolfCompetitionDayReadyToSave,
  mergeGolfCompetitionDaysAfterSave,
  readActiveGolfCompetitionId,
  savedGolfCompetitionDayNumbersFromPersisted,
  writeActiveGolfCompetitionId,
  type GolfCompetitionDayForm,
  type GolfCompetitionHoleForm,
} from "@/lib/sportMetrics/golfCompetitionEntry";
import { useEffect, useState } from "react";

function formatError(e: unknown): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return "Unable to save Competition.";
}

const textareaClassName =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-textPrimary shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30";

const EMPTY_CREATE: CreateGolfCompetitionPayload = {
  name: "",
  type: "LOCAL",
  format: 18,
  venue: "",
  startDate: "",
  numberOfDays: 1,
  competitionNotes: "",
};

export function AthleteCompetitionDaySelector({
  numberOfDays,
  selectedDayNumber,
  disabled,
  onSelect,
}: {
  numberOfDays: number;
  selectedDayNumber: number;
  disabled?: boolean;
  onSelect: (dayNumber: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: numberOfDays }, (_, index) => {
        const dayNumber = index + 1;
        return (
          <Button
            key={dayNumber}
            type="button"
            variant={selectedDayNumber === dayNumber ? "primary" : "secondary"}
            disabled={disabled}
            onClick={() => onSelect(dayNumber)}
          >
            Day {dayNumber}
          </Button>
        );
      })}
    </div>
  );
}

export function AthleteCompetitionHoleList({
  holes,
  readOnly,
  onChange,
}: {
  holes: GolfCompetitionHoleForm[];
  readOnly: boolean;
  onChange: (holeNumber: number, patch: Partial<GolfCompetitionHoleForm>) => void;
}) {
  return (
    <div className="space-y-4">
      {holes.map((hole) => (
        <div
          key={hole.holeNumber}
          className="space-y-3 rounded-md border border-slate-200 p-3"
        >
          <p className="text-sm font-medium text-textPrimary">
            Hole {hole.holeNumber}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField id={`hole-${hole.holeNumber}-par`} label="Par" required>
              <Input
                id={`hole-${hole.holeNumber}-par`}
                type="number"
                value={hole.par}
                disabled={readOnly}
                onChange={(event: { target: { value: string } }) =>
                  onChange(hole.holeNumber, { par: event.target.value })
                }
              />
            </FormField>
            <FormField
              id={`hole-${hole.holeNumber}-strokes`}
              label="Strokes"
              required
            >
              <Input
                id={`hole-${hole.holeNumber}-strokes`}
                type="number"
                value={hole.strokes}
                disabled={readOnly}
                onChange={(event: { target: { value: string } }) =>
                  onChange(hole.holeNumber, { strokes: event.target.value })
                }
              />
            </FormField>
            <FormField
              id={`hole-${hole.holeNumber}-fairway`}
              label="Fairway Hit"
              required
              helperText="Did your tee shot finish on the fairway?"
            >
              <Select
                id={`hole-${hole.holeNumber}-fairway`}
                value={hole.fairwayHit}
                disabled={readOnly}
                onChange={(event: { target: { value: string } }) =>
                  onChange(hole.holeNumber, {
                    fairwayHit: event.target.value as GolfCompetitionHoleForm["fairwayHit"],
                  })
                }
              >
                <option value="">Select</option>
                {GOLF_COMPETITION_FAIRWAY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              id={`hole-${hole.holeNumber}-gir`}
              label="Green in Regulation"
              required
              helperText="Did you reach the green within the regulation number of strokes?"
            >
              <Select
                id={`hole-${hole.holeNumber}-gir`}
                value={hole.greenInRegulation}
                disabled={readOnly}
                onChange={(event: { target: { value: string } }) =>
                  onChange(hole.holeNumber, {
                    greenInRegulation: event.target
                      .value as GolfCompetitionHoleForm["greenInRegulation"],
                  })
                }
              >
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
            </FormField>
            <FormField
              id={`hole-${hole.holeNumber}-putts`}
              label="Putts"
              required
              helperText="Number of putts taken on the hole."
            >
              <Input
                id={`hole-${hole.holeNumber}-putts`}
                type="number"
                value={hole.putts}
                disabled={readOnly}
                onChange={(event: { target: { value: string } }) =>
                  onChange(hole.holeNumber, { putts: event.target.value })
                }
              />
            </FormField>
            <FormField
              id={`hole-${hole.holeNumber}-penalty`}
              label="Penalty Strokes"
              required
              helperText="Penalty strokes recorded on the hole."
            >
              <Input
                id={`hole-${hole.holeNumber}-penalty`}
                type="number"
                value={hole.penaltyStrokes}
                disabled={readOnly}
                onChange={(event: { target: { value: string } }) =>
                  onChange(hole.holeNumber, {
                    penaltyStrokes: event.target.value,
                  })
                }
              />
            </FormField>
          </div>
          <FormField
            id={`hole-${hole.holeNumber}-satisfaction`}
            label="Hole Satisfaction"
            required
            helperText="How satisfied are you with how you played this hole?"
          >
            <Select
              id={`hole-${hole.holeNumber}-satisfaction`}
              value={hole.satisfactionRating}
              disabled={readOnly}
              onChange={(event: { target: { value: string } }) =>
                onChange(hole.holeNumber, {
                  satisfactionRating: event.target
                    .value as GolfCompetitionHoleForm["satisfactionRating"],
                })
              }
            >
              <option value="">Select</option>
              {GOLF_COMPETITION_SATISFACTION_OPTIONS.map((option) => (
                <option key={option.value} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            id={`hole-${hole.holeNumber}-notes`}
            label="Hole Notes"
          >
            <textarea
              id={`hole-${hole.holeNumber}-notes`}
              rows={2}
              value={hole.notes}
              disabled={readOnly}
              className={textareaClassName}
              onChange={(event) =>
                onChange(hole.holeNumber, { notes: event.target.value })
              }
            />
          </FormField>
        </div>
      ))}
    </div>
  );
}

function daysFromCompetition(
  competition: GolfCompetitionRecord | GolfCompetitionDetail,
): GolfCompetitionDayForm[] {
  return hydrateGolfCompetitionDays({
    numberOfDays: competition.numberOfDays,
    format: competition.format,
    days: competition.days,
  });
}

export function AthleteCompetitionEntrySection({
  entityId,
  athleteId,
  trainingPlanVersionId,
  competitionId,
  ignoreStoredDraft = false,
  onCompetitionCreated,
  onCompetitionSubmitted,
}: {
  entityId: string;
  athleteId: string;
  trainingPlanVersionId?: string | null;
  competitionId?: string | null;
  ignoreStoredDraft?: boolean;
  onCompetitionCreated?: (competitionId: string) => void;
  onCompetitionSubmitted?: (competitionId: string) => void;
}) {
  const resolvedEntityId = entityId.trim();
  const resolvedAthleteId = athleteId.trim();
  const versionId = trainingPlanVersionId?.trim() ?? "";
  const applicable =
    resolvedEntityId !== "" && resolvedAthleteId !== "" && versionId !== "";

  const [createForm, setCreateForm] =
    useState<CreateGolfCompetitionPayload>(EMPTY_CREATE);
  const [competition, setCompetition] = useState<
    GolfCompetitionRecord | GolfCompetitionDetail | null
  >(null);
  const [days, setDays] = useState<GolfCompetitionDayForm[]>([]);
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savedDayNumbers, setSavedDayNumbers] = useState<number[]>([]);

  useEffect(() => {
    if (!applicable) return;
    const requestedId = competitionId?.trim() ?? "";
    const storedId = ignoreStoredDraft
      ? ""
      : (readActiveGolfCompetitionId(resolvedEntityId, resolvedAthleteId) ??
        "");
    const loadId = requestedId !== "" ? requestedId : storedId;
    if (!loadId) return;

    let cancelled = false;
    setLoadingDraft(true);
    void (async () => {
      try {
        const result = await fetchGolfCompetition({
          entityId: resolvedEntityId,
          athleteId: resolvedAthleteId,
          competitionId: loadId,
        });
        if (cancelled) return;
        setCompetition(result.competition);
        setDays(daysFromCompetition(result.competition));
        setSavedDayNumbers(
          savedGolfCompetitionDayNumbersFromPersisted(
            result.competition.days,
            result.competition.format,
          ),
        );
        setSelectedDayNumber(1);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(formatError(e));
      } finally {
        if (!cancelled) setLoadingDraft(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    applicable,
    competitionId,
    ignoreStoredDraft,
    resolvedAthleteId,
    resolvedEntityId,
  ]);

  if (!applicable) return null;

  const readOnly = competition?.status === "SUBMITTED";
  const allConfiguredDaysSaved = areAllGolfCompetitionDaysSaved(
    competition?.numberOfDays ?? 0,
    savedDayNumbers,
  );
  const selectedDay =
    days.find((day) => day.dayNumber === selectedDayNumber) ?? days[0] ?? null;

  function updateDay(dayNumber: number, patch: Partial<GolfCompetitionDayForm>) {
    setDays((current) =>
      current.map((day) =>
        day.dayNumber === dayNumber ? { ...day, ...patch } : day,
      ),
    );
  }

  function updateHole(
    holeNumber: number,
    patch: Partial<GolfCompetitionHoleForm>,
  ) {
    setDays((current) =>
      current.map((day) =>
        day.dayNumber === selectedDayNumber
          ? {
              ...day,
              holes: day.holes.map((hole) =>
                hole.holeNumber === holeNumber ? { ...hole, ...patch } : hole,
              ),
            }
          : day,
      ),
    );
  }

  async function onCreate(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const payload: CreateGolfCompetitionPayload = {
        name: createForm.name.trim(),
        type: createForm.type,
        format: createForm.format,
        venue: createForm.venue.trim(),
        startDate: createForm.startDate,
        numberOfDays: createForm.numberOfDays,
      };
      if (createForm.competitionNotes?.trim()) {
        payload.competitionNotes = createForm.competitionNotes.trim();
      }
      const result = await createGolfCompetition(
        resolvedEntityId,
        resolvedAthleteId,
        payload,
      );
      writeActiveGolfCompetitionId(
        resolvedEntityId,
        resolvedAthleteId,
        result.competition.id,
      );
      setCompetition(result.competition);
      setDays(daysFromCompetition(result.competition));
      setSavedDayNumbers([]);
      setSelectedDayNumber(1);
      onCompetitionCreated?.(result.competition.id);
    } catch (e) {
      setError(formatError(e));
    } finally {
      setCreating(false);
    }
  }

  async function onSaveDraft() {
    if (!competition || saving || readOnly) return;
    const currentDay =
      days.find((day) => day.dayNumber === selectedDayNumber) ?? null;
    if (
      !currentDay ||
      !isGolfCompetitionDayReadyToSave(currentDay, competition.format)
    ) {
      setError("Complete this day's date and hole results before saving.");
      return;
    }
    if (
      selectedDayNumber > 1 &&
      !savedDayNumbers.includes(selectedDayNumber - 1)
    ) {
      setError("Save the previous day before saving this day.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await patchGolfCompetition(
        resolvedEntityId,
        resolvedAthleteId,
        competition.id,
        {
          days: buildGolfCompetitionDaysPatchThrough(days, selectedDayNumber),
        },
      );
      setCompetition(result.competition);
      setDays(
        mergeGolfCompetitionDaysAfterSave(
          days,
          daysFromCompetition(result.competition),
        ),
      );
      setSavedDayNumbers((current) =>
        current.includes(selectedDayNumber)
          ? current
          : [...current, selectedDayNumber].sort((left, right) => left - right),
      );
      if (selectedDayNumber < competition.numberOfDays) {
        setSelectedDayNumber(selectedDayNumber + 1);
      }
    } catch (e) {
      setError(formatError(e));
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit() {
    if (!competition || submitting || readOnly || !allConfiguredDaysSaved) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitGolfCompetition({
        entityId: resolvedEntityId,
        athleteId: resolvedAthleteId,
        competitionId: competition.id,
      });
      clearActiveGolfCompetitionId(resolvedEntityId, resolvedAthleteId);
      setCompetition(result.competition);
      setDays(daysFromCompetition(result.competition));
      onCompetitionSubmitted?.(result.competition.id);
    } catch (e) {
      setError(formatError(e));
    } finally {
      setSubmitting(false);
    }
  }

  function onStartAnother() {
    clearActiveGolfCompetitionId(resolvedEntityId, resolvedAthleteId);
    setCompetition(null);
    setDays([]);
    setSavedDayNumbers([]);
    setCreateForm(EMPTY_CREATE);
    setSelectedDayNumber(1);
    setError(null);
  }

  return (
    <Card
      title="Competition"
      subtitle="Log a golf competition draft, then submit when complete."
      accent={false}
      padding="compact"
      className={cn(
        "shadow-[0_10px_30px_rgba(15,23,42,0.05)]",
        DASHBOARD_MAJOR_OUTER_CARD_CLASS,
      )}
      titleClassName={ATHLETE_DASHBOARD_CARD_TITLE_CLASS}
    >
      <div className="space-y-4">
        {error ? <Alert variant="danger">{error}</Alert> : null}
        {loadingDraft ? (
          <p className="text-sm text-textSecondary">Loading competition…</p>
        ) : null}

        {!competition && !loadingDraft ? (
          <form className="space-y-3" onSubmit={onCreate}>
            <FormField id="competition-name" label="Competition Name" required>
              <Input
                id="competition-name"
                value={createForm.name}
                onChange={(event: { target: { value: string } }) =>
                  setCreateForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
              />
            </FormField>
            <FormField id="competition-type" label="Competition Type" required>
              <Select
                id="competition-type"
                value={createForm.type}
                onChange={(event: { target: { value: string } }) =>
                  setCreateForm((current) => ({
                    ...current,
                    type: event.target.value as GolfCompetitionType,
                  }))
                }
              >
                {GOLF_COMPETITION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="competition-format" label="Format" required>
              <Select
                id="competition-format"
                value={String(createForm.format)}
                onChange={(event: { target: { value: string } }) =>
                  setCreateForm((current) => ({
                    ...current,
                    format: Number(event.target.value) as GolfCompetitionFormat,
                  }))
                }
              >
                {GOLF_COMPETITION_FORMATS.map((format) => (
                  <option key={format} value={String(format)}>
                    {format} holes
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              id="competition-venue"
              label="Venue / Golf Course"
              required
            >
              <Input
                id="competition-venue"
                value={createForm.venue}
                onChange={(event: { target: { value: string } }) =>
                  setCreateForm((current) => ({
                    ...current,
                    venue: event.target.value,
                  }))
                }
                required
              />
            </FormField>
            <FormField id="competition-start-date" label="Start Date" required>
              <Input
                id="competition-start-date"
                type="date"
                value={createForm.startDate}
                onChange={(event: { target: { value: string } }) =>
                  setCreateForm((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
                required
              />
            </FormField>
            <FormField
              id="competition-number-of-days"
              label="Number of Days"
              required
            >
              <Select
                id="competition-number-of-days"
                value={String(createForm.numberOfDays)}
                onChange={(event: { target: { value: string } }) =>
                  setCreateForm((current) => ({
                    ...current,
                    numberOfDays: Number(event.target.value),
                  }))
                }
              >
                {GOLF_COMPETITION_DAY_COUNTS.map((count) => (
                  <option key={count} value={String(count)}>
                    {count}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="competition-notes" label="Competition Notes">
              <textarea
                id="competition-notes"
                rows={3}
                value={createForm.competitionNotes ?? ""}
                className={textareaClassName}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    competitionNotes: event.target.value,
                  }))
                }
              />
            </FormField>
            <Button type="submit" loading={creating} disabled={creating}>
              Create draft
            </Button>
          </form>
        ) : null}

        {competition ? (
          <div className="space-y-4">
            {readOnly ? (
              <Alert variant="success" role="status">
                Competition submitted. This entry is read-only.
              </Alert>
            ) : (
              <p className="text-sm text-textSecondary">
                Draft: {competition.name}. Save all days before submitting.
              </p>
            )}

            <AthleteCompetitionDaySelector
              numberOfDays={competition.numberOfDays}
              selectedDayNumber={selectedDayNumber}
              onSelect={setSelectedDayNumber}
            />

            {selectedDay ? (
              <div className="space-y-3">
                <FormField
                  id={`day-${selectedDay.dayNumber}-date`}
                  label="Date"
                  required
                >
                  <Input
                    id={`day-${selectedDay.dayNumber}-date`}
                    type="date"
                    value={selectedDay.date}
                    disabled={readOnly}
                    onChange={(event: { target: { value: string } }) =>
                      updateDay(selectedDay.dayNumber, {
                        date: event.target.value,
                      })
                    }
                  />
                </FormField>
                <FormField
                  id={`day-${selectedDay.dayNumber}-weather`}
                  label="Weather / Conditions"
                >
                  <Input
                    id={`day-${selectedDay.dayNumber}-weather`}
                    value={selectedDay.weatherConditions}
                    disabled={readOnly}
                    onChange={(event: { target: { value: string } }) =>
                      updateDay(selectedDay.dayNumber, {
                        weatherConditions: event.target.value,
                      })
                    }
                  />
                </FormField>
                <FormField id={`day-${selectedDay.dayNumber}-wind`} label="Wind">
                  <Input
                    id={`day-${selectedDay.dayNumber}-wind`}
                    value={selectedDay.wind}
                    disabled={readOnly}
                    onChange={(event: { target: { value: string } }) =>
                      updateDay(selectedDay.dayNumber, {
                        wind: event.target.value,
                      })
                    }
                  />
                </FormField>
                <FormField
                  id={`day-${selectedDay.dayNumber}-course`}
                  label="Course Conditions"
                >
                  <Input
                    id={`day-${selectedDay.dayNumber}-course`}
                    value={selectedDay.courseConditions}
                    disabled={readOnly}
                    onChange={(event: { target: { value: string } }) =>
                      updateDay(selectedDay.dayNumber, {
                        courseConditions: event.target.value,
                      })
                    }
                  />
                </FormField>
                <FormField
                  id={`day-${selectedDay.dayNumber}-notes`}
                  label="Day Notes"
                >
                  <textarea
                    id={`day-${selectedDay.dayNumber}-notes`}
                    rows={2}
                    value={selectedDay.dayNotes}
                    disabled={readOnly}
                    className={textareaClassName}
                    onChange={(event) =>
                      updateDay(selectedDay.dayNumber, {
                        dayNotes: event.target.value,
                      })
                    }
                  />
                </FormField>

                <AthleteCompetitionHoleList
                  holes={selectedDay.holes}
                  readOnly={readOnly}
                  onChange={updateHole}
                />
              </div>
            ) : null}

            {readOnly ? (
              <Button type="button" variant="secondary" onClick={onStartAnother}>
                Start another competition
              </Button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  loading={saving}
                  disabled={saving || submitting}
                  onClick={() => {
                    void onSaveDraft();
                  }}
                >
                  Save draft
                </Button>
                <Button
                  type="button"
                  loading={submitting}
                  disabled={
                    saving || submitting || !allConfiguredDaysSaved
                  }
                  onClick={() => {
                    void onSubmit();
                  }}
                >
                  Submit competition
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
