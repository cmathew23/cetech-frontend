# SRS Notes

**Repository setup, dev server, E2E tests, sandbox, and testing notes:** see the root [`README.md`](../../README.md).

**Coach planning workspace UI (user flows only):** [`docs/ui/COACH_PLANNING_FLOW.md`](../ui/COACH_PLANNING_FLOW.md), [`docs/ui/SNC_UI.md`](../ui/SNC_UI.md), [`docs/ui/GOALS_UI.md`](../ui/GOALS_UI.md).

Latest milestone: **Workflow stabilization** completed and documented (generation ownership, planning context lock, Head Coach / no-Head-Coach paths). See **`docs/srs/IMPLEMENTATION_STATUS.md`** (*Workflow Stabilization Completed*). Prior milestone: App Context + Assignment Pipeline Stabilization. **Athlete Planning Profile** and coach training-plan workspace remain documented in **`docs/srs/IMPLEMENTATION_STATUS.md`**.

## Current workflow validation status

| # | Scenario | Status |
|---|----------|--------|
| 1 | Head Coach no function + Skills / Nutrition / S&C (Taylor Golf Academy, athlete501) | **Passed** |
| 2 | Head Coach with Skills + Nutrition / S&C (Howard Golf Academy, athlete601) | **Passed** |
| 3 | Head Coach with Skills + separate Skills Coach + Nutrition / S&C (Howard Golf Academy, athlete604) | **Passed** |
| 4 | No Head Coach + Skills / Nutrition / S&C (Harding Golf Academy, athlete701) | **Passed** |
| 5 | No Head Coach + second Skills Coach path (Harding Golf Academy, athlete702) | **Passed** |

Detail per academy, athlete, and coach accounts: **`docs/srs/IMPLEMENTATION_STATUS.md`** (*Verified workflow matrix*).

**Testing note:** Current workflow phase is **complete enough to stop workflow testing** unless new changes touch workflow logic.

## Current next priority

**Next major task:** **DB history / versioning audit**

**Reason:**

- Current data overwrite risk prevents reliable past-vs-current comparison.
- Dashboard, metrics, adherence, and longitudinal analytics should **not** proceed until history/versioning is audited.

**Recommended first step:** Inspect/report only — **no code**, **no migration** (see `docs/srs/DB_SAFETY_RULES.md`, `docs/srs/phase-2-gaps.md` §13).

## Testing note (workflow slice)

**Backend verified commands:**

```bash
TMPDIR=/tmp TEMP=/tmp TMP=/tmp npm run test:raw -- tests/aiGenerationOrchestrator --runInBand
TMPDIR=/tmp TEMP=/tmp TMP=/tmp npm run test:raw -- tests/trainingPlanManagement/trainingPlanWorkflowRelease.api.test.js --runInBand
TMPDIR=/tmp TEMP=/tmp TMP=/tmp npm run test:raw -- tests/trainingPlanGeneration --runInBand
```

**Frontend verified command:**

```bash
npx vitest run src/lib/coachTrainingPlanActions.test.ts
```

Targeted ESLint was run on touched workflow files before commit. Global lint may still report unrelated pre-existing issues outside the workflow slice.

### Environment note (Prisma CLI / test bootstrap)

For Prisma CLI or test bootstrap, `PRISMA_DATABASE_URL` may need to be exported from `DIRECT_DATABASE_URL`:

```bash
export PRISMA_DATABASE_URL="$(grep '^DIRECT_DATABASE_URL=' .env.local .env 2>/dev/null | head -n 1 | cut -d= -f2- | tr -d '\"')"
```

**Keep secrets out of logs.**

## Academy admin, onboarding, and gaps (source of truth)

- **`docs/srs/IMPLEMENTATION_STATUS.md`** — System state including athlete + coach **Athlete Planning Profile** routes, APIs, coach **training plan draft** UI on planning profile, and deferred items (confirm/readiness UI on athlete APP)
- **`docs/srs/03-ux/onboarding.md`** — Academy admin onboarding flow, access-context routing rules, invitation-aware behavior, deprecated shortcuts, failure UX, multi-role note  
- **`docs/srs/03-ux/admin-dashboard.md`** — Admin dashboard gating, admin route behavior, known admin UI issues  
- **`docs/srs/phase-2-gaps.md`** — Open issues (e.g. coach invitation visibility), access-context `null` risk, verification notes; **§9** Athlete Planning Profile remainder  

Legacy one-line routing notes in older files are superseded by these documents.

---

## APP (Athlete Profile Planning) - Current State

- **Contract shape:** frontend is aligned to grouped APP contract (`athleteContext`, `sportContext`, `sportPerformance`, `trainingExposure`, `healthStatus`, `nutritionContext`, `wearables`, `derivedPlanningInputs`, `bloodReportParameters`, `bodyCompositionParameters`).
- **Editable vs read-only:**
  - Editable: Stage 1 input groups (athlete/sport/performance/training/health/nutrition) plus optional Stage 2 groups.
  - Read-only: `validatedLevel` and derived status fields (`planningEligibilityStatus`, `planningInputCompleteness`, `missingRequiredFields`).
  - Wearables (MVP): fixed UI state `Wearable Status: No`.
- **Save behavior:** grouped create/PATCH is wired; PATCH remains changed-fields-only (partial-safe, no full record overwrite).
- **Stage summary:**
  - Stage 1 = active input capture used by current APP workflow.
  - Stage 2 = Blood + Body Composition shown as optional/non-blocking inputs (present, not enforced).
- **Nutrition note:** `regionalCuisinePreference` is implemented as multi-select `string[]`, persisted and rehydrated from backend.

---

## Auth Flow (Frontend)

### Routes

- `/login`
- `/forgot-password`
- `/reset-password?token=...`

### Forgot Password

- **UI**
  - Email input
  - `Send reset link`
- **API**
  - `POST /auth/forgot-password`
  - Body: `{ email }`
- **Behavior**
  - Always shows: `If an account exists, a reset link has been sent`
  - No email existence exposure
- **States**
  - Success
  - Validation error
  - Rate limit
  - Server error

### Reset Password

- **UI**
  - New password
  - Confirm password
- **Token**
  - Read from query param (`?token=...`)
- **API**
  - `POST /auth/reset-password`
  - Body: `{ token, newPassword }`
- **States**
  - Missing token
  - Invalid/expired token
  - Validation error
  - Success
- **Success**
  - Shows confirmation
  - Redirects to `/login`

### Design Constraint

- Must reuse existing `AuthLayout`
- No UI redesign; same style as login/register

### Integration Rules

- No auth header required
- Use existing `apiClient`
- Use `omitAuth: true`

### Important Notes

- Token comes from URL query param, not local client storage
- No pre-validation API exists for reset token
- Backend does not expose token expiry
- Invalid/expired token handling is performed by reset flow states
