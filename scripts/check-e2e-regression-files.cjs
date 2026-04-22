/**
 * Fails fast if regression specs are missing from tests/e2e (plain CJS — no ESM loader issues).
 */
const fs = require("fs");
const path = require("path");

const e2eDir = path.join(__dirname, "..", "tests", "e2e");
const required = [
  "fresh-coach-dashboard-logout.spec.ts",
  "athlete-onboarding.spec.ts",
  "athlete-waiting-logout.spec.ts",
  "athlete-invitation-inbox.spec.ts",
  "athlete-login-state.spec.ts",
];

const missing = required.filter((name) => !fs.existsSync(path.join(e2eDir, name)));
if (missing.length > 0) {
  console.error(
    "Missing E2E files under tests/e2e/ (Playwright can only run what exists on disk):\n" +
      missing.map((m) => `  - ${m}`).join("\n") +
      "\nPull/merge the branch that adds them, or copy from your machine where they exist.",
  );
  process.exit(1);
}
