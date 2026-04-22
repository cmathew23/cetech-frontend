/**
 * Integration E2E (no API mocks) expects the backend to return the stated onboarding state
 * for each credential. If a test fails, fix seed data or set env vars — do not relax assertions.
 *
 * State-to-test matrix (see also `ONBOARDING_E2E_MATRIX` below):
 *
 * | Scenario | Seed user (default) | Expected GET /onboarding/status | Post-login route | Direct /onboarding |
 * |----------|---------------------|--------------------------------|------------------|-------------------|
 * | COMPLETE admin | E2E_SEED_ADMIN_COMPLETE_* | COMPLETE, ACADEMY_ADMIN | /admin/dashboard | → redirect /admin/dashboard |
 * | ROLE_SELECTION admin | Use mocked spec — no deterministic seed in repo | — | — | — |
 * | PROFILE_REQUIRED admin (invalid) | Mocked only | PROFILE_REQUIRED, ACADEMY_ADMIN | — | alert only |
 * | ENTITY_ACTION admin (invalid) | Mocked only | ENTITY_ACTION, ACADEMY_ADMIN | — | alert only |
 * | COMPLETE coach | E2E_SEED_COACH_COMPLETE_* | COMPLETE, COACH | /coach/dashboard | → /coach/dashboard |
 * | ROLE_SELECTION coach | Mocked | — | — | — |
 * | COMPLETE athlete | E2E_SEED_ATHLETE_COMPLETE_* | COMPLETE, ATHLETE | /athlete/dashboard | → /athlete/dashboard |
 * | ROLE_SELECTION athlete | Mocked | — | — | — |
 */

