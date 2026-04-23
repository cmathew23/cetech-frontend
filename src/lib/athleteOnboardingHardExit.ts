"use client";

const ATHLETE_ONBOARDING_HARD_EXIT_KEY =
  "peakflow-athlete-onboarding-hard-exit";

export function hasAthleteOnboardingHardExit(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(ATHLETE_ONBOARDING_HARD_EXIT_KEY) === "1";
}

export function markAthleteOnboardingHardExit(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ATHLETE_ONBOARDING_HARD_EXIT_KEY, "1");
}

export function clearAthleteOnboardingHardExit(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ATHLETE_ONBOARDING_HARD_EXIT_KEY);
}
