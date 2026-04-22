"use client";

import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { fetchAthleteMeProfile, type AthleteMeProfile } from "@/lib/api/athleteMe";
import {
  fetchAthletePlanningProfileMe,
  formatDateOfBirthForUi,
  type AthletePlanningProfileRecord,
} from "@/lib/api/athletePlanningProfile";
import { fetchMyProfile, type ProfileMe } from "@/lib/api/profile";
import { isNormalizedApiError } from "@/lib/apiClient";
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

function displayText(value: string | null | undefined): string {
  if (!value) return "Not available yet";
  const text = value.trim();
  return text === "" ? "Not available yet" : text;
}

function displayNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Not available yet";
  }
  return String(value);
}

function displayBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "Not available yet";
  return value ? "Yes" : "No";
}

function displayDob(value: string | null | undefined): string {
  if (!value) return "Not available yet";
  const formatted = formatDateOfBirthForUi(value);
  return formatted.trim() === "" ? "Not available yet" : formatted;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="text-xs font-medium text-textMuted sm:w-56 sm:shrink-0">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm text-textPrimary">{value}</dd>
    </div>
  );
}

export function AthleteSettingsPageContent() {
  const { user, roles, accessContext, accessGateReady } = useAuth();
  const { onboardingStatus, nextStep, loading: onboardingLoading, error: onboardingError } =
    useOnboarding();

  const entityId = useMemo(
    () => accessContext?.academy.trainingEntityId?.trim() ?? "",
    [accessContext],
  );

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [athleteProfile, setAthleteProfile] = useState<AthleteMeProfile | null>(null);
  const [planningProfile, setPlanningProfile] = useState<AthletePlanningProfileRecord | null>(
    null,
  );
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!accessGateReady) {
        if (!cancelled) setLoading(true);
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setLoadError(null);
      }

      const requests: [
        Promise<ProfileMe>,
        Promise<AthleteMeProfile>,
        Promise<Awaited<ReturnType<typeof fetchAthletePlanningProfileMe>> | null>,
      ] = [
        fetchMyProfile(),
        fetchAthleteMeProfile(),
        entityId !== "" ? fetchAthletePlanningProfileMe(entityId) : Promise.resolve(null),
      ];

      const [profileResult, athleteResult, planningResult] =
        await Promise.allSettled(requests);
      if (cancelled) return;

      const errors: string[] = [];

      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value);
      } else {
        setProfile(null);
        errors.push(
          formatApiError(profileResult.reason, "Could not load account profile data."),
        );
      }

      if (athleteResult.status === "fulfilled") {
        setAthleteProfile(athleteResult.value);
      } else {
        setAthleteProfile(null);
        errors.push(
          formatApiError(athleteResult.reason, "Could not load athlete registration data."),
        );
      }

      if (planningResult.status === "fulfilled") {
        const value = planningResult.value;
        if (value?.kind === "found") {
          setPlanningProfile(value.record);
        } else {
          setPlanningProfile(null);
        }
      } else {
        setPlanningProfile(null);
        errors.push(
          formatApiError(
            planningResult.reason,
            "Could not load athlete planning profile data.",
          ),
        );
      }

      if (errors.length > 0) {
        setLoadError(errors.join(" "));
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessGateReady, entityId, reloadCounter]);

  const fullName = useMemo(() => {
    if (!profile) return "";
    return `${profile.firstName} ${profile.lastName}`.trim();
  }, [profile]);

  const sport = athleteProfile?.sport || planningProfile?.primarySport || "";
  const athleteLevel = athleteProfile?.level || planningProfile?.selfReportedLevel || "";

  if (loading || (accessGateReady && onboardingLoading)) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-textSecondary">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loadError ? <Alert variant="danger">{loadError}</Alert> : null}
      {onboardingError ? (
        <Alert variant="warning">
          {formatApiError(onboardingError, "Could not load onboarding status.")}
        </Alert>
      ) : null}

      <DashboardCardShell title="Account / Identity">
        <dl className="space-y-2">
          <DetailRow label="User ID" value={displayText(user?.id)} />
          <DetailRow
            label="Roles"
            value={roles.length > 0 ? roles.join(", ") : "Not available yet"}
          />
          <DetailRow label="Email" value={displayText(profile?.email)} />
        </dl>
      </DashboardCardShell>

      <DashboardCardShell title="Athlete Context">
        <dl className="space-y-2">
          <DetailRow
            label="Training Entity ID"
            value={displayText(accessContext?.academy.trainingEntityId)}
          />
          <DetailRow
            label="Training Entity Name"
            value={displayText(accessContext?.academy.trainingEntityName)}
          />
          <DetailRow
            label="Onboarding Status"
            value={displayText(onboardingStatus ?? undefined)}
          />
          <DetailRow label="Next Step" value={displayText(nextStep ?? undefined)} />
        </dl>
      </DashboardCardShell>

      <DashboardCardShell title="Registration / Profile Data">
        <dl className="space-y-2">
          <DetailRow label="Name" value={displayText(fullName)} />
          <DetailRow label="Date of Birth" value={displayDob(planningProfile?.dateOfBirth)} />
          <DetailRow label="Age" value={displayNumber(planningProfile?.derivedAge)} />
          <DetailRow label="Sex" value={displayText(planningProfile?.sex)} />
          <DetailRow label="Sport" value={displayText(sport)} />
          <DetailRow label="Reported Athlete Level" value={displayText(athleteLevel)} />
          <DetailRow
            label="Coach Validated Level"
            value={displayText(planningProfile?.validatedLevel)}
          />
          <p className="pl-0 text-xs text-textMuted sm:pl-[14.75rem]">
            Used for training plan readiness and workload assessment
          </p>
          <DetailRow
            label="Has Wearable"
            value={displayBoolean(planningProfile?.hasWearable)}
          />
        </dl>
      </DashboardCardShell>

      <div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setReloadCounter((value) => value + 1)}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}