export const ONBOARDING_E2E_MATRIX = [
  {
    scenario: "COMPLETE admin",
    seedUserEnv: "E2E_SEED_ADMIN_COMPLETE_EMAIL / PASSWORD",
    defaultEmail: "adminx1@example.com",
    expectedOnboardingStatus: "COMPLETE",
    expectedActiveRole: "ACADEMY_ADMIN",
    expectedPostLoginRoute: "/admin/dashboard",
    directOnboardingRoute: "replace → /admin/dashboard",
    visiblePanel: "Academy Admin Dashboard (not onboarding UI)",
    forbiddenElements: "Choose your role panel, Create your academy on /onboarding",
    specFile: "onboarding/integration.spec.ts",
  },
  {
    scenario: "ROLE_SELECTION_REQUIRED admin",
    seedUserEnv: "(none — use mocked GET /onboarding/status)",
    defaultEmail: "—",
    expectedOnboardingStatus: "ROLE_SELECTION_REQUIRED",
    expectedActiveRole: null,
    expectedPostLoginRoute: "/onboarding",
    directOnboardingRoute: "/onboarding",
    visiblePanel: "h2 Choose your role + role buttons incl. ACADEMY ADMIN",
    forbiddenElements: "Create your academy",
    specFile: "onboarding/onboarding.mocked-states.spec.ts",
  },
  {
    scenario: "PROFILE_REQUIRED admin (invalid UI)",
    seedUserEnv: "mock only",
    defaultEmail: "—",
    expectedOnboardingStatus: "PROFILE_REQUIRED",
    expectedActiveRole: "ACADEMY_ADMIN",
    expectedPostLoginRoute: "/onboarding",
    directOnboardingRoute: "/onboarding",
    visiblePanel: "danger alert inconsistent admin profile",
    forbiddenElements: "profile form for admin",
    specFile: "onboarding/onboarding.mocked-states.spec.ts",
  },
  {
    scenario: "ENTITY_ACTION_REQUIRED admin (invalid UI)",
    seedUserEnv: "mock only",
    defaultEmail: "—",
    expectedOnboardingStatus: "ENTITY_ACTION_REQUIRED",
    expectedActiveRole: "ACADEMY_ADMIN",
    expectedPostLoginRoute: "/onboarding",
    directOnboardingRoute: "/onboarding",
    visiblePanel: "danger alert entity athlete-only",
    forbiddenElements: "athlete entity panel",
    specFile: "onboarding/onboarding.mocked-states.spec.ts",
  },
  {
    scenario: "COMPLETE coach",
    seedUserEnv: "E2E_SEED_COACH_COMPLETE_EMAIL / PASSWORD",
    defaultEmail: "john1@test.com",
    expectedOnboardingStatus: "COMPLETE",
    expectedActiveRole: "COACH",
    expectedPostLoginRoute: "/coach/dashboard",
    directOnboardingRoute: "replace → /coach/dashboard",
    visiblePanel: "Coach Dashboard",
    forbiddenElements: "Create your coaching group on /onboarding",
    specFile: "onboarding/integration.spec.ts",
  },
  {
    scenario: "ROLE_SELECTION_REQUIRED coach",
    seedUserEnv: "mock only",
    defaultEmail: "—",
    expectedOnboardingStatus: "ROLE_SELECTION_REQUIRED",
    expectedActiveRole: null,
    expectedPostLoginRoute: "/onboarding",
    directOnboardingRoute: "/onboarding",
    visiblePanel: "Choose your role + COACH button",
    forbiddenElements: "Create your coaching group",
    specFile: "onboarding/onboarding.mocked-states.spec.ts",
  },
  {
    scenario: "COMPLETE athlete",
    seedUserEnv: "E2E_SEED_ATHLETE_COMPLETE_EMAIL / PASSWORD",
    defaultEmail: "athletex3@test.com",
    expectedOnboardingStatus: "COMPLETE",
    expectedActiveRole: "ATHLETE",
    expectedPostLoginRoute: "/athlete/dashboard",
    directOnboardingRoute: "replace → /athlete/dashboard",
    visiblePanel: "Athlete Dashboard",
    forbiddenElements: "—",
    specFile: "onboarding/integration.spec.ts",
  },
  {
    scenario: "ROLE_SELECTION_REQUIRED athlete",
    seedUserEnv: "mock only",
    defaultEmail: "—",
    expectedOnboardingStatus: "ROLE_SELECTION_REQUIRED",
    expectedActiveRole: null,
    expectedPostLoginRoute: "/onboarding",
    directOnboardingRoute: "/onboarding",
    visiblePanel: "Choose your role + ATHLETE button",
    forbiddenElements: "—",
    specFile: "onboarding/onboarding.mocked-states.spec.ts",
  },
] as const;

/** Credentials for integration tests — backend must match `requiredOnboardingStatus` / `requiredActiveOnboardingRole`. */
export const integrationSeeds = {
  adminComplete: {
    email:
      process.env.E2E_SEED_ADMIN_COMPLETE_EMAIL ?? "adminx1@example.com",
    password:
      process.env.E2E_SEED_ADMIN_COMPLETE_PASSWORD ?? "ABCD4321",
    requiredOnboardingStatus: "COMPLETE" as const,
    requiredActiveOnboardingRole: "ACADEMY_ADMIN" as const,
    expectedPostLoginPath: "/admin/dashboard" as const,
  },
  coachComplete: {
    email: process.env.E2E_SEED_COACH_COMPLETE_EMAIL ?? "john1@test.com",
    password: process.env.E2E_SEED_COACH_COMPLETE_PASSWORD ?? "ABCD4321",
    requiredOnboardingStatus: "COMPLETE" as const,
    requiredActiveOnboardingRole: "COACH" as const,
    expectedPostLoginPath: "/coach/dashboard" as const,
  },
  athleteComplete: {
    email:
      process.env.E2E_SEED_ATHLETE_COMPLETE_EMAIL ?? "athletex3@test.com",
    password:
      process.env.E2E_SEED_ATHLETE_COMPLETE_PASSWORD ?? "ABCD4321",
    requiredOnboardingStatus: "COMPLETE" as const,
    requiredActiveOnboardingRole: "ATHLETE" as const,
    expectedPostLoginPath: "/athlete/dashboard" as const,
  },
} as const;
