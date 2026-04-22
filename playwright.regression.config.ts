import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001";

/** Explicit globs (relative to testDir) — more reliable than RegExp on some paths. */
const REGRESSION_GLOBS = [
  "**/fresh-coach-dashboard-logout.spec.ts",
  "**/athlete-onboarding.spec.ts",
  "**/athlete-waiting-logout.spec.ts",
  "**/athlete-invitation-inbox.spec.ts",
  "**/athlete-login-state.spec.ts",
] as const;

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: [...REGRESSION_GLOBS],
  timeout: 120_000,
  retries: 1,
  workers: process.env.PLAYWRIGHT_WORKERS
    ? Number.parseInt(process.env.PLAYWRIGHT_WORKERS, 10)
    : undefined,
  respectGitIgnore: false,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
});
