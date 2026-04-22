"use client";

import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchCoachAthletePlanningProfile,
  type CoachAthletePlanningProfileView as CoachAthletePlanningProfileData,
} from "@/lib/api/coachAthletePlanningProfile";
import { isNormalizedApiError } from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function formatApiError(e: unknown, fallback: string): string {
  if (isNormalizedApiError(e)) {
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
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined) return "—";
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
  const athleteIdTrimmed = athleteId.trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<CoachAthletePlanningProfileData | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!accessGateReady) {
        setLoading(true);
        return;
      }
      if (entityId === "" || athleteIdTrimmed === "") {
        setProfile(null);
        setError("Missing training entity or athlete identifier.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await fetchCoachAthletePlanningProfile(entityId, athleteIdTrimmed);
        if (cancelled) return;
        setProfile(data);
      } catch (e) {
        if (cancelled) return;
        setProfile(null);
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
        <Button
          type="button"
          variant="neutral"
          onClick={() => router.push("/coach/dashboard")}
        >
          Back to Dashboard
        </Button>
      </header>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      {!error && !profile ? (
        <Alert variant="warning">No planning profile data available.</Alert>
      ) : null}

      {profile ? (
        <>
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
                label="Training Age (years)"
                value={displayValue(profile.trainingAgeYears)}
              />
              <DetailRow
                label="Weekly Training Exposure (hours)"
                value={displayValue(profile.currentWeeklyTrainingExposureHours)}
              />
              <DetailRow
                label="Weekly Availability (days)"
                value={displayValue(profile.weeklyAvailabilityDays)}
              />
              <DetailRow
                label="Weekly Availability (hours)"
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
                value={displayValue(profile.hasWearable)}
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
        </>
      ) : null}
    </div>
  );
}
