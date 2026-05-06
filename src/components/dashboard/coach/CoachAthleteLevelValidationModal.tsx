"use client";

import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import {
  fetchCoachAssignedAthletes,
} from "@/lib/api/coachMe";
import { postCoachAthleteLevelValidation } from "@/lib/api/coachAthleteLevelValidation";
import { isNormalizedApiError } from "@/lib/apiClient";
import { formatPersonNameForDisplay } from "@/lib/textFormat";
import {
  TRAINING_PLAN_VALIDATED_LEVELS,
  type TrainingPlanLevelValidationView,
} from "@/types/trainingPlanLevelValidation";
import {
  type ChangeEvent,
  useEffect,
  useState,
} from "react";

const LEGACY_LEVEL_VALIDATION_ACCESS_DENIED =
  "Only Assistant Coach or Skills Coach can confirm validated level when Head Coach is not configured";
const LEVEL_VALIDATION_ACCESS_DENIED_MESSAGE =
  "Access Denied. Only the Head Coach or an Assistant Skills Coach can confirm the validated level.";

function formatApiError(e: unknown, fallback: string): string {
  if (isNormalizedApiError(e)) {
    if (e.status === 403) {
      const server = e.message.trim();
      if (server === LEGACY_LEVEL_VALIDATION_ACCESS_DENIED) {
        return LEVEL_VALIDATION_ACCESS_DENIED_MESSAGE;
      }
      return server !== ""
        ? `Access denied. ${server}`
        : "Access denied. You don't have permission to perform this action.";
    }
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

function defaultSelectedLevel(data: TrainingPlanLevelValidationView | null): string {
  if (!data) return "";
  if (data.validatedLevel && data.validatedLevel.trim() !== "") {
    return data.validatedLevel.trim();
  }
  if (data.finalSuggestedLevel && data.finalSuggestedLevel.trim() !== "") {
    return data.finalSuggestedLevel.trim();
  }
  return "";
}

export type CoachAthleteLevelValidationModalProps = {
  open: boolean;
  onClose: () => void;
  entityId: string;
  athleteId: string;
  selfReportedLevelLabel: string;
  levelValidationSnapshot: TrainingPlanLevelValidationView | null;
  onAfterSaveConfirmed: () => void | Promise<void>;
};

export function CoachAthleteLevelValidationModal({
  open,
  onClose,
  entityId,
  athleteId,
  selfReportedLevelLabel,
  levelValidationSnapshot,
  onAfterSaveConfirmed,
}: CoachAthleteLevelValidationModalProps) {
  const entityIdTrimmed = entityId.trim();
  const athleteIdTrimmed = athleteId.trim();

  const [athleteDisplayName, setAthleteDisplayName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasConfirmPermission, setHasConfirmPermission] = useState(true);

  useEffect(() => {
    if (!open || athleteIdTrimmed === "") {
      return;
    }
    let cancelled = false;
    setNameLoading(true);
    async function resolveName() {
      try {
        const rows = await fetchCoachAssignedAthletes();
        if (cancelled) return;
        const row = rows.find(
          (r) => r.athleteId.trim() === athleteIdTrimmed,
        );
        const name = row?.displayName?.trim()
          ? formatPersonNameForDisplay(row.displayName)
          : athleteIdTrimmed;
        setAthleteDisplayName(name);
      } catch {
        if (!cancelled) setAthleteDisplayName(athleteIdTrimmed);
      } finally {
        if (!cancelled) setNameLoading(false);
      }
    }
    void resolveName();
    return () => {
      cancelled = true;
    };
  }, [open, athleteIdTrimmed]);

  useEffect(() => {
    if (!open) return;
    setSelectedLevel(defaultSelectedLevel(levelValidationSnapshot));
    setError(null);
    setHasConfirmPermission(true);
  }, [open, levelValidationSnapshot]);

  if (!open) return null;

  async function handleSave() {
    if (
      entityIdTrimmed === "" ||
      athleteIdTrimmed === "" ||
      selectedLevel.trim() === "" ||
      !hasConfirmPermission ||
      saving
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await postCoachAthleteLevelValidation(entityIdTrimmed, athleteIdTrimmed, {
        validatedLevel: selectedLevel.trim(),
      });
      await onAfterSaveConfirmed();
      onClose();
    } catch (e) {
      if (isNormalizedApiError(e) && e.status === 403) {
        setHasConfirmPermission(false);
        setError(LEVEL_VALIDATION_ACCESS_DENIED_MESSAGE);
      } else {
        setError(
          formatApiError(e, "Could not save validated level. Please try again shortly."),
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      className="w-full max-w-lg overflow-hidden rounded-2xl bg-card p-0 shadow-lg"
      aria-labelledby="level-validation-modal-title"
    >
      <div className="flex flex-col gap-4 px-6 py-6 sm:px-7 sm:py-7">
        <h2
          id="level-validation-modal-title"
          className="text-lg font-semibold text-textPrimary"
        >
          Level validation
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
            <dt className="text-xs font-medium text-textMuted sm:w-40 sm:shrink-0">
              Athlete
            </dt>
            <dd className="min-w-0 text-textPrimary">
              {nameLoading ? "Loading…" : athleteDisplayName}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
            <dt className="text-xs font-medium text-textMuted sm:w-40 sm:shrink-0">
              Self-reported level
            </dt>
            <dd className="min-w-0 text-textPrimary">{selfReportedLevelLabel}</dd>
          </div>
        </dl>

        {error ? <Alert variant="danger">{error}</Alert> : null}

        <FormField id="validated-level-modal" label="Validated level">
          <Select
            id="validated-level-modal"
            value={selectedLevel}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setSelectedLevel(e.target.value)
            }
            disabled={saving}
          >
            <option value="">— Select level —</option>
            {TRAINING_PLAN_VALIDATED_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="flex flex-wrap justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleSave()}
            disabled={
              saving ||
              selectedLevel.trim() === "" ||
              entityIdTrimmed === "" ||
              athleteIdTrimmed === "" ||
              !hasConfirmPermission
            }
          >
            {saving ? "Saving…" : "Save / Confirm"}
          </Button>
        </div>
        <p className="text-xs text-textMuted">
          Only Head Coach or authorized planning coach can confirm this level.
        </p>
      </div>
    </Modal>
  );
}
