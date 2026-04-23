"use client";

const COACH_ONBOARDING_HARD_EXIT_KEY = "peakflow-coach-onboarding-hard-exit";

export function hasCoachOnboardingHardExit(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(COACH_ONBOARDING_HARD_EXIT_KEY) === "1";
}

export function markCoachOnboardingHardExit(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(COACH_ONBOARDING_HARD_EXIT_KEY, "1");
}

export function clearCoachOnboardingHardExit(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(COACH_ONBOARDING_HARD_EXIT_KEY);
}
