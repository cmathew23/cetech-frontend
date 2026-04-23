"use client";

import type { RegistrationRole } from "@/types/auth.types";
import type {
  NextStepEnum,
  OnboardingStatusEnum,
} from "@/types/onboarding.types";
import {
  createAthleteProfile,
  createCoachProfile,
  getOnboardingStatus,
  selectRole as selectOnboardingRole,
  submitAcademySetup as postAcademySetup,
  type AthleteProfilePayload,
  type CoachProfilePayload,
  type AcademySetupPayload,
} from "@/lib/api/onboarding";
import {
  parseOnboardingPayload,
  type ParsedOnboardingStatus,
} from "@/lib/onboarding-status";
import {
  isNormalizedApiError,
  type NormalizedApiError,
} from "@/lib/apiClient";
import { useCallback, useEffect, useRef, useState } from "react";

type NextRoute =
  | "/onboarding"
  | "/onboarding/role"
  | "/onboarding/profile"
  | "/onboarding/entity"
  | "/dashboard";

function toNormalizedError(e: unknown): NormalizedApiError {
  if (isNormalizedApiError(e)) return e;
  return {
    message: e instanceof Error ? e.message : "Onboarding error",
    status: 0,
  };
}

function routeFromNextStep(nextStep: NextStepEnum | null): NextRoute | null {
  switch (nextStep) {
    case "SELECT_ROLE":
      return "/onboarding/role";
    case "COMPLETE_PROFILE":
      return "/onboarding/profile";
    case "CREATE_OR_JOIN_ENTITY":
      return "/onboarding/entity";
    case "SHOW_INVITES":
      return "/onboarding";
    case "WAIT_FOR_INVITE":
      return "/onboarding";
    case "COMPLETE_ACADEMY_SETUP":
      return "/onboarding";
    case "GO_TO_DASHBOARD":
      return "/dashboard";
    default:
      return null;
  }
}

export function useOnboarding() {
  /**
   * Scope intentionally limited to onboarding status + role/profile steps.
   * Athlete entity creation and invitation acceptance remain page-level
   * orchestration in onboarding UI because they are tightly coupled to
   * page-specific branching UX.
   */
  const [onboardingData, setOnboardingData] =
    useState<ParsedOnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedApiError | null>(null);
  const hasFetched = useRef(false);

  const onboardingStatus: OnboardingStatusEnum | null =
    onboardingData?.onboardingStatus ?? null;
  const nextStep: NextStepEnum | null = onboardingData?.nextStep ?? null;

  const fetchStatus = useCallback(
    async (opts?: { silent?: boolean }) => {
      const showLoading = !opts?.silent;
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      try {
        const raw = await getOnboardingStatus();
        const parsed = parseOnboardingPayload(raw);
        setOnboardingData(parsed);
        return parsed;
      } catch (e) {
        const normalized = toNormalizedError(e);
        setError(normalized);
        throw normalized;
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const selectRole = useCallback(
    async (role: RegistrationRole) => {
      setLoading(true);
      setError(null);
      try {
        await selectOnboardingRole(role);
        return await fetchStatus();
      } catch (e) {
        const normalized = toNormalizedError(e);
        setError(normalized);
        throw normalized;
      } finally {
        setLoading(false);
      }
    },
    [fetchStatus],
  );

  const submitAthleteProfile = useCallback(
    async (payload: AthleteProfilePayload) => {
      setLoading(true);
      setError(null);
      try {
        await createAthleteProfile(payload);
        return await fetchStatus();
      } catch (e) {
        const normalized = toNormalizedError(e);
        setError(normalized);
        throw normalized;
      } finally {
        setLoading(false);
      }
    },
    [fetchStatus],
  );

  const submitCoachProfile = useCallback(
    async (payload: CoachProfilePayload = {}) => {
      setLoading(true);
      setError(null);
      try {
        await createCoachProfile(payload);
        return await fetchStatus();
      } catch (e) {
        const normalized = toNormalizedError(e);
        setError(normalized);
        throw normalized;
      } finally {
        setLoading(false);
      }
    },
    [fetchStatus],
  );

  const submitAcademySetup = useCallback(
    async (payload: AcademySetupPayload) => {
      setLoading(true);
      setError(null);
      try {
        await postAcademySetup(payload);
        return await fetchStatus();
      } catch (e) {
        const normalized = toNormalizedError(e);
        setError(normalized);
        throw normalized;
      } finally {
        setLoading(false);
      }
    },
    [fetchStatus],
  );

  const getNextRoute = useCallback(() => routeFromNextStep(nextStep), [nextStep]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    void fetchStatus();
  }, [fetchStatus]);

  return {
    onboardingData,
    onboardingStatus,
    nextStep,
    loading,
    error,
    fetchStatus,
    selectRole,
    submitAthleteProfile,
    submitCoachProfile,
    submitAcademySetup,
    getNextRoute,
  };
}
