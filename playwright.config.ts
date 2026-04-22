import { defineConfig } from "@playwright/test";

/**
 * Frontend base for E2E: Next dev uses port 3001 (`npm run dev`).
 * Port 3000 in this repo is typically the API — do not use it as baseURL here.
 * Override: PLAYWRIGHT_BASE_URL=https://your-preview.example
 *
 * Backend auth rate limits: relaxed automatically when the API runs with NODE_ENV=development
 * (see README “Development Auth Rate Limiting”). Optional API bypass for local only:
 * RATE_LIMIT_MODE=off or RATE_LIMIT_DISABLED=true — never use in production.
 *
 * Targeted regression bundle: `npm run test:e2e:regression` (uses playwright.regression.config.ts).
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  retries: 1,
  /** Optional: PLAYWRIGHT_WORKERS=1 to limit parallel browsers (e.g. slow machine or strict staging API). */
  workers: process.env.PLAYWRIGHT_WORKERS
    ? Number.parseInt(process.env.PLAYWRIGHT_WORKERS, 10)
    : undefined,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
});
