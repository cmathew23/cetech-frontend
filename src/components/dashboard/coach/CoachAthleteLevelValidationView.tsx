"use client";

import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchCoachAthleteLevelValidation,
  postCoachAthleteLevelValidation,
} from "@/lib/api/coachAthleteLevelValidation";
import { fetchCoachAthletePlanningProfile } from "@/lib/api/coachAthletePlanningProfile";
import { isNormalizedApiError } from "@/lib/apiClient";
import {
  TRAINING_PLAN_VALIDATED_LEVELS,
  type TrainingPlanLevelValidationView as LevelValidationData,
} from "@/types/trainingPlanLevelValidation";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

function displayValue(
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "—";
  const text = value.trim();
  return text === "" ? "—" : text;
}

function displayRankingValue(value: number | null | undefined): string {
  return value === null || value === undefined ? "Not provided" : displayValue(value);
}

function displayProvidedText(value: string | null | undefined): string {
  return value === null || value === undefined || value.trim() === ""
    ? "Not provided"
    : value.trim();
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

function defaultSelectedLevel(data: LevelValidationData | null): string {
  if (!data) return "";
  if (data.validatedLevel && data.validatedLevel.trim() !== "") {
    return data.validatedLevel.trim();
  }
  if (data.finalSuggestedLevel && data.finalSuggestedLevel.trim() !== "") {
    return data.finalSuggestedLevel.trim();
  }
  return "";
}

function isMissingPlanningProfileError(e: unknown): boolean {
  if (!isNormalizedApiError(e)) return false;
  const msg = e.message.trim().toLowerCase();
  return e.status === 404 || msg.includes("planning profile not found");
}

export function CoachAthleteLevelValidationView({
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
  const athleteIdTrimmed = athleteId.trim();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingPlanningProfile, setMissingPlanningProfile] = useState(false);
  const [data, setData] = useState<LevelValidationData | null>(null);
  const [planningPerformance, setPlanningPerformance] = useState<{
    highestCompetitionLevelReachedPast12Months: string | null;
    highestRankingAchievedAtThatLevelPast12Months: number | null;
  } | null>(null);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [hasConfirmPermission, setHasConfirmPermission] = useState(true);

  const confirmPermissionError = LEVEL_VALIDATION_ACCESS_DENIED_MESSAGE;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!accessGateReady) {
        setLoading(true);
        return;
      }
      if (entityId === "" || athleteIdTrimmed === "") {
        setData(null);
        setPlanningPerformance(null);
        setMissingPlanningProfile(false);
        setError("Missing training entity or athlete identifier.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setPlanningPerformance(null);
      setMissingPlanningProfile(false);
      try {
        const next = await fetchCoachAthleteLevelValidation(entityId, athleteIdTrimmed);
        if (cancelled) return;
        setData(next);
        setSelectedLevel(defaultSelectedLevel(next));
        if (
          next.highestCompetitionLevelReachedPast12Months == null ||
          next.highestCompetitionLevelReachedPast12Months.trim() === "" ||
          next.highestRankingAchievedAtThatLevelPast12Months == null
        ) {
          try {
            const planningProfile = await fetchCoachAthletePlanningProfile(
              entityId,
              athleteIdTrimmed,
            );
            if (cancelled) return;
            setPlanningPerformance({
              highestCompetitionLevelReachedPast12Months:
                planningProfile.highestCompetitionLevelReachedPast12Months,
              highestRankingAchievedAtThatLevelPast12Months:
                planningProfile.highestRankingAchievedAtThatLevelPast12Months,
            });
          } catch (planningError) {
            if (cancelled || isMissingPlanningProfileError(planningError)) return;
          }
        }
      } catch (e) {
        if (cancelled) return;
        setData(null);
        setPlanningPerformance(null);
        if (isMissingPlanningProfileError(e)) {
          setMissingPlanningProfile(true);
          setError(null);
          return;
        }
        setError(
          formatApiError(
            e,
            "Could not load level validation. Please try again shortly.",
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

  const insufficientSuggestion =
    data != null &&
    data.finalSuggestedLevel == null &&
    data.baseSuggestedLevel == null;
  const performanceCompetitionLevel =
    data?.highestCompetitionLevelReachedPast12Months?.trim() ||
    planningPerformance?.highestCompetitionLevelReachedPast12Months?.trim() ||
    null;
  const performanceRanking =
    data?.highestRankingAchievedAtThatLevelPast12Months ??
    planningPerformance?.highestRankingAchievedAtThatLevelPast12Months ??
    null;

  const systemLevelForCompare = data?.finalSuggestedLevel?.trim() ?? "";
  const coachIntent = selectedLevel.trim() || data?.validatedLevel?.trim() || "";
  const showOverrideHint =
    systemLevelForCompare !== "" &&
    coachIntent !== "" &&
    coachIntent !== systemLevelForCompare;

  async function handleConfirm() {
    if (
      entityId === "" ||
      athleteIdTrimmed === "" ||
      selectedLevel.trim() === "" ||
      !hasConfirmPermission
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await postCoachAthleteLevelValidation(entityId, athleteIdTrimmed, {
        validatedLevel: selectedLevel.trim(),
      });
      const next = await fetchCoachAthleteLevelValidation(entityId, athleteIdTrimmed);
      setData(next);
      setSelectedLevel(defaultSelectedLevel(next));
    } catch (e) {
      if (isNormalizedApiError(e) && e.status === 403) {
        setHasConfirmPermission(false);
        setError(confirmPermissionError);
      } else {
        setError(
          formatApiError(e, "Could not save validated level. Please try again shortly."),
        );
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-textSecondary">
        Loading level validation…
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">
            Training plan — level validation
          </h1>
          <p className="text-sm text-textSecondary">
            Review system suggestion and confirm the athlete&apos;s validated training
            level.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/coach/dashboard")}
        >
          Back to Dashboard
        </Button>
      </header>

      {error ? <Alert variant="danger">{error}</Alert> : null}
      {missingPlanningProfile ? (
        <Alert variant="warning">
          Planning Profile Pending. The athlete must complete APP before training
          plan validation can begin.
        </Alert>
      ) : null}

      {data && insufficientSuggestion ? (
        <Alert variant="warning">Insufficient data to compute suggestion</Alert>
      ) : null}

      {data && showOverrideHint ? (
        <p className="rounded-md border border-border bg-card px-3 py-2 text-sm text-textPrimary shadow-sm">
          You are overriding system recommendation
        </p>
      ) : null}

      {data ? (
        <>
          <DashboardCardShell title="Athlete context">
            <dl className="space-y-2">
              <DetailRow label="Age" value={displayValue(data.age)} />
              <DetailRow label="Age Band" value={displayValue(data.ageBand)} />
            </dl>
          </DashboardCardShell>

          <DashboardCardShell title="Performance input">
            <dl className="space-y-2">
              <DetailRow
                label="Highest Competition Level"
                value={displayProvidedText(performanceCompetitionLevel)}
              />
              <DetailRow
                label="Highest Ranking"
                value={displayRankingValue(performanceRanking)}
              />
            </dl>
          </DashboardCardShell>

          <DashboardCardShell title="System suggestion">
            <dl className="space-y-2">
              <DetailRow
                label="Base Suggested Level"
                value={displayValue(data.baseSuggestedLevel)}
              />
              <DetailRow
                label="Ranking Override Applied"
                value={displayValue(data.rankingOverrideApplied)}
              />
              <DetailRow
                label="Final Suggested Level"
                value={displayValue(data.finalSuggestedLevel)}
              />
            </dl>
          </DashboardCardShell>

          <DashboardCardShell title="Coach decision">
            <dl className="space-y-2">
              <DetailRow
                label="Current Validated Level"
                value={displayValue(data.validatedLevel)}
              />
              <DetailRow
                label="Validation Status"
                value={displayValue(data.validationStatus)}
              />
            </dl>
          </DashboardCardShell>

          {data.reasons.length > 0 ? (
            <DashboardCardShell title="Reasons">
              <ul className="list-inside list-disc space-y-1 text-sm text-textPrimary">
                {data.reasons.map((r, i) => (
                  <li key={`${i}-${r}`}>{r}</li>
                ))}
              </ul>
            </DashboardCardShell>
          ) : null}

          <DashboardCardShell title="Confirm level">
            <div className="space-y-4">
              <FormField id="validated-level" label="Select Validated Level">
                <Select
                  id="validated-level"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  disabled={saving}
                >
                  <option value="">—</option>
                  {TRAINING_PLAN_VALIDATED_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </Select>
              </FormField>
              <Button
                type="button"
                variant="primary"
                onClick={() => void handleConfirm()}
                disabled={
                  saving || selectedLevel.trim() === "" || !hasConfirmPermission
                }
              >
                {saving ? "Saving…" : "Confirm Level"}
              </Button>
              <p className="text-xs text-textMuted">
                Only Head Coach or authorized planning coach can confirm this level.
              </p>
            </div>
          </DashboardCardShell>
        </>
      ) : !error && !missingPlanningProfile ? (
        <Alert variant="warning">No level validation data available.</Alert>
      ) : null}
    </div>
  );
}
