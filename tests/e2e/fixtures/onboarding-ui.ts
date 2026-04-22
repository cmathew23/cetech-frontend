/**
 * Selectors aligned with `src/app/onboarding/page.tsx` (`Heading` h2/h3 copy and role buttons).
 * Role buttons: `ROLE_OPTIONS.map(r => r.replace("_"," "))` → "ACADEMY ADMIN" for ACADEMY_ADMIN.
 */

export const onboardingRoleButton = {
  athlete: { name: "ATHLETE" },
  coach: { name: "COACH" },
  academyAdmin: { name: "ACADEMY ADMIN" },
} as const;

/** Page chrome title — `Heading variant="h2"` from `onboardingPageTitle()`. */
export const onboardingPageTitle = {
  chooseRole: { level: 2 as const, name: "Choose your role" },
  athleteProfile: { level: 2 as const, name: "Athlete profile" },
  coachProfile: { level: 2 as const, name: "Coach profile" },
  connectAthlete: { level: 2 as const, name: "Connect as an athlete" },
  invitations: { level: 2 as const, name: "Invitations" },
  onboardingComplete: { level: 2 as const, name: "Onboarding complete" },
} as const;

/** Panel section titles — `Heading variant="h3"` inside forms/panels. */
export const onboardingPanel = {
  chooseRole: { level: 3 as const, name: "Choose your role" },
  createAthleteProfile: { level: 3 as const, name: "Create your athlete profile" },
  createCoachProfile: { level: 3 as const, name: "Create your coach profile" },
  howConnect: { level: 3 as const, name: "How do you want to connect?" },
} as const;

export const onboardingForbidden = {
  createAcademy: { name: "Create your academy" },
  createCoachingGroup: { name: "Create your coaching group" },
} as const;

/** Matches `Alert variant="danger"` copy for inconsistent admin profile (`OnboardingInner`). */
export const onboardingInvalidAlert = {
  inconsistentAdminProfile:
    /Inconsistent onboarding state: academy administrators should complete onboarding without a profile step/,
  entityNotAthlete:
    /Inconsistent onboarding state: entity action is now athlete-only/,
} as const;

export const coachProfileForm = {
  submitButton: { name: "Create coach profile" },
} as const;
